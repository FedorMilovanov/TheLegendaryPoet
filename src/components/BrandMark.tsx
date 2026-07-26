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

const cloakPath = 'M48 41.2C37.2 40.8 26.1 42.9 16.7 49.1C8.9 54.4 4.5 67.1 1.7 81.3C.7 86.6.9 91.8 2.1 95.2C16.6 95.6 31.9 95.8 48 96C64.2 95.8 79.5 95.6 94 95.2C95.2 91.8 95.4 86.6 94.3 81.3C91.5 67.1 87.1 54.4 79.3 49.1C69.9 42.9 58.8 40.8 48 41.2Z';
const hoodPath = 'M48 7.5C42 9.5 37.7 16.5 35.1 25.5C33.5 31.1 33.3 36.5 30.4 41C28.7 43.6 26.1 45.8 23.4 47.3C29.2 46 35.6 46.2 41 48.2C44 49.3 46.4 51 48 53C49.7 50.8 52.2 49.2 55.2 48.2C60.7 46.4 67 46.2 72.8 47.5C70 45.8 67.5 43.6 65.7 40.8C62.9 36.5 62.6 31.3 60.9 25.5C58.2 16.5 54 9.5 48 7.5Z';
const voidPath = 'M48.2 20.7C42.6 20.9 38.4 25.2 35.7 31.9C33.6 37.2 34.2 42.3 37.4 46C40.3 49.4 44 51.4 48 52.6C52 51.2 55.8 49.2 58.6 45.8C61.8 42.1 62.4 37.1 60.3 31.8C57.7 25.2 53.7 20.6 48.2 20.7Z';

const atmosphereFills = [
  ['M20 88C12 65 18 43 34 27C42 19 43 9 48 4C54 10 57 20 65 28C80 43 86 65 78 89C68 68 57 56 48 53C38 57 29 69 20 88Z', '#64e4ff', 0.16],
  ['M0 94C6 70 17 51 34 39C21 60 15 78 14 96Z', '#36d8f5', 0.11],
  ['M96 94C90 70 79 51 62 39C75 60 81 78 82 96Z', '#168da9', 0.055],
] as const;

const atmosphereStrokes = [
  ['M15 78C9 61 12 43 25 30', '#7ee9fc', 0.25, 2.5],
  ['M81 77C87 60 84 43 71 30', '#299fbc', 0.12, 1.8],
  ['M25 30C30 17 39 8 48 4', '#a5f1ff', 0.28, 2.3],
  ['M71 31C66 17 57 8 48 4', '#2fa8c5', 0.13, 1.7],
] as const;

const energyPaths = [
  ['M8 91C5 73 11 55 25 40', '#5edcf4', 0.23, 0.52],
  ['M88 90C91 72 85 54 71 40', '#278da7', 0.11, 0.44],
  ['M11 50C7 42 9 33 18 27', '#7ce7fb', 0.17, 0.44],
  ['M85 49C89 41 87 32 79 26', '#277f96', 0.08, 0.38],
  ['M18 70C11 62 11 52 17 45', '#8beafc', 0.14, 0.4],
  ['M78 70C85 62 85 52 79 45', '#247f96', 0.07, 0.34],
] as const;

const foldPaths = [
  ['M2 94.9C6.7 72.7 17.3 55.7 34.5 46.9C39.7 44.2 44.2 46 46.4 50.1C34.1 62.5 25.1 78.4 20.2 95.7Z', '#071a28'],
  ['M94 94.9C89.3 72.7 78.7 55.7 61.5 46.9C56.3 44.2 51.8 46 49.6 50.1C61.9 62.5 70.9 78.4 75.8 95.7Z', '#020c14'],
  ['M10.4 95.4C16.8 72.4 28.4 56 42.4 48.2C35.8 63.9 31.9 80.2 30.7 95.9Z', '#04131f'],
  ['M85.6 95.4C79.2 72.4 67.6 56 53.6 48.2C60.2 63.9 64.1 80.2 65.3 95.9Z', '#01060a'],
  ['M24.8 95.7C29.5 75.1 37.4 59.2 45.9 50.1C41.7 66.4 39.4 81.7 39.3 96Z', '#020b12'],
  ['M71.2 95.7C66.5 75.1 58.6 59.2 50.1 50.1C54.3 66.4 56.6 81.7 56.7 96Z', '#000205'],
  ['M39.3 96C41.3 76.4 44.4 61 48 51C51.6 61 54.7 76.4 56.7 96Z', '#000102'],
  ['M44.8 58C32.6 61.5 20.4 74.6 8.2 94.1C20.8 82.8 32.2 75.5 43.6 71.4Z', '#0d2a3b', 0.18],
  ['M51.2 58C63.4 61.5 75.6 74.6 87.8 94.1C75.2 82.8 63.8 75.5 52.4 71.4Z', '#04131d', 0.16],
  ['M41.6 66.5C31.7 72.1 22.8 81.4 15 95.1C25.2 85.1 34.3 78.7 42.6 75.1Z', '#051824', 0.28],
  ['M54.4 66.5C64.3 72.1 73.2 81.4 81 95.1C70.8 85.1 61.7 78.7 53.4 75.1Z', '#01070c', 0.25],
] as const;

const hoodSeams = [
  ['M29.1 40.3C31.6 30.1 37.4 18.1 47.8 9.3', '#d7fbff', 0.17, 0.58],
  ['M66.9 39.4C64.4 29.7 58.6 18.2 48.2 9.3', '#39a6bd', 0.07, 0.48],
  ['M32.7 34.2C35.7 25.4 40.8 17.7 47.8 12.2', '#b8f1fb', 0.15, 0.5],
  ['M63.3 33.8C60.4 25.2 55.3 17.7 48.2 12.2', '#2b879c', 0.055, 0.42],
  ['M36.2 27.7C39.1 20.9 42.9 16.1 47.9 13.2', '#e7fdff', 0.11, 0.42],
] as const;

const rimPaths = [
  ['M19.2 47.7C23.8 45.1 27 42.1 28.7 38.2', '#b5f4ff', 0.7, 0.98],
  ['M29.1 36.2C31.7 26.3 37.8 13 47.8 8.9', 'gradient', 1, 1.35],
  ['M48.2 9C55.1 11.7 60.1 18.6 63.6 27.5', '#75e2f5', 0.38, 0.68],
  ['M65.5 31.1C66.4 36.6 69.2 41 74.2 44.8', '#43b7d0', 0.2, 0.56],
  ['M13.8 51.8C8.9 60.2 5.2 71.4 2.8 84.2', '#a7effb', 0.33, 0.74],
  ['M2.4 88.1C2.1 90.5 2.1 92.5 2.3 94', '#55c7df', 0.18, 0.55],
  ['M82.2 52C87.1 60.4 90.8 71.5 93.2 84.2', '#278da6', 0.09, 0.48],
] as const;

const seamPaths = [
  ['M9.2 91.7C16.8 70.8 27.9 56.5 42.2 50.5', '#65c8dc', 0.085, 0.46],
  ['M86.8 91.7C79.2 70.8 68.1 56.5 53.8 50.5', '#1e6c7d', 0.032, 0.36],
  ['M23 95C27.8 75.3 35.8 60.1 45 51.6', '#6ccfe2', 0.07, 0.4],
  ['M73 95C68.2 75.3 60.2 60.1 51 51.6', '#1b6576', 0.028, 0.32],
  ['M13 92C19 72 29 57 42 50', '#4da8be', 0.09, 0.34],
  ['M19 95C24 75 33 59 44.5 50.8', '#6ac9dc', 0.075, 0.32],
  ['M31 95C34 76 40 59.5 46.5 51.4', '#4fa4b8', 0.055, 0.28],
  ['M83 92C77 72 67 57 54 50', '#176176', 0.026, 0.3],
  ['M77 95C72 75 63 59 51.5 50.8', '#155568', 0.022, 0.26],
] as const;

export default function BrandMark({ size = 'sm', className }: BrandMarkProps) {
  const reducedMotion = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const compact = size === 'sm';
  const ids = {
    title: `${id}-brand-title`, description: `${id}-brand-description`, base: `${id}-base`, hood: `${id}-hood`,
    hoodLeft: `${id}-hood-left`, cowl1: `${id}-cowl-1`, cowl2: `${id}-cowl-2`, rim: `${id}-rim`, blur: `${id}-blur`, glow: `${id}-glow`,
  };

  return (
    <motion.span
      data-brand-mark
      data-brand-version={BRAND_VERSION}
      data-brand-renderer="inline-vector"
      data-brand-vector-source="reference-derived-contours-v8-7"
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
        aria-labelledby={`${ids.title} ${ids.description}`}
        focusable="false"
        style={{ pointerEvents: 'none' }}
        variants={{
          idle: { y: 0, scale: 1, filter: compact ? 'drop-shadow(0 3px 5px rgba(0,4,13,.76)) drop-shadow(0 0 5px rgba(46,216,255,.14))' : 'drop-shadow(0 5px 11px rgba(0,4,13,.78)) drop-shadow(0 0 8px rgba(46,216,255,.15))' },
          hover: { y: compact ? -0.55 : -0.85, scale: compact ? 1.02 : 1.027, filter: compact ? 'drop-shadow(0 5px 9px rgba(0,7,18,.82)) drop-shadow(0 0 8px rgba(65,220,255,.26))' : 'drop-shadow(0 8px 17px rgba(0,7,18,.84)) drop-shadow(0 0 14px rgba(65,220,255,.27))', transition: { duration: 0.78, ease: premiumEase } },
        }}
      >
        <title id={ids.title}>THE LEGENDARY POET</title>
        <desc id={ids.description}>Мистическая безликая фигура в глубоком капюшоне и тяжёлой почти чёрной мантии, окружённая разорванной холодной энергией</desc>
        <defs>
          <linearGradient id={ids.base} x1="5" y1="43" x2="91" y2="96" gradientUnits="userSpaceOnUse"><stop stopColor="#0d2637"/><stop offset=".18" stopColor="#071a28"/><stop offset=".48" stopColor="#031019"/><stop offset=".78" stopColor="#01050a"/><stop offset="1" stopColor="#000102"/></linearGradient>
          <linearGradient id={ids.hood} x1="27" y1="8" x2="70" y2="53" gradientUnits="userSpaceOnUse"><stop stopColor="#17384b"/><stop offset=".22" stopColor="#0b2738"/><stop offset=".56" stopColor="#04131e"/><stop offset="1" stopColor="#010307"/></linearGradient>
          <linearGradient id={ids.hoodLeft} x1="30" y1="8" x2="49" y2="53" gradientUnits="userSpaceOnUse"><stop stopColor="#123044"/><stop offset=".45" stopColor="#092332"/><stop offset="1" stopColor="#031019"/></linearGradient>
          <linearGradient id={ids.cowl1} x1="14" y1="46" x2="79" y2="63" gradientUnits="userSpaceOnUse"><stop stopColor="#24485d"/><stop offset=".35" stopColor="#123146"/><stop offset=".7" stopColor="#061823"/><stop offset="1" stopColor="#010409"/></linearGradient>
          <linearGradient id={ids.cowl2} x1="82" y1="47" x2="25" y2="64" gradientUnits="userSpaceOnUse"><stop stopColor="#153347"/><stop offset=".42" stopColor="#0a2433"/><stop offset=".78" stopColor="#031019"/><stop offset="1" stopColor="#000205"/></linearGradient>
          <linearGradient id={ids.rim} x1="24" y1="8" x2="76" y2="74" gradientUnits="userSpaceOnUse"><stop stopColor="#f7ffff"/><stop offset=".11" stopColor="#d5fbff"/><stop offset=".32" stopColor="#7ceaff"/><stop offset=".62" stopColor="#2fc4e8" stopOpacity=".68"/><stop offset="1" stopColor="#0b7696" stopOpacity="0"/></linearGradient>
          <filter id={ids.blur} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation={compact ? 3.4 : 4.1}/></filter>
          <filter id={ids.glow} x="-130%" y="-130%" width="360%" height="360%"><feGaussianBlur stdDeviation={compact ? 0.64 : 0.72} result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>

        <motion.g data-brand-atmosphere aria-hidden="true" filter={`url(#${ids.blur})`} variants={{ idle: { opacity: compact ? 0.56 : 0.76, scale: compact ? 0.99 : 0.975 }, hover: { opacity: compact ? 0.78 : 0.96, scale: compact ? 1.02 : 1.045, transition: { duration: 0.92, ease: premiumEase } } }} style={{ transformOrigin: '48px 48px' }}>
          {atmosphereFills.map(([d, fill, opacity]) => <path key={d} d={d} fill={fill} fillOpacity={opacity}/>) }
          <g fill="none" strokeLinecap="round">{atmosphereStrokes.map(([d, stroke, opacity, width]) => <path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={width}/>)}</g>
        </motion.g>
        <motion.g data-brand-energy aria-hidden="true" fill="none" strokeLinecap="round" variants={{ idle: { opacity: compact ? 0.3 : 0.4 }, hover: { opacity: compact ? 0.52 : 0.66, transition: { duration: 0.8, ease: premiumEase } } }}>
          {energyPaths.map(([d, stroke, opacity, width]) => <path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={compact ? width * 0.86 : width}/>) }
        </motion.g>

        <motion.g data-brand-figure variants={{ idle: { y: 0 }, hover: { y: compact ? -0.1 : -0.28, transition: { duration: 0.74, ease: premiumEase } } }}>
          <path data-brand-cloak d={cloakPath} fill={`url(#${ids.base})`} stroke="#15384d" strokeOpacity=".64" strokeWidth={compact ? 0.7 : 0.76}/>
          <motion.g data-brand-folds variants={{ idle: { opacity: compact ? 0.95 : 1, scale: 1 }, hover: { opacity: 1, scale: compact ? 1.002 : 1.006, transition: { duration: 0.8, ease: premiumEase } } }} style={{ transformOrigin: '48px 72px' }}>
            {foldPaths.map(([d, fill, opacity = 1], index) => <motion.path key={d} d={d} fill={fill} fillOpacity={opacity} variants={index < 2 ? { idle: { x: 0 }, hover: { x: compact ? 0 : index === 0 ? -0.16 : 0.14 } } : undefined}/>) }
          </motion.g>

          <motion.path data-brand-hood d={hoodPath} fill={`url(#${ids.hood})`} stroke="#28546a" strokeOpacity=".8" strokeWidth={compact ? 0.78 : 0.86} variants={{ idle: { y: 0 }, hover: { y: compact ? -0.05 : -0.14 } }}/>
          <path d="M48 7.9C43.1 12.6 39.6 19.4 37.2 27.6C35.5 33.6 34.2 38.7 30.7 43.6C35.3 42.8 40 44.2 43.6 47.4C45.6 49.1 47 51 48 52.9C45.9 43.2 44 34.5 44.1 26.7C44.2 19.8 45.6 12.6 48 7.9Z" fill={`url(#${ids.hoodLeft})`} fillOpacity=".58"/>
          <path d="M48.1 8C53 12.6 56.6 19.3 58.9 27.4C60.7 33.5 61.9 38.7 65.5 43.5C60.9 42.9 56.4 44.3 52.6 47.6C50.6 49.3 49.1 51.1 48 53C50.2 43.3 52 34.4 51.8 26.7C51.7 19.9 50.4 12.8 48.1 8Z" fill="#041019" fillOpacity=".86"/>
          <path data-brand-face-void d={voidPath} fill="#000"/>
          <path d="M35.2 38.8C37.4 30.5 41.8 24.6 48 21.2C54.2 24.6 58.5 30.4 60.7 38.8C58.2 35.2 55.3 32.3 52.2 30.3C50.5 29.2 49 28.7 47.8 28.8C46.2 28.7 44.7 29.3 43 30.4C39.9 32.4 37.3 35.2 35.2 38.8Z" fill="#010409" fillOpacity=".78"/>

          <motion.g data-brand-collar variants={{ idle: { opacity: compact ? 0.36 : 0.43 }, hover: { opacity: compact ? 0.48 : 0.56, transition: { duration: 0.72, ease: premiumEase } } }}>
            <path d="M15.2 49.2C26 45.6 36.6 46.8 46.4 51.1C55.3 55 66.9 55.5 80.9 50.6C75.3 57.5 67.1 61.1 57.1 61.5C47.4 61.9 38.6 58.5 30.1 56C23.5 54.1 18.5 51.9 15.2 49.2Z" fill="#02090f"/>
            <motion.path d="M16.5 48.3C27 45.5 37.1 47.1 46.8 51.7C55.4 55.8 64.5 57 76.7 54C71.2 58.2 63.7 59.8 55.6 58.8C45.8 57.7 37.6 53.8 28.6 52.5C23.5 51.8 19.6 50.4 16.5 48.3Z" fill="#06131d" variants={{ idle: { x: 0 }, hover: { x: compact ? 0 : -0.08 } }}/>
            <motion.path d="M80.5 50.4C70.3 47.8 61.5 48.8 51.7 53.7C43.6 57.7 36 59.3 27.9 57.2C33.1 61.5 40.9 63.2 49.7 60.9C58.8 58.5 66 56.7 73.8 56.9C77 55.2 79.2 53 80.5 50.4Z" fill="#020a11" variants={{ idle: { x: 0 }, hover: { x: compact ? 0 : 0.06 } }}/>
            <path d="M21.5 54.6C31.2 52.3 40.3 53.5 48.6 57.1C56.1 60.4 64.2 60.6 73.4 57.8C67.2 62.6 58.8 64.8 49.1 64C39.7 63.2 30.6 59.5 21.5 54.6Z" fill="#01060b"/>
            <path d="M31.1 59.3C38.8 57.2 45.4 58.3 51.3 61.1C56.1 63.4 61.1 63.8 66.5 62.6C62.1 66.3 56 67.7 48.8 67C42.1 66.3 36.1 63.5 31.1 59.3Z" fill="#000204"/>
            {!compact && <path d="M18.4 49.9C29.1 47.3 39 49 48.3 53.2C56.8 57 65.2 57.7 74.1 55.8" fill="none" stroke="#75d4e7" strokeOpacity=".035" strokeWidth=".42" strokeLinecap="round"/>}
          </motion.g>

          <g data-brand-texture aria-hidden="true" fill="none" strokeLinecap="round">{hoodSeams.slice(0, compact ? 3 : hoodSeams.length).map(([d, stroke, opacity, width]) => <path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={compact ? width * 0.88 : width}/>)}</g>
          <motion.g data-brand-rim-light aria-hidden="true" fill="none" strokeLinecap="round" filter={`url(#${ids.glow})`} variants={{ idle: { opacity: compact ? 0.82 : 0.9 }, hover: { opacity: 1, transition: { duration: 0.75, ease: premiumEase } } }}>
            {rimPaths.slice(0, compact ? 6 : rimPaths.length).map(([d, stroke, opacity, width], index) => <motion.path key={d} d={d} stroke={stroke === 'gradient' ? `url(#${ids.rim})` : stroke} strokeOpacity={opacity} strokeWidth={compact ? width * 0.84 : width} variants={index < 3 || index === 4 ? { idle: { pathLength: index === 1 ? 0.82 : 0.7 }, hover: { pathLength: 1 } } : undefined}/>) }
          </motion.g>
          {!compact && <motion.g data-brand-seams aria-hidden="true" fill="none" strokeLinecap="round" variants={{ idle: { opacity: 0.72 }, hover: { opacity: 0.94, transition: { duration: 0.8, ease: premiumEase } } }}>{seamPaths.map(([d, stroke, opacity, width], index) => <motion.path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={width} variants={index >= 2 ? { idle: { pathLength: 0.6 }, hover: { pathLength: 1 } } : undefined}/>)}</motion.g>}
        </motion.g>
      </motion.svg>
    </motion.span>
  );
}
