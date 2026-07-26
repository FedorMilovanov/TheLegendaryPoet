import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function essayLinks(page) {
  return page.locator('a[href^="/essays/"]');
}

test('articles catalog exposes only six premium longforms', async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));

  const response = await page.goto(`${BASE_URL}/articles`, { waitUntil: 'domcontentloaded' });
  expect(response.status()).toBeLessThan(400);

  await expect(page.getByRole('heading', { level: 1, name: /Исследования.*большие статьи/i })).toBeVisible();
  await expect(await essayLinks(page)).toHaveCount(6);
  await expect(page.locator('a[href^="/articles/article-"]')).toHaveCount(0);
  await expect(page.getByText('Тайна русской души в поэзии: христианский взгляд')).toHaveCount(0);
  await expect(page.getByText('Музыка слов: как поэзия становится песней')).toHaveCount(0);

  const cards = await essayLinks(page);
  await expect(cards.locator('img')).toHaveCount(6);
  const emptyAlts = await cards.locator('img').evaluateAll((images) => images.filter((image) => !image.getAttribute('alt')?.trim()).length);
  expect(emptyAlts).toBe(0);

  await page.getByRole('button', { name: 'Сергей Есенин', exact: true }).click();
  await expect(await essayLinks(page)).toHaveCount(3);
  await page.getByRole('button', { name: 'Владимир Маяковский', exact: true }).click();
  await expect(await essayLinks(page)).toHaveCount(3);
  await page.getByRole('button', { name: 'Все материалы', exact: true }).click();
  await expect(await essayLinks(page)).toHaveCount(6);

  const state = await page.evaluate(() => ({
    pathname: location.pathname,
    overflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - document.documentElement.clientWidth,
    failedImages: document.querySelectorAll('[data-image-state="failed"]').length,
  }));
  expect(state.pathname).toBe('/articles');
  expect(state.overflow).toBeLessThanOrEqual(2);
  expect(state.failedImages).toBe(0);
  expect(pageErrors).toEqual([]);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-articles-catalog-top.png`),
  });
});

test('legacy mini-article URLs redirect to canonical destinations', async ({ page }) => {
  await page.goto(`${BASE_URL}/articles/article-2`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/essays\/yesenin-kutezhi$/);

  await page.goto(`${BASE_URL}/articles/article-main-2`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/music$/);

  await page.goto(`${BASE_URL}/articles/unknown-old-id`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/articles$/);
});
