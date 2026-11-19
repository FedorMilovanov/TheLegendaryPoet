import { useEffect, useRef, useState, type RefObject, type ToggleEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import type { TocEntry } from './ArticleRenderer';
import { dismissPopoverOnFocusExit, focusPopoverInvoker, supportsPopover } from '../../utils/popover';
import { decodeHash, scrollToId } from '../../utils/smoothScroll';
import { revealInScrollport } from '../../utils/focusRuntime';
import { focusReturnTarget, registerDialogFocusReturn } from '../../utils/dialogFocusReturn';
import { readingLine } from '../../utils/readingBookmark';
import { noteAppDeparture } from '../../utils/browserNavigation';

interface SectionChipProps {
  toc: TocEntry[];
  articleRef: RefObject<HTMLElement | null>;
  desktopTocRef: RefObject<HTMLElement | null>;
}

// Near the cover or past the article even the sticky rail can be outside the
// viewport. Returning there would strand keyboard focus (or scroll the page).
function canRevealChapter(link: HTMLElement, rail: HTMLElement) {
  const box = rail.getBoundingClientRect(), row = link.getBoundingClientRect();
  if (!box.height || !row.height) return false;
  if (box.top >= 0 && box.bottom <= window.innerHeight) return true;
  return row.top >= Math.max(0, box.top) && row.bottom <= Math.min(window.innerHeight, box.bottom);
}

/** Mobile counterpart of the sticky chapter links. The upper third of the
 * viewport is the reading position; exploring the list never changes it. */
export default function SectionChip({ toc, articleRef, desktopTocRef }: SectionChipProps) {
  const [current, setCurrent] = useState<TocEntry | null>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const resumeAnchor = useRef<string | null>(null);

  useEffect(() => {
    const article = articleRef.current;
    if (!toc.length || !article) return;
    const headings = toc.map(entry => ({ entry, heading: document.getElementById(entry.anchor) }));
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = readingLine();
      let active: TocEntry | null = null;
      for (const { entry, heading } of headings) {
        if (!heading) continue;
        if (heading.getBoundingClientRect().top > line) break;
        active = entry;
      }
      setCurrent(active);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(article);
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    };
  }, [toc, articleRef]);

  useEffect(() => {
    const chip = chipRef.current, nav = desktopTocRef.current;
    const control = chip?.querySelector<HTMLElement>('.section-chip-btn');
    if (!chip || !nav || !control) return;
    const desktop = window.matchMedia('(min-width: 64rem)');

    // Capture the chapter being explored, not the chapter behind the UI. A
    // dialog can keep focus through several breakpoint changes before returning.
    const capture = (origin: HTMLElement) => {
      let anchor: string | undefined;
      if (origin === control) anchor = resumeAnchor.current ?? control.dataset.tocAnchor;
      else if (chip.contains(origin)) anchor = origin.dataset.tocAnchor;
      else if (nav.contains(origin)) anchor = origin.closest('a')?.getAttribute('href')?.slice(1);
      if (!anchor) return null;
      const explored = anchor;
      return () => {
        if (desktop.matches) {
          const link = nav.querySelector<HTMLAnchorElement>(`a[href="#${CSS.escape(explored)}"]`);
          const rail = nav.closest<HTMLElement>('.reader-sticky-panel');
          if (link && rail && canRevealChapter(link, rail) && focusReturnTarget(link)) {
            revealInScrollport(link, rail);
            return true;
          }
        }
        // :focus-within can momentarily be false between the button and its
        // native popover row. Keep layout stable for the whole focus visit.
        chip.dataset.retainChip = '';
        const returned = focusReturnTarget(control);
        if (returned) resumeAnchor.current = explored;
        else delete chip.dataset.retainChip;
        return returned;
      };
    };
    const handOffFocus = () => {
      const origin = document.activeElement;
      const restore = origin instanceof HTMLElement && (desktop.matches ? chip : nav).contains(origin) ? capture(origin) : null;
      if (desktop.matches) popRef.current?.hidePopover();
      restore?.();
    };
    const forgetChip = registerDialogFocusReturn(chip, capture);
    const forgetNav = registerDialogFocusReturn(nav, capture);
    desktop.addEventListener('change', handOffFocus);
    return () => {
      forgetChip();
      forgetNav();
      desktop.removeEventListener('change', handOffFocus);
    };
  }, [desktopTocRef, toc.length]);

  if (toc.length === 0) return null;

  const go = (anchor: string) => {
    popRef.current?.hidePopover();
    const hash = '#' + encodeURIComponent(anchor);
    if (decodeHash(window.location.hash) !== anchor) {
      noteAppDeparture();
      window.location.hash = hash;
    } else scrollToId(anchor);
  };

  const enterList = (event: ToggleEvent<HTMLDivElement>) => {
    const panel = event.currentTarget;
    // Toggle is queued. Do not steal an outside focus change or rewind a
    // reader who has already tabbed into the list before the event arrived.
    if (event.newState !== 'open' || document.activeElement !== chipRef.current?.querySelector('.section-chip-btn')) return;
    const anchor = resumeAnchor.current ?? current?.anchor ?? toc[0].anchor;
    resumeAnchor.current = null;
    panel.querySelector<HTMLElement>(`[data-toc-anchor="${CSS.escape(anchor)}"]`)?.focus();
  };

  return (
    <div ref={chipRef} className="section-chip lg:hidden" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        resumeAnchor.current = null;
        delete event.currentTarget.dataset.retainChip;
      }
      if (supportsPopover) dismissPopoverOnFocusExit(event);
    }}>
      {!supportsPopover ? (
        <select className="section-chip-btn min-h-11 w-full" aria-label="Оглавление статьи" data-toc-anchor={current?.anchor ?? toc[0].anchor} value={current?.anchor ?? ''} onChange={event => go(event.target.value)}>
          <option value="" disabled>Оглавление</option>
          {toc.map(entry => <option key={entry.anchor} value={entry.anchor}>{entry.number}. {entry.heading}</option>)}
        </select>
      ) : <>
        <button
          type="button"
          popoverTarget="essay-toc-popover"
          onClickCapture={focusPopoverInvoker}
          data-toc-anchor={current?.anchor ?? toc[0].anchor}
          className="section-chip-btn min-h-11"
          aria-label="Оглавление статьи"
        >
          {current && <span className="section-chip-num">{String(current.number).padStart(2, '0')}</span>}
          <span className="section-chip-title">{current?.heading ?? 'Оглавление'}</span>
          <ChevronDown size={13} className="shrink-0 opacity-60" />
        </button>

        <div ref={popRef} id="essay-toc-popover" popover="auto" onToggle={enterList} className="section-chip-pop">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-luxury-gold/70">Оглавление</div>
          <ul>
            {toc.map(s => (
              <li key={s.anchor}>
                <button type="button" data-toc-anchor={s.anchor} aria-current={s.anchor === current?.anchor ? 'location' : undefined}
                  onClick={() => go(s.anchor)} className="section-chip-row min-h-11">
                  <span className="section-chip-num">{String(s.number).padStart(2, '0')}</span>
                  <span>{s.heading}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </>}
    </div>
  );
}
