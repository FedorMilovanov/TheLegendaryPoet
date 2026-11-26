import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ESSAY_SLUG = 'sergei-yesenin-1921-1925';

async function expectNoRouteRecovery(page) {
  await expect(page.getByRole('heading', { level: 1, name: /Попробуем восстановить страницу/i })).toHaveCount(0);
}

test('optional essay catalog failure cannot block primary poet or essay routes', async ({ context }) => {
  let catalogAttempts = 0;

  await context.route('**/data/essays/catalog.json', async (route) => {
    catalogAttempts += 1;
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'forced secondary catalog failure' }),
    });
  });

  const poetPage = await context.newPage();
  const poetErrors = [];
  poetPage.on('pageerror', (error) => poetErrors.push(String(error?.stack || error)));
  try {
    const response = await poetPage.goto(`${BASE_URL}/poets/sergei-yesenin`, { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    expect(response.status()).toBeLessThan(400);

    await expect(poetPage.getByRole('heading', { level: 1, name: /Сергей.*Есенин/i })).toBeVisible();
    await expect(poetPage.getByRole('heading', { level: 2, name: /Полная Биография/i })).toBeVisible();
    await expectNoRouteRecovery(poetPage);
    await expect(poetPage.getByRole('heading', { level: 2, name: /Биография и исследования/i })).toHaveCount(0);
    await expect.poll(() => catalogAttempts).toBe(1);
    expect(poetErrors).toEqual([]);
  } finally {
    await poetPage.close();
  }

  const essayPage = await context.newPage();
  const essayErrors = [];
  let essayPayloadAttempts = 0;
  essayPage.on('pageerror', (error) => essayErrors.push(String(error?.stack || error)));
  essayPage.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (pathname.endsWith(`/data/essays/${ESSAY_SLUG}.json`)) essayPayloadAttempts += 1;
  });
  try {
    const response = await essayPage.goto(`${BASE_URL}/essays/${ESSAY_SLUG}`, { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    expect(response.status()).toBeLessThan(400);

    await expect(essayPage.getByRole('heading', { level: 1, name: /Сергей Есенин.*1921–1925/i })).toBeVisible();
    await expect(essayPage.locator('article')).toBeVisible();
    await expect(essayPage.locator('article').locator('p').first()).toBeVisible();
    await expectNoRouteRecovery(essayPage);
    await expect(essayPage.getByRole('navigation', { name: 'Навигация по серии' })).toHaveCount(0);
    await expect.poll(() => catalogAttempts).toBe(2);
    expect(essayPayloadAttempts).toBe(1);
    expect(essayErrors).toEqual([]);
  } finally {
    await essayPage.close();
  }
});

test.describe('optional poet chunk independence', () => {
  for (const chunk of ['MoralPortrait', 'PoetSources', 'PoetVideos']) {
    test(`failure of ${chunk} preserves the complete poet corpus`, async ({ context, page }) => {
      const id = chunk === 'PoetVideos' ? 'aleksey-konstantinovich-tolstoy' : 'alexander-blok';
      let blocked = 0;
      await context.route(new RegExp('/assets/' + chunk + '-[^/]+[.]js$'), route => {
        blocked++;
        return route.abort();
      });
      const response = page.waitForResponse(r => new URL(r.url()).pathname === '/data/poets/' + id + '.json' && r.ok());
      await page.goto(BASE_URL + '/poets/' + id, { waitUntil: 'domcontentloaded' });
      const data = await (await response).json();
      await expect.poll(() => blocked).toBeGreaterThan(0);
      const bio = page.getByRole('heading', { level: 2, name: /Полная Биография/i }).locator('..').locator('.poetry-text > p');
      const recovery = page.getByRole('heading', { level: 1, name: /Попробуем восстановить страницу/i });
      await expect.poll(async () => (await recovery.count()) ? 'recovery' : (await bio.count()) === data.fullBio.split('\n\n').length ? 'full corpus' : 'pending').toBe('full corpus');
      await expect(bio.last()).toHaveText(data.fullBio.split('\n\n').at(-1));
      await expect(page.locator('div[id^="poem-"]')).toHaveCount(data.poems.length);
      await expect(page.locator('[data-poem-canonical]').first()).toBeVisible();
      await expect(page.getByText('Дополнительный раздел недоступен. Обновите страницу.', { exact: true })).toBeVisible();
      await expectNoRouteRecovery(page);
    });
  }
  test('held portrait does not postpone the biography or poems', async ({ context, page }) => {
    let release;
    let attempts = 0;
    const gate = new Promise(resolve => { release = resolve; });
    await context.route(/\/assets\/MoralPortrait-[^/]+[.]js$/, async route => {
      attempts++;
      await gate;
      return route.continue();
    });
    try {
      const response = page.waitForResponse(r => new URL(r.url()).pathname === '/data/poets/alexander-blok.json' && r.ok());
      await page.goto(BASE_URL + '/poets/alexander-blok', { waitUntil: 'domcontentloaded' });
      const data = await (await response).json();
      await expect.poll(() => attempts).toBeGreaterThan(0);
      const bio = page.getByRole('heading', { level: 2, name: /Полная Биография/i }).locator('..').locator('.poetry-text > p');
      await expect(bio).toHaveCount(data.fullBio.split('\n\n').length);
      await expect(page.locator('div[id^="poem-"]')).toHaveCount(data.poems.length);
      await expect(page.getByRole('region', { name: 'Характер и поступки' })).toHaveCount(0);
      release();
      await expect(page.getByRole('region', { name: 'Характер и поступки' })).toBeVisible();
      await expectNoRouteRecovery(page);
    } finally { release(); }
  });
});