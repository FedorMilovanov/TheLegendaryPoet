import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  yeseninPartOneMariengofAccessPassThirteen,
  type YeseninPartOneMariengofAccessPassThirteen,
} from '../src/data/essays/yeseninPartOneMariengofAccessPassThirteen';
import {
  yeseninPartOneAccessInvestigatedHistoricalWitnesses,
  yeseninPartOneEffectiveHistoricalWitnesses,
  yeseninPartOnePhysicalWitnessEffectiveStateSummary,
} from '../src/data/essays/yeseninPartOnePhysicalWitnessEffectiveState';

const root = process.cwd();
const read = (path: string): string => readFileSync(resolve(root, path), 'utf8');
const fail = (message: string): never => {
  throw new Error(`[yesenin-mariengof-access-pass13] ${message}`);
};

const records: readonly YeseninPartOneMariengofAccessPassThirteen[] =
  yeseninPartOneMariengofAccessPassThirteen;
const summary = yeseninPartOnePhysicalWitnessEffectiveStateSummary;
const mariengofInvestigatedHolds = yeseninPartOneAccessInvestigatedHistoricalWitnesses.filter(
  (record) => record.accessInvestigationId?.startsWith('MA13-YE1-'),
);

if (records.length !== 2) {
  fail(`expected two exact Mariengof access records, found ${records.length}`);
}
if (new Set(records.map((record) => record.id)).size !== records.length) {
  fail('access record IDs must be unique');
}
if (new Set(records.map((record) => record.historicalHoldId)).size !== records.length) {
  fail('each access record must point to a different historical HOLD');
}

const firstEdition = records.find((record) => record.id === 'MA13-YE1-MARIENGOF-1927');
const secondEdition = records.find((record) => record.id === 'MA13-YE1-MARIENGOF-1928');
if (!firstEdition || !secondEdition) {
  fail('both 1927 and 1928 typed records are required');
}

if (
  firstEdition.historicalHoldId !== 'PW6-YE1-MARIENGOF-1927' ||
  firstEdition.catalogueRecordId !== '01009215492' ||
  firstEdition.catalogueUrl !== 'https://search.rsl.ru/ru/record/01009215492' ||
  firstEdition.state !== 'catalogue-verified-route-unresolved' ||
  firstEdition.cardBytes !== 63_241 ||
  firstEdition.cardSha256 !==
    '744eedf8b895f6f916ce444bdcce3b66a940b732170f5fabc99236e0a243d236' ||
  firstEdition.literalCardViewerUrl !== undefined ||
  firstEdition.literalViewerUrl !== undefined ||
  firstEdition.viewerInfoUrl !== undefined ||
  firstEdition.facsimileBytesAcquired !== false ||
  firstEdition.facsimileVisuallyInspected !== false
) {
  fail(`1927 access record drifted: ${JSON.stringify(firstEdition)}`);
}
if (
  !firstEdition.limitation.includes('href="#"') ||
  !firstEdition.limitation.includes('No route was reconstructed') ||
  !firstEdition.remainingTarget.includes('institution-published viewer or copy route')
) {
  fail('1927 unresolved-route boundary is incomplete');
}

if (
  secondEdition.historicalHoldId !== 'PW6-YE1-MARIENGOF-1928' ||
  secondEdition.catalogueRecordId !== '01009215494' ||
  secondEdition.catalogueUrl !== 'https://search.rsl.ru/ru/record/01009215494' ||
  secondEdition.historicalCatalogueUrl !==
    'https://search.rsl.ru/ru/record/01009198586' ||
  secondEdition.state !== 'viewer-api-verified-download-blocked' ||
  secondEdition.cardBytes !== 66_985 ||
  secondEdition.cardSha256 !==
    'c07c001f647654ee4d69af8da80d23882c6e68e81e85f58c98012dc32143dee8' ||
  secondEdition.literalViewerUrl !== 'https://viewer.rsl.ru/rsl01009215494' ||
  secondEdition.literalViewerDocumentId !== 'rsl01009215494' ||
  secondEdition.viewerInfoUrl !==
    'https://viewer.rsl.ru/api/v1/document/rsl01009215494/info' ||
  secondEdition.viewerInfoBytes !== 2_771 ||
  secondEdition.viewerInfoSha256 !==
    '5d9c30a977aaa75c2446969525bddecf9052b6098d61d56dd23b3cff21348f92' ||
  secondEdition.viewerPageCount !== 172 ||
  secondEdition.viewerAccessLevel !== 'restricted' ||
  secondEdition.viewerAvailable !== false ||
  secondEdition.viewerDownloadable !== false ||
  secondEdition.viewerDownloadableFormats?.length !== 0 ||
  secondEdition.viewerFormats?.length !== 1 ||
  secondEdition.viewerFormats[0] !== 'pdf' ||
  secondEdition.facsimileBytesAcquired !== false ||
  secondEdition.facsimileVisuallyInspected !== false
) {
  fail(`1928 access record drifted: ${JSON.stringify(secondEdition)}`);
}
if (
  !secondEdition.literalCardViewerUrl?.includes('/ru/view/01009215494?redirect=') ||
  !secondEdition.metadataCorrectionReason?.includes('01009215494') ||
  !secondEdition.limitation.includes('isDownloadable=false') ||
  !secondEdition.remainingTarget.includes('direct page-level comparison')
) {
  fail('1928 correction or download-block boundary is incomplete');
}

for (const record of records) {
  if (
    record.acquisitionRunId !== 30_138_036_528 ||
    record.researchArtifactDigest !==
      'sha256:98e0b56ed89b3677cf06462c4e2ace1bc99e124afd622436cf191929353254e2' ||
    record.diagnosticArtifactDigest !==
      'sha256:ab11eed4b0c8c7e283292ef3c1effac470b3d8b99b4dc76b41d95ffbd4507963' ||
    record.routeConstructed !== false ||
    record.recordIdUsedToInventRoute !== false ||
    record.facsimileBytesAcquired !== false ||
    record.facsimileVisuallyInspected !== false ||
    record.ocrUsedForEvidence !== false ||
    record.syntheticContentUsed !== false ||
    record.archiveOriginalInspected !== false ||
    record.productionAuthorized !== false ||
    record.rightsState !==
      'catalogue-and-viewer-access-inspected / reproduction-rights-unresolved'
  ) {
    fail(`${record.id} violates evidence, acquisition or rights boundaries`);
  }
}

if (mariengofInvestigatedHolds.length !== 2) {
  fail(`exactly two Mariengof HOLDs must carry MA13 investigations, found ${mariengofInvestigatedHolds.length}`);
}
const investigatedIds = mariengofInvestigatedHolds.map((record) => record.historicalRecord.id);
if (
  investigatedIds[0] !== 'PW6-YE1-MARIENGOF-1927' ||
  investigatedIds[1] !== 'PW6-YE1-MARIENGOF-1928'
) {
  fail(`unexpected Mariengof access-investigated HOLD order: ${investigatedIds.join(', ')}`);
}
for (const effective of mariengofInvestigatedHolds) {
  if (
    effective.effectiveStatus !== 'active-hold' ||
    effective.remainingTargets?.length !== 1 ||
    effective.historicalRecord.facsimileBytesAcquired !== false ||
    effective.historicalRecord.facsimileVisuallyInspected !== false
  ) {
    fail(`Mariengof access investigation falsely completed its HOLD: ${JSON.stringify(effective)}`);
  }
}
const effective1928 = yeseninPartOneEffectiveHistoricalWitnesses.find(
  (record) => record.historicalRecord.id === 'PW6-YE1-MARIENGOF-1928',
);
if (
  effective1928?.accessInvestigationId !== 'MA13-YE1-MARIENGOF-1928' ||
  effective1928.correctedCatalogueUrl !==
    'https://search.rsl.ru/ru/record/01009215494'
) {
  fail(`1928 correction overlay is missing: ${JSON.stringify(effective1928)}`);
}

if (
  summary.historicalQueueRecords !== 12 ||
  summary.mariengofAccessRecords !== 2 ||
  summary.activeHistoricalHolds !== 10 ||
  summary.untouchedActiveHistoricalHolds !== 9 ||
  summary.accessInvestigatedHistoricalHolds !== 3 ||
  summary.metadataCorrectedHistoricalHolds !== 1 ||
  summary.viewerApiDownloadBlockedObjects !== 1 ||
  summary.unresolvedPublishedViewerRoutes !== 1 ||
  summary.partiallySatisfiedHistoricalHolds !== 1 ||
  summary.supersededHistoricalHolds !== 2 ||
  summary.acquiredFacsimileObjects !== 9 ||
  summary.archiveOriginalsInspected !== 0 ||
  summary.reproductionRightsResolved !== 0 ||
  summary.productionAuthorized !== false
) {
  fail(`effective summary drifted: ${JSON.stringify(summary)}`);
}

const ledgerPath =
  'research/yesenin/PART_ONE_MARIENGOF_ACCESS_PASS13_2026-07-25.md';
const ledger = read(ledgerPath);
for (const required of [
  '2 EXACT-RSL-CARDS / 1 METADATA-CORRECTION / 1 VIEWER-API-CONTRACT / 0 PDF-OBJECTS-ACQUIRED',
  'MA13-YE1-MARIENGOF-1927',
  'MA13-YE1-MARIENGOF-1928',
  '01009215492',
  '01009215494',
  'rsl01009215494',
  'isDownloadable=false',
  'routeConstructed=false',
  '2 ACTIVE-HOLDS-PRESERVED',
  'productionAuthorized=false',
] as const) {
  if (!ledger.includes(required)) fail(`${ledgerPath} is missing ${required}`);
}

console.log(
  JSON.stringify(
    {
      status:
        'EXACT-CARDS-VERIFIED / LOCATOR-CORRECTED / VIEWER-API-INSPECTED / DOWNLOAD-BLOCKED / ACTIVE-HOLDS-PRESERVED',
      records: records.length,
      metadataCorrections: records.filter(
        (record) => record.historicalCatalogueUrl !== undefined,
      ).length,
      unresolvedViewerRoutes: records.filter(
        (record) => record.state === 'catalogue-verified-route-unresolved',
      ).length,
      viewerApiDownloadBlocked: records.filter(
        (record) => record.state === 'viewer-api-verified-download-blocked',
      ).length,
      pdfObjectsAcquired: records.filter((record) => record.facsimileBytesAcquired).length,
      accessInvestigationEdges: mariengofInvestigatedHolds.map((record) => ({
        historicalId: record.historicalRecord.id,
        investigationId: record.accessInvestigationId,
        correctedCatalogueUrl: record.correctedCatalogueUrl,
        effectiveStatus: record.effectiveStatus,
        remainingTargets: record.remainingTargets,
      })),
      totalAccessInvestigatedHistoricalHolds:
        yeseninPartOneAccessInvestigatedHistoricalWitnesses.length,
      artifactDigests: {
        research: records[0].researchArtifactDigest,
        diagnostics: records[0].diagnosticArtifactDigest,
      },
      routeConstructed: false,
      ocrUsedForEvidence: false,
      archiveOriginalsInspected: 0,
      publicationAuthorized: false,
      mediaPublicationAuthorized: false,
    },
    null,
    2,
  ),
);
