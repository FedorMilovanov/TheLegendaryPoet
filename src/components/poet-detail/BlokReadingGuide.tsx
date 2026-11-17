import { ArrowUpRight, BookOpenText, Music2 } from 'lucide-react';
import type { Poem } from '../../types/poet';

/** Native anchor guide; no duplicate routes or JS scroll overrides. */
export default function BlokReadingGuide({ poems }: { poems: Poem[] }) {
  const years = poems.map((poem) => poem.year).filter((year): year is number => typeof year === 'number');
  const period = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : '';
  const versions = poems.reduce((sum, poem) => sum + (poem.relatedMusicTrackIds?.length ?? 0), 0);

  return (
    <nav id="blok-poems-navigation" aria-label="Оглавление избранной лирики Александра Блока" className="theme-elevated-surface relative isolate overflow-hidden rounded-[2rem] border border-luxury-gold/20 px-5 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:px-8 sm:py-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_95%_0%,rgba(212,175,55,0.12),transparent_48%)]" />
      <div className="relative flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <p className="theme-poet-accent mb-2 text-[11px] font-bold uppercase tracking-[0.18em]">
            Литературный маршрут {period && `· ${period}`}
          </p>
          <h3 className="theme-text font-serif text-2xl font-semibold leading-tight sm:text-3xl">Оглавление стихотворений</h3>
          <p className="theme-functional-muted mt-3 max-w-xl text-sm leading-relaxed">Перейдите к стихотворению, литературному разбору и музыкальным интерпретациям.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 text-xs" aria-label="Состав подборки">
          <span className="theme-text inline-flex items-center gap-2 rounded-full border border-luxury-gold/20 px-3 py-2">
            <BookOpenText aria-hidden="true" size={15} className="theme-poet-accent" /> {poems.length} текстов
          </span>
          <span className="theme-text inline-flex items-center gap-2 rounded-full border border-luxury-gold/20 px-3 py-2">
            <Music2 aria-hidden="true" size={15} className="theme-poet-accent" /> {versions} записей
          </span>
        </div>
      </div>
      <ol className="relative mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 [scrollbar-width:thin]">
        {poems.map((poem, index) => (
          <li key={poem.id} className="w-[15.5rem] max-w-[82vw] flex-none snap-start">
            <a href={`#poem-${poem.id}`} className="group theme-elevated-surface flex h-full min-h-[7.2rem] min-w-0 flex-col justify-between gap-4 rounded-2xl border border-luxury-gold/15 px-4 py-4 transition-colors hover:border-luxury-gold/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold">
              <span className="flex items-start justify-between gap-3">
                <span aria-hidden="true" className="theme-poet-accent font-serif text-2xl leading-none opacity-80">{String(index + 1).padStart(2, '0')}</span>
                <ArrowUpRight aria-hidden="true" size={16} className="theme-functional-muted shrink-0 transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" />
              </span>
              <span className="min-w-0">
                <span className="theme-text block break-words font-serif text-[15px] font-semibold leading-snug">{poem.title}</span>
                <span className="theme-functional-muted mt-1 block text-xs">{poem.year || 'Без даты'}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
      <p className="theme-functional-muted relative mt-2 text-xs leading-relaxed">«На поле Куликовом» — цикл из пяти стихотворений: здесь представлены части I и II. «Скифы» — отдельное произведение с двумя музыкальными версиями.</p>
    </nav>
  );
}
