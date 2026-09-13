export function canonicalRoutePath(pathname: string) {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (normalized === '/') return '/';
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

export function canonicalRouteUrl(origin: string, pathname: string) {
  return `${origin.replace(/\/+$/, '')}${canonicalRoutePath(pathname)}`;
}
