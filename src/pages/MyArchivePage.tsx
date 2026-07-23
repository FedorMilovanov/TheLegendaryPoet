import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { Link } from '../components/ui/Link';
import { musicTracks, poets } from '../data/poets';
import type { Poem } from '../types/poet';
import Reveal from '../components/Reveal';
import ListeningArchiveItem from '../components/music/ListeningArchiveItem';
import { useAudioPlayer } from '../components/music/AudioPlayerProvider';
import { Star, Heart, BookOpen, ArrowRight, AudioWaveform } from '../components/PremiumIcons';
import { useFavoritePoems } from '../hooks/useFavoritePoems';
import { useSeo } from '../hooks/useSeo';
import { reconcileFavoritePoems, removeFavoritePoem } from '../utils/myArchiveStore';
import { titleCase } from '../utils/titleCase';

const PAGE_SIZE = 20;
const addedDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const poemIndex = new Map<string, { poem: Poem; poetName: string; poetId: string }>();
for (const poet of poets) {
  for (const poem of poet.poems) poemIndex.set(poem.id, { poem, poetName: poet.name, poetId: poet.id });
}
const validPoemIds = [...poemIndex.keys()];

function normalizeSearch(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLocaleLowerCase('ru-RU');
}

type ArchiveSort = 'date' | 'rating' | 'poet';

export default function MyArchivePage() {
  const favorites = useFavoritePoems();
  const { completedTrackIds, currentTrack, currentTime, getSavedPosition } = useAudioPlayer();
  const [sortBy, setSortBy] = useState<ArchiveSort>('date');
  const [query, setQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query);
  const searchPending = deferredQuery !== query;

  useSeo({
    title: 'Мой архив — THE LEGENDARY POET',
    description: 'Личная коллекция сохранённых стихотворений и музыкальных сессий, к которым можно вернуться.',
    path: '/archive',
    type: 'website',
  });

  useEffect(() => {
    reconcileFavoritePoems(validPoemIds);
  }, []);

  useEffect(() => {
    setVisibleLimit(PAGE_SIZE);
  }, [deferredQuery, sortBy]);

  const archivedPoems = useMemo(() => {
    const resolved = favorites
      .map((favorite) => {
        const entry = poemIndex.get(favorite.id);
        return entry ? { ...entry, addedAt: favorite.addedAt } : null;
      })
      .filter((entry): entry is { poem: Poem; poetName: string; poetId: string; addedAt: number } => Boolean(entry));

    return resolved.sort((left, right) => {
      if (sortBy === 'date') return right.addedAt - left.addedAt || left.poem.id.localeCompare(right.poem.id);
      if (sortBy === 'poet') return left.poetName.localeCompare(right.poetName, 'ru') || left.poem.title.localeCompare(right.poem.title, 'ru');
      return right.poem.rating - left.poem.rating || left.poem.title.localeCompare(right.poem.title, 'ru');
    });
  }, [favorites, sortBy]);

  const filteredPoems = useMemo(() => {
    const normalized = normalizeSearch(deferredQuery);
    if (!normalized) return archivedPoems;
    const terms = normalized.split(' ');
    return archivedPoems.filter(({ poem, poetName }) => {
      const haystack = normalizeSearch(`${poem.title} ${poetName} ${poem.year ?? ''}`);
      return terms.every((term) => haystack.includes(term));
    });
  }, [archivedPoems, deferredQuery]);

  const renderedPoems = filteredPoems.slice(0, visibleLimit);
  const hiddenPoemCount = Math.max(0, filteredPoems.length - renderedPoems.length);

  const topPoet = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { poetName } of archivedPoems) counts.set(poetName, (counts.get(poetName) ?? 0) + 1);
    return [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'ru'))[0] ?? null;
  }, [archivedPoems]);

  const listeningEntries = useMemo(() => musicTracks
    .map((track) => ({
      track,
      completed: completedTrackIds.has(track.id),
      position: currentTrack?.id === track.id ? currentTime : getSavedPosition(track.id),
    }))
    .filter((entry) => entry.completed || entry.position >= 8)
    .sort((left, right) => {
      if (left.completed !== right.completed) return left.completed ? 1 : -1;
      return left.track.releaseOrder - right.track.releaseOrder;
    }), [completedTrackIds, currentTime, currentTrack?.id, getSavedPosition]);

  const hasAnyArchive = archivedPoems.length > 0 || listeningEntries.length > 0;
  const authorCount = new Set(archivedPoems.map((entry) => entry.poetId)).size;

  if (!hasAnyArchive) {
    return (
      <div className="min-h-screen bg-[#050505] pb-20 pt-32">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Reveal direction="up">
            <BookOpen size={64} className="mx-auto mb-6 text-cyan-400/20" />
            <h1 className="mb-4 font-serif text-4xl font-bold text-white">{titleCase('Архив')} <span className="neon-blue-gradient neon-glow-text">{titleCase('пуст')}</span></h1>
            <p className="mx-auto mb-8 max-w-lg text-base leading-relaxed text-cyan-100/45">
              Сохраняйте стихотворения и продолжайте музыкальные публикации с того места, где остановились. Всё остаётся только в вашем браузере.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/poets" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-cyan-400/10 px-6 text-sm font-bold uppercase tracking-[0.14em] text-cyan-300 transition hover:bg-cyan-400/15">
                Перейти к поэтам <ArrowRight size={16} />
              </Link>
              <Link to="/music" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-6 text-sm font-bold uppercase tracking-[0.14em] text-white/52 transition hover:border-white/25 hover:text-white">
                Открыть музыку <AudioWaveform size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-24 pt-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal direction="up">
          <div className="section-label mb-2">Личная коллекция</div>
          <h1 className="mb-4 font-serif text-5xl font-bold text-white">{titleCase('Мой')} <span className="neon-blue-gradient neon-glow-text">{titleCase('Архив')}</span></h1>
          <p className="max-w-2xl text-sm leading-relaxed text-cyan-100/42">Сохранённые стихи и музыка, к которой можно вернуться. Данные синхронизируются между вкладками этого браузера, но не отправляются в публичный рейтинг.</p>
        </Reveal>

        <div className="mb-10 mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="luxury-card rounded-2xl p-5 text-center">
            <div className="text-3xl font-bold text-white">{archivedPoems.length}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100/40">Стихов сохранено</div>
          </div>
          <div className="luxury-card rounded-2xl p-5 text-center">
            <div className="text-3xl font-bold text-white">{authorCount}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100/40">Авторов</div>
          </div>
          <div className="luxury-card col-span-2 rounded-2xl p-5 text-center sm:col-span-1">
            <div className="text-3xl font-bold text-luxury-gold">{listeningEntries.length}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100/40">Музыкальных сессий</div>
          </div>
        </div>

        {listeningEntries.length > 0 && (
          <section className="mb-14" aria-labelledby="listening-archive-title">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-luxury-gold/70">Сохранённые сессии</div>
                <h2 id="listening-archive-title" className="font-serif text-3xl font-bold text-white">Вернуться к музыке</h2>
              </div>
              <Link to="/music" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs font-bold text-white/45 transition hover:border-white/24 hover:text-white">Весь аудиоархив <ArrowRight size={14} /></Link>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {listeningEntries.map((entry) => <ListeningArchiveItem key={entry.track.id} {...entry} />)}
            </div>
          </section>
        )}

        {archivedPoems.length > 0 && (
          <section aria-labelledby="saved-poems-title" aria-busy={searchPending}>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300/55">Личная библиотека</div>
                <h2 id="saved-poems-title" className="font-serif text-3xl font-bold text-white">Сохранённые стихи</h2>
              </div>
              {topPoet && <div className="text-xs text-cyan-100/35">Чаще всего: <strong className="font-bold text-luxury-gold/80">{topPoet[0]}</strong> · {topPoet[1]}</div>}
            </div>

            <div className="mb-6 grid gap-3 rounded-[1.7rem] border border-white/[0.07] bg-white/[0.018] p-4 sm:grid-cols-[1fr_auto]">
              <label className="group relative block">
                <span className="sr-only">Поиск по сохранённым стихам</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/25 transition group-focus-within:text-cyan-300" size={17} />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value.slice(0, 120))}
                  placeholder="Название, автор или год"
                  autoComplete="off"
                  className="min-h-11 w-full rounded-2xl border border-white/[0.08] bg-black/24 pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-white/22 focus:border-cyan-300/30 focus:ring-2 focus:ring-cyan-300/10"
                />
                {query && <button type="button" onClick={() => setQuery('')} aria-label="Очистить поиск" className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/30 transition hover:bg-white/[0.06] hover:text-white"><X size={15} /></button>}
              </label>

              <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Сортировка сохранённых стихов">
                {[
                  { key: 'date' as const, label: 'По дате' },
                  { key: 'rating' as const, label: 'По рейтингу' },
                  { key: 'poet' as const, label: 'По автору' },
                ].map((option) => (
                  <button key={option.key} type="button" onClick={() => setSortBy(option.key)} aria-pressed={sortBy === option.key} className={`min-h-11 flex-none rounded-full border px-3.5 text-[10px] font-bold uppercase tracking-[0.12em] transition ${sortBy === option.key ? 'border-cyan-400/30 bg-cyan-400/15 text-cyan-300' : 'border-transparent text-white/40 hover:border-white/10 hover:text-white'}`}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4 text-xs text-cyan-100/32" aria-live="polite">{searchPending ? 'Обновляем результаты…' : <>Найдено: <strong className="text-white/60">{filteredPoems.length}</strong>{filteredPoems.length !== archivedPoems.length && ` из ${archivedPoems.length}`}</>}</div>

            {filteredPoems.length > 0 ? (
              <>
                <div className={`space-y-3 transition-opacity ${searchPending ? 'opacity-55' : 'opacity-100'}`}>
                  {renderedPoems.map(({ poem, poetName, poetId, addedAt }) => (
                    <article key={poem.id} className="luxury-card flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                      <div className="min-w-0 flex-1">
                        <Link to={`/poets/${poetId}#poem-${poem.id}`} className="font-serif text-lg font-semibold text-white transition-colors hover:text-luxury-gold">«{poem.title}»</Link>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3">
                          <Link to={`/poets/${poetId}`} className="text-xs text-luxury-gold transition-colors hover:text-luxury-gold-light">{poetName}</Link>
                          {poem.year && <span className="text-[10px] text-cyan-100/30">{poem.year}</span>}
                          <span className="text-[10px] text-white/24">Добавлено: {addedAt > 0 ? addedDateFormatter.format(addedAt) : 'дата неизвестна'}</span>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-3">
                        <div className="flex items-center gap-1 text-luxury-gold"><Star size={14} className="fill-luxury-gold" /><span className="text-sm font-bold">{poem.rating}</span></div>
                        <button type="button" onClick={() => removeFavoritePoem(poem.id)} className="rounded-full p-2 text-white/25 transition hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300" aria-label={`Удалить «${poem.title}» из архива`} title="Удалить из архива"><Heart size={16} className="fill-current" /></button>
                      </div>
                    </article>
                  ))}
                </div>
                {hiddenPoemCount > 0 && (
                  <div className="mt-7 flex justify-center">
                    <button type="button" onClick={() => setVisibleLimit((current) => current + PAGE_SIZE)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-5 text-xs font-bold text-white/48 transition hover:border-cyan-300/25 hover:text-white"><ChevronDown size={16} /> Показать ещё {Math.min(PAGE_SIZE, hiddenPoemCount)}</button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-[1.7rem] border border-dashed border-white/[0.09] px-6 py-12 text-center">
                <Search className="mx-auto text-white/18" size={27} />
                <h3 className="mt-4 font-serif text-2xl font-bold text-white/72">Ничего не найдено</h3>
                <p className="mt-2 text-sm text-cyan-100/35">Измените запрос или очистите поиск.</p>
                <button type="button" onClick={() => setQuery('')} className="mt-5 inline-flex min-h-10 items-center rounded-full bg-cyan-300 px-4 text-xs font-bold text-black">Показать все стихи</button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
