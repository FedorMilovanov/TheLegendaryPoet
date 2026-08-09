import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative: string) => fs.existsSync(path.join(root, relative));
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

const contractPath = 'docs/hall-v3/hall-v3-contract.json';
const rightsPath = 'docs/hall-v3/pushkin-rights.json';
const slicePath = 'docs/hall-v3/pushkin-slice.json';
const rightsPolicyPath = 'docs/hall-v3/RIGHTS_REGISTER.md';
const aiPolicyPath = 'docs/hall-v3/AI_USAGE_POLICY.md';
const scenePath = 'docs/hall-v3/SCENE_CONTRACT.md';
const visualAcceptancePath = 'docs/hall-v3/VISUAL_ACCEPTANCE.md';
const assetPipelinePath = 'docs/hall-v3/ASSET_PIPELINE.md';
const validatorPath = 'scripts/validate-hall-pushkin-rights.ts';

for (const required of [contractPath, rightsPath, slicePath, rightsPolicyPath, aiPolicyPath, scenePath, visualAcceptancePath, assetPipelinePath, validatorPath]) {
  expect(exists(required), `required Pushkin authority file missing: ${required}`);
}

const contract = JSON.parse(read(contractPath)) as any;
const rights = JSON.parse(read(rightsPath)) as any;
const slice = JSON.parse(read(slicePath)) as any;
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string,string> };
const rightsPolicy = read(rightsPolicyPath);
const aiPolicy = read(aiPolicyPath);
const scene = read(scenePath);
const visualAcceptance = read(visualAcceptancePath);
const assetPipeline = read(assetPipelinePath);
const ci = read('.github/workflows/ci.yml');
const projectContracts = read('.github/workflows/project-contracts.yml');
const hallWorkflow = read('.github/workflows/hall-greybox-tooling.yml');
const hallPage = read('src/pages/HallPage.tsx');

const EXPECTED_H3_LAYOUT = '5d5d0ddd8b150aa64afb73a2a3d9e00c6005e99fc935a6d4707a49ecd475fe65';
const EXPECTED_H3_GEOMETRY = 'b3de770858a423305db8fcab15b405414e66b3d3de93ab1deaa5b3b35b418777';
const EXPECTED_GATES = {
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
const EXPECTED_R1 = { position: [8.0, 2.5, 1.6], target: [11.15, 5.45, 1.95], lensMm: 28 };
const VALID_STATUSES = new Set(['candidate','source-verified','rights-pending','approved','blocked','retired']);

expect(contract.schemaVersion === 1 && contract.laneId === 'TLP-HALL-001' && contract.productIssue === 369, 'Hall contract identity must remain exact');
expect(contract.phase === 'pushkinVerticalSlice', 'Pushkin rights acquisition is valid only in pushkinVerticalSlice phase');
expect(same(contract.gates, EXPECTED_GATES), 'rights acquisition may not advance or reopen Hall gates');
expect(contract.productionRoute?.mode === 'placeholder', '/hall must remain placeholder during source/offline Pushkin work');
expect(contract.productionRoute?.allowThreeRuntimeImports === false, 'Pushkin rights/source work may not activate production Three/R3F/WebGL');
expect(contract.productionRoute?.allowLegacyHallImports === false, 'Pushkin work may not reactivate Hall v2');
expect(contract.sourceAuthority?.pushkinRights === rightsPath, 'Hall sourceAuthority must register pushkin-rights.json');
expect(contract.sourceAuthority?.pushkinSlice === slicePath, 'Hall sourceAuthority must register pushkin-slice.json');

expect(rights.schemaVersion === 1 && rights.laneId === 'TLP-HALL-001' && rights.productIssue === 369, 'Pushkin rights registry identity must remain exact');
expect(rights.phase === 'pushkinVerticalSlice' && rights.status === 'acquisition-in-progress', 'Pushkin rights registry must remain acquisition-in-progress');
expect(rights.policyAuthority === rightsPolicyPath && rights.aiPolicyAuthority === aiPolicyPath, 'rights registry must cite repository rights/AI policy authorities');
expect(rights.publicationRule?.productionManifestRequiresApproved === true, 'production Hall manifest must require approved documentary records');
expect(rights.publicationRule?.fileAvailabilityIsPermission === false, 'file availability may not be treated as permission');
expect(rights.publicationRule?.catalogueRecordEqualsReusableImageLicence === false, 'catalogue identity may not be collapsed into image reuse rights');
expect(rights.publicationRule?.aiReconstructionMayBeDocumentaryFacsimile === false, 'AI reconstruction may not become documentary facsimile authority');
expect(rights.publicationRule?.rightsDecisionMayBeInferredByAgent === false, 'agent may not self-infer rights approval');
expect(rights.jurisdictionResearch?.status === 'informational-not-final-legal-approval', 'jurisdiction research must remain explicitly non-final legal approval');
for (const referenceId of ['eu-dsm-2019-790-art14','de-urhg-68','ru-museum-fund-art36']) {
  expect((rights.jurisdictionResearch?.references ?? []).some((entry: any) => entry.id === referenceId && /^https:\/\//.test(entry.url ?? '')), `rights registry missing jurisdiction research reference ${referenceId}`);
}

const assets = Array.isArray(rights.assets) ? rights.assets : [];
expect(assets.length >= 3, 'Pushkin rights registry must retain at least the current three audited candidates');
const ids = assets.map((asset: any) => asset.assetId);
expect(new Set(ids).size === ids.length, 'Pushkin asset IDs must be unique');
for (const asset of assets) {
  expect(asset.poetId === 'alexander-pushkin', `${asset.assetId ?? '<unknown>'} must use canonical poetId alexander-pushkin`);
  expect(VALID_STATUSES.has(asset.verificationStatus), `${asset.assetId ?? '<unknown>'} has invalid verificationStatus`);
  expect(typeof asset.sourceTitle === 'string' && asset.sourceTitle.length > 0, `${asset.assetId ?? '<unknown>'} must retain sourceTitle`);
  expect(asset.productionManifestEligible === (asset.verificationStatus === 'approved'), `${asset.assetId ?? '<unknown>'} productionManifestEligible must equal approved status`);

  if (asset.verificationStatus === 'approved') {
    expect(asset.objectProvenance?.status === 'source-verified', `${asset.assetId} approved asset requires source-verified object provenance`);
    expect(asset.reproduction?.status === 'approved', `${asset.assetId} approved asset requires approved reproduction rights`);
    expect(typeof asset.sourceInstitution === 'string' && asset.sourceInstitution.length > 0, `${asset.assetId} approved asset requires source institution`);
    expect(/^https:\/\//.test(asset.objectProvenance?.objectUrl ?? ''), `${asset.assetId} approved asset requires exact object URL`);
    expect(typeof asset.objectProvenance?.objectIdOrCallNumber === 'string' && asset.objectProvenance.objectIdOrCallNumber.length > 0, `${asset.assetId} approved asset requires object ID/call number`);
    expect(/^https:\/\//.test(asset.reproduction?.sourcePage ?? ''), `${asset.assetId} approved asset requires reproduction source page`);
    expect(typeof asset.reproduction?.declaredBasis === 'string' && asset.reproduction.declaredBasis.length > 0, `${asset.assetId} approved asset requires explicit rights basis`);
    expect(typeof asset.reproduction?.creditLineCandidate === 'string' && asset.reproduction.creditLineCandidate.length > 0, `${asset.assetId} approved asset requires final credit line`);
    expect(/^sha256:[a-f0-9]{64}$/.test(asset.reproduction?.sourceFileHash ?? ''), `${asset.assetId} approved asset requires exact sha256 source file hash`);
    expect(/^\/hall\/v3\//.test(asset.reproduction?.runtimeAssetPath ?? ''), `${asset.assetId} approved asset requires Hall v3 runtime asset path`);
    expect(asset.intendedUse === 'production-hall-documentary', `${asset.assetId} approved asset must name production Hall documentary intended use`);
  } else {
    expect(asset.productionManifestEligible === false, `${asset.assetId} non-approved asset may not enter production manifest`);
    expect(asset.reproduction?.runtimeAssetPath == null, `${asset.assetId} non-approved asset may not have runtime asset path`);
  }

  if (asset.verificationStatus === 'blocked') {
    expect(asset.objectProvenance?.status === 'blocked' || asset.reproduction?.status === 'blocked', `${asset.assetId} blocked record must state what is blocked`);
  }
}

const portrait = assets.find((asset: any) => asset.assetId === 'pushkin-kiprensky-1827-portrait');
expect(portrait?.sourceInstitution === 'The State Tretyakov Gallery', 'Kiprensky portrait must retain Tretyakov institutional provenance');
expect(portrait?.objectProvenance?.status === 'source-verified', 'Kiprensky object identity must remain source-verified');
expect(portrait?.objectProvenance?.objectUrl === 'https://artsandculture.google.com/asset/portrait-of-a-s-pushkin/GwHXH-oqLPXL8g', 'Kiprensky object provenance URL drifted');
expect((portrait?.objectProvenance?.objectIdOrCallNumber ?? '').includes('4574813'), 'Kiprensky record must retain State Catalogue object ID 4574813');
expect(portrait?.reproduction?.status === 'rights-pending' && portrait?.verificationStatus === 'rights-pending', 'Kiprensky reproduction must remain rights-pending until final intended-use approval');
expect(portrait?.productionManifestEligible === false && portrait?.reproduction?.sourceFileHash == null, 'Kiprensky candidate may not ship before exact file acquisition/hash and approval');

const onegin = assets.find((asset: any) => asset.assetId === 'pushkin-onegin-1833-edition');
expect(onegin?.sourceInstitution === 'Russian State Library', '1833 Onegin must retain Russian State Library object provenance');
expect(onegin?.objectProvenance?.status === 'source-verified', '1833 Onegin object identity must remain source-verified');
expect(onegin?.objectProvenance?.objectUrl === 'https://search.rsl.ru/ru/record/01003570012', '1833 Onegin RSL record URL drifted');
expect((onegin?.objectProvenance?.objectIdOrCallNumber ?? '').includes('01003570012'), '1833 Onegin record must retain RSL identity');
expect(onegin?.reproduction?.status === 'rights-pending' && onegin?.verificationStatus === 'rights-pending', '1833 Onegin reproduction must remain rights-pending until file-level acquisition/approval');
expect(onegin?.productionManifestEligible === false && onegin?.reproduction?.sourceFileHash == null, '1833 Onegin may not ship before exact file acquisition/hash and approval');

const weakAutograph = assets.find((asset: any) => asset.assetId === 'pushkin-onegin-autograph-weak-mirror');
expect(weakAutograph?.verificationStatus === 'blocked', 'weak Onegin autograph mirror must stay blocked');
expect(weakAutograph?.objectProvenance?.status === 'blocked', 'weak Onegin autograph lacks acceptable primary object provenance');
expect(weakAutograph?.productionManifestEligible === false, 'weak Onegin autograph may never enter production manifest in current record');

expect(slice.schemaVersion === 1 && slice.laneId === 'TLP-HALL-001' && slice.productIssue === 369, 'Pushkin slice contract identity must remain exact');
expect(slice.phase === 'pushkinVerticalSlice' && slice.status === 'source-contract-ready-rights-blocked', 'Pushkin slice must remain source-contract-ready and rights-blocked');
expect(slice.source?.topology === 'H3' && slice.source?.layoutFingerprint === EXPECTED_H3_LAYOUT && slice.source?.meshGeometryFingerprint === EXPECTED_H3_GEOMETRY, 'Pushkin slice must retain frozen H3 authority');
expect(slice.source?.approvedRig === 'R1' && same(slice.source?.pushkinViewing, EXPECTED_R1), 'Pushkin slice must retain exact R1 Pushkin viewing witness');
expect(slice.source?.lighting === 'L0-minimal-runtime' && slice.source?.surfaceUv === 'UV0' && slice.source?.surfaceScaleMetersPerUvUnit === 1.5, 'Pushkin slice must retain selected L0/UV0 material authority');
expect(slice.source?.staticBakeReserve === 'UV1' && slice.source?.currentL1Disposition === 'reject-current-bake', 'Pushkin slice must retain UV1 reserve and current L1 rejection');
expect(slice.exhibit?.poetId === 'alexander-pushkin' && slice.exhibit?.nodeName === 'EXHIBIT_alexander-pushkin' && slice.exhibit?.anchorName === 'ANCHOR_alexander-pushkin', 'Pushkin slice must use canonical exhibit/node identity');
expect(slice.exhibit?.sourceAuthority === 'Blender' && slice.exhibit?.reactThreeMayModelCanonicalGeometry === false, 'Blender must remain source authority; React/Three may not model canonical geometry');

for (const role of slice.exhibit?.requiredAssetRoles ?? []) {
  const asset = assets.find((entry: any) => entry.assetId === role.preferredAssetId);
  expect(Boolean(asset), `slice role ${role.role ?? '<unknown>'} references missing asset ${role.preferredAssetId ?? '<missing>'}`);
  expect(role.minimumVerificationStatus === 'approved', `slice role ${role.role} must require approved documentary media`);
  expect(role.currentStatus === asset?.verificationStatus, `slice role ${role.role} currentStatus must mirror rights registry`);
}
expect((slice.exhibit?.requiredAssetRoles ?? []).some((role: any) => role.role === 'heroPortrait' && role.preferredAssetId === 'pushkin-kiprensky-1827-portrait'), 'slice must retain audited Kiprensky hero portrait candidate');
expect((slice.exhibit?.requiredAssetRoles ?? []).some((role: any) => role.role === 'documentaryPublication' && role.preferredAssetId === 'pushkin-onegin-1833-edition'), 'slice must retain audited 1833 Onegin documentary candidate');

expect(slice.productionBoundary?.productionManifestAllowed === false, 'production manifest must remain blocked while required rights are pending');
expect(slice.productionBoundary?.productionHallRouteMayChange === false && slice.productionBoundary?.productionThreeRuntimeMayActivate === false, 'source/offline Pushkin wave may not activate production Hall runtime');
expect(slice.productionBoundary?.fullHallLookdevAllowed === false && slice.productionBoundary?.laterGatePromotionAllowed === false, 'source/offline Pushkin wave may not start full-Hall lookdev or later-gate promotion');
expect(slice.productionBoundary?.rightsPendingMediaMayShip === false, 'rights-pending documentary media may not ship');
expect((slice.productionBoundary?.blockedAssetIds ?? []).includes('pushkin-onegin-autograph-weak-mirror'), 'slice must explicitly block weak autograph mirror');

expect(slice.materialBoundary?.productionTextureEncoding === 'deferred-until-measured-first-slice', 'production texture encoding must remain deferred until measured first slice');
expect(slice.materialBoundary?.qaProofPngsAreProductionAssets === false && slice.materialBoundary?.ktx2 === 'candidate-not-default', 'QA PNG/KTX2 policy must remain honest');
expect(slice.materialBoundary?.photographicAndDocumentDeliveryMustBeEvaluatedSeparately === true, 'photographic/document delivery must be evaluated separately from ordinary PBR textures');
expect(slice.materialBoundary?.noEffectsBaselineRequired === true, 'Pushkin source slice must retain no-effects baseline');

expect(slice.requiredOfflineEvidence?.fixedStillCount?.min === 8 && slice.requiredOfflineEvidence?.fixedStillCount?.max === 12, 'Pushkin visual evidence must require 8-12 fixed stills');
expect(slice.requiredOfflineEvidence?.closeMaterialCrops === true && slice.requiredOfflineEvidence?.desktopFraming === true && slice.requiredOfflineEvidence?.mobileFraming === true, 'Pushkin evidence must include close crops and separate desktop/mobile framing');
expect(slice.requiredOfflineEvidence?.offlineCameraSequenceSeconds?.min === 20 && slice.requiredOfflineEvidence?.offlineCameraSequenceSeconds?.max === 30, 'Pushkin offline camera evidence must remain 20-30 seconds');
expect(slice.requiredOfflineEvidence?.noEffectsBaseline === true && slice.requiredOfflineEvidence?.rawVsOptimizedComparison === true, 'Pushkin evidence must include no-effects and raw-vs-optimized comparisons');
expect(slice.requiredOfflineEvidence?.humanOwnerVisualApprovalRequired === true && slice.requiredOfflineEvidence?.webglMayBeginBeforeCompellingOfflineSequence === false, 'human visual approval and offline-first WebGL boundary must remain explicit');

expect(slice.deliveryPreflight?.rawGlbRequired === true && slice.deliveryPreflight?.khronosBeforeOptimization === true && slice.deliveryPreflight?.khronosAfterOptimization === true, 'Pushkin delivery must retain raw/Khronos/optimized/Khronos chain');
expect(slice.deliveryPreflight?.optimizer?.package === 'gltfpack' && slice.deliveryPreflight?.optimizer?.version === '1.2.0', 'Pushkin slice must retain approved gltfpack version');
expect(same(slice.deliveryPreflight?.optimizer?.args, ['-cc','-kn','-km','-ke','-kv','-vpf']), 'Pushkin slice optimizer args drifted');
for (const item of ['named-nodes','named-materials','node-extras','UV0','UV1','tangents','camera','poetId','metric-scale']) expect((slice.deliveryPreflight?.preserve ?? []).includes(item), `Pushkin delivery must preserve ${item}`);
expect(slice.deliveryPreflight?.visualComparisonRequired === true && slice.deliveryPreflight?.budgetReportRequired === true && slice.deliveryPreflight?.runtimeManifestRequiresApprovedRights === true, 'Pushkin delivery must require visual comparison, budget report and approved-rights manifest');

expect(slice.firstSliceBudgets?.status === 'must-be-measured-on-source-offline-slice', 'first-slice budgets must remain measured-not-guessed');
for (const field of ['transferBytes','gpuTextureResidentBytes','triangleCount','drawMaterialCount','frameTimeTargets','productionTextureEncodingDecision']) expect(slice.firstSliceBudgets?.[field] == null, `first-slice budget ${field} must remain unset before measured source slice`);

for (const required of ['acquire-exact-source-files-and-hashes','resolve-rights-basis-and-credit','promote-only-independently-approved-rights-records','author-one-source-offline-pushkin-exhibit-in-blender','measure-first-slice-delivery-and-performance','produce-required-offline-visual-evidence']) expect((slice.nextAllowedWork ?? []).includes(required), `Pushkin nextAllowedWork missing ${required}`);
for (const forbidden of ['production-three-r3f-webgl-hall','jsx-authored-canonical-architecture','full-hall-lookdev','h3-topology-redesign','current-l1-bake-as-approved','rights-pending-production-media','ai-generated-historical-facsimile','offlineVisualApproval-promotion','webVerticalSlice-promotion','fullMuseumScaleOut-promotion']) expect((slice.forbiddenWork ?? []).includes(forbidden), `Pushkin forbiddenWork missing ${forbidden}`);

expect(rightsPolicy.includes('Only `approved` documentary assets may enter the production Hall manifest.'), 'RIGHTS_REGISTER must retain approved-only production rule');
expect(rightsPolicy.includes('Museum/institution descriptive text does not automatically establish a reusable image licence.'), 'RIGHTS_REGISTER must retain catalogue-vs-reproduction separation');
expect(rightsPolicy.includes('AI reconstruction is never recorded as a documentary facsimile.'), 'RIGHTS_REGISTER must retain no fake documentary facsimile rule');
expect(aiPolicy.includes('rights/provenance;') && aiPolicy.includes('historical document authenticity;'), 'AI policy must keep rights/authenticity outside AI final authority');
expect(aiPolicy.includes('AI-generated signatures, manuscripts, facsimiles or archival objects shown as genuine evidence;'), 'AI policy must keep fake historical documentary objects forbidden');
expect(scene.includes('EXHIBIT_alexander-pushkin') && scene.includes('ANCHOR_alexander-pushkin'), 'scene contract must retain canonical Pushkin node names');
expect(scene.includes('Architecture belongs in Blender, not JSX primitives.'), 'scene contract must retain Blender geometry authority');
expect(visualAcceptance.includes('rights-cleared portrait/documentary material;'), 'visual acceptance must require rights-cleared Pushkin documentary material');
expect(visualAcceptance.includes('If the offline sequence is not compelling, WebGL integration does not begin.'), 'visual acceptance must retain offline-first WebGL blocker');
expect(assetPipeline.includes('no unresolved rights-blocked exhibit assets;'), 'asset pipeline must reject unresolved rights-blocked exhibit assets');
expect(assetPipeline.includes('Photographic/document assets may remain AVIF/WebP/JPEG'), 'asset pipeline must keep photographic/document delivery separate from blanket KTX2');

expect(packageJson.scripts?.['validate:hall-pushkin-rights'] === 'tsx scripts/validate-hall-pushkin-rights.ts', 'package script validate:hall-pushkin-rights must be registered');
expect((packageJson.scripts?.check ?? '').includes('validate:hall-pushkin-rights'), 'npm check must run Pushkin rights/source validator');
for (const [name, workflow] of [['CI',ci],['Project Contracts',projectContracts],['Hall tooling',hallWorkflow]] as const) {
  expect(workflow.includes('validate:hall-pushkin-rights'), `${name} workflow must run Pushkin rights/source validator`);
}
expect(hallWorkflow.includes("'docs/hall-v3/pushkin-rights.json'") && hallWorkflow.includes("'docs/hall-v3/pushkin-slice.json'") && hallWorkflow.includes("'scripts/validate-hall-pushkin-rights.ts'"), 'Hall workflow paths must trigger on Pushkin rights/slice authority changes');
expect(!hallPage.includes('@react-three/') && !hallPage.includes("from 'three'") && !hallPage.includes('from "three"'), 'production Hall page must remain free of Three/R3F imports during offline Pushkin work');

if (failures.length) {
  console.error('Hall Pushkin rights/source validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Hall Pushkin rights/source contract passed: H3/R1/L0 remain frozen; documentary assets are fail-closed until independent approval; production Hall runtime stays blocked.');
