import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useDialogSurface } from '../../hooks/useDialogSurface';
import { useAppNavigate } from '../ui/Link';
import { getCommandItems } from './commandItems';
import CommandResult from './CommandResult';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useAppNavigate();
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const restoreFocusRef = useRef(true);
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

  useDialogSurface({
    open,
    dialogRef,
    initialFocusRef: inputRef,
    onClose: close,
    label: 'command-palette',
    restoreFocusRef,
  });

  const openPalette = useCallback(() => {
    restoreFocusRef.current = true;
    setOpen(true);
  }, []);

  const select = useCallback((path: string) => {
    // A command result changes the page. Let RouteContent move focus to the new
    // main landmark instead of restoring the old search trigger over it.
    restoreFocusRef.current = false;
    navigate(path);
    close();
  }, [navigate, close]);

  useEffect(() => {
    const onOpenPalette = () => openPalette();
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (!event.repeat) {
          setOpen((value) => {
            if (!value) restoreFocusRef.current = true;
            return !value;
          });
        }
      }
    };
    window.addEventListener('tlp-open-command-palette', onOpenPalette);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('tlp-open-command-palette', onOpenPalette);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [openPalette]);

  useEffect(() => setActiveIndex(0), [query]);
  useEffect(() => {
    setActiveIndex((index) => results.length > 0 ? Math.min(index, results.length - 1) : 0);
  }, [results.length]);

  useEffect(() => {
    if (previousPathRef.current === location.pathname) return;
    previousPathRef.current = location.pathname;
    restoreFocusRef.current = false;
    close();
  }, [close, location.pathname]);

  const onDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (results.length > 0) setActiveIndex((value) => Math.min(value + 1, results.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length > 0) setActiveIndex((value) => Math.max(value - 1, 0));
      return;
    }
    if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      select(results[activeIndex].path);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={openPalette}
        aria-label="Открыть поиск по сайту (Ctrl + K)"
        className="palette-fab fixed bottom-6 right-6 z-[80] hidden rounded-full border border-cyan-400/20 bg-[#061018]/80 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300 shadow-[0_0_28px_rgba(0,212,255,0.18)] backdrop-blur-xl transition hover:border-cyan-300/45 lg:inline-flex"
      >
        <Search size={15} className="mr-2" /> Ctrl K
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[120] overflow-y-auto overscroll-contain bg-black/70 px-4 pb-[calc(2rem_+_env(safe-area-inset-bottom))] pt-[calc(5rem_+_env(safe-area-inset-top))] backdrop-blur-xl"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Поиск по сайту"
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
        className="mx-auto flex max-h-[min(78dvh,46rem)] max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-cyan-400/18 bg-[#050b12]/95 shadow-[0_0_80px_rgba(0,212,255,0.16)] outline-none"
      >
        <div className="flex flex-none items-center gap-3 border-b border-cyan-400/10 px-5 py-4">
          <Search size={20} className="text-cyan-300" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Найти поэта, статью, трек или раздел..."
            aria-label="Поисковый запрос"
            aria-controls={listId}
            aria-expanded={results.length > 0}
            aria-autocomplete="list"
            role="combobox"
            autoComplete="off"
            maxLength={120}
            className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-cyan-100/40"
          />
          <button type="button" onClick={close} aria-label="Закрыть поиск" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-cyan-100/50 transition hover:bg-white/[0.05] hover:text-cyan-200 focus-visible:text-cyan-200">
            <X size={20} />
          </button>
        </div>
        <div id={listId} role="listbox" aria-label="Результаты поиска" className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3">
          {results.map((item, index) => (
            <CommandResult key={item.id} item={item} active={index === activeIndex} onSelect={() => select(item.path)} />
          ))}
          {!results.length && <div className="p-8 text-center text-cyan-100/50">Ничего не найдено.</div>}
        </div>
      </div>
    </div>
  );
}
