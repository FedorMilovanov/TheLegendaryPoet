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

  const overflow = await page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  expect(pageErrors).toEqual([]);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-home-first-viewport.png`),
    fullPage: false,
  });
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
