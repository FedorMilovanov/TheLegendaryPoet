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
  'assetId',
  'poetId',
  'kind',
  'sourceTitle',
  'sourceInstitution',
  'sourceUrlOrArchiveAddress',
  'objectIdOrCallNumber',
  'sourceDate',
  'rightsStatus',
  'rightsBasis',
  'creditLine',
  'sourceFileHash',
  'runtimeAssetPath',
  'verificationStatus',
  'notes',
];
const VALID_STATUSES = new Set(['candidate','source-verified','rights-pending','approved','blocked','retired']);
const SHA256 = /^sha256:[a-f0-9]{64}$/;

expect(policy.includes('Each documentary asset eventually receives a machine-readable or validator-consumable record containing at least:'), 'RIGHTS_REGISTER must keep explicit canonical record requirement');
for (const field of REQUIRED_RECORD_FIELDS) {
  expect(policy.includes(`\n${field}\n`) || policy.includes(`\n${field}\r\n`), `RIGHTS_REGISTER required field missing from policy text: ${field}`);
}
expect(policy.includes('Only `approved` documentary assets may enter the production Hall manifest.'), 'RIGHTS_REGISTER must retain approved-only production manifest rule');

expect(packageJson.scripts?.['validate:hall-pushkin-rights-policy-schema'] === 'tsx scripts/validate-hall-pushkin-rights-policy-schema.ts', 'package script validate:hall-pushkin-rights-policy-schema must be registered exactly');
expect((packageJson.scripts?.check ?? '').includes('validate:hall-pushkin-rights-policy-schema'), 'npm check must run canonical Pushkin rights-record schema validator');
for (const [name, workflow] of [['CI',ci],['Project Contracts',projectContracts],['Hall tooling',hallWorkflow]] as const) {
  expect(workflow.includes('validate:hall-pushkin-rights-policy-schema'), `${name} workflow must run canonical Pushkin rights-record schema validator`);
}
expect(hallWorkflow.includes(`'${validatorPath}'`), 'Hall workflow paths must trigger on canonical Pushkin rights-record schema validator changes');

const assets = Array.isArray(rights.assets) ? rights.assets : [];
expect(assets.length > 0, 'Pushkin rights registry must contain documentary records');

for (const asset of assets) {
  const id = asset?.assetId ?? '<unknown>';
  for (const field of REQUIRED_RECORD_FIELDS) {
    expect(hasOwn(asset, field), `${id} must expose canonical top-level rights field ${field}`);
  }

  expect(asset.poetId === 'alexander-pushkin', `${id} canonical poetId must be alexander-pushkin`);
  expect(typeof asset.kind === 'string' && asset.kind.length > 0, `${id} kind must be non-empty`);
  expect(typeof asset.sourceTitle === 'string' && asset.sourceTitle.length > 0, `${id} sourceTitle must be non-empty`);
  expect(typeof asset.sourceUrlOrArchiveAddress === 'string' && /^https:\/\//.test(asset.sourceUrlOrArchiveAddress), `${id} sourceUrlOrArchiveAddress must be an explicit HTTPS source`);
  expect(typeof asset.sourceDate === 'string' && asset.sourceDate.length > 0, `${id} sourceDate must be present`);
  expect(typeof asset.sourceAccessedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(asset.sourceAccessedAt), `${id} sourceAccessedAt must preserve audit date YYYY-MM-DD`);
  expect(VALID_STATUSES.has(asset.rightsStatus), `${id} rightsStatus is invalid`);
  expect(VALID_STATUSES.has(asset.verificationStatus), `${id} verificationStatus is invalid`);
  expect(typeof asset.rightsBasis === 'string' && asset.rightsBasis.length > 20, `${id} rightsBasis must explain the current publication disposition`);
  expect(Array.isArray(asset.notes) && asset.notes.length > 0 && asset.notes.every((note: unknown) => typeof note === 'string' && note.length > 0), `${id} notes must be a non-empty string array`);

  expect(asset.rightsStatus === asset.reproduction?.status, `${id} top-level rightsStatus must mirror reproduction.status`);
  expect(asset.objectIdOrCallNumber === asset.objectProvenance?.objectIdOrCallNumber, `${id} top-level objectIdOrCallNumber must mirror object provenance`);
  expect(asset.sourceFileHash === asset.reproduction?.sourceFileHash, `${id} top-level sourceFileHash must mirror reproduction evidence`);
  expect(asset.runtimeAssetPath === asset.reproduction?.runtimeAssetPath, `${id} top-level runtimeAssetPath must mirror reproduction evidence`);

  if (asset.objectProvenance?.status === 'source-verified') {
    expect(asset.sourceInstitution != null && typeof asset.sourceInstitution === 'string' && asset.sourceInstitution.length > 0, `${id} source-verified object requires sourceInstitution`);
    expect(asset.objectIdOrCallNumber != null && typeof asset.objectIdOrCallNumber === 'string' && asset.objectIdOrCallNumber.length > 0, `${id} source-verified object requires objectIdOrCallNumber`);
    expect(asset.sourceUrlOrArchiveAddress === asset.objectProvenance?.objectUrl, `${id} source-verified top-level source URL must mirror exact object provenance URL`);
  }

  if (asset.sourceFileHash != null) {
    expect(SHA256.test(asset.sourceFileHash), `${id} acquired sourceFileHash must be exact sha256:<64 hex>`);
  }

  if (asset.verificationStatus === 'approved') {
    expect(asset.rightsStatus === 'approved', `${id} approved verification requires approved rightsStatus`);
    expect(asset.objectProvenance?.status === 'source-verified', `${id} approved record requires source-verified object identity`);
    expect(asset.reproduction?.status === 'approved', `${id} approved record requires approved reproduction status`);
    expect(typeof asset.creditLine === 'string' && asset.creditLine.length > 0, `${id} approved record requires final creditLine`);
    expect(SHA256.test(asset.sourceFileHash ?? ''), `${id} approved record requires exact sourceFileHash`);
    expect(/^\/hall\/v3\//.test(asset.runtimeAssetPath ?? ''), `${id} approved record requires /hall/v3/ runtimeAssetPath`);
    expect(asset.productionManifestEligible === true, `${id} approved record must be production-manifest eligible`);
  } else {
    expect(asset.creditLine == null, `${id} non-approved record must not claim a final creditLine`);
    expect(asset.runtimeAssetPath == null, `${id} non-approved record must not claim a runtimeAssetPath`);
    expect(asset.productionManifestEligible === false, `${id} non-approved record must remain production-manifest ineligible`);
  }

  if (asset.verificationStatus === 'blocked') {
    expect(asset.objectProvenance?.status === 'blocked' || asset.reproduction?.status === 'blocked', `${id} blocked record must identify a blocked evidence dimension`);
  }
}

const portrait = assets.find((asset: any) => asset.assetId === 'pushkin-kiprensky-1827-portrait');
expect(portrait?.sourceUrlOrArchiveAddress === 'https://artsandculture.google.com/asset/portrait-of-a-s-pushkin/GwHXH-oqLPXL8g', 'Kiprensky canonical source URL drifted');
expect((portrait?.objectIdOrCallNumber ?? '').includes('4574813') && (portrait?.objectIdOrCallNumber ?? '').includes('168'), 'Kiprensky canonical record must retain State Catalogue ID and Tretyakov accession');
expect(portrait?.rightsStatus === 'rights-pending' && portrait?.sourceFileHash == null && portrait?.runtimeAssetPath == null, 'Kiprensky canonical record must remain rights-pending/unacquired');

const onegin = assets.find((asset: any) => asset.assetId === 'pushkin-onegin-1833-edition');
expect(onegin?.sourceUrlOrArchiveAddress === 'https://search.rsl.ru/ru/record/01003570012', '1833 Onegin canonical RSL source URL drifted');
expect((onegin?.objectIdOrCallNumber ?? '').includes('01003570012'), '1833 Onegin canonical record must retain RSL record identity');
expect(onegin?.rightsStatus === 'rights-pending' && onegin?.sourceFileHash == null && onegin?.runtimeAssetPath == null, '1833 Onegin canonical record must remain rights-pending/unacquired');

const weak = assets.find((asset: any) => asset.assetId === 'pushkin-onegin-autograph-weak-mirror');
expect(weak?.rightsStatus === 'blocked' && weak?.verificationStatus === 'blocked', 'weak autograph canonical record must remain blocked');
expect(weak?.objectIdOrCallNumber == null && weak?.sourceInstitution == null, 'weak autograph record must not invent institutional identity');
expect(weak?.sourceFileHash == null && weak?.runtimeAssetPath == null, 'weak autograph record must not acquire/ship current weak mirror');

if (failures.length) {
  console.error('Hall Pushkin canonical rights-record schema validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Hall Pushkin canonical rights-record schema passed: repository policy fields and validator wiring are explicit, evidence mirrors are consistent, and zero current records are production-approved.');
