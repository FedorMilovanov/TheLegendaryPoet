import { useEffect, useRef, useState, type RefObject } from 'react';
import { Check, Link2 } from '../PremiumIcons';

/**
 * «Поделиться строкой» — select any passage inside the scoped container and a
 * small gold chip offers to copy a deep link to that exact line, built on the
 * URL text-fragment standard (`#:~:text=`). Whoever opens the link lands on
 * the passage with the browser highlighting it — tinted gold via the
 * `::target-text` rules in index.css.
 *
 * Universal engine piece: mount once per long-read page and pass the ref of
 * the text container (essay body, poem sheet, …). No per-article wiring.
 */

/** Escape a string for a text-fragment directive. `-` and `,` are syntax. */
function encodeFragmentPart(s: string): string {
  return encodeURIComponent(s).replace(/-/g, '%2D');
}

/** Build `#:~:text=` URL for the current page pointing at `text`. */
function buildFragmentUrl(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  const base = `${window.location.origin}${window.location.pathname}`;
  const words = clean.split(' ');
  if (clean.length <= 120 || words.length <= 10) {
    return `${base}#:~:text=${encodeFragmentPart(clean)}`;
  }
  // Long selections: range syntax (textStart,textEnd) keeps the URL short.
  const start = words.slice(0, 5).join(' ');
  const end = words.slice(-5).join(' ');
  return `${base}#:~:text=${encodeFragmentPart(start)},${encodeFragmentPart(end)}`;
}

interface ShareLineProps {
  /** The element whose text is shareable (e.g. the essay <article>). */
  scopeRef: RefObject<HTMLElement | null>;
}

export default function ShareLine({ scopeRef }: ShareLineProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const chipRef = useRef<HTMLButtonElement>(null);
  const copiedTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let raf = 0;

    const readSelection = () => {
      const sel = document.getSelection();
      const scope = scopeRef.current;
      if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !scope) return null;
      const range = sel.getRangeAt(0);
      const within =
        scope.contains(range.startContainer) && scope.contains(range.endContainer);
      if (!within || !sel.toString().trim()) return null;
      return range;
    };

    const place = () => {
      const range = readSelection();
      if (!range) {
        setPos(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setPos(null);
        return;
      }
      const chipH = 40;
      const above = rect.top > chipH + 64;
      setPos({
        top: above ? rect.top - chipH - 10 : rect.bottom + 12,
        left: Math.min(Math.max(rect.left + rect.width / 2, 90), window.innerWidth - 90),
      });
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(place);
    };

    document.addEventListener('selectionchange', schedule);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('selectionchange', schedule);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [scopeRef]);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  const copy = async () => {
    const sel = document.getSelection();
    const text = sel?.toString() ?? '';
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(buildFragmentUrl(text));
      setCopied(true);
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => {
        setCopied(false);
        setPos(null);
        document.getSelection()?.removeAllRanges();
      }, 1400);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — fail quietly.
    }
  };

  if (!pos) return null;

  return (
    <button
      ref={chipRef}
      type="button"
      className="share-line-chip"
      style={{ top: pos.top, left: pos.left }}
      // Keep the selection alive: the button must not steal it on tap.
      onPointerDown={(e) => e.preventDefault()}
      onClick={copy}
      aria-live="polite"
    >
      {copied ? (
        <>
          <Check size={13} aria-hidden="true" /> Скопировано
        </>
      ) : (
        <>
          <Link2 size={13} aria-hidden="true" /> Ссылка на строку
        </>
      )}
    </button>
  );
}
