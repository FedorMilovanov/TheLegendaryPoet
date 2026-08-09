import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative: string) => fs.existsSync(path.join(root, relative));
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const countOccurrences = (haystack: string, needle: string) => haystack.split(needle).length - 1;

const contractPath = 'docs/hall-v3/hall-v3-contract.json';
const rightsPath = 'docs/hall-v3/pushkin-rights.json';
const slicePath = 'docs/hall-v3/pushkin-slice.json';
const acquisitionPath = 'docs/hall-v3/pushkin-acquisition.json';
const rightsReviewPath = 'docs/hall-v3/pushkin-rights-review.json';
const ownerDispositionPath = 'docs/hall-v3/pushkin-owner-disposition.json';
const rightsPolicyPath = 'docs/hall-v3/RIGHTS_REGISTER.md';
const aiPolicyPath = 'docs/hall-v3/AI_USAGE_POLICY.md';
const scenePath = 'docs/hall-v3/SCENE_CONTRACT.md';
const visualAcceptancePath = 'docs/hall-v3/VISUAL_ACCEPTANCE.md';
const assetPipelinePath = 'docs/hall-v3/ASSET_PIPELINE.md';
const validatorPath = 'scripts/validate-hall-pushkin-rights.ts';
const HALL_DCC_TRIGGER_AUTHORITIES = [
  contractPath,
  rightsPolicyPath,
  aiPolicyPath,
  scenePath,
  visualAcceptancePath,
  assetPipelinePath,
  rightsPath,
  slicePath,
  acquisitionPath,
  rightsReviewPath,
  ownerDispositionPath,
  validatorPath,
];

for (const required of [contractPath, rightsPath, slicePath, acquisitionPath, rightsReviewPath, ownerDispositionPath, rightsPolicyPath, aiPolicyPath, scenePath, visualAcceptancePath, assetPipelinePath, validatorPath]) {
  expect(exists(required), `required Pushkin authority file missing: ${required}`);
}

const contract = JSON.parse(read(contractPath)) as any;
const rights = JSON.parse(read(rightsPath)) as any;
const slice = JSON.parse(read(slicePath)) as any;
const acquisition = JSON.parse(read(acquisitionPath)) as any;
const rightsReview = JSON.parse(read(rightsReviewPath)) as any;
const ownerDisposition = JSON.parse(read(ownerDispositionPath)) as any;
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
const PORTRAIT_HASH = 'sha256:316d5f366a46f23cd0a181e570f2d09a6b0d12bc368dab18fdb394b8b8b8bf4b';
const ONEGIN_HASH = 'sha256:d629c10943cbf6428eabb194ee5c17c1b763c27108a2238eaf72fadb275643e5';
const OFFLINE_AUTHORIZED_ASSETS = ['pushkin-kiprensky-1827-portrait', 'pushkin-onegin-1833-edition'];
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
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const EXPECTED_NEXT_ALLOWED_WORK = [
  'author-one-source-offline-pushkin-exhibit-in-blender',
  'measure-first-slice-delivery-and-performance',
  'produce-required-offline-visual-evidence',
  'finalize-selected-production-derivatives-and-credits',
  'promote-only-independently-approved-rights-records',
];

expect(contract.schemaVersion === 1 && contract.laneId === 'TLP-HALL-001' && contract.productIssue === 369, 'Hall contract identity must remain exact');
expect(contract.phase === 'pushkinVerticalSlice' && same(contract.gates, EXPECTED_GATES), 'Pushkin source work may not advance or reopen Hall gates');
expect(contract.productionRoute?.mode === 'placeholder', '/hall must remain placeholder during Pushkin offline authoring');
expect(contract.productionRoute?.allowThreeRuntimeImports === false && contract.productionRoute?.allowLegacyHallImports === false, 'Pushkin offline authoring may not activate Three/R3F or Hall v2');
expect(contract.sourceAuthority?.pushkinRights === rightsPath, 'Hall sourceAuthority must register pushkin-rights.json');
expect(contract.sourceAuthority?.pushkinSlice === slicePath, 'Hall sourceAuthority must register pushkin-slice.json');
expect(contract.sourceAuthority?.pushkinAcquisition === acquisitionPath, 'Hall sourceAuthority must register pushkin-acquisition.json');
expect(contract.sourceAuthority?.pushkinRightsReview === rightsReviewPath, 'Hall sourceAuthority must register the final Pushkin rights-review handoff');
expect(contract.sourceAuthority?.pushkinOwnerDisposition === ownerDispositionPath, 'Hall sourceAuthority must register explicit owner offline-authoring disposition');

expect(rights.schemaVersion === 1 && rights.laneId === 'TLP-HALL-001' && rights.productIssue === 369, 'Pushkin rights registry identity must remain exact');
expect(rights.phase === 'pushkinVerticalSlice' && rights.status === 'external-authority-required', 'canonical publication rights registry must remain fail-closed until production records are independently approved');
expect(rights.policyAuthority === rightsPolicyPath && rights.aiPolicyAuthority === aiPolicyPath, 'rights registry must cite repository rights/AI policies');
expect(rights.publicationRule?.productionManifestRequiresApproved === true, 'production Hall manifest must require approved records');
expect(rights.publicationRule?.fileAvailabilityIsPermission === false, 'file availability may not be treated as permission');
expect(rights.publicationRule?.catalogueRecordEqualsReusableImageLicence === false, 'object catalogue identity may not equal reproduction licence');
expect(rights.publicationRule?.aiReconstructionMayBeDocumentaryFacsimile === false, 'AI reconstruction may not become documentary facsimile authority');
expect(rights.publicationRule?.rightsDecisionMayBeInferredByAgent === false, 'agent may not infer rights approval');
expect(rights.jurisdictionResearch?.status === 'informational-not-final-legal-approval', 'jurisdiction research must remain non-final legal approval');
for (const id of ['eu-dsm-2019-790-art14','de-urhg-68','ru-museum-fund-art36']) {
  expect((rights.jurisdictionResearch?.references ?? []).some((entry: any) => entry.id === id && /^https:\/\//.test(entry.url ?? '')), `missing jurisdiction research reference ${id}`);
}

const assets = Array.isArray(rights.assets) ? rights.assets : [];
expect(assets.length >= 4, 'Pushkin rights registry must retain current audited records');
expect(new Set(assets.map((asset: any) => asset.assetId)).size === assets.length, 'Pushkin asset IDs must be unique');
for (const asset of assets) {
  const id = asset.assetId ?? '<unknown>';
  expect(asset.poetId === 'alexander-pushkin', `${id} must use canonical poetId`);
  expect(VALID_STATUSES.has(asset.rightsStatus) && VALID_STATUSES.has(asset.verificationStatus), `${id} status is invalid`);
  expect(typeof asset.sourceTitle === 'string' && asset.sourceTitle.length > 0, `${id} must retain sourceTitle`);
  expect(asset.productionManifestEligible === (asset.verificationStatus === 'approved'), `${id} production eligibility must equal approved verification status`);
  expect(asset.sourceFileHash === asset.reproduction?.sourceFileHash, `${id} top-level/nested source hash must agree`);
  expect(asset.runtimeAssetPath === asset.reproduction?.runtimeAssetPath, `${id} top-level/nested runtime path must agree`);
  if (asset.sourceFileHash != null) expect(SHA256.test(asset.sourceFileHash), `${id} sourceFileHash must be exact sha256:<64 hex>`);

  if (asset.verificationStatus === 'approved') {
    expect(asset.objectProvenance?.status === 'source-verified', `${id} approved asset requires verified object provenance`);
    expect(asset.reproduction?.status === 'approved' && asset.rightsStatus === 'approved', `${id} approved asset requires approved reproduction rights`);
    expect(typeof asset.creditLine === 'string' && asset.creditLine.length > 0, `${id} approved asset requires final credit`);
    expect(SHA256.test(asset.sourceFileHash ?? ''), `${id} approved asset requires exact source hash`);
    expect(/^\/hall\/v3\//.test(asset.runtimeAssetPath ?? ''), `${id} approved asset requires Hall runtime path`);
    expect(asset.intendedUse === 'production-hall-documentary', `${id} approved asset must name production documentary use`);
  } else {
    expect(asset.productionManifestEligible === false, `${id} non-approved asset may not ship`);
    expect(asset.creditLine == null, `${id} non-approved asset may not claim final credit`);
    expect(asset.runtimeAssetPath == null, `${id} non-approved asset may not claim runtime path`);
  }
}

const portrait = assets.find((asset: any) => asset.assetId === 'pushkin-kiprensky-1827-portrait');
expect(portrait?.sourceInstitution === 'The State Tretyakov Gallery', 'Kiprensky portrait must retain Tretyakov provenance');
expect(portrait?.objectProvenance?.status === 'source-verified', 'Kiprensky object must remain source-verified');
expect(portrait?.objectProvenance?.objectUrl === 'https://artsandculture.google.com/asset/portrait-of-a-s-pushkin/GwHXH-oqLPXL8g', 'Kiprensky object URL drifted');
expect((portrait?.objectProvenance?.objectIdOrCallNumber ?? '').includes('4574813') && (portrait?.objectProvenance?.objectIdOrCallNumber ?? '').includes('168'), 'Kiprensky object IDs drifted');
expect(portrait?.rightsStatus === 'rights-pending' && portrait?.verificationStatus === 'rights-pending', 'Kiprensky production rights must remain pending during offline evidence authoring');
expect(portrait?.reproduction?.status === 'rights-pending' && portrait?.reproduction?.acquisitionStatus === 'source-bytes-verified-rights-pending', 'Kiprensky reproduction must distinguish byte verification from production approval');
expect(portrait?.sourceFileHash === PORTRAIT_HASH && portrait?.reproduction?.sourceFileHash === PORTRAIT_HASH, 'Kiprensky verified byte hash drifted');
expect(portrait?.reproduction?.byteIdentityEvidence?.runId === 31325179600 && portrait?.reproduction?.byteIdentityEvidence?.head === 'be1d38a80d26a5ad0116ad1d1ec43540b803d795', 'Kiprensky byte evidence provenance drifted');
expect(portrait?.reproduction?.byteIdentityEvidence?.byteCount === 10862180 && same(portrait?.reproduction?.byteIdentityEvidence?.dimensions, [3455,4000]), 'Kiprensky byte identity details drifted');
expect(portrait?.creditLine == null && portrait?.runtimeAssetPath == null && portrait?.productionManifestEligible === false, 'offline authoring may not imply Kiprensky production approval/shipping');

const onegin = assets.find((asset: any) => asset.assetId === 'pushkin-onegin-1833-edition');
expect(onegin?.sourceInstitution === 'Russian State Library', '1833 Onegin must retain RSL provenance');
expect(onegin?.objectProvenance?.status === 'source-verified', '1833 Onegin object must remain source-verified');
expect(onegin?.objectProvenance?.objectUrl === 'https://search.rsl.ru/ru/record/01003570012', '1833 Onegin RSL URL drifted');
expect((onegin?.objectProvenance?.objectIdOrCallNumber ?? '').includes('01003570012'), '1833 Onegin RSL identity drifted');
expect(onegin?.rightsStatus === 'rights-pending' && onegin?.verificationStatus === 'rights-pending', '1833 Onegin production rights must remain pending during offline evidence authoring');
expect(onegin?.reproduction?.status === 'rights-pending' && onegin?.reproduction?.acquisitionStatus === 'source-bytes-verified-rights-pending', '1833 Onegin reproduction must distinguish byte verification from production approval');
expect(onegin?.sourceFileHash === ONEGIN_HASH && onegin?.reproduction?.sourceFileHash === ONEGIN_HASH, '1833 Onegin verified byte hash drifted');
expect(onegin?.reproduction?.byteIdentityEvidence?.runId === 31325179600 && onegin?.reproduction?.byteIdentityEvidence?.head === 'be1d38a80d26a5ad0116ad1d1ec43540b803d795', '1833 Onegin byte evidence provenance drifted');
expect(onegin?.reproduction?.byteIdentityEvidence?.byteCount === 5433794 && onegin?.reproduction?.byteIdentityEvidence?.pages === 324, '1833 Onegin byte identity details drifted');
expect(onegin?.creditLine == null && onegin?.runtimeAssetPath == null && onegin?.productionManifestEligible === false, 'offline authoring may not imply Onegin production approval/shipping');

const pushkinHouse = assets.find((asset: any) => asset.assetId === 'pushkin-house-onegin-self-portrait-1824');
expect(pushkinHouse?.sourceInstitution?.includes('Pushkin House'), 'official manuscript must retain Pushkin House institution');
expect(pushkinHouse?.sourceUrlOrArchiveAddress === 'https://ro.pushkinskijdom.ru/inventories/3576886', 'Pushkin House inventory URL drifted');
expect(pushkinHouse?.objectIdOrCallNumber === 'Ф. 244, оп. 12, ед. хр. 6', 'Pushkin House archive cipher drifted');
expect(pushkinHouse?.objectProvenance?.status === 'source-verified' && pushkinHouse?.verificationStatus === 'source-verified', 'Pushkin House object must remain source-verified');
expect(pushkinHouse?.rightsStatus === 'rights-pending' && pushkinHouse?.reproduction?.status === 'rights-pending', 'Pushkin House reproduction rights must remain pending');
expect(pushkinHouse?.reproduction?.acquisitionStatus === 'institutional-copy-request-required', 'Pushkin House exact copy must remain institutional-request dependent');
expect(pushkinHouse?.reproduction?.institutionalRequest?.required === true && pushkinHouse?.reproduction?.institutionalRequest?.status === 'not-submitted', 'a gratis guidance email must not be misrepresented as a formal exact-copy request');
expect(pushkinHouse?.sourceFileHash == null && pushkinHouse?.creditLine == null && pushkinHouse?.runtimeAssetPath == null && pushkinHouse?.productionManifestEligible === false, 'Pushkin House record may not claim unavailable copy/approval');

const weak = assets.find((asset: any) => asset.assetId === 'pushkin-onegin-autograph-weak-mirror');
expect(weak?.verificationStatus === 'blocked' && weak?.rightsStatus === 'blocked' && weak?.objectProvenance?.status === 'blocked', 'weak autograph mirror must stay blocked');
expect(weak?.reproduction?.acquisitionStatus === 'do-not-acquire-current-weak-source', 'weak autograph mirror must remain do-not-acquire');
expect(weak?.sourceFileHash == null && weak?.runtimeAssetPath == null && weak?.productionManifestEligible === false, 'weak autograph mirror may not acquire/ship');

expect(rightsReview.schemaVersion === 1 && rightsReview.laneId === 'TLP-HALL-001' && rightsReview.productIssue === 369, 'Pushkin rights-review identity must remain exact');
expect(rightsReview.phase === 'pushkinVerticalSlice' && rightsReview.status === 'autonomous-review-complete-human-boundary', 'Pushkin rights-review must retain historical autonomous handoff status');
expect(rightsReview.canonicalRightsAuthority === rightsPath && rightsReview.canonicalAcquisitionAuthority === acquisitionPath, 'rights-review must bind to canonical rights/acquisition authorities');
expect(rightsReview.rules?.agentMayConvertEvidenceToApproval === false && rightsReview.rules?.productionManifestStillRequiresCanonicalApprovedStatus === true, 'rights-review must remain additive evidence, never approval authority');
expect(rightsReview.currentOutcome?.autonomousByteAcquisitionComplete === true && rightsReview.currentOutcome?.autonomousRightsResearchComplete === true, 'rights-review must prove autonomous byte acquisition/research are complete');
expect(rightsReview.currentOutcome?.approvedDocumentaryAssets === 0 && rightsReview.currentOutcome?.exactSourceByteHashes === 2, 'historical rights-review outcome must retain zero approvals and two exact hashes');
expect(rightsReview.currentOutcome?.productionManifestAllowed === false && rightsReview.currentOutcome?.documentaryBlenderMediaConsumptionAllowed === false && rightsReview.currentOutcome?.productionWebglAllowed === false, 'historical rights-review itself may not unlock documentary consumption or production runtime');
const reviewedPortrait = (rightsReview.assets ?? []).find((asset: any) => asset.assetId === 'pushkin-kiprensky-1827-portrait');
expect(reviewedPortrait?.sourceFileHash === PORTRAIT_HASH && reviewedPortrait?.currentCanonicalStatus === 'rights-pending', 'Kiprensky rights-review must stay bound to canonical pending exact-hash evidence');
const reviewedOnegin = (rightsReview.assets ?? []).find((asset: any) => asset.assetId === 'pushkin-onegin-1833-edition');
expect(reviewedOnegin?.sourceFileHash === ONEGIN_HASH && reviewedOnegin?.currentCanonicalStatus === 'rights-pending', 'Onegin rights-review must stay bound to canonical pending exact-hash evidence');

expect(ownerDisposition.schemaVersion === 1 && ownerDisposition.laneId === 'TLP-HALL-001' && ownerDisposition.productIssue === 369, 'owner disposition identity must remain exact');
expect(ownerDisposition.phase === 'pushkinVerticalSlice' && ownerDisposition.status === 'owner-offline-authoring-authorized', 'owner disposition must explicitly authorize the current offline authoring boundary');
expect(ownerDisposition.projectUse?.paidLicenceOrPaidDigitalCopyAllowed === false && ownerDisposition.projectUse?.licensingBudget === 'none', 'owner disposition must preserve no-paid-licence policy');
expect(ownerDisposition.projectUse?.preferHighestQualityGratisPublicDomainOrOpenSource === true && ownerDisposition.projectUse?.replaceSourceRatherThanPayWhenGratisUseIsUnavailable === true, 'owner disposition must prefer high-quality gratis/open sources and fallback rather than pay');
expect(ownerDisposition.offlineAuthoring?.authorized === true && ownerDisposition.offlineAuthoring?.productionShippingAuthorizedByThisDecision === false, 'owner disposition must authorize offline evidence without granting production shipping');
expect(same((ownerDisposition.offlineAuthoring?.assets ?? []).map((entry: any) => entry.assetId), OFFLINE_AUTHORIZED_ASSETS), 'owner offline authorization must remain bounded to exact portrait and Onegin sources');
const ownerPortrait = (ownerDisposition.offlineAuthoring?.assets ?? []).find((entry: any) => entry.assetId === OFFLINE_AUTHORIZED_ASSETS[0]);
const ownerOnegin = (ownerDisposition.offlineAuthoring?.assets ?? []).find((entry: any) => entry.assetId === OFFLINE_AUTHORIZED_ASSETS[1]);
expect(ownerPortrait?.sourceFileHash === PORTRAIT_HASH && ownerOnegin?.sourceFileHash === ONEGIN_HASH, 'owner offline authorization must bind exact verified source hashes');
expect(ownerOnegin?.selectedOfflinePresentation?.sourcePdfPageIndex === 0, 'owner disposition must bind Onegin title-page source index');
expect(ownerDisposition.documentaryAuthenticity?.aiGeneratedHistoricalFacsimileAllowed === false && ownerDisposition.documentaryAuthenticity?.exactHistoricalSourceMustRemainPreserved === true, 'owner disposition must preserve documentary authenticity boundary');
expect(ownerDisposition.pushkinHouse?.v1Requirement === 'optional-deferred-not-blocking' && ownerDisposition.pushkinHouse?.waitForInstitutionBeforeOfflineAuthoring === false, 'Pushkin House must remain optional/non-blocking for v1 offline authoring');
expect(ownerDisposition.pushkinHouse?.paidCopyAllowed === false && ownerDisposition.gratisInstitutionalInquiries?.hallMayContinueBeforeReplies === true, 'gratis institutional inquiries may not become a paid or blocking dependency');
expect(ownerDisposition.productionBoundary?.canonicalApprovedStatusStillRequiredForProductionManifest === true && ownerDisposition.productionBoundary?.productionWebglMayBeginByThisDecision === false, 'owner offline decision may not unlock production manifest/WebGL');

expect(slice.schemaVersion === 1 && slice.laneId === 'TLP-HALL-001' && slice.productIssue === 369, 'Pushkin slice identity must remain exact');
expect(slice.phase === 'pushkinVerticalSlice' && slice.status === 'offline-authoring-authorized-production-rights-pending', 'Pushkin slice must expose offline-authoring authorization while keeping production rights pending');
expect(slice.source?.topology === 'H3' && slice.source?.layoutFingerprint === EXPECTED_H3_LAYOUT && slice.source?.meshGeometryFingerprint === EXPECTED_H3_GEOMETRY, 'Pushkin slice must retain frozen H3 authority');
expect(slice.source?.approvedRig === 'R1' && same(slice.source?.pushkinViewing, EXPECTED_R1), 'Pushkin slice must retain R1');
expect(slice.source?.lighting === 'L0-minimal-runtime' && slice.source?.surfaceUv === 'UV0' && slice.source?.surfaceScaleMetersPerUvUnit === 1.5, 'Pushkin slice must retain L0/UV0');
expect(slice.source?.staticBakeReserve === 'UV1' && slice.source?.currentL1Disposition === 'reject-current-bake', 'Pushkin slice must retain UV1 reserve/current L1 rejection');
expect(slice.exhibit?.poetId === 'alexander-pushkin' && slice.exhibit?.nodeName === 'EXHIBIT_alexander-pushkin' && slice.exhibit?.anchorName === 'ANCHOR_alexander-pushkin', 'Pushkin exhibit identity drifted');
expect(slice.exhibit?.sourceAuthority === 'Blender' && slice.exhibit?.reactThreeMayModelCanonicalGeometry === false, 'Blender must remain source authority');
expect(slice.exhibit?.offlineAuthoringAuthority === ownerDispositionPath, 'slice must point to owner offline-authoring authority');
for (const role of slice.exhibit?.requiredAssetRoles ?? []) {
  const asset = assets.find((entry: any) => entry.assetId === role.preferredAssetId);
  expect(Boolean(asset), `slice role ${role.role ?? '<unknown>'} references missing asset`);
  expect(role.minimumVerificationStatusForProduction === 'approved', `slice role ${role.role} must still require approved media for production`);
  expect(role.currentStatus === asset?.verificationStatus, `slice role ${role.role} status must mirror rights registry`);
  expect(role.offlineSourceEvidenceAuthorized === true, `slice role ${role.role} must be explicitly authorized for offline source evidence`);
}
const provenanceCandidate = (slice.exhibit?.provenanceCandidates ?? []).find((entry: any) => entry.role === 'documentaryDrawing');
expect(provenanceCandidate?.preferredAssetId === 'pushkin-house-onegin-self-portrait-1824', 'slice must retain official Pushkin House provenance candidate');
expect(provenanceCandidate?.objectVerificationStatus === 'source-verified' && provenanceCandidate?.reproductionRightsStatus === 'rights-pending', 'slice must keep Pushkin House object/rights states separate');
expect(provenanceCandidate?.acquisitionStatus === 'institutional-copy-request-required' && provenanceCandidate?.v1Requirement === 'optional-deferred-not-blocking', 'slice must make exact Pushkin House copy optional/non-blocking for v1');
expect(provenanceCandidate?.negativeControlAssetId === 'pushkin-onegin-autograph-weak-mirror', 'slice must preserve weak-mirror negative control');

expect(slice.productionBoundary?.offlineSourceEvidenceMediaAllowed === true, 'offline source-evidence media must be authorized by the owner disposition');
expect(slice.productionBoundary?.productionManifestAllowed === false, 'production manifest must remain blocked');
expect(slice.productionBoundary?.productionHallRouteMayChange === false && slice.productionBoundary?.productionThreeRuntimeMayActivate === false, 'production Hall runtime must remain blocked');
expect(slice.productionBoundary?.fullHallLookdevAllowed === false && slice.productionBoundary?.laterGatePromotionAllowed === false && slice.productionBoundary?.rightsPendingMediaMayShip === false, 'later Hall work/rights-pending shipping must remain blocked');
expect(slice.materialBoundary?.productionTextureEncoding === 'deferred-until-measured-first-slice' && slice.materialBoundary?.noEffectsBaselineRequired === true, 'material/visual boundaries must remain deferred/no-effects-first');
expect(slice.requiredOfflineEvidence?.fixedStillCount?.min === 8 && slice.requiredOfflineEvidence?.fixedStillCount?.max === 12, 'offline visual evidence must require 8-12 stills');
expect(slice.requiredOfflineEvidence?.closeMaterialCrops === true && slice.requiredOfflineEvidence?.desktopFraming === true && slice.requiredOfflineEvidence?.mobileFraming === true, 'offline evidence framing/crops must remain required');
expect(slice.requiredOfflineEvidence?.offlineCameraSequenceSeconds?.min === 20 && slice.requiredOfflineEvidence?.offlineCameraSequenceSeconds?.max === 30, 'offline camera evidence must remain 20-30 seconds');
expect(slice.requiredOfflineEvidence?.humanOwnerVisualApprovalRequired === true && slice.requiredOfflineEvidence?.webglMayBeginBeforeCompellingOfflineSequence === false, 'human offline visual approval must precede WebGL');
expect(slice.deliveryPreflight?.rawGlbRequired === true && slice.deliveryPreflight?.khronosBeforeOptimization === true && slice.deliveryPreflight?.khronosAfterOptimization === true, 'Pushkin delivery preflight must preserve raw/Khronos barriers');
expect(slice.deliveryPreflight?.optimizer?.package === 'gltfpack' && slice.deliveryPreflight?.optimizer?.version === '1.2.0', 'Pushkin optimizer authority drifted');
expect(slice.deliveryPreflight?.runtimeManifestRequiresApprovedRights === true, 'runtime manifest must require approved rights');
expect(same(slice.nextAllowedWork, EXPECTED_NEXT_ALLOWED_WORK), 'Pushkin nextAllowedWork must start with real offline exhibit authoring after owner disposition');

expect(acquisition.ownerDispositionAuthority === ownerDispositionPath, 'acquisition authority must bind the owner disposition');
expect(acquisition.currentOutcome?.approvedDocumentaryAssets === 0 && acquisition.currentOutcome?.exactSourceByteHashes === 2, 'acquisition outcome must show two verified byte hashes and zero production approvals');
expect(acquisition.currentOutcome?.offlineBlenderSourceEvidenceAllowed === true && same(acquisition.currentOutcome?.offlineAuthorizedAssetIds, OFFLINE_AUTHORIZED_ASSETS), 'acquisition authority must bound offline Blender use to the two exact verified sources');
expect(acquisition.currentOutcome?.productionManifestAllowed === false && acquisition.currentOutcome?.blenderExhibitMayConsumeDocumentaryMedia === false && acquisition.currentOutcome?.productionWebglMayBegin === false, 'owner offline authoring may not unlock production/documentary shipping/runtime');
const acquiredPortrait = (acquisition.assets ?? []).find((entry: any) => entry.assetId === OFFLINE_AUTHORIZED_ASSETS[0]);
const acquiredOnegin = (acquisition.assets ?? []).find((entry: any) => entry.assetId === OFFLINE_AUTHORIZED_ASSETS[1]);
expect(acquiredPortrait?.offlineAuthoringAuthorized === true && acquiredPortrait?.sourceFileHash === PORTRAIT_HASH, 'acquisition must authorize only exact Kiprensky bytes for offline authoring');
expect(acquiredOnegin?.offlineAuthoringAuthorized === true && acquiredOnegin?.sourceFileHash === ONEGIN_HASH && acquiredOnegin?.selectedOfflineSourcePdfPageIndex === 0, 'acquisition must authorize exact Onegin bytes/page selection for offline authoring');
const acquiredPushkinHouse = (acquisition.assets ?? []).find((entry: any) => entry.assetId === 'pushkin-house-onegin-self-portrait-1824');
expect(acquiredPushkinHouse?.v1Requirement === 'optional-deferred-not-blocking' && acquiredPushkinHouse?.offlineAuthoringAuthorized === false, 'Pushkin House may not be consumed in v1 without actual reusable bytes');
expect(acquiredPushkinHouse?.institutionalRequest?.status === 'not-submitted' && acquiredPushkinHouse?.gratisGuidanceInquiry?.status === 'sent', 'gratis guidance email must remain distinct from the formal exact-copy request');

expect(rightsPolicy.includes('Only `approved` documentary assets may enter the production Hall manifest.'), 'rights policy must retain approved-only manifest rule');
expect(aiPolicy.toLowerCase().includes('facsimile') || aiPolicy.toLowerCase().includes('manuscript'), 'AI policy must retain documentary authenticity boundary');
expect(scene.includes('EXHIBIT_alexander-pushkin'), 'scene contract must retain canonical Pushkin exhibit name');
expect(visualAcceptance.includes('8') && visualAcceptance.includes('12') && visualAcceptance.toLowerCase().includes('offline'), 'visual acceptance must retain bounded offline evidence requirement');
expect(assetPipeline.toLowerCase().includes('khronos') && assetPipeline.includes('gltfpack'), 'asset pipeline must retain Khronos/gltfpack delivery authority');

expect(packageJson.scripts?.['validate:hall-pushkin-rights'] === 'tsx scripts/validate-hall-pushkin-rights.ts', 'package rights validator script must remain registered');
expect((packageJson.scripts?.check ?? '').includes('validate:hall-pushkin-rights'), 'npm check must run rights validator');
for (const [name, workflow] of [['CI',ci],['Project Contracts',projectContracts],['Hall tooling',hallWorkflow]] as const) {
  expect(workflow.includes('validate:hall-pushkin-rights'), `${name} must run Pushkin rights validator`);
}
for (const authorityPath of HALL_DCC_TRIGGER_AUTHORITIES) {
  expect(countOccurrences(hallWorkflow, `'${authorityPath}'`) >= 2, `Hall workflow must trigger on ${authorityPath} for both pull_request and main push`);
}
expect(!hallPage.includes('@react-three/') && !hallPage.includes("from 'three'") && !hallPage.includes('from "three"'), 'production Hall page must remain free of Three/R3F imports');

if (failures.length) {
  console.error('Hall Pushkin rights validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Hall Pushkin authority passed: owner-authorized exact verified sources may enter offline Blender evidence now, while production publication, runtime media, WebGL and later gates remain fail-closed.');
