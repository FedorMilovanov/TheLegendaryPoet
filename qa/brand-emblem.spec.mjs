import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
const RELEASE = 'approved-rgba-20260803-1';
const RASTER_VERSION = 'approved-transparent-family-20260803-1';
const RENDERER = 'approved-rgba-family-subtle-depth';
const AWAKENING = 'approved-rgba-subtle-depth-v1';
const PARALLAX = 'subtle-rgba-depth-v1';
const SOURCE = 'generated-transparent-rgba-family';
const routes = ['/', '/poets', '/ratings', '/articles', '/music', '/archive', '/about'];
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function expectRasterContract(mark, expectedVariant) {
  await expect(mark).toHaveAttribute('data-spectral-brand', 'true');
  await expect(mark).toHaveAttribute('data-brand-release', RELEASE);
  await expect(mark).toHaveAttribute('data-brand-raster-version', RASTER_VERSION);
  await expect(mark).toHaveAttribute('data-brand-renderer', RENDERER);
  await expect(mark).toHaveAttribute('data-brand-reference-source', SOURCE);
  await expect(mark).toHaveAttribute('data-brand-parallax', PARALLAX);
  await expect(mark).toHaveAttribute('data-brand-awakening', AWAKENING);
  if (expectedVariant) await expect(mark).toHaveAttribute('data-brand-raster-variant', expectedVariant);
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
    const stage = getComputedStyle(node.querySelector('[data-brand-raster-stage]'));
    return {
      rootY: root.getPropertyValue('--brand-root-y').trim(),
      rootScale: root.getPropertyValue('--brand-root-scale').trim(),
      auraX: root.getPropertyValue('--brand-aura-x').trim(),
      auraScale: root.getPropertyValue('--brand-aura-scale').trim(),
      baseTransform: base.transform,
      auraTransform: aura.transform,
      auraOpacity: aura.opacity,
      auraFilter: auraImage.filter,
      stageBackground: stage.backgroundColor,
    };
  });
}

test('retired square reference and Shredder SVG endpoints are absent', async ({ request }) => {
  for (const asset of [
    'brand-emblem.svg',
    'brand-mark-micro.svg',
    'brand-emblem-mask.svg',
    'brand-emblem-v19-candidate.svg',
    'brand-emblem-v19-optical-candidate.svg',
    'brand-emblem-v19-micro-candidate.svg',
    'brand-emblem-v20-candidate.svg',
    'brand-emblem-v20-micro-candidate.svg',
    'brand-emblem-canonical-reference.webp',
  ]) {
    const response = await request.get(`${BASE_URL}/${asset}?v=${Date.now()}`);
    const contentType = response.headers()['content-type'] || '';
    const body = await response.text();
    expect(contentType, asset).not.toContain('image/svg+xml');
    expect(body.trimStart(), asset).not.toMatch(/^<svg\b/i);
  }
});

test('all four approved transparent role assets decode', async ({ page, request }) => {
  for (const asset of ['brand-emblem-header.png', 'brand-emblem-primary.png', 'brand-emblem-simplified.png', 'brand-emblem-micro.png']) {
    const response = await request.get(`${BASE_URL}/${asset}?v=${RELEASE}`);
    expect(response.status(), asset).toBe(200);
    expect(response.headers()['content-type'], asset).toContain('image/png');
  }

  await page.setContent(`<main>${['header','primary','simplified','micro'].map((role) => `<img data-role="${role}" src="${BASE_URL}/brand-emblem-${role}.png?v=${RELEASE}">`).join('')}</main>`);
  const decoded = await page.locator('img').evaluateAll(async (nodes) => Promise.all(nodes.map(async (node) => {
    try { await node.decode(); return node.naturalWidth > 0 && node.naturalHeight > 0; } catch { return false; }
  })));
  expect(decoded.every(Boolean)).toBe(true);
});

test.describe('fine-pointer approved RGBA interaction', () => {
  test.skip(({ isMobile }) => Boolean(isMobile), 'mouse hover is intentionally absent on touch projects');

  test('real homepage header hover stays restrained and returns exactly to idle', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    expect((await page.goto(BASE_URL, { waitUntil: 'networkidle' }))?.status()).toBeLessThan(400);
    await page.addStyleTag({ content: '[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}' });
    const headerMark = page.locator('header [data-brand-mark]').first();
    await expect(headerMark).toBeVisible();
    await expectRasterContract(headerMark, 'header');

    const idle = await state(headerMark);
    expect(idle.stageBackground).toBe('rgba(0, 0, 0, 0)');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-live-desktop-header-idle.png') });

    const box = await headerMark.boundingBox();
    await page.mouse.move(box.x + box.width * 0.82, box.y + box.height * 0.22);
    await page.waitForTimeout(720);
    await expect(headerMark).toHaveAttribute('data-brand-interaction', 'active');
    const active = await state(headerMark);

    expect(Number(active.rootScale)).toBeGreaterThan(1.002);
    expect(Number(active.rootScale)).toBeLessThanOrEqual(1.0041);
    expect(Math.abs(parseFloat(active.rootY))).toBeLessThan(0.25);
    expect(Math.abs(parseFloat(active.auraX))).toBeGreaterThan(0.12);
    expect(Math.abs(parseFloat(active.auraX))).toBeLessThan(0.75);
    expect(Number(active.auraScale)).toBeLessThanOrEqual(1.0031);
    expect(Number(active.auraOpacity)).toBeGreaterThanOrEqual(0.009);
    expect(Number(active.auraOpacity)).toBeLessThanOrEqual(0.011);
    expect(active.auraTransform).not.toBe(active.baseTransform);
    expect(active.auraFilter).not.toMatch(/drop-shadow|blur\(/i);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-live-desktop-header-hover.png') });

    await page.mouse.move(700, 500);
    await expect(headerMark).toHaveAttribute('data-brand-interaction', 'settling');
    await page.waitForTimeout(2200);
    await expect(headerMark).toHaveAttribute('data-brand-interaction', 'idle');
    const settled = await state(headerMark);
    expect(settled.rootY).toBe('0.000px');
    expect(Number(settled.rootScale)).toBeCloseTo(1, 4);
    expect(settled.auraX).toBe('0.000px');
    expect(Number(settled.auraScale)).toBeCloseTo(1, 4);
    expect(idle.rootScale).toBe('1');

    const footer = page.locator('footer').first();
    await footer.scrollIntoViewIfNeeded();
    const footerMark = footer.locator('[data-brand-mark]').first();
    await expectRasterContract(footerMark, 'primary');
    await expect(footerMark).toBeVisible();
    await footer.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-live-footer-primary.png') });
  });
});

test('real mobile first viewport uses the approved header source without pointer motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  expect((await page.goto(BASE_URL, { waitUntil: 'networkidle' }))?.status()).toBeLessThan(400);
  const mark = page.locator('header [data-brand-mark]').first();
  await expect(mark).toBeVisible();
  await expectRasterContract(mark, 'header');
  await mark.dispatchEvent('pointerenter', { pointerType: 'touch', clientX: 20, clientY: 20 });
  await mark.dispatchEvent('pointermove', { pointerType: 'touch', clientX: 30, clientY: 10 });
  await page.waitForTimeout(180);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'idle');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-live-mobile-first-viewport.png') });
});

test('reduced motion never moves the approved source family', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  const mark = page.locator('header [data-brand-mark]').first();
  await expectRasterContract(mark, 'header');
  const before = await state(mark);
  const box = await mark.boundingBox();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.2);
  await page.waitForTimeout(220);
  const after = await state(mark);
  expect(after.baseTransform).toBe(before.baseTransform);
  expect(after.auraTransform).toBe(before.auraTransform);
});

for (const route of routes) {
  test(`${route}: header and footer use the approved role-specific raster family`, async ({ page }) => {
    expect((await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' }))?.status()).toBeLessThan(400);
    const header = page.locator('header [data-brand-mark]').first();
    const footer = page.locator('footer [data-brand-mark]').first();
    await expectRasterContract(header, 'header');
    await expectRasterContract(footer, 'primary');
    expect(await header.locator('svg,image[data-brand-vector],foreignObject').count()).toBe(0);
    expect(await footer.locator('svg,image[data-brand-vector],foreignObject').count()).toBe(0);
  });
}
