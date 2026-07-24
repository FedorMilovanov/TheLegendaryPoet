export interface YeseninPartOneTheatricalMoscowPassElevenRecord {
  id: `TM11-YE1-${string}`;
  label: string;
  dateLabel: string;
  catalogueCode: string;
  catalogueUrl: string;
  bytes: number;
  sha256: string;
  pdfFrames: number;
  inspectedFrames: readonly string[];
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

/**
 * Exact NEB facsimiles and manual frame-level collation for four issues of
 * «Театральная Москва» from November–December 1921.
 *
 * Findings are deliberately narrower than the downloaded corpus. A frame is
 * listed only when its printed heading/date/name was visually checked on the
 * real scan. No claim is derived from OCR or a search snippet.
 */
export const yeseninPartOneTheatricalMoscowPassEleven = [
  {
    id: 'TM11-YE1-NO2',
    label: '1921, № 2',
    dateLabel: '1, 2 and 3 November 1921',
    catalogueCode: '000199_000009_013560962',
    catalogueUrl: 'https://rusneb.ru/catalog/000199_000009_013560962/',
    bytes: 7_982_255,
    sha256: '3d25919732a139957d18e35e69a9ea1360fe7644b8c99af52bc47622c327749f',
    pdfFrames: 18,
    inspectedFrames: ['PDF 01 cover and dates', 'PDF 06 / printed page 4'],
    verifiedPageFindings: [
      'PDF 01 identifies issue no. 2 and dates it to 1–3 November 1921.',
      'PDF 06 / printed page 4 carries the titled item «Айседора Дункан о Москве».',
      'The item presents a letter attributed to Duncan and says it was received by the Geneva Avant-Garde on 7/X.',
    ],
    promotedClaims: [
      'A contemporaneous Moscow theatrical newspaper published «Айседора Дункан о Москве» in issue no. 2.',
    ],
    unresolvedQuestions: [
      'The letter text requires a separate diplomatic transcription before quotation.',
      'No claim about Esenin is promoted from this issue in pass 11.',
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
    id: 'TM11-YE1-NO7',
    label: '1921, № 7',
    dateLabel: '15, 16 and 17 November 1921',
    catalogueCode: '000199_000009_013560972',
    catalogueUrl: 'https://rusneb.ru/catalog/000199_000009_013560972/',
    bytes: 11_209_854,
    sha256: '19ebd9b12a94ad3ff70e5b4b87cae2c1b5b9fe552dee6d385072382f129259f8',
    pdfFrames: 24,
    inspectedFrames: ['PDF 01 cover and dates', 'PDF 03 / printed page 3', 'PDF 06 / printed page 6'],
    verifiedPageFindings: [
      'PDF 01 identifies issue no. 7 and dates it to 15–17 November 1921.',
      'PDF 03 contains an editorial note and the «Листки» discussion of critical responses to Duncan.',
      'PDF 06 / printed page 6 carries the titled item «Спор о Дункан».',
      '«Спор о Дункан» explicitly refers to the great success of her dances at the evening of 7 November and names conductor N. S. Golovanov.',
    ],
    promotedClaims: [
      'Issue no. 7 provides contemporaneous reception evidence for Duncan’s 7 November Moscow performance.',
      'The newspaper records disagreement over the artistic value of Duncan’s dance rather than a single unanimous assessment.',
    ],
    unresolvedQuestions: [
      'Speaker attributions inside the debate require line-level transcription before direct quotation.',
      'The newspaper reception does not by itself establish Esenin’s attendance or the date of his first meeting with Duncan.',
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
    id: 'TM11-YE1-NO8',
    label: '1921, № 8',
    dateLabel: '18, 19 and 20 November 1921',
    catalogueCode: '000199_000009_013560974',
    catalogueUrl: 'https://rusneb.ru/catalog/000199_000009_013560974/',
    bytes: 11_587_545,
    sha256: '236bd3480451f0829b07b160c1b7cd1b2f103771fcf1e1ddf31852ba23dff1dc',
    pdfFrames: 24,
    inspectedFrames: ['PDF 01 cover and dates', 'PDF 02–04 sequence', 'PDF 03 printed header'],
    verifiedPageFindings: [
      'PDF 01 identifies issue no. 8 and dates it to 18–20 November 1921.',
      'PDF 03 prints an internal header marked no. 7 while adjacent PDF 02 and PDF 04 belong to the no. 8 sequence.',
      'The header anomaly requires frame-level citation and prevents treating the PDF sequence as self-evidently uniform.',
    ],
    promotedClaims: [],
    unresolvedQuestions: [
      'No Duncan or Esenin claim is promoted from issue no. 8 in pass 11.',
      'The internal no. 7 header may be a printing or scan-binding anomaly; pass 11 does not choose between those explanations.',
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
    id: 'TM11-YE1-NO11-12',
    label: '1921, № 11–12',
    dateLabel: '29–30 November and 1–4 December 1921',
    catalogueCode: '000199_000009_013560981',
    catalogueUrl: 'https://rusneb.ru/catalog/000199_000009_013560981/',
    bytes: 12_320_794,
    sha256: 'e800c77d8c2ba1d5d4b58f681a71c354c96757db434dc4bab65b41ad063a6ca8',
    pdfFrames: 28,
    inspectedFrames: ['PDF 01 cover and dates', 'PDF 08 / printed page 8', 'PDF 09 continuation context'],
    verifiedPageFindings: [
      'PDF 01 identifies the combined issue no. 11–12 and dates it from 29 November through 4 December 1921.',
      'PDF 08 / printed page 8 carries «Литературная богема Москвы!».',
      'The article names Esenin and Klyuev in its account of Moscow literary bohemia and literary groupings.',
    ],
    promotedClaims: [
      'The combined no. 11–12 supplies contemporaneous press evidence that Esenin and Klyuev were named figures in discussion of Moscow literary bohemia by late 1921.',
    ],
    unresolvedQuestions: [
      'The article requires full diplomatic transcription before quotation or stronger interpretation of group membership.',
      'No claim about the official opening of the Duncan school is promoted from this issue in pass 11.',
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
] as const satisfies readonly YeseninPartOneTheatricalMoscowPassElevenRecord[];
