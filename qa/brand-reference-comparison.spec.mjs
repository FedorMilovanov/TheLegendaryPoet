import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const DIR = path.resolve('qa-artifacts');
const RELEASE = 'approved-single-reference-20260804-1';
fs.mkdirSync(DIR, { recursive: true });

const controlCss = `
*{box-sizing:border-box}html,body{margin:0;background:#03070d;color:#d9f8ff;font:14px system-ui}main{padding:26px}h1{margin:0 0 8px}.sub{color:#8ebcca;margin-bottom:20px;line-height:1.5}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.panel{background:#02050b;border:1px solid #18313a;padding:10px}.panel img{display:block;width:100%;height:auto}.panel b{display:block;padding:8px 4px;color:#9fefff}`;

async function expectSingle(mark) {
  await expect(mark).toHaveAttribute('data-brand-release', RELEASE);
  await expect(mark).toHaveAttribute('data-brand-renderer', 'single-approved-rgba-subtle-depth');
  await expect(mark).toHaveAttribute('data-brand-reference-source', 'single-user-selected-transparent-reference');
  await expect(mark).toHaveAttribute('data-brand-raster-variant', 'single');
  await expect(mark.locator('[data-brand-raster-base] img')).toHaveAttribute('src', /brand-emblem\.png/);
}

async function decodeAll(page) {
  const decoded = await page.locator('img').evaluateAll(async (nodes) => Promise.all(nodes.map(async (node) => {
    try { await node.decode(); return node.naturalWidth > 0 && node.naturalHeight > 0; } catch { return false; }
  })));
  expect(decoded.every(Boolean)).toBe(true);
}

test.describe('one approved source live-site review', () => {
  test.skip(({ isMobile }) => Boolean(isMobile), 'desktop control sheet is captured in the desktop project');

  test('desktop, footer and mobile all show the same exact emblem', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    expect((await page.goto(BASE_URL, { waitUntil: 'networkidle' }))?.status()).toBeLessThan(400);
    await page.addStyleTag({ content: '[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}' });

    const headerMark = page.locator('header [data-brand-mark]').first();
    await expectSingle(headerMark);
    const idle = await page.screenshot();
    const box = await headerMark.boundingBox();
    await page.mouse.move(box.x + box.width * 0.82, box.y + box.height * 0.22);
    await page.waitForTimeout(720);
    const hover = await page.screenshot();

    const footer = page.locator('footer').first();
    await footer.scrollIntoViewIfNeeded();
    const footerMark = footer.locator('[data-brand-mark]').first();
    await expectSingle(footerMark);
    expect(await footerMark.locator('[data-brand-raster-base] img').getAttribute('src')).toBe(await headerMark.locator('[data-brand-raster-base] img').getAttribute('src'));
    const footerShot = await footer.screenshot();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const mobileMark = page.locator('header [data-brand-mark]').first();
    await expectSingle(mobileMark);
    const mobile = await page.screenshot();

    await page.setViewportSize({ width: 1500, height: 1500 });
    await page.setContent(`<style>${controlCss}</style><main><h1>ONE APPROVED EMBLEM — REAL SITE CONTROL</h1><div class=sub>Every panel is an exact screenshot of the built site using the same user-selected transparent image.</div><div class=grid><div class=panel><b>DESKTOP HEADER — IDLE</b><img src="data:image/png;base64,${idle.toString('base64')}"></div><div class=panel><b>DESKTOP HEADER — HOVER</b><img src="data:image/png;base64,${hover.toString('base64')}"></div><div class=panel><b>FOOTER — SAME IMAGE</b><img src="data:image/png;base64,${footerShot.toString('base64')}"></div><div class=panel><b>MOBILE — SAME IMAGE</b><img src="data:image/png;base64,${mobile.toString('base64')}"></div></div></main>`);
    await decodeAll(page);
    await page.screenshot({ path: path.join(DIR, 'brand-live-site-control-sheet.png'), fullPage: true });
  });
});

test('runtime resolves every placement to one file', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  const sources = await page.locator('[data-brand-mark] [data-brand-raster-base] img').evaluateAll((nodes) => nodes.map((node) => new URL(node.src).pathname));
  expect(new Set(sources)).toEqual(new Set(['/brand-emblem.png']));
  expect(await page.locator('[data-brand-mark] svg').count()).toBe(0);
});

test.describe('loading and browser icon visual evidence', () => {
  test.skip(({ isMobile }) => Boolean(isMobile), 'desktop evidence is captured once');

  test('route loading shell uses the same emblem', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}' });

    let releaseChunk;
    const chunkGate = new Promise((resolve) => { releaseChunk = resolve; });
    let delayed = false;
    await page.route('**/assets/*.js', async (route) => {
      if (!delayed && /AboutPage/i.test(route.request().url())) {
        delayed = true;
        await chunkGate;
      }
      await route.continue();
    });

    await page.locator('a[href="/about"]').first().evaluate((node) => node.click());
    const shell = page.getByRole('status', { name: 'Загрузка страницы' });
    await expect(shell).toBeVisible({ timeout: 10_000 });
    const mark = shell.locator('[data-brand-mark]').first();
    await expectSingle(mark);
    await expect(mark.locator('[data-brand-raster-base] img')).toHaveAttribute('src', /brand-emblem\.png/);
    await page.screenshot({ path: path.join(DIR, 'brand-route-loading-shell.png'), fullPage: true });

    releaseChunk();
    await expect(page).toHaveURL(/\/about$/);
    await expect(shell).toBeHidden({ timeout: 10_000 });
  });

  test('favicon and platform icon files decode and are captured at actual browser sizes', async ({ page, request }) => {
    const assets = [
      ['favicon-16.png', 16],
      ['favicon-32.png', 32],
      ['apple-touch-icon.png', 180],
      ['icon-192.png', 192],
      ['icon-512.png', 512],
      ['icon-maskable-512.png', 512],
      ['mstile-150x150.png', 150],
    ];
    for (const [asset, expected] of assets) {
      const response = await request.get(`${BASE_URL}/${asset}?v=${RELEASE}`);
      expect(response.status(), asset).toBe(200);
      expect(response.headers()['content-type'], asset).toContain('image/png');
      expect(expected).toBeGreaterThan(0);
    }

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const iconHrefs = await page.locator('link[rel="icon"]').evaluateAll((nodes) => nodes.map((node) => new URL(node.href).pathname));
    expect(new Set(iconHrefs)).toEqual(new Set(['/favicon-16.png', '/favicon-32.png']));

    const cards = assets.map(([asset, size]) => `<article><b>${asset}</b><div class="preview"><img class="asset" src="${BASE_URL}/${asset}?v=${RELEASE}"></div><span>${size} × ${size}</span></article>`).join('');
    await page.setViewportSize({ width: 1500, height: 1180 });
    await page.setContent(`<style>
      *{box-sizing:border-box}html,body{margin:0;background:#03070d;color:#d9f8ff;font:16px system-ui}main{padding:34px}h1{margin:0 0 8px}.sub{color:#8ebcca;margin-bottom:24px}.tab{height:64px;display:flex;align-items:center;gap:12px;padding:0 22px;background:#f7f8fa;color:#20252a;border-radius:14px 14px 0 0;width:720px}.tab img{width:16px;height:16px;object-fit:contain}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:28px}article{border:1px solid #18313a;background:#06111c;padding:16px;border-radius:18px}article b{display:block;color:#9fefff;margin-bottom:12px}.preview{height:250px;display:flex;align-items:center;justify-content:center;background:#02050b}.asset{max-width:220px;max-height:220px;object-fit:contain}article span{display:block;color:#8ebcca;margin-top:10px}.actual{display:flex;align-items:center;gap:18px;margin-top:20px}.actual img{image-rendering:auto;object-fit:contain}.actual code{color:#9fefff}
    </style><main><h1>BROWSER + PLATFORM ICONS — BUILT SITE</h1><div class=sub>Every image below is loaded from the production preview generated from the same approved source.</div><div class=tab><img src="${BASE_URL}/favicon-16.png?v=${RELEASE}"><span>THE LEGENDARY POET | Поэзия, анализ, история</span></div><div class=actual><img src="${BASE_URL}/favicon-16.png?v=${RELEASE}" width=16 height=16><code>favicon 16 CSS px</code><img src="${BASE_URL}/favicon-32.png?v=${RELEASE}" width=32 height=32><code>favicon 32 px</code></div><div class=grid>${cards}</div></main>`);
    await decodeAll(page);
    await page.screenshot({ path: path.join(DIR, 'brand-browser-and-platform-icons.png'), fullPage: true });
  });
});
