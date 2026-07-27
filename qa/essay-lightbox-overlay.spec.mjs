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
