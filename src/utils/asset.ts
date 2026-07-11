/**
 * Resolve a public asset path against the app base URL.
 *
 * Image paths in the data are absolute ("/images/pushkin.jpg"). Under a
 * GitHub Pages sub-path (base = "/TheLegendaryPoet/") a bare "/images/..."
 * would 404, so prefix it with the build-time base. For base "/" this is a
 * no-op.
 */
export function asset(path: string): string {
  if (/^https?:\/\//.test(path)) return path; // already absolute URL
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + (path.startsWith('/') ? path : `/${path}`);
}
