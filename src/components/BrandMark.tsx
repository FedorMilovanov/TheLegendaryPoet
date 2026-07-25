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
 * Canonical emblem selected by the project owner: a faceless hooded figure in
 * a heavy black-blue cloak. The approved master artwork keeps the exact visual,
 * while a coded SVG silhouette underneath prevents a blank logo if the raster
 * is delayed or blocked and supplies the restrained premium hover response.
 */
export default function BrandMark({ size = 'sm', className }: BrandMarkProps) {
  const uid = useId().replace(/:/g, '');
  const ids = {
    title: `${uid}-brand-title`,
    aura: `${uid}-brand-aura`,
    cloak: `${uid}-brand-cloak`,
    rim: `${uid}-brand-rim`,
    void: `${uid}-brand-void`,
    mist: `${uid}-brand-mist`,
    soft: `${uid}-brand-soft`,
  };
  const artworkUrl = `${import.meta.env.BASE_URL}brand-emblem-master.png`;

  return (
    <motion.span
      data-brand-mark
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-visible',
        sizes[size],
        className,
      )}
      initial="idle"
      animate="idle"
      whileHover="hover"
    >
      <motion.svg
        className="h-full w-full overflow-visible"
        viewBox="0 0 96 96"
        role="img"
        aria-labelledby={ids.title}
        style={{ pointerEvents: 'none' }}
        variants={{
          idle: { filter: 'drop-shadow(0 0 4px rgba(46,216,255,0.12))' },
          hover: {
            filter: 'drop-shadow(0 0 10px rgba(70,215,255,0.38))',
            transition: { duration: 0.72, ease: premiumEase },
          },
        }}
      >
        <title id={ids.title}>THE LEGENDARY POET</title>
        <defs>
          <radialGradient id={ids.aura} cx="50%" cy="37%" r="58%">
            <stop offset="0" stopColor="#dffcff" stopOpacity="0.56" />
            <stop offset="0.22" stopColor="#62e9ff" stopOpacity="0.34" />
            <stop offset="0.62" stopColor="#1279bc" stopOpacity="0.08" />
            <stop offset="1" stopColor="#02050b" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={ids.cloak} x1="25" y1="22" x2="72" y2="92">
            <stop offset="0" stopColor="#17374d" />
            <stop offset="0.3" stopColor="#091724" />
            <stop offset="0.76" stopColor="#02060c" />
            <stop offset="1" stopColor="#000104" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id={ids.rim} x1="29" y1="9" x2="76" y2="90">
            <stop offset="0" stopColor="#eaffff" />
            <stop offset="0.28" stopColor="#71e8ff" />
            <stop offset="0.66" stopColor="#2196ce" stopOpacity="0.58" />
            <stop offset="1" stopColor="#0a4b78" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={ids.void} cx="50%" cy="38%" r="72%">
            <stop offset="0" stopColor="#000000" />
            <stop offset="0.74" stopColor="#010205" />
            <stop offset="1" stopColor="#07121c" />
          </radialGradient>
          <filter id={ids.soft} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.65" />
          </filter>
          <filter id={ids.mist} x="-70%" y="-120%" width="240%" height="340%">
            <feGaussianBlur stdDeviation="1.25" />
          </filter>
        </defs>

        {/* The aura lives behind the figure: the cowl remains an absolute void. */}
        <motion.ellipse
          data-brand-aura
          cx="48"
          cy="36"
          rx="23"
          ry="28"
          fill={`url(#${ids.aura})`}
          filter={`url(#${ids.soft})`}
          style={{ transformOrigin: '48px 36px' }}
          variants={{
            idle: { opacity: 0.06, scale: 0.96 },
            hover: {
              opacity: 0.25,
              scale: 1.08,
              transition: { duration: 0.8, ease: premiumEase },
            },
          }}
        />

        {/* Pure-vector safety layer. Normally the approved artwork covers it. */}
        <motion.g
          data-brand-fallback
          style={{ transformOrigin: '48px 50px' }}
          variants={{
            idle: { y: 0, scale: 1 },
            hover: {
              y: -0.45,
              scale: 1.018,
              transition: { duration: 0.72, ease: premiumEase },
            },
          }}
        >
          <path
            d="M35 43 C27 46 22 54 18 65 L9 91 C22 86 35 87 48 92 C61 87 74 86 87 91 L78 65 C74 54 69 46 61 43 C57 48 53 51 48 52 C43 51 39 48 35 43Z"
            fill={`url(#${ids.cloak})`}
            stroke={`url(#${ids.rim})`}
            strokeWidth="0.72"
            opacity="0.92"
          />
          <path
            d="M48 7 C39 9 34 19 32 31 C30 40 34 47 40 51 C43 53 46 54 48 54 C50 54 53 53 56 51 C62 47 66 40 64 31 C62 19 57 9 48 7Z"
            fill={`url(#${ids.cloak})`}
            stroke={`url(#${ids.rim})`}
            strokeWidth="0.92"
          />
          <path
            d="M48 20 C41 21 38 28 38 36 C38 44 42 49 48 51 C54 49 58 44 58 36 C58 28 55 21 48 20Z"
            fill={`url(#${ids.void})`}
          />
          <path
            d="M34 43 C39 48 43 51 48 52 C53 51 57 48 62 43 C69 46 74 50 78 57 C67 53 57 54 48 59 C39 54 29 53 18 57 C22 50 27 46 34 43Z"
            fill="#07121d"
            stroke="#48cffa"
            strokeWidth="0.46"
            opacity="0.94"
          />
          <path d="M19 58 C31 62 39 68 46 77" fill="none" stroke="#348eb8" strokeWidth="0.55" opacity="0.42" />
          <path d="M77 58 C65 62 57 68 50 77" fill="none" stroke="#2b79a5" strokeWidth="0.55" opacity="0.36" />
          <path d="M29 51 C38 58 43 68 47 87" fill="none" stroke="#174b68" strokeWidth="0.55" opacity="0.52" />
          <path d="M67 51 C58 58 53 68 49 87" fill="none" stroke="#123e5a" strokeWidth="0.55" opacity="0.46" />
          <path d="M48 59 C44 70 43 82 42 91 C45 89 47 86 48 82 C49 86 51 89 54 91 C53 82 52 70 48 59Z" fill="#000207" opacity="0.9" />
        </motion.g>

        <motion.image
          data-brand-figure
          href={artworkUrl}
          x="-2"
          y="-2"
          width="100"
          height="100"
          preserveAspectRatio="xMidYMid meet"
          variants={{
            idle: {
              y: 0,
              scale: 1,
              opacity: 0.98,
              filter: 'brightness(1) saturate(1)',
            },
            hover: {
              y: -0.55,
              scale: 1.025,
              opacity: 1,
              filter: 'brightness(1.08) saturate(1.08)',
              transition: { duration: 0.72, ease: premiumEase },
            },
          }}
          style={{ transformOrigin: '48px 50px' }}
        />

        <motion.g
          data-brand-mist
          fill="none"
          strokeLinecap="round"
          filter={`url(#${ids.mist})`}
          style={{ transformOrigin: '48px 84px' }}
          variants={{
            idle: { opacity: 0.07, scaleX: 0.96 },
            hover: {
              opacity: 0.22,
              scaleX: 1.06,
              transition: { duration: 0.88, ease: premiumEase },
            },
          }}
        >
          <path d="M14 84 C27 80 37 82 48 87 C59 82 69 80 82 84" stroke="#47dfff" strokeWidth="1.25" />
          <path d="M22 89 C32 86 40 87 48 91 C56 87 64 86 74 89" stroke="#147fc7" strokeWidth="1.5" />
        </motion.g>
      </motion.svg>
    </motion.span>
  );
}
