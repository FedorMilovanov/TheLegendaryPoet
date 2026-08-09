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
const validatorPath = 'scripts/validate-hall-pushkin-acquisition.ts';
const byteEvidenceScriptPath = 'scripts/hall-pushkin/acquire-source-byte-evidence.mjs';
const byteEvidenceWorkflowPath = '.github/workflows/hall-pushkin-source-byte-evidence.yml';
const SOURCE_BYTE_TRIGGER_INPUTS = [byteEvidenceWorkflowPath, byteEvidenceScriptPath, acquisitionPath, rightsPath];

for (const required of [contractPath, rightsPath, slicePath, acquisitionPath, validatorPath, byteEvidenceScriptPath, byteEvidenceWorkflowPath]) {
  expect(exists(required), `required acquisition authority file missing: ${required}`);
}

const contract = JSON.parse(read(contractPath)) as any;
const rights = JSON.parse(read(rightsPath)) as any;
const slice = JSON.parse(read(slicePath)) as any;
const acquisition = JSON.parse(read(acquisitionPath)) as any;
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string,string> };
const ci = read('.github/workflows/ci.yml');
const projectContracts = read('.github/workflows/project-contracts.yml');
const hallWorkflow = read('.github/workflows/hall-greybox-tooling.yml');
const byteEvidenceWorkflow = read(byteEvidenceWorkflowPath);
const byteEvidenceScript = read(byteEvidenceScriptPath);
const hallPage = read('src/pages/HallPage.tsx');

const PORTRAIT_HASH = 'sha256:316d5f366a46f23cd0a181e570f2d09a6b0d12bc368dab18fdb394b8b8b8bf4b';
const ONEGIN_HASH = 'sha256:d629c10943cbf6428eabb194ee5c17c1b763c27108a2238eaf72fadb275643e5';
const EVIDENCE_HEAD = 'be1d38a80d26a5ad0116ad1d1ec43540b803d795';
const EVIDENCE_RUN = 31325179600;
const PORTRAIT_URL = 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Orest_Kiprensky_-_%D0%9F%D0%BE%D1%80%D1%82%D1%80%D0%B5%D1%82_%D0%BF%D0%BE%D1%8D%D1%82%D0%B0_%D0%90.%D0%A1.%D0%9F%D1%83%D1%88%D0%BA%D0%B8%D0%BD%D0%B0_-_Google_Art_Project.jpg';
const ONEGIN_URL = 'https://upload.wikimedia.org/wikipedia/commons/1/1d/%D0%9F%D1%83%D1%88%D0%BA%D0%B8%D0%BD._%D0%95%D0%B2%D0%B3%D0%B5%D0%BD%D0%B8%D0%B9_%D0%9E%D0%BD%D0%B5%D0%B3%D0%B8%D0%BD_%281833%29.pdf';
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

expect(contract.schemaVersion === 1 && contract.laneId === 'TLP-HALL-001' && contract.productIssue === 369, 'Hall contract identity must remain exact during byte evidence');
expect(contract.phase === 'pushkinVerticalSlice' && same(contract.gates, EXPECTED_GATES), 'byte evidence may not advance or reopen Hall gates');
expect(contract.productionRoute?.mode === 'placeholder' && contract.productionRoute?.allowThreeRuntimeImports === false, 'byte evidence may not activate production Hall WebGL');
expect(contract.sourceAuthority?.pushkinRights === rightsPath && contract.sourceAuthority?.pushkinSlice === slicePath && contract.sourceAuthority?.pushkinAcquisition === acquisitionPath, 'Hall source authority must retain rights/slice/acquisition records');

expect(acquisition.schemaVersion === 1 && acquisition.laneId === 'TLP-HALL-001' && acquisition.productIssue === 369, 'Pushkin acquisition identity must remain exact');
expect(acquisition.phase === 'pushkinVerticalSlice' && acquisition.status === 'source-bytes-verified-rights-pending', 'acquisition status must record verified bytes while rights remain pending');
expect(acquisition.rightsAuthority === rightsPath, 'acquisition must bind to canonical rights registry');
expect(acquisition.rules?.metadataChecksumMayStandInForAcquiredBytesHash === false, 'metadata checksum may not substitute for acquired-byte hash');
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
  expect(canonical?.runtimeAssetPath == null && canonical?.productionManifestEligible === false, `${entry.assetId} may not have runtime path/production eligibility before approval`);
}

const portrait = rightsById.get('pushkin-kiprensky-1827-portrait') as any;
const portraitAcq = acquisitionById.get('pushkin-kiprensky-1827-portrait') as any;
expect(portrait?.objectProvenance?.status === 'source-verified' && portrait?.rightsStatus === 'rights-pending' && portrait?.verificationStatus === 'rights-pending', 'Kiprensky object must be verified while rights remain pending');
expect(portraitAcq?.acquisitionState === 'source-bytes-verified-rights-pending' && portrait?.reproduction?.acquisitionStatus === 'source-bytes-verified-rights-pending', 'Kiprensky acquisition state must record verified bytes/pending rights');
expect(portraitAcq?.originalFileUrl === PORTRAIT_URL && portrait?.reproduction?.originalFileUrl === PORTRAIT_URL, 'Kiprensky exact original route drifted');
expect(portraitAcq?.bytesAcquired === true && portraitAcq?.sourceFileHash === PORTRAIT_HASH && portrait?.sourceFileHash === PORTRAIT_HASH, 'Kiprensky actual-byte hash must be canonical');
expect(portraitAcq?.reportedRemoteMetadata?.mimeType === 'image/jpeg' && same(portraitAcq?.reportedRemoteMetadata?.dimensions, [3455,4000]), 'Kiprensky remote metadata identity drifted');
expect(portraitAcq?.verifiedByteIdentity?.evidenceRunId === EVIDENCE_RUN && portraitAcq?.verifiedByteIdentity?.evidenceHead === EVIDENCE_HEAD, 'Kiprensky evidence run/head drifted');
expect(portraitAcq?.verifiedByteIdentity?.requestedUrl === PORTRAIT_URL && portraitAcq?.verifiedByteIdentity?.finalUrl === PORTRAIT_URL, 'Kiprensky evidence URL must match actual fetched original');
expect(portraitAcq?.verifiedByteIdentity?.detectedType === 'image/jpeg' && portraitAcq?.verifiedByteIdentity?.byteCount === 10862180 && same(portraitAcq?.verifiedByteIdentity?.dimensions, [3455,4000]), 'Kiprensky observed byte identity drifted');
expect(portraitAcq?.verifiedByteIdentity?.sha256 === PORTRAIT_HASH, 'Kiprensky evidence hash drifted');
expect(portrait?.creditLine == null && portrait?.runtimeAssetPath == null && portrait?.productionManifestEligible === false, 'Kiprensky byte verification may not imply final approval');

const onegin = rightsById.get('pushkin-onegin-1833-edition') as any;
const oneginAcq = acquisitionById.get('pushkin-onegin-1833-edition') as any;
expect(onegin?.objectProvenance?.status === 'source-verified' && onegin?.rightsStatus === 'rights-pending' && onegin?.verificationStatus === 'rights-pending', '1833 Onegin object must be verified while rights remain pending');
expect(oneginAcq?.acquisitionState === 'source-bytes-verified-rights-pending' && onegin?.reproduction?.acquisitionStatus === 'source-bytes-verified-rights-pending', '1833 Onegin acquisition state must record verified bytes/pending rights');
expect(oneginAcq?.originalFileUrl === ONEGIN_URL && onegin?.reproduction?.originalFileUrl === ONEGIN_URL, '1833 Onegin exact original route drifted');
expect(oneginAcq?.bytesAcquired === true && oneginAcq?.sourceFileHash === ONEGIN_HASH && onegin?.sourceFileHash === ONEGIN_HASH, '1833 Onegin actual-byte hash must be canonical');
expect(oneginAcq?.reportedRemoteMetadata?.mimeType === 'application/pdf' && oneginAcq?.reportedRemoteMetadata?.pages === 324, '1833 Onegin remote metadata identity drifted');
expect(oneginAcq?.verifiedByteIdentity?.evidenceRunId === EVIDENCE_RUN && oneginAcq?.verifiedByteIdentity?.evidenceHead === EVIDENCE_HEAD, '1833 Onegin evidence run/head drifted');
expect(oneginAcq?.verifiedByteIdentity?.requestedUrl === ONEGIN_URL && oneginAcq?.verifiedByteIdentity?.finalUrl === ONEGIN_URL, '1833 Onegin evidence URL must match actual fetched original');
expect(oneginAcq?.verifiedByteIdentity?.detectedType === 'application/pdf' && oneginAcq?.verifiedByteIdentity?.byteCount === 5433794 && oneginAcq?.verifiedByteIdentity?.pages === 324, '1833 Onegin observed byte identity drifted');
expect(oneginAcq?.verifiedByteIdentity?.sha256 === ONEGIN_HASH, '1833 Onegin evidence hash drifted');
expect(onegin?.creditLine == null && onegin?.runtimeAssetPath == null && onegin?.productionManifestEligible === false, '1833 Onegin byte verification may not imply final approval');

const pushkinHouse = rightsById.get('pushkin-house-onegin-self-portrait-1824') as any;
const pushkinHouseAcq = acquisitionById.get('pushkin-house-onegin-self-portrait-1824') as any;
expect(pushkinHouse?.sourceInstitution?.includes('Pushkin House') && pushkinHouse?.sourceUrlOrArchiveAddress === 'https://ro.pushkinskijdom.ru/inventories/3576886', 'official manuscript candidate must retain Pushkin House provenance');
expect(pushkinHouse?.objectIdOrCallNumber === 'Ф. 244, оп. 12, ед. хр. 6' && pushkinHouse?.objectProvenance?.status === 'source-verified', 'official manuscript archive identity drifted');
expect(pushkinHouse?.rightsStatus === 'rights-pending' && pushkinHouse?.reproduction?.status === 'rights-pending', 'official manuscript rights must remain pending');
expect(pushkinHouseAcq?.acquisitionState === 'institutional-copy-request-required' && pushkinHouseAcq?.originalFileUrl == null && pushkinHouseAcq?.bytesAcquired === false && pushkinHouseAcq?.sourceFileHash == null, 'Pushkin House copy must remain unacquired/institution-dependent');
expect(pushkinHouseAcq?.institutionalRequest?.required === true && pushkinHouseAcq?.institutionalRequest?.status === 'not-submitted', 'Pushkin House request must remain explicit and not submitted');
expect(pushkinHouse?.sourceFileHash == null && pushkinHouse?.creditLine == null && pushkinHouse?.runtimeAssetPath == null, 'Pushkin House record may not claim copy hash/credit/runtime');

const weak = rightsById.get('pushkin-onegin-autograph-weak-mirror') as any;
const weakAcq = acquisitionById.get('pushkin-onegin-autograph-weak-mirror') as any;
expect(weak?.verificationStatus === 'blocked' && weak?.objectProvenance?.status === 'blocked' && weak?.rightsStatus === 'blocked', 'weak mirror must remain blocked negative-control evidence');
expect(weakAcq?.acquisitionState === 'do-not-acquire-current-weak-source' && weakAcq?.originalFileUrl == null && weakAcq?.bytesAcquired === false && weakAcq?.sourceFileHash == null, 'weak mirror must remain do-not-acquire/unhashed');

const provenanceCandidate = (slice.exhibit?.provenanceCandidates ?? []).find((entry: any) => entry.role === 'documentaryDrawing');
expect(provenanceCandidate?.preferredAssetId === 'pushkin-house-onegin-self-portrait-1824', 'Pushkin slice must prefer official Pushkin House manuscript provenance');
expect(provenanceCandidate?.objectVerificationStatus === 'source-verified' && provenanceCandidate?.reproductionRightsStatus === 'rights-pending', 'Pushkin slice must distinguish verified object from pending reproduction rights');
expect(provenanceCandidate?.acquisitionStatus === 'institutional-copy-request-required' && provenanceCandidate?.shippingRequirement === 'approved', 'Pushkin slice must retain institutional-request/approved-before-shipping boundary');
expect(provenanceCandidate?.negativeControlAssetId === 'pushkin-onegin-autograph-weak-mirror', 'Pushkin slice must retain weak mirror as negative control');
expect(slice.productionBoundary?.productionManifestAllowed === false && slice.productionBoundary?.productionThreeRuntimeMayActivate === false, 'verified bytes may not unblock production manifest or Three runtime');

expect(acquisition.currentOutcome?.approvedDocumentaryAssets === 0, 'approved documentary assets must remain zero');
expect(acquisition.currentOutcome?.exactSourceByteHashes === 2, 'exact acquired-byte hash count must be two');
expect(acquisition.currentOutcome?.productionManifestAllowed === false && acquisition.currentOutcome?.blenderExhibitMayConsumeDocumentaryMedia === false && acquisition.currentOutcome?.productionWebglMayBegin === false, 'verified bytes alone may not unlock documentary consumption or production runtime');
for (const allowed of ['independent-byte-revalidation-against-recorded-sha256','final-credit-disposition','intended-use-rights-disposition','institutional-copy-request-by-human-owner','promote-only-fully-approved-records']) expect((acquisition.nextBoundary?.allowed ?? []).includes(allowed), `acquisition next boundary missing ${allowed}`);
for (const forbidden of ['metadata-hash-as-source-file-hash','hash-without-actual-byte-evidence','agent-fabricated-institutional-request','agent-fabricated-permission','rights-pending-production-manifest','weak-mirror-documentary-use','production-three-r3f-webgl-hall','offlineVisualApproval-promotion','webVerticalSlice-promotion','fullMuseumScaleOut-promotion']) expect((acquisition.nextBoundary?.forbidden ?? []).includes(forbidden), `acquisition forbidden boundary missing ${forbidden}`);

expect(packageJson.scripts?.['validate:hall-pushkin-acquisition'] === 'tsx scripts/validate-hall-pushkin-acquisition.ts', 'package acquisition validator script must remain registered');
expect((packageJson.scripts?.check ?? '').includes('validate:hall-pushkin-acquisition'), 'npm check must run acquisition validator');
for (const [name, workflow] of [['CI',ci],['Project Contracts',projectContracts],['Hall tooling',hallWorkflow]] as const) expect(workflow.includes('validate:hall-pushkin-acquisition'), `${name} must run Pushkin acquisition validator`);
expect(hallWorkflow.includes("'docs/hall-v3/pushkin-acquisition.json'") && hallWorkflow.includes(`'${validatorPath}'`), 'Hall workflow must trigger on acquisition authority/validator changes');
expect(byteEvidenceWorkflow.includes(byteEvidenceScriptPath), 'source-byte evidence workflow must run the exact acquisition probe');
expect(byteEvidenceWorkflow.includes('\n  pull_request:\n') && byteEvidenceWorkflow.includes('\n  push:\n'), 'source-byte evidence workflow must revalidate exact bytes on both pull requests and main pushes');
for (const triggerInput of SOURCE_BYTE_TRIGGER_INPUTS) {
  expect(countOccurrences(byteEvidenceWorkflow, `'${triggerInput}'`) >= 2, `source-byte evidence workflow must cover ${triggerInput} in both pull_request and main push paths`);
}
expect(byteEvidenceWorkflow.includes('Upload source-byte identity evidence only'), 'source-byte workflow must upload evidence rather than source media');
expect(byteEvidenceScript.includes("hostname !== 'upload.wikimedia.org'") && byteEvidenceScript.includes('recorded sourceFileHash does not match freshly acquired bytes'), 'source-byte probe must pin host and revalidate recorded hashes');
expect(!hallPage.includes('@react-three/') && !hallPage.includes("from 'three'") && !hallPage.includes('from "three"'), 'production Hall page must remain free of Three/R3F imports');

if (failures.length) {
  console.error('Hall Pushkin acquisition validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Hall Pushkin acquisition authority passed: two exact source-byte identities are recorded and independently revalidatable, while rights, institutional copy and production/runtime boundaries remain blocked.');
