export interface Poet {
  id: string;
  name: string;
  fullName: string;
  birthYear: number;
  deathYear?: number;
  nationality: string;
  photo: string;
  /** Optional wide/atmospheric cover used by the poet hero and cards. */
  coverImage?: string;
  shortBio: string;
  fullBio: string;
  rating: number;
  /** Monogram for museum/hall plaques. Falls back to name initials (getPoetInitials). */
  initials?: string;
  /** Epoch key (golden/philosophy/acmeism/futurism/postSymbolism). Derived from tags if absent (getPoetEpoch). */
  epoch?: string;
  epochLabel?: string;
  tags: string[];
  poems: Poem[];
  articles: Article[];
  /** Poet-specific music, when available. */
  music?: MusicTrack[];
  historicalNote?: string;
  spiritualSearch?: string; // Заменяем высосанные из пальца анализы на объективные духовные искания (если они были)
  /**
   * Честный, реалистичный моральный портрет: задокументированные грехи и
   * разрушительные черты жизни поэта (прелюбодеяние, пьянство, дуэльный азарт,
   * богоборчество и т.д.), о которых обычно молчит школьная программа. Даётся
   * с библейской оценкой, но БЕЗ воспроизведения непечатной брани — грех
   * называется по имени, без прославления и без умиления. См.
   * POET_AUTHORING_GUIDE.md, раздел «Моральный реализм и цензура».
   * Необязательно: для поэтов без выраженной нравственной проблематики поле
   * можно опустить.
   */
  moralPortrait?: string;
  authorCommentary?: string; // Короткая итоговая ремарка автора проекта (для вопиющих случаев богоборчества и т.д.)
  /** Sourced quotes from people who knew the poet + named literary historians. */
  testimonies?: Testimony[];
  famousWorks: string[];
  links?: {
    youtube?: string;
    vk?: string;
    rutube?: string;
    website?: string;
  };
}

export interface Testimony {
  /** Full name of the person being quoted. */
  author: string;
  /** Their relation to the poet, e.g. "жена", "друг, поэт", "литературовед". */
  role: string;
  /** 'contemporary' knew the poet personally; 'historian' is a later scholarly assessment. */
  kind: 'contemporary' | 'historian';
  /** Quote in Russian. If not verbatim, the text notes it as a paraphrase. */
  quote: string;
  /** Citable source: book/memoir/article title + year. */
  source: string;
  sourceUrl?: string;
}

export interface Poem {
  id: string;
  title: string;
  originalTitle?: string;
  text: string;
  year?: number;
  analysis?: string;
  biblicalPerspective?: string;
  /** Optional emotional palette, used for subtle per-poem accenting. */
  mood?: Array<'тоска' | 'тревога' | 'восторг' | 'покой' | 'гнев' | 'нежность' | 'пустота' | 'надежда'>;
  rating: number;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: 'analysis' | 'history' | 'moral' | 'biblical' | 'biography';
  readTime: number;
  image?: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  poet: string;
  duration: string;
  /** Direct, playable audio file (e.g. /audio/track.mp3). When present the row shows a real player. */
  audioUrl?: string;
  /** Link to the full track/video on a channel (YouTube/Rutube). Used when there is no local audio file. */
  externalUrl?: string;
  /** Optional dedicated video URL (used by richer players). */
  videoUrl?: string;
  description?: string;
}
