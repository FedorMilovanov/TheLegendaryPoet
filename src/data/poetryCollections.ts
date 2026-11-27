import { fetNewYearCover, fetNewYearCoverAlt, fetNewYearCoverCredit, fetNewYearEssaySlug, fetNewYearSources, type CollectionSource } from './collections/fetNewYear';

export interface PoetryCollectionEntry {
  id: string;
  poetId: string;
  poetName: string;
  title: string;
  essaySlug: string;
  sources: readonly CollectionSource[];
  video: { url: string; status: 'scheduled'; scheduledFor: string } | { url: string; status: 'published' };
}

export interface PoetryCollection {
  id: string;
  title: string;
  description: string;
  cover: string;
  coverAlt: string;
  coverCredit: string;
  playlistUrl: string;
  entries: readonly PoetryCollectionEntry[];
}

export const poetryCollections: readonly PoetryCollection[] = [
  {
    id: 'new-year-symphony',
    title: 'Новогодняя Симфония Русской Поэзии',
    description: 'От золотых огней бала до тишины зимней ночи. Русская поэзия в музыке, с возвращением к её подлинным текстам и истории.',
    cover: fetNewYearCover,
    coverAlt: fetNewYearCoverAlt,
    coverCredit: fetNewYearCoverCredit,
    playlistUrl: 'https://www.youtube.com/playlist?list=PLZH4xU7Qrx5k',
    entries: [{
      id: 'fet-new-year-ball',
      poetId: 'afanasy-fet',
      poetName: 'Афанасий Фет',
      title: 'Переплетись, Новый Год! — Новогодний Бал',
      essaySlug: fetNewYearEssaySlug,
      sources: fetNewYearSources,
      video: {
        url: 'https://www.youtube.com/watch?v=K9sZYuUnzCk',
        status: 'scheduled',
        scheduledFor: '2026-11-27T17:30:00+03:00',
      },
    }],
  },
];

export const musicPageTitle = 'Музыка на стихи русских поэтов — THE LEGENDARY POET';
export const musicPageDescription = 'Музыкальные интерпретации русской поэзии, авторские релизы и тематические коллекции. Новогодняя Симфония Русской Поэзии: Фет, зимняя лирика, история текстов.';

export function collectionPath(id: string) { return `/music#${id}`; }
export function collectionsForPoet(poetId: string) {
  return poetryCollections.filter(collection => collection.entries.some(entry => entry.poetId === poetId));
}
export function collectionsForEssay(slug: string) {
  return poetryCollections.filter(collection => collection.entries.some(entry => entry.essaySlug === slug));
}
