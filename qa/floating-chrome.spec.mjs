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

test.use({
  viewport: { width: 1440, height: 1000 },
  locale: 'ru-RU',
  timezoneId: 'Europe/Paris',
  colorScheme: 'dark',
});

test('Ctrl+K and scroll-top controls stay clear of the persistent mini-player', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));

  await page.goto(`${BASE_URL}/music`, { waitUntil: 'domcontentloaded' });
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
  const play = page.getByRole('button', { name: /воспроизвести трек|поставить на паузу/i }).first();
  await play.click();
  await page.waitForTimeout(1000);

  await page.getByRole('link', { name: 'Рейтинг' }).click();
  await expect(page).toHaveURL(/\/ratings$/);
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
  // The persistent shell restores route scroll after navigation. Wait for that
  // lifecycle to settle, then use a real wheel gesture and prove the threshold
  // was crossed before asserting that ScrollToTop has mounted.
  await page.waitForTimeout(750);
  await page.mouse.wheel(0, 900);
  await expect.poll(
    () => page.evaluate(() => window.scrollY),
    { timeout: 5_000, message: 'ratings page should cross the scroll-top threshold' },
  ).toBeGreaterThan(400);
  // Drive the real direction-sensitive auto-hide contract. Mutating the class
  // directly races the hook and can leave the pill translated/pointer-inert.
  await page.mouse.wheel(0, -140);
  await expect.poll(
    () => page.evaluate(() => !document.documentElement.classList.contains('chrome-hidden')),
    { timeout: 5_000, message: 'site chrome should return after an upward wheel gesture' },
  ).toBe(true);

  const player = page.locator('.global-audio-mini');
  const palette = page.locator('.palette-fab');
  const scrollTop = page.locator('.scroll-top-btn');
  await expect(player).toBeVisible();
  await expect(palette).toBeVisible();
  await expect(scrollTop).toBeVisible();
  // Framer Motion can take longer than a fixed timeout to finish the spring on
  // a busy runner. Measure the collision contract only after the pill is fully
  // interactive in its settled frame.
  await expect.poll(
    () => palette.evaluate((element) => Number(getComputedStyle(element).opacity)),
    { timeout: 5_000, message: 'command palette pill should finish entering' },
  ).toBeGreaterThan(0.9);
  await expect.poll(
    () => palette.evaluate((element) => getComputedStyle(element).pointerEvents),
    { timeout: 5_000, message: 'command palette pill should be interactive' },
  ).not.toBe('none');

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
      player: read('.global-audio-mini'),
      palette: read('.palette-fab'),
      scrollTop: read('.scroll-top-btn'),
    };
  });

  fs.writeFileSync(path.join(ARTIFACT_DIR, 'desktop-floating-chrome-geometry.json'), JSON.stringify(geometry, null, 2));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop-floating-chrome.png'), fullPage: false });

  expect(geometry.player).not.toBeNull();
  expect(geometry.palette).not.toBeNull();
  expect(geometry.scrollTop).not.toBeNull();
  expect(geometry.palette.opacity).toBeGreaterThan(0.9);
  expect(geometry.palette.pointerEvents).not.toBe('none');
  expect(overlaps(geometry.player, geometry.palette)).toBe(false);
  expect(overlaps(geometry.player, geometry.scrollTop)).toBe(false);
  expect(overlaps(geometry.palette, geometry.scrollTop)).toBe(false);
  expect(pageErrors).toEqual([]);
});
