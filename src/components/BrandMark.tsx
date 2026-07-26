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
const hoodPath = 'M48 8.6C41.1 10.4 36.1 16.8 32.8 25.3C30.4 31.6 29.4 36.8 26.4 41.2C23.9 44.7 20.8 47 17.8 48.7C26.1 46.1 34.9 45.9 41.8 48.3C44.8 49.4 47 51 48.3 53.2C49.8 50.8 52 49 55.2 47.9C62.1 45.4 70.1 45.7 78.4 48.1C75.1 45.8 72.1 43.2 69.7 39.5C67 35.3 66 30.4 63.5 24.6C59.9 16.3 54.8 10.2 48 8.6Z';
const voidPath = 'M48.3 20.8C40.3 20.9 34.7 26.5 31.9 34.3C29.7 40.4 31.2 45.4 35.8 49C39.2 51.7 43.4 53.2 47.9 53.4C52.9 53.2 57.1 51.5 60.4 48.5C64.6 44.6 65.3 39.3 63 33.4C60 25.7 55.3 20.7 48.3 20.8Z';

const atmosphereFills = [
  ['M20 88C12 65 18 43 34 27C42 19 43 9 48 4C54 10 57 20 65 28C80 43 86 65 78 89C68 68 57 56 48 53C38 57 29 69 20 88Z', '#64e4ff', 0.22],
  ['M0 94C6 70 17 51 34 39C21 60 15 78 14 96Z', '#36d8f5', 0.16],
  ['M96 94C90 70 79 51 62 39C75 60 81 78 82 96Z', '#168da9', 0.08],
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
  ['M2 94.9C6.7 72.7 17.3 55.7 34.5 46.9C39.7 44.2 44.2 46 46.4 50.1C34.1 62.5 25.1 78.4 20.2 95.7Z', '#0b2638'],
  ['M94 94.9C89.3 72.7 78.7 55.7 61.5 46.9C56.3 44.2 51.8 46 49.6 50.1C61.9 62.5 70.9 78.4 75.8 95.7Z', '#03111b'],
  ['M10.4 95.4C16.8 72.4 28.4 56 42.4 48.2C35.8 63.9 31.9 80.2 30.7 95.9Z', '#071c2b'],
  ['M85.6 95.4C79.2 72.4 67.6 56 53.6 48.2C60.2 63.9 64.1 80.2 65.3 95.9Z', '#01080e'],
  ['M24.8 95.7C29.5 75.1 37.4 59.2 45.9 50.1C41.7 66.4 39.4 81.7 39.3 96Z', '#041019'],
  ['M71.2 95.7C66.5 75.1 58.6 59.2 50.1 50.1C54.3 66.4 56.6 81.7 56.7 96Z', '#000307'],
  ['M39.3 96C41.3 76.4 44.4 61 48 51C51.6 61 54.7 76.4 56.7 96Z', '#000102'],
  ['M44.8 58C32.6 61.5 20.4 74.6 8.2 94.1C20.8 82.8 32.2 75.5 43.6 71.4Z', '#12354a', 0.3],
  ['M51.2 58C63.4 61.5 75.6 74.6 87.8 94.1C75.2 82.8 63.8 75.5 52.4 71.4Z', '#061722', 0.25],
  ['M41.6 66.5C31.7 72.1 22.8 81.4 15 95.1C25.2 85.1 34.3 78.7 42.6 75.1Z', '#071f30', 0.5],
  ['M54.4 66.5C64.3 72.1 73.2 81.4 81 95.1C70.8 85.1 61.7 78.7 53.4 75.1Z', '#020a11', 0.46],
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
      data-brand-vector-source="reference-derived-contours-v8-5"
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
          <linearGradient id={ids.base} x1="5" y1="43" x2="91" y2="96" gradientUnits="userSpaceOnUse"><stop stopColor="#17384f"/><stop offset=".18" stopColor="#0a2436"/><stop offset=".48" stopColor="#04111b"/><stop offset=".78" stopColor="#01060b"/><stop offset="1" stopColor="#000102"/></linearGradient>
          <linearGradient id={ids.hood} x1="27" y1="8" x2="70" y2="53" gradientUnits="userSpaceOnUse"><stop stopColor="#244b62"/><stop offset=".22" stopColor="#123148"/><stop offset=".56" stopColor="#061822"/><stop offset="1" stopColor="#010307"/></linearGradient>
          <linearGradient id={ids.hoodLeft} x1="27" y1="8" x2="49" y2="53" gradientUnits="userSpaceOnUse"><stop stopColor="#2d5b72"/><stop offset=".45" stopColor="#153a50"/><stop offset="1" stopColor="#05111a"/></linearGradient>
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
          <path d="M48 8.9C42.1 13.3 37.9 20 35 28.2C32.9 34.2 31 39.5 26.8 44.5C32.5 43.4 38.4 44.8 43.2 48C45.6 49.5 47.2 51.1 48.3 53.1C45.5 43.7 43 35.1 43.2 27.4C43.4 20.4 45 13.6 48 8.9Z" fill={`url(#${ids.hoodLeft})`} fillOpacity=".75"/>
          <path d="M48.1 9C54.3 13.4 58.7 20 61.5 28C63.7 34.1 65 39.4 69.4 44.1C63.8 43.5 58.4 45 53.7 48.2C51.4 49.8 49.7 51.4 48.3 53.1C51.1 43.8 53.2 35 52.9 27.4C52.7 20.6 51.2 13.8 48.1 9Z" fill="#041019" fillOpacity=".86"/>
          <path data-brand-face-void d={voidPath} fill="#000"/>
          <path d="M31.3 39.8C34.2 30.8 39.6 24.2 48 21.3C56.4 24.4 61.6 30.9 63.9 39.9C60.9 35.6 57.4 32.2 53.5 29.8C51.4 28.5 49.5 27.9 47.8 28C45.8 27.9 43.8 28.6 41.7 30C37.8 32.4 34.4 35.7 31.3 39.8Z" fill="#010409" fillOpacity=".78"/>

          <motion.g data-brand-collar variants={{ idle: { opacity: compact ? 0.82 : 1 }, hover: { opacity: compact ? 0.9 : 1, transition: { duration: 0.72, ease: premiumEase } } }}>
            <path d="M13.5 49.5C25.6 44.5 37.4 46.6 49.6 52.8C60.4 47.2 71 46.1 82.4 50.8C74.8 53.1 68 56.1 61.5 59.5C56 62.3 51.5 65.4 48 68.8C43.8 65.9 39.2 63.4 33.4 60.8C27.2 58 20.6 54.7 13.5 49.5Z" fill="#020a11"/>
            <motion.path d="M14.8 48.2C27.4 44.7 38.9 47.1 51 53.7C42 52.7 33.2 55.3 25.1 60.5C20.6 58.2 17.2 54.2 14.8 48.2Z" fill={`url(#${ids.cowl1})`} variants={{ idle: { x: 0 }, hover: { x: compact ? 0 : -0.1 } }}/>
            <motion.path d="M82 50.1C71.5 45.7 61.4 47.1 49.1 54.2C57.9 53.7 65.9 55.8 73 60.1C77.2 57.9 80.2 54.5 82 50.1Z" fill={`url(#${ids.cowl2})`} variants={{ idle: { x: 0 }, hover: { x: compact ? 0 : 0.08 } }}/>
            <path d="M21.8 55.2C31 51.9 40.2 53.1 48.8 57.6C56.8 53.5 65.2 52.8 74.2 56.1C65.5 57.5 56.9 61.2 48 67C39.6 61.6 30.8 57.9 21.8 55.2Z" fill="#01060b"/>
            <path d="M31.6 59.5C37.7 56.8 43.3 57.1 48.2 59.8C53 57.2 58.3 57.2 64.1 60.2C58.4 61.4 53.1 64 48 68.1C42.8 64.3 37.4 61.5 31.6 59.5Z" fill="#000204"/>
            {!compact && <path d="M18 50.1C29.6 47.3 39.8 49.5 49.4 54.4" fill="none" stroke="#7bd7e9" strokeOpacity=".11" strokeWidth=".46" strokeLinecap="round"/>}
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
