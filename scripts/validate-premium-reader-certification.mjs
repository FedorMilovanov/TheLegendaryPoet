import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const expect = (condition, message) => { if (!condition) failures.push(message); };

const specPath = 'qa/premium-reader-certification.spec.mjs';
const casesPath = 'qa/premium-reader-certification.cases.mjs';
expect(exists(specPath), `missing W5 entrypoint: ${specPath}`);
expect(exists(casesPath), `missing W5 shared cases: ${casesPath}`);

const spec = exists(specPath) ? read(specPath) : '';
const cases = exists(casesPath) ? read(casesPath) : '';
const topologyEntry = read('qa/community-request-topology.spec.mjs');
const packageJson = JSON.parse(read('package.json'));
const playwright = read('playwright.config.mjs');
const manual = read('.github/workflows/manual-browser-qa.yml');
const baseWebkit = read('scripts/run-webkit-process-isolated.mjs');
const homeWebkit = read('scripts/run-webkit-home-reveal-process-isolated.mjs');

expect(spec.includes('registerPremiumReaderCertificationTests'), 'W5 entrypoint must register the shared cases');
expect(topologyEntry.includes('registerPremiumReaderCertificationTests'), 'mandatory community topology entrypoint must register W5 for Chromium, Android and iPhone');

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
  expect(cases.includes(token), `W5 certification cases are missing outcome contract: ${token}`);
}

expect(packageJson.scripts?.['validate:reader-certification'] === 'node scripts/validate-premium-reader-certification.mjs', 'package must expose validate:reader-certification');
expect(packageJson.scripts?.check?.includes('validate:reader-certification'), 'repository-wide check must include reader certification wiring validation');

expect(playwright.includes('premium-reader-certification'), 'main Playwright config must admit the W5 suite');
expect(playwright.includes("name: 'webkit-reader-desktop'"), 'Playwright config must expose a desktop WebKit W5 project');
expect(playwright.includes("browserName: 'webkit'"), 'desktop WebKit W5 project must use WebKit');
expect(playwright.includes("viewport: { width: 1440, height: 1000 }"), 'desktop WebKit W5 project must use the production desktop viewport');

expect(manual.includes('qa/community-request-topology.spec.mjs'), 'core Manual Browser QA must retain the shared topology/W5 entrypoint');
expect(manual.includes('--project=chromium-core') && manual.includes('--project=android-pixel7'), 'core W5 wiring must retain Chromium desktop and Android projects');
expect(baseWebkit.includes("id: 'community-request-topology'"), 'fresh-process base iPhone suite must retain the shared topology/W5 entrypoint');
expect(baseWebkit.includes("file: 'qa/community-request-topology.spec.mjs'"), 'fresh-process base iPhone suite must point to the shared topology/W5 entrypoint');
expect(homeWebkit.includes("id: 'desktop-reader-certification'"), 'independent WebKit runner must run desktop W5');
expect(homeWebkit.includes("project: 'webkit-reader-desktop'"), 'desktop W5 process must use the desktop WebKit project');
expect(homeWebkit.includes(`file: '${specPath}'`), 'desktop WebKit W5 process must point to the W5 entrypoint');

const workflowFiles = fs.readdirSync(path.join(root, '.github', 'workflows')).filter((name) => /\.ya?ml$/i.test(name));
expect(!workflowFiles.some((name) => /reader|premium-browser-certification/i.test(name)), 'W5 must reuse existing runners instead of adding a duplicate workflow');

if (failures.length) {
  console.error('premium reader certification contract: FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('premium reader certification contract: OK (Chromium desktop, Android, desktop WebKit, iPhone; longform, keyboard/reduced-motion, blocked storage, failed writes and forced colors)');
