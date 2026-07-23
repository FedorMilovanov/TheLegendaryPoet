import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

const app = read('src/App.tsx');
const routes = read('src/routes/routeModules.tsx');
const link = read('src/components/ui/Link.tsx');
const smooth = read('src/components/SmoothScroll.tsx');
const boundary = read('src/components/ErrorBoundary.tsx');
const cursor = read('src/components/CustomCursor.tsx');

const expectedPages = [
  'HomePage',
  'HallPage',
  'PoetsPage',
  'PoetDetailPage',
  'RatingsPage',
  'ArticlesPage',
  'ArticleDetailPage',
  'EssayPage',
  'MusicPage',
  'TrackDetailPage',
  'AboutPage',
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
expect(cursor.includes("'(pointer: fine)'"), 'the custom cursor must require a fine pointer');
expect(cursor.includes('prefers-reduced-motion: reduce'), 'the custom cursor must preserve the native pointer for reduced motion');
expect(cursor.includes('forced-colors: active'), 'the custom cursor must preserve high-contrast system pointers');
expect(cursor.includes('visibilitychange'), 'the cursor must hide when the document is backgrounded');
expect(cursor.includes('INTERACTIVE_SELECTOR'), 'cursor emphasis must cover controls beyond links and buttons');
expect(cursor.includes('activatedRef.current'), 'the native cursor must remain visible until a real pointer position exists');

expect(boundary.includes("variant?: 'root' | 'page'"), 'ErrorBoundary must support page-scoped recovery');
expect(boundary.includes('window.location.reload()'), 'error recovery must provide a real reload path');
expect(boundary.includes('navigator.onLine === false'), 'error copy must distinguish an offline failure');

if (failures.length) {
  console.error('\nApp shell validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`App shell validation passed: ${expectedPages.length} lazy routes, persistent chrome, bounded scroll restoration and intent prefetch.`);
