import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { TocEntry } from './ArticleRenderer';
import { scrollToId } from '../../utils/smoothScroll';

/**
 * Mobile long-read companion: a slim "current chapter" chip that fades in
 * only while the reading chrome is hidden (html.chrome-hidden — see
 * useAutoHideChrome), occupying the space the header vacated instead of
 * adding UI. Tapping opens the essay's table of contents as a native
 * top-layer popover (Popover API: light-dismiss and Esc for free, no JS
 * open/close state). Desktop (≥1024px) keeps the sticky sidebar TOC instead.
 *
 * Engine component — driven entirely by `toc`, so every essay gets it.
 */
export default function SectionChip({ toc }: { toc: TocEntry[] }) {
  const [current, setCurrent] = useState<TocEntry | null>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (toc.length === 0) return;
    const headings = toc
      .map((t) => document.getElementById(t.anchor))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    // The active section is the last heading above the upper third of the
    // viewport — cheap to compute and stable while scrolling verse blocks.
    let ticking = false;
    const update = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const line = window.innerHeight * 0.34;
        let active: TocEntry | null = null;
        for (const el of headings) {
          if (el.getBoundingClientRect().top <= line) {
            active = toc.find((t) => t.anchor === el.id) ?? null;
          }
        }
        setCurrent(active);
        ticking = false;
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [toc]);

  if (toc.length === 0) return null;

  const go = (anchor: string) => {
    popRef.current?.hidePopover?.();
    scrollToId(anchor);
  };

  return (
    <div className="section-chip lg:hidden">
      <button
        type="button"
        popoverTarget="essay-toc-popover"
        className="section-chip-btn min-h-11"
        aria-label="Оглавление статьи"
      >
        {current ? (
          <>
            <span className="section-chip-num">{String(current.number).padStart(2, '0')}</span>
            <span className="section-chip-title">{current.heading}</span>
          </>
        ) : (
          <span className="section-chip-title">Оглавление</span>
        )}
        <ChevronDown size={13} className="shrink-0 opacity-60" />
      </button>

      <div ref={popRef} id="essay-toc-popover" popover="auto" className="section-chip-pop">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-luxury-gold/70">Оглавление</div>
        <ul>
          {toc.map((s) => (
            <li key={s.anchor}>
              <button
                type="button"
                onClick={() => go(s.anchor)}
                className={`section-chip-row min-h-11 ${current?.anchor === s.anchor ? 'is-current' : ''}`}
              >
                <span className="section-chip-num">{String(s.number).padStart(2, '0')}</span>
                <span>{s.heading}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
