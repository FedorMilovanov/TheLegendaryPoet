import { Calendar, Clock, FileText } from 'lucide-react';
import { Article } from '../../../types/poet';
import { titleCase } from '../../../utils/titleCase';

interface ArticleHeaderProps {
  article: Article;
  categoryLabel: string;
}

export default function ArticleHeader({ article, categoryLabel }: ArticleHeaderProps) {
  return (
    <>
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-300">
        <FileText size={12} /> {categoryLabel}
      </div>
      <h1 className="mb-6 font-serif text-4xl font-bold leading-tight md:text-6xl">
        <span className="neon-blue-gradient neon-glow-text">{titleCase(article.title)}</span>
      </h1>
      <div className="mb-8 flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.14em] text-cyan-100/38">
        <span className="inline-flex items-center gap-1"><Calendar size={13} /> {article.date}</span>
        <span className="inline-flex items-center gap-1"><Clock size={13} /> {article.readTime} мин</span>
        <span>{article.author}</span>
      </div>
      <p className="mb-8 border-l border-cyan-400/25 pl-6 text-xl font-light italic leading-relaxed text-cyan-100/65">
        {article.excerpt}
      </p>
    </>
  );
}
