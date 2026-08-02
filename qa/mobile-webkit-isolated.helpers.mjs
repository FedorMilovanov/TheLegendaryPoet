import { expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

export const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
export const ARTIFACT_DIR = path.resolve('qa-artifacts');
const STRATEGIC_SELECTOR = [
  '#main-content section',
  '#main-content article',
  '#main-content img[loading="lazy"]',
  '#main-content [data-image-state]',
  '#main-content h1',
  '#main-content h2',
].join(',');
const WEBKIT_VIEWPORT_STABILITY_MS = 1_200;

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

export function attachRuntimeDiagnostics(page) {
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

export async function gotoRoute(page, route) {
  const response = await page.goto(`${BASE_URL}${route}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  expect(response, `navigation response for ${route}`).not.toBeNull();
  expect(response.status(), `HTTP status for ${route}`).toBeLessThan(400);
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
  const dock = page.locator('.mobile-dock');
  await dock.waitFor({ state: 'visible', timeout: 20_000 });
  await expect(dock.locator('a, button')).toHaveCount(5, { timeout: 20_000 });
  await page.waitForTimeout(420);
}

async function scrollDocumentTo(page, top, delay = 320) {
  await page.evaluate((scrollTop) => {
    window.scrollTo({ top: scrollTop, left: 0, behavior: 'auto' });
    const scrollingElement = document.scrollingElement;
    if (scrollingElement) {
      scrollingElement.scrollTop = scrollTop;
      scrollingElement.scrollLeft = 0;
    }
  }, top);
  await page.waitForFunction(
    (expectedTop) => {
      const actualTop = document.scrollingElement?.scrollTop ?? window.scrollY;
      return Math.abs(actualTop - expectedTop) <= 3;
    },
    top,
    { timeout: 3_000 },
  );
  await page.waitForTimeout(delay);
}

async function readViewportState(target) {
  return target.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const viewportTop = window.visualViewport?.offsetTop ?? 0;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const viewportBottom = viewportTop + viewportHeight;
    const viewportCenter = viewportTop + viewportHeight / 2;
    const targetCenter = rect.top + rect.height / 2;
    return {
      intersects: rect.width > 2
        && rect.height > 2
        && rect.bottom > viewportTop
        && rect.top < viewportBottom,
      centerDelta: targetCenter - viewportCenter,
      viewportHeight,
    };
  });
}

export async function scrollLocatorIntoViewport(page, target, label) {
  await target.waitFor({ state: 'attached', timeout: 20_000 });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const top = await target.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const scrollingElement = document.scrollingElement;
      const currentScroll = scrollingElement?.scrollTop ?? window.scrollY;
      const visualViewport = window.visualViewport;
      const viewportTop = visualViewport?.offsetTop ?? 0;
      const viewportHeight = visualViewport?.height ?? window.innerHeight;
      const documentHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const maxScroll = Math.max(0, documentHeight - viewportHeight);
      const visibleHeight = Math.min(rect.height, viewportHeight * 0.65);
      const desiredRectTop = viewportTop + Math.max(24, (viewportHeight - visibleHeight) / 2);
      return Math.min(maxScroll, Math.max(0, currentScroll + rect.top - desiredRectTop));
    });
    await scrollDocumentTo(page, top);

    const first = await readViewportState(target);
    if (!first.intersects) continue;

    await page.waitForTimeout(WEBKIT_VIEWPORT_STABILITY_MS);
    const second = await readViewportState(target);
    const centered = Math.abs(second.centerDelta) <= Math.max(48, second.viewportHeight * 0.3);
    if (second.intersects && centered) return;
  }
  expect(false, `${label} should remain stably centered in the WebKit visual viewport`).toBe(true);
}

export async function effectiveOpacity(target) {
  return target.evaluate((node) => {
    let opacity = 1;
    let current = node;
    while (current && current !== document.documentElement) {
      opacity *= Number.parseFloat(getComputedStyle(current).opacity || '1');
      current = current.parentElement;
    }
    return opacity;
  });
}

export async function chooseRepresentativeLandmark(page) {
  const found = await page.evaluate((selector) => {
    const candidates = [...document.querySelectorAll(selector)].filter((node) => {
      if (!(node instanceof HTMLElement)) return false;
      if (node.classList.contains('sr-only') || node.closest('.sr-only,[aria-hidden="true"]')) return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 2 && rect.height > 2;
    });
    const fallback = document.querySelector('#main-content');
    const target = candidates[Math.max(0, Math.floor((candidates.length - 1) * 0.72))]
      || (fallback instanceof HTMLElement ? fallback : null);
    if (!(target instanceof HTMLElement)) return false;
    target.dataset.qaWebkitRepresentative = 'true';
    return true;
  }, STRATEGIC_SELECTOR);
  expect(found, 'geometry-eligible representative WebKit landmark').toBe(true);
  return page.locator('[data-qa-webkit-representative="true"]');
}

export async function expectDockInsideViewport(page) {
  const dock = page.locator('.mobile-dock');
  await expect(dock).toBeVisible();
  const inside = await dock.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.left >= -1
      && rect.right <= window.innerWidth + 1
      && rect.top >= -1
      && rect.bottom <= window.innerHeight + 1;
  });
  expect(inside, 'mobile dock should remain inside the WebKit visual viewport').toBe(true);
}

export async function collectDiagnostics(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const dockElement = document.querySelector('.mobile-dock');
    const dockRect = dockElement?.getBoundingClientRect();
    const visibleImages = [...document.images].filter((image) => {
      const rect = image.getBoundingClientRect();
      const style = getComputedStyle(image);
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 2 && rect.height > 2;
    });
    return {
      pathname: location.pathname,
      maxTouchPoints: navigator.maxTouchPoints,
      coarsePointer: matchMedia('(pointer: coarse)').matches,
      touchEventSurface: 'ontouchstart' in window || typeof TouchEvent === 'function',
      viewport: { width: innerWidth, height: innerHeight },
      visualViewport: window.visualViewport ? { width: window.visualViewport.width, height: window.visualViewport.height } : null,
      supportsDynamicViewport: CSS.supports('height: 100dvh'),
      supportsSafeArea: CSS.supports('padding-bottom: env(safe-area-inset-bottom)'),
      horizontalOverflow: Math.max(document.body.scrollWidth, root.scrollWidth) - root.clientWidth,
      brokenImages: visibleImages.filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.currentSrc || image.src),
      failedResilientImages: document.querySelectorAll('[data-image-state="failed"]').length,
      visibleBusyRegions: [...document.querySelectorAll('[aria-busy="true"]')].filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).length,
      chromeHidden: root.classList.contains('chrome-hidden'),
      dock: dockRect && dockRect.width > 0 ? {
        left: dockRect.left,
        right: dockRect.right,
        top: dockRect.top,
        bottom: dockRect.bottom,
      } : null,
    };
  });
}

export function expectDiagnostics(diagnostics, { requireTopChrome = false } = {}) {
  expect(diagnostics.horizontalOverflow).toBeLessThanOrEqual(2);
  expect(diagnostics.brokenImages).toEqual([]);
  expect(diagnostics.failedResilientImages).toBe(0);
  expect(diagnostics.visibleBusyRegions).toBe(0);
  expect(diagnostics.visualViewport).not.toBeNull();
  expect(diagnostics.coarsePointer).toBe(true);
  expect(diagnostics.maxTouchPoints > 0 || diagnostics.touchEventSurface).toBe(true);
  expect(diagnostics.supportsDynamicViewport).toBe(true);
  expect(diagnostics.supportsSafeArea).toBe(true);
  if (requireTopChrome) {
    expect(diagnostics.chromeHidden).toBe(false);
    expect(diagnostics.dock).not.toBeNull();
    expect(diagnostics.dock.left).toBeGreaterThanOrEqual(-1);
    expect(diagnostics.dock.right).toBeLessThanOrEqual(diagnostics.viewport.width + 1);
    expect(diagnostics.dock.top).toBeGreaterThanOrEqual(-1);
    expect(diagnostics.dock.bottom).toBeLessThanOrEqual(diagnostics.viewport.height + 1);
  }
}

export function expectCleanRuntime(runtime) {
  expect(runtime.pageErrors).toEqual([]);
  expect(runtime.consoleErrors).toEqual([]);
  expect(runtime.localRequestFailures).toEqual([]);
}

export function writeArtifact(name, value) {
  fs.writeFileSync(path.join(ARTIFACT_DIR, name), JSON.stringify(value, null, 2));
}
