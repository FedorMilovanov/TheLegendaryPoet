import { yeseninPartOnePageWitnesses } from '../src/data/essays/yeseninPartOnePageWitnesses';
import {
  yeseninPartOneFebAcquiredRecords,
  yeseninPartOneFebAcquisitionRun11,
  yeseninPartOneFebPendingTargets,
  yeseninPartOneFebSirenaDiscoveryRun21,
} from '../src/data/essays/yeseninPartOneFebAcquisition';

const errors: string[] = [];
const witnessIds = new Set(yeseninPartOnePageWitnesses.map((witness) => witness.id));
const recordIds = new Set<string>();
const urls = new Set<string>();
const hashes = new Set<string>();

function fail(message: string) {
  errors.push(message);
}

if (yeseninPartOneFebAcquisitionRun11.conclusion !== 'success') {
  fail('run 11 conclusion must remain success');
}
if (yeseninPartOneFebAcquisitionRun11.technicalErrorCount !== 0) {
  fail('run 11 technical-error count must remain zero');
}
if (yeseninPartOneFebAcquisitionRun11.exactImageCount !== 6) {
  fail('run 11 exact-image count must remain six');
}
if (yeseninPartOneFebAcquisitionRun11.exactBytesCompleteTargetCount !== 3) {
  fail('run 11 historical complete-target count must remain three');
}
if (!/^[a-f0-9]{64}$/.test(yeseninPartOneFebAcquisitionRun11.artifactDigest)) {
  fail('run 11 artifact digest must be a lowercase SHA-256');
}

if (yeseninPartOneFebSirenaDiscoveryRun21.conclusion !== 'success') {
  fail('run 21 Sirena discovery conclusion must remain success');
}
if (!/^[a-f0-9]{64}$/.test(yeseninPartOneFebSirenaDiscoveryRun21.artifactDigest)) {
  fail('run 21 artifact digest must be a lowercase SHA-256');
}
if (yeseninPartOneFebSirenaDiscoveryRun21.discoveredImageCount !== 1) {
  fail('run 21 must retain exactly one role-confirmed Sirena cover image');
}
if (yeseninPartOneFebSirenaDiscoveryRun21.discoveredImageUrl !== 'https://feb-web.ru/feb/esenin/pictures/El2-6212.jpg') {
  fail('run 21 exact Sirena image URL changed');
}
if (!yeseninPartOneFebSirenaDiscoveryRun21.exactAnchorOnclick.includes("showimg('../../pictures/El2-6212.jpg'")) {
  fail('run 21 exact onclick route evidence disappeared');
}
if (yeseninPartOneFebSirenaDiscoveryRun21.nonBlockingTechnicalErrorCount !== 1) {
  fail('run 21 non-blocking generic-route timeout count changed');
}

if (yeseninPartOneFebAcquiredRecords.length !== 7) {
  fail(`accepted FEB record count changed: ${yeseninPartOneFebAcquiredRecords.length} !== 7`);
}

for (const record of yeseninPartOneFebAcquiredRecords) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id)) {
    fail(`${record.id}: record id must be lowercase kebab-case`);
  }
  if (recordIds.has(record.id)) fail(`${record.id}: duplicate record id`);
  recordIds.add(record.id);

  if (!witnessIds.has(record.witnessId)) {
    fail(`${record.id}: unknown witness id ${record.witnessId}`);
  }
  if (!record.exactImageUrl.startsWith('https://feb-web.ru/')) {
    fail(`${record.id}: exact image URL must remain on the FEB origin`);
  }
  if (!record.sourcePageUrl.startsWith('https://feb-web.ru/')) {
    fail(`${record.id}: source page URL must remain on the FEB origin`);
  }
  if (urls.has(record.exactImageUrl)) fail(`${record.id}: duplicate exact image URL`);
  urls.add(record.exactImageUrl);

  if (!/^[a-f0-9]{64}$/.test(record.sourceSha256)) {
    fail(`${record.id}: source SHA-256 is malformed`);
  }
  if (hashes.has(record.sourceSha256)) fail(`${record.id}: duplicate source SHA-256`);
  hashes.add(record.sourceSha256);

  if (record.layer !== 'published-page') {
    fail(`${record.id}: evidence layer must remain published-page`);
  }
  if (record.rightsStatus !== 'unresolved') {
    fail(`${record.id}: rights must remain unresolved until separately verified`);
  }
  if (record.archiveOriginalInspected !== false) {
    fail(`${record.id}: archive-original inspection must not be inferred from FEB bytes`);
  }
  if (record.productionReuseAuthorized !== false) {
    fail(`${record.id}: production reuse must remain unauthorized`);
  }
  if (record.limitations.length === 0) {
    fail(`${record.id}: evidence limitations are mandatory`);
  }
}

const exactPages = yeseninPartOneFebAcquiredRecords.map((record) => record.printedPage).sort((a, b) => a - b);
const requiredPages = [545, 621, 673, 688, 689, 690, 691];
for (const page of requiredPages) {
  if (!exactPages.includes(page)) fail(`accepted exact printed page ${page} disappeared`);
}

const school = yeseninPartOneFebAcquiredRecords.find((record) => record.printedPage === 545);
if (!school?.sourceSha256.startsWith('cc608f256a41')) {
  fail('school-certificate page 545 controlling hash changed');
}
const assignment = yeseninPartOneFebAcquiredRecords.find((record) => record.printedPage === 673);
if (!assignment?.sourceSha256.startsWith('b9ce49137fa1')) {
  fail('train-assignment page 673 controlling hash changed');
}
const personnelPhoto = yeseninPartOneFebAcquiredRecords.find((record) => record.printedPage === 690);
if (!personnelPhoto?.limitations.some((value) => value.includes('media-provenance'))) {
  fail('page 690 separate media-provenance boundary disappeared');
}
const sirenaCover = yeseninPartOneFebAcquiredRecords.find((record) => record.printedPage === 621);
if (sirenaCover?.witnessId !== 'wit-ye1-imagist-sirena-cover-621') {
  fail('Sirena cover is not attached to the controlling page-621 witness');
}
if (sirenaCover?.exactImageUrl !== 'https://feb-web.ru/feb/esenin/pictures/El2-6212.jpg') {
  fail('Sirena exact image URL changed');
}
if (sirenaCover?.sourceSha256 !== 'a316190933bcbdb433c835359d971854176a32d808787bcdc0050aad5b501cb4') {
  fail('Sirena cover controlling SHA-256 changed');
}
if (sirenaCover?.width !== 237 || sirenaCover?.height !== 309 || sirenaCover?.byteSize !== 18_693) {
  fail('Sirena cover byte/dimension evidence changed');
}
if (!sirenaCover?.limitations.some((value) => value.includes('internal declaration pages'))) {
  fail('Sirena internal-page boundary disappeared from the accepted cover record');
}
if (!sirenaCover?.limitations.some((value) => value.includes('Sovetskaya strana'))) {
  fail('Sovetskaya strana two-witness boundary disappeared from the accepted cover record');
}

if (yeseninPartOneFebPendingTargets.length !== 2) {
  fail('two declaration-publication object witnesses must remain pending');
}
const pendingByWitness = new Map(yeseninPartOneFebPendingTargets.map((target) => [target.witnessId, target]));
for (const witnessId of [
  'wit-ye1-imagist-sirena-internal-pages',
  'wit-ye1-imagist-sovetskaya-strana-no3',
]) {
  const pending = pendingByWitness.get(witnessId);
  if (!pending) {
    fail(`${witnessId}: pending declaration witness disappeared`);
    continue;
  }
  if (pending.status !== 'object-facsimile-not-acquired') {
    fail(`${witnessId}: pending status must remain object-facsimile-not-acquired`);
  }
  if (pending.limitations.length === 0) {
    fail(`${witnessId}: pending limitations are mandatory`);
  }
}
if (yeseninPartOneFebPendingTargets.some((target) => target.witnessId === 'wit-ye1-imagist-sirena-cover-621')) {
  fail('the role-confirmed Sirena cover must no longer remain in the pending registry');
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log(
  `Yesenin FEB acquisition validation: runs ${yeseninPartOneFebAcquisitionRun11.runNumber}/`
  + `${yeseninPartOneFebSirenaDiscoveryRun21.runNumber}, `
  + `${yeseninPartOneFebAcquiredRecords.length} exact published-page records, `
  + `${requiredPages.length} guarded image pages, rights unresolved and production reuse unauthorized; `
  + `${yeseninPartOneFebPendingTargets.length} declaration-publication object witnesses remain pending.`,
);
