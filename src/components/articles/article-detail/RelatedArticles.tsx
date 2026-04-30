import { Article } from '../../../types/poet';
import ArticleCard from '../ArticleCard';

interface RelatedArticlesProps {
  related: Article[];
  categoryLabels: Record<string, string>;
}

export default function RelatedArticles({ related, categoryLabels }: RelatedArticlesProps) {
  if (!related.length) return null;

  return (
    <section className="mt-16">
      <h2 className="mb-8 font-serif text-3xl font-bold text-white">
        Похожие <span className="neon-blue-gradient neon-glow-text">материалы</span>
      </h2>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {related.map((item) => (
          <ArticleCard
            key={item.id}
            article={item}
            categoryLabel={categoryLabels[item.category] || item.category}
          />
        ))}
      </div>
    </section>
  );
}
