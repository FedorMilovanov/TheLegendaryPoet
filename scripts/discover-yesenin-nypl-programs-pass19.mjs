#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputRoot = 'artifacts/yesenin-nypl-programs-pass19';
const rawRoot = join(outputRoot, 'raw');
const token = process.env.NYPL_API_TOKEN?.trim() || null;

const itemUuids = [
  '89b93c5d-a42e-99bb-e040-e00a18066f5f',
  '311074d0-26fa-0137-dbf3-5fc18a3ba411',
  'ef354620-26fa-0137-4425-5325a3c555ef',
  '522978b0-26fb-0137-0433-0f1659985b85',
];

const endpointTemplates = [
  ['items', (uuid) => `https://api.repo.nypl.org/api/v2/items/${uuid}`],
  ['mods', (uuid) => `https://api.repo.nypl.org/api/v2/mods/${uuid}`],
  ['mods-captures', (uuid) => `https://api.repo.nypl.org/api/v2/items/mods_captures/${uuid}`],
  ['rights', (uuid) => `https://api.repo.nypl.org/api/v2/items/rights/${uuid}`],
  ['public-item-page', (uuid) => `https://digitalcollections.nypl.org/items/${uuid}`],
];

const userAgent = 'TheLegendaryPoet-NYPL-Research/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)';
const hash = (data) => createHash('sha256').update(data).digest('hex');

function safeName(value) {
  return value.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function classify(status, contentType, body) {
  const lowerType = contentType.toLowerCase();
  const prefix = body.subarray(0, 256).toString('utf8').trimStart().toLowerCase();
  if (status === 401 || status === 403) return 'auth-required-or-forbidden';
  if (status === 404) return 'not-found';
  if (status === 429) return 'rate-limited';
  if (status >= 500) return 'server-error';
  if (status < 200 || status >= 300) return 'http-error';
  if (lowerType.includes('application/json') || prefix.startsWith('{') || prefix.startsWith('[')) {
    return 'json-acquired';
  }
  if (
    lowerType.includes('application/xml') ||
    lowerType.includes('text/xml') ||
    prefix.startsWith('<?xml') ||
    prefix.startsWith('<mods')
  ) {
    return 'xml-acquired';
  }
  if (lowerType.includes('text/html') || prefix.startsWith('<!doctype html') || prefix.startsWith('<html')) {
    return 'html-acquired';
  }
  return 'unknown-2xx-payload';
}

function extractUrls(text) {
  const urls = new Set();
  for (const match of text.matchAll(/https?:\\?\/\\?\/[^"'<>\s)]+/gi)) {
    const normalized = match[0].replace(/\\\//g, '/').replace(/[.,;]+$/g, '');
    try {
      urls.add(new URL(normalized).toString());
    } catch {
      // Preserve only parseable absolute URLs.
    }
  }
  return [...urls].sort();
}

async function fetchOne({ uuid, endpoint, url, authenticated }) {
  const headers = {
    'user-agent': userAgent,
    accept: endpoint === 'public-item-page'
      ? 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.2'
      : 'application/json,application/xml;q=0.9,text/xml;q=0.8,*/*;q=0.2',
    'accept-language': 'en,ru;q=0.7',
  };
  if (authenticated && token) {
    headers.authorization = `Token token="${token}"`;
  }

  const startedAt = new Date().toISOString();
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers,
      signal: AbortSignal.timeout(90_000),
    });
    const arrayBuffer = await response.arrayBuffer();
    const body = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || '';
    const classification = classify(response.status, contentType, body);
    const mode = authenticated ? 'authenticated' : 'anonymous';
    const extension = classification.startsWith('json')
      ? 'json'
      : classification.startsWith('xml')
        ? 'xml'
        : classification.startsWith('html')
          ? 'html'
          : 'bin';
    const fileName = `${uuid}--${safeName(endpoint)}--${mode}.${extension}`;
    await writeFile(join(rawRoot, fileName), body);
    const text = body.toString('utf8');
    const extractedUrls = extractUrls(text);
    const imageCandidates = extractedUrls.filter((candidate) =>
      /image|iiif|digitalcollections|static|\.jpe?g(?:$|[?#])|\.tiff?(?:$|[?#])|\.png(?:$|[?#])/i.test(candidate),
    );
    return {
      uuid,
      endpoint,
      requestedUrl: url,
      finalUrl: response.url,
      mode,
      status: response.status,
      contentType,
      classification,
      bytes: body.length,
      sha256: hash(body),
      etag: response.headers.get('etag'),
      lastModified: response.headers.get('last-modified'),
      retryAfter: response.headers.get('retry-after'),
      rawFile: `raw/${fileName}`,
      extractedUrls,
      imageCandidates,
      startedAt,
      completedAt: new Date().toISOString(),
      networkError: null,
    };
  } catch (error) {
    return {
      uuid,
      endpoint,
      requestedUrl: url,
      finalUrl: null,
      mode: authenticated ? 'authenticated' : 'anonymous',
      status: null,
      contentType: null,
      classification: 'network-error',
      bytes: 0,
      sha256: null,
      etag: null,
      lastModified: null,
      retryAfter: null,
      rawFile: null,
      extractedUrls: [],
      imageCandidates: [],
      startedAt,
      completedAt: new Date().toISOString(),
      networkError: error instanceof Error ? error.message : String(error),
    };
  }
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(rawRoot, { recursive: true });

const requests = [];
for (const uuid of itemUuids) {
  for (const [endpoint, buildUrl] of endpointTemplates) {
    const url = buildUrl(uuid);
    requests.push(await fetchOne({ uuid, endpoint, url, authenticated: false }));
    if (token && endpoint !== 'public-item-page') {
      requests.push(await fetchOne({ uuid, endpoint, url, authenticated: true }));
    }
  }
}

const successfulMachinePayloads = requests.filter((request) =>
  request.endpoint !== 'public-item-page' &&
  (request.classification === 'json-acquired' || request.classification === 'xml-acquired'),
);
const authBoundaries = requests.filter((request) => request.classification === 'auth-required-or-forbidden');
const publicPages = requests.filter((request) => request.endpoint === 'public-item-page');
const unexpectedApiHtml = requests.filter((request) =>
  request.endpoint !== 'public-item-page' && request.classification === 'html-acquired',
);
const imageCandidates = [...new Set(requests.flatMap((request) => request.imageCandidates))].sort();

const manifest = {
  schema: 'yesenin-nypl-programs-pass19/v1',
  generatedAt: new Date().toISOString(),
  apiAuthority: 'The New York Public Library Digital Collections API v2',
  apiDocumentation: 'https://api.repo.nypl.org/',
  apiDeprecationBoundary: 'API scheduled to become unavailable starting 2026-08-01; no public replacement announced by NYPL.',
  authenticationDocumented: true,
  tokenPresent: Boolean(token),
  tokenValueStored: false,
  itemUuids,
  endpointNames: endpointTemplates.map(([name]) => name),
  requestCount: requests.length,
  successfulMachinePayloads: successfulMachinePayloads.length,
  authBoundaryResponses: authBoundaries.length,
  unexpectedApiHtmlResponses: unexpectedApiHtml.length,
  publicItemPages: publicPages.length,
  imageCandidateCount: imageCandidates.length,
  imageCandidates,
  requests,
  syntheticContentUsed: false,
  ocrUsed: false,
  contentInspected: successfulMachinePayloads.length > 0,
  productionAuthorized: false,
};

await writeFile(join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const lines = [
  '# NYPL Duncan program discovery pass 19',
  '',
  `- UUIDs: ${itemUuids.length}`,
  `- Requests: ${requests.length}`,
  `- API token present: ${Boolean(token)}`,
  `- Machine-readable payloads acquired: ${successfulMachinePayloads.length}`,
  `- Auth/forbidden responses: ${authBoundaries.length}`,
  `- Unexpected API HTML responses: ${unexpectedApiHtml.length}`,
  `- Public item pages fetched: ${publicPages.filter((entry) => entry.status === 200).length}/${publicPages.length}`,
  `- Image/IIIF candidates: ${imageCandidates.length}`,
  '- Synthetic content: false',
  '- OCR used: false',
  '- Production authorization: false',
  '',
  'UUID | Endpoint | Mode | HTTP | Classification | Bytes | SHA-256',
  '--- | --- | --- | ---: | --- | ---: | ---',
  ...requests.map((request) =>
    [
      request.uuid,
      request.endpoint,
      request.mode,
      request.status ?? 'NETWORK',
      request.classification,
      request.bytes,
      request.sha256 ?? 'NONE',
    ].join(' | '),
  ),
  '',
];
await writeFile(join(outputRoot, 'SUMMARY.md'), `${lines.join('\n')}\n`, 'utf8');

console.log(lines.slice(0, 14).join('\n'));

const fatal = requests.filter((request) =>
  request.classification === 'network-error' ||
  request.classification === 'unknown-2xx-payload' ||
  request.classification === 'server-error',
);
if (fatal.length > 0) {
  throw new Error(`NYPL pass 19 encountered ${fatal.length} fatal/unclassified responses; inspect artifact.`);
}
