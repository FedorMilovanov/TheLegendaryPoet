import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const hasOwn = (value: unknown, key: string) => Boolean(value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key));

const rightsPath = 'docs/hall-v3/pushkin-rights.json';
const policyPath = 'docs/hall-v3/RIGHTS_REGISTER.md';
const validatorPath = 'scripts/validate-hall-pushkin-rights-policy-schema.ts';
const rights = JSON.parse(read(rightsPath)) as any;
const policy = read(policyPath);
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string,string> };
const ci = read('.github/workflows/ci.yml');
const projectContracts = read('.github/workflows/project-contracts.yml');
const hallWorkflow = read('.github/workflows/hall-greybox-tooling.yml');

const REQUIRED_RECORD_FIELDS = [
  'assetId','poetId','kind','sourceTitle','sourceInstitution','sourceUrlOrArchiveAddress',
  'objectIdOrCallNumber','sourceDate','rightsStatus','rightsBasis','creditLine','sourceFileHash',
  'runtimeAssetPath','verificationStatus','notes',
];
const VALID_STATUSES = new Set(['candidate','source-verified','rights-pending','approved','blocked','retired']);
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const PORTRAIT_HASH = 'sha256:316d5f366a46f23cd0a181e570f2d09a6b0d12bc368dab18fdb394b8b8b8bf4b';
const ONEGIN_HASH = 'sha256:d629c10943cbf6428eabb194ee5c17c1b763c27108a2238eaf72fadb275643e5';

expect(policy.includes('Each documentary asset eventually receives a machine-readable or validator-consumable record containing at least:'), 'RIGHTS_REGISTER must keep explicit canonical record requirement');
for (const field of REQUIRED_RECORD_FIELDS) expect(policy.includes(`\n${field}\n`) || policy.includes(`\n${field}\r\n`), `RIGHTS_REGISTER required field missing: ${field}`);
expect(policy.includes('Only `approved` documentary assets may enter the production Hall manifest.'), 'RIGHTS_REGISTER must retain approved-only production manifest rule');

expect(packageJson.scripts?.['validate:hall-pushkin-rights-policy-schema'] === 'tsx scripts/validate-hall-pushkin-rights-policy-schema.ts', 'policy-schema package script must remain registered');
expect((packageJson.scripts?.check ?? '').includes('validate:hall-pushkin-rights-policy-schema'), 'npm check must run policy-schema validator');
for (const [name, workflow] of [['CI',ci],['Project Contracts',projectContracts],['Hall tooling',hallWorkflow]] as const) {
  expect(workflow.includes('validate:hall-pushkin-rights-policy-schema'), `${name} must run canonical rights schema validator`);
}
expect(hallWorkflow.includes(`'${validatorPath}'`), 'Hall workflow must trigger on canonical rights-schema validator changes');

const assets = Array.isArray(rights.assets) ? rights.assets : [];
expect(assets.length >= 4, 'Pushkin rights registry must retain current documentary records');
expect(new Set(assets.map((asset: any) => asset.assetId)).size === assets.length, 'documentary asset IDs must be unique');

for (const asset of assets) {
  const id = asset?.assetId ?? '<unknown>';
  for (const field of REQUIRED_RECORD_FIELDS) expect(hasOwn(asset, field), `${id} must expose canonical top-level field ${field}`);
  expect(asset.poetId === 'alexander-pushkin', `${id} canonical poetId must be alexander-pushkin`);
  expect(typeof asset.kind === 'string' && asset.kind.length > 0, `${id} kind must be non-empty`);
  expect(typeof asset.sourceTitle === 'string' && asset.sourceTitle.length > 0, `${id} sourceTitle must be non-empty`);
  expect(typeof asset.sourceUrlOrArchiveAddress === 'string' && /^https:\/\//.test(asset.sourceUrlOrArchiveAddress), `${id} source URL must be explicit HTTPS`);
  expect(typeof asset.sourceDate === 'string' && asset.sourceDate.length > 0, `${id} sourceDate must be present`);
  expect(typeof asset.sourceAccessedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(asset.sourceAccessedAt), `${id} sourceAccessedAt must be YYYY-MM-DD`);
  expect(VALID_STATUSES.has(asset.rightsStatus) && VALID_STATUSES.has(asset.verificationStatus), `${id} status is invalid`);
  expect(typeof asset.rightsBasis === 'string' && asset.rightsBasis.length > 20, `${id} rightsBasis must explain current disposition`);
  expect(Array.isArray(asset.notes) && asset.notes.length > 0 && asset.notes.every((note: unknown) => typeof note === 'string' && note.length > 0), `${id} notes must be a non-empty string array`);

  expect(asset.rightsStatus === asset.reproduction?.status, `${id} top-level rightsStatus must mirror reproduction.status`);
  expect(asset.objectIdOrCallNumber === asset.objectProvenance?.objectIdOrCallNumber, `${id} top-level object ID must mirror object provenance`);
  expect(asset.sourceFileHash === asset.reproduction?.sourceFileHash, `${id} top-level sourceFileHash must mirror reproduction evidence`);
  expect(asset.runtimeAssetPath === asset.reproduction?.runtimeAssetPath, `${id} top-level runtimeAssetPath must mirror reproduction evidence`);

  if (asset.objectProvenance?.status === 'source-verified') {
    expect(typeof asset.sourceInstitution === 'string' && asset.sourceInstitution.length > 0, `${id} source-verified object requires sourceInstitution`);
    expect(typeof asset.objectIdOrCallNumber === 'string' && asset.objectIdOrCallNumber.length > 0, `${id} source-verified object requires object ID/call number`);
    expect(asset.sourceUrlOrArchiveAddress === asset.objectProvenance?.objectUrl, `${id} source-verified top-level URL must mirror object provenance URL`);
  }

  if (asset.sourceFileHash != null) expect(SHA256.test(asset.sourceFileHash), `${id} acquired sourceFileHash must be exact sha256:<64 hex>`);

  if (asset.verificationStatus === 'approved') {
    expect(asset.rightsStatus === 'approved' && asset.reproduction?.status === 'approved', `${id} approved verification requires approved rights`);
    expect(asset.objectProvenance?.status === 'source-verified', `${id} approved record requires verified object identity`);
    expect(typeof asset.creditLine === 'string' && asset.creditLine.length > 0, `${id} approved record requires final creditLine`);
    expect(SHA256.test(asset.sourceFileHash ?? ''), `${id} approved record requires exact sourceFileHash`);
    expect(/^\/hall\/v3\//.test(asset.runtimeAssetPath ?? ''), `${id} approved record requires /hall/v3/ runtimeAssetPath`);
    expect(asset.productionManifestEligible === true, `${id} approved record must be production-manifest eligible`);
  } else {
    expect(asset.creditLine == null, `${id} non-approved record must not claim final creditLine`);
    expect(asset.runtimeAssetPath == null, `${id} non-approved record must not claim runtimeAssetPath`);
    expect(asset.productionManifestEligible === false, `${id} non-approved record must remain manifest-ineligible`);
  }

  if (asset.verificationStatus === 'blocked') expect(asset.objectProvenance?.status === 'blocked' || asset.reproduction?.status === 'blocked', `${id} blocked record must identify a blocked evidence dimension`);
}

const portrait = assets.find((asset: any) => asset.assetId === 'pushkin-kiprensky-1827-portrait');
expect(portrait?.sourceUrlOrArchiveAddress === 'https://artsandculture.google.com/asset/portrait-of-a-s-pushkin/GwHXH-oqLPXL8g', 'Kiprensky canonical source URL drifted');
expect((portrait?.objectIdOrCallNumber ?? '').includes('4574813') && (portrait?.objectIdOrCallNumber ?? '').includes('168'), 'Kiprensky object IDs drifted');
expect(portrait?.rightsStatus === 'rights-pending' && portrait?.verificationStatus === 'rights-pending', 'Kiprensky canonical rights must remain pending');
expect(portrait?.sourceFileHash === PORTRAIT_HASH && portrait?.runtimeAssetPath == null && portrait?.creditLine == null, 'Kiprensky canonical byte hash must be verified while approval fields remain unset');
expect(portrait?.reproduction?.acquisitionStatus === 'source-bytes-verified-rights-pending', 'Kiprensky acquisition status must separate bytes from rights');

const onegin = assets.find((asset: any) => asset.assetId === 'pushkin-onegin-1833-edition');
expect(onegin?.sourceUrlOrArchiveAddress === 'https://search.rsl.ru/ru/record/01003570012', '1833 Onegin canonical RSL source URL drifted');
expect((onegin?.objectIdOrCallNumber ?? '').includes('01003570012'), '1833 Onegin canonical identity drifted');
expect(onegin?.rightsStatus === 'rights-pending' && onegin?.verificationStatus === 'rights-pending', '1833 Onegin canonical rights must remain pending');
expect(onegin?.sourceFileHash === ONEGIN_HASH && onegin?.runtimeAssetPath == null && onegin?.creditLine == null, '1833 Onegin canonical byte hash must be verified while approval fields remain unset');
expect(onegin?.reproduction?.acquisitionStatus === 'source-bytes-verified-rights-pending', '1833 Onegin acquisition status must separate bytes from rights');

const pushkinHouse = assets.find((asset: any) => asset.assetId === 'pushkin-house-onegin-self-portrait-1824');
expect(pushkinHouse?.objectIdOrCallNumber === 'Ф. 244, оп. 12, ед. хр. 6' && pushkinHouse?.objectProvenance?.status === 'source-verified', 'Pushkin House object provenance must remain exact/source-verified');
expect(pushkinHouse?.rightsStatus === 'rights-pending' && pushkinHouse?.sourceFileHash == null && pushkinHouse?.runtimeAssetPath == null && pushkinHouse?.creditLine == null, 'Pushkin House copy/rights must remain unresolved');
expect(pushkinHouse?.reproduction?.institutionalRequest?.status === 'not-submitted', 'Pushkin House request must remain not-submitted');

const weak = assets.find((asset: any) => asset.assetId === 'pushkin-onegin-autograph-weak-mirror');
expect(weak?.rightsStatus === 'blocked' && weak?.verificationStatus === 'blocked' && weak?.objectProvenance?.status === 'blocked', 'weak autograph canonical record must remain blocked');
expect(weak?.objectIdOrCallNumber == null && weak?.sourceInstitution == null && weak?.sourceFileHash == null && weak?.runtimeAssetPath == null, 'weak autograph record must not invent institution/hash/runtime identity');

if (failures.length) {
  console.error('Hall Pushkin canonical rights-record schema validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Hall Pushkin canonical rights-record schema passed: two exact byte hashes are evidence-backed while final credit, rights approval and runtime eligibility remain fail-closed.');
