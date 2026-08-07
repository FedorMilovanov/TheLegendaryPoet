import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { getAllEssays } from '../src/data/essays/index';
import type { Essay, EssaySummary } from '../src/types/essay';

const outputDir = path.resolve('public/data/essays');
const browserSourceFiles = [
  'src/pages/ArticlesPage.tsx',
  'src/pages/EssayPage.tsx',
  'src/data/essays/browserEssayData.ts',
] as const;

function jsonValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function summaryOf(essay: Essay): EssaySummary {
  const { blocks: _blocks, sources: _sources, ...summary } = essay;
  return summary;
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

for (const relativePath of browserSourceFiles) {
  const source = readFileSync(relativePath, 'utf8');
  if (/from\s+['"]\.\.\/data\/essays(?:\/index)?['"]/.test(source)) {
    throw new Error(`${relativePath} still imports the eager full essay catalog`);
  }
  if (/from\s+['"]\.\/index['"]/.test(source) && relativePath.endsWith('browserEssayData.ts')) {
    throw new Error('browserEssayData.ts must not import the canonical full-corpus index at runtime');
  }
}

console.log(
  `Browser essay data parity: ${essays.length} lightweight catalog entries + ${essays.length} exact route payloads; browser pages do not import the eager full corpus.`,
);
