export type YeseninPartOneMariengofAccessStatePassThirteen =
  | 'catalogue-verified-route-unresolved'
  | 'viewer-api-verified-download-blocked';

export interface YeseninPartOneMariengofAccessPassThirteen {
  id: `MA13-YE1-${string}`;
  historicalHoldId: `PW6-YE1-MARIENGOF-${1927 | 1928}`;
  title: string;
  editionYear: 1927 | 1928;
  catalogueUrl: string;
  catalogueRecordId: string;
  catalogueExtent: string;
  state: YeseninPartOneMariengofAccessStatePassThirteen;
  historicalCatalogueUrl?: string;
  metadataCorrectionReason?: string;
  cardBytes: number;
  cardSha256: string;
  literalCardViewerUrl?: string;
  literalViewerUrl?: string;
  literalViewerDocumentId?: string;
  viewerInfoUrl?: string;
  viewerInfoBytes?: number;
  viewerInfoSha256?: string;
  viewerPageCount?: number;
  viewerFormats?: readonly string[];
  viewerAccessLevel?: string;
  viewerAvailable?: boolean;
  viewerDownloadable?: boolean;
  viewerDownloadableFormats?: readonly string[];
  acquisitionRunId: number;
  researchArtifactDigest: `sha256:${string}`;
  diagnosticArtifactDigest: `sha256:${string}`;
  routeConstructed: false;
  recordIdUsedToInventRoute: false;
  facsimileBytesAcquired: false;
  facsimileVisuallyInspected: false;
  ocrUsedForEvidence: false;
  syntheticContentUsed: false;
  archiveOriginalInspected: false;
  productionAuthorized: false;
  rightsState: 'catalogue-and-viewer-access-inspected / reproduction-rights-unresolved';
  remainingTarget: string;
  limitation: string;
}

/**
 * Durable access-state records for the two exact Mariengof editions.
 *
 * These records intentionally do not pretend that a catalogue card or viewer
 * metadata response is a downloaded and inspected facsimile. They preserve the
 * historical queue and record only what the official RSL surfaces actually
 * exposed during pass 13.
 */
export const yeseninPartOneMariengofAccessPassThirteen = [
  {
    id: 'MA13-YE1-MARIENGOF-1927',
    historicalHoldId: 'PW6-YE1-MARIENGOF-1927',
    title: 'А. Б. Мариенгоф. Роман без вранья. Первое издание. Ленинград: Прибой, 1927',
    editionYear: 1927,
    catalogueUrl: 'https://search.rsl.ru/ru/record/01009215492',
    catalogueRecordId: '01009215492',
    catalogueExtent: '154 pages; holdings P 106/97 and P 106/95',
    state: 'catalogue-verified-route-unresolved',
    cardBytes: 63_241,
    cardSha256: '744eedf8b895f6f916ce444bdcce3b66a940b732170f5fabc99236e0a243d236',
    acquisitionRunId: 30_138_036_528,
    researchArtifactDigest:
      'sha256:98e0b56ed89b3677cf06462c4e2ace1bc99e124afd622436cf191929353254e2',
    diagnosticArtifactDigest:
      'sha256:ab11eed4b0c8c7e283292ef3c1effac470b3d8b99b4dc76b41d95ffbd4507963',
    routeConstructed: false,
    recordIdUsedToInventRoute: false,
    facsimileBytesAcquired: false,
    facsimileVisuallyInspected: false,
    ocrUsedForEvidence: false,
    syntheticContentUsed: false,
    archiveOriginalInspected: false,
    productionAuthorized: false,
    rightsState: 'catalogue-and-viewer-access-inspected / reproduction-rights-unresolved',
    remainingTarget:
      'Obtain a literal institution-published viewer or copy route, then isolate and inspect the first-edition Yakulov scene.',
    limitation:
      'The official card states full open viewer access, but its free-access anchor is only href="#". The published client handler merely copies a data-read-url value, and no such value or working viewer route was present in the inspected card. No route was reconstructed from the record ID.',
  },
  {
    id: 'MA13-YE1-MARIENGOF-1928',
    historicalHoldId: 'PW6-YE1-MARIENGOF-1928',
    title: 'А. Б. Мариенгоф. Роман без вранья. Второе издание. Ленинград: Прибой, 1928',
    editionYear: 1928,
    catalogueUrl: 'https://search.rsl.ru/ru/record/01009215494',
    catalogueRecordId: '01009215494',
    catalogueExtent: '157 pages plus 3 pages of advertisements; viewer metadata reports 172 digital pages',
    state: 'viewer-api-verified-download-blocked',
    historicalCatalogueUrl: 'https://search.rsl.ru/ru/record/01009198586',
    metadataCorrectionReason:
      'The pass-six locator did not identify the second edition. Official RSL record 01009215494 identifies the 1928 second edition and exposes the literal card-to-viewer chain.',
    cardBytes: 66_985,
    cardSha256: 'c07c001f647654ee4d69af8da80d23882c6e68e81e85f58c98012dc32143dee8',
    literalCardViewerUrl:
      'https://search.rsl.ru/ru/view/01009215494?redirect=http://dlib.rsl.ru/rsl01009000000/rsl01009215000/rsl01009215494/rsl01009215494.pdf',
    literalViewerUrl: 'https://viewer.rsl.ru/rsl01009215494',
    literalViewerDocumentId: 'rsl01009215494',
    viewerInfoUrl: 'https://viewer.rsl.ru/api/v1/document/rsl01009215494/info',
    viewerInfoBytes: 2_771,
    viewerInfoSha256: '5d9c30a977aaa75c2446969525bddecf9052b6098d61d56dd23b3cff21348f92',
    viewerPageCount: 172,
    viewerFormats: ['pdf'],
    viewerAccessLevel: 'restricted',
    viewerAvailable: false,
    viewerDownloadable: false,
    viewerDownloadableFormats: [],
    acquisitionRunId: 30_138_036_528,
    researchArtifactDigest:
      'sha256:98e0b56ed89b3677cf06462c4e2ace1bc99e124afd622436cf191929353254e2',
    diagnosticArtifactDigest:
      'sha256:ab11eed4b0c8c7e283292ef3c1effac470b3d8b99b4dc76b41d95ffbd4507963',
    routeConstructed: false,
    recordIdUsedToInventRoute: false,
    facsimileBytesAcquired: false,
    facsimileVisuallyInspected: false,
    ocrUsedForEvidence: false,
    syntheticContentUsed: false,
    archiveOriginalInspected: false,
    productionAuthorized: false,
    rightsState: 'catalogue-and-viewer-access-inspected / reproduction-rights-unresolved',
    remainingTarget:
      'Obtain lawful full-text access and perform direct page-level comparison with the 1927 first edition.',
    limitation:
      'The literal card, dlib replacement rule, viewer document ID, distributed viewer API contract and /info response were verified. The server reports accessLevel="restricted", isAvailable=false, isDownloadable=false and no downloadable formats; therefore no PDF bytes or page text were accepted.',
  },
] as const satisfies readonly YeseninPartOneMariengofAccessPassThirteen[];
