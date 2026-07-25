export type YeseninArchiveAccessPassEighteenState =
  | 'exact-edition-description'
  | 'archive-unit-catalog'
  | 'published-attribution'
  | 'archive-collection-catalog'
  | 'digital-collection-catalog'
  | 'public-domain-item';

export type YeseninArchiveAccessPassEighteenGrade = 'A+' | 'A' | 'B';

export interface YeseninArchiveAccessPassEighteenRecord {
  id: `ARC18-YE1-${string}`;
  authority: string;
  title: string;
  url: string;
  state: YeseninArchiveAccessPassEighteenState;
  grade: YeseninArchiveAccessPassEighteenGrade;
  exactLocator: string;
  verifiedFacts: readonly string[];
  evidenceLimits: readonly string[];
  fullTextAcquired: boolean;
  contentInspected: boolean;
  syntheticContentUsed: false;
  wikipediaUsedAsEvidence: false;
  productionAuthorized: false;
}

export const yeseninArchiveAccessPassEighteen = [
  {
    id: 'ARC18-YE1-MATERIALS-1992',
    authority: 'Фундаментальная электронная библиотека',
    title: 'С. А. Есенин: Материалы к биографии',
    url: 'https://feb-web.ru/feb/esenin/critics/-g1992.html',
    state: 'exact-edition-description',
    grade: 'A',
    exactLocator: 'М.: Историческое наследие, 1992. 446 с.',
    verifiedFacts: [
      'ФЭБ идентифицирует отдельное издание 1992 года объёмом 446 страниц.',
      'Именно на это издание академический комментарий ПСС ссылается формулой «Материалы к биографии», с. 110.',
    ],
    evidenceLimits: [
      'Полный текст издания не приобретён и страница 110 не просмотрена.',
      'Описание издания не заменяет controlling page witness и не доказывает точную дату первой встречи Есенина и Дункан.',
    ],
    fullTextAcquired: false,
    contentInspected: false,
    syntheticContentUsed: false,
    wikipediaUsedAsEvidence: false,
    productionAuthorized: false,
  },
  {
    id: 'ARC18-YE1-RGALI-190-1-122',
    authority: 'РГАЛИ',
    title: 'Воспоминания о С. А. Есенине',
    url: 'https://www.rgali.ru/storage-unit?fundId=8211&opisId=9080&systemId=245672',
    state: 'archive-unit-catalog',
    grade: 'A+',
    exactLocator: 'ф. 190, оп. 1, ед. хр. 122; 1920–1925; 71 л.',
    verifiedFacts: [
      'Официальный каталог РГАЛИ фиксирует мемуарный комплекс 1920–1925 годов объёмом 71 лист.',
      'Единица находится в разделе воспоминаний и статей о С. А. Есенине.',
    ],
    evidenceLimits: [
      'Публичная списочная карточка не указывает автора.',
      'Единицу запрещено автоматически приписывать Г. А. Бениславской или использовать как её дневник.',
      'Листы не получены и не просмотрены.',
    ],
    fullTextAcquired: false,
    contentInspected: false,
    syntheticContentUsed: false,
    wikipediaUsedAsEvidence: false,
    productionAuthorized: false,
  },
  {
    id: 'ARC18-YE1-RGALI-190-1-132',
    authority: 'РГАЛИ + опубликованный научный комментарий',
    title: 'А. Г. Назарова. Воспоминания о С. А. Есенине. Четыре тетради',
    url: 'https://esenin.ru/o-esenine/vospominaniia/nazarova-a-g-vospominaniia',
    state: 'published-attribution',
    grade: 'A',
    exactLocator: 'РГАЛИ, ф. 190, оп. 1, ед. хр. 132; 39 л.; четыре ученические тетради',
    verifiedFacts: [
      'Официальный список РГАЛИ фиксирует четыре тетради и 39 листов.',
      'Комментарий к публикации идентифицирует автора как А. Г. Назарову.',
      'Комментарий сообщает о карандашных пометах Г. А. Бениславской на полях и отдельной вложенной записке её рукой.',
    ],
    evidenceLimits: [
      'Это не собственные воспоминания и не дневник Бениславской.',
      'Маргиналии Бениславской не превращают весь мемуарный текст в её авторское свидетельство.',
      'Архивный оригинал четырёх тетрадей не приобретён и не просмотрен постранично.',
    ],
    fullTextAcquired: false,
    contentInspected: true,
    syntheticContentUsed: false,
    wikipediaUsedAsEvidence: false,
    productionAuthorized: false,
  },
  {
    id: 'ARC18-YE1-IMLI-F32-BENISLAVSKAYA',
    authority: 'ИМЛИ РАН',
    title: 'Фонд С. А. Есенина: фотокопии писем и записок Г. А. Бениславской',
    url: 'https://www.orgssp.imli.ru/index.php/personalii',
    state: 'archive-collection-catalog',
    grade: 'A+',
    exactLocator: 'ИМЛИ РАН, ф. 32; 23 фотокопии писем и записок С. А. Есенина Г. А. Бениславской, 1921–1925',
    verifiedFacts: [
      'Официальный путеводитель ИМЛИ фиксирует 23 фотокопии писем и записок Есенина Бениславской за 1921–1925 годы.',
      'Корпус является точной архивной очередью для проверки отношений, поручений и издательской работы.',
    ],
    evidenceLimits: [
      'Путеводитель не раскрывает тексты писем и не заменяет сами листы или академическую публикацию.',
      'Нельзя переносить сведения из поздних пересказов на непроверенные архивные документы.',
    ],
    fullTextAcquired: false,
    contentInspected: false,
    syntheticContentUsed: false,
    wikipediaUsedAsEvidence: false,
    productionAuthorized: false,
  },
  {
    id: 'ARC18-YE1-NYPL-DUNCAN-PROGRAMS',
    authority: 'The New York Public Library, Jerome Robbins Dance Division',
    title: 'Isadora Duncan programs and announcements',
    url: 'https://digitalcollections.nypl.org/collections/isadora-duncan-programs-and-announcements',
    state: 'digital-collection-catalog',
    grade: 'A+',
    exactLocator: '*MGZB-Res. ++ 93-8695; NYPL b12284786; UUID 35caea70-c605-012f-e9e6-58d385a7bc34',
    verifiedFacts: [
      'NYPL описывает коробку примерно из 110 программ и объявлений за 1898–1929 годы.',
      'Коллекция включает материалы на английском, французском, немецком, итальянском и русском языках.',
      'Публичная Digital Collections выдача показывает четыре оцифрованных результата.',
    ],
    evidenceLimits: [
      'Коллекционная карточка не доказывает наличие московской программы 1921 года среди четырёх оцифрованных объектов.',
      'Содержимое отдельных items не считается просмотренным до получения item metadata/IIIF manifests и изображений.',
    ],
    fullTextAcquired: false,
    contentInspected: false,
    syntheticContentUsed: false,
    wikipediaUsedAsEvidence: false,
    productionAuthorized: false,
  },
  {
    id: 'ARC18-YE1-NYPL-DUNCAN-STUDIES',
    authority: 'The New York Public Library, Jerome Robbins Dance Division',
    title: 'Isadora Duncan: studies',
    url: 'https://digitalcollections.nypl.org/items/6bd555f0-c625-012f-008e-58d385a7bc34',
    state: 'public-domain-item',
    grade: 'A+',
    exactLocator: '*MGZEC 87-290; NYPL b12156296; UUID 6bd555f0-c625-012f-008e-58d385a7bc34; Image ID ISADORA_0001VB',
    verifiedFacts: [
      'Карточка идентифицирует оригинальные фотоработы Арнольда Генте 1915–1918 годов.',
      'NYPL считает item общественным достоянием по законодательству США.',
    ],
    evidenceLimits: [
      'Карточка не связывает изображение с Москвой, 1921 годом или первой встречей с Есениным.',
      'Международный статус прав отдельно не определён NYPL.',
      'Оригинальные image bytes и derivatives в production не локализованы.',
    ],
    fullTextAcquired: false,
    contentInspected: true,
    syntheticContentUsed: false,
    wikipediaUsedAsEvidence: false,
    productionAuthorized: false,
  },
] as const satisfies readonly YeseninArchiveAccessPassEighteenRecord[];

export const yeseninNyplDuncanProgramItemQueuePassEighteen = [
  '89b93c5d-a42e-99bb-e040-e00a18066f5f',
  '311074d0-26fa-0137-dbf3-5fc18a3ba411',
  'ef354620-26fa-0137-4425-5325a3c555ef',
  '522978b0-26fb-0137-0433-0f1659985b85',
] as const;

export const yeseninArchiveAccessPassEighteenSummary = {
  records: yeseninArchiveAccessPassEighteen.length,
  aPlusRecords: yeseninArchiveAccessPassEighteen.filter((record) => record.grade === 'A+').length,
  aRecords: yeseninArchiveAccessPassEighteen.filter((record) => record.grade === 'A').length,
  nyplDigitizedItemUuids: yeseninNyplDuncanProgramItemQueuePassEighteen.length,
  fullTextsAcquired: yeseninArchiveAccessPassEighteen.filter((record) => record.fullTextAcquired).length,
  productionAuthorizedRecords: yeseninArchiveAccessPassEighteen.filter((record) => record.productionAuthorized).length,
  correctedAttribution: 'RGALI f.190 op.1 ed.hr.132 = A. G. Nazarova; Benislavskaya annotations only',
  remainingControllingTargets: [
    'Acquire and inspect «С. А. Есенин: Материалы к биографии» (1992), especially printed page 110.',
    'Identify the author and obtain a facsimile of RGALI f.190 op.1 ed.hr.122 before linking it to Benislavskaya.',
    'Locate the exact archival manuscript/facsimile basis for Benislavskaya’s own diary and memoirs.',
    'Fetch and inspect NYPL item metadata, IIIF manifests and scans for all four program UUIDs.',
    'Locate the exact Moscow «Правда» no. 252 issue object for 9 November 1921.',
  ],
  articlePublished: false,
  wikipediaUsedAsEvidence: false,
  productionAuthorized: false,
} as const;
