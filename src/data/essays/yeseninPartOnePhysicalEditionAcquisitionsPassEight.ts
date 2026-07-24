export interface YeseninPartOnePhysicalEditionAcquisitionPassEight {
  id: `PWA8-YE1-${string}`;
  objectId: `NEB-YE1-${string}`;
  title: string;
  catalogueUrl: string;
  catalogueCode: string;
  holding: string;
  linkedSourceIds: readonly string[];
  supersedesHoldId?: `PW6-YE1-${string}`;
  printedExtent: string;
  pdfFrames: number;
  bytes: number;
  sha256: string;
  inspectedFrameRanges: readonly string[];
  verifiedContents: readonly string[];
  facsimileBytesAcquired: true;
  facsimileVisuallyInspected: true;
  ocrUsedForEvidence: false;
  syntheticContentUsed: false;
  archiveOriginalInspected: false;
  productionAuthorized: false;
  rightsState: 'open-digital-facsimile / reproduction-rights-unresolved';
  limitation: string;
}

/**
 * Acquisition overlay for physical-edition targets that were previously only
 * represented by catalogue records or unresolved HOLDs.
 *
 * The overlay preserves history: it does not rewrite the pass-six queue as if
 * the PDFs had always been available. It records exactly which digital
 * facsimiles were later downloaded, hashed and visually inspected.
 */
export const yeseninPartOnePhysicalEditionAcquisitionsPassEight = [
  {
    id: 'PWA8-YE1-RADUNITSA-1916',
    objectId: 'NEB-YE1-RADUNITSA-1916',
    title: 'С. А. Есенин. Радуница. Петроград: М. В. Аверьянов, 1916',
    catalogueUrl: 'https://rusneb.ru/catalog/000199_000009_004210209/',
    catalogueCode: '000199_000009_004210209',
    holding: 'Российская государственная библиотека / Национальная электронная библиотека',
    linkedSourceIds: ['ye1-radunitsa-first-edition-neb'],
    printedExtent: '62 printed pages packaged as 35 PDF frames',
    pdfFrames: 35,
    bytes: 49_288_163,
    sha256: '761ba9c1eb41e0d6e146618c8d5cb30bb79485d02587e0161523a819cd753185',
    inspectedFrameRanges: ['PDF 01–35', 'title PDF 03', 'verso and Rus section PDF 04', 'contents PDF 32–33'],
    verifiedContents: [
      'two-part composition: Русь / Маковые побаски',
      'Чую радуницу Божью on printed pages 58–59 / PDF 31',
      'publisher M. V. Averyanov and Petrograd 1916 on the title page',
    ],
    facsimileBytesAcquired: true,
    facsimileVisuallyInspected: true,
    ocrUsedForEvidence: false,
    syntheticContentUsed: false,
    archiveOriginalInspected: false,
    productionAuthorized: false,
    rightsState: 'open-digital-facsimile / reproduction-rights-unresolved',
    limitation:
      'The NEB PDF is a real library scan, not the archive original. Page descriptions may be cited, but scan republication remains blocked pending an individual rights decision.',
  },
  {
    id: 'PWA8-YE1-ISPOVED-1921',
    objectId: 'NEB-YE1-ISPOVED-1921',
    title: 'С. А. Есенин. Исповедь хулигана. Москва, 1921',
    catalogueUrl: 'https://rusneb.ru/catalog/000200_000018_RU_NLR_A1SV_46698/',
    catalogueCode: '000200_000018_RU_NLR_A1SV_46698',
    holding: 'Российская национальная библиотека / Национальная электронная библиотека',
    linkedSourceIds: ['SUP-YE1-009', 'ye1-ispoved-huligana-academic-text'],
    supersedesHoldId: 'PW6-YE1-ISPOVED-1921',
    printedExtent: '[12] printed pages plus cover and endpaper frames',
    pdfFrames: 16,
    bytes: 3_309_388,
    sha256: '17917962290fdd24eedd52fdd76d84c7c1bdf0898f53a41c52af555691f3116c',
    inspectedFrameRanges: ['PDF 01–16', 'cover PDF 01', 'inner title PDF 03', 'text block PDF 05–14'],
    verifiedContents: [
      'Хулиган on PDF 05–06',
      'Сорокоуст on PDF 07–10 with August 1920 ending date',
      'Исповедь хулигана on PDF 11–14 with November 1920 ending date',
    ],
    facsimileBytesAcquired: true,
    facsimileVisuallyInspected: true,
    ocrUsedForEvidence: false,
    syntheticContentUsed: false,
    archiveOriginalInspected: false,
    productionAuthorized: false,
    rightsState: 'open-digital-facsimile / reproduction-rights-unresolved',
    limitation:
      'The physical composition is verified from the real NEB PDF, but the scan is not automatically cleared for production reuse and does not establish an unseen publisher colophon.',
  },
] as const satisfies readonly YeseninPartOnePhysicalEditionAcquisitionPassEight[];
