import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function afterPaint(page) {
  // Yield from the Playwright side. Linux WebKit can close the whole browser
  // process when page.evaluate owns nested requestAnimationFrame promises.
  await page.waitForTimeout(80);
}

async function settle(page) {
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
  await expect(page.locator('[data-hero-poet-window]')).toHaveCount(6, { timeout: 20_000 });
  await page.getByRole('heading', { level: 1, name: 'THE LEGENDARY POET' }).waitFor({ state: 'visible', timeout: 20_000 });
  await afterPaint(page);
  await page.waitForTimeout(150);
}

async function waitForImages(page) {
  const images = page.locator('[data-hero-poet-window] img');
  await expect(images).toHaveCount(6, { timeout: 20_000 });
  await expect.poll(
    () => images.evaluateAll((nodes) => nodes.every((image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0)),
    { timeout: 12_000, message: 'all six hero portraits should decode' },
  ).toBe(true);
}

async function waitForHeroReveal(page) {
  const reveals = page.locator('.hero-blur-reveal');
  await reveals.first().waitFor({ state: 'attached', timeout: 20_000 });

  // One browser-side predicate observes the actual CSS animation lifecycle.
  // Repeated Playwright evaluate polling can race WebKit's animation commits,
  // while a fixed wall-clock timeout can expire just before the final frame.
  await page.waitForFunction(() => {
    const nodes = [...document.querySelectorAll('.hero-blur-reveal')];
    if (!nodes.length) return false;
    return nodes.every((node) => {
      const style = getComputedStyle(node);
      const opacity = Number.parseFloat(style.opacity || '0');
      const filter = style.filter;
      const animations = typeof node.getAnimations === 'function' ? node.getAnimations() : [];
      const activeAnimation = animations.some((animation) => animation.playState === 'running' || animation.playState === 'pending');
      const crisp = filter === 'none' || filter === 'blur(0px)' || filter === 'blur(0)';
      return opacity >= 0.999 && crisp && !activeAnimation;
    });
  }, null, { timeout: 8_000, polling: 100 });
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

async function scrollTargetIntoView(page, target, { nativeWebKit = false } = {}) {
  if (nativeWebKit) {
    // Use Playwright's native locator scroll for Linux WebKit. This performs one
    // bounded protocol operation per principal section instead of a series of
    // page.evaluate(window.scrollTo) calls that can terminate the WebKit process.
    await target.scrollIntoViewIfNeeded();
    await expect(target).toBeInViewport();
    await page.waitForTimeout(240);
    await afterPaint(page);
    return;
  }

  // Chromium keeps the stronger stepped-scroll stress path. Several small
  // positions exercise the IntersectionObserver-driven reveal choreography.
  const state = await target.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const documentHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const maxScroll = Math.max(0, documentHeight - window.innerHeight);
    const visibleHeight = Math.min(rect.height, window.innerHeight * 0.65);
    const centerOffset = Math.max(24, (window.innerHeight - visibleHeight) / 2);
    return {
      from: window.scrollY,
      top: Math.min(maxScroll, Math.max(0, window.scrollY + rect.top - centerOffset)),
      viewportHeight: window.innerHeight,
    };
  });
  const distance = state.top - state.from;
  const stepDistance = Math.max(180, state.viewportHeight * 0.42);
  const steps = Math.max(3, Math.min(12, Math.ceil(Math.abs(distance) / stepDistance)));
  for (let index = 1; index <= steps; index += 1) {
    const progress = index / steps;
    const eased = 1 - ((1 - progress) ** 2);
    const top = state.from + distance * eased;
    await page.evaluate((nextTop) => {
      window.scrollTo({ top: nextTop, left: 0, behavior: 'auto' });
    }, top);
    await page.waitForTimeout(72);
  }
  await afterPaint(page);
  await page.waitForTimeout(120);
}

function percentile(values, fraction) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
}

function summarizeLongTasks(tasks) {
  return {
    count: tasks.length,
    max: Math.max(0, ...tasks.map((task) => task.duration)),
    total: tasks.reduce((sum, task) => sum + task.duration, 0),
    tasks,
  };
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

  await waitForHeroReveal(page);

  const coarsePointer = await page.evaluate(() => matchMedia('(hover: none) and (pointer: coarse)').matches);
  const touchProfile = testInfo.project.name !== 'home-desktop';
  const first = windows.first();
  const label = first.locator('[data-hero-poet-window-label]');
  if (touchProfile || coarsePointer) {
    await expect.poll(() => effectiveOpacity(label), { timeout: 2_500 }).toBeGreaterThan(0.85);
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
  const facts = { project: testInfo.project.name, imageHints, coarsePointer, touchProfile, rimState, suspiciousHorizontalLayers, overflow, pageErrors };
  fs.writeFileSync(path.join(ARTIFACT_DIR, `${testInfo.project.name}-home-first-viewport.json`), JSON.stringify(facts, null, 2));
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
  // Measure interaction after the first viewport has finished its intentional
  // entrance work. Startup cost is recorded separately instead of contaminating
  // pointer latency with image decode and route hydration.
  await page.waitForTimeout(2_600);

  const first = page.locator('[data-hero-poet-window]').first();
  const box = await first.boundingBox();
  expect(box).not.toBeNull();

  const startupLongTasks = await page.evaluate(() => window.__tlpLongTasks || []);
  await page.evaluate(() => {
    window.__tlpPointerFrames = [];
    window.__tlpLongTasks = [];
    window.__tlpPointerMeasurementStart = performance.now();
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
    const measurementStart = window.__tlpPointerMeasurementStart || 0;
    return {
      pointerFrames: window.__tlpPointerFrames || [],
      longTasks: (window.__tlpLongTasks || []).filter((task) => task.startTime >= measurementStart),
      cursorReady: document.body.classList.contains('custom-cursor-ready'),
      dotMixBlendMode: dot ? getComputedStyle(dot).mixBlendMode : null,
      dotTransform: dot ? getComputedStyle(dot).transform : null,
      ringTransform: ring ? getComputedStyle(ring).transform : null,
    };
  });

  const p95FrameLatency = percentile(metrics.pointerFrames, 0.95);
  const maxFrameLatency = Math.max(0, ...metrics.pointerFrames);
  const startup = summarizeLongTasks(startupLongTasks);
  const interaction = summarizeLongTasks(metrics.longTasks);
  const report = {
    samples: metrics.pointerFrames.length,
    p95FrameLatency,
    maxFrameLatency,
    startupLongTasks: startup,
    interactionLongTasks: interaction,
    cursorReady: metrics.cursorReady,
    dotMixBlendMode: metrics.dotMixBlendMode,
    dotTransform: metrics.dotTransform,
    ringTransform: metrics.ringTransform,
  };
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'home-desktop-pointer-performance.json'), JSON.stringify(report, null, 2));

  expect(metrics.pointerFrames.length).toBeGreaterThan(20);
  expect(p95FrameLatency).toBeLessThan(32);
  expect(maxFrameLatency).toBeLessThan(80);
  expect(interaction.max).toBeLessThan(160);
  expect(interaction.total).toBeLessThan(750);
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
  const nativeWebKit = testInfo.project.name === 'home-iphone-safari';

  for (const target of targets) {
    await scrollTargetIntoView(page, target, { nativeWebKit });
    await expect(target).toBeVisible();
    const label = (await target.textContent())?.trim() || 'homepage section';
    await expect.poll(
      () => effectiveOpacity(target),
      {
        timeout: nativeWebKit ? 8_000 : 5_000,
        message: `${label} should reveal after real stepped scrolling`,
      },
    ).toBeGreaterThan(0.9);
  }

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-home-stepped-scroll.png`),
    fullPage: false,
  });
});

test('reduced motion removes title, hero-root, window and decorative movement', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await settle(page);
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

  fs.writeFileSync(path.join(ARTIFACT_DIR, `${testInfo.project.name}-home-reduced-motion.json`), JSON.stringify(state, null, 2));
  expect(state.titleAnimation).toBe('none');
  expect(['none', 'blur(0px)']).toContain(state.titleFilter);
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(state.titleWordTransform);
  expect(state.heroRootOpacity).toBe('1');
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(state.heroRootTransform);
  expect(state.shellOpacity).toBe('1');
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(state.shellTransform);
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(state.surfaceTransform);
  expect(state.shineDisplay).toBe('none');

  // Yield before the visual artifact. Computed-state assertions above remain
  // authoritative; no production repaint workaround is required.
  await afterPaint(page);
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
