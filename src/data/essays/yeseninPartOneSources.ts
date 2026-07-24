import type { EssaySource } from '../../types/essay';

/**
 * Classified source registry for the unpublished Yesenin biography Part I.
 *
 * The registry is intentionally not attached to `essays` yet. It establishes
 * canonical IDs and evidence limits before public prose/citation topology is
 * frozen. A navigable HTML transcription may support wording and page
 * orientation, but it does not replace a required facsimile when the claim
 * depends on a physical record, title page, signature, verso or archive unit.
 */
export const yeseninPartOneSources = [
  {
    id: 'ye1-imli-chronicle-v1-catalogue',
    title: 'Летопись жизни и творчества С. А. Есенина. Том 1. 1895–1916',
    url: 'https://biblio.imli.ru/index.php/ruslit/527-esenin-s-a/821-letopis-zhizni-i-tvorchestva-s-a-esenina-tom-1',
    kind: 'research',
    institution: 'ИМЛИ РАН',
    year: 2003,
    note: 'Каноническая академическая хронология раннего периода и навигатор к приложению документов; для сильных дат и архивных формулировок нужны точные страницы PDF.',
  },
  {
    id: 'ye1-feb-chronicle-v1-preface',
    title: 'Предисловие к первому тому Летописи жизни и творчества С. А. Есенина',
    url: 'https://feb-web.ru/feb/esenin/chronics/el1/el1-068-.htm?cmd=p',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    year: 2003,
    note: 'Объясняет охват, принципы и документальную базу первого тома; не заменяет страницы конкретного события.',
  },
  {
    id: 'ye1-feb-chronicle-1915',
    title: '1915: Летопись жизни и творчества С. А. Есенина',
    url: 'https://feb-web.ru/feb/esenin/el-abc/el1/el1-1981.htm?cmd=p&istext=1',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    year: 2003,
    note: 'Постатейная академическая хронология петербургского периода, встречи с Блоком, рекомендаций и первых литературных связей.',
  },
  {
    id: 'ye1-yesenin-letter-to-blok-1915-feb',
    aliases: ['ye1-letter-blok-9-march-1915'],
    title: 'С. А. Есенин — А. А. Блоку, 9 марта 1915 года',
    url: 'https://feb-web.ru/feb/esenin/texts/es6/es6-0642.htm?cmd=p',
    kind: 'primary',
    institution: 'Фундаментальная электронная библиотека; ПСС Есенина, т. 6',
    year: 1915,
    note: 'Академическая публикация письма на с. 64; подтверждает дату, адресата и просьбу о встрече, но не весь последующий causal narrative.',
  },
  {
    id: 'ye1-yesenin-letter-to-blok-1915-museum',
    title: 'Блоку А. А., 9 марта 1915',
    url: 'https://www.museum-esenin.ru/esenin/pisma/1915/bloku-a.a.-9-marta-1915',
    kind: 'institutional',
    institution: 'Государственный музей-заповедник С. А. Есенина',
    year: 1915,
    note: 'Институциональная публикация того же письма; используется как независимая навигационная сверка, а не как второй отдельный первичный документ.',
  },
  {
    id: 'ye1-blok-meeting-comments-1915',
    title: 'Комментарии ПСС Есенина к встрече с Блоком 9 марта 1915 года',
    url: 'https://feb-web.ru/feb/esenin/texts/e77/e77-357-.htm?cmd=p',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека; ПСС Есенина, т. 7, кн. 1',
    year: 1999,
    note: 'Сводит записную книжку Блока, помету на записке Есенина и рекомендательные записки; цитаты должны оставаться свидетельствами Блока, а не безусловным академическим приговором.',
  },
  {
    id: 'ye1-radunitsa-first-edition-neb',
    aliases: ['ye1-radunitsa-1916'],
    title: 'С. А. Есенин. Радуница. Первое издание',
    url: 'https://rusneb.ru/catalog/000199_000009_004210209/',
    kind: 'primary',
    institution: 'Национальная электронная библиотека / Российская государственная библиотека',
    year: 1916,
    note: 'Полный 62-страничный экземпляр издания М. В. Аверьянова; требует page witness титула, состава и цитируемых стихотворений.',
  },
  {
    id: 'ye1-autobiography-1924',
    title: 'С. А. Есенин. Автобиография, 1924',
    url: 'https://feb-web.ru/feb/esenin/texts/e77/e77-014-.htm?cmd=p',
    kind: 'primary',
    institution: 'Фундаментальная электронная библиотека; ПСС Есенина, т. 7, кн. 1',
    year: 1924,
    note: 'Позднее авторское самоописание детства, семьи и имажинизма; должно маркироваться как ретроспективная автобиография, не синхронный дневник.',
  },
  {
    id: 'ye1-autobiographical-note-1922',
    title: 'С. А. Есенин. «Сергей Есенин», 14 мая 1922 года',
    url: 'https://feb-web.ru/feb/esenin/texts/e77/e77-008-.htm?cmd=p',
    kind: 'primary',
    institution: 'Фундаментальная электронная библиотека; ПСС Есенина, т. 7, кн. 1',
    year: 1922,
    note: 'Краткое авторское самоописание книг, поездок и имажинистских публичных действий; хронологически последующее свидетельство с очевидной авторской позой.',
  },
  {
    id: 'ye1-preobrazhenie-academic-text',
    title: 'С. А. Есенин. Преображение',
    url: 'https://feb-web.ru/feb/esenin/texts/es2/es2-052-.htm?cmd=p',
    kind: 'primary',
    institution: 'Фундаментальная электронная библиотека; ПСС Есенина, т. 2',
    year: 1918,
    note: 'Академический текст поэмы на с. 52–56; подтверждает лексику и образную систему, но богословская оценка должна быть помечена как интерпретация проекта.',
  },
  {
    id: 'ye1-inonia-academic-text',
    title: 'С. А. Есенин. Инония',
    url: 'https://feb-web.ru/feb/esenin/texts/es2/es2-061-.htm?cmd=p',
    kind: 'primary',
    institution: 'Фундаментальная электронная библиотека; ПСС Есенина, т. 2',
    year: 1918,
    note: 'Академический текст поэмы на с. 61–68; используется для точного анализа христианской лексики и её революционной трансформации.',
  },
  {
    id: 'ye1-chronicle-1919',
    title: '1919: Летопись жизни и творчества С. А. Есенина',
    url: 'https://feb-web.ru/feb/esenin/el-abc/el2/el2-199-.htm?cmd=p&istext=1',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    year: 2005,
    note: 'Академическая хронология имажинистского периода и синхронной рецепции религиозно-революционных поэм; рецензии не принимаются за нейтральное описание текста.',
  },
  {
    id: 'ye1-chronicle-1920',
    title: '1920: Летопись жизни и творчества С. А. Есенина',
    url: 'https://feb-web.ru/feb/esenin/el-abc/el2/el2-325-.htm?cmd=p&istext=1',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека / ИМЛИ РАН',
    year: 2005,
    note: 'Хронология создания и первого книжного контекста «Исповеди хулигана»; нужна отдельная page-проверка первого издания для библиографического блока.',
  },
  {
    id: 'ye1-ispoved-huligana-academic-text',
    title: 'С. А. Есенин. Исповедь хулигана',
    url: 'https://feb-web.ru/feb/esenin/texts/es2/es2-085-.htm?cmd=p',
    kind: 'primary',
    institution: 'Фундаментальная электронная библиотека; ПСС Есенина, т. 2',
    year: 1920,
    note: 'Академический текст на с. 85–88; литературное «я» и строка «Я нарочно иду нечесаным» не должны автоматически превращаться в полный биографический мотив.',
  },
  {
    id: 'ye1-ispoved-huligana-comments',
    title: 'Комментарии ПСС к «Исповеди хулигана»',
    url: 'https://feb-web.ru/feb/esenin/texts/es2/es2-255-.htm?cmd=p',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека; ПСС Есенина, т. 2',
    year: 1997,
    note: 'Фиксирует рукописную/печатную историю, датировку и современную рецепцию; не доказывает тождество поэтической маски и бытового поведения.',
  },
  {
    id: 'ye1-pss-v4-commentary-context',
    title: 'Комментарии к ПСС С. А. Есенина, том 4',
    url: 'https://feb-web.ru/feb/esenin/texts/e74/e74-323-.htm?cmd=p',
    kind: 'research',
    institution: 'Фундаментальная электронная библиотека; ПСС Есенина, т. 4',
    year: 1996,
    note: 'Навигационная точка к комментариям и архивным сокращениям тома; конкретные семейные и ранние текстовые claims должны ссылаться на точный подраздел/страницу, а не на том целиком.',
  },
] as const satisfies readonly EssaySource[];

export type YeseninPartOneSourceId = NonNullable<(typeof yeseninPartOneSources)[number]['id']>;

/**
 * Pass-one coverage only. Missing primary/facsimile targets stay explicit so a
 * future author cannot silently treat a general chronicle URL as proof of a
 * birth register, school certificate, marriage record or military list.
 */
export const yeseninPartOneClaimCoverage = {
  'YE1-001': {
    sourceIds: ['ye1-imli-chronicle-v1-catalogue', 'ye1-autobiography-1924'],
    missing: ['exact chronicle page and school/birth-document witness'],
  },
  'YE1-004': {
    sourceIds: ['ye1-imli-chronicle-v1-catalogue'],
    missing: ['exact page naming the Спас-Клепиковская второклассная учительская школа духовного ведомства'],
  },
  'YE1-007': {
    sourceIds: ['ye1-imli-chronicle-v1-catalogue'],
    missing: ['exact PDF page for the 1912 Moscow move and first address'],
  },
  'YE1-010': {
    sourceIds: ['ye1-pss-v4-commentary-context'],
    missing: ['exact Izryadnova memoir/commentary pages and family-record witness'],
  },
  'YE1-012': {
    sourceIds: ['ye1-yesenin-letter-to-blok-1915-feb', 'ye1-feb-chronicle-1915'],
    missing: [],
  },
  'YE1-013': {
    sourceIds: ['ye1-blok-meeting-comments-1915', 'ye1-feb-chronicle-1915'],
    missing: ['facsimile/object witness if the handwritten note is reproduced as an image'],
  },
  'YE1-015': {
    sourceIds: ['ye1-radunitsa-first-edition-neb'],
    missing: ['title, contents and cited-page screenshots from the 62-page scan'],
  },
  'YE1-016': {
    sourceIds: ['ye1-imli-chronicle-v1-catalogue'],
    missing: ['exact chronicle/RGIA page for the 20 April 1916 train no. 143 team record'],
  },
  'YE1-020': {
    sourceIds: ['ye1-autobiography-1924'],
    missing: ['marriage and children records plus exact Chronicle volume 2 pages'],
  },
  'YE1-022': {
    sourceIds: ['ye1-preobrazhenie-academic-text', 'ye1-inonia-academic-text', 'ye1-chronicle-1919'],
    missing: ['first-publication witnesses and a classified secondary-study set'],
  },
  'YE1-023': {
    sourceIds: ['ye1-autobiography-1924', 'ye1-chronicle-1919'],
    missing: ['declaration text, exact date and first-publication facsimile'],
  },
  'YE1-025': {
    sourceIds: ['ye1-ispoved-huligana-academic-text', 'ye1-ispoved-huligana-comments', 'ye1-chronicle-1920'],
    missing: ['first-edition scan if the book object is discussed'],
  },
  'YE1-027': {
    sourceIds: [],
    missing: ['exact Chronicle volume 3 book 1 pages for the Duncan meeting date/place'],
  },
} as const satisfies Record<
  string,
  {
    sourceIds: readonly YeseninPartOneSourceId[];
    missing: readonly string[];
  }
>;
