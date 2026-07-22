import type { Essay, EssayBlock } from '../../types/essay';
import type { Article } from '../../types/poet';

export const articleCategoryLabels: Record<Article['category'], string> = {
  biblical: 'Библейский анализ',
  moral: 'Моральный анализ',
  history: 'История',
  analysis: 'Литературный анализ',
  biography: 'Биография',
};

function articleBlocks(article: Article): EssayBlock[] {
  const paragraphs = article.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return [
    { type: 'lead', text: article.excerpt },
    ...paragraphs.map((text): EssayBlock => ({ type: 'paragraph', text })),
  ];
}

/**
 * Temporary compatibility adapter: old records keep their compact authoring
 * shape, but every public article is rendered by the same typed longform engine.
 */
export function legacyArticleToEssay(article: Article): Essay {
  const categoryLabel = articleCategoryLabels[article.category];

  return {
    id: article.id,
    slug: article.id,
    kicker: categoryLabel,
    title: article.title,
    subtitle: article.excerpt,
    excerpt: article.excerpt,
    author: article.author,
    date: article.date,
    readTime: article.readTime,
    cover: article.image || '/images/sections/articles-cover.jpg',
    cardCover: article.image || '/images/sections/articles-cover.jpg',
    coverAlt: article.title,
    accent: '#2ed8ff',
    tags: [categoryLabel, 'Статья'],
    blocks: articleBlocks(article),
  };
}
