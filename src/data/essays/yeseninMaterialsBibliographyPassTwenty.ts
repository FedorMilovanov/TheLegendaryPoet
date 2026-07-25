export type YeseninMaterialsBibliographyAuthority =
  | 'WorldCat/OCLC'
  | 'CiNii Books'
  | 'РГАЛИ'
  | 'ИМЛИ РАН'
  | 'ФЭБ';

export interface YeseninMaterialsBibliographyWitnessPassTwenty {
  id: `MAT20-${string}`;
  authority: YeseninMaterialsBibliographyAuthority;
  url: string;
  recordType: 'international-catalog' | 'official-publication-list' | 'author-bibliography' | 'academic-bibliography';
  title: string;
  statedPublicationYear: 1992 | 1993;
  statedExtentPages: 446 | 448 | null;
  isbn10: '5860000073' | null;
  isbn13: '9785860000070' | null;
  controlNumber: string | null;
  verifiedFacts: readonly string[];
  evidenceLimits: readonly string[];
  fullBookAcquired: false;
  printedPage110Inspected: false;
  wikipediaUsedAsEvidence: false;
  productionAuthorized: false;
}

export const yeseninMaterialsBibliographyWitnessesPassTwenty = [
  {
    id: 'MAT20-WORLDCAT-OCLC-29957297',
    authority: 'WorldCat/OCLC',
    url: 'https://search.worldcat.org/title/S.A.-Esenin-%3A-materialy-k-biografii/oclc/29957297',
    recordType: 'international-catalog',
    title: 'С.А. Есенин : материалы к биографии',
    statedPublicationYear: 1992,
    statedExtentPages: null,
    isbn10: '5860000073',
    isbn13: '9785860000070',
    controlNumber: 'OCLC 29957297',
    verifiedFacts: [
      'The record identifies N. B. Volkova as responsible editor and N. I. Guseva, S. I. Subbotin and S. V. Shumikhin as compilers/commentators.',
      'The catalog imprint is Moscow, «Историческое наследие», 1992.',
      'The record supplies ISBN 5-86000-007-3 / 978-5-86000-007-0.',
    ],
    evidenceLimits: [
      'The catalog imprint does not settle the later official correction that the volume appeared in 1993 with 1992 printed on the title page.',
      'The catalog is not the book and does not expose printed page 110.',
    ],
    fullBookAcquired: false,
    printedPage110Inspected: false,
    wikipediaUsedAsEvidence: false,
    productionAuthorized: false,
  },
  {
    id: 'MAT20-CINII-BA22825504',
    authority: 'CiNii Books',
    url: 'https://ci.nii.ac.jp/ncid/BA22825504',
    recordType: 'international-catalog',
    title: 'С.А. Есенин : материалы к биографии',
    statedPublicationYear: 1992,
    statedExtentPages: 446,
    isbn10: '5860000073',
    isbn13: null,
    controlNumber: 'NCID BA22825504',
    verifiedFacts: [
      'CiNii records 446 pages, 21 cm, ISBN 5-86000-007-3 and the 1992 imprint.',
      'The record notes the Moscow City Archives association, bibliographical references and an index.',
      'Four Japanese research libraries are listed as holding copies.',
    ],
    evidenceLimits: [
      'The 446-page catalog extent conflicts with the official RGALI publication-list extent of 448 pages.',
      'No normalization from 446 to 448 is made without inspecting the physical collation.',
      'The record does not expose printed page 110.',
    ],
    fullBookAcquired: false,
    printedPage110Inspected: false,
    wikipediaUsedAsEvidence: false,
    productionAuthorized: false,
  },
  {
    id: 'MAT20-RGALI-PUBLICATION-119',
    authority: 'РГАЛИ',
    url: 'https://rgali.ru/album-documents',
    recordType: 'official-publication-list',
    title: 'Есенин С.А. Материалы к биографии',
    statedPublicationYear: 1993,
    statedExtentPages: 448,
    isbn10: null,
    isbn13: null,
    controlNumber: 'РГАЛИ publication list no. 119',
    verifiedFacts: [
      'The official RGALI list places the volume among publications issued in 1993.',
      'The entry gives 448 pages with illustrations.',
      'The entry names responsible editor N. B. Volkova and compilers/commentators N. I. Guseva, S. I. Subbotin and S. V. Shumikhin.',
    ],
    evidenceLimits: [
      'The list identifies the issued volume but does not supply a digital facsimile or printed page 110.',
      'The official 448-page extent is retained alongside, not substituted for, the 446-page CiNii collation.',
    ],
    fullBookAcquired: false,
    printedPage110Inspected: false,
    wikipediaUsedAsEvidence: false,
    productionAuthorized: false,
  },
  {
    id: 'MAT20-IMLI-SHUBNIKOVA-GUSEVA',
    authority: 'ИМЛИ РАН',
    url: 'https://imli.ru/institut/sotrudniki/1045-shubnikova-guseva-natalya-igorevna',
    recordType: 'author-bibliography',
    title: 'С.А. Есенин. Материалы к биографии',
    statedPublicationYear: 1993,
    statedExtentPages: null,
    isbn10: null,
    isbn13: null,
    controlNumber: null,
    verifiedFacts: [
      'The official author bibliography dates publication to 1993.',
      'It explicitly states that 1992 appears on the title page.',
      'It records N. I. Shubnikova-Guseva’s joint preparation with S. I. Subbotin and S. V. Shumikhin for RGALI.',
    ],
    evidenceLimits: [
      'The bibliography does not reproduce the title leaf or the volume’s printed page 110.',
      'The title-page year is treated as a printed bibliographic error, not as a second edition.',
    ],
    fullBookAcquired: false,
    printedPage110Inspected: false,
    wikipediaUsedAsEvidence: false,
    productionAuthorized: false,
  },
  {
    id: 'MAT20-FEB-ACADEMIC-BIBLIOGRAPHY',
    authority: 'ФЭБ',
    url: 'https://feb-web.ru/feb/esenin/texts/es3/es3-435-.htm?cmd=p',
    recordType: 'academic-bibliography',
    title: 'С. А. Есенин: Материалы к биографии',
    statedPublicationYear: 1993,
    statedExtentPages: null,
    isbn10: null,
    isbn13: null,
    controlNumber: null,
    verifiedFacts: [
      'The academic bibliography dates the volume to 1993.',
      'It explicitly labels 1992 on the title page as erroneous.',
    ],
    evidenceLimits: [
      'The bibliography is a controlling publication-history note, not a substitute for the volume or page 110.',
      'No statement from printed page 110 is promoted on the strength of this bibliography alone.',
    ],
    fullBookAcquired: false,
    printedPage110Inspected: false,
    wikipediaUsedAsEvidence: false,
    productionAuthorized: false,
  },
] as const satisfies readonly YeseninMaterialsBibliographyWitnessPassTwenty[];

export const yeseninMaterialsBibliographyEffectiveStatePassTwenty = {
  title: 'С. А. Есенин: Материалы к биографии',
  responsibleEditor: 'Н. Б. Волкова',
  compilersAndCommentators: ['Н. И. Гусева', 'С. И. Субботин', 'С. В. Шумихин'],
  publisher: 'Историческое наследие',
  place: 'Москва',
  effectivePublicationYear: 1993,
  printedTitlePageYear: 1992,
  printedTitlePageYearErroneous: true,
  secondEditionInferred: false,
  isbn10: '5-86000-007-3',
  isbn13: '978-5-86000-007-0',
  oclc: '29957297',
  ncid: 'BA22825504',
  extentState: 'UNRESOLVED-CATALOG-COLLATION-CONFLICT-446-448',
  extentVariants: [446, 448],
  fullBookAcquired: false,
  printedPage110Inspected: false,
  page110ClaimPromoted: false,
  supersedesPassEighteenSimple1992And446Locator: true,
  evidenceRule:
    'Use 1993 as the effective publication year; retain 1992 only as the erroneous printed title-page year; retain 446/448 as an unresolved collation conflict until the physical volume or a complete facsimile is inspected.',
  wikipediaUsedAsEvidence: false,
  articlePublished: false,
  productionAuthorized: false,
} as const;
