import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');

const workflow = read('.github/workflows/manual-browser-qa.yml');
const playwright = read('playwright.config.mjs');
const homePlaywright = read('playwright.home-polish.config.mjs');
const homePolishSpec = read('qa/home-polish.spec.mjs');
const mobilePlatformsSpec = 'qa/mobile-platforms.spec.mjs';
const webkitHomeEntrypoint = 'qa/mobile-home-webkit.spec.mjs';
const isolatedWebKitSpec = 'qa/mobile-webkit-isolated.spec.mjs';
const isolatedWebKitHelpers = 'qa/mobile-webkit-isolated.helpers.mjs';
const opticalSpec = 'qa/brand-v19-optical.spec.mjs';
const microSpec = 'qa/brand-v19-micro.spec.mjs';

for (const spec of [mobilePlatformsSpec, webkitHomeEntrypoint, isolatedWebKitSpec, isolatedWebKitHelpers, opticalSpec, microSpec]) {
  assert.ok(fs.existsSync(path.resolve(spec)), `${spec}: browser QA file is missing`);
}
for (const spec of [mobilePlatformsSpec, webkitHomeEntrypoint, opticalSpec, microSpec]) {
  assert.ok(workflow.includes(spec), `${spec}: workflow entrypoint is not executed by Manual Browser QA`);
}

assert.match(workflow, /Run Chromium, Android Chrome and iPhone Safari QA/);
assert.match(workflow, /--config=playwright\.config\.mjs/);
assert.match(workflow, /--workers=1/);
assert.match(playwright, /failOnFlakyTests:\s*Boolean\(process\.env\.CI\)/);
assert.match(playwright, /retries:\s*process\.env\.CI\s*\?\s*1\s*:\s*0/);
assert.match(playwright, /mobile-home-webkit/);
assert.match(playwright, /mobile engine rendering, safe area, images and runtime/);
assert.match(playwright, /mobile dock, search sheet and tap targets remain usable/);
assert.match(playwright, /grepInvert:\s*\[/);
assert.match(playwright, /brand-v19-micro/);
assert.match(playwright, /brand-v19-optical/);
assert.match(homePlaywright, /failOnFlakyTests:\s*Boolean\(process\.env\.CI\)/);
assert.match(homePlaywright, /grepInvert:\s*\/real stepped scrolling reveals all principal homepage sections\//);

// Hero acceptance reads the CSS schedule once, yields on the Playwright side,
// and performs one final rendered-state read. This keeps the exact visual
// thresholds without repeated WebKit protocol polling.
assert.match(homePolishSpec, /animationDuration/);
assert.match(homePolishSpec, /animationDelay/);
assert.match(homePolishSpec, /maxTotalMs/);
assert.match(homePolishSpec, /const settleMs = Math\.max\(1_800, Math\.ceil\(timing\.maxTotalMs \+ 700\)\)/);
assert.match(homePolishSpec, /await page\.waitForTimeout\(settleMs\)/);
assert.match(homePolishSpec, /expect\(state\.opacity\)\.toBeGreaterThanOrEqual\(0\.995\)/);
assert.match(homePolishSpec, /expect\(state\.blurPx\)\.toBeLessThanOrEqual\(0\.05\)/);
assert.doesNotMatch(homePolishSpec, /hero blur reveal should remain visually final/);
assert.doesNotMatch(homePolishSpec, /page\.waitForFunction/);
assert.doesNotMatch(homePolishSpec, /getAnimations/);
assert.doesNotMatch(homePolishSpec, /activeAnimation/);

const mobilePlatforms = read(mobilePlatformsSpec);
assert.match(mobilePlatforms, /\['home', '\/'\]/);
assert.match(mobilePlatforms, /test\(`\$\{name\}: mobile engine rendering, safe area, images and runtime`/);
assert.match(mobilePlatforms, /collectGeometryLandmarks/);
assert.match(mobilePlatforms, /visitNativeWebKitLandmarks/);
assert.match(mobilePlatforms, /document\.scrollingElement/);
assert.match(mobilePlatforms, /expectStableChromeAtTop/);
assert.doesNotMatch(mobilePlatforms, /classList\.remove\(['"]chrome-hidden/);
assert.doesNotMatch(mobilePlatforms, /page\.mouse\.wheel/);

const webkitEntrypoint = read(webkitHomeEntrypoint);
const isolatedWebKit = read(isolatedWebKitSpec);
const isolatedHelpers = read(isolatedWebKitHelpers);
assert.match(webkitEntrypoint, /import '\.\/mobile-webkit-isolated\.spec\.mjs'/);
assert.match(isolatedWebKit, /WebKit home principal section \$\{section\.slug\} reveals in a fresh context/);
assert.match(isolatedWebKit, /one bounded WebKit document scroll per fresh page\/context/);
assert.match(isolatedWebKit, /WEBKIT_REVEAL_SETTLE_MS = 1_800/);
assert.match(isolatedWebKit, /await scrollLocatorIntoViewport\(page, surface, `\$\{section\.label\} reveal surface`\)/);
assert.match(isolatedWebKit, /await page\.waitForTimeout\(WEBKIT_REVEAL_SETTLE_MS\)/);
assert.match(isolatedWebKit, /const visual = await inspectRevealSurface\(surface\)/);
assert.match(isolatedWebKit, /expect\(visual\.effectiveOpacity/);
assert.match(isolatedWebKit, /expect\(visual\.blurPx/);
assert.match(isolatedWebKit, /WebKit home dock, search sheet and tap targets remain usable in a fresh context/);
assert.match(isolatedWebKit, /await expectDockInsideViewport\(page\)/);
assert.match(isolatedWebKit, /WebKit \$\{name\} route keeps one representative lazy landmark and runtime stable/);
assert.match(isolatedWebKit, /locateHomeRevealSurface/);
assert.match(isolatedWebKit, /data-qa-home-reveal-surface/);
assert.match(isolatedWebKit, /inspectRevealSurface/);
assert.match(isolatedWebKit, /Поэтов в базе/);
assert.match(isolatedWebKit, /Стихотворение дня/);
assert.match(isolatedWebKit, /Избранные авторы/);
assert.match(isolatedWebKit, /Вера, культура и/);
assert.match(isolatedWebKit, /fullPage:\s*false/);
assert.match(isolatedWebKit, /await gotoRoute\(page, route\);[\s\S]*await chooseRepresentativeLandmark\(page\)/);
assert.match(isolatedWebKit, /await gotoRoute\(page, route\);[\s\S]*expectDockInsideViewport\(page\)/);
assert.doesNotMatch(isolatedWebKit, /surface\.scrollIntoViewIfNeeded/);
assert.doesNotMatch(isolatedWebKit, /waitForStableRevealSurface/);
assert.doesNotMatch(isolatedWebKit, /verifyChromeReset/);
assert.doesNotMatch(isolatedWebKit, /WebKit home route keeps all principal sections/);
assert.doesNotMatch(isolatedWebKit, /fullPage:\s*true/);
assert.doesNotMatch(isolatedWebKit, /page\.mouse\.wheel/);
assert.doesNotMatch(isolatedWebKit, /effectiveOpacity\(target\)/);

assert.match(isolatedHelpers, /document\.scrollingElement/);
assert.match(isolatedHelpers, /scrollingElement\.scrollTop = scrollTop/);
assert.match(isolatedHelpers, /chooseRepresentativeLandmark/);
assert.match(isolatedHelpers, /data-qa-webkit-representative/);
assert.match(isolatedHelpers, /node\.classList\.contains\('sr-only'\)/);
assert.match(isolatedHelpers, /rect\.width > 2/);
assert.match(isolatedHelpers, /failedResilientImages/);
assert.match(isolatedHelpers, /visibleBusyRegions/);
assert.match(isolatedHelpers, /horizontalOverflow/);
assert.match(isolatedHelpers, /supportsSafeArea/);
assert.match(isolatedHelpers, /expectDockInsideViewport/);
assert.doesNotMatch(isolatedHelpers, /scrollIntoViewIfNeeded/);
assert.doesNotMatch(isolatedHelpers, /page\.mouse\.wheel/);
assert.doesNotMatch(isolatedHelpers, /classList\.remove\(['"]chrome-hidden/);

const optical = read(opticalSpec);
const micro = read(microSpec);
assert.match(optical, /brand-v19-optical-candidate-matrix\.png/);
assert.match(optical, /iphone-safari|testInfo\.project\.name/);
assert.match(optical, /occupiedWidth/);
assert.match(optical, /occupiedHeight/);
assert.match(micro, /brand-v19-micro-candidate-matrix\.png/);
assert.match(micro, /iphone-safari|testInfo\.project\.name/);

console.log('brand browser workflow: zero-flaky Chromium/Android plus deterministic bounded WebKit route, homepage, hero, optical and micro gates');
