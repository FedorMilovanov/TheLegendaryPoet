import { expect, test } from '@playwright/test';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const consentKey = 'tlp:analytics-consent:v1';
const qaGaId = 'G-TLP-ROUTE-QA';

function createGate() {
  let release;
  const promise = new Promise((resolve) => { release = resolve; });
  return { promise, release };
}

async function installAnalyticsHarness(page) {
  await page.route('https://www.googletagmanager.com/**', (route) => route.abort());
  await page.addInitScript(({ key }) => {
    window.localStorage.setItem(key, 'granted');
  }, { key: consentKey });
}

async function pageViews(page) {
  return page.evaluate(() => {
    const layer = Array.isArray(window.dataLayer) ? window.dataLayer : [];
    return layer
      .filter((entry) => Array.isArray(entry) && entry[0] === 'event' && entry[1] === 'page_view')
      .map((entry) => entry[2]);
  });
}

async function gaConfigured(page) {
  return page.evaluate((expectedId) => {
    const layer = Array.isArray(window.dataLayer) ? window.dataLayer : [];
    return layer.some((entry) => Array.isArray(entry) && entry[0] === 'config' && entry[1] === expectedId);
  }, qaGaId);
}

async function twoAnimationFrames(page) {
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
}

async function spaNavigate(page, path) {
  await page.evaluate((nextPath) => {
    window.history.pushState({}, '', nextPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}

test('page_view waits for lazy route settlement and ignores query-only filter mutations', async ({ page }) => {
  await installAnalyticsHarness(page);
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });

  await expect.poll(() => gaConfigured(page)).toBe(true);
  await expect.poll(async () => (await pageViews(page)).length).toBe(1);
  const homeTitle = await page.title();
  const initialViews = await pageViews(page);
  expect(initialViews[0].page_path).toBe('/');
  expect(initialViews[0].page_title).toBe(homeTitle);

  const ratingsChunkGate = createGate();
  let ratingsChunkRequests = 0;
  await page.route(/\/assets\/RatingsPage-[^/?]+\.js(?:\?.*)?$/, async (route) => {
    ratingsChunkRequests += 1;
    await ratingsChunkGate.promise;
    await route.continue();
  });

  try {
    await spaNavigate(page, '/ratings');
    await expect.poll(() => ratingsChunkRequests).toBe(1);
    await expect(page.getByRole('status', { name: 'Загрузка страницы' })).toBeVisible();
    await twoAnimationFrames(page);

    const whileLoading = await pageViews(page);
    expect(whileLoading).toHaveLength(1);
    expect(await page.title()).toBe(homeTitle);

    ratingsChunkGate.release();
    const ratingsSearch = page.getByRole('searchbox', { name: 'Найти поэта в рейтинге' });
    await expect(ratingsSearch).toBeVisible();
    await expect.poll(async () => (await pageViews(page)).length).toBe(2);

    const ratingsTitle = await page.title();
    const afterRatingsSettle = await pageViews(page);
    expect(afterRatingsSettle[1].page_path).toBe('/ratings');
    expect(afterRatingsSettle[1].page_title).toBe(ratingsTitle);

    await ratingsSearch.pressSequentially('Есенин', { delay: 12 });
    await expect(page).toHaveURL(/\/ratings\?[^#]*q=/);
    await twoAnimationFrames(page);
    expect(await pageViews(page)).toHaveLength(2);

    await spaNavigate(page, '/music');
    const musicSearch = page.getByRole('searchbox', { name: 'Найти музыкальный релиз' });
    await expect(musicSearch).toBeVisible();
    await expect.poll(async () => (await pageViews(page)).length).toBe(3);
    const musicTitle = await page.title();
    const afterMusicSettle = await pageViews(page);
    expect(afterMusicSettle[2].page_path).toBe('/music');
    expect(afterMusicSettle[2].page_title).toBe(musicTitle);

    await musicSearch.pressSequentially('Есенин', { delay: 12 });
    await expect(page).toHaveURL(/\/music\?[^#]*q=/);
    await twoAnimationFrames(page);
    expect(await pageViews(page)).toHaveLength(3);

    await page.goBack();
    await expect(page.getByRole('searchbox', { name: 'Найти поэта в рейтинге' })).toBeVisible();
    await expect.poll(async () => (await pageViews(page)).length).toBe(4);
    const afterBack = await pageViews(page);
    expect(afterBack[3].page_path).toMatch(/^\/ratings\?[^#]*q=/);
    expect(afterBack[3].page_title).toBe(await page.title());
  } finally {
    ratingsChunkGate.release();
  }
});

test('direct load with query state emits one truthful settled page_view', async ({ page }) => {
  await installAnalyticsHarness(page);
  await page.goto(`${baseURL}/ratings?sort=votes&q=%D0%95%D1%81%D0%B5%D0%BD%D0%B8%D0%BD`, { waitUntil: 'domcontentloaded' });

  const ratingsSearch = page.getByRole('searchbox', { name: 'Найти поэта в рейтинге' });
  await expect(ratingsSearch).toBeVisible();
  await expect(ratingsSearch).toHaveValue('Есенин');
  await expect.poll(() => gaConfigured(page)).toBe(true);
  await expect.poll(async () => (await pageViews(page)).length).toBe(1);

  const expectedPath = await page.evaluate(() => `${window.location.pathname}${window.location.search}`);
  const views = await pageViews(page);
  expect(views[0].page_path).toBe(expectedPath);
  expect(views[0].page_title).toBe(await page.title());
  expect(views[0].page_location).toBe(new URL(expectedPath, baseURL).href);
});
