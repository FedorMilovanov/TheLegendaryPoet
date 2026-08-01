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
const candidateId = 'v19.1-reference-geometry-reset';
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
assert.ok((candidate.match(/<path\b/g) ?? []).length > 35, 'candidate lacks authored geometry depth');

for (const hook of ['atmosphere', 'figure', 'cloak', 'folds', 'hood', 'hood-layers', 'face-void', 'face-depth', 'neck-shadow', 'collar', 'throat', 'upper-folds', 'rim-light', 'texture']) {
  assert.ok(candidate.includes(`data-brand-${hook}`), `v19 candidate missing semantic layer: ${hook}`);
}

for (const geometryToken of [
  'M48 4.4C41.6 5.6',
  'M48 14.1C42.7 14.5',
  'M20.6 40.2C27.3 35.6',
  'M48 34.6C39.3 34.1',
  'M12.6 96C17.4 79.9',
  'M83.4 96C78.6 80',
]) assert.ok(candidate.includes(geometryToken), `v19 candidate geometry drifted: ${geometryToken}`);

assert.match(candidate, /huge|огромн/i, 'candidate description must preserve the oversized face void target');
assert.match(candidate, /diagonal|диагональ/i, 'candidate description must preserve diagonal cloth target');
assert.ok(candidate.includes('filter="url(#v19-blur-wide)"'), 'macro aura field missing');
assert.ok(candidate.includes('data-brand-face-void="" data-brand-depth="deep"'), 'face cavern is not an independent deep layer');

assert.equal(ledger.marathonId, 'square-closeup-reference-v19');
assert.match(ledger.latestCandidate, /v19\.1 reference-led geometry reset/i);
assert.equal(ledger.geometryCandidate.id, candidateId);
assert.equal(ledger.geometryCandidate.file, candidateFile);
assert.equal(ledger.geometryCandidate.productionReplacement, false);
assert.equal(ledger.geometryCandidate.comparisonArtifact, `qa-artifacts/${artifact}`);
assert.match(ledger.geometryCandidate.decision, /pending exact-head visual review/i);
assert.ok(ledger.geometryCandidate.targets.length >= 6);
assert.equal(ledger.ownerDecision, 'not-reference-approved');
assert.match(ledger.evidenceStatus, /production remains unchanged/i);

assert.ok(browserQa.includes(candidateFile.replace('public/', '')), 'Browser QA does not load the v19 candidate');
assert.ok(browserQa.includes(artifact), 'Browser QA does not emit the v19 triple comparison');
assert.ok(browserQa.includes('REFERENCE / PRODUCTION / V19.1 CANDIDATE'), 'triple comparison heading missing');

assert.doesNotMatch(production, /v19\.1-reference-geometry-reset/, 'unreviewed candidate leaked into production SVG');
assert.doesNotMatch(component, /brand-emblem-v19-candidate/, 'unreviewed candidate leaked into BrandMark');

console.log('brand candidate validation: v19.1 is layered, reference-led, QA-visible and isolated from production');
