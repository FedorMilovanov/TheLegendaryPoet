import { yeseninPrimaryVisualPlacementsPassFifteen } from './yeseninPrimarySourceMarathonPassFifteen';
import {
  yeseninVisualByteEvidencePassSixteen,
  yeseninVisualByteEvidencePassSixteenEnvelope,
} from './yeseninVisualByteEvidencePassSixteen';

export type YeseninVisualEffectiveAcquisitionState =
  | 'bytes-acquired / visually-inspected / rights-review'
  | 'bytes-pending';

type PlacementId = (typeof yeseninPrimaryVisualPlacementsPassFifteen)[number]['id'];
type ByteEvidence = (typeof yeseninVisualByteEvidencePassSixteen)[number];

export interface YeseninVisualPlacementEffectiveStatePassSixteen {
  placementId: PlacementId;
  title: string;
  placement: string;
  sourcePageUrl: string;
  byteEvidenceId: ByteEvidence['id'] | null;
  acquisitionState: YeseninVisualEffectiveAcquisitionState;
  originalSha256: string | null;
  productionAuthorized: false;
  supersessionNote: string | null;
}

const evidenceByPlacement = new Map<PlacementId, ByteEvidence>();
for (const record of yeseninVisualByteEvidencePassSixteen) {
  if (record.placementId !== null) evidenceByPlacement.set(record.placementId, record);
}

export const yeseninVisualPlacementEffectiveStatePassSixteen =
  yeseninPrimaryVisualPlacementsPassFifteen.map((placement) => {
    const evidence = evidenceByPlacement.get(placement.id);
    if (!evidence) {
      return {
        placementId: placement.id,
        title: placement.title,
        placement: placement.placement,
        sourcePageUrl: placement.sourcePageUrl,
        byteEvidenceId: null,
        acquisitionState: 'bytes-pending',
        originalSha256: null,
        productionAuthorized: false,
        supersessionNote: null,
      } as const;
    }

    if (placement.id === 'VIS-YE1-P15-016') {
      return {
        placementId: placement.id,
        title: evidence.title,
        placement: placement.placement,
        sourcePageUrl: evidence.recordUrl,
        byteEvidenceId: evidence.id,
        acquisitionState: 'bytes-acquired / visually-inspected / rights-review',
        originalSha256: evidence.sha256,
        productionAuthorized: false,
        supersessionNote:
          'Pass 15 proposed Genthe LC-DIG-agc-7a14235 as an Isadora Duncan portrait. Pass 16 visual inspection proved that object is a Duncan-school dancer. Effective portrait placement now uses Bain LC-DIG-ggbain-05654.',
      } as const;
    }

    return {
      placementId: placement.id,
      title: evidence.title,
      placement: placement.placement,
      sourcePageUrl: evidence.recordUrl,
      byteEvidenceId: evidence.id,
      acquisitionState: 'bytes-acquired / visually-inspected / rights-review',
      originalSha256: evidence.sha256,
      productionAuthorized: false,
      supersessionNote: null,
    } as const;
  }) satisfies readonly YeseninVisualPlacementEffectiveStatePassSixteen[];

export const yeseninVisualPlacementEffectiveStatePassSixteenSummary = {
  placements: yeseninVisualPlacementEffectiveStatePassSixteen.length,
  byteAcquiredPlacements: yeseninVisualPlacementEffectiveStatePassSixteen.filter(
    (placement) => placement.acquisitionState === 'bytes-acquired / visually-inspected / rights-review',
  ).length,
  pendingPlacements: yeseninVisualPlacementEffectiveStatePassSixteen.filter(
    (placement) => placement.acquisitionState === 'bytes-pending',
  ).length,
  acquiredInstitutionalObjects: yeseninVisualByteEvidencePassSixteenEnvelope.objects,
  acquiredBytes: yeseninVisualByteEvidencePassSixteenEnvelope.totalBytes,
  productionAuthorizedPlacements: 0,
  duncanPortraitPlacement: 'VBE16-LOC-BAIN-05654',
  gentheDancerExcludedFromPortraitPlacement: 'VBE16-LOC-7A14235',
} as const;
