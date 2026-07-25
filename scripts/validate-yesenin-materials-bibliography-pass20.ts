import {
  yeseninMaterialsBibliographyEffectiveStatePassTwenty,
  yeseninMaterialsBibliographyWitnessesPassTwenty,
} from '../src/data/essays/yeseninMaterialsBibliographyPassTwenty';

const fail = (message: string): never => {
  throw new Error(`[yesenin-materials-bibliography-pass20] ${message}`);
};

const witnesses = yeseninMaterialsBibliographyWitnessesPassTwenty;
const effective = yeseninMaterialsBibliographyEffectiveStatePassTwenty;

if (witnesses.length !== 5) fail(`expected 5 bibliographic witnesses, found ${witnesses.length}`);
if (new Set(witnesses.map((record) => record.id)).size !== witnesses.length) {
  fail('bibliographic witness IDs must be unique');
}
if (witnesses.some((record) => !record.url.startsWith('https://'))) {
  fail('all bibliographic witness URLs must use HTTPS');
}
if (
  witnesses.some(
    (record) =>
      record.fullBookAcquired !== false ||
      record.printedPage110Inspected !== false ||
      record.wikipediaUsedAsEvidence !== false ||
      record.productionAuthorized !== false,
  )
) {
  fail('full-book/page-110/Wikipedia/production boundary drifted');
}

const expected = [
  {
    id: 'MAT20-WORLDCAT-OCLC-29957297',
    authority: 'WorldCat/OCLC',
    url: 'https://search.worldcat.org/title/S.A.-Esenin-%3A-materialy-k-biografii/oclc/29957297',
    type: 'international-catalog',
    year: 1992,
    extent: null,
    isbn10: '5860000073',
    isbn13: '9785860000070',
    control: 'OCLC 29957297',
    fact: 'ISBN 5-86000-007-3 / 978-5-86000-007-0',
    limit: 'does not settle',
  },
  {
    id: 'MAT20-CINII-BA22825504',
    authority: 'CiNii Books',
    url: 'https://ci.nii.ac.jp/ncid/BA22825504',
    type: 'international-catalog',
    year: 1992,
    extent: 446,
    isbn10: '5860000073',
    isbn13: null,
    control: 'NCID BA22825504',
    fact: '446 pages',
    limit: '448 pages',
  },
  {
    id: 'MAT20-RGALI-PUBLICATION-119',
    authority: 'РГАЛИ',
    url: 'https://rgali.ru/album-documents',
    type: 'official-publication-list',
    year: 1993,
    extent: 448,
    isbn10: null,
    isbn13: null,
    control: 'РГАЛИ publication list no. 119',
    fact: '448 pages',
    limit: '446-page CiNii',
  },
  {
    id: 'MAT20-IMLI-SHUBNIKOVA-GUSEVA',
    authority: 'ИМЛИ РАН',
    url: 'https://imli.ru/institut/sotrudniki/1045-shubnikova-guseva-natalya-igorevna',
    type: 'author-bibliography',
    year: 1993,
    extent: null,
    isbn10: null,
    isbn13: null,
    control: null,
    fact: '1992 appears on the title page',
    limit: 'does not reproduce',
  },
  {
    id: 'MAT20-FEB-ACADEMIC-BIBLIOGRAPHY',
    authority: 'ФЭБ',
    url: 'https://feb-web.ru/feb/esenin/texts/es3/es3-435-.htm?cmd=p',
    type: 'academic-bibliography',
    year: 1993,
    extent: null,
    isbn10: null,
    isbn13: null,
    control: null,
    fact: '1992 on the title page as erroneous',
    limit: 'not a substitute',
  },
] as const;

for (const item of expected) {
  const record = witnesses.find((candidate) => candidate.id === item.id);
  if (!record) fail(`missing ${item.id}`);
  if (
    record.authority !== item.authority ||
    record.url !== item.url ||
    record.recordType !== item.type ||
    record.statedPublicationYear !== item.year ||
    record.statedExtentPages !== item.extent ||
    record.isbn10 !== item.isbn10 ||
    record.isbn13 !== item.isbn13 ||
    record.controlNumber !== item.control
  ) {
    fail(`${item.id} exact bibliographic identity drifted`);
  }
  if (!record.verifiedFacts.some((fact) => fact.includes(item.fact))) {
    fail(`${item.id} lost controlling fact marker ${item.fact}`);
  }
  if (!record.evidenceLimits.some((limit) => limit.includes(item.limit))) {
    fail(`${item.id} lost evidence-limit marker ${item.limit}`);
  }
}

const years = new Set(witnesses.map((record) => record.statedPublicationYear));
if (years.size !== 2 || !years.has(1992) || !years.has(1993)) {
  fail(`witness year conflict must retain both 1992 and 1993, found ${[...years].join(', ')}`);
}
const extents = witnesses
  .map((record) => record.statedExtentPages)
  .filter((value): value is 446 | 448 => value !== null)
  .sort((left, right) => left - right);
if (extents.join('|') !== '446|448') {
  fail(`extent conflict must retain exactly 446 and 448, found ${extents.join('|')}`);
}

if (
  effective.title !== 'С. А. Есенин: Материалы к биографии' ||
  effective.responsibleEditor !== 'Н. Б. Волкова' ||
  effective.compilersAndCommentators.join('|') !==
    'Н. И. Гусева|С. И. Субботин|С. В. Шумихин' ||
  effective.publisher !== 'Историческое наследие' ||
  effective.place !== 'Москва' ||
  effective.effectivePublicationYear !== 1993 ||
  effective.printedTitlePageYear !== 1992 ||
  effective.printedTitlePageYearErroneous !== true ||
  effective.secondEditionInferred !== false ||
  effective.isbn10 !== '5-86000-007-3' ||
  effective.isbn13 !== '978-5-86000-007-0' ||
  effective.oclc !== '29957297' ||
  effective.ncid !== 'BA22825504' ||
  effective.extentState !== 'UNRESOLVED-CATALOG-COLLATION-CONFLICT-446-448' ||
  effective.extentVariants.join('|') !== '446|448' ||
  effective.fullBookAcquired !== false ||
  effective.printedPage110Inspected !== false ||
  effective.page110ClaimPromoted !== false ||
  effective.supersedesPassEighteenSimple1992And446Locator !== true ||
  !effective.evidenceRule.includes('1993') ||
  !effective.evidenceRule.includes('erroneous printed title-page year') ||
  !effective.evidenceRule.includes('446/448') ||
  effective.wikipediaUsedAsEvidence !== false ||
  effective.articlePublished !== false ||
  effective.productionAuthorized !== false
) {
  fail(`effective bibliographic state drifted: ${JSON.stringify(effective)}`);
}

console.log(
  JSON.stringify(
    {
      status: 'MATERIALS-BIBLIOGRAPHY-PASS20-VALID',
      witnesses: witnesses.map((record) => ({
        id: record.id,
        authority: record.authority,
        year: record.statedPublicationYear,
        extent: record.statedExtentPages,
        controlNumber: record.controlNumber,
      })),
      effectiveState: {
        publicationYear: effective.effectivePublicationYear,
        titlePageYear: effective.printedTitlePageYear,
        titlePageYearErroneous: effective.printedTitlePageYearErroneous,
        extentState: effective.extentState,
        isbn10: effective.isbn10,
        oclc: effective.oclc,
        ncid: effective.ncid,
      },
      fullBookAcquired: effective.fullBookAcquired,
      page110Inspected: effective.printedPage110Inspected,
      claimPromoted: effective.page110ClaimPromoted,
    },
    null,
    2,
  ),
);
