#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputRoot = 'artifacts/yesenin-benislavskaya-inbound-rgali-pass24';
const rawRoot = join(outputRoot, 'raw');
const fundId = '8211';
const opisId = '9080';
const targetCipher = 'ф.190 оп.1 ед. хр.106';
const targetNumber = 106;
const elementsOnPage = 20;
const maximumPages = 12;
const baseUrl = `https://www.rgali.ru/storage-unit?fundId=${fundId}&opisId=${opisId}`;
const userAgent = 'TheLegendaryPoet-RGALI-Benislavskaya-Inbound/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)';
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
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
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
      if (response.status !== 200 || !contentType.toLowerCase().includes('text/html') || bytes.length < 10_000) {
        throw new Error(`HTTP ${response.status}, ${contentType || 'NO_CONTENT_TYPE'}, ${bytes.length} bytes`);
      }
      return {
        requestedUrl: url,
        finalUrl: response.url,
        contentType,
        bytes,
        html: bytes.toString('utf8'),
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw new Error(lastError);
}

function pageUrl(page) {
  return `${baseUrl}&fieldForSort=&elementsOnPage=${elementsOnPage}&currentPage=${page}`;
}

function extractRows(html, pageUrlValue) {
  const rows = [];
  for (const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const rowHtml = match[0];
    const rowText = visibleText(rowHtml);
    const link = rowHtml.match(/<a\b[^>]*href=["']([^"']*\/storage-unit\/\d+[^"']*)["'][^>]*>/i);
    if (!link) continue;
    let detailUrl;
    try {
      detailUrl = new URL(decodeEntities(link[1]), pageUrlValue).toString();
    } catch {
      continue;
    }
    rows.push({ detailUrl, rowText, rowHtmlSha256: sha256(Buffer.from(rowHtml, 'utf8')) });
  }
  return rows;
}

function isExactTarget(rowText) {
  return rowText.includes(targetCipher) || /ф\.?\s*190\s+оп\.?\s*1\s+ед\.?\s*хр\.?\s*106(?!\d)/iu.test(rowText);
}

function field(text, label, nextLabels) {
  const escapedNext = nextLabels.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const pattern = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=\\s+(?:${escapedNext}):|$)`, 'iu');
  return text.match(pattern)?.[1]?.trim() ?? null;
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(rawRoot, { recursive: true });

const crawledPages = [];
const exactMatches = [];
const seenUrls = new Set();

for (let page = 1; page <= maximumPages; page += 1) {
  const requestedUrl = pageUrl(page);
  const fetched = await fetchHtml(requestedUrl);
  const rawFile = `opis-page-${String(page).padStart(2, '0')}.html`;
  await writeFile(join(rawRoot, rawFile), fetched.bytes);
  const rows = extractRows(fetched.html, fetched.finalUrl);
  const pageMarker = fetched.html.match(/<div[^>]+id=["']currentPage["'][^>]*>(\d+)<\/div>/i);
  const declaredCurrentPage = pageMarker ? Number(pageMarker[1]) : null;
  if (declaredCurrentPage !== page) {
    throw new Error(`RGALI pagination did not honor currentPage=${page}; declared ${declaredCurrentPage}`);
  }
  const freshRows = rows.filter((row) => !seenUrls.has(row.detailUrl));
  for (const row of freshRows) seenUrls.add(row.detailUrl);
  const matches = freshRows.filter((row) => isExactTarget(row.rowText));
  exactMatches.push(...matches.map((row) => ({ ...row, page })));
  crawledPages.push({
    page,
    requestedUrl,
    finalUrl: fetched.finalUrl,
    declaredCurrentPage,
    htmlBytes: fetched.bytes.length,
    htmlSha256: sha256(fetched.bytes),
    rowCount: rows.length,
    freshRowCount: freshRows.length,
    exactTargetMatches: matches.length,
    rawFile: `raw/${rawFile}`,
  });
  if (matches.length > 0) break;
}

const uniqueMatches = [...new Map(exactMatches.map((match) => [match.detailUrl, match])).values()];
if (uniqueMatches.length !== 1) {
  const manifest = {
    schema: 'yesenin-benislavskaya-inbound-rgali-discovery-pass24/v1',
    generatedAt: new Date().toISOString(),
    fundId,
    opisId,
    targetCipher,
    crawledPages,
    exactMatches: uniqueMatches,
    exactDetailCardIdentified: false,
    storageUnitIdInferred: false,
    facsimileAcquired: false,
    contentInspected: false,
  };
  await writeFile(join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  throw new Error(`expected exactly one literal row for ${targetCipher}, found ${uniqueMatches.length}`);
}

const match = uniqueMatches[0];
const detail = await fetchHtml(match.detailUrl);
await writeFile(join(rawRoot, 'target-detail.html'), detail.bytes);
const detailText = visibleText(detail.html);
const labels = ['Раздел систематизации', 'Номер единицы хранения', 'Шифр', 'Заголовок', 'Крайние даты', 'Количество листов', 'Авторы-персоны', 'Адресаты-персоны', 'Персоны', 'Способ воспроизведения', 'Темы', 'География', 'Рубрика по систематическому каталогу'];
const checks = {
  targetCipherPresent: detailText.includes(targetCipher) || /ф\.?\s*190\s+оп\.?\s*1\s+ед\.?\s*хр\.?\s*106(?!\d)/iu.test(detailText),
  targetNumberPresent: /Номер единицы хранения:\s*106(?!\d)/iu.test(detailText),
  benislavskayaPresent: /Бениславск/iu.test(detailText),
  yeseninPresent: /Есенин/iu.test(detailText),
  correspondenceMarkerPresent: /Письм|Переписк|телеграм/iu.test(detailText),
};
const extracted = {
  section: field(detailText, 'Раздел систематизации', labels.slice(1)),
  cipher: field(detailText, 'Шифр', labels.slice(3)),
  title: field(detailText, 'Заголовок', labels.slice(4)),
  dates: field(detailText, 'Крайние даты', labels.slice(5)),
  leaves: field(detailText, 'Количество листов', labels.slice(6)),
  reproduction: field(detailText, 'Способ воспроизведения', labels.slice(10)),
};
const storageUnitId = detail.finalUrl.match(/\/storage-unit\/(\d+)/)?.[1] ?? null;
const exactDetailCardIdentified = Object.values(checks).every(Boolean) && storageUnitId !== null;

const manifest = {
  schema: 'yesenin-benislavskaya-inbound-rgali-discovery-pass24/v1',
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
    requestedUrl: match.detailUrl,
    finalUrl: detail.finalUrl,
    storageUnitId,
    htmlBytes: detail.bytes.length,
    htmlSha256: sha256(detail.bytes),
    visibleTextSha256: sha256(Buffer.from(detailText, 'utf8')),
    rawFile: 'raw/target-detail.html',
    rowText: match.rowText,
    rowHtmlSha256: match.rowHtmlSha256,
    checks,
    extracted,
  },
  exactDetailCardIdentified,
  storageUnitIdInferred: false,
  earlyPublishedInboundCount: 10,
  currentPssInboundCount: 14,
  fundSummaryMachineCopyCount: 35,
  countsReconciled: false,
  facsimileAcquired: false,
  fullTextAcquired: false,
  contentInspected: false,
  ocrUsed: false,
  syntheticContentUsed: false,
  productionAuthorized: false,
  articlePublished: false,
};
await writeFile(join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const summary = [
  '# RGALI Benislavskaya inbound correspondence discovery pass 24',
  '',
  `- Target: ${targetCipher}`,
  `- Opis pages crawled: ${crawledPages.length}`,
  `- Literal detail matches: ${uniqueMatches.length}`,
  `- Detail URL: ${detail.finalUrl}`,
  `- Storage-unit ID inferred: false`,
  `- Detail HTML bytes: ${detail.bytes.length}`,
  `- Detail HTML SHA-256: ${sha256(detail.bytes)}`,
  `- Visible-text SHA-256: ${sha256(Buffer.from(detailText, 'utf8'))}`,
  `- Title: ${extracted.title ?? 'UNRESOLVED'}`,
  `- Dates: ${extracted.dates ?? 'UNRESOLVED'}`,
  `- Leaves: ${extracted.leaves ?? 'UNRESOLVED'}`,
  `- Reproduction: ${extracted.reproduction ?? 'UNRESOLVED'}`,
  `- Early published inbound count: 10`,
  `- Current PSS inbound count: 14`,
  `- Fund-summary machine-copy count: 35`,
  `- Counts reconciled: false`,
  '- Facsimile acquired: false',
  '- Content inspected: false',
  '- OCR used: false',
  '- Production authorization: false',
  '',
];
await writeFile(join(outputRoot, 'SUMMARY.md'), `${summary.join('\n')}\n`, 'utf8');
console.log(summary.join('\n'));
if (!exactDetailCardIdentified) throw new Error(`literal detail card found, but required identity markers are incomplete: ${JSON.stringify(checks)}`);
