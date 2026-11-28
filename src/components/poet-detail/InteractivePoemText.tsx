import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// Reuse fixed motion targets instead of rebuilding identical objects per word.
const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];
const sharp = { filter: 'blur(0px)', opacity: 1 };
const still = { ...sharp, scale: 1, x: 0, y: 0 };
const reading = { ...still, transition: { duration: 0.55, ease } };
const resting = { ...reading, color: 'rgba(255,255,255,0.90)', textShadow: 'none' };
const read = { ...reading, color: '#d4af37', textShadow: '0 0 8px rgba(212,175,55,0.22)' };
const returning = { ...still, scale: 1.06, y: -1, color: '#d4af37', textShadow: '0 0 10px rgba(212,175,55,0.34)', transition: { duration: 0.7, ease } };
const focused = { ...sharp, scale: 1.42, y: -7, color: '#f5e6a3', textShadow: '0 0 16px rgba(245,230,163,0.62), 0 0 42px rgba(212,175,55,0.22)', transition: { duration: 0.82, ease } };
const blurred = { scale: 0.98, y: 0, filter: 'blur(3.2px)', opacity: 0.42, color: 'rgba(255,255,255,0.68)', textShadow: 'none', transition: { duration: 0.62, ease } };
const hovered = { ...sharp, scale: 1.1, y: -3, color: '#d4af37', textShadow: '0 0 12px rgba(212,175,55,0.45), 0 0 24px rgba(212,175,55,0.12)', transition: { type: 'spring' as const, stiffness: 420, damping: 16 } };
const neighbor = { scale: 1.035, y: -1, filter: sharp.filter, opacity: 0.9, color: 'rgba(255,255,255,0.86)', textShadow: 'none', transition: { type: 'spring' as const, stiffness: 360, damping: 12, mass: 0.55 } };

/**
 * Word-by-word reading effect with a separate semantic/canonical text layer.
 *
 * The canonical layer owns the actual poem string for copy, selection and
 * assistive technology. The animated layer is presentation-only and excluded
 * from the accessibility tree.
 */
export default function InteractivePoemText({ text }: { text: string }) {
  const lines = useMemo(() => text.split('\n').map((line) => line.split(/(\s+)/u)), [text]);
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
    setReturningWord((current) => hoveredWordRef.current || current);
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

  const focusActive = focusedWord !== null;
  const [hoveredLine, hoveredIdx] = hoveredWord?.split('-').map(Number) || [];

  return (
    <div
      data-poem-text
      className="theme-dark-island poem-reader-surface relative mb-12 overflow-hidden rounded-[2rem] border border-luxury-gold/5 px-4 py-8 text-2xl leading-[2] tracking-wide shadow-inner sm:px-8 md:px-12"
      onPointerLeave={stopDwell}
    >
      {/* Both planes share identical tokens, whitespace, word boxes and wrapping.
          Only the presentation ink moves; selection and hit testing do not. */}
      <div className="grid whitespace-pre-wrap">
        <span
        data-poem-canonical
        className="pointer-events-auto relative z-0 col-start-1 row-start-1 block min-w-0 whitespace-pre-wrap text-transparent selection:bg-luxury-gold/35 selection:text-transparent"
        style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
      >
        {lines.map((tokens, lineIdx) => {
          let wordIdx = 0;
          return (
            <span key={lineIdx}>
              {lineIdx > 0 ? '\n' : ''}
              {tokens.map((token, tokenIdx) => {
                if (token === '' || /^\s+$/u.test(token)) return token;
                const key = `${lineIdx}-${wordIdx++}`;
                return (
                  <span
                    key={`${tokenIdx}-${token}`}
                    data-poem-canonical-word
                    onPointerEnter={() => startDwell(key)}
                    onPointerLeave={stopDwell}
                    className="inline-block max-w-full break-words cursor-text text-transparent"
                  >
                    {token}
                  </span>
                );
              })}
            </span>
          );
        })}
      </span>

      <div
        data-poem-visual
        aria-hidden="true"
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        className="pointer-events-none relative z-10 col-start-1 row-start-1 min-w-0"
      >
        {lines.map((tokens, lineIdx) => {
          let nextWordIdx = 0;
          return (
          <div key={lineIdx} className="inline">
            {lineIdx > 0 ? '\n' : ''}
            {tokens.map((word) => {
                  if (word === '' || /^\s+$/u.test(word)) return word;
                  const wordIdx = nextWordIdx++;
                  const key = `${lineIdx}-${wordIdx}`;
                  const isFocused = focusedWord === key;
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
                      animate={isFocused ? focused : isSiblingBlurred ? blurred : isHovered ? hovered : isNeighbor ? { ...neighbor, x: neighborDirection * 7 } : isReturning ? returning : hasBeenRead ? read : resting
                      }
                      whileHover={!focusActive ? { scale: 1.14, y: -3, color: '#d4af37', textShadow: '0 0 12px rgba(212,175,55,0.5), 0 0 24px rgba(212,175,55,0.15)' } : undefined}
                      transition={{ type: 'spring', stiffness: 350, damping: 14 }}
                      style={{ zIndex: isFocused ? 20 : 1, willChange: 'transform, filter' }}
                    >
                      {word}
                      <span className={`absolute bottom-0 left-0 right-0 h-[1px] origin-left bg-luxury-gold/40 transition-transform duration-300 ${hasBeenRead || isHovered || isFocused ? 'scale-x-100' : 'scale-x-0'}`} />
                    </motion.span>
                  );
                })}
          </div>
          );
        })}
      </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.03),transparent_70%)]" />
    </div>
  );
}
