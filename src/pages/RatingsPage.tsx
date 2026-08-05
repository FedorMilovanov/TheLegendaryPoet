import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'react-router';
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
import { asset } from '../utils/asset';
import {
  getCommunitySyncSnapshot,
  subscribeCommunitySync,
} from '../utils/communityStore';
import {
  getCommunityLeaderboardSnapshot,
  subscribeCommunityLeaderboard,
} from '../utils/communityLeaderboardStore';

const PRIOR_WEIGHT = 5;
type SortKey = 'reader' | 'votes' | 'discussion' | 'editorial' | 'consensus';
const SORT_KEYS = new Set<SortKey>(['reader', 'votes', 'discussion', 'editorial', 'consensus']);

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
  dimensionIndexes: Record<string, number>;
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

export default function RatingsPage() {
  useSeo({
    title: 'Рейтинг поэтов — THE LEGENDARY POET',
    description: 'Сводный читательский рейтинг русских поэтов: оценки по языку, глубине, наследию и правде, комментарии и прозрачная методика.',
    path: '/ratings',
  });

  const leaderboard = useSyncExternalStore(
    subscribeCommunityLeaderboard,
    getCommunityLeaderboardSnapshot,
    getCommunityLeaderboardSnapshot,
  );
  const sync = useSyncExternalStore(subscribeCommunitySync, getCommunitySyncSnapshot, getCommunitySyncSnapshot);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSort = searchParams.get('sort') as SortKey | null;
  const [sortBy, setSortBy] = useState<SortKey>(() => initialSort && SORT_KEYS.has(initialSort) ? initialSort : 'reader');
  const [tag, setTag] = useState(() => searchParams.get('tag') ?? '');
  const [ratedOnly, setRatedOnly] = useState(() => searchParams.get('rated') === '1');
  const [query, setQuery] = useState(() => searchParams.get('q')?.slice(0, 100) ?? '');

  useEffect(() => {
    const next = new URLSearchParams();
    if (query.trim()) next.set('q', query.trim());
    if (tag) next.set('tag', tag);
    if (sortBy !== 'reader') next.set('sort', sortBy);
    if (ratedOnly) next.set('rated', '1');
    setSearchParams(next, { replace: true });
  }, [query, ratedOnly, setSearchParams, sortBy, tag]);

  const aggregateByPoet = useMemo(
    () => new Map(leaderboard.rows.filter((row) => row.targetType === 'poet').map((row) => [row.targetId, row])),
    [leaderboard.rows],
  );
  const totalVotes = leaderboard.rows.reduce((sum, row) => sum + row.ratingCount, 0);
  const totalComments = leaderboard.rows.reduce((sum, row) => sum + row.commentCount, 0);
  const globalMean = totalVotes
    ? leaderboard.rows.reduce((sum, row) => sum + row.overall * row.ratingCount, 0) / totalVotes
    : 4.0;
  const globalDimensionMeans = Object.fromEntries(poetRatingDimensions.map((dimension) => {
    let total = 0;
    let count = 0;
    for (const row of leaderboard.rows) {
      const value = row.dimensions[dimension.key];
      if (!row.ratingCount || !Number.isFinite(value)) continue;
      total += value * row.ratingCount;
      count += row.ratingCount;
    }
    return [dimension.key, count ? total / count : globalMean];
  }));

  const rows = useMemo<RankedPoet[]>(() => poets.map((poet) => {
    const aggregate = aggregateByPoet.get(poet.id);
    const votes = aggregate?.ratingCount ?? 0;
    const rawScore = votes ? aggregate?.overall ?? null : null;
    const readerScore = votes && rawScore !== null
      ? (votes * rawScore + PRIOR_WEIGHT * globalMean) / (votes + PRIOR_WEIGHT)
      : null;
    const dimensionIndexes = Object.fromEntries(poetRatingDimensions.map((dimension) => {
      const raw = aggregate?.dimensions[dimension.key];
      const adjusted = votes && raw
        ? (votes * raw + PRIOR_WEIGHT * globalDimensionMeans[dimension.key]) / (votes + PRIOR_WEIGHT)
        : 0;
      return [dimension.key, adjusted];
    }));
    return {
      poet,
      votes,
      comments: aggregate?.commentCount ?? 0,
      rawScore,
      readerScore,
      deviation: aggregate?.deviation ?? null,
      dimensions: aggregate?.dimensions ?? {},
      dimensionIndexes,
    };
  }), [aggregateByPoet, globalDimensionMeans, globalMean]);

  const tags = useMemo(
    () => Array.from(new Set(poets.flatMap((poet) => poet.tags))).sort((left, right) => left.localeCompare(right, 'ru')),
    [],
  );

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
        else if (sortBy === 'editorial') result = right.poet.rating - left.poet.rating;
        else if (sortBy === 'consensus') result = (left.deviation ?? 999) - (right.deviation ?? 999) || right.votes - left.votes;
        else result = (right.readerScore ?? -1) - (left.readerScore ?? -1) || right.votes - left.votes || right.poet.rating - left.poet.rating;
        return result || left.poet.name.localeCompare(right.poet.name, 'ru') || left.poet.id.localeCompare(right.poet.id);
      });
  }, [query, ratedOnly, rows, sortBy, tag]);

  const ratedRows = rows.filter((row) => row.votes > 0);
  const topReader = ratedRows.slice().sort((left, right) => (right.readerScore ?? 0) - (left.readerScore ?? 0) || right.votes - left.votes)[0];
  const mostDiscussed = rows.slice().sort((left, right) => right.comments - left.comments || right.votes - left.votes)[0];
  const consensus = ratedRows.filter((row) => row.votes >= 3 && row.deviation !== null).sort((left, right) => (left.deviation ?? 9) - (right.deviation ?? 9) || right.votes - left.votes)[0];
  const controversial = ratedRows.filter((row) => row.votes >= 3 && row.deviation !== null).sort((left, right) => (right.deviation ?? 0) - (left.deviation ?? 0) || right.votes - left.votes)[0];
  const dimensionLeaders = poetRatingDimensions.map((dimension) => {
    const leader = ratedRows
      .slice()
      .sort((left, right) => (right.dimensionIndexes[dimension.key] ?? 0) - (left.dimensionIndexes[dimension.key] ?? 0) || right.votes - left.votes || left.poet.name.localeCompare(right.poet.name, 'ru'))[0];
    return { ...dimension, leader };
  });

  const filtersActive = Boolean(query.trim() || tag || ratedOnly || sortBy !== 'reader');
  const syncBadge = (() => {
    if (leaderboard.phase === 'local') return { Icon: ShieldCheck, spin: false, className: 'border-amber-400/20 bg-amber-400/8 text-amber-100/70', text: 'Сейчас показаны данные этого браузера; общий backend не подключён' };
    if (leaderboard.phase === 'loading') return { Icon: LoaderCircle, spin: true, className: 'border-cyan-400/20 bg-cyan-400/8 text-cyan-100/70', text: leaderboard.message ?? 'Загружаем агрегированный рейтинг…' };
    if (leaderboard.phase === 'offline') return { Icon: CloudOff, spin: false, className: 'border-amber-400/20 bg-amber-400/8 text-amber-100/70', text: leaderboard.message ?? 'Aggregate backend временно недоступен; raw corpus не загружался' };
    return { Icon: Cloud, spin: false, className: sync.pendingCount > 0 ? 'border-amber-400/20 bg-amber-400/8 text-amber-100/70' : 'border-emerald-400/20 bg-emerald-400/8 text-emerald-200', text: sync.pendingCount > 0 ? `Агрегированный рейтинг подключён; в очереди ${sync.pendingCount} изменений` : 'Агрегированный рейтинг синхронизирован' };
  })();

  const resetFilters = () => { setQuery(''); setTag(''); setRatedOnly(false); setSortBy('reader'); };

  return (
    <div className="min-h-screen bg-[#050505] pb-24 pt-32 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="relative mb-12 overflow-hidden rounded-[2.5rem] border border-luxury-gold/15 bg-[radial-gradient(circle_at_15%_20%,rgba(212,175,55,0.16),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(0,212,255,0.12),transparent_32%),#071018] p-7 sm:p-10 lg:p-14">
          <div className="relative z-10 max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-luxury-gold/25 bg-luxury-gold/7 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-luxury-gold"><Trophy size={14} /> Живой читательский рейтинг</div>
            <h1 className="editorial-title mb-5 font-serif text-5xl font-bold leading-[0.95] sm:text-6xl lg:text-8xl">Поэты <span className="gold-gradient italic">в оценке читателей</span></h1>
            <p className="max-w-2xl text-base leading-relaxed text-cyan-100/60 sm:text-xl">Не один безымянный балл, а четыре понятных измерения: язык, глубина, наследие и правда. Таблица учитывает размер выборки, поэтому один случайный голос не захватывает первое место.</p>
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
              {sortOptions.map((option) => <button key={option.value} type="button" onClick={() => setSortBy(option.value)} aria-pressed={sortBy === option.value} className={`min-h-11 flex-none rounded-full px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 ${sortBy === option.value ? 'bg-luxury-gold text-black' : 'border border-cyan-400/12 text-cyan-100/55 hover:text-white'}`}>{option.label}</button>)}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select value={tag} onChange={(event) => setTag(event.target.value)} aria-label="Фильтр по эпохе или направлению" className="min-h-11 rounded-full border border-cyan-400/15 bg-[#050b12] px-4 text-sm text-cyan-100 outline-none focus:border-cyan-300"><option value="">Все эпохи и направления</option>{tags.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-cyan-400/15 px-4 text-xs text-cyan-100/60"><input type="checkbox" checked={ratedOnly} onChange={(event) => setRatedOnly(event.target.checked)} className="accent-cyan-300" /> Только с голосами</label>
            </div>
          </div>
        </section>

        <section className="space-y-4 md:hidden" aria-label="Рейтинг поэтов">
          {filtered.map((row, index) => <MobileRankCard key={row.poet.id} row={row} rank={index + 1} />)}
          {!filtered.length && <EmptyRatingResults onReset={resetFilters} />}
        </section>

        <section className="hidden overflow-hidden rounded-[2rem] border border-cyan-400/12 bg-[#061018]/65 md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead className="sticky top-20 z-10 bg-[#071018]/95 backdrop-blur-xl"><tr className="border-b border-cyan-400/10 text-left text-[10px] uppercase tracking-[0.16em] text-cyan-100/40"><th className="px-5 py-4">Место</th><th className="px-5 py-4">Поэт</th><th className="px-5 py-4">Индекс читателей</th><th className="px-5 py-4">Средний балл</th><th className="px-5 py-4">Голоса</th><th className="px-5 py-4">Комментарии</th><th className="px-5 py-4">Редакция</th><th className="px-5 py-4" title="Стандартное отклонение: чем меньше, тем ближе мнения читателей">Разброс</th></tr></thead>
              <tbody>{filtered.map((row, index) => <tr key={row.poet.id} className="border-b border-cyan-400/7 transition hover:bg-cyan-400/[0.035]">
                <td className="px-5 py-4"><span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${index < 3 ? 'bg-luxury-gold text-black' : 'bg-cyan-950/30 text-cyan-100/50'}`}>{index + 1}</span></td>
                <td className="px-5 py-4"><Link to={`/poets/${row.poet.id}`} className="group flex items-center gap-3"><img src={asset(row.poet.photo)} alt="" className="h-12 w-12 rounded-full object-cover object-[center_18%] ring-1 ring-luxury-gold/20" /><div><div className="font-serif text-lg font-bold text-white transition group-hover:text-luxury-gold">{row.poet.name}</div><div className="max-w-[260px] truncate text-xs text-cyan-100/35">{row.poet.tags.slice(0, 2).join(' · ')}</div></div></Link></td>
                <td className="px-5 py-4"><div className="font-bold text-luxury-gold">{fmt(row.readerScore)}</div><div className="text-[10px] text-cyan-100/30">с поправкой на выборку</div></td>
                <td className="px-5 py-4 text-cyan-100/70">{fmt(row.rawScore)}</td>
                <td className="px-5 py-4 text-cyan-100/60">{row.votes}</td><td className="px-5 py-4 text-cyan-100/60">{row.comments}</td><td className="px-5 py-4 text-cyan-100/60">{row.poet.rating.toFixed(1)} / 10</td><td className="px-5 py-4 text-cyan-100/45">{row.deviation === null ? '—' : fmt(row.deviation)}</td>
              </tr>)}</tbody>
            </table>
          </div>
          {!filtered.length && <EmptyRatingResults onReset={resetFilters} />}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-luxury-gold/12 bg-luxury-gold/[0.035] p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-2 text-luxury-gold"><Award size={19} /><h2 className="font-serif text-2xl font-bold">Лидеры по отдельным качествам</h2></div>
            <div className="grid gap-3 sm:grid-cols-2">{dimensionLeaders.map((item) => <div key={item.key} className="rounded-2xl border border-luxury-gold/10 bg-black/20 p-4"><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-luxury-gold/65">{item.label}</div><div className="mt-2 font-serif text-lg text-white">{item.leader?.poet.name ?? 'Пока нет данных'}</div><div className="text-xs text-cyan-100/35">{item.leader ? `${item.leader.dimensionIndexes[item.key].toFixed(2)} / 5 · ${item.leader.votes} голосов` : item.hint}</div></div>)}</div>
          </div>
          <div className="rounded-[2rem] border border-cyan-400/12 bg-[#071018]/70 p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-2 text-cyan-300"><ShieldCheck size={19} /><h2 className="font-serif text-2xl font-bold text-white">Как считается место</h2></div>
            <p className="text-sm leading-relaxed text-cyan-100/55">Индекс читателей — байесовская оценка: фактический средний балл постепенно получает больший вес по мере роста числа голосов. До накопления выборки результат мягко тяготеет к общему среднему по сайту. Та же поправка применяется к лидерам по отдельным качествам. Редакционная оценка отображается отдельно и не подменяет мнение читателей.</p>
            <p className="mt-4 text-xs leading-relaxed text-cyan-100/35">Страница получает только агрегаты: число голосов и комментариев, средние значения, распределение и разброс. Тексты комментариев и отдельные голоса в рейтинг не загружаются.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function MobileRankCard({ row, rank }: { row: RankedPoet; rank: number }) {
  return (
    <Link to={`/poets/${row.poet.id}`} className="block rounded-3xl border border-cyan-400/10 bg-[#071018]/70 p-5 transition hover:border-luxury-gold/25">
      <div className="mb-5 flex items-center gap-4"><span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${rank <= 3 ? 'bg-luxury-gold text-black' : 'bg-cyan-950/30 text-cyan-100/50'}`}>{rank}</span><img src={asset(row.poet.photo)} alt="" className="h-14 w-14 rounded-full object-cover object-[center_18%]" /><div className="min-w-0 flex-1"><div className="truncate font-serif text-xl font-bold text-white">{row.poet.name}</div><div className="truncate text-xs text-cyan-100/35">{row.poet.tags.slice(0, 2).join(' · ')}</div></div><ArrowRight size={18} className="text-luxury-gold/55" /></div>
      <div className="grid grid-cols-2 gap-2"><Metric label="Индекс" value={fmt(row.readerScore)} accent /><Metric label="Средний" value={fmt(row.rawScore)} /><Metric label="Голоса" value={String(row.votes)} /><Metric label="Комментарии" value={String(row.comments)} /><Metric label="Разброс" value={fmt(row.deviation)} /><Metric label="Редакция" value={`${row.poet.rating.toFixed(1)} / 10`} /></div>
    </Link>
  );
}

function EmptyRatingResults({ onReset }: { onReset: () => void }) {
  return <div className="p-10 text-center"><Search size={26} className="mx-auto text-cyan-100/20" /><div className="mt-3 font-serif text-xl text-white">Ничего не найдено</div><p className="mt-2 text-sm text-cyan-100/40">Измените запрос или сбросьте фильтры.</p><button type="button" onClick={onReset} className="mt-5 min-h-10 rounded-full border border-luxury-gold/25 px-5 text-xs font-bold text-luxury-gold">Сбросить фильтры</button></div>;
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className="rounded-2xl border border-white/7 bg-black/20 p-3"><div className="text-[9px] font-bold uppercase tracking-[0.13em] text-cyan-100/30">{label}</div><div className={`mt-1 text-lg font-bold ${accent ? 'text-luxury-gold' : 'text-white/75'}`}>{value}</div></div>;
}

function Highlight({ icon: Icon, label, row, value }: { icon: typeof Trophy; label: string; row?: RankedPoet; value: string }) {
  return <div className="rounded-3xl border border-luxury-gold/12 bg-[linear-gradient(145deg,rgba(212,175,55,0.07),rgba(0,212,255,0.035))] p-5"><Icon size={18} className="mb-5 text-luxury-gold" /><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100/35">{label}</div><div className="mt-2 font-serif text-xl font-bold text-white">{row?.poet.name ?? 'Пока нет данных'}</div><div className="mt-1 text-xs text-luxury-gold/70">{value}</div></div>;
}
