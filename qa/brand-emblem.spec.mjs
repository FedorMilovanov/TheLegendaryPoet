import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
const VERSION = 'cloak-20260729-16';
const VECTOR_SOURCE = 'canonical-reference-v2-textile-reset-v14-5';
const routes = ['/', '/poets', '/ratings', '/articles', '/music', '/archive', '/about'];
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

test('v14.5 vector surfaces are complete and raster-free', async ({ page, request }) => {
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  for (const asset of ['brand-emblem.svg', 'brand-mark-micro.svg', 'brand-emblem-mask.svg']) {
    const r = await request.get(`${BASE_URL}/${asset}?verify=${Date.now()}`);
    expect(r.status(), asset).toBe(200);
    const sourceText = await r.text();
    expect(sourceText).toContain(`data-brand-vector-source="${VECTOR_SOURCE}"`);
    expect(sourceText).toMatch(/<path\b/);
    expect(sourceText).toMatch(/<\/svg>\s*$/);
    expect(sourceText).not.toMatch(/<image\b|data:image|base64,|<rect\b/i);
  }
  const standalone = await (await request.get(`${BASE_URL}/brand-emblem.svg`)).text();
  expect(standalone).toContain('M48 32.2C41.9 32.1');
  expect(standalone).toContain('M48 8.2C44.2 9.2');
  expect(standalone).toContain('M47.7 14.6L43.4 16.8');
  const micro = await (await request.get(`${BASE_URL}/brand-mark-micro.svg`)).text();
  expect(micro).toContain('M16 10.7C14 10.7');
  expect(micro).toContain('M16 2.8C14.7 3.1');
  expect(micro).toContain('M15.9 4.9L14.5 5.6');
});

test('standalone and micro decode at every optical size', async ({ page }) => {
  await page.setViewportSize({ width: 980, height: 360 });
  const sizes = [192, 96, 56, 44, 32, 16];
  const tiles = sizes.map(size => {
    const src = size <= 32 ? `${BASE_URL}/brand-mark-micro.svg?v=${VERSION}` : `${BASE_URL}/brand-emblem.svg?v=${VERSION}`;
    return `<figure><div class="tile"><img data-optical="${size}" width="${size}" height="${size}" src="${src}"></div><figcaption>${size}px</figcaption></figure>`;
  }).join('');
  await page.setContent(`<style>html,body{margin:0;background:#050810;color:#d9f8ff;font:12px system-ui}main{min-height:360px;display:flex;align-items:center;gap:22px;padding:28px}figure{margin:0;display:grid;justify-items:center;gap:8px}.tile{width:204px;height:204px;display:grid;place-items:center;background:#02050b;border:1px solid rgba(70,215,255,.12)}img{display:block;object-fit:contain}</style><main>${tiles}</main>`);
  const results = await page.locator('img').evaluateAll(async images => Promise.all(images.map(async image => {
    try { await image.decode(); return { ok: true, size: image.dataset.optical, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight }; }
    catch (error) { return { ok: false, error: String(error) }; }
  })));
  expect(results.filter(item => !item.ok), JSON.stringify(results)).toEqual([]);
  for (const size of sizes) {
    const box = await page.locator(`img[data-optical="${size}"]`).boundingBox();
    expect(Math.round(box?.width || 0)).toBe(size);
    expect(Math.round(box?.height || 0)).toBe(size);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-emblem-optical-size-matrix.png'), fullPage: true });
});

test('live header uses v14.5 geometry and hover is compositor-only', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: '[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}' });
  const mark = page.locator('header [data-brand-mark]').first();
  await expect(mark).toBeVisible();
  await expect(mark).toHaveAttribute('data-brand-version', VERSION);
  await expect(mark).toHaveAttribute('data-brand-vector-source', VECTOR_SOURCE);
  for (const hook of ['vector','figure','hood','cloak','face-void','rim-light','folds','collar','atmosphere','energy','texture','seams','hood-layers','neck-shadow']) {
    await expect(mark.locator(`[data-brand-${hook}]`)).toBeAttached();
  }
  expect(await mark.locator('image,rect').count()).toBe(0);
  const geometry = await mark.evaluate(node => {
    const box = selector => node.querySelector(selector)?.getBBox();
    const hood = box('[data-brand-hood]');
    const face = box('[data-brand-face-void]');
    const cloak = box('[data-brand-cloak]');
    return hood && face && cloak ? {
      hoodWidth: hood.width,
      faceWidth: face.width,
      cloakWidth: cloak.width,
      ratio: face.width / hood.width,
      hoodTop: hood.y,
      cloakBottom: cloak.y + cloak.height,
    } : null;
  });
  expect(geometry).not.toBeNull();
  expect(geometry.hoodWidth).toBeGreaterThan(27);
  expect(geometry.hoodWidth).toBeLessThan(29);
  expect(geometry.faceWidth).toBeGreaterThan(16.5);
  expect(geometry.faceWidth).toBeLessThan(18.5);
  expect(geometry.cloakWidth).toBeGreaterThan(77);
  expect(geometry.cloakWidth).toBeLessThan(80);
  expect(geometry.ratio).toBeGreaterThan(.59);
  expect(geometry.ratio).toBeLessThan(.68);
  expect(geometry.hoodTop).toBeGreaterThan(7.9);
  expect(geometry.hoodTop).toBeLessThan(8.5);
  expect(geometry.cloakBottom).toBeGreaterThan(95.4);
  const vector = mark.locator('[data-brand-vector]');
  const before = await vector.evaluate(node => ({ transform: getComputedStyle(node).transform, filter: getComputedStyle(node).filter }));
  const box = await mark.boundingBox();
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-emblem-vector-idle.png'), clip: { x: Math.max(0, (box?.x || 0) - 28), y: Math.max(0, (box?.y || 0) - 28), width: (box?.width || 56) + 56, height: (box?.height || 56) + 56 } });
  await mark.hover();
  await page.waitForTimeout(700);
  const after = await vector.evaluate(node => ({ transform: getComputedStyle(node).transform, filter: getComputedStyle(node).filter }));
  expect(after.transform).not.toBe(before.transform);
  expect(after.filter).not.toBe(before.filter);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-emblem-vector-hover.png'), clip: { x: Math.max(0, (box?.x || 0) - 28), y: Math.max(0, (box?.y || 0) - 28), width: (box?.width || 56) + 56, height: (box?.height || 56) + 56 } });
  expect(errors).toEqual([]);
});

for (const route of routes) test(`${route}: header and footer use v14.5`, async ({ page }) => {
  const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  for (const mark of [page.locator('header [data-brand-mark]').first(), page.locator('footer [data-brand-mark]').first()]) {
    await expect(mark).toBeAttached();
    await expect(mark).toHaveAttribute('data-brand-vector-source', VECTOR_SOURCE);
    expect(await mark.locator('image,rect').count()).toBe(0);
  }
});
