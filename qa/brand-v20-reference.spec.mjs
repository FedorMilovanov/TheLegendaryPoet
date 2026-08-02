import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const DIR = path.resolve('qa-artifacts');
const contract = JSON.parse(fs.readFileSync(path.resolve('qa/reference/brand-reference-contract.json'), 'utf8'));
const sheet = JSON.parse(fs.readFileSync(path.resolve('qa/reference/brand-v20-reference-sheet.json'), 'utf8'));
const referenceData = fs.readFileSync(path.resolve(sheet.referenceFile)).toString('base64');
const [full, micro] = sheet.candidates;
fs.mkdirSync(DIR, { recursive: true });

const sources = [
  { ...full, selectors: { hood: '[data-brand-hood]', face: '[data-brand-face-void]', cloak: '[data-brand-cloak]' } },
  { ...micro, selectors: { hood: '[data-brand-micro-hood]', face: '[data-brand-micro-face]', cloak: '[data-brand-micro-cloak]' } },
];
const within = (value, target) => value >= target.allowed[0] && value <= target.allowed[1];

async function measure(page, request, source) {
  const response = await request.get(`${BASE_URL}/${path.basename(source.file)}?v20=${Date.now()}`);
  expect(response.status(), source.file).toBe(200);
  await page.setContent(await response.text());
  const svg = page.locator('svg');
  await expect(svg).toHaveAttribute('data-brand-reference-decision', 'not-reference-approved');
  await svg.evaluate((node) => {
    node.style.width = '960px';
    node.style.height = '960px';
    node.style.display = 'block';
    node.style.maxWidth = 'none';
  });

  const boxes = {};
  for (const [name, selector] of Object.entries(source.selectors)) {
    const target = page.locator(selector);
    await expect(target, `${source.id}: ${name}`).toHaveCount(1);
    boxes[name] = await target.evaluate((node) => {
      const box = node.getBBox();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    });
  }

  const visibleFigureHeight = boxes.cloak.y + boxes.cloak.height - boxes.hood.y;
  const ratios = {
    hoodHeightToVisibleFigureHeight: boxes.hood.height / visibleFigureHeight,
    hoodWidthToCloakWidth: boxes.hood.width / boxes.cloak.width,
    faceCavernWidthToHoodWidth: boxes.face.width / boxes.hood.width,
    cloakWidthToHoodWidth: boxes.cloak.width / boxes.hood.width,
  };
  const passes = {
    hoodHeightToVisibleFigureHeight: within(ratios.hoodHeightToVisibleFigureHeight, contract.targets.hoodHeightToVisibleFigureHeight),
    hoodWidthToCloakWidth: within(ratios.hoodWidthToCloakWidth, contract.targets.hoodWidthToCloakWidth),
    faceCavernWidthToHoodWidth: within(ratios.faceCavernWidthToHoodWidth, contract.targets.faceCavernWidthToHoodWidth),
    cloakWidthToHoodWidth: ratios.cloakWidthToHoodWidth >= contract.targets.cloakWidthToHoodWidth.minimum,
  };

  let renderedBoxes = null;
  let composition = null;
  let compositionPasses = null;
  if (source.composition) {
    ({ renderedBoxes, composition } = await page.evaluate((selectors) => {
      const root = document.querySelector('svg').getBoundingClientRect();
      const toBox = (selector) => {
        const rect = document.querySelector(selector).getBoundingClientRect();
        return {
          x: (rect.left - root.left) / root.width,
          y: (rect.top - root.top) / root.height,
          width: rect.width / root.width,
          height: rect.height / root.height,
        };
      };
      const hood = toBox(selectors.hood);
      const face = toBox(selectors.face);
      const cloak = toBox(selectors.cloak);
      return {
        renderedBoxes: { hood, face, cloak },
        composition: {
          cloakWidthToCanvas: cloak.width,
          occupiedFigureHeightToCanvas: cloak.y + cloak.height - hood.y,
          hoodApexYToCanvas: hood.y,
          cloakShoulderYToCanvas: cloak.y,
          figureCenterXToCanvas: cloak.x + cloak.width / 2,
        },
      };
    }, source.selectors));
    compositionPasses = Object.fromEntries(Object.entries(composition).map(([name, value]) => [name, within(value, contract.compositionTargets[name])]));
  }

  return {
    id: source.id,
    file: source.file,
    boxes,
    ratios,
    passes,
    renderedBoxes,
    composition,
    compositionPasses,
    numericGeometryEligible: Object.values(passes).every(Boolean),
    compositionEligible: compositionPasses ? Object.values(compositionPasses).every(Boolean) : null,
    reviewerDecision: 'not-reference-approved',
    productionReplacement: false,
  };
}

test('v20 full-size and independent micro masters pass numeric geometry without receiving visual approval', async ({ page, request }) => {
  const results = [];
  for (const source of sources) {
    const result = await measure(page, request, source);
    expect(Object.values(result.passes).every(Boolean), `${source.id}: internal geometry`).toBe(true);
    expect(result.numericGeometryEligible).toBe(true);
    expect(result.reviewerDecision).toBe('not-reference-approved');
    expect(result.productionReplacement).toBe(false);
    for (const [name, value] of Object.entries(result.ratios)) expect(value, `${source.id}: ${name}`).toBeCloseTo(source.ratios[name], 3);
    if (source.composition) {
      expect(Object.values(result.compositionPasses).every(Boolean), `${source.id}: rendered composition`).toBe(true);
      expect(result.compositionEligible).toBe(true);
      for (const [name, value] of Object.entries(result.composition)) expect(value, `${source.id}: ${name}`).toBeCloseTo(source.composition[name], 3);
    } else {
      expect(result.composition).toBeNull();
      expect(result.compositionEligible).toBeNull();
    }
    results.push(result);
  }
  fs.writeFileSync(path.join(DIR, 'brand-v20-contract-metrics.json'), `${JSON.stringify({
    referenceId: sheet.referenceId,
    referenceSha256: sheet.referenceSha256,
    internalContract: contract.targets,
    compositionContract: contract.compositionTargets,
    results,
    conclusion: 'numeric-and-composition-pass / visual-approval-pending / production-unchanged',
  }, null, 2)}\n`);
});

const decodeAll = (page) => page.locator('img').evaluateAll(async (images) => Promise.all(images.map((image) => image.decode())));

test('v20 canonical comparison and optical-size evidence are rendered from exact committed assets', async ({ page }) => {
  const reference = `data:image/webp;base64,${referenceData}`;
  const fullUrl = `${BASE_URL}/${path.basename(full.file)}`;
  const microUrl = `${BASE_URL}/${path.basename(micro.file)}`;
  await page.setViewportSize({ width: 1760, height: 1420 });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;background:#05080c;color:#d9f8ff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}main{padding:32px}h1{margin:0 0 8px;font-size:25px}.status{margin-bottom:26px;color:#7fdff3}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}.card,.sizes{border:1px solid #173440;background:#020406}.card{min-height:430px;padding:18px}.label{margin-bottom:14px;color:#a9ecf8;font-weight:700}.stage{height:352px;display:grid;place-items:center;position:relative;overflow:hidden;background:#010204}.stage img{width:320px;height:320px;object-fit:contain}.overlay img{position:absolute;inset:16px}.overlay .candidate{opacity:.58}.sizes{margin-top:24px;display:flex;align-items:flex-end;gap:24px;padding:20px}.sample{min-width:132px;text-align:center}.sample b{display:block;margin-bottom:12px;color:#78ddef}.well{height:280px;display:flex;align-items:flex-start;justify-content:center;background:#010204;padding-top:20px}
  </style></head><body><main>
    <h1>CANONICAL REFERENCE / ${full.id} / LANDMARK OVERLAY</h1>
    <div class="status">numeric-and-composition-pass · not-reference-approved · production unchanged</div>
    <section class="grid">
      <article class="card"><div class="label">CANONICAL 256×256</div><div class="stage"><img src="${reference}"></div></article>
      <article class="card"><div class="label">${full.id} FULL MASTER 256×256</div><div class="stage"><img src="${fullUrl}"></div></article>
      <article class="card"><div class="label">REFERENCE + CANDIDATE OVERLAY</div><div class="stage overlay"><img src="${reference}"><img class="candidate" src="${fullUrl}"></div></article>
    </section>
    <section class="sizes">${full.reviewSizes.map((size) => `<div class="sample"><b>${size}px</b><div class="well"><img src="${fullUrl}" width="${size}" height="${size}"></div></div>`).join('')}</section>
  </main></body></html>`);
  await expect(page.locator('img')).toHaveCount(8);
  await decodeAll(page);
  await page.screenshot({ path: path.join(DIR, 'brand-v20-reference-comparison.png'), fullPage: true });

  await page.setViewportSize({ width: 1680, height: 980 });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;background:#05080c;color:#d9f8ff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}main{padding:30px}h1{margin:0 0 8px;font-size:24px}p{margin:0 0 24px;color:#7fdff3}.rows{display:grid;gap:22px}.row{display:grid;grid-template-columns:150px repeat(5,1fr);gap:16px}.row-title{display:grid;place-items:center;border:1px solid #173440;font-weight:700}.cell{height:320px;border:1px solid #173440;display:flex;flex-direction:column;align-items:center;padding:16px}.dark{background:#010204}.light{background:#e9f1f4;color:#061016}.cell b{margin-bottom:18px}.actual{height:74px;display:grid;place-items:start center;width:100%}.magnified{margin-top:18px;width:160px;height:160px;display:grid;place-items:center;border:1px dashed currentColor}.magnified img{width:144px;height:144px}
  </style></head><body><main>
    <h1>${micro.id} — DARK / LIGHT DIAGNOSTICS</h1>
    <p>Actual optical render above; enlarged structural inspection below. not-reference-approved.</p>
    <div class="rows">${['dark','light'].map((tone) => `<section class="row"><div class="row-title ${tone}">${tone.toUpperCase()}</div>${micro.reviewSizes.map((size) => `<div class="cell ${tone}"><b>${size}px</b><div class="actual"><img src="${microUrl}" width="${size}" height="${size}"></div><div class="magnified"><img src="${microUrl}"></div></div>`).join('')}</section>`).join('')}</div>
  </main></body></html>`);
  await expect(page.locator('img')).toHaveCount(20);
  await decodeAll(page);
  await page.screenshot({ path: path.join(DIR, 'brand-v20-micro-diagnostics.png'), fullPage: true });
});
