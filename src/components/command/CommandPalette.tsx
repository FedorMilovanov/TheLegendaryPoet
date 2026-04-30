import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCommandItems } from './commandItems';
import CommandResult from './CommandResult';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  const items = useMemo(() => getCommandItems(), []);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 8);
    return items
      .filter((item) => `${item.label} ${item.description} ${item.group}`.toLowerCase().includes(q))
      .slice(0, 10);
  }, [items, query]);

  const select = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery('');
  };

  useEffect(() => {
    const openPalette = () => setOpen(true);
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (!open) return;
      if (event.key === 'Escape') setOpen(false);
      if (event.key === 'ArrowDown') setActiveIndex((value) => Math.min(value + 1, results.length - 1));
      if (event.key === 'ArrowUp') setActiveIndex((value) => Math.max(value - 1, 0));
      if (event.key === 'Enter' && results[activeIndex]) select(results[activeIndex].path);
    };
    window.addEventListener('tlp-open-command-palette', openPalette);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('tlp-open-command-palette', openPalette);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeIndex, open, results]);

  useEffect(() => setActiveIndex(0), [query]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[80] hidden rounded-full border border-cyan-400/20 bg-[#061018]/80 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300 shadow-[0_0_28px_rgba(0,212,255,0.18)] backdrop-blur-xl transition hover:border-cyan-300/45 lg:inline-flex"
      >
        <Search size={15} className="mr-2" /> Ctrl K
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/70 px-4 py-24 backdrop-blur-xl">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-cyan-400/18 bg-[#050b12]/95 shadow-[0_0_80px_rgba(0,212,255,0.16)]">
        <div className="flex items-center gap-3 border-b border-cyan-400/10 px-5 py-4">
          <Search size={20} className="text-cyan-300" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Найти поэта, статью, трек или раздел..."
            className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-cyan-100/25"
          />
          <button type="button" onClick={() => setOpen(false)} className="text-cyan-100/40 hover:text-cyan-200">
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto p-3">
          {results.map((item, index) => (
            <CommandResult key={item.id} item={item} active={index === activeIndex} onSelect={() => select(item.path)} />
          ))}
          {!results.length && <div className="p-8 text-center text-cyan-100/38">Ничего не найдено.</div>}
        </div>
      </div>
    </div>
  );
}