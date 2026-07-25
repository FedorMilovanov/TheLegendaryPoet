#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputRoot = 'artifacts/yesenin-benislavskaya-inbound-pass24';
const rawRoot = join(outputRoot, 'raw');
const sitemapUrl = 'https://feb-web.ru/feb/esenin/sitemap.htm';
const nameIndexUrl = 'https://feb-web.ru/feb/esenin/texts/es6/es6-754-.htm?cmd=p';
const giftUrl = 'https://feb-web.ru/feb/esenin/texts/e77/e77-203-.htm?cmd=p';
const giftCommentsUrl = 'https://feb-web.ru/feb/esenin/texts/e77/e77-357-.htm?cmd=p';
const expectedInboundLetters = 14;
const userAgent = 'TheLegendaryPoet-FEB-Benislavskaya-Discovery/1.1 (+https://github.com/FedorMilovanov/TheLegendaryPoet)';
const sha256 = (data) => createHash('sha256').update(data).digest('hex');

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
  const asciiHead = bytes.subarray(0, Math.min(bytes.length, 4_096)).toString('latin1');
  const declared = `${contentType} ${asciiHead}`;
  const charset = /windows-1251|cp1251/iu.test(declared) ? 'windows-1251' : 'utf-8';
  let html = new TextDecoder(charset).decode(bytes);
  if (charset === 'utf-8' && html.includes('\uFFFD') && /charset\s*=\s*["']?windows-1251/iu.test(asciiHead)) {
    html = new TextDecoder('windows-1251').decode(bytes);
  }
  return { html, charset };
}

function visibleText(html) {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<\/(?:p|div|li|h[1-6]|tr|blockquote)>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const normalizeInline = (value) => value.replace(/\s+/g, ' ').trim();

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
        signal: AbortSignal.timeout(120_000),
      });
      const bytes = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || '';
      if (response.status !== 200 || !contentType.toLowerCase().includes('text/html') || bytes.length < 2_000) {
        throw new Error(`HTTP ${response.status}; ${contentType}; ${bytes.length} bytes`);
      }
      const decoded = decodeHtml(bytes, contentType);
      return { bytes, html: decoded.html, charset: decoded.charset, finalUrl: response.url, contentType };
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 1_500));
    }
  }
  throw new Error(`failed to fetch ${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

function extractAnchors(html, baseUrl) {
  const anchors = [];
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      anchors.push({
        url: new URL(decodeEntities(match[1]), baseUrl).toString(),
        text: normalizeInline(visibleText(match[2])),
      });
    } catch {
      // Ignore malformed non-document links.
    }
  }
  return anchors;
}

function safeFileName(url, index) {
  const parsed = new URL(url);
  const tail = parsed.pathname.split('/').filter(Boolean).slice(-2).join('-').replace(/[^a-z0-9._-]+/gi, '-');
  return `${String(index).padStart(2, '0')}-${tail || 'page'}.html`;
}

const months = 'января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря';
const dateRe = new RegExp(`(?:между\\s+)?(?:\\d{1,2}(?:[—-]\\d{1,2})?\\s+(?:${months})(?:\\s+19(?:21|22|23|24|25|26))?|(?:${months})\\s+19(?:21|22|23|24|25|26)|19(?:21|22|23|24|25|26)\\s*г(?:ода|\\.)?)`, 'giu');
const sourceRefRe = /Письма\s*,\s*(?:с\.\s*)?(\d{1,4})/giu;

function isInboundContext(context) {
  const inboundSignals = [
    /Бениславская\s+(?:писала|сообщала|спрашивала|предупреждала|отвечала|отчитывалась)\s+(?:Есенин|ему|поэт)/iu,
    /Бениславск[^.]{0,180}\s+писал[аи]\s+(?:Есенин|ему|поэту)/iu,
    /в\s+(?:своем\s+)?письме\s+(?:к\s+Есенин[^.]{0,120})?Бениславск/iu,
    /письм[оеа]\s+(?:Г\.\s*А\.\s*)?Бениславск[^.]{0,160}(?:Есенин|поэт)/iu,
    /Бениславск[^.]{0,200}\s+(?:к\s+Есенин|Есенину)/iu,
    /она\s+писала\s+Есенин/iu,
  ];
  const outboundSignals = [
    /Есенин\s+(?:писал|сообщал|отвечал)\s+(?:Г\.\s*А\.\s*)?Бениславск/iu,
    /письм[оеа]\s+Есенин[^.]{0,140}\s+(?:к|для)\s+Бениславск/iu,
  ];
  return inboundSignals.some((pattern) => pattern.test(context)) &&
    !(outboundSignals.some((pattern) => pattern.test(context)) && !/Бениславская\s+(?:писала|сообщала|спрашивала|отвечала|отчитывалась)/iu.test(context));
}

function extractInboundCandidates(text, sourceUrl) {
  const candidates = [];
  for (const match of text.matchAll(sourceRefRe)) {
    const index = match.index ?? 0;
    const context = normalizeInline(text.slice(Math.max(0, index - 1_400), Math.min(text.length, index + 1_400)));
    if (!/Бениславск/iu.test(context) || !isInboundContext(context)) continue;
    const sourceRef = Number(match[1]);
    const dates = [...new Set([...context.matchAll(dateRe)].map((date) => normalizeInline(date[0])))];
    const quoteMarkers = (context.match(/[«»“”]/g) || []).length;
    candidates.push({
      sourceUrl,
      sourceRef,
      dates,
      quotedExcerptPresent: quoteMarkers >= 2,
      context,
      contextSha256: sha256(Buffer.from(context, 'utf8')),
    });
  }
  return candidates;
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(rawRoot, { recursive: true });

const sitemap = await fetchBytes(sitemapUrl);
const sitemapText = visibleText(sitemap.html);
await writeFile(join(rawRoot, 'sitemap.html'), sitemap.bytes);

const nameIndex = await fetchBytes(nameIndexUrl);
const nameIndexText = visibleText(nameIndex.html);
await writeFile(join(rawRoot, 'name-index.html'), nameIndex.bytes);

const indexCountMatch = /14\s+писем\s+Бениславской\s+Есенину/iu.test(nameIndexText);
const indexGiftMatch = /1\s+дарственн\w*\s+надпис\w*\s+Есенина\s+Бениславской/iu.test(nameIndexText);

const sitemapAnchors = extractAnchors(sitemap.html, sitemap.finalUrl);
const commentUrls = [...new Set(
  sitemapAnchors
    .filter(({ url, text }) =>
      /feb-web\.ru\/feb\/esenin\/texts\/(?:es[1-6]|e7[123])\//iu.test(url) && /^Комментарии$/iu.test(text),
    )
    .map(({ url }) => {
      const parsed = new URL(url);
      parsed.searchParams.set('cmd', 'p');
      return parsed.toString();
    }),
)];

const requiredCommentUrls = [
  'https://feb-web.ru/feb/esenin/texts/es1/es1-385-.htm?cmd=p',
  'https://feb-web.ru/feb/esenin/texts/es2/es2-255-.htm?cmd=p',
  'https://feb-web.ru/feb/esenin/texts/e74/e74-323-.htm?cmd=p',
  'https://feb-web.ru/feb/esenin/texts/e75/e75-325-.htm?cmd=p',
  'https://feb-web.ru/feb/esenin/texts/es6/es6-233-.htm?cmd=p',
  'https://feb-web.ru/feb/esenin/texts/e72/e72-266-.htm?cmd=p',
  giftCommentsUrl,
];
for (const url of requiredCommentUrls) if (!commentUrls.includes(url)) commentUrls.push(url);

const commentPages = [];
const allCandidates = [];
for (let index = 0; index < commentUrls.length; index += 1) {
  const url = commentUrls[index];
  try {
    const fetched = await fetchBytes(url);
    const text = visibleText(fetched.html);
    const rawFile = `raw/${safeFileName(url, index + 1)}`;
    await writeFile(join(outputRoot, rawFile), fetched.bytes);
    const candidates = extractInboundCandidates(text, fetched.finalUrl);
    allCandidates.push(...candidates);
    commentPages.push({
      requestedUrl: url,
      finalUrl: fetched.finalUrl,
      charset: fetched.charset,
      htmlBytes: fetched.bytes.length,
      htmlSha256: sha256(fetched.bytes),
      visibleTextSha256: sha256(Buffer.from(text, 'utf8')),
      benislavskayaMentions: (text.match(/Бениславск/giu) || []).length,
      inboundCandidates: candidates.length,
      rawFile,
      fetchStatus: 'success',
    });
  } catch (error) {
    commentPages.push({ requestedUrl: url, fetchStatus: 'failed', error: error instanceof Error ? error.message : String(error) });
  }
}

const groupedBySourceRef = new Map();
for (const candidate of allCandidates) {
  const existing = groupedBySourceRef.get(candidate.sourceRef) || {
    sourceRef: candidate.sourceRef,
    dates: new Set(),
    sourceUrls: new Set(),
    contexts: [],
    quotedExcerptPresent: false,
  };
  for (const date of candidate.dates) existing.dates.add(date);
  existing.sourceUrls.add(candidate.sourceUrl);
  existing.contexts.push({ context: candidate.context, contextSha256: candidate.contextSha256 });
  existing.quotedExcerptPresent ||= candidate.quotedExcerptPresent;
  groupedBySourceRef.set(candidate.sourceRef, existing);
}

const inboundRecords = [...groupedBySourceRef.values()]
  .map((record) => ({
    sourceRef: record.sourceRef,
    dates: [...record.dates],
    sourceUrls: [...record.sourceUrls],
    quotedExcerptPresent: record.quotedExcerptPresent,
    occurrences: record.contexts.length,
    contexts: record.contexts,
  }))
  .sort((a, b) => a.sourceRef - b.sourceRef);

const gift = await fetchBytes(giftUrl);
const giftText = visibleText(gift.html);
await writeFile(join(rawRoot, 'gift-inscription-e77-203.html'), gift.bytes);
const giftComments = await fetchBytes(giftCommentsUrl);
const giftCommentsText = visibleText(giftComments.html);
await writeFile(join(rawRoot, 'gift-comments-e77-357.html'), giftComments.bytes);

const giftChecks = {
  benislavskayaPresent: /Бениславск/iu.test(giftText),
  printedPage203Present: /(?:^|\s)-?\s*203\s*-?(?:\s|$)/u.test(giftText) || /С\.\s*203/iu.test(giftText),
  year1922Present: /1922/u.test(giftText),
  inscriptionTextPresent: /Милой\s+Гале[\s\S]{0,100}виновнице\s+некоторых\s+глав/iu.test(giftText),
  exactCommentSectionPresent: /179\.\s*Г\.\s*А\.\s*Бениславской\s*\(с\.\s*203\)/iu.test(giftCommentsText),
  priorPublicationBasisPresent: /Печатается\s+и\s+датируется\s+по\s+тексту:\s*РЛ,\s*1970/iu.test(giftCommentsText),
  currentLocationUnknownPresent: /Местонахождение\s+ее\s+в\s+настоящее\s+время\s+неизвестно/iu.test(giftCommentsText),
};

const manifest = {
  schema: 'yesenin-benislavskaya-inbound-discovery-pass24/v2',
  generatedAt: new Date().toISOString(),
  authority: 'Фундаментальная электронная библиотека Русская литература и фольклор',
  sitemap: {
    requestedUrl: sitemapUrl,
    finalUrl: sitemap.finalUrl,
    charset: sitemap.charset,
    htmlBytes: sitemap.bytes.length,
    htmlSha256: sha256(sitemap.bytes),
    visibleTextSha256: sha256(Buffer.from(sitemapText, 'utf8')),
  },
  nameIndex: {
    requestedUrl: nameIndexUrl,
    finalUrl: nameIndex.finalUrl,
    charset: nameIndex.charset,
    htmlBytes: nameIndex.bytes.length,
    htmlSha256: sha256(nameIndex.bytes),
    visibleTextSha256: sha256(Buffer.from(nameIndexText, 'utf8')),
    expectedInboundLetters,
    exactInboundCountStatementPresent: indexCountMatch,
    exactGiftCountStatementPresent: indexGiftMatch,
  },
  commentPages,
  inbound: {
    rawCandidateOccurrences: allCandidates.length,
    uniqueSourceReferenceRecords: inboundRecords.length,
    expectedLetters: expectedInboundLetters,
    exactFourteenResolved: inboundRecords.length === expectedInboundLetters,
    records: inboundRecords,
    fullLetterTextsAcquired: false,
    excerptLayerOnly: true,
    archiveOriginalsInspected: false,
  },
  giftInscription: {
    requestedUrl: giftUrl,
    finalUrl: gift.finalUrl,
    charset: gift.charset,
    htmlBytes: gift.bytes.length,
    htmlSha256: sha256(gift.bytes),
    visibleTextSha256: sha256(Buffer.from(giftText, 'utf8')),
    commentsUrl: giftComments.finalUrl,
    commentsCharset: giftComments.charset,
    commentsHtmlBytes: giftComments.bytes.length,
    commentsHtmlSha256: sha256(giftComments.bytes),
    commentsVisibleTextSha256: sha256(Buffer.from(giftCommentsText, 'utf8')),
    checks: giftChecks,
    acquiredOfficialPublishedPage: Object.values(giftChecks).every(Boolean),
    archiveOriginalInspected: false,
    productionAuthorized: false,
  },
  ocrUsed: false,
  syntheticContentUsed: false,
  wikipediaUsedAsEvidence: false,
  articlePublished: false,
  articleRegistered: false,
};
await writeFile(join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const summary = [
  '# Benislavskaya inbound-letter and gift-inscription discovery pass 24',
  '',
  `- FEB comment pages attempted: ${commentPages.length}`,
  `- FEB comment pages fetched: ${commentPages.filter((page) => page.fetchStatus === 'success').length}`,
  `- Raw inbound candidate occurrences: ${allCandidates.length}`,
  `- Unique \`Письма, N\` records: ${inboundRecords.length}`,
  `- Academic index expected inbound letters: ${expectedInboundLetters}`,
  `- Exact fourteen resolved: ${manifest.inbound.exactFourteenResolved}`,
  `- Gift page: ${gift.finalUrl}`,
  `- Gift page bytes: ${gift.bytes.length}`,
  `- Gift page SHA-256: ${sha256(gift.bytes)}`,
  `- Gift page accepted as official published page: ${manifest.giftInscription.acquiredOfficialPublishedPage}`,
  '- Full inbound letter texts acquired: false',
  '- Archive originals inspected: false',
  '- OCR used: false',
  '- Production authorization: false',
  '',
];
await writeFile(join(outputRoot, 'SUMMARY.md'), `${summary.join('\n')}\n`, 'utf8');
console.log(summary.join('\n'));

if (!manifest.nameIndex.exactInboundCountStatementPresent) throw new Error('official index lacks the fourteen-letter statement');
if (!manifest.nameIndex.exactGiftCountStatementPresent) throw new Error('official index lacks the one-gift-inscription statement');
if (!manifest.giftInscription.acquiredOfficialPublishedPage) {
  throw new Error(`gift inscription identity checks failed: ${JSON.stringify(giftChecks)}`);
}
