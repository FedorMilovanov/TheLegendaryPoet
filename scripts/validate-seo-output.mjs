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
const duplicateRouteFiles = htmlFiles.filter((file) => !file.endsWith('/index.html') && file !== 'index.html' && file !== '404.html');
expect(duplicateRouteFiles.length === 0, `duplicate route HTML files found: ${duplicateRouteFiles.join(', ')}`);

expect(/<meta name="robots" content="noindex,follow"\s*\/?>/.test(notFoundHtml), '404.html must be noindex,follow');
expect(notFoundHtml.includes('<title>Страница не найдена — THE LEGENDARY POET</title>'), '404.html must have a dedicated title');
expect(!notFoundHtml.includes('rel="canonical"'), '404.html must not canonicalize errors to the homepage');

if (failures.length) {
  console.error('\nSEO output validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`SEO output validation passed: ${uniqueUrls.size} canonical URLs, ${htmlFiles.length} HTML documents, Atom feed and noindex 404 verified.`);
