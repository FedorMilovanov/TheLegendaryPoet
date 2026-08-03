import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const DIR = path.resolve('qa-artifacts');
const VERSION = 'cloak-20260801-22';
const SOURCE = 'canonical-reference-v2-black-monolith-v17-0';
const ledger = JSON.parse(fs.readFileSync(path.resolve('qa/brand-marathon-pass-ledger.json'), 'utf8'));
const CANDIDATE = ledger.geometryCandidate.file.replace(/^public\//, '');
const CANDIDATE_ID = ledger.geometryCandidate.id;
const CANDIDATE_LABEL = CANDIDATE_ID.match(/^v\d+\.\d+/)?.[0].toUpperCase() ?? 'V19';
const reference = `data:image/webp;base64,${fs.readFileSync(path.resolve('qa/reference/brand-emblem-canonical-reference.webp')).toString('base64')}`;
fs.mkdirSync(DIR, { recursive: true });

const css = `
*{box-sizing:border-box}html,body{margin:0;background:#03070d;color:#d9f8ff;font:14px system-ui}main{padding:28px}
h1{margin:0 0 8px}.sub{color:#8ebcca;margin-bottom:22px;max-width:1280px;line-height:1.5}.decision{color:#ffb27a;font-weight:800}.safe{color:#8be7c5;font-weight:800}.candidate{color:#8fdfff;font-weight:800}
.grid{display:grid;grid-template-columns:repeat(5,minmax(210px,1fr));gap:14px}.col{display:grid;justify-items:center;gap:8px}.tile{width:214px;height:214px;display:grid;place-items:center;background:#010306;border:1px solid #18313a;overflow:hidden}small{color:#8ebcca;text-align:center}
.top{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.panel{min-height:310px;display:grid;place-items:center;background:#010306;border:1px solid #18313a;overflow:hidden;padding:16px}.panel img{max-width:100%;max-height:100%;object-fit:contain}
.states{display:grid;grid-template-columns:repeat(8,1fr);gap:12px}.state{display:grid;gap:7px;text-align:center}.state img{width:100%;height:205px;object-fit:contain;background:#010306;border:1px solid #18313a}`;

async function decodeAll(page) {
  const decoded = await page.locator('img').evaluateAll(async (nodes) => Promise.all(nodes.map(async (node) => {
    try { await node.decode(); return node.naturalWidth > 0; } catch { return false; }
  })));
  expect(decoded.every(Boolean)).toBe(true);
}

async function waitForLiveHome(page) {
  await expect(page.locator('.hero-title-lockup')).toContainText('LEGENDARY', { timeout: 20_000 });
  await expect(page.locator('[data-hero-poet-window]')).toHaveCount(6);
  await page.waitForFunction(() => {
    const images = [...document.querySelectorAll('[data-hero-poet-window] img')];
    const shells = [...document.querySelectorAll('[data-hero-poet-window-shell]')];
    return images.length === 6
      && images.every((image) => image.complete && image.naturalWidth > 0)
      && shells.length === 6
      && shells.every((shell) => Number.parseFloat(getComputedStyle(shell).opacity) >= 0.99);
  }, null, { timeout: 20_000 });
}

function markClip(box, padding = 48) {
  return { x: Math.max(0, box.x - padding), y: Math.max(0, box.y - padding), width: box.width + padding * 2, height: box.height + padding * 2 };
}

async function captureMark(page, box, label, x = null, y = null, delay = 0) {
  if (x !== null && y !== null) await page.mouse.move(box.x + box.width * x, box.y + box.height * y);
  if (delay) await page.waitForTimeout(delay);
  return [label, (await page.screenshot({ clip: markClip(box) })).toString('base64')];
}

async function pixelDifference(page, left, right) {
  return page.evaluate(async ({ a, b }) => {
    const load = (src) => new Promise((resolve, reject) => {
      const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = `data:image/png;base64,${src}`;
    });
    const [imageA, imageB] = await Promise.all([load(a), load(b)]);
    const width = Math.min(imageA.naturalWidth, imageB.naturalWidth);
    const height = Math.min(imageA.naturalHeight, imageB.naturalHeight);
    const read = (image) => {
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, width, height);
      return context.getImageData(0, 0, width, height).data;
    };
    const dataA = read(imageA); const dataB = read(imageB);
    let total = 0; let overFive = 0; const pixels = width * height;
    for (let index = 0; index < dataA.length; index += 4) {
      const difference = (Math.abs(dataA[index] - dataB[index]) + Math.abs(dataA[index + 1] - dataB[index + 1]) + Math.abs(dataA[index + 2] - dataB[index + 2])) / 3;
      total += difference; if (difference > 5) overFive += 1;
    }
    return { meanPixelDifference: total / pixels, percentPixelsOverFive: overFive / pixels * 100, width, height };
  }, { a: left, b: right });
}

test(`${CANDIDATE_LABEL} is a layered SVG candidate isolated from production`, async ({ request }) => {
  const response = await request.get(`${BASE_URL}/${CANDIDATE}?v=${Date.now()}`);
  const svg = await response.text();
  expect(response.status()).toBe(200);
  expect(svg).toContain(`data-brand-candidate="${CANDIDATE_ID}"`);
  expect(svg).toMatch(/viewBox="0 0 96 96"/);
  expect(svg).not.toMatch(/<(?:image|rect|foreignObject|canvas)\b|data:image|base64,/i);
  expect((svg.match(/<path\b/g) ?? []).length).toBeGreaterThan(60);
  for (const hook of ['atmosphere', 'figure', 'cloak', 'folds', 'hood', 'hood-layers', 'hood-seams', 'inner-rim', 'face-void', 'face-depth', 'collar', 'rim-light', 'cloth-highlights', 'texture']) {
    expect(svg, `candidate missing ${hook}`).toContain(`data-brand-${hook}`);
  }
});

test(`REFERENCE / PRODUCTION / ${CANDIDATE_LABEL} CANDIDATE stay together at every optical size`, async ({ page }) => {
  await page.setViewportSize({ width: 1340, height: 2600 });
  const sizes = [256, 192, 128, 96, 64, 56, 44, 32, 24, 16];
  const columns = sizes.map((size) => `<section class=col><b>${size}px</b>
    <div class=tile><img width=${size} height=${size} src="${reference}"></div><small>PRIMARY SQUARE REFERENCE</small>
    <div class=tile><img width=${size} height=${size} src="${BASE_URL}/${size <= 32 ? 'brand-mark-micro.svg' : 'brand-emblem.svg'}?v=${VERSION}"></div><small>CURRENT PRODUCTION</small>
    <div class=tile><img width=${size} height=${size} src="${BASE_URL}/${CANDIDATE}?v=${VERSION}"></div><small>${CANDIDATE_LABEL} GEOMETRY CANDIDATE</small></section>`).join('');
  await page.setContent(`<style>${css}</style><main><h1>REFERENCE / PRODUCTION / ${CANDIDATE_LABEL} CANDIDATE</h1><div class=sub><span class=candidate>REFERENCE-LED CANDIDATE:</span> canonical hood and face landmarks, broader shoulders, crushed multi-plane cowl, diagonal cloth, restrained irregular upper aura. Production remains unchanged. <span class=decision>NOT REFERENCE APPROVED</span>.</div><div class=grid>${columns}</div></main>`);
  await decodeAll(page);
  await page.screenshot({ path: path.join(DIR, 'brand-v19-candidate-comparison-matrix.png'), fullPage: true });
});

test('primary reference remains beside the unchanged production baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1800 });
  const sizes = [256, 192, 128, 96, 64, 56, 44, 32, 24, 16];
  const columns = sizes.map((size) => `<section class=col><b>${size}px</b><div class=tile><img width=${size} height=${size} src="${reference}"></div><small>PRIMARY SQUARE REFERENCE</small><div class=tile><img width=${size} height=${size} src="${BASE_URL}/${size <= 32 ? 'brand-mark-micro.svg' : 'brand-emblem.svg'}?v=${VERSION}"></div><small>PRESERVED VISUAL BASELINE</small></section>`).join('');
  await page.setContent(`<style>${css}</style><main><h1>PRIMARY REFERENCE / PRESERVED PRODUCTION</h1><div class=sub><span class=safe>NO IDLE REGRESSION:</span> experimental geometry remains isolated. <span class=decision>NOT REFERENCE APPROVED</span>.</div><div class=grid>${columns}</div></main>`);
  await decodeAll(page);
  await page.screenshot({ path: path.join(DIR, 'brand-reference-comparison-matrix.png'), fullPage: true });
});

test('reference, idle, entry and centered awakening are shown together', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  expect((await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' }))?.status()).toBeLessThan(400);
  await page.addStyleTag({ content: '[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}' });
  await waitForLiveHome(page);
  const mark = page.locator('header [data-brand-mark]').first();
  await expect(mark).toHaveAttribute('data-brand-vector-source', SOURCE);
  await expect(mark).toHaveAttribute('data-brand-parallax', 'spring-awakening-v5');
  await expect(mark).toHaveAttribute('data-brand-motion-timestep', 'bounded-substeps-v1');
  await expect(mark).toHaveAttribute('data-brand-awakening', 'aura-depth-cloth-v3');
  await page.screenshot({ path: path.join(DIR, 'brand-live-site-home-first-viewport.png'), fullPage: false });
  const box = await mark.boundingBox(); const clip = markClip(box, 44);
  const idle = await page.screenshot({ clip });
  await page.mouse.move(box.x + box.width * .84, box.y + box.height * .18); await page.waitForTimeout(120);
  const entry = await page.screenshot({ clip });
  await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5); await page.waitForTimeout(680);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'active');
  const full = await page.screenshot({ clip });
  await page.setViewportSize({ width: 1500, height: 760 });
  await page.setContent(`<style>${css}</style><main><h1>REFERENCE / IDLE / ENTRY / CENTERED AWAKENING</h1><div class=sub><span class=decision>NOT REFERENCE APPROVED</span> — production motion remains independently evidenced while ${CANDIDATE_LABEL} geometry is reviewed.</div><div class=top><div class=panel><img src="${reference}"></div><div class=panel><img src="data:image/png;base64,${idle.toString('base64')}"></div><div class=panel><img src="data:image/png;base64,${entry.toString('base64')}"></div><div class=panel><img src="data:image/png;base64,${full.toString('base64')}"></div></div></main>`);
  await decodeAll(page);
  await page.screenshot({ path: path.join(DIR, 'brand-reference-live-site-comparison.png'), fullPage: true });
});

test('v18.6 production motion keeps directional depth and exact return', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: '[data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}' });
  await waitForLiveHome(page);
  const mark = page.locator('header [data-brand-mark]').first(); const box = await mark.boundingBox();
  await expect(mark).toHaveAttribute('data-brand-parallax', 'spring-awakening-v5');
  await expect(mark).toHaveAttribute('data-brand-motion-timestep', 'bounded-substeps-v1');
  const frames = [await captureMark(page, box, 'IDLE')];
  frames.push(await captureMark(page, box, 'ENTRY 120MS', .84, .18, 120));
  frames.push(await captureMark(page, box, 'FULL CENTER', .5, .5, 680));
  for (const [label, x, y] of [['TOP LEFT', .16, .16], ['TOP RIGHT', .84, .16], ['LOWER LEFT', .16, .82], ['LOWER RIGHT', .84, .82]]) frames.push(await captureMark(page, box, label, x, y, 580));
  await page.mouse.move(Math.max(2, box.x - 100), Math.max(2, box.y - 100)); await page.waitForTimeout(2500);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'idle');
  frames.push(await captureMark(page, box, 'SETTLED'));
  const metrics = {};
  for (const [label, data] of frames.slice(3, 7)) {
    const result = await pixelDifference(page, frames[2][1], data); metrics[label] = result;
    expect(result.meanPixelDifference, `${label}: directional mean`).toBeGreaterThan(.4);
    expect(result.percentPixelsOverFive, `${label}: changed pixels`).toBeGreaterThan(3);
  }
  const returned = await pixelDifference(page, frames[0][1], frames[7][1]);
  expect(returned.meanPixelDifference).toBeLessThan(.8);
  expect(returned.percentPixelsOverFive).toBeLessThan(2);
  fs.writeFileSync(path.join(DIR, 'brand-interaction-metrics.json'), JSON.stringify({ baseline: 'FULL CENTER', directional: metrics, settledVersusIdle: returned }, null, 2));
  await page.setViewportSize({ width: 1780, height: 600 });
  await page.setContent(`<style>${css}</style><main><h1>v18.6 FRAME-RATE-INVARIANT AWAKENING STATES</h1><div class=sub>Every corner is compared against FULL CENTER; SETTLED must return to IDLE.</div><div class=states>${frames.map(([label, data]) => `<div class=state><b>${label}</b><img src="data:image/png;base64,${data}"></div>`).join('')}</div></main>`);
  await decodeAll(page);
  await page.screenshot({ path: path.join(DIR, 'brand-interaction-state-matrix.png'), fullPage: true });
});
