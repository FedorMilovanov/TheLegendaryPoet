import type { ComponentType } from 'react';

export type RouteModule = { default: ComponentType };
export type RouteLoader = () => Promise<RouteModule>;

export const routeLoaders = {
  home: () => import('../pages/HomePage'),
  hall: () => import('../pages/HallPage'),
  poets: () => import('../pages/PoetsPage'),
  poet: () => import('../pages/PoetDetailPage'),
  ratings: () => import('../pages/RatingsPage'),
  articles: () => import('../pages/ArticlesPage'),
  article: () => import('../pages/ArticleDetailPage'),
  essay: () => import('../pages/EssayPage'),
  music: () => import('../pages/MusicPage'),
  track: () => import('../pages/TrackDetailPage'),
  about: () => import('../pages/AboutPage'),
  archive: () => import('../pages/MyArchivePage'),
  notFound: () => import('../pages/NotFoundPage'),
} satisfies Record<string, RouteLoader>;

const preloadCache = new Map<RouteLoader, Promise<RouteModule>>();

function loaderForPath(pathname: string): RouteLoader {
  const path = pathname.split(/[?#]/, 1)[0] || '/';
  if (path === '/') return routeLoaders.home;
  if (path === '/hall') return routeLoaders.hall;
  if (path === '/poets') return routeLoaders.poets;
  if (path.startsWith('/poets/')) return routeLoaders.poet;
  if (path === '/ratings') return routeLoaders.ratings;
  if (path === '/articles') return routeLoaders.articles;
  if (path.startsWith('/articles/')) return routeLoaders.article;
  if (path.startsWith('/essays/')) return routeLoaders.essay;
  if (path === '/music') return routeLoaders.music;
  if (path.startsWith('/music/')) return routeLoaders.track;
  if (path === '/about') return routeLoaders.about;
  if (path === '/archive') return routeLoaders.archive;
  return routeLoaders.notFound;
}

/**
 * Warm a route chunk after genuine navigation intent (hover, keyboard focus or
 * touch pointer-down). Dynamic imports are module-cached by the browser; the
 * local cache additionally prevents repeated promise allocation while a user
 * moves across nested controls in one link.
 */
export function preloadRoute(pathname: string): Promise<RouteModule> {
  const loader = loaderForPath(pathname);
  const pending = preloadCache.get(loader) ?? loader();
  preloadCache.set(loader, pending);
  return pending;
}
