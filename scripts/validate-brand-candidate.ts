import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

type Ledger = {
  marathonId: string;
  primaryReferenceDescription: string;
  supplementalReferences: Array<{
    name: string;
    role: string;
    mayInfluenceGeometry: boolean;
    mayInfluenceApproval: boolean;
  }>;
  latestCandidate: string;
  geometryCandidate: {
    id: string;
    file: string;
    productionReplacement: boolean;
    targets: string[];
    comparisonArtifact: string;
    decision: string;
  };
  opticalCandidate: {
    id: string;
    file: string;
    productionReplacement: boolean;
    opticalSizes: number[];
    targets: string[];
    comparisonArtifact: string;
    decision: string;
  };
  microCandidate: {
    id: string;
    file: string;
    productionReplacement: boolean;
    opticalSizes: number[];
    targets: string[];
    comparisonArtifact: string;
    decision: string;
  };
  visualBaseline: string;
  ownerDecision: string;
  completedPasses: number[];
  activePasses: number[];
  plannedPasses: number;
  evidenceStatus: string;
  mergePolicy: string;
};

type Audit = {
  referenceId: string;
  activeCandidateId: string;
  activeCandidateFile: string;
  activeOpticalCandidateId: string;
  activeOpticalCandidateFile: string;
  activeMicroCandidateId: string;
  activeMicroCandidateFile: string;
  primaryReference: string;
  productionSource: string;
  productionReplacement: boolean;
  status: string;
  ownerDecision: string;
  reviewedOpticalSizes: number[];
  passHistory: Array<{ pass: string; result: string }>;
  confirmedImprovements: string[];
  remainingBlockers: string[];
  nextPasses: string[];
  promotionRule: string;
};

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');
const ledger = JSON.parse(read('qa/brand-marathon-pass-ledger.json')) as Ledger;
const evaluation = JSON.parse(read('qa/brand-v19-green-gate.json')) as Audit;
const production = read('src/components/brandEmblemV18.svg');
const productionPublic = read('public/brand-emblem.svg');
const productionMicro = read('public/brand-mark-micro.svg');
const component = read('src/components/BrandMark.tsx');
const browserQa = read('qa/brand-reference-comparison.spec.mjs');
const opticalQa = read('qa/brand-v19-optical.spec.mjs');
const microQa = read('qa/brand-v19-micro.spec.mjs');
const playwrightConfig = read('playwright.config.mjs');

const candidateFile = ledger.geometryCandidate.file;
const candidate = read(candidateFile);
const candidateId = candidate.match(/data-brand-candidate="([^"]+)"/)?.[1];
const candidateArtifact = path.basename(ledger.geometryCandidate.comparisonArtifact);
const opticalFile = ledger.opticalCandidate.file;
const optical = read(opticalFile);
const opticalId = optical.match(/data-brand-optical-candidate="([^"]+)"/)?.[1];
const opticalArtifact = path.basename(ledger.opticalCandidate.comparisonArtifact);
const microFile = ledger.microCandidate.file;
const micro = read(microFile);
const microId = micro.match(/data-brand-micro-candidate="([^"]+)"/)?.[1];
const microArtifact = path.basename(ledger.microCandidate.comparisonArtifact);

assert.equal(candidateId, 'v19.11-reference-geometry-reset');
assert.match(candidate, /<svg\b[^>]*viewBox="0 0 96 96"/);
assert.match(candidate, new RegExp(`data-brand-candidate="${candidateId}"`));
assert.ok(candidate.trimEnd().endsWith('</svg>'));
assert.doesNotMatch(candidate, /<(?:image|rect|foreignObject|canvas)\b|data:image|base64,/i);
assert.doesNotMatch(candidate, /<animate(?:Transform|Motion)?\b|@keyframes/i);
assert.ok((candidate.match(/<path\b/g) ?? []).length > 60);
for (const hook of ['atmosphere', 'figure', 'cloak', 'folds', 'hood', 'hood-layers', 'hood-seams', 'inner-rim', 'face-void', 'face-depth', 'collar', 'rim-light', 'cloth-highlights', 'texture']) {
  assert.ok(candidate.includes(`data-brand-${hook}`), `candidate missing semantic layer: ${hook}`);
}
assert.equal(ledger.geometryCandidate.file, candidateFile);
assert.equal(ledger.geometryCandidate.productionReplacement, false);
assert.equal(ledger.geometryCandidate.comparisonArtifact, `qa-artifacts/${candidateArtifact}`);
assert.match(ledger.geometryCandidate.decision, /pending exact-main visual review/i);
assert.ok(ledger.geometryCandidate.targets.length >= 8);

assert.equal(opticalId, 'v19.17-reference-optical-redraw');
// v19.17 is an independent medium optical master authored on a 64×64 grid.
// Rendering targets remain 96/64/56/44px; the viewBox is the vector design
// coordinate system and must not be rewritten to mimic a rendered CSS size.
assert.match(optical, /<svg\b[^>]*viewBox="0 0 64 64"/);
assert.match(optical, new RegExp(`data-brand-optical-candidate="${opticalId}"`));
assert.ok(optical.trimEnd().endsWith('</svg>'));
assert.doesNotMatch(optical, /<(?:image|rect|foreignObject|canvas)\b|data:image|base64,/i);
assert.doesNotMatch(optical, /<animate(?:Transform|Motion)?\b|@keyframes/i);
assert.ok((optical.match(/<path\b/g) ?? []).length > 40);
for (const hook of ['atmosphere', 'figure', 'cloak', 'folds', 'hood', 'hood-layers', 'face', 'cowl', 'rim']) {
  assert.ok(optical.includes(`data-brand-optical-${hook}`), `optical candidate missing semantic layer: ${hook}`);
}
assert.deepEqual(ledger.opticalCandidate.opticalSizes, [96, 64, 56, 44]);
assert.equal(ledger.opticalCandidate.file, opticalFile);
assert.equal(ledger.opticalCandidate.productionReplacement, false);
assert.equal(ledger.opticalCandidate.comparisonArtifact, `qa-artifacts/${opticalArtifact}`);
assert.match(ledger.opticalCandidate.decision, /pending exact-main optical review/i);
assert.ok(ledger.opticalCandidate.targets.length >= 6);

assert.equal(microId, 'v19.14-reference-micro-redraw');
assert.match(micro, /<svg\b[^>]*viewBox="0 0 32 32"/);
assert.match(micro, new RegExp(`data-brand-micro-candidate="${microId}"`));
assert.ok(micro.trimEnd().endsWith('</svg>'));
assert.doesNotMatch(micro, /<(?:image|rect|foreignObject|canvas)\b|data:image|base64,/i);
assert.doesNotMatch(micro, /<animate(?:Transform|Motion)?\b|@keyframes/i);
assert.ok((micro.match(/<path\b/g) ?? []).length >= 16);
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
assert.match(ledger.latestCandidate, /v19\.17 optical medium companion/i);
assert.equal(ledger.geometryCandidate.file, candidateFile);
assert.equal(ledger.geometryCandidate.productionReplacement, false);
assert.equal(ledger.geometryCandidate.comparisonArtifact, `qa-artifacts/${candidateArtifact}`);
assert.match(ledger.geometryCandidate.decision, /pending exact-main visual review/i);
assert.ok(ledger.geometryCandidate.targets.length >= 8);
assert.equal(ledger.ownerDecision, 'not-reference-approved');
assert.match(ledger.evidenceStatus, /production geometry remains unchanged/i);

assert.equal(evaluation.referenceId, 'canonical-hooded-figure-v2-clean-base');
assert.equal(evaluation.activeCandidateId, candidateId);
assert.equal(evaluation.activeCandidateFile, candidateFile);
assert.equal(evaluation.activeOpticalCandidateId, opticalId);
assert.equal(evaluation.activeOpticalCandidateFile, opticalFile);
assert.equal(evaluation.activeMicroCandidateId, microId);
assert.equal(evaluation.activeMicroCandidateFile, microFile);
assert.equal(evaluation.productionSource, ledger.visualBaseline);
assert.equal(evaluation.productionReplacement, false);
assert.equal(evaluation.status, 'candidate-under-reference-review');
assert.equal(evaluation.ownerDecision, 'not-reference-approved');
assert.deepEqual(evaluation.reviewedOpticalSizes, [256, 192, 128, 96, 64, 56, 44, 32, 24, 16]);
assert.equal(evaluation.passHistory.length, 17);
assert.deepEqual(evaluation.passHistory.map((item) => item.pass), ['v19.1', 'v19.2', 'v19.3', 'v19.4', 'v19.5', 'v19.6', 'v19.7', 'v19.8', 'v19.9', 'v19.10', 'v19.11', 'v19.12', 'v19.13', 'v19.14', 'v19.15', 'v19.16', 'v19.17']);
assert.equal(evaluation.passHistory.find((item) => item.pass === 'v19.11')?.result, 'active-main-candidate');
assert.equal(evaluation.passHistory.find((item) => item.pass === 'v19.17')?.result, 'active-optical-candidate');
assert.equal(evaluation.passHistory.find((item) => item.pass === 'v19.14')?.result, 'active-micro-candidate');
assert.ok(evaluation.confirmedImprovements.some((item) => /96, 64, 56 and 44 pixel/i.test(item)));
assert.ok(evaluation.confirmedImprovements.some((item) => /32, 24 and 16 pixel/i.test(item)));
assert.ok(evaluation.remainingBlockers.length >= 6);
assert.ok(evaluation.nextPasses.some((item) => item.startsWith('v19.18')));
assert.match(evaluation.promotionRule, /zero-flaky green/i);
assert.match(evaluation.promotionRule, /owner explicitly approves/i);

assert.ok(browserQa.includes("const CANDIDATE = ledger.geometryCandidate.file"));
assert.ok(browserQa.includes("const CANDIDATE_ID = ledger.geometryCandidate.id"));
assert.ok(browserQa.includes(candidateArtifact));
assert.ok(browserQa.includes('REFERENCE / PRODUCTION / ${CANDIDATE_LABEL} CANDIDATE'));
assert.ok(opticalQa.includes("const candidate = ledger.opticalCandidate.file"));
assert.ok(opticalQa.includes(opticalArtifact));
assert.ok(microQa.includes("const candidate = ledger.microCandidate.file"));
assert.ok(microQa.includes(microArtifact));
assert.match(playwrightConfig, /brand-v19-micro/);
assert.match(playwrightConfig, /brand-v19-optical/);

for (const productionSource of [production, productionPublic, productionMicro, component]) {
  assert.doesNotMatch(productionSource, /v19\.11-reference-geometry-reset/);
  assert.doesNotMatch(productionSource, /v19\.17-reference-optical-redraw/);
  assert.doesNotMatch(productionSource, /v19\.14-reference-micro-redraw/);
  assert.doesNotMatch(productionSource, /brand-emblem-v19-(?:optical-|micro-)?candidate/);
}

console.log('brand candidate validation: seventeen passes are locked; v19.11 full-size, v19.17 optical 64-grid master and v19.14 micro remain isolated from production');
