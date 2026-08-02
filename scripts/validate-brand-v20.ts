import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

type RatioTarget = { allowed?: [number, number]; minimum?: number };
type Contract = { referenceId: string; targets: Record<string, RatioTarget> };
type Candidate = {
  id: string;
  file: string;
  designGrid: [number, number];
  reviewSizes: number[];
  ratios: Record<string, number>;
  numericGeometryEligible: boolean;
  productionReplacement: boolean;
  reviewerDecision: string;
};
type Sheet = {
  referenceId: string;
  referenceFile: string;
  referenceSha256: string;
  candidates: Candidate[];
  promotionPolicy: string;
};

const root = (file: string) => path.resolve(file);
const read = (file: string) => fs.readFileSync(root(file), 'utf8');
const contract = JSON.parse(read('qa/reference/brand-reference-contract.json')) as Contract;
const sheet = JSON.parse(read('qa/reference/brand-v20-reference-sheet.json')) as Sheet;
const full = read('public/brand-emblem-v20-candidate.svg');
const micro = read('public/brand-emblem-v20-micro-candidate.svg');
const ledger = JSON.parse(read('qa/brand-v20-candidate-ledger.json')) as {
  family: string;
  fullSizeCandidate: Candidate;
  microCandidate: Candidate;
  iterationHistory: Array<{ full: string; micro: string; verdict: string }>;
  evidenceArtifacts: string[];
  promotionBlockers: string[];
  promotionPolicy: string;
};
const packageJson = read('package.json');
const vectorWorkflow = read('.github/workflows/brand-qa.yml');
const deepWorkflow = read('.github/workflows/brand-deep-audit.yml');
const evidenceSpec = read('qa/brand-v20-reference.spec.mjs');

assert.equal(sheet.referenceId, contract.referenceId);
assert.equal(sheet.referenceFile, 'qa/reference/brand-emblem-canonical-reference.webp');
assert.equal(
  crypto.createHash('sha256').update(fs.readFileSync(root(sheet.referenceFile))).digest('hex'),
  sheet.referenceSha256,
  'v20 measurement sheet must remain bound to the exact canonical reference bytes',
);

assert.equal(sheet.candidates.length, 2);
const [fullSheet, microSheet] = sheet.candidates;
assert.equal(fullSheet.id, 'v20.4-reference-drapery');
assert.equal(fullSheet.file, 'public/brand-emblem-v20-candidate.svg');
assert.deepEqual(fullSheet.designGrid, [96, 96]);
assert.deepEqual(fullSheet.reviewSizes, [64, 96, 128, 256]);

assert.equal(microSheet.id, 'v20.2-reference-micro-rim');
assert.equal(microSheet.file, 'public/brand-emblem-v20-micro-candidate.svg');
assert.deepEqual(microSheet.designGrid, [32, 32]);
assert.deepEqual(microSheet.reviewSizes, [16, 20, 24, 32, 48]);

function validateCandidate(source: string, candidate: Candidate, idAttribute: string, minimumPaths: number, requiredHooks: string[]) {
  assert.match(source, new RegExp(`${idAttribute}="${candidate.id}"`));
  assert.match(source, new RegExp(`viewBox="0 0 ${candidate.designGrid[0]} ${candidate.designGrid[1]}"`));
  assert.equal(candidate.numericGeometryEligible, true);
  assert.equal(candidate.productionReplacement, false);
  assert.equal(candidate.reviewerDecision, 'not-reference-approved');
  assert.match(source, /data-brand-reference-decision="not-reference-approved"/);
  assert.doesNotMatch(source, /<(?:image|rect|foreignObject|canvas)\b|data:image|base64,/i);
  assert.doesNotMatch(source, /<animate(?:Transform|Motion)?\b|@keyframes|requestAnimationFrame/i);
  assert.ok((source.match(/<path\b/g) ?? []).length >= minimumPaths);
  for (const hook of requiredHooks) {
    assert.ok(source.includes(hook), `${candidate.id}: missing semantic hook ${hook}`);
  }
}

validateCandidate(full, fullSheet, 'data-brand-v20-candidate', 48, [
  'data-brand-cloak',
  'data-brand-hood',
  'data-brand-face-void',
  'data-brand-cowl',
  'data-brand-folds-near',
  'data-brand-folds-far',
  'data-brand-field-front',
  'data-brand-field-mid',
  'data-brand-field-rear',
]);

validateCandidate(micro, microSheet, 'data-brand-v20-micro-candidate', 24, [
  'data-brand-micro-cloak',
  'data-brand-micro-hood',
  'data-brand-micro-face',
  'data-brand-micro-cowl',
  'data-brand-micro-folds',
  'data-brand-micro-field-front',
  'data-brand-micro-field-rear',
]);

function inRange(value: number, target: RatioTarget) {
  if (target.allowed) return value >= target.allowed[0] && value <= target.allowed[1];
  if (typeof target.minimum === 'number') return value >= target.minimum;
  return false;
}

for (const candidate of sheet.candidates) {
  assert.ok(inRange(candidate.ratios.hoodHeightToVisibleFigureHeight, contract.targets.hoodHeightToVisibleFigureHeight));
  assert.ok(inRange(candidate.ratios.hoodWidthToCloakWidth, contract.targets.hoodWidthToCloakWidth));
  assert.ok(inRange(candidate.ratios.faceCavernWidthToHoodWidth, contract.targets.faceCavernWidthToHoodWidth));
  assert.ok(inRange(candidate.ratios.cloakWidthToHoodWidth, contract.targets.cloakWidthToHoodWidth));
}

for (const productionFile of [
  'src/components/brandEmblemV18.svg',
  'public/brand-emblem.svg',
  'public/brand-mark-micro.svg',
  'src/components/BrandMark.tsx',
]) {
  const production = read(productionFile);
  assert.doesNotMatch(production, /v20\.\d+-reference-/);
  assert.doesNotMatch(production, /brand-emblem-v20-(?:micro-)?candidate/);
}

assert.match(sheet.promotionPolicy, /Numeric eligibility is necessary but never sufficient/);
assert.match(sheet.promotionPolicy, /explicit human reference-approved decision/);

assert.equal(ledger.family, 'brand-v20-reference-led');
assert.equal(ledger.fullSizeCandidate.id, fullSheet.id);
assert.equal(ledger.microCandidate.id, microSheet.id);
assert.equal(ledger.fullSizeCandidate.productionReplacement, false);
assert.equal(ledger.microCandidate.productionReplacement, false);
assert.equal(ledger.fullSizeCandidate.reviewerDecision, 'not-reference-approved');
assert.equal(ledger.microCandidate.reviewerDecision, 'not-reference-approved');
assert.ok(ledger.iterationHistory.some((entry) => entry.full === 'v20.3-reference-monolith' && /rejected/.test(entry.verdict)));
assert.ok(ledger.iterationHistory.some((entry) => entry.full === fullSheet.id && entry.micro === microSheet.id));
assert.ok(ledger.promotionBlockers.length >= 5);
assert.match(ledger.promotionPolicy, /Never treat numericGeometryEligible, CI success or motion quality as reference approval/);

assert.match(packageJson, /"validate:brand-v20": "tsx scripts\/validate-brand-v20\.ts"/);
assert.match(packageJson, /validate:brand-candidate && npm run validate:brand-v20 && npm run validate:brand-browser-workflow/);

for (const candidatePath of [
  'public/brand-emblem-v20-candidate.svg',
  'public/brand-emblem-v20-micro-candidate.svg',
  'qa/reference/brand-v20-reference-sheet.json',
  'qa/brand-v20-candidate-ledger.json',
  'qa/brand-v20-reference.spec.mjs',
  'scripts/validate-brand-v20.ts',
  'docs/BRAND_V20_REFERENCE_PASS.md',
]) {
  assert.ok(vectorWorkflow.includes(candidatePath), `brand vector workflow scope missing ${candidatePath}`);
}
assert.match(vectorWorkflow, /qa\/brand-v20-reference\.spec\.mjs/);
assert.match(deepWorkflow, /qa\/brand-v20-reference\.spec\.mjs/);
assert.match(deepWorkflow, /brand-v20-contract-metrics\.json/);
assert.match(deepWorkflow, /brand-v20-reference-comparison\.png/);
assert.match(deepWorkflow, /brand-v20-micro-diagnostics\.png/);

assert.match(evidenceSpec, /numeric-pass \/ visual-approval-pending \/ production-unchanged/);
assert.match(evidenceSpec, /v20 full-size and independent micro masters pass numeric geometry without receiving visual approval/);
assert.match(evidenceSpec, /REFERENCE \+ CANDIDATE OVERLAY/);
assert.match(evidenceSpec, /DARK \/ LIGHT DIAGNOSTICS/);

console.log('brand v20 validation: v20.4 full-size and v20.2 independent micro masters pass the canonical numeric geometry contract, remain static QA-only assets, and cannot enter production without explicit visual approval');
