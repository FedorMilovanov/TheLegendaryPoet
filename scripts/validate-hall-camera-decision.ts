import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

const contractPath = 'docs/hall-v3/hall-v3-contract.json';
const rigsPath = 'docs/hall-v3/camera-rigs.json';
const decisionPath = 'docs/hall-v3/camera-decision.json';
const generatorPath = 'scripts/hall-camera/generate-camera-candidates.py';

const contract = JSON.parse(read(contractPath)) as any;
const rigs = JSON.parse(read(rigsPath)) as any;
const decision = JSON.parse(read(decisionPath)) as any;
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string,string> };

function gitBlobSha(relative: string) {
  const bytes = fs.readFileSync(path.join(root, relative));
  const header = Buffer.from(`blob ${bytes.length}\0`, 'utf8');
  return crypto.createHash('sha1').update(Buffer.concat([header, bytes])).digest('hex');
}

expect(contract.schemaVersion === 1 && contract.laneId === 'TLP-HALL-001', 'Hall contract identity must remain exact');
expect(contract.phase === 'cameraApproval', 'decision-record transaction must remain inside cameraApproval until a separate gate-promotion transaction');
expect(contract.gates?.cameraApproval === 'active', 'cameraApproval must remain active during the decision-record transaction');
for (const gate of ['materialLightingExportSpike','pushkinVerticalSlice','offlineVisualApproval','webVerticalSlice','fullMuseumScaleOut']) {
  expect(contract.gates?.[gate] === 'blocked', `later gate must remain blocked until separate promotion: ${gate}`);
}
expect(contract.productionRoute?.mode === 'placeholder', '/hall must remain a placeholder during camera decision');
expect(contract.productionRoute?.allowLegacyHallImports === false, 'camera decision must not reactivate Hall v2');
expect(contract.productionRoute?.allowThreeRuntimeImports === false, 'camera decision must not activate Three/R3F runtime');
expect(contract.sourceAuthority?.cameraRigs === rigsPath, 'camera candidate source authority must remain registered');
expect(contract.sourceAuthority?.cameraDecision === decisionPath, 'camera decision authority must be registered');

// Candidate evidence stays immutable. Selection belongs to the separate decision record.
expect(rigs.schemaVersion === 1 && rigs.laneId === 'TLP-HALL-001', 'camera candidate identity must remain exact');
expect(rigs.phase === 'cameraApproval' && rigs.status === 'candidate-authoring', 'camera evidence source must remain the merged candidate-authoring record');
expect(rigs.selectedTopology === 'H3', 'camera candidates must remain bound to H3');
expect(rigs.approvedRig === null, 'candidate source must not be rewritten to masquerade as the decision authority');
expect(gitBlobSha(rigsPath) === decision.evidence?.candidateSourceBlob, 'camera decision must freeze the exact merged camera-rigs Git blob');
expect(gitBlobSha(generatorPath) === decision.evidence?.cameraGeneratorBlob, 'camera decision must freeze the exact merged camera generator Git blob');

const byId = new Map((rigs.rigs ?? []).map((rig: any) => [rig.id, rig]));
expect(JSON.stringify([...byId.keys()]) === JSON.stringify(['R0','R1','R2','R3']), 'camera source must retain R0/R1/R2/R3');
expect(byId.get('R2')?.status === 'rejected', 'R2 must remain the evidence-level rejected rig');
expect(byId.get('R2')?.expectedFailure?.hitObject === 'HUMAN_PROXY', 'R2 must preserve HUMAN_PROXY rejection evidence');

expect(decision.schemaVersion === 1 && decision.laneId === 'TLP-HALL-001', 'camera decision identity must remain exact');
expect(decision.phase === 'cameraApproval' && decision.status === 'selected', 'camera decision must be selected inside cameraApproval');
expect(decision.selectedTopology === 'H3', 'camera decision may not change topology');
expect(decision.selectedRig === 'R1', 'R1 must be the selected camera rig');
expect(decision.reserveRig === 'R3', 'R3 must remain reserve');
expect(JSON.stringify(decision.rejectedRigs ?? []) === JSON.stringify(['R0','R2']), 'R0 and R2 must be explicitly rejected');
expect(decision.evidence?.testedHead === '7637010ef69248fe05ea37c1a1cf9ee8d2a38193', 'decision must cite the exact tested camera head');
expect(decision.evidence?.artifactId === 9027136608, 'decision must cite the exact camera artifact ID');
expect(decision.evidence?.artifactDigest === 'sha256:17af431ffb72bd40b5febd8fa9927699f8c792ecdeea795d3b913b9cd6941c04', 'decision must cite the exact camera artifact digest');
expect(decision.evidence?.blenderVersion === '4.5.12 LTS', 'decision must preserve Blender version');
expect(decision.evidence?.selectedLayoutFingerprint === '5d5d0ddd8b150aa64afb73a2a3d9e00c6005e99fc935a6d4707a49ecd475fe65', 'decision must preserve H3 layout fingerprint');
expect(decision.evidence?.meshGeometryFingerprint === 'b3de770858a423305db8fcab15b405414e66b3d3de93ab1deaa5b3b35b418777', 'decision must preserve H3 mesh fingerprint');
expect(decision.evidence?.manifestHashAudit === '36/36 PNG outputs matched recorded SHA-256 and byte length', 'decision must preserve full PNG hash audit');

const approved = decision.approvedCamera ?? {};
const sourceR1 = byId.get('R1')?.cameras?.pushkinViewing;
expect(approved.rigId === 'R1' && approved.variableWitness === 'pushkinViewing', 'approved camera must be R1 pushkinViewing');
expect(JSON.stringify(approved.position) === JSON.stringify(sourceR1?.position), 'approved R1 position must exactly match candidate evidence');
expect(JSON.stringify(approved.target) === JSON.stringify(sourceR1?.target), 'approved R1 target must exactly match candidate evidence');
expect(JSON.stringify(approved.nextDestination) === JSON.stringify(sourceR1?.nextDestination), 'approved R1 destination must exactly match candidate evidence');
expect(approved.lensMm === sourceR1?.lensMm && approved.lensMm === 28, 'approved R1 lens must exactly match candidate evidence');

expect(decision.decision?.R0?.disposition === 'rejected', 'R0 must be rejected as the bad baseline');
expect(decision.decision?.R1?.disposition === 'selected', 'R1 must be selected');
expect(decision.decision?.R2?.disposition === 'rejected' && decision.decision?.R2?.expectedFailure?.hitObject === 'HUMAN_PROXY', 'R2 rejection must preserve generated occlusion evidence');
expect(decision.decision?.R3?.disposition === 'reserve', 'R3 must remain reserve');
expect(decision.frozenAfterDecision?.topology === 'H3', 'H3 topology must remain frozen');
expect(decision.frozenAfterDecision?.fiveBaselineJourneyWitnesses === true, 'five baseline journey witnesses must remain frozen');
expect(decision.frozenAfterDecision?.pushkinViewingRig === 'R1', 'R1 pushkinViewing must be the frozen approved variable witness');
expect(decision.frozenAfterDecision?.geometryMayChange === false, 'camera decision cannot authorize geometry changes');
expect(decision.frozenAfterDecision?.cameraMayChangeWithoutNewCameraApproval === false, 'approved camera cannot drift without a new camera approval');
expect(decision.nextGate === 'materialLightingExportSpike', 'camera decision must name only the next material/light/export spike');

const forbiddenOpened = ['materials','lighting','textures','final Pushkin portrait/document assets','GLB export settings','web runtime','performance budgets','full museum scale-out'];
for (const item of forbiddenOpened) expect((decision.nonDecisions ?? []).includes(item), `decision must preserve non-decision: ${item}`);

const scripts = packageJson.scripts ?? {};
expect((scripts['validate:hall-camera-approval'] ?? '').includes('validate-hall-camera-decision.ts'), 'camera decision validator must be chained into validate:hall-camera-approval');
expect((scripts.check ?? '').includes('validate:hall-camera-approval'), 'normal check must retain the camera approval chain');

if (failures.length) {
  console.error('Hall camera decision validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Hall camera decision validation passed.');
console.log(`Selected rig: ${decision.selectedRig}; reserve: ${decision.reserveRig}; rejected: ${(decision.rejectedRigs ?? []).join(', ')}.`);
console.log(`Frozen evidence: head ${decision.evidence.testedHead}, artifact ${decision.evidence.artifactId}.`);
