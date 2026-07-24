import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useDialogSurface } from '../../hooks/useDialogSurface';
import { useAppNavigate } from '../ui/Link';
import { normalizeCommandText } from './commandSearch';
import type { CommandItem } from './commandItems';
import CommandResult from './CommandResult';
import './commandPaletteChrome.css';

type IndexStatus = 'idle' | 'loading' | 'ready' | 'error';

let commandItemsPromise: Promise<CommandItem[]> | null = null;

function loadCommandItems(): Promise<CommandItem[]> {
  commandItemsPromise ??= import('./commandItems')
    .then(({ getCommandItems }) => getCommandItems())
    .catch((error) => {
      // A transient chunk failure must remain retryable on the next user action.
      commandItemsPromise = null;
      throw error;
    });
  return commandItemsPromise;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [items, setItems] = useState<CommandItem[]>([]);
  const [indexStatus, setIndexStatus] = useState<IndexStatus>('idle');
  const navigate = useAppNavigate();
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const restoreOnCloseRef = useRef(true);
  const listId = 'command-palette-results';

  const results = useMemo(() => {
    const normalizedQuery = normalizeCommandText(query);
    if (!normalizedQuery) return items.slice(0, 8);
    return items
      .filter((item) =>
        normalizeCommandText(`${item.label} ${item.description} ${item.group}`).includes(normalizedQuery),
      )
      .slice(0, 10);
  }, [items, query]);
  const activeOptionId = results[activeIndex] ? `command-option-${results[activeIndex].id}` : undefined;

  const openPalette = useCallback(() => {
    restoreOnCloseRef.current = true;
    setOpen(true);
  }, []);

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
    restoreOnCloseRef,
  });

  const select = useCallback((path: string) => {
    // Navigating differs from dismissing the modal: restoring the old article's
    // Y coordinate or opener after the route changed would corrupt the target.
    restoreOnCloseRef.current = false;
    navigate(path);
    close();
  }, [navigate, close]);

  // The search index imports poet profiles, longreads, articles and music. Keep
  // that data out of the persistent shell until the user expresses search intent.
  useEffect(() => {
    if (!open || items.length > 0) return;

    let active = true;
    setIndexStatus('loading');
    void loadCommandItems()
      .then((loadedItems) => {
        if (!active) return;
        setItems(loadedItems);
        setIndexStatus('ready');
      })
      .catch(() => {
        if (active) setIndexStatus('error');
      });

    return () => {
      active = false;
    };
  }, [items.length, open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (event.repeat) return;
        setOpen((value) => {
          if (!value) restoreOnCloseRef.current = true;
          return !value;
        });
      }
    };
    window.addEventListener('tlp-open-command-palette', openPalette);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('tlp-open-command-palette', openPalette);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [openPalette]);

  useEffect(() => setActiveIndex(0), [query]);
  useEffect(() => {
    setActiveIndex((index) => results.length > 0 ? Math.min(index, results.length - 1) : 0);
  }, [results.length]);

  // Keep the keyboard-selected option visible inside the results scroller.
  useEffect(() => {
    if (!open || !activeOptionId) return;
    document.getElementById(activeOptionId)?.scrollIntoView({ block: 'nearest' });
  }, [activeOptionId, open]);

  // A route may change through browser history or another persistent control.
  // Close the old-route dialog without restoring coordinates into the new page.
  useEffect(() => {
    if (previousPathRef.current === location.pathname) return;
    previousPathRef.current = location.pathname;
    if (open) {
      restoreOnCloseRef.current = false;
      close();
    }
  }, [close, location.pathname, open]);

  const onDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      if (results.length === 0) return;
      event.preventDefault();
      setActiveIndex((value) => Math.min(value + 1, results.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      if (results.length === 0) return;
      event.preventDefault();
      setActiveIndex((value) => Math.max(value - 1, 0));
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
        onPointerEnter={() => { void loadCommandItems(); }}
        onFocus={() => { void loadCommandItems(); }}
        aria-label="Открыть поиск по сайту (Ctrl + K)"
        className="palette-fab fixed bottom-6 right-6 z-[80] hidden rounded-full border border-cyan-400/20 bg-[#061018]/80 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300 shadow-[0_0_28px_rgba(0,212,255,0.18)] backdrop-blur-xl transition hover:border-cyan-300/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 lg:inline-flex"
        data-testid="command-palette-trigger"
      >
        <Search size={15} className="mr-2" /> Ctrl K
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[200] overflow-y-auto overscroll-contain bg-black/78 px-4 pb-[calc(2rem_+_env(safe-area-inset-bottom))] pt-[calc(5rem_+_env(safe-area-inset-top))] backdrop-blur-xl"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      data-testid="command-palette-layer"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Поиск по сайту"
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
        className="mx-auto flex max-h-[min(78dvh,46rem)] max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-cyan-400/18 bg-[#050b12]/95 shadow-[0_0_80px_rgba(0,212,255,0.16)] outline-none"
        data-testid="command-palette-dialog"
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
            aria-activedescendant={activeOptionId}
            aria-busy={indexStatus === 'loading'}
            aria-autocomplete="list"
            role="combobox"
            autoComplete="off"
            maxLength={120}
            className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-cyan-100/40"
            data-testid="command-palette-input"
          />
          <button
            type="button"
            onClick={close}
            aria-label="Закрыть поиск"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-cyan-100/50 transition hover:bg-white/[0.05] hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
            data-testid="command-palette-close"
          >
            <X size={20} />
          </button>
        </div>
        <div
          id={listId}
          role="listbox"
          aria-label="Результаты поиска"
          aria-busy={indexStatus === 'loading'}
          className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3"
        >
          {results.map((item, index) => (
            <CommandResult
              key={item.id}
              item={item}
              active={index === activeIndex}
              optionId={`command-option-${item.id}`}
              onSelect={() => select(item.path)}
            />
          ))}
          {indexStatus === 'loading' && (
            <div className="p-8 text-center text-cyan-100/50">Загружаем поисковый индекс…</div>
          )}
          {indexStatus === 'error' && (
            <div className="p-8 text-center text-red-200/65">Поисковый индекс временно недоступен.</div>
          )}
          {indexStatus === 'ready' && !results.length && (
            <div className="p-8 text-center text-cyan-100/50">Ничего не найдено.</div>
          )}
        </div>
      </div>
    </div>
  );
}
