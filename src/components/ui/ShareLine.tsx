import { useEffect, useRef, useState, type RefObject } from 'react';
import { Check, Link2 } from 'lucide-react';

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

/** Add a published poem/source anchor when the selection lies inside one.
 * It remains useful even if the browser cannot highlight a text directive. */
function buildFragmentUrl(text: string, anchor = ''): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  const base = `${window.location.origin}${window.location.pathname}#${encodeURIComponent(anchor)}`;
  const words = clean.split(' ');
  if (clean.length <= 120 || words.length <= 10) {
    return `${base}:~:text=${encodeFragmentPart(clean)}`;
  }
  // Long selections: range syntax (textStart,textEnd) keeps the URL short.
  const start = words.slice(0, 5).join(' ');
  const end = words.slice(-5).join(' ');
  return `${base}:~:text=${encodeFragmentPart(start)},${encodeFragmentPart(end)}`;
}


const privateRegion = 'input,textarea,select,[contenteditable],[data-community-target]';

function readPublicSelection(scope: HTMLElement | null) {
  const selection = document.getSelection();
  if (!scope || selection?.rangeCount !== 1 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  const common = range.commonAncestorContainer;
  const host = common instanceof Element ? common : common.parentElement;
  if (!scope.contains(common) || host?.closest(privateRegion)) return null;
  // A range can start and end in public text but cross a local comment.
  if (common instanceof Element && Array.from(common.querySelectorAll(privateRegion)).some(node => range.intersectsNode(node))) return null;
  return selection.toString().trim() ? range : null;
}

function sameSelection(a: Range, b: Range | null) {
  return b !== null && a.startContainer === b.startContainer && a.startOffset === b.startOffset &&
    a.endContainer === b.endContainer && a.endOffset === b.endOffset;
}

interface ShareLineProps {
  /** The element whose text is shareable (e.g. the essay <article>). */
  scopeRef: RefObject<HTMLElement | null>;
}

export default function ShareLine({ scopeRef }: ShareLineProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [feedback, setFeedback] = useState<'copied' | 'failed' | null>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const visibleRange = useRef<Range | null>(null);
  const copiedRange = useRef<Range | null>(null);
  const copiedTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let raf = 0;

    const place = () => {
      const range = readPublicSelection(scopeRef.current);
      visibleRange.current = range?.cloneRange() ?? null;
      if (copiedRange.current && !sameSelection(copiedRange.current, range)) {
        copiedRange.current = null;
        window.clearTimeout(copiedTimer.current);
        setFeedback(null);
      }
      if (!range) {
        setPos(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        visibleRange.current = null;
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
      visibleRange.current = null;
      copiedRange.current = null;
      window.clearTimeout(copiedTimer.current);
    };
  }, [scopeRef]);

  const copy = async () => {
    const range = readPublicSelection(scopeRef.current);
    const shown = visibleRange.current;
    if (!range || !shown || !sameSelection(shown, range)) return;
    const text = document.getSelection()?.toString() ?? '';
    const snapshot = range.cloneRange();
    copiedRange.current = snapshot;
    window.clearTimeout(copiedTimer.current);
    setFeedback(null);
    const common = range.commonAncestorContainer;
    const host = common instanceof Element ? common : common.parentElement;
    const target = host?.closest<HTMLElement>('[id^="poem-"], li[id^="source-"], h2[id^="sec-"]');
    const anchor = target && scopeRef.current?.contains(target) ? target.id : '';
    let result: 'copied' | 'failed' = 'copied';
    try {
      await navigator.clipboard.writeText(buildFragmentUrl(text, anchor));
    } catch {
      result = 'failed';
    }
    if (copiedRange.current !== snapshot || !sameSelection(snapshot, readPublicSelection(scopeRef.current))) return;
    setFeedback(result);
    copiedTimer.current = window.setTimeout(() => {
      if (copiedRange.current !== snapshot) return;
      copiedRange.current = null;
      setFeedback(null);
    }, 1400);
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
      {feedback === 'copied' ? (
        <>
          <Check size={13} aria-hidden="true" /> Скопировано
        </>
      ) : (
        <>
          <Link2 size={13} aria-hidden="true" /> {feedback === 'failed' ? 'Не удалось скопировать' : 'Ссылка на строку'}
        </>
      )}
    </button>
  );
}
