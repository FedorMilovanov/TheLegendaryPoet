import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { matchPath, type To } from 'react-router';
import routeContractData from './route-contract.json';

type PageModule = { default: ComponentType };
type PageImporter = () => Promise<PageModule>;
type RouteAuditKind = 'canonical' | 'utility' | 'dynamic' | 'not-found';

type RouteContractRecord = {
  id: string;
  path: string;
  page: string;
  module: string;
  prefetch: boolean;
  sitemap: boolean;
  audit: RouteAuditKind;
  budgetBytes: number;
};

type RedirectContractRecord = { from: string; to: string };

type RouteModuleRecord = RouteContractRecord & {
  load: PageImporter;
  Component: LazyExoticComponent<ComponentType>;
};

const CHUNK_RECOVERY_PREFIX = 'tlp-route-chunk-recovery:';
const CHUNK_RECOVERY_WINDOW_MS = 45_000;
const PREFETCH_DELAY_MS = 80;

const pageImporters = {
  HomePage: () => import('../pages/HomePage'),
  HallPage: () => import('../pages/HallPage'),
  PoetsPage: () => import('../pages/PoetsPage'),
  PoetDetailPage: () => import('../pages/PoetDetailPage'),
  RatingsPage: () => import('../pages/RatingsPage'),
  ArticlesPage: () => import('../pages/ArticlesPage'),
  EssayPage: () => import('../pages/EssayPage'),
  MusicPage: () => import('../pages/MusicPage'),
  TrackDetailPage: () => import('../pages/TrackDetailPage'),
  AboutPage: () => import('../pages/AboutPage'),
  EditorialPolicyPage: () => import('../pages/EditorialPolicyPage'),
  PrivacyPage: () => import('../pages/PrivacyPage'),
  MyArchivePage: () => import('../pages/MyArchivePage'),
  NotFoundPage: () => import('../pages/NotFoundPage'),
} satisfies Record<string, PageImporter>;

type PageName = keyof typeof pageImporters;

function isPageName(value: string): value is PageName {
  return Object.prototype.hasOwnProperty.call(pageImporters, value);
}

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

function defineRoute(contract: RouteContractRecord): RouteModuleRecord {
  if (!isPageName(contract.page)) throw new Error(`Unknown route page importer: ${contract.page}`);
  const load = createCachedImporter(pageImporters[contract.page]);
  const record = { ...contract, load } as RouteModuleRecord;
  record.Component = lazy(() => loadForRender(record));
  return record;
}

const routeContracts = routeContractData.routes as RouteContractRecord[];
const routeIds = new Set<string>();
const routePaths = new Set<string>();
for (const route of routeContracts) {
  if (routeIds.has(route.id)) throw new Error(`Duplicate route id: ${route.id}`);
  if (routePaths.has(route.path)) throw new Error(`Duplicate route path: ${route.path}`);
  routeIds.add(route.id);
  routePaths.add(route.path);
}

const routeRecords = routeContracts.map(defineRoute);
const notFoundRecord = routeRecords.find((route) => route.audit === 'not-found');
if (!notFoundRecord || notFoundRecord.path !== '*') throw new Error('Route contract must define exactly one wildcard not-found route');

export const applicationRoutes = routeRecords.filter((route) => route !== notFoundRecord);
export const NotFoundPage = notFoundRecord.Component;
export const legacyRedirects = routeContractData.redirects as RedirectContractRecord[];

const prefetchableRoutes = applicationRoutes.filter((route) => route.prefetch);

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
  const route = prefetchableRoutes.find((candidate) => matchPath({ path: candidate.path, end: true }, pathname));
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
