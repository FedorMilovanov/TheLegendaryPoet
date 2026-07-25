#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputRoot = 'artifacts/yesenin-benislavskaya-provenance-pass23';
const rawRoot = join(outputRoot, 'raw');
const commentsUrl = 'https://feb-web.ru/feb/esenin/texts/es6/es6-233-.htm?cmd=p';
const expectedCount = 35;
const expectedPages = [127,136,159,160,160,166,167,167,170,170,175,179,180,183,184,186,186,187,189,191,197,201,201,202,202,202,207,208,209,211,211,212,212,214,215];
const userAgent = 'TheLegendaryPoet-FEB-Benislavskaya-Provenance/3.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)';
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
  return decodeEntities(html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

function allMainSections(html) {
  const starts = [];
  for (const match of html.matchAll(/<h4\b(?=[^>]*\bL=1\b)(?=[^>]*\btitle=["']([^"']+)["'])[^>]*><\/h4>/gi)) {
    starts.push({ index: match.index, title: decodeEntities(match[1]).replace(/\s+/g, ' ').trim() });
  }
  return starts.map((start, index) => ({ title: start.title, html: html.slice(start.index, starts[index + 1]?.index ?? html.length) }));
}

function parseTitle(title) {
  const match = title.match(/^(\d{1,3})\.\s+Г\.\s*А\.\s*Бениславской(?:\s+и\s+(.+?))?\.\s+(.+)$/u);
  if (!match) return null;
  return {
    documentNumber: Number(match[1]),
    coRecipient: match[2]?.trim() ?? null,
    dateLabel: match[3].trim(),
    jointRecipient: Boolean(match[2]),
  };
}

function printedPage(sectionText) {
  const match = sectionText.match(/\(с\.\s*(\d+)\)\./u);
  return match ? Number(match[1]) : null;
}

function publicationHistory(sectionText) {
  const pageMatch = sectionText.match(/\(с\.\s*\d+\)\.\s+—\s*([\s\S]*?)(?=\s+Печатается|\s+Публикуется|$)/u);
  return pageMatch ? pageMatch[1].trim() : null;
}

function sourceFormula(sectionHtml) {
  for (const match of sectionHtml.matchAll(/<p\b[^>]*class=["']?komm(?:2|3|4)["']?[^>]*>([\s\S]*?)(?=<p\b|<h[1-6]\b|<\/BLOCKQUOTE>|$)/gi)) {
    const text = visibleText(match[1]);
    if (/^(?:Печатается|Публикуется)/u.test(text)) return text;
  }
  const sectionText = visibleText(sectionHtml);
  const fallback = sectionText.match(/(?:Печатается|Публикуется)[\s\S]{0,900}?(?=\s+(?:В письме|Датируется|Ответ|См\.|$))/u);
  return fallback ? fallback[0].trim() : null;
}

function classify(formula) {
  const value = formula.toLowerCase();
  if (/фотокопии автографа/u.test(value)) return 'photocopy-of-autograph';
  if (/фотокопии с машинописной копии|фотокопии машинописной копии/u.test(value)) return 'photocopy-of-typescript-copy';
  if (/машинописной копии/u.test(value) && /подлинник.+неизвест/u.test(value)) return 'typescript-copy-original-unknown';
  if (/черновику телеграммы/u.test(value) && !/автографу/u.test(value)) return 'telegram-draft';
  if (/автографу\s*[—-]\s*черновику/u.test(value)) return 'autograph-draft';
  if (/подлиннику телеграммы/u.test(value)) return 'telegram-original';
  if (/по автографу/u.test(value)) return 'autograph';
  if (/по копии рукой/u.test(value)) return 'named-hand-copy';
  if (/по хронике/u.test(value) && /списк.+вольпин/u.test(value) && /местонахождение.+неизвест/u.test(value)) return 'chronicle-from-lost-volpin-lists';
  if (/по хронике/u.test(value) && /источник.+коммент\. к п\. 200/u.test(value)) return 'chronicle-linked-to-lost-volpin-lists';
  if (/по первой публикации|по публикации полного текста|по публикации/u.test(value)) return 'prior-publication';
  if (/по копии|по списку/u.test(value)) return 'copy-or-list';
  if (/из письма|из воспоминан|мемуар/u.test(value)) return 'secondary-extract';
  return 'unresolved';
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(rawRoot, { recursive: true });
const fetched = await fetchHtml(commentsUrl);
await writeFile(join(rawRoot, 'pss-volume-6-comments.html'), fetched.bytes);
const allSections = allMainSections(fetched.html);
const selected = allSections.filter((section) => /^\d{1,3}\.\s+Г\.\s*А\.\s*Бениславской(?:\s+и\s+.+?)?\./u.test(section.title));
const records = selected.map((section, index) => {
  const titleData = parseTitle(section.title);
  const sectionText = visibleText(section.html);
  const formula = sourceFormula(section.html);
  return {
    sequence: index + 1,
    sectionTitle: section.title,
    documentNumber: titleData?.documentNumber ?? null,
    dateLabel: titleData?.dateLabel ?? null,
    coRecipient: titleData?.coRecipient ?? null,
    jointRecipient: titleData?.jointRecipient ?? false,
    printedPage: printedPage(sectionText),
    publicationHistory: publicationHistory(sectionText),
    sourceFormula: formula,
    sourceCategory: formula ? classify(formula) : 'unresolved',
    sectionHtmlBytes: Buffer.byteLength(section.html, 'utf8'),
    sectionVisibleSha256: sha256(Buffer.from(sectionText, 'utf8')),
  };
});

const errors = [];
if (records.length !== expectedCount) errors.push(`record count ${records.length} != ${expectedCount}`);
if (records.some((record) => record.documentNumber === null || record.dateLabel === null)) errors.push('one or more H4 titles did not parse');
if (records.some((record) => record.printedPage === null)) errors.push('one or more printed pages missing');
if (records.some((record) => record.sourceFormula === null)) errors.push(`source formula missing for ${records.filter((record) => record.sourceFormula === null).length} records`);
if (records.some((record) => record.sourceCategory === 'unresolved')) errors.push(`unresolved source categories: ${records.filter((record) => record.sourceCategory === 'unresolved').length}`);
if (JSON.stringify(records.map((record) => record.printedPage)) !== JSON.stringify(expectedPages)) errors.push(`printed-page sequence mismatch: ${JSON.stringify(records.map((record) => record.printedPage))}`);
if (new Set(records.map((record) => record.documentNumber)).size !== records.length) errors.push('duplicate or missing document numbers');
const joint = records.filter((record) => record.jointRecipient);
if (joint.length !== 1 || joint[0]?.coRecipient !== 'Е. А. Есениной') errors.push(`joint recipient mismatch: ${JSON.stringify(joint)}`);

const categoryCounts = Object.fromEntries([...new Set(records.map((record) => record.sourceCategory))].sort().map((category) => [category, records.filter((record) => record.sourceCategory === category).length]));
const visible = visibleText(fetched.html);
const manifest = {
  schema: 'yesenin-benislavskaya-provenance-discovery-pass23/v3',
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
    mainSectionCount: allSections.length,
    selectedSectionCount: selected.length,
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
  `- Joint recipient: ${joint[0]?.coRecipient ?? 'UNRESOLVED'}`,
  `- Errors: ${errors.length}`,
  '- Archive originals inspected: false', '- Facsimiles acquired: false', '- OCR used: false', '- Production authorization: false', '',
  'Seq. | PSS no. | Date | Page | Source category | Source formula',
  '---: | ---: | --- | ---: | --- | ---',
  ...records.map((record) => [record.sequence, record.documentNumber ?? 'UNRESOLVED', (record.dateLabel ?? 'UNRESOLVED').replaceAll('|', '\\|'), record.printedPage ?? 'UNRESOLVED', record.sourceCategory, (record.sourceFormula ?? 'UNRESOLVED').replaceAll('|', '\\|')].join(' | ')), '',
];
await writeFile(join(outputRoot, 'SUMMARY.md'), `${summary.join('\n')}\n`, 'utf8');
console.log(summary.join('\n'));
if (errors.length > 0) { for (const error of errors) console.error(`ERROR ${error}`); process.exit(1); }
