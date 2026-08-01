import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
const CHROME_TRANSITION_MS = 700;
const STRATEGIC_SELECTOR = [
  '#main-content section',
  '#main-content article',
  '#main-content img[loading="lazy"]',
  '#main-content [data-image-state]',
].join(',');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

function attachRuntimeDiagnostics(page) {
  const result = { pageErrors: [], consoleErrors: [], localRequestFailures: [] };
  page.on('pageerror', (error) => result.pageErrors.push(String(error?.stack || error)));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/Failed to load resource/i.test(text)) return;
    result.consoleErrors.push(text);
  });
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (!url.startsWith(BASE_URL)) return;
    const failure = request.failure()?.errorText || 'unknown failure';
    if (/ERR_ABORTED/i.test(failure)) return;
    if ((request.resourceType() === 'media' || /\.mp3(?:$|\?)/i.test(url)) && /cancelled/i.test(failure)) return;
    result.localRequestFailures.push(`${request.method()} ${url}: ${failure}`);
  });
  return result;
}

async function settleHydratedShell(page) {
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
  const dock = page.locator('.mobile-dock');
  await dock.waitFor({ state: 'visible', timeout: 20_000 });
  await expect(dock.locator('a, button')).toHaveCount(5, { timeout: 20_000 });
  await page.waitForTimeout(450);
}

function selectBoundedIndices(count, limit = 8) {
  if (count <= 0) return [];
  if (count <= limit) return Array.from({ length: count }, (_, index) => index);
  const indices = [0];
  for (let slot = 1; slot < limit - 1; slot += 1) {
    indices.push(Math.round((count - 1) * (slot / (limit - 1))));
  }
  indices.push(count - 1);
  return [...new Set(indices)].sort((left, right) => left - right);
}

async function visitStrategicLazyContent(page) {
  const landmarks = page.locator(STRATEGIC_SELECTOR);
  const candidateCount = await landmarks.count();
  const indices = selectBoundedIndices(candidateCount);
  expect(candidateCount, 'strategic lazy-content landmarks').toBeGreaterThan(0);
  expect(indices.length, 'bounded WebKit scroll landmarks').toBeLessThanOrEqual(8);

  const visited = [];
  for (const index of indices) {
    const target = landmarks.nth(index);
    if (!(await target.isVisible())) continue;
    await target.scrollIntoViewIfNeeded();
    await expect(target).toBeInViewport({ ratio: 0.01 });
    await page.waitForTimeout(150);
    visited.push(await target.evaluate((node) => ({
      index,
      tagName: node.tagName,
      id: node.id || null,
      className: typeof node.className === 'string' ? node.className : null,
      imageState: node.getAttribute('data-image-state'),
      loading: node.getAttribute('loading'),
    })));
  }

  expect(visited.length, 'visited strategic lazy-content landmarks').toBeGreaterThan(0);
  return { candidateCount, indices, visited };
}

async function restoreChromeAtTop(page) {
  const heroHeading = page.getByRole('heading', { level: 1, name: 'THE LEGENDARY POET' });
  await heroHeading.scrollIntoViewIfNeeded();
  // A native protocol wheel completes the upward direction signal without a
  // series of page.evaluate(window.scrollTo) calls inside Linux WebKit.
  await page.mouse.wheel(0, -100_000);
  await page.waitForTimeout(180);

  await expect.poll(
    () => page.evaluate(() => window.scrollY),
    { timeout: 8_000, message: 'WebKit should return to the document top' },
  ).toBeLessThanOrEqual(1);
  await expect(page.locator('html')).not.toHaveClass(/chrome-hidden/, { timeout: 8_000 });
  await page.waitForTimeout(CHROME_TRANSITION_MS);
}

async function expectDockInsideViewport(page) {
  const dock = page.locator('.mobile-dock');
  await expect(dock).toBeVisible();
  await expect.poll(
    () => dock.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left >= -1
        && rect.right <= window.innerWidth + 1
        && rect.top >= -1
        && rect.bottom <= window.innerHeight + 1;
    }),
    { timeout: 5_000, message: 'mobile dock should finish returning inside the WebKit visual viewport' },
  ).toBe(true);
}

async function collectDiagnostics(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const dockElement = document.querySelector('.mobile-dock');
    const dockRect = dockElement?.getBoundingClientRect();
    const dockStyle = dockElement ? getComputedStyle(dockElement) : null;
    const visibleImages = [...document.images].filter((image) => {
      const rect = image.getBoundingClientRect();
      const style = getComputedStyle(image);
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 2 && rect.height > 2;
    });
    return {
      title: document.title,
      pathname: location.pathname,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints,
      coarsePointer: matchMedia('(pointer: coarse)').matches,
      touchEventSurface: 'ontouchstart' in window || typeof TouchEvent === 'function',
      viewport: { width: innerWidth, height: innerHeight },
      visualViewport: window.visualViewport
        ? {
            width: window.visualViewport.width,
            height: window.visualViewport.height,
            offsetTop: window.visualViewport.offsetTop,
            offsetLeft: window.visualViewport.offsetLeft,
            scale: window.visualViewport.scale,
          }
        : null,
      supportsDynamicViewport: CSS.supports('height: 100dvh'),
      supportsSafeArea: CSS.supports('padding-bottom: env(safe-area-inset-bottom)'),
      horizontalOverflow: Math.max(document.body.scrollWidth, root.scrollWidth) - root.clientWidth,
      brokenImages: visibleImages
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src || image.alt || '<unknown>'),
      failedResilientImages: [...document.querySelectorAll('[data-image-state="failed"]')].length,
      visibleBusyRegions: [...document.querySelectorAll('[aria-busy="true"]')].filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).length,
      chromeHidden: root.classList.contains('chrome-hidden'),
      dock: dockRect && dockStyle && dockRect.width > 0
        ? {
            left: dockRect.left,
            right: dockRect.right,
            top: dockRect.top,
            bottom: dockRect.bottom,
            width: dockRect.width,
            height: dockRect.height,
            computedBottom: dockStyle.bottom,
            transform: dockStyle.transform,
          }
        : null,
    };
  });
}

test('WebKit home route keeps lazy content, runtime and mobile chrome stable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone-safari', 'WebKit-specific equivalent of the generic home route audit');
  const runtime = attachRuntimeDiagnostics(page);
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(400);
  await settleHydratedShell(page);
  const traversal = await visitStrategicLazyContent(page);
  await restoreChromeAtTop(page);
  await expectDockInsideViewport(page);

  const diagnostics = await collectDiagnostics(page);
  const report = { project: testInfo.project.name, traversal, runtime, diagnostics };
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'iphone-safari-home-strategic-route.json'), JSON.stringify(report, null, 2));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'iphone-safari-home-strategic-route.png'), fullPage: true });

  expect(diagnostics.pathname).toBe('/');
  expect(diagnostics.horizontalOverflow).toBeLessThanOrEqual(2);
  expect(diagnostics.brokenImages).toEqual([]);
  expect(diagnostics.failedResilientImages).toBe(0);
  expect(diagnostics.visibleBusyRegions).toBe(0);
  expect(diagnostics.visualViewport).not.toBeNull();
  expect(diagnostics.coarsePointer).toBe(true);
  expect(diagnostics.maxTouchPoints > 0 || diagnostics.touchEventSurface).toBe(true);
  expect(diagnostics.supportsDynamicViewport).toBe(true);
  expect(diagnostics.supportsSafeArea).toBe(true);
  expect(diagnostics.chromeHidden).toBe(false);
  expect(diagnostics.dock).not.toBeNull();
  expect(diagnostics.dock.left).toBeGreaterThanOrEqual(-1);
  expect(diagnostics.dock.right).toBeLessThanOrEqual(diagnostics.viewport.width + 1);
  expect(diagnostics.dock.top).toBeGreaterThanOrEqual(-1);
  expect(diagnostics.dock.bottom).toBeLessThanOrEqual(diagnostics.viewport.height + 1);
  expect(runtime.pageErrors).toEqual([]);
  expect(runtime.consoleErrors).toEqual([]);
  expect(runtime.localRequestFailures).toEqual([]);
});