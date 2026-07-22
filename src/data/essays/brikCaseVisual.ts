import type { Essay } from '../../types/essay';
import { brikCase as baseBrikCase } from './brikCase';
import { expandBrikCase } from './brikCaseResearchExpansion';
import { insertArchiveImages } from './visualArchive';

const correctedBrikCase: Essay = {
  ...baseBrikCase,
  blocks: baseBrikCase.blocks.map((block) => {
    if (
      block.type === 'paragraph' &&
      block.text.includes('Полный сохранившийся текст был впервые реконструирован')
    ) {
      return {
        ...block,
        text: 'История публикации письма-дневника требует отдельной оговорки — и она направлена не к смягчению, а к источниковой твёрдости. В корпусе Янгфельдта это документ № 113. Комментарий сообщает, что подлинник сохранился не полностью, печатный текст следует версии, подготовленной Лилей Брик для публикации в 1956 году, а само письмо не было отправлено. Поэтому перед нами не полный нейтральный автограф и не письмо, полученное Лилей во время разлуки. Точный объём редакционных купюр должен устанавливаться сравнением с сохранившейся рукописью и отдельными публикациями, а не предполагаться заранее.',
      };
    }

    return block;
  }),
};

const expandedBrikCase = expandBrikCase(correctedBrikCase);

export const brikCaseVisual: Essay = {
  ...expandedBrikCase,
  cover: '/images/essays/archive/lilya-gendrikov-1929.webp',
  cardCover: '/images/essays/archive/lilya-gendrikov-1929.webp',
  coverAlt: 'Лиля Брик за столом в квартире в Гендриковом переулке, фотограф Осип Брик, 1929 год',
  coverKind: 'archive',
  coverCredit: 'Осип Брик · 1929',
  coverSourceUrl: 'https://commons.wikimedia.org/wiki/File:Lilya_Brik_1929.jpg',
  readTime: 46,
  blocks: insertArchiveImages(expandedBrikCase.blocks, {
    'Жуковского, июль 1915-го': [
      {
        type: 'image',
        src: '/images/essays/archive/mayakovsky-lilya-1915.webp',
        mediaKey: 'mayakovsky-lilya-1915',
        alt: 'Владимир Маяковский и Лиля Брик, 1915 год',
        caption: 'Маяковский и Лиля Брик. 1915.',
        credit: 'Wikimedia Commons, общественное достояние',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Vladimir_mayakovsky_and_lilya_brik.jpg',
        kind: 'archive',
        layout: 'wide',
        objectPosition: '50% 42%',
      },
    ],
    'Не треугольник, а меняющийся союз': [
      {
        type: 'image',
        src: '/images/essays/archive/briks-honeymoon-1912.webp',
        mediaKey: 'briks-honeymoon-1912',
        alt: 'Осип и Лиля Брик во время свадебного путешествия, 1912 год',
        caption: 'Лиля и Осип Брики. Свадебное путешествие, 1912.',
        credit: 'Wikimedia Commons, общественное достояние',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Osip_LUB.jpg',
        kind: 'archive',
        layout: 'portrait',
        objectPosition: '50% 30%',
      },
      {
        type: 'image',
        src: '/images/essays/archive/lilya-brik-1914.webp',
        mediaKey: 'lilya-brik-1914',
        alt: 'Портрет Лили Брик, 1914 год',
        caption: 'Лиля Брик. 1914.',
        credit: 'Wikimedia Commons, общественное достояние',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lilya_Brik_in_1914.jpg',
        kind: 'archive',
        layout: 'portrait',
        objectPosition: '50% 18%',
      },
    ],
    'Кольцо и язык привязанности': [
      {
        type: 'image',
        src: '/images/essays/archive/lilya-friends-1915.webp',
        mediaKey: 'lilya-friends-1915',
        alt: 'Лиля Брик с подругами в домашнем интерьере, 1915 год',
        caption: 'Лиля Брик и её круг. 1915.',
        credit: 'Wikimedia Commons, общественное достояние',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lilya_Brik_with_friends%2C_1915.jpg',
        kind: 'archive',
        layout: 'wide',
        objectPosition: '50% 42%',
      },
    ],
    'Осип: издатель, теоретик и сотрудник органов': [
      {
        type: 'image',
        src: '/images/essays/archive/osip-brik-1928.webp',
        mediaKey: 'osip-brik-1928',
        alt: 'Портрет Осипа Брика, 1928 год',
        caption: 'Осип Брик. 1928.',
        credit: 'Wikimedia Commons, общественное достояние',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Osip_Brik.jpg',
        kind: 'archive',
        layout: 'portrait',
        objectPosition: '50% 20%',
      },
    ],
    'Деньги, работа и общий быт': [
      {
        type: 'image',
        src: '/images/essays/archive/mayakovsky-circle-1924.webp',
        mediaKey: 'mayakovsky-circle-1924',
        alt: 'Маяковский, Лиля Брик, Пастернак, Эйзенштейн и представители художественного круга, 1924 год',
        caption: 'Художественный круг Бриков и Маяковского. 1924.',
        credit: 'Wikimedia Commons, общественное достояние',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Mayakovsky_Pasternak.jpg',
        kind: 'archive',
        layout: 'wide',
        objectPosition: '50% 38%',
      },
      {
        type: 'image',
        src: '/images/essays/archive/mayakovsky-circle-1925.webp',
        mediaKey: 'mayakovsky-circle-1925',
        alt: 'Маяковский, Лиля и Осип Брики, Пастернак, Шкловский и друзья, 1925 год',
        caption: 'Круг ЛЕФа и Бриков. 1925.',
        credit: 'Wikimedia Commons, общественное достояние',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Maiakowski_1925.jpg',
        kind: 'archive',
        layout: 'wide',
        objectPosition: '50% 45%',
      },
      {
        type: 'image',
        src: '/images/essays/archive/lilya-editing-1928.webp',
        mediaKey: 'lilya-editing-1928',
        alt: 'Лиля Брик монтирует фильм, 1928 год',
        caption: 'Лиля Брик за монтажом фильма. 1928.',
        credit: 'Wikimedia Commons, общественное достояние',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:1928_LYuB_editing_film.jpg',
        kind: 'archive',
        layout: 'portrait',
        objectPosition: '50% 35%',
      },
      {
        type: 'image',
        src: '/images/essays/archive/lilya-gendrikov-1929.webp',
        mediaKey: 'lilya-gendrikov-1929',
        alt: 'Лиля Брик в квартире в Гендриковом переулке, фотограф Осип Брик, 1929 год',
        caption: 'Лиля Брик в квартире в Гендриковом переулке. 1929.',
        credit: 'Осип Брик; Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lilya_Brik_1929.jpg',
        kind: 'archive',
        layout: 'wide',
        objectPosition: '50% 50%',
      },
    ],
    'Поздняя история о закрытой двери': [
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
    ],
  }),
};
