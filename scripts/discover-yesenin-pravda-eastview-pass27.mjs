#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputRoot = 'artifacts/yesenin-pravda-eastview-pass27';
const rawRoot = join(outputRoot, 'raw');
const archiveUrl = 'https://on-demand.eastview.com/browse/udb/870';
const featuredUrl = 'https://on-demand.eastview.com/ondemand-featured/featured-issues?titleId=9305';
const structuralIssueUrl = 'https://on-demand.eastview.com/browse/issue/6235463/udb/870';
const productUrl = 'https://shop.eastview.com/results/item?SKU=2018581D';
const productOverviewUrl = 'https://www.eastview.com/eastviewpravdadigitalarchive/';
const udbId = '870';
const titleId = '9305';
const targetDateIso = '1921-11-09';
const targetDateEnglishPatterns = [
  /November\s+0?9,\s*1921/iu,
  /Nov\.?\s+0?9,\s*1921/iu,
  /0?9\s+November\s+1921/iu,
];
const targetDateRussianPattern = /9\s+ноября\s+1921/iu;
const targetIssuePattern = /(?:No\.?|№|N|issue|номер)\s*252(?!\d)/iu;
const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/148.0 Safari/537.36 TheLegendaryPoet-EastView-Discovery/1.0';
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
    : /iso-8859-1|latin-1/iu.test(declared)
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
      .replace(/<\/(?:p|div|li|tr|td|th|h[1-6]|article|section|form|option)>/gi, '\n')
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

function isEastViewUrl(rawUrl, baseUrl) {
  let url;
  try {
    url = new URL(decodeEntities(rawUrl).replace(/\\\//g, '/').replace(/\\u0026/g, '&'), baseUrl).toString();
  } catch {
    return null;
  }
  const hostname = new URL(url).hostname.toLowerCase();
  return hostname === 'eastview.com' || hostname.endsWith('.eastview.com') ? url : null;
}

class EastViewSession {
  cookies = new Map();

  cookieHeader() {
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
  }

  absorbCookies(headers) {
    const values = typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : [headers.get('set-cookie')].filter(Boolean);
    for (const value of values) {
      for (const rawCookie of String(value).split(/,(?=[^;,]+=)/u)) {
        const pair = rawCookie.split(';', 1)[0];
        const separator = pair.indexOf('=');
        if (separator <= 0) continue;
        this.cookies.set(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim());
      }
    }
  }

  async fetch(url, { referer = 'https://on-demand.eastview.com/', attempts = 4 } = {}) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const cookie = this.cookieHeader();
        const response = await fetch(url, {
          redirect: 'follow',
          headers: {
            'user-agent': userAgent,
            accept: 'text/html,application/xhtml+xml,application/json,application/javascript,text/javascript,application/pdf,image/avif,image/webp,*/*;q=0.2',
            'accept-language': 'en-US,en;q=0.9,ru;q=0.7',
            referer,
            ...(cookie ? { cookie } : {}),
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': new URL(url).hostname === new URL(referer).hostname ? 'same-origin' : 'same-site',
            'upgrade-insecure-requests': '1',
          },
          signal: AbortSignal.timeout(120_000),
        });
        this.absorbCookies(response.headers);
        const bytes = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get('content-type') || '';
        if (bytes.length === 0) throw new Error(`empty response: HTTP ${response.status}`);
        const decoded = decodeBytes(bytes, contentType);
        return {
          requestedUrl: url,
          finalUrl: response.url,
          status: response.status,
          contentType,
          bytes,
          text: decoded.text,
          charset: decoded.charset,
          cookieNames: [...this.cookies.keys()].sort(),
        };
      } catch (error) {
        lastError = error;
        if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 2_000));
      }
    }
    throw new Error(`failed to fetch ${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
  }
}

function classifyResponse(response) {
  const type = response.contentType.toLowerCase();
  const magic = response.bytes.subarray(0, 16).toString('latin1');
  if (magic.startsWith('%PDF-') || type.includes('application/pdf')) return 'pdf';
  if (type.includes('application/json') || /^[\s\uFEFF]*[\[{]/u.test(response.text)) return 'json';
  if (type.includes('javascript')) return 'javascript';
  if (type.startsWith('image/') || magic.startsWith('\xFF\xD8')) return 'image';
  if (type.includes('text/html') || /<html\b/iu.test(response.text)) return 'html';
  return 'binary-or-text';
}

function accessMarkers(text, status) {
  const normalized = normalize(text);
  return {
    status,
    subscriptionTermsPresent: /Subscription\s+Terms|subscription|подписк/iu.test(normalized),
    accountAccessDeniedPresent: /account\s+may\s+not\s+have\s+access|not\s+have\s+access|access\s+to\s+this\s+content|no\s+access|доступ[^.]{0,80}(?:нет|огранич)/iu.test(normalized),
    customerServicePresent: /info@eastview\.com|Customer\s+Service|служб\w*\s+поддержк/iu.test(normalized),
    signInPresent: /sign\s*in|log\s*in|войти/iu.test(normalized),
    forbiddenStatus: status === 401 || status === 403,
    rateLimitedStatus: status === 429,
  };
}

function targetMarkers(text) {
  const normalized = normalize(text);
  const datePresent = targetDateEnglishPatterns.some((pattern) => pattern.test(normalized)) ||
    targetDateRussianPattern.test(normalized) || normalized.includes(targetDateIso);
  return {
    year1921Present: /(?:^|\D)1921(?:\D|$)/u.test(normalized),
    issue252Present: targetIssuePattern.test(normalized),
    exactDatePresent: datePresent,
    exactDateAndIssueTogether:
      datePresent && targetIssuePattern.test(normalized) &&
      (new RegExp(`(?:November\\s+0?9,\\s*1921|Nov\\.?\\s+0?9,\\s*1921|0?9\\s+November\\s+1921|9\\s+ноября\\s+1921|${targetDateIso})[\\s\\S]{0,1200}(?:No\\.?|№|N|issue|номер)\\s*252(?!\\d)|(?:No\\.?|№|N|issue|номер)\\s*252(?!\\d)[\\s\\S]{0,1200}(?:November\\s+0?9,\\s*1921|Nov\\.?\\s+0?9,\\s*1921|0?9\\s+November\\s+1921|9\\s+ноября\\s+1921|${targetDateIso})`, 'iu')).test(normalized),
  };
}

function archiveIdentity(text) {
  const normalized = normalize(text);
  return {
    pravdaDigitalArchivePresent: /Pravda\s+Digital\s+Archive|Правда[^.]{0,100}(?:Digital|цифров)/iu.test(normalized),
    archiveCodePresent: /DA-PRA|Pravda\s*\(DA-PRA\)/iu.test(normalized),
    udb870Present: /(?:udb\/870|\budb\s*[:=]\s*870\b)/iu.test(normalized),
    titleId9305Present: /titleId\s*[=:]\s*["']?9305|titleId=9305/iu.test(normalized),
    archiveFrom1912Present: /Apr\.?\s+22,\s*1912|April\s+22,\s*1912|from\s+its\s+inception\s+in\s+1912/iu.test(normalized),
    pdfOrFullImagePresent: /PDF|full-image|full\s+image|page-based|page-level/iu.test(normalized),
    subscriptionProductPresent: /Price:\s*Inquire|Contact\s+online@eastview\.com|subscription/iu.test(normalized),
  };
}

function extractIssues(html, baseUrl, sourceLabel) {
  const issues = [];
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']*\/browse\/issue\/(\d+)\/udb\/870[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const url = isEastViewUrl(match[1], baseUrl);
    if (!url) continue;
    const index = match.index ?? 0;
    const context = normalize(visibleText(html.slice(Math.max(0, index - 900), Math.min(html.length, index + match[0].length + 1_500))));
    issues.push({
      sourceLabel,
      issueId: match[2],
      url,
      anchorText: normalize(visibleText(match[3])),
      context,
      contextSha256: sha256(Buffer.from(context, 'utf8')),
      targetMarkers: targetMarkers(context),
    });
  }
  return issues;
}

function extractScripts(html, baseUrl) {
  const urls = [];
  for (const match of html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
    const url = isEastViewUrl(match[1], baseUrl);
    if (url) urls.push(url);
  }
  return [...new Set(urls)];
}

function extractForms(html, baseUrl) {
  const forms = [];
  for (const formMatch of html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)) {
    const attrs = formMatch[1];
    const body = formMatch[2];
    const actionRaw = attrs.match(/\baction=["']([^"']*)["']/i)?.[1] || baseUrl;
    const action = isEastViewUrl(actionRaw || baseUrl, baseUrl);
    if (!action) continue;
    const method = (attrs.match(/\bmethod=["']([^"']+)["']/i)?.[1] || 'GET').toUpperCase();
    const fields = [];
    for (const input of body.matchAll(/<input\b([^>]*)>/gi)) {
      const inputAttrs = input[1];
      const name = inputAttrs.match(/\bname=["']([^"']+)["']/i)?.[1];
      if (!name) continue;
      fields.push({
        kind: 'input',
        name,
        type: inputAttrs.match(/\btype=["']([^"']+)["']/i)?.[1] || 'text',
        value: inputAttrs.match(/\bvalue=["']([^"']*)["']/i)?.[1] || '',
      });
    }
    for (const select of body.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/gi)) {
      const name = select[1].match(/\bname=["']([^"']+)["']/i)?.[1];
      if (!name) continue;
      const options = [...select[2].matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/gi)].map((option) => ({
        value: option[1].match(/\bvalue=["']([^"']*)["']/i)?.[1] || normalize(visibleText(option[2])),
        text: normalize(visibleText(option[2])),
        selected: /\bselected\b/i.test(option[1]),
      }));
      fields.push({ kind: 'select', name, options });
    }
    forms.push({ action, method, fields, context: normalize(visibleText(body)).slice(0, 2_000) });
  }
  return forms;
}

function deriveYearRequests(forms) {
  const requests = [];
  for (const form of forms) {
    if (form.method !== 'GET') continue;
    const yearField = form.fields.find((field) => field.kind === 'select' && /year|date|period/iu.test(field.name) && field.options.some((option) => option.value === '1921' || option.text === '1921'));
    if (!yearField) continue;
    const params = new URL(form.action).searchParams;
    for (const field of form.fields) {
      if (field.kind === 'input' && ['hidden', 'text', 'search'].includes(field.type.toLowerCase()) && field.value) {
        params.set(field.name, field.value);
      }
      if (field.kind === 'select') {
        const selected = field.options.find((option) => option.selected) || field.options.find((option) => option.value);
        if (selected?.value) params.set(field.name, selected.value);
      }
    }
    params.set(yearField.name, '1921');
    if (![...params.keys()].some((key) => /titleid/iu.test(key))) params.set('titleId', titleId);
    const url = new URL(form.action);
    url.search = params.toString();
    requests.push({ url: url.toString(), form, derivedFromLiteralYearOption: true });
  }
  return [...new Map(requests.map((request) => [request.url, request])).values()];
}

function extractJsEvidence(jsText, jsUrl) {
  const evidence = [];
  const relevance = /featured|issue|calendar|date|year|browse|titleId|udb|document|page|search|archive|publication/iu;
  for (const pattern of [
    /["'](\/(?:api|browse|ondemand-featured|issue|publication|calendar|search|document|page)[^"']*)["']/giu,
    /["'](https?:\\?\/\\?\/[^"']+)["']/giu,
  ]) {
    for (const match of jsText.matchAll(pattern)) {
      const rawRoute = match[1];
      const index = match.index ?? 0;
      const context = normalize(jsText.slice(Math.max(0, index - 1_000), Math.min(jsText.length, index + match[0].length + 1_500)));
      if (!relevance.test(`${rawRoute} ${context}`)) continue;
      evidence.push({
        scriptUrl: jsUrl,
        rawRoute,
        resolvedUrl: isEastViewUrl(rawRoute, jsUrl),
        context,
        contextSha256: sha256(Buffer.from(context, 'utf8')),
      });
    }
  }
  for (const token of ['titleId', 'featured-issues', 'issueId', 'selectedYear', 'yearList', 'browse/issue', 'browse/doc']) {
    let cursor = 0;
    while (true) {
      const index = jsText.indexOf(token, cursor);
      if (index < 0) break;
      const context = normalize(jsText.slice(Math.max(0, index - 1_000), Math.min(jsText.length, index + 1_800)));
      evidence.push({ scriptUrl: jsUrl, token, resolvedUrl: null, context, contextSha256: sha256(Buffer.from(context, 'utf8')) });
      cursor = index + token.length;
      if (evidence.length > 400) break;
    }
  }
  return [...new Map(evidence.map((item) => [`${item.resolvedUrl || item.token || item.rawRoute}:${item.contextSha256}`, item])).values()];
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(rawRoot, { recursive: true });

const session = new EastViewSession();
const seeds = [
  { id: 'product-overview', url: productOverviewUrl },
  { id: 'shop-product', url: productUrl },
  { id: 'archive', url: archiveUrl },
  { id: 'featured', url: featuredUrl },
  { id: 'structural-issue', url: structuralIssueUrl },
];

const seedRecords = [];
const allIssues = [];
const allForms = [];
const allScriptUrls = new Set();
for (let index = 0; index < seeds.length; index += 1) {
  const seed = seeds[index];
  try {
    const response = await session.fetch(seed.url, { referer: index === 0 ? 'https://www.eastview.com/' : seeds[Math.max(0, index - 1)].url });
    const classification = classifyResponse(response);
    const extension = classification === 'html' ? 'html' : classification === 'json' ? 'json' : classification === 'javascript' ? 'js' : 'bin';
    const rawFile = `raw/seed-${String(index + 1).padStart(2, '0')}-${seed.id}.${extension}`;
    await writeFile(join(outputRoot, rawFile), response.bytes);
    const text = classification === 'html' ? visibleText(response.text) : normalize(response.text);
    const issues = classification === 'html' ? extractIssues(response.text, response.finalUrl, seed.id) : [];
    const forms = classification === 'html' ? extractForms(response.text, response.finalUrl) : [];
    const scripts = classification === 'html' ? extractScripts(response.text, response.finalUrl) : [];
    issues.forEach((issue) => allIssues.push(issue));
    forms.forEach((form) => allForms.push({ ...form, sourceSeed: seed.id }));
    scripts.forEach((url) => allScriptUrls.add(url));
    seedRecords.push({
      id: seed.id,
      requestedUrl: seed.url,
      finalUrl: response.finalUrl,
      status: response.status,
      contentType: response.contentType,
      charset: response.charset,
      classification,
      bytes: response.bytes.length,
      sha256: sha256(response.bytes),
      visibleTextSha256: sha256(Buffer.from(text, 'utf8')),
      rawFile,
      cookieNames: response.cookieNames,
      archiveIdentity: archiveIdentity(text),
      accessMarkers: accessMarkers(text, response.status),
      targetMarkers: targetMarkers(text),
      issueLinks: issues.length,
      formCount: forms.length,
      scriptCount: scripts.length,
      error: null,
    });
  } catch (error) {
    seedRecords.push({ id: seed.id, requestedUrl: seed.url, error: error instanceof Error ? error.message : String(error) });
  }
}

const formDerivedRequests = deriveYearRequests(allForms);
const formRecords = [];
for (let index = 0; index < formDerivedRequests.length; index += 1) {
  const request = formDerivedRequests[index];
  try {
    const response = await session.fetch(request.url, { referer: featuredUrl });
    const classification = classifyResponse(response);
    const extension = classification === 'html' ? 'html' : classification === 'json' ? 'json' : 'bin';
    const rawFile = `raw/form-derived-${String(index + 1).padStart(2, '0')}.${extension}`;
    await writeFile(join(outputRoot, rawFile), response.bytes);
    const text = classification === 'html' ? visibleText(response.text) : normalize(response.text);
    const issues = classification === 'html' ? extractIssues(response.text, response.finalUrl, 'form-derived-1921') : [];
    issues.forEach((issue) => allIssues.push(issue));
    formRecords.push({
      requestedUrl: request.url,
      finalUrl: response.finalUrl,
      status: response.status,
      contentType: response.contentType,
      charset: response.charset,
      classification,
      bytes: response.bytes.length,
      sha256: sha256(response.bytes),
      visibleTextSha256: sha256(Buffer.from(text, 'utf8')),
      rawFile,
      derivedFromLiteralYearOption: true,
      targetMarkers: targetMarkers(text),
      accessMarkers: accessMarkers(text, response.status),
      issueLinks: issues.length,
      error: null,
    });
  } catch (error) {
    formRecords.push({ requestedUrl: request.url, derivedFromLiteralYearOption: true, error: error instanceof Error ? error.message : String(error) });
  }
}

const scriptRecords = [];
const allJsEvidence = [];
for (const [index, url] of [...allScriptUrls].slice(0, 60).entries()) {
  try {
    const response = await session.fetch(url, { referer: archiveUrl });
    const rawFile = `raw/script-${String(index + 1).padStart(2, '0')}.js`;
    await writeFile(join(outputRoot, rawFile), response.bytes);
    const evidence = extractJsEvidence(response.text, response.finalUrl);
    allJsEvidence.push(...evidence);
    scriptRecords.push({
      requestedUrl: url,
      finalUrl: response.finalUrl,
      status: response.status,
      contentType: response.contentType,
      bytes: response.bytes.length,
      sha256: sha256(response.bytes),
      rawFile,
      evidenceCount: evidence.length,
      error: null,
    });
  } catch (error) {
    scriptRecords.push({ requestedUrl: url, error: error instanceof Error ? error.message : String(error) });
  }
}

const literalApiRoutes = [...new Map(
  allJsEvidence
    .filter((item) => item.resolvedUrl)
    .filter((item) => !/[{}$+]/u.test(item.rawRoute || ''))
    .filter((item) => /api|featured|issue|calendar|date|year|browse|publication|search/iu.test(`${item.resolvedUrl} ${item.context}`))
    .map((item) => [item.resolvedUrl, item]),
).values()].slice(0, 60);

const apiRecords = [];
for (let index = 0; index < literalApiRoutes.length; index += 1) {
  const route = literalApiRoutes[index];
  try {
    const response = await session.fetch(route.resolvedUrl, { referer: route.scriptUrl });
    const classification = classifyResponse(response);
    const extension = classification === 'json' ? 'json' : classification === 'html' ? 'html' : 'txt';
    const rawFile = `raw/api-${String(index + 1).padStart(2, '0')}.${extension}`;
    await writeFile(join(outputRoot, rawFile), response.bytes);
    const text = classification === 'html' ? visibleText(response.text) : normalize(response.text);
    const issues = classification === 'html' ? extractIssues(response.text, response.finalUrl, 'api-route') : [];
    issues.forEach((issue) => allIssues.push(issue));
    apiRecords.push({
      requestedUrl: route.resolvedUrl,
      finalUrl: response.finalUrl,
      status: response.status,
      contentType: response.contentType,
      classification,
      bytes: response.bytes.length,
      sha256: sha256(response.bytes),
      visibleTextSha256: sha256(Buffer.from(text, 'utf8')),
      rawFile,
      sourceScriptUrl: route.scriptUrl,
      sourceContextSha256: route.contextSha256,
      targetMarkers: targetMarkers(text),
      accessMarkers: accessMarkers(text, response.status),
      issueLinks: issues.length,
      error: null,
    });
  } catch (error) {
    apiRecords.push({ requestedUrl: route.resolvedUrl, sourceScriptUrl: route.scriptUrl, error: error instanceof Error ? error.message : String(error) });
  }
}

const uniqueIssues = [...new Map(allIssues.map((issue) => [issue.url, issue])).values()];
const exactIssueCandidates = uniqueIssues.filter((issue) => issue.targetMarkers.exactDateAndIssueTogether);
const issueFetchRecords = [];
for (let index = 0; index < exactIssueCandidates.length; index += 1) {
  const issue = exactIssueCandidates[index];
  try {
    const response = await session.fetch(issue.url, { referer: featuredUrl });
    const classification = classifyResponse(response);
    const rawFile = `raw/exact-issue-${String(index + 1).padStart(2, '0')}.${classification === 'html' ? 'html' : 'bin'}`;
    await writeFile(join(outputRoot, rawFile), response.bytes);
    const text = classification === 'html' ? visibleText(response.text) : normalize(response.text);
    issueFetchRecords.push({
      issue,
      requestedUrl: issue.url,
      finalUrl: response.finalUrl,
      status: response.status,
      contentType: response.contentType,
      classification,
      bytes: response.bytes.length,
      sha256: sha256(response.bytes),
      visibleTextSha256: sha256(Buffer.from(text, 'utf8')),
      rawFile,
      targetMarkers: targetMarkers(text),
      accessMarkers: accessMarkers(text, response.status),
      exactIssueMetadataVerified: targetMarkers(text).exactDateAndIssueTogether || issue.targetMarkers.exactDateAndIssueTogether,
      facsimileAcquired: classification === 'pdf' || classification === 'image',
      error: null,
    });
  } catch (error) {
    issueFetchRecords.push({ issue, requestedUrl: issue.url, error: error instanceof Error ? error.message : String(error) });
  }
}

const allTextRecords = [...seedRecords, ...formRecords, ...apiRecords].filter((record) => !record.error);
const archiveIdentityRecords = allTextRecords.filter((record) => record.archiveIdentity && (
  record.archiveIdentity.pravdaDigitalArchivePresent &&
  (record.archiveIdentity.udb870Present || record.archiveIdentity.titleId9305Present || record.archiveIdentity.archiveFrom1912Present)
));
const exactTargetTextRecords = allTextRecords.filter((record) => record.targetMarkers?.exactDateAndIssueTogether);
const subscriptionBoundaries = [...seedRecords, ...formRecords, ...apiRecords, ...issueFetchRecords]
  .filter((record) => !record.error)
  .filter((record) => record.accessMarkers && (
    record.accessMarkers.forbiddenStatus ||
    record.accessMarkers.accountAccessDeniedPresent ||
    record.accessMarkers.subscriptionTermsPresent
  ));

const manifest = {
  schema: 'yesenin-pravda-eastview-discovery-pass27/v1',
  generatedAt: new Date().toISOString(),
  authority: 'East View Information Services',
  target: {
    publication: 'Правда',
    udbId,
    titleId,
    date: targetDateIso,
    issueNumber: '252',
    archiveUrl,
    featuredUrl,
  },
  seeds: seedRecords,
  forms: allForms,
  formDerivedRequests: formRecords,
  scripts: scriptRecords,
  jsEvidence: allJsEvidence,
  apiRecords,
  issues: uniqueIssues,
  exactIssueCandidates,
  issueFetchRecords,
  effectiveState: {
    successfulSeedResponses: seedRecords.filter((record) => !record.error).length,
    archiveIdentityRecords: archiveIdentityRecords.length,
    formsFound: allForms.length,
    formDerived1921Requests: formRecords.length,
    officialScriptsAcquired: scriptRecords.filter((record) => !record.error).length,
    jsEvidenceRecords: allJsEvidence.length,
    literalApiRoutesProbed: apiRecords.length,
    issueLinksFound: uniqueIssues.length,
    exactIssueCandidates: exactIssueCandidates.length,
    exactTargetTextRecords: exactTargetTextRecords.length,
    exactIssueMetadataVerified: issueFetchRecords.some((record) => record.exactIssueMetadataVerified),
    exactIssueUrl: exactIssueCandidates.length === 1 ? exactIssueCandidates[0].url : null,
    facsimileAcquired: issueFetchRecords.some((record) => record.facsimileAcquired),
    subscriptionBoundaryRecords: subscriptionBoundaries.length,
    issueIdConstructed: false,
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
  '# East View Pravda issue discovery pass 27',
  '',
  `- Successful seed responses: ${manifest.effectiveState.successfulSeedResponses}/${seedRecords.length}`,
  `- Archive identity records: ${archiveIdentityRecords.length}`,
  `- Forms found: ${allForms.length}`,
  `- Form-derived 1921 requests: ${formRecords.length}`,
  `- Official JavaScript files acquired: ${manifest.effectiveState.officialScriptsAcquired}`,
  `- JavaScript evidence records: ${allJsEvidence.length}`,
  `- Literal API routes probed: ${apiRecords.length}`,
  `- Issue links found: ${uniqueIssues.length}`,
  `- Exact 9 Nov 1921 / no. 252 candidates: ${exactIssueCandidates.length}`,
  `- Exact issue metadata verified: ${manifest.effectiveState.exactIssueMetadataVerified}`,
  `- Facsimile acquired: ${manifest.effectiveState.facsimileAcquired}`,
  `- Subscription/access boundary records: ${subscriptionBoundaries.length}`,
  '- Constructed issue ID: false',
  '- Neighbor inference: false',
  '- OCR used: false',
  '',
];
await writeFile(join(outputRoot, 'SUMMARY.md'), `${summary.join('\n')}\n`, 'utf8');
console.log(summary.join('\n'));

if (archiveIdentityRecords.length < 1) {
  throw new Error('no official East View record established the Pravda archive identity');
}
