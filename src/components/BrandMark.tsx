import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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
const BRAND_VERSION = 'cloak-20260725-4';

/**
 * Vector-first faceless poet emblem.
 *
 * The silhouette is built from independent atmosphere, hood, face void,
 * cloak, light-core and seam layers. There is deliberately no rectangular
 * plate, raster image or hidden fallback underneath the mark.
 */
export default function BrandMark({ size = 'sm', className }: BrandMarkProps) {
  const reducedMotion = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const titleId = `${id}-brand-title`;
  const descriptionId = `${id}-brand-description`;
  const cloakGradientId = `${id}-cloak-gradient`;
  const hoodGradientId = `${id}-hood-gradient`;
  const edgeGradientId = `${id}-edge-gradient`;
  const coreGradientId = `${id}-core-gradient`;
  const faceGradientId = `${id}-face-gradient`;
  const glowFilterId = `${id}-glow-filter`;
  const softGlowFilterId = `${id}-soft-glow-filter`;
  const compact = size === 'sm';

  return (
    <motion.span
      data-brand-mark
      data-brand-version={BRAND_VERSION}
      data-brand-renderer="inline-vector"
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-visible',
        sizes[size],
        className,
      )}
      initial={false}
      animate="idle"
      whileHover={reducedMotion ? undefined : 'hover'}
    >
      <motion.svg
        data-brand-vector
        className="h-full w-full overflow-visible"
        viewBox="0 0 96 96"
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
        focusable="false"
        style={{ pointerEvents: 'none' }}
        variants={{
          idle: { y: 0, scale: 1, filter: 'drop-shadow(0 3px 5px rgba(0, 4, 13, 0.56))' },
          hover: {
            y: -0.7,
            scale: 1.026,
            filter: 'drop-shadow(0 6px 11px rgba(0, 8, 20, 0.68)) drop-shadow(0 0 7px rgba(46, 216, 255, 0.18))',
            transition: { duration: 0.72, ease: premiumEase },
          },
        }}
      >
        <title id={titleId}>THE LEGENDARY POET</title>
        <desc id={descriptionId}>
          Безликая фигура в глубоком капюшоне и тяжёлом чёрно-синем плаще с холодным внутренним светом
        </desc>

        <defs>
          <linearGradient id={cloakGradientId} x1="18" y1="42" x2="78" y2="91" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0b1829" />
            <stop offset="0.42" stopColor="#06101d" />
            <stop offset="0.74" stopColor="#020711" />
            <stop offset="1" stopColor="#00030a" />
          </linearGradient>
          <linearGradient id={hoodGradientId} x1="28" y1="15" x2="69" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#14283e" />
            <stop offset="0.28" stopColor="#0a1728" />
            <stop offset="0.7" stopColor="#030914" />
            <stop offset="1" stopColor="#01040a" />
          </linearGradient>
          <linearGradient id={edgeGradientId} x1="24" y1="20" x2="72" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#8aeaff" stopOpacity="0.72" />
            <stop offset="0.45" stopColor="#2ed8ff" stopOpacity="0.34" />
            <stop offset="1" stopColor="#2ed8ff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={coreGradientId} cx="0" cy="0" r="1" gradientTransform="translate(48 57) rotate(90) scale(19 15)" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#d8faff" />
            <stop offset="0.24" stopColor="#75eaff" />
            <stop offset="0.58" stopColor="#24c9ee" stopOpacity="0.72" />
            <stop offset="1" stopColor="#08789d" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={faceGradientId} cx="0" cy="0" r="1" gradientTransform="translate(48 34) rotate(90) scale(15 12)" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#02050b" />
            <stop offset="0.72" stopColor="#000208" />
            <stop offset="1" stopColor="#0b1727" />
          </radialGradient>
          <filter id={glowFilterId} x="-80%" y="-80%" width="260%" height="260%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={softGlowFilterId} x="-80%" y="-80%" width="260%" height="260%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="4.8" />
          </filter>
        </defs>

        <motion.g
          data-brand-energy
          aria-hidden="true"
          fill="none"
          strokeLinecap="round"
          variants={{
            idle: { opacity: compact ? 0.14 : 0.42, scale: compact ? 0.98 : 0.985 },
            hover: {
              opacity: compact ? 0.24 : 0.72,
              scale: compact ? 1.01 : 1.035,
              transition: { duration: 0.82, ease: premiumEase },
            },
          }}
          style={{ transformOrigin: '48px 49px' }}
        >
          <path d="M22 51C17 38 21 22 33 13" stroke={`url(#${edgeGradientId})`} strokeWidth={compact ? 0.85 : 1.15} />
          <path d="M74 51C80 37 75 21 63 13" stroke={`url(#${edgeGradientId})`} strokeWidth={compact ? 0.85 : 1.15} />
          {!compact && (
            <>
              <path d="M15 64C12 48 17 32 27 21" stroke="#2ed8ff" strokeOpacity="0.13" strokeWidth="0.85" />
              <path d="M81 64C85 47 79 31 69 21" stroke="#2ed8ff" strokeOpacity="0.13" strokeWidth="0.85" />
            </>
          )}
        </motion.g>

        {!compact && (
          <motion.ellipse
            data-brand-core-glow
            aria-hidden="true"
            cx="48"
            cy="58"
            rx="17"
            ry="20"
            fill={`url(#${coreGradientId})`}
            filter={`url(#${softGlowFilterId})`}
            variants={{
              idle: { opacity: 0.18, scale: 0.92 },
              hover: {
                opacity: 0.34,
                scale: 1.08,
                transition: { duration: 0.78, ease: premiumEase },
              },
            }}
            style={{ transformOrigin: '48px 58px' }}
          />
        )}

        <g data-brand-figure>
          <path
            data-brand-cloak
            d="M17.5 88.5C18.7 70.1 22.9 52.3 34.2 41.2C38 37.5 42.5 35.5 48 35.5C53.5 35.5 58 37.5 61.8 41.2C73.1 52.3 77.3 70.1 78.5 88.5C68.5 92.2 58.3 94 48 94C37.7 94 27.5 92.2 17.5 88.5Z"
            fill={`url(#${cloakGradientId})`}
            stroke="#18334d"
            strokeOpacity="0.72"
            strokeWidth="0.9"
          />
          <path
            d="M48 37C37.7 39.3 29 50 24 86.7C31.3 90 38.8 91.6 46.5 91.9L48 37Z"
            fill="#0d1c2c"
            fillOpacity="0.42"
          />
          <path
            d="M48 37C58.3 39.3 67 50 72 86.7C64.7 90 57.2 91.6 49.5 91.9L48 37Z"
            fill="#00040b"
            fillOpacity="0.72"
          />

          <path
            data-brand-hood
            d="M25.1 44.6C24.2 33.5 27.4 22.5 34.6 15.9C38.2 12.6 42.7 10.5 48 10C53.3 10.5 57.8 12.6 61.4 15.9C68.6 22.5 71.8 33.5 70.9 44.6C65.7 40.5 61.2 38.1 57.4 36.8C54.5 35.8 51.3 35.3 48 35.3C44.7 35.3 41.5 35.8 38.6 36.8C34.8 38.1 30.3 40.5 25.1 44.6Z"
            fill={`url(#${hoodGradientId})`}
            stroke="#23425f"
            strokeOpacity="0.68"
            strokeWidth="0.95"
          />
          <path
            data-brand-face-void
            d="M35.2 37.3C35.7 29.2 40.7 23.2 48 22.2C55.3 23.2 60.3 29.2 60.8 37.3C57.8 35.9 53.6 35 48 35C42.4 35 38.2 35.9 35.2 37.3Z"
            fill={`url(#${faceGradientId})`}
          />
          <path d="M27.7 40.6C31.5 27 38.3 17.5 48 13.3" fill="none" stroke={`url(#${edgeGradientId})`} strokeWidth="1.05" strokeLinecap="round" />
          <path d="M68.3 40.6C64.5 27 57.7 17.5 48 13.3" fill="none" stroke="#2ed8ff" strokeOpacity="0.12" strokeWidth="0.8" strokeLinecap="round" />

          <path d="M34.3 42.2C39.8 46 44.4 48 48 48C51.6 48 56.2 46 61.7 42.2" fill="none" stroke="#15314a" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M48 48V87.5" fill="none" stroke="#2ed8ff" strokeOpacity="0.12" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M35.5 49.5C31.3 58.7 28.5 70 27.2 83.5" fill="none" stroke="#2ed8ff" strokeOpacity="0.16" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M60.5 49.5C64.7 58.7 67.5 70 68.8 83.5" fill="none" stroke="#24445c" strokeOpacity="0.34" strokeWidth="0.8" strokeLinecap="round" />
        </g>

        <motion.g
          data-brand-light-core
          aria-hidden="true"
          filter={compact ? undefined : `url(#${glowFilterId})`}
          variants={{
            idle: { opacity: compact ? 0.46 : 0.68, scale: compact ? 0.9 : 0.94 },
            hover: {
              opacity: compact ? 0.68 : 1,
              scale: compact ? 1.02 : 1.08,
              transition: { duration: 0.62, ease: premiumEase },
            },
          }}
          style={{ transformOrigin: '48px 57px' }}
        >
          <path
            d={compact ? 'M48 52L50.1 57L48 62L45.9 57L48 52Z' : 'M48 49.5L51.5 57L48 66.2L44.5 57L48 49.5Z'}
            fill={`url(#${coreGradientId})`}
          />
          <path
            d={compact ? 'M48 54.5V59.5' : 'M48 52.2V62.2'}
            stroke="#ddfbff"
            strokeWidth={compact ? 0.7 : 1.15}
            strokeLinecap="round"
          />
        </motion.g>

        {!compact && (
          <motion.g
            data-brand-seams
            aria-hidden="true"
            fill="none"
            stroke="#54e3ff"
            strokeLinecap="round"
            variants={{
              idle: { opacity: 0.18 },
              hover: { opacity: 0.42, transition: { duration: 0.72, ease: premiumEase } },
            }}
          >
            <motion.path d="M43.8 50.5C39.6 59.2 37.2 69.2 36.3 80.2" strokeWidth="0.65" variants={{ idle: { pathLength: 0.62 }, hover: { pathLength: 1 } }} />
            <motion.path d="M52.2 50.5C56.4 59.2 58.8 69.2 59.7 80.2" strokeWidth="0.65" variants={{ idle: { pathLength: 0.62 }, hover: { pathLength: 1 } }} />
          </motion.g>
        )}
      </motion.svg>
    </motion.span>
  );
}
