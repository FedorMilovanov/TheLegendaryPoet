import type { EssaySource } from '../../types/essay';
import type { YeseninPartOneSourceId } from './yeseninPartOneSources';
import type { YeseninPartOnePassTwoSourceId } from './yeseninPartOneSourcesPassTwo';

/**
 * Pass-three source assembly reaches the issue #76 bibliography threshold with
 * exact academic chronology, edition descriptions, memoir testimony and primary
 * authorial texts/manuscript materials.
 *
 * Source-count readiness is not publication readiness: facsimiles, media
 * provenance, stable block citations and section-by-section prose review remain
 * separate mandatory gates.
 */
export const yeseninPartOneSourcesPassThree = [
  {
    id: 'ye1-feb-chronicle-1913',
    title: '1913: Летопись жизни и творчества С. А. Есенина',
    url: 'https://feb-web.ru/feb/esenin/el-abc/el1/el1-1551.htm?cmd=p',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    year: 2003,
    note: 'Академическая хронология типографии, раннего литературного круга и знакомства с поэзией Клюева; поздние воспоминания внутри записи сохраняют мемуарный статус.',
  },
  {
    id: 'ye1-feb-chronicle-1914',
    title: '1914: Летопись жизни и творчества С. А. Есенина',
    url: 'https://feb-web.ru/feb/esenin/el-abc/el1/el1-1831.htm?cmd=p&istext=1',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    year: 2003,
    note: 'Сводит типографскую работу, совместную жизнь с Анной Изрядновой и рождение Юрия; семейные мотивы нельзя выводить из одной ретроспективной записи.',
  },
  {
    id: 'ye1-izryadnova-family-commentary',
    title: 'Комментарии ПСС к семейным свидетельствам Анны Изрядновой',
    url: 'https://feb-web.ru/feb/esenin/texts/e74/e74-523-.htm?cmd=p',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека; ПСС Есенина, том 4',
    year: 1996,
    note: 'Академически привязывает воспоминания Изрядновой к Юрию/Георгию Есенину и ранним текстам; не заменяет запись о рождении или полный мемуарный контекст.',
  },
  {
    id: 'ye1-contemporary-memoirs-editorial-commentary-v1',
    title: 'Комментарии к первому тому «Есенин в воспоминаниях современников»',
    url: 'https://feb-web.ru/feb/esenin/critics/ev1/ev1-445-.htm?cmd=p',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека; «Есенин в воспоминаниях современников», том 1',
    year: 1986,
    note: 'Раскрывает происхождение, редакции и архивную основу мемуаров раннего периода; каждое свидетельство остаётся жанрово и авторски ограниченным.',
  },
  {
    id: 'ye1-tatiana-yesenina-on-reich',
    title: 'Т. С. Есенина. Зинаида Николаевна Райх',
    url: 'https://feb-web.ru/feb/esenin/critics/ev2/ev2-264-.htm?cmd=p',
    kind: 'primary',
    institution: 'Фундаментальная электронная библиотека; «Есенин в воспоминаниях современников», том 2',
    year: 1975,
    note: 'Семейное свидетельство дочери о Райх, браке и детях; оно ценно как named memoir witness, но не заменяет метрические и бракоразводные документы.',
  },
  {
    id: 'ye1-feb-academic-complete-works-description',
    title: 'Академическое Полное собрание сочинений С. А. Есенина: описание издания',
    url: 'https://feb-web.ru/feb/esenin/texts/es0.html',
    kind: 'institutional',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    year: '1995–2002',
    note: 'Фиксирует научную редакцию, состав девяти книг и корпус текстов, переписки и документов; используется для edition provenance, а не для отдельного события.',
  },
  {
    id: 'ye1-feb-pss-v7b2-description',
    title: 'ПСС Есенина, том 7, книга 2: описание документального корпуса',
    url: 'https://feb-web.ru/feb/esenin/texts/e72/e72.html',
    kind: 'institutional',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    year: 2000,
    note: 'Описывает научный том деловых бумаг, документов рукой Есенина, афиш и программ; конкретные claims всё равно требуют точной страницы и документа.',
  },
  {
    id: 'ye1-chronicle-v2-appendix-contents',
    title: 'Приложение к Летописи, том 2: содержание документальных страниц',
    url: 'https://feb-web.ru/feb/esenin/chronics/el2/el2-449-.htm?cmd=p',
    kind: 'archive',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    year: 2005,
    note: 'Точный page map к присяге, рисункам и другим документальным приложениям; служит навигацией к facsimile witnesses, а не самостоятельным изображением документа.',
  },
  {
    id: 'ye1-preobrazhenie-manuscript-plan-1918',
    title: 'С. А. Есенин. Наброски состава разделов сборника «Преображение», 1918',
    url: 'https://feb-web.ru/feb/esenin/texts/e72/e72-1342.htm?cmd=p',
    kind: 'primary',
    institution: 'Фундаментальная электронная библиотека; ПСС Есенина, том 7, книга 2',
    year: 1918,
    note: 'Публикация авторских набросков из ИМЛИ и РГАЛИ показывает рабочую композицию религиозно-революционного корпуса; не является завершённым авторским предисловием.',
  },
  {
    id: 'ye1-unknown-collection-author-list',
    title: 'С. А. Есенин. Перечень стихотворений для неизвестного сборника',
    url: 'https://feb-web.ru/feb/esenin/texts/e72/e72-1442.htm?cmd=p',
    kind: 'primary',
    institution: 'Фундаментальная электронная библиотека; ПСС Есенина, том 7, книга 2',
    year: '1910-е',
    note: 'Авторский рабочий перечень помогает реконструировать книжное мышление и соседство текстов; неопределённый сборник нельзя самовольно датировать или называть.',
  },
  {
    id: 'ye1-otchar-academic-text',
    title: 'С. А. Есенин. Отчарь',
    url: 'https://feb-web.ru/feb/esenin/texts/es2/es2-035-.htm?cmd=p',
    kind: 'primary',
    institution: 'Фундаментальная электронная библиотека; ПСС Есенина, том 2',
    year: 1917,
    note: 'Академический текст поэмы для анализа революционной и библейской образности; поэтический субъект не превращается автоматически в документальное исповедание.',
  },
  {
    id: 'ye1-oktoikh-academic-text',
    title: 'С. А. Есенин. Октоих',
    url: 'https://feb-web.ru/feb/esenin/texts/es2/es2-041-.htm?cmd=p',
    kind: 'primary',
    institution: 'Фундаментальная электронная библиотека; ПСС Есенина, том 2',
    year: 1917,
    note: 'Академический текст и церковнославянская рамка поэмы позволяют точный close reading; богословская оценка должна маркироваться как интерпретация проекта.',
  },
  {
    id: 'ye1-klyuchi-marii-academic-text',
    title: 'С. А. Есенин. Ключи Марии',
    url: 'https://feb-web.ru/feb/esenin/texts/e75/e75-186-.htm?cmd=p',
    kind: 'primary',
    institution: 'Фундаментальная электронная библиотека; ПСС Есенина, том 5',
    year: 1918,
    note: 'Авторский теоретический текст о народной образности и метафоре; он нужен для отделения собственной эстетики Есенина от коллективных формул имажинистов.',
  },
] as const satisfies readonly EssaySource[];

export type YeseninPartOnePassThreeSourceId = NonNullable<
  (typeof yeseninPartOneSourcesPassThree)[number]['id']
>;

type AnyYeseninPartOneSourceId =
  | YeseninPartOneSourceId
  | YeseninPartOnePassTwoSourceId
  | YeseninPartOnePassThreeSourceId;

export const yeseninPartOnePassThreeClaimCoverage = {
  'YE1-007': {
    sourceIds: ['ye1-feb-chronicle-1913'],
    remaining: ['exact employment and address page witnesses for the 1912–1914 Moscow sequence'],
  },
  'YE1-010': {
    sourceIds: [
      'ye1-feb-chronicle-1914',
      'ye1-izryadnova-family-commentary',
      'ye1-contemporary-memoirs-editorial-commentary-v1',
    ],
    remaining: ['birth/family record witness and exact full memoir pages before causal prose is frozen'],
  },
  'YE1-020': {
    sourceIds: ['ye1-tatiana-yesenina-on-reich'],
    remaining: ['page-verified marriage, birth and divorce records remain controlling over family memory'],
  },
  'YE1-022': {
    sourceIds: [
      'ye1-preobrazhenie-manuscript-plan-1918',
      'ye1-otchar-academic-text',
      'ye1-oktoikh-academic-text',
      'ye1-klyuchi-marii-academic-text',
    ],
    remaining: ['classified secondary scholarship and first-publication facsimiles for reception claims'],
  },
  'YE1-023': {
    sourceIds: ['ye1-klyuchi-marii-academic-text'],
    remaining: ['the 1919 declaration first-publication witness still controls collective-program claims'],
  },
} as const satisfies Record<
  string,
  {
    sourceIds: readonly AnyYeseninPartOneSourceId[];
    remaining: readonly string[];
  }
>;
