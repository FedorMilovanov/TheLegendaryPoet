import { useMemo, useState, useSyncExternalStore } from 'react';
import {
  ArrowRight,
  Award,
  BarChart3,
  Crown,
  Filter,
  MessageSquare,
  Scale,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
import { Link } from '../components/ui/Link';
import { poets } from '../data/poets';
import { poetRatingDimensions } from '../data/ratingDimensions';
import { useSeo } from '../hooks/useSeo';
import { asset } from '../utils/asset';
import {
  averageScores,
  filterComments,
  filterRatings,
  getFeedbackSnapshot,
  isFeedbackShared,
  subscribeFeedback,
} from '../utils/communityStore';

const PRIOR_WEIGHT = 5;
type SortKey = 'reader' | 'votes' | 'discussion' | 'editorial' | 'consensus';

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

function ratingAverage(scores: Record<string, number>) {
  const values = Object.values(scores);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function standardDeviation(values: number[]) {
  if (values.length < 2) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
}

function fmt(value: number | null, digits = 2) {
  return value === null ? '—' : value.toFixed(digits);
}

export default function RatingsPage() {
  useSeo({
    title: 'Рейтинг поэтов — THE LEGENDARY POET',
    description: 'Сводный читательский рейтинг русских поэтов: оценки по языку, глубине, наследию и правде, комментарии и прозрачная методика.',
    path: '/ratings',
  });

  const snapshot = useSyncExternalStore(subscribeFeedback, getFeedbackSnapshot, getFeedbackSnapshot);
  const [sortBy, setSortBy] = useState<SortKey>('reader');
  const [tag, setTag] = useState('');
  const [ratedOnly, setRatedOnly] = useState(false);

  const allPoetRatings = useMemo(
    () => snapshot.ratings.filter((item) => item.targetType === 'poet'),
    [snapshot],
  );

  const globalMean = useMemo(() => {
    const values = allPoetRatings.map((rating) => ratingAverage(rating.scores)).filter((value) => value > 0);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 4.0;
  }, [allPoetRatings]);

  const globalDimensionMeans = useMemo(() => Object.fromEntries(
    poetRatingDimensions.map((dimension) => {
      const values = allPoetRatings
        .map((rating) => rating.scores[dimension.key])
        .filter((value): value is number => typeof value === 'number' && value > 0);
      return [dimension.key, values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : globalMean];
    }),
  ), [allPoetRatings, globalMean]);

  const rows = useMemo<RankedPoet[]>(() => poets.map((poet) => {
    const ratings = filterRatings(snapshot, 'poet', poet.id);
    const comments = filterComments(snapshot, 'poet', poet.id);
    const summary = averageScores(ratings);
    const averages = ratings.map((rating) => ratingAverage(rating.scores));
    const rawScore = ratings.length ? summary.overall : null;
    const readerScore = ratings.length
      ? (ratings.length * summary.overall + PRIOR_WEIGHT * globalMean) / (ratings.length + PRIOR_WEIGHT)
      : null;
    const dimensionIndexes = Object.fromEntries(poetRatingDimensions.map((dimension) => {
      const raw = summary.dimensions[dimension.key];
      const adjusted = ratings.length && raw
        ? (ratings.length * raw + PRIOR_WEIGHT * globalDimensionMeans[dimension.key]) / (ratings.length + PRIOR_WEIGHT)
        : 0;
      return [dimension.key, adjusted];
    }));

    return {
      poet,
      votes: ratings.length,
      comments: comments.length,
      rawScore,
      readerScore,
      deviation: standardDeviation(averages),
      dimensions: summary.dimensions,
      dimensionIndexes,
    };
  }), [snapshot, globalMean, globalDimensionMeans]);

  const tags = useMemo(
    () => Array.from(new Set(poets.flatMap((poet) => poet.tags))).sort((a, b) => a.localeCompare(b, 'ru')),
    [],
  );

  const filtered = useMemo(() => rows
    .filter((row) => !tag || row.poet.tags.includes(tag))
    .filter((row) => !ratedOnly || row.votes > 0)
    .sort((a, b) => {
      if (sortBy === 'votes') return b.votes - a.votes || (b.readerScore ?? -1) - (a.readerScore ?? -1);
      if (sortBy === 'discussion') return b.comments - a.comments || b.votes - a.votes;
      if (sortBy === 'editorial') return b.poet.rating - a.poet.rating;
      if (sortBy === 'consensus') return (a.deviation ?? 999) - (b.deviation ?? 999) || b.votes - a.votes;
      return (b.readerScore ?? -1) - (a.readerScore ?? -1) || b.votes - a.votes || b.poet.rating - a.poet.rating;
    }), [rows, tag, ratedOnly, sortBy]);

  const ratedRows = rows.filter((row) => row.votes > 0);
  const topReader = ratedRows.slice().sort((a, b) => (b.readerScore ?? 0) - (a.readerScore ?? 0))[0];
  const mostDiscussed = rows.slice().sort((a, b) => b.comments - a.comments)[0];
  const consensus = ratedRows.filter((row) => row.votes >= 3 && row.deviation !== null).sort((a, b) => (a.deviation ?? 9) - (b.deviation ?? 9))[0];
  const controversial = ratedRows.filter((row) => row.votes >= 3 && row.deviation !== null).sort((a, b) => (b.deviation ?? 0) - (a.deviation ?? 0))[0];
  const totalComments = snapshot.comments.filter((item) => item.targetType === 'poet').length;

  const dimensionLeaders = poetRatingDimensions.map((dimension) => {
    const leader = ratedRows
      .slice()
      .sort((a, b) => (b.dimensionIndexes[dimension.key] ?? 0) - (a.dimensionIndexes[dimension.key] ?? 0) || b.votes - a.votes)[0];
    return { ...dimension, leader };
  });

  const sortOptions: Array<{ value: SortKey; label: string }> = [
    { value: 'reader', label: 'Индекс читателей' },
    { value: 'votes', label: 'Число голосов' },
    { value: 'discussion', label: 'Обсуждение' },
    { value: 'consensus', label: 'Единодушие' },
    { value: 'editorial', label: 'Оценка редакции' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] pb-24 pt-32 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="relative mb-12 overflow-hidden rounded-[2.5rem] border border-luxury-gold/15 bg-[radial-gradient(circle_at_15%_20%,rgba(212,175,55,0.16),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(0,212,255,0.12),transparent_32%),#071018] p-7 sm:p-10 lg:p-14">
          <div className="relative z-10 max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-luxury-gold/25 bg-luxury-gold/7 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-luxury-gold"><Trophy size={14} /> Живой читательский рейтинг</div>
            <h1 className="editorial-title mb-5 font-serif text-5xl font-bold leading-[0.95] sm:text-6xl lg:text-8xl">Поэты <span className="gold-gradient italic">в оценке читателей</span></h1>
            <p className="max-w-2xl text-base leading-relaxed text-cyan-100/60 sm:text-xl">Не один безымянный балл, а четыре понятных измерения: язык, глубина, наследие и правда. Таблица учитывает размер выборки, поэтому один случайный голос не захватывает первое место.</p>
            <div className={`mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs ${isFeedbackShared ? 'border-emerald-400/20 bg-emerald-400/8 text-emerald-200' : 'border-amber-400/20 bg-amber-400/8 text-amber-100/70'}`}><ShieldCheck size={14} /> {isFeedbackShared ? 'Общая база включена — результаты синхронизируются для всех' : 'Сейчас показаны данные этого браузера; общий backend не подключён'}</div>
          </div>
        </section>

        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, label: 'Поэтов в таблице', value: poets.length },
            { icon: Star, label: 'Голосов читателей', value: allPoetRatings.length },
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
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200/55"><Filter size={15} /> Настройка таблицы</div>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSortBy(option.value)}
                  aria-pressed={sortBy === option.value}
                  className={`min-h-11 rounded-full px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 ${sortBy === option.value ? 'bg-luxury-gold text-black' : 'border border-cyan-400/12 text-cyan-100/55 hover:text-white'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select value={tag} onChange={(event) => setTag(event.target.value)} aria-label="Фильтр по эпохе или направлению" className="min-h-11 rounded-full border border-cyan-400/15 bg-[#050b12] px-4 text-sm text-cyan-100 outline-none focus:border-cyan-300"><option value="">Все эпохи и направления</option>{tags.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-cyan-400/15 px-4 text-xs text-cyan-100/60"><input type="checkbox" checked={ratedOnly} onChange={(event) => setRatedOnly(event.target.checked)} className="accent-cyan-300" /> Только с голосами</label>
            </div>
          </div>
        </section>

        <section className="space-y-4 md:hidden" aria-label="Рейтинг поэтов">
          {filtered.map((row, index) => <MobileRankCard key={row.poet.id} row={row} rank={index + 1} />)}
          {!filtered.length && <div className="rounded-3xl border border-cyan-400/10 p-12 text-center text-cyan-100/40">Нет поэтов, подходящих под выбранные фильтры.</div>}
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
                <td className="px-5 py-4 text-cyan-100/60">{row.votes}</td>
                <td className="px-5 py-4 text-cyan-100/60">{row.comments}</td>
                <td className="px-5 py-4 text-cyan-100/60">{row.poet.rating.toFixed(1)} / 10</td>
                <td className="px-5 py-4 text-cyan-100/45">{row.deviation === null ? '—' : fmt(row.deviation)}</td>
              </tr>)}</tbody>
            </table>
          </div>
          {!filtered.length && <div className="p-16 text-center text-cyan-100/40">Нет поэтов, подходящих под выбранные фильтры.</div>}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-luxury-gold/12 bg-luxury-gold/[0.035] p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-2 text-luxury-gold"><Award size={19} /><h2 className="font-serif text-2xl font-bold">Лидеры по отдельным качествам</h2></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {dimensionLeaders.map((item) => <div key={item.key} className="rounded-2xl border border-luxury-gold/10 bg-black/20 p-4"><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-luxury-gold/65">{item.label}</div><div className="mt-2 font-serif text-lg text-white">{item.leader?.poet.name ?? 'Пока нет данных'}</div><div className="text-xs text-cyan-100/35">{item.leader ? `${item.leader.dimensionIndexes[item.key].toFixed(2)} / 5 · ${item.leader.votes} голосов` : item.hint}</div></div>)}
            </div>
          </div>
          <div className="rounded-[2rem] border border-cyan-400/12 bg-[#071018]/70 p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-2 text-cyan-300"><ShieldCheck size={19} /><h2 className="font-serif text-2xl font-bold text-white">Как считается место</h2></div>
            <p className="text-sm leading-relaxed text-cyan-100/55">Индекс читателей — байесовская оценка: фактический средний балл постепенно получает больший вес по мере роста числа голосов. До накопления выборки результат мягко тяготеет к общему среднему по сайту. Та же поправка применяется к лидерам по отдельным качествам. Редакционная оценка отображается отдельно и не подменяет мнение читателей.</p>
            <Link to="/poets" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-cyan-300 px-5 text-xs font-bold uppercase tracking-[0.14em] text-black">Перейти к поэтам и голосовать <ArrowRight size={15} /></Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function MobileRankCard({ row, rank }: { row: RankedPoet; rank: number }) {
  return (
    <Link to={`/poets/${row.poet.id}`} className="group block rounded-[1.75rem] border border-cyan-400/10 bg-[#071018]/72 p-5 transition hover:border-luxury-gold/25">
      <div className="flex items-start gap-4">
        <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${rank <= 3 ? 'bg-luxury-gold text-black' : 'bg-cyan-950/35 text-cyan-100/55'}`}>{rank}</span>
        <img src={asset(row.poet.photo)} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover object-[center_18%] ring-1 ring-luxury-gold/20" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-serif text-xl font-bold text-white transition group-hover:text-luxury-gold">{row.poet.name}</h3>
          <p className="truncate text-xs text-cyan-100/35">{row.poet.tags.slice(0, 2).join(' · ')}</p>
        </div>
        <ArrowRight size={17} className="mt-2 shrink-0 text-cyan-300 transition group-hover:translate-x-1" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Metric label="Индекс читателей" value={fmt(row.readerScore)} accent />
        <Metric label="Средний балл" value={fmt(row.rawScore)} />
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
