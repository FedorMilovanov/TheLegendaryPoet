import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { getAllEssays } from '../src/data/essays/index';
import type { Essay, EssaySummary } from '../src/types/essay';

const outputDir = path.resolve('public/data/essays');
const browserPublishedConsumers = [
  'src/pages/HomePage.tsx',
  'src/pages/ArticlesPage.tsx',
  'src/pages/EssayPage.tsx',
  'src/components/poet-detail/RelatedEssays.tsx',
] as const;
const browserAdapterPath = 'src/data/essays/browserEssayData.ts';
const relatedEssaysPath = 'src/components/poet-detail/RelatedEssays.tsx';
const poetDetailPath = 'src/pages/PoetDetailPage.tsx';
const essayPagePath = 'src/pages/EssayPage.tsx';
const eagerCatalogImportPattern = /from\s+['"][^'"]*data\/essays(?:\/index(?:\.ts)?)?['"]/;
const rawEssayImportPattern = /from\s+['"][^'"]*data\/essays\/(?!index(?:\.ts)?['"]|browserEssayData(?:\.ts)?['"])[^'"]+['"]/;
const browserAdapterImportPattern = /from\s+['"][^'"]*data\/essays\/browserEssayData(?:\.ts)?['"]/;

function jsonValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function summaryOf(essay: Essay): EssaySummary {
  const { blocks: _blocks, sources: _sources, ...summary } = essay;
  return summary;
}

function sourceFilesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFilesUnder(absolute);
    if (!entry.isFile() || !/\.(?:ts|tsx)$/.test(entry.name)) return [];
    return [absolute.split(path.sep).join('/')];
  });
}

const essays = [...getAllEssays()];
const expectedCatalog = essays.map((essay) => jsonValue(summaryOf(essay)));
const actualCatalog = JSON.parse(readFileSync(path.join(outputDir, 'catalog.json'), 'utf8')) as unknown;
assert.deepStrictEqual(actualCatalog, expectedCatalog, 'browser essay catalog diverged from canonical published metadata');

const expectedFiles = ['catalog.json', ...essays.map((essay) => `${essay.slug}.json`)].sort();
const actualFiles = readdirSync(outputDir).filter((entry) => entry.endsWith('.json')).sort();
assert.deepStrictEqual(actualFiles, expectedFiles, 'browser essay payload directory contains stale or missing JSON files');

for (const essay of essays) {
  const payload = JSON.parse(readFileSync(path.join(outputDir, `${essay.slug}.json`), 'utf8')) as unknown;
  assert.deepStrictEqual(
    payload,
    jsonValue(essay),
    `browser payload for ${essay.slug} diverged from the canonical published essay`,
  );
}

for (const relativePath of browserPublishedConsumers) {
  const source = readFileSync(relativePath, 'utf8');
  if (!browserAdapterImportPattern.test(source)) {
    throw new Error(`${relativePath} does not consume the generated browser essay adapter`);
  }
}

for (const relativePath of sourceFilesUnder('src')) {
  if (relativePath.startsWith('src/data/essays/')) continue;
  const source = readFileSync(relativePath, 'utf8');
  if (eagerCatalogImportPattern.test(source) || rawEssayImportPattern.test(source)) {
    throw new Error(`${relativePath} imports the eager full essay corpus into browser source`);
  }
}

const browserAdapterSource = readFileSync(browserAdapterPath, 'utf8');
if (eagerCatalogImportPattern.test(browserAdapterSource) || rawEssayImportPattern.test(browserAdapterSource)) {
  throw new Error('browserEssayData.ts must remain payload-only and must not import the canonical full corpus');
}

const primaryLoaderStart = browserAdapterSource.indexOf('export function getBrowserEssayBySlug');
if (primaryLoaderStart < 0) throw new Error('browserEssayData.ts lost the primary essay loader');
const primaryLoaderSource = browserAdapterSource.slice(primaryLoaderStart);
if (primaryLoaderSource.includes('getBrowserEssayCatalog(')) {
  throw new Error('primary essay readiness must not depend on the optional browser catalog');
}
if (!primaryLoaderSource.includes('fetch(`${payloadRoot}${encodeURIComponent(slug)}.json`, requestOptions)')) {
  throw new Error('primary essay loader must fetch the requested route payload directly');
}
if (!primaryLoaderSource.includes('response.status === 404')) {
  throw new Error('primary essay loader must preserve an explicit payload-level not-found outcome');
}
if (!primaryLoaderSource.includes("response.headers.get('content-type')")) {
  throw new Error('primary essay loader must inspect payload content type before parsing host fallbacks');
}
if (!primaryLoaderSource.includes("contentType.includes('text/html')")) {
  throw new Error('primary essay loader must classify only HTML SPA fallback as a host-level not-found outcome');
}
if (!primaryLoaderSource.includes('const value = await response.json() as unknown')) {
  throw new Error('primary essay loader must continue parsing actual non-HTML success responses as JSON');
}

if (!browserAdapterSource.includes('export function getOptionalBrowserEssayCatalog')) {
  throw new Error('browser essay adapter must expose a fail-soft optional catalog authority');
}
if (!/const promise = source\.catch\(\(\) => \[\]/.test(browserAdapterSource)) {
  throw new Error('optional catalog authority must convert catalog rejection to a stable empty secondary result');
}
if (!browserAdapterSource.includes('optionalCatalogRequest?.source === source')) {
  throw new Error('optional catalog authority must keep the caught promise stable for each source request');
}

const relatedEssaysSource = readFileSync(relatedEssaysPath, 'utf8');
if (!relatedEssaysSource.includes('getOptionalBrowserEssayCatalog')) {
  throw new Error('RelatedEssays must consume the fail-soft optional catalog authority');
}
if (relatedEssaysSource.includes('getBrowserEssayCatalog(')) {
  throw new Error('RelatedEssays must not consume the fatal/raw catalog authority directly');
}

const poetDetailSource = readFileSync(poetDetailPath, 'utf8');
if (!/<Suspense\s+fallback=\{null\}>[\s\S]*?<RelatedEssays\s+poetId=\{poet\.id\}\s*\/>[\s\S]*?<\/Suspense>/.test(poetDetailSource)) {
  throw new Error('PoetDetailPage must isolate RelatedEssays behind a local null-fallback Suspense boundary');
}

const essayPageSource = readFileSync(essayPagePath, 'utf8');
if (essayPageSource.includes('use(getBrowserEssayCatalog(')) {
  throw new Error('EssayPage primary route must not block on the full essay catalog');
}
if (!essayPageSource.includes('getOptionalBrowserEssayCatalog')) {
  throw new Error('EssayPage series enrichment must use the fail-soft optional catalog authority');
}
if (!/<Suspense\s+fallback=\{null\}>[\s\S]*?<EssaySeriesNavigation\s+essay=\{essay\}\s+visitKey=\{location\.key\}\s*\/>[\s\S]*?<\/Suspense>/.test(essayPageSource)) {
  throw new Error('EssayPage must isolate series navigation behind a local null-fallback Suspense boundary');
}

console.log(
  `Browser essay data parity: ${essays.length} lightweight catalog entries + ${essays.length} exact route payloads; browser src scan found no eager full-corpus consumer, ${browserPublishedConsumers.length} expected consumers use the generated adapter, primary-route readiness is isolated from optional catalog failure, and HTML SPA fallback preserves honest unknown-slug semantics without weakening JSON failures.`,
);
