import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BookOpenText, ChevronDown, ChevronRight, ListTree, X } from 'lucide-react';
import type { TocEntry } from './ArticleRenderer';
import { scrollToId } from '../../utils/smoothScroll';

/**
 * Premium mobile wTOC (working table of contents).
 *
 * It tracks the current chapter and total reading progress, stays compact while
 * the browser chrome is visible, then becomes a glass reading companion when
 * the site chrome hides. The panel is a real modal layer with focus return,
 * Escape/backdrop dismissal, safe-area spacing, and one-tap chapter jumps.
 */
export default function SectionChip({ toc }: { toc: TocEntry[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const current = toc[currentIndex] ?? toc[0] ?? null;
  const next = toc[currentIndex + 1] ?? null;
  const percent = Math.round(progress * 100);

  useEffect(() => {
    if (toc.length === 0) return;
    const headings = toc
      .map((entry) => document.getElementById(entry.anchor))
      .filter((element): element is HTMLElement => element !== null);
    if (headings.length === 0) return;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const readingLine = window.innerHeight * 0.32;
        let active = 0;
        headings.forEach((heading, index) => {
          if (heading.getBoundingClientRect().top <= readingLine) active = index;
        });
        setCurrentIndex(active);

        const documentHeight = Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
        );
        const scrollable = Math.max(1, documentHeight - window.innerHeight);
        setProgress(Math.min(1, Math.max(0, window.scrollY / scrollable)));
      });
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [toc]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = requestAnimationFrame(() => closeRef.current?.focus());
    const currentRow = listRef.current?.querySelector<HTMLElement>('[aria-current="location"]');
    currentRow?.scrollIntoView({ block: 'center' });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      requestAnimationFrame(() => triggerRef.current?.focus());
    };
  }, [open]);

  const circumference = useMemo(() => 2 * Math.PI * 16, []);

  if (toc.length === 0 || !current) return null;

  const go = (anchor: string) => {
    setOpen(false);
    window.history.replaceState(null, '', `#${anchor}`);
    requestAnimationFrame(() => scrollToId(anchor));
  };

  return (
    <>
      <div className={`section-chip wtoc-trigger-wrap lg:hidden ${open ? 'is-open' : ''}`}>
        <motion.button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          whileTap={reduceMotion ? undefined : { scale: 0.965 }}
          transition={{ type: 'spring', stiffness: 430, damping: 28 }}
          className="section-chip-btn wtoc-trigger min-h-11"
          aria-label={`Оглавление статьи. Глава ${current.number}: ${current.heading}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          data-testid="mobile-toc-trigger"
        >
          <span className="wtoc-ring" aria-hidden="true">
            <svg viewBox="0 0 40 40">
              <circle className="wtoc-ring-track" cx="20" cy="20" r="16" />
              <circle
                className="wtoc-ring-value"
                cx="20"
                cy="20"
                r="16"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
              />
            </svg>
            <span>{String(current.number).padStart(2, '0')}</span>
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="wtoc-eyebrow">Сейчас читается · {percent}%</span>
            <span className="section-chip-title wtoc-current-title">{current.heading}</span>
          </span>
          <ChevronDown size={15} className="shrink-0 opacity-60" aria-hidden="true" />
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Оглавление статьи"
            className="wtoc-layer lg:hidden"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.24 }}
            data-testid="mobile-toc-dialog"
          >
            <motion.button
              type="button"
              className="wtoc-backdrop"
              aria-label="Закрыть оглавление"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.section
              className="wtoc-sheet"
              initial={reduceMotion ? { opacity: 0 } : { y: -28, opacity: 0, scale: 0.975 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { y: -22, opacity: 0, scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 340, damping: 31, mass: 0.78 }}
            >
              <header className="wtoc-header">
                <div>
                  <div className="wtoc-kicker"><ListTree size={13} /> Навигация по статье</div>
                  <h2>Оглавление</h2>
                  <p>{toc.length} глав · прочитано {percent}%</p>
                </div>
                <motion.button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                  className="wtoc-close"
                  aria-label="Закрыть оглавление"
                  data-testid="mobile-toc-close"
                >
                  <X size={18} />
                </motion.button>
              </header>

              <div className="wtoc-progress" aria-hidden="true">
                <motion.span animate={{ scaleX: progress }} transition={{ type: 'spring', stiffness: 220, damping: 28 }} />
              </div>

              <div ref={listRef} className="wtoc-list" data-testid="mobile-toc-list">
                {toc.map((section, index) => {
                  const active = index === currentIndex;
                  const passed = index < currentIndex;
                  return (
                    <motion.button
                      key={section.anchor}
                      type="button"
                      onClick={() => go(section.anchor)}
                      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                      className={`wtoc-row ${active ? 'is-current' : ''} ${passed ? 'is-passed' : ''}`}
                      aria-current={active ? 'location' : undefined}
                      data-testid="mobile-toc-row"
                    >
                      <span className="wtoc-row-index">{String(section.number).padStart(2, '0')}</span>
                      <span className="wtoc-row-copy">
                        <span>{section.heading}</span>
                        {active && <small>Текущая глава</small>}
                      </span>
                      <ChevronRight size={15} aria-hidden="true" />
                    </motion.button>
                  );
                })}
              </div>

              <footer className="wtoc-footer">
                <BookOpenText size={15} aria-hidden="true" />
                {next ? (
                  <button type="button" onClick={() => go(next.anchor)}>
                    <span>Дальше</span>
                    <strong>{next.heading}</strong>
                  </button>
                ) : (
                  <div>
                    <span>Финальная глава</span>
                    <strong>Источники и обсуждение ниже</strong>
                  </div>
                )}
              </footer>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
