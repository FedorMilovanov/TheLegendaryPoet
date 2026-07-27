import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

type Dimensions = { width: number; height: number };
type Manifest = {
  referenceId: string;
  visualAuthority: string;
  status: string;
  projectFile: string;
  projectDimensions: Dimensions;
  projectSha256: string;
  sourceDimensions: Dimensions;
  sourceSha256: string;
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
  blockingDeviations: string[];
  nextRequiredAction: string;
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

    if (type === 'VP8X') {
      return {
        width: 1 + buffer.readUIntLE(data + 4, 3),
        height: 1 + buffer.readUIntLE(data + 7, 3),
      };
    }
    if (type === 'VP8 ') {
      assert.equal(buffer.subarray(data + 3, data + 6).toString('hex'), '9d012a', `${file}: VP8 frame header missing`);
      return {
        width: buffer.readUInt16LE(data + 6) & 0x3fff,
        height: buffer.readUInt16LE(data + 8) & 0x3fff,
      };
    }
    if (type === 'VP8L') {
      assert.equal(buffer[data], 0x2f, `${file}: VP8L signature missing`);
      const bits = buffer.readUInt32LE(data + 1);
      return {
        width: 1 + (bits & 0x3fff),
        height: 1 + ((bits >>> 14) & 0x3fff),
      };
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

assert.equal(manifest.referenceId, 'canonical-hooded-figure-v1', 'canonical reference id changed');
assert.equal(manifest.status, 'immutable', 'canonical reference must remain immutable');
assert.equal(manifest.visualAuthority, 'user-supplied canonical reference', 'visual authority was weakened');
assert.equal(manifest.projectFile, 'qa/reference/brand-emblem-canonical-reference.webp', 'canonical file path changed');
assert.deepEqual(manifest.projectDimensions, { width: 256, height: 256 }, 'canonical project dimensions changed');
assert.deepEqual(manifest.sourceDimensions, { width: 1254, height: 1254 }, 'user-supplied source dimensions changed');
assert.equal(manifest.sourceSha256, '9a0bb7d233910e7469e0b2fcace587df72550b98ced3af870adf9e717e59b61a', 'user-supplied source identity changed');
assert.equal(manifest.projectSha256, '6ed4068636a63532de6269b2660cec186364399f3a0f4519430d9e08c751b0ad', 'canonical project hash changed');
assert.match(manifest.replacementPolicy, /explicit user approval/i, 'reference replacement must require explicit user approval');
assert.ok(fs.existsSync(resolve(manifest.projectFile)), 'canonical reference image is missing');
const referenceBuffer = readBuffer(manifest.projectFile);
assert.equal(sha256(referenceBuffer), manifest.projectSha256, 'canonical reference image was modified');
assert.deepEqual(webpSize(manifest.projectFile), manifest.projectDimensions, 'canonical reference dimensions do not match the manifest');

assert.equal(contract.referenceId, manifest.referenceId, 'geometry contract targets a different reference');
assert.ok(contract.requiredStructures.length >= 8, 'reference contract lost required structures');
assert.ok(contract.forbiddenDrift.length >= 8, 'reference contract lost hard stop conditions');
for (const required of [
  'broad pentagonal black face cavern',
  'diagonal angular cloak silhouette',
  'broad central collar overlap',
  'continuous icy rim on both sides',
  'broad spectral aura',
]) assert.ok(contract.requiredStructures.includes(required), `reference contract missing: ${required}`);
for (const forbidden of [
  'narrow vertical face droplet',
  'oversized hood on a compact bust',
  'rounded dome or poncho silhouette',
  'artificially split collar with empty centre',
  'decorative micro-detail used to avoid macro redesign',
]) assert.ok(contract.forbiddenDrift.includes(forbidden), `reference drift stop missing: ${forbidden}`);

const candidateFiles = [
  'src/components/BrandMark.tsx',
  'public/brand-emblem.svg',
  'public/brand-mark-micro.svg',
  'public/brand-emblem-mask.svg',
] as const;
for (const file of candidateFiles) {
  const expected = evaluation.candidateGitBlobShas[file];
  assert.ok(expected, `${evaluationFile}: missing git blob lock for ${file}`);
  assert.equal(gitBlobSha(readBuffer(file)), expected, `${file} changed without a same-commit reference evaluation update`);
}

const component = read('src/components/BrandMark.tsx');
const componentSource = component.match(/const VECTOR_SOURCE = '([^']+)'/)?.[1];
assert.ok(componentSource, 'BrandMark VECTOR_SOURCE is missing');
assert.equal(evaluation.candidateSource, componentSource, 'evaluation does not describe the active BrandMark source');
for (const file of ['public/brand-emblem.svg', 'public/brand-mark-micro.svg']) {
  const source = read(file).match(/data-brand-vector-source="([^"]+)"/)?.[1];
  assert.equal(source, componentSource, `${file}: vector source differs from BrandMark`);
}
assert.equal(evaluation.referenceId, manifest.referenceId, 'evaluation used the wrong canonical reference');
assert.equal(evaluation.reviewedAgainstReferenceSha256, manifest.projectSha256, 'evaluation was not performed against the pinned reference bytes');
assert.equal(evaluation.comparisonArtifact, 'qa-artifacts/brand-reference-comparison-matrix.png', 'comparison artifact path changed');

const legacySource = 'reference-derived-contours-v8-24';
if (componentSource === legacySource) {
  assert.equal(evaluation.status, 'legacy-baseline-not-reference-approved', 'legacy v8.x geometry must never be marked reference-approved');
  assert.equal(evaluation.reviewerDecision, 'not-reference-approved', 'legacy v8.x decision must remain explicit');
  assert.ok(evaluation.overallScore < 0.5, 'legacy v8.x baseline cannot be inflated into a passing reference score');
  assert.ok(evaluation.blockingDeviations.length >= 5, 'legacy baseline must retain its blocking deviations');
  assert.match(evaluation.nextRequiredAction, /v9 geometry reset/i, 'legacy baseline must direct the next marathon to a v9 geometry reset');
} else {
  assert.equal(evaluation.status, 'reference-reviewed', 'new geometry must have a completed reference review');
  assert.equal(evaluation.reviewerDecision, 'reference-accepted', 'new geometry requires an explicit reference acceptance decision');
  assert.ok(evaluation.overallScore >= 0.78, 'reference fidelity score is below the acceptance floor');
  const thresholds: Record<string, number> = {
    macroProportions: 0.8,
    hoodAndCavern: 0.8,
    collarAndFolds: 0.75,
    cloakSilhouette: 0.8,
    rimAndAura: 0.7,
    microReadability: 0.75,
  };
  for (const [name, minimum] of Object.entries(thresholds)) {
    assert.ok((evaluation.scores[name] ?? 0) >= minimum, `${name} reference score is below ${minimum}`);
  }
  assert.deepEqual(evaluation.blockingDeviations, [], 'reference-accepted candidate still has blocking deviations');
}

const agents = read('AGENTS.md');
const docs = read('docs/BRAND_EMBLEM.md');
const referenceReadme = read('qa/reference/README.md');
const packageJson = read('package.json');
const browserQa = read('qa/brand-reference-comparison.spec.mjs');
const workflow = read('.github/workflows/manual-browser-qa.yml');
const prTemplate = read('.github/pull_request_template.md');
for (const [file, source] of [
  ['AGENTS.md', agents],
  ['docs/BRAND_EMBLEM.md', docs],
  ['qa/reference/README.md', referenceReadme],
]) {
  assert.match(source, /qa\/reference\/brand-emblem-canonical-reference\.webp|brand-emblem-canonical-reference\.webp/, `${file}: canonical reference path missing`);
  assert.match(source, /NOT REFERENCE APPROVED/, `${file}: legacy baseline warning missing`);
}
assert.match(agents, /Do not iterate from the previous SVG alone/, 'agents can still iterate from the previous SVG instead of the reference');
assert.match(agents, /green CI run is used as evidence of visual similarity/, 'green-CI visual fallacy is not prohibited');
assert.match(docs, /v9 geometry reset/i, 'brand documentation does not require the geometry reset');
assert.match(packageJson, /"validate:brand-reference"\s*:\s*"tsx scripts\/validate-brand-reference-contract\.ts"/, 'package script does not expose the reference gate');
assert.match(packageJson, /"validate:brand"\s*:\s*"[^"]*validate:brand-reference[^"]*validate-brand-assets\.ts"/, 'validate:brand does not run the reference gate before legacy asset checks');
assert.match(browserQa, /brand-emblem-canonical-reference\.webp/, 'browser QA does not load the canonical reference');
assert.match(browserQa, /brand-reference-comparison-matrix\.png/, 'browser QA does not produce the mandatory comparison matrix');
assert.match(workflow, /qa\/brand-reference-comparison\.spec\.mjs/, 'Manual Browser QA does not run the reference comparison test');
assert.match(prTemplate, /Canonical reference comparison/, 'PR template lacks the brand reference section');
assert.match(prTemplate, /brand-reference-comparison-matrix\.png/, 'PR template does not demand the exact-head comparison artifact');
assert.match(prTemplate, /not-reference-approved|reference-accepted/, 'PR template does not require an honest visual decision');

console.log(`brand reference contract: ${manifest.referenceId} is pinned; ${evaluation.candidateRevision} remains ${evaluation.status}`);
