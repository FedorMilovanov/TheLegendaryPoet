#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputRoot = 'artifacts/yesenin-benislavskaya-correspondence-pass22';
const rawRoot = join(outputRoot, 'raw');
const sitemapUrl = 'https://feb-web.ru/feb/esenin/sitemap.htm';
const nameIndexUrl = 'https://feb-web.ru/feb/esenin/texts/es6/es6-754-.htm?cmd=p';
const expectedOutbound = 35;
const expectedInbound = 14;
const userAgent = 'TheLegendaryPoet-FEB-Benislavskaya-Discovery/2.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)';
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

function decodeHtml(bytes, contentType = '') {
  const head = bytes.subarray(0, Math.min(bytes.length, 4096)).toString('latin1');
  const encoding = /windows-1251|cp1251|charset\s*=\s*["']?1251/i.test(`${contentType} ${head}`)
    ? 'windows-1251'
    : 'utf-8';
  return { html: new TextDecoder(encoding).decode(bytes), encoding };
}

function visibleText(html) {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function printUrl(url) {
  const parsed = new URL(url);
  parsed.searchParams.set('cmd', 'p');
  return parsed.toString();
}

async function fetchHtml(url, attempts = 4) {
  let lastError = 'unknown error';
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'user-agent': userAgent,
          accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.2',
          'accept-language': 'ru,en;q=0.7',
        },
        signal: AbortSignal.timeout(90_000),
      });
      const bytes = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || '';
      if (response.status !== 200 || !contentType.toLowerCase().includes('text/html') || bytes.length < 1000) {
        throw new Error(`HTTP ${response.status}, ${contentType || 'NO_CONTENT_TYPE'}, ${bytes.length} bytes`);
      }
      const decoded = decodeHtml(bytes, contentType);
      return {
        requestedUrl: url,
        finalUrl: response.url,
        contentType,
        bytes,
        html: decoded.html,
        encoding: decoded.encoding,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw new Error(lastError);
}

function exactBenislavskayaAnchors(html, pageUrl) {
  const records = [];
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const label = visibleText(match[2]);
    if (!/Бениславской\s+Г\.\s*А\./iu.test(label)) continue;
    let url;
    try {
      url = new URL(decodeEntities(match[1]), pageUrl).toString();
    } catch {
      continue;
    }
    if (!/\/feb\/esenin\/texts\/es6\/es6-[^/?#]+\.htm(?:[?#]|$)/i.test(url)) continue;
    records.push({
      label,
      sitemapUrl: url.replace(/[?#].*$/, ''),
      printUrl: printUrl(url),
      rawHref: match[1],
    });
  }
  return [...new Map(records.map((record) => [record.sitemapUrl, record])).values()]
    .sort((a, b) => a.sitemapUrl.localeCompare(b.sitemapUrl));
}

function pageTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? visibleText(match[1]) : null;
}

function printedPages(text) {
  return [...new Set([...text.matchAll(/(?:^|\s)-\s*(\d{1,3})\s*-(?=\s|$)/g)]
    .map((match) => Number(match[1]))
    .filter((page) => page >= 1 && page <= 796))].sort((a, b) => a - b);
}

function sourceBasis(text) {
  const patterns = [
    /Печатается по[\s\S]{0,900}/iu,
    /Автограф[\s\S]{0,900}/iu,
    /Машинописн(?:ая|ой) копи[яи][\s\S]{0,900}/iu,
    /Публикуется впервые[\s\S]{0,900}/iu,
    /Первая публикация[\s\S]{0,900}/iu,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].slice(0, 900).trim();
  }
  return null;
}

function documentKind(label, text) {
  const sample = `${label} ${text.slice(0, 2500)}`;
  if (/телеграм/iu.test(sample)) return 'telegram-or-telegram-text';
  if (/записк/iu.test(sample)) return 'note-or-note-text';
  return 'letter';
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(rawRoot, { recursive: true });

const errors = [];
const sitemap = await fetchHtml(sitemapUrl);
await writeFile(join(rawRoot, 'feb-sitemap.html'), sitemap.bytes);
const sitemapText = visibleText(sitemap.html);
const candidates = exactBenislavskayaAnchors(sitemap.html, sitemap.finalUrl);

const nameIndex = await fetchHtml(nameIndexUrl);
await writeFile(join(rawRoot, 'volume-6-name-index.html'), nameIndex.bytes);
const nameIndexText = visibleText(nameIndex.html);
const outboundMatch = nameIndexText.match(/Известно\s+(\d+)\s+писем,\s*записок\s+и\s+телеграмм/iu);
const inboundMatch = nameIndexText.match(/а также\s+(\d+)\s+писем\s+Бениславской\s+Есенину/iu);
const indexOutbound = outboundMatch ? Number(outboundMatch[1]) : null;
const indexInbound = inboundMatch ? Number(inboundMatch[1]) : null;

if (candidates.length !== expectedOutbound) errors.push(`sitemap candidates ${candidates.length} != ${expectedOutbound}`);
if (indexOutbound !== expectedOutbound) errors.push(`name-index outbound ${indexOutbound} != ${expectedOutbound}`);
if (indexInbound !== expectedInbound) errors.push(`name-index inbound ${indexInbound} != ${expectedInbound}`);

const records = [];
for (let index = 0; index < candidates.length; index += 1) {
  const candidate = candidates[index];
  const fileName = `document-${String(index + 1).padStart(2, '0')}.html`;
  try {
    const fetched = await fetchHtml(candidate.printUrl);
    await writeFile(join(rawRoot, fileName), fetched.bytes);
    const text = visibleText(fetched.html);
    const recipientMarker = /Бениславской\s+Г\.\s*А\.|Г\.\s*А\.\s*БЕНИСЛАВСКОЙ/iu.test(text);
    if (!recipientMarker) errors.push(`${candidate.sitemapUrl}: recipient marker absent`);
    records.push({
      sequence: index + 1,
      sitemapLabel: candidate.label,
      sitemapUrl: candidate.sitemapUrl,
      requestedPrintUrl: candidate.printUrl,
      finalUrl: fetched.finalUrl,
      title: pageTitle(fetched.html),
      encoding: fetched.encoding,
      contentType: fetched.contentType,
      htmlBytes: fetched.bytes.length,
      htmlSha256: sha256(fetched.bytes),
      visibleTextSha256: sha256(Buffer.from(text, 'utf8')),
      printedPages: printedPages(text),
      documentKind: documentKind(candidate.label, text),
      jointRecipient: /\sи\s+др\./iu.test(candidate.label),
      recipientMarker,
      sourceBasisSnippet: sourceBasis(text),
      rawFile: `raw/${fileName}`,
      fetchError: null,
      archiveOriginalInspected: false,
      autographStatusIndividuallyVerified: false,
      diplomaticTranscriptionMade: false,
      ocrUsed: false,
      syntheticContentUsed: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`${candidate.sitemapUrl}: fetch failed: ${message}`);
    records.push({
      sequence: index + 1,
      sitemapLabel: candidate.label,
      sitemapUrl: candidate.sitemapUrl,
      requestedPrintUrl: candidate.printUrl,
      finalUrl: null,
      title: null,
      encoding: null,
      contentType: null,
      htmlBytes: 0,
      htmlSha256: null,
      visibleTextSha256: null,
      printedPages: [],
      documentKind: null,
      jointRecipient: /\sи\s+др\./iu.test(candidate.label),
      recipientMarker: false,
      sourceBasisSnippet: null,
      rawFile: null,
      fetchError: message,
      archiveOriginalInspected: false,
      autographStatusIndividuallyVerified: false,
      diplomaticTranscriptionMade: false,
      ocrUsed: false,
      syntheticContentUsed: false,
    });
  }
}

const acquired = records.filter((record) => record.fetchError === null);
if (acquired.length !== expectedOutbound) errors.push(`acquired pages ${acquired.length} != ${expectedOutbound}`);
if (new Set(acquired.map((record) => record.finalUrl)).size !== acquired.length) errors.push('duplicate final URLs');

const manifest = {
  schema: 'yesenin-benislavskaya-correspondence-discovery-pass22/v2',
  generatedAt: new Date().toISOString(),
  authority: 'Фундаментальная электронная библиотека Русская литература и фольклор',
  edition: 'С. А. Есенин. Полное собрание сочинений. Т. 6. Письма. 1999',
  expectedOutbound,
  expectedInbound,
  sitemap: {
    requestedUrl: sitemap.requestedUrl,
    finalUrl: sitemap.finalUrl,
    encoding: sitemap.encoding,
    htmlBytes: sitemap.bytes.length,
    htmlSha256: sha256(sitemap.bytes),
    visibleTextSha256: sha256(Buffer.from(sitemapText, 'utf8')),
    exactCandidateCount: candidates.length,
    rawFile: 'raw/feb-sitemap.html',
  },
  nameIndex: {
    requestedUrl: nameIndex.requestedUrl,
    finalUrl: nameIndex.finalUrl,
    encoding: nameIndex.encoding,
    htmlBytes: nameIndex.bytes.length,
    htmlSha256: sha256(nameIndex.bytes),
    visibleTextSha256: sha256(Buffer.from(nameIndexText, 'utf8')),
    outboundCount: indexOutbound,
    inboundCount: indexInbound,
    rawFile: 'raw/volume-6-name-index.html',
  },
  acquiredOfficialPublishedPages: acquired.length,
  totalOfficialHtmlBytes: acquired.reduce((sum, record) => sum + record.htmlBytes, 0),
  records,
  boundaries: {
    inboundLetterTextsAcquired: false,
    archiveOriginalsInspected: false,
    autographStatusIndividuallyVerified: false,
    diplomaticTranscriptionMade: false,
    ocrUsed: false,
    syntheticContentUsed: false,
    productionAuthorized: false,
    articlePublished: false,
  },
  errors,
};
await writeFile(join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const summary = [
  '# FEB Benislavskaya correspondence discovery pass 22',
  '',
  `- Sitemap candidates: ${candidates.length}/${expectedOutbound}`,
  `- Official published pages acquired: ${acquired.length}/${expectedOutbound}`,
  `- PSS name-index outbound documents: ${indexOutbound ?? 'UNRESOLVED'}`,
  `- PSS name-index inbound letters: ${indexInbound ?? 'UNRESOLVED'}`,
  '- Inbound letter texts acquired: false',
  `- Joint-recipient documents: ${records.filter((record) => record.jointRecipient).length}`,
  `- Official HTML bytes: ${manifest.totalOfficialHtmlBytes}`,
  `- Errors: ${errors.length}`,
  '- Archive originals inspected: false',
  '- Diplomatic transcription: false',
  '- OCR used: false',
  '- Production authorization: false',
  '',
  'No. | Sitemap label | Kind | Printed pages | Bytes | Status',
  '---: | --- | --- | --- | ---: | ---',
  ...records.map((record) => [
    record.sequence,
    record.sitemapLabel.replaceAll('|', '\\|'),
    record.documentKind ?? 'UNRESOLVED',
    record.printedPages.join(', ') || 'UNRESOLVED',
    record.htmlBytes,
    record.fetchError ? `ERROR: ${record.fetchError}` : record.htmlSha256,
  ].join(' | ')),
  '',
];
await writeFile(join(outputRoot, 'SUMMARY.md'), `${summary.join('\n')}\n`, 'utf8');
console.log(summary.join('\n'));

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}
