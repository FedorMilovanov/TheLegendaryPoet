import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

type Dimensions = { width: number; height: number };
type Manifest = {
  referenceId: string; visualAuthority: string; status: string; projectFile: string;
  projectDimensions: Dimensions; projectSha256: string; sourceDimensions: Dimensions;
  sourceSha256: string; derivation: string; replacementPolicy: string;
};
type Evaluation = {
  referenceId: string; reviewedAgainstReferenceSha256: string; candidateSource: string;
  candidateRevision: string; status: string; reviewerDecision: string; overallScore: number;
  scores: Record<string, number>; candidateGitBlobShas: Record<string, string>;
  comparisonArtifact: string; liveSiteComparisonArtifact: string;
  blockingDeviations: string[]; nextRequiredAction: string;
};

const root = path.resolve('.');
const resolve = (file: string) => path.resolve(root, file);
const read = (file: string) => fs.readFileSync(resolve(file), 'utf8');
const readBuffer = (file: string) => fs.readFileSync(resolve(file));
const sha256 = (buffer: Buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const gitBlobSha = (buffer: Buffer) => crypto.createHash('sha1').update(`blob ${buffer.length}\0`).update(buffer).digest('hex');
const parseJson = <T>(file: string): T => JSON.parse(read(file)) as T;

function webpSize(file: string): Dimensions {
  const buffer = readBuffer(file);
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

const manifestFile = 'qa/reference/brand-reference-manifest.json';
const contractFile = 'qa/reference/brand-reference-contract.json';
const evaluationFile = 'qa/brand-reference-evaluation.json';
const manifest = parseJson<Manifest>(manifestFile);
const contract = parseJson<{ referenceId: string; requiredStructures: string[]; forbiddenDrift: string[] }>(contractFile);
const evaluation = parseJson<Evaluation>(evaluationFile);

assert.equal(manifest.referenceId, 'canonical-hooded-figure-v2-clean-base', 'canonical reference id changed');
assert.equal(manifest.status, 'immutable', 'canonical reference must remain immutable');
assert.match(manifest.visualAuthority, /user-approved canonical reference/i, 'visual authority was weakened');
assert.equal(manifest.projectFile, 'qa/reference/brand-emblem-canonical-reference.webp', 'canonical file path changed');
assert.deepEqual(manifest.projectDimensions, { width: 256, height: 256 }, 'canonical project dimensions changed');
assert.deepEqual(manifest.sourceDimensions, { width: 1254, height: 1254 }, 'approved source dimensions changed');
assert.equal(manifest.sourceSha256, 'a780a19917fb9d5d280f0a8c3629b3f1d97b599da62add6e18b14252ed577b67', 'approved source identity changed');
assert.equal(manifest.projectSha256, '767be12318c21aeb2c259a4ab529f04caf9f5db9b131c38223ea85e109ea8532', 'canonical project hash changed');
assert.match(manifest.derivation, /quality 92/i, 'canonical derivation changed');
assert.match(manifest.replacementPolicy, /explicit user approval/i, 'reference replacement must require explicit user approval');
assert.ok(fs.existsSync(resolve(manifest.projectFile)), 'canonical reference image is missing');
const referenceBuffer = readBuffer(manifest.projectFile);
assert.equal(sha256(referenceBuffer), manifest.projectSha256, 'canonical reference image was modified');
assert.deepEqual(webpSize(manifest.projectFile), manifest.projectDimensions, 'canonical reference dimensions do not match manifest');

assert.equal(contract.referenceId, manifest.referenceId, 'geometry contract targets a different reference');
for (const required of [
  'high layered pointed hood',
  'broad deep black face cavern with a rounded pentagonal base',
  'heavy gathered cowl below the face rather than a crossed necktie',
  'electrical spectral aura concentrated behind the hood, shoulders and side edges',
  'clean lower edge with no required smoke beneath the cloak',
]) assert.ok(contract.requiredStructures.includes(required), `reference contract missing: ${required}`);
for (const forbidden of [
  'narrow vertical face droplet',
  'clean crossed X collar or thin central necktie',
  'large smoke pool or glowing mist under the cloak hem',
  'bottom aura added merely to imitate the superseded v1 reference',
  'green CI presented as proof of visual similarity',
]) assert.ok(contract.forbiddenDrift.includes(forbidden), `reference drift stop missing: ${forbidden}`);

const candidateFiles = [
  'src/components/BrandMark.tsx',
  'public/brand-emblem.svg',
  'public/brand-mark-micro.svg',
  'public/brand-emblem-mask.svg',
] as const;
for (const file of candidateFiles) {
  const expected = evaluation.candidateGitBlobShas[file];
  assert.ok(expected, `${evaluationFile}: missing Git blob lock for ${file}`);
  assert.equal(gitBlobSha(readBuffer(file)), expected, `${file} changed without a synchronized reference evaluation`);
}

const component = read('src/components/BrandMark.tsx');
const componentSource = component.match(/const VECTOR_SOURCE = '([^']+)'/)?.[1];
assert.ok(componentSource, 'BrandMark VECTOR_SOURCE is missing');
assert.equal(evaluation.candidateSource, componentSource, 'evaluation does not describe active BrandMark source');
for (const file of ['public/brand-emblem.svg', 'public/brand-mark-micro.svg', 'public/brand-emblem-mask.svg']) {
  const source = read(file).match(/data-brand-vector-source="([^"]+)"/)?.[1];
  assert.equal(source, componentSource, `${file}: vector source differs from BrandMark`);
}
assert.equal(evaluation.referenceId, manifest.referenceId, 'evaluation used wrong canonical reference');
assert.equal(evaluation.reviewedAgainstReferenceSha256, manifest.projectSha256, 'evaluation was not performed against pinned v2 bytes');
assert.equal(evaluation.comparisonArtifact, 'qa-artifacts/brand-reference-comparison-matrix.png', 'comparison artifact path changed');
assert.equal(evaluation.liveSiteComparisonArtifact, 'qa-artifacts/brand-reference-live-site-comparison.png', 'live-site comparison artifact path changed');
assert.equal(evaluation.status, 'reference-reviewed', 'candidate must record completed reference review');
assert.ok(evaluation.overallScore >= 0 && evaluation.overallScore <= 1, 'overall reference score is invalid');
for (const key of ['macroProportions', 'hoodAndCavern', 'collarAndFolds', 'cloakSilhouette', 'rimAndAura', 'microReadability']) {
  const score = evaluation.scores[key];
  assert.ok(typeof score === 'number' && score >= 0 && score <= 1, `${key}: invalid reference score`);
}

if (evaluation.reviewerDecision !== 'reference-accepted') {
  assert.ok(evaluation.blockingDeviations.length > 0, 'not-approved candidate must list blocking deviations');
  throw new assert.AssertionError({
    message: `reference gate: ${evaluation.candidateRevision} remains not-reference-approved against ${manifest.referenceId}`,
    actual: evaluation.reviewerDecision,
    expected: 'reference-accepted',
    operator: 'strictEqual',
  });
}

assert.ok(evaluation.overallScore >= 0.82, 'accepted reference fidelity score is below 0.82');
const thresholds: Record<string, number> = {
  macroProportions: 0.84, hoodAndCavern: 0.84, collarAndFolds: 0.78,
  cloakSilhouette: 0.82, rimAndAura: 0.76, microReadability: 0.76,
};
for (const [name, minimum] of Object.entries(thresholds)) assert.ok((evaluation.scores[name] ?? 0) >= minimum, `${name}: accepted score is below ${minimum}`);
assert.deepEqual(evaluation.blockingDeviations, [], 'accepted candidate still has blocking deviations');

for (const file of ['AGENTS.md', 'docs/BRAND_EMBLEM.md', 'qa/reference/README.md', '.github/pull_request_template.md']) {
  const source = read(file);
  assert.match(source, /canonical-hooded-figure-v2-clean-base/, `${file}: v2 reference id missing`);
  assert.match(source, /no required smoke|без обязательного дыма|free of required smoke|clean lower edge/i, `${file}: clean lower-edge rule missing`);
}
const browserQa = read('qa/brand-reference-comparison.spec.mjs');
assert.match(browserQa, /brand-reference-comparison-matrix\.png/, 'browser QA does not create optical reference matrix');
assert.match(browserQa, /brand-reference-live-site-comparison\.png/, 'browser QA does not create live-site comparison');
assert.match(browserQa, /brand-live-site-home-first-viewport\.png/, 'browser QA does not capture live homepage');

console.log(`brand reference contract: ${manifest.referenceId}; ${evaluation.candidateRevision} is reference-accepted`);
