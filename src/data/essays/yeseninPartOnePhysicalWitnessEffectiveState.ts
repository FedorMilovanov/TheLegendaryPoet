import {
  yeseninPartOneMariengofAccessPassThirteen,
  type YeseninPartOneMariengofAccessPassThirteen,
} from './yeseninPartOneMariengofAccessPassThirteen';
import {
  yeseninPartOnePhysicalEditionAcquisitionsPassEight,
  type YeseninPartOnePhysicalEditionAcquisitionPassEight,
} from './yeseninPartOnePhysicalEditionAcquisitionsPassEight';
import {
  yeseninPartOnePhysicalWitnessesPassSix,
  type YeseninPartOnePhysicalWitnessPassSix,
} from './yeseninPartOnePhysicalWitnessesPassSix';
import {
  yeseninPartOneTheatricalMoscowPassEleven,
  yeseninPartOneTheatricalMoscowPassElevenCoverage,
} from './yeseninPartOneTheatricalMoscowPassEleven';

export type YeseninPartOneEffectiveWitnessStatus =
  | 'active-hold'
  | 'active-hold-partially-satisfied'
  | 'superseded-by-acquisition';

export interface YeseninPartOneEffectiveHistoricalWitness {
  historicalRecord: YeseninPartOnePhysicalWitnessPassSix;
  effectiveStatus: YeseninPartOneEffectiveWitnessStatus;
  supersededByAcquisitionId?: `PWA8-YE1-${string}`;
  supersededByObjectId?: `NEB-YE1-${string}`;
  partiallySatisfiedByEvidenceIds?: readonly `TM11-YE1-${string}`[];
  accessInvestigationId?: `MA13-YE1-${string}`;
  correctedCatalogueUrl?: string;
  remainingTargets?: readonly string[];
}

const historicalRecords: readonly YeseninPartOnePhysicalWitnessPassSix[] =
  yeseninPartOnePhysicalWitnessesPassSix;
const acquisitionOverlays: readonly YeseninPartOnePhysicalEditionAcquisitionPassEight[] =
  yeseninPartOnePhysicalEditionAcquisitionsPassEight;
const serialEvidenceRecords = yeseninPartOneTheatricalMoscowPassEleven;
const serialCoverage = yeseninPartOneTheatricalMoscowPassElevenCoverage;
const mariengofAccessRecords: readonly YeseninPartOneMariengofAccessPassThirteen[] =
  yeseninPartOneMariengofAccessPassThirteen;

/**
 * Resolve current operational state without mutating the historical pass-six
 * queue. A later acquisition may fully supersede one old HOLD, serial evidence
 * may satisfy only part of a broad target, and an access investigation may
 * correct metadata or explain a block without pretending the target was met.
 */
export const yeseninPartOneEffectiveHistoricalWitnesses = historicalRecords.map(
  (historicalRecord): YeseninPartOneEffectiveHistoricalWitness => {
    const acquisition = acquisitionOverlays.find(
      (candidate) => candidate.supersedesHoldId === historicalRecord.id,
    );

    if (acquisition) {
      return {
        historicalRecord,
        effectiveStatus: 'superseded-by-acquisition',
        supersededByAcquisitionId: acquisition.id,
        supersededByObjectId: acquisition.objectId,
      };
    }

    if (serialCoverage.historicalHoldId === historicalRecord.id) {
      return {
        historicalRecord,
        effectiveStatus: serialCoverage.effectiveStatus,
        partiallySatisfiedByEvidenceIds: serialCoverage.evidenceIds,
        remainingTargets: serialCoverage.remainingTargets,
      };
    }

    const accessRecord = mariengofAccessRecords.find(
      (candidate) => candidate.historicalHoldId === historicalRecord.id,
    );
    if (accessRecord) {
      return {
        historicalRecord,
        effectiveStatus: 'active-hold',
        accessInvestigationId: accessRecord.id,
        correctedCatalogueUrl: accessRecord.historicalCatalogueUrl
          ? accessRecord.catalogueUrl
          : undefined,
        remainingTargets: [accessRecord.remainingTarget],
      };
    }

    return {
      historicalRecord,
      effectiveStatus: 'active-hold',
    };
  },
);

export const yeseninPartOneActiveEffectiveHistoricalWitnesses =
  yeseninPartOneEffectiveHistoricalWitnesses.filter(
    (record) => record.effectiveStatus !== 'superseded-by-acquisition',
  );

export const yeseninPartOneActiveHistoricalWitnesses =
  yeseninPartOneActiveEffectiveHistoricalWitnesses.map((record) => record.historicalRecord);

/**
 * Compatibility name: these targets remain untouched by satisfying evidence.
 * Two Mariengof rows now carry access-investigation metadata, but neither target
 * has been fulfilled because no facsimile pages were acquired or inspected.
 */
export const yeseninPartOneUntouchedActiveHistoricalWitnesses =
  yeseninPartOneEffectiveHistoricalWitnesses.filter(
    (record) => record.effectiveStatus === 'active-hold',
  );

export const yeseninPartOneAccessInvestigatedHistoricalWitnesses =
  yeseninPartOneEffectiveHistoricalWitnesses.filter(
    (record) => record.accessInvestigationId !== undefined,
  );

export const yeseninPartOnePartiallySatisfiedHistoricalWitnesses =
  yeseninPartOneEffectiveHistoricalWitnesses.filter(
    (record) => record.effectiveStatus === 'active-hold-partially-satisfied',
  );

export const yeseninPartOneSupersededHistoricalWitnesses =
  yeseninPartOneEffectiveHistoricalWitnesses.filter(
    (record) => record.effectiveStatus === 'superseded-by-acquisition',
  );

export const yeseninPartOneStandalonePhysicalEditionAcquisitions =
  acquisitionOverlays.filter((record) => !record.supersedesHoldId);

export const yeseninPartOnePhysicalWitnessEffectiveStateSummary = {
  historicalQueueRecords: historicalRecords.length,
  acquisitionOverlays: acquisitionOverlays.length,
  serialEvidenceRecords: serialEvidenceRecords.length,
  serialIssueEvidenceCount: serialEvidenceRecords.length,
  mariengofAccessRecords: mariengofAccessRecords.length,
  activeHistoricalHolds: yeseninPartOneActiveHistoricalWitnesses.length,
  untouchedActiveHistoricalHolds: yeseninPartOneUntouchedActiveHistoricalWitnesses.length,
  accessInvestigatedHistoricalHolds:
    yeseninPartOneAccessInvestigatedHistoricalWitnesses.length,
  metadataCorrectedHistoricalHolds: mariengofAccessRecords.filter(
    (record) => record.historicalCatalogueUrl !== undefined,
  ).length,
  viewerApiDownloadBlockedObjects: mariengofAccessRecords.filter(
    (record) => record.state === 'viewer-api-verified-download-blocked',
  ).length,
  unresolvedPublishedViewerRoutes: mariengofAccessRecords.filter(
    (record) => record.state === 'catalogue-verified-route-unresolved',
  ).length,
  partiallySatisfiedHistoricalHolds:
    yeseninPartOnePartiallySatisfiedHistoricalWitnesses.length,
  supersededHistoricalHolds: yeseninPartOneSupersededHistoricalWitnesses.length,
  standaloneAcquisitions: yeseninPartOneStandalonePhysicalEditionAcquisitions.length,
  acquiredFacsimiles: acquisitionOverlays.filter(
    (record) => record.facsimileBytesAcquired && record.facsimileVisuallyInspected,
  ).length,
  acquiredSerialIssueFacsimiles: serialEvidenceRecords.filter(
    (record) => record.realPdfAcquired && record.visuallyInspected,
  ).length,
  acquiredFacsimileObjects:
    acquisitionOverlays.filter(
      (record) => record.facsimileBytesAcquired && record.facsimileVisuallyInspected,
    ).length +
    serialEvidenceRecords.filter((record) => record.realPdfAcquired && record.visuallyInspected)
      .length,
  archiveOriginalsInspected:
    acquisitionOverlays.filter((record) => record.archiveOriginalInspected).length +
    serialEvidenceRecords.filter((record) => record.archiveOriginalInspected).length,
  reproductionRightsResolved:
    acquisitionOverlays.filter(
      (record) => record.rightsState !== 'open-digital-facsimile / reproduction-rights-unresolved',
    ).length +
    serialEvidenceRecords.filter(
      (record) => record.rightsState !== 'open-digital-facsimile / reproduction-rights-unresolved',
    ).length,
  productionAuthorized: false,
} as const;
