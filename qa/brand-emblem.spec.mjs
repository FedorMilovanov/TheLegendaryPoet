import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
const RELEASE = 'approved-single-reference-20260804-1';
const SOURCE = 'single-user-selected-transparent-reference';
const routes = ['/', '/poets', '/ratings', '/articles', '/music', '/archive', '/about'];
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function expectSingleContract(mark) {
  await expect(mark).toHaveAttribute('data-spectral-brand', 'true');
  await expect(mark).toHaveAttribute('data-brand-release', RELEASE);
  await expect(mark).toHaveAttribute('data-brand-reference-source', SOURCE);
  await expect(mark).toHaveAttribute('data-brand-raster-variant', 'single');
  await expect(mark.locator('[data-brand-raster-base] img')).toHaveAttribute('src', /brand-emblem\.png/);
  await expect(mark.locator('[data-brand-raster-aura] img')).toHaveAttribute('src', /brand-emblem\.png/);
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
      rootScale: root.getPropertyValue('--brand-root-scale').trim(),
      auraX: root.getPropertyValue('--brand-aura-x').trim(),
      baseTransform: base.transform,
      auraTransform: aura.transform,
      auraOpacity: aura.opacity,
      auraFilter: auraImage.filter,
      stageBackground: stage.backgroundColor,
    };
  });
}

test('the one approved transparent emblem decodes', async ({ page, request }) => {
  const response = await request.get(`${BASE_URL}/brand-emblem.png?v=${RELEASE}`);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/png');
  await page.setContent(`<img src="${BASE_URL}/brand-emblem.png?v=${RELEASE}">`);
  expect(await page.locator('img').evaluate(async (node) => { try { await node.decode(); return node.naturalWidth > 0 && node.naturalHeight > 0; } catch { return false; } })).toBe(true);
});

test.describe('fine-pointer restrained interaction', () => {
  test.skip(({ isMobile }) => Boolean(isMobile), 'mouse hover is absent on touch projects');

  test('homepage header and footer use the same source', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    expect((await page.goto(BASE_URL, { waitUntil: 'networkidle' }))?.status()).toBeLessThan(400);
    await page.addStyleTag({ content: '[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}' });

    const headerMark = page.locator('header [data-brand-mark]').first();
    await expect(headerMark).toBeVisible();
    await expectSingleContract(headerMark);
    const idle = await state(headerMark);
    expect(idle.stageBackground).toBe('rgba(0, 0, 0, 0)');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-live-desktop-header-idle.png') });

    const box = await headerMark.boundingBox();
    await page.mouse.move(box.x + box.width * 0.82, box.y + box.height * 0.22);
    await page.waitForTimeout(720);
    await expect(headerMark).toHaveAttribute('data-brand-interaction', 'active');
    const active = await state(headerMark);
    expect(Number(active.rootScale)).toBeGreaterThan(1);
    expect(Number(active.rootScale)).toBeLessThanOrEqual(1.0041);
    expect(Math.abs(parseFloat(active.auraX))).toBeLessThan(0.75);
    expect(Number(active.auraOpacity)).toBeLessThanOrEqual(0.015);
    expect(active.auraTransform).not.toBe(active.baseTransform);
    expect(active.auraFilter).not.toMatch(/drop-shadow|blur\(/i);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-live-desktop-header-hover.png') });

    const footer = page.locator('footer').first();
    await footer.scrollIntoViewIfNeeded();
    const footerMark = footer.locator('[data-brand-mark]').first();
    await expectSingleContract(footerMark);
    const [headerSrc, footerSrc] = await Promise.all([
      headerMark.locator('[data-brand-raster-base] img').getAttribute('src'),
      footerMark.locator('[data-brand-raster-base] img').getAttribute('src'),
    ]);
    expect(footerSrc).toBe(headerSrc);
    await footer.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-live-footer-primary.png') });
  });
});

test('mobile uses the same approved source without pointer motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  expect((await page.goto(BASE_URL, { waitUntil: 'networkidle' }))?.status()).toBeLessThan(400);
  const mark = page.locator('header [data-brand-mark]').first();
  await expectSingleContract(mark);
  await mark.dispatchEvent('pointerenter', { pointerType: 'touch', clientX: 20, clientY: 20 });
  await mark.dispatchEvent('pointermove', { pointerType: 'touch', clientX: 30, clientY: 10 });
  await page.waitForTimeout(180);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'idle');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-live-mobile-first-viewport.png') });
});

for (const route of routes) {
  test(`${route}: header and footer use one exact raster`, async ({ page }) => {
    expect((await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' }))?.status()).toBeLessThan(400);
    const header = page.locator('header [data-brand-mark]').first();
    const footer = page.locator('footer [data-brand-mark]').first();
    await expectSingleContract(header);
    await expectSingleContract(footer);
    const headerSrc = await header.locator('[data-brand-raster-base] img').getAttribute('src');
    const footerSrc = await footer.locator('[data-brand-raster-base] img').getAttribute('src');
    expect(footerSrc).toBe(headerSrc);
  });
}
