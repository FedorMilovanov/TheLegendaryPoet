import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const FAVORITES_STORAGE_KEY = 'tlp-my-archive:v4';
const ARCHIVE_POET_ROUTES = ['/poets/sergei-yesenin', '/poets/alexander-pushkin'];

async function waitForRoute(page) {
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
}

async function openPoetWithFavorite(context, href) {
  const page = await context.newPage();
  const response = await page.goto(`${BASE_URL}${href}`, { waitUntil: 'domcontentloaded' });
  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(400);
  await waitForRoute(page);

  const addButton = page.getByRole('button', { name: /Добавить «.+» в архив/i }).first();
  await expect(addButton).toBeVisible({ timeout: 15_000 });
  await expect(addButton).toHaveAttribute('aria-pressed', 'false');

  const poemCard = addButton.locator('xpath=ancestor::*[starts-with(@id,"poem-")][1]');
  const poemCardId = await poemCard.getAttribute('id');
  expect(poemCardId).toMatch(/^poem-/);
  const archiveButton = page.locator(`#${poemCardId} button[aria-pressed]`).first();
  await expect(archiveButton).toHaveAttribute('aria-pressed', 'false');
  return { page, archiveButton, poemCardId };
}

export function registerArchiveCrossTabTests() {
  test('personal archive converges distinct near-concurrent favorites across real tabs', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-core', 'two-tab archive convergence runs once on desktop Chromium');
    const context = await browser.newContext({ locale: 'ru-RU', timezoneId: 'Europe/Paris', colorScheme: 'dark' });
    const pages = [];

    try {
      const first = await openPoetWithFavorite(context, ARCHIVE_POET_ROUTES[0]);
      const second = await openPoetWithFavorite(context, ARCHIVE_POET_ROUTES[1]);
      pages.push(first.page, second.page);
      expect(first.poemCardId).not.toBe(second.poemCardId);

      await Promise.all([first.archiveButton.click(), second.archiveButton.click()]);
      await expect(first.archiveButton).toHaveAttribute('aria-pressed', 'true');
      await expect(second.archiveButton).toHaveAttribute('aria-pressed', 'true');

      await expect.poll(
        () => first.page.evaluate((key) => {
          try {
            const snapshot = JSON.parse(localStorage.getItem(key) || 'null');
            if (!snapshot || snapshot.version !== 4 || !Array.isArray(snapshot.operations)) return [];
            return snapshot.operations
              .filter((operation) => operation?.favorite === true && typeof operation?.id === 'string')
              .map((operation) => operation.id)
              .sort();
          } catch {
            return [];
          }
        }, FAVORITES_STORAGE_KEY),
        { timeout: 5_000 },
      ).toHaveLength(2);

      const archive = await context.newPage();
      pages.push(archive);
      const response = await archive.goto(`${BASE_URL}/archive`, { waitUntil: 'domcontentloaded' });
      expect(response).not.toBeNull();
      expect(response.status()).toBeLessThan(400);
      await waitForRoute(archive);
      await expect.poll(
        () => archive.getByRole('button', { name: /Удалить «.+» из архива/i }).count(),
        { timeout: 5_000 },
      ).toBeGreaterThanOrEqual(2);
    } finally {
      for (const page of pages) await page.close().catch(() => undefined);
      await context.close();
    }
  });
}
