export interface Poet {
  id: string;
  name: string;
  fullName: string;
  birthYear: number;
  deathYear?: number;
  nationality: string;
  photo: string;
  shortBio: string;
  fullBio: string;
  rating: number;
  tags: string[];
  poems: Poem[];
  articles: Article[];
  historicalNote?: string;
  spiritualSearch?: string; // Заменяем высосанные из пальца анализы на объективные духовные искания (если они были)
  authorCommentary?: string; // Ремарка автора проекта (для вопиющих случаев богоборчества и т.д.)
  famousWorks: string[];
  links?: {
    youtube?: string;
    vk?: string;
    rutube?: string;
    website?: string;
  };
}

export interface Poem {
  id: string;
  title: string;
  originalTitle?: string;
  text: string;
  year?: number;
  analysis?: string;
  biblicalPerspective?: string;
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
  description?: string;
}
