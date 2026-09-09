import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors: string[] = [];

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function fail(message: string) {
  errors.push(message);
}

const appPath = 'src/App.tsx';
const trackerPath = 'src/components/AnalyticsConsent.tsx';
const analyticsPath = 'src/utils/analytics.ts';
const browserSpecPath = 'qa/analytics-route.spec.mjs';
const browserWorkflowPath = '.github/workflows/manual-browser-qa.yml';
const contractsWorkflowPath = '.github/workflows/project-contracts.yml';
const playwrightConfigPath = 'playwright.config.mjs';

for (const requiredPath of [
  appPath,
  trackerPath,
  analyticsPath,
  browserSpecPath,
  browserWorkflowPath,
  contractsWorkflowPath,
  playwrightConfigPath,
]) {
  if (!fs.existsSync(path.join(root, requiredPath))) fail(`missing analytics route contract source: ${requiredPath}`);
}

const app = fs.existsSync(path.join(root, appPath)) ? read(appPath) : '';
const tracker = fs.existsSync(path.join(root, trackerPath)) ? read(trackerPath) : '';
const analyticsSource = fs.existsSync(path.join(root, analyticsPath)) ? read(analyticsPath) : '';
const browserSpec = fs.existsSync(path.join(root, browserSpecPath)) ? read(browserSpecPath) : '';
const browserWorkflow = fs.existsSync(path.join(root, browserWorkflowPath)) ? read(browserWorkflowPath) : '';
const contractsWorkflow = fs.existsSync(path.join(root, contractsWorkflowPath)) ? read(contractsWorkflowPath) : '';
const playwrightConfig = fs.existsSync(path.join(root, playwrightConfigPath)) ? read(playwrightConfigPath) : '';

if (!app.includes("import { settleAnalyticsRoute } from './utils/analytics';")) {
  fail(`${appPath}: existing RouteSettled lifecycle must publish analytics settlement through settleAnalyticsRoute`);
}
if (!app.includes('const locationSearchRef = useRef(location.search);') || !app.includes('locationSearchRef.current = location.search;')) {
  fail(`${appPath}: query state must be sampled through a ref without becoming a RouteSettled dependency`);
}
if (!app.includes('settleAnalyticsRoute(location.pathname, locationSearchRef.current, settledTitle);')) {
  fail(`${appPath}: analytics route snapshot must be emitted from handleSettled with the settled title`);
}
const handleStart = app.indexOf('const handleSettled = useCallback(() => {');
const handleEnd = app.indexOf('\n\n  const page =', handleStart);
const handleSettledSource = handleStart >= 0 && handleEnd > handleStart ? app.slice(handleStart, handleEnd) : '';
if (!handleSettledSource.includes('}, [location.pathname]);')) {
  fail(`${appPath}: handleSettled must remain pathname-owned and must not replay for same-route query mutations`);
}
if (/\[location\.pathname\s*,\s*location\.search\]/.test(handleSettledSource) || /settleAnalyticsRoute\(location\.pathname,\s*location\.search/.test(app)) {
  fail(`${appPath}: location.search must not become a route-settlement trigger`);
}

if (/useLocation/.test(tracker)) {
  fail(`${trackerPath}: AnalyticsRouteTracker must not subscribe to raw router location lifecycle`);
}
for (const token of [
  'ANALYTICS_ROUTE_SETTLED_EVENT',
  'getSettledAnalyticsRoute',
  'window.addEventListener(ANALYTICS_ROUTE_SETTLED_EVENT, handleSettled)',
  'window.addEventListener(ANALYTICS_CONSENT_EVENT, handleConsent)',
  'settled.pathname !== window.location.pathname',
  '`${settled.pathname}${window.location.search}`',
  'trackPageView(pagePath, snapshot.title)',
]) {
  if (!tracker.includes(token)) fail(`${trackerPath}: missing settled-route tracker contract token: ${token}`);
}
if (/setTimeout\s*\([^)]*trackPageView/s.test(tracker)) {
  fail(`${trackerPath}: arbitrary timer-based page_view ownership must not replace RouteSettled authority`);
}

for (const token of [
  "export const ANALYTICS_ROUTE_SETTLED_EVENT = 'tlp:analytics-route-settled';",
  'let settledRoute: AnalyticsRouteSnapshot | null = null;',
  'export function getSettledAnalyticsRoute()',
  'export function settleAnalyticsRoute(pathname: string, search: string, title: string)',
  'path: `${pathname}${search}`',
  'window.dispatchEvent(new CustomEvent<AnalyticsRouteSnapshot>(ANALYTICS_ROUTE_SETTLED_EVENT, { detail: snapshot }))',
]) {
  if (!analyticsSource.includes(token)) fail(`${analyticsPath}: missing settled route authority token: ${token}`);
}

const analyticsJobStart = browserWorkflow.indexOf('\n  analytics-route-qa:');
const analyticsJobEnd = browserWorkflow.indexOf('\n  webkit-home-reveal-qa:', analyticsJobStart);
const analyticsJob = analyticsJobStart >= 0 && analyticsJobEnd > analyticsJobStart
  ? browserWorkflow.slice(analyticsJobStart, analyticsJobEnd)
  : '';
if (!analyticsJob) {
  fail(`${browserWorkflowPath}: analytics route proof must run in its own isolated job`);
}
if (analyticsJobStart >= 0 && browserWorkflow.slice(0, analyticsJobStart).includes('VITE_GA_ID:')) {
  fail(`${browserWorkflowPath}: deterministic analytics provider ID must not leak into the ordinary Manual Browser build`);
}
for (const token of [
  'VITE_GA_ID: G-TLP-ROUTE-QA',
  'npx tsx scripts/validate-analytics-route.ts',
  'qa/analytics-route.spec.mjs',
  '--project=chromium-core',
  '--project=android-pixel7',
  '--project=iphone-safari',
  'analytics-route-evidence-${{ env.TESTED_SHA }}',
]) {
  if (!analyticsJob.includes(token)) fail(`${browserWorkflowPath}: isolated analytics job missing token: ${token}`);
}
if (!contractsWorkflow.includes('npx tsx scripts/validate-analytics-route.ts')) {
  fail(`${contractsWorkflowPath}: Project contracts must execute the analytics route lifecycle validator`);
}
if (!/analytics-route/.test(playwrightConfig)) {
  fail(`${playwrightConfigPath}: analytics-route spec must be admitted to mobile browser projects`);
}

for (const token of [
  'G-TLP-ROUTE-QA',
  'page_view',
  'dataLayer',
  'RatingsPage-',
  "getByRole('status', { name: 'Загрузка страницы' })",
  "getByRole('searchbox', { name: 'Найти поэта в рейтинге' })",
  "getByRole('searchbox', { name: 'Найти музыкальный релиз' })",
  'pressSequentially',
  'page.goBack()',
]) {
  if (!browserSpec.includes(token)) fail(`${browserSpecPath}: missing emitted-event regression contour: ${token}`);
}

const routeEvents: Event[] = [];
class RouteTestCustomEvent<T = unknown> extends Event {
  readonly detail: T;
  constructor(type: string, init?: CustomEventInit<T>) {
    super(type);
    this.detail = init?.detail as T;
  }
}
Object.defineProperty(globalThis, 'CustomEvent', { configurable: true, value: RouteTestCustomEvent });
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    dispatchEvent(event: Event) {
      routeEvents.push(event);
      return true;
    },
  },
});

if (fs.existsSync(path.join(root, analyticsPath))) {
  const analytics = await import('../src/utils/analytics');
  analytics.settleAnalyticsRoute('/ratings', '?q=%D0%95%D1%81%D0%B5%D0%BD%D0%B8%D0%BD', 'Рейтинг поэтов');
  const snapshot = analytics.getSettledAnalyticsRoute();
  if (!snapshot || snapshot.pathname !== '/ratings' || snapshot.search !== '?q=%D0%95%D1%81%D0%B5%D0%BD%D0%B8%D0%BD') {
    fail('settled analytics route snapshot must retain pathname and direct-load query state');
  }
  if (snapshot?.path !== '/ratings?q=%D0%95%D1%81%D0%B5%D0%BD%D0%B8%D0%BD' || snapshot.title !== 'Рейтинг поэтов') {
    fail('settled analytics route snapshot must bind the exact page path to the settled destination title');
  }
  if (routeEvents.length !== 1 || routeEvents[0]?.type !== analytics.ANALYTICS_ROUTE_SETTLED_EVENT) {
    fail('settleAnalyticsRoute must publish exactly one route-settled event');
  }
  const detail = (routeEvents[0] as CustomEvent).detail;
  if (detail !== snapshot) fail('route-settled event and stored snapshot must share one immutable authority object');
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log('Analytics route validation passed: page views are pathname-settlement owned, same-route query mutations cannot retrigger settlement, late consent is bounded to the currently settled pathname, the provider-enabled proof build is isolated from ordinary browser QA, Project Contracts enforce the source contract, and Chromium/Android/iPhone browser QA inspects actual GA page_view emissions.');
