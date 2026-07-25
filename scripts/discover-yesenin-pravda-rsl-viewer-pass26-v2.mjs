#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputRoot = 'artifacts/yesenin-pravda-rsl-viewer-pass26';
const rawRoot = join(outputRoot, 'raw');
const parentRecordUrl = 'https://search.rsl.ru/ru/record/01004548325';
const expectedRecordId = '01004548325';
const expectedControlNumber = '004548325';
const expectedIssn = '0233-4275';
const targetDateIso = '1921-11-09';
const targetIssueNumber = '252';
const userAgent = 'TheLegendaryPoet-RSL-Pravda-Discovery/2.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)';
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

function officialRslUrl(rawUrl, baseUrl) {
  let url;
  try {
    url = new URL(decodeEntities(rawUrl).replace(/\\\//g, '/').replace(/\\u0026/g, '&'), baseUrl).toString();
  } catch {
    return null;
  }
  const hostname = new URL(url).hostname.toLowerCase();
  return hostname === 'rsl.ru' || hostname.endsWith('.rsl.ru') ? url : null;
}

async function fetchBytes(url, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'user-agent': userAgent,
          accept: 'text/html,application/xhtml+xml,application/javascript,text/javascript,application/json,application/xml,text/xml,application/pdf,*/*;q=0.2',
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

function extractScriptUrls(html, baseUrl) {
  const urls = [];
  for (const match of html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
    const url = officialRslUrl(match[1], baseUrl);
    if (!url) continue;
    const pathname = new URL(url).pathname;
    if (/\/(?:action-record|eorder-stuff|general|layout-main|prePageModalNotification)\.js$/iu.test(pathname)) {
      urls.push(url);
    }
  }
  return [...new Set(urls)];
}

function extractJsRouteEvidence(jsText, jsUrl) {
  const evidence = [];
  const relevance = /freeAccessAlertReadLink|rsl-record-read-link|fullDocument|fulldocument|ajax-particular|hasFile|documentId|docStorageId|relatedPartsData|viewer|просмотр|periodic|issueInformation|readLink|openAccess/iu;

  const routePatterns = [
    /["'](\/(?:ru\/|en\/|site\/|frontend\/|api\/|image\/|document\/|viewer\/|read\/|archive\/)[^"']*)["']/giu,
    /["'](https?:\\?\/\\?\/[^"']+)["']/giu,
  ];
  for (const pattern of routePatterns) {
    for (const match of jsText.matchAll(pattern)) {
      const raw = match[1];
      const start = Math.max(0, (match.index ?? 0) - 900);
      const end = Math.min(jsText.length, (match.index ?? 0) + match[0].length + 1_200);
      const context = normalize(jsText.slice(start, end));
      if (!relevance.test(`${raw} ${context}`)) continue;
      const url = officialRslUrl(raw, jsUrl);
      evidence.push({ rawRoute: raw, resolvedUrl: url, context, contextSha256: sha256(Buffer.from(context, 'utf8')) });
    }
  }

  for (const token of [
    'freeAccessAlertReadLink',
    'rsl-record-read-link-section',
    'fullDocumentId',
    'ajax-particular',
    'relatedPartsData',
    'issueInformation',
    'hasFile',
  ]) {
    let cursor = 0;
    while (true) {
      const index = jsText.indexOf(token, cursor);
      if (index < 0) break;
      const context = normalize(jsText.slice(Math.max(0, index - 1_200), Math.min(jsText.length, index + 2_000)));
      evidence.push({ token, resolvedUrl: null, context, contextSha256: sha256(Buffer.from(context, 'utf8')) });
      cursor = index + token.length;
      if (cursor > 1_000_000 || evidence.length > 300) break;
    }
  }

  return [...new Map(evidence.map((item) => [`${item.resolvedUrl || item.token || item.rawRoute}:${item.contextSha256}`, item])).values()];
}

function parentDomState(html, text) {
  const readSectionMatch = html.match(/<div\s+class=["']rsl-record-read-link-section["']>([\s\S]*?)<\/div>/iu);
  const readSectionInner = readSectionMatch ? normalize(visibleText(readSectionMatch[1])) : null;
  const activeReadLinks = [...html.matchAll(/<a\b[^>]*(?:class=["'][^"']*rsl-record-read[^"']*|id=["']freeAccessAlertReadLink["'])[^>]*href=["']([^"']+)["'][^>]*>/giu)]
    .map((match) => match[1])
    .filter((href) => href && href !== '#' && !/^javascript:/iu.test(href));
  return {
    exactRecordIdPresent: html.includes(expectedRecordId),
    controlNumberPresent: html.includes(expectedControlNumber),
    issnPresent: html.includes(expectedIssn),
    titlePravdaPresent: /Правда\s*:\s*газета|<title>[^<]*Правда/iu.test(html),
    moscow1918Present: /1918,\s*№\s*50[\s\S]{0,200}Москва/iu.test(text),
    holdings1912To1923Present: /1912\s*(?:\.\.\.|[—-])\s*1923/iu.test(text),
    microfilm1917To1981Present: /Микрофильм\s*\([^)]*1917\s*[—-]\s*1981/iu.test(text),
    remoteArchiveMarcStatementPresent: /Имеется\s+удаленн\w*\s+доступ\s+к\s+электронн\w*\s+архиву\s+газеты/iu.test(text),
    genericFreeAccessModalTemplatePresent: /Документ\s+в\s+свободном\s+доступе[\s\S]{0,500}Просмотрщик/iu.test(text),
    recordReadSectionFound: readSectionMatch !== null,
    recordReadSectionEmpty: readSectionInner === '',
    activeReadLinkCount: activeReadLinks.length,
    activeReadLinks,
    fragmentOrderLinkPresent: /\/ru\/fragment-eorder\/rsl01004548325/iu.test(html),
    marcDownloadLinkPresent: /\/ru\/download\/marc21\?id=01004548325/iu.test(html),
  };
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(rawRoot, { recursive: true });

const parent = await fetchBytes(parentRecordUrl);
await writeFile(join(rawRoot, 'parent-record.html'), parent.bytes);
const parentText = visibleText(parent.text);
const parentState = parentDomState(parent.text, parentText);

const scriptUrls = extractScriptUrls(parent.text, parent.finalUrl);
const scriptRecords = [];
const allRouteEvidence = [];
for (let index = 0; index < scriptUrls.length; index += 1) {
  const url = scriptUrls[index];
  const response = await fetchBytes(url);
  const filename = `script-${String(index + 1).padStart(2, '0')}-${new URL(url).pathname.split('/').pop()}`;
  await writeFile(join(rawRoot, filename), response.bytes);
  const routeEvidence = extractJsRouteEvidence(response.text, response.finalUrl);
  allRouteEvidence.push(...routeEvidence.map((item) => ({ ...item, scriptUrl: response.finalUrl })));
  scriptRecords.push({
    requestedUrl: url,
    finalUrl: response.finalUrl,
    status: response.status,
    contentType: response.contentType,
    charset: response.charset,
    bytes: response.bytes.length,
    sha256: sha256(response.bytes),
    rawFile: `raw/${filename}`,
    routeEvidenceCount: routeEvidence.length,
  });
}

const literalSafeGetRoutes = [...new Map(
  allRouteEvidence
    .filter((item) => item.resolvedUrl)
    .filter((item) => !/[{}$+]/u.test(item.rawRoute || ''))
    .filter((item) => !/logout|login|delete|remove|cancel|order|eorder|payment/iu.test(item.resolvedUrl))
    .map((item) => [item.resolvedUrl, item]),
).values()].slice(0, 50);

const routeResponses = [];
for (let index = 0; index < literalSafeGetRoutes.length; index += 1) {
  const route = literalSafeGetRoutes[index];
  try {
    const response = await fetchBytes(route.resolvedUrl, 2);
    const file = `route-${String(index + 1).padStart(2, '0')}.txt`;
    await writeFile(join(rawRoot, file), response.bytes);
    const text = /html/iu.test(response.contentType) ? visibleText(response.text) : normalize(response.text);
    routeResponses.push({
      requestedUrl: route.resolvedUrl,
      finalUrl: response.finalUrl,
      status: response.status,
      contentType: response.contentType,
      charset: response.charset,
      bytes: response.bytes.length,
      sha256: sha256(response.bytes),
      visibleTextSha256: sha256(Buffer.from(text, 'utf8')),
      rawFile: `raw/${file}`,
      sourceScriptUrl: route.scriptUrl,
      sourceContextSha256: route.contextSha256,
      targetMarkers: targetMarkers(text),
      error: null,
    });
  } catch (error) {
    routeResponses.push({
      requestedUrl: route.resolvedUrl,
      sourceScriptUrl: route.scriptUrl,
      sourceContextSha256: route.contextSha256,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const exactTargetResponses = routeResponses.filter((record) => record.targetMarkers?.targetDateAndIssueTogether);
const manifest = {
  schema: 'yesenin-pravda-rsl-viewer-discovery-pass26/v2',
  generatedAt: new Date().toISOString(),
  target: {
    publication: 'Правда',
    parentRecordUrl,
    date: targetDateIso,
    issueNumber: targetIssueNumber,
  },
  parent: {
    finalUrl: parent.finalUrl,
    contentType: parent.contentType,
    charset: parent.charset,
    htmlBytes: parent.bytes.length,
    htmlSha256: sha256(parent.bytes),
    visibleTextSha256: sha256(Buffer.from(parentText, 'utf8')),
    rawFile: 'raw/parent-record.html',
    state: parentState,
  },
  scripts: scriptRecords,
  routeEvidence: allRouteEvidence,
  routeResponses,
  effectiveState: {
    officialScriptsAcquired: scriptRecords.length,
    jsRouteEvidenceRecords: allRouteEvidence.length,
    literalSafeGetRoutes: literalSafeGetRoutes.length,
    successfulRouteResponses: routeResponses.filter((record) => !record.error).length,
    exactTargetResponses: exactTargetResponses.length,
    exactIssueIdentified: exactTargetResponses.length === 1,
    activeViewerLinkPresentOnParent: parentState.activeReadLinkCount > 0,
    genericViewerModalIsEvidenceOfAccess: false,
    remoteArchiveMarcStatementVerified: parentState.remoteArchiveMarcStatementPresent,
    viewerMechanismResolved: allRouteEvidence.some((record) => /freeAccessAlertReadLink|rsl-record-read-link/iu.test(record.context || '')),
    exactIssuePdfAcquired: false,
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
  '# RSL Pravda viewer discovery pass 26 v2',
  '',
  `- Parent HTML bytes: ${parent.bytes.length}`,
  `- Parent HTML SHA-256: ${sha256(parent.bytes)}`,
  `- Holdings 1912…1923 verified: ${parentState.holdings1912To1923Present}`,
  `- Remote archive MARC statement verified: ${parentState.remoteArchiveMarcStatementPresent}`,
  `- Generic free-access modal present: ${parentState.genericFreeAccessModalTemplatePresent}`,
  `- Active read-link section empty: ${parentState.recordReadSectionEmpty}`,
  `- Active viewer links on parent: ${parentState.activeReadLinkCount}`,
  `- Official JavaScript files acquired: ${scriptRecords.length}`,
  `- JavaScript route evidence records: ${allRouteEvidence.length}`,
  `- Literal safe GET routes probed: ${literalSafeGetRoutes.length}`,
  `- Exact 9 Nov 1921 + issue 252 responses: ${exactTargetResponses.length}`,
  `- Exact issue identified: ${manifest.effectiveState.exactIssueIdentified}`,
  '- Generic modal accepted as access evidence: false',
  '- Constructed catalogue ID: false',
  '- Neighbor inference: false',
  '',
];
await writeFile(join(outputRoot, 'SUMMARY.md'), `${summary.join('\n')}\n`, 'utf8');
console.log(summary.join('\n'));

const requiredParentChecks = [
  parentState.exactRecordIdPresent,
  parentState.controlNumberPresent,
  parentState.issnPresent,
  parentState.titlePravdaPresent,
  parentState.moscow1918Present,
  parentState.holdings1912To1923Present,
  parentState.microfilm1917To1981Present,
  parentState.remoteArchiveMarcStatementPresent,
  parentState.genericFreeAccessModalTemplatePresent,
  parentState.recordReadSectionFound,
  parentState.recordReadSectionEmpty,
  parentState.fragmentOrderLinkPresent,
  parentState.marcDownloadLinkPresent,
];
if (!requiredParentChecks.every(Boolean)) {
  throw new Error(`parent identity/access boundary checks incomplete: ${JSON.stringify(parentState)}`);
}
if (scriptRecords.length < 3) {
  throw new Error(`expected at least three official RSL script files, acquired ${scriptRecords.length}`);
}
