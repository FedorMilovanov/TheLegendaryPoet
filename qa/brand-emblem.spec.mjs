import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
const VERSION = 'cloak-20260728-11';
const VECTOR_SOURCE = 'canonical-reference-v2-reset-v11-2';
const routes = ['/', '/poets', '/ratings', '/articles', '/music', '/archive', '/about'];
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

test('v11.2 clean-base assets are coherent and raster-free', async ({ page, request }) => {
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  for (const asset of ['brand-emblem.svg', 'brand-mark-micro.svg', 'brand-emblem-mask.svg']) {
    const r = await request.get(`${BASE_URL}/${asset}?verify=${Date.now()}`);
    expect(r.status(), asset).toBe(200);
    const source = await r.text();
    expect(source).toContain(`data-brand-vector-source="${VECTOR_SOURCE}"`);
    expect(source).toMatch(/<path\b/);
    expect(source).toMatch(/<\/svg>\s*$/);
    expect(source).not.toMatch(/<image\b|data:image|base64,|<rect\b/i);
  }
  const standalone = await (await request.get(`${BASE_URL}/brand-emblem.svg`)).text();
  expect(standalone).toContain('M48 37C40.6 37');
  expect(standalone).toContain('M48 10.2C42.7 11.9');
  expect(standalone).toContain('M48 18C44.5 18.5');
  expect(standalone).not.toContain('M18 91C24 85');
  const micro = await (await request.get(`${BASE_URL}/brand-mark-micro.svg`)).text();
  expect(micro).toContain('M16 6L14.7 6.5');
});

test('standalone and micro marks decode at every optical size', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 320 });
  await page.setContent(`<style>html,body{margin:0;min-height:100%;background:#050810;color:#d9f8ff;font:12px system-ui}main{min-height:320px;display:flex;align-items:center;gap:22px;padding:28px}figure{margin:0;display:grid;justify-items:center;gap:9px}.tile{display:grid;place-items:center;width:204px;height:204px;background:#03070d;border:1px solid rgba(70,215,255,.12)}.small{width:102px;height:102px}img{display:block;object-fit:contain}</style><main>${[192,96,56,44].map(size=>`<figure><div class="tile ${size<192?'small':''}"><img data-optical="${size}" width="${size}" height="${size}" src="${BASE_URL}/brand-emblem.svg?v=${VERSION}"></div><figcaption>${size}px</figcaption></figure>`).join('')} ${[32,16].map(size=>`<figure><div class="tile small"><img data-optical="${size}" width="${size}" height="${size}" src="${BASE_URL}/brand-mark-micro.svg?v=${VERSION}"></div><figcaption>${size}px</figcaption></figure>`).join('')}</main>`);
  const results = await page.locator('img').evaluateAll(async images => Promise.all(images.map(async image => {
    try { await image.decode(); return { ok: true, size: image.dataset.optical }; }
    catch (error) { return { ok: false, error: String(error) }; }
  })));
  expect(results.filter(x => !x.ok), JSON.stringify(results)).toEqual([]);
  for (const size of [192,96,56,44,32,16]) {
    const box = await page.locator(`img[data-optical="${size}"]`).boundingBox();
    expect(Math.round(box?.width || 0)).toBe(size);
    expect(Math.round(box?.height || 0)).toBe(size);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-emblem-optical-size-matrix.png'), fullPage: true });
});

test('live header uses v11.2 geometry and hover remains compositor-only', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: '[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}' });
  const mark = page.locator('header [data-brand-mark]').first();
  await expect(mark).toBeVisible();
  await expect(mark).toHaveAttribute('data-brand-version', VERSION);
  await expect(mark).toHaveAttribute('data-brand-vector-source', VECTOR_SOURCE);
  for (const hook of ['vector','figure','hood','cloak','face-void','rim-light','folds','collar','energy','atmosphere','texture','seams','hood-layers']) {
    await expect(mark.locator(`[data-brand-${hook}]`)).toBeAttached();
  }
  expect(await mark.locator('image,rect').count()).toBe(0);
  const geometry = await mark.evaluate(node => {
    const b = selector => node.querySelector(selector)?.getBBox();
    const hood = b('[data-brand-hood]');
    const face = b('[data-brand-face-void]');
    const cloak = b('[data-brand-cloak]');
    return hood && face && cloak ? {
      hoodWidth: hood.width, faceWidth: face.width, cloakWidth: cloak.width,
      ratio: face.width / hood.width, hoodTop: hood.y, cloakBottom: cloak.y + cloak.height,
    } : null;
  });
  expect(geometry).not.toBeNull();
  expect(geometry.hoodWidth).toBeGreaterThan(29.5);
  expect(geometry.hoodWidth).toBeLessThan(31.5);
  expect(geometry.faceWidth).toBeGreaterThan(17.5);
  expect(geometry.faceWidth).toBeLessThan(19.5);
  expect(geometry.cloakWidth).toBeGreaterThan(84);
  expect(geometry.cloakWidth).toBeLessThan(87);
  expect(geometry.ratio).toBeGreaterThan(.58);
  expect(geometry.ratio).toBeLessThan(.66);
  expect(geometry.hoodTop).toBeGreaterThan(9.8);
  expect(geometry.hoodTop).toBeLessThan(10.6);
  expect(geometry.cloakBottom).toBeGreaterThan(95);
  const vector = mark.locator('[data-brand-vector]');
  const before = await vector.evaluate(node => ({ transform: getComputedStyle(node).transform, filter: getComputedStyle(node).filter }));
  const box = await mark.boundingBox();
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-emblem-vector-idle.png'), clip: { x: Math.max(0,(box?.x||0)-28), y: Math.max(0,(box?.y||0)-28), width:(box?.width||56)+56, height:(box?.height||56)+56 } });
  await mark.hover();
  await page.waitForTimeout(700);
  const after = await vector.evaluate(node => ({ transform: getComputedStyle(node).transform, filter: getComputedStyle(node).filter }));
  expect(after.transform).not.toBe(before.transform);
  expect(after.filter).not.toBe(before.filter);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-emblem-vector-hover.png'), clip: { x: Math.max(0,(box?.x||0)-28), y: Math.max(0,(box?.y||0)-28), width:(box?.width||56)+56, height:(box?.height||56)+56 } });
  expect(errors).toEqual([]);
});

for (const route of routes) test(`${route}: header and footer use v11.2`, async ({ page }) => {
  const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  for (const mark of [page.locator('header [data-brand-mark]').first(), page.locator('footer [data-brand-mark]').first()]) {
    await expect(mark).toBeAttached();
    await expect(mark).toHaveAttribute('data-brand-vector-source', VECTOR_SOURCE);
    expect(await mark.locator('image,rect').count()).toBe(0);
  }
});
