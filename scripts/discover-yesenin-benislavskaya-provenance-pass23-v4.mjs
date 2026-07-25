#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const out = 'artifacts/yesenin-benislavskaya-provenance-pass23';
const raw = join(out, 'raw');
const url = 'https://feb-web.ru/feb/esenin/texts/es6/es6-233-.htm?cmd=p';
const expectedPages = [127,136,159,160,160,166,167,167,170,170,175,179,180,183,184,186,186,187,189,191,197,201,201,202,202,202,207,208,209,211,211,212,212,214,215];
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function entities(value) {
  return value.replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(Number.parseInt(n, 16)));
}

function text(html) {
  return entities(html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchPage() {
  let last = 'unknown';
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'user-agent': 'TheLegendaryPoet-FEB-Benislavskaya-Provenance/4.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)',
          accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.2',
          'accept-language': 'ru,en;q=0.7',
        },
        signal: AbortSignal.timeout(120_000),
      });
      const bytes = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || '';
      if (response.status !== 200 || !contentType.toLowerCase().includes('text/html') || bytes.length < 1_000_000) {
        throw new Error(`HTTP ${response.status}, ${contentType}, ${bytes.length} bytes`);
      }
      const head = bytes.subarray(0, 4096).toString('latin1');
      const encoding = /windows-1251|cp1251|charset\s*=\s*["']?1251/i.test(`${contentType} ${head}`) ? 'windows-1251' : 'utf-8';
      return { bytes, html: new TextDecoder(encoding).decode(bytes), encoding, contentType, finalUrl: response.url };
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
      if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
  throw new Error(last);
}

function sections(html) {
  const starts = [...html.matchAll(/<h4\b(?=[^>]*\bL=1\b)(?=[^>]*\btitle=["']([^"']+)["'])[^>]*><\/h4>/gi)]
    .map((match) => ({ index: match.index, title: entities(match[1]).replace(/\s+/g, ' ').trim() }));
  return starts.map((start, index) => ({ title: start.title, html: html.slice(start.index, starts[index + 1]?.index ?? html.length) }));
}

function titleData(title) {
  const joint = title.match(/^(\d+)\. Г\. А\. Бениславской и Е\. А\. Есениной\. (.+)$/u);
  if (joint) return { number: Number(joint[1]), date: joint[2], coRecipient: 'Е. А. Есениной', joint: true };
  const single = title.match(/^(\d+)\. Г\. А\. Бениславской\. (.+)$/u);
  if (single) return { number: Number(single[1]), date: single[2], coRecipient: null, joint: false };
  return null;
}

function formula(sectionHtml) {
  for (const match of sectionHtml.matchAll(/<p\b[^>]*class=["']?komm(?:2|3|4)["']?[^>]*>([\s\S]*?)(?=<p\b|<h[1-6]\b|<\/BLOCKQUOTE>|$)/gi)) {
    const value = text(match[1]);
    if (/^(?:Печатается|Публикуется)/u.test(value)) return value;
  }
  return null;
}

function category(formulaText) {
  const value = formulaText.toLowerCase();
  if (/по первой публикации/.test(value) && /список.+вольпин/.test(value) && /ни подлинник, ни список.+неизвест/.test(value)) return 'prior-publication-from-lost-volpin-list-and-original';
  if (/фотокопии автографа/.test(value)) return 'photocopy-of-autograph';
  if (/машинописной копии/.test(value) && /подлинник.+неизвест/.test(value)) return 'typescript-copy-original-unknown';
  if (/черновику телеграммы/.test(value) && !/автографу/.test(value)) return 'telegram-draft';
  if (/автографу\s*[—-]\s*черновику/.test(value)) return 'autograph-draft';
  if (/подлиннику телеграммы/.test(value)) return 'telegram-original';
  if (/по автографу/.test(value)) return 'autograph';
  if (/по копии рукой/.test(value)) return 'named-hand-copy';
  if (/по хронике/.test(value) && /списк.+вольпин/.test(value) && /местонахождение.+неизвест/.test(value)) return 'chronicle-from-lost-volpin-lists';
  if (/по хронике/.test(value) && /источник.+коммент\. к п\. 200/.test(value)) return 'chronicle-linked-to-lost-volpin-lists';
  if (/по первой публикации|по публикации полного текста|по публикации/.test(value)) return 'prior-publication';
  if (/по копии|по списку/.test(value)) return 'copy-or-list';
  return 'unresolved';
}

await rm(out, { recursive: true, force: true });
await mkdir(raw, { recursive: true });
const page = await fetchPage();
await writeFile(join(raw, 'pss-volume-6-comments.html'), page.bytes);
const all = sections(page.html);
const selected = all.filter((section) => /^\d+\. Г\. А\. Бениславской(?: и Е\. А\. Есениной)?\./u.test(section.title));
const records = selected.map((section, index) => {
  const title = titleData(section.title);
  const sectionText = text(section.html);
  const source = formula(section.html);
  const pageMatch = sectionText.match(/\(с\.\s*(\d+)\)\./u);
  const historyMatch = sectionText.match(/\(с\.\s*\d+\)\.\s+—\s*([\s\S]*?)(?=\s+Печатается|\s+Публикуется|$)/u);
  return {
    sequence: index + 1,
    sectionTitle: section.title,
    documentNumber: title?.number ?? null,
    dateLabel: title?.date ?? null,
    coRecipient: title?.coRecipient ?? null,
    jointRecipient: title?.joint ?? false,
    printedPage: pageMatch ? Number(pageMatch[1]) : null,
    publicationHistory: historyMatch?.[1]?.trim() ?? null,
    sourceFormula: source,
    sourceCategory: source ? category(source) : 'unresolved',
    sectionHtmlBytes: Buffer.byteLength(section.html, 'utf8'),
    sectionVisibleSha256: sha256(Buffer.from(sectionText, 'utf8')),
  };
});

const errors = [];
if (records.length !== 35) errors.push(`record count ${records.length} != 35`);
if (records.some((record) => record.documentNumber === null || record.dateLabel === null)) errors.push('title parse failure');
if (records.some((record) => record.printedPage === null)) errors.push('printed page missing');
if (records.some((record) => record.sourceFormula === null)) errors.push('source formula missing');
if (records.some((record) => record.sourceCategory === 'unresolved')) errors.push(`unresolved categories ${records.filter((record) => record.sourceCategory === 'unresolved').length}`);
if (JSON.stringify(records.map((record) => record.printedPage)) !== JSON.stringify(expectedPages)) errors.push('printed-page sequence mismatch');
if (new Set(records.map((record) => record.documentNumber)).size !== 35) errors.push('document-number uniqueness failure');
const joint = records.filter((record) => record.jointRecipient);
if (joint.length !== 1 || joint[0]?.coRecipient !== 'Е. А. Есениной' || joint[0]?.documentNumber !== 215) errors.push(`joint recipient mismatch: ${JSON.stringify(joint)}`);
const categoryCounts = Object.fromEntries([...new Set(records.map((record) => record.sourceCategory))].sort().map((name) => [name, records.filter((record) => record.sourceCategory === name).length]));
const visible = text(page.html);
const manifest = {
  schema: 'yesenin-benislavskaya-provenance-discovery-pass23/v4',
  generatedAt: new Date().toISOString(),
  authority: 'Фундаментальная электронная библиотека Русская литература и фольклор',
  edition: 'С. А. Есенин. Полное собрание сочинений. Т. 6. Письма. 1999. Комментарии, с. 233–745',
  comments: {
    requestedUrl: url,
    finalUrl: page.finalUrl,
    encoding: page.encoding,
    contentType: page.contentType,
    htmlBytes: page.bytes.length,
    htmlSha256: sha256(page.bytes),
    visibleTextSha256: sha256(Buffer.from(visible, 'utf8')),
    mainSectionCount: all.length,
    selectedSectionCount: selected.length,
    rawFile: 'raw/pss-volume-6-comments.html',
  },
  expectedCount: 35,
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
await writeFile(join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
const summary = [
  '# Benislavskaya correspondence provenance discovery pass 23', '',
  `- Exact PSS comment records: ${records.length}/35`,
  `- Source formulas resolved: ${records.filter((record) => record.sourceFormula).length}/35`,
  `- Comment HTML bytes: ${page.bytes.length}`,
  `- Category counts: ${JSON.stringify(categoryCounts)}`,
  `- Joint recipient: ${joint[0]?.coRecipient ?? 'UNRESOLVED'}`,
  `- Errors: ${errors.length}`,
  '- Archive originals inspected: false', '- Facsimiles acquired: false', '- OCR used: false', '- Production authorization: false', '',
  'Seq. | PSS no. | Date | Page | Source category | Source formula',
  '---: | ---: | --- | ---: | --- | ---',
  ...records.map((record) => [record.sequence, record.documentNumber ?? 'UNRESOLVED', (record.dateLabel ?? 'UNRESOLVED').replaceAll('|', '\\|'), record.printedPage ?? 'UNRESOLVED', record.sourceCategory, (record.sourceFormula ?? 'UNRESOLVED').replaceAll('|', '\\|')].join(' | ')), '',
];
await writeFile(join(out, 'SUMMARY.md'), `${summary.join('\n')}\n`, 'utf8');
console.log(summary.join('\n'));
if (errors.length) { for (const error of errors) console.error(`ERROR ${error}`); process.exit(1); }
