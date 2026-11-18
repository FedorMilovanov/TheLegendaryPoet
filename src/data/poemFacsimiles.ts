/**
 * Public poem facsimiles have an independent media-rights gate.
 * A verified literary text does NOT imply redistribution rights for its scan.
 * 'review' records render only in the intentionally built local
 * facsimile-preview mode; normal production builds render nothing for them.
 */
export interface PoemFacsimilePage {
  src: string;
  printPage: string;
  alt: string;
  width: number;
  height: number;
  originalUrl: string;
}

export interface PoemFacsimile {
  poemId: string;
  publication: string;
  publicationYear: number;
  credit: string;
  rights: 'review' | 'approved';
  /** A rights evidence record is mandatory before allowing production media. */
  rightsEvidence?: string;
  pages: readonly PoemFacsimilePage[];
}

export const poemFacsimiles: Readonly<Record<string, PoemFacsimile>> = {
  'pushkin-4': {
    poemId: 'pushkin-4',
    publication: '«Царское Село». Альманах на 1830 год',
    publicationYear: 1829,
    credit: 'Экземпляр Google Books · альманах «Царское Село», 1829',
    rights: 'review',
    pages: [
      {
        src: '/images/facsimile-review/pushkin-winter-1.png',
        printPage: '1',
        alt: 'Первопечатная страница 1 «Зимнего утра», заглавие и первые четырнадцать строк, альманах «Царское Село»',
        width: 575, height: 718,
        originalUrl: 'https://books.google.ru/books?id=t_XmCicRuMYC&pg=PA9',
      },
      {
        src: '/images/facsimile-review/pushkin-winter-2.png',
        printPage: '2',
        alt: 'Первопечатная страница 2 «Зимнего утра», окончание стихотворения и подпись А. Пушкина',
        width: 575, height: 696,
        originalUrl: 'https://books.google.ru/books?id=t_XmCicRuMYC&pg=PA10',
      },
    ],
  },
  'pushkin-9': {
    poemId: 'pushkin-9',
    publication: '«Московский телеграф». Часть V, № 17',
    publicationYear: 1825,
    credit: 'Национальная библиотека Чехии · оцифровка Google Books',
    rights: 'review',
    pages: [{
      src: '/images/facsimile-review/pushkin-life-1825.png',
      printPage: '37',
      alt: 'Страница 37 «Московского телеграфа», первая публикация «Стихи въ Альбомъ» с восемью строками и подписью А. Пушкина',
      width: 575, height: 1001,
      originalUrl: 'https://books.google.ru/books?id=8aFoAAAAcAAJ&pg=PA37',
    }],
  },
};

export function visiblePoemFacsimile(poemId: string, mode: string): PoemFacsimile | null {
  const record = poemFacsimiles[poemId];
  if (!record) return null;
  if (record.rights === 'approved' && record.rightsEvidence) return record;
  return mode === 'facsimile-preview' && record.rights === 'review' ? record : null;
}
