import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const SLUG = 'simonov-syn-artillerista-realnaya-istoriya';
const ROUTE = `/essays/${SLUG}`;
const HERO = '/images/essays/simonov/simonov-son-artillerista-hero.webp';
const TITLE = '«Огонь!» Реальная история «Сына артиллериста» Константина Симонова';
const TITLE_HEADING = /Огонь.*Реальная.*История.*Сына.*Артиллериста.*Константина Симонова/i;

async function waitForSettledRoute(page) {
  const main = page.locator('#main-content');
  await main.waitFor({ state: 'visible', timeout: 20_000 });
  await expect(main.locator('[aria-busy="true"]:visible')).toHaveCount(0);
  await expect(main.getByRole('heading', { level: 1 })).toBeVisible();
}

test('Simonov publication route renders the approved reader-safe object', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));

  const response = await page.goto(`${BASE_URL}${ROUTE}`, { waitUntil: 'domcontentloaded' });
  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(400);
  await waitForSettledRoute(page);

  await expect(page.getByRole('heading', { level: 1, name: TITLE_HEADING })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${ROUTE}$`));
  const hero = page.locator(`img[src$="${HERO}"]`).first();
  await expect(hero).toBeVisible();
  await expect.poll(async () => hero.evaluate((image) => ({
    width: image.naturalWidth,
    height: image.naturalHeight,
    complete: image.complete,
  }))).toEqual({ width: 1600, height: 900, complete: true });

  await expect(page.getByText('Обложка этой публикации — редакционная художественная реконструкция.', { exact: false })).toBeVisible();
  await expect(page.getByText('Она не является документальной фотографией Ивана Лоскутова, конкретной высоты или боя 1941 года.', { exact: false })).toBeVisible();
  await expect(page.getByText('На командном пункте решили, что произошла ошибка, и запросили подтверждение.', { exact: false })).toBeVisible();
  await expect(page.getByText('не превращает эту дату в безоговорочно доказанную «самую первую» публикацию', { exact: false })).toBeVisible();
  await expect(page.getByText('exact выпуск № 288 и его p.3 уже визуально проверены', { exact: false })).toBeVisible();

  await expect(page.getByText('Hero-кандидат', { exact: false })).toHaveCount(0);
  await expect(page.getByText('До production merge', { exact: false })).toHaveCount(0);
  await expect(page.getByText('рекламной формулой', { exact: false })).toHaveCount(0);

  const state = await page.evaluate(() => ({
    overflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - document.documentElement.clientWidth,
    failedImages: document.querySelectorAll('[data-image-state="failed"]').length,
  }));
  expect(state.overflow).toBeLessThanOrEqual(2);
  expect(state.failedImages).toBe(0);
  expect(pageErrors).toEqual([]);
});

test('Simonov catalog, payload, sitemap and feed all expose the same canonical slug', async ({ request }) => {
  const catalogResponse = await request.get(`${BASE_URL}/data/essays/catalog.json`);
  expect(catalogResponse.ok()).toBeTruthy();
  const catalog = await catalogResponse.json();
  const matches = catalog.filter((entry) => entry.slug === SLUG);
  expect(matches).toHaveLength(1);
  expect(matches[0].title).toBe(TITLE);
  expect(matches[0].cover).toBe(HERO);
  expect(matches[0].coverKind).toBe('reconstruction');

  const payloadResponse = await request.get(`${BASE_URL}/data/essays/${SLUG}.json`);
  expect(payloadResponse.ok()).toBeTruthy();
  const payload = await payloadResponse.json();
  expect(payload.slug).toBe(SLUG);
  expect(payload.cover).toBe(HERO);
  expect(payload.blocks.some((block) => block.type === 'image')).toBe(false);
  expect(payload.blocks.some((block) => block.type === 'poem')).toBe(false);
  expect((payload.sources || []).some((source) => source.id === 'mustatunturi-commons')).toBe(false);
  expect((payload.sources || []).some((source) => source.id === 'simonov-1943-commons')).toBe(false);

  const sitemapResponse = await request.get(`${BASE_URL}/sitemap.xml`);
  expect(sitemapResponse.ok()).toBeTruthy();
  const sitemap = await sitemapResponse.text();
  expect(sitemap).toContain(`https://thelegendarypoet.ru${ROUTE}`);
  expect(sitemap).toContain(`https://thelegendarypoet.ru${HERO}`);

  const feedResponse = await request.get(`${BASE_URL}/feed.xml`);
  expect(feedResponse.ok()).toBeTruthy();
  const feed = await feedResponse.text();
  expect(feed).toContain(`https://thelegendarypoet.ru${ROUTE}`);
  expect(feed).toContain(TITLE);
});
