import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function settle(page) {
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForTimeout(900);
  await page.evaluate(async () => {
    const max = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const step = Math.max(420, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 45));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(450);
}

async function diagnostics(page) {
  return page.evaluate(() => ({
    overflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - document.documentElement.clientWidth,
    brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.currentSrc || image.src),
    failedImages: [...document.querySelectorAll('[data-image-state="failed"]')].length,
    title: document.title,
    pathname: location.pathname,
  }));
}

for (const profile of [
  { name: 'desktop', viewport: { width: 1440, height: 1000 }, mobile: false },
  { name: 'pixel7', viewport: { width: 412, height: 915 }, mobile: true },
]) {
  test.describe(`${profile.name} deep routes`, () => {
    test.use({
      viewport: profile.viewport,
      isMobile: profile.mobile,
      hasTouch: profile.mobile,
      locale: 'ru-RU',
      timezoneId: 'Europe/Paris',
      colorScheme: 'dark',
    });

    test('hall placeholder is readable and navigable', async ({ page }) => {
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));
      const response = await page.goto(`${BASE_URL}/hall`, { waitUntil: 'domcontentloaded' });
      expect(response.status()).toBeLessThan(400);
      await settle(page);
      await expect(page.getByRole('heading', { name: /Храм русской поэзии/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Перейти к поэтам/i })).toBeVisible();
      const state = await diagnostics(page);
      fs.writeFileSync(path.join(ARTIFACT_DIR, `${profile.name}-hall.json`), JSON.stringify(state, null, 2));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `${profile.name}-hall.png`), fullPage: true });
      expect(state.overflow).toBeLessThanOrEqual(2);
      expect(state.brokenImages).toEqual([]);
      expect(state.failedImages).toBe(0);
      expect(pageErrors).toEqual([]);
    });

    test('featured track detail renders the release passport and player', async ({ page }) => {
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));
      await page.goto(`${BASE_URL}/music`, { waitUntil: 'domcontentloaded' });
      await settle(page);
      const href = await page.getByRole('link', { name: /Страница релиза/i }).first().getAttribute('href');
      expect(href).toMatch(/^\/music\//);
      const response = await page.goto(`${BASE_URL}${href}`, { waitUntil: 'domcontentloaded' });
      expect(response.status()).toBeLessThan(400);
      await settle(page);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Паспорт релиза' })).toBeVisible();
      await expect(page.getByRole('button', { name: /Воспроизвести трек|Поставить на паузу|Повторить загрузку аудио/i }).first()).toBeEnabled();
      const state = await diagnostics(page);
      fs.writeFileSync(path.join(ARTIFACT_DIR, `${profile.name}-track-detail.json`), JSON.stringify({ href, ...state }, null, 2));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `${profile.name}-track-detail.png`), fullPage: true });
      expect(state.overflow).toBeLessThanOrEqual(2);
      expect(state.brokenImages).toEqual([]);
      expect(state.failedImages).toBe(0);
      expect(pageErrors).toEqual([]);
    });

    test('representative article or essay detail survives a direct deep link', async ({ page }) => {
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));
      await page.goto(`${BASE_URL}/articles`, { waitUntil: 'domcontentloaded' });
      await settle(page);
      const deepLink = page.locator('a[href^="/essays/"], a[href^="/articles/"]').first();
      const href = await deepLink.getAttribute('href');
      expect(href).toMatch(/^\/(essays|articles)\//);
      const response = await page.goto(`${BASE_URL}${href}`, { waitUntil: 'domcontentloaded' });
      expect(response.status()).toBeLessThan(400);
      await settle(page);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const state = await diagnostics(page);
      fs.writeFileSync(path.join(ARTIFACT_DIR, `${profile.name}-content-detail.json`), JSON.stringify({ href, ...state }, null, 2));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `${profile.name}-content-detail.png`), fullPage: true });
      expect(state.overflow).toBeLessThanOrEqual(2);
      expect(state.brokenImages).toEqual([]);
      expect(state.failedImages).toBe(0);
      expect(pageErrors).toEqual([]);
    });
  });
}
