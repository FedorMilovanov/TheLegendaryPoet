import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

const app = read('src/App.tsx');
const routes = read('src/routes/routeModules.ts');
expect(!fs.existsSync(path.join(root, 'src/routes/routeModules.tsx')), 'routeModules.tsx must not shadow the live route registry');
const link = read('src/components/ui/Link.tsx');
const smooth = read('src/components/SmoothScroll.tsx');
const boundary = read('src/components/ErrorBoundary.tsx');
const cursor = read('src/components/CustomCursor.tsx');
const commandPalette = read('src/components/command/CommandPalette.tsx');
const header = read('src/components/Header.tsx');
const mobileDock = read('src/components/MobileDock.tsx');
const deployWorkflow = read('.github/workflows/deploy.yml');
const deployDispatchWorkflow = read('.github/workflows/deploy-dispatch.yml');

const expectedPages = [
  'HomePage',
  'HallPage',
  'PoetsPage',
  'PoetDetailPage',
  'RatingsPage',
  'ArticlesPage',
  'EssayPage',
  'MusicPage',
  'TrackDetailPage',
  'AboutPage',
  'EditorialPolicyPage',
  'PrivacyPage',
  'MyArchivePage',
  'NotFoundPage',
];

expect(!/from ['"]\.\/pages\//.test(app), 'App.tsx must not eagerly import page modules');
expect(app.includes('<Route element={<SiteLayout />}>'), 'all pages must remain below one persistent SiteLayout route');
expect(app.includes('useOutlet()'), 'the persistent shell must render route content through useOutlet');
expect(app.includes('<Suspense fallback={<RouteLoadingShell />}'), 'lazy routes need a stable loading presentation');
expect(app.includes('<RouteSettled pathname={location.pathname}'), 'focus and announcements must wait for lazy route content to settle');
expect(app.includes('document.title ||'), 'settled routes must announce their final document title');
expect(app.includes("focus({ preventScroll: true })"), 'SPA focus management must not disturb the restored scroll position');
expect(app.includes('variant="page"'), 'route failures must be isolated inside the persistent shell');
expect(app.includes('<AudioChrome />'), 'global audio chrome must remain outside page-level routing failures');
expect(app.includes('tabIndex={-1}'), 'main content must remain programmatically focusable after SPA navigation');
expect(app.includes('aria-live="polite"'), 'route changes must be announced to assistive technology');

for (const page of expectedPages) {
  expect(routes.includes(`import('../pages/${page}')`), `missing lazy importer for ${page}`);
  expect(routes.includes(`export const ${page} =`), `missing lazy component export for ${page}`);
  expect(app.includes(`<${page} />`), `missing route element for ${page}`);
}

expect(!routes.includes("import('../pages/ArticleDetailPage')"), 'retired mini-article page must not remain in the lazy route graph');
for (const legacyId of ['article-1', 'article-2', 'article-3', 'article-main-1', 'article-main-2']) {
  expect(app.includes(`path="/articles/${legacyId}"`), `missing safe redirect for legacy article ${legacyId}`);
}
expect(app.includes('path="/articles/:id"'), 'unknown legacy article URLs need a canonical fallback');

const dynamicImports = [...routes.matchAll(/import\('\.\.\/pages\/(\w+)'\)/g)].map((match) => match[1]);
expect(dynamicImports.length === expectedPages.length, `expected ${expectedPages.length} page imports, found ${dynamicImports.length}`);
expect(new Set(dynamicImports).size === dynamicImports.length, 'each page module must have exactly one cached dynamic importer');
expect(routes.includes('createCachedImporter'), 'route imports must be deduplicated while pending');
expect(routes.includes('isChunkLoadFailure'), 'stale deployment chunks need explicit recovery classification');
expect(routes.includes('window.location.reload()'), 'chunk recovery must include one controlled document reload');
expect(routes.includes('navigator.onLine === false'), 'route prefetch and recovery must respect offline state');
expect(routes.includes('saveData'), 'intent prefetch must respect data-saver mode');
expect(routes.includes("effectiveType !== '2g'"), 'intent prefetch must avoid constrained 2G connections');

for (const event of ['onFocus', 'onPointerEnter', 'onTouchStart']) {
  expect(link.includes(event), `site links must preload on ${event}`);
}
expect(link.includes('scheduleRoutePreload'), 'site links must use the shared route prefetch scheduler');
expect(link.includes('viewTransition'), 'site links must preserve View Transitions');

expect(smooth.includes("import('lenis')"), 'Lenis must remain a lazy enhancement rather than an eager shell dependency');
expect(!/^import Lenis from 'lenis';/m.test(smooth), 'SmoothScroll must not eagerly import Lenis at runtime');
expect(smooth.includes("scrollRestoration = 'manual'"), 'SPA navigation must own scroll restoration');
expect(smooth.includes("navigationType === 'POP'"), 'back/forward navigation must restore a saved position');
expect(smooth.includes("'(pointer: coarse)'"), 'coarse-pointer devices must retain native scrolling');
expect(smooth.includes('prefers-reduced-motion: reduce'), 'reduced-motion users must retain native scrolling');
expect(smooth.includes('positionsRef.current.size > 80'), 'scroll history must remain bounded during long sessions');
expect(smooth.includes('function decodeHash'), 'malformed percent-encoded hashes must not crash navigation');
expect(smooth.includes('FIXED_HEADER_OFFSET'), 'hash navigation must compensate for the fixed header');
expect(smooth.includes('getBoundingClientRect().top + window.scrollY'), 'native hash scrolling must apply the same header offset as Lenis');

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

console.log(`App shell validation passed: ${expectedPages.length} lazy routes, canonical legacy redirects, persistent chrome, single search entry points, bounded scroll restoration, intent prefetch and exact-head Pages provenance.`);
