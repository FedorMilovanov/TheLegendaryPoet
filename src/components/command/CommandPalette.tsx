import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useHref, useLocation } from 'react-router';
import { useDialogSurface } from '../../hooks/useDialogSurface';
import { activeEntryId, liveReaderPage } from '../../utils/scrollHistory';
import { decodeHash } from '../../utils/smoothScroll';
import { revealInScrollport } from '../../utils/focusRuntime';
import { useAppNavigate } from '../ui/Link';
import { commandResults, getCommandItems, type CommandItem } from './commandItems';
import type { EssaySearchEntry } from '../../data/essaySearchIndex.generated';
import CommandResult from './CommandResult';
import './commandPaletteChrome.css';

// Search is part of the persistent shell. Its reader can already be at a
// different browser address from the outlet React is still painting.
const dialogAddress = () => ({ page: liveReaderPage(), query: window.location.search, entry: activeEntryId() });

export default function CommandPalette() {
  const [session, setSession] = useState<ReturnType<typeof dialogAddress> | null>(null);
  const open = session !== null;
  const [{ text: query, shown }, setDraft] = useState<{ text: string; shown?: CommandItem[] }>({ text: '' });
  const [activeIndex, setActiveIndex] = useState(0);
  const [essayIndex, setEssayIndex] = useState<readonly EssaySearchEntry[] | null>(null);
  const [essayLoadError, setEssayLoadError] = useState(false);
  const navigate = useAppNavigate();
  const location = useLocation();
  const rootHref = useHref('/').replace(/\/$/, '');
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
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
  const results = useMemo(() => shown && !essayIndex ? shown : commandResults(items, query, shown),
    [items, query, shown, essayIndex]);
  const editQuery = (text: string) => {
    setDraft({ text, shown: essayIndex ? undefined : commandResults(items, text) });
    setActiveIndex(0);
  };

  const close = useCallback(() => {
    setSession(null);
    setDraft({ text: '' });
    setActiveIndex(0);
  }, []);

  const { isTopmost, dismissForNavigation } = useDialogSurface({
    open,
    dialogRef,
    initialFocusRef: inputRef,
    onClose: close,
    label: 'command-palette',
  });

  const openPalette = useCallback(() => {
    setSession(dialogAddress());
  }, []);

  const select = useCallback((path: string) => {
    // The destination (main, chapter or poem), not the search trigger, owns focus.
    const live = window.location;
    const target = new URL(rootHref + path, live.href);
    const sameTarget = target.pathname === live.pathname && target.search === live.search && decodeHash(target.hash) === decodeHash(live.hash);
    navigate(path, { replace: sameTarget });
    dismissForNavigation();
  }, [navigate, dismissForNavigation, rootHref]);

  useEffect(() => {
    const onOpenPalette = () => openPalette();
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        if (open && !isTopmost()) return;
        event.preventDefault();
        if (!event.repeat) {
          if (open) close();
          else openPalette();
        }
      }
    };
    window.addEventListener('tlp-open-command-palette', onOpenPalette);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('tlp-open-command-palette', onOpenPalette);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [close, isTopmost, open, openPalette]);

  // The list is the sole scrollport. Text enlargement or rotation can put the
  // active descendant outside it without generating a new key/pointer event.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!open || !list) return;
    const observer = new ResizeObserver(() => {
      const active = list.querySelector<HTMLElement>('[aria-selected="true"]');
      if (active) revealInScrollport(active, list);
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, [open]);

  // A new query starts at its first option, not at the old list’s scroll offset.
  useLayoutEffect(() => { listRef.current?.scrollTo({ top: 0, behavior: 'instant' }); }, [query]);
  useEffect(() => {
    setActiveIndex((index) => results.length > 0 ? Math.min(index, results.length - 1) : 0);
  }, [results.length]);

  useLayoutEffect(() => {
    if (!session) return;
    const dismissOnDeparture = () => {
      const now = dialogAddress();
      if (session.page === now.page) {
        // Filter-only navigation keeps the dialog, including on Back. Adopt
        // that entry so a later traversal between identical URLs is distinct.
        if (session.query !== now.query) { setSession(now); return; }
        if (!session.entry || !now.entry || session.entry === now.entry) return;
      }
      dismissForNavigation();
    };
    // A late route commit is not a departure from the address at open. And
    // Back may cancel a suspended PUSH with no new React location at all.
    window.addEventListener('popstate', dismissOnDeparture);
    dismissOnDeparture();
    return () => window.removeEventListener('popstate', dismissOnDeparture);
  }, [dismissForNavigation, session, location]);

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length) {
        const next = Math.max(0, Math.min(results.length - 1, activeIndex + (event.key === 'ArrowDown' ? 1 : -1)));
        setActiveIndex(next);
        const option = document.getElementById(optionId(results[next].id));
        if (option && listRef.current) revealInScrollport(option, listRef.current);
      }
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
      className="command-backdrop theme-modal-backdrop fixed inset-0 z-[120] flex flex-col items-center overflow-y-auto overscroll-contain backdrop-blur-xl"
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
        className="command-sheet theme-modal-surface flex min-h-0 w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border outline-none"
      >
        <div className="command-input-row flex flex-none items-center border-b border-cyan-400/10">
          <Search size={20} className="theme-control-action shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => editQuery(event.target.value)}
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
          <button type="button" onClick={close} aria-label="Закрыть поиск" className="command-close theme-functional-muted inline-flex shrink-0 items-center justify-center rounded-full transition hover:bg-cyan-400/[0.06] hover:text-cyan-300 focus-visible:text-cyan-300">
            <X size={20} />
          </button>
        </div>
        <div ref={listRef} id={listId} role="listbox" tabIndex={-1} aria-label="Результаты поиска" className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain [overflow-anchor:none] p-3">
          {results.map((item, index) => (
            <CommandResult key={item.id} item={item} optionId={optionId(item.id)} active={index === activeIndex} onPoint={() => setActiveIndex(index)} onSelect={() => select(item.path)} />
          ))}
          {!essayIndex && !essayLoadError && <div role="status" aria-live="polite" className="theme-functional-muted px-4 py-2 text-sm">Загрузка поиска по статьям…</div>}
          {essayLoadError && <div role="status" aria-live="polite" className="theme-functional-muted px-4 py-2 text-sm">Поиск по статьям временно недоступен. Закройте и откройте поиск, чтобы повторить загрузку.</div>}
          {!results.length && essayIndex && <div role="option" aria-selected="false" aria-disabled="true" aria-live="polite" className="theme-functional-muted p-8 text-center">Ничего не найдено.</div>}
        </div>
      </div>
    </div>
  );
}
