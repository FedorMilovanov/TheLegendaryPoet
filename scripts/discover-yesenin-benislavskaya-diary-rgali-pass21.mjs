#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputRoot = 'artifacts/yesenin-benislavskaya-diary-pass21';
const rawRoot = join(outputRoot, 'raw');
const fundId = '8212';
const opisId = '9084';
const targetCipher = 'ф.1604 оп.1 ед. хр.1123';
const targetNumber = '1123';
const elementsOnPage = 20;
const maximumPages = 90;
const baseUrl = `https://rgali.ru/storage-unit?fundId=${fundId}&opisId=${opisId}`;
const userAgent = 'TheLegendaryPoet-RGALI-Discovery/1.1 (+https://github.com/FedorMilovanov/TheLegendaryPoet)';
const sha256 = (data) => createHash('sha256').update(data).digest('hex');

function decodeEntities(value) {
  return value
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function normalize(value) {
  return decodeEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchHtml(url) {
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
  if (
    response.status !== 200 ||
    !contentType.toLowerCase().includes('text/html') ||
    bytes.length < 10_000
  ) {
    throw new Error(
      `invalid RGALI HTML ${url}: HTTP ${response.status}, ${contentType}, ${bytes.length} bytes`,
    );
  }
  return { bytes, html: bytes.toString('utf8'), finalUrl: response.url, contentType };
}

function extractDetailCandidates(html, pageUrl) {
  const candidates = [];
  for (const match of html.matchAll(
    /<a\b[^>]*href=["']([^"']*\/storage-unit\/\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    const url = new URL(decodeEntities(match[1]), pageUrl).toString();
    const anchorText = normalize(match[2]);
    const rowStart = html.lastIndexOf('<tr', match.index);
    const rowEndStart = html.indexOf('</tr>', match.index + match[0].length);
    const rowEnd = rowEndStart < 0 ? match.index + match[0].length : rowEndStart + 5;
    const rowHtml = rowStart < 0 ? match[0] : html.slice(rowStart, rowEnd);
    const context = normalize(rowHtml);
    candidates.push({ url, anchorText, context });
  }
  return candidates;
}

function exactTarget(candidate) {
  return (
    candidate.context.includes(targetCipher) ||
    new RegExp(
      `ф\\.?\\s*1604\\s+оп\\.?\\s*1\\s+ед\\.?\\s*хр\\.?\\s*${targetNumber}(?!\\d)`,
      'iu',
    ).test(candidate.context)
  );
}

function pageUrl(page) {
  return `${baseUrl}&fieldForSort=&elementsOnPage=${elementsOnPage}&currentPage=${page}`;
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(rawRoot, { recursive: true });

const crawledPages = [];
const exactMatches = [];
const seenDetailUrls = new Set();
let consecutiveEmptyPages = 0;

for (let page = 1; page <= maximumPages; page += 1) {
  const url = pageUrl(page);
  const fetched = await fetchHtml(url);
  const file = `opis-page-${String(page).padStart(2, '0')}.html`;
  await writeFile(join(rawRoot, file), fetched.bytes);
  const candidates = extractDetailCandidates(fetched.html, fetched.finalUrl);
  const fresh = candidates.filter((candidate) => !seenDetailUrls.has(candidate.url));
  for (const candidate of fresh) seenDetailUrls.add(candidate.url);
  const pageMatches = fresh.filter(exactTarget);
  exactMatches.push(...pageMatches.map((candidate) => ({ ...candidate, page })));
  const pageMarkerMatch = fetched.html.match(/<div[^>]+id=["']currentPage["'][^>]*>(\d+)<\/div>/i);
  const declaredCurrentPage = pageMarkerMatch ? Number(pageMarkerMatch[1]) : null;
  crawledPages.push({
    page,
    requestedUrl: url,
    finalUrl: fetched.finalUrl,
    declaredCurrentPage,
    htmlBytes: fetched.bytes.length,
    htmlSha256: sha256(fetched.bytes),
    detailLinks: candidates.length,
    freshDetailLinks: fresh.length,
    exactTargetMatches: pageMatches.length,
    rawFile: `raw/${file}`,
  });

  if (declaredCurrentPage !== page) {
    throw new Error(
      `RGALI pagination did not honor currentPage=${page}; page declared ${declaredCurrentPage}`,
    );
  }
  if (pageMatches.length > 0) break;
  if (page > 1 && fresh.length === 0) consecutiveEmptyPages += 1;
  else consecutiveEmptyPages = 0;
  if (consecutiveEmptyPages >= 3) break;
}

const uniqueMatches = [...new Map(exactMatches.map((match) => [match.url, match])).values()];
if (uniqueMatches.length !== 1) {
  const manifest = {
    schema: 'yesenin-benislavskaya-diary-rgali-pass21/v2',
    generatedAt: new Date().toISOString(),
    fundId,
    opisId,
    targetCipher,
    targetNumber,
    pagination: { elementsOnPage, parameter: 'currentPage' },
    crawledPages,
    exactMatches: uniqueMatches,
    exactDetailCardIdentified: false,
    catalogueIdConstructed: false,
    contentInspected: false,
    productionAuthorized: false,
  };
  await writeFile(join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  throw new Error(
    `expected exactly one literal RGALI match for ${targetCipher}, found ${uniqueMatches.length}`,
  );
}

const match = uniqueMatches[0];
const detail = await fetchHtml(match.url);
await writeFile(join(rawRoot, 'target-detail.html'), detail.bytes);
const detailText = normalize(detail.html);

const checks = {
  targetCipherPresent:
    detailText.includes(targetCipher) ||
    /ф\.?\s*1604\s+оп\.?\s*1\s+ед\.?\s*хр\.?\s*1123(?!\d)/iu.test(detailText),
  targetNumberPresent: /Номер единицы хранения:\s*1123(?!\d)/iu.test(detailText),
  benislavskayaPresent: /Бениславск/iu.test(detailText),
  diaryPresent: /Дневник/iu.test(detailText),
  thirtyFiveLeavesPresent:
    /Количество листов:\s*35(?!\d)/iu.test(detailText) || /35\s*л\./iu.test(detailText),
  typescriptPresent: /Машинопис/iu.test(detailText),
  zelinskyFundPresent: /Зелинск/iu.test(detailText),
};

const manifest = {
  schema: 'yesenin-benislavskaya-diary-rgali-pass21/v2',
  generatedAt: new Date().toISOString(),
  authority: 'Российский государственный архив литературы и искусства',
  fundId,
  opisId,
  targetCipher,
  targetNumber,
  pagination: { elementsOnPage, parameter: 'currentPage' },
  crawledPages,
  exactMatches: uniqueMatches,
  detail: {
    requestedUrl: match.url,
    finalUrl: detail.finalUrl,
    htmlBytes: detail.bytes.length,
    htmlSha256: sha256(detail.bytes),
    rawFile: 'raw/target-detail.html',
    checks,
    normalizedContext: detailText.slice(0, 5000),
  },
  exactDetailCardIdentified: Object.values(checks).every(Boolean),
  catalogueIdConstructed: false,
  facsimileAcquired: false,
  fullTextAcquired: false,
  contentInspected: false,
  ocrUsed: false,
  syntheticContentUsed: false,
  productionAuthorized: false,
};
await writeFile(join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const summary = [
  '# RGALI Benislavskaya diary discovery pass 21',
  '',
  `- Target: ${targetCipher}`,
  `- Opis pages crawled: ${crawledPages.length}`,
  `- Literal detail matches: ${uniqueMatches.length}`,
  `- Detail URL: ${detail.finalUrl}`,
  `- Detail HTML bytes: ${detail.bytes.length}`,
  `- Detail HTML SHA-256: ${sha256(detail.bytes)}`,
  `- Cipher present: ${checks.targetCipherPresent}`,
  `- Benislavskaya present: ${checks.benislavskayaPresent}`,
  `- Diary present: ${checks.diaryPresent}`,
  `- 35 leaves present: ${checks.thirtyFiveLeavesPresent}`,
  `- Typescript present: ${checks.typescriptPresent}`,
  '- Catalogue ID constructed: false',
  '- Facsimile acquired: false',
  '- Content inspected: false',
  '- Production authorization: false',
  '',
];
await writeFile(join(outputRoot, 'SUMMARY.md'), `${summary.join('\n')}\n`, 'utf8');
console.log(summary.join('\n'));

if (!manifest.exactDetailCardIdentified) {
  throw new Error(
    `literal detail card found, but required identity markers are incomplete: ${JSON.stringify(checks)}`,
  );
}
