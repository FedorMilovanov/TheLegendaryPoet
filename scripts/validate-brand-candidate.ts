import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

type CandidateDescriptor = {
  id: string;
  file: string;
  productionReplacement: boolean;
  targets: string[];
  comparisonArtifact: string;
  decision: string;
};

type Ledger = {
  marathonId: string;
  latestCandidate: string;
  geometryCandidate: CandidateDescriptor;
  microCandidate: CandidateDescriptor & { opticalSizes: number[] };
  visualBaseline: string;
  ownerDecision: string;
  evidenceStatus: string;
};

type CandidateEvaluation = {
  referenceId: string;
  activeCandidateId: string;
  activeCandidateFile: string;
  productionSource: string;
  productionReplacement: boolean;
  status: string;
  ownerDecision: string;
  reviewedOpticalSizes: number[];
  passHistory: Array<{ pass: string; result: string; finding: string }>;
  confirmedImprovements: string[];
  remainingBlockers: string[];
  nextPasses: string[];
  promotionRule: string;
};

const resolve = (file: string) => path.resolve(file);
const read = (file: string) => fs.readFileSync(resolve(file), 'utf8');
const parse = <T>(file: string): T => JSON.parse(read(file)) as T;

const candidateFile = 'public/brand-emblem-v19-candidate.svg';
const microFile = 'public/brand-emblem-v19-micro-candidate.svg';
const candidateArtifact = 'brand-v19-candidate-comparison-matrix.png';
const microArtifact = 'brand-v19-micro-candidate-matrix.png';
const candidate = read(candidateFile);
const micro = read(microFile);
const production = read('src/components/brandEmblemV18.svg');
const productionMicro = read('public/brand-mark-micro.svg');
const component = read('src/components/BrandMark.tsx');
const browserQa = read('qa/brand-reference-comparison.spec.mjs');
const microQa = read('qa/brand-v19-micro.spec.mjs');
const playwrightConfig = read('playwright.config.mjs');
const ledger = parse<Ledger>('qa/brand-marathon-pass-ledger.json');
const evaluation = parse<CandidateEvaluation>('qa/brand-v19-candidate-evaluation.json');
const candidateId = ledger.geometryCandidate.id;
const microId = ledger.microCandidate.id;

assert.equal(candidateId, 'v19.11-reference-geometry-reset');
assert.match(candidate, /<svg\b[^>]*viewBox="0 0 96 96"/);
assert.match(candidate, new RegExp(`data-brand-candidate="${candidateId}"`));
assert.ok(candidate.trimEnd().endsWith('</svg>'), 'v19 candidate is truncated');
assert.doesNotMatch(candidate, /<(?:image|rect|foreignObject|canvas)\b|data:image|base64,/i, 'raster shortcut in v19 candidate');
assert.doesNotMatch(candidate, /<animate(?:Transform|Motion)?\b|@keyframes/i, 'candidate must remain static until geometry is accepted');
assert.equal((candidate.match(/<g(?:\s[^>]*)?>/g) ?? []).filter((tag) => !/\/\s*>$/.test(tag)).length, (candidate.match(/<\/g>/g) ?? []).length, 'unbalanced candidate groups');
assert.ok((candidate.match(/<path\b/g) ?? []).length > 70, 'candidate lacks authored geometry and branch depth');

for (const hook of ['atmosphere', 'aura-haze', 'aura-branches', 'figure', 'cloak', 'folds', 'hood', 'hood-layers', 'hood-seams', 'inner-rim', 'face-void', 'face-depth', 'neck-shadow', 'collar', 'throat', 'upper-folds', 'rim-light', 'cloth-highlights', 'texture']) {
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
  'M38.8 8.4L35.4 10.1',
  'M57.2 8.1L60.6 9.8',
]) assert.ok(candidate.includes(geometryToken), `v19.11 candidate geometry drifted: ${geometryToken}`);

assert.match(candidate, /широк(?:ой|ая).*ч[её]рн/i, 'candidate description must preserve the broad pure-black face void target');
assert.match(candidate, /диагональ/i, 'candidate description must preserve diagonal cloth target');
assert.ok(candidate.includes('filter="url(#wide)"'), 'macro aura field missing');
assert.ok(candidate.includes('data-brand-face-void="" data-brand-depth="deep"'), 'face cavern is not an independent deep layer');
assert.equal((candidate.match(/data-brand-aura-(?:haze|branches)/g) ?? []).length, 2, 'aura haze/branch separation is missing');

assert.equal(microId, 'v19.14-reference-micro-redraw');
assert.match(micro, /<svg\b[^>]*viewBox="0 0 32 32"/);
assert.match(micro, new RegExp(`data-brand-micro-candidate="${microId}"`));
assert.ok(micro.trimEnd().endsWith('</svg>'), 'micro candidate is truncated');
assert.doesNotMatch(micro, /<(?:image|rect|foreignObject|canvas)\b|data:image|base64,/i, 'raster shortcut in micro candidate');
assert.doesNotMatch(micro, /<animate(?:Transform|Motion)?\b|@keyframes/i, 'micro candidate must remain static');
assert.ok((micro.match(/<path\b/g) ?? []).length >= 16, 'micro candidate lacks optical geometry');
for (const hook of ['atmosphere', 'figure', 'cloak', 'folds', 'hood', 'face', 'cowl', 'rim']) {
  assert.ok(micro.includes(`data-brand-micro-${hook}`), `micro candidate missing semantic layer: ${hook}`);
}
assert.deepEqual(ledger.microCandidate.opticalSizes, [32, 24, 16]);
assert.equal(ledger.microCandidate.file, microFile);
assert.equal(ledger.microCandidate.productionReplacement, false);
assert.equal(ledger.microCandidate.comparisonArtifact, `qa-artifacts/${microArtifact}`);
assert.match(ledger.microCandidate.decision, /pending exact-main optical review/i);
assert.ok(ledger.microCandidate.targets.length >= 5);

assert.equal(ledger.marathonId, 'square-closeup-reference-v19');
assert.match(ledger.latestCandidate, /v19\.14 optical micro companion/i);
assert.equal(ledger.geometryCandidate.file, candidateFile);
assert.equal(ledger.geometryCandidate.productionReplacement, false);
assert.equal(ledger.geometryCandidate.comparisonArtifact, `qa-artifacts/${candidateArtifact}`);
assert.match(ledger.geometryCandidate.decision, /pending exact-main visual review/i);
assert.ok(ledger.geometryCandidate.targets.length >= 8);
assert.equal(ledger.ownerDecision, 'not-reference-approved');
assert.match(ledger.evidenceStatus, /production remains unchanged/i);

assert.equal(evaluation.referenceId, 'canonical-hooded-figure-v2-clean-base');
assert.equal(evaluation.activeCandidateId, candidateId);
assert.equal(evaluation.activeCandidateFile, candidateFile);
assert.equal(evaluation.productionSource, ledger.visualBaseline);
assert.equal(evaluation.productionReplacement, false);
assert.equal(evaluation.status, 'candidate-under-reference-review');
assert.equal(evaluation.ownerDecision, 'not-reference-approved');
assert.deepEqual(evaluation.reviewedOpticalSizes, [256, 192, 128, 96, 64, 56, 44, 32, 24, 16]);
assert.equal(evaluation.passHistory.length, 13);
assert.deepEqual(evaluation.passHistory.map((item) => item.pass), ['v19.1', 'v19.2', 'v19.3', 'v19.4', 'v19.5', 'v19.6', 'v19.7', 'v19.8', 'v19.9', 'v19.10', 'v19.11', 'v19.12', 'v19.13']);
assert.equal(evaluation.passHistory.find((item) => item.pass === 'v19.11')?.result, 'active-main-candidate');
assert.equal(evaluation.passHistory.at(-1)?.result, 'reviewed-not-promoted');
assert.ok(evaluation.confirmedImprovements.some((item) => /dark gaps|тёмн/i.test(item)));
assert.ok(evaluation.remainingBlockers.length >= 6);
assert.ok(evaluation.nextPasses.some((item) => item.startsWith('v19.14')));
assert.match(evaluation.promotionRule, /owner explicitly approves/i);

assert.ok(browserQa.includes(candidateFile.replace('public/', '')), 'Browser QA does not load the full-size candidate');
assert.ok(browserQa.includes(candidateArtifact), 'Browser QA does not emit the full-size triple comparison');
assert.ok(browserQa.includes("const CANDIDATE_ID = ledger.geometryCandidate.id"), 'Browser QA candidate identity is not sourced from the ledger');
assert.ok(browserQa.includes('REFERENCE / PRODUCTION / ${CANDIDATE_LABEL} CANDIDATE'), 'dynamic full-size comparison heading missing');
assert.ok(microQa.includes("const candidate = ledger.microCandidate.file"), 'micro QA identity is not sourced from the ledger');
assert.ok(microQa.includes(microArtifact), 'micro QA does not emit the optical matrix');
assert.match(playwrightConfig, /brand-v19-micro/);

assert.doesNotMatch(production, /v19\.11-reference-geometry-reset/, 'unreviewed full-size candidate leaked into production SVG');
assert.doesNotMatch(productionMicro, /v19\.14-reference-micro-redraw/, 'unreviewed micro candidate leaked into production micro SVG');
assert.doesNotMatch(component, /brand-emblem-v19-(?:micro-)?candidate/, 'unreviewed candidate leaked into BrandMark');

console.log('brand candidate validation: v19.11 full-size and v19.14 micro candidates are QA-visible and isolated from production');
