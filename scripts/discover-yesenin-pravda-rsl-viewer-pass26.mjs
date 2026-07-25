#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputRoot = 'artifacts/yesenin-pravda-rsl-viewer-pass26';
const rawRoot = join(outputRoot, 'raw');
const parentRecordUrl = 'https://search.rsl.ru/ru/record/01004548325';
const parentRecordId = '01004548325';
const expectedControlNumber = '004548325';
const expectedIssn = '0233-4275';
const targetDateIso = '1921-11-09';
const targetIssueNumber = '252';
const userAgent = 'TheLegendaryPoet-RSL-Pravda-Discovery/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)';
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

function decodeBytes(bytes, contentType = '') {
  const head = bytes.subarray(0, Math.min(bytes.length, 16_384)).toString('latin1');
  const declared = `${contentType} ${head}`;
  const charset = /windows-1251|cp1251/iu.test(declared)
    ? 'windows-1251'
    : /koi8-r/iu.test(declared)
      ? 'koi8-r'
      : 'utf-8';
  let text = new TextDecoder(charset).decode(bytes);
  if (charset === 'utf-8' && text.includes('\uFFFD') && /charset\s*=\s*["']?windows-1251/iu.test(head)) {
    text = new TextDecoder('windows-1251').decode(bytes);
  }
  return { text, charset };
}

function visibleText(html) {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<\/(?:p|div|li|tr|td|th|h[1-6]|article|section|form)>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const normalize = (value) => value.replace(/\s+/g, ' ').trim();

function isOfficialRslUrl(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === 'rsl.ru' || hostname.endsWith('.rsl.ru');
  } catch {
    return false;
  }
}

async function fetchBytes(url, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'user-agent': userAgent,
          accept: 'text/html,application/xhtml+xml,application/json,application/xml,text/xml,application/pdf,*/*;q=0.2',
          'accept-language': 'ru,en;q=0.7',
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
        requestedUrl: url,
        finalUrl: response.url,
        status: response.status,
        contentType,
        bytes,
        text: decoded.text,
        charset: decoded.charset,
      };
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 1_500));
    }
  }
  throw new Error(`failed to fetch ${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

function classifyResponse(response) {
  const type = response.contentType.toLowerCase();
  const magic = response.bytes.subarray(0, 16).toString('latin1');
  if (magic.startsWith('%PDF-') || type.includes('application/pdf')) return 'pdf';
  if (type.includes('application/json') || /^[\s\uFEFF]*[\[{]/u.test(response.text)) return 'json';
  if (type.includes('xml') || /^[\s\uFEFF]*<\?xml/iu.test(response.text)) return 'xml';
  if (type.includes('text/html') || /<html\b/iu.test(response.text)) return 'html';
  if (/^\xFF\xD8/u.test(magic) || type.startsWith('image/')) return 'image';
  return 'binary-or-text';
}

function collectLiteralCandidates(html, baseUrl) {
  const candidates = [];
  const add = (rawUrl, source, context = '') => {
    if (!rawUrl) return;
    let url;
    try {
      url = new URL(decodeEntities(rawUrl), baseUrl).toString();
    } catch {
      return;
    }
    if (!isOfficialRslUrl(url)) return;
    candidates.push({ url, source, context: normalize(context).slice(0, 2_000) });
  };

  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const anchorText = visibleText(match[2]);
    const start = Math.max(0, (match.index ?? 0) - 800);
    const end = Math.min(html.length, (match.index ?? 0) + match[0].length + 1_200);
    add(match[1], `anchor:${normalize(anchorText).slice(0, 180)}`, visibleText(html.slice(start, end)));
  }

  for (const match of html.matchAll(/<form\b[^>]*action=["']([^"']+)["'][^>]*>/gi)) {
    const start = Math.max(0, (match.index ?? 0) - 500);
    const end = Math.min(html.length, (match.index ?? 0) + match[0].length + 1_200);
    add(match[1], 'form-action', visibleText(html.slice(start, end)));
  }

  for (const match of html.matchAll(/\b(?:data-(?:url|href|viewer|download|api)|content-url|src)=["']([^"']+)["']/gi)) {
    add(match[1], 'data-or-src-attribute');
  }

  for (const match of html.matchAll(/https?:\\?\/\\?\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%\\-]+/g)) {
    const raw = match[0].replace(/\\\//g, '/').replace(/\\u0026/g, '&');
    add(raw, 'inline-absolute-url');
  }

  for (const match of html.matchAll(/["'](\/(?:ru\/)?(?:record|marc|viewer|read|online|download|api|ajax|archive|document|resource|item|issue|period)[^"']*)["']/gi)) {
    add(match[1], 'inline-relative-route');
  }

  const relevance = /читать\s+онлайн|скачать\s+marc|viewer|просмотр|электронн\w*\s+архив|полный\s+доступ|full\s*text|marc21|api|ajax|archive|document|issue|period|004548325|01004548325|012106346|0233-4275/iu;
  const unique = [...new Map(candidates.map((candidate) => [candidate.url, candidate])).values()];
  return unique
    .map((candidate) => ({ ...candidate, relevant: relevance.test(`${candidate.url} ${candidate.source} ${candidate.context}`) }))
    .filter((candidate) => candidate.relevant)
    .slice(0, 80);
}

function targetMarkers(text) {
  const normalized = normalize(text);
  return {
    year1921Present: /(?:^|\D)1921(?:\D|$)/u.test(normalized),
    issue252Present: /(?:№|N|No\.?|номер)\s*252(?!\d)/iu.test(normalized),
    exactDateIsoPresent: normalized.includes(targetDateIso),
    exactDateRussianPresent: /9\s+ноября\s+1921/iu.test(normalized),
    targetDateAndIssueTogether:
      /9\s+ноября\s+1921[\s\S]{0,800}(?:№|N|No\.?|номер)\s*252(?!\d)|(?:№|N|No\.?|номер)\s*252(?!\d)[\s\S]{0,800}9\s+ноября\s+1921/iu.test(normalized),
  };
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(rawRoot, { recursive: true });

const parent = await fetchBytes(parentRecordUrl);
await writeFile(join(rawRoot, 'parent-record.html'), parent.bytes);
const parentText = visibleText(parent.text);
const parentChecks = {
  exactRecordIdPresent: parent.text.includes(parentRecordId),
  controlNumberPresent: parent.text.includes(expectedControlNumber),
  issnPresent: parent.text.includes(expectedIssn),
  titlePravdaPresent: /Правда\s*:\s*газета|<title>[^<]*Правда/iu.test(parent.text),
  moscow1918Present: /Москва[\s\S]{0,500}1918/iu.test(parentText),
  holdings1912To1923Present: /1912\s*[—-]\s*1923/iu.test(parentText),
  microfilm1917To1981Present: /1917\s*[—-]\s*1981/iu.test(parentText),
  remoteArchivePresent: /удаленн\w*\s+доступ[\s\S]{0,500}электронн\w*\s+архив|электронн\w*\s+архив[\s\S]{0,500}удаленн\w*\s+доступ/iu.test(parentText),
  onlineReadMarkerPresent: /Читать\s+онлайн|Полный\s+доступ|Просмотр\s+документа/iu.test(parentText),
  linkedItem012106346Present: parent.text.includes('012106346'),
};

const literalCandidates = collectLiteralCandidates(parent.text, parent.finalUrl);
const candidateRecords = [];
for (let index = 0; index < literalCandidates.length; index += 1) {
  const candidate = literalCandidates[index];
  const fileBase = `candidate-${String(index + 1).padStart(2, '0')}`;
  try {
    const response = await fetchBytes(candidate.url, 3);
    const classification = classifyResponse(response);
    const extension = classification === 'json' ? 'json' : classification === 'xml' ? 'xml' : classification === 'pdf' ? 'pdf' : classification === 'image' ? 'bin' : 'html';
    const rawFile = `raw/${fileBase}.${extension}`;
    await writeFile(join(outputRoot, rawFile), response.bytes);
    const responseVisibleText = classification === 'html' ? visibleText(response.text) : normalize(response.text);
    const nestedCandidates = classification === 'html'
      ? collectLiteralCandidates(response.text, response.finalUrl).slice(0, 30)
      : [];
    candidateRecords.push({
      source: candidate.source,
      context: candidate.context,
      requestedUrl: candidate.url,
      finalUrl: response.finalUrl,
      status: response.status,
      contentType: response.contentType,
      charset: response.charset,
      classification,
      bytes: response.bytes.length,
      sha256: sha256(response.bytes),
      visibleTextSha256: sha256(Buffer.from(responseVisibleText, 'utf8')),
      rawFile,
      targetMarkers: targetMarkers(responseVisibleText),
      nestedCandidates,
      error: null,
    });
  } catch (error) {
    candidateRecords.push({
      source: candidate.source,
      context: candidate.context,
      requestedUrl: candidate.url,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const nestedQueue = [...new Map(
  candidateRecords
    .flatMap((record) => record.nestedCandidates || [])
    .filter((candidate) => !literalCandidates.some((parentCandidate) => parentCandidate.url === candidate.url))
    .map((candidate) => [candidate.url, candidate]),
).values()].slice(0, 60);

const nestedRecords = [];
for (let index = 0; index < nestedQueue.length; index += 1) {
  const candidate = nestedQueue[index];
  const fileBase = `nested-${String(index + 1).padStart(2, '0')}`;
  try {
    const response = await fetchBytes(candidate.url, 2);
    const classification = classifyResponse(response);
    const extension = classification === 'json' ? 'json' : classification === 'xml' ? 'xml' : classification === 'pdf' ? 'pdf' : classification === 'image' ? 'bin' : 'html';
    const rawFile = `raw/${fileBase}.${extension}`;
    await writeFile(join(outputRoot, rawFile), response.bytes);
    const responseVisibleText = classification === 'html' ? visibleText(response.text) : normalize(response.text);
    nestedRecords.push({
      source: candidate.source,
      context: candidate.context,
      requestedUrl: candidate.url,
      finalUrl: response.finalUrl,
      status: response.status,
      contentType: response.contentType,
      charset: response.charset,
      classification,
      bytes: response.bytes.length,
      sha256: sha256(response.bytes),
      visibleTextSha256: sha256(Buffer.from(responseVisibleText, 'utf8')),
      rawFile,
      targetMarkers: targetMarkers(responseVisibleText),
      error: null,
    });
  } catch (error) {
    nestedRecords.push({
      source: candidate.source,
      context: candidate.context,
      requestedUrl: candidate.url,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const allSuccessful = [...candidateRecords, ...nestedRecords].filter((record) => !record.error);
const exactTargetRecords = allSuccessful.filter((record) => record.targetMarkers?.targetDateAndIssueTogether);
const dateOnlyRecords = allSuccessful.filter((record) =>
  record.targetMarkers?.exactDateIsoPresent || record.targetMarkers?.exactDateRussianPresent,
);
const issueOnlyRecords = allSuccessful.filter((record) => record.targetMarkers?.issue252Present);
const pdfRecords = allSuccessful.filter((record) => record.classification === 'pdf');

const manifest = {
  schema: 'yesenin-pravda-rsl-viewer-discovery-pass26/v1',
  generatedAt: new Date().toISOString(),
  authority: 'Российская государственная библиотека',
  target: {
    publication: 'Правда',
    parentRecordUrl,
    parentRecordId,
    controlNumber: expectedControlNumber,
    issn: expectedIssn,
    date: targetDateIso,
    issueNumber: targetIssueNumber,
  },
  parent: {
    requestedUrl: parent.requestedUrl,
    finalUrl: parent.finalUrl,
    status: parent.status,
    contentType: parent.contentType,
    charset: parent.charset,
    htmlBytes: parent.bytes.length,
    htmlSha256: sha256(parent.bytes),
    visibleTextSha256: sha256(Buffer.from(parentText, 'utf8')),
    rawFile: 'raw/parent-record.html',
    checks: parentChecks,
    literalCandidateCount: literalCandidates.length,
    literalCandidates,
  },
  firstHop: candidateRecords,
  secondHop: nestedRecords,
  effectiveState: {
    successfulOfficialResponses: allSuccessful.length,
    exactTargetRecords: exactTargetRecords.length,
    dateOnlyRecords: dateOnlyRecords.length,
    issueOnlyRecords: issueOnlyRecords.length,
    pdfRecords: pdfRecords.length,
    exactIssueIdentified: exactTargetRecords.length === 1,
    exactIssueUrl: exactTargetRecords.length === 1 ? exactTargetRecords[0].finalUrl : null,
    exactIssuePdfAcquired: exactTargetRecords.length === 1 && exactTargetRecords[0].classification === 'pdf',
    catalogueIdConstructed: false,
    issueIdInferredFromNeighbors: false,
    contentInspected: false,
    ocrUsed: false,
    syntheticContentUsed: false,
    wikipediaUsedAsEvidence: false,
    productionAuthorized: false,
  },
};
await writeFile(join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const summary = [
  '# RSL Pravda viewer discovery pass 26',
  '',
  `- Parent record: ${parent.finalUrl}`,
  `- Parent HTML bytes: ${parent.bytes.length}`,
  `- Parent HTML SHA-256: ${sha256(parent.bytes)}`,
  `- Parent identity checks passed: ${Object.values(parentChecks).every(Boolean)}`,
  `- Literal official candidates: ${literalCandidates.length}`,
  `- Successful official responses: ${allSuccessful.length}`,
  `- Exact 9 Nov 1921 + issue 252 records: ${exactTargetRecords.length}`,
  `- Date-only records: ${dateOnlyRecords.length}`,
  `- Issue-only records: ${issueOnlyRecords.length}`,
  `- PDF records: ${pdfRecords.length}`,
  `- Exact issue identified: ${manifest.effectiveState.exactIssueIdentified}`,
  `- Exact issue PDF acquired: ${manifest.effectiveState.exactIssuePdfAcquired}`,
  '- Constructed catalogue ID: false',
  '- Neighbor inference: false',
  '- OCR used: false',
  '',
];
await writeFile(join(outputRoot, 'SUMMARY.md'), `${summary.join('\n')}\n`, 'utf8');
console.log(summary.join('\n'));

if (!Object.values(parentChecks).every(Boolean)) {
  throw new Error(`parent RSL identity/access checks incomplete: ${JSON.stringify(parentChecks)}`);
}
