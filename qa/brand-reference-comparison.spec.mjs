import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
const REFERENCE_FILE = path.resolve('qa/reference/brand-emblem-canonical-reference.webp');
const REFERENCE_DATA_URL = `data:image/webp;base64,${fs.readFileSync(REFERENCE_FILE).toString('base64')}`;
const VERSION = 'cloak-20260726-8';
const VECTOR_SOURCE = 'canonical-reference-reset-v9-0';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const matrixCss = `
  *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#03070d;color:#d9f8ff;font:14px system-ui,sans-serif}
  main{padding:26px 28px 34px}header{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:22px}
  h1{font-size:22px;margin:0 0 7px}p{margin:0;color:#8ebcca;max-width:800px;line-height:1.45}.decision{color:#ffb27a;font-weight:700;white-space:nowrap}
  .matrix{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;align-items:start}.column{display:grid;gap:10px;justify-items:center}
  h2{font-size:13px;font-weight:600;margin:0;color:#a8d7e2}figure{margin:0;display:grid;gap:7px;justify-items:center}
  .tile{width:204px;height:204px;display:grid;place-items:center;background:#02050a;border:1px solid rgba(101,218,244,.17);overflow:hidden}
  .reference{background:#010306}.candidate{background:#03070d}img{display:block;object-fit:contain;image-rendering:auto}figcaption{font-size:11px;letter-spacing:.13em;color:#7ea7b1}
  footer{margin-top:20px;padding-top:15px;border-top:1px solid rgba(101,218,244,.12);color:#8ebcca;font-size:12px}
`;

test('canonical v2 reference is rendered above every candidate optical size', async ({ page }) => {
  await page.setViewportSize({ width: 1240, height: 900 });
  const sizes = [192, 96, 56, 32, 16];
  const columns = sizes.map((size) => {
    const candidate = size <= 32
      ? `${BASE_URL}/brand-mark-micro.svg?v=${VERSION}`
      : `${BASE_URL}/brand-emblem.svg?v=${VERSION}`;
    return `<section class="column">
      <h2>${size} px</h2>
      <figure><div class="tile reference"><img data-kind="reference" data-size="${size}" src="${REFERENCE_DATA_URL}" width="${size}" height="${size}" alt="Canonical reference v2 at ${size}px"></div><figcaption>REFERENCE V2</figcaption></figure>
      <figure><div class="tile candidate"><img data-kind="candidate" data-size="${size}" src="${candidate}" width="${size}" height="${size}" alt="Current candidate at ${size}px"></div><figcaption>CURRENT CANDIDATE</figcaption></figure>
    </section>`;
  }).join('');

  await page.setContent(`<style>${matrixCss}</style><main>
    <header><div><h1>CANONICAL REFERENCE V2 / CURRENT CANDIDATE</h1><p>Judge hood and face proportions, gathered cowl, three fold families, upper/side electrical aura and the clean smoke-free lower edge. A green run proves rendering only.</p></div><div class="decision">CURRENT: NOT REFERENCE APPROVED</div></header>
    <div class="matrix">${columns}</div>
    <footer>Exact checked-out head. The superseded v1 lower smoke is not part of this reference.</footer>
  </main>`);

  const images = page.locator('img');
  await expect(images).toHaveCount(sizes.length * 2);
  const results = await images.evaluateAll(async (nodes) => Promise.all(nodes.map(async (image) => {
    try { await image.decode(); return { kind: image.dataset.kind, size: Number(image.dataset.size), ok: true, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight }; }
    catch (error) { return { kind: image.dataset.kind, size: Number(image.dataset.size), ok: false, error: String(error) }; }
  })));
  expect(results.filter((result) => !result.ok), JSON.stringify(results, null, 2)).toEqual([]);
  for (const result of results.filter((item) => item.kind === 'reference')) {
    expect(result.naturalWidth).toBe(256); expect(result.naturalHeight).toBe(256);
  }
  for (const size of sizes) {
    for (const kind of ['reference', 'candidate']) {
      const box = await page.locator(`img[data-kind="${kind}"][data-size="${size}"]`).boundingBox();
      expect(Math.round(box?.width || 0)).toBe(size); expect(Math.round(box?.height || 0)).toBe(size);
    }
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-reference-comparison-matrix.png'), fullPage: true });
});

test('canonical v2 reference is compared with the actual exact-head homepage', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  await page.addStyleTag({ content: '[data-custom-cursor-dot], [data-custom-cursor-ring] { display:none!important }' });
  const mark = page.locator('header [data-brand-mark]').first();
  await expect(mark).toBeVisible();
  await expect(mark).toHaveAttribute('data-brand-vector-source', VECTOR_SOURCE);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-live-site-home-first-viewport.png'), fullPage: false });

  const header = page.locator('header').first();
  await expect(header).toBeVisible();
  const headerBox = await header.boundingBox();
  expect(headerBox).not.toBeNull();
  const liveHeader = await page.screenshot({
    clip: {
      x: Math.max(0, headerBox.x), y: Math.max(0, headerBox.y),
      width: Math.min(1440 - Math.max(0, headerBox.x), headerBox.width),
      height: Math.min(340, headerBox.height + 80),
    },
  });
  const liveDataUrl = `data:image/png;base64,${liveHeader.toString('base64')}`;
  const candidateUrl = `${BASE_URL}/brand-emblem.svg?v=${VERSION}`;

  await page.setViewportSize({ width: 1320, height: 900 });
  await page.setContent(`
    <style>
      *{box-sizing:border-box}html,body{margin:0;background:#03070d;color:#d9f8ff;font:14px system-ui,sans-serif}main{padding:28px}
      h1{margin:0 0 8px;font-size:23px}.sub{color:#8ebcca;margin-bottom:22px}.top{display:grid;grid-template-columns:1fr 1fr;gap:18px}
      figure{margin:0;display:grid;gap:8px}.panel{height:340px;background:#010306;border:1px solid rgba(101,218,244,.18);display:grid;place-items:center;overflow:hidden}
      .panel img{display:block;object-fit:contain;max-width:100%;max-height:100%}.live{margin-top:18px}.live .panel{height:320px;align-items:start;background:#050810}.live img{width:100%;height:100%;object-fit:contain}
      figcaption{font-size:12px;letter-spacing:.12em;color:#88becb}.decision{color:#ffb27a;font-weight:700;float:right}
    </style>
    <main>
      <h1>REFERENCE V2 / CURRENT SVG / EXACT-HEAD LIVE SITE <span class="decision">NOT REFERENCE APPROVED</span></h1>
      <div class="sub">The lower edge must remain dark and smoke-free. The live panel is captured from the actual production build used by Browser QA.</div>
      <div class="top">
        <figure><div class="panel"><img src="${REFERENCE_DATA_URL}" width="300" height="300" alt="Canonical reference v2"></div><figcaption>CANONICAL REFERENCE V2</figcaption></figure>
        <figure><div class="panel"><img src="${candidateUrl}" width="300" height="300" alt="Current candidate SVG"></div><figcaption>CURRENT CANDIDATE SVG</figcaption></figure>
      </div>
      <figure class="live"><div class="panel"><img src="${liveDataUrl}" alt="Exact-head live header"></div><figcaption>EXACT-HEAD LIVE HOMEPAGE HEADER</figcaption></figure>
    </main>`);
  const images = page.locator('img');
  const decodeResults = await images.evaluateAll(async (nodes) => Promise.all(nodes.map(async (image) => {
    try { await image.decode(); return { ok: true }; } catch (error) { return { ok: false, error: String(error) }; }
  })));
  expect(decodeResults.filter((result) => !result.ok), JSON.stringify(decodeResults)).toEqual([]);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'brand-reference-live-site-comparison.png'), fullPage: true });
});
