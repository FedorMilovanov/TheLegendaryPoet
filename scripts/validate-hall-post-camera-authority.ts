import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative: string) => fs.existsSync(path.join(root, relative));
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const gitBlobSha = (relative: string) => {
  const bytes = fs.readFileSync(path.join(root, relative));
  const header = Buffer.from(`blob ${bytes.length}\0`, 'utf8');
  return crypto.createHash('sha1').update(Buffer.concat([header, bytes])).digest('hex');
};

const contractPath = 'docs/hall-v3/hall-v3-contract.json';
const promotionPath = 'docs/hall-v3/camera-gate-promotion.json';
const decisionPath = 'docs/hall-v3/camera-decision.json';
const rigsPath = 'docs/hall-v3/camera-rigs.json';
const layoutsPath = 'docs/hall-v3/greybox-layouts.json';
const greyboxGeneratorPath = 'scripts/hall-greybox/generate-candidates.py';
const cameraGeneratorPath = 'scripts/hall-camera/generate-camera-candidates.py';
const validatorPath = 'scripts/validate-hall-post-camera-authority.ts';

const contract = JSON.parse(read(contractPath)) as any;
const promotion = JSON.parse(read(promotionPath)) as any;
const decision = JSON.parse(read(decisionPath)) as any;
const rigs = JSON.parse(read(rigsPath)) as any;
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string,string> };
const ci = read('.github/workflows/ci.yml');
const projectContracts = read('.github/workflows/project-contracts.yml');
const hallWorkflow = read('.github/workflows/hall-greybox-tooling.yml');

const EXPECTED_LAYOUT_BLOB = 'b3def316d855a6539ffd280217ed63e22c6855d9';
const EXPECTED_GREYBOX_GENERATOR_BLOB = '7f5dbe64d61880031819a5d4e855e5c6b7285ef3';
const EXPECTED_CAMERA_RIGS_BLOB = '8c65312a53dbd41c7ec5f0a6128610e3f5428205';
const EXPECTED_CAMERA_GENERATOR_BLOB = '79f8b396b2fe0ca5fe695b49a70eb013f9c9418f';
const EXPECTED_CAMERA_DECISION_BLOB = 'fedf0c0d269822655a9db15b95914222c815769f';
const EXPECTED_H3_LAYOUT = '5d5d0ddd8b150aa64afb73a2a3d9e00c6005e99fc935a6d4707a49ecd475fe65';
const EXPECTED_H3_GEOMETRY = 'b3de770858a423305db8fcab15b405414e66b3d3de93ab1deaa5b3b35b418777';
const APPROVED_R1 = {
  position: [8.0, 2.5, 1.60],
  target: [11.15, 5.45, 1.95],
  nextDestination: [11.15, 5.45, 1.95],
  lensMm: 28,
};
const LATER_PHASES = ['materialLightingExportSpike','pushkinVerticalSlice','offlineVisualApproval','webVerticalSlice','fullMuseumScaleOut'];

expect(contract.schemaVersion === 1 && contract.laneId === 'TLP-HALL-001', 'Hall contract identity must remain exact after Camera Approval');
expect(LATER_PHASES.includes(contract.phase), `post-camera authority does not recognize phase ${contract.phase ?? '<missing>'}`);
expect(contract.gates?.foundation === 'completed', 'foundation must remain completed');
expect(contract.gates?.referenceBible === 'completed', 'Reference Bible must remain completed');
expect(contract.gates?.metricGreybox === 'completed', 'metric greybox must remain completed');
expect(contract.gates?.cameraApproval === 'completed', 'cameraApproval must remain completed after promotion');
if (contract.phase === 'materialLightingExportSpike') {
  expect(contract.gates?.materialLightingExportSpike === 'active', 'materialLightingExportSpike must be active immediately after camera promotion');
  for (const gate of ['pushkinVerticalSlice','offlineVisualApproval','webVerticalSlice','fullMuseumScaleOut']) {
    expect(contract.gates?.[gate] === 'blocked', `later gate must remain blocked during material/light/export spike: ${gate}`);
  }
}
expect(contract.productionRoute?.mode === 'placeholder', '/hall must remain a placeholder before web vertical slice approval');
expect(contract.productionRoute?.allowLegacyHallImports === false, 'post-camera work must not reactivate Hall v2');
expect(contract.productionRoute?.allowThreeRuntimeImports === false, 'post-camera offline work must not activate Three/R3F runtime');
expect(contract.productionRoute?.allowUnapprovedConceptArt === false, 'post-camera offline work must not publish unapproved concept art');
expect(contract.sourceAuthority?.cameraDecision === decisionPath, 'camera decision authority must remain registered');
expect(contract.sourceAuthority?.cameraGatePromotion === promotionPath, 'camera gate promotion authority must remain registered');

expect(promotion.schemaVersion === 1 && promotion.laneId === 'TLP-HALL-001', 'camera promotion identity must remain exact');
expect(promotion.promotion === 'cameraApproval-to-materialLightingExportSpike', 'promotion must describe only the camera-to-material transition');
expect(promotion.status === 'active-next-gate', 'promotion must activate exactly the next gate');
expect(promotion.phaseTransition?.from === 'cameraApproval' && promotion.phaseTransition?.to === 'materialLightingExportSpike', 'promotion phase transition must be exact');
expect(same(promotion.gatesAfterPromotion, contract.gates), 'promotion gate snapshot must equal the current machine contract');
expect(promotion.sourceDecision?.productPr === 383, 'promotion must cite Camera Decision PR #383');
expect(promotion.sourceDecision?.exactTestedHead === '8682789cf78e4e717eba5181246700da09de5c11', 'promotion must cite exact tested decision head');
expect(promotion.sourceDecision?.resultingMain === '07e23ea3feb79fea9d42f29b192e4e3f046713cc', 'promotion must cite exact resulting decision main');
expect(promotion.sourceDecision?.selectedTopology === 'H3' && promotion.sourceDecision?.selectedRig === 'R1', 'promotion may advance only frozen H3/R1');
expect(promotion.sourceDecision?.reserveRig === 'R3' && same(promotion.sourceDecision?.rejectedRigs,['R0','R2']), 'promotion must preserve reserve/reject dispositions');
expect(promotion.sourceDecision?.selectedLayoutFingerprint === EXPECTED_H3_LAYOUT, 'promotion must preserve H3 layout fingerprint');
expect(promotion.sourceDecision?.meshGeometryFingerprint === EXPECTED_H3_GEOMETRY, 'promotion must preserve H3 geometry fingerprint');
expect(same(promotion.approvedGuidedCamera, {rigId:'R1', variableWitness:'pushkinViewing', ...APPROVED_R1}), 'promotion must preserve exact R1 guided camera');
expect(promotion.productionBoundary?.hallRouteRemainsPlaceholder === true, 'promotion must keep /hall placeholder');
expect(promotion.productionBoundary?.legacyHallMayReactivate === false && promotion.productionBoundary?.threeRuntimeMayActivate === false, 'promotion must preserve legacy/Three isolation');
expect(promotion.productionBoundary?.thisPromotionAddsMaterials === false && promotion.productionBoundary?.thisPromotionAddsLights === false && promotion.productionBoundary?.thisPromotionAddsExportAssets === false, 'promotion transaction itself must add no lookdev/export assets');

expect(gitBlobSha(layoutsPath) === EXPECTED_LAYOUT_BLOB, 'frozen greybox layouts drifted after Camera Approval');
expect(gitBlobSha(greyboxGeneratorPath) === EXPECTED_GREYBOX_GENERATOR_BLOB, 'frozen greybox generator drifted after Camera Approval');
expect(gitBlobSha(rigsPath) === EXPECTED_CAMERA_RIGS_BLOB, 'immutable camera candidate source drifted after Camera Approval');
expect(gitBlobSha(cameraGeneratorPath) === EXPECTED_CAMERA_GENERATOR_BLOB, 'immutable camera generator drifted after Camera Approval');
expect(gitBlobSha(decisionPath) === EXPECTED_CAMERA_DECISION_BLOB, 'camera decision record drifted after gate promotion');
expect(promotion.frozenAuthorities?.greyboxLayoutsBlob === EXPECTED_LAYOUT_BLOB, 'promotion must pin frozen layout blob');
expect(promotion.frozenAuthorities?.greyboxGeneratorBlob === EXPECTED_GREYBOX_GENERATOR_BLOB, 'promotion must pin frozen greybox generator blob');
expect(promotion.frozenAuthorities?.cameraRigsBlob === EXPECTED_CAMERA_RIGS_BLOB, 'promotion must pin camera-rigs blob');
expect(promotion.frozenAuthorities?.cameraGeneratorBlob === EXPECTED_CAMERA_GENERATOR_BLOB, 'promotion must pin camera generator blob');
expect(promotion.frozenAuthorities?.cameraDecisionBlob === EXPECTED_CAMERA_DECISION_BLOB, 'promotion must pin camera decision blob');

expect(decision.selectedTopology === 'H3' && decision.selectedRig === 'R1' && decision.reserveRig === 'R3', 'camera decision must remain H3/R1 with R3 reserve');
expect(same(decision.rejectedRigs,['R0','R2']), 'camera decision must retain R0/R2 rejects');
expect(decision.evidence?.selectedLayoutFingerprint === EXPECTED_H3_LAYOUT, 'camera decision H3 layout fingerprint drifted');
expect(decision.evidence?.meshGeometryFingerprint === EXPECTED_H3_GEOMETRY, 'camera decision H3 geometry fingerprint drifted');
expect(same(decision.approvedCamera, {rigId:'R1', variableWitness:'pushkinViewing', ...APPROVED_R1}), 'camera decision R1 coordinates/lens drifted');
expect(rigs.approvedRig === null && rigs.status === 'candidate-authoring', 'camera-rigs must remain immutable candidate evidence, not be rewritten after selection');
const r2 = (rigs.rigs ?? []).find((rig:any)=>rig.id === 'R2');
expect(r2?.status === 'rejected' && r2?.expectedFailure?.hitObject === 'HUMAN_PROXY', 'R2 rejection evidence must remain reproducible');

const scripts = packageJson.scripts ?? {};
expect(scripts['validate:hall-post-camera-authority'] === `tsx ${validatorPath}`, 'package scripts must expose post-camera authority validator');
expect((scripts.check ?? '').includes('validate:hall-post-camera-authority'), 'normal check must run post-camera authority validator');
expect(!(scripts.check ?? '').includes('validate:hall-topology-selection ') && !(scripts.check ?? '').includes('validate:hall-camera-approval') && !(scripts.check ?? '').includes('validate:hall-camera-decision'), 'normal current-phase check must not keep phase-specific authoring validators mandatory after gate completion');
expect(ci.includes('npm run validate:hall-post-camera-authority'), 'primary CI must run post-camera authority validator');
expect(projectContracts.includes('npm run validate:hall-post-camera-authority'), 'Project contracts must run post-camera authority validator');
expect(hallWorkflow.includes('npm run validate:hall-post-camera-authority'), 'Hall Blender workflow must run post-camera authority validator');
expect(hallWorkflow.includes("'docs/hall-v3/camera-gate-promotion.json'") && hallWorkflow.includes(`'${validatorPath}'`), 'Hall Blender workflow must trigger on promotion authority changes');
expect(hallWorkflow.includes('npm run validate:hall-topology-provenance'), 'frozen topology provenance must remain independently validated');

const toolingEvidence = process.env.HALL_GREYBOX_TOOLING_EVIDENCE;
if (toolingEvidence) {
  expect(exists(toolingEvidence), `tooling evidence must exist: ${toolingEvidence}`);
  if (exists(toolingEvidence)) {
    const evidence = JSON.parse(read(toolingEvidence)) as any;
    expect(same(evidence.runtime?.versionTuple,[4,5,12]) && evidence.runtime?.background === true, 'tooling evidence must remain Blender 4.5.12 headless');
    expect(evidence.scene?.unitSystem === 'METRIC' && evidence.scene?.scaleLength === 1, 'tooling evidence must remain metre-scale');
  }
}

const candidateEvidence = process.env.HALL_GREYBOX_CANDIDATE_EVIDENCE;
if (candidateEvidence) {
  expect(exists(candidateEvidence), `greybox evidence must exist: ${candidateEvidence}`);
  if (exists(candidateEvidence)) {
    const evidenceRoot = path.dirname(path.join(root,candidateEvidence));
    const index = JSON.parse(read(candidateEvidence)) as any;
    expect(index.approvedCandidate === null && same(index.candidateOrder,['H1','H2','H3']), 'regenerated neutral evidence must remain unselected H1/H2/H3 evidence');
    const h3ManifestPath = path.join(evidenceRoot,'H3','manifest.json');
    expect(fs.existsSync(h3ManifestPath), 'regenerated H3 manifest must exist');
    if (fs.existsSync(h3ManifestPath)) {
      const h3 = JSON.parse(fs.readFileSync(h3ManifestPath,'utf8')) as any;
      expect(h3.layoutFingerprint === EXPECTED_H3_LAYOUT, 'regenerated H3 layout fingerprint drifted');
      expect(h3.scene?.materials === 0 && h3.scene?.lights === 0, 'frozen neutral H3 evidence must remain without lookdev');
    }
  }
}

const cameraEvidence = process.env.HALL_CAMERA_APPROVAL_EVIDENCE;
if (cameraEvidence) {
  expect(exists(cameraEvidence), `camera evidence must exist: ${cameraEvidence}`);
  if (exists(cameraEvidence)) {
    const evidenceRoot = path.dirname(path.join(root,cameraEvidence));
    const index = JSON.parse(read(cameraEvidence)) as any;
    expect(index.selectedTopology === 'H3' && index.approvedRig === null, 'regenerated camera package must remain immutable candidate evidence');
    expect(index.sourceLayoutFingerprint === EXPECTED_H3_LAYOUT, 'regenerated camera package H3 layout drifted');
    const r1ManifestPath = path.join(evidenceRoot,'R1','manifest.json');
    const r2ManifestPath = path.join(evidenceRoot,'R2','manifest.json');
    expect(fs.existsSync(r1ManifestPath) && fs.existsSync(r2ManifestPath), 'regenerated R1/R2 manifests must exist');
    if (fs.existsSync(r1ManifestPath)) {
      const r1Manifest = JSON.parse(fs.readFileSync(r1ManifestPath,'utf8')) as any;
      expect(r1Manifest.source?.layoutFingerprint === EXPECTED_H3_LAYOUT, 'R1 regenerated topology drifted');
      expect(r1Manifest.source?.geometryFingerprintBefore === EXPECTED_H3_GEOMETRY && r1Manifest.source?.geometryFingerprintAfter === EXPECTED_H3_GEOMETRY, 'R1 regenerated geometry fingerprint drifted');
      expect(r1Manifest.cameraWitnesses?.pushkinViewing?.visible === true && r1Manifest.cameraWitnesses?.pushkinViewing?.hitObject === 'EXHIBIT_alexander-pushkin', 'approved R1 must still see Pushkin first');
    }
    if (fs.existsSync(r2ManifestPath)) {
      const r2Manifest = JSON.parse(fs.readFileSync(r2ManifestPath,'utf8')) as any;
      expect(r2Manifest.cameraWitnesses?.pushkinViewing?.visible === false && r2Manifest.cameraWitnesses?.pushkinViewing?.hitObject === 'HUMAN_PROXY', 'R2 rejection witness must still reproduce');
    }
  }
}

if (failures.length) {
  console.error('Hall post-camera authority validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Hall post-camera authority passed in phase ${contract.phase}: H3/R1 are frozen and material/light/export is the only active next gate.`);
