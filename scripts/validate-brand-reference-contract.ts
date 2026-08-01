import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

type Dimensions = { width: number; height: number };
type SupplementalReference = {
  title: string;
  role: string;
  mayInfluenceProductionGeometry: boolean;
  mayInfluenceOpticalRatios: boolean;
  mayInfluenceApprovalScore: boolean;
};
type Manifest = {
  referenceId: string;
  visualAuthority: string;
  status: string;
  projectFile: string;
  projectDimensions: Dimensions;
  projectSha256: string;
  sourceTitle: string;
  sourceDimensions: Dimensions;
  sourceSha256: string;
  compositionLock: string;
  supplementalReferences: SupplementalReference[];
  derivation: string;
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
  marathonPassesActive?: number[];
};

const resolve = (file: string) => path.resolve(file);
const read = (file: string) => fs.readFileSync(resolve(file), 'utf8');
const bytes = (file: string) => fs.readFileSync(resolve(file));
const sha256 = (buffer: Buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const gitBlobSha = (buffer: Buffer) => crypto.createHash('sha1').update(`blob ${buffer.length}\0`).update(buffer).digest('hex');
const parse = <T>(file: string): T => JSON.parse(read(file)) as T;

function webpSize(file: string): Dimensions {
  const buffer = bytes(file);
  assert.ok(buffer.length >= 30, `${file}: truncated WebP`);
  assert.equal(buffer.subarray(0, 4).toString('ascii'), 'RIFF', `${file}: RIFF signature missing`);
  assert.equal(buffer.subarray(8, 12).toString('ascii'), 'WEBP', `${file}: WEBP signature missing`);
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.subarray(offset, offset + 4).toString('ascii');
    const length = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    assert.ok(data + length <= buffer.length, `${file}: truncated ${type} chunk`);
    if (type === 'VP8X') return { width: 1 + buffer.readUIntLE(data + 4, 3), height: 1 + buffer.readUIntLE(data + 7, 3) };
    if (type === 'VP8 ') return { width: buffer.readUInt16LE(data + 6) & 0x3fff, height: buffer.readUInt16LE(data + 8) & 0x3fff };
    if (type === 'VP8L') {
      const bits = buffer.readUInt32LE(data + 1);
      return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) };
    }
    offset = data + length + (length % 2);
  }
  throw new Error(`${file}: no supported WebP image chunk`);
}

function progressLabel(score: number, accepted: boolean) {
  if (accepted) return 'reference accepted';
  if (score >= 0.82) return 'awaiting visual approval';
  if (score >= 0.7) return 'advanced candidate';
  if (score >= 0.5) return 'developing candidate';
  return 'early geometry draft';
}

function report(evaluation: Evaluation) {
  const accepted = evaluation.reviewerDecision === 'reference-accepted';
  const percent = Math.round(evaluation.overallScore * 100);
  const detail = `${evaluation.candidateRevision}; ${accepted ? 'reference-accepted' : 'not-reference-approved'}; ${evaluation.blockingDeviations.length} blocking deviation(s)`;
  if (process.env.GITHUB_ACTIONS === 'true') console.log(`::notice title=Brand reference: ${percent}% — ${progressLabel(evaluation.overallScore, accepted)}::${detail}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
      '## Brand reference progress', '',
      `**${percent}% — ${progressLabel(evaluation.overallScore, accepted)}**`, '',
      `- Candidate: \`${evaluation.candidateRevision}\``,
      `- Decision: \`${evaluation.reviewerDecision}\``,
      `- Completed marathon passes: ${(evaluation.marathonPassesCompleted ?? []).join(', ') || 'none'}`,
      `- Next action: ${evaluation.nextRequiredAction}`, '',
      ...evaluation.blockingDeviations.map((item) => `- ${item}`), '',
      '> Green CI confirms technical integrity only; owner visual approval remains separate.', '',
    ].join('\n'));
  }
  console.log(`brand reference progress: ${percent}% — ${progressLabel(evaluation.overallScore, accepted)}; ${detail}`);
}

const manifestFile = 'qa/reference/brand-reference-manifest.json';
const contractFile = 'qa/reference/brand-reference-contract.json';
const evaluationFile = 'qa/brand-reference-evaluation.json';
const manifest = parse<Manifest>(manifestFile);
const contract = parse<{ referenceId: string; requiredStructures: string[]; forbiddenDrift: string[] }>(contractFile);
const evaluation = parse<Evaluation>(evaluationFile);

assert.equal(manifest.referenceId, 'canonical-hooded-figure-v2-clean-base', 'canonical reference id changed');
assert.equal(manifest.status, 'immutable', 'canonical reference must remain immutable');
assert.match(manifest.visualAuthority, /user-approved canonical reference/i, 'visual authority was weakened');
assert.equal(manifest.projectFile, 'qa/reference/brand-emblem-canonical-reference.webp', 'canonical file path changed');
assert.deepEqual(manifest.projectDimensions, { width: 256, height: 256 }, 'canonical project dimensions changed');
assert.deepEqual(manifest.sourceDimensions, { width: 1254, height: 1254 }, 'approved source dimensions changed');
assert.equal(manifest.sourceTitle, 'Figure mystérieuse dans une lueur bleue.png', 'wrong square reference source title');
assert.equal(manifest.sourceSha256, 'a780a19917fb9d5d280f0a8c3629b3f1d97b599da62add6e18b14252ed577b67', 'approved source identity changed');
assert.equal(manifest.projectSha256, '767be12318c21aeb2c259a4ab529f04caf9f5db9b131c38223ea85e109ea8532', 'canonical project hash changed');
assert.match(manifest.compositionLock, /square close-up bust/i, 'square close-up composition lock is missing');
assert.match(manifest.compositionLock, /huge pure-black face void/i, 'dominant black face void is not locked');
assert.match(manifest.compositionLock, /electric-blue aura behind the head and upper body/i, 'upper aura placement is not locked');
assert.match(manifest.derivation, /quality 92/i, 'canonical derivation changed');
assert.match(manifest.replacementPolicy, /explicit user approval/i, 'replacement must require explicit user approval');
assert.ok(fs.existsSync(resolve(manifest.projectFile)), 'canonical reference image is missing');
assert.equal(sha256(bytes(manifest.projectFile)), manifest.projectSha256, 'canonical reference bytes changed');
assert.deepEqual(webpSize(manifest.projectFile), manifest.projectDimensions, 'canonical dimensions differ');

assert.equal(manifest.supplementalReferences.length, 1, 'supplemental reference policy drifted');
const supplemental = manifest.supplementalReferences[0];
assert.equal(supplemental.title, 'Siluette dans la brume sombre.png', 'long silhouette identity changed');
assert.match(supplemental.role, /supplemental mood material only/i, 'long silhouette was promoted');
assert.equal(supplemental.mayInfluenceProductionGeometry, false, 'long silhouette may not influence geometry');
assert.equal(supplemental.mayInfluenceOpticalRatios, false, 'long silhouette may not influence optical ratios');
assert.equal(supplemental.mayInfluenceApprovalScore, false, 'long silhouette may not influence approval');

assert.equal(contract.referenceId, manifest.referenceId, 'geometry contract targets another reference');
for (const required of [
  'high layered pointed hood',
  'broad deep black face cavern with a rounded pentagonal base',
  'heavy gathered cowl below the face rather than a crossed necktie',
  'left diagonal fold family',
  'right diagonal fold family',
  'central vertical fold family',
  'electrical spectral aura concentrated behind the hood, shoulders and side edges',
  'clean lower edge with no required smoke beneath the cloak',
]) assert.ok(contract.requiredStructures.includes(required), `reference contract missing: ${required}`);
for (const forbidden of [
  'narrow vertical face droplet',
  'rounded poncho or bell silhouette',
  'clean crossed X collar or thin central necktie',
  'large smoke pool or glowing mist under the cloak hem',
  'bottom aura added merely to imitate the superseded v1 reference',
  'green CI presented as proof of visual similarity',
]) assert.ok(contract.forbiddenDrift.includes(forbidden), `reference drift stop missing: ${forbidden}`);

const candidateFiles = [
  'src/components/BrandMark.tsx',
  'src/components/brandMotionV18.ts',
  'src/components/brandEmblemV18.svg',
  'public/brand-emblem.svg',
  'public/brand-mark-micro.svg',
  'public/brand-emblem-mask.svg',
] as const;
for (const file of candidateFiles) {
  const expected = evaluation.candidateGitBlobShas[file];
  assert.ok(expected, `${evaluationFile}: missing Git blob lock for ${file}`);
  assert.equal(gitBlobSha(bytes(file)), expected, `${file} changed without synchronized evaluation`);
}

const component = read('src/components/BrandMark.tsx');
const componentSource = component.match(/const VECTOR_SOURCE = '([^']+)'/)?.[1];
assert.equal(componentSource, 'square-closeup-reference-v18-2', 'BrandMark does not use v18.2');
assert.equal(evaluation.candidateSource, componentSource, 'evaluation source differs from BrandMark');
for (const file of ['src/components/brandEmblemV18.svg', 'public/brand-emblem.svg', 'public/brand-mark-micro.svg', 'public/brand-emblem-mask.svg']) {
  assert.equal(read(file).match(/data-brand-vector-source="([^"]+)"/)?.[1], componentSource, `${file}: source differs`);
}
assert.equal(evaluation.referenceId, manifest.referenceId, 'evaluation used wrong reference');
assert.equal(evaluation.reviewedAgainstReferenceSha256, manifest.projectSha256, 'evaluation used unpinned bytes');
assert.equal(evaluation.comparisonArtifact, 'qa-artifacts/brand-reference-comparison-matrix.png', 'comparison artifact path changed');
assert.equal(evaluation.liveSiteComparisonArtifact, 'qa-artifacts/brand-reference-live-site-comparison.png', 'live comparison artifact path changed');
assert.equal(evaluation.status, 'reference-reviewed', 'candidate must record reference review');
assert.ok(evaluation.overallScore >= 0 && evaluation.overallScore <= 1, 'overall score invalid');
for (const key of ['macroProportions', 'hoodAndCavern', 'collarAndFolds', 'cloakSilhouette', 'rimAndAura', 'microReadability', 'interactionQuality']) {
  const score = evaluation.scores[key];
  assert.ok(typeof score === 'number' && score >= 0 && score <= 1, `${key}: invalid score`);
}
assert.ok(evaluation.reviewerDecision === 'reference-accepted' || evaluation.reviewerDecision === 'not-reference-approved', 'invalid reviewer decision');
if (evaluation.reviewerDecision === 'reference-accepted') {
  assert.ok(evaluation.overallScore >= 0.9, 'owner-approved final candidate must score at least 0.90');
  assert.deepEqual(evaluation.blockingDeviations, [], 'accepted candidate still has blocking deviations');
} else {
  assert.ok(evaluation.blockingDeviations.length > 0, 'not-approved candidate must list deviations');
}

for (const file of ['AGENTS.md', 'docs/BRAND_EMBLEM.md', 'qa/reference/README.md', '.github/pull_request_template.md']) {
  const source = read(file);
  assert.match(source, /canonical-hooded-figure-v2-clean-base/, `${file}: canonical id missing`);
  assert.match(source, /no required smoke|без обязательного дыма|free of required smoke|clean lower edge/i, `${file}: lower-edge rule missing`);
}
const research = read('docs/research/BRAND_EMBLEM_SVG_MOTION_MARATHON_2026.md');
assert.match(research, /Primary and official source run \(60 links\)/, 'engineering research baseline missing');
assert.match(research, /## 24-pass programme/, '24-pass programme missing');
const ledger = parse<{ primaryReferenceDescription: string; supplementalReferences: { mayInfluenceGeometry: boolean; mayInfluenceApproval: boolean }[]; plannedPasses: number }>('qa/brand-marathon-pass-ledger.json');
assert.match(ledger.primaryReferenceDescription, /square close-up bust/i, 'ledger points at wrong composition');
assert.equal(ledger.plannedPasses, 24, 'marathon length changed');
assert.ok(ledger.supplementalReferences.every((item) => !item.mayInfluenceGeometry && !item.mayInfluenceApproval), 'supplemental image entered approval loop');

const browserQa = read('qa/brand-reference-comparison.spec.mjs');
for (const artifact of ['brand-reference-comparison-matrix.png', 'brand-reference-live-site-comparison.png', 'brand-live-site-home-first-viewport.png']) {
  assert.ok(browserQa.includes(artifact), `browser QA missing ${artifact}`);
}

report(evaluation);
