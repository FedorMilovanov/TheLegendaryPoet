import { useEffect, useRef, useState, type RefObject } from 'react';
import { useHref } from 'react-router';
import { canonicalRoutePath } from '../../routes/publicUrl';
import { selectedPublicRange, sharedPassageId } from '../../utils/sharedPassage';
import { useAnchoredPanel } from '../../hooks/useAnchoredPanel';
import { Check, Share2 } from 'lucide-react';

/** Escape a string for a text-fragment directive. `-` and `,` are syntax. */
function encodeFragmentPart(s: string): string {
  return encodeURIComponent(s).replace(/-/g, '%2D');
}

function buildFragmentUrl(href: string, passage: string, text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  const words = clean.split(' ');
  const parts = clean.length > 120 && words.length > 10 ? [words.slice(0, 5).join(' '), words.slice(-5).join(' ')] : [clean];
  return `${window.location.origin}${href}#${encodeURIComponent(passage)}:~:text=${parts.map(encodeFragmentPart).join(',')}`;
}

function sameSelection(a: Range, b: Range | null) {
  return b !== null && a.startContainer === b.startContainer && a.startOffset === b.startOffset &&
    a.endContainer === b.endContainer && a.endOffset === b.endOffset;
}

interface ShareLineProps {
  path: string;
  /** The element whose text is shareable (e.g. the essay <article>). */
  scopeRef: RefObject<HTMLElement | null>;
}

/** Copy a public reading address plus a native text-fragment directive. The
 * directive can highlight a match; the passage address also works when the
 * browser does not highlight or the article only arrives after page load. */
export default function ShareLine({ scopeRef, path }: ShareLineProps) {
  const href = useHref(canonicalRoutePath(path)); // source on screen, not an unpainted destination
  const [visible, setVisible] = useState(false);
  const selectionRef = useRef<Range | null>(null);
  const [feedback, setFeedback] = useState<'copied' | 'failed' | null>(null);
  const feedbackRange = useRef<Range | null>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const copiedTimer = useRef<number | undefined>(undefined);

  useAnchoredPanel(visible, selectionRef, chipRef, 10);

  useEffect(() => {
    const sync = () => {
      selectionRef.current = selectedPublicRange(scopeRef.current);
      if (feedbackRange.current && !sameSelection(feedbackRange.current, selectionRef.current)) {
        feedbackRange.current = null;
        window.clearTimeout(copiedTimer.current);
        setFeedback(null);
      }
      setVisible(selectionRef.current !== null);
    };
    setFeedback(null);
    sync();
    document.addEventListener('selectionchange', sync);
    return () => {
      document.removeEventListener('selectionchange', sync);
      feedbackRange.current = null;
      window.clearTimeout(copiedTimer.current);
    };
  }, [scopeRef, href]);

  const copy = async () => {
    const scope = scopeRef.current, range = selectedPublicRange(scope);
    if (!scope || !range || !sameSelection(range, selectionRef.current)) return;
    const passage = sharedPassageId(scope, range);
    if (!passage) return;
    const snapshot = range.cloneRange();
    feedbackRange.current = snapshot;
    window.clearTimeout(copiedTimer.current);
    let result: 'copied' | 'failed' = 'copied';
    try {
      await navigator.clipboard.writeText(buildFragmentUrl(href, passage, document.getSelection()!.toString()));
    } catch {
      result = 'failed';
    }
    if (feedbackRange.current !== snapshot || !sameSelection(snapshot, selectedPublicRange(scope))) return;
    setFeedback(result);
    copiedTimer.current = window.setTimeout(() => {
      feedbackRange.current = null;
      setFeedback(null);
    }, 1400);
  };

  if (!visible) return null;

  const Icon = feedback === 'copied' ? Check : Share2;
  return (
    <button
      ref={chipRef}
      type="button"
      className="anchored-panel share-line-chip"
      // Keep the selection alive: the button must not steal it on tap.
      onPointerDown={(e) => e.preventDefault()}
      onClick={copy}
      aria-live="polite"
    >
      <Icon size={13} aria-hidden="true" />
      {feedback === 'copied' ? 'Скопировано' : feedback === 'failed' ? 'Не удалось скопировать' : 'Ссылка на строку'}
    </button>
  );
}
