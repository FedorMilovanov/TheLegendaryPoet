import type { Essay } from '../../types/essay';
import { yeseninKutezhi as baseYesenin } from './yeseninKutezhi';
import { insertArchiveImages } from './visualArchive';

/**
 * Documentary layer for the Yesenin longread. One archival image opens each
 * movement; portraits may enter the prose column while group scenes remain wide.
 */
export const yeseninKutezhiVisual: Essay = {
  ...baseYesenin,
  readTime: 26,
  blocks: insertArchiveImages(baseYesenin.blocks, {
    'Два Есенина': [
      {
        type: 'image',
        src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Esenin1914%20(2).jpg',
        alt: 'Сергей Есенин в 1914 году',
        caption: 'Сергей Есенин. 1914.',
        credit: 'Wikimedia Commons, общественное достояние',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Esenin1914_(2).jpg',
        kind: 'archive',
        layout: 'portrait',
        placement: 'right',
        objectPosition: '50% 22%',
      },
    ],
    'Дурная слава': [
      {
        type: 'image',
        src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Сергей%20Есенин%20в%201919%20году.jpg',
        alt: 'Сергей Есенин в 1919 году',
        caption: 'Есенин в год основания имажинистской группы. 1919.',
        credit: 'Wikimedia Commons, общественное достояние',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Сергей_Есенин_в_1919_году.jpg',
        kind: 'archive',
        layout: 'portrait',
        placement: 'left',
        objectPosition: '50% 18%',
      },
    ],
    'Москва кабацкая': [
      {
        type: 'image',
        src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/DuncanYesenin1922.jpg',
        alt: 'Айседора Дункан и Сергей Есенин в Берлине, 1922 год',
        caption: 'Айседора Дункан и Сергей Есенин. Берлин, 1922.',
        credit: 'Wikimedia Commons, общественное достояние',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:DuncanYesenin1922.jpg',
        kind: 'archive',
        layout: 'wide',
        objectPosition: '50% 35%',
      },
    ],
    'Железный гость': [
      {
        type: 'image',
        src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Eseninnikolaiklyeuv.jpg',
        alt: 'Сергей Есенин и Николай Клюев, 1916 год',
        caption: 'Сергей Есенин и Николай Клюев. 1916.',
        credit: 'Президентская библиотека; Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Eseninnikolaiklyeuv.jpg',
        kind: 'archive',
        layout: 'wide',
        objectPosition: '50% 42%',
      },
    ],
    'Персидская передышка': [
      {
        type: 'image',
        src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chagin%20and%20Esenin%201924.jpg',
        alt: 'Пётр Чагин и Сергей Есенин в Баку, 1924 год',
        caption: 'Пётр Чагин и Сергей Есенин. Баку, сентябрь 1924.',
        credit: 'Лаврентий Брегадзе; Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Chagin_and_Esenin_1924.jpg',
        kind: 'archive',
        layout: 'portrait',
        placement: 'left',
        objectPosition: '50% 25%',
      },
    ],
    'Чёрный человек': [
      {
        type: 'image',
        src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Esenin1925.jpg',
        alt: 'Поздний портрет Сергея Есенина, 1925 год',
        caption: 'Сергей Есенин. 1925.',
        credit: 'Wikimedia Commons, общественное достояние',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Esenin1925.jpg',
        kind: 'archive',
        layout: 'portrait',
        placement: 'right',
        objectPosition: '50% 17%',
      },
    ],
    'Под маской — нежность': [
      {
        type: 'image',
        src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Сергей%20Есенин%20с%20сёстрами%20Катей%20и%20Шурой.jpg',
        alt: 'Сергей Есенин с сёстрами Екатериной и Александрой',
        caption: 'Сергей Есенин с сёстрами Катей и Шурой. Москва.',
        credit: 'С. Чижов; Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Сергей_Есенин_с_сёстрами_Катей_и_Шурой.jpg',
        kind: 'archive',
        layout: 'portrait',
        placement: 'left',
        objectPosition: '50% 25%',
      },
    ],
    'Что это было': [
      {
        type: 'image',
        src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/С.А.%20Есенин%20и%20В.И.%20Болдовкин.%201925.jpg',
        alt: 'Сергей Есенин и Василий Болдовкин в Баку, 24 мая 1925 года',
        caption: 'Сергей Есенин и Василий Болдовкин. Баку, 24 мая 1925.',
        credit: 'Wikimedia Commons, общественное достояние',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:С.А._Есенин_и_В.И._Болдовкин._1925.jpg',
        kind: 'archive',
        layout: 'portrait',
        placement: 'right',
        objectPosition: '50% 24%',
      },
    ],
  }),
};
