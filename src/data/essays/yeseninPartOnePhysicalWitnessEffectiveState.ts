import {
  yeseninPartOneMariengofAccessPassThirteen,
  type YeseninPartOneMariengofAccessPassThirteen,
} from './yeseninPartOneMariengofAccessPassThirteen';
import {
  yeseninPartOneNewspaperPassFourteen,
  yeseninPartOneNewspaperPassFourteenCoverage,
  yeseninPartOnePravdaPassFifteenAccess,
} from './yeseninPartOneNewspaperPassFourteen';
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
  supersededByNewspaperEvidenceIds?: readonly `NEWS14-YE1-${string}`[];
  partiallySatisfiedByEvidenceIds?: readonly `TM11-YE1-${string}`[];
  accessInvestigationId?: `MA13-YE1-${string}` | 'PR15-YE1-PRAVDA-1921-11-09';
  correctedCatalogueUrl?: string;
  remainingTargets?: readonly string[];
}

const historicalRecords: readonly YeseninPartOnePhysicalWitnessPassSix[] =
  yeseninPartOnePhysicalWitnessesPassSix;
const acquisitionOverlays: readonly YeseninPartOnePhysicalEditionAcquisitionPassEight[] =
  yeseninPartOnePhysicalEditionAcquisitionsPassEight;
const theatricalSerialEvidenceRecords = yeseninPartOneTheatricalMoscowPassEleven;
const theatricalSerialCoverage = yeseninPartOneTheatricalMoscowPassElevenCoverage;
const newspaperEvidenceRecords = yeseninPartOneNewspaperPassFourteen;
const newspaperCoverage = yeseninPartOneNewspaperPassFourteenCoverage;
const mariengofAccessRecords: readonly YeseninPartOneMariengofAccessPassThirteen[] =
  yeseninPartOneMariengofAccessPassThirteen;
const pravdaAccessRecord = yeseninPartOnePravdaPassFifteenAccess;

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

    if (newspaperCoverage.historicalHoldId === historicalRecord.id) {
      return {
        historicalRecord,
        effectiveStatus: newspaperCoverage.effectiveStatus,
        supersededByNewspaperEvidenceIds: newspaperCoverage.evidenceIds,
        remainingTargets: newspaperCoverage.remainingTargets,
      };
    }

    if (theatricalSerialCoverage.historicalHoldId === historicalRecord.id) {
      return {
        historicalRecord,
        effectiveStatus: theatricalSerialCoverage.effectiveStatus,
        partiallySatisfiedByEvidenceIds: theatricalSerialCoverage.evidenceIds,
        remainingTargets: theatricalSerialCoverage.remainingTargets,
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

    if (pravdaAccessRecord.historicalHoldId === historicalRecord.id) {
      return {
        historicalRecord,
        effectiveStatus: 'active-hold',
        accessInvestigationId: pravdaAccessRecord.id,
        remainingTargets: [pravdaAccessRecord.remainingTarget],
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
 * Access-investigation metadata may explain a route block or rejected search,
 * but it does not satisfy the underlying page-level target.
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

const acquiredPhysicalEditionFacsimiles = acquisitionOverlays.filter(
  (record) => record.facsimileBytesAcquired && record.facsimileVisuallyInspected,
);
const acquiredTheatricalSerialFacsimiles = theatricalSerialEvidenceRecords.filter(
  (record) => record.realPdfAcquired && record.visuallyInspected,
);
const acquiredNewspaperFacsimiles = newspaperEvidenceRecords.filter(
  (record) => record.realPdfAcquired && record.visuallyInspected,
);

export const yeseninPartOnePhysicalWitnessEffectiveStateSummary = {
  historicalQueueRecords: historicalRecords.length,
  acquisitionOverlays: acquisitionOverlays.length,
  theatricalSerialEvidenceRecords: theatricalSerialEvidenceRecords.length,
  newspaperEvidenceRecords: newspaperEvidenceRecords.length,
  serialEvidenceRecords:
    theatricalSerialEvidenceRecords.length + newspaperEvidenceRecords.length,
  serialIssueEvidenceCount:
    theatricalSerialEvidenceRecords.length + newspaperEvidenceRecords.length,
  mariengofAccessRecords: mariengofAccessRecords.length,
  pravdaAccessRecords: 1,
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
  noLiteralOfficialPravdaIssueMatches:
    pravdaAccessRecord.state === 'no-literal-official-central-moscow-match' ? 1 : 0,
  partiallySatisfiedHistoricalHolds:
    yeseninPartOnePartiallySatisfiedHistoricalWitnesses.length,
  supersededHistoricalHolds: yeseninPartOneSupersededHistoricalWitnesses.length,
  standaloneAcquisitions: yeseninPartOneStandalonePhysicalEditionAcquisitions.length,
  acquiredFacsimiles: acquiredPhysicalEditionFacsimiles.length,
  acquiredTheatricalMoscowIssueFacsimiles: acquiredTheatricalSerialFacsimiles.length,
  acquiredNewspaperIssueFacsimiles: acquiredNewspaperFacsimiles.length,
  acquiredSerialIssueFacsimiles:
    acquiredTheatricalSerialFacsimiles.length + acquiredNewspaperFacsimiles.length,
  acquiredFacsimileObjects:
    acquiredPhysicalEditionFacsimiles.length +
    acquiredTheatricalSerialFacsimiles.length +
    acquiredNewspaperFacsimiles.length,
  archiveOriginalsInspected:
    acquisitionOverlays.filter((record) => record.archiveOriginalInspected).length +
    theatricalSerialEvidenceRecords.filter((record) => record.archiveOriginalInspected).length +
    newspaperEvidenceRecords.filter((record) => record.archiveOriginalInspected).length,
  reproductionRightsResolved:
    acquisitionOverlays.filter(
      (record) => record.rightsState !== 'open-digital-facsimile / reproduction-rights-unresolved',
    ).length +
    theatricalSerialEvidenceRecords.filter(
      (record) => record.rightsState !== 'open-digital-facsimile / reproduction-rights-unresolved',
    ).length +
    newspaperEvidenceRecords.filter(
      (record) => record.rightsState !== 'open-digital-facsimile / reproduction-rights-unresolved',
    ).length,
  productionAuthorized: false,
} as const;
