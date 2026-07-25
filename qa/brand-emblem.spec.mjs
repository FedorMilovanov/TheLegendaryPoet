import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
const VERSION = 'cloak-20260725-3';
const MASTER_SHA256 = '186ed97c95eed248e9a4cdca3a01e3f2bc93a6681729c0fdc73f2c484df3ea4d';
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

test('approved emblem master, install icons and share metadata are coherent', async ({ page, request }) => {
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('meta[name="brand-release"]')).toHaveAttribute('content', VERSION);

  const releaseResponse = await request.get(`${BASE_URL}/brand-release.txt?verify=${Date.now()}`);
  expect(releaseResponse.status()).toBe(200);
  expect((await releaseResponse.text()).trim()).toBe(`${VERSION}\nmaster-sha256=${MASTER_SHA256}`);

  const expectedAssets = [
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
    const assetUrl = `${BASE_URL}/${asset}?verify=${Date.now()}`;
    const assetResponse = await request.get(assetUrl);
    expect(assetResponse.status(), `${asset} HTTP status`).toBe(200);
    if (size) expect(await imageSize(page, assetUrl), `${asset} dimensions`).toEqual(size);
  }

  const standaloneResponse = await request.get(`${BASE_URL}/brand-emblem.svg?verify=${Date.now()}`);
  expect(standaloneResponse.status()).toBe(200);
  const standaloneSvg = await standaloneResponse.text();
  expect(standaloneSvg).toContain(`brand-emblem-master.webp?v=${VERSION}`);
  expect(standaloneSvg).not.toMatch(/<(?:path|circle|ellipse|polygon|polyline)\b/);

  await expect(page.locator('link[rel="preload"][as="image"]')).toHaveAttribute(
    'href',
    new RegExp(`brand-emblem-master\\.webp\\?v=${VERSION}$`),
  );
  await expect(page.locator('link[rel="preload"][as="image"]')).toHaveAttribute('type', 'image/webp');
  await expect(page.locator('link[rel="preload"][as="image"]')).toHaveAttribute('fetchpriority', 'high');
  await expect(page.locator('link[rel="icon"][sizes="32x32"]')).toHaveAttribute('href', new RegExp(`favicon-32\\.png\\?v=${VERSION}$`));
  await expect(page.locator('link[rel="icon"][sizes="16x16"]')).toHaveAttribute('href', new RegExp(`favicon-16\\.png\\?v=${VERSION}$`));
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', new RegExp(`apple-touch-icon\\.png\\?v=${VERSION}$`));
  expect(await page.locator('link[rel="icon"][href*="favicon.svg"]').count()).toBe(0);

  const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
  const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute('content');
  expect(ogImage).toBe(`https://thelegendarypoet.ru/og-image.jpg?v=${VERSION}`);
  expect(twitterImage).toBe(`https://thelegendarypoet.ru/og-image.jpg?v=${VERSION}`);
  await expect(page.locator('meta[property="og:image:type"]')).toHaveAttribute('content', 'image/jpeg');

  const manifestResponse = await request.get(`${BASE_URL}/site.webmanifest?v=${VERSION}`);
  expect(manifestResponse.status()).toBe(200);
  const manifest = await manifestResponse.json();
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ src: `/favicon-32.png?v=${VERSION}`, sizes: '32x32', type: 'image/png' }),
    expect.objectContaining({ src: `/icon-192.png?v=${VERSION}`, sizes: '192x192', type: 'image/png', purpose: 'any' }),
    expect.objectContaining({ src: `/icon-512.png?v=${VERSION}`, sizes: '512x512', type: 'image/png', purpose: 'any' }),
    expect.objectContaining({ src: `/icon-maskable-512.png?v=${VERSION}`, purpose: 'maskable' }),
  ]));
});

test('header renders only the approved cloaked figure and restrained hover', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  const mark = page.locator('header [data-brand-mark]').first();
  await expect(mark).toBeVisible();
  await expect(mark).toHaveAttribute('data-brand-version', VERSION);
  await expect(mark.locator('[data-brand-figure]')).toBeVisible();
  await expect(mark.locator('[data-brand-glow]')).toBeVisible();
  expect(await mark.locator('[data-brand-fallback], [data-brand-book], [data-brand-wing], [data-brand-halo], [data-brand-mist]').count()).toBe(0);

  const figureHref = await mark.locator('[data-brand-figure]').getAttribute('href');
  expect(figureHref).toContain(`brand-emblem-master.webp?v=${VERSION}`);

  const box = await mark.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(40);
  expect(box?.width).toBeLessThanOrEqual(52);
  expect(box?.height).toBeGreaterThanOrEqual(40);
  expect(box?.height).toBeLessThanOrEqual(52);

  const figure = mark.locator('[data-brand-figure]');
  const glow = mark.locator('[data-brand-glow]');
  const before = {
    figure: await figure.getAttribute('style'),
    glow: await glow.getAttribute('style'),
    filter: await mark.locator('svg').getAttribute('style'),
  };

  await mark.hover();
  await page.waitForTimeout(440);

  const after = {
    figure: await figure.getAttribute('style'),
    glow: await glow.getAttribute('style'),
    filter: await mark.locator('svg').getAttribute('style'),
  };
  expect(after.figure).not.toBe(before.figure);
  expect(after.glow).not.toBe(before.glow);
  expect(after.filter).not.toBe(before.filter);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'brand-emblem-approved-hover.png'),
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
  test(`${route}: header and footer use only the approved emblem`, async ({ page }) => {
    const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('header [data-brand-mark]').first()).toBeVisible();
    expect(await page.locator('footer [data-brand-mark]').count()).toBeGreaterThanOrEqual(1);

    const result = await page.evaluate(() => {
      const marks = [...document.querySelectorAll('[data-brand-mark]')];
      return {
        marks: marks.length,
        wrongVersions: marks.filter((mark) => mark.getAttribute('data-brand-version') !== 'cloak-20260725-3').length,
        invalidViewBoxes: marks
          .map((mark) => mark.querySelector('svg')?.getAttribute('viewBox'))
          .filter((viewBox) => viewBox !== '0 0 96 96'),
        substituteFigures: marks.reduce(
          (count, mark) => count + mark.querySelectorAll('[data-brand-fallback], path, circle, polygon, [data-brand-book], [data-brand-wing], [data-brand-halo]').length,
          0,
        ),
      };
    });

    expect(result.marks).toBeGreaterThanOrEqual(2);
    expect(result.wrongVersions).toBe(0);
    expect(result.invalidViewBoxes).toEqual([]);
    expect(result.substituteFigures).toBe(0);
  });
}
