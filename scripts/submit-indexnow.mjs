import fs from 'node:fs';
import path from 'node:path';

const SITE_URL = (process.env.SITE_URL || 'https://thelegendarypoet.ru').replace(/\/$/, '');
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '189937c25bd79e9d675311b76f9481854c85722f';
const SITEMAP_PATH = path.resolve(process.env.SITEMAP_PATH || 'public/sitemap.xml');
const ENDPOINT = process.env.INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow';

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

const xml = fs.readFileSync(SITEMAP_PATH, 'utf8');
const urlList = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
  .map((match) => decodeXml(match[1].trim()))
  .filter((url) => url.startsWith(`${SITE_URL}/`) || url === SITE_URL);

if (!urlList.length) {
  throw new Error(`IndexNow: no URLs found in ${SITEMAP_PATH}`);
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

console.log(`IndexNow accepted ${urlList.length} URLs with status ${response.status}`);
