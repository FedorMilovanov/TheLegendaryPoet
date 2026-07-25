import { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-11 w-11',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
};

const premiumEase = [0.16, 1, 0.3, 1] as const;

/**
 * The anonymous poet: a faceless hood, a midnight cloak and an illuminated
 * open book. The mark stays crisp at favicon scale and unfolds very gently on
 * hover without turning the header into a distracting animation.
 */
export default function BrandMark({ size = 'sm', className }: BrandMarkProps) {
  const uid = useId().replace(/:/g, '');
  const ids = {
    title: `${uid}-brand-title`,
    cloak: `${uid}-brand-cloak`,
    hood: `${uid}-brand-hood`,
    edge: `${uid}-brand-edge`,
    wingLeft: `${uid}-brand-wing-left`,
    wingRight: `${uid}-brand-wing-right`,
    book: `${uid}-brand-book`,
    fold: `${uid}-brand-fold`,
    halo: `${uid}-brand-halo`,
    void: `${uid}-brand-void`,
    glow: `${uid}-brand-glow`,
    mist: `${uid}-brand-mist`,
  };

  return (
    <motion.span
      data-brand-mark
      className={cn('relative inline-flex shrink-0 items-center justify-center overflow-visible', sizes[size], className)}
      initial="idle"
      animate="idle"
      whileHover="hover"
    >
      <motion.svg
        className="h-full w-full overflow-visible"
        viewBox="0 0 96 96"
        role="img"
        aria-labelledby={ids.title}
        variants={{
          idle: { filter: 'drop-shadow(0 0 5px rgba(46,216,255,0.18))' },
          hover: {
            filter: 'drop-shadow(0 0 11px rgba(46,216,255,0.42))',
            transition: { duration: 0.7, ease: premiumEase },
          },
        }}
      >
        <title id={ids.title}>THE LEGENDARY POET</title>
        <defs>
          <linearGradient id={ids.cloak} x1="18" y1="8" x2="78" y2="94">
            <stop offset="0" stopColor="#123449" />
            <stop offset="0.16" stopColor="#0a2132" />
            <stop offset="0.55" stopColor="#06101b" />
            <stop offset="1" stopColor="#010207" />
          </linearGradient>
          <linearGradient id={ids.hood} x1="32" y1="7" x2="63" y2="45">
            <stop offset="0" stopColor="#e8feff" stopOpacity="0.9" />
            <stop offset="0.14" stopColor="#5ec9df" stopOpacity="0.62" />
            <stop offset="0.4" stopColor="#16384c" />
            <stop offset="0.72" stopColor="#08131f" />
            <stop offset="1" stopColor="#02040a" />
          </linearGradient>
          <linearGradient id={ids.edge} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e8feff" />
            <stop offset="0.5" stopColor="#54dcf5" />
            <stop offset="1" stopColor="#2854c7" />
          </linearGradient>
          <linearGradient id={ids.wingLeft} x1="12" y1="42" x2="35" y2="82">
            <stop offset="0" stopColor="#bff9ff" stopOpacity="0.32" />
            <stop offset="0.35" stopColor="#1a668e" stopOpacity="0.22" />
            <stop offset="1" stopColor="#020610" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id={ids.wingRight} x1="84" y1="42" x2="61" y2="82">
            <stop offset="0" stopColor="#7ee8ff" stopOpacity="0.24" />
            <stop offset="0.35" stopColor="#174c76" stopOpacity="0.2" />
            <stop offset="1" stopColor="#020610" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id={ids.book} x1="34" y1="54" x2="62" y2="70">
            <stop offset="0" stopColor="#eefcff" />
            <stop offset="0.42" stopColor="#82dce8" />
            <stop offset="1" stopColor="#193a5d" />
          </linearGradient>
          <linearGradient id={ids.fold} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#040813" stopOpacity="0.1" />
            <stop offset="0.5" stopColor="#02040b" stopOpacity="0.75" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.98" />
          </linearGradient>
          <linearGradient id={ids.halo} x1="24" y1="7" x2="72" y2="40">
            <stop offset="0" stopColor="#d9fcff" stopOpacity="0.65" />
            <stop offset="0.55" stopColor="#39dffc" stopOpacity="0.45" />
            <stop offset="1" stopColor="#486cff" stopOpacity="0.08" />
          </linearGradient>
          <radialGradient id={ids.void} cx="50%" cy="38%" r="65%">
            <stop offset="0" stopColor="#000000" />
            <stop offset="0.62" stopColor="#01030a" />
            <stop offset="1" stopColor="#071525" />
          </radialGradient>
          <filter id={ids.glow} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
          <filter id={ids.mist} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.8" />
          </filter>
        </defs>

        <motion.path
          data-brand-halo
          d="M24 40 C26 18 35 6 48 4 C61 6 70 18 72 40"
          fill="none"
          stroke={`url(#${ids.halo})`}
          strokeWidth="0.85"
          strokeLinecap="round"
          variants={{
            idle: { opacity: 0.34, pathLength: 0.74 },
            hover: {
              opacity: 0.8,
              pathLength: 1,
              transition: { duration: 0.85, ease: premiumEase },
            },
          }}
        />

        <motion.g
          opacity="0.5"
          filter={`url(#${ids.mist})`}
          variants={{
            idle: { opacity: 0.18, scaleX: 0.92 },
            hover: {
              opacity: 0.48,
              scaleX: 1.06,
              transition: { duration: 0.8, ease: premiumEase },
            },
          }}
          style={{ transformOrigin: '48px 82px' }}
        >
          <path d="M17 83 C26 78 35 78 48 83 C61 78 70 78 79 83" fill="none" stroke="#2ed8ff" strokeWidth="2" />
        </motion.g>

        <motion.path
          d="M48 28 C38 28 31 33 26 42 C20 53 15 66 12 80 C10 87 10 91 12 93 C25 89 36 89 48 91 C60 89 71 89 84 93 C86 91 86 87 84 80 C81 66 76 53 70 42 C65 33 58 28 48 28Z"
          fill={`url(#${ids.cloak})`}
          stroke={`url(#${ids.edge})`}
          strokeWidth="0.72"
          variants={{
            idle: { scaleY: 1 },
            hover: {
              scaleY: 1.015,
              transition: { duration: 0.72, ease: premiumEase },
            },
          }}
          style={{ transformOrigin: '48px 91px' }}
        />

        <motion.path
          data-brand-wing="left"
          d="M31 39 C23 43 16 56 12 73 C10 82 11 88 16 86 C23 81 29 68 35 52"
          fill={`url(#${ids.wingLeft})`}
          stroke="#baf8ff"
          strokeWidth="0.9"
          variants={{
            idle: { x: 0, rotate: 0, opacity: 0.68 },
            hover: {
              x: -1.8,
              rotate: -1.8,
              opacity: 0.92,
              transition: { duration: 0.72, ease: premiumEase },
            },
          }}
          style={{ transformOrigin: '34px 50px' }}
        />
        <motion.path
          data-brand-wing="right"
          d="M65 39 C73 43 80 56 84 73 C86 82 85 88 80 86 C73 81 67 68 61 52"
          fill={`url(#${ids.wingRight})`}
          stroke="#7ddfff"
          strokeWidth="0.9"
          variants={{
            idle: { x: 0, rotate: 0, opacity: 0.56 },
            hover: {
              x: 1.8,
              rotate: 1.8,
              opacity: 0.86,
              transition: { duration: 0.72, ease: premiumEase },
            },
          }}
          style={{ transformOrigin: '62px 50px' }}
        />

        <motion.g
          variants={{
            idle: { y: 0 },
            hover: {
              y: -0.7,
              transition: { duration: 0.68, ease: premiumEase },
            },
          }}
        >
          <path
            d="M48 4 C39 4 34 13 33 24 C32 33 35 39 40 43 C42.5 45 45 46 48 46 C51 46 53.5 45 56 43 C61 39 64 33 63 24 C62 13 57 4 48 4Z"
            fill={`url(#${ids.hood})`}
            stroke={`url(#${ids.edge})`}
            strokeWidth="0.78"
          />
          <path
            d="M48 13 C41.5 13 38 20 38 29 C38 37.5 42 42 48 43 C54 42 58 37.5 58 29 C58 20 54.5 13 48 13Z"
            fill={`url(#${ids.void})`}
          />
          <path d="M33.5 24 C33.2 31 35.5 38 40 42" fill="none" stroke="#eaffff" strokeWidth="0.8" opacity="0.56" strokeLinecap="round" />
          <path d="M62.5 24 C62.8 31 60.5 38 56 42" fill="none" stroke="#52dff5" strokeWidth="0.65" opacity="0.32" strokeLinecap="round" />
        </motion.g>

        <path
          d="M48 44 C43.5 58 42 73 42.7 89 C45 87.8 47 84.5 48 81 C49 84.5 51 87.8 53.3 89 C54 73 52.5 58 48 44Z"
          fill={`url(#${ids.fold})`}
          opacity="0.96"
        />
        <path d="M34 48 C30 61 27 74 28 86" fill="none" stroke="#7cecff" strokeWidth="0.55" opacity="0.22" />
        <path d="M62 48 C66 61 69 74 68 86" fill="none" stroke="#7cecff" strokeWidth="0.55" opacity="0.14" />

        <motion.g
          data-brand-book
          variants={{
            idle: { y: 0, scale: 0.86 },
            hover: {
              y: -1.1,
              scale: 0.9,
              transition: { duration: 0.72, ease: premiumEase },
            },
          }}
          style={{ transformOrigin: '48px 62px' }}
        >
          <path
            d="M33 55 C38 52.5 43.5 53.7 48 58 C52.5 53.7 58 52.5 63 55 L61 68.5 C56 67.8 52 69.5 48 73.5 C44 69.5 40 67.8 35 68.5Z"
            fill={`url(#${ids.book})`}
            stroke="#d7fcff"
            strokeWidth="0.65"
            opacity="0.9"
          />
          <path d="M48 58 V73.4" stroke="#d4af37" strokeWidth="0.85" opacity="0.85" />
          <path d="M35.2 57.2 C39.6 55.7 43.5 56.7 47 59.9" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.42" />
          <path d="M60.8 57.2 C56.4 55.7 52.5 56.7 49 59.9" fill="none" stroke="#8cefff" strokeWidth="0.5" opacity="0.42" />
          <motion.circle
            cx="48"
            cy="56.2"
            r="1.35"
            fill="#8ff3ff"
            filter={`url(#${ids.glow})`}
            variants={{
              idle: { opacity: 0.7, scale: 1 },
              hover: {
                opacity: [0.72, 1, 0.72],
                scale: [1, 1.55, 1],
                transition: { duration: 1.55, repeat: Infinity, ease: 'easeInOut' },
              },
            }}
            style={{ transformOrigin: '48px 56.2px' }}
          />
        </motion.g>

        <motion.g
          fill="#aef7ff"
          variants={{
            idle: { opacity: 0.28 },
            hover: {
              opacity: 0.72,
              transition: { duration: 0.72, ease: premiumEase },
            },
          }}
        >
          <circle cx="20" cy="53" r="0.55" />
          <circle cx="76" cy="56" r="0.42" />
          <circle cx="16" cy="72" r="0.3" />
          <circle cx="80" cy="74" r="0.34" />
        </motion.g>
      </motion.svg>
    </motion.span>
  );
}
