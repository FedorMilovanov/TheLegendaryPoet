import { useId, type PointerEvent as ReactPointerEvent } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
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
const BRAND_VERSION = 'aether-20260725-5';

const haloVariants = {
  idle: { opacity: 0.72, scale: 1, rotate: 0 },
  hover: {
    opacity: 1,
    scale: 1.025,
    rotate: 0.7,
    transition: { duration: 0.82, ease: premiumEase },
  },
};

const cloakVariants = {
  idle: { y: 0, scale: 1 },
  hover: {
    y: -0.75,
    scale: 1.012,
    transition: { duration: 0.78, ease: premiumEase },
  },
};

const energyVariants = {
  idle: { opacity: 0.42, pathLength: 0.82 },
  hover: {
    opacity: 0.88,
    pathLength: 1,
    transition: { duration: 0.9, ease: premiumEase },
  },
};

const orbVariants = {
  idle: { scale: 1, opacity: 0.96 },
  hover: {
    scale: 1.085,
    opacity: 1,
    transition: { duration: 0.7, ease: premiumEase },
  },
};

export default function BrandMark({ size = 'sm', className }: BrandMarkProps) {
  const rawId = useId().replace(/:/g, '');
  const titleId = `${rawId}-brand-title`;
  const descId = `${rawId}-brand-description`;
  const ids = {
    field: `${rawId}-field`,
    halo: `${rawId}-halo`,
    cloak: `${rawId}-cloak`,
    rim: `${rawId}-rim`,
    fold: `${rawId}-fold`,
    orb: `${rawId}-orb`,
    softGlow: `${rawId}-soft-glow`,
    orbGlow: `${rawId}-orb-glow`,
    lineGlow: `${rawId}-line-glow`,
    haloClip: `${rawId}-halo-clip`,
  };

  const reducedMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 180, damping: 24, mass: 0.55 });
  const smoothY = useSpring(pointerY, { stiffness: 180, damping: 24, mass: 0.55 });
  const rotateY = useTransform(smoothX, [-1, 1], [-2.2, 2.2]);
  const rotateX = useTransform(smoothY, [-1, 1], [2.2, -2.2]);
  const translateX = useTransform(smoothX, [-1, 1], [-0.75, 0.75]);
  const translateY = useTransform(smoothY, [-1, 1], [-0.75, 0.75]);

  const handlePointerMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (reducedMotion || event.pointerType === 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - rect.left) / rect.width - 0.5) * 2);
    pointerY.set(((event.clientY - rect.top) / rect.height - 0.5) * 2);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <motion.span
      data-brand-mark
      data-brand-version={BRAND_VERSION}
      data-brand-renderer="inline-svg"
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-visible',
        sizes[size],
        className,
      )}
      initial="idle"
      animate="idle"
      whileHover="hover"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      onPointerCancel={resetPointer}
    >
      <motion.svg
        data-brand-vector
        className="h-full w-full overflow-visible"
        viewBox="0 0 128 128"
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        style={{
          pointerEvents: 'none',
          rotateX: reducedMotion ? 0 : rotateX,
          rotateY: reducedMotion ? 0 : rotateY,
          x: reducedMotion ? 0 : translateX,
          y: reducedMotion ? 0 : translateY,
          transformPerspective: 360,
          transformOrigin: '64px 64px',
        }}
      >
        <title id={titleId}>THE LEGENDARY POET</title>
        <desc id={descId}>
          Таинственная фигура в глубоком капюшоне с холодным голубым ореолом и световым ядром
        </desc>

        <defs>
          <radialGradient id={ids.field} cx="64" cy="62" r="58" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0a6a9a" stopOpacity="0.22" />
            <stop offset="0.42" stopColor="#04263e" stopOpacity="0.28" />
            <stop offset="0.74" stopColor="#03121f" stopOpacity="0.18" />
            <stop offset="1" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={ids.halo} cx="64" cy="61" r="53" gradientUnits="userSpaceOnUse">
            <stop offset="0.62" stopColor="#2ed8ff" stopOpacity="0" />
            <stop offset="0.86" stopColor="#2ed8ff" stopOpacity="0.16" />
            <stop offset="1" stopColor="#7bedff" stopOpacity="0.04" />
          </radialGradient>
          <linearGradient id={ids.cloak} x1="64" y1="34" x2="64" y2="116" gradientUnits="userSpaceOnUse">
            <stop stopColor="#081927" />
            <stop offset="0.34" stopColor="#02070d" />
            <stop offset="0.78" stopColor="#04111c" />
            <stop offset="1" stopColor="#071a28" />
          </linearGradient>
          <linearGradient id={ids.rim} x1="41" y1="27" x2="89" y2="84" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a5f6ff" stopOpacity="0.86" />
            <stop offset="0.25" stopColor="#44dcff" stopOpacity="0.82" />
            <stop offset="0.7" stopColor="#1587c3" stopOpacity="0.42" />
            <stop offset="1" stopColor="#0c4770" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id={ids.fold} x1="35" y1="56" x2="94" y2="109" gradientUnits="userSpaceOnUse">
            <stop stopColor="#35d6ff" stopOpacity="0.42" />
            <stop offset="0.58" stopColor="#147ba9" stopOpacity="0.2" />
            <stop offset="1" stopColor="#7bedff" stopOpacity="0.08" />
          </linearGradient>
          <radialGradient id={ids.orb} cx="60" cy="72" r="16" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.25" stopColor="#f3feff" />
            <stop offset="0.58" stopColor="#8debff" />
            <stop offset="0.84" stopColor="#27bde9" />
            <stop offset="1" stopColor="#0b6f9d" />
          </radialGradient>
          <filter id={ids.softGlow} x="-70%" y="-70%" width="240%" height="240%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="0 0 0 0 0.08 0 0 0 0 0.72 0 0 0 0 1 0 0 0 .72 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={ids.orbGlow} x="-260%" y="-260%" width="620%" height="620%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="5.8" result="wide" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.25" result="soft" />
            <feMerge>
              <feMergeNode in="wide" />
              <feMergeNode in="soft" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={ids.lineGlow} x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id={ids.haloClip}>
            <circle cx="64" cy="64" r="52" />
          </clipPath>
        </defs>

        <circle cx="64" cy="64" r="60" fill={`url(#${ids.field})`} />
        <circle cx="64" cy="64" r="55" fill={`url(#${ids.halo})`} />

        <motion.g
          data-brand-halo
          fill="none"
          strokeLinecap="round"
          variants={haloVariants}
          style={{ transformOrigin: '64px 64px' }}
        >
          <circle cx="64" cy="64" r="49.2" stroke="#54e5ff" strokeOpacity="0.16" strokeWidth="1.1" />
          <path
            d="M25 48C32 28 46 16 64 14C82 16 96 28 103 48"
            stroke="#71efff"
            strokeOpacity="0.3"
            strokeWidth="1.15"
            filter={`url(#${ids.lineGlow})`}
          />
          <path d="M18 70C20 92 37 110 59 114" stroke="#1da9df" strokeOpacity="0.18" strokeWidth="1" />
          <path d="M110 70C108 92 91 110 69 114" stroke="#1da9df" strokeOpacity="0.18" strokeWidth="1" />
          <circle
            cx="64"
            cy="64"
            r="52"
            stroke="#2ed8ff"
            strokeOpacity="0.08"
            strokeWidth="0.55"
            strokeDasharray="1 6"
          />
        </motion.g>

        <motion.g
          data-brand-aura
          clipPath={`url(#${ids.haloClip})`}
          fill="none"
          strokeLinecap="round"
          variants={haloVariants}
        >
          <path d="M64 18C58 26 54 33 52 40" stroke="#65e9ff" strokeOpacity="0.26" strokeWidth="0.8" />
          <path d="M64 18C70 26 74 33 76 40" stroke="#65e9ff" strokeOpacity="0.26" strokeWidth="0.8" />
          <path d="M23 61C34 57 42 53 48 47" stroke="#2ed8ff" strokeOpacity="0.16" strokeWidth="0.7" />
          <path d="M105 61C94 57 86 53 80 47" stroke="#2ed8ff" strokeOpacity="0.16" strokeWidth="0.7" />
          <path d="M20 76C32 76 42 73 51 68" stroke="#2ed8ff" strokeOpacity="0.12" strokeWidth="0.7" />
          <path d="M108 76C96 76 86 73 77 68" stroke="#2ed8ff" strokeOpacity="0.12" strokeWidth="0.7" />
        </motion.g>

        <motion.g
          data-brand-cloak
          variants={cloakVariants}
          style={{ transformOrigin: '64px 64px' }}
        >
          <path
            d="M64 27C52 28 44 38 41 51C32 57 25 68 22 83C29 79 35 76 43 73C41 89 47 104 64 117C81 104 87 89 85 73C93 76 99 79 106 83C103 68 96 57 87 51C84 38 76 28 64 27Z"
            fill={`url(#${ids.cloak})`}
            stroke="#239fcf"
            strokeOpacity="0.18"
            strokeWidth="0.8"
          />
          <path
            d="M42 52C44 39 52 28 64 25C76 28 84 39 86 52"
            fill="none"
            stroke={`url(#${ids.rim})`}
            strokeWidth="2.15"
            filter={`url(#${ids.softGlow})`}
          />
          <path
            d="M64 35C56 35 50 43 47 53C51 59 57 63 64 66C71 63 77 59 81 53C78 43 72 35 64 35Z"
            fill="#000205"
          />
          <path
            d="M47 53C51 58 57 61 64 64C71 61 77 58 81 53"
            fill="none"
            stroke="#58e1ff"
            strokeOpacity="0.16"
            strokeWidth="0.75"
          />
          <path
            d="M23 83C35 76 45 72 52 64C50 81 54 99 64 114"
            fill="none"
            stroke={`url(#${ids.fold})`}
            strokeWidth="1.05"
          />
          <path
            d="M105 83C93 76 83 72 76 64C78 81 74 99 64 114"
            fill="none"
            stroke={`url(#${ids.fold})`}
            strokeWidth="1.05"
          />
          <path
            d="M33 86C43 82 50 77 56 69M95 86C85 82 78 77 72 69"
            fill="none"
            stroke="#4cdfff"
            strokeOpacity="0.12"
            strokeWidth="0.85"
          />
          <path
            d="M64 67C59 80 59 95 64 112C69 95 69 80 64 67Z"
            fill="#0e6287"
            fillOpacity="0.15"
          />
          <path
            d="M45 73C50 84 56 92 64 101C72 92 78 84 83 73"
            fill="none"
            stroke="#31c4ef"
            strokeOpacity="0.1"
            strokeWidth="0.7"
          />
        </motion.g>

        <g
          data-brand-energy
          clipPath={`url(#${ids.haloClip})`}
          fill="none"
          stroke="#4ee1ff"
          strokeLinecap="round"
          filter={`url(#${ids.lineGlow})`}
        >
          {[
            'M64 80C59 74 56 68 52 63C49 59 45 56 40 54',
            'M64 80C69 74 72 68 76 63C79 59 83 56 88 54',
            'M64 80C61 72 61 65 61 58C61 51 58 45 54 41',
            'M64 80C67 72 67 65 67 58C67 51 70 45 74 41',
            'M59 79C53 78 48 79 43 83C39 86 35 87 31 86',
            'M69 79C75 78 80 79 85 83C89 86 93 87 97 86',
          ].map((d, index) => (
            <motion.path
              key={d}
              d={d}
              strokeOpacity={index < 2 ? 0.54 : index < 4 ? 0.36 : 0.22}
              strokeWidth={index < 2 ? 0.85 : index < 4 ? 0.7 : 0.65}
              variants={energyVariants}
            />
          ))}
        </g>

        <motion.g
          data-brand-orb
          variants={orbVariants}
          style={{ transformOrigin: '64px 80px' }}
        >
          <circle
            cx="64"
            cy="80"
            r="12"
            fill="#33d7ff"
            fillOpacity="0.12"
            filter={`url(#${ids.orbGlow})`}
          />
          <circle
            cx="64"
            cy="80"
            r="7.8"
            fill={`url(#${ids.orb})`}
            stroke="#e6fdff"
            strokeWidth="1.05"
            filter={`url(#${ids.orbGlow})`}
          />
          <circle cx="61.5" cy="77.2" r="2.25" fill="#ffffff" fillOpacity="0.78" />
          <circle
            cx="64"
            cy="80"
            r="10.4"
            fill="none"
            stroke="#70ebff"
            strokeOpacity="0.15"
            strokeWidth="0.7"
          />
        </motion.g>
      </motion.svg>
    </motion.span>
  );
}
