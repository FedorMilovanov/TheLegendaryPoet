import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');

const workflow = read('.github/workflows/manual-browser-qa.yml');
const playwright = read('playwright.config.mjs');
const homePlaywright = read('playwright.home-polish.config.mjs');
const mobilePlatformsSpec = 'qa/mobile-platforms.spec.mjs';
const webkitHomeSpec = 'qa/mobile-home-webkit.spec.mjs';
const opticalSpec = 'qa/brand-v19-optical.spec.mjs';
const microSpec = 'qa/brand-v19-micro.spec.mjs';

for (const spec of [mobilePlatformsSpec, webkitHomeSpec, opticalSpec, microSpec]) {
  assert.ok(fs.existsSync(path.resolve(spec)), `${spec}: browser spec is missing`);
  assert.ok(workflow.includes(spec), `${spec}: spec exists but is not executed by Manual Browser QA`);
}

assert.match(workflow, /Run Chromium, Android Chrome and iPhone Safari QA/);
assert.match(workflow, /--config=playwright\.config\.mjs/);
assert.match(workflow, /--workers=1/);
assert.match(playwright, /failOnFlakyTests:\s*Boolean\(process\.env\.CI\)/);
assert.match(playwright, /retries:\s*process\.env\.CI\s*\?\s*1\s*:\s*0/);
assert.match(playwright, /mobile-home-webkit/);
assert.doesNotMatch(playwright, /grepInvert:\s*genericHomeRouteAudit/);
assert.match(playwright, /brand-v19-micro/);
assert.match(playwright, /brand-v19-optical/);
assert.match(homePlaywright, /failOnFlakyTests:\s*Boolean\(process\.env\.CI\)/);

const mobilePlatforms = read(mobilePlatformsSpec);
const webkitHome = read(webkitHomeSpec);
assert.match(mobilePlatforms, /\['home', '\/'\]/);
assert.match(mobilePlatforms, /test\(`\$\{name\}: mobile engine rendering, safe area, images and runtime`/);
assert.match(mobilePlatforms, /testInfo\.project\.name === 'iphone-safari' && name === 'home'/);
assert.match(mobilePlatforms, /dedicated bounded WebKit home audit provides equivalent coverage/);
assert.match(mobilePlatforms, /visitNativeWebKitLandmarks/);
assert.match(mobilePlatforms, /scrollIntoViewIfNeeded/);
assert.match(mobilePlatforms, /page\.mouse\.wheel\(0, -100_000\)/);
assert.match(mobilePlatforms, /if \(nativeWebKit\)/);

assert.match(webkitHome, /WebKit home route keeps lazy content, runtime and mobile chrome stable/);
assert.match(webkitHome, /test\.skip\(testInfo\.project\.name !== 'iphone-safari'/);
assert.match(webkitHome, /strategic lazy-content landmarks/);
assert.match(webkitHome, /bounded WebKit scroll landmarks/);
assert.match(webkitHome, /scrollIntoViewIfNeeded/);
assert.match(webkitHome, /page\.mouse\.wheel\(0, -100_000\)/);
assert.doesNotMatch(webkitHome, /window\.scrollTo\s*\(/);
assert.match(webkitHome, /failedResilientImages/);
assert.match(webkitHome, /visibleBusyRegions/);
assert.match(webkitHome, /horizontalOverflow/);
assert.match(webkitHome, /supportsSafeArea/);
assert.match(webkitHome, /expectDockInsideViewport/);
assert.match(webkitHome, /runtime\.pageErrors/);
assert.match(webkitHome, /runtime\.consoleErrors/);
assert.match(webkitHome, /runtime\.localRequestFailures/);

const optical = read(opticalSpec);
const micro = read(microSpec);
assert.match(optical, /brand-v19-optical-candidate-matrix\.png/);
assert.match(optical, /iphone-safari|testInfo\.project\.name/);
assert.match(optical, /occupiedWidth/);
assert.match(optical, /occupiedHeight/);
assert.match(micro, /brand-v19-micro-candidate-matrix\.png/);
assert.match(micro, /iphone-safari|testInfo\.project\.name/);

console.log('brand browser workflow: full-size, optical, micro and bounded equivalent WebKit home gates execute under zero-flaky Chromium/Android/WebKit QA');