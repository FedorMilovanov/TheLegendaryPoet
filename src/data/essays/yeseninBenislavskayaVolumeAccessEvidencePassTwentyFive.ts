export type BenislavskayaVolumeAccessGradePassTwentyFive = 'A+' | 'A' | 'B' | 'EXCLUDED';

export interface BenislavskayaVolumeAccessRecordPassTwentyFive {
  readonly id: string;
  readonly grade: BenislavskayaVolumeAccessGradePassTwentyFive;
  readonly kind: string;
  readonly requestedUrl: string;
  readonly finalUrl: string;
  readonly htmlBytes: number;
  readonly htmlSha256: string;
  readonly visibleTextSha256: string;
  readonly exactIdentityPassed: boolean | null;
  readonly legalDigitalFullTextFound: false;
  readonly note: string;
}

export const YESENIN_BENISLAVSKAYA_VOLUME_ACCESS_PASS_TWENTY_FIVE = {
  pass: 25,
  acceptedDiagnostic: {
    pullRequest: 201,
    diagnosticMerged: false,
    exactHead: 'ef4c8ae361491e2ff2b13b788dc12fc40e646985',
    workflowRunId: 30177127505,
    artifactId: 8624522473,
    artifactDigest: 'sha256:65f2aa3aa4b031e5707fd765a3b9676f033b9296c20add8d9c997ef4512c073d',
  },
  targetVolume: {
    title: 'Сергей Есенин в стихах и жизни. Книга 3: Письма. Документы',
    publicationPlace: 'Москва',
    publisher: 'Республика',
    year: 1995,
    extentPages: 607,
    isbn10: '5-250-02529-3',
    isbn13: '978-5-250-02529-4',
    ncid: 'BA27980118',
    targetPrintedPageStart: 236,
    targetPrintedPageEnd: 280,
    targetPageCountInclusive: 45,
  },
  records: [
    {
      id: 'P25-CINII-BA27980118',
      grade: 'A',
      kind: 'institutional-union-catalog',
      requestedUrl: 'https://ci.nii.ac.jp/ncid/BA27980118',
      finalUrl: 'https://ci.nii.ac.jp/ncid/BA27980118',
      htmlBytes: 57073,
      htmlSha256: '5c01eaa84cb3c7041d9a02a5d12f061ecf384e4ea5ad2f29107610e69dbc056a',
      visibleTextSha256: '0eb42193991356225d0ddac8e3da2c9c1059ba3ea28cd1a2fc1d5a713705872d',
      exactIdentityPassed: true,
      legalDigitalFullTextFound: false,
      note: 'Confirms NCID, ISBN and multi-library physical holdings; no full-text route.',
    },
    {
      id: 'P25-GORKY-BOOK-PAGE',
      grade: 'A',
      kind: 'institutional-book-page',
      requestedUrl: 'https://www.gorkilib.ru/events/sergey-esenin-v-stikhakh-i-zhizni-pisma-dokumenty-1912',
      finalUrl: 'https://www.gorkilib.ru/events/sergey-esenin-v-stikhakh-i-zhizni-pisma-dokumenty-1912',
      htmlBytes: 40033,
      htmlSha256: 'fefd0d83d8a578f6bea883d645e9727355b793e5753d0517cb4c9ea575e5012f',
      visibleTextSha256: '00fda17d3a77eee12e72267babd0bd6b827363247fe1fe9b5003ed99d11bea07',
      exactIdentityPassed: true,
      legalDigitalFullTextFound: false,
      note: 'Exact institutional book page links to the library electronic-document-delivery service.',
    },
    {
      id: 'P25-GORKY-EDD-POLICY',
      grade: 'A+',
      kind: 'institutional-document-delivery-policy',
      requestedUrl: 'https://www.gorkilib.ru/feedback/electronic_document/',
      finalUrl: 'https://www.gorkilib.ru/feedback/electronic_document/',
      htmlBytes: 46359,
      htmlSha256: '34e390bbfd0fc381f8f47b6998b9db926a2c64264fe1bb60e0755ae6ca6871f5',
      visibleTextSha256: 'ae353d535466bf28a41ac22ef5b2c47dcee71f5e7c4a717f6bcde6c1f183ea9e',
      exactIdentityPassed: true,
      legalDigitalFullTextFound: false,
      note: 'Official EDD policy allows short book fragments for personal, scientific and educational use; fulfilment is decided by the library.',
    },
    {
      id: 'P25-DUBNA-BOOK-LISTING',
      grade: 'A',
      kind: 'institutional-library-listing',
      requestedUrl: 'https://lib.uni-dubna.ru/biblweb/expo/exposition_cycle.asp?cycle=none&exid=840',
      finalUrl: 'https://lib.uni-dubna.ru/biblweb/expo/exposition_cycle.asp?cycle=none&exid=840',
      htmlBytes: 38453,
      htmlSha256: 'd9f18436ef9eb9a0dc7ffa1277a24e131e1831ddc8b972706a426afa2c080172',
      visibleTextSha256: '44b4c6e227f795636d219eaa7cc7a23ca3c5a1f587365764d24ded479eda407e',
      exactIdentityPassed: true,
      legalDigitalFullTextFound: false,
      note: 'Exact institutional listing; the site journal-order link is explicitly irrelevant to this book.',
    },
    {
      id: 'P25-HEIDELBERG-REDIRECT-BOUNDARY',
      grade: 'A',
      kind: 'institutional-catalog-redirect-boundary',
      requestedUrl: 'https://katalog.ub.uni-heidelberg.de/titel/9713910',
      finalUrl: 'https://uni-heidelberg.on.worldcat.org/oclc/174224104',
      htmlBytes: 628,
      htmlSha256: 'dd483a204e573819c0895c539812568e9badc91395fbe186958feadeb19202ec',
      visibleTextSha256: '69eca09463a751c3ee7f6188f3583eb93a2ba4dcdfa2da29a68c53c6fb4bc954',
      exactIdentityPassed: null,
      legalDigitalFullTextFound: false,
      note: 'The institutional item URL redirects to a minimal WorldCat shell; the diagnostic bytes do not independently establish the bibliographic identity.',
    },
  ] as readonly BenislavskayaVolumeAccessRecordPassTwentyFive[],
  remoteScanRoute: {
    authority: 'Пермская государственная краевая универсальная библиотека им. А. М. Горького',
    exactBookPageVerified: true,
    officialEddPolicyVerified: true,
    onlineApplicationUrl: 'https://www.gorkilib.ru/feedback/forma_electronic_document/',
    contactEmail: 'mba@gorkilib.ru',
    requestsMayBeSubmittedRemotely: true,
    shortBookFragmentsAllowed: true,
    pageRateRubles: 20,
    targetPageCountInclusive: 45,
    estimatedBasePageCostRubles: 900,
    additionalSearchOrHolderChargesPossible: true,
    fulfilmentSubjectToLibraryReview: true,
    requestSubmitted: false,
    paymentAuthorized: false,
    scanAcquired: false,
  },
  excludedFalsePositives: {
    ciniiSortOrderIsOrderRoute: false,
    dubnaJournalOrderAppliesToBook: false,
    servicePolicyPdfIsTargetBookFullText: false,
    worldcatRateLimitIsEvidenceOfAbsence: false,
  },
  effectiveState: {
    exactInstitutionalIdentityRecords: 4,
    legalDigitalFullTextFound: false,
    relevantRemoteScanRouteVerified: true,
    targetPagesAcquired: false,
    requestSubmitted: false,
    paymentMade: false,
    archiveOriginalsInspected: false,
    articlePublished: false,
    articleRegistered: false,
    productionAuthorized: false,
    wikipediaUsedAsEvidence: false,
    syntheticContentUsed: false,
  },
} as const;
