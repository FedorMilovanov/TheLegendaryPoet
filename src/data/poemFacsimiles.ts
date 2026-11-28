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
  /** Exact SHA-256 of source image bytes; never hash a derived thumbnail. */
  sha256: string;
  originalUrl: string;
}

export interface PoemFacsimile {
  poemId: string;
  publication: string;
  publicationYear: number;
  /** Annual/almanac title year, distinct from actual bibliographic publication date. */
  imprintYear?: number;
  credit: string;
  rights: 'review' | 'approved';
  /** A rights evidence record is mandatory before allowing production media. */
  rightsEvidence?: string;
  pages: readonly PoemFacsimilePage[];
}

export const poemFacsimiles: Readonly<Record<string, PoemFacsimile>> = {
  'pushkin-2': {
    poemId: 'pushkin-2',
    publication: '«Северные цветы» на 1830 год',
    publicationYear: 1829,
    imprintYear: 1830,
    credit: '«Северные цветы» на 1830 год · СПб., 1829 · Викисклад (Public Domain Mark) · скан Google Books, знак сохранён',
    rights: 'approved',
    rightsEvidence: 'https://commons.wikimedia.org/wiki/File:Я_вас_любил,_публикация_1830.png',
    pages: [{
      src: '/images/facsimiles/pushkin-ya-vas-lyubil-1830.png',
      printPage: '104',
      alt: 'Первопечатная страница 104 альманаха «Северные цветы на 1830 год» (СПб., 1829): «Я вас любил…», восемь строк и подпись А. Пушкинъ',
      width: 575, height: 835,
      sha256: 'd8ce1c004be00dea5f40ebf4c00904f9382a8c37fc9a6857d4e1a9a3a84a350a',
      originalUrl: 'https://commons.wikimedia.org/wiki/File:Я_вас_любил,_публикация_1830.png',
    }],
  },
  // Node validators see the complete source registry; Vite removes review metadata
  // from ordinary browser builds, exactly as the existing media release gate does.
  ...(typeof __TLP_INCLUDE_REVIEW_FACSIMILES__ === 'undefined' || __TLP_INCLUDE_REVIEW_FACSIMILES__ ? {
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
        sha256: '62e40751270125f60a3b3b2b1373f9a5a47cbb3152e8be837ac7e000ea6557d0',
        originalUrl: 'https://books.google.ru/books?id=t_XmCicRuMYC&pg=PA9',
      },
      {
        src: '/images/facsimile-review/pushkin-winter-2.png',
        printPage: '2',
        alt: 'Первопечатная страница 2 «Зимнего утра», окончание стихотворения и подпись А. Пушкина',
        width: 575, height: 696,
        sha256: 'c52eecbc56fa4b216d5db991bad8e13f65cad3e3205a20452d0e567ae8fd2fe8',
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
        sha256: 'ab5e9caa2ab520bd48b5c77cd7d8368cb14028ba0cda9243f90bdbef09ec5b28',
      originalUrl: 'https://books.google.ru/books?id=8aFoAAAAcAAJ&pg=PA37',
    }],
  },
  } satisfies Record<string, PoemFacsimile> : {}),
};

export function visiblePoemFacsimile(poemId: string, mode: string): PoemFacsimile | null {
  const record = poemFacsimiles[poemId];
  if (!record) return null;
  if (record.rights === 'approved' && record.rightsEvidence) return record;
  return mode === 'facsimile-preview' && record.rights === 'review' ? record : null;
}
