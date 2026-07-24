export type YeseninPartOneRealVisualStatus =
  | 'public-domain-candidate'
  | 'research-only'
  | 'acquired-rights-unresolved';

export interface YeseninPartOneRealVisualRecord {
  id: `VIS-YE1-P6-${string}`;
  title: string;
  dateLabel: string;
  sourcePageUrl: string;
  acquiredFileUrl: string;
  width: number;
  height: number;
  byteSize: number;
  sha256: string;
  controllingSourceIds: readonly string[];
  status: YeseninPartOneRealVisualStatus;
  renderMode: 'numbered-real-thumbnail';
  productionAuthorized: false;
  note: string;
}

export const yeseninPartOneRealVisualsPassSix = [
  {
    id: 'VIS-YE1-P6-001',
    title: 'С. А. Есенин с сёстрами Катей и Шурой',
    dateLabel: 'Москва, 1912; ФЭБ, печатная с. 555',
    sourcePageUrl:
      'https://commons.wikimedia.org/wiki/File:%D0%A1%D0%B5%D1%80%D0%B3%D0%B5%D0%B9_%D0%95%D1%81%D0%B5%D0%BD%D0%B8%D0%BD_%D1%81_%D1%81%D1%91%D1%81%D1%82%D1%80%D0%B0%D0%BC%D0%B8_%D0%9A%D0%B0%D1%82%D0%B5%D0%B9_%D0%B8_%D0%A8%D1%83%D1%80%D0%BE%D0%B9.jpg',
    acquiredFileUrl:
      'https://upload.wikimedia.org/wikipedia/commons/e/e6/%D0%A1%D0%B5%D1%80%D0%B3%D0%B5%D0%B9_%D0%95%D1%81%D0%B5%D0%BD%D0%B8%D0%BD_%D1%81_%D1%81%D1%91%D1%81%D1%82%D1%80%D0%B0%D0%BC%D0%B8_%D0%9A%D0%B0%D1%82%D0%B5%D0%B9_%D0%B8_%D0%A8%D1%83%D1%80%D0%BE%D0%B9.jpg',
    width: 2268,
    height: 3160,
    byteSize: 4118323,
    sha256: '72e2c130c01969948e33e6f872fb49123fb36abdf6afcb03de3376ff7314759f',
    controllingSourceIds: ['ye1-moscow-appendix-1912-1915'],
    status: 'public-domain-candidate',
    renderMode: 'numbered-real-thumbnail',
    productionAuthorized: false,
    note: 'Использовать только реальное фото; перед production сохранить license snapshot и сверить происхождение с ФЭБ, с. 555.',
  },
  {
    id: 'VIS-YE1-P6-002',
    title: 'Автограф письма С. А. Есенина Г. А. Панфилову',
    dateLabel: 'До 18 августа 1912; ФЭБ, печатная с. 557',
    sourcePageUrl: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-551-.htm?cmd=p',
    acquiredFileUrl: 'https://feb-web.ru/feb/esenin/pictures/el1-557-.jpg',
    width: 491,
    height: 680,
    byteSize: 75811,
    sha256: '360e31bea4e627248ffac8fcacee1a8af856894510601fb032783be2ced7fa26',
    controllingSourceIds: ['ye1-letter-panfilov-aug-1912', 'ye1-moscow-appendix-1912-1915'],
    status: 'research-only',
    renderMode: 'numbered-real-thumbnail',
    productionAuthorized: false,
    note: 'Только реальный facsimile-фрагмент; запрещены дорисовка строк, подмена почерка и генеративное расширение страницы.',
  },
  {
    id: 'VIS-YE1-P6-003',
    title: 'Портрет С. А. Есенина 1914 года',
    dateLabel: '1914',
    sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Esenin1914.jpg',
    acquiredFileUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Esenin1914.jpg',
    width: 570,
    height: 606,
    byteSize: 67529,
    sha256: '1f4f3d25719582dedd54c7804c4b438136e943730526b75ec1437f8fcf73dfe6',
    controllingSourceIds: ['ye1-feb-chronicle-1914'],
    status: 'public-domain-candidate',
    renderMode: 'numbered-real-thumbnail',
    productionAuthorized: false,
    note: 'Лицо не ретушировать генеративно; разрешены только обычные технические операции кадрирования и тоновой коррекции после сохранения оригинала.',
  },
  {
    id: 'VIS-YE1-P6-004',
    title: 'С. А. Есенин и Н. А. Клюев',
    dateLabel: '1 февраля 1916; ФЭБ, печатная с. 667',
    sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Eseninnikolaiklyeuv.jpg',
    acquiredFileUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Eseninnikolaiklyeuv.jpg',
    width: 792,
    height: 620,
    byteSize: 228836,
    sha256: '5ca96a2d2f48eb320ad119dff7275149d8a27935a373359524152444814391bc',
    controllingSourceIds: ['ye1-klyuev-correspondence-commentary', 'ye1-feb-chronicle-1916'],
    status: 'public-domain-candidate',
    renderMode: 'numbered-real-thumbnail',
    productionAuthorized: false,
    note: 'Сохранять обоих участников кадра; не превращать групповую фотографию в искусственно восстановленный одиночный портрет.',
  },
  {
    id: 'VIS-YE1-P6-005',
    title: 'С. А. Есенин и М. П. Мурашёв',
    dateLabel: 'Петроград, 10 апреля 1916; ФЭБ, печатная с. 668',
    sourcePageUrl: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-411-.htm?cmd=p',
    acquiredFileUrl: 'https://feb-web.ru/feb/esenin/pictures/el1-668-.jpg',
    width: 614,
    height: 416,
    byteSize: 39069,
    sha256: '2f16e6f0de81b4c7e9fc15d14845d5a665d8df6ef0ce37ba12aced1645b2189f',
    controllingSourceIds: ['ye1-feb-chronicle-1916'],
    status: 'research-only',
    renderMode: 'numbered-real-thumbnail',
    productionAuthorized: false,
    note: 'Exact image bytes получены и хешированы; holding и права на scan остаются нерешёнными, поэтому production use запрещён.',
  },
  {
    id: 'VIS-YE1-P6-006',
    title: 'Извещение Петроградского резерва санитаров',
    dateLabel: '1916; ФЭБ, печатная с. 673',
    sourcePageUrl: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-669-.htm?cmd=p',
    acquiredFileUrl: 'https://feb-web.ru/feb/esenin/pictures/el1-673-.jpg',
    width: 373,
    height: 542,
    byteSize: 43430,
    sha256: 'b9ce49137fa139faa1ee47e8e33d6e4592ac2d4bed1e2b69ac8da88c167c1484',
    controllingSourceIds: ['feb-ye1-train-673', 'WIT-YE1-002'],
    status: 'acquired-rights-unresolved',
    renderMode: 'numbered-real-thumbnail',
    productionAuthorized: false,
    note: 'Полученная и хешированная реальная страница; никакой замены текста AI-набором и никакой фальшивой архивной печати.',
  },
  {
    id: 'VIS-YE1-P6-007',
    title: 'С. А. Есенин среди персонала военно-санитарного поезда № 143',
    dateLabel: '1916; ФЭБ, печатная с. 690',
    sourcePageUrl: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-669-.htm?cmd=p',
    acquiredFileUrl: 'https://feb-web.ru/feb/esenin/pictures/el1-690-.jpg',
    width: 614,
    height: 408,
    byteSize: 54060,
    sha256: '08465a4383e3afa2d9fa087c61a006e750c6fc6c395a343ebf26c0fbfb5ad8ef',
    controllingSourceIds: ['feb-ye1-train-690', 'WIT-YE1-002'],
    status: 'acquired-rights-unresolved',
    renderMode: 'numbered-real-thumbnail',
    productionAuthorized: false,
    note: 'Показывать в реальном контексте страницы; не подписывать как окопную службу, госпиталь или лазарет № 17.',
  },
  {
    id: 'VIS-YE1-P6-008',
    title: 'Обложка журнала «Сирена» № 4–5',
    dateLabel: '1919; ФЭБ, печатная с. 621',
    sourcePageUrl: 'https://feb-web.ru/feb/esenin/chronics/el2/el2-449-.htm?cmd=p',
    acquiredFileUrl: 'https://feb-web.ru/feb/esenin/pictures/El2-6212.jpg',
    width: 237,
    height: 309,
    byteSize: 18693,
    sha256: 'a316190933bcbdb433c835359d971854176a32d808787bcdc0050aad5b501cb4',
    controllingSourceIds: ['feb-ye1-sirena-cover-621', 'WIT-YE1-003'],
    status: 'acquired-rights-unresolved',
    renderMode: 'numbered-real-thumbnail',
    productionAuthorized: false,
    note: 'Обложка не является facsimile внутренних страниц декларации и не доказывает дату фактического выхода номера без хронологического комментария.',
  },
] as const satisfies readonly YeseninPartOneRealVisualRecord[];
