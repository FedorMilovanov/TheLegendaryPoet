import { Link } from 'react-router-dom';
import { BookOpen, Calendar, ArrowRight } from 'lucide-react';
import { Article } from '../../types/poet';

interface ArticleCardProps {
  article: Article;
  categoryLabel: string;
}

export default function ArticleCard({ article, categoryLabel }: ArticleCardProps) {
  return (
    <Link
      to={`/articles/${article.id}`}
      className="luxury-card rounded-2xl overflow-hidden group border border-cyan-400/10 bg-[#061018]/65"
    >
      <div className="h-48 bg-[#07111a] flex items-center justify-center border-b border-cyan-400/10">
        <BookOpen size={48} className="text-cyan-300/30" />
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 text-xs bg-cyan-400/10 text-cyan-200 rounded-full border border-cyan-400/20">
            {categoryLabel}
          </span>
          <span className="text-xs text-cyan-100/35 flex items-center gap-1">
            <Calendar size={12} /> {article.date}
          </span>
        </div>
        <h3 className="text-xl font-serif font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-sm text-cyan-100/55 line-clamp-3">
          {article.excerpt}
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-cyan-400/10">
          <span className="text-xs text-cyan-100/35">
            {article.readTime} мин чтения
          </span>
          <span className="text-cyan-300 flex items-center gap-1 text-sm">
            Читать <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
