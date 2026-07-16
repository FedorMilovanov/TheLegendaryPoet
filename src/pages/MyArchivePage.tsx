import { useMemo, useState, useSyncExternalStore } from 'react';
import { Link } from '../components/ui/Link';
import {
  getFavoritePoems,
  subscribeArchive,
  toggleFavoritePoem,
} from '../utils/myArchiveStore';
import { poets } from '../data/poets';
import type { Poem } from '../types/poet';
import Reveal from '../components/Reveal';
import { Star, Heart, BookOpen, ArrowRight } from '../components/PremiumIcons';
import { titleCase } from '../utils/titleCase';
import { pluralRu } from '../utils/feedbackValidation';
import { useSeo } from '../hooks/useSeo';

export default function MyArchivePage() {
  useSeo({
    title: 'Мой Архив — THE LEGENDARY POET',
    description: 'Личная коллекция сохранённых стихов на этом устройстве.',
    path: '/archive',
    // Per-device localStorage content — not a public indexable catalogue.
    robots: 'noindex, nofollow',
  });

  const favorites = useSyncExternalStore(subscribeArchive, getFavoritePoems, getFavoritePoems);
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'poet'>('date');

  const archivedPoems = useMemo(() => {
    // O(poets × poems) once; poem count is small and fixed.
    const byId = new Map<string, { poem: Poem; poetName: string; poetId: string }>();
    for (const poet of poets) {
      for (const poem of poet.poems) {
        byId.set(poem.id, { poem, poetName: poet.name, poetId: poet.id });
      }
    }

    const list = favorites
      .map((fav) => {
        const hit = byId.get(fav.id);
        if (!hit) return null;
        return { ...hit, addedAt: fav.addedAt };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return list.sort((a, b) => {
      if (sortBy === 'date') return b.addedAt - a.addedAt;
      if (sortBy === 'poet') return a.poetName.localeCompare(b.poetName, 'ru');
      return b.poem.rating - a.poem.rating;
    });
  }, [favorites, sortBy]);

  const topPoet = useMemo(() => {
    const counts: Record<string, number> = {};
    archivedPoems.forEach(({ poetName }) => {
      counts[poetName] = (counts[poetName] || 0) + 1;
    });
    const entries = Object.entries(counts);
    if (!entries.length) return null;
    return entries.sort((a, b) => b[1] - a[1])[0];
  }, [archivedPoems]);

  const handleRemove = (poemId: string) => {
    toggleFavoritePoem(poemId);
  };

  if (!archivedPoems.length) {
    return (
      <div className="min-h-screen bg-[#050505] pb-20 pt-32">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Reveal direction="up">
            <BookOpen size={64} className="mx-auto mb-6 text-cyan-400/20" />
            <h1 className="mb-4 font-serif text-4xl font-bold text-white">
              {titleCase('Архив')}{' '}
              <span className="neon-blue-gradient neon-glow-text">{titleCase('пуст')}</span>
            </h1>
            <p className="mx-auto mb-8 max-w-md text-base text-cyan-100/45">
              Сохраняйте стихи, которые вас тронули. Нажмите «В архив» на странице любого
              стихотворения — коллекция живёт на этом устройстве.
            </p>
            <Link
              to="/poets"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-400/10 px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-cyan-300 transition hover:bg-cyan-400/15"
            >
              Перейти к поэтам <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-20 pt-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Reveal direction="up">
          <div className="section-label mb-2">Личная коллекция</div>
          <h1 className="mb-4 font-serif text-5xl font-bold text-white">
            {titleCase('Мой')}{' '}
            <span className="neon-blue-gradient neon-glow-text">{titleCase('Архив')}</span>
          </h1>
        </Reveal>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="luxury-card rounded-2xl p-5 text-center">
            <div className="text-3xl font-bold tabular-nums text-white">{archivedPoems.length}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100/40">
              {pluralRu(archivedPoems.length, 'Стих сохранён', 'Стиха сохранено', 'Стихов сохранено')}
            </div>
          </div>
          <div className="luxury-card rounded-2xl p-5 text-center">
            <div className="text-3xl font-bold tabular-nums text-white">
              {new Set(archivedPoems.map((p) => p.poetName)).size}
            </div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100/40">
              Авторов
            </div>
          </div>
          {topPoet && (
            <div className="luxury-card col-span-2 rounded-2xl p-5 text-center sm:col-span-1">
              <div className="truncate text-lg font-bold text-luxury-gold">{topPoet[0]}</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100/40">
                Любимый поэт ({topPoet[1]})
              </div>
            </div>
          )}
        </div>

        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-100/35">Сортировка</p>
          <div className="flex gap-1.5" role="group" aria-label="Сортировка архива">
            {(
              [
                { key: 'date' as const, label: 'По дате' },
                { key: 'rating' as const, label: 'По рейтингу' },
                { key: 'poet' as const, label: 'По автору' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSortBy(opt.key)}
                aria-pressed={sortBy === opt.key}
                className={`rounded-full px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                  sortBy === opt.key
                    ? 'border border-cyan-400/30 bg-cyan-400/15 text-cyan-300'
                    : 'border border-transparent text-white/40 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {archivedPoems.map(({ poem, poetName, poetId, addedAt }) => (
            <div
              key={poem.id}
              className="luxury-card flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
            >
              <div className="min-w-0 flex-1">
                <Link
                  to={`/poets/${poetId}#poem-${poem.id}`}
                  className="font-serif text-lg font-semibold text-white transition-colors hover:text-luxury-gold"
                >
                  «{poem.title}»
                </Link>
                <div className="mt-1.5 flex items-center gap-3">
                  <Link
                    to={`/poets/${poetId}`}
                    className="text-xs text-luxury-gold transition-colors hover:text-luxury-gold-light"
                  >
                    {poetName}
                  </Link>
                  {poem.year && <span className="text-[10px] text-cyan-100/30">{poem.year}</span>}
                </div>
                <p className="mt-1 text-[10px] text-white/25">
                  Добавлено:{' '}
                  {new Date(addedAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <div className="flex items-center gap-1 text-luxury-gold">
                  <Star size={14} className="text-luxury-gold" />
                  <span className="text-sm font-bold tabular-nums">{poem.rating}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(poem.id)}
                  className="rounded-full p-2 text-white/25 transition hover:bg-red-500/10 hover:text-red-400"
                  aria-label={`Удалить «${poem.title}» из архива`}
                  title="Удалить из архива"
                >
                  <Heart size={16} className="text-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
