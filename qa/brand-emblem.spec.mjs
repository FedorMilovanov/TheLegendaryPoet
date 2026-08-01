import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
const VERSION = 'cloak-20260801-21';
const SOURCE = 'square-closeup-reference-v18-2';
const routes = ['/', '/poets', '/ratings', '/articles', '/music', '/archive', '/about'];
const layers = ['atmosphere', 'energy', 'figure', 'hood-layers', 'face-depth', 'cowl', 'left-folds', 'right-folds', 'rim-light'];
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function layerState(mark) {
  return mark.evaluate((node, names) => Object.fromEntries(names.map((name) => {
    const layer = node.querySelector(`[data-brand-${name}]`);
    const style = getComputedStyle(layer);
    return [name, { transform: style.transform, opacity: style.opacity }];
  })), layers);
}

async function variables(mark) {
  return mark.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      rootY: style.getPropertyValue('--brand-root-y').trim(),
      rootScale: style.getPropertyValue('--brand-root-scale').trim(),
      farX: style.getPropertyValue('--brand-far-x').trim(),
      energyX: style.getPropertyValue('--brand-energy-x').trim(),
      hoodX: style.getPropertyValue('--brand-hood-x').trim(),
      faceX: style.getPropertyValue('--brand-face-x').trim(),
      auraOpacity: style.getPropertyValue('--brand-aura-opacity').trim(),
      energyOpacity: style.getPropertyValue('--brand-energy-opacity').trim(),
    };
  });
}

test('v18.2 surfaces are synchronized, semantic and raster-free', async ({ page, request }) => {
  expect((await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' }))?.status()).toBeLessThan(400);
  const assets = [
    ['brand-emblem.svg', '0 0 96 96'],
    ['brand-mark-micro.svg', '0 0 32 32'],
    ['brand-emblem-mask.svg', '0 0 96 96'],
  ];
  for (const [asset, viewBox] of assets) {
    const response = await request.get(`${BASE_URL}/${asset}?v=${Date.now()}`);
    const source = await response.text();
    expect(response.status(), asset).toBe(200);
    expect(source).toContain(`data-brand-vector-source="${SOURCE}"`);
    expect(source).toContain(`viewBox="${viewBox}"`);
    expect(source).toMatch(/<path\b/);
    expect(source).not.toMatch(/<(?:image|rect|foreignObject)\b|data:image|base64,/i);
    expect(source).not.toMatch(/<animate(?:Transform|Motion)?\b|@keyframes/i);
  }
  const full = await (await request.get(`${BASE_URL}/brand-emblem.svg?v=${VERSION}`)).text();
  for (const token of [
    'data-brand-cowl=""',
    'data-brand-left-folds=""',
    'data-brand-right-folds=""',
    'data-brand-central-folds=""',
    'data-brand-turbulence=""',
    'data-brand-displacement=""',
    'M48 6.8C43.5 8',
    'M48 17.2C43.2 17.9',
  ]) expect(full).toContain(token);
  expect(full.match(/<feTurbulence\b/g)?.length).toBe(1);
  expect(full.match(/<feDisplacementMap\b/g)?.length).toBe(1);
});

test('standalone and dedicated micro mark decode across every optical gate', async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 720 });
  const sizes = [256, 192, 128, 96, 64, 56, 44, 32, 24, 16];
  await page.setContent(`
    <style>
      html,body{margin:0;background:#03070d;color:#d9f8ff;font:12px system-ui}
      main{display:flex;align-items:end;gap:18px;padding:28px;min-height:460px}
      figure{margin:0;text-align:center}.tile{width:270px;height:300px;display:grid;place-items:center;background:#010306;border:1px solid #18313a}
      img{display:block}
    </style>
    <main>${sizes.map((size) => `<figure><div class="tile"><img data-size="${size}" width="${size}" height="${size}" src="${BASE_URL}/${size <= 32 ? 'brand-mark-micro.svg' : 'brand-emblem.svg'}?v=${VERSION}"></div><figcaption>${size}px</figcaption></figure>`).join('')}</main>
  `);
  const decoded = await page.locator('img').evaluateAll(async (nodes) => Promise.all(nodes.map(async (node) => {
    try { await node.decode(); return node.naturalWidth > 0; } catch { return false; }
  })));
  expect(decoded.every(Boolean)).toBe(true);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-emblem-optical-size-matrix.png'), fullPage: true });
});

test('live header uses v18.2 geometry and spring-depth awakening', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: '[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}' });
  const mark = page.locator('header [data-brand-mark]').first();
  await expect(mark).toBeVisible();
  await expect(mark).toHaveAttribute('data-brand-version', VERSION);
  await expect(mark).toHaveAttribute('data-brand-vector-source', SOURCE);
  await expect(mark).toHaveAttribute('data-brand-parallax', 'spring-depth-v2');
  for (const hook of [
    'vector', 'figure', 'hood', 'cloak', 'face-void', 'face-depth', 'rim-light', 'folds',
    'left-folds', 'right-folds', 'central-folds', 'epic-folds', 'cowl', 'collar',
    'atmosphere', 'energy', 'texture', 'seams', 'hood-layers', 'neck-shadow',
    'turbulence', 'displacement',
  ]) await expect(mark.locator(`[data-brand-${hook}]`)).toBeAttached();
  expect(await mark.locator('image,rect,line,polyline,foreignObject').count()).toBe(0);

  const geometry = await mark.evaluate((node) => {
    const box = (selector) => node.querySelector(selector).getBBox();
    const hood = box('[data-brand-hood]');
    const face = box('[data-brand-face-void]');
    const cloak = box('[data-brand-cloak]');
    const cowl = box('[data-brand-cowl]');
    const atmosphere = box('[data-brand-atmosphere]');
    return {
      hoodW: hood.width, hoodY: hood.y, faceW: face.width, faceH: face.height,
      faceRatio: face.width / hood.width, cloakW: cloak.width, cloakBottom: cloak.y + cloak.height,
      cowlW: cowl.width, auraBottom: atmosphere.y + atmosphere.height,
    };
  });
  expect(geometry.hoodW).toBeGreaterThan(34);
  expect(geometry.hoodW).toBeLessThan(37);
  expect(geometry.hoodY).toBeGreaterThan(6.2);
  expect(geometry.hoodY).toBeLessThan(7.4);
  expect(geometry.faceW).toBeGreaterThan(27);
  expect(geometry.faceW).toBeLessThan(30);
  expect(geometry.faceH).toBeGreaterThan(25);
  expect(geometry.faceRatio).toBeGreaterThan(.76);
  expect(geometry.faceRatio).toBeLessThan(.86);
  expect(geometry.cloakW).toBeGreaterThan(91);
  expect(geometry.cloakBottom).toBeGreaterThan(95.5);
  expect(geometry.cowlW).toBeGreaterThan(51);
  expect(geometry.auraBottom).toBeLessThan(69);

  const box = await mark.boundingBox();
  expect(box).not.toBeNull();
  const idle = await variables(mark);
  const idleLayers = await layerState(mark);
  const turbulence = mark.locator('[data-brand-turbulence]');
  const displacement = mark.locator('[data-brand-displacement]');
  const idleFrequency = await turbulence.getAttribute('baseFrequency');
  const idleScale = await displacement.getAttribute('scale');

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'brand-emblem-vector-idle.png'),
    clip: { x: Math.max(0, box.x - 32), y: Math.max(0, box.y - 32), width: box.width + 64, height: box.height + 64 },
  });
  await page.mouse.move(box.x + box.width * .84, box.y + box.height * .18);
  await page.waitForTimeout(700);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'active');
  const active = await variables(mark);
  const activeLayers = await layerState(mark);
  expect(active.rootY).not.toBe(idle.rootY);
  expect(active.rootScale).not.toBe(idle.rootScale);
  expect(active.farX).not.toBe(idle.farX);
  expect(active.energyX).not.toBe(idle.energyX);
  expect(active.hoodX).not.toBe(active.faceX);
  expect(active.auraOpacity).not.toBe(idle.auraOpacity);
  expect(activeLayers.atmosphere.transform).not.toBe(idleLayers.atmosphere.transform);
  expect(activeLayers.energy.transform).not.toBe(activeLayers.figure.transform);
  expect(activeLayers['left-folds'].transform).not.toBe(activeLayers['right-folds'].transform);
  expect(await turbulence.getAttribute('baseFrequency')).not.toBe(idleFrequency);
  expect(await displacement.getAttribute('scale')).not.toBe(idleScale);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'brand-emblem-spring-hover.png'),
    clip: { x: Math.max(0, box.x - 36), y: Math.max(0, box.y - 36), width: box.width + 72, height: box.height + 72 },
  });

  await page.mouse.move(Math.max(2, box.x - 90), Math.max(2, box.y - 90));
  await expect(mark).toHaveAttribute('data-brand-interaction', 'settling');
  await page.waitForTimeout(2200);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'idle');
  const settled = await variables(mark);
  expect(settled.rootY).toBe('0.000px');
  expect(settled.farX).toBe('0.000px');
  expect(settled.energyX).toBe('0.000px');
  expect(Number(settled.rootScale)).toBeCloseTo(1, 4);
  expect(errors).toEqual([]);
});

test('touch input does not awaken the pointer-depth system', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  const mark = page.locator('header [data-brand-mark]').first();
  await mark.dispatchEvent('pointerenter', { pointerType: 'touch', clientX: 20, clientY: 20 });
  await mark.dispatchEvent('pointermove', { pointerType: 'touch', clientX: 30, clientY: 10 });
  await page.waitForTimeout(180);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'idle');
  const state = await variables(mark);
  expect(state.rootY).toBe('0px');
});

test('reduced motion keeps geometry stationary and limits response to light', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  const mark = page.locator('header [data-brand-mark]').first();
  const box = await mark.boundingBox();
  const before = await layerState(mark);
  await page.mouse.move(box.x + box.width * .8, box.y + box.height * .2);
  await page.waitForTimeout(250);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'active');
  const after = await layerState(mark);
  for (const name of layers) expect(after[name].transform).toBe(before[name].transform);
  expect(Number(after.atmosphere.opacity)).toBeGreaterThan(Number(before.atmosphere.opacity));
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'brand-emblem-reduced-motion.png'),
    clip: { x: Math.max(0, box.x - 28), y: Math.max(0, box.y - 28), width: box.width + 56, height: box.height + 56 },
  });
  await page.mouse.move(Math.max(2, box.x - 80), Math.max(2, box.y - 80));
  await expect(mark).toHaveAttribute('data-brand-interaction', 'idle');
});

for (const route of routes) test(`${route}: header and footer use v18.2`, async ({ page }) => {
  expect((await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' }))?.status()).toBeLessThan(400);
  for (const mark of [page.locator('header [data-brand-mark]').first(), page.locator('footer [data-brand-mark]').first()]) {
    await expect(mark).toHaveAttribute('data-brand-vector-source', SOURCE);
    await expect(mark).toHaveAttribute('data-brand-parallax', 'spring-depth-v2');
    expect(await mark.locator('image,rect,line,polyline,foreignObject').count()).toBe(0);
  }
});
