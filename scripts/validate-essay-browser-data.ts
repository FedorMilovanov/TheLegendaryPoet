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

console.log(
  `Browser essay data parity: ${essays.length} lightweight catalog entries + ${essays.length} exact route payloads; browser src scan found no eager full-corpus consumer, and ${browserPublishedConsumers.length} expected consumers use the generated adapter.`,
);
