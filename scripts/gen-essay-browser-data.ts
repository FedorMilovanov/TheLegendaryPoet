import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { getAllEssays } from '../src/data/essays/index';
import type { Essay, EssaySummary } from '../src/types/essay';

const outputDir = path.resolve('public/data/essays');
const catalogPath = path.join(outputDir, 'catalog.json');

function summaryOf(essay: Essay): EssaySummary {
  const { blocks: _blocks, sources: _sources, ...summary } = essay;
  return summary;
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

const essays = [...getAllEssays()];
const summaries = essays.map(summaryOf);

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
writeFileSync(catalogPath, stableJson(summaries), 'utf8');

for (const essay of essays) {
  writeFileSync(path.join(outputDir, `${essay.slug}.json`), stableJson(essay), 'utf8');
}

const payloadFiles = readdirSync(outputDir).filter((entry) => entry.endsWith('.json'));
if (payloadFiles.length !== essays.length + 1) {
  throw new Error(`browser essay payload generation mismatch: expected ${essays.length + 1}, found ${payloadFiles.length}`);
}

console.log(
  `Browser essay data: ${summaries.length} catalog entries + ${essays.length} route payloads generated from canonical published essays.`,
);
