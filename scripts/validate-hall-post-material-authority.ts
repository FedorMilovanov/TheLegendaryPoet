import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative: string) => fs.existsSync(path.join(root, relative));
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const close = (left: unknown, right: unknown, tolerance: number) => Math.abs(Number(left) - Number(right)) <= tolerance;
const sha256 = (absolute: string) => crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
const gitBlobSha = (relative: string) => {
  const bytes = fs.readFileSync(path.join(root, relative));
  const header = Buffer.from(`blob ${bytes.length}\0`, 'utf8');
  return crypto.createHash('sha1').update(Buffer.concat([header, bytes])).digest('hex');
};

const contractPath = 'docs/hall-v3/hall-v3-contract.json';
const promotionPath = 'docs/hall-v3/material-gate-promotion.json';
const decisionPath = 'docs/hall-v3/material-decision.json';
const spikePath = 'docs/hall-v3/material-spike.json';
const cameraDecisionPath = 'docs/hall-v3/camera-decision.json';
const visualPreparerPath = 'scripts/hall-material/prepare-material-visual-evidence.py';
const browserWitnessPath = 'scripts/hall-material/browser-witness.mjs';
const visualValidatorPath = 'scripts/hall-material/validate-visual-evidence.mjs';
const decisionValidatorPath = 'scripts/validate-hall-material-decision.ts';
const validatorPath = 'scripts/validate-hall-post-material-authority.ts';

const contract = JSON.parse(read(contractPath)) as any;
const promotion = JSON.parse(read(promotionPath)) as any;
const decision = JSON.parse(read(decisionPath)) as any;
const spike = JSON.parse(read(spikePath)) as any;
const cameraDecision = JSON.parse(read(cameraDecisionPath)) as any;
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string,string> };
const ci = read('.github/workflows/ci.yml');
const projectContracts = read('.github/workflows/project-contracts.yml');
const hallWorkflow = read('.github/workflows/hall-greybox-tooling.yml');
const hallPage = read('src/pages/HallPage.tsx');

const EXPECTED_H3_LAYOUT = '5d5d0ddd8b150aa64afb73a2a3d9e00c6005e99fc935a6d4707a49ecd475fe65';
const EXPECTED_H3_GEOMETRY = 'b3de770858a423305db8fcab15b405414e66b3d3de93ab1deaa5b3b35b418777';
const EXPECTED_DECISION_BLOB = '9282a3b75694c7e0198f95a148c5d0bbb52f0b28';
const EXPECTED_SPIKE_BLOB = '21d12804cd4c593a8c26a9074cc96d24506217ee';
const EXPECTED_VISUAL_PREPARER_BLOB = '501a34531b6e41fcfcf495b39d25ebedd9c41f55';
const EXPECTED_BROWSER_WITNESS_BLOB = '2485fea08e565645952f78a9acb6469ad6b256a2';
const EXPECTED_VISUAL_VALIDATOR_BLOB = '34321eef5a1d3a2beb20a5e54c0fd361711f0608';
const EXPECTED_DECISION_VALIDATOR_BLOB = '7ef66459c2bc1a7cf59375d6b32791e83de96861';
const EXPECTED_PROMOTED_GATES = {
  foundation: 'completed',
  referenceBible: 'completed',
  metricGreybox: 'completed',
  cameraApproval: 'completed',
  materialLightingExportSpike: 'completed',
  pushkinVerticalSlice: 'active',
  offlineVisualApproval: 'blocked',
  webVerticalSlice: 'blocked',
  fullMuseumScaleOut: 'blocked',
};
const LATER_PHASES = ['pushkinVerticalSlice','offlineVisualApproval','webVerticalSlice','fullMuseumScaleOut'];
const PRE_WEB_PHASES = ['pushkinVerticalSlice','offlineVisualApproval'];
const R1 = {
  position: [8.0, 2.5, 1.6],
  target: [11.15, 5.45, 1.95],
  lensMm: 28,
};

expect(contract.schemaVersion === 1 && contract.laneId === 'TLP-HALL-001' && contract.productIssue === 369, 'Hall contract identity must remain exact after material promotion');
expect(LATER_PHASES.includes(contract.phase), `post-material authority does not recognize phase ${contract.phase ?? '<missing>'}`);
for (const gate of ['foundation','referenceBible','metricGreybox','cameraApproval','materialLightingExportSpike']) {
  expect(contract.gates?.[gate] === 'completed', `${gate} must remain completed after material promotion`);
}
if (contract.phase === 'pushkinVerticalSlice') {
  expect(same(contract.gates, EXPECTED_PROMOTED_GATES), 'Pushkin phase must equal the exact material-promotion gate snapshot');
}
if (PRE_WEB_PHASES.includes(contract.phase)) {
  expect(contract.productionRoute?.mode === 'placeholder', '/hall must remain a placeholder through offline Pushkin work');
  expect(contract.productionRoute?.allowThreeRuntimeImports === false, 'offline Pushkin work must not activate production Three/R3F/WebGL');
}
expect(contract.productionRoute?.allowLegacyHallImports === false, 'post-material work must not reactivate Hall v2');
expect(contract.productionRoute?.allowUnapprovedConceptArt === false, 'post-material work must not publish unapproved Hall art');
expect(contract.sourceAuthority?.materialSpike === spikePath, 'material spike evidence authority must remain registered');
expect(contract.sourceAuthority?.materialDecision === decisionPath, 'material decision authority must remain registered');
expect(contract.sourceAuthority?.materialGatePromotion === promotionPath, 'material gate promotion authority must be registered separately');

expect(promotion.schemaVersion === 1 && promotion.laneId === 'TLP-HALL-001' && promotion.productIssue === 369, 'material promotion identity must remain exact');
expect(promotion.promotion === 'materialLightingExportSpike-to-pushkinVerticalSlice', 'promotion must describe only material-to-Pushkin transition');
expect(promotion.status === 'active-next-gate', 'promotion must activate exactly the next gate');
expect(promotion.phaseTransition?.from === 'materialLightingExportSpike' && promotion.phaseTransition?.to === 'pushkinVerticalSlice', 'material promotion transition must be exact');
expect(same(promotion.gatesAfterPromotion, EXPECTED_PROMOTED_GATES), 'promotion must freeze the exact immediate gate snapshot');
if (contract.phase === 'pushkinVerticalSlice') expect(same(promotion.gatesAfterPromotion, contract.gates), 'immediate promoted contract gates must equal promotion snapshot');

expect(promotion.sourceDecision?.productPr === 389, 'promotion must cite Product decision PR #389');
expect(promotion.sourceDecision?.exactTestedHead === '6a843479987b1022da562f342bbe9e61ff1214fc', 'promotion must cite final exact decision head');
expect(promotion.sourceDecision?.resultingMain === '022c25b84aa3e4228fff3fbff6f4cef11e2d36c7', 'promotion must cite resulting decision main');
expect(promotion.sourceDecision?.materialDecision === decisionPath && promotion.sourceDecision?.materialDecisionBlob === EXPECTED_DECISION_BLOB, 'promotion must pin merged material decision blob');
expect(promotion.sourceDecision?.materialSpike === spikePath && promotion.sourceDecision?.materialSpikeBlob === EXPECTED_SPIKE_BLOB, 'promotion must pin merged material spike blob');
expect(promotion.sourceDecision?.selectedTopology === 'H3' && promotion.sourceDecision?.selectedRig === 'R1', 'promotion may advance only frozen H3/R1');
expect(promotion.sourceDecision?.selectedLighting === 'L0-minimal-runtime', 'promotion may advance only selected L0 baseline');
expect(promotion.sourceDecision?.rejectedCurrentBake === 'L1-external-lightmap', 'promotion must preserve current L1 rejection');
expect(promotion.sourceDecision?.surfaceUv === 'UV0' && promotion.sourceDecision?.reservedStaticBakeUv === 'UV1', 'promotion must preserve UV0 surface and UV1 reserve');
expect(promotion.sourceDecision?.productionTextureEncoding === 'deferred-to-pushkin-vertical-slice', 'promotion may not invent production texture encoding');
expect(promotion.sourceDecision?.selectedLayoutFingerprint === EXPECTED_H3_LAYOUT && promotion.sourceDecision?.meshGeometryFingerprint === EXPECTED_H3_GEOMETRY, 'promotion must preserve H3 fingerprints');

expect(gitBlobSha(spikePath) === EXPECTED_SPIKE_BLOB, 'material spike candidate/evidence source drifted after decision');
expect(gitBlobSha(decisionPath) === EXPECTED_DECISION_BLOB, 'material decision authority drifted before/after promotion');
expect(gitBlobSha(visualPreparerPath) === EXPECTED_VISUAL_PREPARER_BLOB, 'accepted material visual preparer drifted');
expect(gitBlobSha(browserWitnessPath) === EXPECTED_BROWSER_WITNESS_BLOB, 'accepted material browser witness drifted');
expect(gitBlobSha(visualValidatorPath) === EXPECTED_VISUAL_VALIDATOR_BLOB, 'accepted visual-evidence validator drifted');
expect(gitBlobSha(decisionValidatorPath) === EXPECTED_DECISION_VALIDATOR_BLOB, 'merged material-decision validator drifted after promotion');
for (const [key, expected] of Object.entries({
  materialSpikeBlob: EXPECTED_SPIKE_BLOB,
  materialDecisionBlob: EXPECTED_DECISION_BLOB,
  visualPreparerBlob: EXPECTED_VISUAL_PREPARER_BLOB,
  browserWitnessBlob: EXPECTED_BROWSER_WITNESS_BLOB,
  visualEvidenceValidatorBlob: EXPECTED_VISUAL_VALIDATOR_BLOB,
  materialDecisionValidatorBlob: EXPECTED_DECISION_VALIDATOR_BLOB,
})) expect(promotion.frozenAuthorities?.[key] === expected, `promotion must pin ${key}`);

expect(decision.phase === 'materialLightingExportSpike' && decision.status === 'selected', 'material decision remains historical Gate-4 selection authority');
expect(decision.lightingDecision?.selected === 'L0-minimal-runtime', 'material decision must retain L0 selection');
const rejectedL1 = (decision.lightingDecision?.rejected ?? []).find((entry: any) => entry.id === 'L1-external-lightmap');
expect(rejectedL1?.disposition === 'reject-current-bake', 'material decision must retain rejected current L1 bake');
expect(rejectedL1?.incrementalLightmapResidentBytes === 393216, 'L1 delta must remain explicitly GPU lightmap residency');
expect(decision.uvDecision?.surfaceMaterialUv === 'UV0' && decision.uvDecision?.staticBakeUv === 'UV1' && decision.uvDecision?.mandatoryLightmap === false, 'material decision must preserve UV0 surface / optional UV1 reserve');
expect(decision.texturePolicyDecision?.productionTextureEncoding === 'deferred-to-pushkin-vertical-slice' && decision.texturePolicyDecision?.ktx2 === 'deferred-not-default', 'production texture encoding/KTX2 must remain deferred');
expect(decision.texturePolicyDecision?.qaProofMaps?.productionAssets === false, 'QA proof maps must remain non-production evidence');
expect(decision.frozenAfterDecision?.topology === 'H3' && decision.frozenAfterDecision?.approvedRig === 'R1', 'material decision must freeze H3/R1');
expect(decision.frozenAfterDecision?.currentL1BakeMayBeReusedAsApproved === false, 'rejected L1 bake may not silently become approved');
expect(decision.gateBoundary?.decisionTransactionMayPromoteGate === false && decision.gateBoundary?.gatePromotionMayProceed === true, 'decision/promotion separation must remain explicit');

expect(spike.status === 'authoring' && spike.source?.topology === 'H3' && spike.source?.approvedRig === 'R1', 'material spike must remain immutable H3/R1 candidate evidence');
for (const value of Object.values(spike.decision ?? {})) expect(value === null || value === false, 'material spike candidate evidence must not be rewritten by promotion');
expect(spike.source?.layoutFingerprint === EXPECTED_H3_LAYOUT && spike.source?.meshGeometryFingerprint === EXPECTED_H3_GEOMETRY, 'material spike H3 fingerprints must remain exact');
expect(spike.approvedCameraWitness?.lensMm === R1.lensMm && same(spike.approvedCameraWitness?.position, R1.position) && same(spike.approvedCameraWitness?.target, R1.target), 'material spike must preserve exact R1 witness');
expect(cameraDecision.selectedTopology === 'H3' && cameraDecision.selectedRig === 'R1', 'camera authority must remain H3/R1 after material promotion');
expect(cameraDecision.approvedCamera?.lensMm === R1.lensMm && same(cameraDecision.approvedCamera?.position, R1.position) && same(cameraDecision.approvedCamera?.target, R1.target), 'camera decision R1 coordinates/lens must remain exact');

expect(promotion.selectedDelivery?.lighting?.id === 'L0-minimal-runtime' && promotion.selectedDelivery?.lighting?.externalLightmapRequired === false && promotion.selectedDelivery?.lighting?.realtimeShadowLights === 0, 'promotion must activate only selected L0 baseline');
expect(promotion.selectedDelivery?.currentL1?.id === 'L1-external-lightmap' && promotion.selectedDelivery?.currentL1?.disposition === 'reject-current-bake' && promotion.selectedDelivery?.currentL1?.mayShip === false, 'promotion must preserve rejected current L1 bake');
expect(promotion.selectedDelivery?.currentL1?.incrementalLightmapResidentBytes === 393216, 'promotion must preserve measured L1 GPU lightmap residency');
expect(promotion.selectedDelivery?.uv?.surfaceMaterial === 'UV0' && promotion.selectedDelivery?.uv?.staticBakeReserve === 'UV1' && promotion.selectedDelivery?.uv?.staticBakeMandatory === false, 'promotion must preserve UV0/optional UV1 strategy');
expect(promotion.selectedDelivery?.uv?.surfaceScaleMetersPerUvUnit === 1.5, 'promotion must preserve accepted 1.5 m/UV surface scale');
expect(promotion.selectedDelivery?.optimizer?.package === 'gltfpack' && promotion.selectedDelivery?.optimizer?.version === '1.2.0', 'promotion must preserve gltfpack 1.2.0');
expect(same(promotion.selectedDelivery?.optimizer?.args, ['-cc','-kn','-km','-ke','-kv','-vpf']) && promotion.selectedDelivery?.optimizer?.khronosBeforeAndAfter === true, 'promotion must preserve optimizer flags and Khronos-before/after contract');
expect(promotion.selectedDelivery?.texturePolicy?.qaProofMapsAreProductionAssets === false && promotion.selectedDelivery?.texturePolicy?.productionTextureEncoding === 'deferred-to-pushkin-vertical-slice' && promotion.selectedDelivery?.texturePolicy?.ktx2 === 'deferred-not-default', 'promotion must preserve honest texture-delivery boundary');

expect(promotion.productionBoundary?.hallRouteRemainsPlaceholder === true, 'promotion transaction must keep /hall placeholder');
expect(promotion.productionBoundary?.legacyHallMayReactivate === false && promotion.productionBoundary?.threeRuntimeMayActivate === false, 'promotion transaction must not activate legacy/Three runtime');
for (const key of ['thisPromotionAddsPushkinAssets','thisPromotionAddsProductionTextures','thisPromotionAddsRuntimeAssets','thisPromotionChangesGeometry','thisPromotionChangesCamera']) expect(promotion.productionBoundary?.[key] === false, `${key} must remain false`);
expect(promotion.rightsBoundary?.documentaryHeroAssetsRequireApprovedRightsRecord === true, 'Pushkin documentary hero assets must require approved rights records');
expect(promotion.rightsBoundary?.pendingRightsMayEnterProductionManifest === false, 'pending-rights assets may not enter production Hall manifest');
expect(promotion.rightsBoundary?.aiMaySubstituteForMissingDocumentaryRights === false, 'AI may not substitute for missing documentary rights');
for (const required of ['pushkin-rights-and-provenance-register','one-complete-pushkin-exhibit-offline','rights-cleared-portrait-and-documentary-media','production-texture-encoding-comparison','fixed-still-and-offline-camera-evidence','raw-to-optimized-pushkin-asset-validation','first-slice-performance-budget-calibration']) expect((promotion.nextGateScope?.allowed ?? []).includes(required), `Pushkin next-gate scope must allow ${required}`);
for (const forbidden of ['full-hall-lookdev','h3-topology-redesign','current-l1-bake-as-approved','rights-uncleared-documentary-media','ai-generated-historical-facsimile-or-signature','production-three-r3f-webgl-hall','offlineVisualApproval-promotion','webVerticalSlice-promotion','fullMuseumScaleOut-promotion']) expect((promotion.nextGateScope?.forbidden ?? []).includes(forbidden), `Pushkin next-gate scope must forbid ${forbidden}`);

const scripts = packageJson.scripts ?? {};
expect(scripts['validate:hall-post-material-authority'] === `tsx ${validatorPath}`, 'package scripts must expose post-material authority validator');
expect((scripts.check ?? '').includes('validate:hall-post-material-authority'), 'normal check must run post-material authority validator');
expect((scripts.check ?? '').includes('validate:hall-topology-provenance'), 'normal check must retain frozen topology provenance');
expect((scripts.check ?? '').includes('validate:hall-material-transport'), 'normal check must retain phase-independent material transport guard');
for (const retiredCurrent of ['validate:hall-post-camera-authority','validate:hall-material-spike','validate:hall-material-visual-evidence','validate:hall-material-decision']) expect(!(scripts.check ?? '').includes(retiredCurrent), `normal current-phase check must retire ${retiredCurrent} after material gate completion`);
expect(ci.includes('npm run validate:hall-post-material-authority'), 'primary CI must run post-material authority validator');
expect(projectContracts.includes('npm run validate:hall-post-material-authority'), 'Project Contracts must run post-material authority validator');
expect(hallWorkflow.includes('npm run validate:hall-post-material-authority'), 'Hall DCC workflow must run post-material authority validator');
expect(hallWorkflow.includes('npm run validate:hall-material-transport'), 'Hall DCC workflow must retain phase-independent material transport evidence guard');
for (const retiredRun of ['npm run validate:hall-post-camera-authority','npm run validate:hall-material-spike','npm run validate:hall-material-visual-evidence','npm run validate:hall-material-decision']) expect(!hallWorkflow.includes(retiredRun), `Hall current-phase workflow must retire old mandatory run: ${retiredRun}`);
expect(hallWorkflow.includes("'docs/hall-v3/material-gate-promotion.json'") && hallWorkflow.includes(`'${validatorPath}'`), 'Hall DCC workflow must trigger on material promotion authority changes');
expect(hallWorkflow.includes('npm run validate:hall-topology-provenance'), 'Hall workflow must retain topology provenance');
expect(!hallPage.includes('material-gate-promotion') && !hallPage.includes('material-decision') && !hallPage.includes('material-spike'), 'production HallPage must not load Hall governance/evidence authority');

const toolingEvidence = process.env.HALL_GREYBOX_TOOLING_EVIDENCE;
if (toolingEvidence) {
  expect(exists(toolingEvidence), `tooling evidence must exist: ${toolingEvidence}`);
  if (exists(toolingEvidence)) {
    const evidence = JSON.parse(read(toolingEvidence)) as any;
    expect(same(evidence.runtime?.versionTuple, [4,5,12]) && evidence.runtime?.background === true, 'tooling evidence must remain Blender 4.5.12 headless');
    expect(evidence.scene?.unitSystem === 'METRIC' && evidence.scene?.scaleLength === 1, 'tooling evidence must remain metre-scale');
  }
}

const candidateEvidence = process.env.HALL_GREYBOX_CANDIDATE_EVIDENCE;
if (candidateEvidence) {
  expect(exists(candidateEvidence), `greybox evidence must exist: ${candidateEvidence}`);
  if (exists(candidateEvidence)) {
    const evidenceRoot = path.dirname(path.join(root, candidateEvidence));
    const index = JSON.parse(read(candidateEvidence)) as any;
    expect(index.approvedCandidate === null && same(index.candidateOrder, ['H1','H2','H3']), 'regenerated greybox package must remain neutral H1/H2/H3 evidence');
    const h3Path = path.join(evidenceRoot, 'H3', 'manifest.json');
    expect(fs.existsSync(h3Path), 'regenerated H3 manifest must exist');
    if (fs.existsSync(h3Path)) {
      const h3 = JSON.parse(fs.readFileSync(h3Path, 'utf8')) as any;
      expect(h3.layoutFingerprint === EXPECTED_H3_LAYOUT, 'regenerated H3 layout fingerprint drifted');
      expect(h3.scene?.materials === 0 && h3.scene?.lights === 0, 'regenerated frozen H3 must remain neutral before representative material derivation');
    }
  }
}

const cameraEvidence = process.env.HALL_CAMERA_APPROVAL_EVIDENCE;
if (cameraEvidence) {
  expect(exists(cameraEvidence), `camera evidence must exist: ${cameraEvidence}`);
  if (exists(cameraEvidence)) {
    const evidenceRoot = path.dirname(path.join(root, cameraEvidence));
    const index = JSON.parse(read(cameraEvidence)) as any;
    expect(index.selectedTopology === 'H3' && index.approvedRig === null, 'regenerated camera package must remain immutable candidate evidence');
    expect(index.sourceLayoutFingerprint === EXPECTED_H3_LAYOUT, 'regenerated camera package H3 layout drifted');
    const r1Path = path.join(evidenceRoot, 'R1', 'manifest.json');
    expect(fs.existsSync(r1Path), 'regenerated R1 manifest must exist');
    if (fs.existsSync(r1Path)) {
      const r1 = JSON.parse(fs.readFileSync(r1Path, 'utf8')) as any;
      expect(r1.source?.layoutFingerprint === EXPECTED_H3_LAYOUT, 'regenerated R1 topology drifted');
      expect(r1.source?.geometryFingerprintBefore === EXPECTED_H3_GEOMETRY && r1.source?.geometryFingerprintAfter === EXPECTED_H3_GEOMETRY, 'regenerated R1 geometry fingerprint drifted');
      expect(r1.cameraWitnesses?.pushkinViewing?.visible === true && r1.cameraWitnesses?.pushkinViewing?.hitObject === 'EXHIBIT_alexander-pushkin', 'regenerated approved R1 must still see Pushkin first');
    }
  }
}

const materialEvidenceDirRelative = process.env.HALL_MATERIAL_SPIKE_EVIDENCE;
if (materialEvidenceDirRelative) {
  const evidenceDir = path.join(root, materialEvidenceDirRelative);
  const sourcePath = path.join(evidenceDir, 'source-evidence.json');
  const lookdevPath = path.join(evidenceDir, 'visual-lookdev-evidence.json');
  const rawPath = path.join(evidenceDir, 'material-spike-raw.glb');
  const optimizedPath = path.join(evidenceDir, 'material-spike-optimized.glb');
  const rawReportPath = path.join(evidenceDir, 'gltf-raw-report.json');
  const optimizedReportPath = path.join(evidenceDir, 'gltf-optimized-report.json');
  for (const file of [sourcePath,lookdevPath,rawPath,optimizedPath,rawReportPath,optimizedReportPath]) expect(fs.existsSync(file), `post-material evidence missing ${path.basename(file)}`);
  if (fs.existsSync(sourcePath)) {
    const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8')) as any;
    expect(source.source?.candidateId === 'H3' && source.source?.layoutFingerprint === EXPECTED_H3_LAYOUT && source.source?.meshGeometryFingerprintBeforeSpike === EXPECTED_H3_GEOMETRY, 'generated material evidence must derive from frozen H3');
    expect(source.camera?.name === 'CAM_R1_pushkinViewing' && source.camera?.lensMm === 28 && same(source.camera?.position, R1.position), 'generated material evidence must preserve frozen R1');
    expect(source.material?.baseColorColorSpace === 'sRGB' && source.material?.normalColorSpace === 'Non-Color' && source.material?.roughnessColorSpace === 'Non-Color' && source.material?.lightmapRuntimeColorSpace === 'LinearSRGBColorSpace', 'generated material color/data ownership must remain exact');
    expect(source.material?.proofTextureResolution === 256 && source.material?.proofTexturePeriodic === true && source.material?.proofTextureRasterSampling === 'texel-centers-periodic', 'generated proof texture evidence must retain accepted periodic 256px QA contract');
    expect(source.material?.surfaceUvCubeSizeMeters === 1.5 && source.material?.lookdevBevelMeters === 0.015 && source.material?.lookdevBevelSegments === 3, 'generated visual material evidence must retain accepted UV scale and QA bevel');
    expect(source.productionAsset === false && source.documentaryAsset === false, 'representative material evidence must remain non-production/non-documentary');
    const rawIdentity = source.files?.rawGlb;
    expect(rawIdentity?.bytes === decision.evidence?.rawGlb?.bytes && rawIdentity?.sha256 === decision.evidence?.rawGlb?.sha256, 'regenerated final raw GLB must exactly reproduce accepted decision identity');
  }
  if (fs.existsSync(lookdevPath)) {
    const lookdev = JSON.parse(fs.readFileSync(lookdevPath, 'utf8')) as any;
    expect(lookdev.status === 'repeat-spike-visual-evidence' && lookdev.sourceTopology === 'H3' && lookdev.approvedRig === 'R1', 'regenerated lookdev evidence must remain H3/R1');
    expect(lookdev.r1MatrixUnchanged === true && lookdev.productionAsset === false && lookdev.decisionMayAdvance === false, 'regenerated lookdev evidence must not mutate R1 or become production/decision authority');
  }
  if (fs.existsSync(rawPath)) {
    expect(fs.statSync(rawPath).size === decision.evidence?.rawGlb?.bytes && sha256(rawPath) === decision.evidence?.rawGlb?.sha256, 'regenerated raw GLB bytes/SHA must equal accepted decision evidence');
  }
  if (fs.existsSync(optimizedPath)) {
    expect(fs.statSync(optimizedPath).size === decision.evidence?.optimizedGlb?.bytes && sha256(optimizedPath) === decision.evidence?.optimizedGlb?.sha256, 'regenerated optimized GLB bytes/SHA must equal accepted decision evidence');
  }
  for (const [label, reportPath] of [['raw',rawReportPath],['optimized',optimizedReportPath]] as const) {
    if (!fs.existsSync(reportPath)) continue;
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as any;
    expect(Number(report.issues?.numErrors ?? -1) === 0 && Number(report.issues?.numWarnings ?? -1) === 0, `${label} Khronos evidence must remain 0 errors / 0 warnings`);
    if (label === 'raw') expect(report._hallSourceEvidenceIdentity?.matches === true, 'raw Khronos report must preserve final source-evidence identity match');
  }
}

const browserEvidenceRelative = process.env.HALL_MATERIAL_BROWSER_EVIDENCE;
if (browserEvidenceRelative) {
  expect(exists(browserEvidenceRelative), `material browser evidence must exist: ${browserEvidenceRelative}`);
  if (exists(browserEvidenceRelative)) {
    const browser = JSON.parse(read(browserEvidenceRelative)) as any;
    const l0 = browser.candidateReadability?.['L0-minimal-runtime'];
    const l1 = browser.candidateReadability?.['L1-external-lightmap'];
    expect(l0?.automaticDisposition === 'eligible-for-human-review', 'regenerated L0 must remain reviewable under selected baseline');
    expect(l1?.automaticDisposition === 'reject-current-bake', 'regenerated current L1 must remain rejected');
    expect(close(l0?.meanDisplayLuma, decision.lightingDecision?.selectedEvidence?.meanDisplayLuma, 0.005), 'regenerated L0 mean luma drifted materially from accepted decision evidence');
    expect(close(l0?.darkSampleRatio, decision.lightingDecision?.selectedEvidence?.darkSampleRatioBelow0_08, 0.02), 'regenerated L0 dark ratio drifted materially from accepted decision evidence');
    expect(close(l1?.meanDisplayLuma, rejectedL1?.meanDisplayLuma, 0.005), 'regenerated L1 mean luma drifted materially from accepted rejected-bake evidence');
    expect(close(l1?.darkSampleRatio, rejectedL1?.darkSampleRatioBelow0_08, 0.02), 'regenerated L1 dark ratio drifted materially from accepted rejected-bake evidence');
    const gpu = browser.gpuMemoryComparison ?? {};
    expect(Number(gpu.l0EstimatedResidentBytes) === decision.lightingDecision?.selectedEvidence?.gpuTextureResidentBytes, 'regenerated L0 GPU residency must match accepted decision evidence');
    expect(Number(gpu.l1EstimatedResidentBytes) === rejectedL1?.gpuTextureResidentBytes, 'regenerated L1 GPU residency must match accepted decision evidence');
    expect(Number(gpu.incrementalEstimatedResidentBytes) === rejectedL1?.incrementalLightmapResidentBytes, 'regenerated L1 incremental GPU lightmap residency must match decision');
    const visual = browser.optimizationVisualEquivalence ?? {};
    expect(Number(visual.meanAbsoluteChannelDifference) <= Number(spike.browserWitness?.optimizationVisualEquivalence?.maximumMeanAbsoluteChannelDifference), 'regenerated raw/optimized mean visual delta exceeds accepted transport threshold');
    expect(Number(visual.maximumChannelDifference) <= Number(spike.browserWitness?.optimizationVisualEquivalence?.maximumChannelDifference), 'regenerated raw/optimized max visual delta exceeds accepted transport threshold');
    expect(Number(visual.changedSampleRatioAbove2) <= Number(spike.browserWitness?.optimizationVisualEquivalence?.maximumChangedSampleRatioAbove2), 'regenerated raw/optimized changed-sample ratio exceeds accepted transport threshold');
    const normal = browser.visualEvidence?.materialResponses?.normal;
    const roughness = browser.visualEvidence?.materialResponses?.roughness;
    expect(Number(normal?.meanAbsoluteChannelDifference) >= Number(spike.visualEvidence?.normalResponse?.minimumMeanAbsoluteChannelDifference) && Number(normal?.changedSampleRatioAbove2) >= Number(spike.visualEvidence?.normalResponse?.minimumChangedSampleRatioAbove2), 'regenerated close normal response must remain visibly measurable');
    expect(Number(roughness?.meanAbsoluteChannelDifference) >= Number(spike.visualEvidence?.roughnessResponse?.minimumMeanAbsoluteChannelDifference) && Number(roughness?.changedSampleRatioAbove2) >= Number(spike.visualEvidence?.roughnessResponse?.minimumChangedSampleRatioAbove2), 'regenerated medium roughness response must remain visibly measurable');
  }
}

if (failures.length) {
  console.error('Hall post-material authority validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Hall post-material authority passed in phase ${contract.phase}: H3/R1/L0 are frozen; current L1 remains rejected; Pushkin is the only active next gate.`);
