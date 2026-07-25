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
const locatorUrl = 'https://esenin.ru/o-esenine/zhenshchiny-esenina/galina-benislavskaia/benislavskaia-g-pisma-k-eseninu';
const expectedInboundLetters = 14;
const userAgent = 'TheLegendaryPoet-Benislavskaya-Discovery/1.2 (+https://github.com/FedorMilovanov/TheLegendaryPoet)';
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
  const asciiHead = bytes.subarray(0, Math.min(bytes.length, 8_192)).toString('latin1');
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
      .replace(/<\/(?:p|div|li|h[1-6]|tr|blockquote|article|section)>/gi, '\n')
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
      // Ignore malformed navigation links.
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
const sourceRefRe = /Письма\s*,\s*(?:с\.\s*)?(\d{1,4})(?:\s*[—-]\s*(\d{1,4}))?/giu;

function paragraphIsInbound(paragraph) {
  if (!/Бениславск/iu.test(paragraph) || !/Есенин/iu.test(paragraph)) return false;
  const explicitInbound = [
    /Бениславская\s+(?:писала|сообщала|спрашивала|предупреждала|отвечала|ответила|отчитывалась)\s+(?:Есенин|ему|поэт)/iu,
    /Бениславск[^.]{0,180}\s+писал[аи]\s+(?:Есенин|ему|поэту)/iu,
    /в\s+(?:своем\s+)?письме\s+(?:к\s+Есенин[^.]{0,120})?Бениславск/iu,
    /письм[оеа]\s+(?:Г\.\s*А\.\s*)?Бениславск[^.]{0,180}(?:Есенин|поэт)/iu,
    /из\s+письма\s+(?:Г\.\s*А\.\s*)?Бениславск[^.]{0,160}(?:Есенин|ему)/iu,
    /встречн\w*\s+письм\w*[^.]{0,180}Бениславск/iu,
  ];
  return explicitInbound.some((pattern) => pattern.test(paragraph));
}

function extractOfficialExcerptWitnesses(text, sourceUrl) {
  const records = [];
  const paragraphs = text.split(/\n+/).map(normalizeInline).filter(Boolean);
  for (let paragraphIndex = 0; paragraphIndex < paragraphs.length; paragraphIndex += 1) {
    const paragraph = paragraphs[paragraphIndex];
    if (!paragraphIsInbound(paragraph)) continue;
    const refs = [];
    for (const match of paragraph.matchAll(sourceRefRe)) {
      const start = Number(match[1]);
      const end = match[2] ? Number(match[2]) : start;
      for (let page = start; page <= end && page - start < 20; page += 1) refs.push(page);
    }
    const publishedVolumePages = [...new Set(refs.filter((page) => page >= 230 && page <= 285))];
    if (publishedVolumePages.length === 0) continue;
    records.push({
      sourceUrl,
      paragraphIndex,
      publishedVolumePages,
      dates: [...new Set([...paragraph.matchAll(dateRe)].map((match) => normalizeInline(match[0])))],
      quotedExcerptPresent: (paragraph.match(/[«»“”]/g) || []).length >= 2,
      paragraph,
      paragraphSha256: sha256(Buffer.from(paragraph, 'utf8')),
    });
  }
  return records;
}

function extractLocatorDocuments(text) {
  const lines = text.split(/\n+/).map(normalizeInline).filter(Boolean);
  const headings = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(\d{1,2})\.$/u);
    if (!match) continue;
    const number = Number(match[1]);
    if (number >= 1 && number <= 13) headings.push({ number, index });
  }

  const sections = [];
  for (let i = 0; i < headings.length; i += 1) {
    const current = headings[i];
    const nextIndex = headings[i + 1]?.index ?? lines.length;
    const sectionLines = lines.slice(current.index + 1, nextIndex);
    const sectionText = sectionLines.join('\n');
    const dates = [...sectionText.matchAll(new RegExp(`(?:Москва|Константиново)?[,]?\\s*\\d{1,2}(?:[—-]\\d{1,2})?\\s+(?:${months})\\s+192[4-5]\\s*г\\.?`, 'giu'))]
      .map((match) => normalizeInline(match[0]));
    sections.push({
      printedNumber: current.number,
      dates,
      textSha256: sha256(Buffer.from(sectionText, 'utf8')),
      preview: normalizeInline(sectionText).slice(0, 500),
    });
  }

  const documents = [];
  for (const section of sections) {
    if (section.printedNumber !== 13) {
      documents.push({ locatorDocument: documents.length + 1, printedNumber: section.printedNumber, dates: section.dates, splitFromNumber13: false, textSha256: section.textSha256 });
      continue;
    }
    const mayFourDates = section.dates.filter((date) => /4\s+мая\s+1925/iu.test(date));
    if (mayFourDates.length >= 2) {
      documents.push({ locatorDocument: documents.length + 1, printedNumber: 13, dates: [mayFourDates[0]], splitFromNumber13: true, part: 1, textSha256: section.textSha256 });
      documents.push({ locatorDocument: documents.length + 1, printedNumber: 13, dates: [mayFourDates[1]], splitFromNumber13: true, part: 2, textSha256: section.textSha256 });
    } else {
      documents.push({ locatorDocument: documents.length + 1, printedNumber: 13, dates: section.dates, splitFromNumber13: false, textSha256: section.textSha256 });
    }
  }
  return { headings, sections, documents };
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(rawRoot, { recursive: true });

const sitemap = await fetchBytes(sitemapUrl);
const sitemapText = visibleText(sitemap.html);
await writeFile(join(rawRoot, 'sitemap.html'), sitemap.bytes);

const nameIndex = await fetchBytes(nameIndexUrl);
const nameIndexText = visibleText(nameIndex.html);
await writeFile(join(rawRoot, 'name-index.html'), nameIndex.bytes);

const exactCombinedIndexStatement = /35\s+писем,\s*записок\s+и\s+телеграмм\s+и\s+1\s+дарственн\w*\s+надпис\w*\s+Есенина\s+Бениславской,\s*а\s+также\s+14\s+писем\s+Бениславской\s+Есенину/iu.test(nameIndexText);

const sitemapAnchors = extractAnchors(sitemap.html, sitemap.finalUrl);
const commentUrls = [...new Set(
  sitemapAnchors
    .filter(({ url, text }) => /feb-web\.ru\/feb\/esenin\/texts\/(?:es[1-7]|e7[1-7])\//iu.test(url) && /^Комментарии$/iu.test(text))
    .map(({ url }) => {
      const parsed = new URL(url);
      parsed.searchParams.set('cmd', 'p');
      return parsed.toString();
    }),
)];

const requiredCommentUrls = [
  'https://feb-web.ru/feb/esenin/texts/es1/es1-385-.htm?cmd=p',
  'https://feb-web.ru/feb/esenin/texts/es2/es2-255-.htm?cmd=p',
  'https://feb-web.ru/feb/esenin/texts/es3/es3-435-.htm?cmd=p',
  'https://feb-web.ru/feb/esenin/texts/es6/es6-233-.htm?cmd=p',
  'https://feb-web.ru/feb/esenin/texts/e72/e72-031-.htm?cmd=p',
  'https://feb-web.ru/feb/esenin/texts/e72/e72-266-.htm?cmd=p',
  'https://feb-web.ru/feb/esenin/texts/e72/e72-566-.htm?cmd=p',
  'https://feb-web.ru/feb/esenin/texts/e74/e74-323-.htm?cmd=p',
  'https://feb-web.ru/feb/esenin/texts/e75/e75-325-.htm?cmd=p',
  giftCommentsUrl,
  'https://feb-web.ru/feb/esenin/critics/ev2/ev2-361-.htm?cmd=p',
];
for (const url of requiredCommentUrls) if (!commentUrls.includes(url)) commentUrls.push(url);

const commentPages = [];
const officialExcerptWitnesses = [];
for (let index = 0; index < commentUrls.length; index += 1) {
  const url = commentUrls[index];
  try {
    const fetched = await fetchBytes(url);
    const text = visibleText(fetched.html);
    const rawFile = `raw/${safeFileName(url, index + 1)}`;
    await writeFile(join(outputRoot, rawFile), fetched.bytes);
    const witnesses = extractOfficialExcerptWitnesses(text, fetched.finalUrl);
    officialExcerptWitnesses.push(...witnesses);
    commentPages.push({
      requestedUrl: url,
      finalUrl: fetched.finalUrl,
      charset: fetched.charset,
      htmlBytes: fetched.bytes.length,
      htmlSha256: sha256(fetched.bytes),
      visibleTextSha256: sha256(Buffer.from(text, 'utf8')),
      benislavskayaMentions: (text.match(/Бениславск/giu) || []).length,
      inboundExcerptWitnesses: witnesses.length,
      rawFile,
      fetchStatus: 'success',
    });
  } catch (error) {
    commentPages.push({ requestedUrl: url, fetchStatus: 'failed', error: error instanceof Error ? error.message : String(error) });
  }
}

const officialPublishedVolumePages = [...new Set(officialExcerptWitnesses.flatMap((record) => record.publishedVolumePages))].sort((a, b) => a - b);

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

const locator = await fetchBytes(locatorUrl);
const locatorText = visibleText(locator.html);
await writeFile(join(rawRoot, 'noninstitutional-letter-locator.html'), locator.bytes);
const locatorCorpus = extractLocatorDocuments(locatorText);

const manifest = {
  schema: 'yesenin-benislavskaya-inbound-discovery-pass24/v3',
  generatedAt: new Date().toISOString(),
  officialAuthority: 'Фундаментальная электронная библиотека Русская литература и фольклор',
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
    exactCombinedStatementPresent: exactCombinedIndexStatement,
  },
  officialCommentPages: commentPages,
  officialInboundExcerptLayer: {
    witnessParagraphs: officialExcerptWitnesses.length,
    publishedVolumePages: officialPublishedVolumePages,
    witnesses: officialExcerptWitnesses,
    fullLetterTextsAcquired: false,
    allFourteenIndividuallyResolved: false,
    archiveOriginalsInspected: false,
  },
  nonInstitutionalLocator: {
    url: locator.finalUrl,
    charset: locator.charset,
    htmlBytes: locator.bytes.length,
    htmlSha256: sha256(locator.bytes),
    visibleTextSha256: sha256(Buffer.from(locatorText, 'utf8')),
    printedNumberSections: locatorCorpus.sections.length,
    reconstructedDocumentCandidates: locatorCorpus.documents.length,
    documents: locatorCorpus.documents,
    locatorOnly: true,
    evidenceGrade: 'EXCLUDED-FROM-CLAIM-EVIDENCE',
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
    currentPhysicalLocationKnown: false,
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
  `- Exact FEB combined index statement present: ${exactCombinedIndexStatement}`,
  `- Official comment pages attempted: ${commentPages.length}`,
  `- Official comment pages fetched: ${commentPages.filter((page) => page.fetchStatus === 'success').length}`,
  `- Official inbound excerpt witness paragraphs: ${officialExcerptWitnesses.length}`,
  `- Published-volume pages witnessed in official comments: ${officialPublishedVolumePages.join(', ') || 'none'}`,
  `- Non-institutional numbered sections: ${locatorCorpus.sections.length}`,
  `- Non-institutional reconstructed document candidates: ${locatorCorpus.documents.length}`,
  `- Gift page: ${gift.finalUrl}`,
  `- Gift page bytes: ${gift.bytes.length}`,
  `- Gift page SHA-256: ${sha256(gift.bytes)}`,
  `- Gift page accepted as official published page: ${manifest.giftInscription.acquiredOfficialPublishedPage}`,
  '- Full inbound letter texts acquired: false',
  '- Fourteen official texts individually resolved: false',
  '- Archive originals inspected: false',
  '- OCR used: false',
  '- Production authorization: false',
  '',
];
await writeFile(join(outputRoot, 'SUMMARY.md'), `${summary.join('\n')}\n`, 'utf8');
console.log(summary.join('\n'));

if (!exactCombinedIndexStatement) throw new Error('official index lacks the exact combined 35/1/14 statement');
if (!manifest.giftInscription.acquiredOfficialPublishedPage) throw new Error(`gift inscription checks failed: ${JSON.stringify(giftChecks)}`);
if (locatorCorpus.sections.length !== 13 || locatorCorpus.documents.length !== expectedInboundLetters) {
  throw new Error(`locator composition changed: ${locatorCorpus.sections.length} sections / ${locatorCorpus.documents.length} documents`);
}
