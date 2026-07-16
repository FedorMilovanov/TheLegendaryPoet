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
  // Guard for non-Vite runners (tsx smoke/integrity) where env may be absent.
  const rawBase =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
  const base = String(rawBase).replace(/\/$/, '');
  return base + (path.startsWith('/') ? path : `/${path}`);
}
