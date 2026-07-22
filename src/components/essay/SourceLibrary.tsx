import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Archive,
  BookOpenText,
  Building2,
  ChevronDown,
  ExternalLink,
  LibraryBig,
  Microscope,
  Network,
} from 'lucide-react';
import type { EssaySource, EssaySourceKind } from '../../types/essay';

const sourceKinds: Record<
  EssaySourceKind,
  { label: string; shortLabel: string; icon: typeof BookOpenText }
> = {
  primary: { label: 'Первоисточники', shortLabel: 'Первичные', icon: BookOpenText },
  archive: { label: 'Архивы и каталоги', shortLabel: 'Архивы', icon: Archive },
  research: { label: 'Исследования', shortLabel: 'Исследования', icon: Microscope },
  institutional: { label: 'Институциональные нарративы', shortLabel: 'Музеи', icon: Building2 },
  context: { label: 'Контекст', shortLabel: 'Контекст', icon: Network },
};

const filterOrder = ['all', 'primary', 'archive', 'research', 'institutional', 'context'] as const;
type Filter = (typeof filterOrder)[number];

function sourceKind(source: EssaySource): EssaySourceKind {
  return source.kind ?? 'research';
}

export default function SourceLibrary({ sources }: { sources: EssaySource[] }) {
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState(false);

  const indexedSources = useMemo(
    () => sources.map((source, index) => ({ source, index: index + 1 })),
    [sources],
  );

  const counts = useMemo(() => {
    const result: Record<EssaySourceKind, number> = {
      primary: 0,
      archive: 0,
      research: 0,
      institutional: 0,
      context: 0,
    };
    for (const source of sources) result[sourceKind(source)] += 1;
    return result;
  }, [sources]);

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? indexedSources
        : indexedSources.filter(({ source }) => sourceKind(source) === filter),
    [filter, indexedSources],
  );

  const collapsedLimit = filter === 'all' ? 12 : 16;
  const visible = expanded ? filtered : filtered.slice(0, collapsedLimit);
  const hiddenCount = Math.max(0, filtered.length - visible.length);

  const changeFilter = (next: Filter) => {
    setFilter(next);
    setExpanded(false);
  };

  useEffect(() => {
    const revealLinkedSource = () => {
      const match = window.location.hash.match(/^#source-(.+)$/);
      if (!match) return;
      const sourceId = decodeURIComponent(match[1]);
      if (!sources.some((source) => source.id === sourceId)) return;

      setFilter('all');
      setExpanded(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.getElementById(`source-${sourceId}`)?.scrollIntoView({
            behavior: reduceMotion ? 'auto' : 'smooth',
            block: 'center',
          });
        });
      });
    };

    revealLinkedSource();
    window.addEventListener('hashchange', revealLinkedSource);
    return () => window.removeEventListener('hashchange', revealLinkedSource);
  }, [reduceMotion, sources]);

  return (
    <section
      id="sources"
      data-testid="source-library"
      className="scroll-mt-28 mt-16 overflow-hidden rounded-[2.25rem] border border-luxury-gold/12 bg-[linear-gradient(145deg,rgba(15,14,11,0.94),rgba(7,7,7,0.96))] p-5 sm:p-7 md:p-9"
    >
      <div className="flex flex-col gap-5 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-luxury-gold/65">
            <LibraryBig size={14} aria-hidden="true" /> Источниковая база
          </div>
          <h2 className="font-serif text-3xl text-white">Документы, тексты и исследования</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-luxury-gray-light/55">
            Первоисточники и архивы отделены от исследований и музейных биографических нарративов.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.14em] text-luxury-gray-light/55">
          <span className="rounded-full border border-white/8 bg-white/[0.025] px-3 py-1.5">
            {sources.length} всего
          </span>
          <span className="rounded-full border border-luxury-gold/15 bg-luxury-gold/[0.04] px-3 py-1.5 text-luxury-gold/70">
            {counts.primary} первичных
          </span>
        </div>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filterOrder.map((item) => {
          const active = filter === item;
          const label = item === 'all' ? 'Все' : sourceKinds[item].shortLabel;
          const count = item === 'all' ? sources.length : counts[item];
          return (
            <button
              key={item}
              type="button"
              onClick={() => changeFilter(item)}
              className="relative isolate inline-flex min-h-10 shrink-0 items-center gap-2 overflow-hidden rounded-full border border-white/8 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-luxury-gray-light/55 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/70"
              aria-pressed={active}
              data-testid={`source-filter-${item}`}
            >
              {active && (
                <motion.span
                  layoutId="source-filter-pill"
                  className="absolute inset-0 -z-10 rounded-full border border-luxury-gold/20 bg-luxury-gold/[0.08]"
                  transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                />
              )}
              <span className={active ? 'text-luxury-gold' : undefined}>{label}</span>
              <span className="tabular-nums text-luxury-gray-light/35">{count}</span>
            </button>
          );
        })}
      </div>

      <motion.ol layout className="mt-5 space-y-2.5">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map(({ source, index }) => {
            const kind = sourceKind(source);
            const meta = sourceKinds[kind];
            const Icon = meta.icon;
            const content = (
              <>
                <span className="mt-0.5 font-serif text-sm tabular-nums text-luxury-gold/45">
                  {String(index).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm leading-relaxed text-white/82">{source.title}</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.025] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.13em] text-luxury-gray-light/45">
                      <Icon size={9} aria-hidden="true" /> {meta.label}
                    </span>
                  </span>
                  {(source.institution || source.year || source.note) && (
                    <span className="mt-1 block text-xs leading-relaxed text-luxury-gray-light/42">
                      {[source.institution, source.year].filter(Boolean).join(' · ')}
                      {source.note ? `${source.institution || source.year ? ' — ' : ''}${source.note}` : ''}
                    </span>
                  )}
                </span>
                {source.url && (
                  <ExternalLink
                    size={13}
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-luxury-gold/35 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-luxury-gold/75"
                  />
                )}
              </>
            );

            return (
              <motion.li
                id={source.id ? `source-${source.id}` : undefined}
                key={source.id ?? source.url ?? `${index}-${source.title}`}
                layout
                initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.99 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                data-testid="source-item"
                className="scroll-mt-28 rounded-2xl target:ring-2 target:ring-luxury-gold/65 target:ring-offset-4 target:ring-offset-[#090806]"
              >
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-h-14 items-start gap-3 rounded-2xl border border-white/[0.055] bg-white/[0.018] px-3.5 py-3 transition-[background-color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-luxury-gold/20 hover:bg-luxury-gold/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/65"
                  >
                    {content}
                  </a>
                ) : (
                  <div className="flex min-h-14 items-start gap-3 rounded-2xl border border-white/[0.055] bg-white/[0.018] px-3.5 py-3">
                    {content}
                  </div>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ol>

      {(hiddenCount > 0 || expanded) && filtered.length > collapsedLimit && (
        <div className="mt-6 flex justify-center">
          <motion.button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-luxury-gold/15 bg-luxury-gold/[0.04] px-5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-luxury-gold/70 transition hover:border-luxury-gold/30 hover:bg-luxury-gold/[0.07] hover:text-luxury-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/70"
            aria-expanded={expanded}
            data-testid="source-expand"
          >
            {expanded ? 'Свернуть список' : `Показать ещё ${hiddenCount}`}
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={`transition-transform duration-300 ${expanded ? 'rotate-180' : 'group-hover:translate-y-0.5'}`}
            />
          </motion.button>
        </div>
      )}
    </section>
  );
}
