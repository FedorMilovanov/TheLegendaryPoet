import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
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

interface HeroPoetWindowProps {
  poet: Poet;
  index: number;
}

const tiltSpring = { stiffness: 190, damping: 24, mass: 0.72 };
const driftSpring = { stiffness: 150, damping: 28, mass: 0.82 };

export default function HeroPoetWindow({ poet, index }: HeroPoetWindowProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [5.5, -5.5]), tiltSpring);
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-6.5, 6.5]), tiltSpring);
  const imageX = useSpring(useTransform(pointerX, [-0.5, 0.5], [-5, 5]), driftSpring);
  const imageY = useSpring(useTransform(pointerY, [-0.5, 0.5], [-4, 4]), driftSpring);
  const haloX = useSpring(useTransform(pointerX, [-0.5, 0.5], [-34, 34]), driftSpring);
  const haloY = useSpring(useTransform(pointerY, [-0.5, 0.5], [-24, 24]), driftSpring);

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || event.pointerType === 'touch') return;
    const bounds = cardRef.current?.getBoundingClientRect();
    if (!bounds) return;

    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.09 * index, duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
      className="relative min-w-0 [perspective:900px]"
    >
      <Link
        to={`/poets/${poet.id}`}
        aria-label={`Открыть страницу поэта ${poet.name}`}
        className="group block rounded-t-[999px] outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 focus-visible:ring-offset-4 focus-visible:ring-offset-[#020811]"
      >
        <motion.div
          ref={cardRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={resetPointer}
          onBlur={resetPointer}
          whileHover={prefersReducedMotion ? undefined : { y: -8, scale: 1.035 }}
          whileTap={{ scale: 0.975 }}
          style={prefersReducedMotion ? undefined : { rotateX, rotateY, transformPerspective: 900 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 0.74 }}
          className="relative aspect-[4/5] overflow-visible rounded-t-[999px] [transform-style:preserve-3d]"
        >
          <div className="pointer-events-none absolute -inset-[7px] rounded-t-[999px] border border-cyan-200/0 bg-[radial-gradient(circle_at_50%_18%,rgba(95,225,255,0.24),transparent_48%)] opacity-35 blur-xl transition-all duration-700 group-hover:border-cyan-200/20 group-hover:opacity-100 group-hover:blur-2xl group-focus-visible:border-cyan-200/20 group-focus-visible:opacity-100" />
          <div className="pointer-events-none absolute -inset-px rounded-t-[999px] bg-[linear-gradient(145deg,rgba(198,247,255,0.68),rgba(55,170,255,0.12)_34%,rgba(2,8,17,0.9)_66%,rgba(83,204,255,0.42))] opacity-45 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" />

          <div className="absolute inset-[1px] overflow-hidden rounded-t-[999px] bg-[#020811] shadow-[0_18px_42px_rgba(0,0,0,0.48),inset_0_0_0_1px_rgba(173,238,255,0.08)] transition-shadow duration-700 group-hover:shadow-[0_25px_58px_rgba(0,0,0,0.58),0_0_34px_rgba(38,187,255,0.24),inset_0_0_0_1px_rgba(180,241,255,0.22)] group-focus-visible:shadow-[0_25px_58px_rgba(0,0,0,0.58),0_0_34px_rgba(38,187,255,0.24),inset_0_0_0_1px_rgba(180,241,255,0.22)]">
            <motion.div
              style={prefersReducedMotion ? undefined : { x: imageX, y: imageY }}
              className="absolute -inset-2"
            >
              <PoetImage
                src={poet.photo}
                name={poet.name}
                alt={`Портрет: ${poet.name}`}
                className="h-full w-full scale-[1.04] object-cover grayscale contrast-125 opacity-75 saturate-[0.68] transition-[filter,opacity,transform] duration-700 ease-out group-hover:scale-[1.095] group-hover:grayscale-[0.28] group-hover:opacity-95 group-hover:saturate-[0.88] group-focus-visible:scale-[1.095] group-focus-visible:grayscale-[0.28] group-focus-visible:opacity-95 group-focus-visible:saturate-[0.88]"
              />
            </motion.div>

            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(94,218,255,0.16),transparent_34%,rgba(1,7,15,0.2)_58%,rgba(1,7,15,0.96))]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,transparent_20%,rgba(1,7,15,0.1)_52%,rgba(1,7,15,0.72)_100%)]" />

            <motion.div
              aria-hidden="true"
              style={prefersReducedMotion ? undefined : { x: haloX, y: haloY }}
              className="pointer-events-none absolute left-1/2 top-[28%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200/25 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 sm:h-32 sm:w-32"
            />

            <div aria-hidden="true" className="pointer-events-none absolute -left-1/2 top-[-18%] h-[140%] w-[46%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/18 to-transparent opacity-0 blur-[1px] transition-[transform,opacity] duration-700 ease-out group-hover:translate-x-[330%] group-hover:opacity-70 group-focus-visible:translate-x-[330%] group-focus-visible:opacity-70" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-[13%] top-[8%] h-px bg-gradient-to-r from-transparent via-cyan-100/70 to-transparent opacity-30 transition-opacity duration-500 group-hover:opacity-90 group-focus-visible:opacity-90" />

            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 px-2 pb-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 sm:px-3 sm:pb-3">
              <div className="rounded-xl border border-cyan-200/15 bg-[#020811]/72 px-2 py-1.5 text-center shadow-[0_0_24px_rgba(0,183,255,0.14)] backdrop-blur-md sm:px-3 sm:py-2">
                <div className="truncate font-serif text-[9px] font-semibold tracking-[0.04em] text-cyan-50 sm:text-[11px]">
                  {poet.name}
                </div>
                <div className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.18em] text-cyan-200/46 sm:text-[8px]">
                  {poet.birthYear}—{poet.deathYear ?? 'н. в.'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
