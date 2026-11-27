import { fetNewYearCover, fetNewYearCoverAlt, fetNewYearCoverCredit, fetNewYearEssaySlug, fetNewYearSources } from './collections/fetNewYear';

import type { PoetryCollection } from '../types/poetryCollection';
export type { PoetryCollection, PoetryCollectionEntry } from '../types/poetryCollection';

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
        status: 'published',
        publishedAt: '2026-11-27T17:30:27+03:00',
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
