import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
const VERSION = 'cloak-20260726-5';
const MASTER_SHA256 = 'f9e29065cc7191827750d252ecb8b8002385671faed5a4503dd2738065f661b7';
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

test('vector emblem, micro favicon, install icons and share metadata are coherent', async ({ page, request }) => {
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('meta[name="brand-release"]')).toHaveAttribute('content', VERSION);

  const releaseResponse = await request.get(`${BASE_URL}/brand-release.txt?verify=${Date.now()}`);
  expect(releaseResponse.status()).toBe(200);
  expect((await releaseResponse.text()).trim()).toBe(`${VERSION}\nmaster-sha256=${MASTER_SHA256}`);

  const vectorAssets = ['brand-emblem.svg', 'brand-mark-micro.svg', 'brand-emblem-mask.svg'];
  for (const asset of vectorAssets) {
    const assetResponse = await request.get(`${BASE_URL}/${asset}?verify=${Date.now()}`);
    expect(assetResponse.status(), `${asset} HTTP status`).toBe(200);
    const source = await assetResponse.text();
    expect(source, `${asset} contains vector geometry`).toMatch(/<path\b/);
    expect(source, `${asset} embeds no raster image`).not.toMatch(/<image\b/);
    expect(source, `${asset} has no square plate`).not.toMatch(/<rect\b/);
  }

  const standaloneResponse = await request.get(`${BASE_URL}/brand-emblem.svg?verify=${Date.now()}`);
  const standaloneSvg = await standaloneResponse.text();
  expect(standaloneSvg).toContain('viewBox="0 0 96 96"');
  expect(standaloneSvg).toContain('<linearGradient');
  expect(standaloneSvg).toContain('fill-rule="evenodd"');
  expect(standaloneSvg).toContain('id="aura-blur"');
  expect(standaloneSvg).toContain('id="rim-glow"');
  expect(standaloneSvg).not.toMatch(/id="core"|7fecff|49\.5L51\.5 57/i);

  const microResponse = await request.get(`${BASE_URL}/brand-mark-micro.svg?verify=${Date.now()}`);
  const microSvg = await microResponse.text();
  expect(microSvg).toContain('viewBox="0 0 32 32"');
  expect(microSvg).toContain('fill-rule="evenodd"');
  expect(microSvg).not.toMatch(/7fecff|f2ffff|17\.6 1\.65 3\.4/i);

  const rasterAssets = [
    ['brand-emblem-master.webp', { width: 320, height: 320 }],
    ['favicon-16.png', { width: 16, height: 16 }],
    ['favicon-32.png', { width: 32, height: 32 }],
    ['apple-touch-icon.png', { width: 180, height: 180 }],
    ['icon-192.png', { width: 192, height: 192 }],
    ['icon-512.png', { width: 512, height: 512 }],
    ['icon-maskable-512.png', { width: 512, height: 512 }],
    ['mstile-150x150.png', { width: 150, height: 150 }],
    ['og-image.jpg', { width: 1200, height: 630 }],
  ];

  for (const [asset, size] of rasterAssets) {
    const assetUrl = `${BASE_URL}/${asset}?verify=${Date.now()}`;
    const assetResponse = await request.get(assetUrl);
    expect(assetResponse.status(), `${asset} HTTP status`).toBe(200);
    expect(await imageSize(page, assetUrl), `${asset} dimensions`).toEqual(size);
  }

  const svgFavicon = page.locator('link[rel="icon"][type="image/svg+xml"]');
  await expect(svgFavicon).toHaveAttribute('href', new RegExp(`brand-mark-micro\\.svg\\?v=${VERSION}$`));
  await expect(page.locator('link[rel="icon"][sizes="32x32"]')).toHaveAttribute('href', new RegExp(`favicon-32\\.png\\?v=${VERSION}$`));
  await expect(page.locator('link[rel="icon"][sizes="16x16"]')).toHaveAttribute('href', new RegExp(`favicon-16\\.png\\?v=${VERSION}$`));
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', new RegExp(`apple-touch-icon\\.png\\?v=${VERSION}$`));
  expect(await page.locator('link[rel="preload"][href*="brand-emblem-master.webp"]').count()).toBe(0);

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

test('header renders the deep reference-shaped vector and restrained hover', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  const mark = page.locator('header [data-brand-mark]').first();
  await expect(mark).toBeVisible();
  await expect(mark).toHaveAttribute('data-brand-version', VERSION);
  await expect(mark).toHaveAttribute('data-brand-renderer', 'inline-vector');
  await expect(mark.locator('[data-brand-vector]')).toBeVisible();
  await expect(mark.locator('[data-brand-figure]')).toBeVisible();
  await expect(mark.locator('[data-brand-hood]')).toBeVisible();
  await expect(mark.locator('[data-brand-cloak]')).toBeVisible();
  await expect(mark.locator('[data-brand-face-void]')).toBeVisible();
  await expect(mark.locator('[data-brand-rim-light]')).toBeVisible();
  await expect(mark.locator('[data-brand-folds]')).toBeVisible();
  await expect(mark.locator('[data-brand-collar]')).toBeVisible();
  await expect(mark.locator('[data-brand-energy]')).toBeVisible();
  expect(await mark.locator('[data-brand-light-core]').count()).toBe(0);
  expect(await mark.locator('image, rect, [data-brand-fallback], [data-brand-book], [data-brand-wing], [data-brand-halo]').count()).toBe(0);

  const box = await mark.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(40);
  expect(box?.width).toBeLessThanOrEqual(52);
  expect(box?.height).toBeGreaterThanOrEqual(40);
  expect(box?.height).toBeLessThanOrEqual(52);

  const geometry = await mark.evaluate((node) => {
    const bounds = (selector) => node.querySelector(selector)?.getBBox();
    const hood = bounds('[data-brand-hood]');
    const face = bounds('[data-brand-face-void]');
    const cloak = bounds('[data-brand-cloak]');
    if (!hood || !face || !cloak) return null;
    return {
      faceToHoodWidth: face.width / hood.width,
      faceToHoodHeight: face.height / hood.height,
      cloakToHoodWidth: cloak.width / hood.width,
      hoodTop: hood.y,
      cloakBottom: cloak.y + cloak.height,
    };
  });

  expect(geometry).not.toBeNull();
  expect(geometry.faceToHoodWidth).toBeGreaterThan(0.62);
  expect(geometry.faceToHoodHeight).toBeGreaterThan(0.62);
  expect(geometry.cloakToHoodWidth).toBeGreaterThan(1.9);
  expect(geometry.hoodTop).toBeLessThan(7);
  expect(geometry.cloakBottom).toBeGreaterThanOrEqual(95.5);

  const vector = mark.locator('[data-brand-vector]');
  const rim = mark.locator('[data-brand-rim-light]');
  const folds = mark.locator('[data-brand-folds]');
  const energy = mark.locator('[data-brand-energy]');
  const before = {
    vector: await vector.getAttribute('style'),
    rim: await rim.getAttribute('style'),
    folds: await folds.getAttribute('style'),
    energy: await energy.getAttribute('style'),
  };

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'brand-emblem-vector-idle.png'),
    clip: {
      x: Math.max(0, (box?.x || 0) - 24),
      y: Math.max(0, (box?.y || 0) - 24),
      width: Math.min(page.viewportSize()?.width || 1280, (box?.width || 44) + 48),
      height: (box?.height || 44) + 48,
    },
  });

  await mark.hover();
  await page.waitForTimeout(520);

  const after = {
    vector: await vector.getAttribute('style'),
    rim: await rim.getAttribute('style'),
    folds: await folds.getAttribute('style'),
    energy: await energy.getAttribute('style'),
  };
  expect(after.vector).not.toBe(before.vector);
  expect(after.rim).not.toBe(before.rim);
  expect(after.folds).not.toBe(before.folds);
  expect(after.energy).not.toBe(before.energy);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'brand-emblem-vector-hover.png'),
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
  test(`${route}: header and footer use the vector emblem`, async ({ page }) => {
    const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('header [data-brand-mark]').first()).toBeVisible();
    expect(await page.locator('footer [data-brand-mark]').count()).toBeGreaterThanOrEqual(1);

    const result = await page.evaluate(() => {
      const marks = [...document.querySelectorAll('[data-brand-mark]')];
      return {
        marks: marks.length,
        wrongVersions: marks.filter((mark) => mark.getAttribute('data-brand-version') !== 'cloak-20260726-5').length,
        wrongRenderers: marks.filter((mark) => mark.getAttribute('data-brand-renderer') !== 'inline-vector').length,
        invalidViewBoxes: marks
          .map((mark) => mark.querySelector('svg')?.getAttribute('viewBox'))
          .filter((viewBox) => viewBox !== '0 0 96 96'),
        rasterOrPlate: marks.reduce(
          (count, mark) => count + mark.querySelectorAll('image, rect, [data-brand-fallback], [data-brand-book], [data-brand-wing], [data-brand-halo], [data-brand-light-core]').length,
          0,
        ),
      };
    });

    expect(result.marks).toBeGreaterThanOrEqual(2);
    expect(result.wrongVersions).toBe(0);
    expect(result.wrongRenderers).toBe(0);
    expect(result.invalidViewBoxes).toEqual([]);
    expect(result.rasterOrPlate).toBe(0);
  });
}
