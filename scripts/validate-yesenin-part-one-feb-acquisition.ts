import { yeseninPartOnePageWitnesses } from '../src/data/essays/yeseninPartOnePageWitnesses';
import {
  yeseninPartOneFebAcquiredRecords,
  yeseninPartOneFebAcquisitionRun11,
  yeseninPartOneFebPendingTargets,
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
  fail('run 11 complete-target count must remain three until Sirena is acquired');
}
if (!/^[a-f0-9]{64}$/.test(yeseninPartOneFebAcquisitionRun11.artifactDigest)) {
  fail('run 11 artifact digest must be a lowercase SHA-256');
}

if (yeseninPartOneFebAcquiredRecords.length !== 6) {
  fail(`accepted FEB record count changed: ${yeseninPartOneFebAcquiredRecords.length} !== 6`);
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
const requiredPages = [545, 673, 688, 689, 690, 691];
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

if (yeseninPartOneFebPendingTargets.length !== 1) {
  fail('Sirena pending-target count must remain one until exact role-confirmed bytes are acquired');
}
const sirena = yeseninPartOneFebPendingTargets[0];
if (sirena.witnessId !== 'wit-ye1-imagist-sirena-cover-621') {
  fail('Sirena pending witness id changed');
}
if (sirena.printedPage !== 621 || sirena.status !== 'route-and-bytes-pending') {
  fail('Sirena page 621 must remain route-and-bytes-pending');
}
if (sirena.rejectedGuesses.length !== 3) {
  fail('Sirena rejected 404 route evidence disappeared');
}
if (!sirena.limitations.some((value) => value.includes('two different objects'))) {
  fail('Sirena two-object role-confirmation boundary disappeared');
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log(
  `Yesenin FEB acquisition validation: run ${yeseninPartOneFebAcquisitionRun11.runNumber}, `
  + `${yeseninPartOneFebAcquiredRecords.length} exact published-page records, `
  + `${requiredPages.length} guarded image pages, rights unresolved and production reuse unauthorized; `
  + 'Sirena page 621 remains pending.',
);
