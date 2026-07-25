import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

function overlaps(left, right) {
  return left.left < right.right
    && left.right > right.left
    && left.top < right.bottom
    && left.bottom > right.top;
}

async function sampleScrollStability(page) {
  return page.evaluate(() => new Promise((resolve) => {
    const samples = [];
    const sample = () => {
      samples.push(window.scrollY);
      if (samples.length < 6) {
        requestAnimationFrame(sample);
        return;
      }
      const deltas = samples.slice(1).map((value, index) => Math.abs(value - samples[index]));
      resolve({
        first: samples[0],
        last: samples.at(-1),
        maxDelta: Math.max(0, ...deltas),
      });
    };
    requestAnimationFrame(sample);
  }));
}

async function waitForScrollSettled(page, message) {
  await expect.poll(
    () => sampleScrollStability(page).then((sample) => sample.maxDelta),
    { timeout: 6_000, message },
  ).toBeLessThan(0.5);
}

test.use({
  viewport: { width: 1440, height: 1000 },
  locale: 'ru-RU',
  timezoneId: 'Europe/Paris',
  colorScheme: 'dark',
});

test('one desktop search trigger and scroll-top stay clear of persistent audio chrome', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));

  await page.goto(`${BASE_URL}/music`, { waitUntil: 'domcontentloaded' });
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
  const play = page.getByRole('button', { name: /воспроизвести трек|поставить на паузу/i }).first();
  await play.click();
  await expect(page.locator('.global-audio-mini')).toBeVisible();

  await page.getByRole('link', { name: 'Рейтинг' }).click();
  await expect(page).toHaveURL(/\/ratings$/);
  await page.getByRole('heading', { level: 1, name: 'Поэты в оценке читателей' }).waitFor({ state: 'visible', timeout: 20_000 });

  // Scroll restoration owns the first route frame. Wait for that real reset,
  // then drive auto-hide with user wheel input instead of mutating its CSS class.
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 }).toBeLessThan(5);
  await page.mouse.wheel(0, 900);
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 }).toBeGreaterThan(400);
  await expect.poll(
    () => page.evaluate(() => document.documentElement.classList.contains('chrome-hidden')),
    { timeout: 5_000, message: 'downward user scroll should enter reading-mode chrome hiding' },
  ).toBe(true);

  // Lenis may still carry downward momentum after the threshold is crossed.
  // Observe six consecutive animation frames and reverse direction only after
  // the actual scroll position is stable, rather than sleeping for a guessed time.
  await waitForScrollSettled(page, 'downward smooth scrolling should settle before direction reversal');
  const hiddenAt = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, -420);
  await expect.poll(
    () => page.evaluate(() => window.scrollY),
    { timeout: 5_000, message: 'upward user scroll should move the document before geometry is measured' },
  ).toBeLessThan(hiddenAt - 8);
  await expect.poll(
    () => page.evaluate(() => document.documentElement.classList.contains('chrome-hidden')),
    { timeout: 5_000, message: 'upward user scroll should reveal persistent chrome through the product hook' },
  ).toBe(false);
  await waitForScrollSettled(page, 'upward smooth scrolling should settle before floating geometry is measured');

  const player = page.locator('.global-audio-mini');
  const headerSearch = page.getByRole('button', { name: 'Открыть поиск', exact: true });
  const scrollTop = page.locator('.scroll-top-btn');
  await expect(player).toBeVisible();
  await expect(headerSearch).toHaveCount(1);
  await expect(headerSearch).toBeVisible();
  await expect(scrollTop).toBeVisible();
  await expect(page.locator('.palette-fab')).toHaveCount(0);

  const geometry = await page.evaluate(() => {
    const read = (selector) => {
      const element = document.querySelector(selector);
      const rect = element?.getBoundingClientRect();
      const style = element ? getComputedStyle(element) : null;
      return rect && style ? {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        opacity: Number(style.opacity),
        pointerEvents: style.pointerEvents,
      } : null;
    };
    return {
      scrollY: window.scrollY,
      chromeHidden: document.documentElement.classList.contains('chrome-hidden'),
      player: read('.global-audio-mini'),
      headerSearch: read('button[aria-label="Открыть поиск"]'),
      scrollTop: read('.scroll-top-btn'),
      duplicatePaletteCount: document.querySelectorAll('.palette-fab').length,
    };
  });

  fs.writeFileSync(path.join(ARTIFACT_DIR, 'desktop-floating-chrome-geometry.json'), JSON.stringify(geometry, null, 2));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop-floating-chrome.png'), fullPage: false });

  expect(geometry.scrollY).toBeGreaterThan(240);
  expect(geometry.chromeHidden).toBe(false);
  expect(geometry.player).not.toBeNull();
  expect(geometry.headerSearch).not.toBeNull();
  expect(geometry.scrollTop).not.toBeNull();
  expect(geometry.duplicatePaletteCount).toBe(0);
  expect(overlaps(geometry.player, geometry.scrollTop)).toBe(false);
  expect(overlaps(geometry.player, geometry.headerSearch)).toBe(false);
  expect(overlaps(geometry.headerSearch, geometry.scrollTop)).toBe(false);

  await headerSearch.click();
  await expect(page.getByRole('dialog', { name: 'Поиск по сайту' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Поиск по сайту' })).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
