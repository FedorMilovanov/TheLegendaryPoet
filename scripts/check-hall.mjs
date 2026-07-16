/**
 * Hall-specific smoke that does NOT require Playwright browsers.
 * Complements e2e/hall.spec.ts (visual) when Chromium can be installed.
 *
 * Checks:
 *  - wing data integrity (via dynamic import)
 *  - HallPage source free of three.js
 *  - museum components exist
 *  - live /hall route serves app shell (preview)
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.SMOKE_PORT || 4177);
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
      res.on('end', () =>
        resolve({ status: res.statusCode || 0, body: Buffer.concat(chunks).toString('utf8') }),
      );
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`timeout ${url}`));
    });
  });
}

async function main() {
  console.log('\n— Hall static —');

  const required = [
    'src/data/hall/wings.ts',
    'src/components/hall/museum/HallMuseum.tsx',
    'src/components/hall/museum/HallAtrium.tsx',
    'src/components/hall/museum/HallCompass.tsx',
    'src/components/hall/museum/HallWingSection.tsx',
    'src/components/hall/museum/HallNiche.tsx',
    'src/components/hall/museum/hallMuseum.css',
    'src/pages/HallPage.tsx',
    'docs/HALL_V3_PASSES.md',
    'e2e/hall.spec.ts',
  ];
  for (const rel of required) {
    if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`);
    else ok(rel);
  }

  const hallPage = fs.readFileSync(path.join(root, 'src/pages/HallPage.tsx'), 'utf8');
  if (/from ['"]three['"]|@react-three|HallOfPoets/.test(hallPage)) {
    fail('HallPage must not import three.js / HallOfPoets');
  } else ok('HallPage free of three.js');

  // Data via tsx-compatible dynamic import
  const { pathToFileURL: toUrl } = await import('node:url');
  // Use child process with tsx for TS modules
  const { spawnSync } = await import('node:child_process');
  const probe = spawnSync(
    'npx',
    [
      'tsx',
      '-e',
      `
      import { hallWings, getHallPoetIds } from './src/data/hall/index.ts';
      import { poets } from './src/data/library/index.ts';
      const ids = new Set(poets.map(p => p.id));
      const hung = getHallPoetIds();
      if (hallWings.length !== 4) { console.error('wings'); process.exit(2); }
      if (hung.some(id => !ids.has(id))) { console.error('missing'); process.exit(3); }
      if (hallWings.find(w => w.id === 'modern')?.poetIds.length) { console.error('modern'); process.exit(4); }
      console.log('HALL_OK', hung.length);
      `,
    ],
    { cwd: root, encoding: 'utf8' },
  );
  if (probe.status !== 0) {
    fail(`hall data probe failed: ${probe.stderr || probe.stdout}`);
  } else {
    ok(`hall data: ${probe.stdout.trim()}`);
  }

  const dist = path.join(root, 'dist');
  if (!fs.existsSync(path.join(dist, 'index.html'))) {
    console.log('  · skip live route (no dist — run build first)');
  } else {
    console.log('\n— Hall live route —');
    if (!fs.existsSync(path.join(dist, '404.html'))) {
      fs.copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'));
    }
    const preview = spawn(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
      { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    try {
      let ready = false;
      for (let i = 0; i < 40; i++) {
        try {
          const res = await fetchText(BASE);
          if (res.status > 0) {
            ready = true;
            break;
          }
        } catch {
          /* retry */
        }
        await sleep(250);
      }
      if (!ready) fail('preview not ready');
      else {
        ok(`preview :${PORT}`);
        const res = await fetchText(`${BASE}hall`);
        const shell = res.body.includes('id="root"');
        if (!shell) fail('/hall not app shell');
        else ok(`/hall → shell (${res.status})`);
        // three.js must not be a dependency of the hall page chunk name alone —
        // assert no WebGL in index shell (already in check-smoke).
      }
    } finally {
      preview.kill('SIGTERM');
      await sleep(200);
      try {
        preview.kill('SIGKILL');
      } catch {
        /* */
      }
    }
  }

  console.log('\n— Result —');
  if (fails === 0) {
    console.log('PASS — hall smoke clean. (Run npm run test:hall when Chromium is available.)');
    process.exit(0);
  }
  console.error(`FAIL — ${fails} hall check(s).`);
  process.exit(1);
}

main();
