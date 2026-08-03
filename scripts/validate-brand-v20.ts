import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

type Target = { allowed?: [number, number]; minimum?: number };
type Candidate = {
  id: string;
  file: string;
  designGrid: [number, number];
  reviewSizes: number[];
  ratios: Record<string, number>;
  composition?: Record<string, number>;
  compositionEligible?: boolean;
  fieldVisibility?: { minimumRearBranches: number; minimumStrokeOpacity: number; minimumStrokeWidth: number };
  numericGeometryEligible: boolean;
  productionReplacement: boolean;
  reviewerDecision: string;
};

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');
const contract = JSON.parse(read('qa/reference/brand-reference-contract.json')) as {
  referenceId: string;
  targets: Record<string, Target>;
  compositionTargets: Record<string, Target>;
};
const sheet = JSON.parse(read('qa/reference/brand-v20-reference-sheet.json')) as {
  referenceId: string;
  referenceFile: string;
  referenceSha256: string;
  candidates: Candidate[];
  promotionPolicy: string;
};
const ledger = JSON.parse(read('qa/brand-v20-candidate-ledger.json')) as {
  family: string;
  fullSizeCandidate: Candidate & { visibleFieldEligible: boolean };
  microCandidate: Candidate;
  iterationHistory: Array<{ full: string; micro: string; verdict: string }>;
  promotionBlockers: string[];
  promotionPolicy: string;
};

const full = read('public/brand-emblem-v20-candidate.svg');
const micro = read('public/brand-emblem-v20-micro-candidate.svg');
const vectorWorkflow = read('.github/workflows/brand-qa.yml');
const deepWorkflow = read('.github/workflows/brand-deep-audit.yml');
const evidenceSpec = read('qa/brand-v20-reference.spec.mjs');
const packageJson = read('package.json');

assert.equal(sheet.referenceId, contract.referenceId);
assert.equal(sheet.referenceFile, 'qa/reference/brand-emblem-canonical-reference.webp');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(sheet.referenceFile)).digest('hex'), sheet.referenceSha256);
assert.equal(sheet.candidates.length, 2);
const [fullSheet, microSheet] = sheet.candidates;

assert.equal(fullSheet.id, 'v20.13-reference-attached-electric-drapery');
assert.equal(fullSheet.file, 'public/brand-emblem-v20-candidate.svg');
assert.deepEqual(fullSheet.designGrid, [96, 96]);
assert.deepEqual(fullSheet.reviewSizes, [64, 96, 128, 256]);
assert.equal(fullSheet.compositionEligible, true);
assert.ok(fullSheet.fieldVisibility, 'visible field contract is missing');

assert.equal(microSheet.id, 'v20.8-reference-micro-spectral-anchors');
assert.equal(microSheet.file, 'public/brand-emblem-v20-micro-candidate.svg');
assert.deepEqual(microSheet.designGrid, [32, 32]);
assert.deepEqual(microSheet.reviewSizes, [16, 20, 24, 32, 48]);

function validateCandidate(source: string, candidate: Candidate, idAttr: string, range: [number, number], hooks: string[]) {
  assert.match(source, new RegExp(`${idAttr}="${candidate.id}"`));
  assert.match(source, new RegExp(`viewBox="0 0 ${candidate.designGrid[0]} ${candidate.designGrid[1]}"`));
  assert.equal(candidate.numericGeometryEligible, true);
  assert.equal(candidate.productionReplacement, false);
  assert.equal(candidate.reviewerDecision, 'not-reference-approved');
  assert.match(source, /data-brand-reference-decision="not-reference-approved"/);
  assert.doesNotMatch(source, /<(?:image|rect|foreignObject|canvas|ellipse|filter)\b|<feGaussianBlur\b|\bfilter=|data:image|base64,/i);
  assert.doesNotMatch(source, /<animate(?:Transform|Motion)?\b|@keyframes|requestAnimationFrame/i);
  const count = (source.match(/<path\b/g) ?? []).length;
  assert.ok(count >= range[0] && count <= range[1], `${candidate.id}: semantic path count ${count} must remain in ${range[0]}–${range[1]}`);
  for (const hook of hooks) assert.ok(source.includes(hook), `${candidate.id}: missing ${hook}`);
}

validateCandidate(full, fullSheet, 'data-brand-v20-candidate', [36, 48], [
  'data-brand-cloak','data-brand-hood','data-brand-face-void','data-brand-cowl',
  'data-brand-folds-near','data-brand-folds-far','data-brand-field-front',
  'data-brand-field-mid','data-brand-field-rear',
]);
validateCandidate(micro, microSheet, 'data-brand-v20-micro-candidate', [18, 24], [
  'data-brand-micro-cloak','data-brand-micro-hood','data-brand-micro-face',
  'data-brand-micro-cowl','data-brand-micro-folds',
  'data-brand-micro-field-front','data-brand-micro-field-rear',
]);

assert.match(full, /data-brand-figure=""[^>]*transform="translate\(10\.29 4\.76\) scale\(\.79 \.95\)"/);
assert.match(full, /data-brand-field-front=""[^>]*transform="translate\(10\.29 4\.76\) scale\(\.79 \.95\)"/);

const passes = (value: number, target: Target) =>
  target.allowed ? value >= target.allowed[0] && value <= target.allowed[1] : value >= Number(target.minimum);

for (const candidate of sheet.candidates) {
  assert.ok(passes(candidate.ratios.hoodHeightToVisibleFigureHeight, contract.targets.hoodHeightToVisibleFigureHeight));
  assert.ok(passes(candidate.ratios.hoodWidthToCloakWidth, contract.targets.hoodWidthToCloakWidth));
  assert.ok(passes(candidate.ratios.faceCavernWidthToHoodWidth, contract.targets.faceCavernWidthToHoodWidth));
  assert.ok(passes(candidate.ratios.cloakWidthToHoodWidth, contract.targets.cloakWidthToHoodWidth));
}

assert.ok(fullSheet.composition, 'full-size composition metrics are missing');
for (const [name, value] of Object.entries(fullSheet.composition ?? {})) {
  assert.ok(contract.compositionTargets[name], `${name}: composition target is missing`);
  assert.ok(passes(value, contract.compositionTargets[name]), `${name}: composition is outside canonical range`);
}
assert.equal(microSheet.composition, undefined, 'micro must remain an independent optical crop');

const rear = full.match(/<g data-brand-field-rear=""[\s\S]*?>([\s\S]*?)<\/g>/)?.[1] ?? '';
const rearPaths = [...rear.matchAll(/<path\b[^>]*>/g)].map((match) => match[0]);
assert.ok(rearPaths.length >= Number(fullSheet.fieldVisibility?.minimumRearBranches));
for (const pathSource of rearPaths) {
  const opacity = Number(pathSource.match(/stroke-opacity="([\d.]+)"/)?.[1]);
  const width = Number(pathSource.match(/stroke-width="([\d.]+)"/)?.[1]);
  assert.ok(Number.isFinite(opacity) && opacity >= Number(fullSheet.fieldVisibility?.minimumStrokeOpacity), 'rear field contains an invisible opacity filler');
  assert.ok(Number.isFinite(width) && width >= Number(fullSheet.fieldVisibility?.minimumStrokeWidth), 'rear field contains a zero-width bounds filler');
}

for (const file of ['src/components/brandEmblemV18.svg','public/brand-emblem.svg','public/brand-mark-micro.svg','src/components/BrandMark.tsx']) {
  assert.doesNotMatch(read(file), /v20\.\d+-reference-|brand-emblem-v20-(?:micro-)?candidate/);
}

assert.equal(ledger.family, 'brand-v20-reference-led');
assert.equal(ledger.fullSizeCandidate.id, fullSheet.id);
assert.equal(ledger.microCandidate.id, microSheet.id);
assert.equal(ledger.fullSizeCandidate.compositionEligible, true);
assert.equal(ledger.fullSizeCandidate.visibleFieldEligible, true);
assert.equal(ledger.fullSizeCandidate.reviewerDecision, 'not-reference-approved');
assert.equal(ledger.microCandidate.reviewerDecision, 'not-reference-approved');

const historicalLocks: Array<[string, RegExp]> = [
  ['v20.3-reference-monolith', /dome-like aura/],
  ['v20.4-reference-drapery', /oversized black cavity/],
  ['v20.5-reference-silhouette', /smooth oval cavern/],
  ['v20.6-reference-monolith', /stacked chevron cowl/],
  ['v20.7-reference-draped-monolith', /broad clean shawl/],
  ['v20.8-reference-compressed-cowl', /missing composition contract/],
  ['v20.9-reference-canonical-crop', /field restricted mostly to the hood and upper shoulders/],
  ['v20.10-reference-field-envelope', /wire-like field topology/],
  ['v20.11-reference-volumetric-cowl', /detached root-like electrical lines/],
  ['v20.12-reference-spectral-volume', /broad smooth contour sheath/],
];
for (const [id, blocker] of historicalLocks) {
  assert.ok(ledger.iterationHistory.some((entry) => entry.full === id && blocker.test(entry.verdict)), `${id}: historical blocker is missing`);
}
assert.ok(ledger.iterationHistory.some((entry) => entry.full === fullSheet.id && entry.micro === microSheet.id && /current QA-only/.test(entry.verdict)));

assert.ok(ledger.promotionBlockers.length >= 5);
assert.match(sheet.promotionPolicy, /Numeric, composition and visible-field eligibility are necessary but never sufficient/);
assert.match(ledger.promotionPolicy, /Never treat numericGeometryEligible, compositionEligible, visibleFieldEligible, CI success or motion quality as reference approval/);
assert.match(packageJson, /"validate:brand-v20": "tsx scripts\/validate-brand-v20\.ts"/);

for (const candidatePath of [
  'public/brand-emblem-v20-candidate.svg',
  'public/brand-emblem-v20-micro-candidate.svg',
  'qa/reference/brand-v20-reference-sheet.json',
  'qa/brand-v20-candidate-ledger.json',
  'qa/brand-v20-reference.spec.mjs',
  'scripts/validate-brand-v20.ts',
  'docs/BRAND_V20_REFERENCE_PASS.md',
]) assert.ok(vectorWorkflow.includes(candidatePath), `brand vector workflow scope missing ${candidatePath}`);

assert.match(vectorWorkflow, /qa\/brand-v20-reference\.spec\.mjs/);
assert.match(deepWorkflow, /qa\/brand-v20-reference\.spec\.mjs/);
assert.match(deepWorkflow, /brand-v20-contract-metrics\.json/);
assert.match(evidenceSpec, /numeric-composition-and-visible-field-pass \/ visual-approval-pending \/ production-unchanged/);
assert.match(evidenceSpec, /fieldRects/);
assert.match(evidenceSpec, /fieldVisibility/);
assert.match(evidenceSpec, /minimumStrokeOpacity/);
assert.match(evidenceSpec, /getBoundingClientRect/);
assert.match(evidenceSpec, /REFERENCE \+ CANDIDATE OVERLAY/);
assert.match(evidenceSpec, /DARK \/ LIGHT DIAGNOSTICS/);

console.log('brand v20 validation: v20.13 uses attached irregular electric masses, near-black cloth and non-panel drapery; v20.8 remains the independent micro master; both are QA-only and not-reference-approved');
