import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(name);
  if (index === -1 || index + 1 >= args.length) throw new Error(`Missing ${name}`);
  return args[index + 1];
};

const baseUrl = value('--base-url');
const outputDir = path.resolve(value('--output-dir'));
const contractPath = path.resolve(value('--contract'));
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const visual = contract.visualEvidence;
if (!visual || visual.status !== 'repeat-spike-authoring') throw new Error('material visual evidence contract is not active');
fs.mkdirSync(outputDir, { recursive: true });

const cases = [
  { key: 'rawL0', asset: 'raw', mode: 'L0-minimal-runtime', screenshot: 'raw-L0-minimal-runtime.png' },
  { key: 'optimizedL0', asset: 'optimized', mode: 'L0-minimal-runtime', screenshot: 'optimized-L0-minimal-runtime.png' },
  { key: 'optimizedL1', asset: 'optimized', mode: 'L1-external-lightmap', screenshot: 'optimized-L1-external-lightmap.png' },
];
const medium = visual.views.materialMedium;
const close = visual.views.materialClose;
const visualCases = [
  { key: 'materialMediumFull', view: medium.id, variant: 'full', spec: medium, screenshot: 'optimized-L0-material-medium-full.png' },
  { key: 'materialCloseFull', view: close.id, variant: 'full', spec: close, screenshot: 'optimized-L0-material-close-full.png' },
  { key: 'materialCloseNormalOff', view: close.id, variant: 'normal-off', spec: close, screenshot: 'optimized-L0-material-close-normal-off.png' },
  { key: 'materialMediumRoughnessFlat', view: medium.id, variant: 'roughness-flat', spec: medium, screenshot: 'optimized-L0-material-medium-roughness-flat.png' },
];
const evidence = {
  schemaVersion: 1,
  laneId: 'TLP-HALL-001',
  phase: 'materialLightingExportSpike',
  modes: {},
  rawControl: null,
  optimizationVisualEquivalence: null,
  gpuMemoryComparison: null,
  candidateReadability: {},
  visualEvidence: {
    status: 'repeat-spike-visual-evidence',
    inspectionTarget: visual.inspectionTarget,
    witnesses: {},
    materialResponses: {},
    humanArtDirectionRequired: visual.requiresHumanArtDirection === true,
    decisionMayAdvance: false,
  },
};

function compareSamples(leftBase64, rightBase64) {
  const left = Buffer.from(leftBase64, 'base64');
  const right = Buffer.from(rightBase64, 'base64');
  if (left.length !== right.length || left.length === 0) throw new Error(`pixel sample length mismatch ${left.length} != ${right.length}`);
  let absoluteSum = 0;
  let maxDifference = 0;
  let changedAbove2 = 0;
  for (let index = 0; index < left.length; index += 1) {
    const difference = Math.abs(left[index] - right[index]);
    absoluteSum += difference;
    maxDifference = Math.max(maxDifference, difference);
    if (difference > 2) changedAbove2 += 1;
  }
  return {
    sampleBytes: left.length,
    meanAbsoluteChannelDifference: absoluteSum / left.length,
    maximumChannelDifference: maxDifference,
    changedSampleRatioAbove2: changedAbove2 / left.length,
  };
}

function compareOptimization(rawMetrics, optimizedMetrics) {
  return {
    ...compareSamples(rawMetrics.pixelSampleBase64, optimizedMetrics.pixelSampleBase64),
    rawPixelHash: rawMetrics.pixelHash,
    optimizedPixelHash: optimizedMetrics.pixelHash,
    exactPixelHashMatch: rawMetrics.pixelHash === optimizedMetrics.pixelHash,
  };
}

function compareGpuMemory(l0, l1) {
  const lightmaps = (l1.gpuTextures ?? []).filter((texture) => texture.roles?.includes('lightMap'));
  return {
    l0EstimatedResidentBytes: Number(l0.gpuTextureResidentBytes ?? 0),
    l1EstimatedResidentBytes: Number(l1.gpuTextureResidentBytes ?? 0),
    incrementalEstimatedResidentBytes: Number(l1.gpuTextureResidentBytes ?? 0) - Number(l0.gpuTextureResidentBytes ?? 0),
    lightmapTextureCount: lightmaps.length,
    lightmapEstimatedResidentBytes: lightmaps.reduce((sum, texture) => sum + Number(texture.estimatedResidentBytes ?? 0), 0),
    lightmaps,
  };
}

function lumaStats(base64, threshold) {
  const sample = Buffer.from(base64, 'base64');
  if (sample.length === 0 || sample.length % 4 !== 0) throw new Error(`invalid RGBA sample length ${sample.length}`);
  let sum = 0;
  let dark = 0;
  const pixels = sample.length / 4;
  for (let index = 0; index < sample.length; index += 4) {
    const r = sample[index] / 255;
    const g = sample[index + 1] / 255;
    const b = sample[index + 2] / 255;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    sum += luma;
    if (luma < threshold) dark += 1;
  }
  return {
    lumaThreshold: threshold,
    meanDisplayLuma: sum / pixels,
    darkSampleRatio: dark / pixels,
  };
}

function readability(metrics) {
  const stats = lumaStats(metrics.pixelSampleBase64, Number(visual.readabilityReject.lumaThreshold));
  const rejected = stats.darkSampleRatio > Number(visual.readabilityReject.maximumDarkSampleRatio);
  return {
    ...stats,
    maximumDarkSampleRatio: Number(visual.readabilityReject.maximumDarkSampleRatio),
    automaticDisposition: rejected ? 'reject-current-bake' : 'eligible-for-human-review',
  };
}

const browser = await chromium.launch({ headless: true });
try {
  for (const item of cases) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    page.on('console', (message) => {
      if (message.type() === 'error') pageErrors.push(message.text());
    });
    await page.goto(`${baseUrl}/?asset=${encodeURIComponent(item.asset)}&mode=${encodeURIComponent(item.mode)}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__HALL_SPIKE__?.loadComplete === true, null, { timeout: 30000 });
    const metrics = await page.evaluate(() => window.__HALL_SPIKE__);
    metrics.errors = [...new Set([...(metrics.errors ?? []), ...pageErrors])];
    if (item.key === 'rawL0') evidence.rawControl = metrics;
    else evidence.modes[item.mode] = metrics;
    await page.screenshot({ path: path.join(outputDir, item.screenshot), fullPage: true });
    await page.close();
  }

  for (const item of visualCases) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    page.on('console', (message) => {
      if (message.type() === 'error') pageErrors.push(message.text());
    });
    const query = new URLSearchParams({
      view: item.view,
      variant: item.variant,
      target: visual.inspectionTarget,
      distance: String(item.spec.distanceMeters),
      lens: String(item.spec.lensMm),
      edgeBias: String(item.spec.edgeBias),
      lumaThreshold: String(visual.readabilityReject.lumaThreshold),
    });
    await page.goto(`${baseUrl}/visual.html?${query.toString()}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__HALL_VISUAL__?.loadComplete === true, null, { timeout: 30000 });
    const metrics = await page.evaluate(() => window.__HALL_VISUAL__);
    metrics.errors = [...new Set([...(metrics.errors ?? []), ...pageErrors])];
    evidence.visualEvidence.witnesses[item.key] = metrics;
    await page.screenshot({ path: path.join(outputDir, item.screenshot), fullPage: true });
    await page.close();
  }
} finally {
  await browser.close();
}

if (!evidence.rawControl || !evidence.modes['L0-minimal-runtime'] || !evidence.modes['L1-external-lightmap']) {
  throw new Error('missing raw/optimized L0/L1 comparison witnesses');
}
evidence.optimizationVisualEquivalence = compareOptimization(
  evidence.rawControl,
  evidence.modes['L0-minimal-runtime'],
);
evidence.gpuMemoryComparison = compareGpuMemory(
  evidence.modes['L0-minimal-runtime'],
  evidence.modes['L1-external-lightmap'],
);
evidence.candidateReadability['L0-minimal-runtime'] = readability(evidence.modes['L0-minimal-runtime']);
evidence.candidateReadability['L1-external-lightmap'] = readability(evidence.modes['L1-external-lightmap']);

const witnesses = evidence.visualEvidence.witnesses;
if (!witnesses.materialCloseFull || !witnesses.materialCloseNormalOff || !witnesses.materialMediumFull || !witnesses.materialMediumRoughnessFlat) {
  throw new Error('missing bounded close/medium material witnesses');
}
evidence.visualEvidence.materialResponses.normal = {
  view: visual.normalResponse.view,
  ...compareSamples(witnesses.materialCloseFull.pixelSampleBase64, witnesses.materialCloseNormalOff.pixelSampleBase64),
  baselinePixelHash: witnesses.materialCloseFull.pixelHash,
  comparisonPixelHash: witnesses.materialCloseNormalOff.pixelHash,
};
evidence.visualEvidence.materialResponses.roughness = {
  view: visual.roughnessResponse.view,
  ...compareSamples(witnesses.materialMediumFull.pixelSampleBase64, witnesses.materialMediumRoughnessFlat.pixelSampleBase64),
  baselinePixelHash: witnesses.materialMediumFull.pixelHash,
  comparisonPixelHash: witnesses.materialMediumRoughnessFlat.pixelHash,
};

fs.writeFileSync(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
let failed = false;
const allMetrics = [evidence.rawControl, ...Object.values(evidence.modes)];
for (const metrics of allMetrics) {
  if (!metrics.loadComplete || metrics.drawCalls <= 0 || metrics.triangles <= 0 || metrics.errors.length > 0 || !metrics.pixelHash || !metrics.pixelSampleBase64 || metrics.gpuTextureResidentBytes <= 0 || !Array.isArray(metrics.gpuTextures) || metrics.gpuTextures.length <= 0) {
    console.error(`${metrics.asset}/${metrics.mode} failed browser witness`, metrics);
    failed = true;
  } else {
    console.log(`${metrics.asset}/${metrics.mode}: calls=${metrics.drawCalls} triangles=${metrics.triangles} textures=${metrics.textures} programs=${metrics.programs} raw=${metrics.rawBytes} optimized=${metrics.optimizedBytes} gpu=${metrics.gpuTextureResidentBytes} pixel=${metrics.pixelHash.slice(0, 12)}`);
  }
}

for (const [key, metrics] of Object.entries(witnesses)) {
  const transport = metrics.transport ?? {};
  if (!metrics.loadComplete || metrics.drawCalls <= 0 || metrics.triangles <= 0 || metrics.errors.length > 0 || !metrics.pixelHash || !metrics.pixelSampleBase64 || !transport.uv0 || !transport.uv1 || !transport.visualEvidenceOnly) {
    console.error(`${key} failed visual material witness`, metrics);
    failed = true;
  }
  if (Math.abs(Number(transport.lookdevBevelMeters) - Number(visual.lookdevBevelMeters)) > 1e-9 || Number(transport.lookdevBevelSegments) !== Number(visual.lookdevBevelSegments) || Math.abs(Number(transport.surfaceUvCubeSizeMeters) - Number(visual.surfaceUvCubeSizeMeters)) > 1e-9) {
    console.error(`${key} lost bounded lookdev transport`, transport);
    failed = true;
  }
}

const comparison = evidence.optimizationVisualEquivalence;
console.log(`raw/optimized L0: meanAbs=${comparison.meanAbsoluteChannelDifference.toFixed(4)} max=${comparison.maximumChannelDifference} changed>2=${comparison.changedSampleRatioAbove2.toFixed(6)} exactHash=${comparison.exactPixelHashMatch}`);
const gpu = evidence.gpuMemoryComparison;
console.log(`L0/L1 GPU texture residency: L0=${gpu.l0EstimatedResidentBytes} L1=${gpu.l1EstimatedResidentBytes} delta=${gpu.incrementalEstimatedResidentBytes} lightmaps=${gpu.lightmapEstimatedResidentBytes}`);
for (const [mode, result] of Object.entries(evidence.candidateReadability)) {
  console.log(`${mode} readability: meanLuma=${result.meanDisplayLuma.toFixed(4)} dark<${result.lumaThreshold}=${result.darkSampleRatio.toFixed(4)} disposition=${result.automaticDisposition}`);
}

const normal = evidence.visualEvidence.materialResponses.normal;
const roughness = evidence.visualEvidence.materialResponses.roughness;
console.log(`normal response: meanAbs=${normal.meanAbsoluteChannelDifference.toFixed(4)} changed>2=${normal.changedSampleRatioAbove2.toFixed(6)}`);
console.log(`roughness response: meanAbs=${roughness.meanAbsoluteChannelDifference.toFixed(4)} changed>2=${roughness.changedSampleRatioAbove2.toFixed(6)}`);
if (normal.meanAbsoluteChannelDifference < Number(visual.normalResponse.minimumMeanAbsoluteChannelDifference) || normal.changedSampleRatioAbove2 < Number(visual.normalResponse.minimumChangedSampleRatioAbove2)) {
  console.error('normal map response is not visibly measurable under the bounded close witness');
  failed = true;
}
if (roughness.meanAbsoluteChannelDifference < Number(visual.roughnessResponse.minimumMeanAbsoluteChannelDifference) || roughness.changedSampleRatioAbove2 < Number(visual.roughnessResponse.minimumChangedSampleRatioAbove2)) {
  console.error('roughness response is not visibly measurable under the bounded medium witness');
  failed = true;
}
if (evidence.candidateReadability['L0-minimal-runtime'].automaticDisposition === 'reject-current-bake') {
  console.error('neutral L0 baseline is too dark for material visual evidence');
  failed = true;
}
if (failed) process.exit(1);
