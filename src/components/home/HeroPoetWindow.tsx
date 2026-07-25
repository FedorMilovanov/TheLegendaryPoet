import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import type { Poet } from '../../types/poet';
import PoetImage from '../PoetImage';
import { Link } from '../ui/Link';
import './hero-poet-window.css';

interface HeroPoetWindowProps {
  poet: Poet;
  index: number;
}

const pointerSpring = { stiffness: 205, damping: 27, mass: 0.7 };

export default function HeroPoetWindow({ poet, index }: HeroPoetWindowProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const boundsRef = useRef<DOMRect | null>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const latestPointerRef = useRef({ x: 0, y: 0 });
  const prefersReducedMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, pointerSpring);
  const smoothY = useSpring(pointerY, pointerSpring);
  const isHighPriority = index < 2;

  // One pair of smoothed pointer values drives every depth layer. The previous
  // implementation allocated six independent springs per card, multiplying
  // compositor work across all six portraits.
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [4.5, -4.5]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-5.25, 5.25]);
  const imageX = useTransform(smoothX, [-0.5, 0.5], [-4, 4]);
  const imageY = useTransform(smoothY, [-0.5, 0.5], [-3, 3]);
  const haloX = useTransform(smoothX, [-0.5, 0.5], [-24, 24]);
  const haloY = useTransform(smoothY, [-0.5, 0.5], [-17, 17]);

  const cancelPointerFrame = () => {
    if (pointerFrameRef.current !== null) {
      cancelAnimationFrame(pointerFrameRef.current);
      pointerFrameRef.current = null;
    }
  };

  const cacheBounds = () => {
    boundsRef.current = cardRef.current?.getBoundingClientRect() ?? null;
  };

  const resetPointer = () => {
    cancelPointerFrame();
    boundsRef.current = null;
    pointerX.set(0);
    pointerY.set(0);
  };

  const flushPointer = () => {
    pointerFrameRef.current = null;
    const bounds = boundsRef.current ?? cardRef.current?.getBoundingClientRect() ?? null;
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return;
    boundsRef.current = bounds;

    const normalizedX = Math.max(-0.5, Math.min(0.5, (latestPointerRef.current.x - bounds.left) / bounds.width - 0.5));
    const normalizedY = Math.max(-0.5, Math.min(0.5, (latestPointerRef.current.y - bounds.top) / bounds.height - 0.5));
    pointerX.set(normalizedX);
    pointerY.set(normalizedY);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || event.pointerType === 'touch') return;
    latestPointerRef.current = { x: event.clientX, y: event.clientY };
    if (pointerFrameRef.current === null) pointerFrameRef.current = requestAnimationFrame(flushPointer);
  };

  useEffect(() => () => cancelPointerFrame(), []);

  return (
    <motion.div
      data-hero-poet-window-shell
      initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.975 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={prefersReducedMotion
        ? { duration: 0 }
        : { delay: 0.075 * index, duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
      className="relative min-w-0 [perspective:900px]"
    >
      <Link
        to={`/poets/${poet.id}`}
        data-hero-poet-window={poet.id}
        aria-label={`Открыть страницу поэта ${poet.name}`}
        onBlur={resetPointer}
        className="group block rounded-t-[999px] outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 focus-visible:ring-offset-4 focus-visible:ring-offset-[#020811]"
      >
        <motion.div
          ref={cardRef}
          data-hero-poet-window-surface
          onPointerEnter={cacheBounds}
          onPointerMove={handlePointerMove}
          onPointerLeave={resetPointer}
          whileHover={prefersReducedMotion ? undefined : { y: -7, scale: 1.028 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
          style={prefersReducedMotion ? undefined : { rotateX, rotateY, transformPerspective: 900 }}
          transition={{ type: 'spring', stiffness: 285, damping: 27, mass: 0.7 }}
          className="hero-poet-window-surface relative aspect-[4/5] overflow-visible rounded-t-[999px] [transform-style:preserve-3d]"
        >
          <div data-hero-poet-window-glow className="hero-poet-window-glow pointer-events-none absolute -inset-[7px] rounded-t-[999px]" />
          <div aria-hidden="true" className="hero-poet-window-frame pointer-events-none absolute -inset-px rounded-t-[999px]" />

          <div className="hero-poet-window-viewport absolute inset-[1px] overflow-hidden rounded-t-[999px] bg-[#020811]">
            <motion.div
              style={prefersReducedMotion ? undefined : { x: imageX, y: imageY }}
              className="absolute -inset-2"
            >
              <PoetImage
                src={poet.photo}
                name={poet.name}
                alt={`Портрет: ${poet.name}`}
                priority={isHighPriority}
                loading="eager"
                fetchPriority={isHighPriority ? 'high' : 'auto'}
                className="hero-poet-window-image h-full w-full scale-[1.04] object-cover grayscale contrast-125 opacity-75 saturate-[0.68]"
              />
            </motion.div>

            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(94,218,255,0.13),transparent_34%,rgba(1,7,15,0.2)_58%,rgba(1,7,15,0.96))]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,transparent_20%,rgba(1,7,15,0.08)_52%,rgba(1,7,15,0.7)_100%)]" />

            <motion.div
              aria-hidden="true"
              style={prefersReducedMotion ? undefined : { x: haloX, y: haloY }}
              className="hero-poet-window-halo pointer-events-none absolute left-1/2 top-[28%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full sm:h-32 sm:w-32"
            />

            <div
              aria-hidden="true"
              className="hero-poet-window-shine pointer-events-none absolute -left-1/2 top-[-18%] h-[140%] w-[42%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/16 to-transparent opacity-0 blur-[0.75px]"
            />

            <div
              data-hero-poet-window-rim
              aria-hidden="true"
              className="hero-poet-window-rim pointer-events-none absolute inset-[7px] rounded-t-[999px]"
            />

            <div
              data-hero-poet-window-label
              className="hero-poet-window-label pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 px-2 pb-2 opacity-0 sm:px-3 sm:pb-3"
            >
              <div className="hero-poet-window-label-panel rounded-xl border border-cyan-200/15 px-2 py-1.5 text-center sm:px-3 sm:py-2">
                <div
                  data-hero-poet-window-name
                  className="hero-poet-window-name font-serif text-[9px] font-semibold tracking-[0.04em] text-cyan-50 sm:text-[11px]"
                >
                  {poet.name}
                </div>
                <div className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.18em] text-cyan-200/46 sm:text-[8px]">{poet.birthYear}—{poet.deathYear ?? 'н. в.'}</div>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
