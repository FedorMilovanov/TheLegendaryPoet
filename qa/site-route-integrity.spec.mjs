import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const BASE_ORIGIN = new URL(BASE_URL).origin;
const SITEMAP_PATH = path.resolve('public/sitemap.xml');
const ARTIFACT_DIR = path.resolve('qa-artifacts/site-route-integrity');
const MIN_CANONICAL_ROUTES = 28;
const MIN_AUDITED_ROUTES = 35;

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function readCanonicalRoutes() {
  if (!fs.existsSync(SITEMAP_PATH)) {
    throw new Error('public/sitemap.xml is missing; run npm run sitemap before the route audit');
  }
  const xml = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const routes = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => new URL(decodeXml(match[1])).pathname)
    .filter((pathname, index, all) => all.indexOf(pathname) === index)
    .sort();
  if (routes.length < MIN_CANONICAL_ROUTES) {
    throw new Error(`route audit expected at least ${MIN_CANONICAL_ROUTES} canonical sitemap URLs, received ${routes.length}`);
  }
  return routes;
}

const canonicalRoutes = readCanonicalRoutes();
const utilityRoutes = ['/hall', '/archive'];
const redirects = [
  ['/articles/article-1', '/poets/alexander-pushkin'],
  ['/articles/article-2', '/essays/yesenin-kutezhi'],
  ['/articles/article-3', '/poets/anna-akhmatova'],
  ['/articles/article-main-1', '/articles'],
  ['/articles/article-main-2', '/music'],
  ['/articles/route-audit-legacy', '/articles'],
];
const notFoundRoute = '/route-audit-page-that-must-not-exist';
const renderedRoutes = [...new Set([...canonicalRoutes, ...utilityRoutes])];
const knownInternalPaths = new Set([
  ...renderedRoutes,
  ...redirects.flatMap(([source, target]) => [source, target]),
]);
const auditedRouteCount = renderedRoutes.length + redirects.length + 1;

if (auditedRouteCount < MIN_AUDITED_ROUTES) {
  throw new Error(`route audit expected at least ${MIN_AUDITED_ROUTES} URLs, received ${auditedRouteCount}`);
}

function routeArtifactName(route) {
  return route === '/'
    ? 'home'
    : route.replace(/^\//, '').replace(/[^a-z0-9-]+/gi, '-').replace(/-+$/g, '') || 'route';
}

function attachRuntimeDiagnostics(page) {
  const pageErrors = [];
  const failedResponses = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.origin === BASE_ORIGIN && response.status() >= 400) {
      failedResponses.push({ status: response.status(), url: response.url() });
    }
  });
  return { pageErrors, failedResponses };
}

async function settleRoute(page) {
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);
  await page.waitForTimeout(220);
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
}

async function waitForViewportImages(page) {
  const viewportImages = page.locator('img').filter({ visible: true });
  await expect.poll(async () => viewportImages.evaluateAll((images) => images.every((image) => {
    const rect = image.getBoundingClientRect();
    const intersectsViewport = rect.width > 1 && rect.height > 1 && rect.bottom > 0 && rect.top < window.innerHeight;
    if (!intersectsViewport) return true;
    return image.complete && image.naturalWidth > 0 && image.naturalHeight > 0;
  })), {
    timeout: 10_000,
    message: 'all visible viewport images should decode',
  }).toBe(true);
}

async function inspectRenderedRoute(page, expectedPath, { requireCanonical = true } = {}) {
  const snapshot = await page.evaluate(({ expectedPath, requireCanonical }) => {
    const main = document.querySelector('#main-content');
    const heading = main?.querySelector('h1, [role="heading"][aria-level="1"]');
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null;
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
    const bodyText = document.body.innerText;
    const internalLinks = [...document.querySelectorAll('a[href]')]
      .map((anchor) => anchor.getAttribute('href'))
      .filter(Boolean)
      .filter((href) => !href.startsWith('#') && !/^(?:mailto:|tel:|javascript:)/i.test(href))
      .map((href) => new URL(href, window.location.href))
      .filter((url) => url.origin === window.location.origin)
      .map((url) => url.pathname)
      .filter((pathname, index, all) => all.indexOf(pathname) === index)
      .sort();
    return {
      pathname: window.location.pathname,
      title: document.title.trim(),
      description,
      canonical,
      canonicalPath: canonical ? new URL(canonical, window.location.href).pathname : null,
      requireCanonical,
      mainTextLength: main?.textContent?.replace(/\s+/g, ' ').trim().length || 0,
      headingText: heading?.textContent?.replace(/\s+/g, ' ').trim() || '',
      headerPresent: Boolean(document.querySelector('header')),
      footerPresent: Boolean(document.querySelector('footer')),
      brandPresent: Boolean(document.querySelector('[data-brand-mark], [data-brand-emblem], svg[aria-label*="LEGENDARY" i]')),
      visibleBusyRegions: [...document.querySelectorAll('[aria-busy="true"]')].filter((node) => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 1 && rect.height > 1;
      }).length,
      horizontalOverflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - window.innerWidth,
      hasRuntimeFailureText: /ChunkLoadError|Failed to fetch dynamically imported module|Что-то пошло не так|Ошибка загрузки страницы/i.test(bodyText),
      internalLinks,
      expectedPath,
    };
  }, { expectedPath, requireCanonical });

  expect(snapshot.pathname).toBe(expectedPath);
  expect(snapshot.title.length).toBeGreaterThan(5);
  expect(snapshot.description.length).toBeGreaterThan(20);
  expect(snapshot.mainTextLength).toBeGreaterThan(35);
  expect(snapshot.headingText.length).toBeGreaterThan(1);
  expect(snapshot.headerPresent).toBe(true);
  expect(snapshot.footerPresent).toBe(true);
  expect(snapshot.brandPresent).toBe(true);
  expect(snapshot.visibleBusyRegions).toBe(0);
  expect(snapshot.horizontalOverflow).toBeLessThanOrEqual(2);
  expect(snapshot.hasRuntimeFailureText).toBe(false);
  if (requireCanonical) expect(snapshot.canonicalPath).toBe(expectedPath);

  const unknownInternalLinks = snapshot.internalLinks.filter((pathname) => {
    if (knownInternalPaths.has(pathname)) return false;
    if (/\.[a-z0-9]{2,5}$/i.test(pathname)) return false;
    return true;
  });
  expect(unknownInternalLinks, `unknown internal route links rendered on ${expectedPath}`).toEqual([]);

  return snapshot;
}

async function writeEvidence(route, payload) {
  const filename = `${routeArtifactName(route)}.json`;
  fs.writeFileSync(path.join(ARTIFACT_DIR, filename), `${JSON.stringify(payload, null, 2)}\n`);
}

test('route inventory is generated from production sitemap and covers at least 35 URLs', async () => {
  expect(canonicalRoutes.length).toBeGreaterThanOrEqual(MIN_CANONICAL_ROUTES);
  expect(auditedRouteCount).toBeGreaterThanOrEqual(MIN_AUDITED_ROUTES);
  expect(renderedRoutes).toContain('/');
  expect(renderedRoutes).toContain('/hall');
  expect(renderedRoutes).toContain('/archive');
});

for (const route of renderedRoutes) {
  test(`route integrity: ${route}`, async ({ page }) => {
    const runtime = attachRuntimeDiagnostics(page);
    const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    expect(response?.status() ?? 0).toBeLessThan(400);
    await settleRoute(page);
    await waitForViewportImages(page);
    const snapshot = await inspectRenderedRoute(page, route, { requireCanonical: canonicalRoutes.includes(route) });
    await writeEvidence(route, { kind: canonicalRoutes.includes(route) ? 'canonical' : 'utility', route, snapshot, runtime });
    expect(runtime.pageErrors).toEqual([]);
    expect(runtime.failedResponses).toEqual([]);
  });
}

for (const [source, target] of redirects) {
  test(`legacy redirect: ${source} -> ${target}`, async ({ page }) => {
    const runtime = attachRuntimeDiagnostics(page);
    const response = await page.goto(`${BASE_URL}${source}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    expect(response?.status() ?? 0).toBeLessThan(400);
    await expect.poll(() => page.evaluate(() => window.location.pathname), { timeout: 12_000 }).toBe(target);
    await settleRoute(page);
    await waitForViewportImages(page);
    const snapshot = await inspectRenderedRoute(page, target, { requireCanonical: canonicalRoutes.includes(target) });
    await writeEvidence(source, { kind: 'redirect', source, target, snapshot, runtime });
    expect(runtime.pageErrors).toEqual([]);
    expect(runtime.failedResponses).toEqual([]);
  });
}

test(`not-found route remains a healthy app shell: ${notFoundRoute}`, async ({ page }) => {
  const runtime = attachRuntimeDiagnostics(page);
  const response = await page.goto(`${BASE_URL}${notFoundRoute}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  expect(response?.status() ?? 0).toBeLessThan(400);
  await settleRoute(page);
  const snapshot = await page.evaluate(() => ({
    pathname: window.location.pathname,
    title: document.title.trim(),
    mainText: document.querySelector('#main-content')?.textContent?.replace(/\s+/g, ' ').trim() || '',
    horizontalOverflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - window.innerWidth,
    headerPresent: Boolean(document.querySelector('header')),
    footerPresent: Boolean(document.querySelector('footer')),
  }));
  expect(snapshot.pathname).toBe(notFoundRoute);
  expect(snapshot.title.length).toBeGreaterThan(5);
  expect(snapshot.mainText).toMatch(/404|не найден|не существует/i);
  expect(snapshot.horizontalOverflow).toBeLessThanOrEqual(2);
  expect(snapshot.headerPresent).toBe(true);
  expect(snapshot.footerPresent).toBe(true);
  await writeEvidence(notFoundRoute, { kind: 'not-found', route: notFoundRoute, snapshot, runtime });
  expect(runtime.pageErrors).toEqual([]);
  expect(runtime.failedResponses).toEqual([]);
});
