import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../utils/cn';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'h-12 w-12', md: 'h-16 w-16', lg: 'h-24 w-24' };
const premiumEase = [0.16, 1, 0.3, 1] as const;
const BRAND_VERSION = 'cloak-20260726-8';

const cloakPath = 'M51 5.2Q47.1 2 43.3 5.8Q39.5 9.5 36.8 16.6Q34.1 23.7 34.2 26.5Q34.4 29.4 33.6 29.9Q32.8 30.5 33.7 30.9Q34.6 31.2 30.3 36.3Q26 41.4 23.3 42.5Q20.6 43.7 19 45Q17.3 46.2 9.9 60.6Q2.5 74.9 2.6 82.8Q2.8 90.6 12.3 91.6Q21.9 92.6 24.2 93.8Q26.5 95.1 33.1 94.5Q39.7 94 44 95Q48.4 96 53.8 95Q59.1 94 68.7 94Q78.2 94 79.6 93Q81 91.9 86.8 91.2Q92.5 90.6 93.2 84.6Q94 78.6 89.5 70.4Q85.1 62.3 84.2 60.5Q83.3 58.6 78.9 49.5Q74.6 40.5 69.4 38.6Q64.2 36.7 63.5 33.6Q62.7 30.5 61.4 30.4Q60.1 30.3 60.3 27Q60.6 23.7 57.7 16Q54.8 8.3 51 5.2Z';
const hoodPath = 'M47.4 2.8C40.9 6.4 36.1 14.2 34.3 23.7C33.5 28.2 34.5 31.7 31 36.1C28.7 39 25.2 41.8 21 43.8C29.7 42.8 37.1 44.7 43.2 49C45.3 50.5 46.8 52.5 48 55C49.2 52.5 50.7 50.5 52.8 49C59.1 44.6 66.1 41.7 75 40.6C70.2 38.4 66.1 35.7 63.6 32.4C61.7 29.9 62.5 27.1 61.3 22.3C59 13.4 54.2 6 47.4 2.8Z';
const voidPath = 'M49.5 21.1Q44.8 20 42.9 22.7Q41 25.4 40.4 28.2Q39.8 31.1 38.5 31.9Q37.2 32.7 37.2 35.6Q37.2 38.5 36.5 38.6Q35.8 38.7 35.6 39.4Q35.5 40.1 33.8 40Q32 39.9 31.8 41Q31.5 42.1 30.2 42.7Q29 43.3 30.9 45.8Q32.8 48.2 35.5 50Q38.2 51.8 41.6 52.8Q45 53.8 48.8 53.8Q52.5 53.8 57.6 51.8Q62.8 49.8 64.9 47.7Q67 45.6 66.9 44.4Q66.8 43.1 65.8 43Q64.8 42.9 64.9 41.4Q65 39.9 63.4 39.9Q61.8 39.9 61.6 39.4Q61.5 38.9 60.5 38.8Q59.5 38.7 59.8 36.3Q60 33.9 58.5 32.3Q57 30.7 55.6 26.4Q54.2 22.2 49.5 21.1Z';

const atmosphereFills = [
  ['M27 74C21 55 27 35 40 21C44 16 46 10 48 5C50 10 52 16 56 21C69 35 75 55 69 74C62 62 55 56 48 53C41 56 34 62 27 74Z', '#72e6ff', 0.2],
  ['M1 94C9 69 20 53 35 43C25 61 18 78 15 96Z', '#29cff3', 0.13],
  ['M95 94C87 69 76 53 61 43C71 61 78 78 81 96Z', '#188da9', 0.08],
] as const;
const atmosphereStrokes = [
  ['M12 88C7 67 14 44 29 27', '#4ad5f3', 0.19, 2.3],
  ['M84 88C89 67 82 44 67 27', '#1f97b5', 0.11, 1.8],
  ['M2 93C12 72 24 57 39 49', '#64dcf4', 0.14, 2.1],
  ['M94 93C84 72 72 57 57 49', '#177b95', 0.08, 1.6],
] as const;
const energyPaths = [
  ['M12 82C8 64 14 45 28 30', '#43cfe9', 0.24, 0.6],
  ['M84 82C88 64 82 45 68 30', '#218da8', 0.15, 0.52],
  ['M20 58C15 46 19 33 30 24', '#70dff4', 0.16, 0.5],
  ['M76 58C81 46 77 33 66 24', '#248da5', 0.1, 0.44],
] as const;
const foldPaths = [
  ['M2.4 90.5C9 69 19 53 34 45C38 43 42 44 45 47C34 59 24 76 18 93Z', '#123148'],
  ['M93 89.9C86 68 77 52 62 44C58 42 54 43 51 47C62 59 72 76 78 94Z', '#061725'],
  ['M10 92C17 70 27 54 41 47C35 63 31 79 30 94Z', '#0a2235'],
  ['M86 92C79 70 69 54 55 47C61 63 65 79 66 94Z', '#020811'],
  ['M28 94C32 72 39 56 46 47C43 64 41 80 41 95Z', '#06121d'],
  ['M68 94C64 72 57 56 50 47C53 64 55 80 55 95Z', '#010409'],
  ['M41 95C42 76 45 61 48 50C51 61 54 76 55 95Z', '#000104'],
] as const;
const hoodSeams = [
  ['M34.8 35.8C35.6 27 39.6 18.5 47.6 13.4', '#8be3f5', 0.18, 0.6],
  ['M61.5 34.8C60.7 26.5 56.5 18.2 48.1 13.2', '#2b97b0', 0.08, 0.5],
  ['M37.3 28.4C39.5 21.5 43.1 16 47.6 12.1', '#b5eff9', 0.14, 0.52],
  ['M58.6 28.1C56.4 21.4 52.7 15.9 48.2 12', '#2f8ca2', 0.06, 0.44],
  ['M40.2 20.5C42.4 16 45 12.7 47.7 10.3', '#e0fbff', 0.11, 0.46],
] as const;
const rimPaths = [
  ['M21.3 42.7C25.4 40.5 28.5 37.3 30.2 33.3', '#9cefff', 0.72, 1.08],
  ['M31.8 28.7C34.4 19.6 38.8 8.7 47.4 3.4', 'gradient', 1, 1.32],
  ['M47.4 3.4C52.8 6.6 56.5 11.8 58.9 18.2', '#55cde7', 0.36, 0.74],
  ['M61.3 27.2C62 30.2 62.8 32.3 64.2 34.6', '#42b8d4', 0.24, 0.64],
  ['M66.7 37.5C68.7 39.3 71.1 40.7 74.2 40.6', '#2aa3bf', 0.16, 0.58],
  ['M17 46.2C11.3 55.3 7.1 68.1 4.3 83.7', '#95e8f8', 0.28, 0.72],
  ['M3.8 87.2C3.6 88.2 3.5 89.1 3.4 90', '#52c2da', 0.18, 0.62],
  ['M83.1 58.5C87.3 67.8 90.2 78.1 92 88.2', '#248ca6', 0.09, 0.5],
] as const;
const seamPaths = [
  ['M17.5 48.5C25.5 44.6 34 43.6 41.4 44.9', '#9ae8f6', 0.11, 0.54],
  ['M78.5 48.5C70.5 44.6 62 43.6 54.6 44.9', '#2a849a', 0.05, 0.44],
  ['M7 88C15 66.2 26.6 51.3 41.4 45.8', '#60c3d7', 0.1, 0.52],
  ['M89 88C81 66.2 69.4 51.3 54.6 45.8', '#196879', 0.04, 0.42],
  ['M23.5 94C29.8 71.4 37.5 55.3 44.8 46.5', '#66cadf', 0.08, 0.46],
  ['M18.8 86C24.8 67.4 34.2 53.6 43 47.8', '#4bb5cc', 0.07, 0.42],
  ['M77.4 87C71.5 68.2 62.4 54 53.2 47.8', '#176276', 0.035, 0.38],
  ['M34.6 93C36.8 72.8 41 56.6 46.2 47.8', '#69c9dd', 0.06, 0.4],
] as const;

export default function BrandMark({ size = 'sm', className }: BrandMarkProps) {
  const reducedMotion = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const compact = size === 'sm';
  const ids = {
    title: `${id}-brand-title`, description: `${id}-brand-description`, base: `${id}-base`, hood: `${id}-hood`,
    cowlL: `${id}-cowl-l`, cowlR: `${id}-cowl-r`, rim: `${id}-rim`, void: `${id}-void`, blur: `${id}-blur`, glow: `${id}-glow`,
  };

  return (
    <motion.span data-brand-mark data-brand-version={BRAND_VERSION} data-brand-renderer="inline-vector" data-brand-vector-source="reference-derived-contours-v8" className={cn('relative inline-flex shrink-0 items-center justify-center overflow-visible', sizes[size], className)} initial={false} animate="idle" whileHover={reducedMotion ? undefined : 'hover'}>
      <motion.svg data-brand-vector className="h-full w-full overflow-visible" viewBox="0 0 96 96" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false" style={{ pointerEvents: 'none' }} variants={{ idle: { y: 0, scale: 1, filter: compact ? 'drop-shadow(0 3px 5px rgba(0,4,13,.72)) drop-shadow(0 0 4px rgba(46,216,255,.1))' : 'drop-shadow(0 5px 11px rgba(0,4,13,.74)) drop-shadow(0 0 7px rgba(46,216,255,.12))' }, hover: { y: compact ? -0.55 : -0.85, scale: compact ? 1.02 : 1.027, filter: compact ? 'drop-shadow(0 5px 9px rgba(0,7,18,.8)) drop-shadow(0 0 7px rgba(65,220,255,.22))' : 'drop-shadow(0 8px 17px rgba(0,7,18,.82)) drop-shadow(0 0 13px rgba(65,220,255,.24))', transition: { duration: 0.78, ease: premiumEase } } }}>
        <title id={ids.title}>THE LEGENDARY POET</title>
        <desc id={ids.description}>Мистическая безликая фигура в глубоком тканевом капюшоне и тяжёлой мантии, окружённая холодной спектральной энергией</desc>
        <defs>
          <linearGradient id={ids.base} x1="6" y1="34" x2="88" y2="96" gradientUnits="userSpaceOnUse"><stop stopColor="#17364c"/><stop offset=".18" stopColor="#0c2131"/><stop offset=".55" stopColor="#040c14"/><stop offset="1" stopColor="#000104"/></linearGradient>
          <linearGradient id={ids.hood} x1="31" y1="4" x2="67" y2="53" gradientUnits="userSpaceOnUse"><stop stopColor="#21465d"/><stop offset=".22" stopColor="#10283c"/><stop offset=".58" stopColor="#06141f"/><stop offset="1" stopColor="#010308"/></linearGradient>
          <linearGradient id={ids.cowlL} x1="17" y1="43" x2="53" y2="61" gradientUnits="userSpaceOnUse"><stop stopColor="#294f63"/><stop offset=".36" stopColor="#153448"/><stop offset=".72" stopColor="#061521"/><stop offset="1" stopColor="#010409"/></linearGradient>
          <linearGradient id={ids.cowlR} x1="79" y1="43" x2="44" y2="61" gradientUnits="userSpaceOnUse"><stop stopColor="#18374b"/><stop offset=".42" stopColor="#0a2030"/><stop offset=".78" stopColor="#031019"/><stop offset="1" stopColor="#000206"/></linearGradient>
          <linearGradient id={ids.rim} x1="34" y1="3" x2="78" y2="69" gradientUnits="userSpaceOnUse"><stop stopColor="#f4ffff"/><stop offset=".1" stopColor="#c4f8ff"/><stop offset=".32" stopColor="#6ce6ff"/><stop offset=".62" stopColor="#2fc3e9" stopOpacity=".66"/><stop offset="1" stopColor="#0a7598" stopOpacity="0"/></linearGradient>
          <radialGradient id={ids.void} cx="0" cy="0" r="1" gradientTransform="translate(48 38) rotate(90) scale(18 19)" gradientUnits="userSpaceOnUse"><stop stopColor="#000"/><stop offset=".9" stopColor="#000103"/><stop offset="1" stopColor="#02050a"/></radialGradient>
          <filter id={ids.blur} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation={compact ? 3.3 : 4}/></filter>
          <filter id={ids.glow} x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation={compact ? 0.68 : 0.8} result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>

        <motion.g data-brand-atmosphere aria-hidden="true" filter={`url(#${ids.blur})`} variants={{ idle: { opacity: compact ? 0.42 : 0.66, scale: compact ? 0.99 : 0.975 }, hover: { opacity: compact ? 0.66 : 0.9, scale: compact ? 1.018 : 1.045, transition: { duration: 0.92, ease: premiumEase } } }} style={{ transformOrigin: '48px 48px' }}>
          {atmosphereFills.map(([d, fill, opacity]) => <path key={d} d={d} fill={fill} fillOpacity={opacity}/>) }
          <g fill="none" strokeLinecap="round">{atmosphereStrokes.map(([d, stroke, opacity, width]) => <path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={width}/>)}</g>
        </motion.g>
        <motion.g data-brand-energy aria-hidden="true" fill="none" strokeLinecap="round" variants={{ idle: { opacity: compact ? 0.24 : 0.36 }, hover: { opacity: compact ? 0.48 : 0.62, transition: { duration: 0.8, ease: premiumEase } } }}>
          {energyPaths.map(([d, stroke, opacity, width]) => <path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={compact ? width * 0.86 : width}/>) }
        </motion.g>

        <motion.g data-brand-figure variants={{ idle: { y: 0 }, hover: { y: compact ? -0.1 : -0.28, transition: { duration: 0.74, ease: premiumEase } } }}>
          <path data-brand-cloak d={cloakPath} fill={`url(#${ids.base})`} stroke="#17364b" strokeOpacity=".72" strokeWidth={compact ? 0.72 : 0.8}/>
          <motion.g data-brand-folds variants={{ idle: { opacity: compact ? 0.96 : 1, scale: 1 }, hover: { opacity: 1, scale: compact ? 1.002 : 1.006, transition: { duration: 0.8, ease: premiumEase } } }} style={{ transformOrigin: '48px 70px' }}>
            {foldPaths.map(([d, fill], index) => <motion.path key={d} d={d} fill={fill} variants={index < 2 ? { idle: { x: 0 }, hover: { x: compact ? 0 : index === 0 ? -0.18 : 0.16 } } : undefined}/>) }
            {!compact && <><path d="M5 89C14 65 26 51 39 46C28 59 18 76 14 94Z" fill="#193a50" fillOpacity=".2"/><path d="M91 89C82 65 70 51 57 46C68 59 78 76 82 94Z" fill="#0a2130" fillOpacity=".12"/></>}
          </motion.g>
          <motion.path data-brand-hood d={hoodPath} fill={`url(#${ids.hood})`} stroke="#285069" strokeOpacity=".8" strokeWidth={compact ? 0.78 : 0.86} variants={{ idle: { y: 0 }, hover: { y: compact ? -0.05 : -0.14 } }}/>
          <path data-brand-face-void d={voidPath} fill={`url(#${ids.void})`}/>
          <path d="M31.2 41.2C34.2 32 39.6 24.8 48.4 21.4C56.6 24.9 62.2 32 64.6 41.4C61.6 37.1 58.1 33.6 54.2 30.9C51.9 29.3 49.8 28.6 47.9 28.7C45.8 28.6 43.7 29.4 41.4 31C37.5 33.7 34.1 37.1 31.2 41.2Z" fill="#02060b" fillOpacity=".72"/>

          <motion.g data-brand-collar variants={{ idle: { opacity: compact ? 0.97 : 1 }, hover: { opacity: 1, transition: { duration: 0.72, ease: premiumEase } } }}>
            <path d="M14.8 49.2C24.8 44.4 34.5 44 42.7 46.5C45.4 47.3 47.2 48.7 48.7 50.4C50.2 48.6 52.1 47.2 55 46.4C63.6 44 73.1 45 81.2 50.1C73.7 49.5 67 50.8 60.9 53.3C55.4 55.6 51.2 58.1 48 61.1C44.1 58.3 39.8 56 34.5 53.7C28.5 51.2 22 49.7 14.8 49.2Z" fill="#06131f"/>
            <motion.path d="M16.6 47.4C27.3 44.2 36.7 45 44.3 47.7C46.6 48.5 48.4 49.6 50 51.2C42.5 50.8 35.4 52.2 28.8 55.2C23.7 54.4 19.6 51.8 16.6 47.4Z" fill={`url(#${ids.cowlL})`} variants={{ idle: { x: 0 }, hover: { x: compact ? 0 : -0.12 } }}/>
            <motion.path d="M79.4 49C70.3 45.1 61.5 45.2 52.2 47.9C50.3 48.5 48.7 49.6 47.2 51C54.3 51 60.8 52.5 66.8 55.3C71.6 54.8 76 52.6 79.4 49Z" fill={`url(#${ids.cowlR})`} variants={{ idle: { x: 0 }, hover: { x: compact ? 0 : 0.1 } }}/>
            <path d="M24.5 54C33.4 50.8 41 50.6 48.3 52.8C55 50.9 62.3 51.3 70.5 54.7C62.7 54.6 55.2 56.5 48 60.5C41 56.8 33.3 54.8 24.5 54Z" fill="#02070d"/>
            <path d="M22.2 51.3C30.1 48.7 37.9 49 48.2 52C40.8 52.4 34.8 53.9 29.4 56.5C26 55.7 23.6 53.9 22.2 51.3Z" fill="#1b3a4f" fillOpacity=".62"/>
            <path d="M74.2 52.4C66.5 49.2 58.8 49.2 48.2 52C55.2 52.6 60.9 54.1 65.9 56.5C69.1 55.9 72 54.5 74.2 52.4Z" fill="#071722" fillOpacity=".82"/>
            <path d="M35.2 56.5C40.2 54.8 44.6 54.8 48.2 56C51.7 54.9 55.8 55 60.5 56.8C55.4 57.4 51.3 58.8 48 61.2C44.5 58.8 40.2 57.3 35.2 56.5Z" fill="#000205"/>
          </motion.g>

          <g data-brand-texture aria-hidden="true" fill="none" strokeLinecap="round">{hoodSeams.slice(0, compact ? 2 : hoodSeams.length).map(([d, stroke, opacity, width]) => <path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={compact ? width * 0.88 : width}/>)}</g>
          <motion.g data-brand-rim-light aria-hidden="true" fill="none" strokeLinecap="round" filter={`url(#${ids.glow})`} variants={{ idle: { opacity: compact ? 0.78 : 0.86 }, hover: { opacity: 1, transition: { duration: 0.75, ease: premiumEase } } }}>
            {rimPaths.slice(0, compact ? 7 : rimPaths.length).map(([d, stroke, opacity, width], index) => <motion.path key={d} d={d} stroke={stroke === 'gradient' ? `url(#${ids.rim})` : stroke} strokeOpacity={opacity} strokeWidth={compact ? width * 0.84 : width} variants={index < 3 || index === 5 ? { idle: { pathLength: index === 1 ? 0.82 : 0.7 }, hover: { pathLength: 1 } } : undefined}/>) }
          </motion.g>
          {!compact && <motion.g data-brand-seams aria-hidden="true" fill="none" strokeLinecap="round" variants={{ idle: { opacity: 0.76 }, hover: { opacity: 1, transition: { duration: 0.8, ease: premiumEase } } }}>{seamPaths.map(([d, stroke, opacity, width], index) => <motion.path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={width} variants={index >= 2 && index <= 4 ? { idle: { pathLength: 0.6 }, hover: { pathLength: 1 } } : undefined}/>)}</motion.g>}
        </motion.g>
      </motion.svg>
    </motion.span>
  );
}
