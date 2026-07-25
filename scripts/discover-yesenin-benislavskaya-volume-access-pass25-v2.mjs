#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputRoot = 'artifacts/yesenin-benislavskaya-volume-access-pass25';
const rawRoot = join(outputRoot, 'raw');
const userAgent = 'TheLegendaryPoet-Volume-Access-Discovery/2.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)';
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const targets = [
  {
    id: 'CINII-BA27980118',
    kind: 'institutional-union-catalog',
    grade: 'A',
    url: 'https://ci.nii.ac.jp/ncid/BA27980118',
    identity: ['BA27980118', '5250025293', 'Письма документы'],
  },
  {
    id: 'GORKY-BOOK-PAGE',
    kind: 'institutional-book-page',
    grade: 'A',
    url: 'https://www.gorkilib.ru/events/sergey-esenin-v-stikhakh-i-zhizni-pisma-dokumenty-1912',
    identity: ['Сергей Есенин в стихах и жизни', 'Письма', 'Документы', '607'],
  },
  {
    id: 'GORKY-EDD-SERVICE',
    kind: 'institutional-document-delivery-policy',
    grade: 'A+',
    url: 'https://www.gorkilib.ru/feedback/electronic_document/',
    identity: ['Электронная доставка документов', 'фрагментов книг', '20 руб', 'mba@gorkilib.ru'],
  },
  {
    id: 'DUBNA-BOOK-LISTING',
    kind: 'institutional-library-listing',
    grade: 'A',
    url: 'https://lib.uni-dubna.ru/biblweb/expo/exposition_cycle.asp?cycle=none&exid=840',
    identity: ['Кн.3', 'Письма. Документы', '5-250-02529-3', '607'],
  },
  {
    id: 'HEIDELBERG-ITEM-REDIRECT',
    kind: 'institutional-catalog-redirect-boundary',
    grade: 'A',
    url: 'https://katalog.ub.uni-heidelberg.de/titel/9713910',
    identity: [],
  },
  {
    id: 'WORLDCAT-ISBN',
    kind: 'discovery-catalog',
    grade: 'B',
    url: 'https://search.worldcat.org/search?q=isbn%3A5250025293',
    identity: [],
  },
];

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

function decodeBytes(bytes, contentType) {
  const head = bytes.subarray(0, Math.min(bytes.length, 8192)).toString('latin1');
  const declared = `${contentType} ${head}`;
  const charset = /windows-1251|cp1251/iu.test(declared) ? 'windows-1251' : 'utf-8';
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

function links(html, baseUrl) {
  const result = [];
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      result.push({
        url: new URL(decodeEntities(match[1]), baseUrl).toString(),
        text: visibleText(match[2]).replace(/\s+/g, ' ').trim(),
      });
    } catch {
      // Ignore malformed links.
    }
  }
  return result;
}

async function get(target, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(target.url, {
        redirect: 'follow',
        headers: { 'user-agent': userAgent, accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.2', 'accept-language': 'ru,en,de,ja;q=0.7' },
        signal: AbortSignal.timeout(120_000),
      });
      const bytes = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || '';
      if (response.status < 200 || response.status >= 400 || bytes.length === 0) {
        throw new Error(`HTTP ${response.status}; ${contentType}; ${bytes.length} bytes`);
      }
      const decoded = decodeBytes(bytes, contentType);
      return { bytes, contentType, text: decoded.text, charset: decoded.charset, finalUrl: response.url, status: response.status };
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(rawRoot, { recursive: true });

const records = [];
for (let index = 0; index < targets.length; index += 1) {
  const target = targets[index];
  try {
    const response = await get(target);
    const text = visibleText(response.text);
    const pageLinks = links(response.text, response.finalUrl);
    const markerChecks = target.identity.map((marker) => ({ marker, present: text.toLocaleLowerCase().includes(marker.toLocaleLowerCase()) }));
    const rawFile = `raw/${String(index + 1).padStart(2, '0')}-${target.id.toLowerCase()}.html`;
    await writeFile(join(outputRoot, rawFile), response.bytes);

    const exactElectronicOrderLinks = pageLinks.filter(({ url, text: linkText }) =>
      /\/feedback\/electronic_document\/?$/iu.test(new URL(url).pathname) ||
      /^(?:Онлайн заявка|Заказать электронный документ)$/iu.test(linkText),
    );
    const explicitScanPolicy = target.id === 'GORKY-EDD-SERVICE' &&
      /копи[ий]\s+(?:отдельных\s+)?статей[\s\S]{0,500}фрагментов\s+книг/iu.test(text) &&
      /20\s*руб/iu.test(text) &&
      /каждого\s+конкретного\s+документа\s+определяется/iu.test(text);
    const realFullTextLinks = pageLinks.filter(({ url, text: linkText }) =>
      /\.pdf(?:$|\?)/iu.test(url) || /^(?:Полный текст|Full text|Volltext|Скачать PDF)$/iu.test(linkText),
    );

    records.push({
      id: target.id,
      kind: target.kind,
      grade: target.grade,
      requestedUrl: target.url,
      finalUrl: response.finalUrl,
      status: response.status,
      contentType: response.contentType,
      charset: response.charset,
      bytes: response.bytes.length,
      sha256: sha256(response.bytes),
      visibleTextSha256: sha256(Buffer.from(text, 'utf8')),
      rawFile,
      markerChecks,
      exactIdentityPassed: markerChecks.length === 0 ? null : markerChecks.every((check) => check.present),
      redirectedAwayFromInstitutionalHost: target.id === 'HEIDELBERG-ITEM-REDIRECT' && !new URL(response.finalUrl).hostname.endsWith('uni-heidelberg.de'),
      exactElectronicOrderLinks,
      explicitScanPolicy,
      realFullTextLinks,
      legalDigitalFullTextFound: realFullTextLinks.length > 0,
      error: null,
    });
  } catch (error) {
    records.push({ id: target.id, kind: target.kind, grade: target.grade, requestedUrl: target.url, error: error instanceof Error ? error.message : String(error) });
  }
}

const gorkyBook = records.find((record) => record.id === 'GORKY-BOOK-PAGE');
const gorkyService = records.find((record) => record.id === 'GORKY-EDD-SERVICE');
const requestPath = {
  exactBookPageVerified: gorkyBook?.exactIdentityPassed === true,
  institutionalDeliveryPolicyVerified: gorkyService?.explicitScanPolicy === true,
  onlineOrderLinkVerified: (gorkyService?.exactElectronicOrderLinks?.length || 0) > 0,
  requestMayBeSubmittedRemotely: true,
  pagePriceRubles: 20,
  targetPageStart: 236,
  targetPageEnd: 280,
  targetPageCountInclusive: 45,
  estimatedBasePageCostRubles: 900,
  fulfilmentDecisionPendingLibraryReview: true,
  requestSubmitted: false,
  scanAcquired: false,
};

const manifest = {
  schema: 'yesenin-benislavskaya-volume-access-pass25/v2',
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
  requestPath,
  effectiveState: {
    exactInstitutionalIdentityRecords: records.filter((record) => record.exactIdentityPassed === true).length,
    legalDigitalFullTextFound: records.some((record) => record.legalDigitalFullTextFound),
    relevantRemoteScanRouteVerified: requestPath.exactBookPageVerified && requestPath.institutionalDeliveryPolicyVerified,
    irrelevantCiNiiSortOrderExcluded: true,
    irrelevantDubnaJournalOrderExcluded: true,
    targetPageScanRequested: false,
    targetPageScanAcquired: false,
  },
  ocrUsed: false,
  syntheticContentUsed: false,
  wikipediaUsedAsEvidence: false,
};
await writeFile(join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const summary = [
  '# Benislavskaya source-volume access discovery pass 25 v2',
  '',
  `- Successful targets: ${records.filter((record) => !record.error).length}/${records.length}`,
  `- Exact institutional identity records: ${manifest.effectiveState.exactInstitutionalIdentityRecords}`,
  `- Legal digital full text found: ${manifest.effectiveState.legalDigitalFullTextFound}`,
  `- Relevant remote scan route verified: ${manifest.effectiveState.relevantRemoteScanRouteVerified}`,
  `- Target pages: ${requestPath.targetPageStart}–${requestPath.targetPageEnd} (${requestPath.targetPageCountInclusive} pages)`,
  `- Published page rate: ${requestPath.pagePriceRubles} RUB/page`,
  `- Estimated base page cost: ${requestPath.estimatedBasePageCostRubles} RUB`,
  '- Request submitted: false',
  '- Scan acquired: false',
  '',
];
await writeFile(join(outputRoot, 'SUMMARY.md'), `${summary.join('\n')}\n`, 'utf8');
console.log(summary.join('\n'));

if (!manifest.effectiveState.relevantRemoteScanRouteVerified) {
  throw new Error(`relevant remote scan route not verified: ${JSON.stringify(requestPath)}`);
}
