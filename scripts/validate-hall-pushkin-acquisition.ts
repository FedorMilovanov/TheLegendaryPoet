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
const ownerDispositionPath = 'docs/hall-v3/pushkin-owner-disposition.json';
const validatorPath = 'scripts/validate-hall-pushkin-acquisition.ts';
const byteEvidenceScriptPath = 'scripts/hall-pushkin/acquire-source-byte-evidence.mjs';
const byteEvidenceWorkflowPath = '.github/workflows/hall-pushkin-source-byte-evidence.yml';

const FROZEN_ACQUISITION_AUTHORITY: Record<string, string> = {
  [rightsPath]: 'a53e7aef602d57c88ad0134539c2900521c6f02d',
  [slicePath]: '39f001b85e4430a3a1fa4d6132ff6271cb95ee6a',
  [acquisitionPath]: 'a3db21a63fbce921577140f0f294a8d0aa9224c3',
  [ownerDispositionPath]: '512ddd2d83c989af34eb4eb10af32a29e250ca91',
};
for (const [relative, expected] of Object.entries(FROZEN_ACQUISITION_AUTHORITY)) {
  expect(exists(relative), `frozen acquisition authority missing: ${relative}`);
  if (exists(relative)) expect(gitBlobSha(relative) === expected, `frozen acquisition authority drifted: ${relative}`);
}
for (const required of [contractPath, validatorPath, byteEvidenceScriptPath, byteEvidenceWorkflowPath]) expect(exists(required), `required acquisition file missing: ${required}`);

const contract = JSON.parse(read(contractPath)) as any;
const rights = JSON.parse(read(rightsPath)) as any;
const slice = JSON.parse(read(slicePath)) as any;
const acquisition = JSON.parse(read(acquisitionPath)) as any;
const ownerDisposition = JSON.parse(read(ownerDispositionPath)) as any;
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
const EXPECTED_OFFLINE_IDS = ['pushkin-kiprensky-1827-portrait','pushkin-onegin-1833-edition'];
const PUSHKIN_GATES = {
  foundation:'completed', referenceBible:'completed', metricGreybox:'completed', cameraApproval:'completed',
  materialLightingExportSpike:'completed', pushkinVerticalSlice:'active', offlineVisualApproval:'blocked',
  webVerticalSlice:'blocked', fullMuseumScaleOut:'blocked',
};
const WEB_GATES = {
  foundation:'completed', referenceBible:'completed', metricGreybox:'completed', cameraApproval:'completed',
  materialLightingExportSpike:'completed', pushkinVerticalSlice:'completed', offlineVisualApproval:'blocked',
  webVerticalSlice:'active', fullMuseumScaleOut:'blocked',
};

expect(contract.schemaVersion === 1 && contract.laneId === 'TLP-HALL-001' && contract.productIssue === 369, 'Hall contract identity must remain exact during acquisition validation');
const historicalPushkinPhase = contract.phase === 'pushkinVerticalSlice' && same(contract.gates, PUSHKIN_GATES);
const ownerDirectedWebPhase = contract.phase === 'webVerticalSlice' && same(contract.gates, WEB_GATES);
expect(historicalPushkinPhase || ownerDirectedWebPhase, 'acquisition authority may coexist only with historical Pushkin staging or the exact owner-directed webVerticalSlice state');
if (ownerDirectedWebPhase) {
  expect(contract.tracking?.ownerDirectedWebSliceProductIssue === 465, 'webVerticalSlice must bind owner direction #465');
  expect(contract.productionRoute?.mode === 'web-vertical-slice' && contract.productionRoute?.allowThreeRuntimeImports === true, 'current owner-directed production Hall must expose the bounded WebGL slice');
  expect(contract.productionRoute?.allowRightsPendingDocumentaryMedia === false, 'current production Hall may not consume rights-pending documentary media');
} else {
  expect(contract.productionRoute?.mode === 'placeholder' && contract.productionRoute?.allowThreeRuntimeImports === false, 'historical acquisition stage must retain placeholder/no-Three production state');
}
expect(contract.productionRoute?.allowLegacyHallImports === false, 'legacy Hall imports must remain forbidden');
expect(contract.sourceAuthority?.pushkinRights === rightsPath && contract.sourceAuthority?.pushkinSlice === slicePath && contract.sourceAuthority?.pushkinAcquisition === acquisitionPath, 'Hall source authority must retain rights/slice/acquisition records');
expect(contract.sourceAuthority?.pushkinOwnerDisposition === ownerDispositionPath, 'Hall source authority must bind historical owner offline disposition');

expect(acquisition.schemaVersion === 1 && acquisition.laneId === 'TLP-HALL-001' && acquisition.productIssue === 369, 'Pushkin acquisition identity must remain exact');
expect(acquisition.phase === 'pushkinVerticalSlice' && acquisition.status === 'source-bytes-verified-offline-authoring-authorized-production-rights-pending', 'historical acquisition status must remain exact');
expect(acquisition.rightsAuthority === rightsPath && acquisition.ownerDispositionAuthority === ownerDispositionPath, 'acquisition must bind canonical rights and owner disposition authorities');
expect(acquisition.rules?.metadataChecksumMayStandInForAcquiredBytesHash === false, 'metadata checksum may not substitute for acquired-byte hash');
expect(acquisition.rules?.remoteFilePageMayStandInForAcquiredBytes === false, 'remote file page may not substitute for acquired bytes');
expect(acquisition.rules?.sourceFileHashRequiresActualByteAcquisition === true, 'sourceFileHash must require actual byte acquisition');
expect(acquisition.rules?.institutionalRequestMayBeAutoApprovedByAgent === false, 'agent may not fabricate institutional approval');
expect(acquisition.rules?.approvedRightsRequiredBeforeProductionManifest === true, 'approved rights must remain required before production manifest');
expect(acquisition.rules?.runtimeAssetPathMayPrecedeApproval === false, 'runtime asset path may not precede approval');
expect(acquisition.rules?.offlineAuthoringMayUseOwnerAuthorizedExactVerifiedSources === true && acquisition.rules?.offlineAuthoringIsProductionPermission === false, 'offline source use must remain explicit and distinct from production permission');
expect(ownerDisposition.status === 'owner-offline-authoring-authorized' && ownerDisposition.offlineAuthoring?.authorized === true, 'historical owner disposition must retain offline authorization');
expect(ownerDisposition.offlineAuthoring?.productionShippingAuthorizedByThisDecision === false && ownerDisposition.productionBoundary?.productionWebglMayBeginByThisDecision === false, 'historical offline owner decision may not be rewritten as shipping/WebGL authority');

const rightsAssets = Array.isArray(rights.assets) ? rights.assets : [];
const acquisitionAssets = Array.isArray(acquisition.assets) ? acquisition.assets : [];
const rightsById = new Map(rightsAssets.map((asset: any) => [asset.assetId, asset]));
const acquisitionById = new Map(acquisitionAssets.map((asset: any) => [asset.assetId, asset]));
expect(new Set(acquisitionAssets.map((asset: any) => asset.assetId)).size === acquisitionAssets.length, 'acquisition asset IDs must remain unique');
for (const entry of acquisitionAssets) {
  const canonical = rightsById.get(entry.assetId) as any;
  expect(Boolean(canonical), `acquisition entry ${entry.assetId ?? '<unknown>'} must reference canonical rights record`);
  expect(entry.sourceFileHash === canonical?.sourceFileHash, `${entry.assetId} acquisition hash must mirror canonical rights hash`);
  expect(canonical?.runtimeAssetPath == null && canonical?.productionManifestEligible === false, `${entry.assetId} may not have runtime path/production eligibility before approval`);
}

const portrait = rightsById.get('pushkin-kiprensky-1827-portrait') as any;
const portraitAcq = acquisitionById.get('pushkin-kiprensky-1827-portrait') as any;
expect(portrait?.rightsStatus === 'rights-pending' && portrait?.verificationStatus === 'rights-pending' && portrait?.sourceFileHash === PORTRAIT_HASH, 'Kiprensky canonical record must remain exact/right-pending');
expect(portraitAcq?.offlineAuthoringAuthorized === true && portraitAcq?.bytesAcquired === true && portraitAcq?.sourceFileHash === PORTRAIT_HASH, 'Kiprensky exact bytes must remain owner-authorized only for offline evidence');
expect(portraitAcq?.verifiedByteIdentity?.evidenceRunId === EVIDENCE_RUN && portraitAcq?.verifiedByteIdentity?.evidenceHead === EVIDENCE_HEAD && portraitAcq?.verifiedByteIdentity?.sha256 === PORTRAIT_HASH, 'Kiprensky byte evidence provenance/hash drifted');

const onegin = rightsById.get('pushkin-onegin-1833-edition') as any;
const oneginAcq = acquisitionById.get('pushkin-onegin-1833-edition') as any;
expect(onegin?.rightsStatus === 'rights-pending' && onegin?.verificationStatus === 'rights-pending' && onegin?.sourceFileHash === ONEGIN_HASH, '1833 Onegin canonical record must remain exact/rights-pending');
expect(oneginAcq?.offlineAuthoringAuthorized === true && oneginAcq?.bytesAcquired === true && oneginAcq?.sourceFileHash === ONEGIN_HASH && oneginAcq?.selectedOfflineSourcePdfPageIndex === 0, '1833 Onegin exact title-page source must remain owner-authorized only for offline evidence');
expect(oneginAcq?.verifiedByteIdentity?.evidenceRunId === EVIDENCE_RUN && oneginAcq?.verifiedByteIdentity?.evidenceHead === EVIDENCE_HEAD && oneginAcq?.verifiedByteIdentity?.sha256 === ONEGIN_HASH, '1833 Onegin byte evidence provenance/hash drifted');

const pushkinHouse = rightsById.get('pushkin-house-onegin-self-portrait-1824') as any;
const pushkinHouseAcq = acquisitionById.get('pushkin-house-onegin-self-portrait-1824') as any;
expect(pushkinHouse?.objectProvenance?.status === 'source-verified' && pushkinHouse?.rightsStatus === 'rights-pending' && pushkinHouse?.sourceFileHash == null, 'Pushkin House record must remain verified-object / rights-pending / unacquired');
expect(pushkinHouseAcq?.bytesAcquired === false && pushkinHouseAcq?.sourceFileHash == null && pushkinHouseAcq?.offlineAuthoringAuthorized === false && pushkinHouseAcq?.v1Requirement === 'optional-deferred-not-blocking', 'Pushkin House exact copy must remain unacquired, optional and non-blocking');
expect(pushkinHouseAcq?.institutionalRequest?.status === 'not-submitted', 'gratis guidance inquiry may not be represented as a formal exact-copy request');

const weak = rightsById.get('pushkin-onegin-autograph-weak-mirror') as any;
const weakAcq = acquisitionById.get('pushkin-onegin-autograph-weak-mirror') as any;
expect(weak?.verificationStatus === 'blocked' && weak?.rightsStatus === 'blocked', 'weak autograph mirror must remain blocked');
expect(weakAcq?.acquisitionState === 'do-not-acquire-current-weak-source' && weakAcq?.bytesAcquired === false && weakAcq?.offlineAuthoringAuthorized === false, 'weak mirror must remain do-not-acquire/unusable');

expect(slice.productionBoundary?.offlineSourceEvidenceMediaAllowed === true, 'historical slice must retain exact-source offline evidence allowance');
expect(slice.productionBoundary?.productionManifestAllowed === false && slice.productionBoundary?.productionThreeRuntimeMayActivate === false && slice.productionBoundary?.rightsPendingMediaMayShip === false, 'historical slice itself may not authorize production documentary media/WebGL');
expect(acquisition.currentOutcome?.approvedDocumentaryAssets === 0 && acquisition.currentOutcome?.exactSourceByteHashes === 2, 'historical acquisition must retain zero approved documentary assets and two exact hashes');
expect(acquisition.currentOutcome?.offlineBlenderSourceEvidenceAllowed === true && same(acquisition.currentOutcome?.offlineAuthorizedAssetIds, EXPECTED_OFFLINE_IDS), 'offline Blender source-evidence authorization must remain exact and bounded');
expect(acquisition.currentOutcome?.productionManifestAllowed === false && acquisition.currentOutcome?.blenderExhibitMayConsumeDocumentaryMedia === false && acquisition.currentOutcome?.productionWebglMayBegin === false, 'historical acquisition itself may not unlock production manifest/documentary/WebGL');

expect(packageJson.scripts?.['validate:hall-pushkin-acquisition'] === 'tsx scripts/validate-hall-pushkin-acquisition.ts', 'package acquisition validator script must remain registered');
expect((packageJson.scripts?.check ?? '').includes('validate:hall-pushkin-acquisition'), 'npm check must run acquisition validator');
for (const [name, workflow] of [['CI',ci],['Project Contracts',projectContracts],['Hall tooling',hallWorkflow]] as const) expect(workflow.includes('validate:hall-pushkin-acquisition'), `${name} must run Pushkin acquisition validator`);
expect(hallWorkflow.includes("'docs/hall-v3/pushkin-acquisition.json'") && hallWorkflow.includes("'docs/hall-v3/pushkin-owner-disposition.json'") && hallWorkflow.includes(`'${validatorPath}'`), 'Hall workflow must trigger on acquisition/owner authority/validator changes');
expect(byteEvidenceWorkflow.includes(byteEvidenceScriptPath), 'source-byte evidence workflow must run the exact acquisition probe');
expect(byteEvidenceWorkflow.includes('\n  pull_request:\n') && byteEvidenceWorkflow.includes('\n  push:\n'), 'source-byte evidence workflow must revalidate exact bytes on pull requests and main pushes');
for (const triggerInput of [byteEvidenceWorkflowPath, byteEvidenceScriptPath, acquisitionPath, rightsPath]) expect(countOccurrences(byteEvidenceWorkflow, `'${triggerInput}'`) >= 2, `source-byte workflow must cover ${triggerInput} in pull_request and main push paths`);
expect(byteEvidenceWorkflow.includes('uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4') && byteEvidenceWorkflow.includes("node-version: '24'"), 'source-byte workflow must retain immutable setup-node v4 and isolated Node 24');
expect(!byteEvidenceWorkflow.includes('./.github/actions/setup-node-deps') && !byteEvidenceWorkflow.includes('npm ci') && !byteEvidenceWorkflow.includes('npm install'), 'source-byte workflow must remain isolated from application dependency installation');
expect(byteEvidenceWorkflow.includes('Upload source-byte identity evidence only'), 'source-byte workflow must upload evidence rather than source media');
expect(byteEvidenceScript.includes("hostname !== 'upload.wikimedia.org'") && byteEvidenceScript.includes('recorded sourceFileHash does not match freshly acquired bytes'), 'source-byte probe must pin host and revalidate recorded hashes');
expect(!hallPage.includes('@react-three/') && !hallPage.includes("from 'three'") && !hallPage.includes('from "three"'), 'HallPage route shell must remain free of direct Three/R3F imports');

if (failures.length) {
  console.error('Hall Pushkin acquisition validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Hall Pushkin acquisition authority passed through ${contract.phase}: historical source-byte evidence remains byte-frozen and non-production, while the separate owner-directed web slice stays documentary-free.`);
