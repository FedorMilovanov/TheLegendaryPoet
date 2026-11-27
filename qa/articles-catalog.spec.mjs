import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
const EXPECTED_PUBLISHED_ESSAY_HREFS = [
  '/essays/fet-perepletis-novyi-god',
  '/essays/simonov-syn-artillerista-realnaya-istoriya',
  '/essays/galina-benislavskaya-yesenin-manuscripts-publishing-archive',
  '/essays/vykhozhu-odin-ya-na-dorogu-lermontov',
  // Separate source-led acceptance list: every approved public release is explicit,
  // so a missing catalog card cannot pass by comparing data to itself.
  '/essays/pushkin-lermontov-dva-proroka',
  '/essays/yesenin-kutezhi',
  '/essays/sergei-yesenin-1895-1921',
  '/essays/sergei-yesenin-1921-1925',
  '/essays/yesenin-duncan-first-meeting-documents',
  '/essays/mayakovsky-before-revolution',
  '/essays/mayakovsky-gromovoy',
  '/essays/brik-case',
];
const EXPECTED_YESENIN_ESSAY_HREFS = [
  '/essays/galina-benislavskaya-yesenin-manuscripts-publishing-archive',
  '/essays/yesenin-kutezhi',
  '/essays/sergei-yesenin-1895-1921',
  '/essays/sergei-yesenin-1921-1925',
  '/essays/yesenin-duncan-first-meeting-documents',
];
const EXPECTED_MAYAKOVSKY_ESSAY_HREFS = [
  '/essays/mayakovsky-before-revolution',
  '/essays/mayakovsky-gromovoy',
  '/essays/brik-case',
];
const EXPECTED_LERMONTOV_ESSAY_HREFS = [
  '/essays/vykhozhu-odin-ya-na-dorogu-lermontov',
];
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function essayLinks(page) {
  return page.locator('a[href^="/essays/"]');
}

async function expectEssayHrefSet(page, expectedHrefs) {
  const links = await essayLinks(page);
  await expect(links).toHaveCount(expectedHrefs.length);
  const hrefs = await links.evaluateAll((anchors) => anchors
    .map((anchor) => anchor.getAttribute('href'))
    .filter(Boolean)
    .sort());
  expect(hrefs).toEqual([...expectedHrefs].sort());
}

async function waitForSettledRoute(page) {
  const main = page.locator('#main-content');
  await main.waitFor({ state: 'visible', timeout: 20_000 });
  await expect(main.locator('[aria-busy="true"]:visible')).toHaveCount(0);
  await expect(main.locator('h1, [role="heading"][aria-level="1"]').first()).toBeVisible();
}

function collectEssayPayloadRequests(page) {
  const requests = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.includes('/data/essays/') && url.pathname.endsWith('.json')) {
      requests.push(url.pathname);
    }
  });
  return requests;
}

async function expectNoAutomaticRetry(readAttempts) {
  const attempts = readAttempts();
  await new Promise((resolve) => setTimeout(resolve, 500));
  expect(readAttempts()).toBe(attempts);
}

async function expectLegacyRedirect(context, sourcePath, destination) {
  // Each legacy route gets a fresh page in the same project context. WebKit can
  // keep a client-side replace navigation alive while another route opens;
  // isolation prevents the previous redirect from interrupting the next goto.
  const probe = await context.newPage();
  try {
    const response = await probe.goto(`${BASE_URL}${sourcePath}`, { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    expect(response.status()).toBeLessThan(400);
    await expect(probe).toHaveURL(destination, { timeout: 12_000 });
    await waitForSettledRoute(probe);
    await expect(probe).toHaveURL(destination);
  } finally {
    await probe.close();
  }
}

async function expectUnknownLegacyNotFound(context, sourcePath) {
  const probe = await context.newPage();
  try {
    const response = await probe.goto(`${BASE_URL}${sourcePath}`, { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    expect(response.status()).toBeLessThan(400);
    await waitForSettledRoute(probe);
    await expect(probe).toHaveURL(new RegExp(`${sourcePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
    await expect(probe.getByRole('heading', { level: 1, name: /Страница Не Найдена/i })).toBeVisible();
    await expect(probe.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
  } finally {
    await probe.close();
  }
}

test('articles catalog exposes the complete premium longform library', async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));

  const response = await page.goto(`${BASE_URL}/articles`, { waitUntil: 'domcontentloaded' });
  expect(response.status()).toBeLessThan(400);

  await expect(page.getByRole('heading', { level: 1, name: /Исследования.*большие статьи/i })).toBeVisible();
  await expectEssayHrefSet(page, EXPECTED_PUBLISHED_ESSAY_HREFS);
  await expect(page.locator('a[href="/essays/sergei-yesenin-1921-1925"]')).toHaveCount(1);
  await expect(page.locator('a[href^="/articles/article-"]')).toHaveCount(0);
  await expect(page.getByText('Тайна русской души в поэзии: христианский взгляд')).toHaveCount(0);
  await expect(page.getByText('Музыка слов: как поэзия становится песней')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Выхожу один я на дорогу/i })).toHaveAttribute(
    'href',
    '/essays/vykhozhu-odin-ya-na-dorogu-lermontov',
  );

  const cards = await essayLinks(page);
  await expect(cards.locator('img')).toHaveCount(EXPECTED_PUBLISHED_ESSAY_HREFS.length);
  const emptyAlts = await cards.locator('img').evaluateAll((images) => images.filter((image) => !image.getAttribute('alt')?.trim()).length);
  expect(emptyAlts).toBe(0);

  await page.getByRole('button', { name: 'Сергей Есенин', exact: true }).click();
  await expectEssayHrefSet(page, EXPECTED_YESENIN_ESSAY_HREFS);
  await page.getByRole('button', { name: 'Владимир Маяковский', exact: true }).click();
  await expectEssayHrefSet(page, EXPECTED_MAYAKOVSKY_ESSAY_HREFS);
  await page.getByRole('button', { name: 'Михаил Лермонтов', exact: true }).click();
  await expectEssayHrefSet(page, EXPECTED_LERMONTOV_ESSAY_HREFS);
  await page.getByRole('button', { name: 'Все материалы', exact: true }).click();
  await expectEssayHrefSet(page, EXPECTED_PUBLISHED_ESSAY_HREFS);

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

test('browser essay payloads remain target-scoped and unknown slugs stay honest', async ({ context }) => {
  const listing = await context.newPage();
  const listingRequests = collectEssayPayloadRequests(listing);
  try {
    const response = await listing.goto(`${BASE_URL}/articles`, { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    expect(response.status()).toBeLessThan(400);
    await waitForSettledRoute(listing);
    await expectEssayHrefSet(listing, EXPECTED_PUBLISHED_ESSAY_HREFS);
    expect([...new Set(listingRequests)]).toEqual(['/data/essays/catalog.json']);
  } finally {
    await listing.close();
  }

  const detail = await context.newPage();
  const detailRequests = collectEssayPayloadRequests(detail);
  try {
    const response = await detail.goto(`${BASE_URL}/essays/sergei-yesenin-1921-1925`, { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    expect(response.status()).toBeLessThan(400);
    await waitForSettledRoute(detail);
    await expect(detail.getByRole('heading', { level: 1, name: /Сергей Есенин.*1921–1925/i })).toBeVisible();
    expect([...new Set(detailRequests)].sort()).toEqual([
      '/data/essays/catalog.json',
      '/data/essays/sergei-yesenin-1921-1925.json',
    ]);
  } finally {
    await detail.close();
  }

  const missing = await context.newPage();
  try {
    const response = await missing.goto(`${BASE_URL}/essays/not-a-real-essay`, { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    expect(response.status()).toBeLessThan(400);
    await waitForSettledRoute(missing);
    await expect(missing.getByRole('heading', { level: 1, name: /Статья не найдена/i })).toBeVisible();
    await expect(missing.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
    await expect(missing).toHaveURL(/\/essays\/not-a-real-essay$/);
  } finally {
    await missing.close();
  }
});

test('homepage remains available when the essay catalog fails and retries after a new SPA visit', async ({ page }) => {
  let catalogAttempts = 0;
  let documentRequests = 0;

  page.on('request', (request) => {
    if (request.resourceType() === 'document') documentRequests += 1;
  });
  await page.route('**/data/essays/catalog.json', async (route) => {
    catalogAttempts += 1;
    if (catalogAttempts === 1) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'temporary catalog failure' }),
      });
      return;
    }
    await route.continue();
  });

  const response = await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(400);
  await expect(page.getByRole('heading', { level: 1, name: /THE LEGENDARY POET/i })).toBeVisible();
  await expect.poll(() => catalogAttempts).toBe(1);
  await expect(page.getByLabel('Количество исследований пока недоступно')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1, name: /Попробуем восстановить страницу/i })).toHaveCount(0);
  await expectNoAutomaticRetry(() => catalogAttempts);

  await page.locator('a[href="/poets"]:visible').first().click();
  await expect(page).toHaveURL(/\/poets$/);
  await waitForSettledRoute(page);
  await page.locator('a[href="/"]:visible').first().click();
  await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`));
  await expect(page.getByRole('heading', { level: 1, name: /THE LEGENDARY POET/i })).toBeVisible();
  await expect.poll(() => catalogAttempts).toBe(2);
  await expect(page.getByLabel('Количество исследований пока недоступно')).toHaveCount(0);
  expect(documentRequests).toBe(1);
});

test('failed catalog Suspense visit stays stable until a later SPA visit retries it', async ({ page }) => {
  let catalogAttempts = 0;
  let documentRequests = 0;

  page.on('request', (request) => {
    if (request.resourceType() === 'document') documentRequests += 1;
  });
  await page.route('**/data/essays/catalog.json', async (route) => {
    catalogAttempts += 1;
    if (catalogAttempts === 1) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'temporary catalog failure' }),
      });
      return;
    }
    await route.continue();
  });

  const response = await page.goto(`${BASE_URL}/articles`, { waitUntil: 'domcontentloaded' });
  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(400);
  await expect(page.getByRole('heading', { level: 1, name: /Попробуем восстановить страницу/i })).toBeVisible();
  await expect.poll(() => catalogAttempts).toBe(1);
  await expectNoAutomaticRetry(() => catalogAttempts);

  await page.getByRole('link', { name: /На главную/i }).click();
  await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`));
  await expect(page.getByRole('heading', { level: 1, name: /THE LEGENDARY POET/i })).toBeVisible();
  await expect.poll(() => catalogAttempts).toBe(2);

  await page.getByRole('link', { name: /Изучить статьи/i }).click();
  await expect(page).toHaveURL(/\/articles$/);
  await waitForSettledRoute(page);
  await expectEssayHrefSet(page, EXPECTED_PUBLISHED_ESSAY_HREFS);
  expect(catalogAttempts).toBe(2);
  expect(documentRequests).toBe(1);
});

test('failed essay body stays stable until revisit, then success remains cached', async ({ page }) => {
  const slug = 'sergei-yesenin-1921-1925';
  let catalogAttempts = 0;
  let bodyAttempts = 0;
  let documentRequests = 0;

  page.on('request', (request) => {
    if (request.resourceType() === 'document') documentRequests += 1;
  });
  await page.route('**/data/essays/catalog.json', async (route) => {
    catalogAttempts += 1;
    await route.continue();
  });
  await page.route(`**/data/essays/${slug}.json`, async (route) => {
    bodyAttempts += 1;
    if (bodyAttempts === 1) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'temporary essay failure' }),
      });
      return;
    }
    await route.continue();
  });

  const response = await page.goto(`${BASE_URL}/articles`, { waitUntil: 'domcontentloaded' });
  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(400);
  await waitForSettledRoute(page);
  await expect(page.locator(`a[href="/essays/${slug}"]`)).toHaveCount(1);
  await expect.poll(() => catalogAttempts).toBe(1);

  await page.locator(`a[href="/essays/${slug}"]`).click();
  await expect(page.getByRole('heading', { level: 1, name: /Попробуем восстановить страницу/i })).toBeVisible();
  await expect.poll(() => bodyAttempts).toBe(1);
  await expectNoAutomaticRetry(() => bodyAttempts);

  await page.getByRole('link', { name: /На главную/i }).click();
  await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`));
  await expect(page.getByRole('heading', { level: 1, name: /THE LEGENDARY POET/i })).toBeVisible();
  await page.getByRole('link', { name: /Изучить статьи/i }).click();
  await expect(page).toHaveURL(/\/articles$/);
  await waitForSettledRoute(page);

  await page.locator(`a[href="/essays/${slug}"]`).click();
  await expect(page.getByRole('heading', { level: 1, name: /Сергей Есенин.*1921–1925/i })).toBeVisible();
  await expect.poll(() => bodyAttempts).toBe(2);

  await page.getByRole('link', { name: /Все статьи/i }).click();
  await expect(page).toHaveURL(/\/articles$/);
  await waitForSettledRoute(page);
  await page.locator(`a[href="/essays/${slug}"]`).click();
  await expect(page.getByRole('heading', { level: 1, name: /Сергей Есенин.*1921–1925/i })).toBeVisible();
  expect(bodyAttempts).toBe(2);
  expect(catalogAttempts).toBe(1);
  expect(documentRequests).toBe(1);
});

test('known legacy article URLs redirect while unknown ids remain real NotFound routes', async ({ context }) => {
  await expectLegacyRedirect(context, '/articles/article-2', /\/essays\/yesenin-kutezhi$/);
  await expectLegacyRedirect(context, '/articles/article-main-2', /\/music$/);
  await expectUnknownLegacyNotFound(context, '/articles/unknown-old-id');
});
test('Simonov diary source distinguishes the electronic host from the print edition', async ({ page }) => {
  await page.goto(`${BASE_URL}/essays/simonov-syn-artillerista-realnaya-istoriya`);
  const source = page.locator('#source-simonov-diary-militera');
  await expect(source).toContainText('Сайт «Военная литература» (Militera)');
  await expect(source).toContainText('1982');
  await expect(source).toContainText('OCR-передача, не факсимиле');
  await expect(source).toContainText('Художественная литература');
  await expect(source.locator('a')).toHaveAttribute('href', 'https://militera.lib.ru/db/simonov_km/1_19.html');
  await source.scrollIntoViewIfNeeded();
  await expect(source).toBeInViewport();
});

test('Fet collection links the album, source map, reader and poet across responsive layouts', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(`${BASE_URL}/music#new-year-symphony`, { waitUntil: 'domcontentloaded' });
  const card = page.locator('#new-year-symphony');
  await expect(card.getByRole('heading', { name: 'Новогодняя Симфония Русской Поэзии' })).toBeVisible();
  await expect(card.getByRole('link', { name: 'Плейлист на YouTube' })).toHaveAttribute('href', 'https://www.youtube.com/playlist?list=PLZH4xU7Qrx5k');
  await expect(card.getByRole('link', { name: 'Видео на YouTube' })).toHaveAttribute('href', 'https://www.youtube.com/watch?v=K9sZYuUnzCk');
  await expect(card.locator('time')).toHaveAttribute('datetime', '2026-11-27T17:30:00+03:00');
  await expect(card.getByRole('heading', { name: 'Новогодняя Симфония Русской Поэзии' })).toBeInViewport();
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('img')).toHaveAttribute('data-image-state', 'loaded');
  const sourceDetails = card.locator('details');
  const sourceList = sourceDetails.locator('.poetry-collection-source-list');
  const summary = sourceDetails.locator('summary');
  await expect(sourceList).toBeHidden();
  expect(await sourceList.evaluate(el => el.getBoundingClientRect().height)).toBe(0);
  if (testInfo.project.name === 'chromium-core') {
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(sourceDetails).toHaveAttribute('open', '');
    await expect(sourceList).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(sourceDetails.locator('.poetry-collection-source-main').first()).toBeFocused();
  } else {
    await summary.click();
    await expect(sourceList).toBeVisible();
  }
  await summary.click();
  await expect(sourceList).toBeHidden();
  expect(await sourceList.evaluate(el => el.getBoundingClientRect().height)).toBe(0);
  await summary.click();
  await expect(card.locator('.poetry-collection-source-list li')).toHaveCount(9);
  await expect(card.locator('a.poetry-collection-original[target="_blank"]')).toHaveCount(9);
  await expect(card.getByRole('link', {name: 'Читать в библиотеке: Певице'})).toHaveAttribute('href', '/poets/afanasy-fet#poem-fet-4');
  await expect(card.getByRole('link', {name: 'Читать в библиотеке: Скрип шагов вдоль улиц белых…'})).toHaveAttribute('href', '/poets/afanasy-fet#poem-fet-5');
  await expect(card.getByRole('link', {name: 'Читать в библиотеке: Благовонная ночь, благодатная ночь…'})).toHaveAttribute('href', '/poets/afanasy-fet#poem-fet-6');
  await expect(card.locator('.poetry-collection-library-link')).toHaveCount(8);
  await expect(card.getByRole('link', {name: 'Читать в библиотеке: На двойном стекле узоры…'})).toHaveAttribute('href', '/poets/afanasy-fet#poem-fet-7');
  await expect(card.getByRole('link', {name: 'Читать в библиотеке: Сегодня все звезды так пышно…'})).toHaveAttribute('href', '/poets/afanasy-fet#poem-fet-8');
  await expect(card.getByRole('link', {name: 'Читать в библиотеке: Если зимнее небо звезда́ми горит…'})).toHaveAttribute('href', '/poets/afanasy-fet#poem-fet-9');
  await expect(card.getByRole('link', {name: 'Читать в библиотеке: В руке с тамбурином, в глазах с упоеньем…'})).toHaveAttribute('href', '/poets/afanasy-fet#poem-fet-10');
  await expect(card.getByRole('link', {name: 'Читать в библиотеке: Дифирамб на Новый год'})).toHaveAttribute('href', '/poets/afanasy-fet#poem-fet-11');
  await expect(card.getByRole('link', {name: 'Первоисточник: Дифирамб на Новый год'})).toHaveAttribute('href', 'https://imwerden.de/pdf/fet_sobranie_sochinenij_v_20tt_tom01_2002__ocr.pdf#page=324');
  await expect(card.locator('.poetry-collection-source-list li').first()).toBeVisible();
  const bounds = await card.evaluate(el => ({ width: el.scrollWidth, client: el.clientWidth, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
  expect(bounds.width - bounds.client).toBeLessThanOrEqual(1);
  expect(bounds.overflow).toBeLessThanOrEqual(1);
  await page.screenshot({path: path.join(ARTIFACT_DIR, `${testInfo.project.name}-new-year-collection.png`)});
  await card.locator('.poetry-collection-source-main').filter({ hasText: 'Дифирамб на Новый год' }).click();
  await expect(page).toHaveURL(/\/essays\/fet-perepletis-novyi-god#literary-fragment-dithyramb$/);
  await expect(page.getByRole('heading', {level: 1, name: /Зимняя Поэзия Афанасия Фета/i})).toBeVisible();
  await expect(page.locator('#literary-fragment-dithyramb')).toHaveCount(1);
  await expect(page.locator('#literary-fragment-dithyramb')).toContainText('Дифирамб на Новый Год · 1840');
  await expect(page.locator('#literary-fragment-dithyramb')).toBeInViewport();
  await expect(page.locator('#source-dithyramb')).toHaveCount(1);
  const fragmentIds = await page.locator('[id^="literary-fragment-"]').evaluateAll(elements => elements.map(el => el.id));
  expect(fragmentIds).toHaveLength(9);
  expect(new Set(fragmentIds).size).toBe(9);
  await expect(page.getByRole('link', { name: 'Новогодняя Симфония Русской Поэзии' })).toHaveAttribute('href', '/music#new-year-symphony');
  await page.getByRole('link', { name: 'Новогодняя Симфония Русской Поэзии' }).click();
  await expect(page).toHaveURL(/\/music#new-year-symphony$/);
  await expect(card.getByRole('heading', { name: 'Новогодняя Симфония Русской Поэзии' })).toBeInViewport();
  await summary.click();
  await card.getByRole('link', {name: 'Читать в библиотеке: Певице'}).click();
  await expect(page).toHaveURL(/\/poets\/afanasy-fet#poem-fet-4$/);
  await expect(page.locator('#poem-fet-4')).toBeInViewport();
  await expect(page.getByRole('link', { name: /Зимняя Поэзия Афанасия Фета/i })).toHaveAttribute('href', '/essays/fet-perepletis-novyi-god');
  await expect(page.getByRole('link', { name: 'Новогодняя Симфония Русской Поэзии' })).toHaveAttribute('href', '/music#new-year-symphony');
  expect(errors).toEqual([]);
});
