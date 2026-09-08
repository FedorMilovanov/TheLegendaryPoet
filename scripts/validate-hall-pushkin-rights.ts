import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative: string) => fs.existsSync(path.join(root, relative));
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const countOccurrences = (haystack: string, needle: string) => haystack.split(needle).length - 1;
const gitBlobSha = (relative: string) => {
  const body = fs.readFileSync(path.join(root, relative));
  return createHash('sha1').update(Buffer.from(`blob ${body.length}\0`)).update(body).digest('hex');
};

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

const FROZEN_PUSHKIN_AUTHORITY: Record<string, string> = {
  [rightsPath]: 'a53e7aef602d57c88ad0134539c2900521c6f02d',
  [slicePath]: '39f001b85e4430a3a1fa4d6132ff6271cb95ee6a',
  [acquisitionPath]: 'a3db21a63fbce921577140f0f294a8d0aa9224c3',
  [rightsReviewPath]: '08a0f823c10af3cea7c8d4819fcddf7a051ea8fa',
  [ownerDispositionPath]: '512ddd2d83c989af34eb4eb10af32a29e250ca91',
};
for (const [relative, expected] of Object.entries(FROZEN_PUSHKIN_AUTHORITY)) {
  expect(exists(relative), `frozen Pushkin authority missing: ${relative}`);
  if (exists(relative)) expect(gitBlobSha(relative) === expected, `frozen Pushkin authority drifted: ${relative}`);
}
for (const required of [contractPath, rightsPolicyPath, aiPolicyPath, scenePath, visualAcceptancePath, assetPipelinePath, validatorPath]) {
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
const PUSHKIN_GATES = {
  foundation: 'completed', referenceBible: 'completed', metricGreybox: 'completed', cameraApproval: 'completed',
  materialLightingExportSpike: 'completed', pushkinVerticalSlice: 'active', offlineVisualApproval: 'blocked',
  webVerticalSlice: 'blocked', fullMuseumScaleOut: 'blocked',
};
const WEB_GATES = {
  foundation: 'completed', referenceBible: 'completed', metricGreybox: 'completed', cameraApproval: 'completed',
  materialLightingExportSpike: 'completed', pushkinVerticalSlice: 'completed', offlineVisualApproval: 'blocked',
  webVerticalSlice: 'active', fullMuseumScaleOut: 'blocked',
};

expect(contract.schemaVersion === 1 && contract.laneId === 'TLP-HALL-001' && contract.productIssue === 369, 'Hall contract identity must remain exact');
const historicalPushkinPhase = contract.phase === 'pushkinVerticalSlice' && same(contract.gates, PUSHKIN_GATES);
const ownerDirectedWebPhase = contract.phase === 'webVerticalSlice' && same(contract.gates, WEB_GATES);
expect(historicalPushkinPhase || ownerDirectedWebPhase, 'Hall may preserve historical Pushkin staging or advance only into the exact owner-directed webVerticalSlice gate state');
if (ownerDirectedWebPhase) {
  expect(contract.tracking?.ownerDirectedWebSliceProductIssue === 465, 'webVerticalSlice must bind owner direction #465');
  expect(contract.productionRoute?.mode === 'web-vertical-slice', 'owner-directed web phase must use bounded web-vertical-slice mode');
  expect(contract.productionRoute?.allowThreeRuntimeImports === true, 'owner-directed web phase must explicitly allow the bounded Three runtime');
  expect(contract.productionRoute?.allowRightsPendingDocumentaryMedia === false, 'rights-pending documentary media must remain blocked in production');
} else {
  expect(contract.productionRoute?.mode === 'placeholder' && contract.productionRoute?.allowThreeRuntimeImports === false, 'historical Pushkin staging must retain placeholder/no-Three production state');
}
expect(contract.productionRoute?.allowLegacyHallImports === false, 'Hall v2 must never regain current authority');
expect(contract.productionRoute?.allowUnapprovedConceptArt === false, 'unapproved concept art may not ship');
expect(contract.sourceAuthority?.pushkinRights === rightsPath, 'Hall sourceAuthority must register pushkin-rights.json');
expect(contract.sourceAuthority?.pushkinSlice === slicePath, 'Hall sourceAuthority must register pushkin-slice.json');
expect(contract.sourceAuthority?.pushkinAcquisition === acquisitionPath, 'Hall sourceAuthority must register pushkin-acquisition.json');
expect(contract.sourceAuthority?.pushkinRightsReview === rightsReviewPath, 'Hall sourceAuthority must register Pushkin rights review');
expect(contract.sourceAuthority?.pushkinOwnerDisposition === ownerDispositionPath, 'Hall sourceAuthority must register Pushkin owner disposition');

expect(rights.schemaVersion === 1 && rights.laneId === 'TLP-HALL-001' && rights.productIssue === 369, 'Pushkin rights registry identity must remain exact');
expect(rights.phase === 'pushkinVerticalSlice' && rights.status === 'external-authority-required', 'historical rights registry must remain fail-closed');
expect(rights.publicationRule?.productionManifestRequiresApproved === true, 'production Hall manifest must require approved records');
expect(rights.publicationRule?.fileAvailabilityIsPermission === false, 'file availability may not be treated as permission');
expect(rights.publicationRule?.catalogueRecordEqualsReusableImageLicence === false, 'catalogue identity may not imply a reusable-image licence');
expect(rights.publicationRule?.aiReconstructionMayBeDocumentaryFacsimile === false, 'AI reconstruction may not impersonate documentary facsimile authority');
expect(rights.publicationRule?.rightsDecisionMayBeInferredByAgent === false, 'agent may not infer rights approval');

const assets = Array.isArray(rights.assets) ? rights.assets : [];
expect(assets.length >= 4 && new Set(assets.map((asset: any) => asset.assetId)).size === assets.length, 'Pushkin rights registry must retain unique audited records');
for (const asset of assets) {
  if (asset.verificationStatus === 'approved') {
    expect(asset.rightsStatus === 'approved' && asset.productionManifestEligible === true, `${asset.assetId} approved asset must have approved rights and production eligibility`);
    expect(typeof asset.creditLine === 'string' && asset.creditLine.length > 0, `${asset.assetId} approved asset must have final credit`);
    expect(/^\/hall\/v3\//.test(asset.runtimeAssetPath ?? ''), `${asset.assetId} approved asset must have Hall runtime path`);
  } else {
    expect(asset.productionManifestEligible === false, `${asset.assetId} non-approved asset may not ship`);
    expect(asset.runtimeAssetPath == null, `${asset.assetId} non-approved asset may not claim runtime path`);
    expect(asset.creditLine == null, `${asset.assetId} non-approved asset may not claim final credit`);
  }
}
const portrait = assets.find((asset: any) => asset.assetId === 'pushkin-kiprensky-1827-portrait');
expect(portrait?.sourceFileHash === PORTRAIT_HASH && portrait?.rightsStatus === 'rights-pending' && portrait?.verificationStatus === 'rights-pending' && portrait?.productionManifestEligible === false, 'Kiprensky exact bytes must remain verified but production-rights pending');
const onegin = assets.find((asset: any) => asset.assetId === 'pushkin-onegin-1833-edition');
expect(onegin?.sourceFileHash === ONEGIN_HASH && onegin?.rightsStatus === 'rights-pending' && onegin?.verificationStatus === 'rights-pending' && onegin?.productionManifestEligible === false, '1833 Onegin exact bytes must remain verified but production-rights pending');
const pushkinHouse = assets.find((asset: any) => asset.assetId === 'pushkin-house-onegin-self-portrait-1824');
expect(pushkinHouse?.objectProvenance?.status === 'source-verified' && pushkinHouse?.rightsStatus === 'rights-pending' && pushkinHouse?.sourceFileHash == null && pushkinHouse?.productionManifestEligible === false, 'Pushkin House record must remain verified-object / unacquired-rights-pending');
const weak = assets.find((asset: any) => asset.assetId === 'pushkin-onegin-autograph-weak-mirror');
expect(weak?.verificationStatus === 'blocked' && weak?.rightsStatus === 'blocked' && weak?.productionManifestEligible === false, 'weak autograph mirror must remain blocked negative-control evidence');

expect(rightsReview.phase === 'pushkinVerticalSlice' && rightsReview.status === 'autonomous-review-complete-human-boundary', 'historical rights review must retain its handoff status');
expect(rightsReview.currentOutcome?.approvedDocumentaryAssets === 0 && rightsReview.currentOutcome?.exactSourceByteHashes === 2, 'historical rights review must retain zero approvals and two exact hashes');
expect(rightsReview.currentOutcome?.productionManifestAllowed === false && rightsReview.currentOutcome?.documentaryBlenderMediaConsumptionAllowed === false && rightsReview.currentOutcome?.productionWebglAllowed === false, 'historical rights review itself may not authorize production media/WebGL');
expect(ownerDisposition.phase === 'pushkinVerticalSlice' && ownerDisposition.status === 'owner-offline-authoring-authorized', 'historical owner disposition must remain bounded to offline authoring');
expect(ownerDisposition.offlineAuthoring?.authorized === true && ownerDisposition.offlineAuthoring?.productionShippingAuthorizedByThisDecision === false, 'historical owner disposition may authorize offline evidence but not shipping');
expect(ownerDisposition.productionBoundary?.canonicalApprovedStatusStillRequiredForProductionManifest === true && ownerDisposition.productionBoundary?.productionWebglMayBeginByThisDecision === false, 'historical offline owner decision may not be rewritten as production-WebGL authority');

expect(slice.phase === 'pushkinVerticalSlice' && slice.status === 'offline-authoring-authorized-production-rights-pending', 'historical Pushkin slice status must remain exact');
expect(slice.source?.topology === 'H3' && slice.source?.layoutFingerprint === EXPECTED_H3_LAYOUT && slice.source?.meshGeometryFingerprint === EXPECTED_H3_GEOMETRY, 'Pushkin slice must retain frozen H3 authority');
expect(slice.source?.approvedRig === 'R1' && slice.source?.lighting === 'L0-minimal-runtime' && slice.source?.surfaceUv === 'UV0', 'Pushkin slice must retain R1/L0/UV0 authority');
expect(slice.productionBoundary?.productionManifestAllowed === false && slice.productionBoundary?.productionHallRouteMayChange === false && slice.productionBoundary?.productionThreeRuntimeMayActivate === false && slice.productionBoundary?.rightsPendingMediaMayShip === false, 'historical Pushkin slice itself may not authorize production route/media');

expect(acquisition.phase === 'pushkinVerticalSlice' && acquisition.status === 'source-bytes-verified-offline-authoring-authorized-production-rights-pending', 'historical acquisition status must remain exact');
expect(acquisition.currentOutcome?.approvedDocumentaryAssets === 0 && acquisition.currentOutcome?.exactSourceByteHashes === 2, 'historical acquisition must retain zero approvals and two exact hashes');
expect(acquisition.currentOutcome?.productionManifestAllowed === false && acquisition.currentOutcome?.blenderExhibitMayConsumeDocumentaryMedia === false && acquisition.currentOutcome?.productionWebglMayBegin === false, 'historical acquisition itself may not authorize production documentary consumption/WebGL');

expect(rightsPolicy.includes('Only `approved` documentary assets may enter the production Hall manifest.'), 'rights policy must retain approved-only production manifest rule');
expect(aiPolicy.toLowerCase().includes('facsimile') || aiPolicy.toLowerCase().includes('manuscript'), 'AI policy must retain documentary authenticity boundary');
expect(scene.includes('EXHIBIT_alexander-pushkin'), 'scene contract must retain canonical Pushkin exhibit name');
expect(visualAcceptance.includes('8') && visualAcceptance.includes('12') && visualAcceptance.toLowerCase().includes('offline'), 'visual acceptance must retain bounded offline evidence requirement');
expect(assetPipeline.toLowerCase().includes('khronos') && assetPipeline.includes('gltfpack'), 'asset pipeline must retain Khronos/gltfpack transport authority');

expect(packageJson.scripts?.['validate:hall-pushkin-rights'] === 'tsx scripts/validate-hall-pushkin-rights.ts', 'package rights validator script must remain registered');
expect((packageJson.scripts?.check ?? '').includes('validate:hall-pushkin-rights'), 'npm check must run rights validator');
for (const [name, workflow] of [['CI',ci],['Project Contracts',projectContracts],['Hall tooling',hallWorkflow]] as const) expect(workflow.includes('validate:hall-pushkin-rights'), `${name} must run Pushkin rights validator`);
for (const authorityPath of [contractPath,rightsPolicyPath,aiPolicyPath,scenePath,visualAcceptancePath,assetPipelinePath,rightsPath,slicePath,acquisitionPath,rightsReviewPath,ownerDispositionPath,validatorPath]) {
  expect(countOccurrences(hallWorkflow, `'${authorityPath}'`) >= 2, `Hall workflow must trigger on ${authorityPath} for pull_request and main push`);
}
expect(!hallPage.includes('@react-three/') && !hallPage.includes("from 'three'") && !hallPage.includes('from "three"'), 'HallPage route shell must remain free of direct Three/R3F imports');

if (failures.length) {
  console.error('Hall Pushkin rights validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Hall Pushkin authority passed through ${contract.phase}: frozen documentary authority is byte-identical and fail-closed, while separate owner direction may activate a neutral, documentary-free production WebGL slice.`);
