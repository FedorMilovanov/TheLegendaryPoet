import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

type Ledger = {
  marathonId: string;
  latestCandidate: string;
  geometryCandidate: {
    id: string;
    file: string;
    productionReplacement: boolean;
    targets: string[];
    comparisonArtifact: string;
    decision: string;
  };
  visualBaseline: string;
  ownerDecision: string;
  evidenceStatus: string;
};

const resolve = (file: string) => path.resolve(file);
const read = (file: string) => fs.readFileSync(resolve(file), 'utf8');
const parse = <T>(file: string): T => JSON.parse(read(file)) as T;

const candidateFile = 'public/brand-emblem-v19-candidate.svg';
const candidateId = 'v19.6-reference-geometry-reset';
const artifact = 'brand-v19-candidate-comparison-matrix.png';
const candidate = read(candidateFile);
const production = read('src/components/brandEmblemV18.svg');
const component = read('src/components/BrandMark.tsx');
const browserQa = read('qa/brand-reference-comparison.spec.mjs');
const ledger = parse<Ledger>('qa/brand-marathon-pass-ledger.json');

assert.match(candidate, /<svg\b[^>]*viewBox="0 0 96 96"/);
assert.match(candidate, new RegExp(`data-brand-candidate="${candidateId}"`));
assert.ok(candidate.trimEnd().endsWith('</svg>'), 'v19 candidate is truncated');
assert.doesNotMatch(candidate, /<(?:image|rect|foreignObject|canvas)\b|data:image|base64,/i, 'raster shortcut in v19 candidate');
assert.doesNotMatch(candidate, /<animate(?:Transform|Motion)?\b|@keyframes/i, 'candidate must remain static until geometry is accepted');
assert.equal((candidate.match(/<g(?:\s[^>]*)?>/g) ?? []).filter((tag) => !/\/\s*>$/.test(tag)).length, (candidate.match(/<\/g>/g) ?? []).length, 'unbalanced candidate groups');
assert.ok((candidate.match(/<path\b/g) ?? []).length > 50, 'candidate lacks authored geometry depth');

for (const hook of ['atmosphere', 'figure', 'cloak', 'folds', 'hood', 'hood-layers', 'hood-seams', 'face-void', 'face-depth', 'neck-shadow', 'collar', 'throat', 'upper-folds', 'rim-light', 'texture']) {
  assert.ok(candidate.includes(`data-brand-${hook}`), `v19 candidate missing semantic layer: ${hook}`);
}

for (const geometryToken of [
  'M48 8.4C41.1 9.2',
  'M48 17.2C43 17.7',
  'M17.2 40.8C26.2 35.8',
  'M48 34.8C38.9 34.1',
  'M10.8 96C17.1 78.8',
  'M85.2 96C79 79.2',
  'M42.9 96C42.2 79.4',
]) assert.ok(candidate.includes(geometryToken), `v19.6 candidate geometry drifted: ${geometryToken}`);

assert.match(candidate, /широк(?:ой|ая).*ч[её]рн/i, 'candidate description must preserve the broad pure-black face void target');
assert.match(candidate, /диагональ/i, 'candidate description must preserve diagonal cloth target');
assert.ok(candidate.includes('filter="url(#wide)"'), 'macro aura field missing');
assert.ok(candidate.includes('data-brand-face-void="" data-brand-depth="deep"'), 'face cavern is not an independent deep layer');
assert.ok(candidate.includes('data-brand-hood-seams=""'), 'nested hood seam family is missing');

assert.equal(ledger.marathonId, 'square-closeup-reference-v19');
assert.match(ledger.latestCandidate, /v19\.6 reference-led geometry refinement/i);
assert.equal(ledger.geometryCandidate.id, candidateId);
assert.equal(ledger.geometryCandidate.file, candidateFile);
assert.equal(ledger.geometryCandidate.productionReplacement, false);
assert.equal(ledger.geometryCandidate.comparisonArtifact, `qa-artifacts/${artifact}`);
assert.match(ledger.geometryCandidate.decision, /pending exact-main visual review/i);
assert.ok(ledger.geometryCandidate.targets.length >= 7);
assert.equal(ledger.ownerDecision, 'not-reference-approved');
assert.match(ledger.evidenceStatus, /production remains unchanged/i);

assert.ok(browserQa.includes(candidateFile.replace('public/', '')), 'Browser QA does not load the v19 candidate');
assert.ok(browserQa.includes(artifact), 'Browser QA does not emit the v19 triple comparison');
assert.ok(browserQa.includes('REFERENCE / PRODUCTION / V19.6 CANDIDATE'), 'v19.6 triple comparison heading missing');

assert.doesNotMatch(production, /v19\.6-reference-geometry-reset/, 'unreviewed candidate leaked into production SVG');
assert.doesNotMatch(component, /brand-emblem-v19-candidate/, 'unreviewed candidate leaked into BrandMark');

console.log('brand candidate validation: v19.6 is layered, reference-led, QA-visible and isolated from production');
