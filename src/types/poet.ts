import type { EssayBlock, EssaySource } from './essay';

export interface Poet {
  id: string;
  name: string;
  fullName: string;
  birthYear: number;
  deathYear?: number;
  nationality: string;
  photo: string;
  coverImage?: string;
  shortBio: string;
  fullBio: string;
  rating: number;
  initials?: string;
  epoch?: string;
  epochLabel?: string;
  tags: string[];
  poems: Poem[];
  articles: Article[];
  music?: MusicTrack[];
  historicalNote?: string;
  spiritualSearch?: string;
  moralPortrait?: string;
  authorCommentary?: string;
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
  /** Legacy prose remains the compatibility fallback for existing short articles. */
  content: string;
  /** New and upgraded articles use the same universal block engine as flagship essays. */
  blocks?: EssayBlock[];
  sources?: EssaySource[];
  author: string;
  date: string;
  category: 'analysis' | 'history' | 'moral' | 'biblical' | 'biography';
  readTime: number;
  image?: string;
}

export interface MusicTrackTheme {
  accent: string;
  secondary: string;
  surface: string;
  heroPosition?: string;
}

export interface MusicTrackChapter {
  label: string;
  start: number;
}

export type MusicTrackAvailability = 'published' | 'coming-soon' | 'archived';

export interface MusicTrack {
  id: string;
  title: string;
  poet: string;
  poetId?: string;
  availability: MusicTrackAvailability;
  releaseOrder: number;
  releaseYear: number;
  publishedAt?: string;
  scheduledFor?: string;
  duration?: string;
  durationSeconds?: number;
  audioUrl?: string;
  coverUrl?: string;
  wideCoverUrl?: string;
  externalUrl?: string;
  videoUrl?: string;
  description?: string;
  featured?: boolean;
  credits?: string[];
  rightsNotice?: string;
  audioSha256?: string;
  waveform?: readonly number[];
  theme?: MusicTrackTheme;
  chapters?: readonly MusicTrackChapter[];
}
