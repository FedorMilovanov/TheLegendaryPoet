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
const modes = ['L0-minimal-runtime', 'L1-external-lightmap'];
const evidence = {
  schemaVersion: 1,
  laneId: 'TLP-HALL-001',
  phase: 'materialLightingExportSpike',
  modes: {},
};

const browser = await chromium.launch({ headless: true });
try {
  for (const mode of modes) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    page.on('console', (message) => {
      if (message.type() === 'error') pageErrors.push(message.text());
    });
    await page.goto(`${baseUrl}/?mode=${encodeURIComponent(mode)}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__HALL_SPIKE__?.loadComplete === true, null, { timeout: 30000 });
    const metrics = await page.evaluate(() => window.__HALL_SPIKE__);
    metrics.errors = [...new Set([...(metrics.errors ?? []), ...pageErrors])];
    evidence.modes[mode] = metrics;
    await page.screenshot({ path: path.join(outputDir, `${mode}.png`), fullPage: true });
    await page.close();
  }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(outputDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
let failed = false;
for (const [mode, metrics] of Object.entries(evidence.modes)) {
  if (!metrics.loadComplete || metrics.drawCalls <= 0 || metrics.triangles <= 0 || metrics.errors.length > 0) {
    console.error(`${mode} failed browser witness`, metrics);
    failed = true;
  } else {
    console.log(`${mode}: calls=${metrics.drawCalls} triangles=${metrics.triangles} textures=${metrics.textures} programs=${metrics.programs} raw=${metrics.rawBytes} optimized=${metrics.optimizedBytes}`);
  }
}
if (failed) process.exit(1);
