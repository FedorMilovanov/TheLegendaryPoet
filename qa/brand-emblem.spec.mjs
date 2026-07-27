import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
const VERSION = 'cloak-20260726-8';
const MASTER_SHA256 = 'f9e29065cc7191827750d252ecb8b8002385671faed5a4503dd2738065f661b7';
const VECTOR_SOURCE = 'canonical-reference-reset-v9-0';
const coreRoutes = ['/', '/poets', '/ratings', '/articles', '/music', '/archive', '/about'];
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function imageSize(page, url) {
  return page.evaluate(async (assetUrl) => {
    const image = new Image();
    image.src = assetUrl;
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight };
  }, url);
}

test('v9.0 vector system, optical mark and platform metadata are coherent', async ({ page, request }) => {
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('meta[name="brand-release"]')).toHaveAttribute('content', VERSION);

  const releaseResponse = await request.get(`${BASE_URL}/brand-release.txt?verify=${Date.now()}`);
  expect(releaseResponse.status()).toBe(200);
  expect((await releaseResponse.text()).trim()).toBe(`${VERSION}\nmaster-sha256=${MASTER_SHA256}`);

  const sources = new Map();
  for (const asset of ['brand-emblem.svg', 'brand-mark-micro.svg', 'brand-emblem-mask.svg']) {
    const assetResponse = await request.get(`${BASE_URL}/${asset}?verify=${Date.now()}`);
    expect(assetResponse.status(), asset).toBe(200);
    const source = await assetResponse.text();
    sources.set(asset, source);
    expect(source, `${asset}: vector geometry`).toMatch(/<path\b/);
    expect(source, `${asset}: closing root`).toMatch(/<\/svg>\s*$/);
    expect(source, `${asset}: raster ban`).not.toMatch(/<image\b|data:image|base64,/i);
    expect(source, `${asset}: plate ban`).not.toMatch(/<rect\b/);
    expect(source, `${asset}: valid XML attributes`).not.toMatch(/<[^>]+\sdata-brand-[\w-]+(?=\s|>)(?!\s*=)/);
  }

  const standalone = sources.get('brand-emblem.svg');
  expect(standalone).toContain('viewBox="0 0 96 96"');
  expect(standalone).toContain(`data-brand-vector-source="${VECTOR_SOURCE}"`);
  expect(standalone).toContain('M48 36.8C40.5 36.8');
  expect(standalone).toContain('M48 9.7C42.3 11.8');
  expect(standalone).toContain('M48 17.7C43.9 18.3');
  expect(standalone.indexOf('data-brand-collar')).toBeLessThan(standalone.indexOf('data-brand-hood'));
  expect((standalone.match(/<path\b/g) || []).length).toBeGreaterThanOrEqual(80);

  const micro = sources.get('brand-mark-micro.svg');
  expect(micro).toContain('viewBox="0 0 32 32"');
  expect(micro).toContain(`data-brand-vector-source="${VECTOR_SOURCE}"`);
  expect(micro).toContain('M16 12.3C13.5 12.2');
  expect(micro).toContain('M16 3.2C14.1 3.9');
  expect(micro).toContain('M16 5.9C14.6 6.1');
  expect((micro.match(/<path\b/g) || []).length).toBeGreaterThanOrEqual(30);

  for (const [asset, size] of [
    ['brand-emblem-master.webp', { width: 320, height: 320 }],
    ['favicon-16.png', { width: 16, height: 16 }],
    ['favicon-32.png', { width: 32, height: 32 }],
    ['apple-touch-icon.png', { width: 180, height: 180 }],
    ['icon-192.png', { width: 192, height: 192 }],
    ['icon-512.png', { width: 512, height: 512 }],
    ['icon-maskable-512.png', { width: 512, height: 512 }],
    ['mstile-150x150.png', { width: 150, height: 150 }],
    ['og-image.jpg', { width: 1200, height: 630 }],
  ]) {
    const url = `${BASE_URL}/${asset}?verify=${Date.now()}`;
    expect((await request.get(url)).status(), asset).toBe(200);
    expect(await imageSize(page, url), asset).toEqual(size);
  }

  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute('href', new RegExp(`brand-mark-micro\\.svg\\?v=${VERSION}$`));
  expect(await page.locator('link[rel="preload"][href*="brand-emblem-master.webp"]').count()).toBe(0);
  expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toBe(`https://thelegendarypoet.ru/og-image.jpg?v=${VERSION}`);
});

test('standalone and micro v9.0 marks decode at every optical size', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 320 });
  await page.setContent(`<style>html,body{margin:0;min-height:100%;background:#050810;color:#d9f8ff;font:12px system-ui}main{box-sizing:border-box;min-height:320px;display:flex;align-items:center;gap:22px;padding:28px}figure{margin:0;display:grid;justify-items:center;gap:9px}img{display:block;object-fit:contain}.tile{display:grid;place-items:center;width:204px;height:204px;background:#03070d;border:1px solid rgba(70,215,255,.12)}.small{width:102px;height:102px}</style><main><figure><div class="tile"><img data-optical="192" width="192" height="192" src="${BASE_URL}/brand-emblem.svg?v=${VERSION}"></div><figcaption>192 px</figcaption></figure><figure><div class="tile small"><img data-optical="96" width="96" height="96" src="${BASE_URL}/brand-emblem.svg?v=${VERSION}"></div><figcaption>96 px</figcaption></figure><figure><div class="tile small"><img data-optical="56" width="56" height="56" src="${BASE_URL}/brand-emblem.svg?v=${VERSION}"></div><figcaption>56 px</figcaption></figure><figure><div class="tile small"><img data-optical="44" width="44" height="44" src="${BASE_URL}/brand-emblem.svg?v=${VERSION}"></div><figcaption>44 px</figcaption></figure><figure><div class="tile small"><img data-optical="32" width="32" height="32" src="${BASE_URL}/brand-mark-micro.svg?v=${VERSION}"></div><figcaption>micro 32 px</figcaption></figure><figure><div class="tile small"><img data-optical="16" width="16" height="16" src="${BASE_URL}/brand-mark-micro.svg?v=${VERSION}"></div><figcaption>micro 16 px</figcaption></figure></main>`);

  const decodeResults = await page.locator('img').evaluateAll(async (images) => Promise.all(images.map(async (image) => {
    try {
      await image.decode();
      return { size: image.dataset.optical, src: image.currentSrc, ok: true, width: image.naturalWidth, height: image.naturalHeight };
    } catch (error) {
      return { size: image.dataset.optical, src: image.currentSrc, ok: false, error: String(error) };
    }
  })));
  expect(decodeResults.filter((result) => !result.ok), JSON.stringify(decodeResults, null, 2)).toEqual([]);

  for (const size of [192, 96, 56, 44, 32, 16]) {
    const image = page.locator(`img[data-optical="${size}"]`);
    await expect(image).toBeVisible();
    const box = await image.boundingBox();
    expect(Math.round(box?.width || 0)).toBe(size);
    expect(Math.round(box?.height || 0)).toBe(size);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-emblem-optical-size-matrix.png'), fullPage: true });
});

test('header renders the v9.0 reference-reset geometry and restrained hover', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: '[data-custom-cursor-dot], [data-custom-cursor-ring] { display: none !important; }' });

  const mark = page.locator('header [data-brand-mark]').first();
  await expect(mark).toBeVisible();
  await expect(mark).toHaveAttribute('data-brand-version', VERSION);
  await expect(mark).toHaveAttribute('data-brand-renderer', 'inline-vector');
  await expect(mark).toHaveAttribute('data-brand-vector-source', VECTOR_SOURCE);
  for (const hook of [
    'vector', 'figure', 'hood', 'cloak', 'face-void', 'rim-light', 'folds',
    'collar', 'energy', 'atmosphere', 'texture', 'seams', 'hood-layers',
  ]) await expect(mark.locator(`[data-brand-${hook}]`)).toBeAttached();
  expect(await mark.locator('image, rect, [data-brand-light-core], [data-brand-fallback], [data-brand-book], [data-brand-wing], [data-brand-halo]').count()).toBe(0);

  const box = await mark.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(46);
  expect(box?.width).toBeLessThanOrEqual(60);
  expect(box?.height).toBeGreaterThanOrEqual(46);
  expect(box?.height).toBeLessThanOrEqual(60);

  const geometry = await mark.evaluate((node) => {
    const bounds = (selector) => node.querySelector(selector)?.getBBox();
    const hood = bounds('[data-brand-hood]');
    const face = bounds('[data-brand-face-void]');
    const cloak = bounds('[data-brand-cloak]');
    if (!hood || !face || !cloak) return null;
    const visibleHeight = cloak.y + cloak.height - hood.y;
    return {
      hoodWidth: hood.width,
      hoodHeight: hood.height,
      faceWidth: face.width,
      faceHeight: face.height,
      cloakWidth: cloak.width,
      faceToHoodWidth: face.width / hood.width,
      cloakToHoodWidth: cloak.width / hood.width,
      hoodToVisibleHeight: hood.height / visibleHeight,
      hoodTop: hood.y,
      cloakBottom: cloak.y + cloak.height,
    };
  });
  expect(geometry).not.toBeNull();
  expect(geometry.hoodWidth).toBeGreaterThan(30);
  expect(geometry.hoodWidth).toBeLessThan(34);
  expect(geometry.faceWidth).toBeGreaterThan(24);
  expect(geometry.faceWidth).toBeLessThan(27);
  expect(geometry.cloakWidth).toBeGreaterThan(91);
  expect(geometry.cloakWidth).toBeLessThan(95);
  expect(geometry.faceToHoodWidth).toBeGreaterThan(0.72);
  expect(geometry.faceToHoodWidth).toBeLessThan(0.84);
  expect(geometry.cloakToHoodWidth).toBeGreaterThan(2.7);
  expect(geometry.cloakToHoodWidth).toBeLessThan(3.2);
  expect(geometry.hoodToVisibleHeight).toBeGreaterThan(0.34);
  expect(geometry.hoodToVisibleHeight).toBeLessThan(0.4);
  expect(geometry.hoodTop).toBeGreaterThan(9);
  expect(geometry.hoodTop).toBeLessThan(11);
  expect(geometry.cloakBottom).toBeGreaterThan(95);

  const renderOrder = await mark.evaluate((node) => {
    const figure = node.querySelector('[data-brand-figure]');
    const collar = node.querySelector('[data-brand-collar]');
    const hood = node.querySelector('[data-brand-hood]');
    return figure && collar && hood
      ? Array.from(figure.children).indexOf(collar) < Array.from(figure.children).indexOf(hood)
      : false;
  });
  expect(renderOrder).toBe(true);

  const readState = () => mark.evaluate((node) => {
    const read = (selector) => {
      const element = node.querySelector(selector);
      if (!element) return null;
      const style = getComputedStyle(element);
      return { opacity: Number(style.opacity), transform: style.transform, filter: style.filter };
    };
    return {
      vector: read('[data-brand-vector]'),
      rim: read('[data-brand-rim-light]'),
      atmosphere: read('[data-brand-atmosphere]'),
      seams: read('[data-brand-seams]'),
    };
  });

  const before = await readState();
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'brand-emblem-vector-idle.png'),
    clip: { x: Math.max(0, (box?.x || 0) - 28), y: Math.max(0, (box?.y || 0) - 28), width: (box?.width || 56) + 56, height: (box?.height || 56) + 56 },
  });
  await mark.hover();
  await page.waitForTimeout(700);
  const after = await readState();
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'brand-emblem-vector-hover.png'),
    clip: { x: Math.max(0, (box?.x || 0) - 28), y: Math.max(0, (box?.y || 0) - 28), width: (box?.width || 56) + 56, height: (box?.height || 56) + 56 },
  });

  expect(after.vector?.transform).not.toBe(before.vector?.transform);
  expect(after.vector?.filter).not.toBe(before.vector?.filter);
  expect(after.rim?.opacity).toBeGreaterThanOrEqual(before.rim?.opacity ?? 0);
  expect(after.atmosphere?.opacity).toBeGreaterThan(before.atmosphere?.opacity ?? 0);
  expect(after.seams?.opacity).toBeGreaterThan(before.seams?.opacity ?? 0);
  expect(pageErrors).toEqual([]);
});

for (const route of coreRoutes) {
  test(`${route}: header and footer use the v9.0 reference-reset vector emblem`, async ({ page }) => {
    const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);
    const marks = [page.locator('header [data-brand-mark]').first(), page.locator('footer [data-brand-mark]').first()];
    for (const mark of marks) {
      await expect(mark).toBeAttached();
      await expect(mark).toHaveAttribute('data-brand-version', VERSION);
      await expect(mark).toHaveAttribute('data-brand-vector-source', VECTOR_SOURCE);
      expect(await mark.locator('image, rect').count()).toBe(0);
    }
  });
}
