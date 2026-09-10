import { useMemo, useSyncExternalStore } from 'react';
import {
  ArrowRight,
  Award,
  BarChart3,
  Cloud,
  CloudOff,
  Crown,
  Filter,
  LoaderCircle,
  MessageSquare,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { Link } from '../components/ui/Link';
import { poets } from '../data/poets';
import { poetRatingDimensions } from '../data/ratingDimensions';
import { useSeo } from '../hooks/useSeo';
import { useRatingsUrlState, type RatingsSortKey } from '../hooks/useRatingsUrlState';
import { asset } from '../utils/asset';
import {
  getCommunitySyncSnapshot,
  subscribeCommunitySync,
} from '../utils/communityStore';
import { useCommunityLeaderboard } from '../hooks/useCommunityLeaderboard';
import { compareEditorialRankingRows, compareReaderRankingRows } from '../utils/ratingRanking';
import {
  hasQualifiedRatingSample,
  READER_RANKING_MIN_VOTES,
  sampleAwareRatingIndex,
} from '../utils/ratingMethod';
type SortKey = RatingsSortKey;

const sortOptions: Array<{ value: SortKey; label: string }> = [
  { value: 'reader', label: 'Индекс читателей' },
  { value: 'votes', label: 'Число голосов' },
  { value: 'discussion', label: 'Обсуждение' },
  { value: 'consensus', label: 'Единодушие' },
  { value: 'editorial', label: 'Оценка редакции' },
];

type RankedPoet = {
  poet: (typeof poets)[number];
  votes: number;
  comments: number;
  rawScore: number | null;
  readerScore: number | null;
  deviation: number | null;
  dimensions: Record<string, number>;
  dimensionIndexes: Record<string, number | null>;
};

function fmt(value: number | null, digits = 2) {
  return value === null ? '—' : value.toFixed(digits);
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLocaleLowerCase('ru-RU');
}

function readerRankSource(row: RankedPoet) {
  return {
    id: row.poet.id,
    name: row.poet.name,
    readerScore: row.readerScore,
    votes: row.votes,
  };
}

function editorialRankSource(row: RankedPoet) {
  return {
    id: row.poet.id,
    name: row.poet.name,
    editorialScore: row.poet.rating,
  };
}

export default function RatingsPage() {
  useSeo({
    title: 'Рейтинг поэтов — THE LEGENDARY POET',
    description: 'Сводный читательский рейтинг русских поэтов: оценки по языку, глубине, наследию и правде, комментарии и прозрачная методика.',
    path: '/ratings',
  });

  const poetIds = useMemo(() => poets.map((poet) => poet.id), []);
  const leaderboard = useCommunityLeaderboard(poetIds);
  const sync = useSyncExternalStore(subscribeCommunitySync, getCommunitySyncSnapshot, getCommunitySyncSnapshot);
  const tags = useMemo(
    () => Array.from(new Set(poets.flatMap((poet) => poet.tags))).sort((left, right) => left.localeCompare(right, 'ru')),
    [],
  );
  const {
    sortBy,
    setSortBy,
    tag,
    setTag,
    ratedOnly,
    setRatedOnly,
    query,
    setQuery,
    resetFilters,
  } = useRatingsUrlState(tags);

  const aggregateById = useMemo(
    () => new Map(leaderboard.aggregates.map((aggregate) => [aggregate.targetId, aggregate])),
    [leaderboard.aggregates],
  );
  const totalVotes = leaderboard.aggregates.reduce((sum, aggregate) => sum + aggregate.ratingCount, 0);

  const rows = useMemo<RankedPoet[]>(() => poets.map((poet) => {
    const aggregate = aggregateById.get(poet.id);
    const votes = aggregate?.ratingCount ?? 0;
    const comments = aggregate?.commentCount ?? 0;
    const rawScore = votes ? aggregate?.overall ?? null : null;
    const readerScore = sampleAwareRatingIndex(rawScore, votes);
    const dimensions = aggregate?.dimensions ?? {};
    const dimensionIndexes = Object.fromEntries(poetRatingDimensions.map((dimension) => {
      const raw = dimensions[dimension.key];
      return [dimension.key, sampleAwareRatingIndex(typeof raw === 'number' ? raw : null, votes)];
    }));

    return {
      poet,
      votes,
      comments,
      rawScore,
      readerScore,
      deviation: aggregate?.deviation ?? null,
      dimensions,
      dimensionIndexes,
    };
  }), [aggregateById]);

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);
    return rows
      .filter((row) => !tag || row.poet.tags.includes(tag))
      .filter((row) => !ratedOnly || row.votes > 0)
      .filter((row) => {
        if (!normalizedQuery) return true;
        const haystack = normalizeSearch(`${row.poet.name} ${row.poet.fullName} ${row.poet.tags.join(' ')}`);
        return normalizedQuery.split(' ').every((term) => haystack.includes(term));
      })
      .sort((left, right) => {
        let result = 0;
        if (sortBy === 'votes') result = right.votes - left.votes || (right.readerScore ?? -1) - (left.readerScore ?? -1);
        else if (sortBy === 'discussion') result = right.comments - left.comments || right.votes - left.votes;
        else if (sortBy === 'editorial') result = compareEditorialRankingRows(editorialRankSource(left), editorialRankSource(right));
        else if (sortBy === 'consensus') result = (left.deviation ?? 999) - (right.deviation ?? 999) || right.votes - left.votes;
        else result = compareReaderRankingRows(readerRankSource(left), readerRankSource(right));
        return result || left.poet.name.localeCompare(right.poet.name, 'ru') || left.poet.id.localeCompare(right.poet.id);
      });
  }, [query, ratedOnly, rows, sortBy, tag]);

  const ratedRows = rows.filter((row) => row.votes > 0);
  const qualifiedRows = rows.filter((row) => row.readerScore !== null);
  const topReader = qualifiedRows.slice().sort((left, right) => compareReaderRankingRows(readerRankSource(left), readerRankSource(right)))[0];
  const mostDiscussed = rows.slice().sort((left, right) => right.comments - left.comments || right.votes - left.votes)[0];
  const consensus = ratedRows.filter((row) => hasQualifiedRatingSample(row.votes) && row.deviation !== null).sort((left, right) => (left.deviation ?? 9) - (right.deviation ?? 9) || right.votes - left.votes)[0];
  const controversial = ratedRows.filter((row) => hasQualifiedRatingSample(row.votes) && row.deviation !== null).sort((left, right) => (right.deviation ?? 0) - (left.deviation ?? 0) || right.votes - left.votes)[0];
  const totalComments = leaderboard.aggregates.reduce((sum, aggregate) => sum + aggregate.commentCount, 0);

  const dimensionLeaders = poetRatingDimensions.map((dimension) => {
    const leader = ratedRows
      .filter((row) => hasQualifiedRatingSample(row.votes) && row.dimensionIndexes[dimension.key] !== null)
      .slice()
      .sort((left, right) => (right.dimensionIndexes[dimension.key] ?? 0) - (left.dimensionIndexes[dimension.key] ?? 0) || right.votes - left.votes || left.poet.name.localeCompare(right.poet.name, 'ru'))[0];
    return { ...dimension, leader };
  });

  const filtersActive = Boolean(query.trim() || tag || ratedOnly || sortBy !== 'reader');
  const syncBadge = (() => {
    if (sync.phase === 'local') return { Icon: ShieldCheck, spin: false, className: 'border-amber-400/20 bg-amber-400/8 text-amber-100/70', text: 'Сейчас показаны данные этого браузера; общий backend не подключён' };
    if (sync.phase === 'syncing' || sync.phase === 'idle') return { Icon: LoaderCircle, spin: true, className: 'border-cyan-400/20 bg-cyan-400/8 text-cyan-100/70', text: sync.message ?? 'Обновляем общую базу читательских оценок…' };
    if (sync.phase === 'offline') return { Icon: CloudOff, spin: false, className: 'border-amber-400/20 bg-amber-400/8 text-amber-100/70', text: sync.pendingCount > 0 ? `Связь временно недоступна; в очереди ${sync.pendingCount} изменений` : 'Сводный рейтинг временно недоступен; локальные изменения сохранены' };
    return { Icon: Cloud, spin: false, className: sync.pendingCount > 0 ? 'border-amber-400/20 bg-amber-400/8 text-amber-100/70' : 'border-emerald-400/20 bg-emerald-400/8 text-emerald-200', text: sync.pendingCount > 0 ? `Общая база подключена; в очереди ${sync.pendingCount} изменений` : 'Общая база синхронизирована для всех посетителей' };
  })();

  return (
    <div className="min-h-screen bg-[#050505] pb-24 pt-32 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="relative mb-12 overflow-hidden rounded-[2.5rem] border border-luxury-gold/15 bg-[radial-gradient(circle_at_15%_20%,rgba(212,175,55,0.16),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(0,212,255,0.12),transparent_32%),#071018] p-7 sm:p-10 lg:p-14">
          <div className="relative z-10 max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-luxury-gold/25 bg-luxury-gold/7 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-luxury-gold"><Trophy size={14} /> Живой читательский рейтинг</div>
            <h1 className="editorial-title mb-5 font-serif text-5xl font-bold leading-[0.95] sm:text-6xl lg:text-8xl">Поэты <span className="gold-gradient italic">в оценке читателей</span></h1>
            <p className="max-w-2xl text-base leading-relaxed text-cyan-100/60 sm:text-xl">Не один безымянный балл, а четыре понятных измерения: язык, глубина, наследие и правда. Место появляется после 3 голосов, а индекс консервативно снижает малые выборки — один случайный голос не может захватить первое место.</p>
            <div className={`mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs ${syncBadge.className}`} aria-live="polite"><syncBadge.Icon size={14} className={syncBadge.spin ? 'animate-spin' : ''} /> {syncBadge.text}</div>
          </div>
        </section>

        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, label: 'Поэтов в таблице', value: poets.length },
            { icon: Star, label: 'Голосов читателей', value: totalVotes },
            { icon: MessageSquare, label: 'Комментариев', value: totalComments },
            { icon: BarChart3, label: 'Поэтов с оценкой', value: ratedRows.length },
          ].map(({ icon: Icon, label, value }) => <div key={label} className="rounded-3xl border border-cyan-400/10 bg-[#07111a]/70 p-5"><Icon size={18} className="mb-5 text-cyan-300" /><div className="text-3xl font-bold">{value}</div><div className="mt-1 text-xs uppercase tracking-[0.16em] text-cyan-100/40">{label}</div></div>)}
        </section>

        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Highlight icon={Crown} label="Выбор читателей" row={topReader} value={topReader ? `${fmt(topReader.readerScore)} / 5` : 'Ждём голоса'} />
          <Highlight icon={MessageSquare} label="Самый обсуждаемый" row={mostDiscussed?.comments ? mostDiscussed : undefined} value={mostDiscussed?.comments ? `${mostDiscussed.comments} мнений` : 'Ждём обсуждение'} />
          <Highlight icon={Scale} label="Наибольшее единодушие" row={consensus} value={consensus ? `разброс ${fmt(consensus.deviation)}` : 'Нужно 3+ голоса'} />
          <Highlight icon={Sparkles} label="Самый спорный" row={controversial} value={controversial ? `разброс ${fmt(controversial.deviation)}` : 'Нужно 3+ голоса'} />
        </section>

        <section className="mb-8 rounded-[2rem] border border-cyan-400/10 bg-[#071018]/60 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200/55"><span className="inline-flex items-center gap-2"><Filter size={15} /> Настройка таблицы</span>{filtersActive && <button type="button" onClick={resetFilters} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/10 px-3 text-[10px] text-white/45 transition hover:text-white"><X size={13} /> Сбросить</button>}</div>
          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_auto]">
            <label className="group relative block">
              <span className="sr-only">Найти поэта в рейтинге</span>
              <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-100/28 transition group-focus-within:text-cyan-300" />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value.slice(0, 100))} placeholder="Имя поэта, направление или эпоха" autoComplete="off" spellCheck="false" className="min-h-11 w-full rounded-full border border-cyan-400/15 bg-[#050b12] pl-11 pr-10 text-sm text-cyan-100 outline-none transition placeholder:text-cyan-100/25 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/10" />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="Очистить поиск" className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/30 transition hover:bg-white/[0.06] hover:text-white"><X size={14} /></button>}
            </label>
            <div className="text-xs text-cyan-100/35 lg:self-center" aria-live="polite">Найдено: <strong className="text-white/65">{filtered.length}</strong> из {rows.length}</div>
          </div>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {sortOptions.map((option) => (
                <button key={option.value} type="button" onClick={() => setSortBy(option.value)} aria-pressed={sortBy === option.value} className={`min-h-11 flex-none rounded-full px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 ${sortBy === option.value ? 'bg-luxury-gold text-black' : 'border border-cyan-400/12 text-cyan-100/55 hover:text-white'}`}>{option.label}</button>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select value={tag} onChange={(event) => setTag(event.target.value)} aria-label="Фильтр по эпохе или направлению" className="min-h-11 rounded-full border border-cyan-400/15 bg-[#050b12] px-4 text-sm text-cyan-100 outline-none focus:border-cyan-300"><option value="">Все эпохи и направления</option>{tags.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-cyan-400/15 px-4 text-xs text-cyan-100/60"><input type="checkbox" checked={ratedOnly} onChange={(event) => setRatedOnly(event.target.checked)} className="accent-cyan-300" /> Только с голосами</label>
            </div>
          </div>
        </section>

        <section className="space-y-4 md:hidden" aria-label="Рейтинг поэтов">
          {filtered.map((row, index) => <MobileRankCard key={row.poet.id} row={row} rank={sortBy === 'reader' && row.readerScore === null ? null : index + 1} />)}
          {!filtered.length && <EmptyRatingResults onReset={resetFilters} />}
        </section>

        <section className="hidden overflow-hidden rounded-[2rem] border border-cyan-400/12 bg-[#061018]/65 md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead className="sticky top-20 z-10 bg-[#071018]/95 backdrop-blur-xl"><tr className="border-b border-cyan-400/10 text-left text-[10px] uppercase tracking-[0.16em] text-cyan-100/40"><th className="px-5 py-4">Место</th><th className="px-5 py-4">Поэт</th><th className="px-5 py-4">Индекс читателей</th><th className="px-5 py-4">Средний балл</th><th className="px-5 py-4">Голоса</th><th className="px-5 py-4">Комментарии</th><th className="px-5 py-4">Редакция</th><th className="px-5 py-4" title="Стандартное отклонение: чем меньше, тем ближе мнения читателей">Разброс</th></tr></thead>
              <tbody>{filtered.map((row, index) => {
                const readerPlace = sortBy === 'reader' && row.readerScore === null ? null : index + 1;
                return <tr key={row.poet.id} data-reader-status={row.votes === 0 ? 'unrated' : row.readerScore === null ? 'sample-pending' : 'qualified'} className="border-b border-cyan-400/7 transition hover:bg-cyan-400/[0.035]">
                <td className="px-5 py-4"><span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${readerPlace !== null && readerPlace <= 3 ? 'bg-luxury-gold text-black' : 'bg-cyan-950/30 text-cyan-100/50'}`}>{readerPlace ?? '—'}</span></td>
                <td className="px-5 py-4"><Link to={`/poets/${row.poet.id}`} className="group flex items-center gap-3"><img src={asset(row.poet.photo)} alt="" className="h-12 w-12 rounded-full object-cover object-[center_18%] ring-1 ring-luxury-gold/20" /><div><div className="font-serif text-lg font-bold text-white transition group-hover:text-luxury-gold">{row.poet.name}</div><div className="max-w-[260px] truncate text-xs text-cyan-100/35">{row.poet.tags.slice(0, 2).join(' · ')}</div></div></Link></td>
                <td className="px-5 py-4"><div className="font-bold text-luxury-gold">{row.readerScore === null ? '—' : `${fmt(row.readerScore)} / 5`}</div><div className="text-[10px] text-cyan-100/30">{row.readerScore === null ? (row.votes === 0 ? 'нет читательских голосов' : `нужно ${READER_RANKING_MIN_VOTES}+ голоса для места`) : 'консервативный индекс выборки'}</div></td>
                <td className="px-5 py-4 text-cyan-100/70">{row.rawScore === null ? '—' : `${fmt(row.rawScore)} / 5`}</td>
                <td className="px-5 py-4 text-cyan-100/60">{row.votes}</td>
                <td className="px-5 py-4 text-cyan-100/60">{row.comments}</td>
                <td className="px-5 py-4 text-cyan-100/60">{row.poet.rating.toFixed(1)} / 10</td>
                <td className="px-5 py-4 text-cyan-100/45">{row.deviation === null ? '—' : fmt(row.deviation)}</td>
              </tr>})}</tbody>
            </table>
          </div>
          {!filtered.length && <EmptyRatingResults onReset={resetFilters} />}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-luxury-gold/12 bg-luxury-gold/[0.035] p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-2 text-luxury-gold"><Award size={19} /><h2 className="font-serif text-2xl font-bold">Лидеры по отдельным качествам</h2></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {dimensionLeaders.map((item) => <div key={item.key} className="rounded-2xl border border-luxury-gold/10 bg-black/20 p-4"><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-luxury-gold/65">{item.label}</div><div className="mt-2 font-serif text-lg text-white">{item.leader?.poet.name ?? 'Пока нет данных'}</div><div className="text-xs text-cyan-100/35">{item.leader ? `${(item.leader.dimensionIndexes[item.key] ?? 0).toFixed(2)} / 5 · ${item.leader.votes} голосов` : `Нужно ${READER_RANKING_MIN_VOTES}+ голоса`}</div></div>)}
            </div>
          </div>
          <div className="rounded-[2rem] border border-cyan-400/12 bg-[#071018]/70 p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-2 text-cyan-300"><ShieldCheck size={19} /><h2 className="font-serif text-2xl font-bold text-white">Как считается место</h2></div>
            <p className="text-sm leading-relaxed text-cyan-100/55">Индекс читателей — консервативная оценка по шкале /5. Место появляется с 3 голосов. Для среднего балла m и числа голосов n индекс равен max(1, m − 4 × √(ln 5 / (2n))). Та же формула и порог применяются к лидерам по отдельным качествам. Это поправка на размер выборки, а не заявление о репрезентативности аудитории. Редакционная оценка /10 отображается отдельно и не участвует в читательских местах.</p>
            <Link to="/poets" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-cyan-300 px-5 text-xs font-bold uppercase tracking-[0.14em] text-black">Перейти к поэтам и голосовать <ArrowRight size={15} /></Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function EmptyRatingResults({ onReset }: { onReset: () => void }) {
  return <div className="p-12 text-center text-cyan-100/40"><Search className="mx-auto text-cyan-100/20" size={28} /><div className="mt-4 font-serif text-2xl font-bold text-white/72">Поэты не найдены</div><p className="mt-2 text-sm">Измените поиск или очистите фильтры.</p><button type="button" onClick={onReset} className="mt-5 inline-flex min-h-10 items-center rounded-full bg-cyan-300 px-4 text-xs font-bold text-black">Показать весь рейтинг</button></div>;
}

function MobileRankCard({ row, rank }: { row: RankedPoet; rank: number | null }) {
  return (
    <Link to={`/poets/${row.poet.id}`} data-reader-status={row.readerScore === null ? 'unrated' : 'rated'} className="group block rounded-[1.75rem] border border-cyan-400/10 bg-[#071018]/72 p-5 transition hover:border-luxury-gold/25">
      <div className="flex items-start gap-4">
        <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${rank !== null && rank <= 3 ? 'bg-luxury-gold text-black' : 'bg-cyan-950/35 text-cyan-100/55'}`}>{rank ?? '—'}</span>
        <img src={asset(row.poet.photo)} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover object-[center_18%] ring-1 ring-luxury-gold/20" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-serif text-xl font-bold text-white transition group-hover:text-luxury-gold">{row.poet.name}</h3>
          <p className="truncate text-xs text-cyan-100/35">{row.poet.tags.slice(0, 2).join(' · ')}</p>
        </div>
        <ArrowRight size={17} className="mt-2 shrink-0 text-cyan-300 transition group-hover:translate-x-1" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Metric label="Индекс читателей" value={row.readerScore === null ? '—' : `${fmt(row.readerScore)} / 5`} accent />
        <Metric label="Средний балл читателей" value={row.rawScore === null ? '—' : `${fmt(row.rawScore)} / 5`} />
        <Metric label="Голоса / мнения" value={`${row.votes} / ${row.comments}`} />
        <Metric label="Редакция" value={`${row.poet.rating.toFixed(1)} / 10`} />
      </div>
    </Link>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className="rounded-2xl border border-white/7 bg-black/20 p-3"><div className="text-[9px] font-bold uppercase tracking-[0.13em] text-cyan-100/30">{label}</div><div className={`mt-1 text-lg font-bold ${accent ? 'text-luxury-gold' : 'text-white/75'}`}>{value}</div></div>;
}

function Highlight({ icon: Icon, label, row, value }: { icon: typeof Trophy; label: string; row?: RankedPoet; value: string }) {
  return <div className="rounded-3xl border border-luxury-gold/12 bg-[linear-gradient(145deg,rgba(212,175,55,0.07),rgba(0,212,255,0.035))] p-5"><Icon size={18} className="mb-5 text-luxury-gold" /><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100/35">{label}</div><div className="mt-2 font-serif text-xl font-bold text-white">{row?.poet.name ?? 'Пока нет данных'}</div><div className="mt-1 text-xs text-luxury-gold/70">{value}</div></div>;
}
