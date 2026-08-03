import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
const RELEASE = 'reference-raster-20260803-1';
const RASTER_VERSION = 'canonical-reference-20260803-1';
const RENDERER = 'reference-raster-subtle-depth';
const AWAKENING = 'reference-subtle-depth-v1';
const PARALLAX = 'subtle-reference-depth-v1';
const routes = ['/', '/poets', '/ratings', '/articles', '/music', '/archive', '/about'];
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function expectRasterContract(mark) {
  await expect(mark).toHaveAttribute('data-spectral-brand', 'true');
  await expect(mark).toHaveAttribute('data-brand-release', RELEASE);
  await expect(mark).toHaveAttribute('data-brand-raster-version', RASTER_VERSION);
  await expect(mark).toHaveAttribute('data-brand-renderer', RENDERER);
  await expect(mark).toHaveAttribute('data-brand-reference-source', 'canonical-hooded-figure-v2-clean-base');
  await expect(mark).toHaveAttribute('data-brand-parallax', PARALLAX);
  await expect(mark).toHaveAttribute('data-brand-awakening', AWAKENING);
  expect(await mark.locator('[data-brand-raster-base] img').count()).toBe(1);
  expect(await mark.locator('[data-brand-raster-aura] img').count()).toBe(1);
  expect(await mark.locator('svg').count()).toBe(0);
}

async function state(mark) {
  return mark.evaluate((node) => {
    const root = getComputedStyle(node);
    const base = getComputedStyle(node.querySelector('[data-brand-raster-base]'));
    const aura = getComputedStyle(node.querySelector('[data-brand-raster-aura]'));
    const auraImage = getComputedStyle(node.querySelector('[data-brand-raster-aura] img'));
    return {
      rootY: root.getPropertyValue('--brand-root-y').trim(),
      rootScale: root.getPropertyValue('--brand-root-scale').trim(),
      auraX: root.getPropertyValue('--brand-aura-x').trim(),
      auraScale: root.getPropertyValue('--brand-aura-scale').trim(),
      baseTransform: base.transform,
      auraTransform: aura.transform,
      auraOpacity: aura.opacity,
      auraFilter: auraImage.filter,
    };
  });
}

test('retired Shredder SVG endpoints are no longer served as SVG', async ({ request }) => {
  for (const asset of [
    'brand-emblem.svg',
    'brand-mark-micro.svg',
    'brand-emblem-mask.svg',
    'brand-emblem-v19-candidate.svg',
    'brand-emblem-v19-optical-candidate.svg',
    'brand-emblem-v19-micro-candidate.svg',
    'brand-emblem-v20-candidate.svg',
    'brand-emblem-v20-micro-candidate.svg',
  ]) {
    const response = await request.get(`${BASE_URL}/${asset}?v=${Date.now()}`);
    const contentType = response.headers()['content-type'] || '';
    const body = await response.text();
    expect(contentType, asset).not.toContain('image/svg+xml');
    expect(body.trimStart(), asset).not.toMatch(/^<svg\b/i);
  }
});

test('canonical raster family decodes at every optical gate', async ({ page, request }) => {
  for (const asset of ['brand-emblem-primary.png', 'brand-emblem-simplified.png', 'brand-emblem-micro.png', 'brand-emblem-header.png']) {
    const response = await request.get(`${BASE_URL}/${asset}?v=${RELEASE}`);
    expect(response.status(), asset).toBe(200);
    expect(response.headers()['content-type'], asset).toContain('image/png');
  }

  await page.setViewportSize({ width: 1500, height: 720 });
  const sizes = [256, 192, 128, 96, 64, 56, 48, 44, 32, 24, 16];
  const sourceFor = (size) => size <= 32 ? 'brand-emblem-micro.png' : size <= 64 ? 'brand-emblem-simplified.png' : 'brand-emblem-primary.png';
  await page.setContent(`<style>html,body{margin:0;background:#03070d;color:#d9f8ff;font:12px system-ui}main{display:flex;align-items:end;gap:14px;padding:24px;min-height:430px}figure{margin:0;text-align:center}.tile{width:120px;height:300px;display:grid;place-items:center;background:#02050b;border:1px solid #18313a}</style><main>${sizes.map((size) => `<figure><div class=tile><img width=${size} height=${size} src="${BASE_URL}/${sourceFor(size)}?v=${RELEASE}"></div>${size}px</figure>`).join('')}</main>`);
  const decoded = await page.locator('img').evaluateAll(async (nodes) => Promise.all(nodes.map(async (node) => {
    try { await node.decode(); return node.naturalWidth > 0; } catch { return false; }
  })));
  expect(decoded.every(Boolean)).toBe(true);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-reference-raster-optical-matrix.png'), fullPage: true });
});

test('pointer interaction remains subtle and returns exactly to idle', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  expect((await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' }))?.status()).toBeLessThan(400);
  await page.addStyleTag({ content: '[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}' });
  const mark = page.locator('footer [data-brand-mark]').first();
  await mark.scrollIntoViewIfNeeded();
  await expect(mark).toBeVisible();
  await expectRasterContract(mark);

  const box = await mark.boundingBox();
  const clip = { x: Math.max(0, box.x - 44), y: Math.max(0, box.y - 44), width: box.width + 88, height: box.height + 88 };
  const idle = await state(mark);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-reference-raster-idle.png'), clip });

  await page.mouse.move(box.x + box.width * 0.84, box.y + box.height * 0.18);
  await page.waitForTimeout(720);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'active');
  const active = await state(mark);

  expect(Number(active.rootScale)).toBeGreaterThan(1.004);
  expect(Number(active.rootScale)).toBeLessThanOrEqual(1.009);
  expect(Math.abs(parseFloat(active.rootY))).toBeLessThan(0.4);
  expect(Math.abs(parseFloat(active.auraX))).toBeGreaterThan(0.35);
  expect(Math.abs(parseFloat(active.auraX))).toBeLessThan(1.3);
  expect(Number(active.auraScale)).toBeLessThanOrEqual(1.007);
  expect(Number(active.auraOpacity)).toBeGreaterThanOrEqual(0.05);
  expect(Number(active.auraOpacity)).toBeLessThanOrEqual(0.08);
  expect(active.auraTransform).not.toBe(active.baseTransform);
  expect(active.auraFilter).not.toMatch(/drop-shadow|blur\(/i);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-reference-raster-hover.png'), clip });

  await page.mouse.move(Math.max(2, box.x - 100), Math.max(2, box.y - 100));
  await expect(mark).toHaveAttribute('data-brand-interaction', 'settling');
  await page.waitForTimeout(2200);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'idle');
  const settled = await state(mark);
  expect(settled.rootY).toBe('0.000px');
  expect(Number(settled.rootScale)).toBeCloseTo(1, 4);
  expect(settled.auraX).toBe('0.000px');
  expect(Number(settled.auraScale)).toBeCloseTo(1, 4);
  expect(idle.rootScale).toBe('1');
});

test('touch and reduced motion never move the reference mark', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  const mark = page.locator('header [data-brand-mark]').first();
  await expectRasterContract(mark);
  await mark.dispatchEvent('pointerenter', { pointerType: 'touch', clientX: 20, clientY: 20 });
  await mark.dispatchEvent('pointermove', { pointerType: 'touch', clientX: 30, clientY: 10 });
  await page.waitForTimeout(180);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'idle');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  const reduced = page.locator('header [data-brand-mark]').first();
  const before = await state(reduced);
  const box = await reduced.boundingBox();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.2);
  await page.waitForTimeout(220);
  const after = await state(reduced);
  expect(after.baseTransform).toBe(before.baseTransform);
  expect(after.auraTransform).toBe(before.auraTransform);
});

for (const route of routes) {
  test(`${route}: header and footer use only the canonical raster`, async ({ page }) => {
    expect((await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' }))?.status()).toBeLessThan(400);
    for (const mark of [page.locator('header [data-brand-mark]').first(), page.locator('footer [data-brand-mark]').first()]) {
      await expectRasterContract(mark);
      expect(await mark.locator('svg,image[data-brand-vector],foreignObject').count()).toBe(0);
    }
  });
}
