import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i]?.startsWith('--') || argv[i + 1] === undefined) throw new Error(`invalid args near ${argv[i] ?? '<end>'}`);
    result[argv[i].slice(2)] = argv[i + 1];
  }
  return result;
}

const args = parseArgs(process.argv.slice(2));
for (const required of ['strategy', 'asset', 'out']) if (!args[required]) throw new Error(`missing --${required}`);
if (args.strategy === 'L1_EXTERNAL_LIGHTMAP_UV1' && !args.lightmap) throw new Error('L1 requires --lightmap');

fs.mkdirSync(args.out, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const consoleErrors = [];
const pageErrors = [];
const variants = [
  { id: 'desktop', width: 960, height: 540 },
  { id: 'mobile', width: 390, height: 844 },
];
const witnesses = {};

try {
  for (const variant of variants) {
    const page = await browser.newPage({ viewport: { width: variant.width, height: variant.height }, deviceScaleFactor: 1 });
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(`[${variant.id}] ${message.text()}`); });
    page.on('pageerror', (error) => pageErrors.push(`[${variant.id}] ${error.message}`));
    const params = new URLSearchParams({ strategy: args.strategy, asset: `/${args.asset.replace(/^\/+/, '')}` });
    if (args.lightmap) params.set('lightmap', `/${args.lightmap.replace(/^\/+/, '')}`);
    const url = `http://127.0.0.1:4174/qa/hall-material-spike/viewer.html?${params.toString()}`;
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__HALL_SPIKE_READY__ !== undefined, null, { timeout: 30_000 });
    const witness = await page.evaluate(() => window.__HALL_SPIKE_READY__);
    if (!witness?.ok) throw new Error(`${variant.id} witness failed: ${witness?.error ?? 'unknown error'}`);
    witnesses[variant.id] = witness;
    await page.screenshot({ path: path.join(args.out, `${variant.id}.png`), fullPage: true });
    await page.close();
  }
} finally {
  await browser.close();
}

const report = { schemaVersion: 1, strategy: args.strategy, asset: args.asset, lightmap: args.lightmap ?? null, consoleErrors, pageErrors, witnesses };
fs.writeFileSync(path.join(args.out, 'browser-witness.json'), `${JSON.stringify(report, null, 2)}\n`);
if (consoleErrors.length || pageErrors.length) {
  console.error('Browser witness emitted errors:');
  for (const message of [...consoleErrors, ...pageErrors]) console.error(`- ${message}`);
  process.exit(1);
}
for (const [variant, witness] of Object.entries(witnesses)) {
  if (!witness?.assertions?.noRealtimeShadowCastingLights) throw new Error(`${variant}: realtime shadow-casting light detected`);
  if (witness.renderer?.postProcessingPasses !== 0) throw new Error(`${variant}: post-processing is not allowed in the spike`);
}
console.log(`Hall material spike browser witness passed for ${args.strategy}`);
