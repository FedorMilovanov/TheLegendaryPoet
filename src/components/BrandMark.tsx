import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../utils/cn';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'h-11 w-11', md: 'h-16 w-16', lg: 'h-24 w-24' };
const premiumEase = [0.16, 1, 0.3, 1] as const;
const BRAND_VERSION = 'cloak-20260726-7';

export default function BrandMark({ size = 'sm', className }: BrandMarkProps) {
  const reducedMotion = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const compact = size === 'sm';
  const titleId = `${id}-brand-title`;
  const descriptionId = `${id}-brand-description`;
  const cloakId = `${id}-cloak`;
  const hoodId = `${id}-hood`;
  const voidId = `${id}-void`;
  const rimId = `${id}-rim`;
  const auraBlurId = `${id}-aura-blur`;
  const rimGlowId = `${id}-rim-glow`;
  const textureBlurId = `${id}-texture-blur`;

  return (
    <motion.span
      data-brand-mark
      data-brand-version={BRAND_VERSION}
      data-brand-renderer="inline-vector"
      className={cn('relative inline-flex shrink-0 items-center justify-center overflow-visible', sizes[size], className)}
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
              ? 'drop-shadow(0 2px 4px rgba(0,5,15,.68)) drop-shadow(0 0 3px rgba(53,194,226,.08))'
              : 'drop-shadow(0 5px 10px rgba(0,4,13,.72)) drop-shadow(0 0 7px rgba(46,216,255,.12))',
          },
          hover: {
            y: compact ? -0.55 : -0.85,
            scale: compact ? 1.02 : 1.026,
            filter: compact
              ? 'drop-shadow(0 5px 8px rgba(0,8,20,.74)) drop-shadow(0 0 7px rgba(73,220,250,.2))'
              : 'drop-shadow(0 8px 15px rgba(0,8,20,.78)) drop-shadow(0 0 12px rgba(73,220,250,.23))',
            transition: { duration: 0.74, ease: premiumEase },
          },
        }}
      >
        <title id={titleId}>THE LEGENDARY POET</title>
        <desc id={descriptionId}>Безликая мистическая фигура в глубоком капюшоне и тяжёлой мантии, окружённая холодным спектральным светом</desc>
        <defs>
          <linearGradient id={cloakId} x1="9" y1="43" x2="80" y2="96" gradientUnits="userSpaceOnUse">
            <stop stopColor="#123149" /><stop offset=".25" stopColor="#092032" /><stop offset=".58" stopColor="#04101c" /><stop offset="1" stopColor="#000207" />
          </linearGradient>
          <linearGradient id={hoodId} x1="33" y1="8" x2="63" y2="49" gradientUnits="userSpaceOnUse">
            <stop stopColor="#20465e" /><stop offset=".3" stopColor="#123247" /><stop offset=".66" stopColor="#071b2a" /><stop offset="1" stopColor="#020812" />
          </linearGradient>
          <radialGradient id={voidId} cx="0" cy="0" r="1" gradientTransform="translate(48 35) rotate(90) scale(17 15)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#000" /><stop offset=".86" stopColor="#000001" /><stop offset="1" stopColor="#02060c" />
          </radialGradient>
          <linearGradient id={rimId} x1="30" y1="7" x2="76" y2="83" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fbffff" /><stop offset=".13" stopColor="#c6f9ff" /><stop offset=".36" stopColor="#6be7ff" /><stop offset=".66" stopColor="#2bb7da" stopOpacity=".4" /><stop offset="1" stopColor="#0c657e" stopOpacity="0" />
          </linearGradient>
          <filter id={auraBlurId} x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation="4.6" /></filter>
          <filter id={textureBlurId} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation=".28" /></filter>
          <filter id={rimGlowId} x="-120%" y="-120%" width="340%" height="340%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation="1.05" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        <motion.g data-brand-atmosphere aria-hidden="true" variants={{ idle: { opacity: compact ? 0.24 : 0.66, scale: compact ? 0.99 : 0.97 }, hover: { opacity: compact ? 0.4 : 0.9, scale: compact ? 1.015 : 1.045, transition: { duration: 0.88, ease: premiumEase } } }} style={{ transformOrigin: '48px 49px' }}>
          <g fill="none" strokeLinecap="round" filter={compact ? undefined : `url(#${auraBlurId})`}>
            <path d="M31 43C28 33 31 18 39 10C42 7 45 5 48 4C51 5 54 7 57 10C65 18 68 33 65 43" stroke="#66e1fb" strokeOpacity={compact ? .12 : .34} strokeWidth={compact ? 2.2 : 5} />
            <path d="M17 50C8 63 4 79 2 95" stroke="#45c8e5" strokeOpacity={compact ? .1 : .28} strokeWidth={compact ? 1.8 : 4.3} />
            <path d="M79 50C88 63 92 79 94 95" stroke="#18839e" strokeOpacity={compact ? .04 : .13} strokeWidth={compact ? 1.5 : 3.8} />
            {!compact && <path d="M9 93C22 88 35 87 48 91C61 87 74 88 87 93" stroke="#25a3c0" strokeOpacity=".11" strokeWidth="5" />}
          </g>
        </motion.g>

        <motion.g data-brand-energy aria-hidden="true" fill="none" strokeLinecap="round" variants={{ idle: { opacity: compact ? .18 : .34 }, hover: { opacity: compact ? .32 : .58, transition: { duration: .8, ease: premiumEase } } }}>
          <path d="M19 58C15 48 18 38 24 31" stroke="#76e6fa" strokeOpacity=".16" strokeWidth={compact ? .65 : 1.3} />
          <path d="M25 33C29 20 37 10 46 5" stroke="#a7f5ff" strokeOpacity=".2" strokeWidth={compact ? .66 : 1.3} />
          <path d="M71 33C67 20 59 10 50 5" stroke="#38abc8" strokeOpacity=".08" strokeWidth={compact ? .55 : 1.05} />
          {!compact && <><path d="M8 88C13 74 20 63 29 55" stroke="#51cfe5" strokeOpacity=".1" strokeWidth="1.15" /><path d="M88 88C83 74 76 63 67 55" stroke="#1b6f85" strokeOpacity=".035" strokeWidth=".95" /></>}
        </motion.g>

        <motion.g data-brand-figure variants={{ idle: { y: 0 }, hover: { y: compact ? -.08 : -.25, transition: { duration: .74, ease: premiumEase } } }}>
          <path data-brand-cloak d="M3 94C6.5 75 12 60 20 49.5C27 41.5 36 39.2 43 40C46 40.4 47.3 42 48 44C48.7 42 50 40.4 53 40C60 39.2 69.5 41 76.5 49C84.5 60 90 76 93 94C80 95 65 96 48 96C31 96 16 95 3 94Z" fill={`url(#${cloakId})`} />
          <motion.g data-brand-folds variants={{ idle: { opacity: compact ? .9 : .98, scale: 1 }, hover: { opacity: 1, scale: compact ? 1.002 : 1.006, transition: { duration: .78, ease: premiumEase } } }} style={{ transformOrigin: '48px 71px' }}>
            <path d="M3 94C10 74 21 56 39 43C31 61 26 79 24 95Z" fill="#12354b" fillOpacity=".72" />
            <path d="M93 94C86 74 75 56 57 43C65 61 70 79 72 95Z" fill="#04131e" fillOpacity=".74" />
            <path d="M13 95C21 74 31 57 44 44C37 63 33 81 32 96Z" fill="#082234" />
            <path d="M83 95C75 74 65 57 52 44C59 63 63 81 64 96Z" fill="#01050b" />
            <path d="M25 96C31 75 40 56 47 43C43 64 41 83 41.5 96Z" fill="#04121d" />
            <path d="M71 96C65 75 56 56 49 43C53 64 55 83 54.5 96Z" fill="#000309" />
            <path d="M41.5 96C43 75 45.5 57 48 44C50.5 57 53 75 54.5 96Z" fill="#000106" />
          </motion.g>
          <motion.g data-brand-collar variants={{ idle: { opacity: compact ? .92 : .98 }, hover: { opacity: 1, transition: { duration: .7, ease: premiumEase } } }}>
            <path d="M16 50C25.5 44.2 36.2 42.6 48 46.8C59.8 42.6 70.5 44.2 80 50C69.8 48.9 60.6 50.8 53.4 54.5C50.6 56 49 58 48 60C47 58 45.4 56 42.6 54.5C35.4 50.8 26.2 48.9 16 50Z" fill="#071c29" />
            <path d="M18 50.2C28 46.2 38.2 46.1 48 51" fill="none" stroke="#1a455a" strokeOpacity=".82" strokeWidth={compact ? 1.8 : 2.6} strokeLinecap="round" />
            <path d="M78 50.2C68 46.2 57.8 46.1 48 51" fill="none" stroke="#071b29" strokeOpacity=".94" strokeWidth={compact ? 1.8 : 2.7} strokeLinecap="round" />
            <path d="M21 53.8C31 49.8 40 50.2 48 55.8" fill="none" stroke="#0e3447" strokeOpacity=".8" strokeWidth={compact ? 1.5 : 2.2} strokeLinecap="round" />
            <path d="M75 53.8C65 49.8 56 50.2 48 55.8" fill="none" stroke="#03101a" strokeOpacity=".98" strokeWidth={compact ? 1.5 : 2.25} strokeLinecap="round" />
          </motion.g>
          <path data-brand-hood d="M48 8C40.5 9.8 35 15 31.5 22.5C28.5 29.5 28 36 30.2 41.5C32 45 37.5 47.5 48 50C58.5 47.5 64 45 65.8 41.5C68 36 67.5 29.5 64.5 22.5C61 15 55.5 9.8 48 8ZM48 21.5C42.5 24 38 28 34.2 33.5C34 37.5 36.5 41 40.5 44.2C43 46.2 45.5 48 48 49.6C50.5 48 53 46.2 55.5 44.2C59.5 41 62 37.5 61.8 33.5C58 28 53.5 24 48 21.5Z" fill={`url(#${hoodId})`} fillRule="evenodd" />
          <path d="M48 8.5C42 11 37.7 16 35 22.8C32.5 29.2 32.3 35.2 34.2 40.4C38 39 42.3 38 47 37.5C45 27.5 45.4 17.8 48 8.5Z" fill="#214b62" fillOpacity=".58" />
          <path d="M48 8.5C54 11 58.3 16 61 22.8C63.5 29.2 63.7 35.2 61.8 40.4C58 39 53.7 38 49 37.5C51 27.5 50.6 17.8 48 8.5Z" fill="#04131e" fillOpacity=".88" />
          <motion.g data-brand-texture data-brand-vector-source="reference-contours" aria-hidden="true" fill="none" strokeLinecap="round" filter={compact ? undefined : `url(#${textureBlurId})`} variants={{ idle: { opacity: compact ? .52 : .78 }, hover: { opacity: compact ? .7 : .96, transition: { duration: .82, ease: premiumEase } } }}>
            <path d="M7 84C18 71 30 57 43 48" stroke="#245d73" strokeOpacity=".52" strokeWidth={compact ? .72 : 1.45} />
            <path d="M12 69C23 60 34 52 44.5 47" stroke="#33758a" strokeOpacity=".4" strokeWidth={compact ? .62 : 1.2} />
            <path d="M20 95C26 76 35 58 45.5 47" stroke="#1c5269" strokeOpacity=".46" strokeWidth={compact ? .65 : 1.25} />
            <path d="M32 95C35 75 41 57 47 46" stroke="#123b50" strokeOpacity=".56" strokeWidth={compact ? .58 : 1.1} />
            <path d="M89 84C78 71 66 57 53 48" stroke="#0d3445" strokeOpacity=".36" strokeWidth={compact ? .66 : 1.35} />
            <path d="M84 69C73 60 62 52 51.5 47" stroke="#154456" strokeOpacity=".24" strokeWidth={compact ? .56 : 1.1} />
            <path d="M76 95C70 76 61 58 50.5 47" stroke="#082433" strokeOpacity=".5" strokeWidth={compact ? .62 : 1.2} />
            <path d="M64 95C61 75 55 57 49 46" stroke="#020b13" strokeOpacity=".76" strokeWidth={compact ? .54 : 1.05} />
            {!compact && <><path d="M10 84C21 70 32 57 43 49" stroke="#6ed6e7" strokeOpacity=".12" strokeWidth=".48" /><path d="M24 94C30 75 37 59 45 49" stroke="#68c9da" strokeOpacity=".09" strokeWidth=".42" /><path d="M86 84C75 70 64 57 53 49" stroke="#21839a" strokeOpacity=".045" strokeWidth=".42" /></>}
          </motion.g>
          <path data-brand-face-void d="M48 21.5C42.5 24 38 28 34.2 33.5C34 37.5 36.5 41 40.5 44.2C43 46.2 45.5 48 48 49.6C50.5 48 53 46.2 55.5 44.2C59.5 41 62 37.5 61.8 33.5C58 28 53.5 24 48 21.5Z" fill={`url(#${voidId})`} />
          <motion.g data-brand-rim-light aria-hidden="true" fill="none" strokeLinecap="round" variants={{ idle: { opacity: compact ? .72 : .84 }, hover: { opacity: 1, transition: { duration: .72, ease: premiumEase } } }}>
            <motion.path d="M30.3 41.2C28.8 33.2 30.6 21 39.8 12.5C42.8 10 45.6 8.8 48 8.3" stroke={`url(#${rimId})`} strokeWidth={compact ? 1.18 : 1.3} filter={compact ? undefined : `url(#${rimGlowId})`} variants={{ idle: { pathLength: .82 }, hover: { pathLength: 1 } }} />
            <motion.path d="M65.7 41.2C67.2 33.2 65.4 21 56.2 12.5C53.2 10 50.4 8.8 48 8.3" stroke="#4bcbe6" strokeOpacity=".32" strokeWidth={compact ? .68 : .76} variants={{ idle: { pathLength: .74 }, hover: { pathLength: 1 } }} />
            <motion.path d="M17 49.5C26 43 37 41 47.5 45.8" stroke="#85e7f5" strokeOpacity=".38" strokeWidth={compact ? .62 : .72} variants={{ idle: { pathLength: .72 }, hover: { pathLength: 1 } }} />
            <motion.path d="M79 49.5C70 43 59 41 48.5 45.8" stroke="#2a9eb9" strokeOpacity=".12" strokeWidth={compact ? .45 : .52} variants={{ idle: { pathLength: .66 }, hover: { pathLength: 1 } }} />
            <motion.path d="M4 92C9 74 19 57 36 44" stroke="#3eb5ce" strokeOpacity=".16" strokeWidth={compact ? .44 : .5} variants={{ idle: { pathLength: .64 }, hover: { pathLength: .96 } }} />
          </motion.g>
          <g data-brand-seams aria-hidden="true" fill="none" strokeLinecap="round">
            <path d="M35.8 23C39.2 16.2 43.4 11.5 48 9.6C52.6 11.5 56.8 16.2 60.2 23" stroke="#b6f2fb" strokeOpacity={compact ? .1 : .16} strokeWidth=".42" />
            <path d="M33.8 28C38 20.2 42.8 15.4 48 13C53.2 15.4 58 20.2 62.2 28" stroke="#71d7e8" strokeOpacity={compact ? .08 : .13} strokeWidth=".4" />
            {!compact && <path d="M32.8 32.5C37.2 25 42.5 20.2 48 17.8C53.5 20.2 58.8 25 63.2 32.5" stroke="#4ab6ca" strokeOpacity=".1" strokeWidth=".38" />}
            <path d="M48 9V21" stroke="#d7fbff" strokeOpacity={compact ? .12 : .2} strokeWidth=".42" />
          </g>
        </motion.g>
      </motion.svg>
    </motion.span>
  );
}
