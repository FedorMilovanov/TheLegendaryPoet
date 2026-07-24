export type YeseninPartOneWitnessLayer =
  | 'academic-transcription'
  | 'published-page'
  | 'object-facsimile'
  | 'archive-original';

export type YeseninPartOneWitnessStatus =
  | 'identified'
  | 'capture-required'
  | 'locate-required'
  | 'archive-request-required';

export interface YeseninPartOnePageWitness {
  id: string;
  claimIds: readonly string[];
  sourceIds: readonly string[];
  title: string;
  institution: string;
  referenceUrl: string;
  layer: YeseninPartOneWitnessLayer;
  status: YeseninPartOneWitnessStatus;
  printedPages?: readonly number[];
  publication?: {
    title: string;
    place?: string;
    issue?: string;
    printedDate?: string;
    probableRelease?: string;
  };
  archiveShelfmarks?: readonly string[];
  controls: readonly string[];
  limitations: readonly string[];
}

/**
 * Exact witness targets for the unpublished Yesenin biography Part I.
 *
 * `identified` means that the academic publication or appendix page is known.
 * It never means that original bytes, object provenance or reproduction rights
 * have already been acquired.
 */
export const yeseninPartOnePageWitnesses = [
  {
    id: 'wit-ye1-school-certificate-545',
    claimIds: ['YE1-004'],
    sourceIds: ['ye1-feb-chronicle-1912', 'ye1-feb-school-appendix-index'],
    title: 'Свидетельство об окончании Спас-Клепиковской второклассной учительской школы',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    referenceUrl: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-411-.htm?cmd=p',
    layer: 'published-page',
    status: 'capture-required',
    printedPages: [545],
    controls: [
      'official school type and completion witness',
      'page identity for any future certificate reproduction',
    ],
    limitations: [
      'contents/index identification is not yet the captured page image',
      'holding institution, object number, verso coverage and rights remain unresolved',
    ],
  },
  {
    id: 'wit-ye1-train-assignment-672-674',
    claimIds: ['YE1-016'],
    sourceIds: ['ye1-feb-chronicle-1916', 'ye1-feb-school-appendix-index'],
    title: 'Назначение С. А. Есенина в военно-санитарный поезд № 143',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    referenceUrl: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-669-.htm?cmd=p',
    layer: 'published-page',
    status: 'capture-required',
    printedPages: [672, 673, 674],
    archiveShelfmarks: [
      'РГИА, ф. 1328, оп. 4, ед. хр. 24, л. 11',
      'РГИА, ф. 1328, оп. 4, ед. хр. 20',
    ],
    controls: [
      'assignment to train no. 143',
      'documented military-sanitary unit boundary',
    ],
    limitations: [
      'published pages are not direct inspection of the RGIA originals',
      'a nearby infirmary photograph cannot establish infirmary no. 17 as the formal unit',
    ],
  },
  {
    id: 'wit-ye1-train-reports-688-691',
    claimIds: ['YE1-016'],
    sourceIds: ['ye1-feb-chronicle-1916', 'ye1-feb-school-appendix-index'],
    title: 'Доклады о поездках и фотография персонала поезда № 143',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    referenceUrl: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-669-.htm?cmd=p',
    layer: 'published-page',
    status: 'capture-required',
    printedPages: [688, 689, 690, 691],
    archiveShelfmarks: [
      'РГИА, ф. 1328, оп. 4, ед. хр. 6',
      'РГИА, ф. 1328, оп. 4, ед. хр. 20',
    ],
    controls: [
      'train route and trip-report evidence',
      'personnel photograph context for 7 June 1916',
    ],
    limitations: [
      'page 690 is a photograph and must receive separate image provenance',
      'published first pages do not replace complete archive files',
    ],
  },
  {
    id: 'wit-ye1-imagist-sirena-cover-621',
    claimIds: ['YE1-023'],
    sourceIds: ['ye1-chronicle-v2-appendix-contents', 'ye1-chronicle-1919'],
    title: 'Обложка журнала «Сирена» № 4–5, 1919',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    referenceUrl: 'https://feb-web.ru/feb/esenin/chronics/el2/el2-449-.htm?cmd=p',
    layer: 'published-page',
    status: 'capture-required',
    printedPages: [621],
    publication: {
      title: 'Сирена',
      place: 'Воронеж',
      issue: '№ 4–5',
      printedDate: '30 января 1919',
      probableRelease: '17 или 18 апреля 1919 по академической хронологии',
    },
    controls: [
      'identity of the Sirena issue associated with the declaration',
    ],
    limitations: [
      'the cover does not prove the internal declaration pages',
      'the printed date does not by itself prove the date of public circulation',
    ],
  },
  {
    id: 'wit-ye1-imagist-sovetskaya-strana-no3',
    claimIds: ['YE1-023'],
    sourceIds: ['ye1-chronicle-1919'],
    title: 'Газета «Советская страна», № 3, 10 февраля 1919',
    institution: 'Holding institution unresolved',
    referenceUrl: 'https://feb-web.ru/feb/esenin/el-abc/el2/el2-199-.htm?cmd=p&istext=1',
    layer: 'object-facsimile',
    status: 'locate-required',
    publication: {
      title: 'Советская страна',
      place: 'Москва',
      issue: '№ 3',
      printedDate: '10 февраля 1919',
    },
    controls: [
      'actual newspaper state of the imagist declaration',
      'comparison against the Sirena setting and release chronology',
    ],
    limitations: [
      'academic chronology identifies the issue but exact newspaper page bytes are not acquired',
      'first-publication wording remains held until two-witness collation',
    ],
  },
  {
    id: 'wit-ye1-imagist-sirena-internal-pages',
    claimIds: ['YE1-023'],
    sourceIds: ['ye1-chronicle-1919', 'ye1-chronicle-v2-appendix-contents'],
    title: 'Внутренние страницы «Сирены» № 4–5 с Декларацией имажинистов',
    institution: 'Holding institution unresolved',
    referenceUrl: 'https://feb-web.ru/feb/esenin/el-abc/el2/el2-199-.htm?cmd=p&istext=1',
    layer: 'object-facsimile',
    status: 'locate-required',
    publication: {
      title: 'Сирена',
      place: 'Воронеж',
      issue: '№ 4–5',
      printedDate: '30 января 1919',
      probableRelease: 'апрель 1919 по академической хронологии',
    },
    controls: [
      'Sirena declaration text, signatures and page setting',
      'two-witness publication-sequence collation',
    ],
    limitations: [
      'only the cover page witness is currently identified in the appendix',
      'internal pages and release-date evidence remain unacquired',
    ],
  },
  {
    id: 'wit-ye1-izryadnova-family-records',
    claimIds: ['YE1-010'],
    sourceIds: ['ye1-feb-chronicle-1914', 'ye1-izryadnova-family-commentary'],
    title: 'Семейные документы Анны Изрядновой и Юрия/Георгия Есенина',
    institution: 'Holding institution unresolved',
    referenceUrl: 'https://feb-web.ru/feb/esenin/texts/e74/e74-523-.htm?cmd=p',
    layer: 'archive-original',
    status: 'archive-request-required',
    controls: [
      'birth and family-record facts',
      'separation chronology without a reconstructed single motive',
    ],
    limitations: [
      'academic commentary and memoir evidence do not replace the birth/family record',
      'archive shelfmark and exact facsimile remain unresolved',
    ],
  },
  {
    id: 'wit-ye1-reich-marriage-children-divorce',
    claimIds: ['YE1-020'],
    sourceIds: ['ye1-reich-family-documents-commentary', 'ye1-tatiana-yesenina-on-reich'],
    title: 'Брак, дети и бракоразводные документы Зинаиды Райх и Сергея Есенина',
    institution: 'Archive references require exact extraction from the academic commentary',
    referenceUrl: 'https://feb-web.ru/feb/esenin/texts/e72/e72-266-.htm?cmd=p',
    layer: 'archive-original',
    status: 'archive-request-required',
    controls: [
      'marriage, children and divorce chronology',
      'separation of legal documents from family memory',
    ],
    limitations: [
      'named family testimony is not a substitute for legal or metric records',
      'exact page witnesses, shelfmarks and object provenance remain required',
    ],
  },
] as const satisfies readonly YeseninPartOnePageWitness[];
