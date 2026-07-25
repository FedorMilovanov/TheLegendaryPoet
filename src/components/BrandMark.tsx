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
 * a heavy black-blue cloak. The source artwork stays visually exact, while the
 * SVG wrapper adds accessible markup and a restrained premium hover response.
 */
export default function BrandMark({ size = 'sm', className }: BrandMarkProps) {
  const uid = useId().replace(/:/g, '');
  const ids = {
    title: `${uid}-brand-title`,
    aura: `${uid}-brand-aura`,
    mist: `${uid}-brand-mist`,
    soft: `${uid}-brand-soft`,
  };
  const artworkUrl = `${import.meta.env.BASE_URL}brand-emblem-master.webp`;

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
          <filter id={ids.soft} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.65" />
          </filter>
          <filter id={ids.mist} x="-70%" y="-120%" width="240%" height="340%">
            <feGaussianBlur stdDeviation="1.25" />
          </filter>
        </defs>

        {/* The aura lives behind the artwork: the cowl remains an absolute void. */}
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
