import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Star, Award, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Poem } from '../../types/poet';
import CommunityPanel from '../community/CommunityPanel';
import { poemRatingDimensions } from '../../data/ratingDimensions';
import { useFavoritePoem } from '../../hooks/useFavoritePoems';
import InteractivePoemText from './InteractivePoemText';
import { toggleFavoritePoem } from '../../utils/myArchiveStore';

const PoemResourceLinks = lazy(() => import('./PoemResourceLinks'));

interface PoemCardProps {
  poem: Poem;
}

export default function PoemCard({ poem }: PoemCardProps) {
  const favorite = useFavoritePoem(poem.id);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2600);
  };

  const toggleFavorite = () => {
    const result = toggleFavoritePoem(poem.id);
    if (result.status === 'added') showToast('Добавлено в архив');
    else if (result.status === 'removed') showToast('Удалено из архива');
    else showToast('Не удалось изменить архив. Проверьте доступ к хранилищу браузера.');
  };

  return (
    <div id={`poem-${poem.id}`} className="luxury-card relative rounded-[3rem] border border-luxury-gold/10 bg-[#080808] p-4 shadow-2xl sm:p-8 scroll-mt-28 transition-all duration-500 hover:border-luxury-gold/30 md:p-12">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-live="polite"
            className="absolute right-6 top-6 z-20 rounded-full border border-luxury-gold/25 bg-luxury-gold/10 px-4 py-2 text-xs font-bold text-luxury-gold shadow-lg backdrop-blur-md"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mb-10 flex flex-col justify-between gap-4 border-b border-luxury-gold/20 pb-6 md:flex-row md:items-end">
        <div>
          <h3 className={`gold-glow-text mb-3 break-words font-serif font-semibold text-white text-[clamp(1.55rem,3.2vw,2.5rem)] leading-[1.18]`}>
            «{poem.title}»
          </h3>
          {poem.year && (
            <span className="gold-border-glow rounded-full border border-luxury-gold/20 bg-luxury-gold/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-gold-light/80">
              {poem.year}&nbsp;год
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={favorite ? `Убрать «${poem.title}» из архива` : `Добавить «${poem.title}» в архив`}
            aria-pressed={favorite}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/70 ${favorite ? 'bg-luxury-gold/15 text-luxury-gold' : 'border border-luxury-gold/10 bg-[#111] text-luxury-gray-light hover:text-luxury-gold'} ${!favorite ? 'theme-elevated-surface' : ''}`}
          >
            <Heart size={14} className={favorite ? 'fill-luxury-gold' : ''} />
            {favorite ? 'В архиве' : 'В архив'}
          </button>
          <div className={`flex min-h-11 items-center gap-2 rounded-full border border-luxury-gold/30 bg-[#111] px-4 py-2 shadow-inner theme-elevated-surface`}>
            <Star size={14} className="fill-luxury-gold text-luxury-gold" />
            <span className="gold-glow-text text-sm font-bold text-luxury-gold">{poem.rating}</span>
          </div>
        </div>
      </div>

      {poem.epigraph && (
        <figure
          data-poem-epigraph
          aria-label="Эпиграф к стихотворению"
          className="theme-dark-island mx-auto mb-8 max-w-3xl rounded-3xl border border-luxury-gold/20 bg-[#0d0d0b] px-5 py-6 shadow-inner sm:px-8 sm:py-7"
        >
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-luxury-gold-light/80">
            Эпиграф
          </div>
          <blockquote className="whitespace-pre-line break-words font-serif text-base italic leading-[1.85] text-luxury-gray-light sm:text-lg">
            {poem.epigraph.text}
          </blockquote>
          <figcaption className="mt-4 text-right text-xs tracking-[0.08em] text-luxury-gold-light/80">
            — {poem.epigraph.attribution}
          </figcaption>
        </figure>
      )}
      <InteractivePoemText text={poem.text} />
      {(poem.sourceUrl || poem.relatedMusicTrackIds?.length) && (
        <Suspense fallback={null}>
          <PoemResourceLinks poem={poem} />
        </Suspense>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {poem.analysis && (
          <div className={`rounded-3xl border border-luxury-gold/10 bg-[#0a0a0a] p-8 transition-colors hover:border-luxury-gold/30 theme-elevated-surface`}>
            <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white opacity-70">
              Литературный анализ
            </h4>
            <p className="text-base font-light leading-[1.8] text-luxury-gray-light">
              {poem.analysis}
            </p>
          </div>
        )}

        {poem.biblicalPerspective && (
          <div className="rounded-3xl border border-luxury-gold/20 bg-luxury-gold/5 p-8 transition-all hover:border-luxury-gold/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]">
            <h4 className="gold-glow-text mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-gold">
              <Award size={14} /> Духовный подтекст
            </h4>
            <p className="text-base font-light italic leading-[1.8] text-luxury-gray-light">
              {poem.biblicalPerspective}
            </p>
          </div>
        )}
      </div>
      <div className="mt-8">
        <CommunityPanel
          compact
          deferRemote
          targetType="poem"
          targetId={poem.id}
          title={`Оценка стихотворения: ${poem.title}`}
          dimensions={poemRatingDimensions}
        />
      </div>
    </div>
  );
}
