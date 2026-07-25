import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const coreRoutes = ['/', '/poets', '/ratings', '/articles', '/music', '/archive', '/about'];

async function imageSize(page, url) {
  return page.evaluate(async (assetUrl) => {
    const image = new Image();
    image.src = assetUrl;
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight };
  }, url);
}

test('selected emblem, install metadata and share metadata are coherent', async ({ page, request }) => {
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);

  const expectedAssets = [
    ['favicon.svg', null],
    ['brand-emblem.svg', null],
    ['brand-emblem-mask.svg', null],
    ['brand-emblem-master.webp', { width: 512, height: 512 }],
    ['favicon-16.png', { width: 16, height: 16 }],
    ['favicon-32.png', { width: 32, height: 32 }],
    ['apple-touch-icon.png', { width: 180, height: 180 }],
    ['icon-192.png', { width: 192, height: 192 }],
    ['icon-512.png', { width: 512, height: 512 }],
    ['icon-maskable-512.png', { width: 512, height: 512 }],
    ['mstile-150x150.png', { width: 150, height: 150 }],
    ['og-image.jpg', { width: 1200, height: 630 }],
  ];

  for (const [asset, size] of expectedAssets) {
    const assetUrl = `${BASE_URL}/${asset}`;
    const assetResponse = await request.get(assetUrl);
    expect(assetResponse.status(), `${asset} HTTP status`).toBe(200);
    if (size) expect(await imageSize(page, assetUrl), `${asset} dimensions`).toEqual(size);
  }

  const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
  const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute('content');
  expect(ogImage).toBe('https://thelegendarypoet.ru/og-image.jpg');
  expect(twitterImage).toBe('https://thelegendarypoet.ru/og-image.jpg');
  await expect(page.locator('meta[property="og:image:type"]')).toHaveAttribute('content', 'image/jpeg');
  await expect(page.locator('link[rel="mask-icon"]')).toHaveAttribute('href', /brand-emblem-mask\.svg$/);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', /apple-touch-icon\.png$/);

  const manifestResponse = await request.get(`${BASE_URL}/site.webmanifest`);
  expect(manifestResponse.status()).toBe(200);
  const manifest = await manifestResponse.json();
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ src: '/favicon.svg', sizes: 'any' }),
    expect.objectContaining({ src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }),
    expect.objectContaining({ src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }),
    expect.objectContaining({ src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }),
  ]));

  const retiredResponse = await request.get(`${BASE_URL}/og-image.png`);
  expect(retiredResponse.status(), 'old share card must be removed').toBe(404);
});

test('the selected faceless figure glows subtly on hover without halo or retired symbols', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  const mark = page.locator('header [data-brand-mark]').first();
  await expect(mark).toBeVisible();
  await expect(mark.locator('[data-brand-figure]')).toBeVisible();
  await expect(mark.locator('[data-brand-aura]')).toBeVisible();
  expect(await mark.locator('[data-brand-book], [data-brand-wing], [data-brand-halo]').count()).toBe(0);

  const box = await mark.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(40);
  expect(box?.width).toBeLessThanOrEqual(52);
  expect(box?.height).toBeGreaterThanOrEqual(40);
  expect(box?.height).toBeLessThanOrEqual(52);

  const duplicateIds = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[data-brand-mark] svg [id]')].map((node) => node.id);
    return ids.filter((id, index) => ids.indexOf(id) !== index);
  });
  expect(duplicateIds, 'SVG definitions must be namespaced per emblem instance').toEqual([]);

  const figure = mark.locator('[data-brand-figure]');
  const aura = mark.locator('[data-brand-aura]');
  const mist = mark.locator('[data-brand-mist]');
  const before = {
    figure: await figure.getAttribute('style'),
    aura: await aura.getAttribute('style'),
    mist: await mist.getAttribute('style'),
    filter: await mark.locator('svg').getAttribute('style'),
  };

  await mark.hover();
  await page.waitForTimeout(440);

  const after = {
    figure: await figure.getAttribute('style'),
    aura: await aura.getAttribute('style'),
    mist: await mist.getAttribute('style'),
    filter: await mark.locator('svg').getAttribute('style'),
  };
  expect(after.figure).not.toBe(before.figure);
  expect(after.aura).not.toBe(before.aura);
  expect(after.mist).not.toBe(before.mist);
  expect(after.filter).not.toBe(before.filter);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'brand-emblem-selected-hover.png'),
    clip: {
      x: Math.max(0, (box?.x || 0) - 24),
      y: Math.max(0, (box?.y || 0) - 24),
      width: Math.min(page.viewportSize()?.width || 1280, (box?.width || 44) + 48),
      height: (box?.height || 44) + 48,
    },
  });
  expect(pageErrors).toEqual([]);
});

for (const route of coreRoutes) {
  test(`${route}: header and footer use the same selected emblem without SVG id collisions`, async ({ page }) => {
    const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('header [data-brand-mark]').first()).toBeVisible();
    expect(await page.locator('footer [data-brand-mark]').count()).toBeGreaterThanOrEqual(1);

    const result = await page.evaluate(() => {
      const marks = [...document.querySelectorAll('[data-brand-mark]')];
      const ids = marks.flatMap((mark) => [...mark.querySelectorAll('svg [id]')].map((node) => node.id));
      return {
        marks: marks.length,
        duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
        invalidViewBoxes: marks
          .map((mark) => mark.querySelector('svg')?.getAttribute('viewBox'))
          .filter((viewBox) => viewBox !== '0 0 96 96'),
        retiredElements: marks.reduce(
          (count, mark) => count + mark.querySelectorAll('[data-brand-book], [data-brand-wing], [data-brand-halo]').length,
          0,
        ),
      };
    });

    expect(result.marks).toBeGreaterThanOrEqual(2);
    expect(result.duplicateIds).toEqual([]);
    expect(result.invalidViewBoxes).toEqual([]);
    expect(result.retiredElements).toBe(0);
  });
}
