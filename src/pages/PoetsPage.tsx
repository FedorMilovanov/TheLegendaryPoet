import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from '../components/ui/Link';
import { AnimatePresence, motion } from 'framer-motion';
import { poets } from '../data/poets';
import PoetCard from '../components/PoetCard';
import { Poet } from '../types/poet';
import { Search, Filter, ArrowDownUp, X, ArrowRight, Sparkles } from '../components/PremiumIcons';
import Reveal from '../components/Reveal';
import { useSeo } from '../hooks/useSeo';
import { poetsCollectionStructuredData } from '../utils/collectionStructuredData';
import { titleCase } from '../utils/titleCase';

const poetsJsonLd = poetsCollectionStructuredData(poets);

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').trim();
}

function PoetsHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="mb-16 flex flex-col gap-8 border-b border-luxury-gold/10 pb-10 md:flex-row md:items-end md:justify-between"
    >
      <div>
        <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.2em] text-luxury-gold gold-glow-text">
          Архив создателей
        </span>
        <h1 className="editorial-title font-serif text-5xl font-bold text-white md:text-7xl">
          {titleCase('Лица')} <span className="gold-gradient italic gold-glow-text">{titleCase('Эпохи')}</span>
        </h1>
      </div>
      <p className="max-w-md border-l border-luxury-gold/20 pl-6 text-xl font-light leading-relaxed text-luxury-gray-light">
        От золотого века до советского надлома — исследуйте судьбы гениев сквозь призму вечности.
      </p>
    </motion.div>
  );
}

function PoetsFilters({ searchTerm, selectedTag, sortBy, allTags, onSearch, onSelectTag, onSort }: { searchTerm: string; selectedTag: string; sortBy: 'name' | 'rating' | 'year'; allTags: string[]; onSearch: (v: string) => void; onSelectTag: (v: string) => void; onSort: (v: 'name' | 'rating' | 'year') => void }) {
  const sortOptions: Array<{ value: 'name' | 'rating' | 'year'; label: string }> = [
    { value: 'rating', label: 'По рейтингу' },
    { value: 'name', label: 'По имени' },
    { value: 'year', label: 'По эпохе' },
  ];

  const tagButtonClass = (active: boolean) => `relative min-h-11 shrink-0 rounded-full px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/70 ${active ? 'text-luxury-dark' : 'text-luxury-gray hover:text-white'}`;

  return (
    <div className="mb-12 space-y-6 rounded-3xl bg-luxury-dark-200/24 p-4 backdrop-blur-md select-none sm:p-6">
      <div className="relative">
        <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-luxury-gold/40" />
        <input
          type="search"
          aria-label="Поиск поэтов"
          placeholder="Поиск по имени или фамилии..."
          value={searchTerm}
          onChange={(event) => onSearch(event.target.value)}
          className="w-full rounded-2xl border border-luxury-gold/15 bg-black/20 py-4 pl-14 pr-14 text-lg font-light text-white placeholder-luxury-gray/50 transition-all focus:border-luxury-gold/50 focus:bg-black/40 focus:shadow-[0_0_25px_rgba(212,175,55,0.08)] focus:outline-none font-sans"
        />
        <AnimatePresence>
          {searchTerm && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onSearch('')}
              className="absolute right-1.5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-luxury-gray transition-colors hover:text-luxury-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/70"
              aria-label="Очистить поиск"
            >
              <X size={18} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pt-2">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <Filter size={15} className="text-luxury-gold/40" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-luxury-gray-light/60">Теги:</span>
          </div>
          <div className="-mx-4 flex scroll-px-4 gap-2 overflow-x-auto px-4 pb-1 scrollbar-thin sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            <button type="button" onClick={() => onSelectTag('')} aria-pressed={!selectedTag} className={tagButtonClass(!selectedTag)}>
              {!selectedTag && <motion.div layoutId="tag-active-indicator" className="absolute inset-0 rounded-full bg-luxury-gold shadow-[0_0_20px_rgba(212,175,55,0.28)]" style={{ zIndex: -1 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} />}
              Все
            </button>
            {allTags.map((tag) => {
              const isSelected = tag === selectedTag;
              return (
                <button type="button" key={tag} onClick={() => onSelectTag(isSelected ? '' : tag)} aria-pressed={isSelected} className={tagButtonClass(isSelected)}>
                  {isSelected && <motion.div layoutId="tag-active-indicator" className="absolute inset-0 rounded-full bg-luxury-gold shadow-[0_0_20px_rgba(212,175,55,0.28)]" style={{ zIndex: -1 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} />}
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 xl:flex-shrink-0 xl:self-auto">
          <div className="flex items-center gap-2">
            <ArrowDownUp size={15} className="text-luxury-gold/40" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-luxury-gray-light/60">Сортировка:</span>
          </div>
          <div className="relative flex overflow-hidden rounded-full bg-black/30 p-1">
            {sortOptions.map((option) => {
              const isActive = sortBy === option.value;
              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => onSort(option.value)}
                  aria-pressed={isActive}
                  className={`relative z-10 min-h-11 rounded-full px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/70 sm:px-4 ${isActive ? 'text-luxury-dark' : 'text-luxury-gray-light hover:text-white'}`}
                >
                  {isActive && <motion.div layoutId="sort-active-indicator" className="absolute inset-0 bg-luxury-gold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.25)]" style={{ zIndex: -1 }} transition={{ type: 'spring', stiffness: 350, damping: 26 }} />}
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PoetsEmptyState() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-3xl border border-dashed border-cyan-400/20 py-32 text-center">
      <p className="mb-4 font-serif text-xl italic text-cyan-100/50">Архивы молчат...</p>
      <p className="text-sm font-light text-cyan-200/30">Попробуйте изменить параметры поиска</p>
    </motion.div>
  );
}

function PoetsGrid({ poets: visiblePoets }: { poets: Poet[] }) {
  return (
    <motion.div layout className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {visiblePoets.map((poet) => (
          <motion.div key={poet.id} layout initial={{ opacity: 0, scale: 0.85, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: -30 }} transition={{ type: 'spring', stiffness: 220, damping: 20 }}>
            <PoetCard poet={poet} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PoetsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') ?? '';
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'year'>('rating');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const allTags = useMemo(() => Array.from(new Set(poets.flatMap((poet) => poet.tags))), []);

  useSeo({
    title: 'Русские поэты: биографии, стихи и исследования — THE LEGENDARY POET',
    description: 'Каталог русских поэтов: биографии, избранные стихи, свидетельства современников и документальные исследования.',
    path: '/poets',
    keywords: 'русские поэты, биографии поэтов, стихи, Пушкин, Лермонтов, Есенин, Маяковский',
    jsonLd: poetsJsonLd,
  });

  const updateSearch = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('q', value);
    else next.delete('q');
    setSearchParams(next, { replace: true });
  };

  const filteredPoets = useMemo(() => {
    const query = normalizeSearch(searchTerm);
    return poets
      .filter((poet) => {
        const matchesSearch =
          normalizeSearch(poet.name).includes(query) ||
          normalizeSearch(poet.fullName).includes(query);
        const matchesTag = !selectedTag || poet.tags.includes(selectedTag);
        return matchesSearch && matchesTag;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name, 'ru');
        if (sortBy === 'rating') return b.rating - a.rating;
        return a.birthYear - b.birthYear;
      });
  }, [searchTerm, selectedTag, sortBy]);

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal direction="up"><PoetsHero /></Reveal>

        <div className="mb-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-200/40" aria-live="polite">
            Найдено гениев <span className="mx-2 h-px w-8 inline-block align-middle bg-cyan-400/30"></span>
            <span className="text-cyan-400 drop-shadow-[0_0_5px_rgba(0,212,255,0.5)]">{filteredPoets.length}</span>
          </p>
          <Link to="/hall" className="group flex min-h-11 items-center gap-3 rounded-full border border-luxury-gold/30 bg-luxury-gold/10 px-6 py-2.5 text-sm font-bold uppercase tracking-[0.15em] text-luxury-gold transition-all hover:bg-luxury-gold/20 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/70">
            <Sparkles size={16} className="animate-pulse" />
            <span>Зал Поэтов</span>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <PoetsFilters searchTerm={searchTerm} selectedTag={selectedTag} sortBy={sortBy} allTags={allTags} onSearch={updateSearch} onSelectTag={setSelectedTag} onSort={setSortBy} />
        {filteredPoets.length > 0 ? <PoetsGrid poets={filteredPoets} /> : <PoetsEmptyState />}
      </div>
    </div>
  );
}
