import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
const VERSION = 'cloak-20260729-19';
const VECTOR_SOURCE = 'canonical-reference-v2-tapered-aura-cowl-v16-1';
const routes = ['/', '/poets', '/ratings', '/articles', '/music', '/archive', '/about'];
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
const layerSelectors = ['atmosphere','energy','figure','folds','hood','hood-layers','face-void','face-depth','collar','rim-light','texture','seams'];
async function layerState(mark) {
return mark.evaluate((node, selectors) => Object.fromEntries(selectors.map(name => {
const layer = node.querySelector(`[data-brand-${name}]`);
return [name, layer ? getComputedStyle(layer).transform : null];
})), layerSelectors);
}
test('v16.1 vector surfaces are complete, layered and raster-free', async ({ page, request }) => {
const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
expect(response?.status()).toBeLessThan(400);
for (const asset of ['brand-emblem.svg', 'brand-mark-micro.svg', 'brand-emblem-mask.svg']) {
const result = await request.get(`${BASE_URL}/${asset}?verify=${Date.now()}`);
expect(result.status(), asset).toBe(200);
const sourceText = await result.text();
expect(sourceText).toContain(`data-brand-vector-source="${VECTOR_SOURCE}"`);
expect(sourceText).toMatch(/<path\b/);
expect(sourceText).toMatch(/<\/svg>\s*$/);
expect(sourceText).not.toMatch(/<image\b|data:image|base64,|<rect\b/i);
}
const standalone = await (await request.get(`${BASE_URL}/brand-emblem.svg`)).text();
expect(standalone).toContain('M48 37.2C40.3 36.6');
expect(standalone).toContain('M47.8 7.8C43.4 8.8');
expect(standalone).toContain('M47.7 14.5C44.8 15.4');
expect(standalone).toContain('data-brand-throat=""');
expect(standalone).toContain('@media (hover:hover) and (pointer:fine)');
expect(standalone).toContain('@media (prefers-reduced-motion:reduce)');
const micro = await (await request.get(`${BASE_URL}/brand-mark-micro.svg`)).text();
expect(micro).toContain('M16 12.2C13.3 11.9');
expect(micro).toContain('M15.9 2.3C14.4 2.7');
expect(micro).toContain('M15.9 4.6C14.9 4.9');
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
try {
await image.decode();
return { ok: true, size: image.dataset.optical, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight };
} catch (error) {
return { ok: false, error: String(error) };
}
})));
expect(results.filter(item => !item.ok), JSON.stringify(results)).toEqual([]);
for (const size of sizes) {
const box = await page.locator(`img[data-optical="${size}"]`).boundingBox();
expect(Math.round(box?.width || 0)).toBe(size);
expect(Math.round(box?.height || 0)).toBe(size);
}
await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-emblem-optical-size-matrix.png'), fullPage: true });
});
test('live header uses v16.1 throat geometry, tapered aura and independently damped pointer depth', async ({ page }) => {
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
await page.addStyleTag({ content: '[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}' });
const mark = page.locator('header [data-brand-mark]').first();
await expect(mark).toBeVisible();
await expect(mark).toHaveAttribute('data-brand-version', VERSION);
await expect(mark).toHaveAttribute('data-brand-vector-source', VECTOR_SOURCE);
await expect(mark).toHaveAttribute('data-brand-parallax', 'layered-v1');
for (const hook of [
'vector','figure','hood','cloak','face-void','face-depth','rim-light','folds',
'collar','throat','atmosphere','energy','texture','seams','hood-layers','neck-shadow'
])await expect(mark.locator(`[data-brand-${hook}]`)).toBeAttached();
expect(await mark.locator('image,rect').count()).toBe(0);
const geometry = await mark.evaluate(node => {
const box = selector => node.querySelector(selector)?.getBBox();
const hood = box('[data-brand-hood]');
const face = box('[data-brand-face-void]');
const cloak = box('[data-brand-cloak]');
const throat = box('[data-brand-throat]');
const aura = box('[data-brand-atmosphere]');
return hood && face && cloak && throat && aura ? {
hoodWidth: hood.width,
faceWidth: face.width,
cloakWidth: cloak.width,
throatWidth: throat.width,
faceToHood: face.width / hood.width,
throatToCloak: throat.width / cloak.width,
hoodTop: hood.y,
throatTop: throat.y,
throatBottom: throat.y + throat.height,
cloakBottom: cloak.y + cloak.height,
auraWidth: aura.width,
auraBottom: aura.y + aura.height,
} : null;
});
expect(geometry).not.toBeNull();
expect(geometry.hoodWidth).toBeGreaterThan(27.5);
expect(geometry.hoodWidth).toBeLessThan(28);
expect(geometry.faceWidth).toBeGreaterThan(15.5);
expect(geometry.faceWidth).toBeLessThan(16);
expect(geometry.cloakWidth).toBeGreaterThan(79.5);
expect(geometry.cloakWidth).toBeLessThan(81);
expect(geometry.throatWidth).toBeGreaterThan(8.5);
expect(geometry.throatWidth).toBeLessThan(9);
expect(geometry.faceToHood).toBeGreaterThan(.55);
expect(geometry.faceToHood).toBeLessThan(.59);
expect(geometry.throatToCloak).toBeLessThan(.12);
expect(geometry.hoodTop).toBeGreaterThan(7.6);
expect(geometry.hoodTop).toBeLessThan(8);
expect(geometry.throatTop).toBeGreaterThan(35.8);
expect(geometry.throatTop).toBeLessThan(36.3);
expect(geometry.throatBottom).toBeGreaterThan(44.8);
expect(geometry.throatBottom).toBeLessThan(45.4);
expect(geometry.cloakBottom).toBeGreaterThan(95.7);
expect(geometry.auraWidth).toBeGreaterThan(65);
expect(geometry.auraWidth).toBeLessThan(68);
expect(geometry.auraBottom).toBeLessThan(56.2);
const vector = mark.locator('[data-brand-vector]');
const beforeVector = await vector.evaluate(node => ({
transform: getComputedStyle(node).transform,
filter: getComputedStyle(node).filter,
}));
const box = await mark.boundingBox();
expect(box).not.toBeNull();
await page.screenshot({
path: path.join(ARTIFACT_DIR, 'brand-emblem-vector-idle.png'),
clip: { x: Math.max(0, box.x - 28), y: Math.max(0, box.y - 28), width: box.width + 56, height: box.height + 56 },
});
await page.mouse.move(box.x + box.width * .84, box.y + box.height * .18);
await page.waitForTimeout(320);
await expect(mark).toHaveAttribute('data-brand-interaction', 'active');
const active = await layerState(mark);
const activeTransforms = Object.values(active).filter(value => value && value !== 'none');
expect(activeTransforms.length).toBeGreaterThanOrEqual(10);
expect(new Set(activeTransforms).size).toBeGreaterThanOrEqual(7);
expect(active.atmosphere).not.toBe(active.energy);
expect(active.hood).not.toBe(active['hood-layers']);
expect(active['face-void']).not.toBe(active['rim-light']);
const afterVector = await vector.evaluate(node => ({
transform: getComputedStyle(node).transform,
filter: getComputedStyle(node).filter,
}));
expect(afterVector.transform).not.toBe(beforeVector.transform);
expect(afterVector.filter).not.toBe(beforeVector.filter);
const afterBox = await mark.boundingBox();
expect(Math.abs(afterBox.width - box.width)).toBeLessThan(.5);
expect(Math.abs(afterBox.height - box.height)).toBeLessThan(.5);
await page.screenshot({
path: path.join(ARTIFACT_DIR, 'brand-emblem-layered-hover.png'),
clip: { x: Math.max(0, box.x - 32), y: Math.max(0, box.y - 32), width: box.width + 64, height: box.height + 64 },
});
await page.mouse.move(Math.max(2, box.x - 80), Math.max(2, box.y - 80));
await page.waitForTimeout(820);
await expect(mark).toHaveAttribute('data-brand-interaction', 'idle');
const reset = await layerState(mark);
for (const transform of Object.values(reset)) expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(transform);
expect(errors).toEqual([]);
});
test('reduced motion keeps all SVG depth layers stationary', async ({ page }) => {
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
const mark = page.locator('header [data-brand-mark]').first();
await expect(mark).toBeVisible();
const box = await mark.boundingBox();
await page.mouse.move(box.x + box.width * .8, box.y + box.height * .2);
await page.waitForTimeout(250);
await expect(mark).toHaveAttribute('data-brand-interaction', 'idle');
const state = await layerState(mark);
for (const transform of Object.values(state)) expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(transform);
await page.screenshot({
path: path.join(ARTIFACT_DIR, 'brand-emblem-reduced-motion.png'),
clip: { x: Math.max(0, box.x - 28), y: Math.max(0, box.y - 28), width: box.width + 56, height: box.height + 56 },
});
});
for (const route of routes) test(`${route}: header and footer use v16.1`, async ({ page }) => {
const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
expect(response?.status()).toBeLessThan(400);
for (const mark of [
page.locator('header [data-brand-mark]').first(),
page.locator('footer [data-brand-mark]').first(),
]) {
await expect(mark).toBeAttached();
await expect(mark).toHaveAttribute('data-brand-vector-source', VECTOR_SOURCE);
await expect(mark).toHaveAttribute('data-brand-parallax', 'layered-v1');
expect(await mark.locator('image,rect').count()).toBe(0);
}
});
