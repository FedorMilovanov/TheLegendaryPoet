import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const DIR = path.resolve('qa-artifacts');
const VERSION = 'cloak-20260801-22';
const SOURCE = 'canonical-reference-v2-black-monolith-v17-0';
const reference = `data:image/webp;base64,${fs.readFileSync(path.resolve('qa/reference/brand-emblem-canonical-reference.webp')).toString('base64')}`;
fs.mkdirSync(DIR, { recursive: true });

const css = `
*{box-sizing:border-box}html,body{margin:0;background:#03070d;color:#d9f8ff;font:14px system-ui}
main{padding:28px}h1{margin:0 0 8px}.sub{color:#8ebcca;margin-bottom:22px;max-width:1180px;line-height:1.5}
.decision{color:#ffb27a;font-weight:800}.safe{color:#8be7c5;font-weight:800}
.grid{display:grid;grid-template-columns:repeat(5,minmax(190px,1fr));gap:14px}.col{display:grid;justify-items:center;gap:8px}
.tile{width:204px;height:204px;display:grid;place-items:center;background:#010306;border:1px solid #18313a;overflow:hidden}small{color:#8ebcca}
.top{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.panel{min-height:310px;display:grid;place-items:center;background:#010306;border:1px solid #18313a;overflow:hidden;padding:16px}.panel img{max-width:100%;max-height:100%;object-fit:contain}
.states{display:grid;grid-template-columns:repeat(8,1fr);gap:12px}.state{display:grid;gap:7px;text-align:center}.state img{width:100%;height:205px;object-fit:contain;background:#010306;border:1px solid #18313a}
`;

async function decodeAll(page) {
  const ok = await page.locator('img').evaluateAll(async (nodes) => Promise.all(nodes.map(async (node) => {
    try { await node.decode(); return node.naturalWidth > 0; } catch { return false; }
  })));
  expect(ok.every(Boolean)).toBe(true);
}

async function waitForLiveHome(page) {
  const title = page.locator('.hero-title-lockup');
  await expect(title).toBeVisible({ timeout: 20_000 });
  await expect(title).toContainText('LEGENDARY');
  const windows = page.locator('[data-hero-poet-window]');
  await expect(windows).toHaveCount(6);
  await expect(windows.first()).toBeVisible();
  await page.waitForFunction(() => {
    const images = [...document.querySelectorAll('[data-hero-poet-window] img')];
    const shells = [...document.querySelectorAll('[data-hero-poet-window-shell]')];
    return images.length === 6
      && images.every((image) => image.complete && image.naturalWidth > 0)
      && shells.length === 6
      && shells.every((shell) => Number.parseFloat(getComputedStyle(shell).opacity) >= 0.99);
  }, null, { timeout: 20_000 });
}

async function captureMark(page, box, label, x, y, delay) {
  if (x !== null && y !== null) await page.mouse.move(box.x + box.width * x, box.y + box.height * y);
  if (delay) await page.waitForTimeout(delay);
  const clip = { x: Math.max(0, box.x - 48), y: Math.max(0, box.y - 48), width: box.width + 96, height: box.height + 96 };
  return [label, (await page.screenshot({ clip })).toString('base64')];
}

async function pixelDifference(page, a, b) {
  return page.evaluate(async ({ left, right }) => {
    const load = (src) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
    const [imageA, imageB] = await Promise.all([
      load(`data:image/png;base64,${left}`),
      load(`data:image/png;base64,${right}`),
    ]);
    const width = Math.min(imageA.naturalWidth, imageB.naturalWidth);
    const height = Math.min(imageA.naturalHeight, imageB.naturalHeight);
    const read = (image) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, width, height);
      return context.getImageData(0, 0, width, height).data;
    };
    const dataA = read(imageA);
    const dataB = read(imageB);
    let total = 0;
    let overFive = 0;
    const pixels = width * height;
    for (let index = 0; index < dataA.length; index += 4) {
      const difference = (
        Math.abs(dataA[index] - dataB[index])
        + Math.abs(dataA[index + 1] - dataB[index + 1])
        + Math.abs(dataA[index + 2] - dataB[index + 2])
      ) / 3;
      total += difference;
      if (difference > 5) overFive += 1;
    }
    return {
      meanPixelDifference: total / pixels,
      percentPixelsOverFive: (overFive / pixels) * 100,
      width,
      height,
    };
  }, { left: a, right: b });
}

test('square reference remains beside preserved art at every optical size', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1800 });
  const sizes = [256, 192, 128, 96, 64, 56, 44, 32, 24, 16];
  const columns = sizes.map((size) => `<section class=col><b>${size}px</b><div class=tile><img width=${size} height=${size} src="${reference}"></div><small>PRIMARY SQUARE REFERENCE</small><div class=tile><img width=${size} height=${size} src="${BASE_URL}/${size <= 32 ? 'brand-mark-micro.svg' : 'brand-emblem.svg'}?v=${VERSION}"></div><small>PRESERVED VISUAL BASELINE</small></section>`).join('');
  await page.setContent(`<style>${css}</style><main><h1>PRIMARY SQUARE REFERENCE / PRESERVED VISUAL BASELINE</h1><div class=sub><span class=safe>NO IDLE VISUAL REGRESSION:</span> v18.4 changes interaction only. Geometry remains <span class=decision>NOT REFERENCE APPROVED</span>.</div><div class=grid>${columns}</div></main>`);
  await decodeAll(page);
  await page.screenshot({ path: path.join(DIR, 'brand-reference-comparison-matrix.png'), fullPage: true });
});

test('reference, idle, entry phase and centered depth-first awakening are shown together', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  expect((await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' }))?.status()).toBeLessThan(400);
  await page.addStyleTag({ content: '[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}' });
  await waitForLiveHome(page);
  const mark = page.locator('header [data-brand-mark]').first();
  await expect(mark).toHaveAttribute('data-brand-vector-source', SOURCE);
  await expect(mark).toHaveAttribute('data-brand-parallax', 'spring-awakening-v4');
  await expect(mark).toHaveAttribute('data-brand-awakening', 'aura-depth-cloth-v2');
  await page.screenshot({ path: path.join(DIR, 'brand-live-site-home-first-viewport.png'), fullPage: false });
  const box = await mark.boundingBox();
  const clip = { x: Math.max(0, box.x - 44), y: Math.max(0, box.y - 44), width: box.width + 88, height: box.height + 88 };
  const idle = await page.screenshot({ clip });
  await page.mouse.move(box.x + box.width * 0.84, box.y + box.height * 0.18);
  await page.waitForTimeout(120);
  const entry = await page.screenshot({ clip });
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.waitForTimeout(680);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'active');
  const full = await page.screenshot({ clip });

  await page.setViewportSize({ width: 1500, height: 760 });
  await page.setContent(`<style>${css}</style><main><h1>REFERENCE / IDLE / ENTRY / CENTERED DEPTH-FIRST AWAKENING</h1><div class=sub><span class=decision>NOT REFERENCE APPROVED</span> — the root stays contained while aura, face depth, cloth and rim separate internally. FULL is sampled at the exact centre.</div><div class=top><div class=panel><img src="${reference}"></div><div class=panel><img src="data:image/png;base64,${idle.toString('base64')}"></div><div class=panel><img src="data:image/png;base64,${entry.toString('base64')}"></div><div class=panel><img src="data:image/png;base64,${full.toString('base64')}"></div></div></main>`);
  await decodeAll(page);
  await page.screenshot({ path: path.join(DIR, 'brand-reference-live-site-comparison.png'), fullPage: true });
});

test('v18.4 matrix enforces directional depth against centered full and exact return', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: '[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}' });
  await waitForLiveHome(page);
  const mark = page.locator('header [data-brand-mark]').first();
  const box = await mark.boundingBox();
  const frames = [];
  frames.push(await captureMark(page, box, 'IDLE', null, null, 0));
  frames.push(await captureMark(page, box, 'ENTRY 120MS', 0.84, 0.18, 120));
  frames.push(await captureMark(page, box, 'FULL CENTER', 0.5, 0.5, 680));
  for (const [label, x, y] of [
    ['TOP LEFT', 0.16, 0.16],
    ['TOP RIGHT', 0.84, 0.16],
    ['LOWER LEFT', 0.16, 0.82],
    ['LOWER RIGHT', 0.84, 0.82],
  ]) frames.push(await captureMark(page, box, label, x, y, 580));

  await page.mouse.move(Math.max(2, box.x - 100), Math.max(2, box.y - 100));
  await page.waitForTimeout(2500);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'idle');
  frames.push(await captureMark(page, box, 'SETTLED', null, null, 0));

  const fullCenter = frames[2][1];
  const metrics = {};
  for (const [label, data] of frames.slice(3, 7)) {
    const result = await pixelDifference(page, fullCenter, data);
    metrics[label] = result;
    expect(result.meanPixelDifference, `${label}: directional mean difference`).toBeGreaterThan(0.4);
    expect(result.percentPixelsOverFive, `${label}: changed pixel share`).toBeGreaterThan(3);
  }
  const returnMetrics = await pixelDifference(page, frames[0][1], frames[7][1]);
  expect(returnMetrics.meanPixelDifference, 'settled versus idle mean difference').toBeLessThan(0.8);
  expect(returnMetrics.percentPixelsOverFive, 'settled versus idle changed pixel share').toBeLessThan(2);
  fs.writeFileSync(path.join(DIR, 'brand-interaction-metrics.json'), JSON.stringify({
    baseline: 'FULL CENTER',
    directional: metrics,
    settledVersusIdle: returnMetrics,
    thresholds: {
      directionalMeanMinimum: 0.4,
      directionalPixelsOverFiveMinimumPercent: 3,
      settledMeanMaximum: 0.8,
      settledPixelsOverFiveMaximumPercent: 2,
    },
  }, null, 2));

  await page.setViewportSize({ width: 1780, height: 600 });
  await page.setContent(`<style>${css}</style><main><h1>v18.4 DEPTH-FIRST AWAKENING STATES</h1><div class=sub>Aura → counter-parallax depth → cloth and rim detail. Every corner is compared against FULL CENTER; the final state returns exactly to idle.</div><div class=states>${frames.map(([label, data]) => `<div class=state><b>${label}</b><img src="data:image/png;base64,${data}"></div>`).join('')}</div></main>`);
  await decodeAll(page);
  await page.screenshot({ path: path.join(DIR, 'brand-interaction-state-matrix.png'), fullPage: true });
});
