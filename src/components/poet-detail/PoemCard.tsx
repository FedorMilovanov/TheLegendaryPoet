import { Star, Award } from 'lucide-react';
import { Poem } from '../../types/poet';
import CommunityPanel from '../community/CommunityPanel';
import { poemRatingDimensions } from '../../data/ratingDimensions';

interface PoemCardProps {
  poem: Poem;
}

export default function PoemCard({ poem }: PoemCardProps) {
  return (
    <div id={`poem-${poem.id}`} className="luxury-card p-8 md:p-12 rounded-[3rem] border border-luxury-gold/10 bg-[#080808] hover:border-luxury-gold/30 transition-all duration-500 shadow-2xl scroll-mt-28">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b border-luxury-gold/20 pb-6 gap-4">
        <div>
          <h3 className="text-4xl font-serif font-semibold text-white mb-3 gold-glow-text">
            «{poem.title}»
          </h3>
          {poem.year && (
            <span className="text-[10px] tracking-[0.2em] bg-luxury-gold/10 px-4 py-1.5 rounded-full text-luxury-gold-light/80 border border-luxury-gold/20 font-bold uppercase gold-border-glow">
              {poem.year} год
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 bg-[#111] px-4 py-2 rounded-full border border-luxury-gold/30 shadow-inner">
          <Star size={14} className="text-luxury-gold fill-luxury-gold" />
          <span className="text-sm font-bold text-luxury-gold gold-glow-text">{poem.rating}</span>
        </div>
      </div>
      
      <div className="poetry-text text-2xl text-white whitespace-pre-line mb-12 leading-[2] tracking-wide font-serif py-8 bg-[#050505] rounded-[2rem] px-8 md:px-12 border border-luxury-gold/5 shadow-inner">
        {poem.text}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {poem.analysis && (
          <div className="p-8 bg-[#0a0a0a] rounded-3xl border border-luxury-gold/10 hover:border-luxury-gold/30 transition-colors">
            <h4 className="text-[10px] text-white font-bold tracking-[0.2em] uppercase mb-4 opacity-70">
              Литературный анализ
            </h4>
            <p className="text-base text-luxury-gray-light leading-[1.8] font-light">
              {poem.analysis}
            </p>
          </div>
        )}

        {poem.biblicalPerspective && (
          <div className="p-8 bg-luxury-gold/5 border border-luxury-gold/20 rounded-3xl hover:border-luxury-gold/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all">
            <h4 className="text-luxury-gold text-[10px] font-bold tracking-[0.2em] uppercase mb-4 flex items-center gap-2 gold-glow-text">
              <Award size={14} /> Духовный подтекст
            </h4>
            <p className="text-base text-luxury-gray-light leading-[1.8] font-light italic">
              {poem.biblicalPerspective}
            </p>
          </div>
        )}
      </div>
      <div className="mt-8">
        <CommunityPanel
          compact
          targetType="poem"
          targetId={poem.id}
          title={`Оценка стихотворения: ${poem.title}`}
          dimensions={poemRatingDimensions}
        />
      </div>
    </div>
  );
}
