import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Star, Award, Heart, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Poem } from '../../types/poet';
import { visiblePoemFacsimile } from '../../data/poemFacsimiles';
import CommunityPanel from '../community/CommunityPanel';
import { poemRatingDimensions } from '../../data/ratingDimensions';
import { useFavoritePoem } from '../../hooks/useFavoritePoems';
import InteractivePoemText from './InteractivePoemText';
import { toggleFavoritePoem } from '../../utils/myArchiveStore';

const PoemResourceLinks = lazy(() => import('./PoemResourceLinks'));
const PoemFacsimile = lazy(() => import('./PoemFacsimile'));
// Lazy-load the Blok cycle's separately attributed epigraph without affecting other poem cards.
const PoemEpigraph = lazy(() => import('./PoemEpigraph'));

interface PoemCardProps {
  poem: Poem;
}

export default function PoemCard({ poem }: PoemCardProps) {
  const favorite = useFavoritePoem(poem.id);
  const facsimile = visiblePoemFacsimile(poem.id, import.meta.env.MODE);
  // Mark standalone editorial omissions and explicitly titled excerpts as incomplete.
  const isMarkedExcerpt = /(?:^|\n)[ \t]*(?:<\.{3}>|\.{3}|…)[ \t]*(?:\n|$)/u.test(poem.text)
    || /\((?:[^)]*(?:фрагмент|отрывок|цитата|цитаты)[^)]*)\)/iu.test(poem.title);
  const displayTitle = poem.title.startsWith('«') && poem.title.endsWith('»')
    ? poem.title
    : `«${poem.title}»`;
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
          <h3 className="gold-glow-text text-white poem-card-title">
            {displayTitle}
          </h3>
          {(poem.year || poem.yearLabel) && (
            <span data-poem-year-label className="gold-border-glow rounded-full border border-luxury-gold/20 bg-luxury-gold/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-gold-light/80">
              {poem.yearLabel ?? `${poem.year} год`}{poem.editionYear ? ` · редакция ${poem.editionYear} г.` : ''}
            </span>
          )}
          {poem.yearNote && <span data-poem-year-note className="ml-2 inline-block max-w-full text-xs font-medium normal-case tracking-normal text-luxury-gray-light">{poem.yearNote}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={favorite ? `Убрать ${displayTitle} из архива` : `Добавить ${displayTitle} в архив`}
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
        <Suspense fallback={<div aria-hidden="true" className="ep-wait">{poem.epigraph.text}<span>— {poem.epigraph.attribution}</span></div>}>
          <PoemEpigraph epigraph={poem.epigraph} />
        </Suspense>
      )}
      <InteractivePoemText text={poem.text} />
      {isMarkedExcerpt && (
        <p data-poem-excerpt-notice role="note" className="-mt-6 mb-10 border-l-2 border-luxury-gold/40 pl-4 text-sm leading-7 text-luxury-gray-light">
          Здесь представлен отрывок или сокращённая редакция произведения, а не его полный текст.
        </p>
      )}
      {facsimile && (
        <Suspense fallback={null}>
          <PoemFacsimile document={facsimile} />
        </Suspense>
      )}
      {(poem.sourceUrl || poem.relatedMusicTrackIds?.length) && (
        <Suspense fallback={null}>
          <PoemResourceLinks poem={poem} />
        </Suspense>
      )}
      <div data-poem-analysis-grid className={`grid grid-cols-1 gap-6 ${poem.analysis && poem.biblicalPerspective ? 'md:grid-cols-2' : ''}`}>
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
      {poem.textualNote && (
        <section data-poem-textual-note aria-label="История текста" className="mt-6 min-w-0 rounded-2xl border border-luxury-gold/15 bg-[#0a0a0a] p-5 theme-elevated-surface sm:p-8">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-luxury-gold-light">История текста и редакции</h4>
          <details className="group min-w-0">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-sm font-medium text-luxury-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold [&::-webkit-details-marker]:hidden">
              <span>Читать текстологическую справку</span>
              <ChevronDown size={16} aria-hidden="true" className="shrink-0 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <p className="mt-3 max-w-full whitespace-normal text-sm leading-7 text-luxury-gray-light [overflow-wrap:anywhere]">{poem.textualNote}</p>
          </details>
          {poem.textualSourceUrl && (
            <a href={poem.textualSourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 max-w-full items-center rounded-lg text-sm font-medium text-luxury-gold-light underline decoration-luxury-gold/40 underline-offset-4 transition hover:decoration-luxury-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold">
              Текстологический источник <span aria-hidden="true" className="ml-1">↗</span>
            </a>
          )}
        </section>
      )}
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
