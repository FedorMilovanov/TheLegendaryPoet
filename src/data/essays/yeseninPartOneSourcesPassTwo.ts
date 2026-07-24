import type { EssaySource } from '../../types/essay';
import type { YeseninPartOneSourceId } from './yeseninPartOneSources';

/**
 * Pass-two source assembly for the unpublished Yesenin biography Part I.
 *
 * These records strengthen specific weak claims with exact academic chronology,
 * primary testimony, documentary appendices and edition-level context. They do
 * not authorize public prose or substitute an HTML transcription for a required
 * facsimile of a birth, school, military, marriage or archive record.
 */
export const yeseninPartOneSourcesPassTwo = [
  {
    id: 'ye1-feb-chronicle-1909',
    title: '1909: Летопись жизни и творчества С. А. Есенина',
    url: 'https://feb-web.ru/feb/esenin/el-abc/el1/el1-1061.htm?cmd=p&istext=1',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    year: 2003,
    note: 'Академическая хронология начала учёбы и точного типа Спас-Клепиковской школы; печатная транскрипция не заменяет facsimile школьного документа.',
  },
  {
    id: 'ye1-feb-chronicle-1911',
    title: '1911: Летопись жизни и творчества С. А. Есенина',
    url: 'https://feb-web.ru/feb/esenin/el-abc/el1/el1-1211.htm?cmd=p&istext=1',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    year: 2003,
    note: 'Фиксирует учебный распорядок и третий год пребывания в Спас-Клепиках; мемуарные бытовые детали остаются свидетельствами конкретных авторов.',
  },
  {
    id: 'ye1-feb-chronicle-1912',
    title: '1912: Летопись жизни и творчества С. А. Есенина',
    url: 'https://feb-web.ru/feb/esenin/el-abc/el1/el1-1311.htm?cmd=p&istext=1',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    year: 2003,
    note: 'Публикует академическую транскрипцию свидетельства об окончании второклассной учительской школы и хронологию переезда; изображение документа требуется отдельно.',
  },
  {
    id: 'ye1-feb-school-appendix-index',
    title: 'Приложение к Летописи, том 1: документы Спас-Клепиковской школы',
    url: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-411-.htm?cmd=p',
    kind: 'archive',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    year: 2003,
    note: 'Точный указатель печатных страниц приложения со школьными правилами, фотографиями и документами; до извлечения page witnesses это навигационный, а не facsimile-источник.',
  },
  {
    id: 'ye1-yesenin-photo-commentary-1912',
    title: 'Комментарии ПСС к фотографии С. А. Есенина 1912 года',
    url: 'https://feb-web.ru/feb/esenin/texts/es7/es7-197-.htm?cmd=p',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека; ПСС Есенина, том 7, книга 3',
    year: 2002,
    note: 'Датирует снимок по надписи и описывает его историю; provenance оригинала и право использования изображения должны проверяться отдельно.',
  },
  {
    id: 'ye1-blok-diary-9-march-1915',
    title: 'А. А. Блок. Дневниковая запись и рекомендательное письмо, 9 марта 1915 года',
    url: 'https://feb-web.ru/feb/esenin/critics/ev1/ev1-174-.htm?cmd=p',
    kind: 'primary',
    institution: 'Фундаментальная электронная библиотека; «Есенин в воспоминаниях современников», том 1',
    year: 1915,
    note: 'Синхронная запись Блока и рекомендательное письмо подтверждают встречу и начало сети рекомендаций, но не мгновенную литературную канонизацию Есенина.',
  },
  {
    id: 'ye1-petrograd-appendix-blok-witnesses',
    title: 'Петроград 1915–1916: приложение к Летописи с запиской Есенина Блоку',
    url: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-641-.htm?cmd=p',
    kind: 'archive',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    year: 2003,
    note: 'Содержит печатные page witnesses записки Есенина и пометы Блока; для публикации изображения требуется отдельная проверка объекта, оригинала и прав.',
  },
  {
    id: 'ye1-klyuev-correspondence-commentary',
    title: 'Комментарии ПСС к переписке Есенина и Н. А. Клюева 1915 года',
    url: 'https://feb-web.ru/feb/esenin/texts/es6/es6-233-.htm?cmd=p',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека; ПСС Есенина, том 6',
    year: 1999,
    note: 'Устанавливает последовательность писем, утраченные звенья и редакционные границы; комментарий не превращает позднюю память в сохранившийся автограф.',
  },
  {
    id: 'ye1-feb-chronicle-1916',
    title: '1916: Летопись жизни и творчества С. А. Есенина',
    url: 'https://feb-web.ru/feb/esenin/el-abc/el1/el1-3081.htm?cmd=p&istext=1',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    year: 2003,
    note: 'Точно фиксирует зачисление с 20 апреля 1916 года в команду военно-санитарного поезда № 143 и архивные шифры; facsimile приказа и алфавита ещё требуется.',
  },
  {
    id: 'ye1-feb-chronicle-volume2-preface',
    title: 'Предисловие к Летописи жизни и творчества Есенина, том 2: 1917–1920',
    url: 'https://feb-web.ru/feb/esenin/chronics/el2/el2-005-.htm?cmd=p',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    year: 2005,
    note: 'Определяет документальный охват революционного периода, брака с Райх и литературной среды; не заменяет точную страницу отдельного события.',
  },
  {
    id: 'ye1-feb-chronicle-1917',
    title: '1917: Летопись жизни и творчества С. А. Есенина',
    url: 'https://feb-web.ru/feb/esenin/el-abc/el2/el2-019-.htm?cmd=p&istext=1',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    year: 2005,
    note: 'Академическая хронология завершения военной службы, революционных текстов и отношений с Зинаидой Райх; сильные семейные claims требуют конкретных документов.',
  },
  {
    id: 'ye1-feb-chronicle-1918',
    title: '1918: Летопись жизни и творчества С. А. Есенина',
    url: 'https://feb-web.ru/feb/esenin/el-abc/el2/el2-081-.htm?cmd=p&istext=1',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    year: 2005,
    note: 'Хронология семейной, издательской и религиозно-революционной работы 1918 года; оценки современников должны сохранять авторство и жанр.',
  },
  {
    id: 'ye1-reich-family-documents-commentary',
    title: 'Комментарии ПСС к коллективным документам Есенина и бракоразводному делу Райх',
    url: 'https://feb-web.ru/feb/esenin/texts/e72/e72-266-.htm?cmd=p',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека; ПСС Есенина, том 7, книга 2',
    year: 2000,
    note: 'Публикует документальную редакцию и архивные ссылки по браку, детям и разводу; для изображения или дипломатики нужен отдельный facsimile witness.',
  },
] as const satisfies readonly EssaySource[];

export type YeseninPartOnePassTwoSourceId = NonNullable<
  (typeof yeseninPartOneSourcesPassTwo)[number]['id']
>;

type AnyYeseninPartOneSourceId = YeseninPartOneSourceId | YeseninPartOnePassTwoSourceId;

/**
 * Pass-two claim links narrow factual uncertainty while preserving archive-only
 * holds. An empty `remaining` array means the claim has enough textual support
 * for drafting, not that every desired illustration or facsimile has been acquired.
 */
export const yeseninPartOnePassTwoClaimCoverage = {
  'YE1-004': {
    sourceIds: [
      'ye1-feb-chronicle-1909',
      'ye1-feb-chronicle-1912',
      'ye1-feb-school-appendix-index',
    ],
    remaining: ['facsimile/page witness for the exact school certificate before reproducing the document'],
  },
  'YE1-012': {
    sourceIds: ['ye1-blok-diary-9-march-1915'],
    remaining: [],
  },
  'YE1-013': {
    sourceIds: ['ye1-blok-diary-9-march-1915', 'ye1-petrograd-appendix-blok-witnesses'],
    remaining: ['object-level provenance and rights if the handwritten note is published as an image'],
  },
  'YE1-016': {
    sourceIds: ['ye1-feb-chronicle-1916'],
    remaining: ['facsimile of the 20 April 1916 train no. 143 team record and archival folios'],
  },
  'YE1-020': {
    sourceIds: [
      'ye1-feb-chronicle-volume2-preface',
      'ye1-feb-chronicle-1917',
      'ye1-feb-chronicle-1918',
      'ye1-reich-family-documents-commentary',
    ],
    remaining: ['page-verified marriage, birth and divorce document witnesses before reproducing records'],
  },
  'YE1-023': {
    sourceIds: ['ye1-feb-chronicle-volume2-preface', 'ye1-feb-chronicle-1917', 'ye1-feb-chronicle-1918'],
    remaining: ['first-publication facsimile of the 1919 imagist declaration'],
  },
} as const satisfies Record<
  string,
  {
    sourceIds: readonly AnyYeseninPartOneSourceId[];
    remaining: readonly string[];
  }
>;
