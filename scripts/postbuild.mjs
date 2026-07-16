/**
 * Post-build steps that mirror production deploy (without uploading).
 *  1. Prerender OG HTML for shareable deep links (best-effort).
 *  2. Copy index.html → 404.html for SPA deep-link fallback (GH Pages).
 *
 * Invoked by `npm run check` after `vite build`. Deploy workflow still runs
 * these steps explicitly so CI stays readable.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('postbuild: dist/index.html missing — run build first');
  process.exit(1);
}

// 1. Prerender (non-fatal if it fails — smoke still covers the SPA shell)
const prerender = spawnSync('npx', ['tsx', 'scripts/prerender-og.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
if (prerender.status !== 0) {
  console.warn('postbuild: prerender-og exited non-zero — continuing (SPA still works)');
}

// 2. SPA fallback
fs.copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'));
console.log('postbuild: dist/404.html ready');
