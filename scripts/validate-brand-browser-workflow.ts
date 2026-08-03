import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');

const workflow = read('.github/workflows/manual-browser-qa.yml');
const playwright = read('playwright.config.mjs');
const homePlaywright = read('playwright.home-polish.config.mjs');
const homePage = read('src/pages/HomePage.tsx');
const homePolishSpec = read('qa/home-polish.spec.mjs');
const mobilePlatformsSpec = 'qa/mobile-platforms.spec.mjs';
const webkitHomeEntrypoint = 'qa/mobile-home-webkit.spec.mjs';
const isolatedWebKitSpec = 'qa/mobile-webkit-isolated.spec.mjs';
const isolatedWebKitHelpers = 'qa/mobile-webkit-isolated.helpers.mjs';
const webkitProcessRunnerPath = 'scripts/run-webkit-process-isolated.mjs';
const homeProcessRunnerPath = 'scripts/run-home-polish-process-isolated.mjs';
const opticalSpec = 'qa/brand-v19-optical.spec.mjs';
const microSpec = 'qa/brand-v19-micro.spec.mjs';

for (const file of [
  mobilePlatformsSpec,
  webkitHomeEntrypoint,
  isolatedWebKitSpec,
  isolatedWebKitHelpers,
  webkitProcessRunnerPath,
  homeProcessRunnerPath,
  opticalSpec,
  microSpec,
]) {
  assert.ok(fs.existsSync(path.resolve(file)), `${file}: browser QA file is missing`);
}
for (const spec of [mobilePlatformsSpec, opticalSpec, microSpec]) {
  assert.ok(workflow.includes(spec), `${spec}: Chromium/Android workflow entrypoint is not executed`);
}

assert.match(workflow, /timeout-minutes:\s*90/);
assert.match(workflow, /Run Chromium and Android Chrome QA/);
assert.match(workflow, /--project=chromium-core/);
assert.match(workflow, /--project=android-pixel7/);
assert.match(workflow, /Run iPhone Safari QA in fresh browser processes/);
assert.match(workflow, /node scripts\/run-webkit-process-isolated\.mjs/);
assert.match(workflow, /node scripts\/run-home-polish-process-isolated\.mjs/);
assert.match(workflow, /set -o pipefail/);
assert.match(workflow, /tee home-polish\.log/);
assert.match(workflow, /--config=playwright\.config\.mjs/);
assert.match(workflow, /--workers=1/);
assert.doesNotMatch(workflow, /Run Chromium, Android Chrome and iPhone Safari QA/);
assert.doesNotMatch(workflow, /--project=iphone-safari/);

assert.match(playwright, /failOnFlakyTests:\s*Boolean\(process\.env\.CI\)/);
assert.match(playwright, /retries:\s*process\.env\.CI\s*\?\s*1\s*:\s*0/);
assert.match(playwright, /mobile-home-webkit/);
assert.match(playwright, /mobile engine rendering, safe area, images and runtime/);
assert.match(playwright, /mobile dock, search sheet and tap targets remain usable/);
assert.match(playwright, /grepInvert:\s*\[/);
assert.match(playwright, /brand-v19-micro/);
assert.match(playwright, /brand-v19-optical/);
assert.match(homePlaywright, /failOnFlakyTests:\s*Boolean\(process\.env\.CI\)/);
assert.match(homePlaywright, /retries:\s*process\.env\.CI\s*\?\s*1\s*:\s*0/);
assert.match(homePlaywright, /grepInvert:\s*\/real stepped scrolling reveals all principal homepage sections\//);

// Hero acceptance is event-driven. The interface publishes completion from
// the real CSS animation lifecycle and browser QA waits for that state before
// checking the final rendered opacity. This preserves the visual contract
// without schedule guessing or repeated cross-process computed-style polling.
assert.match(homePage, /data-hero-reveal-state/);
assert.match(homePage, /onAnimationEnd/);
assert.match(homePage, /markWordRevealed/);
assert.match(homePolishSpec, /data-hero-reveal-state/);
assert.match(homePolishSpec, /toHaveAttribute\('data-hero-reveal-state', 'ready'/);
assert.match(homePolishSpec, /toHaveCSS\('opacity', '1'\)/);
assert.doesNotMatch(homePolishSpec, /animationDuration/);
assert.doesNotMatch(homePolishSpec, /maxTotalMs/);
assert.doesNotMatch(homePolishSpec, /const settleMs/);
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

const webkitRunner = read(webkitProcessRunnerPath);
assert.match(webkitRunner, /spawnSync/);
assert.match(webkitRunner, /--project=iphone-safari/);
assert.match(webkitRunner, /--config=playwright\.config\.mjs/);
assert.match(webkitRunner, /--workers=1/);
assert.match(webkitRunner, /qa\/mobile-platforms\.spec\.mjs/);
assert.match(webkitRunner, /qa\/yesenin-part-one\.spec\.mjs/);
assert.match(webkitRunner, /qa\/brand-v19-optical\.spec\.mjs/);
assert.match(webkitRunner, /qa\/brand-v19-micro\.spec\.mjs/);
assert.match(webkitRunner, /qa\/hover-stability\.spec\.mjs/);
for (const slug of ['poet-count', 'poem-of-day', 'featured-poets', 'faith-culture']) {
  assert.match(webkitRunner, new RegExp(`home principal section ${slug}`));
}
for (const route of ['poets', 'ratings', 'articles', 'music', 'archive', 'about', 'not-found']) {
  assert.match(webkitRunner, new RegExp(`route-\\$\\{route\\}|WebKit ${route} route`));
}
assert.match(webkitRunner, /home dock, search sheet and tap targets remain usable/);
assert.match(webkitRunner, /fresh-process Safari contours passed/);
assert.doesNotMatch(webkitRunner, /--retries(?:=|\s)/);

const homeRunner = read(homeProcessRunnerPath);
assert.match(homeRunner, /spawnSync/);
assert.match(homeRunner, /home-desktop/);
assert.match(homeRunner, /home-pixel7/);
assert.match(homeRunner, /iphone-ambient/);
assert.match(homeRunner, /iphone-labels/);
assert.match(homeRunner, /iphone-first-viewport/);
assert.match(homeRunner, /iphone-reduced-motion/);
assert.match(homeRunner, /first viewport keeps six decoded portraits, crisp title and usable labels/);
assert.match(homeRunner, /reduced motion removes title, hero-root, window and decorative movement/);
assert.match(homeRunner, /--config=playwright\.home-polish\.config\.mjs/);
assert.match(homeRunner, /fresh-process premium contours passed/);
assert.doesNotMatch(homeRunner, /--retries(?:=|\s)/);

const optical = read(opticalSpec);
const micro = read(microSpec);
assert.match(optical, /brand-v19-optical-candidate-matrix\.png/);
assert.match(optical, /iphone-safari|testInfo\.project\.name/);
assert.match(optical, /occupiedWidth/);
assert.match(optical, /occupiedHeight/);
assert.match(micro, /brand-v19-micro-candidate-matrix\.png/);
assert.match(micro, /iphone-safari|testInfo\.project\.name/);

console.log('brand browser workflow: zero-flaky Chromium/Android plus event-driven hero readiness and fresh-process WebKit route, homepage, optical and micro gates');
