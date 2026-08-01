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
const artifact = 'brand-v19-candidate-comparison-matrix.png';
const candidate = read(candidateFile);
const production = read('src/components/brandEmblemV18.svg');
const component = read('src/components/BrandMark.tsx');
const browserQa = read('qa/brand-reference-comparison.spec.mjs');
const ledger = parse<Ledger>('qa/brand-marathon-pass-ledger.json');
const candidateId = ledger.geometryCandidate.id;

assert.equal(candidateId, 'v19.10-reference-geometry-reset');
assert.match(candidate, /<svg\b[^>]*viewBox="0 0 96 96"/);
assert.match(candidate, new RegExp(`data-brand-candidate="${candidateId}"`));
assert.ok(candidate.trimEnd().endsWith('</svg>'), 'v19 candidate is truncated');
assert.doesNotMatch(candidate, /<(?:image|rect|foreignObject|canvas)\b|data:image|base64,/i, 'raster shortcut in v19 candidate');
assert.doesNotMatch(candidate, /<animate(?:Transform|Motion)?\b|@keyframes/i, 'candidate must remain static until geometry is accepted');
assert.equal((candidate.match(/<g(?:\s[^>]*)?>/g) ?? []).filter((tag) => !/\/\s*>$/.test(tag)).length, (candidate.match(/<\/g>/g) ?? []).length, 'unbalanced candidate groups');
assert.ok((candidate.match(/<path\b/g) ?? []).length > 60, 'candidate lacks authored geometry depth');

for (const hook of ['atmosphere', 'figure', 'cloak', 'folds', 'hood', 'hood-layers', 'hood-seams', 'inner-rim', 'face-void', 'face-depth', 'neck-shadow', 'collar', 'throat', 'upper-folds', 'rim-light', 'cloth-highlights', 'texture']) {
  assert.ok(candidate.includes(`data-brand-${hook}`), `v19 candidate missing semantic layer: ${hook}`);
}

for (const geometryToken of [
  'M48 11.2C41.6 11.9',
  'M48 20C42.9 20.4',
  'M17.1 40.9C26.4 35.8',
  'M18.4 41.2C28.2 37.4',
  'M22.6 46C31.2 42.5',
  'M48 34.8C38.9 34.1',
  'M10.8 96C17.1 78.8',
  'M85.2 96C79 79.2',
]) assert.ok(candidate.includes(geometryToken), `v19.10 candidate geometry drifted: ${geometryToken}`);

assert.match(candidate, /широк(?:ой|ая).*ч[её]рн/i, 'candidate description must preserve the broad pure-black face void target');
assert.match(candidate, /диагональ/i, 'candidate description must preserve diagonal cloth target');
assert.ok(candidate.includes('filter="url(#wide)"'), 'macro aura field missing');
assert.ok(candidate.includes('data-brand-face-void="" data-brand-depth="deep"'), 'face cavern is not an independent deep layer');

assert.equal(ledger.marathonId, 'square-closeup-reference-v19');
assert.match(ledger.latestCandidate, /v19\.10 reference-led hood and crushed-cowl refinement/i);
assert.equal(ledger.geometryCandidate.file, candidateFile);
assert.equal(ledger.geometryCandidate.productionReplacement, false);
assert.equal(ledger.geometryCandidate.comparisonArtifact, `qa-artifacts/${artifact}`);
assert.match(ledger.geometryCandidate.decision, /pending exact-main visual review/i);
assert.ok(ledger.geometryCandidate.targets.length >= 8);
assert.equal(ledger.ownerDecision, 'not-reference-approved');
assert.match(ledger.evidenceStatus, /production remains unchanged/i);

assert.ok(browserQa.includes(candidateFile.replace('public/', '')), 'Browser QA does not load the v19 candidate');
assert.ok(browserQa.includes(artifact), 'Browser QA does not emit the v19 triple comparison');
assert.ok(browserQa.includes("const CANDIDATE_ID = ledger.geometryCandidate.id"), 'Browser QA candidate identity is not sourced from the ledger');
assert.ok(browserQa.includes('REFERENCE / PRODUCTION / ${CANDIDATE_LABEL} CANDIDATE'), 'dynamic triple comparison heading missing');

assert.doesNotMatch(production, /v19\.10-reference-geometry-reset/, 'unreviewed candidate leaked into production SVG');
assert.doesNotMatch(component, /brand-emblem-v19-candidate/, 'unreviewed candidate leaked into BrandMark');

console.log('brand candidate validation: v19.10 is layered, reference-led, QA-visible and isolated from production');
