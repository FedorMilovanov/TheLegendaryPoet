#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputRoot = 'artifacts/yesenin-pravda-eastview-literal-pages';
const rawRoot = join(outputRoot, 'raw');
const issueUrl = 'https://on-demand.eastview.com/ondemand-featured/featured-articles?issueId=967207';
const expectedIssueTitle = 'November 09, 1921, No. 252';
const expectedPageLinks = [
  'https://on-demand.eastview.com/browse/doc/21670570',
  'https://on-demand.eastview.com/browse/doc/21670575',
];
const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/148.0 Safari/537.36 TheLegendaryPoet-EastView-Pages/1.0';
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

function eastViewUrl(rawUrl, baseUrl) {
  try {
    const url = new URL(decodeEntities(rawUrl).replace(/\\\//g, '/').replace(/\\u0026/g, '&'), baseUrl);
    const host = url.hostname.toLowerCase();
    return host === 'eastview.com' || host.endsWith('.eastview.com') ? url.toString() : null;
  } catch {
    return null;
  }
}

function extractLiteralUrls(html, baseUrl) {
  const records = [];
  const push = (kind, raw, text = '') => {
    const url = eastViewUrl(raw, baseUrl);
    if (!url) return;
    records.push({ kind, url, text: normalize(visibleText(text)) });
  };
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) push('anchor', match[1], match[2]);
  for (const match of html.matchAll(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi)) push('image', match[1]);
  for (const match of html.matchAll(/<source\b[^>]*src(?:set)?=["']([^"']+)["'][^>]*>/gi)) push('source', match[1]);
  for (const match of html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi)) push('script', match[1]);
  for (const match of html.matchAll(/(?:href|src|url|downloadUrl|imageUrl|pdfUrl)\s*[:=]\s*["']([^"']+)["']/gi)) push('embedded', match[1]);
  return [...new Map(records.map((record) => [`${record.kind}|${record.url}`, record])).values()];
}

function classify(bytes, contentType, decodedText) {
  const lower = contentType.toLowerCase();
  const magic = bytes.subarray(0, 16).toString('latin1');
  if (magic.startsWith('%PDF-') || lower.includes('application/pdf')) return 'pdf';
  if (lower.startsWith('image/') || magic.startsWith('\xFF\xD8') || magic.startsWith('\x89PNG')) return 'image';
  if (lower.includes('json') || /^[\s\uFEFF]*[\[{]/u.test(decodedText)) return 'json';
  if (lower.includes('javascript')) return 'javascript';
  if (lower.includes('html') || /<html\b/iu.test(decodedText)) return 'html';
  return 'binary-or-text';
}

function historicalMarkers(text) {
  const normalized = normalize(text).toLowerCase();
  return {
    yesenin: /есенин|yesenin/iu.test(normalized),
    duncan: /дункан|duncan/iu.test(normalized),
    isadora: /айседор|isadora/iu.test(normalized),
    dance: /танц|dance/iu.test(normalized),
    school: /школ|school/iu.test(normalized),
    november7: /7\s+ноябр|november\s+0?7|nov\.\s*0?7/iu.test(normalized),
    moscow: /москв|moscow/iu.test(normalized),
  };
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
        accept: 'text/html,application/xhtml+xml,application/json,application/javascript,text/javascript,application/pdf,image/avif,image/webp,image/png,image/jpeg,*/*;q=0.2',
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

async function preserve(response, label) {
  const classification = classify(response.bytes, response.contentType, response.text);
  const extension = classification === 'html' ? 'html' : classification === 'json' ? 'json' : classification === 'javascript' ? 'js' : classification === 'pdf' ? 'pdf' : classification === 'image' ? 'bin' : 'bin';
  const file = join(rawRoot, `${label}.${extension}`);
  await writeFile(file, response.bytes);
  const readable = classification === 'html' ? visibleText(response.text) : normalize(response.text);
  return {
    requestedUrl: response.requestedUrl,
    finalUrl: response.finalUrl,
    status: response.status,
    contentType: response.contentType,
    classification,
    bytes: response.bytes.length,
    sha256: sha256(response.bytes),
    visibleTextBytes: Buffer.byteLength(readable),
    visibleTextSha256: sha256(Buffer.from(readable, 'utf8')),
    cookieNames: response.cookieNames,
    rawFile: file.replace(`${outputRoot}/`, ''),
    rawHtml: response.text,
    readable,
  };
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(rawRoot, { recursive: true });
const session = new Session();

const issue = await preserve(await session.fetch(issueUrl, 'https://on-demand.eastview.com/ondemand-featured/featured-issues?titleId=9305'), 'issue');
const issueLinks = extractLiteralUrls(issue.rawHtml, issue.finalUrl).filter((record) => record.kind === 'anchor');
const exactPageLinks = issueLinks.filter((record) => expectedPageLinks.includes(record.url));

const pages = [];
for (let index = 0; index < expectedPageLinks.length; index += 1) {
  const pageResponse = await preserve(await session.fetch(expectedPageLinks[index], issueUrl), `page-${index + 1}`);
  const literalUrls = extractLiteralUrls(pageResponse.rawHtml, pageResponse.finalUrl);
  const candidateAssets = literalUrls.filter((record) => {
    const url = new URL(record.url);
    return (
      record.kind === 'image'
      || /\.(?:pdf|jpe?g|png|tiff?|webp)(?:$|\?)/iu.test(url.pathname + url.search)
      || /\/(?:download|image|scan|page|pdf|document|doc)\b/iu.test(url.pathname)
    );
  });
  pages.push({
    pageNumber: index + 1,
    sourceLiteralUrl: expectedPageLinks[index],
    response: {
      ...pageResponse,
      rawHtml: undefined,
      readable: undefined,
    },
    titleOrHeadingMatchesIssue: /Pravda|Правда/iu.test(pageResponse.readable),
    cleanTextPresent: pageResponse.readable.length > 300,
    historicalMarkers: historicalMarkers(pageResponse.readable),
    literalUrlCount: literalUrls.length,
    literalUrls,
    candidateAssets,
  });
}

const assetMap = new Map();
for (const page of pages) {
  for (const candidate of page.candidateAssets) assetMap.set(candidate.url, candidate);
}
const assets = [];
let assetIndex = 0;
for (const candidate of [...assetMap.values()].slice(0, 40)) {
  assetIndex += 1;
  try {
    const response = await preserve(await session.fetch(candidate.url, candidate.url), `asset-${String(assetIndex).padStart(2, '0')}`);
    assets.push({
      sourceKind: candidate.kind,
      sourceText: candidate.text,
      ...response,
      rawHtml: undefined,
      readable: undefined,
      actualPdfOrImage: response.classification === 'pdf' || response.classification === 'image',
    });
  } catch (error) {
    assets.push({
      sourceKind: candidate.kind,
      sourceText: candidate.text,
      requestedUrl: candidate.url,
      error: error instanceof Error ? error.message : String(error),
      actualPdfOrImage: false,
    });
  }
}

const issueReadable = issue.readable;
const manifest = {
  schema: 'yesenin-pravda-eastview-literal-pages/v1',
  generatedAt: new Date().toISOString(),
  authority: 'East View Information Services',
  target: {
    publication: 'Pravda',
    date: '1921-11-09',
    issueNumber: '252',
    issueFeaturedId: '967207',
    issueUrl,
    expectedIssueTitle,
    expectedPageLinks,
  },
  issue: {
    ...issue,
    rawHtml: undefined,
    readable: undefined,
    pravdaPresent: /Pravda|Правда/iu.test(issueReadable),
    exactIssueTitlePresent: issueReadable.includes(expectedIssueTitle),
    literalPageLinkCount: exactPageLinks.length,
    exactPageLinks,
  },
  pages,
  assets,
  result: {
    exactIssueMetadataVerified:
      /Pravda|Правда/iu.test(issueReadable)
      && issueReadable.includes(expectedIssueTitle),
    bothLiteralPageLinksVerified: exactPageLinks.length === 2,
    pageResponsesFetched: pages.filter((page) => page.response.status === 200).length,
    issuePageCount: exactPageLinks.length,
    cleanTextResponses: pages.filter((page) => page.cleanTextPresent).length,
    historicalMarkersByPage: pages.map((page) => ({ pageNumber: page.pageNumber, ...page.historicalMarkers })),
    literalAssetCandidates: assetMap.size,
    actualFacsimileAssetsAcquired: assets.filter((asset) => asset.actualPdfOrImage).length,
    constructedIssueId: false,
    constructedDocumentId: false,
    constructedPageId: false,
    constructedViewerId: false,
    neighboringIdArithmeticUsed: false,
    subscriptionPurchased: false,
    credentialsProvided: false,
    requestSubmitted: false,
    ocrUsed: false,
    syntheticContentUsed: false,
    productionAuthorized: false,
  },
};

await writeFile(join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(
  join(outputRoot, 'SUMMARY.md'),
  [
    '# East View literal Pravda page-document discovery',
    '',
    `- Exact issue metadata verified: \`${manifest.result.exactIssueMetadataVerified}\``,
    `- Both literal page links verified: \`${manifest.result.bothLiteralPageLinksVerified}\``,
    `- Page responses fetched: \`${manifest.result.pageResponsesFetched}/2\``,
    `- Clean-text responses: \`${manifest.result.cleanTextResponses}/2\``,
    `- Literal asset candidates: \`${manifest.result.literalAssetCandidates}\``,
    `- Actual PDF/image assets acquired: \`${manifest.result.actualFacsimileAssetsAcquired}\``,
    '- Constructed IDs / neighbor arithmetic: `false`',
    '- Subscription / credentials / request: `false`',
    '',
  ].join('\n'),
);

console.log(JSON.stringify(manifest, null, 2));
if (!manifest.result.exactIssueMetadataVerified || !manifest.result.bothLiteralPageLinksVerified || manifest.result.pageResponsesFetched !== 2) process.exitCode = 1;
