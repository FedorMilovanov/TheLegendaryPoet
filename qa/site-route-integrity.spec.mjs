import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const BASE_ORIGIN = new URL(BASE_URL).origin;
const SITEMAP_PATH = path.resolve('public/sitemap.xml');
const ROUTE_CONTRACT_PATH = path.resolve('src/routes/route-contract.json');
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
const routeContract = JSON.parse(fs.readFileSync(ROUTE_CONTRACT_PATH, 'utf8'));
const utilityRoutes = routeContract.routes
  .filter((route) => route.audit === 'utility')
  .map((route) => route.path);
const redirects = routeContract.redirects.map(({ from, to }) => [from, to]);
const notFoundRoutes = routeContract.notFoundProbes;
const renderedRoutes = [...new Set([...canonicalRoutes, ...utilityRoutes])];
const knownInternalPaths = new Set([
  ...renderedRoutes,
  ...redirects.flatMap(([source, target]) => [source, target]),
]);
const auditedRouteCount = renderedRoutes.length + redirects.length + notFoundRoutes.length;

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
  const main = page.locator('#main-content');
  await main.waitFor({ state: 'visible', timeout: 20_000 });
  await expect(main.locator('[aria-busy="true"]:visible')).toHaveCount(0);
  await expect(main.locator('h1, [role="heading"][aria-level="1"]').first()).toBeVisible();
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

async function machineHeadSnapshot(page) {
  return page.evaluate(() => ({
    title: document.title,
    robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') || null,
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
    ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute('content') || null,
    routeJsonLd: Boolean(document.getElementById('route-jsonld')),
  }));
}

function expectNonCanonicalMachineState(snapshot, titlePattern) {
  expect(snapshot.title).toMatch(titlePattern);
  expect(snapshot.robots).toMatch(/^noindex/);
  expect(snapshot.canonical).toBeNull();
  expect(snapshot.ogUrl).toBeNull();
  expect(snapshot.routeJsonLd).toBe(false);
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
    const staticResponse = await page.request.get(`${BASE_URL}${source}`, { maxRedirects: 0 });
    expect(staticResponse.status()).toBe(200);
    const aliasHtml = await staticResponse.text();
    expect(aliasHtml).toContain(`data-legacy-alias="${source}"`);
    expect(aliasHtml).toContain('<meta name="robots" content="noindex,follow" />');
    expect(aliasHtml).toContain(`<meta name="tlp-legacy-alias-target" content="${target}" />`);
    expect(aliasHtml).toContain(`<link rel="canonical" href="https://thelegendarypoet.ru${target}" />`);
    expect(aliasHtml).toContain(`<meta http-equiv="refresh" content="0;url=${target}" />`);

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

for (const notFoundRoute of notFoundRoutes) {
  test(`not-found route keeps static and hydrated machine metadata equivalent: ${notFoundRoute}`, async ({ page }) => {
    const staticResponse = await page.request.get(`${BASE_URL}${notFoundRoute}`, { maxRedirects: 0 });
    expect(staticResponse.status()).toBe(404);
    const staticHtml = await staticResponse.text();
    expect(staticHtml).toContain('<meta name="robots" content="noindex,follow" />');
    expect(staticHtml).not.toContain('rel="canonical"');
    expect(staticHtml).not.toContain('property="og:url"');
    expect(staticHtml).not.toContain('id="route-jsonld"');

    const runtime = attachRuntimeDiagnostics(page);
    const response = await page.goto(`${BASE_URL}${notFoundRoute}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    expect(response?.status()).toBe(404);
    await settleRoute(page);

    const snapshot = await page.evaluate(() => ({
      pathname: window.location.pathname,
      title: document.title.trim(),
      mainText: document.querySelector('#main-content')?.textContent?.replace(/\s+/g, ' ').trim() || '',
      horizontalOverflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - window.innerWidth,
      headerPresent: Boolean(document.querySelector('header')),
      footerPresent: Boolean(document.querySelector('footer')),
    }));
    const head = await machineHeadSnapshot(page);

    expect(snapshot.pathname).toBe(notFoundRoute);
    expect(snapshot.mainText).toMatch(/404|не найден|не существует/i);
    expect(snapshot.horizontalOverflow).toBeLessThanOrEqual(2);
    expect(snapshot.headerPresent).toBe(true);
    expect(snapshot.footerPresent).toBe(true);
    expectNonCanonicalMachineState(head, /Страница не найдена/i);

    await writeEvidence(notFoundRoute, { kind: 'not-found', route: notFoundRoute, snapshot, head, runtime });
    expect(runtime.pageErrors).toEqual([]);
    expect(runtime.failedResponses).toHaveLength(1);
    expect(runtime.failedResponses[0]?.status).toBe(404);
    expect(new URL(runtime.failedResponses[0]?.url || BASE_URL).pathname).toBe(notFoundRoute);
  });
}

test('SPA navigation to not-found removes previous canonical, og:url and route schema', async ({ page }) => {
  await page.goto(`${BASE_URL}/about`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await settleRoute(page);
  const before = await machineHeadSnapshot(page);
  expect(new URL(before.canonical).pathname).toBe('/about');
  expect(before.routeJsonLd).toBe(true);

  const missing = '/discovery-spa-missing-route';
  await page.evaluate((pathname) => {
    window.history.pushState({}, '', pathname);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, missing);
  await expect(page.locator('#main-content')).toContainText(/404|не найден|не существует/i);
  const after = await machineHeadSnapshot(page);
  expect(page.url()).toBe(`${BASE_URL}${missing}`);
  expectNonCanonicalMachineState(after, /Страница не найдена/i);
});

test('lazy loading owns a neutral machine head before the destination settles', async ({ page }) => {
  await page.goto(`${BASE_URL}/about`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await settleRoute(page);

  let delayNextAssetScript = true;
  await page.route('**/*.js', async (route) => {
    const url = new URL(route.request().url());
    if (delayNextAssetScript && url.origin === BASE_ORIGIN && url.pathname.startsWith('/assets/')) {
      delayNextAssetScript = false;
      await new Promise((resolve) => setTimeout(resolve, 1_500));
    }
    await route.continue();
  });

  await page.evaluate(() => {
    window.history.pushState({}, '', '/privacy');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });

  await expect.poll(async () => (await machineHeadSnapshot(page)).title, { timeout: 1_000 }).toMatch(/Загрузка страницы/i);
  expectNonCanonicalMachineState(await machineHeadSnapshot(page), /Загрузка страницы/i);

  await settleRoute(page);
  await expect.poll(async () => {
    const canonical = (await machineHeadSnapshot(page)).canonical;
    return canonical ? new URL(canonical, page.url()).pathname : null;
  }, {
    timeout: 5_000,
    message: 'ready discovery metadata should restore the /privacy canonical after lazy loading',
  }).toBe('/privacy');

  const ready = await machineHeadSnapshot(page);
  expect(new URL(ready.canonical, page.url()).pathname).toBe('/privacy');
  expect(ready.ogUrl).toContain('/privacy');
  expect(ready.routeJsonLd).toBe(true);
});

test('lazy route error clears stale head and reload recovery restores canonical metadata', async ({ page, context }) => {
  await page.goto(`${BASE_URL}/about`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await settleRoute(page);
  const before = await machineHeadSnapshot(page);
  expect(new URL(before.canonical).pathname).toBe('/about');

  await context.setOffline(true);
  await page.evaluate(() => {
    window.history.pushState({}, '', '/ratings');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10_000 });
  expectNonCanonicalMachineState(await machineHeadSnapshot(page), /Ошибка загрузки страницы/i);

  await context.setOffline(false);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
  await settleRoute(page);
  const recovered = await machineHeadSnapshot(page);
  expect(new URL(recovered.canonical).pathname).toBe('/ratings');
  expect(recovered.ogUrl).toContain('/ratings');
  expect(recovered.routeJsonLd).toBe(true);
  expect(recovered.title).not.toMatch(/Ошибка загрузки страницы/i);
});

