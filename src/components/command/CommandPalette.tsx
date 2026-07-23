import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useAppNavigate } from '../ui/Link';
import { pauseSmoothScroll, resumeSmoothScroll } from '../../utils/smoothScroll';
import { normalizeCommandText } from './commandSearch';
import type { CommandItem } from './commandItems';
import CommandResult from './CommandResult';

type IndexStatus = 'idle' | 'loading' | 'ready' | 'error';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [items, setItems] = useState<CommandItem[]>([]);
  const [indexStatus, setIndexStatus] = useState<IndexStatus>('idle');
  const navigate = useAppNavigate();
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

  const select = useCallback((path: string) => {
    // Normal dismissal returns the reader to the exact paragraph. Navigation is
    // different: restoring the old page's Y coordinate after the route changed
    // would drop the reader halfway down the destination longread.
    restoreOnCloseRef.current = false;
    navigate(path);
    close();
  }, [navigate, close]);

  // The search index imports poet profiles, longreads, articles and music. Keep
  // that data out of the persistent shell until the user expresses search intent.
  useEffect(() => {
    if (!open || indexStatus === 'loading' || indexStatus === 'ready') return;

    let active = true;
    setIndexStatus('loading');
    void import('./commandItems')
      .then(({ getCommandItems }) => {
        if (!active) return;
        setItems(getCommandItems());
        setIndexStatus('ready');
      })
      .catch(() => {
        if (active) setIndexStatus('error');
      });

    return () => {
      active = false;
    };
  }, [indexStatus, open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
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

  // Keep the keyboard-selected option visible inside the results scroller.
  useEffect(() => {
    if (!open || !activeOptionId) return;
    document.getElementById(activeOptionId)?.scrollIntoView({ block: 'nearest' });
  }, [activeOptionId, open]);

  // A real page-level modal: freeze both Lenis and native body scrolling, keep
  // the viewport width stable, focus without scrolling, then restore the exact
  // reading position and opener when the palette closes without navigation.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollY = window.scrollY;
    const clientWidthBefore = document.documentElement.clientWidth;
    const currentPadding = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;

    pauseSmoothScroll();
    body.style.overflow = 'hidden';
    const releasedWidth = Math.max(0, document.documentElement.clientWidth - clientWidthBefore);
    if (releasedWidth > 0) body.style.paddingRight = `${currentPadding + releasedWidth}px`;
    const focusFrame = requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));

    return () => {
      cancelAnimationFrame(focusFrame);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;

      const shouldRestore = restoreOnCloseRef.current;
      restoreOnCloseRef.current = true;
      resumeSmoothScroll(shouldRestore ? scrollY : undefined);
      if (shouldRestore) {
        requestAnimationFrame(() => previouslyFocused?.focus?.({ preventScroll: true }));
      }
    };
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
      return;
    }
    if (event.key === 'Tab') {
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={openPalette}
        onPointerEnter={() => { void import('./commandItems'); }}
        onFocus={() => { void import('./commandItems'); }}
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
      className="fixed inset-0 z-[200] bg-black/78 px-4 py-24 backdrop-blur-xl"
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
        onKeyDown={onDialogKeyDown}
        className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-cyan-400/18 bg-[#050b12]/95 shadow-[0_0_80px_rgba(0,212,255,0.16)]"
        data-testid="command-palette-dialog"
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
            aria-activedescendant={activeOptionId}
            aria-busy={indexStatus === 'loading'}
            role="combobox"
            className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-cyan-100/40"
            data-testid="command-palette-input"
          />
          <button
            type="button"
            onClick={close}
            aria-label="Закрыть поиск"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-cyan-100/50 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
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
          className="max-h-[60vh] space-y-2 overflow-y-auto p-3"
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
