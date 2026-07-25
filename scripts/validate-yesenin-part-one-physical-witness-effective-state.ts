import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  yeseninPartOneNewspaperPassFourteen,
  yeseninPartOneNewspaperPassFourteenArtifact,
  yeseninPartOneNewspaperPassFourteenCoverage,
  yeseninPartOnePravdaPassFifteenAccess,
} from '../src/data/essays/yeseninPartOneNewspaperPassFourteen';
import {
  yeseninPartOnePhysicalEditionAcquisitionsPassEight,
  type YeseninPartOnePhysicalEditionAcquisitionPassEight,
} from '../src/data/essays/yeseninPartOnePhysicalEditionAcquisitionsPassEight';
import {
  yeseninPartOnePhysicalWitnessesPassSix,
  type YeseninPartOnePhysicalWitnessPassSix,
} from '../src/data/essays/yeseninPartOnePhysicalWitnessesPassSix';
import {
  yeseninPartOneTheatricalMoscowPassEleven,
  yeseninPartOneTheatricalMoscowPassElevenCoverage,
} from '../src/data/essays/yeseninPartOneTheatricalMoscowPassEleven';
import {
  yeseninPartOneAccessInvestigatedHistoricalWitnesses,
  yeseninPartOneActiveHistoricalWitnesses,
  yeseninPartOneEffectiveHistoricalWitnesses,
  yeseninPartOnePartiallySatisfiedHistoricalWitnesses,
  yeseninPartOnePhysicalWitnessEffectiveStateSummary,
  yeseninPartOneStandalonePhysicalEditionAcquisitions,
  yeseninPartOneSupersededHistoricalWitnesses,
  yeseninPartOneUntouchedActiveHistoricalWitnesses,
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
const theatricalRecords = yeseninPartOneTheatricalMoscowPassEleven;
const theatricalCoverage = yeseninPartOneTheatricalMoscowPassElevenCoverage;
const newspaperRecords = yeseninPartOneNewspaperPassFourteen;
const newspaperCoverage = yeseninPartOneNewspaperPassFourteenCoverage;
const pravdaAccess = yeseninPartOnePravdaPassFifteenAccess;
const summary = yeseninPartOnePhysicalWitnessEffectiveStateSummary;

if (historicalRecords.length !== 12) {
  fail(`expected 12 immutable historical records, found ${historicalRecords.length}`);
}
if (acquisitions.length !== 2) {
  fail(`expected two physical-edition acquisition overlays, found ${acquisitions.length}`);
}
if (theatricalRecords.length !== 4) {
  fail(`expected four Theatrical Moscow records, found ${theatricalRecords.length}`);
}
if (newspaperRecords.length !== 3) {
  fail(`expected three Izvestia issue records, found ${newspaperRecords.length}`);
}
if (yeseninPartOneEffectiveHistoricalWitnesses.length !== historicalRecords.length) {
  fail('effective resolver must preserve one row per historical record');
}

const expectedSummary = {
  historicalQueueRecords: 12,
  acquisitionOverlays: 2,
  theatricalSerialEvidenceRecords: 4,
  newspaperEvidenceRecords: 3,
  serialEvidenceRecords: 7,
  serialIssueEvidenceCount: 7,
  mariengofAccessRecords: 2,
  pravdaAccessRecords: 1,
  activeHistoricalHolds: 10,
  untouchedActiveHistoricalHolds: 9,
  accessInvestigatedHistoricalHolds: 3,
  metadataCorrectedHistoricalHolds: 1,
  viewerApiDownloadBlockedObjects: 1,
  unresolvedPublishedViewerRoutes: 1,
  noLiteralOfficialPravdaIssueMatches: 1,
  partiallySatisfiedHistoricalHolds: 1,
  supersededHistoricalHolds: 2,
  standaloneAcquisitions: 1,
  acquiredFacsimiles: 2,
  acquiredTheatricalMoscowIssueFacsimiles: 4,
  acquiredNewspaperIssueFacsimiles: 3,
  acquiredSerialIssueFacsimiles: 7,
  acquiredFacsimileObjects: 9,
  archiveOriginalsInspected: 0,
  reproductionRightsResolved: 0,
  productionAuthorized: false,
} as const;
for (const [key, expected] of Object.entries(expectedSummary)) {
  const actual = (summary as Record<string, unknown>)[key];
  if (actual !== expected) fail(`summary ${key} expected ${String(expected)}, found ${String(actual)}`);
}

const historicalIds = historicalRecords.map((record) => record.id);
const effectiveIds = yeseninPartOneEffectiveHistoricalWitnesses.map(
  (record) => record.historicalRecord.id,
);
if (new Set(historicalIds).size !== historicalIds.length) fail('historical IDs must be unique');
if (historicalIds.some((id, index) => effectiveIds[index] !== id)) {
  fail('effective resolver changed historical queue order or identity');
}

const ispoved = yeseninPartOneSupersededHistoricalWitnesses.find(
  (record) => record.historicalRecord.id === 'PW6-YE1-ISPOVED-1921',
);
if (
  !ispoved ||
  ispoved.supersededByAcquisitionId !== 'PWA8-YE1-ISPOVED-1921' ||
  ispoved.supersededByObjectId !== 'NEB-YE1-ISPOVED-1921'
) {
  fail(`Ispoved supersession drifted: ${JSON.stringify(ispoved)}`);
}

const izvestia = yeseninPartOneSupersededHistoricalWitnesses.find(
  (record) => record.historicalRecord.id === 'PW6-YE1-IZVESTIA-1921-SERIAL',
);
if (
  !izvestia ||
  izvestia.supersededByNewspaperEvidenceIds?.length !== 3 ||
  izvestia.supersededByNewspaperEvidenceIds.some(
    (id, index) => id !== newspaperCoverage.evidenceIds[index],
  ) ||
  izvestia.remainingTargets?.length !== 0
) {
  fail(`Izvestia supersession drifted: ${JSON.stringify(izvestia)}`);
}
if (
  newspaperCoverage.historicalHoldId !== 'PW6-YE1-IZVESTIA-1921-SERIAL' ||
  newspaperCoverage.effectiveStatus !== 'superseded-by-acquisition' ||
  newspaperCoverage.supersedesHistoricalHold !== true ||
  newspaperCoverage.remainingTargets.length !== 0
) {
  fail(`Izvestia coverage did not close exactly its three-issue target: ${JSON.stringify(newspaperCoverage)}`);
}

if (yeseninPartOneSupersededHistoricalWitnesses.length !== 2) {
  fail('exactly two historical HOLDs must be superseded');
}
for (const record of yeseninPartOneSupersededHistoricalWitnesses) {
  if (
    record.historicalRecord.facsimileBytesAcquired ||
    record.historicalRecord.facsimileVisuallyInspected ||
    record.historicalRecord.archiveOriginalInspected
  ) {
    fail(`${record.historicalRecord.id} was rewritten instead of superseded`);
  }
}

if (yeseninPartOnePartiallySatisfiedHistoricalWitnesses.length !== 1) {
  fail('exactly one historical HOLD must remain partially satisfied');
}
const partial = yeseninPartOnePartiallySatisfiedHistoricalWitnesses[0];
if (
  partial.historicalRecord.id !== 'PW6-YE1-TEATRALNAYA-MOSKVA-1921' ||
  partial.effectiveStatus !== 'active-hold-partially-satisfied' ||
  partial.partiallySatisfiedByEvidenceIds?.length !== 4 ||
  partial.partiallySatisfiedByEvidenceIds.some(
    (id, index) => id !== theatricalCoverage.evidenceIds[index],
  ) ||
  !theatricalCoverage.remainingTargets.some((item) => item.includes('official program')) ||
  !theatricalCoverage.remainingTargets.some((item) => item.includes('official opening')) ||
  theatricalCoverage.supersedesHistoricalHold !== false
) {
  fail(`Theatrical Moscow partial edge drifted: ${JSON.stringify(partial)}`);
}

if (
  yeseninPartOneUntouchedActiveHistoricalWitnesses.length !== 9 ||
  yeseninPartOneUntouchedActiveHistoricalWitnesses.some(
    (record) => record.effectiveStatus !== 'active-hold',
  )
) {
  fail('untouched active HOLD count or status drifted');
}
if (yeseninPartOneAccessInvestigatedHistoricalWitnesses.length !== 3) {
  fail('expected two Mariengof and one Pravda access-investigated HOLD');
}
const pravdaEffective = yeseninPartOneAccessInvestigatedHistoricalWitnesses.find(
  (record) => record.historicalRecord.id === 'PW6-YE1-PRAVDA-1921-11-09',
);
if (
  !pravdaEffective ||
  pravdaEffective.effectiveStatus !== 'active-hold' ||
  pravdaEffective.accessInvestigationId !== 'PR15-YE1-PRAVDA-1921-11-09' ||
  pravdaEffective.remainingTargets?.[0] !== pravdaAccess.remainingTarget
) {
  fail(`Pravda access edge drifted: ${JSON.stringify(pravdaEffective)}`);
}
if (
  pravdaAccess.state !== 'no-literal-official-central-moscow-match' ||
  pravdaAccess.officialParentUrl !== 'https://search.rsl.ru/ru/record/01004548325' ||
  pravdaAccess.officialSearchQueries !== 4 ||
  pravdaAccess.literalIssueCandidates !== 0 ||
  pravdaAccess.acceptedCentralMoscowCards !== 0 ||
  pravdaAccess.rejectedSameNamePublications.length !== 3 ||
  pravdaAccess.catalogueIdConstructed !== false ||
  pravdaAccess.pdfRouteConstructed !== false
) {
  fail(`Pravda bounded negative result drifted: ${JSON.stringify(pravdaAccess)}`);
}

if (
  yeseninPartOneStandalonePhysicalEditionAcquisitions.length !== 1 ||
  yeseninPartOneStandalonePhysicalEditionAcquisitions[0].id !== 'PWA8-YE1-RADUNITSA-1916'
) {
  fail('Radunitsa must remain the single standalone acquisition');
}

const expectedActiveIds = [
  'PW6-YE1-MATERIALY-110',
  'PW6-YE1-BENISLAVSKAYA-DIARY-BASIS',
  'PW6-YE1-MARIENGOF-1927',
  'PW6-YE1-MARIENGOF-1928',
  'PW6-YE1-TEATRALNAYA-MOSKVA-1921',
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
const activeStateCounts = countBy(yeseninPartOneActiveHistoricalWitnesses.map((record) => record.state));
const activeLayerCounts = countBy(yeseninPartOneActiveHistoricalWitnesses.map((record) => record.layer));
for (const [state, expected] of Object.entries({
  'academic-basis-identified': 2,
  'exact-object-located': 2,
  'serial-parent-located': 1,
  'archive-collection-located': 2,
  'request-required': 2,
  'still-unresolved': 1,
})) {
  if ((activeStateCounts as Record<string, number>)[state] !== expected) {
    fail(`active state ${state} expected ${expected}`);
  }
}
for (const [layer, expected] of Object.entries({
  'academic-commentary': 2,
  'bibliographic-object': 1,
  'digital-facsimile-route': 1,
  'serial-catalogue': 2,
  'archive-finding-aid': 2,
  'civil-record-target': 2,
})) {
  if ((activeLayerCounts as Record<string, number>)[layer] !== expected) {
    fail(`active layer ${layer} expected ${expected}`);
  }
}

for (const record of historicalRecords) {
  if (record.productionReuseAuthorized !== false) fail(`${record.id} changed historical rights`);
}
for (const record of [...acquisitions, ...theatricalRecords, ...newspaperRecords]) {
  if (
    record.productionAuthorized !== false ||
    record.ocrUsedForEvidence !== false ||
    record.syntheticContentUsed !== false ||
    record.archiveOriginalInspected !== false ||
    record.rightsState !== 'open-digital-facsimile / reproduction-rights-unresolved'
  ) {
    fail(`${record.id} violates evidence or rights boundaries`);
  }
}

const expectedNewspaper = [
  {
    id: 'NEWS14-YE1-IZVESTIA-NO186',
    code: '000199_000009_013351165',
    bytes: 52_016_796,
    frames: 4,
    sha: 'c8f83373f17c4c34bb059c624f81b917a2e5d4f4ed636d7735d398fb0789dd79',
    frameFinding: 'PDF 03',
    title: 'Наша гостья.',
  },
  {
    id: 'NEWS14-YE1-IZVESTIA-NO251',
    code: '000199_000009_013351339',
    bytes: 23_798_944,
    frames: 2,
    sha: '0e35e292398e6b281c43bd016fd94d62df3981476aa0ed79d4130d987c98ef99',
    frameFinding: 'PDF 02',
    title: 'Айседора Дункан. (Первое выступление 7 ноября).',
  },
  {
    id: 'NEWS14-YE1-IZVESTIA-NO263',
    code: '000199_000009_013351387',
    bytes: 49_148_667,
    frames: 4,
    sha: 'b3e007bf66bf9efafd103481f2108ba315770627b4df35fa503ad31c241fcdec',
    frameFinding: 'PDF 04',
    title: 'Искусство для масс.',
  },
] as const;
for (const expected of expectedNewspaper) {
  const record = newspaperRecords.find((candidate) => candidate.id === expected.id);
  if (
    !record ||
    record.catalogueCode !== expected.code ||
    record.bytes !== expected.bytes ||
    record.pdfFrames !== expected.frames ||
    record.sha256 !== expected.sha ||
    record.articleTitle !== expected.title ||
    !record.inspectedFrames.some((frame) => frame.includes(expected.frameFinding))
  ) {
    fail(`newspaper record drifted: ${expected.id}`);
  }
}
if (
  yeseninPartOneNewspaperPassFourteenArtifact.totalPdfBytes !== 124_964_407 ||
  yeseninPartOneNewspaperPassFourteenArtifact.totalPdfFrames !== 10 ||
  yeseninPartOneNewspaperPassFourteenArtifact.realPdfObjects !== 3 ||
  yeseninPartOneNewspaperPassFourteenArtifact.acquisitionArtifactSha256 !==
    '66520651ad99e962e2fd160d2fe606d517f8a9e410dd16c504f50dbe6e7ff206'
) {
  fail('newspaper acquisition artifact summary drifted');
}

const ledgerPath = 'research/yesenin/PART_ONE_PHYSICAL_WITNESS_EFFECTIVE_STATE_2026-07-25.md';
const ledger = read(ledgerPath);
for (const required of [
  '12 HISTORICAL-QUEUE-RECORDS / 2 PHYSICAL-EDITION-OVERLAYS / 7 SERIAL-EVIDENCE-RECORDS / 3 ACCESS-INVESTIGATION-RECORDS / 10 ACTIVE-HOLDS',
  '2 SUPERSEDED-HOLDS',
  'PW6-YE1-IZVESTIA-1921-SERIAL',
  'NEWS14-YE1-IZVESTIA-NO186',
  'NEWS14-YE1-IZVESTIA-NO251',
  'NEWS14-YE1-IZVESTIA-NO263',
  'PR15-YE1-PRAVDA-1921-11-09',
  'HISTORY-PRESERVED / EFFECTIVE-STATE-RESOLVED',
  'productionAuthorized=false',
] as const) {
  if (!ledger.includes(required)) fail(`${ledgerPath} is missing ${required}`);
}

console.log(
  JSON.stringify(
    {
      status:
        'HISTORY-PRESERVED / EFFECTIVE-STATE-RESOLVED / IZVESTIA-ACQUIRED / PRAVDA-BOUNDED / UNPUBLISHED',
      ...summary,
      activeStateCounts,
      activeLayerCounts,
      supersessionEdges: yeseninPartOneSupersededHistoricalWitnesses.map((record) => ({
        historicalId: record.historicalRecord.id,
        acquisitionId: record.supersededByAcquisitionId,
        objectId: record.supersededByObjectId,
        newspaperEvidenceIds: record.supersededByNewspaperEvidenceIds,
      })),
      partialCoverageEdges: yeseninPartOnePartiallySatisfiedHistoricalWitnesses.map((record) => ({
        historicalId: record.historicalRecord.id,
        evidenceIds: record.partiallySatisfiedByEvidenceIds,
        remainingTargets: record.remainingTargets,
      })),
      newspaperEvidenceRecords: newspaperRecords.map((record) => ({
        id: record.id,
        catalogueCode: record.catalogueCode,
        bytes: record.bytes,
        sha256: record.sha256,
        pdfFrames: record.pdfFrames,
        inspectedFrames: record.inspectedFrames,
      })),
      pravdaAccessState: pravdaAccess.state,
      activeHoldIds: activeIds,
      publicationAuthorized: false,
      mediaPublicationAuthorized: false,
    },
    null,
    2,
  ),
);
