import { useState } from 'react';
import { Star, Award, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Poem } from '../../types/poet';
import CommunityPanel from '../community/CommunityPanel';
import { poemRatingDimensions } from '../../data/ratingDimensions';
import InteractivePoemText from './InteractivePoemText';
import { isFavoritePoem, toggleFavoritePoem } from '../../utils/myArchiveStore';

interface PoemCardProps {
  poem: Poem;
}

export default function PoemCard({ poem }: PoemCardProps) {
  const [favorite, setFavorite] = useState(() => isFavoritePoem(poem.id));
  const [toast, setToast] = useState<string | null>(null);

  const toggleFavorite = () => {
    const next = toggleFavoritePoem(poem.id);
    setFavorite(next);
    setToast(next ? 'Добавлено в архив' : 'Удалено из архива');
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div id={`poem-${poem.id}`} className="luxury-card relative p-8 md:p-12 rounded-[3rem] border border-luxury-gold/10 bg-[#080808] hover:border-luxury-gold/30 transition-all duration-500 shadow-2xl scroll-mt-28">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute right-6 top-6 z-20 rounded-full border border-luxury-gold/25 bg-luxury-gold/10 px-4 py-2 text-xs font-bold text-luxury-gold shadow-lg backdrop-blur-md"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={favorite ? 'Убрать из избранного' : 'Добавить в избранное'}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${favorite ? 'bg-luxury-gold/15 text-luxury-gold' : 'bg-[#111] text-luxury-gray-light hover:text-luxury-gold border border-luxury-gold/10'}`}
          >
            <Heart size={14} className={favorite ? 'fill-luxury-gold' : ''} />
            {favorite ? 'В архиве' : 'В архив'}
          </button>
          <div className="flex items-center gap-2 bg-[#111] px-4 py-2 rounded-full border border-luxury-gold/30 shadow-inner">
            <Star size={14} className="text-luxury-gold fill-luxury-gold" />
            <span className="text-sm font-bold text-luxury-gold gold-glow-text">{poem.rating}</span>
          </div>
        </div>
      </div>

      <InteractivePoemText text={poem.text} />

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
