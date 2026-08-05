import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors: string[] = [];

function fail(message: string) {
  errors.push(message);
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath: string) {
  return JSON.parse(read(relativePath)) as Record<string, any>;
}

const manifest = readJson('package.json');
const lock = readJson('package-lock.json');
const playwrightVersion = manifest.devDependencies?.['@playwright/test'];

if (typeof playwrightVersion !== 'string' || !/^\d+\.\d+\.\d+$/.test(playwrightVersion)) {
  fail('@playwright/test must be an exact semantic version in devDependencies');
}

if (!manifest.scripts?.check?.includes('validate:browser-runtime')) {
  fail('npm run check must include validate:browser-runtime');
}

const rootLockVersion = lock.packages?.['']?.devDependencies?.['@playwright/test'];
if (rootLockVersion !== playwrightVersion) {
  fail(`package-lock root must pin @playwright/test ${playwrightVersion}; found ${String(rootLockVersion)}`);
}

for (const packagePath of [
  'node_modules/@playwright/test',
  'node_modules/playwright',
  'node_modules/playwright-core',
]) {
  const locked = lock.packages?.[packagePath]?.version;
  if (locked !== playwrightVersion) {
    fail(`${packagePath} must resolve to ${playwrightVersion}; found ${String(locked)}`);
  }
}

const setupActionPath = '.github/actions/setup-node-deps/action.yml';
const playwrightActionPath = '.github/actions/install-playwright/action.yml';
const setupAction = fs.existsSync(path.join(root, setupActionPath)) ? read(setupActionPath) : '';
const playwrightAction = fs.existsSync(path.join(root, playwrightActionPath)) ? read(playwrightActionPath) : '';

if (setupAction) {
  if (!setupAction.includes('actions/setup-node@v4')) fail(`${setupActionPath}: must use actions/setup-node@v4`);
  if (!setupAction.includes('npm ci')) fail(`${setupActionPath}: default dependency installation must be npm ci`);
  if (!setupAction.includes('cache: npm')) fail(`${setupActionPath}: npm cache must remain enabled`);
}

if (playwrightAction) {
  if (!playwrightAction.includes(`!== '${playwrightVersion}'`)) {
    fail(`${playwrightActionPath}: must assert the manifest Playwright version ${playwrightVersion}`);
  }
  if (!playwrightAction.includes('npx playwright install --with-deps')) {
    fail(`${playwrightActionPath}: must install browser binaries through the locked Playwright CLI`);
  }
  if (!playwrightAction.includes('npx playwright --version')) {
    fail(`${playwrightActionPath}: must print the resolved Playwright version`);
  }
}

const expectedBrowserWorkflows = [
  'articles-catalog.yml',
  'brand-deep-audit.yml',
  'brand-qa.yml',
  'manual-browser-qa.yml',
  'site-route-integrity-audit.yml',
  'yesenin-part-one-browser.yml',
];

const workflowDir = path.join(root, '.github', 'workflows');
for (const fileName of expectedBrowserWorkflows) {
  const workflowPath = path.join(workflowDir, fileName);
  if (!fs.existsSync(workflowPath)) {
    fail(`missing browser workflow: ${fileName}`);
    continue;
  }

  const source = fs.readFileSync(workflowPath, 'utf8');
  const usesSharedDependencies = source.includes('uses: ./.github/actions/setup-node-deps');
  const usesDirectDependencies = /\bnpm ci(?:\s|$)/m.test(source);
  if (!usesDirectDependencies && !usesSharedDependencies) {
    fail(`${fileName}: dependencies must come from package-lock via npm ci or the shared exact-dependency action`);
  }
  if (usesSharedDependencies && !setupAction) {
    fail(`${fileName}: references the missing shared exact-dependency action`);
  }

  const usesSharedBrowsers = source.includes('uses: ./.github/actions/install-playwright');
  const usesDirectBrowsers = source.includes('npx playwright install --with-deps');
  if (!usesDirectBrowsers && !usesSharedBrowsers) {
    fail(`${fileName}: browser binaries must be installed from the locked Playwright CLI or its shared action`);
  }
  if (usesSharedBrowsers && !playwrightAction) {
    fail(`${fileName}: references the missing shared Playwright action`);
  }

  if (/npm\s+(?:install|i)\b[^\n]*@playwright\/test/i.test(source)) {
    fail(`${fileName}: must not install @playwright/test outside package-lock`);
  }
  if (/@playwright\/test@\d/i.test(source)) {
    fail(`${fileName}: must not embed a second Playwright version`);
  }
  if (/--no-save|--no-package-lock/.test(source)) {
    fail(`${fileName}: ephemeral dependency flags are forbidden in browser workflows`);
  }
}

for (const fileName of fs.readdirSync(workflowDir).filter((name) => /\.ya?ml$/.test(name))) {
  const source = fs.readFileSync(path.join(workflowDir, fileName), 'utf8');
  if (/npm\s+(?:install|i)\b[^\n]*@playwright\/test/i.test(source)) {
    fail(`${fileName}: hidden Playwright installation bypasses the committed lockfile`);
  }
  if (/@playwright\/test@\d/i.test(source)) {
    fail(`${fileName}: hidden embedded Playwright version bypasses the committed lockfile`);
  }
  if (/--no-save|--no-package-lock/.test(source)) {
    fail(`${fileName}: hidden ephemeral dependency flags are forbidden`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log(
  `Browser runtime validation passed: @playwright/test ${playwrightVersion}; ${expectedBrowserWorkflows.length} workflows use direct or shared committed-lockfile primitives.`,
);
