import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { yeseninPartOneRealVisualsPassSix } from '../src/data/essays/yeseninPartOneRealVisualsPassSix';

const root = process.cwd();
const visualPath = 'research/yesenin/PART_ONE_VISUAL_BRIEFS_PASS6.md';
const licensePath = 'research/yesenin/PART_ONE_REAL_VISUAL_LICENSE_LEDGER_PASS6.md';
const baselinePath = 'research/yesenin/PART_ONE_REAL_VISUAL_HASH_BASELINE_PASS6.md';
const visual = readFileSync(resolve(root, visualPath), 'utf8');
const license = readFileSync(resolve(root, licensePath), 'utf8');
const baseline = readFileSync(resolve(root, baselinePath), 'utf8');
const fail = (message: string): never => {
  throw new Error(`[yesenin-part-one-real-visuals-pass6] ${message}`);
};

if (yeseninPartOneRealVisualsPassSix.length !== 8) {
  fail(`expected eight real visual records, found ${yeseninPartOneRealVisualsPassSix.length}`);
}

const ids = yeseninPartOneRealVisualsPassSix.map((record) => record.id);
if (new Set(ids).size !== ids.length) fail('real visual IDs must be unique');
const fileUrls = new Set<string>();
const hashes = new Set<string>();

for (const [index, record] of yeseninPartOneRealVisualsPassSix.entries()) {
  const expectedId = `VIS-YE1-P6-${String(index + 1).padStart(3, '0')}`;
  if (record.id !== expectedId) fail(`expected ${expectedId}, found ${record.id}`);
  if (record.renderMode !== 'numbered-real-thumbnail') {
    fail(`${record.id} must use numbered-real-thumbnail mode`);
  }
  if (record.productionAuthorized !== false) {
    fail(`${record.id} must remain productionUnauthorized`);
  }
  if (!record.sourcePageUrl.startsWith('https://')) {
    fail(`${record.id} must have an HTTPS source page`);
  }
  if (!record.acquiredFileUrl.startsWith('https://')) {
    fail(`${record.id} must have an HTTPS acquired-file URL`);
  }
  if (fileUrls.has(record.acquiredFileUrl)) fail(`${record.id} duplicates an acquired-file URL`);
  fileUrls.add(record.acquiredFileUrl);
  if (!Number.isInteger(record.width) || record.width <= 0) fail(`${record.id} has invalid width`);
  if (!Number.isInteger(record.height) || record.height <= 0) fail(`${record.id} has invalid height`);
  if (!Number.isInteger(record.byteSize) || record.byteSize < 2_000) {
    fail(`${record.id} has invalid byte baseline`);
  }
  if (!/^[a-f0-9]{64}$/.test(record.sha256)) fail(`${record.id} has invalid SHA-256`);
  if (hashes.has(record.sha256)) fail(`${record.id} duplicates another original SHA-256`);
  hashes.add(record.sha256);
  if (record.controllingSourceIds.length === 0) {
    fail(`${record.id} must have at least one controlling source ID`);
  }
  if (record.note.length < 80) fail(`${record.id} provenance note is too short`);

  const visualOccurrences = visual.split(`\`${record.id}\``).length - 1;
  if (visualOccurrences !== 1) {
    fail(`${record.id} must appear exactly once in the visual registry; found ${visualOccurrences}`);
  }

  const licenseOccurrences = license.split(`\`${record.id}\``).length - 1;
  if (licenseOccurrences !== 1) {
    fail(`${record.id} must appear exactly once in the license ledger; found ${licenseOccurrences}`);
  }

  const baselineOccurrences = baseline.split(`\`${record.id}\``).length - 1;
  if (baselineOccurrences !== 1) {
    fail(`${record.id} must appear exactly once in the hash baseline; found ${baselineOccurrences}`);
  }
  if (!baseline.includes(`\`${record.sha256}\``)) {
    fail(`${record.id} SHA-256 is absent from the hash baseline`);
  }
  if (!baseline.includes(`${record.width}×${record.height}`)) {
    fail(`${record.id} dimensions are absent from the hash baseline`);
  }
}

for (const forbidden of [
  'Фотореалистичная 16:9 реконструкция',
  'Кинематографическая 16:9 реконструкция',
  'Реалистичный research-table shot',
  'сгенерированное лицо за новый найденный снимок',
  'Исторически правдоподобный печатный цех',
] as const) {
  if (visual.includes(forbidden)) fail(`legacy synthetic brief returned: ${forbidden}`);
}

for (const required of [
  'NUMBERED-THUMBNAILS-ONLY',
  'NO-SYNTHETIC-SCENES',
  'только реальные миниатюры',
  'не генерировать ложный автограф',
  'В production пока не добавляется ни одно новое изображение',
  'SHA-256',
] as const) {
  if (!visual.includes(required)) fail(`real-visual policy is missing marker: ${required}`);
}

for (const required of [
  'REAL-OBJECTS-ONLY',
  'RIGHTS-SEPARATED',
  'NO-PRODUCTION-AUTHORIZATION',
  'productionAuthorized: false',
  'Public Domain Mark',
  'PD-RusEmpire',
  'ACQUIRED-HASHED / RIGHTS-UNRESOLVED',
] as const) {
  if (!license.includes(required)) fail(`license ledger is missing marker: ${required}`);
}

for (const required of [
  '8-REAL-ORIGINALS',
  'EXACT-BYTES',
  'EXACT-DIMENSIONS',
  'NUMBERED-CONTACT-SHEET',
  'b9b4afe04dc950eeb92f4b602aec8fc49a98f9d9ba5e2ada94715d362d8be47e',
] as const) {
  if (!baseline.includes(required)) fail(`hash baseline is missing marker: ${required}`);
}

const statusCounts = yeseninPartOneRealVisualsPassSix.reduce<Record<string, number>>(
  (counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1;
    return counts;
  },
  {},
);

if (
  statusCounts['public-domain-candidate'] !== 3 ||
  statusCounts['research-only'] !== 2 ||
  statusCounts['acquired-rights-unresolved'] !== 3
) {
  fail(`unexpected rights distribution: ${JSON.stringify(statusCounts)}`);
}

console.log(
  JSON.stringify(
    {
      realVisualRecords: yeseninPartOneRealVisualsPassSix.length,
      visualRegistryRecords: ids.length,
      licenseLedgerRecords: ids.length,
      hashBaselineRecords: ids.length,
      exactFileUrls: fileUrls.size,
      exactSha256Values: hashes.size,
      renderMode: 'numbered-real-thumbnail',
      statusCounts,
      productionAuthorized: false,
      syntheticScenesAllowed: false,
      generatedFacesAllowed: false,
      generatedDocumentsAllowed: false,
      byteBaselinesFrozen: true,
      dimensionBaselinesFrozen: true,
      sha256BaselinesFrozen: true,
    },
    null,
    2,
  ),
);
