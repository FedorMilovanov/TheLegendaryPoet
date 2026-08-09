import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

const contractPath = 'docs/hall-v3/hall-v3-contract.json';
const rightsPath = 'docs/hall-v3/pushkin-rights.json';
const slicePath = 'docs/hall-v3/pushkin-slice.json';
const acquisitionPath = 'docs/hall-v3/pushkin-acquisition.json';
const validatorPath = 'scripts/validate-hall-pushkin-acquisition.ts';

const contract = JSON.parse(read(contractPath)) as any;
const rights = JSON.parse(read(rightsPath)) as any;
const slice = JSON.parse(read(slicePath)) as any;
const acquisition = JSON.parse(read(acquisitionPath)) as any;
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string,string> };
const ci = read('.github/workflows/ci.yml');
const projectContracts = read('.github/workflows/project-contracts.yml');
const hallWorkflow = read('.github/workflows/hall-greybox-tooling.yml');
const hallPage = read('src/pages/HallPage.tsx');

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

expect(contract.schemaVersion === 1 && contract.laneId === 'TLP-HALL-001' && contract.productIssue === 369, 'Hall contract identity must remain exact during acquisition');
expect(contract.phase === 'pushkinVerticalSlice' && same(contract.gates, EXPECTED_GATES), 'acquisition may not advance or reopen Hall gates');
expect(contract.productionRoute?.mode === 'placeholder' && contract.productionRoute?.allowThreeRuntimeImports === false, 'acquisition may not activate production Hall WebGL');
expect(contract.sourceAuthority?.pushkinRights === rightsPath, 'Hall source authority must retain Pushkin rights registry');
expect(contract.sourceAuthority?.pushkinSlice === slicePath, 'Hall source authority must retain Pushkin slice contract');
expect(contract.sourceAuthority?.pushkinAcquisition === acquisitionPath, 'Hall source authority must register Pushkin acquisition authority');

expect(acquisition.schemaVersion === 1 && acquisition.laneId === 'TLP-HALL-001' && acquisition.productIssue === 369, 'Pushkin acquisition identity must remain exact');
expect(acquisition.phase === 'pushkinVerticalSlice' && acquisition.status === 'routes-identified-bytes-pending', 'current acquisition status must honestly remain routes identified / bytes pending');
expect(acquisition.rightsAuthority === rightsPath, 'acquisition must bind to canonical rights registry');
expect(acquisition.rules?.metadataChecksumMayStandInForAcquiredBytesHash === false, 'metadata checksum may not substitute for exact acquired-byte hash');
expect(acquisition.rules?.remoteFilePageMayStandInForAcquiredBytes === false, 'remote file page may not substitute for acquired bytes');
expect(acquisition.rules?.sourceFileHashRequiresActualByteAcquisition === true, 'sourceFileHash must require actual byte acquisition');
expect(acquisition.rules?.institutionalRequestMayBeAutoApprovedByAgent === false, 'agent may not fabricate institutional approval');
expect(acquisition.rules?.approvedRightsRequiredBeforeProductionManifest === true, 'approved rights must remain required before production manifest');
expect(acquisition.rules?.runtimeAssetPathMayPrecedeApproval === false, 'runtime asset path may not precede approval');

const rightsAssets = Array.isArray(rights.assets) ? rights.assets : [];
const acquisitionAssets = Array.isArray(acquisition.assets) ? acquisition.assets : [];
const rightsById = new Map(rightsAssets.map((asset: any) => [asset.assetId, asset]));
const acquisitionById = new Map(acquisitionAssets.map((asset: any) => [asset.assetId, asset]));
expect(new Set(acquisitionAssets.map((asset: any) => asset.assetId)).size === acquisitionAssets.length, 'acquisition asset IDs must be unique');
for (const entry of acquisitionAssets) {
  expect(rightsById.has(entry.assetId), `acquisition entry ${entry.assetId ?? '<unknown>'} must reference canonical rights record`);
  const canonical = rightsById.get(entry.assetId) as any;
  expect(entry.sourceFileHash === canonical?.sourceFileHash, `${entry.assetId} acquisition hash must mirror canonical rights hash`);
  expect(entry.bytesAcquired === false, `${entry.assetId} must not claim acquired bytes in this transaction`);
  expect(entry.sourceFileHash == null, `${entry.assetId} may not invent a source hash while bytesAcquired=false`);
  expect(canonical?.runtimeAssetPath == null && canonical?.productionManifestEligible === false, `${entry.assetId} may not have runtime path/production eligibility before acquisition+approval`);
}

const portrait = rightsById.get('pushkin-kiprensky-1827-portrait') as any;
const portraitAcq = acquisitionById.get('pushkin-kiprensky-1827-portrait') as any;
expect(portrait?.objectProvenance?.status === 'source-verified' && portrait?.rightsStatus === 'rights-pending', 'Kiprensky object must remain source-verified and rights-pending');
expect(portrait?.reproduction?.acquisitionStatus === 'remote-original-identified-bytes-not-acquired', 'Kiprensky canonical record must state original identified / bytes not acquired');
expect(portraitAcq?.acquisitionState === 'remote-original-identified-bytes-not-acquired', 'Kiprensky acquisition authority state drifted');
expect(portraitAcq?.originalFileUrl === portrait?.reproduction?.originalFileUrl && /^https:\/\/upload\.wikimedia\.org\//.test(portraitAcq?.originalFileUrl ?? ''), 'Kiprensky direct original route must match canonical reproduction evidence');
expect(portraitAcq?.reportedRemoteMetadata?.mimeType === 'image/jpeg' && same(portraitAcq?.reportedRemoteMetadata?.dimensions, [3455,4000]), 'Kiprensky remote metadata must retain reported JPEG dimensions');
expect(portrait?.sourceFileHash == null && portrait?.creditLine == null, 'Kiprensky may not gain hash/final credit before exact acquisition and disposition');

const onegin = rightsById.get('pushkin-onegin-1833-edition') as any;
const oneginAcq = acquisitionById.get('pushkin-onegin-1833-edition') as any;
expect(onegin?.objectProvenance?.status === 'source-verified' && onegin?.rightsStatus === 'rights-pending', '1833 Onegin object must remain source-verified and rights-pending');
expect(onegin?.reproduction?.acquisitionStatus === 'remote-original-identified-bytes-not-acquired', '1833 Onegin canonical record must state original identified / bytes not acquired');
expect(oneginAcq?.acquisitionState === 'remote-original-identified-bytes-not-acquired', '1833 Onegin acquisition authority state drifted');
expect(oneginAcq?.originalFileUrl === onegin?.reproduction?.originalFileUrl && /^https:\/\/upload\.wikimedia\.org\//.test(oneginAcq?.originalFileUrl ?? ''), '1833 Onegin direct original route must match canonical reproduction evidence');
expect(oneginAcq?.reportedRemoteMetadata?.mimeType === 'application/pdf' && oneginAcq?.reportedRemoteMetadata?.pages === 324, '1833 Onegin remote metadata must retain 324-page PDF identity');
expect(onegin?.sourceFileHash == null && onegin?.creditLine == null, '1833 Onegin may not gain hash/final credit before exact acquisition and disposition');

const pushkinHouse = rightsById.get('pushkin-house-onegin-self-portrait-1824') as any;
const pushkinHouseAcq = acquisitionById.get('pushkin-house-onegin-self-portrait-1824') as any;
expect(pushkinHouse?.sourceInstitution?.includes('Pushkin House'), 'official manuscript candidate must retain Pushkin House institution');
expect(pushkinHouse?.sourceUrlOrArchiveAddress === 'https://ro.pushkinskijdom.ru/inventories/3576886', 'official manuscript candidate must retain exact Pushkin House inventory URL');
expect(pushkinHouse?.objectIdOrCallNumber === 'Ф. 244, оп. 12, ед. хр. 6', 'official manuscript candidate must retain exact archive cipher');
expect(pushkinHouse?.objectProvenance?.status === 'source-verified' && pushkinHouse?.verificationStatus === 'source-verified', 'official manuscript object provenance must be source-verified');
expect(pushkinHouse?.rightsStatus === 'rights-pending' && pushkinHouse?.reproduction?.status === 'rights-pending', 'official manuscript reproduction/intended-use rights must remain pending');
expect(pushkinHouse?.reproduction?.acquisitionStatus === 'institutional-copy-request-required', 'official manuscript canonical acquisition status must require institutional copy request');
expect(pushkinHouseAcq?.acquisitionState === 'institutional-copy-request-required' && pushkinHouseAcq?.originalFileUrl == null, 'official manuscript acquisition authority may not invent direct original file URL');
expect(pushkinHouseAcq?.institutionalRequest?.required === true && pushkinHouseAcq?.institutionalRequest?.status === 'not-submitted', 'Pushkin House institutional request must remain explicit and not submitted');
expect(pushkinHouseAcq?.institutionalRequest?.requestUrl === 'https://ro.pushkinskijdom.ru/contacts', 'Pushkin House request route drifted');
expect(pushkinHouseAcq?.institutionalRequest?.requestEmail === 'roirli.copy@yandex.ru', 'Pushkin House published copy-request email drifted');
for (const item of ['researcher identity','research topic','intended use','archive cipher and unit title']) expect((pushkinHouseAcq?.institutionalRequest?.requiredInformation ?? []).includes(item), `Pushkin House request must retain required information: ${item}`);
expect(pushkinHouse?.sourceFileHash == null && pushkinHouse?.creditLine == null && pushkinHouse?.runtimeAssetPath == null, 'Pushkin House record must not claim copy hash/credit/runtime before real institutional acquisition');

const weak = rightsById.get('pushkin-onegin-autograph-weak-mirror') as any;
const weakAcq = acquisitionById.get('pushkin-onegin-autograph-weak-mirror') as any;
expect(weak?.verificationStatus === 'blocked' && weak?.objectProvenance?.status === 'blocked', 'weak mirror must remain blocked negative-control evidence');
expect(weak?.reproduction?.acquisitionStatus === 'do-not-acquire-current-weak-source', 'weak mirror canonical record must forbid acquisition');
expect(weakAcq?.acquisitionState === 'do-not-acquire-current-weak-source', 'weak mirror acquisition authority must forbid acquisition');
expect(weakAcq?.originalFileUrl == null && weakAcq?.sourceFileHash == null, 'weak mirror may not acquire bytes/hash');

const provenanceCandidate = (slice.exhibit?.provenanceCandidates ?? []).find((entry: any) => entry.role === 'documentaryDrawing');
expect(provenanceCandidate?.preferredAssetId === 'pushkin-house-onegin-self-portrait-1824', 'Pushkin slice must prefer official Pushkin House manuscript provenance');
expect(provenanceCandidate?.objectVerificationStatus === 'source-verified' && provenanceCandidate?.reproductionRightsStatus === 'rights-pending', 'Pushkin slice must distinguish verified object from pending reproduction rights');
expect(provenanceCandidate?.acquisitionStatus === 'institutional-copy-request-required' && provenanceCandidate?.shippingRequirement === 'approved', 'Pushkin slice must retain institutional-request and approved-before-shipping boundaries');
expect(provenanceCandidate?.negativeControlAssetId === 'pushkin-onegin-autograph-weak-mirror', 'Pushkin slice must retain weak mirror as negative control');
expect(slice.productionBoundary?.productionManifestAllowed === false && slice.productionBoundary?.productionThreeRuntimeMayActivate === false, 'acquisition may not unblock production manifest or Three runtime');

expect(acquisition.currentOutcome?.approvedDocumentaryAssets === 0, 'current acquisition outcome must keep approved documentary assets at zero');
expect(acquisition.currentOutcome?.exactSourceByteHashes === 0, 'current acquisition outcome must keep exact source byte hashes at zero');
expect(acquisition.currentOutcome?.productionManifestAllowed === false && acquisition.currentOutcome?.blenderExhibitMayConsumeDocumentaryMedia === false && acquisition.currentOutcome?.productionWebglMayBegin === false, 'acquisition routes alone may not unlock documentary consumption or production runtime');
for (const allowed of ['actual-byte-materialization-and-sha256','mime-dimension-page-count-verification','final-credit-disposition','intended-use-rights-disposition','institutional-copy-request-by-human-owner','promote-only-fully-approved-records']) expect((acquisition.nextBoundary?.allowed ?? []).includes(allowed), `acquisition next boundary missing ${allowed}`);
for (const forbidden of ['metadata-hash-as-source-file-hash','agent-fabricated-institutional-request','agent-fabricated-permission','rights-pending-production-manifest','weak-mirror-documentary-use','production-three-r3f-webgl-hall','offlineVisualApproval-promotion','webVerticalSlice-promotion','fullMuseumScaleOut-promotion']) expect((acquisition.nextBoundary?.forbidden ?? []).includes(forbidden), `acquisition forbidden boundary missing ${forbidden}`);

expect(packageJson.scripts?.['validate:hall-pushkin-acquisition'] === 'tsx scripts/validate-hall-pushkin-acquisition.ts', 'package script validate:hall-pushkin-acquisition must be registered');
expect((packageJson.scripts?.check ?? '').includes('validate:hall-pushkin-acquisition'), 'npm check must run Pushkin acquisition validator');
for (const [name, workflow] of [['CI',ci],['Project Contracts',projectContracts],['Hall tooling',hallWorkflow]] as const) expect(workflow.includes('validate:hall-pushkin-acquisition'), `${name} workflow must run Pushkin acquisition validator`);
expect(hallWorkflow.includes("'docs/hall-v3/pushkin-acquisition.json'") && hallWorkflow.includes(`'${validatorPath}'`), 'Hall workflow must trigger on acquisition authority/validator changes');
expect(!hallPage.includes('@react-three/') && !hallPage.includes("from 'three'") && !hallPage.includes('from "three"'), 'production Hall page must remain free of Three/R3F imports during acquisition');

if (failures.length) {
  console.error('Hall Pushkin acquisition validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Hall Pushkin acquisition authority passed: exact source routes are identified, no metadata hash is promoted to byte identity, official manuscript copy remains human/institution dependent, and production stays blocked.');
