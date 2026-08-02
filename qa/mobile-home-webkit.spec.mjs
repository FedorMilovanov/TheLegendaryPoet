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
  '#main-content h1',
  '#main-content h2',
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

async function scrollDocumentTo(page, top, delay = 130) {
  await page.evaluate((scrollTop) => {
    const scrollingElement = document.scrollingElement;
    if (scrollingElement) {
      scrollingElement.scrollTop = scrollTop;
      scrollingElement.scrollLeft = 0;
      return;
    }
    window.scrollTo({ top: scrollTop, left: 0, behavior: 'auto' });
  }, top);
  await page.waitForTimeout(delay);
}

async function collectGeometryLandmarks(page, selector, limit = 5) {
  return page.evaluate(({ selector: query, limit: maximum }) => {
    const nodes = [...document.querySelectorAll(query)];
    const seen = new Set();
    const candidates = [];

    for (const node of nodes) {
      if (seen.has(node)) continue;
      seen.add(node);
      if (!(node instanceof HTMLElement)) continue;
      if (node.classList.contains('sr-only') || node.closest('.sr-only,[aria-hidden="true"]')) continue;

      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      if (rect.width <= 2 || rect.height <= 2) continue;

      const id = `home-webkit-${candidates.length}`;
      node.dataset.qaScrollLandmark = id;
      candidates.push({
        id,
        tagName: node.tagName,
        elementId: node.id || null,
        className: node.className || null,
        imageState: node.getAttribute('data-image-state'),
        loading: node.getAttribute('loading'),
      });
    }

    if (!candidates.length) {
      const main = document.querySelector('#main-content');
      if (main instanceof HTMLElement) {
        const rect = main.getBoundingClientRect();
        if (rect.width > 2 && rect.height > 2) {
          main.dataset.qaScrollLandmark = 'home-webkit-fallback';
          candidates.push({
            id: 'home-webkit-fallback',
            tagName: main.tagName,
            elementId: main.id,
            className: main.className || null,
            imageState: null,
            loading: null,
          });
        }
      }
    }

    if (candidates.length <= maximum) return candidates;
    const selected = [];
    for (let slot = 0; slot < maximum; slot += 1) {
      const index = Math.round((candidates.length - 1) * (slot / (maximum - 1)));
      const candidate = candidates[index];
      if (!selected.some((entry) => entry.id === candidate.id)) selected.push(candidate);
    }
    return selected;
  }, { selector, limit });
}

async function readLiveLandmarkState(page, id) {
  return page.evaluate((landmarkId) => {
    const node = document.querySelector(`[data-qa-scroll-landmark="${landmarkId}"]`);
    if (!(node instanceof HTMLElement)) return null;

    const rect = node.getBoundingClientRect();
    const documentHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const maxScroll = Math.max(0, documentHeight - window.innerHeight);
    const visibleHeight = Math.min(rect.height, window.innerHeight * 0.65);
    const centerOffset = Math.max(24, (window.innerHeight - visibleHeight) / 2);

    return {
      intersects: rect.width > 2 && rect.height > 2 && rect.bottom > 0 && rect.top < window.innerHeight,
      top: Math.min(maxScroll, Math.max(0, window.scrollY + rect.top - centerOffset)),
    };
  }, id);
}

async function landmarkIntersectsViewport(page, id) {
  const state = await readLiveLandmarkState(page, id);
  return Boolean(state?.intersects);
}

async function visitStrategicLazyContent(page) {
  const landmarks = await collectGeometryLandmarks(page, STRATEGIC_SELECTOR, 5);
  expect(landmarks.length, 'geometry-eligible WebKit landmarks').toBeGreaterThan(0);
  expect(landmarks.length, 'bounded WebKit scroll landmarks').toBeLessThanOrEqual(5);

  const visited = [];
  for (const landmark of landmarks) {
    const initial = await readLiveLandmarkState(page, landmark.id);
    expect(initial, `${landmark.id} live geometry`).not.toBeNull();
    if (!initial.intersects) await scrollDocumentTo(page, initial.top, 170);

    const corrected = await readLiveLandmarkState(page, landmark.id);
    if (corrected && !corrected.intersects && Math.abs(corrected.top - initial.top) > 1) {
      await scrollDocumentTo(page, corrected.top, 180);
    }

    await expect.poll(
      () => landmarkIntersectsViewport(page, landmark.id),
      { timeout: 5_000, message: `${landmark.id} should intersect the WebKit viewport` },
    ).toBe(true);
    visited.push({ ...landmark, liveTop: corrected?.top ?? initial.top });
  }

  return { candidateCount: landmarks.length, visited };
}

async function restoreChromeAtTop(page) {
  const state = await page.evaluate(() => ({
    currentY: window.scrollY,
    maxScroll: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
  }));
  if (state.currentY <= 16 && state.maxScroll > 32) {
    await scrollDocumentTo(page, Math.min(64, state.maxScroll));
  } else if (state.currentY > 96) {
    await scrollDocumentTo(page, state.currentY - 96);
  }
  await scrollDocumentTo(page, 0, 180);

  await expect.poll(
    () => page.evaluate(() => window.scrollY <= 1 && !document.documentElement.classList.contains('chrome-hidden')),
    { timeout: 8_000, message: 'WebKit should settle at the top with site chrome visible' },
  ).toBe(true);
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