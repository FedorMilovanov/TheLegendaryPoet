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
const BRAND_VERSION = 'cloak-20260726-5';

/**
 * Reference-shaped, vector-first emblem for THE LEGENDARY POET.
 *
 * The mark is assembled from a deep face void, a high pointed hood, broad
 * shoulders, layered collar bands, heavy cloak folds and restrained contour
 * energy. It contains no raster image, rectangular plate, chest crystal or
 * hidden substitute artwork.
 */
export default function BrandMark({ size = 'sm', className }: BrandMarkProps) {
  const reducedMotion = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const compact = size === 'sm';

  const titleId = `${id}-brand-title`;
  const descriptionId = `${id}-brand-description`;
  const cloakGradientId = `${id}-cloak-gradient`;
  const cloakLeftGradientId = `${id}-cloak-left-gradient`;
  const cloakRightGradientId = `${id}-cloak-right-gradient`;
  const collarLeftGradientId = `${id}-collar-left-gradient`;
  const collarRightGradientId = `${id}-collar-right-gradient`;
  const hoodGradientId = `${id}-hood-gradient`;
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
              ? 'drop-shadow(0 2px 3px rgba(0, 4, 13, 0.54))'
              : 'drop-shadow(0 4px 7px rgba(0, 4, 13, 0.62))',
          },
          hover: {
            y: compact ? -0.45 : -0.75,
            scale: compact ? 1.018 : 1.026,
            filter: compact
              ? 'drop-shadow(0 4px 7px rgba(0, 8, 20, 0.66)) drop-shadow(0 0 5px rgba(46, 216, 255, 0.18))'
              : 'drop-shadow(0 7px 13px rgba(0, 8, 20, 0.7)) drop-shadow(0 0 9px rgba(46, 216, 255, 0.2))',
            transition: { duration: 0.72, ease: premiumEase },
          },
        }}
      >
        <title id={titleId}>THE LEGENDARY POET</title>
        <desc id={descriptionId}>
          Безликая фигура в высоком остром капюшоне и тяжёлом чёрно-синем плаще,
          окружённая холодным контурным свечением
        </desc>

        <defs>
          <linearGradient
            id={cloakGradientId}
            x1="18"
            y1="43"
            x2="78"
            y2="96"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#10233a" />
            <stop offset="0.28" stopColor="#081626" />
            <stop offset="0.62" stopColor="#030a13" />
            <stop offset="1" stopColor="#00030a" />
          </linearGradient>
          <linearGradient
            id={cloakLeftGradientId}
            x1="12"
            y1="54"
            x2="49"
            y2="91"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#15314c" stopOpacity="0.78" />
            <stop offset="0.46" stopColor="#071321" stopOpacity="0.68" />
            <stop offset="1" stopColor="#01040a" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient
            id={cloakRightGradientId}
            x1="84"
            y1="53"
            x2="48"
            y2="91"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#0a1b2d" stopOpacity="0.7" />
            <stop offset="0.5" stopColor="#030a14" stopOpacity="0.62" />
            <stop offset="1" stopColor="#000207" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient
            id={collarLeftGradientId}
            x1="16"
            y1="49"
            x2="48"
            y2="69"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#1b3a55" stopOpacity="0.88" />
            <stop offset="0.42" stopColor="#0b1d31" stopOpacity="0.86" />
            <stop offset="1" stopColor="#020812" stopOpacity="0.28" />
          </linearGradient>
          <linearGradient
            id={collarRightGradientId}
            x1="80"
            y1="49"
            x2="48"
            y2="69"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#10263d" stopOpacity="0.8" />
            <stop offset="0.45" stopColor="#061323" stopOpacity="0.88" />
            <stop offset="1" stopColor="#00040b" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient
            id={hoodGradientId}
            x1="30"
            y1="10"
            x2="67"
            y2="47"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#183754" />
            <stop offset="0.2" stopColor="#0e2338" />
            <stop offset="0.55" stopColor="#06111f" />
            <stop offset="1" stopColor="#01050c" />
          </linearGradient>
          <linearGradient
            id={rimGradientId}
            x1="29"
            y1="12"
            x2="70"
            y2="50"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#e5fbff" stopOpacity="0.95" />
            <stop offset="0.16" stopColor="#8eeeff" stopOpacity="0.88" />
            <stop offset="0.5" stopColor="#38d6ff" stopOpacity="0.48" />
            <stop offset="1" stopColor="#1b90c2" stopOpacity="0.04" />
          </linearGradient>
          <radialGradient
            id={auraGradientId}
            cx="0"
            cy="0"
            r="1"
            gradientTransform="translate(48 47) rotate(90) scale(45 35)"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#9af1ff" stopOpacity="0.42" />
            <stop offset="0.22" stopColor="#43d8ff" stopOpacity="0.25" />
            <stop offset="0.56" stopColor="#168db8" stopOpacity="0.11" />
            <stop offset="1" stopColor="#071726" stopOpacity="0" />
          </radialGradient>
          <radialGradient
            id={voidGradientId}
            cx="0"
            cy="0"
            r="1"
            gradientTransform="translate(48 35) rotate(90) scale(19 16)"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#000000" />
            <stop offset="0.74" stopColor="#000105" />
            <stop offset="1" stopColor="#06101c" />
          </radialGradient>
          <filter
            id={auraBlurFilterId}
            x="-60%"
            y="-60%"
            width="220%"
            height="220%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation="5.2" />
          </filter>
          <filter
            id={rimGlowFilterId}
            x="-80%"
            y="-80%"
            width="260%"
            height="260%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation="1.15" result="blur" />
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
            idle: { opacity: compact ? 0.18 : 0.48, scale: compact ? 0.985 : 0.97 },
            hover: {
              opacity: compact ? 0.3 : 0.72,
              scale: compact ? 1.01 : 1.035,
              transition: { duration: 0.86, ease: premiumEase },
            },
          }}
          style={{ transformOrigin: '48px 49px' }}
        >
          {!compact && (
            <>
              <path
                d="M9 79C8 60 15 38 31 22C38 15 43 11 48 8C53 11 58 15 65 22C81 38 88 60 87 79C77 68 68 61 61 57C56 54 52 52 48 51C44 52 40 54 35 57C28 61 19 68 9 79Z"
                fill={`url(#${auraGradientId})`}
                filter={`url(#${auraBlurFilterId})`}
              />
              <g
                fill="none"
                stroke="#45dbff"
                strokeLinecap="round"
                filter={`url(#${auraBlurFilterId})`}
                opacity="0.26"
              >
                <path
                  d="M25.8 43C26.5 28.8 32.9 14.3 48 4.6C63.1 14.3 69.5 28.8 70.2 43"
                  strokeWidth="3.8"
                />
                <path
                  d="M8.5 95C13 70.7 24.7 49.3 40.4 42"
                  strokeWidth="3.2"
                />
                <path
                  d="M87.5 95C83 70.7 71.3 49.3 55.6 42"
                  strokeWidth="3.2"
                />
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
            idle: { opacity: compact ? 0.13 : 0.32 },
            hover: {
              opacity: compact ? 0.24 : 0.56,
              transition: { duration: 0.78, ease: premiumEase },
            },
          }}
        >
          <path
            d="M13 73C10 55 17 35 32 20"
            stroke="#3ddcff"
            strokeOpacity="0.2"
            strokeWidth={compact ? 0.72 : 1.1}
          />
          <path
            d="M83 73C86 55 79 35 64 20"
            stroke="#3ddcff"
            strokeOpacity="0.16"
            strokeWidth={compact ? 0.72 : 1.1}
          />
          {!compact && (
            <>
              <path
                d="M20 87C14 71 17 56 26 43"
                stroke="#70e8ff"
                strokeOpacity="0.12"
                strokeWidth="0.8"
              />
              <path
                d="M76 87C82 71 79 56 70 43"
                stroke="#70e8ff"
                strokeOpacity="0.1"
                strokeWidth="0.8"
              />
            </>
          )}
        </motion.g>

        <motion.g
          data-brand-figure
          variants={{
            idle: { y: 0 },
            hover: { y: compact ? -0.1 : -0.25, transition: { duration: 0.72, ease: premiumEase } },
          }}
        >
          <path
            data-brand-cloak
            d="M5.5 96C8.2 80.4 13.5 65.3 22.6 54.2C28.2 47.3 34.2 44.4 40.3 41.8C42.4 40.9 44.7 40.3 48 40.3C51.3 40.3 53.6 40.9 55.7 41.8C61.8 44.4 67.8 47.3 73.4 54.2C82.5 65.3 87.8 80.4 90.5 96Z"
            fill={`url(#${cloakGradientId})`}
            stroke="#1a3854"
            strokeOpacity="0.72"
            strokeWidth={compact ? 0.72 : 0.8}
          />

          <motion.g
            data-brand-folds
            variants={{
              idle: { opacity: compact ? 0.82 : 0.94, scale: 1 },
              hover: {
                opacity: 1,
                scale: compact ? 1.002 : 1.006,
                transition: { duration: 0.76, ease: premiumEase },
              },
            }}
            style={{ transformOrigin: '48px 70px' }}
          >
            <motion.path
              d="M5.5 96C9.2 78.6 16.2 61.6 28.4 50.5C32.6 46.7 37.2 44.1 42.3 42.1C36.1 51.8 31.8 69 29.4 96Z"
              fill={`url(#${cloakLeftGradientId})`}
              variants={{ idle: { x: 0 }, hover: { x: compact ? 0 : -0.25 } }}
            />
            <motion.path
              d="M90.5 96C86.8 78.6 79.8 61.6 67.6 50.5C63.4 46.7 58.8 44.1 53.7 42.1C59.9 51.8 64.2 69 66.6 96Z"
              fill={`url(#${cloakRightGradientId})`}
              variants={{ idle: { x: 0 }, hover: { x: compact ? 0 : 0.25 } }}
            />
            <path
              d="M28.5 59.2C34.8 53.9 41.2 50.8 48 50.6C42.9 62.2 40 77.3 39 96H24.9C25.5 80.6 26.7 68.3 28.5 59.2Z"
              fill="#071523"
              fillOpacity="0.9"
            />
            <path
              d="M67.5 59.2C61.2 53.9 54.8 50.8 48 50.6C53.1 62.2 56 77.3 57 96H71.1C70.5 80.6 69.3 68.3 67.5 59.2Z"
              fill="#01050c"
              fillOpacity="0.96"
            />
            <path
              d="M48 47.7C44.4 61.8 42.7 77.9 42.5 96H53.5C53.3 77.9 51.6 61.8 48 47.7Z"
              fill="#000309"
            />
          </motion.g>

          <motion.g
            data-brand-collar
            variants={{
              idle: { opacity: compact ? 0.86 : 0.96 },
              hover: { opacity: 1, transition: { duration: 0.68, ease: premiumEase } },
            }}
          >
            <motion.path
              d="M16.2 58.2C25.8 48.6 37.1 44.8 48 48.2C42.6 52.1 36.2 58.8 29.3 68.1C24.1 64 19.8 60.7 16.2 58.2Z"
              fill={`url(#${collarLeftGradientId})`}
              variants={{ idle: { x: 0 }, hover: { x: compact ? 0 : -0.18 } }}
            />
            <motion.path
              d="M79.8 58.2C70.2 48.6 58.9 44.8 48 48.2C53.4 52.1 59.8 58.8 66.7 68.1C71.9 64 76.2 60.7 79.8 58.2Z"
              fill={`url(#${collarRightGradientId})`}
              variants={{ idle: { x: 0 }, hover: { x: compact ? 0 : 0.18 } }}
            />
            {!compact && (
              <>
                <path
                  d="M10.8 70.8C23.8 57 36.3 51 48 52.2C39.7 60.2 32.5 70.1 26.1 82.2C20.4 77.4 15.3 73.6 10.8 70.8Z"
                  fill="#0a1a2c"
                  fillOpacity="0.78"
                />
                <path
                  d="M85.2 70.8C72.2 57 59.7 51 48 52.2C56.3 60.2 63.5 70.1 69.9 82.2C75.6 77.4 80.7 73.6 85.2 70.8Z"
                  fill="#01050c"
                  fillOpacity="0.92"
                />
              </>
            )}
          </motion.g>

          <path
            data-brand-hood
            d="M27 42.8C27.5 29.7 33.2 15.2 48 5.3C62.8 15.2 68.5 29.7 69 42.8C64 42 59.7 41.1 56.2 39.8C53.2 38.7 50.7 38.1 48 38.1C45.3 38.1 42.8 38.7 39.8 39.8C36.3 41.1 32 42 27 42.8ZM31.1 40.2C33.2 31 38.1 22.8 48 17.9C57.9 22.8 62.8 31 64.9 40.2C61 44.4 56.6 47.7 52 49.7C50.3 50.4 49 51 48 51.7C47 51 45.7 50.4 44 49.7C39.4 47.7 35 44.4 31.1 40.2Z"
            fill={`url(#${hoodGradientId})`}
            fillRule="evenodd"
            stroke="#244966"
            strokeOpacity="0.7"
            strokeWidth={compact ? 0.72 : 0.8}
          />
          {!compact && (
            <>
              <path
                d="M27.7 41.6C28.9 28.8 34.2 16.8 48 6.6C39.6 16.2 36.2 27.6 35.3 38.8C32.9 39.8 30.4 40.7 27.7 41.6Z"
                fill="#1b3e5b"
                fillOpacity="0.42"
              />
              <path
                d="M68.3 41.6C67.1 28.8 61.8 16.8 48 6.6C56.4 16.2 59.8 27.6 60.7 38.8C63.1 39.8 65.6 40.7 68.3 41.6Z"
                fill="#01060e"
                fillOpacity="0.66"
              />
            </>
          )}
          <path
            data-brand-face-void
            d="M31.1 40.2C33.2 31 38.1 22.8 48 17.9C57.9 22.8 62.8 31 64.9 40.2C61 44.4 56.6 47.7 52 49.7C50.3 50.4 49 51 48 51.7C47 51 45.7 50.4 44 49.7C39.4 47.7 35 44.4 31.1 40.2Z"
            fill={`url(#${voidGradientId})`}
          />

          <motion.g
            data-brand-rim-light
            aria-hidden="true"
            fill="none"
            strokeLinecap="round"
            variants={{
              idle: { opacity: compact ? 0.58 : 0.7 },
              hover: {
                opacity: compact ? 0.88 : 1,
                transition: { duration: 0.7, ease: premiumEase },
              },
            }}
          >
            <motion.path
              d="M27.8 40.6C29.8 26.5 36.8 13.5 48 6.6"
              stroke={`url(#${rimGradientId})`}
              strokeWidth={compact ? 1.05 : 1.25}
              filter={compact ? undefined : `url(#${rimGlowFilterId})`}
              variants={{ idle: { pathLength: 0.84 }, hover: { pathLength: 1 } }}
            />
            <motion.path
              d="M68.2 40.6C66.2 26.5 59.2 13.5 48 6.6"
              stroke="#55ddff"
              strokeOpacity="0.32"
              strokeWidth={compact ? 0.72 : 0.9}
              variants={{ idle: { pathLength: 0.76 }, hover: { pathLength: 1 } }}
            />
            <path
              d="M48 7.2V34.6"
              stroke="#9cefff"
              strokeOpacity={compact ? 0.24 : 0.34}
              strokeWidth={compact ? 0.56 : 0.7}
            />
            <motion.path
              d="M23.1 54.1C31.3 46.7 39.5 44.9 48 48.3"
              stroke="#6ee6ff"
              strokeOpacity="0.5"
              strokeWidth={compact ? 0.68 : 0.85}
              variants={{ idle: { pathLength: 0.72 }, hover: { pathLength: 1 } }}
            />
            <motion.path
              d="M72.9 54.1C64.7 46.7 56.5 44.9 48 48.3"
              stroke="#45d8ff"
              strokeOpacity="0.26"
              strokeWidth={compact ? 0.6 : 0.75}
              variants={{ idle: { pathLength: 0.68 }, hover: { pathLength: 1 } }}
            />
          </motion.g>

          {!compact && (
            <motion.g
              data-brand-seams
              aria-hidden="true"
              fill="none"
              strokeLinecap="round"
              variants={{
                idle: { opacity: 0.18 },
                hover: { opacity: 0.38, transition: { duration: 0.78, ease: premiumEase } },
              }}
            >
              <path
                d="M35.5 27C39.1 21.2 43.3 16.9 48 13.9"
                stroke="#bff7ff"
                strokeOpacity="0.26"
                strokeWidth="0.65"
              />
              <path
                d="M60.5 27C56.9 21.2 52.7 16.9 48 13.9"
                stroke="#4ad9ff"
                strokeOpacity="0.14"
                strokeWidth="0.6"
              />
              <motion.path
                d="M12.9 90.5C18.1 72.8 27.5 58 41.2 49.3"
                stroke="#5ee0ff"
                strokeOpacity="0.2"
                strokeWidth="0.7"
                variants={{ idle: { pathLength: 0.68 }, hover: { pathLength: 1 } }}
              />
              <motion.path
                d="M83.1 90.5C77.9 72.8 68.5 58 54.8 49.3"
                stroke="#2dc7ee"
                strokeOpacity="0.12"
                strokeWidth="0.65"
                variants={{ idle: { pathLength: 0.64 }, hover: { pathLength: 1 } }}
              />
              <motion.path
                d="M27.1 95C29 75.9 34.4 60.8 43.5 50.4"
                stroke="#74e8ff"
                strokeOpacity="0.14"
                strokeWidth="0.6"
                variants={{ idle: { pathLength: 0.58 }, hover: { pathLength: 0.92 } }}
              />
              <motion.path
                d="M68.9 95C67 75.9 61.6 60.8 52.5 50.4"
                stroke="#3ad1f6"
                strokeOpacity="0.09"
                strokeWidth="0.6"
                variants={{ idle: { pathLength: 0.58 }, hover: { pathLength: 0.92 } }}
              />
              <path
                d="M48 52V94"
                stroke="#3bd4fa"
                strokeOpacity="0.09"
                strokeWidth="0.55"
              />
            </motion.g>
          )}
        </motion.g>
      </motion.svg>
    </motion.span>
  );
}
