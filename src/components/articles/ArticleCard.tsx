import { Link } from 'react-router-dom';
import { Article } from '../../types/poet';
import TiltCard from '../TiltCard';
import { BookOpen, Calendar, ArrowRight, Clock } from '../PremiumIcons';
import { titleCase } from '../../utils/titleCase';

interface ArticleCardProps {
  article: Article;
  categoryLabel: string;
}

export default function ArticleCard({ article, categoryLabel }: ArticleCardProps) {
  return (
    <Link to={`/articles/${article.id}`} className="group block h-full select-none">
      <TiltCard intensity={6}>
        <div className="overflow-hidden h-full flex flex-col bg-[#040910]/70 rounded-2xl relative luxury-card">
          {/* Hover glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />

          {/* Header icon area */}
          <div className="h-36 bg-[#02060b] flex items-center justify-center relative overflow-hidden flex-shrink-0 sm:h-44">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.06),transparent_65%)]" />
            <BookOpen size={40} className="text-cyan-400/20 group-hover:text-cyan-400/35 group-hover:scale-110 transition-all duration-500 drop-shadow-[0_0_12px_rgba(0,212,255,0.08)]" />
            <div className="absolute bottom-3 left-3 sm:left-4">
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-cyan-950/70 text-cyan-300 rounded-md backdrop-blur-md sm:px-2.5 sm:py-1 sm:text-[10px]">
                {categoryLabel}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col flex-grow relative z-10 sm:p-6">
            <div className="flex-grow space-y-2 sm:space-y-3">
              <div className="text-[10px] text-cyan-100/35 flex items-center gap-2 font-medium uppercase tracking-wider sm:gap-3">
                <span className="flex items-center gap-1">
                  <Calendar size={11} className="text-cyan-400/40" /> {article.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} className="text-cyan-400/40" /> {article.readTime} мин
                </span>
              </div>

              <h3 className="text-lg font-serif font-bold text-white group-hover:text-cyan-300 transition-colors duration-300 line-clamp-2 leading-snug sm:text-xl">
                {titleCase(article.title)}
              </h3>

              <p className="text-sm text-cyan-100/45 line-clamp-3 font-light leading-relaxed">
                {article.excerpt}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-3 mt-4 border-t border-white/5 sm:pt-4 sm:mt-5">
              <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1 group-hover:text-cyan-200 transition-colors">
                <span>Читать</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>
      </TiltCard>
    </Link>
  );
}