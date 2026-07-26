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
const BRAND_VERSION = 'cloak-20260726-6';

/**
 * Reference-shaped faceless poet emblem.
 *
 * The figure deliberately fills the optical square: a broad mantle, high hood,
 * deep black opening, crossed shoulder cloth and radial heavy folds. No raster
 * wrapper, plate, chest light, face, eyes, book, wings or halo are present.
 */
export default function BrandMark({ size = 'sm', className }: BrandMarkProps) {
  const reducedMotion = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const compact = size === 'sm';

  const titleId = `${id}-brand-title`;
  const descriptionId = `${id}-brand-description`;
  const cloakGradientId = `${id}-cloak-gradient`;
  const hoodGradientId = `${id}-hood-gradient`;
  const leftFoldGradientId = `${id}-left-fold-gradient`;
  const rightFoldGradientId = `${id}-right-fold-gradient`;
  const collarLeftGradientId = `${id}-collar-left-gradient`;
  const collarRightGradientId = `${id}-collar-right-gradient`;
  const rimGradientId = `${id}-rim-gradient`;
  const auraGradientId = `${id}-aura-gradient`;
  const voidGradientId = `${id}-void-gradient`;
  const auraBlurFilterId = `${id}-aura-blur-filter`;
  const rimGlowFilterId = `${id}-rim-glow-filter`;

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
          idle: {
            y: 0,
            scale: 1,
            filter: compact
              ? 'drop-shadow(0 2px 3px rgba(0, 4, 13, 0.6))'
              : 'drop-shadow(0 4px 8px rgba(0, 4, 13, 0.68))',
          },
          hover: {
            y: compact ? -0.5 : -0.8,
            scale: compact ? 1.018 : 1.025,
            filter: compact
              ? 'drop-shadow(0 4px 7px rgba(0, 8, 20, 0.7)) drop-shadow(0 0 5px rgba(46, 216, 255, 0.2))'
              : 'drop-shadow(0 7px 14px rgba(0, 8, 20, 0.74)) drop-shadow(0 0 10px rgba(46, 216, 255, 0.24))',
            transition: { duration: 0.72, ease: premiumEase },
          },
        }}
      >
        <title id={titleId}>THE LEGENDARY POET</title>
        <desc id={descriptionId}>
          Безликая фигура в высоком остром капюшоне и широком тяжёлом плаще,
          окружённая холодным голубым контровым светом
        </desc>

        <defs>
          <linearGradient id={cloakGradientId} x1="12" y1="45" x2="82" y2="96" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#173550" />
            <stop offset="0.22" stopColor="#0b1c2e" />
            <stop offset="0.58" stopColor="#030a13" />
            <stop offset="1" stopColor="#000208" />
          </linearGradient>
          <linearGradient id={hoodGradientId} x1="29" y1="7" x2="68" y2="47" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#1c4262" />
            <stop offset="0.18" stopColor="#102941" />
            <stop offset="0.55" stopColor="#06121f" />
            <stop offset="1" stopColor="#01040b" />
          </linearGradient>
          <linearGradient id={leftFoldGradientId} x1="5" y1="57" x2="47" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#1e4564" stopOpacity="0.92" />
            <stop offset="0.35" stopColor="#0b1f33" stopOpacity="0.86" />
            <stop offset="1" stopColor="#020711" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id={rightFoldGradientId} x1="91" y1="57" x2="49" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#102b43" stopOpacity="0.78" />
            <stop offset="0.42" stopColor="#061524" stopOpacity="0.8" />
            <stop offset="1" stopColor="#000207" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id={collarLeftGradientId} x1="14" y1="48" x2="49" y2="66" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#244c69" />
            <stop offset="0.42" stopColor="#102942" />
            <stop offset="1" stopColor="#020812" />
          </linearGradient>
          <linearGradient id={collarRightGradientId} x1="82" y1="48" x2="47" y2="66" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#183a55" />
            <stop offset="0.45" stopColor="#0a1c30" />
            <stop offset="1" stopColor="#01050c" />
          </linearGradient>
          <linearGradient id={rimGradientId} x1="22" y1="10" x2="79" y2="68" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#f1feff" />
            <stop offset="0.12" stopColor="#a8f3ff" />
            <stop offset="0.38" stopColor="#45ddff" stopOpacity="0.9" />
            <stop offset="0.75" stopColor="#1fb6e9" stopOpacity="0.38" />
            <stop offset="1" stopColor="#0b7aa4" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={auraGradientId} cx="0" cy="0" r="1" gradientTransform="translate(48 48) rotate(90) scale(48 40)" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#aaf5ff" stopOpacity="0.44" />
            <stop offset="0.2" stopColor="#47dcff" stopOpacity="0.28" />
            <stop offset="0.55" stopColor="#148caf" stopOpacity="0.12" />
            <stop offset="1" stopColor="#061726" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={voidGradientId} cx="0" cy="0" r="1" gradientTransform="translate(48 36) rotate(90) scale(22 18)" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#000000" />
            <stop offset="0.78" stopColor="#000105" />
            <stop offset="1" stopColor="#06101b" />
          </radialGradient>
          <filter id={auraBlurFilterId} x="-70%" y="-70%" width="240%" height="240%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id={rimGlowFilterId} x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="1.25" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <motion.g
          data-brand-atmosphere
          aria-hidden="true"
          variants={{
            idle: { opacity: compact ? 0.16 : 0.56, scale: compact ? 0.985 : 0.97 },
            hover: {
              opacity: compact ? 0.28 : 0.78,
              scale: compact ? 1.01 : 1.04,
              transition: { duration: 0.86, ease: premiumEase },
            },
          }}
          style={{ transformOrigin: '48px 48px' }}
        >
          {!compact && (
            <>
              <path
                d="M5 92C8 69 18 48 34 29C40 21 44 15 48 10C52 15 56 21 62 29C78 48 88 69 91 92C79 77 67 66 56 59C52 56 49 54 48 53C47 54 44 56 40 59C29 66 17 77 5 92Z"
                fill={`url(#${auraGradientId})`}
                filter={`url(#${auraBlurFilterId})`}
              />
              <g fill="none" stroke="#45dcff" strokeLinecap="round" opacity="0.2" filter={`url(#${auraBlurFilterId})`}>
                <path d="M24 45C25 27 33 12 48 2C63 12 71 27 72 45" strokeWidth="3.4" />
                <path d="M2 96C8 70 20 51 36 43" strokeWidth="3" />
                <path d="M94 96C88 70 76 51 60 43" strokeWidth="3" />
              </g>
            </>
          )}
        </motion.g>

        <motion.g
          data-brand-energy
          aria-hidden="true"
          fill="none"
          strokeLinecap="round"
          variants={{
            idle: { opacity: compact ? 0.2 : 0.34 },
            hover: { opacity: compact ? 0.34 : 0.58, transition: { duration: 0.78, ease: premiumEase } },
          }}
        >
          <path d="M12 78C8 57 16 35 31 20" stroke="#3ddcff" strokeOpacity="0.2" strokeWidth={compact ? 0.75 : 1.05} />
          <path d="M84 78C88 57 80 35 65 20" stroke="#3ddcff" strokeOpacity="0.16" strokeWidth={compact ? 0.72 : 1} />
        </motion.g>

        <motion.g
          data-brand-figure
          variants={{
            idle: { y: 0 },
            hover: { y: compact ? -0.08 : -0.24, transition: { duration: 0.72, ease: premiumEase } },
          }}
        >
          <path
            data-brand-cloak
            d="M1.5 96C4.8 78.5 10.2 64.3 18.2 55.2C24.8 47.7 32.4 43.7 39.2 41.3C42 40.3 44.8 39.8 48 39.8C51.2 39.8 54 40.3 56.8 41.3C63.6 43.7 71.2 47.7 77.8 55.2C85.8 64.3 91.2 78.5 94.5 96Z"
            fill={`url(#${cloakGradientId})`}
            stroke="#214662"
            strokeWidth={compact ? 0.82 : 0.9}
            strokeOpacity="0.72"
          />

          <motion.g
            data-brand-folds
            variants={{
              idle: { opacity: compact ? 0.94 : 0.98, scale: 1 },
              hover: {
                opacity: 1,
                scale: compact ? 1.002 : 1.006,
                transition: { duration: 0.76, ease: premiumEase },
              },
            }}
            style={{ transformOrigin: '48px 71px' }}
          >
            <motion.path d="M1.5 96C6.8 76 16 58.7 31.2 48.4C35.4 45.5 39.6 43.7 44.2 42.6C37.1 51.7 31.4 68.6 27.8 96Z" fill={`url(#${leftFoldGradientId})`} variants={{ idle: { x: 0 }, hover: { x: compact ? 0 : -0.24 } }} />
            <motion.path d="M94.5 96C89.2 76 80 58.7 64.8 48.4C60.6 45.5 56.4 43.7 51.8 42.6C58.9 51.7 64.6 68.6 68.2 96Z" fill={`url(#${rightFoldGradientId})`} variants={{ idle: { x: 0 }, hover: { x: compact ? 0 : 0.24 } }} />
            <path d="M17 96C20.7 76.7 29.2 59.6 42.1 47.7C36.7 61.4 33.8 77.4 33.2 96Z" fill="#0a1b2c" fillOpacity="0.94" />
            <path d="M79 96C75.3 76.7 66.8 59.6 53.9 47.7C59.3 61.4 62.2 77.4 62.8 96Z" fill="#01050c" fillOpacity="0.98" />
            <path d="M33.2 96C35.7 76.1 40.6 59.1 48 47.1C44.8 63.7 43.3 80 43.4 96Z" fill="#06111e" />
            <path d="M62.8 96C60.3 76.1 55.4 59.1 48 47.1C51.2 63.7 52.7 80 52.6 96Z" fill="#000309" />
            <path d="M43.4 96C44.1 77 45.6 60.5 48 47.1C50.4 60.5 51.9 77 52.6 96Z" fill="#000106" />
          </motion.g>

          <motion.g
            data-brand-collar
            variants={{
              idle: { opacity: compact ? 0.96 : 1 },
              hover: { opacity: 1, transition: { duration: 0.68, ease: premiumEase } },
            }}
          >
            <motion.path d="M13.5 58C23.7 48.4 36.1 44.6 48 48.3C42.2 52.2 35.5 58.9 28.2 68.5C22.4 64.3 17.5 60.8 13.5 58Z" fill={`url(#${collarLeftGradientId})`} variants={{ idle: { x: 0 }, hover: { x: compact ? 0 : -0.16 } }} />
            <motion.path d="M82.5 58C72.3 48.4 59.9 44.6 48 48.3C53.8 52.2 60.5 58.9 67.8 68.5C73.6 64.3 78.5 60.8 82.5 58Z" fill={`url(#${collarRightGradientId})`} variants={{ idle: { x: 0 }, hover: { x: compact ? 0 : 0.16 } }} />
            {!compact && (
              <>
                <path d="M8 70.5C21.8 56.6 35.5 50.5 48 52.2C39.3 60.4 31.6 70.5 24.8 82.8C18.2 77.5 12.6 73.4 8 70.5Z" fill="#0d2237" fillOpacity="0.86" />
                <path d="M88 70.5C74.2 56.6 60.5 50.5 48 52.2C56.7 60.4 64.4 70.5 71.2 82.8C77.8 77.5 83.4 73.4 88 70.5Z" fill="#01050c" fillOpacity="0.94" />
              </>
            )}
          </motion.g>

          <path
            data-brand-hood
            d="M25 43.5C25.5 28.1 32.4 12.6 48 3.2C63.6 12.6 70.5 28.1 71 43.5C65.8 42.6 61.1 41.4 57.1 39.9C53.7 38.6 50.8 38 48 38C45.2 38 42.3 38.6 38.9 39.9C34.9 41.4 30.2 42.6 25 43.5ZM29.5 40.4C32.1 28.7 38.2 18.7 48 13.8C57.8 18.7 63.9 28.7 66.5 40.4C63.2 45 58.9 48.7 53.5 51.2C51 52.4 49.2 53.8 48 55.5C46.8 53.8 45 52.4 42.5 51.2C37.1 48.7 32.8 45 29.5 40.4Z"
            fill={`url(#${hoodGradientId})`}
            fillRule="evenodd"
            stroke="#2a5470"
            strokeWidth={compact ? 0.84 : 0.9}
            strokeOpacity="0.8"
          />
          <path
            data-brand-face-void
            d="M29.5 40.4C32.1 28.7 38.2 18.7 48 13.8C57.8 18.7 63.9 28.7 66.5 40.4C63.2 45 58.9 48.7 53.5 51.2C51 52.4 49.2 53.8 48 55.5C46.8 53.8 45 52.4 42.5 51.2C37.1 48.7 32.8 45 29.5 40.4Z"
            fill={`url(#${voidGradientId})`}
          />

          <motion.g
            data-brand-rim-light
            aria-hidden="true"
            fill="none"
            strokeLinecap="round"
            variants={{
              idle: { opacity: compact ? 0.72 : 0.82 },
              hover: { opacity: 1, transition: { duration: 0.7, ease: premiumEase } },
            }}
          >
            <motion.path d="M25.8 41.7C27.9 25.7 35.8 11.2 48 4.5" stroke={`url(#${rimGradientId})`} strokeWidth={compact ? 1.22 : 1.5} filter={compact ? undefined : `url(#${rimGlowFilterId})`} variants={{ idle: { pathLength: 0.84 }, hover: { pathLength: 1 } }} />
            <motion.path d="M70.2 41.7C68.1 25.7 60.2 11.2 48 4.5" stroke="#55ddff" strokeOpacity="0.62" strokeWidth={compact ? 0.9 : 1.05} variants={{ idle: { pathLength: 0.78 }, hover: { pathLength: 1 } }} />
            <path d="M48 5.5V33.5" stroke="#c4f8ff" strokeOpacity={compact ? 0.32 : 0.42} strokeWidth={compact ? 0.62 : 0.72} />
            <motion.path d="M15.2 56.8C24.8 48.2 36.5 44.8 48 48.2" stroke="#83ecff" strokeOpacity="0.72" strokeWidth={compact ? 0.86 : 1.05} variants={{ idle: { pathLength: 0.76 }, hover: { pathLength: 1 } }} />
            <motion.path d="M80.8 56.8C71.2 48.2 59.5 44.8 48 48.2" stroke="#42d3f8" strokeOpacity="0.42" strokeWidth={compact ? 0.72 : 0.82} variants={{ idle: { pathLength: 0.7 }, hover: { pathLength: 1 } }} />
            <motion.path d="M3.5 94C8.9 74.7 17.7 59.3 31 49.2" stroke="#56dcff" strokeOpacity="0.34" strokeWidth={compact ? 0.68 : 0.86} variants={{ idle: { pathLength: 0.68 }, hover: { pathLength: 1 } }} />
            {!compact && <motion.path d="M92.5 94C87.1 74.7 78.3 59.3 65 49.2" stroke="#2bbfe9" strokeOpacity="0.2" strokeWidth="0.72" variants={{ idle: { pathLength: 0.62 }, hover: { pathLength: 1 } }} />}
          </motion.g>

          {!compact && (
            <motion.g
              data-brand-seams
              aria-hidden="true"
              fill="none"
              strokeLinecap="round"
              variants={{
                idle: { opacity: 0.28 },
                hover: { opacity: 0.48, transition: { duration: 0.78, ease: premiumEase } },
              }}
            >
              <path d="M34.2 27C38.2 20.6 42.8 15.8 48 12.7" stroke="#d3fbff" strokeOpacity="0.28" strokeWidth="0.65" />
              <path d="M61.8 27C57.8 20.6 53.2 15.8 48 12.7" stroke="#48d7ff" strokeOpacity="0.16" strokeWidth="0.6" />
              <motion.path d="M11.5 89.5C17.4 70.7 27 56.4 41.7 48.5" stroke="#69e5ff" strokeOpacity="0.28" strokeWidth="0.72" variants={{ idle: { pathLength: 0.68 }, hover: { pathLength: 1 } }} />
              <motion.path d="M84.5 89.5C78.6 70.7 69 56.4 54.3 48.5" stroke="#2ac6ee" strokeOpacity="0.15" strokeWidth="0.64" variants={{ idle: { pathLength: 0.64 }, hover: { pathLength: 1 } }} />
              <motion.path d="M28.2 95C30.8 74.7 35.9 59.1 43.8 49.4" stroke="#7beaff" strokeOpacity="0.2" strokeWidth="0.62" variants={{ idle: { pathLength: 0.58 }, hover: { pathLength: 0.94 } }} />
              <motion.path d="M67.8 95C65.2 74.7 60.1 59.1 52.2 49.4" stroke="#34ccef" strokeOpacity="0.11" strokeWidth="0.58" variants={{ idle: { pathLength: 0.58 }, hover: { pathLength: 0.94 } }} />
              <path d="M48 53V94" stroke="#3bd1f6" strokeOpacity="0.1" strokeWidth="0.52" />
            </motion.g>
          )}
        </motion.g>
      </motion.svg>
    </motion.span>
  );
}
