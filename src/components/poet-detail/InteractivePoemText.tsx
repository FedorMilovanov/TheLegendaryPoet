import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// These are presentation-only poses; the word boxes on the copy plane never
// move. Share the common fields rather than rebuilding seven poses per word.
const ease = [0.16, 1, 0.3, 1] as const;
const spring = { type: 'spring' as const, stiffness: 420, damping: 16 };
const resting = { scale: 1, x: 0, y: 0, color: 'rgba(255,255,255,0.90)', filter: 'blur(0px)', opacity: 1, textShadow: 'none', transition: { duration: 0.55, ease } };
const read = { ...resting, color: '#d4af37', textShadow: '0 0 8px rgba(212,175,55,0.22)' };
const focused = { ...resting, scale: 1.42, y: -7, color: '#f5e6a3', textShadow: '0 0 16px rgba(245,230,163,0.62), 0 0 42px rgba(212,175,55,0.22)', transition: { duration: 0.82, ease } };
const blurred = { ...resting, scale: 0.98, filter: 'blur(3.2px)', opacity: 0.42, color: 'rgba(255,255,255,0.68)', transition: { duration: 0.62, ease } };
const hovered = { ...read, scale: 1.1, y: -3, textShadow: '0 0 12px rgba(212,175,55,0.45)', transition: spring };
const returning = { ...read, scale: 1.06, textShadow: '0 0 10px rgba(212,175,55,0.34)', transition: { duration: 0.7, ease } };
const neighbor = { ...resting, scale: 1.035, opacity: 0.9, color: 'rgba(255,255,255,0.86)', transition: { ...spring, stiffness: 360, damping: 12, mass: 0.55 } };

/**
 * Word-by-word reading effect with a separate semantic/canonical text layer.
 *
 * The canonical layer owns the actual poem string for copy, selection and
 * assistive technology. The animated layer is presentation-only and excluded
 * from the accessibility tree.
 */
export default function InteractivePoemText({ text, poemId }: { text: string; poemId: string }) {
  const reduceMotion = useReducedMotion();
  const lines = useMemo(() => text.split('\n').map((line, lineIdx) => {
    let index = 0;
    return line.split(/(\s+)/u).map((token) => !token || /^\s+$/u.test(token)
      ? token
      : { word: token, key: `${lineIdx}-${index}`, index: index++ });
  }), [text]);
  const [focusedWord, setFocusedWord] = useState<string | null>(null);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [returningWord, setReturningWord] = useState<string | null>(null);
  const [readWords, setReadWords] = useState<Set<string>>(() => new Set());
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveredWordRef = useRef<string | null>(null);

  const startDwell = useCallback((key: string) => {
    if (dwellTimer.current) clearTimeout(dwellTimer.current);
    hoveredWordRef.current = key;
    setHoveredWord(key);
    setReadWords((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    dwellTimer.current = setTimeout(() => {
      if (hoveredWordRef.current === key) setFocusedWord(key);
    }, 650);
  }, []);

  const stopDwell = useCallback(() => {
    if (dwellTimer.current) clearTimeout(dwellTimer.current);
    dwellTimer.current = null;
    const leaving = hoveredWordRef.current;
    if (!leaving) return;
    setReturningWord(leaving);
    hoveredWordRef.current = null;
    if (returnTimer.current) clearTimeout(returnTimer.current);
    returnTimer.current = setTimeout(() => setReturningWord(null), 720);
    setHoveredWord(null);
    setFocusedWord(null);
  }, []);

  useEffect(() => {
    return () => {
      if (dwellTimer.current) clearTimeout(dwellTimer.current);
      if (returnTimer.current) clearTimeout(returnTimer.current);
    };
  }, []);

  const focusActive = !reduceMotion && focusedWord !== null;
  const [hoveredLine, hoveredIdx] = hoveredWord?.split('-').map(Number) ?? [];

  return (
    <div
      data-poem-text
      className="theme-dark-island poem-reader-surface relative mb-12 overflow-hidden rounded-[2rem] border border-luxury-gold/5 px-4 py-8 text-2xl leading-[2] tracking-wide shadow-inner sm:px-8 md:px-12"
      onPointerLeave={stopDwell}
      onPointerCancel={stopDwell}
      onPointerDown={stopDwell}
    >
      {/* Same tokens, whitespace and inline boxes on both planes, even after
          wrapping. Only the presentation ink moves; hit testing and copy do not. */}
      <div className="grid whitespace-pre-wrap">
        <span
          data-poem-canonical
          data-reading-flow={`poem-${poemId}`}
          className="relative z-0 col-start-1 row-start-1 min-w-0 cursor-text text-transparent selection:bg-luxury-gold/35 selection:text-transparent"
          style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
        >
          {lines.map((line, lineIdx) => (
            <span key={lineIdx}>
              {lineIdx > 0 ? '\n' : ''}
              {line.map((token) => typeof token === 'string' ? token : (
                <span
                  key={token.key}
                  data-poem-canonical-word
                  className="inline-block max-w-full break-words"
                  onPointerEnter={(event) => {
                    if (!reduceMotion && event.pointerType !== 'touch' && !event.buttons) startDwell(token.key);
                  }}
                  onPointerLeave={stopDwell}
                >
                  {token.word}
                </span>
              ))}
            </span>
          ))}
        </span>

        <div data-poem-visual aria-hidden="true" className="pointer-events-none select-none relative z-10 col-start-1 row-start-1 min-w-0">
          {lines.map((line, lineIdx) => (
            <div key={lineIdx} className="inline">
              {lineIdx > 0 ? '\n' : ''}
              {line.map((token) => {
                if (typeof token === 'string') return token;
                const { key, word, index: wordIdx } = token;
                const isFocused = focusActive && focusedWord === key;
                const isHovered = hoveredWord === key;
                const isReturning = returningWord === key;
                const hasBeenRead = readWords.has(key);
                const isSiblingBlurred = focusActive && !isFocused;
                const isNeighbor = !focusActive && hoveredLine === lineIdx && Math.abs(hoveredIdx - wordIdx) === 1;
                const neighborDirection = hoveredIdx < wordIdx ? 1 : -1;

                return (
                  <motion.span
                    key={key}
                    className="relative inline-block max-w-full break-words"
                    animate={isFocused ? focused : isSiblingBlurred ? blurred : isHovered ? hovered
                      : isNeighbor ? { ...neighbor, x: neighborDirection * 7 }
                      : isReturning ? returning : hasBeenRead ? read : resting}
                    transition={spring}
                    style={{ zIndex: isFocused ? 20 : 1 }}
                  >
                    {word}
                    <span className={`absolute bottom-0 left-0 right-0 h-[1px] origin-left bg-luxury-gold/40 transition-transform duration-300 ${hasBeenRead || isHovered || isFocused ? 'scale-x-100' : 'scale-x-0'}`} />
                  </motion.span>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.03),transparent_70%)]" />
    </div>
  );
}
