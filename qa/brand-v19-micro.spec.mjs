import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const DIR = path.resolve('qa-artifacts');
const ledger = JSON.parse(fs.readFileSync(path.resolve('qa/brand-marathon-pass-ledger.json'), 'utf8'));
const candidate = ledger.microCandidate.file.replace(/^public\//, '');
const candidateId = ledger.microCandidate.id;
const reference = `data:image/webp;base64,${fs.readFileSync(path.resolve('qa/reference/brand-emblem-canonical-reference.webp')).toString('base64')}`;
fs.mkdirSync(DIR, { recursive: true });

async function decodeAll(page) {
  const decoded = await page.locator('img').evaluateAll(async (nodes) => Promise.all(nodes.map(async (node) => {
    try { await node.decode(); return node.naturalWidth > 0; } catch { return false; }
  })));
  expect(decoded.every(Boolean)).toBe(true);
}

test('v19.14 micro candidate is optical SVG and isolated from production', async ({ request }) => {
  const [candidateResponse, productionResponse] = await Promise.all([
    request.get(`${BASE_URL}/${candidate}?v=${Date.now()}`),
    request.get(`${BASE_URL}/brand-mark-micro.svg?v=${Date.now()}`),
  ]);
  const [candidateSvg, productionSvg] = await Promise.all([candidateResponse.text(), productionResponse.text()]);
  expect(candidateResponse.status()).toBe(200);
  expect(productionResponse.status()).toBe(200);
  expect(candidateSvg).toContain(`data-brand-micro-candidate="${candidateId}"`);
  expect(candidateSvg).toMatch(/viewBox="0 0 32 32"/);
  expect(candidateSvg).not.toMatch(/<(?:image|rect|foreignObject|canvas)\b|data:image|base64,/i);
  expect(candidateSvg).not.toMatch(/<animate(?:Transform|Motion)?\b|@keyframes/i);
  for (const hook of ['atmosphere', 'figure', 'cloak', 'folds', 'hood', 'face', 'cowl', 'rim']) {
    expect(candidateSvg).toContain(`data-brand-micro-${hook}`);
  }
  expect(productionSvg).not.toContain(candidateId);
});

test('reference, current micro and v19.14 micro remain visible at 32, 24 and 16 pixels', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1080, height: 720 });
  const sizes = [32, 24, 16];
  const columns = sizes.map((size) => `<section><h2>${size}px</h2>
    <figure><div><img width=${size} height=${size} src="${reference}"></div><figcaption>REFERENCE</figcaption></figure>
    <figure><div><img width=${size} height=${size} src="${BASE_URL}/brand-mark-micro.svg?v=${Date.now()}"></div><figcaption>CURRENT MICRO</figcaption></figure>
    <figure><div><img width=${size} height=${size} src="${BASE_URL}/${candidate}?v=${Date.now()}"></div><figcaption>V19.14 MICRO</figcaption></figure>
  </section>`).join('');
  await page.setContent(`<style>
    *{box-sizing:border-box}html,body{margin:0;background:#03070d;color:#dcf8ff;font:14px system-ui}main{padding:28px}h1{margin:0 0 8px}.sub{color:#8fbcc8;margin-bottom:24px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}section{display:grid;gap:10px;text-align:center}h2{margin:0}figure{margin:0;display:grid;gap:7px}figure div{height:150px;display:grid;place-items:center;background:#010306;border:1px solid #18313a}figcaption{font-size:12px;color:#8fbcc8}
  </style><main><h1>REFERENCE / CURRENT MICRO / V19.14 MICRO</h1><div class=sub>${testInfo.project.name}: dedicated optical geometry; production remains unchanged and not-reference-approved.</div><div class=grid>${columns}</div></main>`);
  await decodeAll(page);
  await page.screenshot({ path: path.join(DIR, `brand-v19-micro-candidate-matrix-${testInfo.project.name}.png`), fullPage: true });
  if (testInfo.project.name === 'chromium-core') {
    await page.screenshot({ path: path.join(DIR, 'brand-v19-micro-candidate-matrix.png'), fullPage: true });
  }
});
