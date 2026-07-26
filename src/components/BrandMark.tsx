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
const VECTOR_SOURCE = 'reference-derived-contours-v8-19';

const cloakPath = 'M48 41.4C36.8 40.8 26.1 42.8 17.4 47.2C10.2 50.9 5.5 58.1 2.7 68.1C.7 75.4.2 85.1 1.1 96C16.5 96 32 96 48 96C64 96 79.5 96 94.9 96C95.8 85.1 95.3 75.4 93.3 68.1C90.5 58.1 85.8 50.9 78.6 47.2C69.9 42.8 59.2 40.8 48 41.4Z';
const hoodPath = 'M48 5C40 7.6 34.7 16.1 31.3 26.9C28.9 34.5 27.7 40.3 21.2 47.1C29.6 44.6 37.1 45 42.6 48C45.3 49.5 47 51.7 48.2 54C49.7 51.5 51.5 49.4 54.4 47.8C60 44.7 67.6 44.3 75.8 46.9C69.3 40.1 68.1 34.3 65.6 26.6C62.1 15.9 56 7.4 48 5Z';
const hoodLeftPath = 'M48 5.4C42 10.6 37.9 18.7 35 28.5C32.9 35.4 31.6 40.6 26.8 45.1C32.2 44.3 38 45.4 42.8 48.7C45.2 50.3 46.8 52.2 48.2 53.9C45.6 43.6 43.6 34 43.8 25.7C44 17.7 45.4 10 48 5.4Z';
const hoodRightPath = 'M48.1 5.5C54.1 10.6 58.2 18.6 61 28.2C63 35.2 64.4 40.5 69.1 44.9C63.7 44.2 58.1 45.4 53.4 48.8C51 50.5 49.4 52.2 48.2 54C50.8 43.6 52.7 34 52.4 25.7C52.2 17.8 50.8 10.2 48.1 5.5Z';
const voidPath = 'M48.1 17.6C40.3 18 35.1 24.2 32.2 33.1C30.4 38.8 31.6 44.4 36 48.7C39.4 52 43.5 54 48 55.3C52.8 53.7 56.9 51.3 60.2 47.7C64.1 43.4 64.8 37.9 62.6 32.3C59.5 23.9 55.1 17.3 48.1 17.6Z';
const voidShadePath = 'M32.2 39.8C34.7 30.4 39.6 23.1 48 18.2C56.4 22.9 61.2 30.2 63.4 39.7C60.4 35.2 56.8 31.8 53.1 29.6C51.2 28.5 49.5 28 48 28.1C46.2 28 44.4 28.5 42.4 29.7C38.7 31.9 35.1 35.4 32.2 39.8Z';

const atmospherePaths: readonly VectorPath[] = [
  { d: 'M18 91C10 67 16 45 32 29C40 21 42 11 48 4C53 10 57 20 65 29C80 45 87 67 78 91C68 70 58 57 48 53C38 57 28 70 18 91Z', fill: '#6ae7ff', fillOpacity: 0.23 },
  { d: 'M0 96C5 72 15 53 31 40C19 61 13 80 12 96Z', fill: '#33d8f4', fillOpacity: 0.145 },
  { d: 'M96 96C91 72 81 53 65 40C77 61 83 80 84 96Z', fill: '#168da9', fillOpacity: 0.065 },
  { d: 'M8 86C6 76 8 66 13 57C16 51 20 44 26 38', stroke: '#75e6fb', strokeOpacity: 0.16, strokeWidth: 2.4, strokeLinecap: 'round' },
  { d: 'M88 84C90 74 87 63 82 55C78 48 75 43 70 38', stroke: '#2498b4', strokeOpacity: 0.075, strokeWidth: 1.7, strokeLinecap: 'round' },
  { d: 'M4 72C2 64 4 57 9 51', stroke: '#8cf0ff', strokeOpacity: 0.11, strokeWidth: 1.4, strokeLinecap: 'round' },
  { d: 'M92 71C94 63 92 57 88 51', stroke: '#2a93ad', strokeOpacity: 0.05, strokeWidth: 1.15, strokeLinecap: 'round' },
  { d: 'M25 30C31 16 40 7 48 4', stroke: '#a8f2ff', strokeOpacity: 0.26, strokeWidth: 2.4, strokeLinecap: 'round' },
  { d: 'M72 31C66 17 57 8 48 4', stroke: '#2da6c4', strokeOpacity: 0.12, strokeWidth: 1.7, strokeLinecap: 'round' },
  { d: 'M3 82C9 75 5 68 12 61C18 55 15 49 23 43', stroke: '#78e7fb', strokeOpacity: 0.13, strokeWidth: 0.48, strokeLinecap: 'round' },
  { d: 'M9 91C14 82 11 75 19 68C24 63 22 56 29 50', stroke: '#52cbe5', strokeOpacity: 0.09, strokeWidth: 0.42, strokeLinecap: 'round' },
  { d: 'M93 81C87 74 91 67 84 60C78 54 81 48 73 42', stroke: '#278fa9', strokeOpacity: 0.05, strokeWidth: 0.4, strokeLinecap: 'round' },
];

const energyPaths: readonly VectorPath[] = [
  { d: 'M6 91C3 72 10 53 24 39', stroke: '#5edcf4', strokeOpacity: 0.22, strokeWidth: 0.52 },
  { d: 'M90 91C93 72 86 53 72 39', stroke: '#278da7', strokeOpacity: 0.1, strokeWidth: 0.44 },
  { d: 'M10 51C6 43 8 34 17 27', stroke: '#7de8fc', strokeOpacity: 0.16, strokeWidth: 0.44 },
  { d: 'M86 50C90 42 88 33 80 26', stroke: '#277f96', strokeOpacity: 0.07, strokeWidth: 0.38 },
  { d: 'M16 71C10 63 10 53 16 45', stroke: '#8ceafc', strokeOpacity: 0.13, strokeWidth: 0.4 },
  { d: 'M80 71C86 63 86 53 80 45', stroke: '#247f96', strokeOpacity: 0.035, strokeWidth: 0.34 },
];

const foldPaths: readonly VectorPath[] = [
  { d: 'M1.3 95.8C4.7 75.6 12.5 58 30.4 47.3C36.4 43.7 42.3 45.5 46.2 50.1C34 61.2 24.2 77.2 18.2 96Z', fill: '#071b29' },
  { d: 'M94.7 95.8C91.3 75.6 83.5 58 65.6 47.3C59.6 43.7 53.7 45.5 49.8 50.1C62 61.2 71.8 77.2 77.8 96Z', fill: '#020b13' },
  { d: 'M9.1 96C14.5 74.5 25.8 56.6 41.7 48C35.3 63 30.5 80 29.6 96Z', fill: '#04131f' },
  { d: 'M87.2 96C81.7 75.2 70.4 57.4 54.5 48.3C60.8 63.4 65.4 80.4 66.3 96Z', fill: '#010609' },
  { d: 'M23.2 96C27.3 76.4 35.4 59.6 45.6 50C41.3 66.5 38.7 82 38.6 96Z', fill: '#020b12' },
  { d: 'M72.9 96C68.7 76.2 60.6 59.4 50.4 50C54.8 66.5 57.4 82 57.5 96Z', fill: '#000205' },
  { d: 'M38.6 96C40.6 76.5 44 60.5 48 50.9C51.9 60.5 55.4 76.5 57.5 96Z', fill: '#000102' },
  { d: 'M44.5 57.5C32.6 61.1 19.6 75 7.4 95.2C19.9 83.5 32.1 75.5 43.4 71.3Z', fill: '#0e2c3e', fillOpacity: 0.2 },
  { d: 'M51.4 58C63.8 61.7 76.4 75.4 88.8 95.1C76.2 83.7 64.5 76 52.4 71.7Z', fill: '#04131d', fillOpacity: 0.15 },
  { d: 'M41.5 65.4C31.2 71.2 21.4 81.4 13.2 96C23.7 85.4 33.3 78.5 42.5 74.6Z', fill: '#061925', fillOpacity: 0.3 },
  { d: 'M54.8 66.2C64.5 71.6 73.9 81.5 82 96C71.8 85.7 62.3 78.9 53.6 75.1Z', fill: '#01070c', fillOpacity: 0.24 },
  { d: 'M6.6 85.2C12.8 68.4 24.8 55.3 39.2 49.4C28.9 61.1 21.8 75.8 18.4 93.7Z', fill: '#12384d', fillOpacity: 0.11 },
  { d: 'M89.4 84.7C83 68 71.5 55 57 49.5C67.2 61.2 74.2 75.8 77.7 93.6Z', fill: '#0b2736', fillOpacity: 0.055 },
  { d: 'M7.1 92.8C18.5 73.4 31.7 59.1 45.2 53.1C34.6 65.3 27.5 79.7 23 96Z', fill: '#123b50', fillOpacity: 0.22 },
  { d: 'M16.8 95.5C25.6 75.5 36 60.4 46.4 53.1C38.9 67.6 34 81.8 32.2 96Z', fill: '#0a2a3b', fillOpacity: 0.2 },
  { d: 'M88.9 92.8C77.5 73.4 64.3 59.1 50.8 53.1C61.4 65.3 68.5 79.7 73 96Z', fill: '#071b27', fillOpacity: 0.13 },
];

const collarPaths: readonly VectorPath[] = [
  { d: 'M11.8 49.8C24.9 44.6 36.4 46 47.5 51.5C57.8 56.7 69.2 58.1 84.2 51.2C77.8 59.6 67.8 63.8 56.3 62.8C46.1 61.9 37.1 57.2 28.4 55.8C21.6 54.7 16.1 52.4 11.8 49.8Z', fill: '#02080d' },
  { d: 'M13.2 48.5C25.8 45.2 37.2 47 47.9 52.2C56.4 56.4 65 58 76.7 55.2C71.2 59 63.5 60.3 55.4 59.1C45.9 57.8 38 54.2 29.1 52.7C22.6 51.6 17.2 50.2 13.2 48.5Z', fill: '#0a2535' },
  { d: 'M83.8 50.8C72.6 46.2 62.4 47.1 50.7 52.7C41.5 57.1 33.2 59.8 23.8 58.2C29.7 62.6 37.7 64 47.3 61.7C57.7 59.2 66 56.5 75.4 56.9C79.4 55.3 82.2 53.1 83.8 50.8Z', fill: '#04131c' },
  { d: 'M18.6 54.1C28.8 51.6 38.6 52.5 48.2 56.8C56.7 60.6 65.7 60.6 75.9 56.8C69 62.4 59.3 64.9 48.5 63.7C37.9 62.6 28.2 59.1 18.6 54.1Z', fill: '#01060b' },
  { d: 'M29.2 59.2C37 56.8 44 57.5 50 60.7C55.5 58.3 61.4 58.5 67.9 61.3C63.1 65 56.5 66.9 48.6 66.1C41.2 65.3 34.5 62.7 29.2 59.2Z', fill: '#000204' },
  { d: 'M14.8 49.5C26.5 46.6 37.7 48.2 48.2 53C57.4 57.1 66.8 58.3 76.8 55.7', stroke: '#86deee', strokeOpacity: 0.055, strokeWidth: 0.42, strokeLinecap: 'round' },
  { d: 'M24.2 56.2C33.2 53.7 41.3 54.5 49.2 58.2C56.6 61.5 63.8 61.7 71.8 59', stroke: '#4fa4b8', strokeOpacity: 0.035, strokeWidth: 0.36, strokeLinecap: 'round' },
];

const texturePaths: readonly VectorPath[] = [
  { d: 'M28.3 40.8C31.1 30.2 37.1 18 47.8 8.8', stroke: '#ddfcff', strokeOpacity: 0.27, strokeWidth: 0.58 },
  { d: 'M67.5 40C64.8 29.8 58.8 18 48.2 8.8', stroke: '#38a4bc', strokeOpacity: 0.038, strokeWidth: 0.48 },
  { d: 'M32 34.8C35.2 25.5 40.5 17.4 47.8 11.8', stroke: '#baf2fb', strokeOpacity: 0.22, strokeWidth: 0.5 },
  { d: 'M64 34.3C60.9 25.2 55.6 17.4 48.2 11.8', stroke: '#2b879c', strokeOpacity: 0.055, strokeWidth: 0.42 },
  { d: 'M35.7 28C38.8 20.7 42.7 15.8 47.9 12.8', stroke: '#ebfeff', strokeOpacity: 0.16, strokeWidth: 0.42 },
  { d: 'M30.5 45.8C35 43.4 39.8 43.7 44.7 46.6', stroke: '#70c9dd', strokeOpacity: 0.07, strokeWidth: 0.4 },
  { d: 'M33.1 35.7C34.6 27.8 39.4 20.5 47.7 17.9', stroke: '#73c7da', strokeOpacity: 0.055, strokeWidth: 0.38 },
  { d: 'M62.8 35.6C61.3 27.7 56.6 20.4 48.3 17.9', stroke: '#1c6678', strokeOpacity: 0.028, strokeWidth: 0.34 },
  { d: 'M5.2 67.2C9.3 57.1 15.5 50.6 24.3 46.7', stroke: '#90e1ef', strokeOpacity: 0.08, strokeWidth: 0.44 },
  { d: 'M90.8 67.2C86.7 57.1 80.5 50.6 71.7 46.7', stroke: '#26778a', strokeOpacity: 0.03, strokeWidth: 0.36 },
];

const rimPaths: readonly VectorPath[] = [
  { d: 'M18.4 48.5C23.4 45.6 26.9 42.2 28.8 37.9', stroke: '#bcf6ff', strokeOpacity: 0.72, strokeWidth: 0.98 },
  { d: 'M28.8 36.1C31.5 25.8 37.7 12.2 47.8 8.3', stroke: 'rim', strokeWidth: 1.38, strokeLinecap: 'butt' },
  { d: 'M48.2 8.4C55.2 11.2 60.5 18.4 64.1 27.9', stroke: '#77e3f5', strokeOpacity: 0.37, strokeWidth: 0.68 },
  { d: 'M66 31.2C66.9 36.7 69.7 41.1 74.8 45', stroke: '#43b7d0', strokeOpacity: 0.19, strokeWidth: 0.56 },
  { d: 'M12.7 52.2C7.8 60.6 4.2 72.1 2 85.2', stroke: '#a9f0fb', strokeOpacity: 0.34, strokeWidth: 0.74 },
  { d: 'M1.6 88.7C1.3 91.1 1.4 93.3 1.6 95.1', stroke: '#55c7df', strokeOpacity: 0.17, strokeWidth: 0.55 },
  { d: 'M83.2 52.4C88.1 60.8 91.8 72.2 94 85.2', stroke: '#278da6', strokeOpacity: 0.085, strokeWidth: 0.48 },
];

const seamPaths: readonly VectorPath[] = [
  { d: 'M4.2 94C10.8 74.5 23.8 58.5 43 51.6', stroke: '#91e2ee', strokeOpacity: 0.24, strokeWidth: 0.48 },
  { d: 'M14 96C21.5 76 33 59.6 45.4 52.2', stroke: '#7bd3e2', strokeOpacity: 0.22, strokeWidth: 0.42 },
  { d: 'M26 96C31 76.1 39 59.7 46.7 52.7', stroke: '#60b6c6', strokeOpacity: 0.18, strokeWidth: 0.36 },
  { d: 'M38.5 96C40.7 76.2 44.7 60.1 47.6 53', stroke: '#408999', strokeOpacity: 0.12, strokeWidth: 0.3 },
  { d: 'M91.8 94C85.2 74.5 72.2 58.5 53 51.6', stroke: '#2a8295', strokeOpacity: 0.075, strokeWidth: 0.38 },
  { d: 'M82 96C74.5 76 63 59.6 50.6 52.2', stroke: '#1c6173', strokeOpacity: 0.06, strokeWidth: 0.32 },
  { d: 'M70 96C65 76.1 57 59.7 49.3 52.7', stroke: '#154858', strokeOpacity: 0.045, strokeWidth: 0.28 },
  { d: 'M8.5 93C16.1 71.4 27.3 56.6 42 50.4', stroke: '#66c9dc', strokeOpacity: 0.083, strokeWidth: 0.46 },
  { d: 'M87.5 93C79.9 71.4 68.7 56.6 54 50.4', stroke: '#1e6c7d', strokeOpacity: 0.03, strokeWidth: 0.36 },
  { d: 'M22.2 95.5C27.1 75.3 35.4 60 44.8 51.4', stroke: '#6ccfe2', strokeOpacity: 0.045, strokeWidth: 0.4 },
  { d: 'M73.8 95.5C68.9 75.3 60.6 60 51.2 51.4', stroke: '#1b6576', strokeOpacity: 0.027, strokeWidth: 0.32 },
  { d: 'M12.2 93.1C18.4 72.2 28.5 57 41.8 49.9', stroke: '#4da8be', strokeOpacity: 0.088, strokeWidth: 0.34 },
  { d: 'M18.5 95.5C23.8 75.3 32.8 59.1 44.4 50.7', stroke: '#6ac9dc', strokeOpacity: 0.072, strokeWidth: 0.32 },
  { d: 'M30.8 95.7C33.8 76.3 39.7 59.5 46.3 51.2', stroke: '#4fa4b8', strokeOpacity: 0.053, strokeWidth: 0.28 },
  { d: 'M83.8 93.2C77.7 72.4 67.5 57.2 54.2 50', stroke: '#176176', strokeOpacity: 0.024, strokeWidth: 0.3 },
  { d: 'M77.5 95.5C72.3 75.4 63.2 59.2 51.6 50.7', stroke: '#155568', strokeOpacity: 0.021, strokeWidth: 0.26 },
];

export default function BrandMark({ size = 'sm', className }: BrandMarkProps) {
  const reducedMotion = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const compact = size === 'sm';
  const ids = {
    title: `${id}-brand-title`,
    description: `${id}-brand-description`,
    base: `${id}-base`,
    hood: `${id}-hood`,
    hoodLeft: `${id}-hood-left`,
    rim: `${id}-rim`,
    blur: `${id}-blur`,
    glow: `${id}-glow`,
  };

  const renderPath = (path: VectorPath, index: number, scaleStroke = false) => (
    <path
      key={`${index}-${path.d}`}
      d={path.d}
      fill={path.fill ?? 'none'}
      fillOpacity={path.fillOpacity}
      stroke={path.stroke === 'rim' ? `url(#${ids.rim})` : path.stroke}
      strokeOpacity={path.strokeOpacity}
      strokeWidth={path.strokeWidth === undefined ? undefined : scaleStroke && compact ? path.strokeWidth * 0.86 : path.strokeWidth}
      strokeLinecap={path.strokeLinecap}
    />
  );

  return (
    <motion.span
      data-brand-mark
      data-brand-version={BRAND_VERSION}
      data-brand-renderer="inline-vector"
      data-brand-vector-source={VECTOR_SOURCE}
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
          idle: {
            y: 0,
            scale: 1,
            filter: compact
              ? 'drop-shadow(0 3px 5px rgba(0,4,13,.76)) drop-shadow(0 0 5px rgba(46,216,255,.14))'
              : 'drop-shadow(0 5px 11px rgba(0,4,13,.78)) drop-shadow(0 0 8px rgba(46,216,255,.15))',
          },
          hover: {
            y: compact ? -0.55 : -0.85,
            scale: compact ? 1.02 : 1.027,
            filter: compact
              ? 'drop-shadow(0 5px 9px rgba(0,7,18,.82)) drop-shadow(0 0 8px rgba(65,220,255,.26))'
              : 'drop-shadow(0 8px 17px rgba(0,7,18,.84)) drop-shadow(0 0 14px rgba(65,220,255,.27))',
            transition: { duration: 0.78, ease: premiumEase },
          },
        }}
      >
        <title id={ids.title}>THE LEGENDARY POET</title>
        <desc id={ids.description}>Мистическая безликая фигура в глубоком тканевом капюшоне и тяжёлой почти чёрной мантии, окружённая разорванной холодной энергией</desc>
        <defs>
          <linearGradient id={ids.base} x1="3" y1="44" x2="91" y2="96" gradientUnits="userSpaceOnUse">
            <stop stopColor="#102b3e"/>
            <stop offset=".17" stopColor="#081c2a"/>
            <stop offset=".46" stopColor="#031019"/>
            <stop offset=".77" stopColor="#01050a"/>
            <stop offset="1" stopColor="#000102"/>
          </linearGradient>
          <linearGradient id={ids.hood} x1="27" y1="4" x2="70" y2="55" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1a3d51"/>
            <stop offset=".2" stopColor="#0e2a3b"/>
            <stop offset=".55" stopColor="#04131e"/>
            <stop offset="1" stopColor="#010307"/>
          </linearGradient>
          <linearGradient id={ids.hoodLeft} x1="26" y1="5" x2="50" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor="#15364b"/>
            <stop offset=".46" stopColor="#092333"/>
            <stop offset="1" stopColor="#031019"/>
          </linearGradient>
          <linearGradient id={ids.rim} x1="22" y1="2" x2="75" y2="77" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fbffff"/>
            <stop offset=".1" stopColor="#d9fcff"/>
            <stop offset=".3" stopColor="#7deaff"/>
            <stop offset=".61" stopColor="#31c4e9" stopOpacity=".7"/>
            <stop offset="1" stopColor="#0b7797" stopOpacity="0"/>
          </linearGradient>
          <filter id={ids.blur} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={compact ? 3.5 : 4.3}/>
          </filter>
          <filter id={ids.glow} x="-140%" y="-140%" width="380%" height="380%">
            <feGaussianBlur stdDeviation={compact ? 0.64 : 0.72} result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <motion.g
          data-brand-atmosphere
          aria-hidden="true"
          filter={`url(#${ids.blur})`}
          variants={{
            idle: { opacity: compact ? 0.7 : 0.82, scale: compact ? 0.99 : 0.975 },
            hover: { opacity: compact ? 0.9 : 1, scale: compact ? 1.02 : 1.045, transition: { duration: 0.92, ease: premiumEase } },
          }}
          style={{ transformOrigin: '48px 48px' }}
        >
          {atmospherePaths.map((path, index) => renderPath(path, index))}
        </motion.g>

        <motion.g
          data-brand-energy
          aria-hidden="true"
          fill="none"
          strokeLinecap="round"
          variants={{
            idle: { opacity: compact ? 0.3 : 0.4 },
            hover: { opacity: compact ? 0.52 : 0.66, transition: { duration: 0.8, ease: premiumEase } },
          }}
        >
          {energyPaths.map((path, index) => renderPath(path, index, true))}
        </motion.g>

        <motion.g
          data-brand-figure
          variants={{
            idle: { y: 0 },
            hover: { y: compact ? -0.1 : -0.28, transition: { duration: 0.74, ease: premiumEase } },
          }}
        >
          <path data-brand-cloak d={cloakPath} fill={`url(#${ids.base})`} stroke="#16394e" strokeOpacity=".62" strokeWidth={compact ? 0.7 : 0.76}/>

          <motion.g
            data-brand-folds
            variants={{
              idle: { opacity: compact ? 0.95 : 1, scale: 1 },
              hover: { opacity: 1, scale: compact ? 1.002 : 1.006, transition: { duration: 0.8, ease: premiumEase } },
            }}
            style={{ transformOrigin: '48px 72px' }}
          >
            {foldPaths.map((path, index) => renderPath(path, index))}
          </motion.g>

          <motion.path
            data-brand-hood
            d={hoodPath}
            fill={`url(#${ids.hood})`}
            stroke="#2a566d"
            strokeOpacity=".82"
            strokeWidth={compact ? 0.78 : 0.86}
            variants={{ idle: { y: 0 }, hover: { y: compact ? -0.05 : -0.14 } }}
          />
          <path d={hoodLeftPath} fill={`url(#${ids.hoodLeft})`} fillOpacity=".66"/>
          <path d={hoodRightPath} fill="#020b12" fillOpacity=".9"/>
          <path data-brand-face-void d={voidPath} fill="#000"/>
          <path d={voidShadePath} fill="#010409" fillOpacity=".74"/>

          <motion.g
            data-brand-collar
            variants={{
              idle: { opacity: compact ? 0.64 : 0.8 },
              hover: { opacity: compact ? 0.78 : 0.94, transition: { duration: 0.72, ease: premiumEase } },
            }}
          >
            {collarPaths.map((path, index) => renderPath(path, index))}
          </motion.g>

          <g data-brand-texture aria-hidden="true" fill="none" strokeLinecap="round">
            {texturePaths.slice(0, compact ? 7 : texturePaths.length).map((path, index) => renderPath(path, index, true))}
          </g>

          <motion.g
            data-brand-rim-light
            aria-hidden="true"
            fill="none"
            strokeLinecap="round"
            filter={`url(#${ids.glow})`}
            variants={{
              idle: { opacity: compact ? 0.82 : 0.9 },
              hover: { opacity: 1, transition: { duration: 0.75, ease: premiumEase } },
            }}
          >
            {rimPaths.map((path, index) => (
              <motion.path
                key={`${index}-${path.d}`}
                d={path.d}
                fill="none"
                stroke={path.stroke === 'rim' ? `url(#${ids.rim})` : path.stroke}
                strokeOpacity={path.strokeOpacity}
                strokeWidth={path.strokeWidth === undefined ? undefined : compact ? path.strokeWidth * 0.84 : path.strokeWidth}
                strokeLinecap={path.strokeLinecap ?? 'round'}
                variants={index < 3 || index === 4 ? { idle: { pathLength: index === 1 ? 0.82 : 0.7 }, hover: { pathLength: 1 } } : undefined}
              />
            ))}
          </motion.g>

          {!compact && (
            <motion.g
              data-brand-seams
              aria-hidden="true"
              fill="none"
              strokeLinecap="round"
              variants={{
                idle: { opacity: 0.72 },
                hover: { opacity: 0.94, transition: { duration: 0.8, ease: premiumEase } },
              }}
            >
              {seamPaths.map((path, index) => (
                <motion.path
                  key={`${index}-${path.d}`}
                  d={path.d}
                  fill="none"
                  stroke={path.stroke}
                  strokeOpacity={path.strokeOpacity}
                  strokeWidth={path.strokeWidth}
                  variants={index >= 2 ? { idle: { pathLength: 0.6 }, hover: { pathLength: 1 } } : undefined}
                />
              ))}
            </motion.g>
          )}
        </motion.g>
      </motion.svg>
    </motion.span>
  );
}
