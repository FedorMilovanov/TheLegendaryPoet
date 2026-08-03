import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const DIR = path.resolve('qa-artifacts');
const RELEASE = 'approved-rgba-20260803-1';
fs.mkdirSync(DIR, { recursive: true });

const controlCss = `
*{box-sizing:border-box}html,body{margin:0;background:#03070d;color:#d9f8ff;font:14px system-ui}main{padding:26px}h1{margin:0 0 8px}.sub{color:#8ebcca;margin-bottom:20px;line-height:1.5}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.panel{background:#02050b;border:1px solid #18313a;padding:10px}.panel img{display:block;width:100%;height:auto}.panel b{display:block;padding:8px 4px;color:#9fefff}`;

async function decodeAll(page) {
  const decoded = await page.locator('img').evaluateAll(async (nodes) => Promise.all(nodes.map(async (node) => {
    try { await node.decode(); return node.naturalWidth > 0 && node.naturalHeight > 0; } catch { return false; }
  })));
  expect(decoded.every(Boolean)).toBe(true);
}

test.describe('real-site approved source review', () => {
  test.skip(({ isMobile }) => Boolean(isMobile), 'desktop control sheet is captured in the desktop project');

  test('desktop idle, restrained hover, footer and mobile viewport are captured from the built site', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    expect((await page.goto(BASE_URL, { waitUntil: 'networkidle' }))?.status()).toBeLessThan(400);
    await page.addStyleTag({ content: '[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}' });

    const headerMark = page.locator('header [data-brand-mark]').first();
    await expect(headerMark).toHaveAttribute('data-brand-release', RELEASE);
    await expect(headerMark).toHaveAttribute('data-brand-renderer', 'approved-rgba-family-subtle-depth');
    await expect(headerMark).toHaveAttribute('data-brand-reference-source', 'generated-transparent-rgba-family');
    await expect(headerMark).toHaveAttribute('data-brand-raster-variant', 'header');
    await expect(headerMark.locator('[data-brand-raster-base] img')).toHaveAttribute('src', /brand-emblem-header\.png/);

    const idle = await page.screenshot();
    const box = await headerMark.boundingBox();
    await page.mouse.move(box.x + box.width * 0.82, box.y + box.height * 0.22);
    await page.waitForTimeout(720);
    await expect(headerMark).toHaveAttribute('data-brand-interaction', 'active');
    const hover = await page.screenshot();

    await page.mouse.move(700, 500);
    await page.waitForTimeout(2200);
    await expect(headerMark).toHaveAttribute('data-brand-interaction', 'idle');

    const footer = page.locator('footer').first();
    await footer.scrollIntoViewIfNeeded();
    const footerMark = footer.locator('[data-brand-mark]').first();
    await expect(footerMark).toHaveAttribute('data-brand-raster-variant', 'primary');
    await expect(footerMark.locator('[data-brand-raster-base] img')).toHaveAttribute('src', /brand-emblem-primary\.png/);
    const footerShot = await footer.screenshot();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const mobileMark = page.locator('header [data-brand-mark]').first();
    await expect(mobileMark).toHaveAttribute('data-brand-raster-variant', 'header');
    const mobile = await page.screenshot();

    await page.setViewportSize({ width: 1500, height: 1500 });
    await page.setContent(`<style>${controlCss}</style><main><h1>APPROVED RGBA FAMILY — REAL SITE CONTROL</h1><div class=sub>Every panel below is an exact screenshot of the built website. No isolated logo render and no substituted square reference.</div><div class=grid><div class=panel><b>DESKTOP HEADER — IDLE</b><img src="data:image/png;base64,${idle.toString('base64')}"></div><div class=panel><b>DESKTOP HEADER — HOVER</b><img src="data:image/png;base64,${hover.toString('base64')}"></div><div class=panel><b>FOOTER — PRIMARY</b><img src="data:image/png;base64,${footerShot.toString('base64')}"></div><div class=panel><b>MOBILE FIRST VIEWPORT</b><img src="data:image/png;base64,${mobile.toString('base64')}"></div></div></main>`);
    await decodeAll(page);
    await page.screenshot({ path: path.join(DIR, 'brand-live-site-control-sheet.png'), fullPage: true });
  });
});

test('runtime sources map exactly to their approved roles', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  const header = page.locator('header [data-brand-mark]').first();
  const footer = page.locator('footer [data-brand-mark]').first();
  await expect(header).toHaveAttribute('data-brand-raster-variant', 'header');
  await expect(footer).toHaveAttribute('data-brand-raster-variant', 'primary');
  await expect(header.locator('[data-brand-raster-base] img')).toHaveAttribute('src', /brand-emblem-header\.png/);
  await expect(footer.locator('[data-brand-raster-base] img')).toHaveAttribute('src', /brand-emblem-primary\.png/);
  expect(await page.locator('[data-brand-mark] svg').count()).toBe(0);
});
