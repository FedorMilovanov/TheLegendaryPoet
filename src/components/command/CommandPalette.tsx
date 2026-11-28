import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useLocation } from 'react-router';
import { useDialogSurface } from '../../hooks/useDialogSurface';
import { revealInScrollport } from '../../utils/focusRuntime';
import { matchesRussianSearch } from '../../utils/searchText';
import { useAppNavigate } from '../ui/Link';
import { getCommandItems } from './commandItems';
import type { EssaySearchEntry } from '../../data/essaySearchIndex.generated';
import CommandResult from './CommandResult';
import './commandPaletteChrome.css';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [essayIndex, setEssayIndex] = useState<readonly EssaySearchEntry[] | null>(null);
  const [essayLoadError, setEssayLoadError] = useState(false);
  const navigate = useAppNavigate();
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef(true);
  const listId = 'command-palette-results';
  const optionId = (itemId: string) => 'command-option-' + itemId;

  // Keep the canonical article search index out of the persistent app shell.
  // Fetch it once per mounted session when the search dialog is opened.
  useEffect(() => {
    if (!open || essayIndex) return;
    const controller = new AbortController();
    const url = (import.meta.env.BASE_URL || '/') + 'data/essay-search-index.json';
    setEssayLoadError(false);
    void fetch(url, { credentials: 'same-origin', cache: 'no-cache', signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Essay search index HTTP ' + response.status);
        return response.json() as Promise<unknown>;
      })
      .then((entries) => {
        if (!Array.isArray(entries) || !entries.every((entry) => (
          entry && typeof entry === 'object'
          && typeof entry.id === 'string' && typeof entry.title === 'string'
          && typeof entry.excerpt === 'string' && typeof entry.slug === 'string'
          && Array.isArray(entry.sections)
          && entry.sections.every((section: unknown) => (
            Array.isArray(section) && section.length === 2
            && section.every((value: unknown) => typeof value === 'string')
          ))
        ))) throw new Error('Malformed essay search index');
        if (!controller.signal.aborted) setEssayIndex(entries as EssaySearchEntry[]);
      })
      .catch(() => {
        if (!controller.signal.aborted) setEssayLoadError(true);
      });
    return () => controller.abort();
  }, [open, essayIndex]);

  const items = useMemo(() => getCommandItems(essayIndex ?? []), [essayIndex]);
  const results = useMemo(() => {
    if (!query.trim()) return items.slice(0, 8);
    return items
      .filter((item) => matchesRussianSearch(query, [item.label, item.description, item.group]))
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

  // aria-activedescendant does not move DOM focus or scroll the selected row.
  // Keep the keyboard result visible inside its own list, never the reader.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!open || !list) return;
    const active = list.querySelector<HTMLElement>('[aria-selected="true"]');
    if (active) revealInScrollport(active, list);
  }, [open, results, activeIndex]);
  useEffect(() => {
    setActiveIndex((index) => results.length > 0 ? Math.min(index, results.length - 1) : 0);
  }, [results.length]);

  useEffect(() => {
    if (previousPathRef.current === location.pathname) return;
    previousPathRef.current = location.pathname;
    restoreFocusRef.current = false;
    close();
  }, [close, location.pathname]);

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
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

  // Desktop already owns a search trigger in the persistent header and mobile
  // owns one in the centre dock. Keeping a third fixed Ctrl+K pill duplicated
  // the same action, competed with audio chrome and added another blur layer.
  if (!open) return null;

  return (
    <div
      className="theme-modal-backdrop fixed inset-0 z-[120] overflow-y-auto overscroll-contain px-4 pb-[calc(2rem_+_env(safe-area-inset-bottom))] pt-[calc(5rem_+_env(safe-area-inset-top))] backdrop-blur-xl"
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
        className="theme-modal-surface mx-auto flex max-h-[min(78dvh,46rem)] max-w-2xl flex-col overflow-hidden rounded-[2rem] border outline-none"
      >
        <div className="flex flex-none items-center gap-3 border-b border-cyan-400/10 px-5 py-4">
          <Search size={20} className="theme-control-action" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
            onKeyDown={onInputKeyDown}
            placeholder="Найти поэта, стихотворение, статью, трек или раздел..."
            aria-label="Поисковый запрос"
            aria-controls={listId}
            aria-expanded={true}
            aria-autocomplete="list"
            aria-activedescendant={results[activeIndex] ? optionId(results[activeIndex].id) : undefined}
            role="combobox"
            autoComplete="off"
            maxLength={120}
            className="theme-text theme-placeholder min-w-0 flex-1 bg-transparent text-base outline-none"
          />
          <button type="button" onClick={close} aria-label="Закрыть поиск" className="theme-functional-muted inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition hover:bg-cyan-400/[0.06] hover:text-cyan-300 focus-visible:text-cyan-300">
            <X size={20} />
          </button>
        </div>
        <div ref={listRef} id={listId} role="listbox" aria-label="Результаты поиска" className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3">
          {results.map((item, index) => (
            <CommandResult key={item.id} item={item} optionId={optionId(item.id)} active={index === activeIndex} onSelect={() => select(item.path)} />
          ))}
          {!essayIndex && !essayLoadError && <div role="status" aria-live="polite" className="theme-functional-muted px-4 py-2 text-sm">Загрузка поиска по статьям…</div>}
          {essayLoadError && <div role="status" aria-live="polite" className="theme-functional-muted px-4 py-2 text-sm">Поиск по статьям временно недоступен. Закройте и откройте поиск, чтобы повторить загрузку.</div>}
          {!results.length && essayIndex && <div role="option" aria-selected="false" aria-disabled="true" aria-live="polite" className="theme-functional-muted p-8 text-center">Ничего не найдено.</div>}
        </div>
      </div>
    </div>
  );
}
