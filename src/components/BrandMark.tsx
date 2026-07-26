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

const cloakPath = 'M48 42C38.5 41.3 28.6 43.2 19.7 49C11.7 54.5 6.4 67.6 3 81.8C1.9 86.5 1.8 91.2 2.7 94.8C16.6 95.4 31.5 95.6 48 96C64.5 95.6 79.4 95.4 93.3 94.8C94.2 91.2 94.1 86.5 93 81.8C89.6 67.6 84.3 54.5 76.3 49C67.4 43.2 57.5 41.3 48 42Z';
const hoodPath = 'M47.5 7C41.5 8.7 37.2 15.7 34.3 25.3C32.7 30.7 32.4 35.3 29.5 39.8C27.4 43 24.6 45.3 21.5 47.2C28.8 45.4 35.3 45.2 41 47.3C44 48.4 46.2 50 48 52.4C49.8 50 52 48.4 55 47.3C60.7 45.2 67.2 45.4 74.5 47.2C71.4 45.3 68.6 43 66.5 39.8C63.6 35.3 63.3 30.7 61.7 25.3C58.8 15.7 53.5 8.7 47.5 7Z';
const voidPath = 'M48 18.7C40.4 19.9 35.2 26.1 32.2 35C30.8 39 32 42.9 35.7 46.3C39.5 49.8 44 51.9 48 55.2C52 51.9 56.5 49.8 60.3 46.3C64 42.9 65.2 39 63.8 35C60.8 26.1 55.6 19.9 48 18.7Z';

const atmosphereFills = [
  ['M23 76C17 57 24 37 38 22C43 16 45 10 48 6C51 11 54 17 59 23C73 38 80 57 74 77C66 62 57 55 48 52C39 55 31 62 23 76Z', '#77e7ff', 0.28],
  ['M4 94C7 73 17 55 32 44C22 60 17 76 16 92Z', '#33d5f3', 0.17],
  ['M92 94C89 73 79 55 64 44C74 60 79 76 80 92Z', '#158dab', 0.095],
] as const;
const atmosphereStrokes = [
  ['M12 84C8 67 13 49 25 35', '#58ddf7', 0.24, 3],
  ['M84 82C88 66 83 49 72 36', '#1d9ab8', 0.14, 2.2],
  ['M28 29C32 17 39 9 48 5', '#8aeaff', 0.25, 2.6],
  ['M68 30C64 17 57 9 48 5', '#2aa7c5', 0.13, 2],
] as const;
const energyPaths = [
  ['M8 88C7 70 14 53 27 41', '#52d3ef', 0.22, 0.55],
  ['M88 87C89 70 82 53 69 41', '#258ca6', 0.12, 0.48],
  ['M16 41C12 34 14 28 21 23', '#74e1f7', 0.18, 0.48],
  ['M80 40C84 33 82 27 76 22', '#217f97', 0.09, 0.42],
  ['M19 63C13 57 12 50 17 44', '#83e7fa', 0.14, 0.44],
  ['M77 63C83 57 84 50 79 44', '#247f95', 0.07, 0.38],
] as const;
const foldPaths = [
  ['M2.8 93.6C7.5 73 17.7 56.6 34.9 47.8C39.9 45.3 44.1 47.1 46.5 50.5C35.5 61.6 26.4 77 21.2 95.2Z', '#0a263a'],
  ['M93.2 93.6C88.5 73 78.3 56.6 61.1 47.8C56.1 45.3 51.9 47.1 49.5 50.5C60.5 61.6 69.6 77 74.8 95.2Z', '#03111c'],
  ['M12.5 95C18 73.5 28.5 57.5 42 49.8C36.2 64.2 31.9 79.7 30 95.5Z', '#061925'],
  ['M83.5 95C78 73.5 67.5 57.5 54 49.8C59.8 64.2 64.1 79.7 66 95.5Z', '#01070c'],
  ['M30 95.5C33.5 75.7 39.5 60.5 46.2 51.2C43 65 40.8 80.2 40.5 95.8Z', '#030b12'],
  ['M66 95.5C62.5 75.7 56.5 60.5 49.8 51.2C53 65 55.2 80.2 55.5 95.8Z', '#000307'],
  ['M40.5 95.8C42 76.8 44.6 61.8 48 51.8C51.4 61.8 54 76.8 55.5 95.8Z', '#000102'],
] as const;
const hoodSeams = [
  ['M32.9 35.3C34.5 27 39.2 19.5 47.5 14.8', '#91e4f5', 0.21, 0.64],
  ['M63.1 35.3C61.5 27 56.8 19.5 47.5 14.8', '#2b9ab3', 0.09, 0.54],
  ['M35.2 30.2C38.1 24.2 42.4 19.7 47.5 17.3C53 19.8 57.4 24.5 60.4 30.5', '#9ee9f8', 0.13, 0.5],
  ['M37.2 24.1C39.8 19.5 43.3 16 47.5 13.9C51.9 16.2 55.5 19.8 58.1 24.5', '#baf1fa', 0.12, 0.46],
  ['M39.4 18.6C41.7 15.4 44.4 12.9 47.5 11.4C50.8 13.1 53.5 15.6 55.8 19', '#e4fcff', 0.1, 0.42],
] as const;
const rimPaths = [
  ['M22.4 46.2C27.7 42.8 30.6 39.6 31.5 35.4', '#9cefff', 0.7, 1.02],
  ['M31.5 35.4C33.4 25.7 38 12.1 47.5 7.4', 'gradient', 1, 1.4],
  ['M47.5 7.4C53.8 10.7 58.8 19.2 61.7 29', '#55cde7', 0.34, 0.72],
  ['M64.6 35.5C65.5 39.7 68.3 42.9 73.1 46.1', '#42b8d4', 0.2, 0.58],
  ['M17.6 49.8C12.1 57 7.7 67.5 4.8 81', '#95e8f8', 0.34, 0.78],
  ['M78.4 49.8C83.9 57 88.3 67.5 91.2 81', '#248ca6', 0.1, 0.52],
] as const;
const seamPaths = [
  ['M17.8 56.6C26 52 34.1 50.5 41.5 51.2', '#9ae8f5', 0.12, 0.52],
  ['M78.2 56.6C70 52 61.9 50.5 54.5 51.2', '#2b94ad', 0.05, 0.42],
  ['M8.5 90C16.4 70.9 27.3 58.1 41.6 51.9', '#5dc3da', 0.09, 0.5],
  ['M87.5 90C79.6 70.9 68.7 58.1 54.4 51.9', '#1e7184', 0.038, 0.4],
  ['M23.2 94.5C28.2 74.7 35.8 60.2 44.7 52.2', '#64cde2', 0.075, 0.44],
  ['M72.8 94.5C67.8 74.7 60.2 60.2 51.3 52.2', '#1e7083', 0.032, 0.36],
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
    <motion.span data-brand-mark data-brand-version={BRAND_VERSION} data-brand-renderer="inline-vector" data-brand-vector-source="reference-derived-contours-v8-4" className={cn('relative inline-flex shrink-0 items-center justify-center overflow-visible', sizes[size], className)} initial={false} animate="idle" whileHover={reducedMotion ? undefined : 'hover'}>
      <motion.svg data-brand-vector className="h-full w-full overflow-visible" viewBox="0 0 96 96" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false" style={{ pointerEvents: 'none' }} variants={{ idle: { y: 0, scale: 1, filter: compact ? 'drop-shadow(0 3px 5px rgba(0,4,13,.72)) drop-shadow(0 0 5px rgba(46,216,255,.13))' : 'drop-shadow(0 5px 11px rgba(0,4,13,.74)) drop-shadow(0 0 8px rgba(46,216,255,.14))' }, hover: { y: compact ? -0.55 : -0.85, scale: compact ? 1.02 : 1.027, filter: compact ? 'drop-shadow(0 5px 9px rgba(0,7,18,.8)) drop-shadow(0 0 8px rgba(65,220,255,.25))' : 'drop-shadow(0 8px 17px rgba(0,7,18,.82)) drop-shadow(0 0 14px rgba(65,220,255,.26))', transition: { duration: 0.78, ease: premiumEase } } }}>
        <title id={ids.title}>THE LEGENDARY POET</title>
        <desc id={ids.description}>Мистическая безликая фигура в глубоком тканевом капюшоне и тяжёлой мантии, окружённая холодной спектральной энергией</desc>
        <defs>
          <linearGradient id={ids.base} x1="6" y1="34" x2="88" y2="96" gradientUnits="userSpaceOnUse"><stop stopColor="#102d43"/><stop offset=".2" stopColor="#071b2a"/><stop offset=".56" stopColor="#02070d"/><stop offset="1" stopColor="#000102"/></linearGradient>
          <linearGradient id={ids.hood} x1="28" y1="7" x2="68" y2="53" gradientUnits="userSpaceOnUse"><stop stopColor="#1a3c52"/><stop offset=".22" stopColor="#0c2437"/><stop offset=".58" stopColor="#04111b"/><stop offset="1" stopColor="#010206"/></linearGradient>
          <linearGradient id={ids.cowlL} x1="17" y1="45" x2="54" y2="64" gradientUnits="userSpaceOnUse"><stop stopColor="#1d4055"/><stop offset=".36" stopColor="#102b3d"/><stop offset=".72" stopColor="#05131e"/><stop offset="1" stopColor="#010409"/></linearGradient>
          <linearGradient id={ids.cowlR} x1="80" y1="45" x2="44" y2="64" gradientUnits="userSpaceOnUse"><stop stopColor="#112e40"/><stop offset=".42" stopColor="#071c2a"/><stop offset=".78" stopColor="#020b12"/><stop offset="1" stopColor="#000205"/></linearGradient>
          <linearGradient id={ids.rim} x1="34" y1="3" x2="78" y2="69" gradientUnits="userSpaceOnUse"><stop stopColor="#f4ffff"/><stop offset=".1" stopColor="#c4f8ff"/><stop offset=".32" stopColor="#6ce6ff"/><stop offset=".62" stopColor="#2fc3e9" stopOpacity=".66"/><stop offset="1" stopColor="#0a7598" stopOpacity="0"/></linearGradient>
          <radialGradient id={ids.void} cx="0" cy="0" r="1" gradientTransform="translate(48 37) rotate(90) scale(20 21)" gradientUnits="userSpaceOnUse"><stop stopColor="#000"/><stop offset=".9" stopColor="#000103"/><stop offset="1" stopColor="#02050a"/></radialGradient>
          <filter id={ids.blur} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation={compact ? 3.5 : 4.2}/></filter>
          <filter id={ids.glow} x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation={compact ? 0.7 : 0.82} result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>

        <motion.g data-brand-atmosphere aria-hidden="true" filter={`url(#${ids.blur})`} variants={{ idle: { opacity: compact ? 0.56 : 0.74, scale: compact ? 0.99 : 0.975 }, hover: { opacity: compact ? 0.78 : 0.96, scale: compact ? 1.02 : 1.045, transition: { duration: 0.92, ease: premiumEase } } }} style={{ transformOrigin: '48px 48px' }}>
          {atmosphereFills.map(([d, fill, opacity]) => <path key={d} d={d} fill={fill} fillOpacity={opacity}/>) }
          <g fill="none" strokeLinecap="round">{atmosphereStrokes.map(([d, stroke, opacity, width]) => <path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={width}/>)}</g>
        </motion.g>
        <motion.g data-brand-energy aria-hidden="true" fill="none" strokeLinecap="round" variants={{ idle: { opacity: compact ? 0.28 : 0.38 }, hover: { opacity: compact ? 0.5 : 0.64, transition: { duration: 0.8, ease: premiumEase } } }}>
          {energyPaths.map(([d, stroke, opacity, width]) => <path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={compact ? width * 0.86 : width}/>) }
        </motion.g>

        <motion.g data-brand-figure variants={{ idle: { y: 0 }, hover: { y: compact ? -0.1 : -0.28, transition: { duration: 0.74, ease: premiumEase } } }}>
          <path data-brand-cloak d={cloakPath} fill={`url(#${ids.base})`} stroke="#102c3e" strokeOpacity=".7" strokeWidth={compact ? 0.72 : 0.8}/>
          <motion.g data-brand-folds variants={{ idle: { opacity: compact ? 0.96 : 1, scale: 1 }, hover: { opacity: 1, scale: compact ? 1.002 : 1.006, transition: { duration: 0.8, ease: premiumEase } } }} style={{ transformOrigin: '48px 70px' }}>
            {foldPaths.map(([d, fill], index) => <motion.path key={d} d={d} fill={fill} variants={index < 2 ? { idle: { x: 0 }, hover: { x: compact ? 0 : index === 0 ? -0.18 : 0.16 } } : undefined}/>) }
            {!compact && <><path d="M47.2 57.7C35.2 60.2 21.8 73.1 9.1 93.8C21.9 82.4 34.3 74.6 45.8 70.4Z" fill="#0b2a3e" fillOpacity=".34"/><path d="M48.8 57.7C60.8 60.2 74.2 73.1 86.9 93.8C74.1 82.4 61.7 74.6 50.2 70.4Z" fill="#04131f" fillOpacity=".29"/></>}
            {!compact && <><path d="M44.8 65C34.9 70 25.3 79.4 17.2 94.4C27.8 83.7 37 77.1 45.6 73.8Z" fill="#061b2a" fillOpacity=".43"/><path d="M51.2 65C61.1 70 70.7 79.4 78.8 94.4C68.2 83.7 59 77.1 50.4 73.8Z" fill="#020a11" fillOpacity=".4"/></>}
          </motion.g>
          <motion.path data-brand-hood d={hoodPath} fill={`url(#${ids.hood})`} stroke="#20465d" strokeOpacity=".78" strokeWidth={compact ? 0.78 : 0.86} variants={{ idle: { y: 0 }, hover: { y: compact ? -0.05 : -0.14 } }}/>
          <path d="M22.8 46.3C27.6 43 30.5 39.8 31.5 35.5C33.4 26.4 38.1 16.8 47.6 11C41.1 18.4 37.9 28 37.1 38.2C32.9 42 28.2 44.7 22.8 46.3Z" fill="#071c2b" fillOpacity=".78"/>
          <path d="M73.2 46.3C68.4 43 65.5 39.8 64.5 35.5C62.6 26.4 57.9 16.8 47.6 11C54.1 18.4 58.1 28 58.9 38.2C63.1 42 67.8 44.7 73.2 46.3Z" fill="#020b12" fillOpacity=".92"/>
          <path data-brand-face-void d={voidPath} fill={`url(#${ids.void})`}/>

          <motion.g data-brand-collar variants={{ idle: { opacity: compact ? 0.98 : 1 }, hover: { opacity: 1, transition: { duration: 0.72, ease: premiumEase } } }}>
            <path d="M14.8 51.8C26.5 45.8 37.3 47 48.5 53.4C58.3 48.2 69.1 47.2 81.3 52.5C71.5 53.2 62.7 56.4 54.9 61.3C51.8 63.3 49.6 65.1 48 67C45.9 64.8 43.5 62.9 40.2 60.9C32.7 56.4 24.3 53.4 14.8 51.8Z" fill="#030c14"/>
            <motion.path d="M14.8 51.8C26.5 46.9 36.9 48.4 48.5 54C39.5 53.8 32.2 56.1 25.9 60.4C20.9 58.5 17.3 55.6 14.8 51.8Z" fill={`url(#${ids.cowlL})`} variants={{ idle: { x: 0 }, hover: { x: compact ? 0 : -0.1 } }}/>
            <motion.path d="M81.3 52.5C70.4 47.4 60.6 48.2 48.5 54C56.7 54.1 63.9 56.4 70.2 60.2C75 58.4 78.7 55.8 81.3 52.5Z" fill={`url(#${ids.cowlR})`} variants={{ idle: { x: 0 }, hover: { x: compact ? 0 : 0.08 } }}/>
            <path d="M21.4 56.4C31 52.1 40 52.7 48.5 56.1C56.6 52.9 64.8 53.1 73.3 56.4C64.6 57.1 56.4 60 48 65.5C40 60.1 31.2 57.4 21.4 56.4Z" fill="#01060b"/>
            <path d="M34 60.2C39.2 57.5 44 57.3 48.2 58.8C52.1 57.5 56.8 57.8 62 60.3C56.7 60.8 52 62.5 48 65.7C43.9 62.5 39.2 60.8 34 60.2Z" fill="#000204"/>
            {!compact && <><path d="M18.5 53.3C28.4 50.2 38 51.4 47 55" fill="none" stroke="#78d7ea" strokeOpacity=".11" strokeWidth=".48" strokeLinecap="round"/><path d="M77.7 53.8C68.3 50.7 59 51.6 49.3 55" fill="none" stroke="#258399" strokeOpacity=".05" strokeWidth=".42" strokeLinecap="round"/></>}
          </motion.g>

          <g data-brand-texture aria-hidden="true" fill="none" strokeLinecap="round">{hoodSeams.slice(0, compact ? 3 : hoodSeams.length).map(([d, stroke, opacity, width]) => <path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={compact ? width * 0.88 : width}/>)}</g>
          <motion.g data-brand-rim-light aria-hidden="true" fill="none" strokeLinecap="round" filter={`url(#${ids.glow})`} variants={{ idle: { opacity: compact ? 0.8 : 0.88 }, hover: { opacity: 1, transition: { duration: 0.75, ease: premiumEase } } }}>
            {rimPaths.slice(0, compact ? 6 : rimPaths.length).map(([d, stroke, opacity, width], index) => <motion.path key={d} d={d} stroke={stroke === 'gradient' ? `url(#${ids.rim})` : stroke} strokeOpacity={opacity} strokeWidth={compact ? width * 0.84 : width} variants={index < 3 || index === 4 ? { idle: { pathLength: index === 1 ? 0.82 : 0.7 }, hover: { pathLength: 1 } } : undefined}/>) }
          </motion.g>
          {!compact && <motion.g data-brand-seams aria-hidden="true" fill="none" strokeLinecap="round" variants={{ idle: { opacity: 0.72 }, hover: { opacity: 0.94, transition: { duration: 0.8, ease: premiumEase } } }}>{seamPaths.map(([d, stroke, opacity, width], index) => <motion.path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={width} variants={index >= 2 && index <= 4 ? { idle: { pathLength: 0.6 }, hover: { pathLength: 1 } } : undefined}/>)}</motion.g>}
        </motion.g>
      </motion.svg>
    </motion.span>
  );
}
