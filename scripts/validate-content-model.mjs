import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const fail = (message) => failures.push(message);

if (exists('src/data/library/articles.ts')) fail('src/data/library/articles.ts must remain retired');

const forbidden = [
  ['src/types/poet.ts', /export\s+interface\s+Article\b/, 'legacy Article interface'],
  ['src/types/poet.ts', /\barticles\s*:\s*Article\[\]/, 'Poet.articles contract'],
  ['src/data/poets.ts', /\barticles\b/, 'legacy articles export'],
  ['src/data/library/index.ts', /export\s+\{\s*articles\s*\}/, 'legacy articles export'],
  ['scripts/validate-library.ts', /\barticles\b/, 'legacy article validator code'],
  ['scripts/new-poet.ts', /\barticles\s*:\s*\[\]/, 'legacy scaffold property'],
  ['src/utils/dailyContent.ts', /\barticles\s*:\s*\[\]/, 'legacy fallback property'],
];
for (const [relativePath, pattern, label] of forbidden) {
  if (pattern.test(read(relativePath))) fail(`${relativePath} still contains ${label}`);
}

const libraryDir = path.join(root, 'src/data/library');
for (const name of fs.readdirSync(libraryDir).filter((entry) => entry.endsWith('.ts'))) {
  const relativePath = path.posix.join('src/data/library', name);
  if (/^\s*articles\s*:/m.test(read(relativePath))) {
    fail(`${relativePath} still declares a legacy articles property`);
  }
}

const archived = {
  'article-main-1-russian-soul.md': 'f6c6c0b43422f1be447efa9bb75c905e3a5f441ea9b1d0826c6197e8763b4d0b',
  'article-main-2-poetry-and-music.md': 'b2baa1581d21be84d5ddfc1d0153129fb9e199576870b1bb7424c1411cb826da',
  'article-1-pushkin-biblical-motifs.md': '7e5f2453dc9cee956d2b2537843b0df6ce5a52f90a781bb5d83614ff40da4ce2',
  'article-2-yesenin-tragedy.md': '98d040c52bd4430ea1da7c2d7e6bf7088b7af1b428830e04f8fccbd8894da750',
  'article-3-akhmatova-prayer.md': 'fa3f001ae004669c43df50039abde451a1f40735fdec0cdc0c24511531c83d3b',
};
const archiveRoot = 'docs/legacy-content';
if (!exists(`${archiveRoot}/README.md`)) fail(`missing ${archiveRoot}/README.md`);
for (const [name, expected] of Object.entries(archived)) {
  const relativePath = `${archiveRoot}/${name}`;
  if (!exists(relativePath)) {
    fail(`missing zero-loss legacy archive ${relativePath}`);
    continue;
  }
  const source = read(relativePath);
  const match = source.match(/<!-- BEGIN LEGACY CONTENT -->\n([\s\S]*?)\n<!-- END LEGACY CONTENT -->/);
  if (!match) {
    fail(`${relativePath} has no bounded legacy content`);
    continue;
  }
  const actual = crypto.createHash('sha256').update(match[1]).digest('hex');
  if (actual !== expected) fail(`${relativePath} content digest ${actual} does not match ${expected}`);
}

const app = read('src/App.tsx');
const routeContract = JSON.parse(read('src/routes/route-contract.json'));
const expectedRedirects = [
  ['/articles/article-1', '/poets/alexander-pushkin'],
  ['/articles/article-2', '/essays/yesenin-kutezhi'],
  ['/articles/article-3', '/poets/anna-akhmatova'],
  ['/articles/article-main-1', '/articles'],
  ['/articles/article-main-2', '/music'],
];
for (const [from, to] of expectedRedirects) {
  const matches = routeContract.redirects?.filter((redirect) => redirect.from === from && redirect.to === to) ?? [];
  if (matches.length !== 1) fail(`expected one compatibility redirect for ${from} -> ${to}, found ${matches.length}`);
}

const unknownArticleProbe = '/articles/route-audit-legacy';
if (routeContract.redirects?.some((redirect) => redirect.from === unknownArticleProbe)) {
  fail(`unknown legacy article probe must not be redirected: ${unknownArticleProbe}`);
}
if (!routeContract.notFoundProbes?.includes(unknownArticleProbe)) {
  fail(`unknown legacy article probe must be registered as NotFound evidence: ${unknownArticleProbe}`);
}
if (!app.includes('legacyRedirects.map')) fail('App.tsx must render explicit compatibility redirects from the route contract');
if (app.includes('path="/articles/:id"')) fail('App.tsx must not restore the broad unknown-article soft-404 redirect');
if (!app.includes('<Route path="*" element={<NotFoundPage />}')) fail('App.tsx must retain the normal NotFound boundary');

if (failures.length) {
  console.error('content model contract: FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('content model contract: one live Essay engine; five exact legacy drafts archived; explicit redirects retained; unknown legacy ids reach NotFound');
