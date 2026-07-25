#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputRoot = 'artifacts/yesenin-pravda-eastview-featured-target';
const rawRoot = join(outputRoot, 'raw');
const sourceFeaturedUrl = 'https://on-demand.eastview.com/ondemand-featured/featured-issues?titleId=9305';
const targetUrl = 'https://on-demand.eastview.com/ondemand-featured/featured-articles?issueId=967207';
const exactAnchorText = 'November 09, 1921, No. 252';
const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/148.0 Safari/537.36 TheLegendaryPoet-EastView-Target/1.0';
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function decodeEntities(value) {
  return value
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function visibleText(html) {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<\/(?:p|div|li|tr|td|th|h[1-6]|article|section|form|option)>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const normalize = (value) => value.replace(/\s+/g, ' ').trim();

function absoluteEastViewUrl(rawUrl, baseUrl) {
  try {
    const url = new URL(decodeEntities(rawUrl).replace(/\\\//g, '/').replace(/\\u0026/g, '&'), baseUrl);
    const host = url.hostname.toLowerCase();
    return host === 'eastview.com' || host.endsWith('.eastview.com') ? url.toString() : null;
  } catch {
    return null;
  }
}

function extractAnchors(html, baseUrl) {
  const anchors = [];
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const url = absoluteEastViewUrl(match[1], baseUrl);
    if (!url) continue;
    const text = normalize(visibleText(match[2]));
    const index = match.index ?? 0;
    const context = normalize(visibleText(html.slice(Math.max(0, index - 700), Math.min(html.length, index + match[0].length + 1_000))));
    anchors.push({
      url,
      text,
      context,
      contextSha256: sha256(Buffer.from(context, 'utf8')),
    });
  }
  return anchors;
}

function extractScripts(html, baseUrl) {
  const scripts = [];
  for (const match of html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
    const url = absoluteEastViewUrl(match[1], baseUrl);
    if (url) scripts.push(url);
  }
  return [...new Set(scripts)];
}

function classify(bytes, contentType, text) {
  const magic = bytes.subarray(0, 16).toString('latin1');
  const lower = contentType.toLowerCase();
  if (magic.startsWith('%PDF-') || lower.includes('application/pdf')) return 'pdf';
  if (lower.startsWith('image/') || magic.startsWith('\xFF\xD8')) return 'image';
  if (lower.includes('json') || /^[\s\uFEFF]*[\[{]/u.test(text)) return 'json';
  if (lower.includes('javascript')) return 'javascript';
  if (lower.includes('html') || /<html\b/iu.test(text)) return 'html';
  return 'binary-or-text';
}

class Session {
  cookies = new Map();

  absorb(headers) {
    const values = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : [headers.get('set-cookie')].filter(Boolean);
    for (const value of values) {
      for (const raw of String(value).split(/,(?=[^;,]+=)/u)) {
        const pair = raw.split(';', 1)[0];
        const separator = pair.indexOf('=');
        if (separator > 0) this.cookies.set(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim());
      }
    }
  }

  async fetch(url, referer) {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent': userAgent,
        accept: 'text/html,application/xhtml+xml,application/json,application/javascript,text/javascript,application/pdf,image/avif,image/webp,*/*;q=0.2',
        'accept-language': 'en-US,en;q=0.9,ru;q=0.7',
        referer,
        ...(this.cookies.size ? { cookie: [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ') } : {}),
      },
      signal: AbortSignal.timeout(120_000),
    });
    this.absorb(response.headers);
    const bytes = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || '';
    const text = new TextDecoder('utf-8').decode(bytes);
    return {
      requestedUrl: url,
      finalUrl: response.url,
      status: response.status,
      contentType,
      bytes,
      text,
      cookieNames: [...this.cookies.keys()].sort(),
    };
  }
}

async function preserveResponse(response, label) {
  const classification = classify(response.bytes, response.contentType, response.text);
  const extension = classification === 'html' ? 'html' : classification === 'json' ? 'json' : classification === 'javascript' ? 'js' : classification === 'pdf' ? 'pdf' : classification === 'image' ? 'bin' : 'bin';
  const rawFile = join(rawRoot, `${label}.${extension}`);
  await writeFile(rawFile, response.bytes);
  const text = classification === 'html' ? visibleText(response.text) : normalize(response.text);
  return {
    requestedUrl: response.requestedUrl,
    finalUrl: response.finalUrl,
    status: response.status,
    contentType: response.contentType,
    classification,
    bytes: response.bytes.length,
    sha256: sha256(response.bytes),
    visibleTextBytes: Buffer.byteLength(text),
    visibleTextSha256: sha256(Buffer.from(text, 'utf8')),
    cookieNames: response.cookieNames,
    rawFile: rawFile.replace(`${outputRoot}/`, ''),
    text,
  };
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(rawRoot, { recursive: true });

const session = new Session();
const source = await preserveResponse(await session.fetch(sourceFeaturedUrl, 'https://on-demand.eastview.com/browse/udb/870'), 'source-featured-issues');
const sourceAnchors = extractAnchors(source.text, source.finalUrl);
const literalTargetAnchors = sourceAnchors.filter((anchor) => anchor.url === targetUrl && anchor.text === exactAnchorText);

const target = await preserveResponse(await session.fetch(targetUrl, sourceFeaturedUrl), 'target-featured-articles');
const targetAnchors = extractAnchors(target.text, target.finalUrl);
const targetScripts = extractScripts(target.text, target.finalUrl);
const literalDownstreamLinks = targetAnchors.filter((anchor) => {
  const pathname = new URL(anchor.url).pathname;
  return /\/(?:browse|ondemand-featured|download|article|doc|page|issue)\b/iu.test(pathname);
});

const preservedDownstream = [];
for (let index = 0; index < Math.min(literalDownstreamLinks.length, 40); index += 1) {
  const link = literalDownstreamLinks[index];
  try {
    const response = await preserveResponse(await session.fetch(link.url, targetUrl), `downstream-${String(index + 1).padStart(2, '0')}`);
    preservedDownstream.push({
      sourceText: link.text,
      sourceContextSha256: link.contextSha256,
      ...response,
      targetDatePresent: /November\s+0?9,\s*1921|1921-11-09/iu.test(response.text),
      targetIssuePresent: /(?:No\.?|№|issue)\s*252(?!\d)/iu.test(response.text),
      pdfOrImageBytes: response.classification === 'pdf' || response.classification === 'image',
    });
  } catch (error) {
    preservedDownstream.push({
      sourceText: link.text,
      sourceContextSha256: link.contextSha256,
      requestedUrl: link.url,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const targetText = normalize(target.text);
const manifest = {
  schema: 'yesenin-pravda-eastview-featured-target/v1',
  generatedAt: new Date().toISOString(),
  authority: 'East View Information Services',
  archive: {
    udbId: '870',
    titleId: '9305',
    publication: 'Pravda',
  },
  target: {
    date: '1921-11-09',
    dateLabel: 'November 09, 1921',
    issueNumber: '252',
    literalFeaturedIssueId: '967207',
    literalFeaturedUrl: targetUrl,
    sourceAnchorText: exactAnchorText,
  },
  source: {
    ...source,
    text: undefined,
    literalTargetAnchorCount: literalTargetAnchors.length,
    literalTargetAnchors,
  },
  targetResponse: {
    ...target,
    text: undefined,
    exactDatePresent: /November\s+0?9,\s*1921|1921-11-09/iu.test(targetText),
    exactIssuePresent: /(?:No\.?|№|issue)\s*252(?!\d)/iu.test(targetText),
    archiveIdentityPresent: /Pravda|Правда/iu.test(targetText),
    signInPresent: /sign\s*in|log\s*in/iu.test(targetText),
    subscriptionPresent: /subscription|subscribe|Price:\s*Inquire/iu.test(targetText),
    anchorCount: targetAnchors.length,
    scriptCount: targetScripts.length,
    literalDownstreamLinkCount: literalDownstreamLinks.length,
    literalDownstreamLinks,
  },
  preservedDownstream,
  result: {
    literalTargetAnchorVerified: literalTargetAnchors.length === 1,
    targetFeaturedResponseFetched: target.status === 200,
    exactIssueMetadataVerified:
      literalTargetAnchors.length === 1
      && /November\s+0?9,\s*1921|1921-11-09/iu.test(targetText)
      && /(?:No\.?|№|issue)\s*252(?!\d)/iu.test(targetText),
    literalBrowseIssueRouteReturned: literalDownstreamLinks.some((link) => /\/browse\/issue\//u.test(new URL(link.url).pathname)),
    literalDocumentOrPageRouteReturned: literalDownstreamLinks.some((link) => /\/(?:browse\/doc|article|page)\//u.test(new URL(link.url).pathname)),
    facsimileBytesAcquired: preservedDownstream.some((item) => item.pdfOrImageBytes === true),
    constructedBrowseIssueId: false,
    constructedDocumentId: false,
    constructedViewerId: false,
    neighboringIdArithmeticUsed: false,
    requestSubmitted: false,
    subscriptionPurchased: false,
    credentialsProvided: false,
    ocrUsed: false,
    syntheticContentUsed: false,
    productionAuthorized: false,
  },
};

await writeFile(join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(
  join(outputRoot, 'SUMMARY.md'),
  [
    '# East View exact featured issue target',
    '',
    `- Literal source anchor verified: \`${manifest.result.literalTargetAnchorVerified}\``,
    `- Target response fetched: \`${manifest.result.targetFeaturedResponseFetched}\``,
    `- Exact metadata verified on target response: \`${manifest.result.exactIssueMetadataVerified}\``,
    `- Literal browse issue route returned: \`${manifest.result.literalBrowseIssueRouteReturned}\``,
    `- Literal document/page route returned: \`${manifest.result.literalDocumentOrPageRouteReturned}\``,
    `- Facsimile bytes acquired: \`${manifest.result.facsimileBytesAcquired}\``,
    '- Constructed IDs / neighbor arithmetic: `false`',
    '- Subscription / credentials / request: `false`',
    '',
  ].join('\n'),
);

console.log(JSON.stringify(manifest, null, 2));
if (!manifest.result.literalTargetAnchorVerified || !manifest.result.targetFeaturedResponseFetched) process.exitCode = 1;
