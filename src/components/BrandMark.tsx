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

// The mantle is intentionally independent from the hood. This avoids the old
// single-shell “raincoat” silhouette and lets the shoulders carry real weight.
const cloakPath = 'M48 41.8C39.6 41.4 31.2 43 23.8 47C14.6 52 8 63.3 3.4 79.2C1.9 84.5 1.5 90.1 2.3 94.2C14.3 94.9 25.3 95.2 35.7 95.5C40.2 95.7 44.3 95.8 48 96C51.8 95.8 55.8 95.7 60.3 95.5C70.7 95.2 81.7 94.9 93.7 94.2C94.5 90.1 94.1 84.5 92.6 79.2C88 63.3 81.4 52 72.2 47C64.8 43 56.4 41.4 48 41.8Z';
const hoodPath = 'M47.8 4.5C43.2 5.3 39.6 9.3 37 15.7C34.6 21.9 33.3 29.1 32.8 35.4C32.5 38.6 30 41.9 25.7 44.9C31.7 43.7 37.4 43.9 42.2 45.8C44.7 46.8 46.5 48.4 47.9 50.5C49.4 48.3 51.4 46.7 54.1 45.7C58.6 44 64 43.7 70 44.9C65.7 41.9 63.2 38.6 62.9 35.4C62.4 29.1 61.1 21.9 58.7 15.7C56.1 9.3 52.4 5.3 47.8 4.5Z';
const voidPath = 'M49 19.5C44.3 18.6 40.6 21.5 38 27C35.7 31.7 34.7 35.8 33 39.2C31.6 42.1 32.8 45.3 36.3 48.3C40.1 51.5 44.2 53.2 48 55.1C51.8 53.2 55.9 51.5 59.7 48.3C63.2 45.3 64.4 42.1 63 39.2C61.3 35.8 60.3 31.7 58 27C55.5 21.9 52.7 19.6 49 19.5Z';

const atmosphereFills = [
  ['M25 75C19 55 26 34 39 20C44 15 46 9 48 5C50 10 53 16 57 21C70 35 77 55 71 75C63 62 56 56 48 53C40 56 33 62 25 75Z', '#72e6ff', 0.22],
  ['M1 94C8 69 20 52 35 43C25 61 18 78 15 96Z', '#29cff3', 0.14],
  ['M95 94C88 69 76 52 61 43C71 61 78 78 81 96Z', '#188da9', 0.085],
] as const;
const atmosphereStrokes = [
  ['M11 89C6 67 13 44 29 26', '#4ad5f3', 0.21, 2.4],
  ['M85 89C90 67 83 44 67 26', '#1f97b5', 0.12, 1.8],
  ['M2 93C12 72 24 57 39 49', '#64dcf4', 0.15, 2.1],
  ['M94 93C84 72 72 57 57 49', '#177b95', 0.08, 1.6],
] as const;
const energyPaths = [
  ['M12 82C8 64 14 45 28 30', '#43cfe9', 0.24, 0.6],
  ['M84 82C88 64 82 45 68 30', '#218da8', 0.15, 0.52],
  ['M20 58C15 46 19 33 30 24', '#70dff4', 0.16, 0.5],
  ['M76 58C81 46 77 33 66 24', '#248da5', 0.1, 0.44],
] as const;
const foldPaths = [
  ['M2.7 92.4C7.7 73.4 18.2 57.6 34.9 48.6C40 45.8 44.3 47.2 46.7 50.5C36 61.2 27.5 76.3 22.7 94.9Z', '#12344c'],
  ['M93.3 92.5C88.2 73.5 78.2 58 62.1 48.8C57.1 46 52.9 47.3 49.6 50.6C60.1 61.1 68.3 76.4 73.3 94.9Z', '#051724'],
  ['M12.7 94C17.9 73.4 28.1 58.1 41.8 50.5C36.1 64.1 32 79 30.4 95.4Z', '#0a2437'],
  ['M83.3 94C78.2 73.4 67.9 58.1 54.2 50.5C59.9 64.1 64 79 65.6 95.4Z', '#020912'],
  ['M29.7 95.4C33 75.6 39.1 60.5 46 51.2C42.8 65.1 40.6 80.2 40.4 95.7Z', '#06131f'],
  ['M66.3 95.4C63 75.6 56.9 60.5 50 51.2C53.2 65.1 55.4 80.2 55.6 95.7Z', '#01050a'],
  ['M40.4 95.7C41.8 76.8 44.5 61.9 48 51.8C51.5 61.9 54.2 76.8 55.6 95.7Z', '#000205'],
] as const;
const hoodSeams = [
  ['M33.8 35.3C35.1 27.1 39.7 20 47.8 15.8', '#8ee3f5', 0.2, 0.64],
  ['M61.8 35.2C60.5 27.1 55.9 20 47.8 15.8', '#2ca0b9', 0.09, 0.54],
  ['M35.4 28.9C38.1 22 42.3 16.8 47.8 13.7', '#b5effa', 0.16, 0.56],
  ['M60.2 28.9C57.5 22 53.3 16.8 47.8 13.7', '#2b94aa', 0.07, 0.48],
  ['M37.8 21.6C40.5 16.8 44 13.3 47.8 11', '#e2fcff', 0.12, 0.46],
] as const;
const rimPaths = [
  ['M26.2 44C30.9 40.8 32.6 37.8 33 34', '#9cefff', 0.7, 1.06],
  ['M33 34C33.8 24 38.2 10.5 47.8 4.9', 'gradient', 1, 1.38],
  ['M47.8 4.9C53 7.4 56.6 12.4 59 18.8', '#55cde7', 0.34, 0.74],
  ['M62.6 34C63 37.8 64.8 40.8 69.4 44', '#42b8d4', 0.22, 0.62],
  ['M16.2 50C11 57.6 6.8 68.1 4.1 81.3', '#95e8f8', 0.3, 0.74],
  ['M79.8 50.2C85 57.8 89.2 68.3 91.9 81.5', '#248ca6', 0.09, 0.5],
  ['M3.8 86.2C3.6 88 3.5 89.4 3.4 90.4', '#52c2da', 0.18, 0.62],
] as const;
const seamPaths = [
  ['M17.7 56.4C25.9 51.9 34 50.2 41.4 51', '#9ae8f6', 0.13, 0.56],
  ['M78.1 56.4C70 51.9 62 50.2 54.6 51', '#2a849a', 0.055, 0.46],
  ['M9.5 88.6C17 70.6 27.8 58.1 41.5 51.8', '#60c3d7', 0.11, 0.54],
  ['M86.3 88.7C78.9 70.7 68.1 58.1 54.5 51.8', '#196879', 0.045, 0.44],
  ['M23.7 94C28.6 74.6 36.1 60.3 44.7 52.2', '#66cadf', 0.09, 0.48],
  ['M72.1 94C67.2 74.6 59.8 60.3 51.3 52.2', '#176276', 0.04, 0.4],
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
          <radialGradient id={ids.void} cx="0" cy="0" r="1" gradientTransform="translate(48 37) rotate(90) scale(18 19)" gradientUnits="userSpaceOnUse"><stop stopColor="#000"/><stop offset=".9" stopColor="#000103"/><stop offset="1" stopColor="#02050a"/></radialGradient>
          <filter id={ids.blur} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation={compact ? 3.3 : 4}/></filter>
          <filter id={ids.glow} x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation={compact ? 0.68 : 0.8} result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>

        <motion.g data-brand-atmosphere aria-hidden="true" filter={`url(#${ids.blur})`} variants={{ idle: { opacity: compact ? 0.44 : 0.68, scale: compact ? 0.99 : 0.975 }, hover: { opacity: compact ? 0.68 : 0.92, scale: compact ? 1.018 : 1.045, transition: { duration: 0.92, ease: premiumEase } } }} style={{ transformOrigin: '48px 48px' }}>
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
            {!compact && <><path d="M5.9 87.9C16.5 69.1 28.5 57 41.9 51.4C30.8 62.6 21.8 76.9 16.6 93.1Z" fill="#1a4157" fillOpacity=".24"/><path d="M90.1 88C79.5 69.2 67.5 57 54.1 51.4C65.2 62.6 74.2 77 79.4 93.1Z" fill="#0b2433" fillOpacity=".16"/></>}
            {!compact && <><path d="M46.8 58.1C35.5 58.7 22.8 69.2 7.4 91.2C20.7 77.7 33.4 69.8 45.3 67.1Z" fill="#123149" fillOpacity=".38"/><path d="M49.2 58.1C60.6 58.8 73.3 69.2 88.7 91.2C75.3 77.8 62.7 69.9 50.7 67.1Z" fill="#071a28" fillOpacity=".3"/></>}
          </motion.g>
          <motion.path data-brand-hood d={hoodPath} fill={`url(#${ids.hood})`} stroke="#285069" strokeOpacity=".8" strokeWidth={compact ? 0.78 : 0.86} variants={{ idle: { y: 0 }, hover: { y: compact ? -0.05 : -0.14 } }}/>
          <path data-brand-face-void d={voidPath} fill={`url(#${ids.void})`}/>
          <path d="M31.6 40.8C34.7 31.9 40 24.8 48.3 21.3C56.2 24.8 61.7 31.8 64.3 41C61.3 37.2 57.9 34 54.1 31.5C51.9 30 49.9 29.3 48 29.4C45.9 29.3 43.8 30.1 41.5 31.6C37.8 34.1 34.5 37.2 31.6 40.8Z" fill="#02060b" fillOpacity=".7"/>

          <motion.g data-brand-collar variants={{ idle: { opacity: compact ? 0.97 : 1 }, hover: { opacity: 1, transition: { duration: 0.72, ease: premiumEase } } }}>
            <path d="M14.2 51.2C25.3 45.6 36 45.4 48.1 52.7C59.1 45.8 70.1 46.2 81.8 52C71.4 51.4 61.1 54.4 48 62.4C36.2 54.9 25.3 51.8 14.2 51.2Z" fill="#06131f"/>
            <motion.path d="M15.8 48.9C28.2 44.3 39.1 46 50.1 53.3C42.2 52.9 35 55.1 28.3 59.8C22.9 56.6 18.8 53 15.8 48.9Z" fill={`url(#${ids.cowlL})`} variants={{ idle: { x: 0 }, hover: { x: compact ? 0 : -0.12 } }}/>
            <motion.path d="M80.3 50C69.9 45.4 59.7 45.7 46.7 53.1C54.6 53.3 61.6 55.5 68.1 59.9C73.1 57.6 77.2 54.3 80.3 50Z" fill={`url(#${ids.cowlR})`} variants={{ idle: { x: 0 }, hover: { x: compact ? 0 : 0.1 } }}/>
            <path d="M22.6 54C32 50.1 40.2 50.6 48.2 54.1C55.5 50.9 63.2 51.2 71.7 54.8C63.4 55 55.6 57.2 48 61.8C40.8 57.5 32.3 55.2 22.6 54Z" fill="#02070d"/>
            <path d="M20.5 51.4C29.3 48.8 37.9 49.6 48.1 53C40.9 53.2 34.5 55.1 28.5 58.2C25 56.9 22.3 54.6 20.5 51.4Z" fill="#1b3a4f" fillOpacity=".5"/>
            <path d="M75.5 52.4C67 49.4 59 49.7 48.1 53C55.2 53.5 61.1 55.3 66.5 58.2C69.9 57.3 73 55.4 75.5 52.4Z" fill="#071722" fillOpacity=".78"/>
            <path d="M34 57.5C39.4 55.7 44.1 55.9 48.2 57.1C52 55.9 56.5 56 61.7 57.7C56.3 58.5 51.7 60.2 48 62.8C44.1 60.2 39.4 58.5 34 57.5Z" fill="#000205"/>
          </motion.g>

          <g data-brand-texture aria-hidden="true" fill="none" strokeLinecap="round">{hoodSeams.slice(0, compact ? 2 : hoodSeams.length).map(([d, stroke, opacity, width]) => <path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={compact ? width * 0.88 : width}/>)}</g>
          <motion.g data-brand-rim-light aria-hidden="true" fill="none" strokeLinecap="round" filter={`url(#${ids.glow})`} variants={{ idle: { opacity: compact ? 0.78 : 0.86 }, hover: { opacity: 1, transition: { duration: 0.75, ease: premiumEase } } }}>
            {rimPaths.slice(0, compact ? 7 : rimPaths.length).map(([d, stroke, opacity, width], index) => <motion.path key={d} d={d} stroke={stroke === 'gradient' ? `url(#${ids.rim})` : stroke} strokeOpacity={opacity} strokeWidth={compact ? width * 0.84 : width} variants={index < 3 || index === 4 ? { idle: { pathLength: index === 1 ? 0.82 : 0.7 }, hover: { pathLength: 1 } } : undefined}/>) }
          </motion.g>
          {!compact && <motion.g data-brand-seams aria-hidden="true" fill="none" strokeLinecap="round" variants={{ idle: { opacity: 0.76 }, hover: { opacity: 1, transition: { duration: 0.8, ease: premiumEase } } }}>{seamPaths.map(([d, stroke, opacity, width], index) => <motion.path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={width} variants={index >= 2 && index <= 4 ? { idle: { pathLength: 0.6 }, hover: { pathLength: 1 } } : undefined}/>)}</motion.g>}
        </motion.g>
      </motion.svg>
    </motion.span>
  );
}
