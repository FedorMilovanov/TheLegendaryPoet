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
const webkitBaseRunner = read('scripts/run-webkit-process-isolated.mjs');
const webkitHomeRunner = read('scripts/run-webkit-home-reveal-process-isolated.mjs');
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
  'scripts/run-webkit-home-reveal-process-isolated.mjs',
  'scripts/run-home-polish-process-isolated.mjs',
  'qa/brand-v19-optical.spec.mjs',
  'qa/brand-v19-micro.spec.mjs',
]) assert.ok(exists(file), `${file}: browser QA file is missing`);

assert.match(workflow, /env:\s*[\s\S]*TESTED_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/);
assert.match(workflow, /jobs:\s*[\s\S]*browser-qa:/);
assert.match(workflow, /webkit-home-reveal-qa:/);
assert.match(workflow, /premium-home-qa:/);
assert.doesNotMatch(workflow, /\bneeds:/, 'all three acceptance jobs must execute independently');

const webkitMarker = '\n  webkit-home-reveal-qa:';
const premiumMarker = '\n  premium-home-qa:';
const webkitIndex = workflow.indexOf(webkitMarker);
const premiumIndex = workflow.indexOf(premiumMarker);
assert.ok(webkitIndex > 0, 'webkit-home-reveal-qa must be a separate top-level job');
assert.ok(premiumIndex > webkitIndex, 'premium-home-qa must be a separate top-level job after Safari home QA');
const coreJob = workflow.slice(0, webkitIndex);
const webkitHomeJob = workflow.slice(webkitIndex, premiumIndex);
const premiumJob = workflow.slice(premiumIndex);

assert.match(coreJob, /runs-on: ubuntu-latest/);
assert.match(coreJob, /timeout-minutes: 90/);
assert.match(coreJob, /Checkout exact browser tested head/);
assert.match(coreJob, /ref: \$\{\{ env\.TESTED_SHA \}\}/);
assert.match(coreJob, /Verify exact browser checkout identity/);
assert.match(coreJob, /test "\$actual" = "\$TESTED_SHA"/);
assert.match(coreJob, /Build production site/);
assert.match(coreJob, /Start production preview/);
assert.match(coreJob, /Run Chromium and Android Chrome QA/);
assert.match(coreJob, /--project=chromium-core/);
assert.match(coreJob, /--project=android-pixel7/);
assert.match(coreJob, /--workers=1/);
assert.match(coreJob, /Run base iPhone Safari QA in fresh browser processes/);
assert.match(coreJob, /node scripts\/run-webkit-process-isolated\.mjs/);
assert.doesNotMatch(coreJob, /run-webkit-home-reveal-process-isolated|run-home-polish-process-isolated/);
assert.doesNotMatch(coreJob, /--project=iphone-safari/);

assert.match(webkitHomeJob, /runs-on: ubuntu-latest/);
assert.match(webkitHomeJob, /timeout-minutes: 45/);
assert.match(webkitHomeJob, /Checkout exact Safari home tested head/);
assert.match(webkitHomeJob, /ref: \$\{\{ env\.TESTED_SHA \}\}/);
assert.match(webkitHomeJob, /Verify exact Safari home checkout identity/);
assert.match(webkitHomeJob, /test "\$actual" = "\$TESTED_SHA"/);
assert.match(webkitHomeJob, /Build Safari home production site/);
assert.match(webkitHomeJob, /Install isolated Safari home Playwright runtime/);
assert.match(webkitHomeJob, /npx playwright install --with-deps webkit/);
assert.match(webkitHomeJob, /Start Safari home production preview/);
assert.match(webkitHomeJob, /Run Safari home reveal and route QA on a fresh runner/);
assert.match(webkitHomeJob, /node scripts\/run-webkit-home-reveal-process-isolated\.mjs/);
assert.match(webkitHomeJob, /manual-browser-webkit-home-evidence-\$\{\{ env\.TESTED_SHA \}\}/);
assert.doesNotMatch(webkitHomeJob, /run-webkit-process-isolated|run-home-polish-process-isolated/);

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
assert.doesNotMatch(premiumJob, /run-webkit-(?:home-reveal-)?process-isolated/);

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
assert.match(isolatedHelpers, /node\.scrollIntoView\(\{ block: 'center', inline: 'nearest', behavior: 'instant' \}\)/);
assert.match(isolatedHelpers, /WEBKIT_VIEWPORT_SETTLE_MS = 700/);
assert.match(isolatedHelpers, /WEBKIT_MIN_STABLE_INTERSECTION = 0\.55/);
assert.match(isolatedHelpers, /intersectionRatio: \(intersectionWidth \/ visibleWidthBase\) \* \(intersectionHeight \/ visibleHeightBase\)/);
assert.match(isolatedHelpers, /await centerLocatorNatively\(target\);[\s\S]*await page\.waitForTimeout\(WEBKIT_VIEWPORT_SETTLE_MS\);[\s\S]*await centerLocatorNatively\(target\)/);
assert.match(isolatedHelpers, /first\.intersectionRatio < WEBKIT_MIN_STABLE_INTERSECTION/);
assert.match(isolatedHelpers, /second\.intersectionRatio >= WEBKIT_MIN_STABLE_INTERSECTION/);
assert.match(isolatedHelpers, /Math\.abs\(second\.centerDelta\) <= Math\.max\(64, second\.viewportHeight \* 0\.4\)/);
assert.match(isolatedHelpers, /chooseRepresentativeLandmark/);
assert.match(isolatedHelpers, /failedResilientImages/);
assert.match(isolatedHelpers, /visibleBusyRegions/);
assert.match(isolatedHelpers, /horizontalOverflow/);
assert.doesNotMatch(isolatedHelpers, /scrollIntoViewIfNeeded|page\.mouse\.wheel|classList\.remove\(['"]chrome-hidden|style\.opacity\s*=/);

assert.match(webkitBaseRunner, /spawnSync/);
assert.match(webkitBaseRunner, /--project=iphone-safari/);
assert.match(webkitBaseRunner, /--config=playwright\.config\.mjs/);
assert.match(webkitBaseRunner, /--workers=1/);
assert.match(webkitBaseRunner, /fresh-process base Safari contours passed/);
assert.doesNotMatch(webkitBaseRunner, /--retries(?:=|\s)/);
for (const contour of ['mobile-platforms', 'yesenin-part-one', 'optical-matrix', 'micro-matrix']) {
  assert.match(webkitBaseRunner, new RegExp(contour));
}
for (const route of ['home', 'articles', 'essay', 'poets', 'music', 'archive', 'ratings']) {
  assert.match(webkitBaseRunner, new RegExp(`hover-\\$\\{route\\}|${route} interactive artwork`));
}
assert.doesNotMatch(webkitBaseRunner, /home principal section|representative lazy landmark|home-dock-search/);

assert.match(webkitHomeRunner, /spawnSync/);
assert.match(webkitHomeRunner, /--project=iphone-safari/);
assert.match(webkitHomeRunner, /--config=playwright\.config\.mjs/);
assert.match(webkitHomeRunner, /--workers=1/);
assert.match(webkitHomeRunner, /fresh-process home and route Safari contours passed/);
assert.doesNotMatch(webkitHomeRunner, /--retries(?:=|\s)/);
for (const slug of ['poet-count', 'poem-of-day', 'featured-poets', 'faith-culture']) {
  assert.match(webkitHomeRunner, new RegExp(`home principal section ${slug}`));
}
for (const route of ['poets', 'ratings', 'articles', 'music', 'archive', 'about', 'not-found']) {
  assert.match(webkitHomeRunner, new RegExp(`route-\\$\\{route\\}|WebKit ${route} route`));
}
assert.match(webkitHomeRunner, /home dock, search sheet and tap targets/);
assert.doesNotMatch(webkitHomeRunner, /mobile-platforms|yesenin-part-one|hoverRoutes|brand-v19-optical|brand-v19-micro/);

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

console.log('brand browser workflow: exact-head Chromium/Android, base Safari, Safari home/route and premium acceptance execute on three independent hosted runners with native two-phase centering and zero-flaky enforcement');
