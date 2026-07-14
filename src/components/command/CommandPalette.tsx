import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useAppNavigate } from '../ui/Link';
import { getCommandItems } from './commandItems';
import CommandResult from './CommandResult';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useAppNavigate();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listId = 'command-palette-results';

  const items = useMemo(() => getCommandItems(), []);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 8);
    return items
      .filter((item) => `${item.label} ${item.description} ${item.group}`.toLowerCase().includes(q))
      .slice(0, 10);
  }, [items, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, []);

  const select = useCallback((path: string) => {
    navigate(path);
    close();
  }, [navigate, close]);

  useEffect(() => {
    const openPalette = () => setOpen(true);
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener('tlp-open-command-palette', openPalette);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('tlp-open-command-palette', openPalette);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => setActiveIndex(0), [query]);

  // Focus the input when the dialog opens, restore focus to the opener on close.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, [open]);

  // While the palette is open, pause any full-screen background interaction
  // (the 3D hall's wheel/drag rail camera) so scrolling drives the results.
  useEffect(() => {
    try { (window as { __TLP_MODAL_OPEN?: boolean }).__TLP_MODAL_OPEN = open; } catch { /* noop */ }
    return () => { try { (window as { __TLP_MODAL_OPEN?: boolean }).__TLP_MODAL_OPEN = false; } catch { /* noop */ } };
  }, [open]);

  const onDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((value) => Math.min(value + 1, results.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((value) => Math.max(value - 1, 0));
      return;
    }
    if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      select(results[activeIndex].path);
      return;
    }
    // Focus trap: keep Tab within the dialog.
    if (event.key === 'Tab') {
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Открыть поиск по сайту (Ctrl + K)"
        className="palette-fab fixed bottom-6 right-6 z-[80] hidden rounded-full border border-cyan-400/20 bg-[#061018]/80 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300 shadow-[0_0_28px_rgba(0,212,255,0.18)] backdrop-blur-xl transition hover:border-cyan-300/45 lg:inline-flex"
      >
        <Search size={15} className="mr-2" /> Ctrl K
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/70 px-4 py-24 backdrop-blur-xl"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Поиск по сайту"
        onKeyDown={onDialogKeyDown}
        className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-cyan-400/18 bg-[#050b12]/95 shadow-[0_0_80px_rgba(0,212,255,0.16)]"
      >
        <div className="flex items-center gap-3 border-b border-cyan-400/10 px-5 py-4">
          <Search size={20} className="text-cyan-300" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Найти поэта, статью, трек или раздел..."
            aria-label="Поисковый запрос"
            aria-controls={listId}
            aria-expanded={results.length > 0}
            role="combobox"
            className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-cyan-100/40"
          />
          <button type="button" onClick={close} aria-label="Закрыть поиск" className="text-cyan-100/50 hover:text-cyan-200 focus-visible:text-cyan-200">
            <X size={20} />
          </button>
        </div>
        <div id={listId} role="listbox" aria-label="Результаты поиска" className="max-h-[60vh] space-y-2 overflow-y-auto p-3">
          {results.map((item, index) => (
            <CommandResult key={item.id} item={item} active={index === activeIndex} onSelect={() => select(item.path)} />
          ))}
          {!results.length && <div className="p-8 text-center text-cyan-100/50">Ничего не найдено.</div>}
        </div>
      </div>
    </div>
  );
}
