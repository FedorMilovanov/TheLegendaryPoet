export interface YeseninPartOneNewspaperPassFourteenRecord {
  id: `NEWS14-YE1-${string}`;
  historicalHoldId: 'PW6-YE1-IZVESTIA-1921-SERIAL';
  label: string;
  dateLabel: string;
  issueNumber: string;
  catalogueCode: string;
  catalogueUrl: string;
  catalogueHtmlSha256: string;
  bytes: number;
  sha256: string;
  pdfFrames: number;
  inspectedFrames: readonly string[];
  articleTitle: string;
  verifiedSignature?: string;
  verifiedPageFindings: readonly string[];
  promotedClaims: readonly string[];
  unresolvedQuestions: readonly string[];
  realPdfAcquired: true;
  visuallyInspected: true;
  routeConstructed: false;
  ocrUsedForEvidence: false;
  syntheticContentUsed: false;
  archiveOriginalInspected: false;
  productionAuthorized: false;
  rightsState: 'open-digital-facsimile / reproduction-rights-unresolved';
}

export interface YeseninPartOneNewspaperPassFourteenCoverage {
  historicalHoldId: 'PW6-YE1-IZVESTIA-1921-SERIAL';
  effectiveStatus: 'superseded-by-acquisition';
  evidenceIds: readonly `NEWS14-YE1-${string}`[];
  verifiedTargetCoverage: readonly string[];
  remainingTargets: readonly [];
  supersedesHistoricalHold: true;
}

export interface YeseninPartOnePravdaPassFifteenAccessRecord {
  id: 'PR15-YE1-PRAVDA-1921-11-09';
  historicalHoldId: 'PW6-YE1-PRAVDA-1921-11-09';
  state: 'no-literal-official-central-moscow-match';
  target: string;
  officialParentInstitution: 'Российская государственная библиотека';
  officialParentUrl: 'https://search.rsl.ru/ru/record/01004548325';
  officialSearchQueries: 4;
  literalIssueCandidates: 0;
  inspectedCandidateCards: 0;
  acceptedCentralMoscowCards: 0;
  rejectedSameNamePublications: readonly string[];
  artifactSha256: string;
  catalogueIdConstructed: false;
  pdfRouteConstructed: false;
  ocrUsedForEvidence: false;
  syntheticContentUsed: false;
  productionAuthorized: false;
  remainingTarget: string;
}

/**
 * Three exact «Известия» issue PDFs acquired from literal official NEB card
 * routes and manually inspected at frame level. The broad historical serial
 * row remains immutable; this typed layer supplies the current operational
 * supersession edge. No claim is derived from OCR or search snippets.
 */
export const yeseninPartOneNewspaperPassFourteen = [
  {
    id: 'NEWS14-YE1-IZVESTIA-NO186',
    historicalHoldId: 'PW6-YE1-IZVESTIA-1921-SERIAL',
    label: 'Известия, 1921, № 186',
    dateLabel: '24 August 1921',
    issueNumber: '186',
    catalogueCode: '000199_000009_013351165',
    catalogueUrl: 'https://rusneb.ru/catalog/000199_000009_013351165/',
    catalogueHtmlSha256: '6f7a3021c97bb3b9e39efe58849c1d336279ea816603a14cc9ad73b7ad6c6236',
    bytes: 52_016_796,
    sha256: 'c8f83373f17c4c34bb059c624f81b917a2e5d4f4ed636d7735d398fb0789dd79',
    pdfFrames: 4,
    inspectedFrames: ['PDF 01 issue masthead and date', 'PDF 03 lower-page article'],
    articleTitle: 'Наша гостья.',
    verifiedSignature: 'А. ЛУНАЧАРСКИЙ',
    verifiedPageFindings: [
      'PDF 01 identifies issue no. 186 and dates it Wednesday, 24 August 1921.',
      'PDF 03 carries the titled article «Наша гостья.» and the printed signature «А. ЛУНАЧАРСКИЙ».',
      'The article presents Duncan’s arrival in Russia, her pedagogical ideas and intended artistic and school work in Moscow.',
    ],
    promotedClaims: [
      'On 24 August 1921 «Известия» published Lunacharsky’s contemporary programmatic article about Duncan’s arrival and pedagogical plans.',
    ],
    unresolvedQuestions: [
      'The article is not an administrative act proving that a school was formally opened or operational on that date.',
      'Direct quotation requires a separate diplomatic transcription of the printed columns.',
      'The article does not establish Esenin’s first-meeting date or attendance at any Duncan event.',
    ],
    realPdfAcquired: true,
    visuallyInspected: true,
    routeConstructed: false,
    ocrUsedForEvidence: false,
    syntheticContentUsed: false,
    archiveOriginalInspected: false,
    productionAuthorized: false,
    rightsState: 'open-digital-facsimile / reproduction-rights-unresolved',
  },
  {
    id: 'NEWS14-YE1-IZVESTIA-NO251',
    historicalHoldId: 'PW6-YE1-IZVESTIA-1921-SERIAL',
    label: 'Известия, 1921, № 251',
    dateLabel: '9 November 1921',
    issueNumber: '251',
    catalogueCode: '000199_000009_013351339',
    catalogueUrl: 'https://rusneb.ru/catalog/000199_000009_013351339/',
    catalogueHtmlSha256: 'd7a88d0aa1bbf3f0233c3399a9319240f8730a869977497d80565513cf0cc225',
    bytes: 23_798_944,
    sha256: '0e35e292398e6b281c43bd016fd94d62df3981476aa0ed79d4130d987c98ef99',
    pdfFrames: 2,
    inspectedFrames: ['PDF 01 issue masthead and date', 'PDF 02 arts-and-culture column'],
    articleTitle: 'Айседора Дункан. (Первое выступление 7 ноября).',
    verifiedPageFindings: [
      'PDF 01 identifies issue no. 251 and dates it Wednesday, 9 November 1921.',
      'PDF 02 carries «Айседора Дункан. (Первое выступление 7 ноября).» under «Искусство и культура».',
      'The opening paragraph identifies the venue as the Academic Bolshoi Theatre and reviews the performance as a major artistic event.',
      'The review discusses Duncan’s plastic and mimetic interpretation of music, including Tchaikovsky’s Sixth Symphony and Slavonic March.',
    ],
    promotedClaims: [
      'A same-week contemporary review in «Известия» explicitly documents Duncan’s first 7 November performance at the Academic Bolshoi Theatre.',
      'The review records an affirmative artistic reception rather than an official program, attendance list or first-meeting record.',
    ],
    unresolvedQuestions: [
      'The reviewer’s printed signature requires a dedicated diplomatic transcription before attribution.',
      'The review does not establish Esenin’s attendance or his first meeting with Duncan.',
      'The review does not prove that Duncan’s Moscow school had formally opened.',
    ],
    realPdfAcquired: true,
    visuallyInspected: true,
    routeConstructed: false,
    ocrUsedForEvidence: false,
    syntheticContentUsed: false,
    archiveOriginalInspected: false,
    productionAuthorized: false,
    rightsState: 'open-digital-facsimile / reproduction-rights-unresolved',
  },
  {
    id: 'NEWS14-YE1-IZVESTIA-NO263',
    historicalHoldId: 'PW6-YE1-IZVESTIA-1921-SERIAL',
    label: 'Известия, 1921, № 263',
    dateLabel: '23 November 1921',
    issueNumber: '263',
    catalogueCode: '000199_000009_013351387',
    catalogueUrl: 'https://rusneb.ru/catalog/000199_000009_013351387/',
    catalogueHtmlSha256: '1fff2332f141dde395c2f606c9044611127d3cb4d3733bec5554729d49ddd900',
    bytes: 49_148_667,
    sha256: 'b3e007bf66bf9efafd103481f2108ba315770627b4df35fa503ad31c241fcdec',
    pdfFrames: 4,
    inspectedFrames: ['PDF 01 issue masthead and date', 'PDF 04 arts-and-culture column'],
    articleTitle: 'Искусство для масс.',
    verifiedSignature: 'А. АЙСЕДОРА ДУНКАН',
    verifiedPageFindings: [
      'PDF 01 identifies issue no. 263 and dates it Wednesday, 23 November 1921.',
      'PDF 04 carries «Искусство для масс.» under «Искусство и культура» and the printed signature «А. АЙСЕДОРА ДУНКАН».',
      'The article argues for art addressed to workers and children and describes a Moscow school and mass-facing theatre program as intended work.',
      'It proposes regular public artistic evenings associated with the Bolshoi Theatre and links the school to children of the workers attending them.',
    ],
    promotedClaims: [
      'On 23 November 1921 «Известия» printed a programmatic text attributed and signed to Isadora Duncan about art for the masses and her intended Moscow school and theatre work.',
    ],
    unresolvedQuestions: [
      'Programmatic intention is not proof that the school was formally opened, staffed or operating by 23 November.',
      'The article does not establish Esenin’s attendance, first-meeting date or role in the school project.',
      'Direct quotation requires a separate diplomatic transcription of the printed columns.',
    ],
    realPdfAcquired: true,
    visuallyInspected: true,
    routeConstructed: false,
    ocrUsedForEvidence: false,
    syntheticContentUsed: false,
    archiveOriginalInspected: false,
    productionAuthorized: false,
    rightsState: 'open-digital-facsimile / reproduction-rights-unresolved',
  },
] as const satisfies readonly YeseninPartOneNewspaperPassFourteenRecord[];

export const yeseninPartOneNewspaperPassFourteenCoverage = {
  historicalHoldId: 'PW6-YE1-IZVESTIA-1921-SERIAL',
  effectiveStatus: 'superseded-by-acquisition',
  evidenceIds: yeseninPartOneNewspaperPassFourteen.map((record) => record.id),
  verifiedTargetCoverage: [
    'The exact 24 August, 9 November and 23 November 1921 «Известия» issue PDFs are acquired, hashed and manually inspected.',
    'The 24 August issue contains Lunacharsky’s «Наша гостья.».',
    'The 9 November issue contains the contemporary review «Айседора Дункан. (Первое выступление 7 ноября).».',
    'The 23 November issue contains Duncan’s signed «Искусство для масс.».',
  ],
  remainingTargets: [],
  supersedesHistoricalHold: true,
} as const satisfies YeseninPartOneNewspaperPassFourteenCoverage;

/**
 * Exact-issue discovery for the Moscow central-party «Правда» remains negative.
 * Same-name regional titles were deliberately rejected, so this access record
 * explains the search boundary without satisfying or weakening the old HOLD.
 */
export const yeseninPartOnePravdaPassFifteenAccess = {
  id: 'PR15-YE1-PRAVDA-1921-11-09',
  historicalHoldId: 'PW6-YE1-PRAVDA-1921-11-09',
  state: 'no-literal-official-central-moscow-match',
  target: 'Правда, Москва, 9 November 1921, no. 252',
  officialParentInstitution: 'Российская государственная библиотека',
  officialParentUrl: 'https://search.rsl.ru/ru/record/01004548325',
  officialSearchQueries: 4,
  literalIssueCandidates: 0,
  inspectedCandidateCards: 0,
  acceptedCentralMoscowCards: 0,
  rejectedSameNamePublications: ['Деревенская правда', 'Правда Севера', 'Правда Востока'],
  artifactSha256: 'd02149ce5d760cc07014d283faceff3f5e6c051c0d79125f709447b52246dc1c',
  catalogueIdConstructed: false,
  pdfRouteConstructed: false,
  ocrUsedForEvidence: false,
  syntheticContentUsed: false,
  productionAuthorized: false,
  remainingTarget:
    'Locate the exact Moscow central-party issue card or reading-room/copy object for 9 November 1921 and inspect the relevant page.',
} as const satisfies YeseninPartOnePravdaPassFifteenAccessRecord;

export const yeseninPartOneNewspaperPassFourteenArtifact = {
  discoveryArtifactSha256: 'd06600474df1449a7fa0a17355cc6cca0370e17eba35245fcdecaa3f2f655dde',
  acquisitionArtifactSha256: '66520651ad99e962e2fd160d2fe606d517f8a9e410dd16c504f50dbe6e7ff206',
  totalPdfBytes: 124_964_407,
  totalPdfFrames: 10,
  realPdfObjects: 3,
  ocrUsedForEvidence: false,
  productionAuthorized: false,
} as const;
