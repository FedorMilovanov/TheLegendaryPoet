import type { EssayBlock, EssaySource } from '../../types/essay';

type SectionInsertion = {
  heading: string;
  additions: EssayBlock[];
};

function insertAfterFirstContentInSection(
  blocks: EssayBlock[],
  { heading, additions }: SectionInsertion,
): EssayBlock[] {
  let insideTarget = false;
  let inserted = false;

  return blocks.flatMap<EssayBlock>((block) => {
    if (block.type === 'section') {
      insideTarget = block.heading === heading;
      return [block];
    }

    if (insideTarget && !inserted && block.type !== 'divider') {
      inserted = true;
      insideTarget = false;
      return [block, ...additions];
    }

    return [block];
  });
}

function applyInsertions(blocks: EssayBlock[], insertions: SectionInsertion[]): EssayBlock[] {
  return insertions.reduce(
    (currentBlocks, insertion) => insertAfterFirstContentInSection(currentBlocks, insertion),
    blocks,
  );
}

const reconstructionNotice: EssayBlock = {
  type: 'note',
  text: 'В статье используются подлинные архивные изображения и отдельно помеченные редакционные реконструкции. Реконструкции созданы по историческим портретным, интерьерным и биографическим референсам; они не являются фотографиями конкретных исторических сцен и не используются как доказательство события.',
};

export function applyMayakovskyPartTwoEditorialWave(blocks: EssayBlock[]): EssayBlock[] {
  return applyInsertions(blocks, [
    {
      heading: 'РОСТА: рисунок, ритм и ежедневная работа',
      additions: [
        reconstructionNotice,
        {
          type: 'image',
          src: '/images/essays/mayakovsky/editorial-wave/mayakovsky-rosta-workshop-reconstruction.webp',
          loading: 'eager',
          alt: 'Редакционная реконструкция: Владимир Маяковский работает над агитационным плакатом в мастерской',
          caption: 'Маяковский в мастерской плакатной работы. Редакционная реконструкция по историческим портретным и производственным референсам; не фотография конкретного дня.',
          credit: 'THE LEGENDARY POET · редакционная реконструкция',
          kind: 'reconstruction',
          layout: 'cinematic',
        },
      ],
    },
    {
      heading: 'ЛЕФ и редакционный дом',
      additions: [
        {
          type: 'image',
          src: '/images/essays/mayakovsky/editorial-wave/mayakovsky-dlya-golosa-1923.webp',
          loading: 'eager',
          alt: 'Разворот книги Владимира Маяковского «Для голоса» в оформлении Эль Лисицкого, 1923 год',
          caption: 'Владимир Маяковский, «Для голоса». Страницы 2–3 издания с конструктивистским оформлением Эль Лисицкого, 1923.',
          credit: 'Эль Лисицкий · Wikimedia Commons / RISD Museum',
          sourceUrl: 'https://commons.wikimedia.org/wiki/File:Dlja_golosa._1923-100.jpg',
          kind: 'document',
          layout: 'wide',
          tilt: false,
        },
        {
          type: 'image',
          src: '/images/essays/mayakovsky/editorial-wave/mayakovsky-public-reading-reconstruction.webp',
          loading: 'eager',
          alt: 'Редакционная реконструкция публичного чтения Владимира Маяковского',
          caption: 'Образ Маяковского-публичного читателя. Редакционная реконструкция по историческим портретным и сценическим референсам; не снимок определённого выступления.',
          credit: 'THE LEGENDARY POET · редакционная реконструкция',
          kind: 'reconstruction',
          layout: 'portrait',
          placement: 'right',
          objectPosition: '50% 28%',
        },
      ],
    },
    {
      heading: '1930: несколько кризисов сразу',
      additions: [
        {
          type: 'image',
          src: '/images/essays/mayakovsky/editorial-wave/mayakovsky-late-desk-reconstruction.webp',
          loading: 'eager',
          alt: 'Редакционная реконструкция позднего Владимира Маяковского за рабочим столом у лампы',
          caption: 'Поздний Маяковский за рабочим столом. Редакционная реконструкция по историческим референсам; не фотография конкретной ночи и не психологический диагноз.',
          credit: 'THE LEGENDARY POET · редакционная реконструкция',
          kind: 'reconstruction',
          layout: 'cinematic',
        },
      ],
    },
  ]);
}

export function applyBrikEditorialWave(blocks: EssayBlock[]): EssayBlock[] {
  return applyInsertions(blocks, [
    {
      heading: 'Жуковского, июль 1915-го',
      additions: [
        reconstructionNotice,
        {
          type: 'image',
          src: '/images/essays/mayakovsky/editorial-wave/brik-reading-circle-reconstruction.webp',
          loading: 'eager',
          alt: 'Редакционная реконструкция: Владимир Маяковский читает рукопись Лиле и Осипу Брикам',
          caption: 'Маяковский читает рукопись в кругу Бриков. Редакционная реконструкция по историческим портретным и интерьерным референсам; не фотография конкретного вечера.',
          credit: 'THE LEGENDARY POET · редакционная реконструкция',
          kind: 'reconstruction',
          layout: 'cinematic',
        },
      ],
    },
    {
      heading: 'Не треугольник, а меняющийся союз',
      additions: [
        {
          type: 'image',
          src: '/images/essays/mayakovsky/editorial-wave/brik-triad-interior-reconstruction.webp',
          loading: 'eager',
          alt: 'Редакционная реконструкция Владимира Маяковского, Лили и Осипа Бриков в кабинете',
          caption: 'Камерный образ меняющегося союза Маяковского и Бриков. Редакционная реконструкция по историческим референсам; не архивная фотография и не свидетельство конкретной сцены.',
          credit: 'THE LEGENDARY POET · редакционная реконструкция',
          kind: 'reconstruction',
          layout: 'cinematic',
        },
      ],
    },
    {
      heading: 'Осип: издатель, теоретик и сотрудник органов',
      additions: [
        {
          type: 'image',
          src: '/images/essays/mayakovsky/editorial-wave/mayakovsky-kruchenykh-stikhi-cover.webp',
          loading: 'eager',
          alt: 'Обложка книги Алексея Кручёных «Стихи В. Маяковского» с графическим образом поэта',
          caption: 'Алексей Кручёных, «Стихи В. Маяковского». Футуристическая обложка и печатный образ поэта, 1915.',
          credit: 'Алексей Кручёных · Wikimedia Commons',
          sourceUrl: 'https://commons.wikimedia.org/wiki/File:Mayakovsky_books_kruchyonyx_stixi.png',
          kind: 'document',
          layout: 'portrait',
          placement: 'left',
          tilt: false,
        },
      ],
    },
  ]);
}

export const mayakovskyEditorialWaveSources: EssaySource[] = [
  {
    id: 'mayakovsky-dlya-golosa-1923-commons',
    title: 'Владимир Маяковский. «Для голоса», страницы 2–3. Оформление Эль Лисицкого, 1923',
    url: 'https://commons.wikimedia.org/wiki/File:Dlja_golosa._1923-100.jpg',
    kind: 'archive',
    institution: 'Wikimedia Commons; RISD Museum',
    year: 1923,
    note: 'Предметный свидетель конструктивистского книжного оформления и визуального языка эпохи ЛЕФ.',
  },
  {
    id: 'mayakovsky-stikhi-kruchenykh-cover-1915',
    title: 'Алексей Кручёных. Обложка книги «Стихи В. Маяковского», 1915',
    url: 'https://commons.wikimedia.org/wiki/File:Mayakovsky_books_kruchyonyx_stixi.png',
    kind: 'archive',
    institution: 'Wikimedia Commons',
    year: 1915,
    note: 'Реальный футуристический печатный объект; используется как контекст издательской и графической среды, а не как фотографический портрет.',
  },
];
