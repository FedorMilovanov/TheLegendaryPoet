import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));

const actionPaths = [
  '.github/actions/setup-node-deps/action.yml',
  '.github/actions/install-build-tools/action.yml',
  '.github/actions/install-playwright/action.yml',
  '.github/actions/start-preview/action.yml',
];
for (const actionPath of actionPaths) expect(exists(actionPath), `missing reusable workflow primitive: ${actionPath}`);

const packageJson = JSON.parse(read('package.json'));
expect(packageJson.devDependencies?.['@playwright/test'] === '1.61.1', 'Playwright test runtime must remain exactly locked to 1.61.1');
expect(!exists('.github/workflows/community-scaling-browser.yml'), 'standalone community browser workflow must remain retired after consolidation');

const manual = read('.github/workflows/manual-browser-qa.yml');
const webkitRunner = read('scripts/run-webkit-process-isolated.mjs');
const playwrightConfig = read('playwright.config.mjs');
const archiveStore = read('src/utils/myArchiveStore.ts');
const poemCard = read('src/components/poet-detail/PoemCard.tsx');
const readerJourneys = read('qa/reader-journeys.spec.mjs');
const ci = read('.github/workflows/ci.yml');
const buildValidator = read('scripts/validate-build-output.ts');
const routeContract = JSON.parse(read('src/routes/route-contract.json'));

for (const primitive of [
  './.github/actions/setup-node-deps',
  './.github/actions/install-build-tools',
  './.github/actions/install-playwright',
  './.github/actions/start-preview',
]) {
  expect(manual.includes(primitive), `Manual Browser QA must use ${primitive}`);
}
expect((manual.match(/\.\/\.github\/actions\/setup-node-deps/g) ?? []).length === 4, 'all four Manual Browser jobs must share exact Node dependency setup');
expect((manual.match(/\.\/\.github\/actions\/install-build-tools/g) ?? []).length === 4, 'all four Manual Browser jobs must share deterministic build tools setup');
expect((manual.match(/\.\/\.github\/actions\/install-playwright/g) ?? []).length === 4, 'all four Manual Browser jobs must share locked Playwright installation');
expect((manual.match(/\.\/\.github\/actions\/start-preview/g) ?? []).length === 4, 'all four Manual Browser jobs must share preview readiness');

for (const forbidden of [
  'actions/setup-node@v4',
  'npm install --no-save',
  '@playwright/test@1.54.1',
  'sudo apt-get update',
  'npx playwright install --with-deps',
  'npm run preview -- --host',
]) {
  expect(!manual.includes(forbidden), `Manual Browser QA reintroduced duplicated primitive: ${forbidden}`);
}

const preservedSuites = [
  'qa/manual-e2e.spec.mjs',
  'qa/focused-interactions.spec.mjs',
  'qa/deep-routes.spec.mjs',
  'qa/floating-chrome.spec.mjs',
  'qa/mobile-platforms.spec.mjs',
  'qa/community-request-topology.spec.mjs',
  'qa/reader-journeys.spec.mjs',
  'qa/yesenin-part-one.spec.mjs',
  'qa/brand-emblem.spec.mjs',
  'qa/brand-reference-comparison.spec.mjs',
  'qa/hover-stability.spec.mjs',
  'qa/essay-lightbox-overlay.spec.mjs',
  'scripts/run-webkit-process-isolated.mjs',
  'scripts/run-webkit-home-reveal-process-isolated.mjs',
  'scripts/run-home-polish-process-isolated.mjs',
  'scripts/run-home-polish-iphone-critical-process-isolated.mjs',
];
for (const suite of preservedSuites) expect(manual.includes(suite), `Manual Browser QA lost acceptance contour: ${suite}`);
expect(webkitRunner.includes("id: 'community-request-topology'"), 'base iPhone Safari suite must retain community request topology');
expect(webkitRunner.includes("file: 'qa/community-request-topology.spec.mjs'"), 'base iPhone Safari suite must execute the shared community topology file');
expect(webkitRunner.includes("id: 'reader-journeys'"), 'base iPhone Safari suite must retain reader outcome journeys');
expect(webkitRunner.includes("file: 'qa/reader-journeys.spec.mjs'"), 'base iPhone Safari suite must execute the shared reader journey file');
expect(playwrightConfig.includes('reader-journeys'), 'Android and iPhone project matching must include reader journeys');

for (const token of [
  "ArchiveMutationStatus = 'added' | 'removed' | 'unchanged' | 'failed' | 'invalid'",
  "status: 'failed'",
  'favorite: existing',
]) {
  expect(archiveStore.includes(token), `archive mutation contract is missing: ${token}`);
}
expect(poemCard.includes('Не удалось изменить архив'), 'poem favorite UI must report blocked archive storage honestly');
for (const outcome of [
  'saved poem travels through archive search and returns to the exact poem',
  'blocked archive storage reports failure without dishonest success state',
  'citation focus reveals its source and keeps the longform readable',
]) {
  expect(readerJourneys.includes(outcome), `reader outcome suite is missing: ${outcome}`);
}

expect(ci.includes('./.github/actions/setup-node-deps'), 'CI must use the shared Node dependency setup');
expect(ci.includes('./.github/actions/install-build-tools'), 'CI must use the shared deterministic build tools setup');
expect(ci.includes('dist/build-budget-report.json'), 'CI must retain the machine-readable build budget report');

for (const token of [
  'ENTRY_BUDGET_BYTES = 665_000',
  'SINGLE_JS_BUDGET_BYTES = 665_000',
  'TOTAL_JS_BUDGET_BYTES = 1_800_000',
  'TOTAL_CSS_BUDGET_BYTES = 300_000',
  'src/routes/route-contract.json',
  'build-budget-report.json',
]) {
  expect(buildValidator.includes(token), `build budget contract is missing: ${token}`);
}

const expectedRouteBudgets = new Map([
  ['src/pages/HomePage.tsx', 32_000],
  ['src/pages/EssayPage.tsx', 58_000],
  ['src/pages/PoetDetailPage.tsx', 52_000],
  ['src/pages/RatingsPage.tsx', 34_000],
]);
for (const [modulePath, budgetBytes] of expectedRouteBudgets) {
  const route = routeContract.routes?.find((candidate) => candidate.module === modulePath);
  expect(Boolean(route), `route contract is missing budget owner: ${modulePath}`);
  expect(route?.budgetBytes === budgetBytes, `route contract budget drifted for ${modulePath}: expected ${budgetBytes}, found ${route?.budgetBytes}`);
}

const workflowDir = path.join(root, '.github', 'workflows');
const workflowTexts = fs.readdirSync(workflowDir)
  .filter((name) => /\.ya?ml$/i.test(name))
  .map((name) => [name, fs.readFileSync(path.join(workflowDir, name), 'utf8')]);
const inventory = {
  workflows: workflowTexts.length,
  setupNode: workflowTexts.reduce((sum, [, text]) => sum + (text.match(/actions\/setup-node@v4/g) ?? []).length, 0),
  npmCi: workflowTexts.reduce((sum, [, text]) => sum + (text.match(/\bnpm ci\b/g) ?? []).length, 0),
  aptInstall: workflowTexts.reduce((sum, [, text]) => sum + (text.match(/apt-get install/g) ?? []).length, 0),
  previewLoops: workflowTexts.reduce((sum, [, text]) => sum + (text.match(/npm run preview -- --host/g) ?? []).length, 0),
  playwrightInstalls: workflowTexts.reduce((sum, [, text]) => sum + (text.match(/npx playwright install/g) ?? []).length, 0),
  localActionUses: workflowTexts.reduce((sum, [, text]) => sum + (text.match(/uses: \.\/\.github\/actions\//g) ?? []).length, 0),
};

if (failures.length) {
  console.error('workflow consolidation contract: FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(`inventory=${JSON.stringify(inventory)}`);
  process.exit(1);
}

console.log(`workflow consolidation contract: OK ${JSON.stringify(inventory)}`);
