import { useParams } from 'react-router-dom';
import { Link } from '../components/ui/Link';
import LongformPage from '../components/essay/LongformPage';
import RelatedArticles from '../components/articles/article-detail/RelatedArticles';
import { getArticleById, getRelatedArticles } from '../utils/articleLibrary';
import {
  articleCategoryLabels,
  legacyArticleToEssay,
} from '../data/articles/legacyArticleAdapter';
import { useSeo } from '../hooks/useSeo';
import { titleCase } from '../utils/titleCase';

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const article = id ? getArticleById(id) : undefined;

  useSeo({
    title: article ? `${article.title} — THE LEGENDARY POET` : 'Статья не найдена — THE LEGENDARY POET',
    description: article ? article.excerpt : 'Статья не найдена.',
    path: `/articles/${id ?? ''}`,
    type: 'article',
    image: article?.image,
    publishedTime: article?.date,
    author: article?.author,
  });

  if (!article) {
    return (
      <div className="min-h-screen bg-[#050505] pt-32 pb-24 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-4 font-serif text-4xl">{titleCase('Статья не найдена')}</h1>
          <Link to="/articles" className="text-cyan-300 hover:text-cyan-200">
            Вернуться к списку статей
          </Link>
        </div>
      </div>
    );
  }

  const essay = legacyArticleToEssay(article);
  const related = getRelatedArticles(article.id, article.category);

  return (
    <LongformPage
      essay={essay}
      afterArticle={
        <RelatedArticles
          related={related}
          categoryLabels={articleCategoryLabels}
        />
      }
    />
  );
}
