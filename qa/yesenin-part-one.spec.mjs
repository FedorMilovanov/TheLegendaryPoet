import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function scrollWholePage(page) {
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
  await page.evaluate(async () => {
    const max = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const step = Math.max(420, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
}

test('Yesenin Part I renders the complete source-bounded biography', async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));

  const response = await page.goto(`${BASE_URL}/essays/sergei-yesenin-1895-1921`, {
    waitUntil: 'domcontentloaded',
  });
  expect(response.status()).toBeLessThan(400);
  await scrollWholePage(page);

  const mainContent = page.locator('#main-content');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Сергей Есенин. Часть I: 1895–1921' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: /Константиново: место рождения/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /1921 год: хулиган/i })).toBeVisible();
  await expect(page.getByText(/лазарет № 17 нельзя называть установленным местом формальной службы/i)).toBeVisible();

  const duncanDateParagraph = mainContent.locator('p').filter({
    hasText: 'Полный комментарий ПСС формулирует дату осторожно',
  });
  await expect(duncanDateParagraph).toHaveCount(1);
  await expect(duncanDateParagraph).toContainText('Есенин и Дункан познакомились');
  await expect(duncanDateParagraph).toContainText('видимо, 3 октября 1921 года');
  await expect(duncanDateParagraph).toContainText('предположительность названа прямо');
  await duncanDateParagraph.scrollIntoViewIfNeeded();
  await expect(duncanDateParagraph).toBeVisible();

  const citationTargets = await page.locator('a[href^="#source-"]').evaluateAll((links) => [
    ...new Set(links.map((link) => link.getAttribute('href')).filter(Boolean)),
  ]);
  expect(citationTargets).toHaveLength(64);

  const sourceHeading = page.getByRole('heading', {
    level: 2,
    name: 'Документы, тексты и исследования',
  });
  const sourceSection = page.locator('section').filter({ has: sourceHeading });
  await expect(sourceSection).toHaveCount(1);
  await expect(sourceSection.getByRole('button', { name: 'Все 64', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  const sourceItems = sourceSection.getByRole('listitem');
  await expect(sourceItems).toHaveCount(12);
  const showMore = sourceSection.getByRole('button', { name: 'Показать ещё 52', exact: true });
  await expect(showMore).toBeVisible();
  await showMore.click();
  await expect(showMore).toBeHidden();
  await expect(sourceItems).toHaveCount(64);
  await expect(sourceSection.locator('a[href^="https://"]')).toHaveCount(64);

  const state = await page.evaluate(() => ({
    pathname: location.pathname,
    title: document.title,
    overflow:
      Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) -
      document.documentElement.clientWidth,
    brokenImages: [...document.images]
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src),
    failedImages: document.querySelectorAll('[data-image-state="failed"]').length,
    headings: [...document.querySelectorAll('h2')].map((heading) => heading.textContent?.trim()),
  }));

  const evidence = {
    ...state,
    uniqueCitationTargets: citationTargets.length,
    expandedSourceCards: await sourceItems.count(),
    expandedSourceLinks: await sourceSection.locator('a[href^="https://"]').count(),
  };

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, `${testInfo.project.name}-yesenin-part-one.json`),
    JSON.stringify(evidence, null, 2),
  );

  await sourceHeading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-yesenin-part-one-sources.png`),
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(150);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-yesenin-part-one-top.png`),
  });

  expect(state.pathname).toBe('/essays/sergei-yesenin-1895-1921');
  expect(state.overflow).toBeLessThanOrEqual(2);
  expect(state.brokenImages).toEqual([]);
  expect(state.failedImages).toBe(0);
  expect(state.headings.length).toBeGreaterThanOrEqual(12);
  expect(pageErrors).toEqual([]);
});
