/**
 * KineticText - per-letter spring hover + long-dwell focus mode.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, type Variants } from 'framer-motion';

interface KineticTextProps {
  text: string;
  className?: string;
  stagger?: number;
  variant?: 'wave' | 'glow';
  tag?: 'h1' | 'h2' | 'h3' | 'span' | 'p';
  focusMode?: boolean;
  sharedFocusKey?: string | null;
  onSharedFocusChange?: (key: string | null) => void;
  focusKeyPrefix?: string;
  focusScale?: number;
}

const waveVariants: Variants = {
  rest: { y: 0, rotateZ: 0 },
  hover: {
    y: -8,
    rotateZ: [-1.5, 1.5, 0],
    transition: { type: 'spring', stiffness: 520, damping: 16, mass: 0.5 },
  },
};

const glowVariants: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.18,
    transition: { type: 'spring', stiffness: 600, damping: 20 },
  },
};

export default function KineticText({
  text,
  className = '',
  stagger = 0.03,
  variant = 'wave',
  tag: Tag = 'span',
  focusMode = true,
  sharedFocusKey,
  onSharedFocusChange,
  focusKeyPrefix = text,
  focusScale = 1.42,
}: KineticTextProps) {
  const variants = variant === 'glow' ? glowVariants : waveVariants;
  const words = text.split(' ');
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startDwell = useCallback((globalIdx: number, key: string) => {
    if (!focusMode) return;
    if (dwellTimer.current) clearTimeout(dwellTimer.current);
    dwellTimer.current = setTimeout(() => {
      if (onSharedFocusChange) onSharedFocusChange(key);
      else setFocusIdx(globalIdx);
    }, 720);
  }, [focusMode, onSharedFocusChange]);

  const cancelDwell = useCallback(() => {
    if (dwellTimer.current) clearTimeout(dwellTimer.current);
    dwellTimer.current = null;
    if (onSharedFocusChange) onSharedFocusChange(null);
    else setFocusIdx(null);
  }, [onSharedFocusChange]);

  useEffect(() => () => { if (dwellTimer.current) clearTimeout(dwellTimer.current); }, []);

  const isFocusActive = onSharedFocusChange ? sharedFocusKey !== null : focusIdx !== null;
  let globalCounter = 0;

  return (
    <Tag className={`inline-flex flex-wrap ${className}`} aria-label={text} onPointerLeave={cancelDwell}>
      {words.map((word, wi) => (
        <span key={wi} className="kinetic-word mr-[0.28em] inline-flex last:mr-0" aria-hidden>
          {Array.from(word).map((char, ci) => {
            const idx = globalCounter++;
            const letterKey = `${focusKeyPrefix}-${idx}`;
            const isFocused = onSharedFocusChange ? sharedFocusKey === letterKey : isFocusActive && focusIdx === idx;
            const isSibling = isFocusActive && !isFocused;

            return (
              <motion.span
                key={`${wi}-${ci}`}
                className="kinetic-letter inline-block cursor-default select-none"
                initial="rest"
                whileHover={!isFocusActive ? 'hover' : undefined}
                variants={variants}
                onPointerEnter={() => startDwell(idx, letterKey)}
                onPointerLeave={cancelDwell}
                animate={
                  isFocused
                    ? {
                        scale: focusScale,
                        y: -8,
                        filter: 'blur(0px)',
                        textShadow: '0 0 12px rgba(216,253,255,0.9), 0 0 34px rgba(0,212,255,0.55)',
                        transition: { duration: 0.95, ease: [0.16, 1, 0.3, 1] },
                      }
                    : isSibling
                      ? {
                          scale: 0.97,
                          y: 0,
                          filter: 'blur(3.5px)',
                          opacity: 0.55,
                          textShadow: 'none',
                          transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                        }
                      : {
                          scale: 1,
                          y: 0,
                          filter: 'blur(0px)',
                          opacity: 1,
                          textShadow: 'none',
                          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                        }
                }
                transition={{ delay: (wi * 6 + ci) * stagger }}
                style={{ display: 'inline-block', willChange: 'transform, filter', zIndex: isFocused ? 10 : 1, position: 'relative', transformOrigin: 'center center' }}
              >
                {char}
              </motion.span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}