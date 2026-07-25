import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function settle(page) {
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForTimeout(250);
}

async function waitForImages(page) {
  await expect.poll(
    () => page.locator('[data-hero-poet-window] img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0)),
    { timeout: 12_000, message: 'all six hero portraits should decode' },
  ).toBe(true);
}

async function effectiveOpacity(locator) {
  return locator.evaluate((node) => {
    let opacity = 1;
    let current = node;
    while (current && current !== document.documentElement) {
      opacity *= Number.parseFloat(getComputedStyle(current).opacity || '1');
      current = current.parentElement;
    }
    return opacity;
  });
}

async function afterPaint(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

function percentile(values, fraction) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
}

test('first viewport keeps six decoded portraits, crisp title and usable labels', async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await settle(page);

  const windows = page.locator('[data-hero-poet-window]');
  await expect(windows).toHaveCount(6);
  await waitForImages(page);

  const imageHints = await windows.locator('img').evaluateAll((images) => images.map((image) => ({
    loading: image.getAttribute('loading'),
    fetchPriority: image.getAttribute('fetchpriority'),
  })));
  expect(imageHints.every((image) => image.loading === 'eager')).toBe(true);
  expect(imageHints.slice(0, 2).every((image) => image.fetchPriority === 'high')).toBe(true);
  expect(imageHints.slice(2).every((image) => image.fetchPriority !== 'high')).toBe(true);

  await expect.poll(
    () => page.locator('.hero-blur-reveal').evaluateAll((nodes) => nodes.every((node) => {
      const style = getComputedStyle(node);
      return style.opacity === '1' && (style.filter === 'none' || style.filter === 'blur(0px)');
    })),
    { timeout: 3_000, message: 'hero title should finish crisp quickly' },
  ).toBe(true);

  const coarsePointer = await page.evaluate(() => matchMedia('(hover: none) and (pointer: coarse)').matches);
  const first = windows.first();
  const label = first.locator('[data-hero-poet-window-label]');
  if (coarsePointer) {
    expect(await effectiveOpacity(label)).toBeGreaterThan(0.85);
  } else {
    const before = await effectiveOpacity(label);
    await first.hover({ position: { x: 12, y: 18 } });
    await expect.poll(() => effectiveOpacity(label), { timeout: 2_500 }).toBeGreaterThan(before + 0.5);
  }

  const rimState = await first.locator('[data-hero-poet-window-rim]').evaluate((node) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return {
      backgroundImage: style.backgroundImage,
      width: rect.width,
      height: rect.height,
      opacity: Number(style.opacity),
    };
  });
  expect(rimState.backgroundImage).toContain('radial-gradient');
  expect(rimState.height).toBeGreaterThan(40);
  expect(rimState.width).toBeGreaterThan(40);

  // Regression contract for the screenshot bug: the old decorative element was
  // a literal one-pixel-wide horizontal stripe. No visible aria-hidden layer in
  // the portrait viewport may collapse to a long 1–2px bar again.
  const suspiciousHorizontalLayers = await first.locator('[data-hero-poet-window-surface] [aria-hidden="true"]').evaluateAll((nodes) => nodes.flatMap((node) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    const visible = style.display !== 'none' && Number(style.opacity || '1') > 0.01;
    if (visible && rect.width > 28 && rect.height > 0 && rect.height <= 2.5) {
      return [{ className: node.className, width: rect.width, height: rect.height }];
    }
    return [];
  }));
  expect(suspiciousHorizontalLayers).toEqual([]);

  const overflow = await page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  expect(pageErrors).toEqual([]);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-home-first-viewport.png`),
    fullPage: false,
  });
});

test('desktop pointer pipeline remains responsive over premium poet depth', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'home-desktop', 'desktop fine-pointer performance contract');

  await page.addInitScript(() => {
    window.__tlpLongTasks = [];
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__tlpLongTasks.push({ startTime: entry.startTime, duration: entry.duration });
          }
        });
        observer.observe({ type: 'longtask', buffered: true });
      } catch {
        // Long Task API is optional; frame latency below remains authoritative.
      }
    }
  });

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await settle(page);
  await waitForImages(page);
  await page.waitForTimeout(1_450);

  const first = page.locator('[data-hero-poet-window]').first();
  const box = await first.boundingBox();
  expect(box).not.toBeNull();

  await page.evaluate(() => {
    window.__tlpPointerFrames = [];
    window.__tlpLongTasks = [];
    window.addEventListener('pointermove', () => {
      const start = performance.now();
      requestAnimationFrame(() => window.__tlpPointerFrames.push(performance.now() - start));
    }, { passive: true });
  });

  await page.mouse.move(box.x + 8, box.y + 12);
  await page.mouse.move(box.x + box.width - 8, box.y + box.height - 12, { steps: 72 });
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.35, { steps: 36 });
  await page.waitForTimeout(420);

  const metrics = await page.evaluate(() => {
    const dot = document.querySelector('[data-custom-cursor-dot]');
    const ring = document.querySelector('[data-custom-cursor-ring]');
    return {
      pointerFrames: window.__tlpPointerFrames || [],
      longTasks: window.__tlpLongTasks || [],
      cursorReady: document.body.classList.contains('custom-cursor-ready'),
      dotMixBlendMode: dot ? getComputedStyle(dot).mixBlendMode : null,
      dotTransform: dot ? getComputedStyle(dot).transform : null,
      ringTransform: ring ? getComputedStyle(ring).transform : null,
    };
  });

  const p95FrameLatency = percentile(metrics.pointerFrames, 0.95);
  const maxFrameLatency = Math.max(0, ...metrics.pointerFrames);
  const maxLongTask = Math.max(0, ...metrics.longTasks.map((task) => task.duration));
  const totalLongTaskTime = metrics.longTasks.reduce((sum, task) => sum + task.duration, 0);
  const report = {
    samples: metrics.pointerFrames.length,
    p95FrameLatency,
    maxFrameLatency,
    maxLongTask,
    totalLongTaskTime,
    cursorReady: metrics.cursorReady,
    dotMixBlendMode: metrics.dotMixBlendMode,
    dotTransform: metrics.dotTransform,
    ringTransform: metrics.ringTransform,
  };
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'home-desktop-pointer-performance.json'), JSON.stringify(report, null, 2));

  expect(metrics.pointerFrames.length).toBeGreaterThan(20);
  expect(p95FrameLatency).toBeLessThan(80);
  expect(maxFrameLatency).toBeLessThan(180);
  expect(maxLongTask).toBeLessThan(350);
  expect(totalLongTaskTime).toBeLessThan(900);
  expect(metrics.cursorReady).toBe(true);
  expect(metrics.dotMixBlendMode).toBe('normal');
  expect(metrics.dotTransform).not.toBe('none');
  expect(metrics.ringTransform).not.toBe('none');
});

test('real stepped scrolling reveals all principal homepage sections', async ({ page }, testInfo) => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await settle(page);

  const targets = [
    page.getByText('Поэтов в базе', { exact: true }),
    page.getByText('Стихотворение дня', { exact: true }),
    page.getByText('Избранные авторы', { exact: true }),
    page.getByText('Вера, культура и', { exact: false }).last(),
  ];

  for (const target of targets) {
    await target.scrollIntoViewIfNeeded();
    await afterPaint(page);
    await expect(target).toBeVisible();
    await expect.poll(() => effectiveOpacity(target), { timeout: 5_000 }).toBeGreaterThan(0.9);
  }

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-home-stepped-scroll.png`),
    fullPage: false,
  });
});

test('reduced motion removes title, hero-root, window and decorative movement', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
  await waitForImages(page);

  const state = await page.evaluate(() => {
    const title = document.querySelector('.hero-blur-reveal');
    const titleWord = document.querySelector('.hero-title-lockup .hero-word-text');
    const heroRoot = document.querySelector('.hero-title-lockup')?.parentElement;
    const shell = document.querySelector('[data-hero-poet-window-shell]');
    const surface = document.querySelector('[data-hero-poet-window-surface]');
    const shine = document.querySelector('.hero-poet-window-shine');
    if (!title || !titleWord || !heroRoot || !shell || !surface || !shine) {
      throw new Error('reduced-motion hooks missing');
    }
    return {
      titleAnimation: getComputedStyle(title).animationName,
      titleFilter: getComputedStyle(title).filter,
      titleWordTransform: getComputedStyle(titleWord).transform,
      heroRootOpacity: getComputedStyle(heroRoot).opacity,
      heroRootTransform: getComputedStyle(heroRoot).transform,
      shellOpacity: getComputedStyle(shell).opacity,
      shellTransform: getComputedStyle(shell).transform,
      surfaceTransform: getComputedStyle(surface).transform,
      shineDisplay: getComputedStyle(shine).display,
    };
  });

  expect(state.titleAnimation).toBe('none');
  expect(['none', 'blur(0px)']).toContain(state.titleFilter);
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(state.titleWordTransform);
  expect(state.heroRootOpacity).toBe('1');
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(state.heroRootTransform);
  expect(state.shellOpacity).toBe('1');
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(state.shellTransform);
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(state.surfaceTransform);
  expect(state.shineDisplay).toBe('none');

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-home-reduced-motion.png`),
    fullPage: false,
  });
});

test('desktop keyboard activation opens the exact poet route', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'home-desktop', 'desktop keyboard contract');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await settle(page);

  const first = page.locator('[data-hero-poet-window="sergei-yesenin"]');
  await first.focus();
  await expect(first).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/poets\/sergei-yesenin$/);
  await expect(page.locator('#main-content')).toBeVisible();
});
