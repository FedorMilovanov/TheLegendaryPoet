import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { matchPath, type To } from 'react-router-dom';

type PageModule = { default: ComponentType };
type PageImporter = () => Promise<PageModule>;

type RouteModuleRecord = {
  id: string;
  pattern: string;
  load: PageImporter;
  Component: LazyExoticComponent<ComponentType>;
};

const CHUNK_RECOVERY_PREFIX = 'tlp-route-chunk-recovery:';
const CHUNK_RECOVERY_WINDOW_MS = 45_000;
const PREFETCH_DELAY_MS = 80;

function createCachedImporter(importer: PageImporter): PageImporter {
  let pending: Promise<PageModule> | null = null;
  return () => {
    if (!pending) {
      pending = importer().catch((error: unknown) => {
        pending = null;
        throw error;
      });
    }
    return pending;
  };
}

function isChunkLoadFailure(error: unknown) {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return /ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i.test(message);
}

function canAttemptRecovery(routeId: string) {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || navigator.onLine === false) return false;
  try {
    const key = `${CHUNK_RECOVERY_PREFIX}${routeId}`;
    const previous = Number(window.sessionStorage.getItem(key));
    if (Number.isFinite(previous) && Date.now() - previous < CHUNK_RECOVERY_WINDOW_MS) return false;
    window.sessionStorage.setItem(key, String(Date.now()));
    return true;
  } catch {
    return false;
  }
}

function clearRecoveryMarker(routeId: string) {
  if (typeof window === 'undefined') return;
  try { window.sessionStorage.removeItem(`${CHUNK_RECOVERY_PREFIX}${routeId}`); } catch { /* session storage unavailable */ }
}

async function loadForRender(record: Pick<RouteModuleRecord, 'id' | 'load'>) {
  try {
    const module = await record.load();
    clearRecoveryMarker(record.id);
    return module;
  } catch (firstError) {
    if (!isChunkLoadFailure(firstError)) throw firstError;

    await new Promise((resolve) => globalThis.setTimeout(resolve, 240));
    try {
      const module = await record.load();
      clearRecoveryMarker(record.id);
      return module;
    } catch (secondError) {
      if (!isChunkLoadFailure(secondError) || !canAttemptRecovery(record.id) || typeof window === 'undefined') throw secondError;
      window.location.reload();
      return new Promise<PageModule>(() => undefined);
    }
  }
}

function defineRoute(id: string, pattern: string, importer: PageImporter): RouteModuleRecord {
  const load = createCachedImporter(importer);
  const record = { id, pattern, load } as RouteModuleRecord;
  record.Component = lazy(() => loadForRender(record));
  return record;
}

const homeRoute = defineRoute('home', '/', () => import('../pages/HomePage'));
const hallRoute = defineRoute('hall', '/hall', () => import('../pages/HallPage'));
const poetsRoute = defineRoute('poets', '/poets', () => import('../pages/PoetsPage'));
const poetDetailRoute = defineRoute('poet-detail', '/poets/:id', () => import('../pages/PoetDetailPage'));
const ratingsRoute = defineRoute('ratings', '/ratings', () => import('../pages/RatingsPage'));
const articlesRoute = defineRoute('articles', '/articles', () => import('../pages/ArticlesPage'));
const articleDetailRoute = defineRoute('article-detail', '/articles/:id', () => import('../pages/ArticleDetailPage'));
const essayRoute = defineRoute('essay', '/essays/:slug', () => import('../pages/EssayPage'));
const musicRoute = defineRoute('music', '/music', () => import('../pages/MusicPage'));
const trackDetailRoute = defineRoute('track-detail', '/music/:id', () => import('../pages/TrackDetailPage'));
const aboutRoute = defineRoute('about', '/about', () => import('../pages/AboutPage'));
const archiveRoute = defineRoute('archive', '/archive', () => import('../pages/MyArchivePage'));
const notFoundRoute = defineRoute('not-found', '*', () => import('../pages/NotFoundPage'));

export const HomePage = homeRoute.Component;
export const HallPage = hallRoute.Component;
export const PoetsPage = poetsRoute.Component;
export const PoetDetailPage = poetDetailRoute.Component;
export const RatingsPage = ratingsRoute.Component;
export const ArticlesPage = articlesRoute.Component;
export const ArticleDetailPage = articleDetailRoute.Component;
export const EssayPage = essayRoute.Component;
export const MusicPage = musicRoute.Component;
export const TrackDetailPage = trackDetailRoute.Component;
export const AboutPage = aboutRoute.Component;
export const MyArchivePage = archiveRoute.Component;
export const NotFoundPage = notFoundRoute.Component;

const prefetchableRoutes = [
  homeRoute,
  hallRoute,
  poetsRoute,
  poetDetailRoute,
  ratingsRoute,
  articlesRoute,
  articleDetailRoute,
  essayRoute,
  musicRoute,
  trackDetailRoute,
  aboutRoute,
  archiveRoute,
];

function pathnameFromTo(to: To) {
  const raw = typeof to === 'string' ? to : to.pathname;
  if (!raw || raw.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(raw)) return null;
  const pathname = raw.split(/[?#]/, 1)[0] || '/';
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

function permitsPrefetch() {
  if (typeof navigator === 'undefined' || navigator.onLine === false) return false;
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  return !connection?.saveData && connection?.effectiveType !== 'slow-2g' && connection?.effectiveType !== '2g';
}

export function preloadRoute(to: To) {
  if (!permitsPrefetch()) return;
  const pathname = pathnameFromTo(to);
  if (!pathname) return;
  const route = prefetchableRoutes.find((candidate) => matchPath({ path: candidate.pattern, end: true }, pathname));
  if (route) void route.load().catch(() => undefined);
}

export function scheduleRoutePreload(to: To) {
  if (typeof window === 'undefined') return;
  const run = () => preloadRoute(to);
  const browser = window as Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  };
  if (browser.requestIdleCallback) browser.requestIdleCallback(run, { timeout: 500 });
  else window.setTimeout(run, PREFETCH_DELAY_MS);
}
