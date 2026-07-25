export type YeseninMirokPassSeventeenIssueState =
  | 'exact-neb-card / pdf-acquired / visually-inspected'
  | 'literal-neb-issue-card-unresolved';

export interface YeseninMirokPdfEvidencePassSeventeenRecord {
  id: `MIROK17-YE1-${string}`;
  year: 1914;
  book: 2 | 4;
  month: 'February' | 'April';
  catalogueCode: string;
  catalogueUrl: string;
  catalogueHtmlBytes: number;
  catalogueHtmlSha256: string;
  pdfBytes: number;
  pdfFrames: 40;
  pdfSha256: string;
  targetTitle: 'Пороша' | 'Пасхальный благовест';
  printedPage: 46 | 124;
  inspectedPdfFrame: 20 | 30;
  printedTitle: string;
  printedSignature: 'Сергѣй Есенинъ';
  visualFindings: readonly string[];
  febControlUrl: 'https://feb-web.ru/feb/esenin/texts/e74/e74-323-.htm?cmd=p';
  state: 'exact-neb-card / pdf-acquired / visually-inspected';
  realPdfAcquired: true;
  magicBytesVerified: true;
  independentlyRehashed: true;
  visuallyInspected: true;
  ocrUsedForNavigationOnly: true;
  ocrUsedForEvidence: false;
  catalogueArithmeticUsed: false;
  routeConstructed: false;
  syntheticContentUsed: false;
  archiveOriginalInspected: false;
  productionAuthorized: false;
  rightsState: 'open-digital-facsimile / reproduction-rights-unresolved';
}

export interface YeseninMirokUnresolvedPassSeventeenRecord {
  id: `MIROK17-YE1-UNRESOLVED-${1 | 3 | 7 | 12}`;
  year: 1914;
  book: 1 | 3 | 7 | 12;
  targetTitle: 'Берёза' | 'Село' | 'С добрым утром!' | 'Сиротка';
  printedPages: '10' | '85' | '219' | '364–368';
  state: 'literal-neb-issue-card-unresolved';
  parentSeriesInspected: true;
  officialNebSearchPerformed: true;
  literalIssueCardsAccepted: 0;
  catalogueArithmeticUsed: false;
  pdfRouteConstructed: false;
  contentInspected: false;
  productionAuthorized: false;
}

/**
 * Two literal 1914 «Мирок» issue PDFs acquired from the official NEB serial
 * page and visually inspected against the printed page targets fixed by the
 * FEB/PSS commentary. Embedded OCR was used only to locate candidate frames;
 * every evidentiary finding below was verified on rendered facsimile pages.
 */
export const yeseninMirokPdfEvidencePassSeventeen = [
  {
    id: 'MIROK17-YE1-BOOK-2',
    year: 1914,
    book: 2,
    month: 'February',
    catalogueCode: '000199_000009_013508098',
    catalogueUrl: 'https://rusneb.ru/catalog/000199_000009_013508098/',
    catalogueHtmlBytes: 57_942,
    catalogueHtmlSha256: '7a6fb56df74bc66f5deb3c3b0a31d03304946b880f5daacbed17f845372e6b20',
    pdfBytes: 30_792_767,
    pdfFrames: 40,
    pdfSha256: '6bccf4e8a8783454c2e6bf644ac1871a97d6dd57c4b40691e40900c26bc4652b',
    targetTitle: 'Пороша',
    printedPage: 46,
    inspectedPdfFrame: 20,
    printedTitle: 'ПОРОША.',
    printedSignature: 'Сергѣй Есенинъ',
    visualFindings: [
      'PDF frame 19 carries printed page 45; the following PDF frame 20 is therefore printed page 46.',
      'PDF frame 20 displays the complete four-stanza poem under the title «ПОРОША.».',
      'The printed author line at the foot of the page reads «Сергѣй Есенинъ».',
      'The wording visibly includes «А подъ самою макушкой», matching the first-publication variant identified by the FEB commentary.',
    ],
    febControlUrl: 'https://feb-web.ru/feb/esenin/texts/e74/e74-323-.htm?cmd=p',
    state: 'exact-neb-card / pdf-acquired / visually-inspected',
    realPdfAcquired: true,
    magicBytesVerified: true,
    independentlyRehashed: true,
    visuallyInspected: true,
    ocrUsedForNavigationOnly: true,
    ocrUsedForEvidence: false,
    catalogueArithmeticUsed: false,
    routeConstructed: false,
    syntheticContentUsed: false,
    archiveOriginalInspected: false,
    productionAuthorized: false,
    rightsState: 'open-digital-facsimile / reproduction-rights-unresolved',
  },
  {
    id: 'MIROK17-YE1-BOOK-4',
    year: 1914,
    book: 4,
    month: 'April',
    catalogueCode: '000199_000009_013508100',
    catalogueUrl: 'https://rusneb.ru/catalog/000199_000009_013508100/',
    catalogueHtmlBytes: 57_942,
    catalogueHtmlSha256: '10cc0f920f5101d625c594329886cf7a7876000edf75900385ea491bc91562ce',
    pdfBytes: 29_702_539,
    pdfFrames: 40,
    pdfSha256: '3b98a4b9e14bcf84241b1ea058ffc7cc4cde35e2faf6b268bdc6d2f91cc91e7f',
    targetTitle: 'Пасхальный благовест',
    printedPage: 124,
    inspectedPdfFrame: 30,
    printedTitle: 'Пасхальный благовѣстъ.',
    printedSignature: 'Сергѣй Есенинъ',
    visualFindings: [
      'PDF frame 29 visibly carries printed page 123; PDF frame 30 is the following printed page 124.',
      'PDF frame 30 displays the complete poem under the title «Пасхальный благовѣстъ.».',
      'The first line reads «Колоколъ дрѣмавшій», corresponding to the later untitled text «Колокол дремавший…».',
      'The printed author line reads «Сергѣй Есенинъ» and the page includes the original church-and-night illustrations.',
    ],
    febControlUrl: 'https://feb-web.ru/feb/esenin/texts/e74/e74-323-.htm?cmd=p',
    state: 'exact-neb-card / pdf-acquired / visually-inspected',
    realPdfAcquired: true,
    magicBytesVerified: true,
    independentlyRehashed: true,
    visuallyInspected: true,
    ocrUsedForNavigationOnly: true,
    ocrUsedForEvidence: false,
    catalogueArithmeticUsed: false,
    routeConstructed: false,
    syntheticContentUsed: false,
    archiveOriginalInspected: false,
    productionAuthorized: false,
    rightsState: 'open-digital-facsimile / reproduction-rights-unresolved',
  },
] as const satisfies readonly YeseninMirokPdfEvidencePassSeventeenRecord[];

export const yeseninMirokUnresolvedPassSeventeen = [
  {
    id: 'MIROK17-YE1-UNRESOLVED-1',
    year: 1914,
    book: 1,
    targetTitle: 'Берёза',
    printedPages: '10',
    state: 'literal-neb-issue-card-unresolved',
    parentSeriesInspected: true,
    officialNebSearchPerformed: true,
    literalIssueCardsAccepted: 0,
    catalogueArithmeticUsed: false,
    pdfRouteConstructed: false,
    contentInspected: false,
    productionAuthorized: false,
  },
  {
    id: 'MIROK17-YE1-UNRESOLVED-3',
    year: 1914,
    book: 3,
    targetTitle: 'Село',
    printedPages: '85',
    state: 'literal-neb-issue-card-unresolved',
    parentSeriesInspected: true,
    officialNebSearchPerformed: true,
    literalIssueCardsAccepted: 0,
    catalogueArithmeticUsed: false,
    pdfRouteConstructed: false,
    contentInspected: false,
    productionAuthorized: false,
  },
  {
    id: 'MIROK17-YE1-UNRESOLVED-7',
    year: 1914,
    book: 7,
    targetTitle: 'С добрым утром!',
    printedPages: '219',
    state: 'literal-neb-issue-card-unresolved',
    parentSeriesInspected: true,
    officialNebSearchPerformed: true,
    literalIssueCardsAccepted: 0,
    catalogueArithmeticUsed: false,
    pdfRouteConstructed: false,
    contentInspected: false,
    productionAuthorized: false,
  },
  {
    id: 'MIROK17-YE1-UNRESOLVED-12',
    year: 1914,
    book: 12,
    targetTitle: 'Сиротка',
    printedPages: '364–368',
    state: 'literal-neb-issue-card-unresolved',
    parentSeriesInspected: true,
    officialNebSearchPerformed: true,
    literalIssueCardsAccepted: 0,
    catalogueArithmeticUsed: false,
    pdfRouteConstructed: false,
    contentInspected: false,
    productionAuthorized: false,
  },
] as const satisfies readonly YeseninMirokUnresolvedPassSeventeenRecord[];

export const yeseninMirokPassSeventeenEnvelope = {
  parentSeriesTitle: 'Мирок : ежемесячный иллюстрированный детский журнал для семьи и начальной школы',
  parentSeriesCode: '000199_000009_006697247',
  parentSeriesUrl: 'https://rusneb.ru/catalog/000199_000009_006697247/',
  publisher: 'Т-во И. Д. Сытин',
  acquiredIssueBooks: [2, 4],
  unresolvedIssueBooks: [1, 3, 7, 12],
  acquiredPdfObjects: 2,
  acquiredPdfBytes: 60_495_306,
  acquiredPdfFrames: 80,
  officialNebSearchRoutesForUnresolvedIssues: 32,
  diagnosticWorkflowRunId: 30_165_843_617,
  diagnosticArtifactId: 8_621_566_554,
  diagnosticArtifactSha256: '49a69a6b9d762f7942099212a0aec62c48757a2a51cfa717e5ea0882bfd57da1',
  diagnosticPr: 154,
  diagnosticPrMerged: false,
  pdfBinariesCommittedToRepository: false,
  wikipediaUsedAsEvidence: false,
  publicationAuthorized: false,
  productionAuthorized: false,
} as const;
