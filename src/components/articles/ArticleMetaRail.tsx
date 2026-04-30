import { Calendar, Clock, FileText } from 'lucide-react';
import { Article } from '../../types/poet';

interface ArticleMetaRailProps {
  article: Article;
  categoryLabel: string;
}

export default function ArticleMetaRail({ article, categoryLabel }: ArticleMetaRailProps) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-32 space-y-4">
        <div className="luxury-card rounded-3xl border border-cyan-400/15 bg-[#061018]/70 p-5">
          <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Материал</div>
          <div className="space-y-3 text-sm text-cyan-100/55">
            <div className="flex items-center gap-2"><FileText size={15} className="text-cyan-300" /> {categoryLabel}</div>
            <div className="flex items-center gap-2"><Calendar size={15} className="text-cyan-300" /> {article.date}</div>
            <div className="flex items-center gap-2"><Clock size={15} className="text-cyan-300" /> {article.readTime} мин</div>
          </div>
        </div>
        <div className="rounded-3xl border border-cyan-400/10 bg-black/20 p-5 text-xs leading-relaxed text-cyan-100/42">
          Совет: используйте <span className="text-cyan-300">Ctrl/Cmd + K</span>, чтобы быстро перейти к поэту, статье или разделу.
        </div>
      </div>
    </aside>
  );
}