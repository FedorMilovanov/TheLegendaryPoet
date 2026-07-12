import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getFavoritePoems, toggleFavoritePoem } from '../utils/myArchiveStore';
import { poets } from '../data/poets';
import { Poem } from '../types/poet';
import Reveal from '../components/Reveal';
import { Star, Heart, BookOpen, ArrowRight } from '../components/PremiumIcons';

export default function MyArchivePage() {
  const [version, setVersion] = useState(0);
  const favorites = useMemo(() => getFavoritePoems(), [version]);
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'poet'>('date');

  const archivedPoems = useMemo(() => {
    const poemList: Array<{ poem: Poem; poetName: string; poetId: string; addedAt: number }> = [];
    
    favorites.forEach(fav => {
      poets.forEach(poet => {
        const foundPoem = poet.poems.find(p => p.id === fav.id);
        if (foundPoem) {
          poemList.push({ poem: foundPoem, poetName: poet.name, poetId: poet.id, addedAt: fav.addedAt });
        }
      });
    });

    return poemList.sort((a, b) => {
      if (sortBy === 'date') return b.addedAt - a.addedAt;
      if (sortBy === 'poet') return a.poetName.localeCompare(b.poetName, 'ru');
      return b.poem.rating - a.poem.rating;
    });
  }, [favorites, sortBy]);

  const topPoet = useMemo(() => {
    const counts: Record<string, number> = {};
    archivedPoems.forEach(({ poetName }) => { counts[poetName] = (counts[poetName] || 0) + 1; });
    const entries = Object.entries(counts);
    if (!entries.length) return null;
    return entries.sort((a, b) => b[1] - a[1])[0];
  }, [archivedPoems]);

  const handleRemove = (poemId: string) => {
    toggleFavoritePoem(poemId);
    setVersion(v => v + 1);
  };

  if (!archivedPoems.length) {
    return (
      <div className="min-h-screen bg-[#050505] pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Reveal direction="up">
            <BookOpen size={64} className="mx-auto mb-6 text-cyan-400/20" />
            <h1 className="mb-4 font-serif text-4xl font-bold text-white">Архив <span className="neon-blue-gradient neon-glow-text">пуст</span></h1>
            <p className="mb-8 text-base text-cyan-100/45 max-w-md mx-auto">
              Сохраняйте стихи, которые вас тронули. Нажмите «В архив» на странице любого стихотворения.
            </p>
            <Link to="/poets" className="inline-flex items-center gap-2 rounded-full bg-cyan-400/10 px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-cyan-300 transition hover:bg-cyan-400/15">
              Перейти к поэтам <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Reveal direction="up">
          <div className="section-label mb-2">Личная коллекция</div>
          <h1 className="mb-4 font-serif text-5xl font-bold text-white">Мой <span className="neon-blue-gradient neon-glow-text">Архив</span></h1>
        </Reveal>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="luxury-card rounded-2xl p-5 text-center">
            <div className="text-3xl font-bold text-white">{archivedPoems.length}</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100/40 mt-1">Стихов сохранено</div>
          </div>
          <div className="luxury-card rounded-2xl p-5 text-center">
            <div className="text-3xl font-bold text-white">{new Set(archivedPoems.map(p => p.poetName)).size}</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100/40 mt-1">Авторов</div>
          </div>
          {topPoet && (
            <div className="luxury-card rounded-2xl p-5 text-center col-span-2 sm:col-span-1">
              <div className="text-lg font-bold text-luxury-gold truncate">{topPoet[0]}</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100/40 mt-1">Любимый поэт ({topPoet[1]})</div>
            </div>
          )}
        </div>
        
        {/* Sort controls */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs text-cyan-100/35 uppercase tracking-[0.14em] font-bold">Сортировка</p>
          <div className="flex gap-1.5">
            {[
              { key: 'date' as const, label: 'По дате' },
              { key: 'rating' as const, label: 'По рейтингу' },
              { key: 'poet' as const, label: 'По автору' },
            ].map(opt => (
              <button key={opt.key} type="button" onClick={() => setSortBy(opt.key)} className={`px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] transition ${sortBy === opt.key ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/30' : 'text-white/40 hover:text-white border border-transparent'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Poem list */}
        <div className="space-y-3">
          {archivedPoems.map(({ poem, poetName, poetId, addedAt }) => (
            <div key={poem.id} className="luxury-card rounded-2xl p-5 sm:p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <Link to={`/poets/${poetId}#poem-${poem.id}`} className="text-lg font-serif font-semibold text-white hover:text-luxury-gold transition-colors">
                  «{poem.title}»
                </Link>
                <div className="flex items-center gap-3 mt-1.5">
                  <Link to={`/poets/${poetId}`} className="text-xs text-luxury-gold hover:text-luxury-gold-light transition-colors">{poetName}</Link>
                  {poem.year && <span className="text-[10px] text-cyan-100/30">{poem.year}</span>}
                </div>
                <p className="text-[10px] text-white/25 mt-1">Добавлено: {new Date(addedAt).toLocaleDateString('ru-RU')}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-1 text-luxury-gold">
                  <Star size={14} className="fill-luxury-gold" />
                  <span className="text-sm font-bold">{poem.rating}</span>
                </div>
                <button type="button" onClick={() => handleRemove(poem.id)} className="rounded-full p-2 text-white/25 transition hover:bg-red-500/10 hover:text-red-400" aria-label="Удалить из архива" title="Удалить из архива">
                  <Heart size={16} className="fill-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}