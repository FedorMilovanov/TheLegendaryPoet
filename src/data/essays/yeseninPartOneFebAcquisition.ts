export type YeseninFebEvidenceLayer = 'published-page';
export type YeseninFebRightsStatus = 'unresolved';

export interface YeseninFebAcquiredRecord {
  id: string;
  witnessId: string;
  claimIds: readonly string[];
  printedPage: number;
  sourcePageUrl: string;
  exactImageUrl: string;
  sourceSha256: string;
  description: string;
  layer: YeseninFebEvidenceLayer;
  rightsStatus: YeseninFebRightsStatus;
  archiveOriginalInspected: false;
  productionReuseAuthorized: false;
  limitations: readonly string[];
}

export const yeseninPartOneFebAcquisitionRun11 = {
  workflow: 'Source acquisition 76 — Yesenin FEB page witnesses',
  runNumber: 11,
  runId: 30104627205,
  headSha: '5d33eb1adfccc4f43a9eafbf8d72ae3ac8769918',
  artifactName: 'yesenin-feb-page-witnesses-76',
  artifactSizeBytes: 1_524_969,
  artifactDigest: 'b057dcc655b15e6e729216c922d9692059fff91c3c80bbafc74e366edf38aa01',
  conclusion: 'success',
  targetCount: 4,
  exactImageCount: 6,
  identifiedTargetCount: 4,
  exactBytesCompleteTargetCount: 3,
  technicalErrorCount: 0,
} as const;

/**
 * Exact FEB bytes accepted only at the published-page layer after independent
 * manifest and visual inspection. None of these records authorizes production
 * reuse or claims direct inspection of an archive original.
 */
export const yeseninPartOneFebAcquiredRecords = [
  {
    id: 'feb-ye1-school-certificate-545',
    witnessId: 'wit-ye1-school-certificate-545',
    claimIds: ['YE1-004'],
    printedPage: 545,
    sourcePageUrl: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-485-.htm?cmd=p',
    exactImageUrl: 'https://feb-web.ru/feb/esenin/pictures/el1-545-.jpg',
    sourceSha256: 'cc608f256a4102c968b6c1401f83a95c475cad738db1c4e6cfa4c5d88674dd10',
    description: 'Published full-page reproduction of the Spas-Klepiki second-class teacher-school completion certificate.',
    layer: 'published-page',
    rightsStatus: 'unresolved',
    archiveOriginalInspected: false,
    productionReuseAuthorized: false,
    limitations: [
      'Holding institution/object number and recto-verso completeness remain unresolved.',
      'Reproduction-rights basis has not been accepted.',
    ],
  },
  {
    id: 'feb-ye1-train-assignment-673',
    witnessId: 'wit-ye1-train-assignment-672-674',
    claimIds: ['YE1-016'],
    printedPage: 673,
    sourcePageUrl: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-669-.htm?cmd=p',
    exactImageUrl: 'https://feb-web.ru/feb/esenin/pictures/el1-673-.jpg',
    sourceSha256: 'b9ce49137fa139faa1ee47e8e33d6e4592ac2d4bed1e2b69ac8da88c167c1484',
    description: 'Published notice assigning Yesenin through the Petrograd reserve of orderlies to military-sanitary train no. 143.',
    layer: 'published-page',
    rightsStatus: 'unresolved',
    archiveOriginalInspected: false,
    productionReuseAuthorized: false,
    limitations: [
      'The FEB page is not direct inspection of the controlling RGIA original.',
      'This record does not establish infirmary no. 17 as the formal unit.',
    ],
  },
  {
    id: 'feb-ye1-train-report-688',
    witnessId: 'wit-ye1-train-reports-688-691',
    claimIds: ['YE1-016'],
    printedPage: 688,
    sourcePageUrl: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-669-.htm?cmd=p',
    exactImageUrl: 'https://feb-web.ru/feb/esenin/pictures/el1-688-.jpg',
    sourceSha256: '1c0a3369871c1bac53e772875e17213dc974700fd22a20ce0a5fee281bbfd1c1',
    description: 'Published first page of the commandant report on the 30th and 31st trips of train no. 143.',
    layer: 'published-page',
    rightsStatus: 'unresolved',
    archiveOriginalInspected: false,
    productionReuseAuthorized: false,
    limitations: ['The complete RGIA file and all report folios remain archive-only targets.'],
  },
  {
    id: 'feb-ye1-train-report-689',
    witnessId: 'wit-ye1-train-reports-688-691',
    claimIds: ['YE1-016'],
    printedPage: 689,
    sourcePageUrl: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-669-.htm?cmd=p',
    exactImageUrl: 'https://feb-web.ru/feb/esenin/pictures/el1-689-.jpg',
    sourceSha256: '125a35316ae95e591e59b8a9c0292aca7a80791e8045b7bbf1bc111935ce8304',
    description: 'Published first page of the commandant report on the 32nd trip of train no. 143.',
    layer: 'published-page',
    rightsStatus: 'unresolved',
    archiveOriginalInspected: false,
    productionReuseAuthorized: false,
    limitations: ['The complete RGIA file and all report folios remain archive-only targets.'],
  },
  {
    id: 'feb-ye1-train-personnel-photo-690',
    witnessId: 'wit-ye1-train-reports-688-691',
    claimIds: ['YE1-016'],
    printedPage: 690,
    sourcePageUrl: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-669-.htm?cmd=p',
    exactImageUrl: 'https://feb-web.ru/feb/esenin/pictures/el1-690-.jpg',
    sourceSha256: '08465a4383e3afa2d9fa087c61a006e750c6fc6c395a343ebf26c0fbfb5ad8ef',
    description: 'Published photograph of Yesenin among the personnel of the Field Tsarskoye Selo military-sanitary train no. 143.',
    layer: 'published-page',
    rightsStatus: 'unresolved',
    archiveOriginalInspected: false,
    productionReuseAuthorized: false,
    limitations: [
      'Photographer, original object provenance and reuse rights remain unresolved.',
      'A separate media-provenance decision is mandatory before production use.',
    ],
  },
  {
    id: 'feb-ye1-train-report-691',
    witnessId: 'wit-ye1-train-reports-688-691',
    claimIds: ['YE1-016'],
    printedPage: 691,
    sourcePageUrl: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-669-.htm?cmd=p',
    exactImageUrl: 'https://feb-web.ru/feb/esenin/pictures/el1-691-.jpg',
    sourceSha256: 'f803ce1dd8649de3e7ee496d4596b23635452f768a2aefb51ae33d9d5d388510',
    description: 'Published first page of the commandant report on the 33rd trip of train no. 143.',
    layer: 'published-page',
    rightsStatus: 'unresolved',
    archiveOriginalInspected: false,
    productionReuseAuthorized: false,
    limitations: ['The complete RGIA file and all report folios remain archive-only targets.'],
  },
] as const satisfies readonly YeseninFebAcquiredRecord[];

export const yeseninPartOneFebPendingTargets = [
  {
    id: 'feb-ye1-sirena-cover-621',
    witnessId: 'wit-ye1-imagist-sirena-cover-621',
    claimIds: ['YE1-023'],
    printedPage: 621,
    status: 'route-and-bytes-pending',
    rejectedGuesses: [
      'https://feb-web.ru/feb/esenin/pictures/el2-621-.jpg',
      'https://feb-web.ru/feb/esenin/pictures/el2-621-1.jpg',
      'https://feb-web.ru/feb/esenin/pictures/el2-621-2.jpg',
    ],
    limitations: [
      'Printed page 621 contains two different objects and therefore requires role confirmation.',
      'The cover does not replace the internal declaration pages or the Sovetskaya strana no. 3 witness.',
      'Printed date and probable public-release date remain separate claims.',
    ],
  },
] as const;
