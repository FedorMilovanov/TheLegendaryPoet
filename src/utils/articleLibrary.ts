import { articles, poets } from '../data/poets';
import { Article } from '../types/poet';

export function getAllArticles(): Article[] {
  const poetArticles = poets.flatMap((poet) => poet.articles);
  return [...articles, ...poetArticles];
}

export function getArticleById(id: string): Article | undefined {
  return getAllArticles().find((article) => article.id === id);
}

export function getRelatedArticles(currentId: string, category: Article['category']) {
  return getAllArticles()
    .filter((article) => article.id !== currentId && article.category === category)
    .slice(0, 3);
}
