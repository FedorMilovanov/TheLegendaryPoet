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
  tags: string[];
  poems: Poem[];
  articles: Article[];
  music?: MusicTrack[];
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
  audioUrl: string;
  videoUrl?: string;
  description?: string;
}
