import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');
const exists = (file: string) => fs.existsSync(path.resolve(file));
const workflowPath = '.github/workflows/manual-browser-qa.yml';
const workflow = read(workflowPath);
const playwright = read('playwright.config.mjs');
const homePlaywright = read('playwright.home-polish.config.mjs');
const homePolishSpec = read('qa/home-polish.spec.mjs');
const mobilePlatforms = read('qa/mobile-platforms.spec.mjs');
const webkitEntrypoint = read('qa/mobile-home-webkit.spec.mjs');
const isolatedWebKit = read('qa/mobile-webkit-isolated.spec.mjs');
const isolatedHelpers = read('qa/mobile-webkit-isolated.helpers.mjs');
const webkitRunner = read('scripts/run-webkit-process-isolated.mjs');
const homeRunner = read('scripts/run-home-polish-process-isolated.mjs');
const optical = read('qa/brand-v19-optical.spec.mjs');
const micro = read('qa/brand-v19-micro.spec.mjs');

for (const file of [
  workflowPath,
  'playwright.config.mjs',
  'playwright.home-polish.config.mjs',
  'qa/home-polish.spec.mjs',
  'qa/mobile-platforms.spec.mjs',
  'qa/mobile-home-webkit.spec.mjs',
  'qa/mobile-webkit-isolated.spec.mjs',
  'qa/mobile-webkit-isolated.helpers.mjs',
  'scripts/run-webkit-process-isolated.mjs',
  'scripts/run-home-polish-process-isolated.mjs',
  'qa/brand-v19-optical.spec.mjs',
  'qa/brand-v19-micro.spec.mjs',
]) assert.ok(exists(file), `${file}: browser QA file is missing`);

assert.match(workflow, /env:\s*[\s\S]*TESTED_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/);
assert.match(workflow, /jobs:\s*[\s\S]*browser-qa:/);
assert.match(workflow, /premium-home-qa:/);
const premiumMarker = '\n  premium-home-qa:';
const premiumIndex = workflow.indexOf(premiumMarker);
assert.ok(premiumIndex > 0, 'premium-home-qa must be a separate top-level job');
const coreJob = workflow.slice(0, premiumIndex);
const premiumJob = workflow.slice(premiumIndex);

assert.match(coreJob, /runs-on: ubuntu-latest/);
assert.match(coreJob, /timeout-minutes: 90/);
assert.match(coreJob, /Checkout exact browser tested head/);
assert.match(coreJob, /ref: \$\{\{ env\.TESTED_SHA \}\}/);
assert.match(coreJob, /Verify exact browser checkout identity/);
assert.match(coreJob, /test "\$actual" = "\$TESTED_SHA"/);
assert.match(coreJob, /Run Chromium and Android Chrome QA/);
assert.match(coreJob, /--project=chromium-core/);
assert.match(coreJob, /--project=android-pixel7/);
assert.match(coreJob, /--workers=1/);
assert.match(coreJob, /Run iPhone Safari QA in fresh browser processes/);
assert.match(coreJob, /node scripts\/run-webkit-process-isolated\.mjs/);
assert.doesNotMatch(coreJob, /run-home-polish-process-isolated/);
assert.doesNotMatch(coreJob, /--project=iphone-safari/);

assert.match(premiumJob, /runs-on: ubuntu-latest/);
assert.match(premiumJob, /timeout-minutes: 45/);
assert.match(premiumJob, /Checkout exact premium tested head/);
assert.match(premiumJob, /ref: \$\{\{ env\.TESTED_SHA \}\}/);
assert.match(premiumJob, /Verify exact premium checkout identity/);
assert.match(premiumJob, /test "\$actual" = "\$TESTED_SHA"/);
assert.match(premiumJob, /Build premium production site/);
assert.match(premiumJob, /Install isolated premium Playwright runtime/);
assert.match(premiumJob, /Start premium production preview/);
assert.match(premiumJob, /Run dedicated premium homepage and pointer-performance matrix on a fresh runner/);
assert.match(premiumJob, /node scripts\/run-home-polish-process-isolated\.mjs/);
assert.match(premiumJob, /set -o pipefail/);
assert.match(premiumJob, /tee home-polish\.log/);
assert.match(premiumJob, /manual-browser-premium-evidence-\$\{\{ env\.TESTED_SHA \}\}/);
assert.doesNotMatch(premiumJob, /run-webkit-process-isolated/);
assert.doesNotMatch(workflow, /needs:\s*browser-qa/,
  'premium acceptance must execute independently rather than being skipped after a core-job failure');

for (const spec of [
  'qa/mobile-platforms.spec.mjs',
  'qa/brand-v19-optical.spec.mjs',
  'qa/brand-v19-micro.spec.mjs',
]) assert.ok(coreJob.includes(spec), `${spec}: Chromium/Android workflow entrypoint is not executed`);

assert.match(playwright, /failOnFlakyTests:\s*Boolean\(process\.env\.CI\)/);
assert.match(playwright, /retries:\s*process\.env\.CI\s*\?\s*1\s*:\s*0/);
assert.match(playwright, /mobile-home-webkit/);
assert.match(playwright, /grepInvert:\s*\[/);
assert.match(playwright, /brand-v19-micro/);
assert.match(playwright, /brand-v19-optical/);
assert.match(homePlaywright, /failOnFlakyTests:\s*Boolean\(process\.env\.CI\)/);
assert.match(homePlaywright, /retries:\s*process\.env\.CI\s*\?\s*1\s*:\s*0/);
assert.match(homePlaywright, /grepInvert:\s*\/real stepped scrolling reveals all principal homepage sections\//);

assert.match(homePolishSpec, /animationDuration/);
assert.match(homePolishSpec, /animationDelay/);
assert.match(homePolishSpec, /maxTotalMs/);
assert.match(homePolishSpec, /const settleMs = Math\.max\(1_800, Math\.ceil\(timing\.maxTotalMs \+ 700\)\)/);
assert.match(homePolishSpec, /await page\.waitForTimeout\(settleMs\)/);
assert.match(homePolishSpec, /expect\(state\.opacity\)\.toBeGreaterThanOrEqual\(0\.995\)/);
assert.match(homePolishSpec, /expect\(state\.blurPx\)\.toBeLessThanOrEqual\(0\.05\)/);
assert.doesNotMatch(homePolishSpec, /page\.waitForFunction|getAnimations|activeAnimation/);

assert.match(mobilePlatforms, /\['home', '\/'\]/);
assert.match(mobilePlatforms, /collectGeometryLandmarks/);
assert.match(mobilePlatforms, /visitNativeWebKitLandmarks/);
assert.match(mobilePlatforms, /document\.scrollingElement/);
assert.match(mobilePlatforms, /expectStableChromeAtTop/);
assert.doesNotMatch(mobilePlatforms, /classList\.remove\(['"]chrome-hidden|page\.mouse\.wheel/);

assert.match(webkitEntrypoint, /import '\.\/mobile-webkit-isolated\.spec\.mjs'/);
assert.match(isolatedWebKit, /fresh context/);
assert.match(isolatedWebKit, /WEBKIT_REVEAL_SETTLE_MS = 1_800/);
assert.match(isolatedWebKit, /await page\.waitForTimeout\(WEBKIT_REVEAL_SETTLE_MS\)/);
assert.match(isolatedWebKit, /expectDockInsideViewport/);
assert.match(isolatedWebKit, /data-qa-home-reveal-surface/);
assert.match(isolatedWebKit, /fullPage:\s*false/);
assert.doesNotMatch(isolatedWebKit, /surface\.scrollIntoViewIfNeeded|waitForStableRevealSurface|page\.mouse\.wheel|fullPage:\s*true/);
assert.match(isolatedHelpers, /document\.scrollingElement/);
assert.match(isolatedHelpers, /scrollingElement\.scrollTop = scrollTop/);
assert.match(isolatedHelpers, /chooseRepresentativeLandmark/);
assert.match(isolatedHelpers, /failedResilientImages/);
assert.match(isolatedHelpers, /visibleBusyRegions/);
assert.match(isolatedHelpers, /horizontalOverflow/);
assert.doesNotMatch(isolatedHelpers, /scrollIntoViewIfNeeded|page\.mouse\.wheel|classList\.remove\(['"]chrome-hidden/);

assert.match(webkitRunner, /spawnSync/);
assert.match(webkitRunner, /--project=iphone-safari/);
assert.match(webkitRunner, /--config=playwright\.config\.mjs/);
assert.match(webkitRunner, /--workers=1/);
assert.match(webkitRunner, /fresh-process Safari contours passed/);
assert.doesNotMatch(webkitRunner, /--retries(?:=|\s)/);
for (const slug of ['poet-count', 'poem-of-day', 'featured-poets', 'faith-culture']) {
  assert.match(webkitRunner, new RegExp(`home principal section ${slug}`));
}
for (const route of ['poets', 'ratings', 'articles', 'music', 'archive', 'about', 'not-found']) {
  assert.match(webkitRunner, new RegExp(`route-\\$\\{route\\}|WebKit ${route} route`));
}

assert.match(homeRunner, /spawnSync/);
for (const contour of ['home-desktop', 'home-pixel7', 'iphone-ambient', 'iphone-labels', 'iphone-first-viewport', 'iphone-reduced-motion']) {
  assert.match(homeRunner, new RegExp(contour));
}
assert.match(homeRunner, /--config=playwright\.home-polish\.config\.mjs/);
assert.match(homeRunner, /fresh-process premium contours passed/);
assert.doesNotMatch(homeRunner, /--retries(?:=|\s)/);

assert.match(optical, /brand-v19-optical-candidate-matrix\.png/);
assert.match(optical, /iphone-safari|testInfo\.project\.name/);
assert.match(optical, /occupiedWidth/);
assert.match(micro, /brand-v19-micro-candidate-matrix\.png/);
assert.match(micro, /iphone-safari|testInfo\.project\.name/);

console.log('brand browser workflow: exact-head core and premium jobs use separate hosted runners; zero-flaky Chromium/Android, fresh-process Safari and premium contours remain mandatory');
