import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { articleRatingDimensions } from '../data/ratingDimensions';
import CommunityPanel from '../components/community/CommunityPanel';
import ArticleMetaRail from '../components/articles/ArticleMetaRail';
import ReadingProgress from '../components/articles/ReadingProgress';
import RelatedArticles from '../components/articles/article-detail/RelatedArticles';
import ArticleBody from '../components/articles/article-detail/ArticleBody';
import ArticleHeader from '../components/articles/article-detail/ArticleHeader';
import { getArticleById, getRelatedArticles } from '../utils/articleLibrary';

const categoryLabels: Record<string, string> = {
  biblical: 'Библейский анализ',
  moral: 'Моральный анализ',
  history: 'История',
  analysis: 'Литературный анализ',
  biography: 'Биография',
};

function buildParagraphs(content: string, excerpt: string) {
  if (content.includes('\n\n')) return content.split('\n\n');
  return [
    excerpt,
    content,
    'Полная редакторская версия этой статьи будет расширяться и дополняться в следующих сессиях проекта.',
  ];
}

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const article = id ? getArticleById(id) : undefined;

  if (!article) {
    return (
      <div className="min-h-screen bg-[#050505] pt-32 pb-24 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-4 font-serif text-4xl">Статья не найдена</h1>
          <Link to="/articles" className="text-cyan-300 hover:text-cyan-200">
            Вернуться к списку статей
          </Link>
        </div>
      </div>
    );
  }

  const related = getRelatedArticles(article.id, article.category);
  const paragraphs = buildParagraphs(article.content, article.excerpt);
  const categoryLabel = categoryLabels[article.category] || article.category;

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-24 text-white">
      <ReadingProgress />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          to="/articles"
          className="mb-8 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/70 transition-colors hover:text-cyan-300"
        >
          <ArrowLeft size={14} /> Все статьи
        </Link>

        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          <ArticleMetaRail article={article} categoryLabel={categoryLabel} />
          <article className="luxury-card rounded-[2rem] border border-cyan-400/15 bg-[#061018]/70 p-8 md:p-12">
            <ArticleHeader article={article} categoryLabel={categoryLabel} />
            <ArticleBody paragraphs={paragraphs} />
          </article>
        </div>

        <section className="mt-16">
          <CommunityPanel
            targetType="article"
            targetId={article.id}
            title={`Оценка материала: ${article.title}`}
            dimensions={articleRatingDimensions}
          />
        </section>

        <RelatedArticles related={related} categoryLabels={categoryLabels} />
      </div>
    </div>
  );
}
