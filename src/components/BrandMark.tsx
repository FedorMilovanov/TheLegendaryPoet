import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../utils/cn';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

type VectorPath = Readonly<{
  d: string;
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
  strokeLinecap?: 'round' | 'butt';
}>;

const sizes = { sm: 'h-12 w-12', md: 'h-16 w-16', lg: 'h-24 w-24' };
const premiumEase = [0.16, 1, 0.3, 1] as const;
const BRAND_VERSION = 'cloak-20260726-8';
const VECTOR_SOURCE = 'reference-derived-contours-v8-21';

const cloakPath = 'M47.8 41.8C36.6 40.7 25.2 42.4 16.4 47.2C9.2 51.2 4.8 59.6 2.2 70C.4 77.4.3 86.5 1.3 96H94.8C95.7 85.4 95 76.7 93 69.3C90.1 58.8 85.5 50.7 78.1 47C69.2 42.4 58.6 40.9 47.8 41.8Z';
const hoodPath = 'M46.9 4.3C40.3 7.4 35.7 15.2 32.2 25.4C29.4 33.4 28.9 39.4 22 47.3C29.7 44.9 36.9 45.4 42.3 48.4C44.9 49.9 46.8 51.9 48 54.2C49.6 51.5 51.6 49.5 54.8 47.8C60.7 44.5 67.8 44.6 75.1 47.4C69.5 40.3 68.1 34.4 65.3 26.3C62.1 16.7 55.3 7.6 46.9 4.3Z';
const hoodLeftPath = 'M46.8 5.1C41 10.7 37.1 18.4 34.3 27.6C32.2 34.6 31 40.2 26.5 44.9C31.8 44 37.5 45.3 42.3 48.8C44.8 50.5 46.6 52.2 48 54C45.4 43.3 43.6 33.8 43.7 25.8C43.8 17.7 44.8 10 46.8 5.1Z';
const hoodRightPath = 'M47.3 5.1C52.8 9.7 57.4 17 60.4 26C62.8 33 64 39.3 68.8 44.8C63.6 44.1 58.1 45.3 53.3 48.8C50.9 50.5 49.3 52.3 48 54.2C50.6 43.5 52.4 34.2 52.1 26C51.9 18.2 50.3 10.4 47.3 5.1Z';
const voidPath = 'M47.6 17.8C41.2 18.2 36.6 24.3 33.3 32.2C32.1 36.8 33.9 41.9 37.7 46.2C40.9 49.8 44.3 52.9 48 56.4C51.9 52.9 55.5 49.6 58.7 45.9C62.3 41.7 63.7 36.7 62.1 32C59.2 24.1 54.4 17.4 47.6 17.8Z';
const voidShadePath = 'M33.4 32.1C36.4 24.8 41.4 19.9 47.7 18.5C54 19.9 59 24.6 62 32C58.3 28.6 53.9 26.8 47.9 26.8C41.9 26.8 37.5 28.6 33.4 32.1Z';

const atmospherePaths: readonly VectorPath[] = [
  { d: 'M12 95C6 72 14 49 30 32C39 23 40 13 46.5 5C53 11 57 20 66 29C82 45 89 69 80 95C68 72 58 59 48 55C36 59 24 73 12 95Z', fill: '#59dfff', fillOpacity: 0.19 },
  { d: 'M0 96C5 72 15 53 31 40C19 61 13 80 12 96Z', fill: '#33d8f4', fillOpacity: 0.13 },
  { d: 'M96 96C91 72 81 53 65 40C77 61 83 80 84 96Z', fill: '#168da9', fillOpacity: 0.055 },
  { d: 'M2 88C8 79 4 69 13 60C20 53 17 47 26 39', stroke: '#7beaff', strokeOpacity: 0.17, strokeWidth: 2.2, strokeLinecap: 'round' },
  { d: 'M91 86C86 77 91 68 82 58C76 51 79 46 71 39', stroke: '#268ca5', strokeOpacity: 0.07, strokeWidth: 1.5, strokeLinecap: 'round' },
  { d: 'M4 72C2 64 4 57 9 51', stroke: '#8cf0ff', strokeOpacity: 0.1, strokeWidth: 1.35, strokeLinecap: 'round' },
  { d: 'M92 71C94 63 92 57 88 51', stroke: '#2a93ad', strokeOpacity: 0.045, strokeWidth: 1.1, strokeLinecap: 'round' },
  { d: 'M25 30C31 16 40 7 47 4.5', stroke: '#a8f2ff', strokeOpacity: 0.2, strokeWidth: 2.1, strokeLinecap: 'round' },
  { d: 'M72 31C66 17 57 8 47 4.5', stroke: '#2da6c4', strokeOpacity: 0.09, strokeWidth: 1.55, strokeLinecap: 'round' },
  { d: 'M3 82C9 75 5 68 12 61C18 55 15 49 23 43', stroke: '#78e7fb', strokeOpacity: 0.12, strokeWidth: 0.48, strokeLinecap: 'round' },
  { d: 'M9 91C14 82 11 75 19 68C24 63 22 56 29 50', stroke: '#52cbe5', strokeOpacity: 0.08, strokeWidth: 0.42, strokeLinecap: 'round' },
  { d: 'M93 81C87 74 91 67 84 60C78 54 81 48 73 42', stroke: '#278fa9', strokeOpacity: 0.045, strokeWidth: 0.4, strokeLinecap: 'round' },
];

const energyPaths: readonly VectorPath[] = [
  { d: 'M6 91C3 72 10 53 24 39', stroke: '#5edcf4', strokeOpacity: 0.2, strokeWidth: 0.5 },
  { d: 'M90 91C93 72 86 53 72 39', stroke: '#278da7', strokeOpacity: 0.085, strokeWidth: 0.42 },
  { d: 'M10 51C6 43 8 34 17 27', stroke: '#7de8fc', strokeOpacity: 0.14, strokeWidth: 0.42 },
  { d: 'M86 50C90 42 88 33 80 26', stroke: '#277f96', strokeOpacity: 0.06, strokeWidth: 0.36 },
  { d: 'M16 71C10 63 10 53 16 45', stroke: '#8ceafc', strokeOpacity: 0.11, strokeWidth: 0.38 },
  { d: 'M80 71C86 63 86 53 80 45', stroke: '#247f96', strokeOpacity: 0.03, strokeWidth: 0.32 },
];

const foldPaths: readonly VectorPath[] = [
  { d: 'M1.5 96C4.4 78 12.8 58.7 30.8 47.1C36.8 43.3 42.1 45.2 46.1 50.3C33.5 62 23 78.8 17.5 96Z', fill: '#071d2a' },
  { d: 'M94.7 96C91.7 77.8 83 58.2 65.2 47.2C59.3 43.5 53.8 45.4 49.7 50.1C62.2 62.2 72.5 78.7 78.2 96Z', fill: '#020b12' },
  { d: 'M8.8 96C15 75 26.2 57.3 42.1 48.3C35.3 63.9 30.7 80 29.6 96Z', fill: '#04131e' },
  { d: 'M87.2 96C81 75 69.9 57.4 54 48.3C60.6 64.2 65 80.2 66.2 96Z', fill: '#010609' },
  { d: 'M23 96C27.7 76.1 35.6 59.7 45.7 50.1C41.4 66.7 39 82 38.8 96Z', fill: '#020b12' },
  { d: 'M73 96C68.4 76.1 60.3 59.6 50.2 50C54.7 66.4 57.2 82 57.4 96Z', fill: '#000205' },
  { d: 'M38.8 96C40.7 76.5 44.1 60.6 47.9 51C51.8 60.6 55.3 76.5 57.4 96Z', fill: '#000102' },
  { d: 'M44.5 57.5C32.6 61.1 19.6 75 7.4 95.2C19.9 83.5 32.1 75.5 43.4 71.3Z', fill: '#0e2c3e', fillOpacity: 0.18 },
  { d: 'M51.4 58C63.8 61.7 76.4 75.4 88.8 95.1C76.2 83.7 64.5 76 52.4 71.7Z', fill: '#04131d', fillOpacity: 0.13 },
  { d: 'M41.5 65.4C31.2 71.2 21.4 81.4 13.2 96C23.7 85.4 33.3 78.5 42.5 74.6Z', fill: '#061925', fillOpacity: 0.27 },
  { d: 'M54.8 66.2C64.5 71.6 73.9 81.5 82 96C71.8 85.7 62.3 78.9 53.6 75.1Z', fill: '#01070c', fillOpacity: 0.22 },
  { d: 'M6.6 85.2C12.8 68.4 24.8 55.3 39.2 49.4C28.9 61.1 21.8 75.8 18.4 93.7Z', fill: '#12384d', fillOpacity: 0.1 },
  { d: 'M89.4 84.7C83 68 71.5 55 57 49.5C67.2 61.2 74.2 75.8 77.7 93.6Z', fill: '#0b2736', fillOpacity: 0.05 },
  { d: 'M7.1 92.8C18.5 73.4 31.7 59.1 45.2 53.1C34.6 65.3 27.5 79.7 23 96Z', fill: '#123b50', fillOpacity: 0.18 },
  { d: 'M16.8 95.5C25.6 75.5 36 60.4 46.4 53.1C38.9 67.6 34 81.8 32.2 96Z', fill: '#0a2a3b', fillOpacity: 0.17 },
  { d: 'M88.9 92.8C77.5 73.4 64.3 59.1 50.8 53.1C61.4 65.3 68.5 79.7 73 96Z', fill: '#071b27', fillOpacity: 0.11 },
];

const collarPaths: readonly VectorPath[] = [
  { d: 'M12 49.4C24.5 44.2 36.4 45.6 47.3 51.4C40.4 53.3 33.1 54.2 26.2 52.8C20.4 51.7 15.6 50.6 12 49.4Z', fill: '#0b2c3e' },
  { d: 'M84 50.3C72.5 45.6 62 46.8 49.2 52.2C56.6 54.4 64.8 55.1 72.2 53.4C77.4 52.2 81.2 51.2 84 50.3Z', fill: '#04131c' },
  { d: 'M18 53.6C28.4 51 38.2 52.1 47 57C40 58.2 33.3 57.6 27.2 55.9C23.5 54.9 20.5 54.2 18 53.6Z', fill: '#082131' },
  { d: 'M77 56.3C67.4 53.1 58.5 53.7 49 57.5C56.5 59.3 64 59.6 70.8 58.1C73.5 57.5 75.6 56.9 77 56.3Z', fill: '#020c13' },
  { d: 'M31 58.6C37.1 56.4 42.3 57.5 47.8 61.2C42.8 62.1 38.4 61.5 34.8 60.4Z', fill: '#04141e' },
  { d: 'M66.6 60.4C60.5 57.6 55.2 58.2 49 61.5C54.4 62.8 59.4 62.8 63.3 61.7Z', fill: '#01070c' },
  { d: 'M40.6 62C44.2 60.6 46.7 61.5 48.4 64.2C50.5 61.8 53.3 61.2 56.8 62.8C54.6 65.5 51.8 66.8 48.4 66.4C45.3 66.1 42.7 64.4 40.6 62Z', fill: '#000204' },
  { d: 'M14.8 49.5C25.5 46.6 36.5 47.7 47 52.2', stroke: '#86deee', strokeOpacity: 0.04, strokeWidth: 0.38, strokeLinecap: 'round' },
  { d: 'M50 53C59 49 68.3 48.6 77.4 51.5', stroke: '#4fa4b8', strokeOpacity: 0.024, strokeWidth: 0.32, strokeLinecap: 'round' },
];

const texturePaths: readonly VectorPath[] = [
  { d: 'M27.8 40.4C30.5 30.3 36.4 18.6 46.5 9.6', stroke: '#d7fbff', strokeOpacity: 0.13, strokeWidth: 0.44 },
  { d: 'M67.1 39.8C64.4 29.9 58.7 18.4 47.5 9.4', stroke: '#38a4bc', strokeOpacity: 0.032, strokeWidth: 0.42 },
  { d: 'M31.6 34.5C34.8 25.8 39.7 18.1 46.7 12.1', stroke: '#aeeaf6', strokeOpacity: 0.11, strokeWidth: 0.38 },
  { d: 'M63.6 34.2C60.8 25.7 55.6 18.1 47.8 12', stroke: '#2b879c', strokeOpacity: 0.045, strokeWidth: 0.36 },
  { d: 'M35.2 28C38.2 20.8 42 16 46.8 13', stroke: '#ebfeff', strokeOpacity: 0.08, strokeWidth: 0.36 },
  { d: 'M30.3 45.8C34.8 43.4 39.5 43.8 44.6 46.8', stroke: '#70c9dd', strokeOpacity: 0.055, strokeWidth: 0.36 },
  { d: 'M32.8 35.6C34.4 27.8 39.1 20.5 46.7 17.9', stroke: '#73c7da', strokeOpacity: 0.045, strokeWidth: 0.34 },
  { d: 'M62.7 35.5C61.1 27.7 56.4 20.4 48.3 17.9', stroke: '#1c6678', strokeOpacity: 0.024, strokeWidth: 0.3 },
  { d: 'M5.2 67.2C9.3 57.1 15.5 50.6 24.3 46.7', stroke: '#90e1ef', strokeOpacity: 0.065, strokeWidth: 0.4 },
  { d: 'M90.8 67.2C86.7 57.1 80.5 50.6 71.7 46.7', stroke: '#26778a', strokeOpacity: 0.026, strokeWidth: 0.32 },
];

const rimPaths: readonly VectorPath[] = [
  { d: 'M18.2 48.5C23.6 45.4 27.1 41.8 28.8 37.8', stroke: '#bff7ff', strokeOpacity: 0.7, strokeWidth: 0.82 },
  { d: 'M29.6 34.4C31.5 27.8 34.8 19.2 39.2 14.1', stroke: '#d8fbff', strokeOpacity: 0.58, strokeWidth: 0.72 },
  { d: 'M41.4 11.5C43.4 9.7 45.4 8.6 47.1 8.2', stroke: '#f4ffff', strokeOpacity: 0.72, strokeWidth: 0.66 },
  { d: 'M49.4 8.8C52.1 10.2 54.3 12.4 56.4 15.3', stroke: '#71dced', strokeOpacity: 0.2, strokeWidth: 0.42 },
  { d: 'M60.1 21.2C61.3 23.7 62.3 26.3 63.2 29', stroke: '#4bbbd0', strokeOpacity: 0.12, strokeWidth: 0.36 },
  { d: 'M66.3 34.4C67.6 38.5 70.2 42.1 74.2 45.2', stroke: '#36a7bf', strokeOpacity: 0.1, strokeWidth: 0.38 },
];

const seamPaths: readonly VectorPath[] = [
  { d: 'M4 94C11 74 24 59 43 51.7', stroke: '#72cbdc', strokeOpacity: 0.12, strokeWidth: 0.38 },
  { d: 'M17 96C24 76 34 60 45.5 52.3', stroke: '#5caebe', strokeOpacity: 0.1, strokeWidth: 0.34 },
  { d: 'M31 96C34 77 40 61 46.8 52.8', stroke: '#3f7e8e', strokeOpacity: 0.07, strokeWidth: 0.28 },
  { d: 'M91.5 94C85 75 72 59 53 51.8', stroke: '#266f81', strokeOpacity: 0.035, strokeWidth: 0.3 },
  { d: 'M78 96C72 77 63 61 50.8 52.5', stroke: '#174d5c', strokeOpacity: 0.028, strokeWidth: 0.26 },
  { d: 'M8.5 93C16.1 71.4 27.3 56.6 42 50.4', stroke: '#66c9dc', strokeOpacity: 0.072, strokeWidth: 0.42 },
  { d: 'M87.5 93C79.9 71.4 68.7 56.6 54 50.4', stroke: '#1e6c7d', strokeOpacity: 0.026, strokeWidth: 0.34 },
  { d: 'M22.2 95.5C27.1 75.3 35.4 60 44.8 51.4', stroke: '#6ccfe2', strokeOpacity: 0.04, strokeWidth: 0.36 },
  { d: 'M73.8 95.5C68.9 75.3 60.6 60 51.2 51.4', stroke: '#1b6576', strokeOpacity: 0.024, strokeWidth: 0.3 },
  { d: 'M12.2 93.1C18.4 72.2 28.5 57 41.8 49.9', stroke: '#4da8be', strokeOpacity: 0.075, strokeWidth: 0.32 },
  { d: 'M18.5 95.5C23.8 75.3 32.8 59.1 44.4 50.7', stroke: '#6ac9dc', strokeOpacity: 0.06, strokeWidth: 0.3 },
  { d: 'M30.8 95.7C33.8 76.3 39.7 59.5 46.3 51.2', stroke: '#4fa4b8', strokeOpacity: 0.045, strokeWidth: 0.26 },
  { d: 'M83.8 93.2C77.7 72.4 67.5 57.2 54.2 50', stroke: '#176176', strokeOpacity: 0.021, strokeWidth: 0.28 },
  { d: 'M77.5 95.5C72.3 75.4 63.2 59.2 51.6 50.7', stroke: '#155568', strokeOpacity: 0.018, strokeWidth: 0.24 },
  { d: 'M10.8 86C17.2 68.5 28.1 56.5 41.4 50.5', stroke: '#7bd2e2', strokeOpacity: 0.045, strokeWidth: 0.28 },
  { d: 'M84.8 87C78.5 69.2 67.9 56.8 54.4 50.6', stroke: '#1b5b6c', strokeOpacity: 0.018, strokeWidth: 0.24 },
];

export default function BrandMark({ size = 'sm', className }: BrandMarkProps) {
  const reducedMotion = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const compact = size === 'sm';
  const ids = {
    title: `${id}-brand-title`, description: `${id}-brand-description`, base: `${id}-base`, hood: `${id}-hood`, hoodLeft: `${id}-hood-left`, rim: `${id}-rim`, blur: `${id}-blur`, glow: `${id}-glow`,
  };

  const renderPath = (path: VectorPath, index: number, scaleStroke = false) => (
    <path key={`${index}-${path.d}`} d={path.d} fill={path.fill ?? 'none'} fillOpacity={path.fillOpacity} stroke={path.stroke === 'rim' ? `url(#${ids.rim})` : path.stroke} strokeOpacity={path.strokeOpacity} strokeWidth={path.strokeWidth === undefined ? undefined : scaleStroke && compact ? path.strokeWidth * 0.86 : path.strokeWidth} strokeLinecap={path.strokeLinecap}/>
  );

  return (
    <motion.span data-brand-mark data-brand-version={BRAND_VERSION} data-brand-renderer="inline-vector" data-brand-vector-source={VECTOR_SOURCE} className={cn('relative inline-flex shrink-0 items-center justify-center overflow-visible', sizes[size], className)} initial={false} animate="idle" whileHover={reducedMotion ? undefined : 'hover'}>
      <motion.svg data-brand-vector className="h-full w-full overflow-visible" viewBox="0 0 96 96" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false" style={{ pointerEvents: 'none' }} variants={{
        idle: { y: 0, scale: 1, filter: compact ? 'drop-shadow(0 3px 5px rgba(0,4,13,.76)) drop-shadow(0 0 5px rgba(46,216,255,.14))' : 'drop-shadow(0 5px 11px rgba(0,4,13,.78)) drop-shadow(0 0 8px rgba(46,216,255,.15))' },
        hover: { y: compact ? -0.55 : -0.85, scale: compact ? 1.02 : 1.027, filter: compact ? 'drop-shadow(0 5px 9px rgba(0,7,18,.82)) drop-shadow(0 0 8px rgba(65,220,255,.26))' : 'drop-shadow(0 8px 17px rgba(0,7,18,.84)) drop-shadow(0 0 14px rgba(65,220,255,.27))', transition: { duration: 0.78, ease: premiumEase } },
      }}>
        <title id={ids.title}>THE LEGENDARY POET</title>
        <desc id={ids.description}>Мистическая безликая фигура в глубоком асимметричном тканевом капюшоне и тяжёлой почти чёрной мантии, окружённая разорванной холодной энергией</desc>
        <defs>
          <linearGradient id={ids.base} x1="2" y1="45" x2="91" y2="96" gradientUnits="userSpaceOnUse"><stop stopColor="#0d2b3e"/><stop offset=".18" stopColor="#071a27"/><stop offset=".48" stopColor="#020c13"/><stop offset=".78" stopColor="#010509"/><stop offset="1" stopColor="#000102"/></linearGradient>
          <linearGradient id={ids.hood} x1="25" y1="5" x2="69" y2="55" gradientUnits="userSpaceOnUse"><stop stopColor="#173b50"/><stop offset=".28" stopColor="#0b2939"/><stop offset=".58" stopColor="#04131d"/><stop offset="1" stopColor="#010307"/></linearGradient>
          <linearGradient id={ids.hoodLeft} x1="25" y1="5" x2="50" y2="54" gradientUnits="userSpaceOnUse"><stop stopColor="#15364b"/><stop offset=".48" stopColor="#092333"/><stop offset="1" stopColor="#031019"/></linearGradient>
          <linearGradient id={ids.rim} x1="18" y1="6" x2="74" y2="49" gradientUnits="userSpaceOnUse"><stop stopColor="#fbffff"/><stop offset=".18" stopColor="#d9fcff"/><stop offset=".46" stopColor="#7deaff"/><stop offset=".78" stopColor="#31c4e9" stopOpacity=".5"/><stop offset="1" stopColor="#0b7797" stopOpacity="0"/></linearGradient>
          <filter id={ids.blur} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation={compact ? 3.5 : 4.2}/></filter>
          <filter id={ids.glow} x="-140%" y="-140%" width="380%" height="380%"><feGaussianBlur stdDeviation={compact ? 0.56 : 0.64} result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>

        <motion.g data-brand-atmosphere aria-hidden="true" filter={`url(#${ids.blur})`} variants={{ idle: { opacity: compact ? 0.7 : 0.82, scale: compact ? 0.99 : 0.975 }, hover: { opacity: compact ? 0.9 : 1, scale: compact ? 1.02 : 1.045, transition: { duration: 0.92, ease: premiumEase } } }} style={{ transformOrigin: '48px 48px' }}>{atmospherePaths.map((path, index) => renderPath(path, index))}</motion.g>
        <motion.g data-brand-energy aria-hidden="true" fill="none" strokeLinecap="round" variants={{ idle: { opacity: compact ? 0.3 : 0.4 }, hover: { opacity: compact ? 0.52 : 0.66, transition: { duration: 0.8, ease: premiumEase } } }}>{energyPaths.map((path, index) => renderPath(path, index, true))}</motion.g>

        <motion.g data-brand-figure variants={{ idle: { y: 0 }, hover: { y: compact ? -0.1 : -0.28, transition: { duration: 0.74, ease: premiumEase } } }}>
          <path data-brand-cloak d={cloakPath} fill={`url(#${ids.base})`} stroke="#15384b" strokeOpacity=".55" strokeWidth={compact ? 0.58 : 0.65}/>
          <motion.g data-brand-folds variants={{ idle: { opacity: compact ? 0.96 : 1, scale: 1 }, hover: { opacity: 1, scale: compact ? 1.002 : 1.006, transition: { duration: 0.8, ease: premiumEase } } }} style={{ transformOrigin: '48px 72px' }}>{foldPaths.map((path, index) => renderPath(path, index))}</motion.g>

          <motion.g data-brand-collar variants={{ idle: { opacity: compact ? 0.48 : 0.76 }, hover: { opacity: compact ? 0.66 : 0.9, transition: { duration: 0.72, ease: premiumEase } } }}>{collarPaths.map((path, index) => renderPath(path, index))}</motion.g>

          <motion.path data-brand-hood d={hoodPath} fill={`url(#${ids.hood})`} stroke="#244f64" strokeOpacity=".68" strokeWidth={compact ? 0.64 : 0.7} variants={{ idle: { y: 0 }, hover: { y: compact ? -0.05 : -0.14 } }}/>
          <path d={hoodLeftPath} fill={`url(#${ids.hoodLeft})`} fillOpacity=".78"/>
          <path d={hoodRightPath} fill="#020b12" fillOpacity=".9"/>
          <path data-brand-face-void d={voidPath} fill="#000"/>
          <path d={voidShadePath} fill="#010409" fillOpacity=".7"/>

          <g data-brand-texture aria-hidden="true" fill="none" strokeLinecap="round">{texturePaths.slice(0, compact ? 7 : texturePaths.length).map((path, index) => renderPath(path, index, true))}</g>

          <motion.g data-brand-rim-light aria-hidden="true" fill="none" strokeLinecap="round" filter={`url(#${ids.glow})`} variants={{ idle: { opacity: compact ? 0.8 : 0.9 }, hover: { opacity: 1, transition: { duration: 0.75, ease: premiumEase } } }}>
            {rimPaths.map((path, index) => <motion.path key={`${index}-${path.d}`} d={path.d} fill="none" stroke={path.stroke} strokeOpacity={path.strokeOpacity} strokeWidth={path.strokeWidth === undefined ? undefined : compact ? path.strokeWidth * 0.84 : path.strokeWidth} strokeLinecap={path.strokeLinecap ?? 'round'} variants={index < 4 ? { idle: { pathLength: index === 2 ? 0.82 : 0.68 }, hover: { pathLength: 1 } } : undefined}/>) }
          </motion.g>

          <motion.g data-brand-seams aria-hidden="true" fill="none" strokeLinecap="round" variants={{ idle: { opacity: compact ? 0.48 : 0.72 }, hover: { opacity: compact ? 0.66 : 0.94, transition: { duration: 0.8, ease: premiumEase } } }}>
            {seamPaths.slice(0, compact ? 7 : seamPaths.length).map((path, index) => <motion.path key={`${index}-${path.d}`} d={path.d} fill="none" stroke={path.stroke} strokeOpacity={path.strokeOpacity} strokeWidth={compact && path.strokeWidth ? path.strokeWidth * 0.82 : path.strokeWidth} variants={index >= 2 ? { idle: { pathLength: 0.6 }, hover: { pathLength: 1 } } : undefined}/>) }
          </motion.g>
        </motion.g>
      </motion.svg>
    </motion.span>
  );
}
