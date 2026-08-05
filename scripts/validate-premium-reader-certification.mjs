import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const expect = (condition, message) => { if (!condition) failures.push(message); };

const archiveJourneyPath = 'qa/reader-journeys.spec.mjs';
const premiumPath = 'qa/premium-reader-certification.spec.mjs';
expect(exists(archiveJourneyPath), `missing archive/longform W5 suite: ${archiveJourneyPath}`);
expect(exists(premiumPath), `missing premium W5 suite: ${premiumPath}`);

const archiveJourneys = exists(archiveJourneyPath) ? read(archiveJourneyPath) : '';
const premium = exists(premiumPath) ? read(premiumPath) : '';
const packageJson = JSON.parse(read('package.json'));
const playwright = read('playwright.config.mjs');
const manual = read('.github/workflows/manual-browser-qa.yml');
const baseWebkit = read('scripts/run-webkit-process-isolated.mjs');
const desktopWebkit = read('scripts/run-webkit-home-reveal-process-isolated.mjs');

for (const token of [
  'saved poem travels through archive search and returns to the exact poem',
  'blocked archive storage reports failure without dishonest success state',
  'citation focus reveals its source and keeps the longform readable',
]) {
  expect(archiveJourneys.includes(token), `archive/longform reader suite is missing: ${token}`);
}

for (const token of [
  'longform reader journey remains readable and returns through real navigation',
  'reduced-motion keyboard search keeps focus ownership and navigation continuity',
  'blocked browser storage leaves the shell honest and usable',
  'failed community write reports a durable queue instead of false success',
  'forced-colors keeps critical navigation and dialog controls available',
  "page.emulateMedia({ reducedMotion: 'reduce' })",
  "page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' })",
  "localStorage.getItem('tlp-community-feedback:v3')",
  'Storage.prototype',
  'reader certification offline write',
]) {
  expect(premium.includes(token), `premium reader suite is missing outcome contract: ${token}`);
}

expect(packageJson.scripts?.['validate:reader-certification'] === 'node scripts/validate-premium-reader-certification.mjs', 'package must expose validate:reader-certification');
expect(packageJson.scripts?.check?.includes('validate:reader-certification'), 'repository-wide check must include reader certification validation');

expect(playwright.includes('reader-journeys') && playwright.includes('premium-reader-certification'), 'mobile project matching must admit both W5 suites');
expect(playwright.includes("name: 'webkit-reader-desktop'"), 'Playwright config must expose a desktop WebKit W5 project');
expect(playwright.includes("browserName: 'webkit'"), 'desktop W5 project must use WebKit');
expect(playwright.includes("viewport: { width: 1440, height: 1000 }"), 'desktop WebKit W5 project must use the production desktop viewport');

for (const suite of [archiveJourneyPath, premiumPath]) {
  expect(manual.includes(suite), `core Manual Browser QA must run ${suite} on Chromium and Android`);
}
expect(manual.includes('--project=chromium-core') && manual.includes('--project=android-pixel7'), 'core W5 wiring must retain desktop Chromium and Android projects');
for (const [id, file] of [
  ['reader-journeys', archiveJourneyPath],
  ['premium-reader-certification', premiumPath],
]) {
  expect(baseWebkit.includes(`id: '${id}'`), `fresh-process iPhone suite must register ${id}`);
  expect(baseWebkit.includes(`file: '${file}'`), `fresh-process iPhone suite must execute ${file}`);
}
expect(desktopWebkit.includes("id: 'desktop-reader-certification'"), 'independent WebKit runner must run desktop premium certification');
expect(desktopWebkit.includes("project: 'webkit-reader-desktop'"), 'desktop premium certification must use the desktop WebKit project');
expect(desktopWebkit.includes(`file: '${premiumPath}'`), 'desktop WebKit process must execute the premium W5 suite');

const workflowFiles = fs.readdirSync(path.join(root, '.github', 'workflows')).filter((name) => /\.ya?ml$/i.test(name));
expect(!workflowFiles.some((name) => /reader|premium-browser-certification/i.test(name)), 'W5 must reuse existing runners instead of adding a duplicate workflow');

if (failures.length) {
  console.error('premium reader certification contract: FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('premium reader certification contract: OK (archive honesty, longform sources, Chromium desktop, Android, desktop WebKit, iPhone, reduced motion, blocked storage, failed writes and forced colors)');
