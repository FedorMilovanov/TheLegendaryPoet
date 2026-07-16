/**
 * Live smoke against a production build.
 *
 * Starts `vite preview`, hits key routes over HTTP, asserts:
 *  - 200 responses (SPA fallback for client routes)
 *  - shell HTML contains the React root and brand markers
 *  - prerendered OG pages (if present) carry the right <title>
 *  - critical public assets exist on disk
 *  - three.js is NOT in the main shell bundle (Hall stays unshipped)
 *
 * Usage:
 *   npm run build && npm run check:smoke
 *   # or full gate:
 *   npm run check
 *
 * Env:
 *   VITE_BASE   base path used at build time (default /TheLegendaryPoet/)
 *   SMOKE_PORT  preview port (default 4173)
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const PORT = Number(process.env.SMOKE_PORT || 4173);
const BASE = (process.env.VITE_BASE || '/TheLegendaryPoet/').replace(/\/?$/, '/');

let fails = 0;
const fail = (m) => {
  console.error(`  ✕ ${m}`);
  fails += 1;
};
const ok = (m) => console.log(`  ✓ ${m}`);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchText(urlPath) {
  const url = `http://127.0.0.1:${PORT}${urlPath}`;
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 8000 }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          body: Buffer.concat(chunks).toString('utf8'),
          headers: res.headers,
        });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`timeout ${url}`));
    });
  });
}

async function waitForServer(attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetchText(BASE);
      if (res.status > 0) return;
    } catch {
      /* retry */
    }
    await sleep(250);
  }
  throw new Error(`preview did not become ready on :${PORT}`);
}

function assertDisk() {
  console.log('\n— Dist on disk —');
  if (!fs.existsSync(dist)) {
    fail('dist/ missing — run npm run build first');
    return;
  }
  ok('dist/ present');

  for (const f of ['index.html', 'favicon.svg', 'robots.txt', 'sitemap.xml', 'og-image.jpg']) {
    if (!fs.existsSync(path.join(dist, f))) fail(`missing dist/${f}`);
    else ok(`dist/${f}`);
  }

  // SPA fallback for GH Pages deep links
  if (!fs.existsSync(path.join(dist, '404.html'))) {
    // Create it the same way deploy.yml does, so local smoke matches prod.
    fs.copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'));
    ok('dist/404.html created for smoke (mirrors deploy.yml)');
  } else {
    ok('dist/404.html');
  }

  // three.js must not ship in the default bundle (Hall is not routed).
  const assets = fs.readdirSync(path.join(dist, 'assets')).filter((f) => f.endsWith('.js'));
  const mainish = assets.filter((f) => f.startsWith('index-') || f.startsWith('react-'));
  let threeInShell = false;
  for (const f of mainish) {
    const body = fs.readFileSync(path.join(dist, 'assets', f), 'utf8');
    if (body.includes('WebGLRenderer') || body.includes('THREE.Scene')) {
      threeInShell = true;
      fail(`three.js symbols found in shell chunk ${f}`);
    }
  }
  if (!threeInShell) ok('three.js not in shell chunks (Hall stays unshipped)');
}

async function assertHttp() {
  console.log('\n— HTTP routes —');
  // Client SPA routes: under GH Pages, unknown paths fall back to 404.html
  // (status may be 404 on real Pages; vite preview serves index for SPA).
  // We assert the document body is the app shell either way.
  const spaRoutes = [
    BASE,
    `${BASE}poets`,
    `${BASE}poets/alexander-pushkin`,
    `${BASE}articles`,
    `${BASE}music`,
    `${BASE}about`,
    `${BASE}hall`,
    `${BASE}archive`,
    `${BASE}this-route-does-not-exist-smoke`,
  ];

  for (const route of spaRoutes) {
    try {
      const res = await fetchText(route);
      const isShell =
        res.body.includes('id="root"') &&
        (res.body.includes('THE LEGENDARY POET') || res.body.includes('legendary'));
      if (!isShell) {
        fail(`${route} → ${res.status} (not app shell)`);
      } else if (res.status !== 200 && res.status !== 404) {
        // 404 is acceptable for deep links when only 404.html exists
        fail(`${route} → unexpected status ${res.status}`);
      } else {
        ok(`${route} → shell (${res.status})`);
      }
    } catch (e) {
      fail(`${route} → ${e.message}`);
    }
  }

  // Prerendered OG pages (written by prerender-og.mjs) — real 200 files.
  const ogCandidates = [
    { path: `${BASE}essays/yesenin-kutezhi/`, needle: 'Есенин' },
    { path: `${BASE}poets/alexander-pushkin/`, needle: 'Пушкин' },
    // Poet-attached article (must be prerendered via getAllArticles, not only globals)
    { path: `${BASE}articles/article-1/`, needle: 'Пушкин' },
  ];
  for (const { path: route, needle } of ogCandidates) {
    // Disk path: dist/essays/yesenin-kutezhi/index.html
    const rel = route.replace(BASE, '').replace(/\/$/, '');
    const disk = path.join(dist, rel, 'index.html');
    if (!fs.existsSync(disk)) {
      // Not fatal if prerender wasn't run — warn via fail only when present partially
      console.log(`  · skip ${route} (no prerender file — run prerender-og after build)`);
      continue;
    }
    try {
      const res = await fetchText(route);
      if (res.status !== 200) fail(`${route} → ${res.status}`);
      else if (!res.body.includes(needle) && !res.body.includes('THE LEGENDARY POET')) {
        fail(`${route} missing expected content`);
      } else {
        ok(`${route} → prerendered 200`);
      }
    } catch (e) {
      fail(`${route} → ${e.message}`);
    }
  }

  // Static asset
  try {
    const res = await fetchText(`${BASE}favicon.svg`);
    if (res.status !== 200) fail(`favicon.svg → ${res.status}`);
    else ok('favicon.svg served');
  } catch (e) {
    fail(`favicon.svg → ${e.message}`);
  }
}

async function main() {
  console.log(`\nLive smoke  base=${BASE}  port=${PORT}`);
  assertDisk();
  if (fails && !fs.existsSync(dist)) {
    console.error('\nFAIL — cannot start preview without dist/');
    process.exit(1);
  }

  const preview = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
    {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    },
  );

  let previewLog = '';
  preview.stdout.on('data', (d) => {
    previewLog += d.toString();
  });
  preview.stderr.on('data', (d) => {
    previewLog += d.toString();
  });

  try {
    await waitForServer();
    ok(`preview up on :${PORT}`);
    await assertHttp();
  } catch (e) {
    fail(e.message || String(e));
    if (previewLog) console.error('\n--- preview log ---\n' + previewLog.slice(-2000));
  } finally {
    preview.kill('SIGTERM');
    // Ensure exit even if preview ignores SIGTERM
    await sleep(300);
    try {
      preview.kill('SIGKILL');
    } catch {
      /* already dead */
    }
  }

  console.log('\n— Result —');
  if (fails === 0) {
    console.log('PASS — live smoke clean.');
    process.exit(0);
  }
  console.error(`FAIL — ${fails} smoke check(s).`);
  process.exit(1);
}

main();
