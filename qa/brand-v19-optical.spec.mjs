import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const DIR = path.resolve('qa-artifacts');
const ledger = JSON.parse(fs.readFileSync(path.resolve('qa/brand-marathon-pass-ledger.json'), 'utf8'));
const candidateFile = ledger.opticalCandidate.file;
const candidate = candidateFile.replace(/^public\//, '');
const candidateId = ledger.opticalCandidate.id;
const sizes = ledger.opticalCandidate.opticalSizes;
const candidateData = `data:image/svg+xml;base64,${fs.readFileSync(path.resolve(candidateFile)).toString('base64')}`;
const reference = `data:image/webp;base64,${fs.readFileSync(path.resolve('qa/reference/brand-emblem-canonical-reference.webp')).toString('base64')}`;
fs.mkdirSync(DIR, { recursive: true });

async function decodeAll(page) {
  const decoded = await page.locator('img').evaluateAll(async (nodes) => Promise.all(nodes.map(async (node) => {
    try {
      await node.decode();
      return node.naturalWidth > 0 && node.naturalHeight > 0;
    } catch {
      return false;
    }
  })));
  expect(decoded.every(Boolean)).toBe(true);
}

async function alphaBounds(page, selector) {
  return page.locator(selector).evaluate((image) => {
    const width = image.width;
    const height = image.height;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('2D canvas context is unavailable');
    context.drawImage(image, 0, 0, width, height);
    const data = context.getImageData(0, 0, width, height).data;
    let left = width;
    let right = -1;
    let top = height;
    let bottom = -1;
    let visible = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha < 8) continue;
        visible += 1;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
    return {
      width,
      height,
      visible,
      left,
      right,
      top,
      bottom,
      occupiedWidth: right >= left ? right - left + 1 : 0,
      occupiedHeight: bottom >= top ? bottom - top + 1 : 0,
    };
  });
}

test('v19.17 optical candidate is semantic SVG and isolated from production', async ({ request }) => {
  const [candidateResponse, publicProductionResponse, microProductionResponse] = await Promise.all([
    request.get(`${BASE_URL}/${candidate}?v=${Date.now()}`),
    request.get(`${BASE_URL}/brand-emblem.svg?v=${Date.now()}`),
    request.get(`${BASE_URL}/brand-mark-micro.svg?v=${Date.now()}`),
  ]);
  const [candidateSvg, publicProductionSvg, microProductionSvg] = await Promise.all([
    candidateResponse.text(),
    publicProductionResponse.text(),
    microProductionResponse.text(),
  ]);
  expect(candidateResponse.status()).toBe(200);
  expect(publicProductionResponse.status()).toBe(200);
  expect(microProductionResponse.status()).toBe(200);
  expect(candidateSvg).toContain(`data-brand-optical-candidate="${candidateId}"`);
  expect(candidateSvg).toMatch(/viewBox="0 0 64 64"/);
  expect(candidateSvg).not.toMatch(/<(?:image|rect|foreignObject|canvas)\b|data:image|base64,/i);
  expect(candidateSvg).not.toMatch(/<animate(?:Transform|Motion)?\b|@keyframes/i);
  expect((candidateSvg.match(/<path\b/g) ?? []).length).toBeGreaterThanOrEqual(40);
  for (const hook of ['atmosphere', 'figure', 'cloak', 'folds', 'hood', 'hood-layers', 'face', 'cowl', 'rim']) {
    expect(candidateSvg).toContain(`data-brand-optical-${hook}`);
  }
  expect(publicProductionSvg).not.toContain(candidateId);
  expect(microProductionSvg).not.toContain(candidateId);
});

test('reference, production and v19.17 optical candidate remain readable at medium sizes', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1320, height: 980 });
  const columns = sizes.map((size) => `<section>
    <h2>${size}px</h2>
    <figure><div><img width=${size} height=${size} src="${reference}"></div><figcaption>REFERENCE</figcaption></figure>
    <figure><div><img width=${size} height=${size} src="${BASE_URL}/brand-emblem.svg?v=${Date.now()}"></div><figcaption>CURRENT PRODUCTION</figcaption></figure>
    <figure><div><img data-optical-size="${size}" width=${size} height=${size} src="${candidateData}"></div><figcaption>V19.17 OPTICAL</figcaption></figure>
  </section>`).join('');
  await page.setContent(`<style>
    *{box-sizing:border-box}html,body{margin:0;background:#03070d;color:#dcf8ff;font:14px system-ui}main{padding:28px}h1{margin:0 0 8px}.sub{color:#8fbcc8;margin-bottom:24px;max-width:1080px;line-height:1.5}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}section{display:grid;gap:10px;text-align:center}h2{margin:0}figure{margin:0;display:grid;gap:7px}figure div{height:190px;display:grid;place-items:center;background:#010306;border:1px solid #18313a}figcaption{font-size:12px;color:#8fbcc8}
  </style><main><h1>REFERENCE / PRODUCTION / V19.17 OPTICAL</h1><div class=sub>${testInfo.project.name}: dedicated 64-viewBox geometry for 96, 64, 56 and 44 pixels. Production remains unchanged and not-reference-approved.</div><div class=grid>${columns}</div></main>`);
  await decodeAll(page);

  for (const size of sizes) {
    const bounds = await alphaBounds(page, `img[data-optical-size="${size}"]`);
    expect(bounds.width, `${size}px rendered width`).toBe(size);
    expect(bounds.height, `${size}px rendered height`).toBe(size);
    expect(bounds.visible, `${size}px candidate has visible pixels`).toBeGreaterThan(size * size * 0.08);
    expect(bounds.occupiedWidth / bounds.width, `${size}px occupied width`).toBeGreaterThan(0.72);
    expect(bounds.occupiedHeight / bounds.height, `${size}px occupied height`).toBeGreaterThan(0.8);
    expect(bounds.top / bounds.height, `${size}px top crop`).toBeLessThan(0.2);
    expect(bounds.bottom / bounds.height, `${size}px bottom crop`).toBeGreaterThan(0.9);
  }

  await page.screenshot({ path: path.join(DIR, `brand-v19-optical-candidate-matrix-${testInfo.project.name}.png`), fullPage: true });
  if (testInfo.project.name === 'chromium-core') {
    await page.screenshot({ path: path.join(DIR, 'brand-v19-optical-candidate-matrix.png'), fullPage: true });
  }
});
