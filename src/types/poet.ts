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
  spiritualSearch?: string;
  moralPortrait?: string;
  authorCommentary?: string;
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
  author: string;
  role: string;
  kind: 'contemporary' | 'historian';
  quote: string;
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

export interface MusicTrackTheme {
  /** Primary interactive colour. Use an accessible six-digit hex value. */
  accent: string;
  /** Secondary atmosphere colour used for gradients and buffered waveform. */
  secondary: string;
  /** Deep page/player surface associated with the release. */
  surface: string;
  /** Optional object-position for wide artwork, for example `55% center`. */
  heroPosition?: string;
}

export interface MusicTrackChapter {
  /** Editorial label displayed on an optional timeline marker. */
  label: string;
  /** Exact start time in seconds. Chapters are optional until timings are verified. */
  start: number;
}

export interface MusicTrack {
  id: string;
  title: string;
  poet: string;
  poetId?: string;
  duration: string;
  durationSeconds?: number;
  /** Direct, playable audio file. */
  audioUrl?: string;
  /** Square release artwork. */
  coverUrl?: string;
  /** Wide artwork for a dedicated publication page. */
  wideCoverUrl?: string;
  externalUrl?: string;
  videoUrl?: string;
  description?: string;
  releaseYear?: number;
  featured?: boolean;
  credits?: string[];
  rightsNotice?: string;
  audioSha256?: string;
  waveform?: readonly number[];
  /** Release-specific visual tokens applied through CSS custom properties. */
  theme?: MusicTrackTheme;
  /** Optional verified structural markers. Never populate with guessed timings. */
  chapters?: readonly MusicTrackChapter[];
}
