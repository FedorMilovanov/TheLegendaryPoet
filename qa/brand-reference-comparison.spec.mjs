import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const DIR = path.resolve('qa-artifacts');
const VERSION = 'cloak-20260801-21';
const SOURCE = 'canonical-reference-v2-black-monolith-v17-0';
const reference = `data:image/webp;base64,${fs.readFileSync(path.resolve('qa/reference/brand-emblem-canonical-reference.webp')).toString('base64')}`;
fs.mkdirSync(DIR, { recursive: true });

const css = `
*{box-sizing:border-box}html,body{margin:0;background:#03070d;color:#d9f8ff;font:14px system-ui}
main{padding:28px}h1{margin:0 0 8px}.sub{color:#8ebcca;margin-bottom:22px;max-width:1180px;line-height:1.5}
.decision{color:#ffb27a;font-weight:800}.safe{color:#8be7c5;font-weight:800}.grid{display:grid;grid-template-columns:repeat(5,minmax(190px,1fr));gap:14px}
.col{display:grid;justify-items:center;gap:8px}.tile{width:204px;height:204px;display:grid;place-items:center;background:#010306;border:1px solid #18313a;overflow:hidden}
small{color:#8ebcca}.top{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.panel{min-height:330px;display:grid;place-items:center;background:#010306;border:1px solid #18313a;overflow:hidden;padding:18px}.panel img{max-width:100%;max-height:100%;object-fit:contain}
.live{margin-top:18px}.live .panel{min-height:280px;background:#050810}.states{display:grid;grid-template-columns:repeat(6,1fr);gap:14px}.state{display:grid;gap:8px;text-align:center}.state img{width:100%;height:220px;object-fit:contain;background:#010306;border:1px solid #18313a}
`;

async function decodeAll(page) {
  const decoded = await page.locator('img').evaluateAll(async (nodes) => Promise.all(nodes.map(async (node) => {
    try { await node.decode(); return node.naturalWidth > 0; } catch { return false; }
  })));
  expect(decoded.every(Boolean)).toBe(true);
}

test('square reference is compared against the preserved visual baseline at all optical gates', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1800 });
  const sizes = [256, 192, 128, 96, 64, 56, 44, 32, 24, 16];
  const columns = sizes.map((size) => `
    <section class="col">
      <b>${size}px</b>
      <div class="tile"><img width="${size}" height="${size}" src="${reference}"></div>
      <small>PRIMARY SQUARE REFERENCE</small>
      <div class="tile"><img width="${size}" height="${size}" src="${BASE_URL}/${size <= 32 ? 'brand-mark-micro.svg' : 'brand-emblem.svg'}?v=${VERSION}"></div>
      <small>PRESERVED VISUAL BASELINE</small>
    </section>
  `).join('');
  await page.setContent(`<style>${css}</style><main>
    <h1>PRIMARY SQUARE REFERENCE / PRESERVED VISUAL BASELINE</h1>
    <div class="sub"><span class="safe">NO VISUAL REGRESSION:</span> this stage changes interaction ownership only. Judge the square close-up reference against the unchanged v17 art. Geometry remains <span class="decision">NOT REFERENCE APPROVED</span> and will be replaced only by a demonstrably better candidate.</div>
    <div class="grid">${columns}</div>
  </main>`);
  await decodeAll(page);
  await page.screenshot({ path: path.join(DIR, 'brand-reference-comparison-matrix.png'), fullPage: true });
});

test('reference, standalone art and exact live spring states are shown together', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  expect((await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' }))?.status()).toBeLessThan(400);
  await page.addStyleTag({ content: '[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}' });
  const mark = page.locator('header [data-brand-mark]').first();
  await expect(mark).toHaveAttribute('data-brand-vector-source', SOURCE);
  await expect(mark).toHaveAttribute('data-brand-parallax', 'spring-depth-v2');
  await page.screenshot({ path: path.join(DIR, 'brand-live-site-home-first-viewport.png'), fullPage: false });

  const box = await mark.boundingBox();
  const clip = { x: Math.max(0, box.x - 36), y: Math.max(0, box.y - 36), width: box.width + 72, height: box.height + 72 };
  const idle = await page.screenshot({ clip });
  await page.mouse.move(box.x + box.width * .84, box.y + box.height * .18);
  await page.waitForTimeout(720);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'active');
  const hover = await page.screenshot({ clip });

  await page.setViewportSize({ width: 1420, height: 980 });
  await page.setContent(`<style>${css}</style><main>
    <h1>REFERENCE / PRESERVED SVG / v18 SPRING AWAKENING</h1>
    <div class="sub"><span class="decision">NOT REFERENCE APPROVED</span> — the art is intentionally unchanged in this foundation pass; only the interaction system is under test.</div>
    <div class="top">
      <div class="panel"><img src="${reference}" width="310" height="310"></div>
      <div class="panel"><img src="${BASE_URL}/brand-emblem.svg?v=${VERSION}" width="310" height="310"></div>
      <div class="panel"><img src="data:image/png;base64,${idle.toString('base64')}"></div>
    </div>
    <div class="live"><div class="panel"><img src="data:image/png;base64,${hover.toString('base64')}"></div></div>
  </main>`);
  await decodeAll(page);
  await page.screenshot({ path: path.join(DIR, 'brand-reference-live-site-comparison.png'), fullPage: true });
});

test('directional depth and settled return are recorded without changing the iconic silhouette', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: '[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}' });
  const mark = page.locator('header [data-brand-mark]').first();
  const box = await mark.boundingBox();
  const clip = { x: Math.max(0, box.x - 42), y: Math.max(0, box.y - 42), width: box.width + 84, height: box.height + 84 };
  const frames = [];
  frames.push(['IDLE', (await page.screenshot({ clip })).toString('base64')]);
  for (const [label, x, y] of [['TOP LEFT', .16, .16], ['TOP RIGHT', .84, .16], ['LOWER LEFT', .16, .82], ['LOWER RIGHT', .84, .82]]) {
    await page.mouse.move(box.x + box.width * x, box.y + box.height * y);
    await page.waitForTimeout(650);
    frames.push([label, (await page.screenshot({ clip })).toString('base64')]);
  }
  await page.mouse.move(Math.max(2, box.x - 100), Math.max(2, box.y - 100));
  await page.waitForTimeout(2200);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'idle');
  frames.push(['SETTLED', (await page.screenshot({ clip })).toString('base64')]);

  await page.setViewportSize({ width: 1560, height: 620 });
  await page.setContent(`<style>${css}</style><main>
    <h1>v18 SPRING-DEPTH INTERACTION STATES</h1>
    <div class="sub">The layers should gain depth and light, while the authored silhouette remains stable. The final frame must return cleanly to idle.</div>
    <div class="states">${frames.map(([label, data]) => `<div class="state"><b>${label}</b><img src="data:image/png;base64,${data}"></div>`).join('')}</div>
  </main>`);
  await decodeAll(page);
  await page.screenshot({ path: path.join(DIR, 'brand-interaction-state-matrix.png'), fullPage: true });
});
