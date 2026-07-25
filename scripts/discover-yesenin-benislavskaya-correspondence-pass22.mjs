#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputRoot = 'artifacts/yesenin-benislavskaya-correspondence-pass22';
const rawRoot = join(outputRoot, 'raw');
const sitemapUrl = 'https://feb-web.ru/feb/esenin/sitemap.htm';
const indexUrl = 'https://feb-web.ru/feb/esenin/texts/es6/es6-754-.htm?cmd=p';
const expectedOutboundDocuments = 35;
const expectedInboundLetters = 14;
const userAgent = 'TheLegendaryPoet-FEB-Benislavskaya-Discovery/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

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

function decodeHtml(bytes, contentType) {
  const asciiHead = bytes.subarray(0, Math.min(bytes.length, 4096)).toString('latin1').toLowerCase();
  const declared = `${contentType} ${asciiHead}`;
  const encoding = /(?:windows-1251|cp1251|charset\s*=\s*["']?1251)/i.test(declared)
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
  )
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeAttribute(value) {
  return decodeEntities(value.replace(/&amp;/gi, '&'));
}

function extractAnchors(html, pageUrl) {
  const anchors = [];
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let url;
    try {
      url = new URL(decodeAttribute(match[1]), pageUrl).toString();
    } catch {
      continue;
    }
    anchors.push({
      url,
      text: visibleText(match[2]),
      rawHref: match[1],
    });
  }
  return anchors;
}

async function fetchBytes(url, attempts = 4) {
  let lastError;
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
        throw new Error(`HTTP ${response.status}, ${contentType}, ${bytes.length} bytes`);
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
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw new Error(`failed to fetch ${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? visibleText(match[1]) : null;
}

function extractPrintedPages(text) {
  const pages = [];
  for (const match of text.matchAll(/(?:^|\s)-\s*(\d{1,3})\s*-(?=\s|$)/g)) {
    const page = Number(match[1]);
    if (page >= 1 && page <= 796) pages.push(page);
  }
  return [...new Set(pages)].sort((a, b) => a - b);
}

function inferDocumentKind(label, pageText) {
  const value = `${label} ${pageText.slice(0, 2500)}`;
  if (/телеграм/iu.test(value)) return 'telegram-or-telegram-text';
  if (/записк/iu.test(value)) return 'note-or-note-text';
  return 'letter';
}

function extractSourceBasisSnippet(text) {
  const markers = ['Печатается по', 'Автограф', 'Копия', 'Публикуется впервые', 'Первая публикация'];
  let bestIndex = -1;
  for (const marker of markers) {
    const index = text.indexOf(marker);
    if (index >= 0 && (bestIndex < 0 || index < bestIndex)) bestIndex = index;
  }
  if (bestIndex < 0) return null;
  return text.slice(bestIndex, bestIndex + 900).trim();
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(rawRoot, { recursive: true });

const sitemap = await fetchBytes(sitemapUrl);
await writeFile(join(rawRoot, 'feb-sitemap.html'), sitemap.bytes);
const sitemapText = visibleText(sitemap.html);
const allAnchors = extractAnchors(sitemap.html, sitemap.finalUrl);
const candidateAnchors = allAnchors.filter((anchor) =>
  /\/feb\/esenin\/texts\/es6\/es6-[^?#]+\.htm/i.test(anchor.url)
  && /Бениславской\s+Г\.\s*А\./iu.test(anchor.text),
);
const uniqueCandidates = [...new Map(candidateAnchors.map((anchor) => [anchor.url.replace(/[?#].*$/, ''), anchor])).values()]
  .sort((a, b) => a.text.localeCompare(b.text, 'ru'));

const index = await fetchBytes(indexUrl);
await writeFile(join(rawRoot, 'volume-6-name-index.html'), index.bytes);
const indexText = visibleText(index.html);
const indexEntryMatch = indexText.match(/Бениславская Галина Артуровна[\s\S]{0,3000}?Известно\s+(\d+)\s+писем,\s*записок\s+и\s+телеграмм[\s\S]{0,500}?а также\s+(\d+)\s+писем\s+Бениславской\s+Есенину/iu);
const indexOutboundCount = indexEntryMatch ? Number(indexEntryMatch[1]) : null;
const indexInboundCount = indexEntryMatch ? Number(indexEntryMatch[2]) : null;

const records = [];
for (let indexNumber = 0; indexNumber < uniqueCandidates.length; indexNumber += 1) {
  const candidate = uniqueCandidates[indexNumber];
  const fetched = await fetchBytes(candidate.url);
  const fileName = `document-${String(indexNumber + 1).padStart(2, '0')}.html`;
  await writeFile(join(rawRoot, fileName), fetched.bytes);
  const text = visibleText(fetched.html);
  const title = extractTitle(fetched.html);
  const printedPages = extractPrintedPages(text);
  const exactRecipientPresent = /Бениславской\s+Г\.\s*А\.|Г\.\s*А\.\s*БЕНИСЛАВСКОЙ/iu.test(text);
  records.push({
    sequence: indexNumber + 1,
    sitemapLabel: candidate.text,
    sitemapHref: candidate.rawHref,
    requestedUrl: candidate.url,
    finalUrl: fetched.finalUrl,
    title,
    encoding: fetched.encoding,
    contentType: fetched.contentType,
    htmlBytes: fetched.bytes.length,
    htmlSha256: sha256(fetched.bytes),
    visibleTextSha256: sha256(Buffer.from(text, 'utf8')),
    printedPages,
    documentKind: inferDocumentKind(candidate.text, text),
    jointRecipient: /\sи\s+др\./iu.test(candidate.text),
    exactRecipientPresent,
    sourceBasisSnippet: extractSourceBasisSnippet(text),
    rawFile: `raw/${fileName}`,
    archiveOriginalInspected: false,
    diplomaticTranscriptionMade: false,
    ocrUsed: false,
    syntheticContentUsed: false,
  });
}

const errors = [];
if (uniqueCandidates.length !== expectedOutboundDocuments) {
  errors.push(`sitemap exact Benislavskaya document count ${uniqueCandidates.length} != ${expectedOutboundDocuments}`);
}
if (indexOutboundCount !== expectedOutboundDocuments) {
  errors.push(`name-index outbound count ${indexOutboundCount} != ${expectedOutboundDocuments}`);
}
if (indexInboundCount !== expectedInboundLetters) {
  errors.push(`name-index inbound count ${indexInboundCount} != ${expectedInboundLetters}`);
}
if (records.some((record) => !record.exactRecipientPresent)) {
  errors.push('one or more fetched pages do not contain the exact Benislavskaya recipient marker');
}
if (new Set(records.map((record) => record.finalUrl)).size !== records.length) {
  errors.push('duplicate final URLs detected in correspondence records');
}
if (records.some((record) => !/^[a-f0-9]{64}$/.test(record.htmlSha256))) {
  errors.push('one or more document SHA-256 values are malformed');
}

const manifest = {
  schema: 'yesenin-benislavskaya-correspondence-discovery-pass22/v1',
  generatedAt: new Date().toISOString(),
  authority: 'Фундаментальная электронная библиотека Русская литература и фольклор',
  edition: 'С. А. Есенин. Полное собрание сочинений. Т. 6. Письма. 1999',
  sitemap: {
    requestedUrl: sitemap.requestedUrl,
    finalUrl: sitemap.finalUrl,
    encoding: sitemap.encoding,
    htmlBytes: sitemap.bytes.length,
    htmlSha256: sha256(sitemap.bytes),
    visibleTextSha256: sha256(Buffer.from(sitemapText, 'utf8')),
    allAnchorCount: allAnchors.length,
    exactBenislavskayaCandidateCount: uniqueCandidates.length,
    rawFile: 'raw/feb-sitemap.html',
  },
  nameIndex: {
    requestedUrl: index.requestedUrl,
    finalUrl: index.finalUrl,
    encoding: index.encoding,
    htmlBytes: index.bytes.length,
    htmlSha256: sha256(index.bytes),
    visibleTextSha256: sha256(Buffer.from(indexText, 'utf8')),
    indexOutboundCount,
    indexInboundCount,
    rawFile: 'raw/volume-6-name-index.html',
  },
  expectedOutboundDocuments,
  expectedInboundLetters,
  acquiredOfficialPublishedPages: records.length,
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
  `- Exact outbound documents expected by PSS index: ${expectedOutboundDocuments}`,
  `- Exact outbound sitemap links acquired: ${records.length}`,
  `- Inbound Benislavskaya letters named by PSS index: ${indexInboundCount ?? 'UNRESOLVED'}`,
  `- Inbound letter texts acquired: false`,
  `- Joint-recipient documents: ${records.filter((record) => record.jointRecipient).length}`,
  `- Official HTML bytes acquired: ${records.reduce((sum, record) => sum + record.htmlBytes, 0)}`,
  '- Archive originals inspected: false',
  '- Diplomatic transcription: false',
  '- OCR used: false',
  '- Synthetic content: false',
  '- Production authorization: false',
  '',
  'Sequence | Sitemap label | Kind | Printed pages | HTML bytes | SHA-256',
  '---: | --- | --- | --- | ---: | ---',
  ...records.map((record) => [
    record.sequence,
    record.sitemapLabel.replaceAll('|', '\\|'),
    record.documentKind,
    record.printedPages.join(', ') || 'UNRESOLVED',
    record.htmlBytes,
    record.htmlSha256,
  ].join(' | ')),
  '',
];
await writeFile(join(outputRoot, 'SUMMARY.md'), `${summary.join('\n')}\n`, 'utf8');
console.log(summary.join('\n'));

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}
