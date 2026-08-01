import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const DIR = path.resolve('qa-artifacts');
const VERSION = 'cloak-20260801-21';
const SOURCE = 'square-closeup-reference-v18-2';
const reference = `data:image/webp;base64,${fs.readFileSync(path.resolve('qa/reference/brand-emblem-canonical-reference.webp')).toString('base64')}`;
fs.mkdirSync(DIR, { recursive: true });

const css = `
*{box-sizing:border-box}html,body{margin:0;background:#03070d;color:#d9f8ff;font:14px system-ui}
main{padding:28px}h1{margin:0 0 8px}.sub{color:#8ebcca;margin-bottom:22px;max-width:1100px;line-height:1.5}
.decision{color:#ffb27a;font-weight:800}.grid{display:grid;grid-template-columns:repeat(5,minmax(190px,1fr));gap:14px}
.col{display:grid;justify-items:center;gap:8px}.tile{width:204px;height:204px;display:grid;place-items:center;background:#010306;border:1px solid #18313a;overflow:hidden}
small{color:#8ebcca}.top{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.panel{min-height:330px;display:grid;place-items:center;background:#010306;border:1px solid #18313a;overflow:hidden;padding:18px}.panel img{max-width:100%;max-height:100%;object-fit:contain}
.live{margin-top:18px}.live .panel{min-height:280px;background:#050810}.states{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}.state{display:grid;gap:8px;text-align:center}.state img{width:100%;height:230px;object-fit:contain;background:#010306;border:1px solid #18313a}
`;

async function decodeAll(page) {
  const decoded = await page.locator('img').evaluateAll(async (nodes) => Promise.all(nodes.map(async (node) => {
    try { await node.decode(); return node.naturalWidth > 0; } catch { return false; }
  })));
  expect(decoded.every(Boolean)).toBe(true);
}

test('square canonical reference is rendered beside every v18.2 optical gate', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1800 });
  const sizes = [256, 192, 128, 96, 64, 56, 44, 32, 24, 16];
  const columns = sizes.map((size) => `
    <section class="col">
      <b>${size}px</b>
      <div class="tile"><img data-kind="ref" width="${size}" height="${size}" src="${reference}"></div>
      <small>PRIMARY SQUARE REFERENCE</small>
      <div class="tile"><img data-kind="candidate" width="${size}" height="${size}" src="${BASE_URL}/${size <= 32 ? 'brand-mark-micro.svg' : 'brand-emblem.svg'}?v=${VERSION}"></div>
      <small>CURRENT v18.2</small>
    </section>
  `).join('');
  await page.setContent(`<style>${css}</style><main>
    <h1>PRIMARY SQUARE REFERENCE / CURRENT v18.2</h1>
    <div class="sub">Judge only the square close-up bust: monumental pointed hood, huge pure-black face void, broad shoulders, gathered heavy cowl, three large fold families and electric-blue energy behind the head and upper body. The long full-body silhouette is excluded from geometry and approval. <span class="decision">NOT REFERENCE APPROVED</span></div>
    <div class="grid">${columns}</div>
  </main>`);
  await decodeAll(page);
  await page.screenshot({ path: path.join(DIR, 'brand-reference-comparison-matrix.png'), fullPage: true });
});

test('square reference is compared with standalone SVG and exact checked live header', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  expect((await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' }))?.status()).toBeLessThan(400);
  await page.addStyleTag({ content: '[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}' });
  const mark = page.locator('header [data-brand-mark]').first();
  await expect(mark).toHaveAttribute('data-brand-vector-source', SOURCE);
  await expect(mark).toHaveAttribute('data-brand-parallax', 'spring-depth-v2');
  await page.screenshot({ path: path.join(DIR, 'brand-live-site-home-first-viewport.png'), fullPage: false });

  const box = await mark.boundingBox();
  const idle = await page.screenshot({
    clip: { x: Math.max(0, box.x - 36), y: Math.max(0, box.y - 36), width: box.width + 72, height: box.height + 72 },
  });
  await page.mouse.move(box.x + box.width * .84, box.y + box.height * .18);
  await page.waitForTimeout(720);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'active');
  const hover = await page.screenshot({
    clip: { x: Math.max(0, box.x - 36), y: Math.max(0, box.y - 36), width: box.width + 72, height: box.height + 72 },
  });
  const idleUrl = `data:image/png;base64,${idle.toString('base64')}`;
  const hoverUrl = `data:image/png;base64,${hover.toString('base64')}`;

  await page.setViewportSize({ width: 1420, height: 980 });
  await page.setContent(`<style>${css}</style><main>
    <h1>REFERENCE / v18.2 SVG / EXACT CHECKED BUILD</h1>
    <div class="sub"><span class="decision">NOT REFERENCE APPROVED</span> — static integrity and interaction evidence do not replace owner visual approval.</div>
    <div class="top">
      <div class="panel"><img src="${reference}" width="310" height="310"></div>
      <div class="panel"><img src="${BASE_URL}/brand-emblem.svg?v=${VERSION}" width="310" height="310"></div>
      <div class="panel"><img src="${idleUrl}"></div>
    </div>
    <div class="live"><div class="panel"><img src="${hoverUrl}"></div></div>
  </main>`);
  await decodeAll(page);
  await page.screenshot({ path: path.join(DIR, 'brand-reference-live-site-comparison.png'), fullPage: true });
});

test('exact live interaction state matrix records directional depth and settled return', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: '[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}' });
  const mark = page.locator('header [data-brand-mark]').first();
  const box = await mark.boundingBox();
  const clip = { x: Math.max(0, box.x - 42), y: Math.max(0, box.y - 42), width: box.width + 84, height: box.height + 84 };
  const frames = [];
  const capture = async (label, x, y, wait = 640) => {
    await page.mouse.move(box.x + box.width * x, box.y + box.height * y);
    await page.waitForTimeout(wait);
    frames.push([label, (await page.screenshot({ clip })).toString('base64')]);
  };
  frames.push(['IDLE', (await page.screenshot({ clip })).toString('base64')]);
  await capture('TOP LEFT', .16, .16);
  await capture('TOP RIGHT', .84, .16);
  await capture('LOWER LEFT', .16, .82);
  await capture('LOWER RIGHT', .84, .82);
  await page.mouse.move(Math.max(2, box.x - 100), Math.max(2, box.y - 100));
  await page.waitForTimeout(2200);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'idle');
  frames.push(['SETTLED', (await page.screenshot({ clip })).toString('base64')]);

  await page.setViewportSize({ width: 1500, height: 620 });
  await page.setContent(`<style>${css}</style><main>
    <h1>v18.2 SPRING-DEPTH INTERACTION STATES</h1>
    <div class="sub">Directional frames must change depth without deforming the iconic silhouette. The final frame must return cleanly to idle.</div>
    <div class="states">${frames.map(([label, data]) => `<div class="state"><b>${label}</b><img src="data:image/png;base64,${data}"></div>`).join('')}</div>
  </main>`);
  await decodeAll(page);
  await page.screenshot({ path: path.join(DIR, 'brand-interaction-state-matrix.png'), fullPage: true });
});
