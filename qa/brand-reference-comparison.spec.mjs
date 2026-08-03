import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const DIR = path.resolve('qa-artifacts');
const RELEASE = 'reference-raster-20260803-1';
const reference = `data:image/webp;base64,${fs.readFileSync(path.resolve('qa/reference/brand-emblem-canonical-reference.webp')).toString('base64')}`;
fs.mkdirSync(DIR, { recursive: true });

const css = `
*{box-sizing:border-box}html,body{margin:0;background:#03070d;color:#d9f8ff;font:14px system-ui}main{padding:28px}
h1{margin:0 0 8px}.sub{color:#8ebcca;margin-bottom:22px;max-width:1280px;line-height:1.5}.safe{color:#8be7c5;font-weight:800}
.grid{display:grid;grid-template-columns:repeat(5,minmax(210px,1fr));gap:14px}.col{display:grid;justify-items:center;gap:8px}.tile{width:214px;height:214px;display:grid;place-items:center;background:#02050b;border:1px solid #18313a;overflow:hidden}small{color:#8ebcca;text-align:center}
.top{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.panel{min-height:310px;display:grid;place-items:center;background:#02050b;border:1px solid #18313a;overflow:hidden;padding:16px}.panel img{max-width:100%;max-height:100%;object-fit:contain}`;

async function decodeAll(page) {
  const decoded = await page.locator('img').evaluateAll(async (nodes) => Promise.all(nodes.map(async (node) => {
    try { await node.decode(); return node.naturalWidth > 0; } catch { return false; }
  })));
  expect(decoded.every(Boolean)).toBe(true);
}

function markClip(box, padding = 52) {
  return { x: Math.max(0, box.x - padding), y: Math.max(0, box.y - padding), width: box.width + padding * 2, height: box.height + padding * 2 };
}

test('canonical reference and production raster stay together at every optical size', async ({ page }) => {
  await page.setViewportSize({ width: 1340, height: 2300 });
  const sizes = [256, 192, 128, 96, 64, 56, 48, 44, 32, 24];
  const sourceFor = (size) => size <= 32 ? 'brand-emblem-micro.png' : size <= 64 ? 'brand-emblem-simplified.png' : 'brand-emblem-primary.png';
  const columns = sizes.map((size) => `<section class=col><b>${size}px</b>
    <div class=tile><img width=${size} height=${size} src="${reference}"></div><small>CANONICAL REFERENCE</small>
    <div class=tile><img width=${size} height=${size} src="${BASE_URL}/${sourceFor(size)}?v=${RELEASE}"></div><small>PRODUCTION RASTER</small></section>`).join('');
  await page.setContent(`<style>${css}</style><main><h1>CANONICAL REFERENCE / PRODUCTION RASTER</h1><div class=sub><span class=safe>NO VECTOR SUBSTITUTE:</span> production is materialized from the exact canonical reference; old SVG candidates are absent.</div><div class=grid>${columns}</div></main>`);
  await decodeAll(page);
  await page.screenshot({ path: path.join(DIR, 'brand-reference-raster-comparison-matrix.png'), fullPage: true });
});

test.describe('fine-pointer live comparison', () => {
  test.skip(({ isMobile }) => Boolean(isMobile), 'touch projects have no mouse-hover state');

  test('reference, idle, faint hover and settled states are shown together', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    expect((await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' }))?.status()).toBeLessThan(400);
    await page.addStyleTag({ content: '[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}' });
    const mark = page.locator('footer [data-brand-mark]').first();
    await mark.scrollIntoViewIfNeeded();
    await expect(mark).toHaveAttribute('data-brand-release', RELEASE);
    await expect(mark).toHaveAttribute('data-brand-renderer', 'reference-raster-subtle-depth');
    const box = await mark.boundingBox();
    const clip = markClip(box);
    const idle = await page.screenshot({ clip });

    await page.mouse.move(box.x + box.width * 0.84, box.y + box.height * 0.18);
    await page.waitForTimeout(720);
    await expect(mark).toHaveAttribute('data-brand-interaction', 'active');
    const hover = await page.screenshot({ clip });

    await page.mouse.move(Math.max(2, box.x - 100), Math.max(2, box.y - 100));
    await page.waitForTimeout(2200);
    await expect(mark).toHaveAttribute('data-brand-interaction', 'idle');
    const settled = await page.screenshot({ clip });

    await page.setViewportSize({ width: 1500, height: 760 });
    await page.setContent(`<style>${css}</style><main><h1>REFERENCE / IDLE / FAINT HOVER / SETTLED</h1><div class=sub>The pointer state is limited to a very small depth cue. It does not add blur, bloom or a second electric halo.</div><div class=top><div class=panel><img src="${reference}"></div><div class=panel><img src="data:image/png;base64,${idle.toString('base64')}"></div><div class=panel><img src="data:image/png;base64,${hover.toString('base64')}"></div><div class=panel><img src="data:image/png;base64,${settled.toString('base64')}"></div></div></main>`);
    await decodeAll(page);
    await page.screenshot({ path: path.join(DIR, 'brand-reference-raster-live-comparison.png'), fullPage: true });
  });
});
