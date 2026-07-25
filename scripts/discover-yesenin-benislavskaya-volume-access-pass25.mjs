#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputRoot = 'artifacts/yesenin-benislavskaya-volume-access-pass25';
const rawRoot = join(outputRoot, 'raw');
const userAgent = 'TheLegendaryPoet-Volume-Access-Discovery/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)';
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const targets = [
  {
    id: 'CINII-BA27980118',
    authority: 'CiNii Books / National Institute of Informatics, Japan',
    grade: 'A',
    url: 'https://ci.nii.ac.jp/ncid/BA27980118',
    expectedMarkers: ['BA27980118', '5250025293', 'Письма документы'],
  },
  {
    id: 'HEIDELBERG-9713910',
    authority: 'Heidelberg University Library',
    grade: 'A',
    url: 'https://katalog.ub.uni-heidelberg.de/titel/9713910',
    expectedMarkers: ['9713910', '5-250-02529-3', 'Pis\'ma, dokumenty'],
  },
  {
    id: 'GORKY-LIBRARY-HOLDING',
    authority: 'Central City Public Library named after M. Gorky',
    grade: 'A',
    url: 'https://www.gorkilib.ru/events/sergey-esenin-v-stikhakh-i-zhizni-pisma-dokumenty-1912',
    expectedMarkers: ['Сергей Есенин в стихах и жизни', 'Письма', 'Документы', '607'],
  },
  {
    id: 'DUBNA-LIBRARY-EXHIBITION',
    authority: 'Dubna State University Library',
    grade: 'A',
    url: 'https://lib.uni-dubna.ru/biblweb/expo/exposition_cycle.asp?cycle=none&exid=840',
    expectedMarkers: ['Сергей Есенин в стихах и жизни', 'Письма', 'Документы', '607'],
  },
  {
    id: 'HATHITRUST-CATALOG-ISBN',
    authority: 'HathiTrust catalog',
    grade: 'B',
    url: 'https://catalog.hathitrust.org/Search/Home?lookfor=5250025293&searchtype=all',
    expectedMarkers: [],
  },
  {
    id: 'WORLDCAT-ISBN',
    authority: 'WorldCat discovery',
    grade: 'B',
    url: 'https://search.worldcat.org/search?q=isbn%3A5250025293',
    expectedMarkers: [],
  },
  {
    id: 'GOOGLE-BOOKS-ISBN',
    authority: 'Google Books API',
    grade: 'EXCLUDED',
    url: 'https://www.googleapis.com/books/v1/volumes?q=isbn:5250025293',
    expectedMarkers: [],
    responseKind: 'json',
  },
  {
    id: 'OPENLIBRARY-ISBN',
    authority: 'Open Library API',
    grade: 'EXCLUDED',
    url: 'https://openlibrary.org/api/books?bibkeys=ISBN:5250025293&jscmd=data&format=json',
    expectedMarkers: [],
    responseKind: 'json',
  },
];

function decodeEntities(text) {
  return text
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function decodeBytes(bytes, contentType = '') {
  const head = bytes.subarray(0, Math.min(bytes.length, 8192)).toString('latin1');
  const declaration = `${contentType} ${head}`;
  const charset = /windows-1251|cp1251/iu.test(declaration)
    ? 'windows-1251'
    : /iso-8859-1|latin-1/iu.test(declaration)
      ? 'iso-8859-1'
      : 'utf-8';
  return { text: new TextDecoder(charset).decode(bytes), charset };
}

function visibleText(html) {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<\/(?:p|div|li|tr|td|th|h[1-6]|article|section)>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractLinks(html, baseUrl) {
  const links = [];
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const url = new URL(decodeEntities(match[1]), baseUrl).toString();
      const text = visibleText(match[2]).replace(/\s+/g, ' ').trim();
      links.push({ url, text });
    } catch {
      // Ignore malformed navigation links.
    }
  }
  return links;
}

async function fetchTarget(target, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(target.url, {
        redirect: 'follow',
        headers: {
          'user-agent': userAgent,
          accept: target.responseKind === 'json' ? 'application/json,*/*;q=0.2' : 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.2',
          'accept-language': 'ru,en,de,ja;q=0.7',
        },
        signal: AbortSignal.timeout(120_000),
      });
      const bytes = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || '';
      if (response.status < 200 || response.status >= 400 || bytes.length === 0) {
        throw new Error(`HTTP ${response.status}; ${contentType}; ${bytes.length} bytes`);
      }
      const decoded = decodeBytes(bytes, contentType);
      return {
        requestedUrl: target.url,
        finalUrl: response.url,
        status: response.status,
        contentType,
        bytes,
        text: decoded.text,
        charset: decoded.charset,
      };
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
  throw new Error(lastError instanceof Error ? lastError.message : String(lastError));
}

function classifyHtml(text, links) {
  const normalized = text.replace(/\s+/g, ' ');
  const fullTextLinks = links.filter(({ url, text: linkText }) =>
    /(?:\.pdf(?:$|\?)|full\s*text|volltext|полный\s+текст|электронн\w*\s+(?:копи|документ)|viewer|download)/iu.test(`${url} ${linkText}`),
  );
  const requestLinks = links.filter(({ url, text: linkText }) =>
    /bestellen|vormerken|request|order|document\s+delivery|scan|digitization|копи|заказ|межбиблиотеч/iu.test(`${url} ${linkText}`),
  );
  const physicalSignals = [
    /signatur|standort|exemplar|bestand|available at|libraries|библиотек|экземпляр|шифр|хранени/iu.test(normalized),
    /bestellen|vormerken|заказать|выдач/iu.test(normalized),
  ].filter(Boolean).length;
  return {
    fullTextCandidateLinks: fullTextLinks,
    requestOrDeliveryLinks: requestLinks,
    physicalHoldingSignals: physicalSignals,
    digitalFullTextFound: fullTextLinks.length > 0,
    requestOrDeliveryFound: requestLinks.length > 0,
  };
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(rawRoot, { recursive: true });

const records = [];
for (let index = 0; index < targets.length; index += 1) {
  const target = targets[index];
  const fileStem = `${String(index + 1).padStart(2, '0')}-${target.id.toLowerCase()}`;
  try {
    const response = await fetchTarget(target);
    const isJson = target.responseKind === 'json' || /application\/json/iu.test(response.contentType);
    const rawFile = `raw/${fileStem}.${isJson ? 'json' : 'html'}`;
    await writeFile(join(outputRoot, rawFile), response.bytes);
    const visible = isJson ? response.text : visibleText(response.text);
    const links = isJson ? [] : extractLinks(response.text, response.finalUrl);
    const markerChecks = target.expectedMarkers.map((marker) => ({ marker, present: visible.toLocaleLowerCase().includes(marker.toLocaleLowerCase()) }));
    const classification = isJson ? {
      digitalFullTextFound: /"viewability"\s*:\s*"ALL_PAGES"|"publicDomain"\s*:\s*true/iu.test(response.text),
      requestOrDeliveryFound: false,
      physicalHoldingSignals: 0,
      fullTextCandidateLinks: [],
      requestOrDeliveryLinks: [],
    } : classifyHtml(visible, links);
    records.push({
      id: target.id,
      authority: target.authority,
      grade: target.grade,
      requestedUrl: response.requestedUrl,
      finalUrl: response.finalUrl,
      status: response.status,
      contentType: response.contentType,
      charset: response.charset,
      bytes: response.bytes.length,
      sha256: sha256(response.bytes),
      visibleTextSha256: sha256(Buffer.from(visible, 'utf8')),
      rawFile,
      markerChecks,
      markerIdentityPassed: markerChecks.length === 0 ? null : markerChecks.every((check) => check.present),
      linksFound: links.length,
      ...classification,
      error: null,
    });
  } catch (error) {
    records.push({
      id: target.id,
      authority: target.authority,
      grade: target.grade,
      requestedUrl: target.url,
      error: error instanceof Error ? error.message : String(error),
      digitalFullTextFound: false,
      requestOrDeliveryFound: false,
    });
  }
}

const successful = records.filter((record) => !record.error);
const exactIdentityRecords = successful.filter((record) => record.markerIdentityPassed === true);
const fullTextRecords = successful.filter((record) => record.digitalFullTextFound);
const requestRecords = successful.filter((record) => record.requestOrDeliveryFound);

const manifest = {
  schema: 'yesenin-benislavskaya-volume-access-pass25/v1',
  generatedAt: new Date().toISOString(),
  target: {
    title: 'Сергей Есенин в стихах и жизни. Книга 3: Письма. Документы',
    year: 1995,
    isbn10: '5-250-02529-3',
    isbn13: '978-5-250-02529-4',
    ncid: 'BA27980118',
    targetPrintedPages: '236–280',
  },
  records,
  summary: {
    targets: records.length,
    successful: successful.length,
    exactIdentityRecords: exactIdentityRecords.length,
    fullTextRecords: fullTextRecords.length,
    requestOrDeliveryRecords: requestRecords.length,
    legalDigitalFullTextAcquired: false,
    targetPageScanAcquired: false,
    targetPageScanRequested: false,
  },
  ocrUsed: false,
  syntheticContentUsed: false,
  wikipediaUsedAsEvidence: false,
  productionAuthorized: false,
};
await writeFile(join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const summary = [
  '# Benislavskaya source-volume access discovery pass 25',
  '',
  `- Targets: ${records.length}`,
  `- Successful fetches: ${successful.length}`,
  `- Exact identity records: ${exactIdentityRecords.length}`,
  `- Digital full-text candidates: ${fullTextRecords.length}`,
  `- Request/delivery-capable records: ${requestRecords.length}`,
  '- Legal digital full text acquired: false',
  '- Pages 236–280 acquired: false',
  '- Scan requested: false',
  '- OCR used: false',
  '',
];
await writeFile(join(outputRoot, 'SUMMARY.md'), `${summary.join('\n')}\n`, 'utf8');
console.log(summary.join('\n'));

if (exactIdentityRecords.length < 2) {
  throw new Error(`expected at least two exact institutional identity records, found ${exactIdentityRecords.length}`);
}
