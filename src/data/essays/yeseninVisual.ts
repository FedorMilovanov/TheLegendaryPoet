import type { Essay, EssayBlock } from '../../types/essay';
import { yeseninKutezhi as baseYesenin } from './yeseninKutezhi';
import { insertArchiveImages } from './visualArchive';

/**
 * Keep public prose inside the evidentiary limits recorded in issue #49.
 * These replacements intentionally live in the documentary wrapper so the
 * literary base remains readable while archive/page-verification boundaries
 * stay explicit and testable.
 */
const correctedYeseninBlocks: EssayBlock[] = baseYesenin.blocks.map((block) => {
  if (
    block.type === 'paragraph' &&
    block.text.startsWith('С 26 ноября по 21 декабря 1925 года')
  ) {
    return {
      ...block,
      text: 'С 26 ноября по 21 декабря 1925 года Есенин находился в клинике 1-го Московского университета. Академические комментарии подтверждают этот период и отдельное удостоверение № 1037 от 28 ноября. Полная история болезни хранится в ИМЛИ (ф. 32, оп. 2, ед. хр. 37), но её страницы в текущем корпусе ещё не проверены. Публикации сообщают, что поэт продолжал работать и покидал клинику по издательским делам; однако без самой истории болезни нельзя уверенно определить, какие выходы были разрешены и было ли 21 декабря оформленной выпиской или самовольным уходом. Надёжно установлено лишь, что к этой дате пребывание в клинике закончилось — за неделю до смерти.',
      sourceIds: ['yesenin-clinic-comments'],
    };
  }

  if (
    block.type === 'paragraph' &&
    block.text.startsWith('Там, в ночь с 27 на 28 декабря 1925 года')
  ) {
    return {
      ...block,
      text: 'В ночь с 27 на 28 декабря 1925 года Есенин погиб в пятом номере ленинградской гостиницы. Утром Елизавета Устинова и Вольф Эрлих, не достучавшись, вошли вместе с комендантом и нашли поэта в петле. По воспоминанию Эрлиха, накануне в номере не оказалось чернил; Есенин надрезал руку, написал восемь строк, свернул листок и велел прочесть позже. В опубликованных материалах комиссии 1989–1993 годов почерковедческое исследование относит текст к Есенину, а спектральное — определяет пишущий материал как кровь. Однако доступный обзор не устанавливает, что кровь принадлежала именно Есенину; полные заключения и приложения ещё требуют постраничной проверки. Поэтому здесь эти выводы приводятся как результаты опубликованной комиссии, а не как заново проверенный лабораторный факт.',
      sourceIds: ['yesenin-criminalistic-review'],
    };
  }

  if (block.type === 'poem' && block.title === 'До свиданья, друг мой, до свиданья') {
    return {
      ...block,
      note: 'Традиционно публикуется как последнее стихотворение Есенина. По материалам комиссии почерк отнесён к Есенину, а пишущий материал — к крови; принадлежность крови именно поэту в доступном обзоре не установлена. Официальные выводы комиссии и прокуратуры считают наиболее обоснованной версию самоубийства, но полные экспертные приложения остаются предметом постраничной проверки.',
    };
  }

  if (
    block.type === 'paragraph' &&
    block.text.startsWith('Чтобы понять этот распад до конца')
  ) {
    return {
      ...block,
      text: block.text.replace(
        'Спас-Клепиковской церковно-учительской школе',
        'Спас-Клепиковской второклассной учительской школе, находившейся в духовном ведомстве',
      ),
      sourceIds: ['yesenin-spas-klepiki-school'],
    };
  }

  return block;
});

/**
 * Documentary layer for the Yesenin longread. One archival image opens each
 * movement; portraits may enter the prose column while group scenes remain wide.
 */
export const yeseninKutezhiVisual: Essay = {
  ...baseYesenin,
  readTime: 27,
  sources: [
    ...(baseYesenin.sources ?? []),
    {
      id: 'yesenin-spas-klepiki-school',
      title: 'Спас-Клепиковская второклассная учительская школа',
      url: 'https://www.museum-esenin.ru/ehkspozicii/spas-klepikovskaya-vtoroklassnaya-uchitelskaya-shkola',
      kind: 'institutional',
      institution: 'Государственный музей-заповедник С. А. Есенина',
      note: 'Официальная музейная справка подтверждает название школы, годы учёбы и принадлежность учебного заведения духовному ведомству.',
    },
  ],
  blocks: insertArchiveImages(correctedYeseninBlocks, {
    'Два Есенина': [
      {
        type: 'image',
        src: '/images/essays/archive/yesenin-1914.webp',
        mediaKey: 'yesenin-1914',
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
        src: '/images/essays/archive/yesenin-1919.webp',
        mediaKey: 'yesenin-1919',
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
        src: '/images/essays/archive/yesenin-duncan-1922.webp',
        mediaKey: 'yesenin-duncan-1922',
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
        src: '/images/essays/archive/yesenin-klyuev-1916.webp',
        mediaKey: 'yesenin-klyuev-1916',
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
        src: '/images/essays/archive/yesenin-chagin-1924.webp',
        mediaKey: 'yesenin-chagin-1924',
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
        src: '/images/essays/archive/yesenin-1925.webp',
        mediaKey: 'yesenin-1925',
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
        src: '/images/essays/archive/yesenin-sisters.webp',
        mediaKey: 'yesenin-sisters',
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
        src: '/images/essays/archive/yesenin-boldovkin-1925.webp',
        mediaKey: 'yesenin-boldovkin-1925',
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
