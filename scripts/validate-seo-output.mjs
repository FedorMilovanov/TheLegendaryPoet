import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const SITE_URL = 'https://thelegendarypoet.ru';
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function read(relativePath) {
  const file = path.join(DIST, relativePath);
  expect(fs.existsSync(file), `missing dist/${relativePath}`);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function htmlForPath(pathname) {
  if (pathname === '/') return read('index.html');
  return read(path.join(pathname.replace(/^\//, ''), 'index.html'));
}

const sitemap = read('sitemap.xml');
const feed = read('feed.xml');
const robots = read('robots.txt');
const rootHtml = read('index.html');
const notFoundHtml = read('404.html');
const routeContract = JSON.parse(fs.readFileSync(path.resolve('src/routes/route-contract.json'), 'utf8'));

expect(sitemap.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'), 'sitemap must declare the image namespace');
expect(sitemap.includes('<lastmod>'), 'sitemap must include truthful lastmod values');
expect(!sitemap.includes('<priority>') && !sitemap.includes('<changefreq>'), 'sitemap must not emit ignored priority/changefreq hints');
expect(feed.includes('xmlns="http://www.w3.org/2005/Atom"'), 'feed.xml must be an Atom feed');
expect(feed.includes(`rel="self" type="application/atom+xml" href="${SITE_URL}/feed.xml"`), 'feed must expose its canonical self URL');
expect(robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`), 'robots.txt must advertise the canonical sitemap');
expect(rootHtml.includes('rel="alternate" type="application/atom+xml"'), 'root HTML must advertise feed.xml');
expect(rootHtml.includes('name="google-site-verification"'), 'production HTML must include Google ownership verification');
expect(rootHtml.includes('name="yandex-verification"'), 'production HTML must include Yandex ownership verification');

const urls = [...sitemap.matchAll(/<loc>(https:\/\/thelegendarypoet\.ru[^<]*)<\/loc>/g)]
  .map((match) => match[1])
  .filter((url) => !/\.(?:jpg|jpeg|png|webp|svg)$/i.test(new URL(url).pathname));
const uniqueUrls = new Set(urls);
expect(urls.length > 10, 'sitemap must contain the public content surface');
expect(uniqueUrls.size === urls.length, 'sitemap URLs must be unique');

for (const urlString of uniqueUrls) {
  const url = new URL(urlString);
  expect(url.origin === SITE_URL, `non-canonical sitemap origin: ${urlString}`);
  expect(!url.pathname.endsWith('.html'), `HTML duplicate leaked into sitemap: ${url.pathname}`);
  expect(!url.search && !url.hash, `sitemap URL must not contain query/hash: ${urlString}`);

  const html = htmlForPath(url.pathname);
  expect(html.includes(`<link rel="canonical" href="${urlString}" />`), `canonical mismatch for ${url.pathname}`);
  expect(!/<meta name="robots" content="[^"]*noindex/i.test(html), `sitemap route is noindex: ${url.pathname}`);
  expect(html.includes('type="application/ld+json"'), `structured data missing for ${url.pathname}`);
}

for (const { from, to } of routeContract.redirects) {
  const aliasHtml = htmlForPath(from);
  const canonicalTarget = `${SITE_URL}${to}`;
  expect(!uniqueUrls.has(`${SITE_URL}${from}`), `legacy alias leaked into sitemap: ${from}`);
  expect(aliasHtml.includes(`data-legacy-alias="${from}"`), `legacy alias marker missing for ${from}`);
  expect(aliasHtml.includes('<meta name="robots" content="noindex,follow" />'), `legacy alias must be noindex,follow: ${from}`);
  expect(aliasHtml.includes('<meta name="googlebot" content="noindex,follow" />'), `legacy alias googlebot policy mismatch: ${from}`);
  expect(aliasHtml.includes(`<meta name="tlp-legacy-alias-target" content="${to}" />`), `legacy alias target marker mismatch: ${from}`);
  expect(aliasHtml.includes(`<link rel="canonical" href="${canonicalTarget}" />`), `legacy alias canonical target mismatch: ${from}`);
  expect(aliasHtml.includes(`<meta http-equiv="refresh" content="0;url=${to}" />`), `legacy alias refresh target mismatch: ${from}`);
  expect(aliasHtml.includes(`window.location.replace(${JSON.stringify(to)})`), `legacy alias script target mismatch: ${from}`);
  expect(aliasHtml.includes(`<a href="${to}">Перейти к актуальной странице</a>`), `legacy alias fallback link missing: ${from}`);
}

function collectHtmlFiles(dir, relative = '') {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(relative, entry.name);
    if (entry.isDirectory()) results.push(...collectHtmlFiles(path.join(dir, entry.name), rel));
    else if (entry.name.endsWith('.html')) results.push(rel.replace(/\\/g, '/'));
  }
  return results;
}

const htmlFiles = collectHtmlFiles(DIST);
const allowedRootHtml = /^(?:index|404|yandex_[a-z0-9_-]+)\.html$/i;
const duplicateRouteFiles = htmlFiles.filter((file) => !file.endsWith('/index.html') && !allowedRootHtml.test(file));
expect(duplicateRouteFiles.length === 0, `duplicate route HTML files found: ${duplicateRouteFiles.join(', ')}`);

expect(/<meta name="robots" content="noindex,follow"\s*\/?>/.test(notFoundHtml), '404.html must be noindex,follow');
expect(notFoundHtml.includes('<title>Страница не найдена — THE LEGENDARY POET</title>'), '404.html must have a dedicated title');
expect(!notFoundHtml.includes('rel="canonical"'), '404.html must not canonicalize errors to the homepage');
expect(!notFoundHtml.includes('property="og:url"'), '404.html must not expose an og:url');
expect(!notFoundHtml.includes('id="route-jsonld"'), '404.html must not expose route-level structured data');

if (failures.length) {
  console.error('\nSEO output validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`SEO output validation passed: ${uniqueUrls.size} canonical URLs, ${routeContract.redirects.length} materialized legacy aliases, ${htmlFiles.length} HTML documents, Atom feed and noindex 404 verified.`);
