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

function collectSourceFiles(directory: string): string[] {
  const absolute = path.join(root, directory);
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(relative);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [relative] : [];
  });
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
  if (!setupAction.includes('actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4')) fail(`${setupActionPath}: must use the immutable setup-node v4 commit`);
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

// Persistent Tailwind utility animation is a state affordance, not an
// accessibility exemption. One CSS authority is imported last and suppresses
// all canonical looping utility classes under prefers-reduced-motion: reduce.
// The full src inventory is still counted here so this policy cannot silently
// become detached from production usage.
const persistentUtility = /\banimate-(?:spin|ping|pulse|bounce)\b/g;
let persistentMotionTokenCount = 0;
for (const relativePath of collectSourceFiles('src')) {
  const source = read(relativePath);
  persistentMotionTokenCount += source.match(persistentUtility)?.length ?? 0;
}
if (persistentMotionTokenCount === 0) {
  fail('persistent reduced-motion policy became vacuous: expected at least one production utility animation');
}

const reducedMotionPath = 'src/reduced-motion.css';
const reducedMotionSource = fs.existsSync(path.join(root, reducedMotionPath)) ? read(reducedMotionPath) : '';
if (!reducedMotionSource.includes('@media (prefers-reduced-motion: reduce)')) {
  fail(`${reducedMotionPath}: must own the reduced-motion media query`);
}
for (const utility of ['spin', 'ping', 'pulse', 'bounce']) {
  if (!reducedMotionSource.includes(`.animate-${utility}`)) {
    fail(`${reducedMotionPath}: must cover .animate-${utility}`);
  }
}
if (!/animation:\s*none\s*!important\s*;/.test(reducedMotionSource)) {
  fail(`${reducedMotionPath}: persistent utility motion must resolve to animation: none !important`);
}
const mainSource = read('src/main.tsx');
if (!mainSource.includes('import "./reduced-motion.css";')) {
  fail('src/main.tsx must load the persistent reduced-motion policy');
}
const reducedMotionImport = mainSource.indexOf('import "./reduced-motion.css";');
const otherCssImports = Array.from(mainSource.matchAll(/import "\.\/[^\"]+\.css";/g), (match) => match.index ?? -1);
if (otherCssImports.some((index) => index > reducedMotionImport)) {
  fail('src/reduced-motion.css must be the final production CSS import so its accessibility policy stays authoritative');
}

const analyticsSource = read('src/utils/analytics.ts');
if (!analyticsSource.includes('let sessionConsent: AnalyticsConsentState = null')) {
  fail('analytics consent must retain an explicit same-tab memory authority when persistence is blocked');
}
if (!analyticsSource.includes('if (sessionConsent !== null) return sessionConsent')) {
  fail('analytics consent reads must prefer the same-tab authority before best-effort persistence');
}
if (!analyticsSource.includes('applyConsent(value, { persist: true, publish: true })')) {
  fail('analytics consent writes must flow through the single lifecycle authority');
}
if (!analyticsSource.includes('if (persist && value !== null)')) {
  fail('analytics consent persistence must remain explicit and fail closed for unset state');
}
if (!analyticsSource.includes("window.addEventListener('storage', handleStorage)")) {
  fail('analytics consent must converge across open tabs through the browser storage event');
}
if (!analyticsSource.includes('analytics_storage: value === \'granted\' ? \'granted\' : \'denied\'')) {
  fail('Google analytics storage consent must follow the current user choice');
}
if (!analyticsSource.includes('ga-disable-')) {
  fail('Google analytics revoke must retain the hard collection kill switch');
}
if (!analyticsSource.includes('disableYaCounter')) {
  fail('Yandex analytics must expose the documented pre-init collection kill switch');
}
if (!analyticsSource.includes("'destruct'")) {
  fail('Yandex analytics revoke must destruct an initialized SPA counter');
}
if (!analyticsSource.includes('script[data-tlp-analytics-provider="google"]') || !analyticsSource.includes('script[data-tlp-analytics-provider="yandex"]')) {
  fail('analytics provider scripts must have duplicate-resistant ownership markers');
}
if (/document\.cookie|sessionStorage/.test(analyticsSource)) {
  fail('analytics consent must not bypass blocked localStorage with alternate persistence');
}

const privacySource = read('src/pages/PrivacyPage.tsx');
if (!privacySource.includes('data-analytics-consent-action="granted"') || !privacySource.includes('data-analytics-consent-action="denied"')) {
  fail('privacy page must expose persistent reopenable analytics consent controls');
}
if (!privacySource.includes('ANALYTICS_CONSENT_EVENT')) {
  fail('privacy page must observe the same analytics consent authority as the global banner');
}

const analyticsBrowserSource = read('qa/analytics-route.spec.mjs');
if (!analyticsBrowserSource.includes('grant, cross-tab deny and re-grant converge')) {
  fail('analytics browser QA must cover the full grant/deny/re-grant lifecycle');
}
if (!analyticsBrowserSource.includes('context.newPage()')) {
  fail('analytics browser QA must prove real cross-tab consent convergence');
}
if (!analyticsBrowserSource.includes('yandexDestructCount') || !analyticsBrowserSource.includes('googleConfigCount')) {
  fail('analytics browser QA must prove provider revoke and duplicate-init outcomes');
}

const analyticsEvents: Event[] = [];
class AnalyticsTestCustomEvent<T = unknown> extends Event {
  readonly detail: T;
  constructor(type: string, init?: CustomEventInit<T>) {
    super(type);
    this.detail = init?.detail as T;
  }
}
Object.defineProperty(globalThis, 'CustomEvent', { configurable: true, value: AnalyticsTestCustomEvent });
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    get localStorage() {
      throw new Error('storage blocked by privacy policy');
    },
    dispatchEvent(event: Event) {
      analyticsEvents.push(event);
      return true;
    },
  },
});
const analytics = await import('../src/utils/analytics');
if (analytics.getAnalyticsConsent() !== null) {
  fail('blocked analytics storage must begin without implicit consent');
}
analytics.setAnalyticsConsent('granted');
if (analytics.getAnalyticsConsent() !== 'granted') {
  fail('granted analytics consent must remain authoritative in the current tab when persistence is blocked');
}
if (analyticsEvents.length !== 1 || (analyticsEvents[0] as CustomEvent).detail !== 'granted') {
  fail('blocked-storage analytics grant must still publish the consent-change event');
}
analytics.setAnalyticsConsent('denied');
if (analytics.getAnalyticsConsent() !== 'denied') {
  fail('denied analytics consent must immediately replace a same-tab grant when persistence is blocked');
}
if (analyticsEvents.length !== 2 || (analyticsEvents[1] as CustomEvent).detail !== 'denied') {
  fail('blocked-storage analytics denial must publish the consent-change event');
}

const webkitRouteSuitePath = 'qa/mobile-webkit-isolated.spec.mjs';
const webkitRouteHelperPath = 'qa/mobile-webkit-isolated.helpers.mjs';
const webkitRouteRunnerPath = 'scripts/run-webkit-home-reveal-process-isolated.mjs';
for (const requiredPath of [webkitRouteSuitePath, webkitRouteHelperPath, webkitRouteRunnerPath]) {
  if (!fs.existsSync(path.join(root, requiredPath))) fail(`missing Safari route certification source: ${requiredPath}`);
}
if (fs.existsSync(path.join(root, webkitRouteSuitePath))) {
  const source = read(webkitRouteSuitePath);
  if (!/\['hall',\s*'\/hall'\]/.test(source)) {
    fail(`${webkitRouteSuitePath}: iPhone Safari route matrix must include the current /hall production shell`);
  }
}
if (fs.existsSync(path.join(root, webkitRouteRunnerPath))) {
  const source = read(webkitRouteRunnerPath);
  if (!/\.\.\.\[[^\]]*['"]hall['"][^\]]*\]\.map\(\(route\)/s.test(source)) {
    fail(`${webkitRouteRunnerPath}: fresh-process Safari runner must execute the Hall route contour`);
  }
}
if (fs.existsSync(path.join(root, webkitRouteHelperPath))) {
  const source = read(webkitRouteHelperPath);
  if (!source.includes("page.locator('.page-wipe')") || !source.includes("getByRole('status', { name: 'Загрузка страницы' })")) {
    fail(`${webkitRouteHelperPath}: Safari route readiness must wait for both first-document wipe and Suspense loading shell to clear`);
  }
  if (!source.includes('routeLoadingVisible') || !source.includes('pageWipeVisible')) {
    fail(`${webkitRouteHelperPath}: Safari route diagnostics must fail closed when loading/wipe surfaces remain visible`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log(
  `Browser runtime validation passed: @playwright/test ${playwrightVersion}; ${expectedBrowserWorkflows.length} workflows use direct or shared committed-lockfile primitives, ${persistentMotionTokenCount} persistent utility animation token(s) are governed by the final reduced-motion CSS authority, blocked-storage analytics consent is executable and same-tab authoritative without persistence bypass, /hall remains in fresh-process iPhone Safari route certification, and Safari evidence waits for real route visual readiness.`,
);
