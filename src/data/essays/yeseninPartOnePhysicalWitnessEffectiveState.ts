import {
  yeseninPartOnePhysicalEditionAcquisitionsPassEight,
  type YeseninPartOnePhysicalEditionAcquisitionPassEight,
} from './yeseninPartOnePhysicalEditionAcquisitionsPassEight';
import {
  yeseninPartOnePhysicalWitnessesPassSix,
  type YeseninPartOnePhysicalWitnessPassSix,
} from './yeseninPartOnePhysicalWitnessesPassSix';

export type YeseninPartOneEffectiveWitnessStatus =
  | 'active-hold'
  | 'superseded-by-acquisition';

export interface YeseninPartOneEffectiveHistoricalWitness {
  historicalRecord: YeseninPartOnePhysicalWitnessPassSix;
  effectiveStatus: YeseninPartOneEffectiveWitnessStatus;
  supersededByAcquisitionId?: `PWA8-YE1-${string}`;
  supersededByObjectId?: `NEB-YE1-${string}`;
}

const historicalRecords: readonly YeseninPartOnePhysicalWitnessPassSix[] =
  yeseninPartOnePhysicalWitnessesPassSix;
const acquisitionOverlays: readonly YeseninPartOnePhysicalEditionAcquisitionPassEight[] =
  yeseninPartOnePhysicalEditionAcquisitionsPassEight;

/**
 * Resolve the current operational state without mutating the historical pass-six
 * queue. An acquisition overlay may supersede one old HOLD, while standalone
 * acquisitions remain independently visible.
 */
export const yeseninPartOneEffectiveHistoricalWitnesses = historicalRecords.map(
  (historicalRecord): YeseninPartOneEffectiveHistoricalWitness => {
    const acquisition = acquisitionOverlays.find(
      (candidate) => candidate.supersedesHoldId === historicalRecord.id,
    );

    if (!acquisition) {
      return {
        historicalRecord,
        effectiveStatus: 'active-hold',
      };
    }

    return {
      historicalRecord,
      effectiveStatus: 'superseded-by-acquisition',
      supersededByAcquisitionId: acquisition.id,
      supersededByObjectId: acquisition.objectId,
    };
  },
);

export const yeseninPartOneActiveHistoricalWitnesses =
  yeseninPartOneEffectiveHistoricalWitnesses
    .filter((record) => record.effectiveStatus === 'active-hold')
    .map((record) => record.historicalRecord);

export const yeseninPartOneSupersededHistoricalWitnesses =
  yeseninPartOneEffectiveHistoricalWitnesses.filter(
    (record) => record.effectiveStatus === 'superseded-by-acquisition',
  );

export const yeseninPartOneStandalonePhysicalEditionAcquisitions =
  acquisitionOverlays.filter((record) => !record.supersedesHoldId);

export const yeseninPartOnePhysicalWitnessEffectiveStateSummary = {
  historicalQueueRecords: historicalRecords.length,
  acquisitionOverlays: acquisitionOverlays.length,
  activeHistoricalHolds: yeseninPartOneActiveHistoricalWitnesses.length,
  supersededHistoricalHolds: yeseninPartOneSupersededHistoricalWitnesses.length,
  standaloneAcquisitions: yeseninPartOneStandalonePhysicalEditionAcquisitions.length,
  acquiredFacsimiles: acquisitionOverlays.filter(
    (record) => record.facsimileBytesAcquired && record.facsimileVisuallyInspected,
  ).length,
  archiveOriginalsInspected: acquisitionOverlays.filter(
    (record) => record.archiveOriginalInspected,
  ).length,
  reproductionRightsResolved: acquisitionOverlays.filter(
    (record) => record.rightsState !== 'open-digital-facsimile / reproduction-rights-unresolved',
  ).length,
  productionAuthorized: false,
} as const;
