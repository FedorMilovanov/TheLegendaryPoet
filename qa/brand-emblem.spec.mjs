import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
const VERSION = 'cloak-20260801-22';
const SOURCE = 'canonical-reference-v2-black-monolith-v17-0';
const routes = ['/', '/poets', '/ratings', '/articles', '/music', '/archive', '/about'];
const layers = ['atmosphere', 'energy', 'figure', 'folds', 'hood', 'hood-layers', 'face-void', 'face-depth', 'collar', 'rim-light', 'texture', 'seams'];
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function layerState(mark) {
  return mark.evaluate((node, names) => Object.fromEntries(names.map((name) => {
    const style = getComputedStyle(node.querySelector(`[data-brand-${name}]`));
    return [name, { transform: style.transform, opacity: style.opacity, filter: style.filter }];
  })), layers);
}

async function variables(mark) {
  return mark.evaluate((node) => {
    const style = getComputedStyle(node);
    const read = (name) => style.getPropertyValue(name).trim();
    return {
      rootY: read('--brand-root-y'),
      rootScale: read('--brand-root-scale'),
      farX: read('--brand-far-x'),
      farScale: read('--brand-far-scale'),
      energyX: read('--brand-energy-x'),
      energyScale: read('--brand-energy-scale'),
      foldsScaleX: read('--brand-folds-scale-x'),
      hoodX: read('--brand-hood-x'),
      hoodLayersScale: read('--brand-hood-layers-scale'),
      faceX: read('--brand-face-x'),
      faceScale: read('--brand-face-scale'),
      rimBrightness: read('--brand-rim-brightness'),
    };
  });
}

test('preserved v17 art is served under depth-first awakening v4', async ({ page, request }) => {
  expect((await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' }))?.status()).toBeLessThan(400);
  for (const asset of ['brand-emblem.svg', 'brand-mark-micro.svg', 'brand-emblem-mask.svg']) {
    const response = await request.get(`${BASE_URL}/${asset}?v=${Date.now()}`);
    const source = await response.text();
    expect(response.status(), asset).toBe(200);
    expect(source).toContain(`data-brand-vector-source="${SOURCE}"`);
    expect(source).toMatch(/<path\b/);
    expect(source).not.toMatch(/<(?:image|rect|foreignObject)\b|data:image|base64,/i);
  }
  const full = await (await request.get(`${BASE_URL}/brand-emblem.svg?v=${VERSION}`)).text();
  for (const token of ['M48 36.5C40.4 35.9', 'M47.4 7.6C43.9 8.8', 'M47.5 16.2C44.8 16.8', 'data-brand-throat=""']) {
    expect(full).toContain(token);
  }
});

test('standalone and micro marks decode at all optical gates', async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 720 });
  const sizes = [256, 192, 128, 96, 64, 56, 44, 32, 24, 16];
  await page.setContent(`<style>html,body{margin:0;background:#03070d;color:#d9f8ff;font:12px system-ui}main{display:flex;align-items:end;gap:18px;padding:28px;min-height:460px}figure{margin:0;text-align:center}.tile{width:270px;height:300px;display:grid;place-items:center;background:#010306;border:1px solid #18313a}</style><main>${sizes.map((size) => `<figure><div class=tile><img width=${size} height=${size} src="${BASE_URL}/${size <= 32 ? 'brand-mark-micro.svg' : 'brand-emblem.svg'}?v=${VERSION}"></div>${size}px</figure>`).join('')}</main>`);
  const decoded = await page.locator('img').evaluateAll(async (nodes) => Promise.all(nodes.map(async (node) => {
    try { await node.decode(); return node.naturalWidth > 0; } catch { return false; }
  })));
  expect(decoded.every(Boolean)).toBe(true);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-emblem-optical-size-matrix.png'), fullPage: true });
});

test('v18.4 keeps the root contained while internal layers separate strongly', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: '[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}' });
  const mark = page.locator('header [data-brand-mark]').first();
  await expect(mark).toBeVisible();
  await expect(mark).toHaveAttribute('data-brand-version', VERSION);
  await expect(mark).toHaveAttribute('data-brand-vector-source', SOURCE);
  await expect(mark).toHaveAttribute('data-brand-parallax', 'spring-awakening-v4');
  await expect(mark).toHaveAttribute('data-brand-awakening', 'aura-depth-cloth-v2');
  for (const hook of ['vector', 'figure', 'hood', 'cloak', 'face-void', 'face-depth', 'rim-light', 'folds', 'upper-folds', 'epic-folds', 'collar', 'throat', 'atmosphere', 'energy', 'texture', 'seams', 'hood-layers', 'neck-shadow']) {
    await expect(mark.locator(`[data-brand-${hook}]`)).toBeAttached();
  }

  const box = await mark.boundingBox();
  const idle = await variables(mark);
  const idleLayers = await layerState(mark);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'brand-emblem-vector-idle.png'),
    clip: { x: Math.max(0, box.x - 36), y: Math.max(0, box.y - 36), width: box.width + 72, height: box.height + 72 },
  });

  await page.mouse.move(box.x + box.width * 0.84, box.y + box.height * 0.18);
  await page.waitForTimeout(760);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'active');
  const active = await variables(mark);
  const activeLayers = await layerState(mark);

  expect(parseFloat(active.rootScale)).toBeGreaterThan(1.018);
  expect(parseFloat(active.rootScale)).toBeLessThan(1.028);
  expect(parseFloat(active.rootY)).toBeLessThan(-0.6);
  expect(parseFloat(active.rootY)).toBeGreaterThan(-1.0);
  expect(Math.abs(parseFloat(active.energyX))).toBeGreaterThan(2.2);
  expect(Math.abs(parseFloat(active.farX))).toBeGreaterThan(1.8);
  expect(parseFloat(active.farScale)).toBeGreaterThan(1.025);
  expect(parseFloat(active.energyScale)).toBeGreaterThan(1.012);
  expect(parseFloat(active.foldsScaleX)).toBeGreaterThan(1.006);
  expect(parseFloat(active.hoodLayersScale)).toBeGreaterThan(1.012);
  expect(parseFloat(active.faceScale)).toBeLessThan(0.985);
  expect(parseFloat(active.rimBrightness)).toBeGreaterThan(1.25);
  expect(active.hoodX).not.toBe(active.faceX);
  expect(activeLayers.atmosphere.transform).not.toBe(idleLayers.atmosphere.transform);
  expect(activeLayers.energy.transform).not.toBe(activeLayers.figure.transform);
  expect(activeLayers.hood.transform).not.toBe(activeLayers['hood-layers'].transform);
  expect(activeLayers['face-void'].transform).not.toBe(activeLayers['hood-layers'].transform);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'brand-emblem-depth-hover.png'),
    clip: { x: Math.max(0, box.x - 44), y: Math.max(0, box.y - 44), width: box.width + 88, height: box.height + 88 },
  });

  await page.mouse.move(box.x + box.width * 0.16, box.y + box.height * 0.82);
  await page.waitForTimeout(560);
  const opposite = await variables(mark);
  expect(Math.sign(parseFloat(opposite.energyX))).toBe(-Math.sign(parseFloat(active.energyX)));
  expect(Math.sign(parseFloat(opposite.farX))).toBe(-Math.sign(parseFloat(active.farX)));
  expect(Math.sign(parseFloat(opposite.faceX))).toBe(-Math.sign(parseFloat(active.faceX)));

  await page.mouse.move(Math.max(2, box.x - 90), Math.max(2, box.y - 90));
  await expect(mark).toHaveAttribute('data-brand-interaction', 'settling');
  await page.waitForTimeout(2500);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'idle');
  const settled = await variables(mark);
  expect(settled.rootY).toBe('0.000px');
  expect(settled.energyX).toBe('0.000px');
  expect(Number(settled.rootScale)).toBeCloseTo(1, 4);
  expect(Number(settled.faceScale)).toBeCloseTo(1, 4);
  expect(errors).toEqual([]);
  expect(idle.rootScale).toBe('1');
});

test('touch does not awaken pointer depth', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  const mark = page.locator('header [data-brand-mark]').first();
  await mark.dispatchEvent('pointerenter', { pointerType: 'touch', clientX: 20, clientY: 20 });
  await mark.dispatchEvent('pointermove', { pointerType: 'touch', clientX: 30, clientY: 10 });
  await page.waitForTimeout(180);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'idle');
});

test('reduced motion is stationary with light-only emphasis', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  const mark = page.locator('header [data-brand-mark]').first();
  const box = await mark.boundingBox();
  const before = await layerState(mark);
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.2);
  await page.waitForTimeout(250);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'active');
  const after = await layerState(mark);
  for (const name of layers) expect(after[name].transform).toBe(before[name].transform);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'brand-emblem-reduced-motion.png'),
    clip: { x: Math.max(0, box.x - 32), y: Math.max(0, box.y - 32), width: box.width + 64, height: box.height + 64 },
  });
  await page.mouse.move(Math.max(2, box.x - 80), Math.max(2, box.y - 80));
  await expect(mark).toHaveAttribute('data-brand-interaction', 'idle');
});

for (const route of routes) {
  test(`${route}: header and footer use depth-first awakening v4`, async ({ page }) => {
    expect((await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' }))?.status()).toBeLessThan(400);
    for (const mark of [page.locator('header [data-brand-mark]').first(), page.locator('footer [data-brand-mark]').first()]) {
      await expect(mark).toHaveAttribute('data-brand-vector-source', SOURCE);
      await expect(mark).toHaveAttribute('data-brand-parallax', 'spring-awakening-v4');
      await expect(mark).toHaveAttribute('data-brand-awakening', 'aura-depth-cloth-v2');
      expect(await mark.locator('image,rect,line,polyline,foreignObject').count()).toBe(0);
    }
  });
}
