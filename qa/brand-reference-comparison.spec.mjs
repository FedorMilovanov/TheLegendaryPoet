import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
const REFERENCE_FILE = path.resolve('qa/reference/brand-emblem-canonical-reference.webp');
const REFERENCE_DATA_URL = `data:image/webp;base64,${fs.readFileSync(REFERENCE_FILE).toString('base64')}`;
const VERSION = 'cloak-20260726-8';

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

test('canonical reference is rendered beside every v9.0 emblem optical size', async ({ page }) => {
  await page.setViewportSize({ width: 1240, height: 900 });
  const sizes = [192, 96, 56, 32, 16];
  const columns = sizes.map((size) => {
    const candidate = size <= 32
      ? `${BASE_URL}/brand-mark-micro.svg?v=${VERSION}`
      : `${BASE_URL}/brand-emblem.svg?v=${VERSION}`;
    return `<section class="column">
      <h2>${size} px</h2>
      <figure><div class="tile reference"><img data-kind="reference" data-size="${size}" src="${REFERENCE_DATA_URL}" width="${size}" height="${size}" alt="Canonical reference at ${size} pixels"></div><figcaption>REFERENCE</figcaption></figure>
      <figure><div class="tile candidate"><img data-kind="candidate" data-size="${size}" src="${candidate}" width="${size}" height="${size}" alt="Candidate emblem at ${size} pixels"></div><figcaption>CANDIDATE v9.0</figcaption></figure>
    </section>`;
  }).join('');

  await page.setContent(`
    <style>
      *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#03070d;color:#d9f8ff;font:14px system-ui,sans-serif}
      main{padding:26px 28px 34px}header{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:22px}
      h1{font-size:22px;margin:0 0 7px}p{margin:0;color:#8ebcca;max-width:780px;line-height:1.45}.decision{color:#ffb27a;font-weight:700;white-space:nowrap}
      .matrix{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;align-items:start}.column{display:grid;gap:10px;justify-items:center}
      h2{font-size:13px;font-weight:600;margin:0;color:#a8d7e2}figure{margin:0;display:grid;gap:7px;justify-items:center}
      .tile{width:204px;height:204px;display:grid;place-items:center;background:#02050a;border:1px solid rgba(101,218,244,.17);overflow:hidden}
      .reference{background:#010306}.candidate{background:#03070d}img{display:block;object-fit:contain;image-rendering:auto}figcaption{font-size:11px;letter-spacing:.13em;color:#7ea7b1}
      footer{margin-top:20px;padding-top:15px;border-top:1px solid rgba(101,218,244,.12);color:#8ebcca;font-size:12px}
    </style>
    <main>
      <header><div><h1>CANONICAL REFERENCE / v9.0 GEOMETRY RESET</h1><p>Judge macro silhouette first: hood-to-body ratio, broad face cavern, diagonal cloak spread, central collar overlap, major fold families and continuous two-sided rim.</p></div><div class="decision">v9.0: NOT REFERENCE APPROVED</div></header>
      <div class="matrix">${columns}</div>
      <footer>Generated from the exact checked-out head. A green browser run proves rendering only; the reference acceptance gate remains intentionally blocked.</footer>
    </main>`);

  const images = page.locator('img');
  await expect(images).toHaveCount(sizes.length * 2);
  const results = await images.evaluateAll(async (nodes) => Promise.all(nodes.map(async (image) => {
    try {
      await image.decode();
      return {
        kind: image.dataset.kind,
        size: Number(image.dataset.size),
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        ok: true,
      };
    } catch (error) {
      return { kind: image.dataset.kind, size: Number(image.dataset.size), ok: false, error: String(error) };
    }
  })));
  expect(results.filter((result) => !result.ok), JSON.stringify(results, null, 2)).toEqual([]);
  for (const result of results.filter((item) => item.kind === 'reference')) {
    expect(result.naturalWidth).toBe(256);
    expect(result.naturalHeight).toBe(256);
  }
  for (const size of sizes) {
    for (const kind of ['reference', 'candidate']) {
      const image = page.locator(`img[data-kind="${kind}"][data-size="${size}"]`);
      await expect(image).toBeVisible();
      const box = await image.boundingBox();
      expect(Math.round(box?.width || 0)).toBe(size);
      expect(Math.round(box?.height || 0)).toBe(size);
    }
  }

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'brand-reference-comparison-matrix.png'),
    fullPage: true,
  });
});
