import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const FAVORITES_STORAGE_KEY = 'tlp-my-archive:v4';

async function waitForRoute(page) {
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
}

async function discoverPoetRoutes(context) {
  const page = await context.newPage();
  try {
    const response = await page.goto(`${BASE_URL}/poets`, { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    expect(response.status()).toBeLessThan(400);
    await waitForRoute(page);
    const hrefs = await page.locator('a[href^="/poets/"]').evaluateAll((links) => {
      const values = links
        .map((link) => link.getAttribute('href'))
        .filter((href) => typeof href === 'string' && /^\/poets\/[^/?#]+$/.test(href));
      return [...new Set(values)].slice(0, 8);
    });
    expect(hrefs.length, 'poet catalog must expose at least two detail routes').toBeGreaterThanOrEqual(2);
    return hrefs;
  } finally {
    await page.close();
  }
}

async function openPoetWithFavorite(context, href) {
  const page = await context.newPage();
  const response = await page.goto(`${BASE_URL}${href}`, { waitUntil: 'domcontentloaded' });
  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(400);
  await waitForRoute(page);
  const button = page.getByRole('button', { name: /Добавить «.+» в архив/i }).first();
  await expect(button).toBeVisible({ timeout: 15_000 });
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  return { page, button };
}

export function registerArchiveCrossTabTests() {
  test('personal archive converges distinct near-concurrent favorites across real tabs', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-core', 'two-tab archive convergence runs once on desktop Chromium');
    const context = await browser.newContext({ locale: 'ru-RU', timezoneId: 'Europe/Paris', colorScheme: 'dark' });
    const pages = [];

    try {
      const poetRoutes = await discoverPoetRoutes(context);
      let first = null;
      let second = null;

      for (const href of poetRoutes) {
        try {
          const candidate = await openPoetWithFavorite(context, href);
          pages.push(candidate.page);
          if (!first) first = candidate;
          else {
            second = candidate;
            break;
          }
        } catch {
          const candidatePage = context.pages().at(-1);
          if (candidatePage && candidatePage !== first?.page) await candidatePage.close().catch(() => undefined);
        }
      }

      expect(first, 'first poet page with a real archive control').not.toBeNull();
      expect(second, 'second poet page with a real archive control').not.toBeNull();
      if (!first || !second) return;

      await Promise.all([first.button.click(), second.button.click()]);

      await expect(first.button).toHaveAttribute('aria-pressed', 'true');
      await expect(second.button).toHaveAttribute('aria-pressed', 'true');

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
