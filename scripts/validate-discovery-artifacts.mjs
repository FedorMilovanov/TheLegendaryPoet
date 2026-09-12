import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { computeIndexNowDelta } from './indexnow-delta.mjs';

const root = process.cwd();
const artifacts = [
  { path: 'public/sitemap.xml', generator: 'sitemap' },
  { path: 'public/discovery-manifest.json', generator: 'sitemap' },
  { path: 'public/feed.xml', generator: 'feed' },
];

function readCanonicalArtifact(absolutePath) {
  if (!fs.existsSync(absolutePath)) return null;
  return Buffer.from(fs.readFileSync(absolutePath, 'utf8').replace(/\r\n?/g, '\n'), 'utf8');
}

const originals = new Map();
for (const artifact of artifacts) {
  const absolutePath = path.join(root, artifact.path);
  originals.set(artifact.path, readCanonicalArtifact(absolutePath));
}

const npmCommand = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'npm';
const failures = [];
const generatedSnapshots = new Map();

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function runGenerator(scriptName) {
  const args = process.platform === 'win32'
    ? ['/d', '/s', '/c', `npm.cmd run --silent ${scriptName}`]
    : ['run', '--silent', scriptName];
  const result = spawnSync(npmCommand, args, {
    cwd: root,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const diagnostics = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(`npm run ${scriptName} failed${diagnostics ? `:\n${diagnostics}` : ''}`);
  }
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function fakeManifest(records) {
  return {
    schemaVersion: 1,
    site: 'https://thelegendarypoet.ru',
    canonicalUrls: records.map(([url, fingerprint]) => ({ url, state: 'ready', fingerprint })),
  };
}

try {
  for (const generator of [...new Set(artifacts.map((artifact) => artifact.generator))]) runGenerator(generator);

  for (const artifact of artifacts) {
    const absolutePath = path.join(root, artifact.path);
    const original = originals.get(artifact.path);
    const generated = readCanonicalArtifact(absolutePath);
    generatedSnapshots.set(artifact.path, generated);

    if (original === null) {
      failures.push(`${artifact.path} is generated but not committed`);
      continue;
    }

    if (generated === null || !original.equals(generated)) {
      failures.push(`${artifact.path} is stale relative to its canonical source data`);
    }
  }

  const policy = JSON.parse(readText('src/routes/discovery-policy.json'));
  const routeContract = JSON.parse(readText('src/routes/route-contract.json'));
  const manifest = JSON.parse(generatedSnapshots.get('public/discovery-manifest.json')?.toString('utf8') || '{}');

  expect(policy.schemaVersion === 1, 'discovery policy schemaVersion must be 1');
  expect(routeContract.schemaVersion === 1, 'route contract schemaVersion must be 1');

  const expectedPolicies = {
    ready: { canonical: 'self', ogUrl: 'self', schema: true, sitemap: true, indexNow: true },
    noindex: { canonical: 'self', ogUrl: 'self', schema: true, sitemap: false, indexNow: false },
    'not-found': { canonical: 'none', ogUrl: 'none', schema: false, sitemap: false, indexNow: false },
    loading: { canonical: 'none', ogUrl: 'none', schema: false, sitemap: false, indexNow: false },
    error: { canonical: 'none', ogUrl: 'none', schema: false, sitemap: false, indexNow: false },
    redirect: { canonical: 'target', ogUrl: 'none', schema: false, sitemap: false, indexNow: false },
  };

  for (const [state, expected] of Object.entries(expectedPolicies)) {
    const actual = policy.states?.[state];
    expect(Boolean(actual), `discovery policy missing state ${state}`);
    for (const [key, value] of Object.entries(expected)) {
      expect(actual?.[key] === value, `discovery policy ${state}.${key} must be ${JSON.stringify(value)}`);
    }
    expect(/^noindex/.test(actual?.robots || '') === !expected.sitemap, `discovery policy ${state} robots/indexability mismatch`);
  }

  const allowedRouteStates = new Set(['ready', 'noindex', 'not-found']);
  for (const route of routeContract.routes) {
    expect(allowedRouteStates.has(route.discoveryState), `route ${route.id} has invalid discoveryState`);
    expect(!('sitemapLastmod' in route), `route ${route.id} must not restore coarse sitemapLastmod authority`);
    if (route.sitemap) {
      expect(route.discoveryState === 'ready', `sitemap route ${route.id} must be ready`);
      expect(policy.states[route.discoveryState]?.sitemap === true, `sitemap route ${route.id} policy must allow sitemap`);
    }
    if (route.discoveryState !== 'ready') expect(route.sitemap === false, `non-ready route ${route.id} must not enter sitemap`);
  }
  const wildcards = routeContract.routes.filter((route) => route.path === '*');
  expect(wildcards.length === 1 && wildcards[0].discoveryState === 'not-found', 'route contract must have one not-found wildcard');

  expect(manifest.schemaVersion === 1, 'generated discovery manifest schemaVersion must be 1');
  expect(manifest.policySchemaVersion === policy.schemaVersion, 'manifest policy schema version drift');
  expect(Array.isArray(manifest.canonicalUrls) && manifest.canonicalUrls.length > 10, 'manifest must contain canonical URL inventory');
  expect(new Set(manifest.canonicalUrls?.map((record) => record.url)).size === manifest.canonicalUrls?.length, 'manifest canonical URLs must be unique');
  for (const record of manifest.canonicalUrls || []) {
    expect(record.state === 'ready', `manifest URL is not ready: ${record.url}`);
    expect(/^[a-f0-9]{64}$/.test(record.fingerprint || ''), `manifest fingerprint invalid: ${record.url}`);
  }

  const sitemap = generatedSnapshots.get('public/sitemap.xml')?.toString('utf8') || '';
  const sitemapUrls = [...sitemap.matchAll(/<loc>(https:\/\/thelegendarypoet\.ru[^<]*)<\/loc>/g)]
    .map((match) => match[1])
    .filter((url) => !/\.(?:jpg|jpeg|png|webp|svg)$/i.test(new URL(url).pathname));
  expect(
    JSON.stringify([...sitemapUrls].sort()) === JSON.stringify(manifest.canonicalUrls.map((record) => record.url).sort()),
    'sitemap URL inventory must equal discovery manifest canonical URL inventory',
  );

  const lastmodPaths = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)]
    .map((match) => match[1])
    .map((block) => ({
      pathname: block.match(/<loc>https:\/\/thelegendarypoet\.ru([^<]*)<\/loc>/)?.[1] || '',
      date: block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] || null,
    }))
    .filter((record) => record.date !== null);
  for (const { pathname, date } of lastmodPaths) {
    expect(pathname.startsWith('/essays/'), `only essays with owned editorial clocks may emit sitemap lastmod: ${pathname}`);
    expect(/^\d{4}-\d{2}-\d{2}$/.test(date || ''), `invalid sitemap lastmod date for ${pathname}`);
  }

  const unchanged = fakeManifest([
    ['https://thelegendarypoet.ru/a', 'a'.repeat(64)],
    ['https://thelegendarypoet.ru/b', 'b'.repeat(64)],
  ]);
  const unchangedDelta = computeIndexNowDelta(unchanged, structuredClone(unchanged));
  expect(unchangedDelta.mode === 'delta' && unchangedDelta.urls.length === 0, 'unchanged manifests must submit no IndexNow URLs');

  const previous = fakeManifest([
    ['https://thelegendarypoet.ru/a', 'a'.repeat(64)],
    ['https://thelegendarypoet.ru/b', 'b'.repeat(64)],
    ['https://thelegendarypoet.ru/deleted', 'd'.repeat(64)],
  ]);
  const current = fakeManifest([
    ['https://thelegendarypoet.ru/a', 'a'.repeat(64)],
    ['https://thelegendarypoet.ru/b', 'c'.repeat(64)],
    ['https://thelegendarypoet.ru/new', 'e'.repeat(64)],
  ]);
  const delta = computeIndexNowDelta(current, previous);
  expect(JSON.stringify(delta.added) === JSON.stringify(['https://thelegendarypoet.ru/new']), 'IndexNow delta must identify only added URLs');
  expect(JSON.stringify(delta.changed) === JSON.stringify(['https://thelegendarypoet.ru/b']), 'IndexNow delta must identify only changed URLs');
  expect(JSON.stringify(delta.deleted) === JSON.stringify(['https://thelegendarypoet.ru/deleted']), 'IndexNow delta must identify removed URLs');
  expect(delta.urls.length === 3 && !delta.urls.includes('https://thelegendarypoet.ru/a'), 'IndexNow delta must not resubmit unchanged URLs');

  const bootstrap = computeIndexNowDelta(current, null);
  expect(bootstrap.mode === 'bootstrap' && bootstrap.urls.length === current.canonicalUrls.length, 'missing previous manifest must use explicit bootstrap mode');
  const forced = computeIndexNowDelta(current, previous, { forceFull: true });
  expect(forced.mode === 'forced-full' && forced.urls.length === current.canonicalUrls.length, 'full-site IndexNow submission must require explicit force');

  const useSeo = readText('src/hooks/useSeo.ts');
  const discoveryHead = readText('src/routes/discoveryHead.ts');
  const routeModules = readText('src/routes/routeModules.ts');
  const errorBoundary = readText('src/components/ErrorBoundary.tsx');
  const notFound = readText('src/pages/NotFoundPage.tsx');
  const prerender = readText('scripts/prerender-og.mjs');
  const vite = readText('vite.config.ts');
  const submitIndexNow = readText('scripts/submit-indexnow.mjs');
  const indexNowWorkflow = readText('.github/workflows/indexnow.yml');

  expect(useSeo.includes('discoveryStateForPath') && useSeo.includes('applyDiscoveryHead'), 'useSeo must derive runtime head from shared discovery state');
  expect(discoveryHead.includes("document.getElementById('route-jsonld')?.remove()"), 'non-schema states must remove stale route JSON-LD');
  expect(discoveryHead.includes("removeLink('canonical')"), 'non-canonical states must remove stale canonical');
  expect(discoveryHead.includes("removeMeta('og:url', 'property')"), 'non-canonical states must remove stale og:url');
  expect(routeModules.includes("applyTransientDiscoveryHead('loading'"), 'lazy route load must own loading machine state');
  expect(routeModules.includes("applyTransientDiscoveryHead('error'"), 'lazy route failure must own error machine state');
  expect(errorBoundary.includes("applyTransientDiscoveryHead('error'"), 'render errors must replace previous-route machine metadata');
  expect(notFound.includes("state: 'not-found'"), 'hydrated not-found page must use explicit not-found state');
  expect(prerender.includes("policyFor('not-found')"), 'static 404 must derive from shared not-found policy');
  expect(prerender.includes('stateForStaticPath(page.routePath)'), 'static prerender pages must derive route discovery state');
  expect(vite.includes('DISCOVERY_POLICY_PATH') && vite.includes('redirectPolicy'), 'legacy alias materialization must derive redirect state from shared policy');
  expect(!submitIndexNow.includes('<loc>'), 'IndexNow submitter must not treat the sitemap inventory as its change set');
  expect(submitIndexNow.includes('computeIndexNowDelta'), 'IndexNow submitter must use deterministic manifest delta');
  expect(indexNowWorkflow.includes('fetch-depth: 2'), 'IndexNow workflow must fetch the previous main snapshot');
  expect(indexNowWorkflow.includes('INDEXNOW_BASE_MANIFEST_PATH'), 'IndexNow workflow must pass the previous discovery manifest');
} finally {
  for (const artifact of artifacts) {
    const absolutePath = path.join(root, artifact.path);
    const original = originals.get(artifact.path);

    if (original === null) {
      fs.rmSync(absolutePath, { force: true });
    } else {
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, original);
    }
  }
}

if (failures.length > 0) {
  console.error('Committed discovery/state validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  for (const artifact of artifacts) {
    const original = originals.get(artifact.path);
    const generated = generatedSnapshots.get(artifact.path);
    if (generated && (original === null || !original.equals(generated))) {
      console.error(`__EXPECTED_${artifact.path.replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}_BEGIN__`);
      console.error(generated.toString('utf8').trimEnd());
      console.error(`__EXPECTED_${artifact.path.replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}_END__`);
    }
  }
  console.error('Regenerate and commit canonical discovery artifacts with: npm run sitemap && npm run feed');
  process.exit(1);
}

console.log(`Committed discovery artifacts are current: ${artifacts.map((artifact) => artifact.path).join(', ')}.`);
console.log('Discovery state policy, truthful lastmod authority and change-scoped IndexNow delta are fail-closed.');
