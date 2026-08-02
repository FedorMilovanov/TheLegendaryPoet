import { useEffect, useRef, useState, type RefObject } from 'react';
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

interface ReliableInViewOptions {
  threshold?: number;
  once?: boolean;
}

interface ReliableInViewResult<T extends HTMLElement> {
  ref: RefObject<T | null>;
  inView: boolean;
}

const BOOTSTRAP_CHECK_DELAYS_MS = [0, 80, 240, 600, 1_200, 2_200] as const;

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

export function useReliableInView<T extends HTMLElement>({
  threshold = 0.1,
  once = true,
}: ReliableInViewOptions = {}): ReliableInViewResult<T> {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const boundedThreshold = Math.min(1, Math.max(0, threshold));
    let revealed = false;
    let disposed = false;
    let frame = 0;
    const delayedChecks: number[] = [];

    const setVisible = (visible: boolean) => {
      if (disposed) return;
      if (visible) {
        if (once && revealed) return;
        revealed = true;
        setInView(true);
        return;
      }
      if (!once) setInView(false);
    };

    const checkGeometry = () => {
      frame = 0;
      if (disposed || (once && revealed)) return;

      const rect = element.getBoundingClientRect();
      const visualViewport = window.visualViewport;
      const viewportLeft = visualViewport?.offsetLeft ?? 0;
      const viewportTop = visualViewport?.offsetTop ?? 0;
      const viewportRight = viewportLeft + (visualViewport?.width ?? window.innerWidth);
      const viewportBottom = viewportTop + (visualViewport?.height ?? window.innerHeight);
      const intersectionWidth = Math.max(0, Math.min(rect.right, viewportRight) - Math.max(rect.left, viewportLeft));
      const intersectionHeight = Math.max(0, Math.min(rect.bottom, viewportBottom) - Math.max(rect.top, viewportTop));
      const targetArea = Math.max(1, rect.width * rect.height);
      const intersectionRatio = (intersectionWidth * intersectionHeight) / targetArea;
      const visible = rect.width > 2
        && rect.height > 2
        && intersectionWidth > 1
        && intersectionHeight > 1
        && intersectionRatio >= boundedThreshold;

      setVisible(visible);
    };

    const scheduleGeometryCheck = () => {
      if (disposed || frame || (once && revealed)) return;
      frame = window.requestAnimationFrame(checkGeometry);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= boundedThreshold) {
          setVisible(true);
        } else {
          setVisible(false);
          scheduleGeometryCheck();
        }
      },
      { threshold: boundedThreshold },
    );
    observer.observe(element);

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(scheduleGeometryCheck);
    resizeObserver?.observe(element);

    window.addEventListener('scroll', scheduleGeometryCheck, { passive: true });
    document.addEventListener('scroll', scheduleGeometryCheck, { capture: true, passive: true });
    window.addEventListener('resize', scheduleGeometryCheck, { passive: true });
    window.addEventListener('pageshow', scheduleGeometryCheck);
    document.addEventListener('visibilitychange', scheduleGeometryCheck);
    window.visualViewport?.addEventListener('scroll', scheduleGeometryCheck, { passive: true });
    window.visualViewport?.addEventListener('resize', scheduleGeometryCheck, { passive: true });

    for (const delay of BOOTSTRAP_CHECK_DELAYS_MS) {
      delayedChecks.push(window.setTimeout(scheduleGeometryCheck, delay));
    }

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      for (const timer of delayedChecks) window.clearTimeout(timer);
      observer.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('scroll', scheduleGeometryCheck);
      document.removeEventListener('scroll', scheduleGeometryCheck, true);
      window.removeEventListener('resize', scheduleGeometryCheck);
      window.removeEventListener('pageshow', scheduleGeometryCheck);
      document.removeEventListener('visibilitychange', scheduleGeometryCheck);
      window.visualViewport?.removeEventListener('scroll', scheduleGeometryCheck);
      window.visualViewport?.removeEventListener('resize', scheduleGeometryCheck);
    };
  }, [once, threshold]);

  return { ref, inView };
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
  const { ref, inView } = useReliableInView<HTMLDivElement>({ threshold, once });
  const prefersReduced = useReducedMotion();
  const effectiveDir = prefersReduced ? 'none' : direction;
  const effectiveBlur = prefersReduced ? false : blur;
  const variants = makeVariants(effectiveDir, distance, effectiveBlur);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
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
