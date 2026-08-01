import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

type Manifest = {
  referenceId: string;
  visualAuthority: string;
  status: string;
  projectFile: string;
  projectDimensions: { width: number; height: number };
  projectSha256: string;
  sourceTitle: string;
  sourceDimensions: { width: number; height: number };
  sourceSha256: string;
  compositionLock: string;
  supplementalReferences: Array<{
    title: string;
    role: string;
    mayInfluenceProductionGeometry: boolean;
    mayInfluenceOpticalRatios: boolean;
    mayInfluenceApprovalScore: boolean;
  }>;
  replacementPolicy: string;
};
type Evaluation = {
  referenceId: string;
  reviewedAgainstReferenceSha256: string;
  candidateSource: string;
  candidateRevision: string;
  status: string;
  reviewerDecision: string;
  overallScore: number;
  scores: Record<string, number>;
  candidateGitBlobShas: Record<string, string>;
  comparisonArtifact: string;
  liveSiteComparisonArtifact: string;
  blockingDeviations: string[];
  nextRequiredAction: string;
  marathonPassesCompleted?: number[];
};

const resolve = (file: string) => path.resolve(file);
const read = (file: string) => fs.readFileSync(resolve(file), 'utf8');
const bytes = (file: string) => fs.readFileSync(resolve(file));
const parse = <T>(file: string): T => JSON.parse(read(file)) as T;
const sha256 = (buffer: Buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const gitBlobSha = (buffer: Buffer) => crypto.createHash('sha1').update(`blob ${buffer.length}\0`).update(buffer).digest('hex');

const manifest = parse<Manifest>('qa/reference/brand-reference-manifest.json');
const contract = parse<{ referenceId: string; requiredStructures: string[]; forbiddenDrift: string[] }>('qa/reference/brand-reference-contract.json');
const evaluation = parse<Evaluation>('qa/brand-reference-evaluation.json');

assert.equal(manifest.referenceId, 'canonical-hooded-figure-v2-clean-base');
assert.equal(manifest.status, 'immutable');
assert.match(manifest.visualAuthority, /user-approved canonical reference/i);
assert.equal(manifest.projectFile, 'qa/reference/brand-emblem-canonical-reference.webp');
assert.deepEqual(manifest.projectDimensions, { width: 256, height: 256 });
assert.deepEqual(manifest.sourceDimensions, { width: 1254, height: 1254 });
assert.equal(manifest.sourceTitle, 'Figure mystérieuse dans une lueur bleue.png');
assert.equal(manifest.sourceSha256, 'a780a19917fb9d5d280f0a8c3629b3f1d97b599da62add6e18b14252ed577b67');
assert.equal(manifest.projectSha256, '767be12318c21aeb2c259a4ab529f04caf9f5db9b131c38223ea85e109ea8532');
assert.equal(sha256(bytes(manifest.projectFile)), manifest.projectSha256, 'canonical bytes changed');
assert.match(manifest.compositionLock, /square close-up bust/i);
assert.match(manifest.compositionLock, /huge pure-black face void/i);
assert.match(manifest.compositionLock, /electric-blue aura behind the head and upper body/i);
assert.match(manifest.replacementPolicy, /explicit user approval/i);

assert.equal(manifest.supplementalReferences.length, 1);
const supplemental = manifest.supplementalReferences[0];
assert.equal(supplemental.title, 'Siluette dans la brume sombre.png');
assert.match(supplemental.role, /supplemental mood material only/i);
assert.equal(supplemental.mayInfluenceProductionGeometry, false);
assert.equal(supplemental.mayInfluenceOpticalRatios, false);
assert.equal(supplemental.mayInfluenceApprovalScore, false);

assert.equal(contract.referenceId, manifest.referenceId);
for (const required of [
  'high layered pointed hood',
  'broad deep black face cavern with a rounded pentagonal base',
  'heavy gathered cowl below the face rather than a crossed necktie',
  'left diagonal fold family',
  'right diagonal fold family',
  'central vertical fold family',
  'electrical spectral aura concentrated behind the hood, shoulders and side edges',
  'clean lower edge with no required smoke beneath the cloak',
]) assert.ok(contract.requiredStructures.includes(required), `missing required structure: ${required}`);
for (const forbidden of [
  'narrow vertical face droplet',
  'rounded poncho or bell silhouette',
  'clean crossed X collar or thin central necktie',
  'large smoke pool or glowing mist under the cloak hem',
  'bottom aura added merely to imitate the superseded v1 reference',
  'green CI presented as proof of visual similarity',
]) assert.ok(contract.forbiddenDrift.includes(forbidden), `missing hard stop: ${forbidden}`);

const candidateFiles = [
  'src/components/BrandMark.tsx',
  'src/components/brandMotionV18.ts',
  'src/components/brandEmblemV18.svg',
  'public/brand-emblem.svg',
  'public/brand-mark-micro.svg',
  'public/brand-emblem-mask.svg',
] as const;
for (const file of candidateFiles) {
  assert.equal(gitBlobSha(bytes(file)), evaluation.candidateGitBlobShas[file], `${file}: unsynchronized evaluation lock`);
}

const component = read('src/components/BrandMark.tsx');
const componentSource = component.match(/const VECTOR_SOURCE = '([^']+)'/)?.[1];
assert.equal(componentSource, 'canonical-reference-v2-black-monolith-v17-0');
assert.equal(evaluation.candidateSource, componentSource);
for (const file of ['src/components/brandEmblemV18.svg', 'public/brand-emblem.svg', 'public/brand-mark-micro.svg', 'public/brand-emblem-mask.svg']) {
  assert.equal(read(file).match(/data-brand-vector-source="([^"]+)"/)?.[1], componentSource, `${file}: source differs`);
}
assert.equal(evaluation.referenceId, manifest.referenceId);
assert.equal(evaluation.reviewedAgainstReferenceSha256, manifest.projectSha256);
assert.equal(evaluation.status, 'reference-reviewed');
assert.equal(evaluation.reviewerDecision, 'not-reference-approved');
assert.ok(evaluation.overallScore >= 0 && evaluation.overallScore <= 1);
assert.ok(evaluation.blockingDeviations.length > 0);
assert.match(evaluation.candidateRevision, /unchanged v17\.0 visual baseline/i);
assert.match(evaluation.nextRequiredAction, /geometry passes from the square reference/i);
assert.ok((evaluation.marathonPassesCompleted ?? []).includes(19), 'pointer foundation pass is not recorded');
assert.ok((evaluation.marathonPassesCompleted ?? []).includes(23), 'reduced-motion pass is not recorded');
for (const key of ['macroProportions', 'hoodAndCavern', 'collarAndFolds', 'cloakSilhouette', 'rimAndAura', 'microReadability', 'interactionQuality']) {
  assert.ok(typeof evaluation.scores[key] === 'number' && evaluation.scores[key] >= 0 && evaluation.scores[key] <= 1, `${key}: invalid score`);
}

for (const file of ['AGENTS.md', 'docs/BRAND_EMBLEM.md', 'qa/reference/README.md', '.github/pull_request_template.md']) {
  const source = read(file);
  assert.match(source, /canonical-hooded-figure-v2-clean-base/);
  assert.match(source, /no required smoke|без обязательного дыма|clean lower edge/i);
}
const research = read('docs/research/BRAND_EMBLEM_SVG_MOTION_MARATHON_2026.md');
assert.match(research, /Primary and official source run \(69 links\)/);
assert.match(research, /## 24-pass programme/);
const ledger = parse<{ primaryReferenceDescription: string; plannedPasses: number; supplementalReferences: Array<{ mayInfluenceGeometry: boolean; mayInfluenceApproval: boolean }> }>('qa/brand-marathon-pass-ledger.json');
assert.match(ledger.primaryReferenceDescription, /square close-up bust/i);
assert.equal(ledger.plannedPasses, 24);
assert.ok(ledger.supplementalReferences.every((item) => !item.mayInfluenceGeometry && !item.mayInfluenceApproval));

const browserQa = read('qa/brand-reference-comparison.spec.mjs');
for (const artifact of ['brand-reference-comparison-matrix.png', 'brand-reference-live-site-comparison.png', 'brand-live-site-home-first-viewport.png', 'brand-interaction-state-matrix.png']) {
  assert.ok(browserQa.includes(artifact), `browser QA missing ${artifact}`);
}

console.log(`brand reference progress: ${Math.round(evaluation.overallScore * 100)}% — no-regression motion foundation; geometry remains not-reference-approved`);
