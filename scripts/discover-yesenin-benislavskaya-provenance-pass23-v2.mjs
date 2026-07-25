#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputRoot = 'artifacts/yesenin-benislavskaya-provenance-pass23';
const rawRoot = join(outputRoot, 'raw');
const commentsUrl = 'https://feb-web.ru/feb/esenin/texts/es6/es6-233-.htm?cmd=p';
const expectedCount = 35;
const expectedFirstPages = [127, 136, 159, 160, 160, 166, 167, 167, 170, 170, 175, 179, 180, 183, 184, 186, 186, 187, 189, 191, 197, 201, 201, 202, 202, 202, 207, 208, 209, 211, 211, 212, 212, 214, 215];
const userAgent = 'TheLegendaryPoet-FEB-Benislavskaya-Provenance/2.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)';
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
  const encoding = /windows-1251|cp1251|charset\s*=\s*["']?1251/i.test(`${contentType} ${head}`) ? 'windows-1251' : 'utf-8';
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

async function fetchHtml(url, attempts = 4) {
  let lastError = 'unknown error';
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: { 'user-agent': userAgent, accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.2', 'accept-language': 'ru,en;q=0.7' },
        signal: AbortSignal.timeout(120_000),
      });
      const bytes = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || '';
      if (response.status !== 200 || !contentType.toLowerCase().includes('text/html') || bytes.length < 1_000_000) {
        throw new Error(`HTTP ${response.status}, ${contentType || 'NO_CONTENT_TYPE'}, ${bytes.length} bytes`);
      }
      const decoded = decodeHtml(bytes, contentType);
      return { requestedUrl: url, finalUrl: response.url, contentType, bytes, html: decoded.html, encoding: decoded.encoding };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
  throw new Error(lastError);
}

function mainSections(html) {
  const starts = [];
  for (const match of html.matchAll(/<h4\b(?=[^>]*\bL=1\b)(?=[^>]*\btitle=["']([^"']+)["'])[^>]*><\/h4>/gi)) {
    starts.push({ index: match.index, title: decodeEntities(match[1]) });
  }
  return starts.map((start, index) => ({
    title: start.title,
    html: html.slice(start.index, starts[index + 1]?.index ?? html.length),
  }));
}

function exactHeading(sectionHtml) {
  const match = sectionHtml.match(/<p\b[^>]*class=["']?komm4["']?[^>]*>([\s\S]*?)(?=<p\b|<h[1-6]\b|<\/BLOCKQUOTE>|$)/i);
  return match ? visibleText(match[1]) : null;
}

function sourceFormula(sectionHtml) {
  for (const match of sectionHtml.matchAll(/<p\b[^>]*class=["']?komm(?:2|3|4)["']?[^>]*>([\s\S]*?)(?=<p\b|<h[1-6]\b|<\/BLOCKQUOTE>|$)/gi)) {
    const text = visibleText(match[1]);
    if (/^(?:Печатается|Публикуется)/u.test(text)) return text;
  }
  return null;
}

function parseHeading(text) {
  const match = text.match(/^(\d{1,3})\.\s+Г\.\s*А\.\s*Бениславской(?:\s+и\s+др\.)?\.\s+(.+?)\s+\(с\.\s*(\d+)\)\.\s+—\s*(.*)$/u);
  if (!match) return null;
  return {
    documentNumber: Number(match[1]),
    dateLabel: match[2].trim(),
    printedPage: Number(match[3]),
    publicationHistory: match[4].trim(),
    jointRecipient: /Бениславской\s+и\s+др\./u.test(text),
  };
}

function classify(formula) {
  const value = formula.toLowerCase();
  if (/фотокопии автографа/u.test(value)) return 'photocopy-of-autograph';
  if (/фотокопии с машинописной копии|машинописной копии телеграммы/u.test(value)) return 'photocopy-of-typescript-copy';
  if (/автографу\s*[—-]\s*черновику/u.test(value)) return 'autograph-draft';
  if (/подлиннику телеграммы/u.test(value)) return 'telegram-original';
  if (/по автографу/u.test(value)) return 'autograph';
  if (/по первой публикации|по публикации полного текста|по публикации/u.test(value)) return 'prior-publication';
  if (/по копии|по списку/u.test(value)) return 'copy-or-list';
  if (/из письма|из воспоминан|мемуар/u.test(value)) return 'secondary-extract';
  return 'unresolved';
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(rawRoot, { recursive: true });

const fetched = await fetchHtml(commentsUrl);
await writeFile(join(rawRoot, 'pss-volume-6-comments.html'), fetched.bytes);
const visible = visibleText(fetched.html);
const sections = mainSections(fetched.html);
const records = [];

for (const section of sections) {
  if (!/^\d{1,3}\.\s+Г\.\s*А\.\s*Бениславской(?:\s+и\s+др\.)?\./u.test(section.title)) continue;
  const headingText = exactHeading(section.html);
  const heading = headingText ? parseHeading(headingText) : null;
  const formula = sourceFormula(section.html);
  records.push({
    sequence: records.length + 1,
    sectionTitle: section.title,
    heading: headingText,
    documentNumber: heading?.documentNumber ?? null,
    dateLabel: heading?.dateLabel ?? null,
    printedPage: heading?.printedPage ?? null,
    publicationHistory: heading?.publicationHistory ?? null,
    jointRecipient: heading?.jointRecipient ?? /Бениславской\s+и\s+др\./u.test(section.title),
    sourceFormula: formula,
    sourceCategory: formula ? classify(formula) : 'unresolved',
    sectionHtmlBytes: Buffer.byteLength(section.html, 'utf8'),
    sectionVisibleSha256: sha256(Buffer.from(visibleText(section.html), 'utf8')),
  });
}

const errors = [];
if (records.length !== expectedCount) errors.push(`record count ${records.length} != ${expectedCount}`);
if (records.some((record) => record.heading === null)) errors.push('one or more visible headings missing');
if (records.some((record) => record.sourceFormula === null)) errors.push(`source formula missing for ${records.filter((record) => record.sourceFormula === null).length} records`);
if (records.some((record) => record.sourceCategory === 'unresolved')) errors.push(`unresolved source categories: ${records.filter((record) => record.sourceCategory === 'unresolved').length}`);
const actualPages = records.map((record) => record.printedPage);
if (JSON.stringify(actualPages) !== JSON.stringify(expectedFirstPages)) errors.push(`printed-page sequence mismatch: ${JSON.stringify(actualPages)}`);
if (new Set(records.map((record) => record.documentNumber)).size !== records.length) errors.push('duplicate or missing document numbers');
if (records.filter((record) => record.jointRecipient).length !== 1) errors.push('joint-recipient count must be one');

const categoryCounts = Object.fromEntries([...new Set(records.map((record) => record.sourceCategory))].sort().map((category) => [category, records.filter((record) => record.sourceCategory === category).length]));
const manifest = {
  schema: 'yesenin-benislavskaya-provenance-discovery-pass23/v2',
  generatedAt: new Date().toISOString(),
  authority: 'Фундаментальная электронная библиотека Русская литература и фольклор',
  edition: 'С. А. Есенин. Полное собрание сочинений. Т. 6. Письма. 1999. Комментарии, с. 233–745',
  comments: {
    requestedUrl: fetched.requestedUrl,
    finalUrl: fetched.finalUrl,
    encoding: fetched.encoding,
    contentType: fetched.contentType,
    htmlBytes: fetched.bytes.length,
    htmlSha256: sha256(fetched.bytes),
    visibleTextSha256: sha256(Buffer.from(visible, 'utf8')),
    mainSectionCount: sections.length,
    rawFile: 'raw/pss-volume-6-comments.html',
  },
  expectedCount,
  acquiredCommentRecords: records.length,
  categoryCounts,
  records,
  boundaries: {
    sourceFormulasAreAcademicCommentary: true,
    archiveOriginalsInspected: false,
    facsimilesAcquired: false,
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
  '# Benislavskaya correspondence provenance discovery pass 23', '',
  `- Exact PSS comment records: ${records.length}/${expectedCount}`,
  `- Source formulas resolved: ${records.filter((record) => record.sourceFormula).length}/${expectedCount}`,
  `- Comment HTML bytes: ${fetched.bytes.length}`,
  `- Category counts: ${JSON.stringify(categoryCounts)}`,
  `- Errors: ${errors.length}`,
  '- Archive originals inspected: false', '- Facsimiles acquired: false', '- OCR used: false', '- Production authorization: false', '',
  'Seq. | PSS no. | Date | Page | Source category | Source formula',
  '---: | ---: | --- | ---: | --- | ---',
  ...records.map((record) => [record.sequence, record.documentNumber ?? 'UNRESOLVED', (record.dateLabel ?? 'UNRESOLVED').replaceAll('|', '\\|'), record.printedPage ?? 'UNRESOLVED', record.sourceCategory, (record.sourceFormula ?? 'UNRESOLVED').replaceAll('|', '\\|')].join(' | ')), '',
];
await writeFile(join(outputRoot, 'SUMMARY.md'), `${summary.join('\n')}\n`, 'utf8');
console.log(summary.join('\n'));
if (errors.length > 0) { for (const error of errors) console.error(`ERROR ${error}`); process.exit(1); }
