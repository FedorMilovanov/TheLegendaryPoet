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
const sha256Bytes = (bytes: Buffer) => crypto.createHash('sha256').update(bytes).digest('hex');
const sha256File = (absolute: string) => sha256Bytes(fs.readFileSync(absolute));
const gitBlobSha = (relative: string) => {
  const bytes = fs.readFileSync(path.join(root, relative));
  return crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`, 'utf8'), bytes])).digest('hex');
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

const H3_LAYOUT = '5d5d0ddd8b150aa64afb73a2a3d9e00c6005e99fc935a6d4707a49ecd475fe65';
const H3_GEOMETRY = 'b3de770858a423305db8fcab15b405414e66b3d3de93ab1deaa5b3b35b418777';
const DECISION_BLOB = '9282a3b75694c7e0198f95a148c5d0bbb52f0b28';
const SPIKE_BLOB = '21d12804cd4c593a8c26a9074cc96d24506217ee';
const VISUAL_PREPARER_BLOB = '501a34531b6e41fcfcf495b39d25ebedd9c41f55';
const BROWSER_WITNESS_BLOB = '2485fea08e565645952f78a9acb6469ad6b256a2';
const VISUAL_VALIDATOR_BLOB = '34321eef5a1d3a2beb20a5e54c0fd361711f0608';
const DECISION_VALIDATOR_BLOB = '7ef66459c2bc1a7cf59375d6b32791e83de96861';
const PROMOTED_GATES = {
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
const R1 = { position: [8.0,2.5,1.6], target: [11.15,5.45,1.95], lensMm: 28 };

function parseGlbJson(absolute: string) {
  const bytes = fs.readFileSync(absolute);
  expect(bytes.length >= 20 && bytes.toString('ascii', 0, 4) === 'glTF', `${path.basename(absolute)} must be a valid GLB container`);
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const length = bytes.readUInt32LE(offset);
    const type = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + length;
    if (end > bytes.length) break;
    if (type === 0x4e4f534a) {
      const jsonBytes = bytes.subarray(start, end);
      return { jsonBytes, json: JSON.parse(jsonBytes.toString('utf8').replace(/\u0000+$/g, '').trim()) };
    }
    offset = end;
  }
  throw new Error(`${path.basename(absolute)} is missing a JSON chunk`);
}

function sortedValue(value: any): any {
  if (Array.isArray(value)) return value.map(sortedValue);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortedValue(value[key])]));
  return value;
}

function normalizedOptimizedJsonSha(absolute: string) {
  const parsed = parseGlbJson(absolute).json;
  for (const view of parsed.bufferViews ?? []) {
    const meshopt = view?.extensions?.EXT_meshopt_compression;
    if (meshopt) {
      delete meshopt.byteOffset;
      delete meshopt.byteLength;
    }
  }
  return sha256Bytes(Buffer.from(JSON.stringify(sortedValue(parsed)), 'utf8'));
}

// Current machine phase and production boundary.
expect(contract.schemaVersion === 1 && contract.laneId === 'TLP-HALL-001' && contract.productIssue === 369, 'Hall contract identity must remain exact after material promotion');
expect(LATER_PHASES.includes(contract.phase), `post-material authority does not recognize phase ${contract.phase ?? '<missing>'}`);
for (const gate of ['foundation','referenceBible','metricGreybox','cameraApproval','materialLightingExportSpike']) expect(contract.gates?.[gate] === 'completed', `${gate} must remain completed after material promotion`);
if (contract.phase === 'pushkinVerticalSlice') expect(same(contract.gates, PROMOTED_GATES), 'Pushkin phase must equal the exact material-promotion gate snapshot');
if (PRE_WEB_PHASES.includes(contract.phase)) {
  expect(contract.productionRoute?.mode === 'placeholder', '/hall must remain a placeholder through offline Pushkin work');
  expect(contract.productionRoute?.allowThreeRuntimeImports === false, 'offline Pushkin work must not activate production Three/R3F/WebGL');
}
expect(contract.productionRoute?.allowLegacyHallImports === false, 'post-material work must not reactivate Hall v2');
expect(contract.productionRoute?.allowUnapprovedConceptArt === false, 'post-material work must not publish unapproved Hall art');
expect(contract.sourceAuthority?.materialSpike === spikePath, 'material spike evidence authority must remain registered');
expect(contract.sourceAuthority?.materialDecision === decisionPath, 'material decision authority must remain registered');
expect(contract.sourceAuthority?.materialGatePromotion === promotionPath, 'material gate promotion authority must be registered separately');

// Promotion identity and immutable historical authority.
expect(promotion.schemaVersion === 1 && promotion.laneId === 'TLP-HALL-001' && promotion.productIssue === 369, 'material promotion identity must remain exact');
expect(promotion.promotion === 'materialLightingExportSpike-to-pushkinVerticalSlice' && promotion.status === 'active-next-gate', 'promotion must activate exactly material-to-Pushkin next gate');
expect(promotion.phaseTransition?.from === 'materialLightingExportSpike' && promotion.phaseTransition?.to === 'pushkinVerticalSlice', 'material promotion transition must be exact');
expect(same(promotion.gatesAfterPromotion, PROMOTED_GATES), 'promotion must freeze the exact immediate gate snapshot');
if (contract.phase === 'pushkinVerticalSlice') expect(same(promotion.gatesAfterPromotion, contract.gates), 'immediate promoted contract gates must equal promotion snapshot');
expect(promotion.sourceDecision?.productPr === 389 && promotion.sourceDecision?.exactTestedHead === '6a843479987b1022da562f342bbe9e61ff1214fc' && promotion.sourceDecision?.resultingMain === '022c25b84aa3e4228fff3fbff6f4cef11e2d36c7', 'promotion must cite final Product #389 decision transaction');
expect(promotion.sourceDecision?.materialDecision === decisionPath && promotion.sourceDecision?.materialDecisionBlob === DECISION_BLOB, 'promotion must pin merged material decision blob');
expect(promotion.sourceDecision?.materialSpike === spikePath && promotion.sourceDecision?.materialSpikeBlob === SPIKE_BLOB, 'promotion must pin merged material spike blob');
expect(promotion.sourceDecision?.selectedTopology === 'H3' && promotion.sourceDecision?.selectedRig === 'R1' && promotion.sourceDecision?.selectedLighting === 'L0-minimal-runtime', 'promotion may advance only frozen H3/R1/L0');
expect(promotion.sourceDecision?.rejectedCurrentBake === 'L1-external-lightmap', 'promotion must preserve current L1 rejection');
expect(promotion.sourceDecision?.surfaceUv === 'UV0' && promotion.sourceDecision?.reservedStaticBakeUv === 'UV1', 'promotion must preserve UV0 surface and UV1 reserve');
expect(promotion.sourceDecision?.productionTextureEncoding === 'deferred-to-pushkin-vertical-slice', 'promotion may not invent production texture encoding');
expect(promotion.sourceDecision?.selectedLayoutFingerprint === H3_LAYOUT && promotion.sourceDecision?.meshGeometryFingerprint === H3_GEOMETRY, 'promotion must preserve H3 fingerprints');

expect(gitBlobSha(spikePath) === SPIKE_BLOB, 'material spike candidate/evidence source drifted after decision');
expect(gitBlobSha(decisionPath) === DECISION_BLOB, 'material decision authority drifted before/after promotion');
expect(gitBlobSha(visualPreparerPath) === VISUAL_PREPARER_BLOB, 'accepted material visual preparer drifted');
expect(gitBlobSha(browserWitnessPath) === BROWSER_WITNESS_BLOB, 'accepted material browser witness drifted');
expect(gitBlobSha(visualValidatorPath) === VISUAL_VALIDATOR_BLOB, 'accepted visual-evidence validator drifted');
expect(gitBlobSha(decisionValidatorPath) === DECISION_VALIDATOR_BLOB, 'merged material-decision validator drifted after promotion');
for (const [key, expected] of Object.entries({ materialSpikeBlob: SPIKE_BLOB, materialDecisionBlob: DECISION_BLOB, visualPreparerBlob: VISUAL_PREPARER_BLOB, browserWitnessBlob: BROWSER_WITNESS_BLOB, visualEvidenceValidatorBlob: VISUAL_VALIDATOR_BLOB, materialDecisionValidatorBlob: DECISION_VALIDATOR_BLOB })) expect(promotion.frozenAuthorities?.[key] === expected, `promotion must pin ${key}`);

// Historical accepted file identities remain frozen, while repeated Blender export uses honest structural/semantic reproducibility.
expect(promotion.acceptedHistoricalEvidence?.artifactId === 9036351234, 'promotion must preserve accepted historical artifact ID');
expect(promotion.acceptedHistoricalEvidence?.artifactDigest === 'sha256:dc33af96ba747175794f9f31775c534c224a35645d9943302424459e0bf8cc95', 'promotion must preserve accepted historical artifact digest');
expect(promotion.acceptedHistoricalEvidence?.rawGlb?.bytes === decision.evidence?.rawGlb?.bytes && promotion.acceptedHistoricalEvidence?.rawGlb?.sha256 === decision.evidence?.rawGlb?.sha256, 'historical accepted raw GLB identity must remain frozen');
expect(promotion.acceptedHistoricalEvidence?.optimizedGlb?.bytes === decision.evidence?.optimizedGlb?.bytes && promotion.acceptedHistoricalEvidence?.optimizedGlb?.sha256 === decision.evidence?.optimizedGlb?.sha256, 'historical accepted optimized GLB identity must remain frozen');
const reproduction = promotion.reproductionPolicy ?? {};
expect(reproduction.rawGlb?.expectedBytes === 200672 && reproduction.rawGlb?.jsonChunkSha256 === 'd3c9e45692ad883f28bf99466b289992061e277e681f2d45acf34d554e5bd245', 'raw reproof must freeze accepted byte length and JSON structure');
expect(reproduction.rawGlb?.fullFileShaMustRepeat === false && reproduction.rawGlb?.sourceEvidenceMustSelfMatch === true, 'raw reproof must model self-identity without unsupported full-file determinism');
expect(reproduction.optimizedGlb?.expectedBytes === 141896 && reproduction.optimizedGlb?.normalizedJsonSha256 === '68c35010c312adfdeb771b315abacc70248402b528476bee4e08658dbb13cafa', 'optimized reproof must freeze accepted size and normalized structural schema');
expect(reproduction.optimizedGlb?.meshoptCompressionOffsetsAndLengthsExcludedFromSchemaHash === true && reproduction.optimizedGlb?.fullFileShaMustRepeat === false, 'optimized reproof must isolate meshopt byte-stream variability instead of pretending bit identity');
expect(reproduction.diagnosticReproof?.workflowRunId === 31317379985 && reproduction.diagnosticReproof?.artifactId === 9039153673, 'promotion must retain the diagnostic reproof that disproved raw bit determinism');
expect(reproduction.diagnosticReproof?.rawJsonChunkMatchedAccepted === true && reproduction.diagnosticReproof?.optimizedNormalizedJsonMatchedAccepted === true && reproduction.diagnosticReproof?.stableGeneratedEvidenceMatchedAccepted === true, 'diagnostic reproof must preserve structural/stable-evidence findings');

// Historical selection decision remains exact.
expect(decision.phase === 'materialLightingExportSpike' && decision.status === 'selected' && decision.lightingDecision?.selected === 'L0-minimal-runtime', 'material decision must retain selected L0 historical authority');
const rejectedL1 = (decision.lightingDecision?.rejected ?? []).find((entry: any) => entry.id === 'L1-external-lightmap');
expect(rejectedL1?.disposition === 'reject-current-bake' && rejectedL1?.incrementalLightmapResidentBytes === 393216, 'material decision must retain rejected current L1 and GPU residency delta');
expect(decision.uvDecision?.surfaceMaterialUv === 'UV0' && decision.uvDecision?.staticBakeUv === 'UV1' && decision.uvDecision?.mandatoryLightmap === false, 'material decision must preserve UV0 surface / optional UV1 reserve');
expect(decision.texturePolicyDecision?.productionTextureEncoding === 'deferred-to-pushkin-vertical-slice' && decision.texturePolicyDecision?.ktx2 === 'deferred-not-default' && decision.texturePolicyDecision?.qaProofMaps?.productionAssets === false, 'production texture encoding/KTX2 must remain deferred and QA maps non-production');
expect(decision.frozenAfterDecision?.topology === 'H3' && decision.frozenAfterDecision?.approvedRig === 'R1' && decision.frozenAfterDecision?.currentL1BakeMayBeReusedAsApproved === false, 'material decision must keep H3/R1 frozen and current L1 rejected');
expect(decision.gateBoundary?.decisionTransactionMayPromoteGate === false && decision.gateBoundary?.gatePromotionMayProceed === true, 'decision/promotion separation must remain explicit');

// Candidate and camera evidence remain immutable.
expect(spike.status === 'authoring' && spike.source?.topology === 'H3' && spike.source?.approvedRig === 'R1', 'material spike must remain immutable H3/R1 candidate evidence');
for (const value of Object.values(spike.decision ?? {})) expect(value === null || value === false, 'material spike candidate evidence must not be rewritten by promotion');
expect(spike.source?.layoutFingerprint === H3_LAYOUT && spike.source?.meshGeometryFingerprint === H3_GEOMETRY, 'material spike H3 fingerprints must remain exact');
expect(spike.approvedCameraWitness?.lensMm === R1.lensMm && same(spike.approvedCameraWitness?.position, R1.position) && same(spike.approvedCameraWitness?.target, R1.target), 'material spike must preserve exact R1 witness');
expect(cameraDecision.selectedTopology === 'H3' && cameraDecision.selectedRig === 'R1', 'camera authority must remain H3/R1 after material promotion');
expect(cameraDecision.approvedCamera?.lensMm === R1.lensMm && same(cameraDecision.approvedCamera?.position, R1.position) && same(cameraDecision.approvedCamera?.target, R1.target), 'camera decision R1 coordinates/lens must remain exact');

// Selected delivery and next-gate bounds.
expect(promotion.selectedDelivery?.lighting?.id === 'L0-minimal-runtime' && promotion.selectedDelivery?.lighting?.externalLightmapRequired === false && promotion.selectedDelivery?.lighting?.realtimeShadowLights === 0, 'promotion must activate only selected L0 baseline');
expect(promotion.selectedDelivery?.currentL1?.id === 'L1-external-lightmap' && promotion.selectedDelivery?.currentL1?.disposition === 'reject-current-bake' && promotion.selectedDelivery?.currentL1?.mayShip === false && promotion.selectedDelivery?.currentL1?.incrementalLightmapResidentBytes === 393216, 'promotion must preserve rejected current L1 and measured GPU residency');
expect(promotion.selectedDelivery?.uv?.surfaceMaterial === 'UV0' && promotion.selectedDelivery?.uv?.surfaceScaleMetersPerUvUnit === 1.5 && promotion.selectedDelivery?.uv?.staticBakeReserve === 'UV1' && promotion.selectedDelivery?.uv?.staticBakeMandatory === false, 'promotion must preserve UV0/optional UV1 strategy');
expect(promotion.selectedDelivery?.optimizer?.package === 'gltfpack' && promotion.selectedDelivery?.optimizer?.version === '1.2.0' && same(promotion.selectedDelivery?.optimizer?.args, ['-cc','-kn','-km','-ke','-kv','-vpf']) && promotion.selectedDelivery?.optimizer?.khronosBeforeAndAfter === true, 'promotion must preserve gltfpack/Khronos transport decision');
expect(promotion.selectedDelivery?.texturePolicy?.qaProofMapsAreProductionAssets === false && promotion.selectedDelivery?.texturePolicy?.productionTextureEncoding === 'deferred-to-pushkin-vertical-slice' && promotion.selectedDelivery?.texturePolicy?.ktx2 === 'deferred-not-default', 'promotion must preserve honest texture-delivery boundary');
expect(promotion.productionBoundary?.hallRouteRemainsPlaceholder === true && promotion.productionBoundary?.legacyHallMayReactivate === false && promotion.productionBoundary?.threeRuntimeMayActivate === false, 'promotion transaction must keep placeholder and forbid legacy/Three runtime');
for (const key of ['thisPromotionAddsPushkinAssets','thisPromotionAddsProductionTextures','thisPromotionAddsRuntimeAssets','thisPromotionChangesGeometry','thisPromotionChangesCamera']) expect(promotion.productionBoundary?.[key] === false, `${key} must remain false`);
expect(promotion.rightsBoundary?.documentaryHeroAssetsRequireApprovedRightsRecord === true && promotion.rightsBoundary?.pendingRightsMayEnterProductionManifest === false && promotion.rightsBoundary?.aiMaySubstituteForMissingDocumentaryRights === false, 'Pushkin documentary rights boundary must remain strict');
for (const required of ['pushkin-rights-and-provenance-register','one-complete-pushkin-exhibit-offline','rights-cleared-portrait-and-documentary-media','production-texture-encoding-comparison','fixed-still-and-offline-camera-evidence','raw-to-optimized-pushkin-asset-validation','first-slice-performance-budget-calibration']) expect((promotion.nextGateScope?.allowed ?? []).includes(required), `Pushkin next-gate scope must allow ${required}`);
for (const forbidden of ['full-hall-lookdev','h3-topology-redesign','current-l1-bake-as-approved','rights-uncleared-documentary-media','ai-generated-historical-facsimile-or-signature','production-three-r3f-webgl-hall','offlineVisualApproval-promotion','webVerticalSlice-promotion','fullMuseumScaleOut-promotion']) expect((promotion.nextGateScope?.forbidden ?? []).includes(forbidden), `Pushkin next-gate scope must forbid ${forbidden}`);

// Current-path wiring follows the established promotion precedent.
const scripts = packageJson.scripts ?? {};
expect(scripts['validate:hall-post-material-authority'] === `tsx ${validatorPath}`, 'package scripts must expose post-material authority validator');
expect((scripts.check ?? '').includes('validate:hall-post-material-authority') && (scripts.check ?? '').includes('validate:hall-topology-provenance') && (scripts.check ?? '').includes('validate:hall-material-transport'), 'normal check must retain topology + post-material + transport authority');
for (const retired of ['validate:hall-post-camera-authority','validate:hall-material-spike','validate:hall-material-visual-evidence','validate:hall-material-decision']) expect(!(scripts.check ?? '').includes(retired), `normal current-phase check must retire ${retired}`);
expect(ci.includes('npm run validate:hall-post-material-authority'), 'primary CI must run post-material authority validator');
expect(projectContracts.includes('npm run validate:hall-post-material-authority'), 'Project Contracts must run post-material authority validator');
expect(hallWorkflow.includes('npm run validate:hall-post-material-authority') && hallWorkflow.includes('npm run validate:hall-material-transport') && hallWorkflow.includes('npm run validate:hall-topology-provenance'), 'Hall DCC workflow must retain topology + post-material + transport');
for (const retiredRun of ['npm run validate:hall-post-camera-authority','npm run validate:hall-material-spike','npm run validate:hall-material-visual-evidence','npm run validate:hall-material-decision']) expect(!hallWorkflow.includes(retiredRun), `Hall current-phase workflow must retire old mandatory run: ${retiredRun}`);
expect(hallWorkflow.includes("'docs/hall-v3/material-gate-promotion.json'") && hallWorkflow.includes(`'${validatorPath}'`), 'Hall workflow must trigger on material promotion authority changes');
expect(!hallPage.includes('material-gate-promotion') && !hallPage.includes('material-decision') && !hallPage.includes('material-spike'), 'production HallPage must not load Hall governance/evidence authority');

// Optional exact-head generated evidence layers.
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
      expect(h3.layoutFingerprint === H3_LAYOUT && h3.scene?.materials === 0 && h3.scene?.lights === 0, 'regenerated H3 must retain selected fingerprint and neutral source state');
    }
  }
}

const cameraEvidence = process.env.HALL_CAMERA_APPROVAL_EVIDENCE;
if (cameraEvidence) {
  expect(exists(cameraEvidence), `camera evidence must exist: ${cameraEvidence}`);
  if (exists(cameraEvidence)) {
    const evidenceRoot = path.dirname(path.join(root, cameraEvidence));
    const index = JSON.parse(read(cameraEvidence)) as any;
    expect(index.selectedTopology === 'H3' && index.approvedRig === null && index.sourceLayoutFingerprint === H3_LAYOUT, 'regenerated camera package must remain neutral H3 candidate evidence');
    const r1Path = path.join(evidenceRoot, 'R1', 'manifest.json');
    expect(fs.existsSync(r1Path), 'regenerated R1 manifest must exist');
    if (fs.existsSync(r1Path)) {
      const r1 = JSON.parse(fs.readFileSync(r1Path, 'utf8')) as any;
      expect(r1.source?.layoutFingerprint === H3_LAYOUT && r1.source?.geometryFingerprintBefore === H3_GEOMETRY && r1.source?.geometryFingerprintAfter === H3_GEOMETRY, 'regenerated R1 topology/geometry drifted');
      expect(r1.cameraWitnesses?.pushkinViewing?.visible === true && r1.cameraWitnesses?.pushkinViewing?.hitObject === 'EXHIBIT_alexander-pushkin', 'regenerated approved R1 must still see Pushkin first');
    }
  }
}

const materialEvidenceRelative = process.env.HALL_MATERIAL_SPIKE_EVIDENCE;
if (materialEvidenceRelative) {
  const evidenceDir = path.join(root, materialEvidenceRelative);
  const sourcePath = path.join(evidenceDir, 'source-evidence.json');
  const lookdevPath = path.join(evidenceDir, 'visual-lookdev-evidence.json');
  const rawPath = path.join(evidenceDir, 'material-spike-raw.glb');
  const optimizedPath = path.join(evidenceDir, 'material-spike-optimized.glb');
  const rawReportPath = path.join(evidenceDir, 'gltf-raw-report.json');
  const optimizedReportPath = path.join(evidenceDir, 'gltf-optimized-report.json');
  for (const file of [sourcePath,lookdevPath,rawPath,optimizedPath,rawReportPath,optimizedReportPath]) expect(fs.existsSync(file), `post-material evidence missing ${path.basename(file)}`);

  if (fs.existsSync(sourcePath)) {
    const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8')) as any;
    expect(source.source?.candidateId === 'H3' && source.source?.layoutFingerprint === H3_LAYOUT && source.source?.meshGeometryFingerprintBeforeSpike === H3_GEOMETRY, 'generated material evidence must derive from frozen H3');
    expect(source.camera?.name === 'CAM_R1_pushkinViewing' && source.camera?.lensMm === 28 && same(source.camera?.position, R1.position), 'generated material evidence must preserve frozen R1');
    expect(source.material?.baseColorColorSpace === 'sRGB' && source.material?.normalColorSpace === 'Non-Color' && source.material?.roughnessColorSpace === 'Non-Color' && source.material?.lightmapRuntimeColorSpace === 'LinearSRGBColorSpace', 'generated material color/data ownership must remain exact');
    expect(source.material?.proofTextureResolution === 256 && source.material?.proofTexturePeriodic === true && source.material?.proofTextureRasterSampling === 'texel-centers-periodic', 'generated proof texture evidence must retain accepted periodic 256px QA contract');
    expect(source.material?.surfaceUvCubeSizeMeters === 1.5 && source.material?.lookdevBevelMeters === 0.015 && source.material?.lookdevBevelSegments === 3, 'generated visual material evidence must retain accepted UV scale and QA bevel');
    expect(source.productionAsset === false && source.documentaryAsset === false, 'representative material evidence must remain non-production/non-documentary');
    if (fs.existsSync(rawPath)) expect(source.files?.rawGlb?.bytes === fs.statSync(rawPath).size && source.files?.rawGlb?.sha256 === sha256File(rawPath), 'regenerated raw GLB must self-match source-evidence bytes/SHA');
  }

  for (const [relative, expectedSha] of Object.entries(reproduction.stableGeneratedEvidence ?? {})) {
    const absolute = path.join(evidenceDir, relative);
    expect(fs.existsSync(absolute), `stable generated evidence missing ${relative}`);
    if (fs.existsSync(absolute)) expect(sha256File(absolute) === expectedSha, `stable generated evidence drifted: ${relative}`);
  }

  if (fs.existsSync(rawPath)) {
    const raw = parseGlbJson(rawPath);
    expect(fs.statSync(rawPath).size === reproduction.rawGlb?.expectedBytes, 'regenerated raw GLB byte length drifted from accepted structure');
    expect(sha256Bytes(raw.jsonBytes) === reproduction.rawGlb?.jsonChunkSha256, 'regenerated raw GLB JSON chunk drifted from accepted structural schema');
  }
  if (fs.existsSync(optimizedPath)) {
    expect(fs.statSync(optimizedPath).size === reproduction.optimizedGlb?.expectedBytes, 'regenerated optimized GLB byte length drifted from accepted structure');
    expect(normalizedOptimizedJsonSha(optimizedPath) === reproduction.optimizedGlb?.normalizedJsonSha256, 'regenerated optimized GLB normalized structural schema drifted');
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
    expect(close(l0?.meanDisplayLuma, decision.lightingDecision?.selectedEvidence?.meanDisplayLuma, 0.005) && close(l0?.darkSampleRatio, decision.lightingDecision?.selectedEvidence?.darkSampleRatioBelow0_08, 0.02), 'regenerated L0 readability drifted materially from accepted decision evidence');
    expect(close(l1?.meanDisplayLuma, rejectedL1?.meanDisplayLuma, 0.005) && close(l1?.darkSampleRatio, rejectedL1?.darkSampleRatioBelow0_08, 0.02), 'regenerated L1 readability drifted materially from rejected-bake evidence');
    const gpu = browser.gpuMemoryComparison ?? {};
    expect(Number(gpu.l0EstimatedResidentBytes) === decision.lightingDecision?.selectedEvidence?.gpuTextureResidentBytes && Number(gpu.l1EstimatedResidentBytes) === rejectedL1?.gpuTextureResidentBytes && Number(gpu.incrementalEstimatedResidentBytes) === rejectedL1?.incrementalLightmapResidentBytes, 'regenerated GPU texture residency must match accepted decision evidence');
    const visual = browser.optimizationVisualEquivalence ?? {};
    expect(Number(visual.meanAbsoluteChannelDifference) <= Number(spike.browserWitness?.optimizationVisualEquivalence?.maximumMeanAbsoluteChannelDifference) && Number(visual.maximumChannelDifference) <= Number(spike.browserWitness?.optimizationVisualEquivalence?.maximumChannelDifference) && Number(visual.changedSampleRatioAbove2) <= Number(spike.browserWitness?.optimizationVisualEquivalence?.maximumChangedSampleRatioAbove2), 'regenerated raw/optimized visual equivalence exceeds accepted thresholds');
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

console.log(`Hall post-material authority passed in phase ${contract.phase}: H3/R1/L0 are frozen; current L1 remains rejected; reproof uses structural/semantic evidence rather than unsupported Blender file-byte determinism.`);
