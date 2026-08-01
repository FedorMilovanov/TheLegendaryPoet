import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');

const workflow = read('.github/workflows/manual-browser-qa.yml');
const playwright = read('playwright.config.mjs');
const homePlaywright = read('playwright.home-polish.config.mjs');
const opticalSpec = 'qa/brand-v19-optical.spec.mjs';
const microSpec = 'qa/brand-v19-micro.spec.mjs';

for (const spec of [opticalSpec, microSpec]) {
  assert.ok(fs.existsSync(path.resolve(spec)), `${spec}: candidate browser spec is missing`);
  assert.ok(workflow.includes(spec), `${spec}: spec exists but is not executed by Manual Browser QA`);
}

assert.match(workflow, /Run Chromium, Android Chrome and iPhone Safari QA/);
assert.match(workflow, /--config=playwright\.config\.mjs/);
assert.match(workflow, /--workers=1/);
assert.match(playwright, /failOnFlakyTests:\s*Boolean\(process\.env\.CI\)/);
assert.match(playwright, /retries:\s*process\.env\.CI\s*\?\s*1\s*:\s*0/);
assert.match(playwright, /brand-v19-micro/);
assert.match(playwright, /brand-v19-optical/);
assert.match(homePlaywright, /failOnFlakyTests:\s*Boolean\(process\.env\.CI\)/);

const optical = read(opticalSpec);
const micro = read(microSpec);
assert.match(optical, /brand-v19-optical-candidate-matrix\.png/);
assert.match(optical, /iphone-safari|testInfo\.project\.name/);
assert.match(optical, /occupiedWidth/);
assert.match(optical, /occupiedHeight/);
assert.match(micro, /brand-v19-micro-candidate-matrix\.png/);
assert.match(micro, /iphone-safari|testInfo\.project\.name/);

console.log('brand browser workflow: full-size, optical and micro gates execute under zero-flaky Chromium/Android/WebKit QA');
