import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const DIR = path.resolve('qa-artifacts');
const contract = JSON.parse(fs.readFileSync(path.resolve('qa/reference/brand-reference-contract.json'), 'utf8'));
fs.mkdirSync(DIR, { recursive: true });

const sources = [
  {
    id: 'production-v17',
    file: 'brand-emblem.svg',
    selectors: { hood: '[data-brand-hood]', face: '[data-brand-face-void]', cloak: '[data-brand-cloak]' },
    expectedPasses: { hoodHeightToVisibleFigureHeight: true, hoodWidthToCloakWidth: false, faceCavernWidthToHoodWidth: false, cloakWidthToHoodWidth: true },
  },
  {
    id: 'v19.11-full-size',
    file: 'brand-emblem-v19-candidate.svg',
    selectors: { hood: '[data-brand-hood]', face: '[data-brand-face-void]', cloak: '[data-brand-cloak]' },
    expectedPasses: { hoodHeightToVisibleFigureHeight: false, hoodWidthToCloakWidth: true, faceCavernWidthToHoodWidth: false, cloakWidthToHoodWidth: true },
  },
  {
    id: 'v19.17-optical',
    file: 'brand-emblem-v19-optical-candidate.svg',
    selectors: { hood: '[data-brand-optical-hood]', face: '[data-brand-optical-face]', cloak: '[data-brand-optical-cloak]' },
    expectedPasses: { hoodHeightToVisibleFigureHeight: false, hoodWidthToCloakWidth: true, faceCavernWidthToHoodWidth: false, cloakWidthToHoodWidth: true },
  },
  {
    id: 'v19.14-micro',
    file: 'brand-emblem-v19-micro-candidate.svg',
    selectors: { hood: '[data-brand-micro-hood]', face: '[data-brand-micro-face]', cloak: '[data-brand-micro-cloak]' },
    expectedPasses: { hoodHeightToVisibleFigureHeight: false, hoodWidthToCloakWidth: false, faceCavernWidthToHoodWidth: false, cloakWidthToHoodWidth: false },
  },
];

const within = (value, range) => value >= range.allowed[0] && value <= range.allowed[1];

async function measureSvg(page, request, source) {
  const response = await request.get(`${BASE_URL}/${source.file}?audit=${Date.now()}`);
  expect(response.status(), source.file).toBe(200);
  await page.setContent(await response.text());
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
  const values = {
    hoodHeightToVisibleFigureHeight: boxes.hood.height / visibleFigureHeight,
    hoodWidthToCloakWidth: boxes.hood.width / boxes.cloak.width,
    faceCavernWidthToHoodWidth: boxes.face.width / boxes.hood.width,
    cloakWidthToHoodWidth: boxes.cloak.width / boxes.hood.width,
  };
  const passes = {
    hoodHeightToVisibleFigureHeight: within(values.hoodHeightToVisibleFigureHeight, contract.targets.hoodHeightToVisibleFigureHeight),
    hoodWidthToCloakWidth: within(values.hoodWidthToCloakWidth, contract.targets.hoodWidthToCloakWidth),
    faceCavernWidthToHoodWidth: within(values.faceCavernWidthToHoodWidth, contract.targets.faceCavernWidthToHoodWidth),
    cloakWidthToHoodWidth: values.cloakWidthToHoodWidth >= contract.targets.cloakWidthToHoodWidth.minimum,
  };
  return { ...source, boxes, values, passes, approvalEligible: Object.values(passes).every(Boolean) };
}

test('reference proportions are measured and no current SVG is silently approval-eligible', async ({ page, request }) => {
  const results = [];
  for (const source of sources) {
    const result = await measureSvg(page, request, source);
    expect(result.passes, `${source.id}: intentional audit profile changed`).toEqual(source.expectedPasses);
    expect(result.approvalEligible, `${source.id}: must not be called reference-approved`).toBe(false);
    results.push(result);
  }
  fs.writeFileSync(path.join(DIR, 'brand-reference-contract-metrics.json'), JSON.stringify({
    referenceId: contract.referenceId,
    targets: contract.targets,
    results,
  }, null, 2));
});

async function waitForHome(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-hero-poet-window]')).toHaveCount(6, { timeout: 20_000 });
  const header = page.locator('header [data-brand-mark]').first();
  await expect(header).toHaveAttribute('data-brand-parallax', 'spring-awakening-v4');
  await expect(header).toHaveAttribute('data-brand-motion-normalization', 'rendered-box-v1');
  await page.addStyleTag({ content: `
    [data-custom-cursor-dot],[data-custom-cursor-ring]{display:none!important}
    header a:has(> [data-brand-mark]) > :not([data-brand-mark]){visibility:hidden!important}
  ` });
}

async function readMotion(mark) {
  return mark.evaluate((node) => {
    const style = node.style;
    const value = (name) => Number.parseFloat(style.getPropertyValue(name) || '0');
    return {
      state: node.dataset.brandInteraction,
      motionScale: value('--brand-motion-scale'),
      rootY: value('--brand-root-y'),
      rootScale: value('--brand-root-scale'),
      farX: value('--brand-far-x'),
      energyX: value('--brand-energy-x'),
      figureX: value('--brand-figure-x'),
      foldsX: value('--brand-folds-x'),
      hoodX: value('--brand-hood-x'),
      hoodLayersX: value('--brand-hood-layers-x'),
      faceX: value('--brand-face-x'),
      collarX: value('--brand-collar-x'),
      rimX: value('--brand-rim-x'),
      textureX: value('--brand-texture-x'),
      energyBrightness: value('--brand-energy-brightness'),
      rimBrightness: value('--brand-rim-brightness'),
    };
  });
}

async function startSampling(mark, durationMs) {
  await mark.evaluate((node, duration) => {
    window.__tlpBrandMotionSamples = [];
    const start = performance.now();
    const read = (name) => Number.parseFloat(node.style.getPropertyValue(name) || '0');
    const tick = (now) => {
      window.__tlpBrandMotionSamples.push({
        elapsed: now - start,
        energyX: read('--brand-energy-x'),
        faceX: read('--brand-face-x'),
        rootScale: read('--brand-root-scale'),
        motionScale: read('--brand-motion-scale'),
        state: node.dataset.brandInteraction,
      });
      if (now - start < duration) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, durationMs);
}

async function activateAt(page, mark, xRatio, yRatio, settleMs = 800) {
  const box = await mark.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box.x + box.width * xRatio, box.y + box.height * yRatio);
  await page.waitForTimeout(settleMs);
  return { box, state: await readMotion(mark) };
}

test('spring motion has bounded trajectory, size-normalized depth and fast exact return', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await waitForHome(page);
  const header = page.locator('header [data-brand-mark]').first();
  const headerBox = await header.boundingBox();
  expect(headerBox).not.toBeNull();

  await startSampling(header, 1_100);
  await page.mouse.move(headerBox.x + headerBox.width * 0.84, headerBox.y + headerBox.height * 0.18);
  await page.waitForTimeout(1_180);
  const samples = await page.evaluate(() => window.__tlpBrandMotionSamples || []);
  expect(samples.length, 'trajectory must contain independent rendered samples').toBeGreaterThanOrEqual(12);
  const sampleSpanMs = samples.at(-1).elapsed - samples[0].elapsed;
  expect(sampleSpanMs, 'trajectory must cover the full entry and settled interval').toBeGreaterThanOrEqual(900);

  const scale = Math.max(0.65, Math.min(1.6, Math.min(headerBox.width, headerBox.height) / 64));
  const targetX = 0.68;
  const expectedEnergy = 3.65 * targetX * scale;
  const final = await readMotion(header);
  expect(final.motionScale).toBeCloseTo(scale, 2);
  expect(final.energyX).toBeCloseTo(expectedEnergy, 1);
  expect(final.faceX).toBeLessThan(0);
  expect(final.farX).toBeLessThan(0);
  expect(final.energyX).toBeGreaterThan(final.rimX);
  expect(final.rimX).toBeGreaterThan(final.hoodLayersX);
  expect(final.hoodLayersX).toBeGreaterThan(final.collarX);
  expect(final.collarX).toBeGreaterThan(final.hoodX);
  expect(final.hoodX).toBeGreaterThan(final.foldsX);
  expect(final.foldsX).toBeGreaterThan(final.textureX);
  expect(final.textureX).toBeGreaterThan(Math.abs(final.faceX));
  expect(Math.abs(final.faceX)).toBeGreaterThan(final.figureX);

  const activation = samples.find((sample) => Math.abs(sample.energyX) >= expectedEnergy * 0.005);
  expect(activation, 'pointer activation must produce a measurable first motion sample').toBeTruthy();
  const positive = samples.filter((sample) => sample.elapsed >= activation.elapsed && sample.energyX > expectedEnergy * 0.05);
  expect(positive.length).toBeGreaterThan(5);
  const entryTargetElapsed = activation.elapsed + 120;
  const entry = samples.reduce((best, sample) => Math.abs(sample.elapsed - entryTargetElapsed) < Math.abs(best.elapsed - entryTargetElapsed) ? sample : best, samples[0]);
  expect(entry.energyX / expectedEnergy).toBeGreaterThan(0.2);
  expect(entry.energyX / expectedEnergy).toBeLessThan(0.75);
  const first95 = samples.find((sample) => sample.elapsed >= activation.elapsed && sample.energyX >= expectedEnergy * 0.95);
  expect(first95).toBeTruthy();
  const first95AfterActivationMs = first95.elapsed - activation.elapsed;
  expect(first95AfterActivationMs).toBeGreaterThan(150);
  expect(first95AfterActivationMs).toBeLessThan(650);
  const peak = Math.max(...samples.filter((sample) => sample.elapsed >= activation.elapsed).map((sample) => sample.energyX));
  expect(peak).toBeLessThanOrEqual(expectedEnergy * 1.06);
  const maxJump = Math.max(...samples.slice(1).map((sample, index) => Math.abs(sample.energyX - samples[index].energyX)));
  expect(maxJump).toBeLessThan(0.55 * scale);
  expect(samples.every((sample) => Number.isFinite(sample.energyX) && Number.isFinite(sample.faceX) && Number.isFinite(sample.rootScale))).toBe(true);

  const leaveStarted = Date.now();
  await page.mouse.move(Math.max(2, headerBox.x - 100), Math.max(2, headerBox.y - 100));
  await expect(header).toHaveAttribute('data-brand-interaction', 'idle', { timeout: 1_200 });
  const settleMs = Date.now() - leaveStarted;
  expect(settleMs).toBeLessThan(1_200);
  const returned = await readMotion(header);
  expect(Math.abs(returned.energyX)).toBeLessThan(0.01);
  expect(Math.abs(returned.faceX)).toBeLessThan(0.01);
  expect(Math.abs(returned.rootY)).toBeLessThan(0.01);
  expect(returned.rootScale).toBeCloseTo(1, 4);
  await page.waitForTimeout(350);
  const stableIdle = await readMotion(header);
  expect(stableIdle).toEqual(returned);

  await page.locator('footer').scrollIntoViewIfNeeded();
  const footer = page.locator('footer [data-brand-mark]').first();
  await expect(footer).toBeVisible();
  const footerResult = await activateAt(page, footer, 0.84, 0.18);
  const footerScale = Math.max(0.65, Math.min(1.6, Math.min(footerResult.box.width, footerResult.box.height) / 64));
  expect(footerResult.state.motionScale).toBeCloseTo(footerScale, 2);
  expect(footerResult.state.energyX).toBeCloseTo(3.65 * targetX * footerScale, 1);
  const observedRatio = final.energyX / footerResult.state.energyX;
  const expectedRatio = scale / footerScale;
  expect(observedRatio).toBeCloseTo(expectedRatio, 1);

  fs.writeFileSync(path.join(DIR, 'brand-motion-quality-metrics.json'), JSON.stringify({
    header: {
      box: headerBox,
      expectedScale: scale,
      final,
      samples,
      sampleSpanMs,
      activationElapsedMs: activation.elapsed,
      first95AfterActivationMs,
      settleMs,
      maxJump,
      peak,
    },
    footer: { box: footerResult.box, expectedScale: footerScale, final: footerResult.state },
    normalizedAmplitudeRatio: { observed: observedRatio, expected: expectedRatio },
  }, null, 2));
});

test('reduced motion keeps all depth transforms inert', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  const mark = page.locator('header [data-brand-mark]').first();
  const box = await mark.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box.x + box.width * 0.84, box.y + box.height * 0.18);
  await expect(mark).toHaveAttribute('data-brand-interaction', 'active');
  const transforms = await mark.locator('[data-brand-depth]').evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).transform));
  expect(transforms.every((value) => value === 'none')).toBe(true);
  const state = await readMotion(mark);
  expect(state.energyX).toBe(0);
  expect(state.faceX).toBe(0);
});
