import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

async function pageViews(page) {
  return page.evaluate(() => (window.dataLayer || [])
    .filter((entry) => Array.isArray(entry) && entry[0] === 'event' && entry[1] === 'page_view')
    .map((entry) => entry[2]));
}

async function flushRouteEffects(page) {
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
}

test.describe('semantic analytics route authority', () => {
  test('query-only state does not emit page_view and pathname navigation emits settled metadata once', async ({ page }) => {
    await page.route('https://www.googletagmanager.com/**', (route) => route.abort());
    await page.addInitScript(() => {
      window.localStorage.setItem('tlp:analytics-consent:v1', 'granted');
    });

    await page.goto(`${BASE_URL}/ratings`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('searchbox', { name: 'Найти поэта в рейтинге' })).toBeVisible();
    await expect.poll(async () => (await pageViews(page)).length).toBe(1);

    const initial = await pageViews(page);
    expect(initial[0].page_path).toBe('/ratings');
    expect(new URL(initial[0].page_location).pathname).toBe('/ratings');
    expect(new URL(initial[0].page_location).search).toBe('');
    expect(initial[0].page_title).toBe(await page.title());

    const search = page.getByRole('searchbox', { name: 'Найти поэта в рейтинге' });
    await search.fill('Есенин');
    await expect(page).toHaveURL(/\/ratings\?q=/);
    await flushRouteEffects(page);
    expect(await pageViews(page)).toHaveLength(1);

    await page.getByRole('button', { name: 'Оценка редакции' }).click();
    await expect(page).toHaveURL(/sort=editorial/);
    await flushRouteEffects(page);
    expect(await pageViews(page)).toHaveLength(1);

    await page.evaluate(() => {
      window.history.pushState({}, '', '/about?from=analytics-qa');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page).toHaveURL(`${BASE_URL}/about?from=analytics-qa`);
    await expect.poll(async () => (await pageViews(page)).length).toBe(2);

    const views = await pageViews(page);
    const about = views[1];
    expect(about.page_path).toBe('/about');
    expect(new URL(about.page_location).pathname).toBe('/about');
    expect(new URL(about.page_location).search).toBe('');
    expect(about.page_title).toBe(await page.title());
  });
});
