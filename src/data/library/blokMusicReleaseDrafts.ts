import type { MusicTrack } from '../../types/poet';

/**
 * Source-only intake for six owner-selected Alexander Blok music releases.
 * This module is deliberately NOT imported by musicTracks.ts until the final
 * source masters, square + wide art, rights, waveforms and live delivery pass.
 * Publishing announcements alone currently increases the measured JS budget.
 * Copy entries into the production registry only as part of a complete release.
 */
const standardRights = '© 2026 The Legendary Poet. Права на музыкальную версию и мастер защищены. Текст стихотворения находится в общественном достоянии. Повторная загрузка и коммерческое распространение мастер-файла без разрешения запрещены.';

export const blokMusicReleaseDrafts = [
  {
    id: 'blok-night-pharmacy-night-loop',
    title: 'Ночь, улица, фонарь, аптека… — Night Loop',
    poet: 'Александр Блок',
    poetId: 'alexander-blok',
    availability: 'coming-soon',
    releaseOrder: 40,
    releaseYear: 2026,
    description: 'Атмосферная музыкальная редакция стихотворения Блока о замкнутом ночном круге. Кинематографический дабстеп, мрачный эмбиент и даб; отдельный аудиомастер проходит редакционную приёмку.',
    credits: [
      'Слова — Александр Блок, «Ночь, улица, фонарь, аптека…» (1912)',
      'Музыкальная интерпретация и мастер — The Legendary Poet',
      'Создано с использованием генеративных музыкальных технологий',
    ],
    rightsNotice: standardRights,
    theme: {
      accent: '#e8b66e',
      secondary: '#44717e',
      surface: '#09141b',
    },
  },
  {
    id: 'blok-kulikovo-part-1',
    title: 'На поле Куликовом — часть I. Река раскинулась…',
    poet: 'Александр Блок',
    poetId: 'alexander-blok',
    availability: 'coming-soon',
    releaseOrder: 50,
    releaseYear: 2026,
    description: 'Музыкальная интерпретация первой части пятичастного цикла «На поле Куликовом»: степь, река, движение и тревожный образ исторического пути. Не путать с отдельной второй частью цикла.',
    credits: [
      'Слова — Александр Блок, «На поле Куликовом», часть I (1908)',
      'Музыкальная интерпретация и мастер — The Legendary Poet',
      'Создано с использованием генеративных музыкальных технологий',
    ],
    rightsNotice: standardRights,
    theme: {
      accent: '#e4a46f',
      secondary: '#9d5860',
      surface: '#190f13',
    },
  },
  {
    id: 'blok-kulikovo-part-2',
    title: 'На поле Куликовом — часть II. За Непрядвой…',
    poet: 'Александр Блок',
    poetId: 'alexander-blok',
    availability: 'coming-soon',
    releaseOrder: 60,
    releaseYear: 2026,
    description: 'Самостоятельная музыкальная интерпретация второй части пятичастного цикла «На поле Куликовом»: полночь, Непрядва, крики лебедей и напряжённое ожидание. Это не другая версия части I.',
    credits: [
      'Слова — Александр Блок, «На поле Куликовом», часть II (1908)',
      'Музыкальная интерпретация и мастер — The Legendary Poet',
      'Создано с использованием генеративных музыкальных технологий',
    ],
    rightsNotice: standardRights,
    theme: {
      accent: '#bdcfe1',
      secondary: '#647f99',
      surface: '#0b111b',
    },
  },
  {
    id: 'blok-scythians-version-1',
    title: 'Скифы — музыкальная версия 1',
    poet: 'Александр Блок',
    poetId: 'alexander-blok',
    availability: 'coming-soon',
    releaseOrder: 70,
    releaseYear: 2026,
    description: 'Первая музыкальная интерпретация полного стихотворения Александра Блока «Скифы». Это самостоятельная редакция одного произведения, а не первая часть разделённой поэмы.',
    credits: [
      'Слова — Александр Блок, «Скифы» (1918), полное стихотворение',
      'Музыкальная интерпретация и мастер — The Legendary Poet',
      'Создано с использованием генеративных музыкальных технологий',
    ],
    rightsNotice: standardRights,
    theme: {
      accent: '#d4a06b',
      secondary: '#8e695a',
      surface: '#19120f',
    },
  },
  {
    id: 'blok-scythians-version-2',
    title: 'Скифы — музыкальная версия 2',
    poet: 'Александр Блок',
    poetId: 'alexander-blok',
    availability: 'coming-soon',
    releaseOrder: 80,
    releaseYear: 2026,
    description: 'Вторая музыкальная интерпретация того же полного стихотворения Блока «Скифы». Запись имеет собственный аудиомастер и оформление; не обозначать её как продолжение версии 1.',
    credits: [
      'Слова — Александр Блок, «Скифы» (1918), полное стихотворение',
      'Музыкальная интерпретация и мастер — The Legendary Poet',
      'Создано с использованием генеративных музыкальных технологий',
    ],
    rightsNotice: standardRights,
    theme: {
      accent: '#d7ab7b',
      secondary: '#58788e',
      surface: '#10141b',
    },
  },
  {
    id: 'blok-oh-i-want-to-live',
    title: 'О, я хочу безумно жить…',
    poet: 'Александр Блок',
    poetId: 'alexander-blok',
    availability: 'coming-soon',
    releaseOrder: 90,
    releaseYear: 2026,
    description: 'Музыкальная интерпретация стихотворения Блока о стремлении жить, творить и сохранить свет даже среди жизненных испытаний. Аудиокандидат ещё требует полной проверки финала и источника.',
    credits: [
      'Слова — Александр Блок, «О, я хочу безумно жить…» (1914)',
      'Музыкальная интерпретация и мастер — The Legendary Poet',
      'Создано с использованием генеративных музыкальных технологий',
    ],
    rightsNotice: standardRights,
    theme: {
      accent: '#dfb98a',
      secondary: '#7897b7',
      surface: '#12161c',
    },
  },
] satisfies readonly MusicTrack[];
