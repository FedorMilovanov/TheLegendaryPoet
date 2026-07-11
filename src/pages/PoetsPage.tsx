import { useMemo, useState } from 'react';
import { poets } from '../data/poets';
import PoetsEmptyState from '../components/poets/PoetsEmptyState';
import PoetsFilters from '../components/poets/PoetsFilters';
import PoetsGrid from '../components/poets/PoetsGrid';
import PoetsHero from '../components/poets/PoetsHero';
import { useSeo } from '../hooks/useSeo';

export default function PoetsPage() {
  useSeo({
    title: 'Поэты — THE LEGENDARY POET',
    description: 'Каталог великих русских поэтов: биографии, тексты, теги и рейтинги — от золотого века до серебряного.',
    path: '/poets',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'year'>('rating');
  const [selectedTag, setSelectedTag] = useState<string>('');

  const allTags = useMemo(() => Array.from(new Set(poets.flatMap((poet) => poet.tags))), []);

  const filteredPoets = useMemo(() => {
    return poets
      .filter((poet) => {
        const q = searchTerm.toLowerCase();
        const matchesSearch = poet.name.toLowerCase().includes(q) || poet.fullName.toLowerCase().includes(q);
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
        <PoetsHero />
        <PoetsFilters
          searchTerm={searchTerm}
          selectedTag={selectedTag}
          sortBy={sortBy}
          allTags={allTags}
          onSearch={setSearchTerm}
          onSelectTag={setSelectedTag}
          onSort={setSortBy}
        />

        <p className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-200/40">
          Найдено гениев <span className="h-[1px] w-8 bg-cyan-400/30"></span>
          <span className="text-cyan-400 drop-shadow-[0_0_5px_rgba(0,212,255,0.5)]">{filteredPoets.length}</span>
        </p>

        {filteredPoets.length > 0 ? <PoetsGrid poets={filteredPoets} /> : <PoetsEmptyState />}
      </div>
    </div>
  );
}
