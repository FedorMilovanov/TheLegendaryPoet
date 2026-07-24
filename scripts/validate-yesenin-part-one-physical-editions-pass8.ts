import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { yeseninPartOnePhysicalEditionAcquisitionsPassEight } from '../src/data/essays/yeseninPartOnePhysicalEditionAcquisitionsPassEight';
import { yeseninPartOnePhysicalWitnessesPassSix } from '../src/data/essays/yeseninPartOnePhysicalWitnessesPassSix';

const root = process.cwd();
const read = (path: string): string => readFileSync(resolve(root, path), 'utf8');
const fail = (message: string): never => {
  throw new Error(`[yesenin-physical-editions-pass8] ${message}`);
};

const acquisitions = yeseninPartOnePhysicalEditionAcquisitionsPassEight;
if (acquisitions.length !== 2) {
  fail(`expected exactly two acquired physical editions, found ${acquisitions.length}`);
}

const ids = acquisitions.map((record) => record.id);
const objectIds = acquisitions.map((record) => record.objectId);
if (new Set(ids).size !== ids.length) fail('acquisition IDs must be unique');
if (new Set(objectIds).size !== objectIds.length) fail('object IDs must be unique');

for (const record of acquisitions) {
  if (!record.catalogueUrl.startsWith('https://rusneb.ru/catalog/')) {
    fail(`${record.id} must point to an exact NEB catalogue record`);
  }
  if (!/^[a-f0-9]{64}$/u.test(record.sha256)) {
    fail(`${record.id} has an invalid SHA-256`);
  }
  if (record.bytes < 1_000_000 || record.pdfFrames < 10) {
    fail(`${record.id} has implausible physical extent`);
  }
  if (
    record.facsimileBytesAcquired !== true ||
    record.facsimileVisuallyInspected !== true ||
    record.ocrUsedForEvidence !== false ||
    record.syntheticContentUsed !== false ||
    record.archiveOriginalInspected !== false ||
    record.productionAuthorized !== false
  ) {
    fail(`${record.id} violates the acquired-facsimile evidence boundary`);
  }
  if (record.rightsState !== 'open-digital-facsimile / reproduction-rights-unresolved') {
    fail(`${record.id} silently changes the rights state`);
  }
  if (record.inspectedFrameRanges.length < 3 || record.verifiedContents.length < 3) {
    fail(`${record.id} lacks a usable inspection map`);
  }
}

const radunitsa = acquisitions.find((record) => record.id === 'PWA8-YE1-RADUNITSA-1916');
if (
  !radunitsa ||
  radunitsa.catalogueCode !== '000199_000009_004210209' ||
  radunitsa.pdfFrames !== 35 ||
  radunitsa.bytes !== 49_288_163 ||
  radunitsa.sha256 !== '761ba9c1eb41e0d6e146618c8d5cb30bb79485d02587e0161523a819cd753185' ||
  !radunitsa.linkedSourceIds.includes('ye1-radunitsa-first-edition-neb')
) {
  fail('Radunitsa 1916 exact-object baseline drifted');
}

const ispoved = acquisitions.find((record) => record.id === 'PWA8-YE1-ISPOVED-1921');
if (
  !ispoved ||
  ispoved.catalogueCode !== '000200_000018_RU_NLR_A1SV_46698' ||
  ispoved.pdfFrames !== 16 ||
  ispoved.bytes !== 3_309_388 ||
  ispoved.sha256 !== '17917962290fdd24eedd52fdd76d84c7c1bdf0898f53a41c52af555691f3116c' ||
  ispoved.supersedesHoldId !== 'PW6-YE1-ISPOVED-1921'
) {
  fail('Ispoved khuligana 1921 exact-object baseline drifted');
}

for (const title of ['Хулиган', 'Сорокоуст', 'Исповедь хулигана'] as const) {
  if (!ispoved.verifiedContents.some((entry) => entry.startsWith(title))) {
    fail(`Ispoved physical composition lost ${title}`);
  }
}

const oldIspovedHold = yeseninPartOnePhysicalWitnessesPassSix.find(
  (record) => record.id === 'PW6-YE1-ISPOVED-1921',
);
if (!oldIspovedHold) fail('the original Ispoved physical HOLD disappeared');
if (oldIspovedHold.facsimileBytesAcquired || oldIspovedHold.facsimileVisuallyInspected) {
  fail('the historical pass-six queue was rewritten instead of superseded by the acquisition overlay');
}

const ledger = read('research/yesenin/PART_ONE_NEB_PHYSICAL_EDITIONS_PASS8.md');
const acquisitionScript = read('scripts/acquire-yesenin-neb-editions-pass8.py');
const normalizedAcquisitionScript = acquisitionScript.replaceAll('_', '');
for (const required of [
  '2-REAL-NEB-PDFS / EXACT-BYTES / FRAME-MAP-COLLATED / NO-OCR / NOT-YET-PUBLIC',
  radunitsa.sha256,
  ispoved.sha256,
  'PDF packaging: 35 кадров',
  'PDF packaging: 16 кадров',
  '`ocrUsed=false`',
  '`productionAuthorized=false`',
] as const) {
  if (!ledger.includes(required)) fail(`physical-edition ledger is missing ${required}`);
}

for (const record of acquisitions) {
  for (const required of [record.catalogueCode, record.sha256, String(record.bytes), String(record.pdfFrames)]) {
    if (!normalizedAcquisitionScript.includes(required)) {
      fail(`acquisition script is missing frozen ${record.id} value ${required}`);
    }
  }
}

console.log(
  JSON.stringify(
    {
      acquiredPhysicalEditions: acquisitions.length,
      historicalQueueRecords: yeseninPartOnePhysicalWitnessesPassSix.length,
      exactBytesFrozen: true,
      exactSha256Frozen: true,
      exactFrameCountsFrozen: true,
      facsimileBytesAcquired: acquisitions.filter((record) => record.facsimileBytesAcquired).length,
      visuallyInspected: acquisitions.filter((record) => record.facsimileVisuallyInspected).length,
      archiveOriginalsInspected: 0,
      ocrUsedForEvidence: false,
      syntheticContentUsed: false,
      productionAuthorized: false,
      objects: acquisitions.map((record) => ({
        id: record.id,
        objectId: record.objectId,
        pdfFrames: record.pdfFrames,
        bytes: record.bytes,
        sha256: record.sha256,
      })),
    },
    null,
    2,
  ),
);
