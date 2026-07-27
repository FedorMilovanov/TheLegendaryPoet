import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts', 'hall-audio-controls');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function releaseControlFocus(page) {
  await page.evaluate(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  });
}

test.describe('Hall of Poets audio controls', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, locale: 'ru-RU', timezoneId: 'Europe/Paris', colorScheme: 'dark' });

  test('mute state is reactive and shortcuts pause behind overlays', async ({ page }, testInfo) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));

    const response = await page.goto(`${BASE_URL}/hall`, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);

    const soundOn = page.getByRole('button', { name: /Звук вкл/ });
    await expect(soundOn).toBeVisible({ timeout: 20_000 });
    await soundOn.click();
    const soundOff = page.getByRole('button', { name: /Звук выкл/ });
    await expect(soundOff).toBeVisible();

    await releaseControlFocus(page);
    await page.keyboard.press('KeyM');
    await expect(page.getByRole('button', { name: /Звук вкл/ })).toBeVisible();

    await page.keyboard.press('Control+K');
    const search = page.getByRole('dialog', { name: 'Поиск по сайту' });
    await expect(search).toBeVisible();
    const query = page.getByRole('combobox', { name: 'Поисковый запрос' });
    await expect(query).toBeFocused();
    await page.keyboard.press('KeyM');
    await expect(query).toHaveValue('m');
    await expect(page.getByRole('button', { name: /Звук вкл/ })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(search).toBeHidden();
    await releaseControlFocus(page);
    await page.keyboard.press('KeyM');
    await expect(page.getByRole('button', { name: /Звук выкл/ })).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-mute-overlay-contract.png`),
      fullPage: false,
    });
    expect(pageErrors).toEqual([]);
  });
});
