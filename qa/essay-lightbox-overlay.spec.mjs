import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts', 'essay-lightbox-overlay');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function overlayDebug(page) {
  return page.evaluate(() => window.__TLP_OVERLAY_DEBUG ?? null);
}

test.describe('essay image lightbox overlay ownership', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, locale: 'ru-RU', timezoneId: 'Europe/Paris', colorScheme: 'dark' });

  test('lightbox shares the global overlay stack with command search', async ({ page }, testInfo) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));

    await page.goto(`${BASE_URL}/essays/yesenin-duncan-first-meeting-documents`, { waitUntil: 'domcontentloaded' });
    await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });

    const opener = page.getByRole('button', { name: /^Увеличить изображение:/ }).first();
    await opener.scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await opener.click();

    const lightbox = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: 'Закрыть изображение' }) });
    const close = lightbox.getByRole('button', { name: 'Закрыть изображение' });
    await expect(lightbox).toBeVisible();
    await expect(close).toBeFocused();
    await expect.poll(() => overlayDebug(page)).toMatchObject({ depth: 1, topLabel: 'essay-image-lightbox' });
    await expect.poll(() => page.evaluate(() => Boolean(window.__TLP_MODAL_OPEN))).toBe(true);
    const lockedScrollY = await page.evaluate(() => Math.abs(Number.parseFloat(document.body.style.top || '0')));
    expect(lockedScrollY).toBeGreaterThan(0);

    await page.keyboard.press('Control+K');
    const search = page.getByRole('dialog', { name: 'Поиск по сайту' });
    await expect(search).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Поисковый запрос' })).toBeFocused();
    await expect.poll(() => overlayDebug(page)).toMatchObject({ depth: 2, topLabel: 'command-palette' });

    await page.keyboard.press('Escape');
    await expect(search).toBeHidden();
    await expect(lightbox).toBeVisible();
    await expect(close).toBeFocused();
    await expect.poll(() => overlayDebug(page)).toMatchObject({ depth: 1, topLabel: 'essay-image-lightbox', lastEscapeLabel: 'command-palette' });

    await page.keyboard.press('Escape');
    await expect.poll(() => page.evaluate(() => Boolean(window.__TLP_MODAL_OPEN))).toBe(false);
    await expect(lightbox).toBeHidden({ timeout: 2_000 });
    await expect(opener).toBeFocused();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(lockedScrollY, 0);
    await expect.poll(() => overlayDebug(page)).toMatchObject({ depth: 0, lastEscapeLabel: 'essay-image-lightbox' });

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-closed-restored.png`),
      fullPage: false,
    });
    expect(pageErrors).toEqual([]);
  });
});

// Permanent regression coverage for the exact-source archive recovery (#519).
const portraits = [
  { name: 'Лиля', file: 'lilya-brik-1914.webp', width: 300, height: 423 },
  { name: 'Осип', file: 'osip-brik-1928.webp', width: 300, height: 436 },
];

for (const mobile of [false, true]) {
  for (const theme of ['dark', 'light']) {
    test.describe(`restored Brik portraits ${mobile ? 'mobile' : 'desktop'} ${theme}`, () => {
      test.use({
        viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
        isMobile: mobile,
        hasTouch: mobile,
        colorScheme: theme,
        reducedMotion: 'reduce',
      });
      test('exact archive portraits decode inline and in the shared lightbox', async ({ page }, testInfo) => {
        const pageErrors = [];
        const failedPortraits = [];
        page.on('pageerror', error => pageErrors.push(String(error)));
        page.on('requestfailed', request => {
          if (portraits.some(p => request.url().includes(p.file))) failedPortraits.push(request.url());
        });
        await page.addInitScript(mode => localStorage.setItem('tlp-theme-mode', mode), theme);
        await page.goto(`${BASE_URL}/essays/brik-case`, { waitUntil: 'domcontentloaded' });
        for (const portrait of portraits) {
          const image = page.locator(`main img[src$="${portrait.file}"]`).first();
          await image.scrollIntoViewIfNeeded();
          await expect(image).toBeVisible();
          const decode = img => img.decode().then(() => ({ width: img.naturalWidth, height: img.naturalHeight }));
          expect(await image.evaluate(decode)).toEqual({ width: portrait.width, height: portrait.height });
          const opener = image.locator('xpath=ancestor::button[1]');
          await opener.click();
          const dialog = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: 'Закрыть изображение' }) });
          await expect(dialog).toBeVisible();
          expect(await dialog.locator('img').evaluate(decode)).toEqual({ width: portrait.width, height: portrait.height });
          await expect.poll(() => dialog.locator('img').evaluate(img => {
            let opacity = 1;
            for (let node = img; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
            return opacity;
          })).toBeGreaterThanOrEqual(0.99);
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          await page.screenshot({ path: testInfo.outputPath(`${portrait.file}-${theme}.png`) });
          await page.keyboard.press('Escape');
          await expect(dialog).toBeHidden();
          await expect(opener).toBeFocused();
        }
        expect(failedPortraits).toEqual([]);
        expect(pageErrors).toEqual([]);
      });
      test('owner-selected Yesenin replacement is painted in hero and catalog card', async ({ page }, testInfo) => {
        await page.addInitScript(mode => localStorage.setItem('tlp-theme-mode', mode), theme);
        for (const route of ['essays/sergei-yesenin-1921-1925', 'articles']) {
          await page.goto(`${BASE_URL}/${route}`, { waitUntil: 'domcontentloaded' });
          const image = page.locator('main img[src$="yesenin-part-2-editorial.webp"]').first();
          await image.scrollIntoViewIfNeeded();
          await expect(image).toBeVisible();
          expect(await image.evaluate(img => img.decode().then(() => [img.naturalWidth, img.naturalHeight]))).toEqual([1920, 1080]);
          await expect(image.locator('xpath=ancestor::*[@data-cover-state][1]')).toHaveAttribute('data-cover-state', 'loaded');
          await expect.poll(() => image.evaluate(img => {
            let opacity = 1;
            for (let node = img; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
            return opacity;
          })).toBeGreaterThanOrEqual(0.99);
          if (mobile && route !== 'articles') {
            const imageBox = await image.boundingBox();
            const creditsBox = await page.locator('[data-cover-credits]').boundingBox();
            expect(creditsBox.y).toBeGreaterThanOrEqual(imageBox.y + imageBox.height);
          }
          await page.screenshot({ path: testInfo.outputPath(`yesenin-${route === 'articles' ? 'card' : 'hero'}.png`) });
        }
      });
    });
  }
}
