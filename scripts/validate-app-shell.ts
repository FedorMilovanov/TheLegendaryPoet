import fs from 'node:fs';
import path from 'node:path';
import { inspectSource } from './lib/source-contract-ast';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

const app = read('src/App.tsx');
const routes = read('src/routes/routeModules.ts');
const routeContract = JSON.parse(read('src/routes/route-contract.json')) as {
  routes: Array<{ id: string; path: string; page: string; module: string; prefetch: boolean; audit: string; budgetBytes: number }>;
  redirects: Array<{ from: string; to: string }>;
  notFoundProbes: string[];
};
expect(!fs.existsSync(path.join(root, 'src/routes/routeModules.tsx')), 'routeModules.tsx must not shadow the live route runtime');
const link = read('src/components/ui/Link.tsx');
const smooth = read('src/components/SmoothScroll.tsx');
const boundary = read('src/components/ErrorBoundary.tsx');
const cursor = read('src/components/CustomCursor.tsx');
const browserStorage = read('src/utils/browserStorage.ts');
const communityIdentity = read('src/utils/communityIdentity.ts');
const analytics = read('src/utils/analytics.ts');
const themeToggle = read('src/components/ThemeToggle.tsx');
const audioProvider = read('src/components/music/AudioPlayerProvider.tsx');
const commandPalette = read('src/components/command/CommandPalette.tsx');
const header = read('src/components/Header.tsx');
const mobileDock = read('src/components/MobileDock.tsx');
const deployWorkflow = read('.github/workflows/deploy.yml');
const deployDispatchWorkflow = read('.github/workflows/deploy-dispatch.yml');
const articleRenderer = read('src/components/essay/ArticleRenderer.tsx');
const essayValidator = read('scripts/validate-essays.ts');
const archivePage = read('src/pages/MyArchivePage.tsx');
const archiveStore = read('src/utils/myArchiveStore.ts');

const appAst = inspectSource(app, 'App.tsx');
const smoothAst = inspectSource(smooth, 'SmoothScroll.tsx');

const expectedPages = routeContract.routes.map((route) => route.page);
const routeIds = routeContract.routes.map((route) => route.id);
const routePaths = routeContract.routes.map((route) => route.path);
expect(routeContract.routes.length === 14, `route contract must retain 14 lazy pages, found ${routeContract.routes.length}`);
expect(new Set(routeIds).size === routeIds.length, 'route contract ids must be unique');
expect(new Set(routePaths).size === routePaths.length, 'route contract paths must be unique');
expect(routeContract.routes.filter((route) => route.audit === 'not-found').length === 1, 'route contract must own one not-found route');
for (const route of routeContract.routes) {
  expect(fs.existsSync(path.join(root, route.module)), `route contract module does not exist: ${route.module}`);
  expect(route.budgetBytes > 0, `route contract budget must be positive: ${route.id}`);
}

expect(!/from ['"]\.\/pages\//.test(app), 'App.tsx must not eagerly import page modules');
expect(app.includes('<Route element={<SiteLayout />}>'), 'all pages must remain below one persistent SiteLayout route');
expect(app.includes('useOutlet()'), 'the persistent shell must render route content through useOutlet');
expect(app.includes('<Suspense fallback={<RouteLoadingShell />}'), 'lazy routes need a stable loading presentation');
expect(app.includes('<RouteSettled pathname={location.pathname}'), 'focus and announcements must wait for lazy route content to settle');
expect(app.includes('document.title ||'), 'settled routes must announce their final document title');
expect(
  appAst.hasMethodCallWithBooleanOptions('focus', { preventScroll: true }),
  'SPA focus management must focus without disturbing the restored scroll position',
);
expect(app.includes('renderedPathRef.current !== location.pathname'), 'focus ownership must detect every real pathname transition');
expect(!app.includes('initialPathRef'), 'focus ownership must not suppress a return to the initial session URL');
expect(app.includes('variant="page"'), 'route failures must be isolated inside the persistent shell');
expect(app.includes('<AudioChrome />'), 'global audio chrome must remain outside page-level routing failures');
expect(app.includes('tabIndex={-1}'), 'main content must remain programmatically focusable after SPA navigation');
expect(app.includes('aria-live="polite"'), 'route changes must be announced to assistive technology');
expect(app.includes('applicationRoutes.map'), 'App.tsx must render route elements from the route contract runtime');
expect(app.includes('legacyRedirects.map'), 'App.tsx must render explicit redirects from the route contract runtime');
expect(app.includes('<Route path="*" element={<NotFoundPage />}'), 'App.tsx must retain the contract-owned NotFound boundary');
expect(!app.includes('path="/articles/:id"'), 'unknown article ids must not use a broad soft-404 redirect');

for (const page of expectedPages) {
  expect(routes.includes(`import('../pages/${page}')`), `missing lazy importer for ${page}`);
}
for (const redirect of routeContract.redirects) {
  expect(redirect.from.startsWith('/') && redirect.to.startsWith('/'), `redirect must remain internal: ${redirect.from}`);
}
expect(routeContract.notFoundProbes.includes('/articles/route-audit-legacy'), 'unknown legacy article probe must remain a NotFound case');
expect(!routes.includes("import('../pages/ArticleDetailPage')"), 'retired mini-article page must not remain in the lazy route graph');

const dynamicImports = [...routes.matchAll(/import\('\.\.\/pages\/(\w+)'\)/g)].map((match) => match[1]);
expect(dynamicImports.length === expectedPages.length, `expected ${expectedPages.length} page imports, found ${dynamicImports.length}`);
expect(new Set(dynamicImports).size === dynamicImports.length, 'each page module must have exactly one cached dynamic importer');
expect(routes.includes("import routeContractData from './route-contract.json'"), 'route runtime must consume the machine contract');
expect(routes.includes('createCachedImporter'), 'route imports must be deduplicated while pending');
expect(routes.includes('isChunkLoadFailure'), 'stale deployment chunks need explicit recovery classification');
expect(routes.includes('window.location.reload()'), 'chunk recovery must include one controlled document reload');
expect(routes.includes('navigator.onLine === false'), 'route prefetch and recovery must respect offline state');
expect(routes.includes('saveData'), 'intent prefetch must respect data-saver mode');
expect(routes.includes("effectiveType !== '2g'"), 'intent prefetch must avoid constrained 2G connections');

expect(!articleRenderer.includes('normalizeEssayBlocks'), 'the renderer must not silently rewrite invalid essay structure');
expect(essayValidator.includes('adjacent duplicate section heading'), 'duplicate section headings must fail at the content validation boundary');
expect(archiveStore.includes("'unchanged'"), 'archive mutations must expose an unchanged result');
expect(archivePage.includes("result.status === 'failed'"), 'archive removal UI must report a failed mutation');
expect(archivePage.includes('список не изменён'), 'archive removal failure must explain that the visible list is unchanged');

for (const event of ['onFocus', 'onPointerEnter', 'onTouchStart']) {
  expect(link.includes(event), `site links must preload on ${event}`);
}
expect(link.includes('scheduleRoutePreload'), 'site links must use the shared route prefetch scheduler');
expect(link.includes('viewTransition'), 'site links must preserve View Transitions');

expect(!smoothAst.hasModuleImport('lenis'), 'the persistent shell must not load a global JavaScript document scroller');
expect(!smooth.includes('smoothWheel'), 'ordinary wheel movement must remain browser-native on every pointer class');
expect(!smoothAst.hasEventListener('wheel'), 'the app shell must not intercept ordinary wheel input');
expect(!smoothAst.hasMethodCall('preventDefault'), 'the app shell must not cancel native document movement');
expect(smooth.includes("scrollRestoration = 'manual'"), 'SPA navigation must own scroll restoration');
expect(smooth.includes("navigationType === 'POP'"), 'back/forward navigation must restore a saved position');
expect(smooth.includes('prefers-reduced-motion: reduce'), 'programmatic scroll commands must respect reduced motion');
expect(smooth.includes('positionsRef.current.size > 80'), 'scroll history must remain bounded during long sessions');
expect(smooth.includes('function decodeHash'), 'malformed percent-encoded hashes must not crash navigation');
expect(smooth.includes('FIXED_HEADER_OFFSET'), 'hash navigation must compensate for the fixed header');
expect(smooth.includes('getBoundingClientRect().top + window.scrollY'), 'native hash scrolling must apply the fixed-header offset');
expect(smoothAst.hasEventListener('tlp-scroll-top'), 'the persistent shell must retain the explicit scroll-to-top command');

// Mutation-style proof that equivalent focus-option spelling is accepted semantically.
const focusOptionsFixture = inspectSource(`
  const preventScroll = true;
  const focusOptions = { preventScroll };
  main.focus(focusOptions);
`);
expect(
  focusOptionsFixture.hasMethodCallWithBooleanOptions('focus', { preventScroll: true }),
  'focus contract inspection must accept an extracted preventScroll options object',
);
const unsafeFocusFixture = inspectSource(`main.focus({ preventScroll: false });`);
expect(
  !unsafeFocusFixture.hasMethodCallWithBooleanOptions('focus', { preventScroll: true }),
  'focus contract inspection must reject focus that is allowed to move scroll',
);

expect(cursor.includes('useMotionValue'), 'the persistent custom cursor must not rerender React on every pointer movement');
expect(!cursor.includes('setMousePosition'), 'pointer coordinates must remain outside React state');
expect(
  cursor.includes("'(hover: hover) and (pointer: fine)'"),
  'the custom cursor must require both hover capability and a fine pointer',
);
expect(cursor.includes('prefers-reduced-motion: reduce'), 'the custom cursor must preserve the native pointer for reduced motion');
expect(cursor.includes('forced-colors: active'), 'the custom cursor must preserve high-contrast system pointers');
expect(cursor.includes('visibilitychange'), 'the cursor must hide when the document is backgrounded');
expect(cursor.includes('INTERACTIVE_SELECTOR'), 'cursor emphasis must cover controls beyond links and buttons');
expect(cursor.includes('activatedRef.current'), 'the native cursor must remain visible until a real pointer position exists');

for (const [source, label] of [
  [communityIdentity, 'community identity'],
  [analytics, 'analytics consent'],
  [themeToggle, 'theme preference'],
  [audioProvider, 'audio coordination'],
] as const) {
  expect(source.includes('safeWrite('), `${label} must use safeWrite for browser persistence`);
  expect(!source.includes('window.localStorage.setItem('), `${label} must not write localStorage directly`);
}
expect(browserStorage.includes('export function safeWrite'), 'shared safeWrite helper must remain available');
expect(browserStorage.includes("typeof window === 'undefined'"), 'browser storage helper must remain SSR-safe');

expect(commandPalette.includes('if (!open) return null;'), 'closed search must not render a duplicate fixed desktop trigger');
expect(!commandPalette.includes('palette-fab'), 'the retired floating Ctrl K pill must stay out of the command palette DOM');
expect(
  commandPalette.includes("window.addEventListener('tlp-open-command-palette'"),
  'the command palette must remain available to persistent shell entry points',
);
expect(commandPalette.includes('event.metaKey || event.ctrlKey'), 'Ctrl/Cmd+K must continue to toggle search');
expect(
  header.includes("new Event('tlp-open-command-palette')") && header.includes('aria-label="Открыть поиск"'),
  'desktop search must remain available exactly through the persistent header trigger',
);
expect(
  mobileDock.includes("new Event('tlp-open-command-palette')")
    && mobileDock.includes('aria-label="Открыть поиск и все разделы"'),
  'mobile search and section discovery must remain available through the centre dock trigger',
);

expect(deployWorkflow.includes('source_sha:'), 'deploy workflow must declare the source_sha input used by the release dispatcher');
expect(deployDispatchWorkflow.includes('source_sha: sourceSha'), 'release dispatcher must pass the exact source SHA');
expect(
  deployWorkflow.includes('ref: ${{ inputs.source_sha || github.sha }}'),
  'deploy workflow must check out the exact requested source SHA',
);
expect(
  deployWorkflow.includes('pr.head.sha === sourceSha'),
  'deploy workflow must verify the requested SHA is still the trusted PR head',
);
expect(
  deployDispatchWorkflow.includes('expected_version: process.env.RELEASE_VERSION'),
  'release dispatcher must pass the exact brand release id read from the PR head',
);
expect(
  deployDispatchWorkflow.includes('expected_source_sha256: process.env.SOURCE_SHA256'),
  'release dispatcher must pass the exact approved source hash',
);
expect(
  deployWorkflow.includes('EXPECTED_VERSION: ${{ inputs.expected_version }}')
    && deployWorkflow.includes('EXPECTED_SOURCE_SHA256: ${{ inputs.expected_source_sha256 }}'),
  'deploy workflow must verify the dispatched single-source release metadata against the built artifact',
);
expect(
  deployDispatchWorkflow.includes("startsWith(github.event.pull_request.head.ref, 'deploy-live-')"),
  'exact-head Pages dispatch must remain restricted to same-repository deploy-live branches',
);

expect(boundary.includes("variant?: 'root' | 'page'"), 'ErrorBoundary must support page-scoped recovery');
expect(boundary.includes('window.location.reload()'), 'error recovery must provide a real reload path');
expect(boundary.includes('navigator.onLine === false'), 'error copy must distinguish an offline failure');

if (failures.length) {
  console.error('\nApp shell validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`App shell validation passed: ${expectedPages.length} lazy routes, canonical legacy redirects, persistent chrome, single search entry points, native document scrolling, bounded restoration, intent prefetch and exact-head Pages provenance.`);
