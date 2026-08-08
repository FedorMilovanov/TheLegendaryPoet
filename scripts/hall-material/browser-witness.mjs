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
fs.mkdirSync(outputDir, { recursive: true });

const cases = [
  { key: 'rawL0', asset: 'raw', mode: 'L0-minimal-runtime', screenshot: 'raw-L0-minimal-runtime.png' },
  { key: 'optimizedL0', asset: 'optimized', mode: 'L0-minimal-runtime', screenshot: 'optimized-L0-minimal-runtime.png' },
  { key: 'optimizedL1', asset: 'optimized', mode: 'L1-external-lightmap', screenshot: 'optimized-L1-external-lightmap.png' },
];
const evidence = {
  schemaVersion: 1,
  laneId: 'TLP-HALL-001',
  phase: 'materialLightingExportSpike',
  modes: {},
  rawControl: null,
  optimizationVisualEquivalence: null,
};

function compareSamples(rawBase64, optimizedBase64) {
  const raw = Buffer.from(rawBase64, 'base64');
  const optimized = Buffer.from(optimizedBase64, 'base64');
  if (raw.length !== optimized.length || raw.length === 0) throw new Error(`pixel sample length mismatch ${raw.length} != ${optimized.length}`);
  let absoluteSum = 0;
  let maxDifference = 0;
  let changedAbove2 = 0;
  for (let index = 0; index < raw.length; index += 1) {
    const difference = Math.abs(raw[index] - optimized[index]);
    absoluteSum += difference;
    maxDifference = Math.max(maxDifference, difference);
    if (difference > 2) changedAbove2 += 1;
  }
  return {
    sampleBytes: raw.length,
    meanAbsoluteChannelDifference: absoluteSum / raw.length,
    maximumChannelDifference: maxDifference,
    changedSampleRatioAbove2: changedAbove2 / raw.length,
    rawPixelHash: evidence.rawControl.pixelHash,
    optimizedPixelHash: evidence.modes['L0-minimal-runtime'].pixelHash,
    exactPixelHashMatch: evidence.rawControl.pixelHash === evidence.modes['L0-minimal-runtime'].pixelHash,
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
} finally {
  await browser.close();
}

if (!evidence.rawControl || !evidence.modes['L0-minimal-runtime']) throw new Error('missing raw/optimized L0 comparison witnesses');
evidence.optimizationVisualEquivalence = compareSamples(
  evidence.rawControl.pixelSampleBase64,
  evidence.modes['L0-minimal-runtime'].pixelSampleBase64,
);

fs.writeFileSync(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
let failed = false;
const allMetrics = [evidence.rawControl, ...Object.values(evidence.modes)];
for (const metrics of allMetrics) {
  if (!metrics.loadComplete || metrics.drawCalls <= 0 || metrics.triangles <= 0 || metrics.errors.length > 0 || !metrics.pixelHash || !metrics.pixelSampleBase64) {
    console.error(`${metrics.asset}/${metrics.mode} failed browser witness`, metrics);
    failed = true;
  } else {
    console.log(`${metrics.asset}/${metrics.mode}: calls=${metrics.drawCalls} triangles=${metrics.triangles} textures=${metrics.textures} programs=${metrics.programs} raw=${metrics.rawBytes} optimized=${metrics.optimizedBytes} pixel=${metrics.pixelHash.slice(0, 12)}`);
  }
}
const comparison = evidence.optimizationVisualEquivalence;
console.log(`raw/optimized L0: meanAbs=${comparison.meanAbsoluteChannelDifference.toFixed(4)} max=${comparison.maximumChannelDifference} changed>2=${comparison.changedSampleRatioAbove2.toFixed(6)} exactHash=${comparison.exactPixelHashMatch}`);
if (failed) process.exit(1);
