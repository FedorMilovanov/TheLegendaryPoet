import { Search, Filter, ArrowDownUp } from 'lucide-react';

interface PoetsFiltersProps {
  searchTerm: string;
  selectedTag: string;
  sortBy: 'name' | 'rating' | 'year';
  allTags: string[];
  onSearch: (value: string) => void;
  onSelectTag: (value: string) => void;
  onSort: (value: 'name' | 'rating' | 'year') => void;
}

export default function PoetsFilters({
  searchTerm,
  selectedTag,
  sortBy,
  allTags,
  onSearch,
  onSelectTag,
  onSort,
}: PoetsFiltersProps) {
  return (
    <div className="mb-12 space-y-6 rounded-3xl border border-luxury-gold/10 bg-luxury-dark-200/30 p-6 backdrop-blur-md">
      <div className="relative">
        <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-luxury-gold/50" />
        <input
          type="text"
          placeholder="Поиск по имени или фамилии..."
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full rounded-2xl border border-luxury-gold/20 bg-transparent py-4 pl-14 pr-6 text-lg font-light text-white placeholder-luxury-gray transition-all focus:border-luxury-gold/60 focus:shadow-[0_0_20px_rgba(212,175,55,0.1)] focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-2 flex items-center gap-2">
            <Filter size={16} className="text-luxury-gold/50" />
            <span className="text-xs font-bold uppercase tracking-widest text-luxury-gray-light">Теги:</span>
          </div>
          <button
            onClick={() => onSelectTag('')}
            className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
              !selectedTag
                ? 'bg-luxury-gold text-luxury-dark shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                : 'border border-luxury-gold/30 bg-transparent text-luxury-gray hover:border-luxury-gold/60 hover:text-white'
            }`}
          >
            Все
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onSelectTag(tag === selectedTag ? '' : tag)}
              className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                tag === selectedTag
                  ? 'bg-luxury-gold text-luxury-dark shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  : 'border border-luxury-gold/30 bg-transparent text-luxury-gray hover:border-luxury-gold/60 hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ArrowDownUp size={16} className="text-luxury-gold/50" />
          <select
            value={sortBy}
            onChange={(e) => onSort(e.target.value as 'name' | 'rating' | 'year')}
            className="cursor-pointer appearance-none rounded-full border border-luxury-gold/30 bg-transparent px-4 py-2 text-xs font-bold uppercase tracking-widest text-white focus:border-luxury-gold/60 focus:outline-none"
          >
            <option value="rating" className="bg-[#111]">По рейтингу</option>
            <option value="name" className="bg-[#111]">По имени</option>
            <option value="year" className="bg-[#111]">По эпохе</option>
          </select>
        </div>
      </div>
    </div>
  );
}
