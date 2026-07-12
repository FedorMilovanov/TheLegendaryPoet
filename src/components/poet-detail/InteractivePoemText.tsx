import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Word-by-word reading effect: hover a word and it glows gold; dwell on it
 * and it "focuses" (scales up, blurs its neighbours); every word you've
 * passed over stays tinted gold as a reading trail.
 */
export default function InteractivePoemText({ text }: { text: string }) {
  const lines = text.split('\n');
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

  return (
    <div
      className="poetry-text relative mb-12 overflow-hidden rounded-[2rem] border border-luxury-gold/5 bg-[#050505] px-8 py-8 text-2xl leading-[2] tracking-wide text-white shadow-inner select-none md:px-12"
      onPointerLeave={stopDwell}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.03),transparent_70%)]" />
      {lines.map((line, lineIdx) => (
        <div key={lineIdx} className="relative z-10 flex min-h-[1.5rem] flex-wrap gap-x-[0.34em]">
          {line.trim() === ''
            ? <div className="h-6 w-full" />
            : line.split(' ').map((word, wordIdx) => {
                const key = `${lineIdx}-${wordIdx}`;
                const isFocused = focusedWord === key;
                const isHovered = hoveredWord === key;
                const isReturning = returningWord === key;
                const hasBeenRead = readWords.has(key);
                const isSiblingBlurred = focusActive && !isFocused;
                const hoveredParts = hoveredWord?.split('-').map(Number) || [];
                const hoveredLine = hoveredParts[0];
                const hoveredIdx = hoveredParts[1];
                const isNeighbor = !focusActive && hoveredLine === lineIdx && Math.abs(hoveredIdx - wordIdx) === 1;
                const neighborDirection = hoveredIdx < wordIdx ? 1 : -1;

                return (
                  <motion.span
                    key={key}
                    layout
                    onPointerEnter={() => startDwell(key)}
                    onPointerLeave={stopDwell}
                    className="relative mr-[0.3em] inline-block cursor-default"
                    animate={
                      isFocused
                        ? { scale: 1.42, y: -7, color: '#f5e6a3', filter: 'blur(0px)', opacity: 1, textShadow: '0 0 16px rgba(245,230,163,0.62), 0 0 42px rgba(212,175,55,0.22)', transition: { duration: 0.82, ease: [0.16, 1, 0.3, 1] } }
                        : isSiblingBlurred
                          ? { scale: 0.98, y: 0, filter: 'blur(3.2px)', opacity: 0.42, color: 'rgba(255,255,255,0.68)', textShadow: 'none', transition: { duration: 0.62, ease: [0.16, 1, 0.3, 1] } }
                          : isHovered
                            ? { scale: 1.1, y: -3, filter: 'blur(0px)', opacity: 1, color: '#d4af37', textShadow: '0 0 12px rgba(212,175,55,0.45), 0 0 24px rgba(212,175,55,0.12)', transition: { type: 'spring' as const, stiffness: 420, damping: 16 } }
                            : isNeighbor
                              ? { scale: 1.035, x: neighborDirection * 7, y: -1, filter: 'blur(0px)', opacity: 0.9, color: 'rgba(255,255,255,0.86)', textShadow: 'none', transition: { type: 'spring' as const, stiffness: 360, damping: 12, mass: 0.55 } }
                              : isReturning
                                ? { scale: 1.06, x: 0, y: -1, filter: 'blur(0px)', opacity: 1, color: '#d4af37', textShadow: '0 0 10px rgba(212,175,55,0.34)', transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
                                : hasBeenRead
                                  ? { scale: 1, x: 0, y: 0, filter: 'blur(0px)', opacity: 1, color: '#d4af37', textShadow: '0 0 8px rgba(212,175,55,0.22)', transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } }
                                  : { scale: 1, x: 0, y: 0, filter: 'blur(0px)', opacity: 1, color: 'rgba(255,255,255,0.90)', textShadow: 'none', transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } }
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
      ))}
    </div>
  );
}
