import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface RevealProps {
  children: React.ReactNode;
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

export default function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.78,
  distance = 30,
  threshold = 0.1,
  className = '',
  once = true,
  blur = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const framerReduced = useReducedMotion();
  const [nativeReduced, setNativeReduced] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true,
  );
  const prefersReduced = framerReduced === true || nativeReduced;

  // Framer's hook can resolve after the first paint in an emulated or newly
  // changed media environment. Native matchMedia gives the initial render a
  // synchronous answer, so below-the-fold prose never starts at opacity:0 for
  // reduced-motion users.
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const update = () => setNativeReduced(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  const [inView, setInView] = useState(prefersReduced);

  useEffect(() => {
    if (prefersReduced) {
      setInView(true);
      return;
    }

    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once, prefersReduced]);

  const effectiveDir = prefersReduced ? 'none' : direction;
  const effectiveBlur = prefersReduced ? false : blur;
  const variants = makeVariants(effectiveDir, distance, effectiveBlur);
  const visible = prefersReduced || inView;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={prefersReduced ? 'visible' : 'hidden'}
      animate={visible ? 'visible' : 'hidden'}
      variants={variants}
      transition={{
        duration: prefersReduced ? 0 : duration,
        delay: prefersReduced ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
