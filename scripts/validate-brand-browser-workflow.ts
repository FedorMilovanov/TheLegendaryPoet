import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');
const exists = (file: string) => fs.existsSync(path.resolve(file));
const workflow = read('.github/workflows/manual-browser-qa.yml');

for (const file of [
  '.github/workflows/manual-browser-qa.yml',
  'playwright.config.mjs',
  'playwright.home-polish.config.mjs',
  'qa/brand-emblem.spec.mjs',
  'qa/brand-reference-comparison.spec.mjs',
  'qa/mobile-platforms.spec.mjs',
  'qa/mobile-home-webkit.spec.mjs',
  'qa/mobile-webkit-isolated.spec.mjs',
  'scripts/run-webkit-process-isolated.mjs',
  'scripts/run-webkit-home-reveal-process-isolated.mjs',
  'scripts/run-home-polish-process-isolated.mjs',
  'scripts/run-home-polish-iphone-critical-process-isolated.mjs',
]) assert.ok(exists(file), `${file}: browser QA file is missing`);

assert.match(workflow, /TESTED_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/);
for (const job of ['browser-qa', 'webkit-home-reveal-qa', 'premium-home-qa', 'premium-iphone-critical-qa']) {
  assert.match(workflow, new RegExp(`\\n  ${job}:`), `${job}: independent job missing`);
}
assert.doesNotMatch(workflow, /\bneeds:/, 'browser acceptance jobs must remain independent');

for (const token of [
  'Checkout exact browser tested head',
  'Verify exact browser checkout identity',
  'Build production site',
  'Run Chromium and Android Chrome QA',
  'qa/brand-emblem.spec.mjs',
  'qa/brand-reference-comparison.spec.mjs',
  '--project=chromium-core',
  '--project=android-pixel7',
  '--workers=1',
  'Run base iPhone Safari QA in fresh browser processes',
  'node scripts/run-webkit-process-isolated.mjs',
  'Run Safari home reveal and route QA on a fresh runner',
  'node scripts/run-webkit-home-reveal-process-isolated.mjs',
  'Run standard premium homepage and pointer-performance matrix on a fresh runner',
  'node scripts/run-home-polish-process-isolated.mjs',
  'Run critical iPhone first-viewport and reduced-motion contours on a fresh runner',
  'node scripts/run-home-polish-iphone-critical-process-isolated.mjs',
]) assert.ok(workflow.includes(token), `manual browser workflow missing ${token}`);

assert.doesNotMatch(workflow, /brand-v19|brand-v20|brand-emblem\.svg|brand-mark-micro\.svg|brand-emblem-mask\.svg/i);

const playwright = read('playwright.config.mjs');
assert.match(playwright, /failOnFlakyTests:\s*Boolean\(process\.env\.CI\)/);
assert.match(playwright, /retries:\s*process\.env\.CI\s*\?\s*1\s*:\s*0/);

for (const runner of [
  'scripts/run-webkit-process-isolated.mjs',
  'scripts/run-webkit-home-reveal-process-isolated.mjs',
  'scripts/run-home-polish-process-isolated.mjs',
  'scripts/run-home-polish-iphone-critical-process-isolated.mjs',
]) {
  const source = read(runner);
  assert.match(source, /spawnSync/);
  assert.doesNotMatch(source, /--retries(?:=|\s)/);
  assert.doesNotMatch(source, /brand-v19|brand-v20/i);
}

console.log('brand browser workflow: exact-head Chromium, Android, Safari, premium and critical iPhone coverage is raster-only and zero-flaky');
