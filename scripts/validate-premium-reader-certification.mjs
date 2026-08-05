import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const expect = (condition, message) => { if (!condition) failures.push(message); };

const specPath = 'qa/premium-reader-certification.spec.mjs';
expect(exists(specPath), `missing W5 browser suite: ${specPath}`);

const spec = exists(specPath) ? read(specPath) : '';
const packageJson = JSON.parse(read('package.json'));
const playwright = read('playwright.config.mjs');
const manual = read('.github/workflows/manual-browser-qa.yml');
const baseWebkit = read('scripts/run-webkit-process-isolated.mjs');
const homeWebkit = read('scripts/run-webkit-home-reveal-process-isolated.mjs');

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
  expect(spec.includes(token), `W5 certification suite is missing outcome contract: ${token}`);
}

expect(packageJson.scripts?.['validate:reader-certification'] === 'node scripts/validate-premium-reader-certification.mjs', 'package must expose validate:reader-certification');
expect(packageJson.scripts?.check?.includes('validate:reader-certification'), 'repository-wide check must include reader certification wiring validation');

expect(playwright.includes('premium-reader-certification'), 'main Playwright config must admit the W5 suite');
expect(playwright.includes("name: 'webkit-reader-desktop'"), 'Playwright config must expose a desktop WebKit W5 project');
expect(playwright.includes("browserName: 'webkit'"), 'desktop WebKit W5 project must use WebKit');
expect(playwright.includes("viewport: { width: 1440, height: 1000 }"), 'desktop WebKit W5 project must use the production desktop viewport');

expect(manual.includes(specPath), 'core Manual Browser QA must run W5 on desktop Chromium and Android');
expect(manual.includes('--project=chromium-core') && manual.includes('--project=android-pixel7'), 'core W5 wiring must retain Chromium desktop and Android projects');
expect(baseWebkit.includes("id: 'premium-reader-certification'"), 'fresh-process base iPhone suite must run W5');
expect(baseWebkit.includes(`file: '${specPath}'`), 'fresh-process base iPhone suite must point to the W5 file');
expect(homeWebkit.includes("id: 'desktop-reader-certification'"), 'independent WebKit runner must run desktop W5');
expect(homeWebkit.includes("project: 'webkit-reader-desktop'"), 'desktop W5 process must use the desktop WebKit project');
expect(homeWebkit.includes(`file: '${specPath}'`), 'desktop WebKit W5 process must point to the W5 file');

const workflowFiles = fs.readdirSync(path.join(root, '.github', 'workflows')).filter((name) => /\.ya?ml$/i.test(name));
expect(!workflowFiles.some((name) => /reader|premium-browser-certification/i.test(name)), 'W5 must reuse existing runners instead of adding a duplicate workflow');

if (failures.length) {
  console.error('premium reader certification contract: FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('premium reader certification contract: OK (Chromium desktop, Android, desktop WebKit, iPhone; longform, keyboard/reduced-motion, blocked storage, failed writes and forced colors)');
