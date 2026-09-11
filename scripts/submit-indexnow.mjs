import fs from 'node:fs';
import path from 'node:path';
import { computeIndexNowDelta } from './indexnow-delta.mjs';

const SITE_URL = (process.env.SITE_URL || 'https://thelegendarypoet.ru').replace(/\/$/, '');
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '189937c25bd79e9d675311b76f9481854c85722f';
const MANIFEST_PATH = path.resolve(process.env.DISCOVERY_MANIFEST_PATH || 'public/discovery-manifest.json');
const BASE_MANIFEST_PATH = process.env.INDEXNOW_BASE_MANIFEST_PATH
  ? path.resolve(process.env.INDEXNOW_BASE_MANIFEST_PATH)
  : null;
const ENDPOINT = process.env.INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow';
const forceFull = process.env.INDEXNOW_FORCE_FULL === '1';

function readManifest(file, label) {
  if (!fs.existsSync(file)) throw new Error(`IndexNow: missing ${label} discovery manifest at ${file}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const currentManifest = readManifest(MANIFEST_PATH, 'current');
if (currentManifest.site !== SITE_URL) {
  throw new Error(`IndexNow: current manifest site ${currentManifest.site} does not match SITE_URL ${SITE_URL}`);
}

let previousManifest = null;
if (BASE_MANIFEST_PATH && fs.existsSync(BASE_MANIFEST_PATH)) {
  previousManifest = readManifest(BASE_MANIFEST_PATH, 'previous');
}

const delta = computeIndexNowDelta(currentManifest, previousManifest, { forceFull });
const urlList = delta.urls;

if (urlList.length === 0) {
  console.log('IndexNow: no added, changed or deleted canonical URLs; nothing to submit');
  process.exit(0);
}

if (urlList.length > 10_000) {
  throw new Error(`IndexNow: ${urlList.length} URLs exceeds the 10,000 URL request limit`);
}

const payload = {
  host: new URL(SITE_URL).host,
  key: INDEXNOW_KEY,
  keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
  urlList,
};

const response = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
});

if (![200, 202].includes(response.status)) {
  const body = await response.text();
  throw new Error(`IndexNow rejected the request: ${response.status} ${body}`);
}

console.log(
  `IndexNow accepted ${urlList.length} ${delta.mode} URLs with status ${response.status} ` +
  `(added=${delta.added.length}, changed=${delta.changed.length}, deleted=${delta.deleted.length})`,
);
