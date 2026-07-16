import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface RevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  distance?: number;
  threshold?: number;
  className?: string;
  once?: boolean;
  blur?: boolean;
}

function makeVariants(direction: Direction, distance: number, blur: boolean): Variants {
  const offsets: Record<Direction, { x: number; y: number }> = {
    up: { x: 0, y: distance },
    down: { x: 0, y: -distance },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  };
  const { x, y } = offsets[direction];
  return {
    hidden: { opacity: 0, x, y, filter: blur ? 'blur(6px)' : 'none' },
    visible: { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' },
  };
}

export default function Reveal({ children, direction = 'up', delay = 0, duration = 0.78, distance = 30, threshold = 0.1, className = '', once = true, blur = true }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); if (once) observer.disconnect(); }
        else if (!once) { setInView(false); }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  const effectiveDir = prefersReduced ? 'none' : direction;
  const effectiveBlur = prefersReduced ? false : blur;
  const variants = makeVariants(effectiveDir, distance, effectiveBlur);

  return (
    <motion.div ref={ref} className={className} initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={variants}
      transition={{ duration: prefersReduced ? 0 : duration, delay: prefersReduced ? 0 : delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}