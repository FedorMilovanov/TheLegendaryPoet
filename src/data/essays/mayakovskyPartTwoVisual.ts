import type { Essay, EssayBlock } from '../../types/essay';
import { mayakovskyGromovoy as baseMayakovsky } from './mayakovskyGromovoy';
import { fromSection, insertArchiveImages } from './visualArchive';

const movement = fromSection(baseMayakovsky.blocks, 'Революцией мобилизованный');

const bridge: EssayBlock[] = [
  {
    type: 'epigraph',
    text: 'Но я себя смирял, становясь на горло собственной песне.',
    cite: 'В. Маяковский, «Во весь голос», 1930',
  },
  {
    type: 'lead',
    text: 'Вторая часть начинается там, где футуристический бунт становится государственной работой. Маяковский принимает Октябрь как собственную революцию, создаёт плакаты РОСТА, организует ЛЕФ, путешествует и продолжает писать сильную любовную лирику. Одновременно общий дом Бриков, идеологическая роль и профессиональная среда всё сильнее связывают личный голос с внешней системой.',
  },
  { type: 'section', heading: 'РОСТА: рисунок, ритм и ежедневная работа' },
  {
    type: 'paragraph',
    text: 'В 1919–1922 годах Маяковский работал над «Окнами сатиры РОСТА»: писал короткие подписи, придумывал композиции и участвовал в изготовлении плакатов. Это была не случайная подработка, а лаборатория его зрелого языка. Лозунг требовал предельной ясности, рисунок — мгновенного чтения, а серия — дисциплины ежедневного производства.',
  },
  {
    type: 'image',
    src: '/images/essays/archive/mayakovsky-circle-1924.webp',
    mediaKey: 'mayakovsky-circle-1924',
    alt: 'Владимир Маяковский, Лиля Брик, Борис Пастернак, Сергей Эйзенштейн и литераторы, 1924 год',
    caption: 'Маяковский и художественный круг. 1924.',
    credit: 'Wikimedia Commons, общественное достояние',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Mayakovsky_Pasternak.jpg',
    kind: 'archive',
    layout: 'wide',
    objectPosition: '50% 35%',
  },
  { type: 'section', heading: 'ЛЕФ и редакционный дом' },
  {
    type: 'paragraph',
    text: 'В 1922 году возник ЛЕФ — Левый фронт искусств. Вокруг журнала сошлись литература, фотография, кино, дизайн и теория производственного искусства. Осип Брик был редактором и критиком, Лиля участвовала в кино- и издательской работе, а квартира становилась местом встреч. Этот круг давал Маяковскому постоянную профессиональную среду, хотя не разрешал нравственных и эмоциональных противоречий общего быта.',
  },
  {
    type: 'image',
    src: '/images/essays/archive/mayakovsky-circle-1925.webp',
    mediaKey: 'mayakovsky-circle-1925',
    alt: 'Маяковский, Брики, Пастернак, Шкловский, Эльза Триоле и друзья, 1925 год',
    caption: 'Круг Маяковского после возвращения из Америки. 1925.',
    credit: 'Wikimedia Commons, общественное достояние',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Maiakowski_1925.jpg',
    kind: 'archive',
    layout: 'wide',
    objectPosition: '50% 45%',
  },
  { type: 'section', heading: 'Мексика, Америка и взгляд извне' },
  {
    type: 'paragraph',
    text: 'В 1925 году Маяковский через Мексику приехал в Соединённые Штаты. Его путевые очерки соединяют наблюдательность с идеологическим спором: технический масштаб Америки восхищал, социальный порядок вызывал неприятие. В Нью-Йорке он познакомился с Элли Джонс; в 1926 году у неё родилась дочь Патрисия Томпсон, о существовании которой широкая публика узнала значительно позже.',
  },
  {
    type: 'image',
    src: '/images/essays/archive/mayakovsky-mexico-1925.webp',
    mediaKey: 'mayakovsky-mexico-1925',
    alt: 'Владимир Маяковский и Франсиско Морено в Мехико, фотограф Тина Модотти, 1925 год',
    caption: 'Мехико. Фотография Тины Модотти, 1925.',
    credit: 'Тина Модотти; Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Mayakovsky_and_Moreno_by_Modotti_1925.jpg',
    kind: 'archive',
    layout: 'portrait',
    objectPosition: '50% 24%',
  },
  {
    type: 'image',
    src: '/images/essays/archive/mayakovsky-dog-1925.webp',
    mediaKey: 'mayakovsky-dog-1925',
    alt: 'Владимир Маяковский с собакой Скотчиком в Пушкине, 1925 год',
    caption: 'Маяковский со Скотчиком. 1925.',
    credit: 'Wikimedia Commons, общественное достояние',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Mayakovsky_with_dog_Pushkino_1925.jpg',
    kind: 'archive',
    layout: 'portrait',
    objectPosition: '50% 30%',
  },
  { type: 'section', heading: 'Лиля, Татьяна и невозможность дома' },
  {
    type: 'paragraph',
    text: 'Связь с Лилей Брик сохранялась, но не была единственной. В Париже Маяковский влюбился в Татьяну Яковлеву и надеялся на совместную жизнь; она не приехала в СССР. Позднее возникли отношения с актрисой Вероникой Полонской. Во всех случаях повторяется потребность в исключительном доме — именно том, которого многолетняя модель «свободной любви» не могла дать.',
  },
  {
    type: 'image',
    src: '/images/essays/archive/mayakovsky-lilya-crimea-1926.webp',
    mediaKey: 'mayakovsky-lilya-crimea-1926',
    alt: 'Владимир Маяковский и Лиля Брик в Крыму, 1926 год',
    caption: 'Маяковский и Лиля Брик в Крыму. 1926.',
    credit: 'Wikimedia Commons, общественное достояние',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Mayakovsky_Brik_Crimea_1926.jpg',
    kind: 'archive',
    layout: 'portrait',
    objectPosition: '50% 38%',
  },
];

const illustratedMovement = insertArchiveImages(movement, {
  'Революцией мобилизованный': [
    {
      type: 'image',
      src: '/images/essays/archive/mayakovsky-1928-osip.webp',
      mediaKey: 'mayakovsky-1928-osip',
      alt: 'Портрет Владимира Маяковского, фотограф Осип Брик, 1928 год',
      caption: 'Маяковский. Фотография Осипа Брика, 1928.',
      credit: 'Осип Брик; Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Mayakovsky_1928_by_Osip_Brik.jpg',
      kind: 'archive',
      layout: 'portrait',
      objectPosition: '50% 18%',
    },
  ],
  '1930: несколько кризисов сразу': [
    {
      type: 'image',
      src: '/images/essays/archive/mayakovsky-tarasov-1930.webp',
      mediaKey: 'mayakovsky-tarasov-1930',
      alt: 'Владимир Маяковский и Фёдор Тарасов, 1930 год',
      caption: 'Один из поздних кадров Маяковского. 1930.',
      credit: 'Wikimedia Commons, архив наследников',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Mayakovsky_and_Fedor_Tarasov.jpg',
      kind: 'archive',
      layout: 'wide',
      objectPosition: '50% 34%',
    },
  ],
  'После выстрела — бронза': [
    {
      type: 'image',
      src: '/images/essays/archive/mayakovsky-shaving-1927.webp',
      mediaKey: 'mayakovsky-shaving-1927',
      alt: 'Владимир Маяковский бреется, фотограф Осип Брик, 1927 год',
      caption: 'Домашний Маяковский. Фотография Осипа Брика, 1927.',
      credit: 'Осип Брик; Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:1927._Владимир_Маяковский_бреется.jpg',
      kind: 'archive',
      layout: 'portrait',
      objectPosition: '50% 45%',
    },
  ],
});

const lateDocumentBlocks: EssayBlock[] = [
  {
    type: 'paragraph',
    text: 'Профессиональный кризис не означал прекращения работы. В конце февраля Маяковский сообщал, что цирковая пантомима «Москва горит» была сдана и принята, а вслед за ней заключён новый договор на политико-сатирическое обозрение «Держись!». Выставку готовили к переносу в Ленинград. Наличие договоров не доказывает внутреннего благополучия, но запрещает формулу, будто к весне 1930 года у поэта уже не осталось ни работы, ни будущих проектов.',
    sourceIds: ['chronicle-1930'],
  },
  {
    type: 'paragraph',
    text: 'Отдельный кризис возник вокруг зарубежных прав на «Клопа». Летом 1929 года Маяковский подготовил для Д. И. Марьянова доверенность на защиту германских сценических прав и соглашение о переводах и постановках в Европе и Америке. К марту 1930-го Лиля сообщала о нескольких конкурирующих переводах, а Маяковский уже просил не передавать Марьянову ни пьес, ни новых доверенностей, ссылаясь на решение МОДПиК сменить представителя. Это документальная правовая путаница, но ещё не доказанное хищение прав или установленная сумма потерь.',
    sourceIds: ['letter-lilya-march-1930', 'chronicle-1930'],
  },
  {
    type: 'paragraph',
    text: 'Организационный разрыв тоже был сложнее простой схемы предательства. Маяковский вступил в РАПП, тогда как Лиля и Осип остались в РЕФе; одновременно поздние письма продолжали обсуждать постановки, зарубежные права, квартиру, книги, животных и возвращение Бриков. Разногласие было реальным, но полного личного и рабочего обрыва переписка не показывает.',
    sourceIds: ['letter-lilya-march-1930'],
  },
  {
    type: 'note',
    text: 'Источниковый предел: новый договор, критическая рецензия, вступление в РАПП, путаница с переводами и любовный конфликт являются отдельными факторами. Ни один из них сам по себе не превращается в достаточное объяснение выстрела 14 апреля.',
    sourceIds: ['chronicle-1930', 'letter-lilya-march-1930'],
  },
];

const documentedMovement = illustratedMovement.flatMap((block) => {
  if (block.type === 'section' && block.heading === '1930: несколько кризисов сразу') {
    return [block, ...lateDocumentBlocks];
  }

  return [block];
});

export const mayakovskyPartTwo: Essay = {
  ...baseMayakovsky,
  id: 'essay-mayakovsky-gromovoy',
  slug: 'mayakovsky-gromovoy',
  kicker: 'Большая биография · часть II',
  title: 'Маяковский. Часть II: революция, ЛЕФ и последний кризис',
  subtitle: 'РОСТА, общий дом Бриков, зарубежные поездки, поздняя сатира и несколько кризисов, сошедшихся весной 1930 года.',
  excerpt: 'Вторая часть документальной биографии: сознательное служение революции, ЛЕФ, путешествия, поздняя лирика, «Баня», выставка «20 лет работы» и трагический финал.',
  readTime: 31,
  series: { id: 'mayakovsky-biography', label: 'Владимир Маяковский', part: 2, total: 2 },
  blocks: [...bridge, ...documentedMovement],
};
