import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  yeseninPartOnePhysicalEditionAcquisitionsPassEight,
  type YeseninPartOnePhysicalEditionAcquisitionPassEight,
} from '../src/data/essays/yeseninPartOnePhysicalEditionAcquisitionsPassEight';
import {
  yeseninPartOnePhysicalWitnessesPassSix,
  type YeseninPartOnePhysicalWitnessPassSix,
} from '../src/data/essays/yeseninPartOnePhysicalWitnessesPassSix';
import {
  yeseninPartOneActiveHistoricalWitnesses,
  yeseninPartOneEffectiveHistoricalWitnesses,
  yeseninPartOnePhysicalWitnessEffectiveStateSummary,
  yeseninPartOneStandalonePhysicalEditionAcquisitions,
  yeseninPartOneSupersededHistoricalWitnesses,
} from '../src/data/essays/yeseninPartOnePhysicalWitnessEffectiveState';

const root = process.cwd();
const read = (path: string): string => readFileSync(resolve(root, path), 'utf8');
const fail = (message: string): never => {
  throw new Error(`[yesenin-effective-physical-witnesses] ${message}`);
};

const historicalRecords: readonly YeseninPartOnePhysicalWitnessPassSix[] =
  yeseninPartOnePhysicalWitnessesPassSix;
const acquisitions: readonly YeseninPartOnePhysicalEditionAcquisitionPassEight[] =
  yeseninPartOnePhysicalEditionAcquisitionsPassEight;
const summary = yeseninPartOnePhysicalWitnessEffectiveStateSummary;

if (historicalRecords.length !== 12) {
  fail(`expected 12 immutable historical records, found ${historicalRecords.length}`);
}
if (acquisitions.length !== 2) {
  fail(`expected two acquisition overlays, found ${acquisitions.length}`);
}
if (yeseninPartOneEffectiveHistoricalWitnesses.length !== historicalRecords.length) {
  fail('effective resolver must preserve one row per historical record');
}
if (
  summary.activeHistoricalHolds !== 11 ||
  summary.supersededHistoricalHolds !== 1 ||
  summary.standaloneAcquisitions !== 1 ||
  summary.acquiredFacsimiles !== 2 ||
  summary.archiveOriginalsInspected !== 0 ||
  summary.reproductionRightsResolved !== 0 ||
  summary.productionAuthorized !== false
) {
  fail(`effective summary drifted: ${JSON.stringify(summary)}`);
}

const historicalIds = historicalRecords.map((record) => record.id);
const effectiveIds = yeseninPartOneEffectiveHistoricalWitnesses.map(
  (record) => record.historicalRecord.id,
);
if (new Set(historicalIds).size !== historicalIds.length) {
  fail('historical witness IDs must be unique');
}
if (historicalIds.some((id, index) => effectiveIds[index] !== id)) {
  fail('effective resolver changed historical queue order or identity');
}

if (yeseninPartOneSupersededHistoricalWitnesses.length !== 1) {
  fail('exactly one historical HOLD must be superseded');
}
const superseded = yeseninPartOneSupersededHistoricalWitnesses[0];
if (
  superseded.historicalRecord.id !== 'PW6-YE1-ISPOVED-1921' ||
  superseded.supersededByAcquisitionId !== 'PWA8-YE1-ISPOVED-1921' ||
  superseded.supersededByObjectId !== 'NEB-YE1-ISPOVED-1921'
) {
  fail(`unexpected supersession edge: ${JSON.stringify(superseded)}`);
}
if (
  superseded.historicalRecord.facsimileBytesAcquired ||
  superseded.historicalRecord.facsimileVisuallyInspected ||
  superseded.historicalRecord.archiveOriginalInspected
) {
  fail('historical Ispoved HOLD was rewritten instead of superseded');
}

if (
  yeseninPartOneStandalonePhysicalEditionAcquisitions.length !== 1 ||
  yeseninPartOneStandalonePhysicalEditionAcquisitions[0].id !==
    'PWA8-YE1-RADUNITSA-1916'
) {
  fail('Radunitsa must remain the single standalone acquisition');
}

const expectedActiveIds = [
  'PW6-YE1-MATERIALY-110',
  'PW6-YE1-BENISLAVSKAYA-DIARY-BASIS',
  'PW6-YE1-MARIENGOF-1927',
  'PW6-YE1-MARIENGOF-1928',
  'PW6-YE1-TEATRALNAYA-MOSKVA-1921',
  'PW6-YE1-IZVESTIA-1921-SERIAL',
  'PW6-YE1-PRAVDA-1921-11-09',
  'PW6-YE1-NYPL-DUNCAN-PROGRAM',
  'PW6-YE1-NYPL-IRMA-DUNCAN',
  'PW6-YE1-REICH-DIVORCE',
  'PW6-YE1-DUNCAN-MARRIAGE',
] as const;
const activeIds = yeseninPartOneActiveHistoricalWitnesses.map((record) => record.id);
if (
  activeIds.length !== expectedActiveIds.length ||
  activeIds.some((id, index) => id !== expectedActiveIds[index])
) {
  fail(`active HOLD set drifted: ${activeIds.join(', ')}`);
}

const countBy = <T extends string>(values: readonly T[]): Record<T, number> =>
  values.reduce(
    (counts, value) => ({ ...counts, [value]: (counts[value] ?? 0) + 1 }),
    {} as Record<T, number>,
  );
const activeStateCounts = countBy(
  yeseninPartOneActiveHistoricalWitnesses.map((record) => record.state),
);
const activeLayerCounts = countBy(
  yeseninPartOneActiveHistoricalWitnesses.map((record) => record.layer),
);

const requiredStateCounts = {
  'academic-basis-identified': 2,
  'exact-object-located': 2,
  'serial-parent-located': 2,
  'archive-collection-located': 2,
  'request-required': 2,
  'still-unresolved': 1,
} as const;
for (const [state, expected] of Object.entries(requiredStateCounts)) {
  if ((activeStateCounts as Record<string, number>)[state] !== expected) {
    fail(`active state ${state} expected ${expected}, found ${(activeStateCounts as Record<string, number>)[state] ?? 0}`);
  }
}

const requiredLayerCounts = {
  'academic-commentary': 2,
  'bibliographic-object': 1,
  'digital-facsimile-route': 1,
  'serial-catalogue': 3,
  'archive-finding-aid': 2,
  'civil-record-target': 2,
} as const;
for (const [layer, expected] of Object.entries(requiredLayerCounts)) {
  if ((activeLayerCounts as Record<string, number>)[layer] !== expected) {
    fail(`active layer ${layer} expected ${expected}, found ${(activeLayerCounts as Record<string, number>)[layer] ?? 0}`);
  }
}

for (const record of historicalRecords) {
  if (record.productionReuseAuthorized !== false) {
    fail(`${record.id} silently changed historical production rights`);
  }
}
for (const record of acquisitions) {
  if (
    record.productionAuthorized !== false ||
    record.ocrUsedForEvidence !== false ||
    record.syntheticContentUsed !== false ||
    record.archiveOriginalInspected !== false ||
    record.rightsState !== 'open-digital-facsimile / reproduction-rights-unresolved'
  ) {
    fail(`${record.id} violates acquisition evidence or rights boundaries`);
  }
}

const ledgerPath =
  'research/yesenin/PART_ONE_PHYSICAL_WITNESS_EFFECTIVE_STATE_2026-07-25.md';
const ledger = read(ledgerPath);
for (const required of [
  '12 HISTORICAL-QUEUE-RECORDS / 2 ACQUISITION-OVERLAYS / 11 ACTIVE-HOLDS',
  'PW6-YE1-ISPOVED-1921',
  'PWA8-YE1-ISPOVED-1921',
  'PWA8-YE1-RADUNITSA-1916',
  'HISTORY-PRESERVED / EFFECTIVE-STATE-RESOLVED',
  'productionAuthorized=false',
] as const) {
  if (!ledger.includes(required)) fail(`${ledgerPath} is missing ${required}`);
}

console.log(
  JSON.stringify(
    {
      status: 'HISTORY-PRESERVED / EFFECTIVE-STATE-RESOLVED / UNPUBLISHED',
      ...summary,
      activeStateCounts,
      activeLayerCounts,
      supersessionEdges: yeseninPartOneSupersededHistoricalWitnesses.map((record) => ({
        historicalId: record.historicalRecord.id,
        acquisitionId: record.supersededByAcquisitionId,
        objectId: record.supersededByObjectId,
      })),
      standaloneAcquisitionRecords: yeseninPartOneStandalonePhysicalEditionAcquisitions.map(
        (record) => ({ id: record.id, objectId: record.objectId }),
      ),
      activeHoldIds: activeIds,
      publicationAuthorized: false,
      mediaPublicationAuthorized: false,
    },
    null,
    2,
  ),
);
