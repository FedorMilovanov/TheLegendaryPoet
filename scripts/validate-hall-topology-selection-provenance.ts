import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative: string) => fs.existsSync(path.join(root, relative));
const gitBlobSha1 = (content: string) => {
  const header = `blob ${Buffer.byteLength(content, 'utf8')}\0`;
  return crypto.createHash('sha1').update(header).update(content).digest('hex');
};

const decisionPath = 'docs/hall-v3/greybox-decision.json';
const layoutsPath = 'docs/hall-v3/greybox-layouts.json';
const toolingPath = 'docs/hall-v3/greybox-tooling.json';
const candidatesPath = 'docs/hall-v3/greybox-candidates.json';
const generatorPath = 'scripts/hall-greybox/generate-candidates.py';
const workflowPath = '.github/workflows/hall-greybox-tooling.yml';

const decision = JSON.parse(read(decisionPath)) as any;
const reference = JSON.parse(read('docs/hall-v3/reference-bible.json')) as any;
const tooling = JSON.parse(read(toolingPath)) as any;
const candidates = JSON.parse(read(candidatesPath)) as any;
const layoutsText = read(layoutsPath);
const layouts = JSON.parse(layoutsText) as any;
const generatorText = read(generatorPath);
const workflow = read(workflowPath);

const EXPECTED_LAYOUTS_BLOB = 'b3def316d855a6539ffd280217ed63e22c6855d9';
const EXPECTED_GENERATOR_BLOB = '7f5dbe64d61880031819a5d4e855e5c6b7285ef3';
const IDS = ['H1', 'H2', 'H3'];
const CAMERAS = ['entryReveal', 'orientation', 'firstTransition', 'pushkinApproach', 'pushkinViewing', 'reverseExit'];
const MOBILE = ['entryReveal', 'pushkinApproach', 'pushkinViewing'];

// Freeze the complete neutral shootout source used by the topology decision.
// The older layoutFingerprint intentionally covered architecture only; these Git-blob pins
// additionally freeze camera specs, Pushkin proxy grammar, clearance probes and generator logic.
expect(decision.candidateEvidence?.layoutsGitBlobSha === EXPECTED_LAYOUTS_BLOB, 'decision must pin the exact complete greybox-layouts Git blob');
expect(decision.candidateEvidence?.generatorGitBlobSha === EXPECTED_GENERATOR_BLOB, 'decision must pin the exact candidate-generator Git blob');
expect(gitBlobSha1(layoutsText) === EXPECTED_LAYOUTS_BLOB, 'current greybox-layouts source drifted from the exact shootout used for topology selection');
expect(gitBlobSha1(generatorText) === EXPECTED_GENERATOR_BLOB, 'current candidate generator drifted from the exact shootout used for topology selection');

// Preserve tooling invariants that existed before the authoring-only validators were consolidated.
expect(tooling.blender?.officialBuildIndex?.startsWith('https://builder.blender.org/'), 'Hall tooling must retain the official Blender build-index witness');
expect(tooling.blender?.officialManual?.startsWith('https://docs.blender.org/manual/'), 'Hall tooling must retain the official Blender manual witness');
expect(JSON.stringify(tooling.smokeScene?.requiredCollections ?? []) === JSON.stringify(['COLL_CORE', 'COLL_CAMERAS', 'COLL_EXPORT_HELPERS']), 'Hall tooling must retain the exact smoke-scene collection contract');
expect(JSON.stringify(tooling.smokeScene?.requiredObjects ?? []) === JSON.stringify(['TOOLING_FLOOR', 'HUMAN_PROXY', 'CAM_TOOLING_PREFLIGHT']), 'Hall tooling must retain the exact smoke-scene object contract');
expect((tooling.nonGoals?.length ?? 0) >= 8, 'Hall tooling must retain strong pre-lookdev non-goals');
expect(workflow.includes(tooling.blender?.archiveUrl ?? '<missing>'), 'Hall Blender workflow must download the exact archive declared by tooling authority');
expect(workflow.includes(tooling.blender?.checksumIndexUrl ?? '<missing>'), 'Hall Blender workflow must download the exact checksum index declared by tooling authority');

// Preserve the complete equal-comparison source contract, including non-geometric evidence grammar.
expect((candidates.automaticRejectionRules?.length ?? 0) >= 8, 'topology authority must retain the full automatic rejection rule surface');
expect(JSON.stringify(candidates.equalComparison?.requiredOutputs ?? []) === JSON.stringify(reference.greyboxEvidencePackage?.requiredOutputs ?? []), 'topology authority must retain the exact Reference Bible required-output contract');
expect(JSON.stringify(layouts.candidates?.map((candidate: any) => candidate.id) ?? []) === JSON.stringify(IDS), 'shootout source must retain H1/H2/H3 in order');

for (const candidate of layouts.candidates ?? []) {
  expect((candidate.ceilingZones?.length ?? 0) >= 4, `${candidate.id}: retained shootout must preserve multiple ceiling-height zones`);
  expect(candidate.pushkin?.anchor && (candidate.pushkin?.documentCases?.length ?? 0) === 2, `${candidate.id}: retained shootout must preserve one Pushkin anchor plus two documentary cases`);
  expect(JSON.stringify(Object.keys(candidate.cameras ?? {})) === JSON.stringify(CAMERAS), `${candidate.id}: retained shootout must preserve all six camera witnesses`);
  for (const cameraId of CAMERAS) {
    const camera = candidate.cameras?.[cameraId];
    expect(Array.isArray(camera?.position) && camera.position.length === 3, `${candidate.id}/${cameraId}: camera position must remain a 3D point`);
    expect(Array.isArray(camera?.target) && camera.target.length === 3, `${candidate.id}/${cameraId}: camera target must remain a 3D point`);
    expect(Array.isArray(camera?.nextDestination) && camera.nextDestination.length === 3, `${candidate.id}/${cameraId}: next-destination witness must remain a 3D point`);
    expect((camera?.note?.length ?? 0) >= 5, `${candidate.id}/${cameraId}: camera witness must retain a meaningful destination note`);
  }
}

const toolingEvidenceRelative = process.env.HALL_GREYBOX_TOOLING_EVIDENCE;
if (toolingEvidenceRelative) {
  expect(exists(toolingEvidenceRelative), `tooling evidence must exist: ${toolingEvidenceRelative}`);
  if (exists(toolingEvidenceRelative)) {
    const evidence = JSON.parse(read(toolingEvidenceRelative)) as any;
    for (const name of tooling.smokeScene?.requiredCollections ?? []) {
      expect(evidence.scene?.collections?.includes(name) === true, `generated tooling evidence lost required collection ${name}`);
    }
    for (const name of tooling.smokeScene?.requiredObjects ?? []) {
      expect(evidence.scene?.objects?.includes(name) === true, `generated tooling evidence lost required object ${name}`);
    }
  }
}

const candidateEvidenceRelative = process.env.HALL_GREYBOX_CANDIDATE_EVIDENCE;
if (candidateEvidenceRelative) {
  expect(exists(candidateEvidenceRelative), `candidate evidence index must exist: ${candidateEvidenceRelative}`);
  if (exists(candidateEvidenceRelative)) {
    const evidenceRoot = path.dirname(path.join(root, candidateEvidenceRelative));
    for (const id of IDS) {
      const manifestPath = path.join(evidenceRoot, id, 'manifest.json');
      expect(fs.existsSync(manifestPath), `${id}: generated candidate manifest must exist`);
      if (!fs.existsSync(manifestPath)) continue;
      const generated = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as any;
      expect(generated.scene?.cameraObjects === 6, `${id}: regenerated scene must contain exactly six witness cameras`);
      const probeWidths = (generated.clearanceProbes ?? []).map((probe: any) => Number(probe.measuredWidthMetres ?? 0));
      expect(probeWidths.filter((width: number) => width >= 1.525).length >= 2, `${id}: regenerated shootout must retain at least two stopping/two-way clearance witnesses`);
      expect(JSON.stringify(generated.render?.desktopResolution ?? []) === JSON.stringify([960, 540]), `${id}: regenerated desktop evidence resolution must remain 960x540`);
      expect(JSON.stringify(generated.render?.mobileResolution ?? []) === JSON.stringify([540, 960]), `${id}: regenerated mobile evidence resolution must remain 540x960`);
      expect(JSON.stringify(generated.render?.mobileWitnesses ?? []) === JSON.stringify(MOBILE), `${id}: regenerated portrait witness set must remain exact`);
    }
  }
}

if (failures.length > 0) {
  console.error('\nHall v3 shootout provenance validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Hall v3 shootout provenance passed: full layout/camera/exhibit source and generator are frozen to the selected evidence.');
