import type { Essay, EssayBlock, EssaySource } from '../../src/types/essay';
import { yeseninPartOneSources } from '../../src/data/essays/yeseninPartOneSources';
import { yeseninPartOneSourcesPassFourDuncan } from '../../src/data/essays/yeseninPartOneSourcesPassFourDuncan';
import { yeseninPartOneSourcesPassFourImagism } from '../../src/data/essays/yeseninPartOneSourcesPassFourImagism';
import { yeseninPartOneTheatricalMoscowPassEleven } from '../../src/data/essays/yeseninPartOneTheatricalMoscowPassEleven';

export const YESENIN_DUNCAN_FIRST_MEETING_UNPUBLISHED_ID =
  'essay-yesenin-duncan-first-meeting-unpublished' as const;
export const YESENIN_DUNCAN_FIRST_MEETING_UNPUBLISHED_SLUG =
  'yesenin-duncan-first-meeting-documents-unpublished' as const;

export interface YeseninDuncanMainArticleBridge {
  id: string;
  topic: string;
  maximumParagraphs: number;
  purpose: string;
}

export interface YeseninDuncanFirstMeetingUnpublishedPackage {
  status: 'unpublished-companion-investigation';
  publicationAuthorized: false;
  registrationAuthorized: false;
  mediaPublicationAuthorized: false;
  sourceImagesAuthorized: false;
  mainArticleMaximumDuncanProseBlocks: 6;
  mainArticleBridge: readonly YeseninDuncanMainArticleBridge[];
  companionOnlyTopics: readonly string[];
  draftComplete: true;
  finalEditorialReviewComplete: false;
  essay: Essay;
}

const inheritedSourcePool: readonly EssaySource[] = [
  ...yeseninPartOneSources,
  ...yeseninPartOneSourcesPassFourDuncan,
  ...yeseninPartOneSourcesPassFourImagism,
];

const requireSource = (id: string): EssaySource => {
  const source = inheritedSourcePool.find((candidate) => candidate.id === id);
  if (!source) throw new Error(`[yesenin-duncan-companion] missing inherited source ${id}`);
  return {
    ...source,
    aliases: source.aliases ? [...source.aliases] : undefined,
  };
};

const inheritedSources = [
  'ye1-autobiography-1924',
  'ye1-ellens-duncan-yesenin',
  'ye1-schneider-memoir-commentary',
  'ye1-nypl-isadora-programs',
  'ye1-nypl-isadora-moscow-reviews',
  'ye1-nypl-irma-duncan-papers',
  'ye1-nypl-irma-duncan-collection',
  'ye1-letter-schneider-june-1922',
  'ye1-mariengof-memoir',
  'ye1-konenkov-memoir',
  'ye1-babenchikov-memoir',
].map(requireSource);

const theatricalSources: EssaySource[] = yeseninPartOneTheatricalMoscowPassEleven.map((record) => ({
  id: `yd1-${record.id.toLowerCase()}`,
  title: `«Театральная Москва», ${record.label}`,
  url: record.catalogueUrl,
  kind: 'primary',
  institution: 'Национальная электронная библиотека',
  year: 1921,
  note:
    `Реальный цифровой выпуск просмотрен покадрово (${record.pdfFrames} PDF-кадров). ` +
    'Используются только вручную проверенные заголовки и хронологические опоры; права на воспроизведение сканов не установлены.',
}));

const companionSources: EssaySource[] = [
  ...inheritedSources,
  ...theatricalSources,
  {
    id: 'yd1-pss-duncan-chronology',
    title: 'Комментарии ПСС Есенина к знакомству с Айседорой Дункан и хронологии 1921 года',
    kind: 'research',
    institution: 'Полное собрание сочинений С. А. Есенина / ИМЛИ РАН',
    year: 2000,
    note:
      'Академическая реконструкция формулирует 3 октября осторожно — как вероятную дату; это не синхронный протокол вечера.',
  },
  {
    id: 'yd1-mcvay-isadora-yesenin',
    title: 'Gordon McVay. Isadora and Esenin',
    kind: 'research',
    institution: 'Исследовательский PDF, предоставленный редакции',
    year: 1980,
    note:
      'Сопоставляет конкурирующие мемуарные хронологии и показывает, почему точная дата первой встречи не устанавливается одним свидетельством.',
  },
];

const blocks: EssayBlock[] = [
  {
    id: 'yd1-lead',
    type: 'lead',
    text:
      'Историю знакомства Сергея Есенина и Айседоры Дункан часто рассказывают как готовую сцену: мастерская, мгновенное узнавание, несколько эффектных слов — и начало бурного романа. Документы устроены иначе. Они увереннее подтверждают самостоятельный московский проект Дункан, художественную среду встречи и публичные события ноября 1921 года, чем точный день, последовательность жестов и первые реплики. Поэтому эта история требует не романтического пересказа, а отдельного расследования источников.',
    sourceIds: ['yd1-pss-duncan-chronology', 'yd1-mcvay-isadora-yesenin'],
  },

  { id: 'yd1-section-method', type: 'section', heading: 'Почему одной красивой сцены недостаточно', anchor: 'method' },
  {
    id: 'yd1-method-genres',
    type: 'paragraph',
    text:
      'В распоряжении биографа находятся источники разных жанров и разной временной дистанции: академические комментарии, поздние воспоминания участников литературного круга, газетная хроника, архивные описи программ и дневников, письма следующего периода. Они отвечают на разные вопросы. Газета может подтвердить, что выступление состоялось и обсуждалось; мемуар — показать, как событие запомнили; комментарий — сопоставить версии. Ни один из этих жанров сам по себе не является стенограммой первой встречи.',
    sourceIds: ['yd1-pss-duncan-chronology', 'ye1-schneider-memoir-commentary', 'ye1-nypl-isadora-moscow-reviews'],
  },
  {
    id: 'yd1-method-hierarchy',
    type: 'paragraph',
    text:
      'Надёжная реконструкция начинается не с выбора самого яркого рассказа, а с иерархии доказательств. Синхронная дата печатного выпуска сильнее позднего приблизительного воспоминания о месяце; несколько независимых свидетельств о месте встречи сильнее одного литературного диалога; отсутствие списка гостей нельзя заполнять догадкой. Такая осторожность не обедняет историю — она отделяет то, что произошло, от того, как событие превратилось в легенду.',
    sourceIds: ['yd1-mcvay-isadora-yesenin', 'ye1-konenkov-memoir', 'ye1-mariengof-memoir'],
  },

  { id: 'yd1-section-independent-project', type: 'section', heading: 'Дункан приехала в Москву не ради Есенина', anchor: 'independent-project' },
  {
    id: 'yd1-independent-arrival',
    type: 'paragraph',
    text:
      'К моменту знакомства Дункан уже действовала в Москве как самостоятельная международная художница. Её приезд был связан с переговорами о школе, идеей искусства для широкой публики, поиском помещения, набором детей и подготовкой собственной программы. Расхождение между 23 и ранним утром 24 июля важно для точной хронологии маршрута, но не меняет главного: московский проект возник до встречи с Есениным и не был приложением к его биографии.',
    sourceIds: ['yd1-pss-duncan-chronology', 'ye1-nypl-isadora-moscow-reviews', 'ye1-nypl-irma-duncan-papers'],
  },
  {
    id: 'yd1-independent-press',
    type: 'paragraph',
    text:
      'Печатная среда ноября показывает Дункан как предмет самостоятельного общественного и художественного интереса. Во втором номере «Театральной Москвы» появился материал «Айседора Дункан о Москве». Он не сообщает о Есенине и не должен использоваться для реконструкции знакомства, зато подтверждает, что её московские впечатления и проект уже существовали в публичном поле независимо от будущего брака.',
    sourceIds: ['yd1-tm11-ye1-no2'],
  },
  {
    id: 'yd1-independent-agency',
    type: 'note',
    text:
      'Такое начало защищает обоих героев от упрощения. Дункан не появляется в истории как функция судьбы русского поэта, а Есенин не становится единственным объяснением её московских решений. Их встреча была пересечением двух уже сложившихся художественных биографий.',
    sourceIds: ['ye1-nypl-irma-duncan-collection', 'ye1-ellens-duncan-yesenin'],
  },

  { id: 'yd1-section-place', type: 'section', heading: 'Место встречи известно лучше, чем дата', anchor: 'place' },
  {
    id: 'yd1-place-yakulov',
    type: 'paragraph',
    text:
      'Мастерская Георгия Якулова остаётся наиболее устойчивой географической опорой. Её называют Мариенгоф, Конёнков и академический комментарий. Это не сохранившийся протокол вечера и не полный список присутствовавших, но совпадение нескольких линий памяти делает место убедительнее большинства деталей сцены.',
    sourceIds: ['ye1-mariengof-memoir', 'ye1-konenkov-memoir', 'yd1-pss-duncan-chronology'],
  },
  {
    id: 'yd1-place-circle',
    type: 'paragraph',
    text:
      'Важно и само устройство этого пространства. Мастерская соединяла художников, поэтов, актёров и людей театра; знакомство произошло не в изоляции двух будущих супругов, а внутри московской художественной сети. Поэтому биографическая сцена должна сохранять присутствие среды, а не превращать вечер в заранее назначенное романтическое свидание.',
    sourceIds: ['ye1-babenchikov-memoir', 'ye1-konenkov-memoir', 'ye1-mariengof-memoir'],
  },

  { id: 'yd1-section-date', type: 'section', heading: 'Почему точная дата остаётся спорной', anchor: 'date' },
  {
    id: 'yd1-date-academic',
    type: 'paragraph',
    text:
      'Развёрнутый академический комментарий пишет о 3 октября 1921 года с оговоркой «видимо». Краткий именной указатель того же корпуса способен превратить эту осторожную формулу в внешне твёрдое число, но сокращение не усиливает доказательство. Для статьи решающей остаётся полная формулировка: дата вероятна, а не засвидетельствована синхронной записью.',
    sourceIds: ['yd1-pss-duncan-chronology'],
  },
  {
    id: 'yd1-date-competing',
    type: 'paragraph',
    text:
      'Другие линии памяти размещают встречу позднее. Ирма Дункан и Аллан Росс Макдугалл связывали её с началом ноября; свидетельство Шнейдера указывает на осень и подразумевает время до выступления 7 ноября. Эти версии не устанавливают новый точный день. Их значение другое: они показывают, что 3 октября нельзя подавать как единственную бесспорную дату.',
    sourceIds: ['yd1-mcvay-isadora-yesenin', 'ye1-schneider-memoir-commentary', 'ye1-nypl-irma-duncan-papers'],
  },
  {
    id: 'yd1-date-conclusion',
    type: 'note',
    text:
      'На нынешнем состоянии источников наиболее честная формула проста: Есенин и Дункан познакомились осенью 1921 года, вероятнее всего в мастерской Якулова; точная дата первой встречи неизвестна.',
    sourceIds: ['yd1-pss-duncan-chronology', 'yd1-mcvay-isadora-yesenin', 'ye1-konenkov-memoir'],
  },

  { id: 'yd1-section-seven-november', type: 'section', heading: '7 ноября: подтверждённый вечер, но не протокол знакомства', anchor: 'seven-november' },
  {
    id: 'yd1-seven-november-reception',
    type: 'paragraph',
    text:
      'Седьмое ноября является более твёрдой опорой, чем дата знакомства. Седьмой номер «Театральной Москвы» обсуждает большой успех танцев Дункан на вечере 7 ноября и одновременно фиксирует спор об их художественной ценности. Перед нами синхронная рецепция публичного события: выступление состоялось, вызвало внимание и не получило единодушной оценки.',
    sourceIds: ['yd1-tm11-ye1-no7'],
  },
  {
    id: 'yd1-seven-november-boundary',
    type: 'paragraph',
    text:
      'Однако газетное свидетельство не доказывает присутствие Есенина в зале и не устанавливает, познакомился ли он с Дункан до этого вечера или незадолго после него. Хронологический якорь нельзя незаметно превратить в биографическую сцену. Для такого вывода потребовались бы программа, список участников, письмо, дневник или другое item-level свидетельство.',
    sourceIds: ['yd1-tm11-ye1-no7', 'ye1-nypl-isadora-programs', 'ye1-nypl-isadora-moscow-reviews'],
  },
  {
    id: 'yd1-seven-november-material-warning',
    type: 'note',
    text:
      'Даже материальный выпуск требует осторожности: в PDF восьмого номера обнаружен внутренний колонтитул «№ 7». Эта аномалия не объясняется догадкой и напоминает, что журнальную последовательность нужно цитировать по конкретному кадру и печатной странице, а не только по имени файла.',
    sourceIds: ['yd1-tm11-ye1-no8'],
  },

  { id: 'yd1-section-legend', type: 'section', heading: 'Как встреча превратилась в легенду', anchor: 'legend' },
  {
    id: 'yd1-legend-mariengof',
    type: 'paragraph',
    text:
      'Самая известная последовательность слов — «золотая голова», затем «ангел» и «чёрт» — приходит прежде всего из воспоминаний Анатолия Мариенгофа. Её можно пересказывать только с именем мемуариста и с указанием жанра. Текст написан позднее, литературно выстроен и связан с общей авторской версией о губительном влиянии Дункан.',
    sourceIds: ['ye1-mariengof-memoir', 'yd1-mcvay-isadora-yesenin'],
  },
  {
    id: 'yd1-legend-variants',
    type: 'paragraph',
    text:
      'Другие воспоминания усиливают расхождение: где-то возникает мгновенное романтическое узнавание, где-то язвительная реплика, пощёчина или надпись на стекле. Эти варианты важны для истории посмертного образа пары, но плохо подходят для восстановления точных движений и фраз. Чем эффектнее деталь, тем важнее спросить, кто, когда и в каком жанре её записал.',
    sourceIds: ['yd1-mcvay-isadora-yesenin', 'ye1-ellens-duncan-yesenin', 'ye1-schneider-memoir-commentary'],
  },
  {
    id: 'yd1-legend-function',
    type: 'paragraph',
    text:
      'Легенда оказалась удобной, потому что заранее объясняла всю будущую историю: бурное сближение, брак, путешествия и взаимное разрушение. Но такое чтение знает финал раньше героев и переносит его в первый вечер. Документальная биография должна удерживать момент открытым: осенью 1921 года ещё не существовало готового сюжета, который позднее расскажут мемуаристы.',
    sourceIds: ['ye1-mariengof-memoir', 'ye1-ellens-duncan-yesenin', 'yd1-mcvay-isadora-yesenin'],
  },

  { id: 'yd1-section-context', type: 'section', heading: 'Что происходило вокруг встречи', anchor: 'context' },
  {
    id: 'yd1-context-anchors',
    type: 'paragraph',
    text:
      'Вместо одной кинематографической ночи источники дают последовательность опор: летний приезд Дункан, завершение развода Есенина с Райх в октябре, вечер 7 ноября, знакомство Есенина со Шнейдером 8 ноября, открытие школы в начале декабря и формальную регистрацию брака лишь 2 мая 1922 года. Такая цепочка не решает спор о первом дне, зато защищает от анахронизмов.',
    sourceIds: ['yd1-pss-duncan-chronology', 'ye1-schneider-memoir-commentary', 'ye1-letter-schneider-june-1922'],
  },
  {
    id: 'yd1-context-bohemia',
    type: 'paragraph',
    text:
      'Объединённый номер «Театральной Москвы» за конец ноября и начало декабря называет Есенина и Клюева в разговоре о московской литературной богеме. Это современное свидетельство публичной узнаваемости Есенина и среды, в которой развивались новые отношения. Оно не доказывает формального членства в описанной группировке и требует полной транскрипции перед прямым цитированием.',
    sourceIds: ['yd1-tm11-ye1-no11-12'],
  },
  {
    id: 'yd1-context-crisis',
    type: 'paragraph',
    text:
      'К моменту знакомства у Есенина уже существовали семейный разрыв, имажинистская маска, революционные противоречия, слава и напряжение между деревенской памятью и городской публичностью. Отношения с Дункан могли усиливать слабости обоих, но не создали задним числом процессы, начавшиеся раньше. Объяснение «она его погубила» так же бедно, как зеркальная легенда, в которой Есенин становится единственной причиной её падения.',
    sourceIds: ['ye1-autobiography-1924', 'ye1-mariengof-memoir', 'yd1-mcvay-isadora-yesenin'],
  },

  { id: 'yd1-section-boundaries', type: 'section', heading: 'Чего документы пока не доказывают', anchor: 'boundaries' },
  {
    id: 'yd1-boundary-list',
    type: 'paragraph',
    text:
      'Нынешний корпус не даёт права назвать точный час и день первой встречи, восстановить полный список гостей, объявить первые реплики стенограммой, доказать присутствие Есенина на вечере 7 ноября или вывести из газетной статьи его формальное участие в конкретной литературной группе. Эти пробелы должны оставаться видимыми, а не маскироваться уверенной интонацией.',
    sourceIds: ['yd1-mcvay-isadora-yesenin', 'yd1-tm11-ye1-no7', 'yd1-tm11-ye1-no11-12'],
  },
  {
    id: 'yd1-boundary-archive',
    type: 'paragraph',
    text:
      'Архивные описи NYPL указывают на программы, московские материалы и дневники Ирмы Дункан 1921 года. Пока item-level единицы не заказаны и не просмотрены, они подтверждают существование перспективного корпуса, но не содержание нужной записи. Следующий шаг — точный архивный запрос, а не ссылка на общую коллекцию как на уже прочитанный документ.',
    sourceIds: ['ye1-nypl-isadora-programs', 'ye1-nypl-isadora-moscow-reviews', 'ye1-nypl-irma-duncan-papers'],
  },
  {
    id: 'yd1-boundary-images',
    type: 'note',
    text:
      'Открытый цифровой скан не означает автоматического разрешения на публикацию изображения. Журнальные страницы остаются исследовательскими свидетелями до отдельного решения по provenance и правам.',
    sourceIds: ['yd1-tm11-ye1-no2', 'yd1-tm11-ye1-no7'],
  },

  { id: 'yd1-section-biography', type: 'section', heading: 'Что должно остаться в основной биографии', anchor: 'biography' },
  {
    id: 'yd1-biography-budget',
    type: 'paragraph',
    text:
      'Для первой части биографии достаточно шести движений: Дункан приехала со своим проектом; место встречи известно лучше даты; точный день остаётся спорным; вечер 7 ноября является подтверждённой публичной опорой, но не доказательством присутствия Есенина; мемуарная сцена должна быть атрибутирована; знакомство открывает вторую часть, не объясняя заранее её трагический финал. Всё остальное принадлежит отдельному расследованию.',
    sourceIds: ['yd1-pss-duncan-chronology', 'yd1-tm11-ye1-no7', 'ye1-mariengof-memoir'],
  },
  {
    id: 'yd1-biography-series-boundary',
    type: 'paragraph',
    text:
      'Встреча остаётся сильной границей серии не потому, что биограф способен восстановить каждый жест. Она меняет масштаб: впереди официальный брак, Европа, Америка, международная пресса, новые книги и новые конфликты. Первая часть должна остановиться на пороге этой географии, а подробная источниковая история встречи — жить рядом, не утяжеляя основное повествование.',
    sourceIds: ['ye1-letter-schneider-june-1922', 'ye1-ellens-duncan-yesenin', 'yd1-mcvay-isadora-yesenin'],
  },
];

const wordCount = blocks
  .filter((block): block is EssayBlock & { text: string } => 'text' in block)
  .reduce((total, block) => total + block.text.split(/\s+/u).filter(Boolean).length, 0);

const essay: Essay = {
  id: YESENIN_DUNCAN_FIRST_MEETING_UNPUBLISHED_ID,
  slug: YESENIN_DUNCAN_FIRST_MEETING_UNPUBLISHED_SLUG,
  kicker: 'Документальное расследование · непубличный черновик',
  title: 'Есенин и Айседора Дункан: что документы говорят о первой встрече',
  subtitle:
    'Московский проект Дункан, мастерская Якулова, спорные даты, вечер 7 ноября и рождение мемуарной легенды.',
  excerpt:
    'Отдельное источниковое расследование о знакомстве Есенина и Дункан — без превращения поздних воспоминаний в стенограмму.',
  seoTitle: 'Есенин и Айседора Дункан: первая встреча и документы 1921 года',
  seoDescription:
    'Непубличный документальный черновик о первой встрече Есенина и Айседоры Дункан, московской прессе 1921 года и конкурирующих мемуарных хронологиях.',
  seoKeywords: [
    'Есенин и Айседора Дункан',
    'первая встреча Есенина и Дункан',
    'Айседора Дункан Москва 1921',
    'мастерская Якулова',
    'Театральная Москва 1921',
  ],
  author: 'Редакция THE LEGENDARY POET',
  date: '2026-07-25',
  readTime: Math.max(16, Math.ceil(wordCount / 180)),
  cover: '/images/essays/archive/yesenin-1914.webp',
  cardCover: '/images/essays/archive/yesenin-1914.webp',
  coverAlt: 'Редакционный placeholder для непубличного расследования о Есенине и Дункан',
  coverKind: 'archive',
  coverCredit: 'Медиа не выбрано · публикация изображения не разрешена',
  accent: '#c9a66b',
  tags: ['Сергей Есенин', 'Айседора Дункан', 'Москва 1921', 'Архив', 'Непубличный черновик'],
  poetId: 'sergei-yesenin',
  cluster: {
    id: 'sergei-yesenin-biography',
    label: 'Сергей Есенин: биография и архив',
    role: 'investigation',
    order: 2,
  },
  relatedEssayIds: ['essay-yesenin-biography-part-one-unpublished'],
  blocks,
  sources: companionSources,
};

export const yeseninDuncanFirstMeetingUnpublished: YeseninDuncanFirstMeetingUnpublishedPackage = {
  status: 'unpublished-companion-investigation',
  publicationAuthorized: false,
  registrationAuthorized: false,
  mediaPublicationAuthorized: false,
  sourceImagesAuthorized: false,
  mainArticleMaximumDuncanProseBlocks: 6,
  mainArticleBridge: [
    {
      id: 'yd1-bridge-independent-project',
      topic: 'Самостоятельный московский проект Дункан',
      maximumParagraphs: 1,
      purpose: 'Не вводить Дункан как функцию биографии Есенина.',
    },
    {
      id: 'yd1-bridge-place-date',
      topic: 'Мастерская Якулова и неопределённая дата',
      maximumParagraphs: 2,
      purpose: 'Сохранить устойчивое место и честную неопределённость дня.',
    },
    {
      id: 'yd1-bridge-seven-november',
      topic: 'Публичный вечер 7 ноября',
      maximumParagraphs: 1,
      purpose: 'Дать синхронную опору без вывода о присутствии Есенина.',
    },
    {
      id: 'yd1-bridge-memoir-boundary',
      topic: 'Атрибуция мемуарной сцены',
      maximumParagraphs: 1,
      purpose: 'Не выдавать Мариенгофа за стенограмму.',
    },
    {
      id: 'yd1-bridge-series',
      topic: 'Переход ко второй части',
      maximumParagraphs: 1,
      purpose: 'Закончить часть I новым масштабом, а не пересказом будущей трагедии.',
    },
  ],
  companionOnlyTopics: [
    'расхождение 23/24 июля',
    'полная конкуренция хронологий 3 октября и начала ноября',
    'покадровая колляция четырёх выпусков «Театральной Москвы»',
    'аномалия внутреннего колонтитула № 7 в выпуске № 8',
    'варианты Дести, Сабанеева и Георгия Иванова',
    'история формирования формулы «золотая голова — ангел — чёрт»',
    'item-level очередь NYPL',
    'развёрнутый разбор взаимных обвинительных легенд',
  ],
  draftComplete: true,
  finalEditorialReviewComplete: false,
  essay,
};
