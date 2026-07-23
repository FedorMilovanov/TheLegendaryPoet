import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ListMusic, Search, SlidersHorizontal, UserRound, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { MusicTrack } from '../../types/poet';
import {
  filterMusicTracks,
  getMusicCatalogPoets,
  type MusicCatalogSort,
} from '../../data/musicCatalog';
import TrackReleaseCard from './TrackReleaseCard';

interface MusicArchiveBrowserProps {
  tracks: readonly MusicTrack[];
}

const PAGE_SIZE = 8;
const sortOptions: Array<{ value: MusicCatalogSort; label: string }> = [
  { value: 'editorial', label: 'Порядок проекта' },
  { value: 'newest', label: 'Сначала новые' },
  { value: 'oldest', label: 'Сначала ранние' },
  { value: 'poet', label: 'По авторам' },
  { value: 'title', label: 'По названию' },
];
const validSorts = new Set<MusicCatalogSort>(sortOptions.map((option) => option.value));

export default function MusicArchiveBrowser({ tracks }: MusicArchiveBrowserProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const poets = useMemo(() => getMusicCatalogPoets(tracks), [tracks]);

  const query = (searchParams.get('q') ?? '').slice(0, 120);
  const rawPoetId = searchParams.get('poet') ?? '';
  const poetId = poets.some((poet) => poet.id === rawPoetId) ? rawPoetId : '';
  const rawSort = searchParams.get('sort') as MusicCatalogSort | null;
  const sort = rawSort && validSorts.has(rawSort) ? rawSort : 'editorial';
  const deferredQuery = useDeferredValue(query);

  const matchingTracks = useMemo(
    () => filterMusicTracks(tracks, { query: deferredQuery, poetId: poetId || undefined, sort }),
    [deferredQuery, poetId, sort, tracks],
  );
  const renderedTracks = matchingTracks.slice(0, visibleLimit);
  const remainingCount = Math.max(0, matchingTracks.length - renderedTracks.length);
  const filtersActive = Boolean(query.trim() || poetId || sort !== 'editorial');
  const searchPending = deferredQuery !== query;

  useEffect(() => {
    setVisibleLimit(PAGE_SIZE);
  }, [deferredQuery, poetId, sort, tracks]);

  const updateParam = (name: 'q' | 'poet' | 'sort', value: string, defaultValue = '') => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === defaultValue) next.delete(name);
    else next.set(name, value);
    setSearchParams(next, { replace: true });
  };

  const reset = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    next.delete('poet');
    next.delete('sort');
    setSearchParams(next, { replace: true });
    setVisibleLimit(PAGE_SIZE);
  };

  return (
    <div aria-busy={searchPending}>
      <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.018] p-4 shadow-[0_18px_70px_rgba(0,0,0,0.22)] sm:p-5">
        <div className="pointer-events-none absolute right-[-5rem] top-[-6rem] h-52 w-52 rounded-full bg-cyan-300/[0.045] blur-3xl" />
        <div className="relative grid gap-3 lg:grid-cols-[minmax(260px,1fr)_auto] lg:items-center">
          <label className="group relative block">
            <span className="sr-only">Найти музыкальный релиз</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-100/32 transition group-focus-within:text-cyan-300" size={18} />
            <input
              type="search"
              value={query}
              onChange={(event) => updateParam('q', event.target.value.slice(0, 120))}
              placeholder="Название, поэт или описание"
              autoComplete="off"
              spellCheck="false"
              className="min-h-12 w-full rounded-2xl border border-white/[0.08] bg-black/28 pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-cyan-100/25 hover:border-white/[0.14] focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/10"
            />
            {query && (
              <button
                type="button"
                onClick={() => updateParam('q', '')}
                aria-label="Очистить поиск"
                className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-white/32 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </label>

          <label className="relative flex min-h-12 items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/28 px-4 text-xs text-cyan-100/45 transition hover:border-white/[0.14] focus-within:border-cyan-300/35 focus-within:ring-2 focus-within:ring-cyan-300/10">
            <SlidersHorizontal size={16} className="flex-none text-luxury-gold/75" />
            <span className="sr-only">Порядок релизов</span>
            <select
              value={sort}
              onChange={(event) => updateParam('sort', event.target.value, 'editorial')}
              className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-7 font-bold text-white/68 outline-none"
            >
              {sortOptions.map((option) => <option key={option.value} value={option.value} className="bg-[#0a0d10] text-white">{option.label}</option>)}
            </select>
            <CalendarDays size={14} className="pointer-events-none absolute right-4 text-cyan-100/26" />
          </label>
        </div>

        {poets.length > 1 && (
          <div className="relative mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Фильтр по поэту">
            <button
              type="button"
              onClick={() => updateParam('poet', '')}
              aria-pressed={!poetId}
              className={`inline-flex min-h-10 flex-none items-center gap-2 rounded-full border px-4 text-[10px] font-bold uppercase tracking-[0.12em] transition ${!poetId ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100' : 'border-white/[0.08] text-white/38 hover:border-white/[0.18] hover:text-white/72'}`}
            >
              <ListMusic size={14} /> Все
            </button>
            {poets.map((poet) => (
              <button
                key={poet.id}
                type="button"
                onClick={() => updateParam('poet', poetId === poet.id ? '' : poet.id)}
                aria-pressed={poetId === poet.id}
                className={`inline-flex min-h-10 flex-none items-center gap-2 rounded-full border px-4 text-[10px] font-bold uppercase tracking-[0.12em] transition ${poetId === poet.id ? 'border-luxury-gold/35 bg-luxury-gold/10 text-luxury-gold' : 'border-white/[0.08] text-white/38 hover:border-white/[0.18] hover:text-white/72'}`}
              >
                <UserRound size={14} /> {poet.name}
              </button>
            ))}
          </div>
        )}

        <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4 text-xs text-cyan-100/34">
          <div aria-live="polite">
            {searchPending ? 'Обновляем результаты…' : (
              <>
                Найдено: <strong className="font-bold text-white/66">{matchingTracks.length}</strong>
                {matchingTracks.length !== tracks.length && <span> из {tracks.length}</span>}
              </>
            )}
          </div>
          {filtersActive && (
            <button type="button" onClick={reset} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/[0.08] px-3 font-bold text-white/42 transition hover:border-white/[0.2] hover:text-white">
              <X size={14} /> Сбросить фильтры
            </button>
          )}
        </div>
      </div>

      {matchingTracks.length > 0 ? (
        <>
          <div className={`mt-6 grid gap-6 transition-opacity xl:grid-cols-2 ${searchPending ? 'opacity-55' : 'opacity-100'}`}>
            {renderedTracks.map((track) => <TrackReleaseCard key={track.id} track={track} />)}
          </div>
          {remainingCount > 0 && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleLimit((current) => current + PAGE_SIZE)}
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.025] px-6 text-xs font-bold text-white/58 shadow-[0_14px_45px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5 hover:border-cyan-300/28 hover:bg-cyan-300/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <ChevronDown size={17} /> Показать ещё {Math.min(PAGE_SIZE, remainingCount)}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-6 rounded-[2rem] border border-dashed border-white/[0.1] bg-white/[0.015] px-6 py-14 text-center">
          <Search className="mx-auto text-cyan-100/24" size={28} />
          <h3 className="mt-4 font-serif text-2xl font-bold text-white/78">Релизы не найдены</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-cyan-100/38">Попробуйте изменить запрос, выбрать другого поэта или вернуть редакционный порядок.</p>
          <button type="button" onClick={reset} className="mt-5 inline-flex min-h-11 items-center rounded-full bg-cyan-300 px-5 text-xs font-bold text-black transition hover:brightness-110">Показать весь архив</button>
        </div>
      )}
    </div>
  );
}
