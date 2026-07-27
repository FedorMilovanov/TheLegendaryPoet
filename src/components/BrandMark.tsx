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
const VECTOR_SOURCE = 'reference-derived-contours-v8-24';

const cloakPath = 'M48 40.8C37 40.5 27 42.3 18.5 47C11.2 51 6 60 3.2 70C1.2 77.8.8 87 1.5 96H94.5C95.2 87 94.8 77.8 92.8 70C90 60 84.8 51 77.5 47C69 42.3 59 40.5 48 40.8Z';
const hoodPath = 'M48 9.8C40.2 12.2 35.5 20.8 32.8 30.8C31.2 36.8 29.4 42.5 27.5 46.4C32.3 43.8 37 44.7 41.5 47.5C44.5 49.4 46.8 51.2 48 53.3C49.5 51.2 52 49.2 55.2 47.4C59.6 44.8 64.2 43.8 68.8 46.2C66.6 41.7 64.8 36.8 63.2 30.8C60.5 20.7 55.7 12.1 48 9.8Z';
const hoodLeftPath = 'M48 10.5C42.5 14.4 38 22 35.2 31.5C33.5 37 31.8 41.8 29.5 45.1C34.4 43.3 39.2 44.5 43.7 48C45.5 49.4 47 51 48 52.7C45 41.8 43.2 31 44.5 21.8C45.2 16.7 46.6 12.4 48 10.5Z';
const hoodRightPath = 'M48.4 10.7C53.8 14.5 58 22 60.7 31.3C62.2 36.8 63.9 41.2 66.5 44.8C61.8 43.5 57.2 44.7 52.7 47.8C50.8 49.1 49.3 50.8 48 52.7C51.2 41.2 52.8 31 51.6 22C51 16.8 49.7 12.6 48.4 10.7Z';
const facePath = 'M49 21.8C42.8 22.5 38 26.4 34.2 32.7C32.5 35.5 32.7 38.1 34.4 40.6C37.2 44.3 41.2 47.2 47.7 50.3C51.5 47.8 55.2 45 58.2 41.5C60.2 39.2 61.5 36.5 60.4 33.8C57.6 27 54.1 23.2 49 21.8Z';

const atmospherePaths: readonly VectorPath[] = [
  { d: 'M11 95C6 73 14 52 30 38C40 29 43 17 48 8C53 17 56 29 66 38C82 52 90 73 83 95C70 69 59 56 48 52C36 56 24 70 11 95Z', fill: '#62e3ff', fillOpacity: 0.3 },
  { d: 'M0 96C4 74 14 56 30 42C18 63 12 81 11 96Z', fill: '#32cde8', fillOpacity: 0.17 },
  { d: 'M96 96C92 74 82 56 66 42C78 63 84 81 85 96Z', fill: '#167b93', fillOpacity: 0.07 },
  { d: 'M28 30C33 19 40 11 47 9', stroke: '#b5f6ff', strokeOpacity: 0.1, strokeWidth: 1.6, strokeLinecap: 'round' },
  { d: 'M69 31C64 20 56 12 49 9', stroke: '#349bb3', strokeOpacity: 0.035, strokeWidth: 1.15, strokeLinecap: 'round' },
];

const energyPaths: readonly VectorPath[] = [
  { d: 'M13 57C10 62 9 68 9 74', stroke: '#63d8ec', strokeOpacity: 0.05, strokeWidth: 0.34, strokeLinecap: 'round' },
  { d: 'M83 57C86 62 87 68 87 74', stroke: '#26778b', strokeOpacity: 0.02, strokeWidth: 0.3, strokeLinecap: 'round' },
];

const foldPaths: readonly VectorPath[] = [
  { d: 'M1.6 96C4.8 77.5 13 58.5 31 47C36 44 41 45 46 50C34 61 24 78 18 96Z', fill: '#081f2e' },
  { d: 'M94.4 96C91.2 77.5 83 58.5 65 47C60 44 55 45 50 50C62 61 72 78 78 96Z', fill: '#020a11' },
  { d: 'M9.5 96C15.5 75 26 58 42 49C35 64 31 80 30 96Z', fill: '#041520' },
  { d: 'M86.5 96C80.5 75 70 58 54 49C61 64 65 80 66 96Z', fill: '#01050a' },
  { d: 'M22.5 96C27.8 77 36 61 46.6 51C42.2 67.5 39.8 82.5 40 96Z', fill: '#03101a' },
  { d: 'M73.5 96C68.2 77 60 61 49.4 51C53.8 67.5 56.2 82.5 56 96Z', fill: '#01050a' },
  { d: 'M33 96C36 76 41 62 46.5 55C43.5 70 43.2 83 44 96Z', fill: '#04131d' },
  { d: 'M63 96C60 76 55 62 49.5 55C52.5 70 52.8 83 52 96Z', fill: '#01070d' },
  { d: 'M44 96C44.7 77 46 63 47.4 56C48 63 48.2 77 48.1 96Z', fill: '#02080d' },
  { d: 'M52 96C51.3 77 50 63 48.6 56C48 63 47.8 77 47.9 96Z', fill: '#010509' },
  { d: 'M7 91C17 73 29 59.5 43.5 52.5C33 65 24 78.5 18 96Z', fill: '#0c3044', fillOpacity: 0.16 },
  { d: 'M89 91C79 73 67 59.5 52.5 52.5C63 65 72 78.5 78 96Z', fill: '#04131d', fillOpacity: 0.1 },
  { d: 'M18 95C26 76 36 61.5 46 53C39 68 34 82 32 96Z', fill: '#082434', fillOpacity: 0.14 },
  { d: 'M78 95C70 76 60 61.5 50 53C57 68 62 82 64 96Z', fill: '#020b12', fillOpacity: 0.1 },
];

const collarPaths: readonly VectorPath[] = [
  { d: 'M19.5 47.2C28.5 43.5 37.4 44.7 46.4 50.3C39.2 51.8 33.2 53.3 27.3 54.8C23.9 53.4 21.5 50.5 19.5 47.2Z', fill: '#0a2939', fillOpacity: 0.7 },
  { d: 'M76.5 47.7C68.7 44.2 59.8 45.1 49.6 50.8C56.5 53.1 63.1 54 69.2 52.8C72.3 52.1 74.6 50.2 76.5 47.7Z', fill: '#031019', fillOpacity: 0.72 },
  { d: 'M25.5 52C33.1 49.7 40.2 51.2 47.2 55.7C40.8 56.2 35.1 57.8 30.1 60C28.2 57.5 26.7 54.9 25.5 52Z', fill: '#06202f', fillOpacity: 0.72 },
  { d: 'M70.8 52.8C63.5 50.2 56.6 51.5 48.8 55.5C55.2 57.3 60.8 58.5 65.9 59.3C67.8 57.2 69.5 55 70.8 52.8Z', fill: '#020a10', fillOpacity: 0.78 },
  { d: 'M33 57.5C38.1 55.1 43 56 47.4 59.5C42.8 60.4 38.9 62.1 35.5 64.2Z', fill: '#041725', fillOpacity: 0.72 },
  { d: 'M63.5 57.8C58.5 55.6 53.7 56.4 48.6 59.4C53.3 60.7 57.2 62.2 60.5 63.7Z', fill: '#01070c', fillOpacity: 0.8 },
];

const hoodLayerPaths: readonly VectorPath[] = [
  { d: 'M47.5 12.6C42.4 16.5 38.7 23.1 36.1 31.2C39.9 28.1 43.5 25.7 47.6 23.9', stroke: '#17475d', strokeOpacity: 0.62, strokeWidth: 1.2, strokeLinecap: 'round' },
  { d: 'M48.6 15.5C52.6 18.9 55.7 24.1 58 30.5C54.9 28.2 52.1 26.4 48.4 25', stroke: '#0b2b3b', strokeOpacity: 0.5, strokeWidth: 1.05, strokeLinecap: 'round' },
  { d: 'M47.2 18.6C43.7 21.2 41.2 24.9 39.3 29.4', stroke: '#24576b', strokeOpacity: 0.4, strokeWidth: 0.78, strokeLinecap: 'round' },
];

const texturePaths: readonly VectorPath[] = [
  { d: 'M47.5 22.4C42.8 24.4 38.8 28.3 35.8 33.5C34.4 36.2 34.6 38.9 36.2 41.5', stroke: '#72d7e8', strokeOpacity: 0.13, strokeWidth: 0.34, strokeLinecap: 'round' },
  { d: 'M49.2 22.4C53.9 24.5 57.2 28.2 59.5 33.4', stroke: '#226d80', strokeOpacity: 0.04, strokeWidth: 0.28, strokeLinecap: 'round' },
  { d: 'M28.8 44.8C31.5 36 34.4 24.8 40.3 16.4', stroke: '#d9fbff', strokeOpacity: 0.43, strokeWidth: 0.68, strokeLinecap: 'round' },
  { d: 'M31.2 38C34 27 39.5 16.5 47.2 10.8', stroke: '#bff7ff', strokeOpacity: 0.34, strokeWidth: 0.56, strokeLinecap: 'round' },
  { d: 'M35.1 31C38.3 21.5 42.4 14.9 47.1 11.8', stroke: '#d7fbff', strokeOpacity: 0.17, strokeWidth: 0.44, strokeLinecap: 'round' },
  { d: 'M49.2 10.9C54.4 14.4 58.4 21.7 61.1 31', stroke: '#59c1d3', strokeOpacity: 0.1, strokeWidth: 0.38, strokeLinecap: 'round' },
  { d: 'M63.3 34.2C64.3 38.4 66 42.1 68.2 45', stroke: '#2b8ea2', strokeOpacity: 0.065, strokeWidth: 0.34, strokeLinecap: 'round' },
  { d: 'M30.2 45.2C34.4 43.4 39 44.2 43.2 46.7', stroke: '#71cadc', strokeOpacity: 0.05, strokeWidth: 0.34, strokeLinecap: 'round' },
];

const rimPaths: readonly VectorPath[] = [
  { d: 'M23.5 47.6C26 45.8 27.8 43.2 29 40', stroke: '#bff7ff', strokeOpacity: 0.56, strokeWidth: 0.78, strokeLinecap: 'round' },
  { d: 'M29.1 35.5C31.5 27.2 35.4 18.6 40.2 14', stroke: '#d8fbff', strokeOpacity: 0.52, strokeWidth: 0.68, strokeLinecap: 'round' },
  { d: 'M42 11.8C44.1 10.2 46.1 9.6 47.8 9.3', stroke: '#f4ffff', strokeOpacity: 0.68, strokeWidth: 0.62, strokeLinecap: 'round' },
  { d: 'M49.8 9.9C52.2 11.2 54.4 13.3 56 15.8', stroke: '#71dced', strokeOpacity: 0.18, strokeWidth: 0.4, strokeLinecap: 'round' },
  { d: 'M59 21.8C60.6 25 61.8 28.5 62.7 32', stroke: '#4bbbd0', strokeOpacity: 0.09, strokeWidth: 0.34, strokeLinecap: 'round' },
  { d: 'M64 36C65 39.7 66.8 42.5 69.2 44.8', stroke: '#36a7bf', strokeOpacity: 0.07, strokeWidth: 0.36, strokeLinecap: 'round' },
];

const seamPaths: readonly VectorPath[] = [
  { d: 'M4 94C11 74 24 59 43 51.7', stroke: '#72cbdc', strokeOpacity: 0.16, strokeWidth: 0.42, strokeLinecap: 'round' },
  { d: 'M16 96C23 76 34 60 46 52', stroke: '#5cb1c3', strokeOpacity: 0.13, strokeWidth: 0.36, strokeLinecap: 'round' },
  { d: 'M29 96C33 77 40 61 47 53', stroke: '#5aa6b6', strokeOpacity: 0.14, strokeWidth: 0.32, strokeLinecap: 'round' },
  { d: 'M91 94C84 73 71 57 53 51', stroke: '#286d7f', strokeOpacity: 0.04, strokeWidth: 0.34, strokeLinecap: 'round' },
  { d: 'M80 96C73 76 62 60 50 52', stroke: '#195669', strokeOpacity: 0.03, strokeWidth: 0.28, strokeLinecap: 'round' },
  { d: 'M9 91C16 72 27 58 42 51', stroke: '#64bfd1', strokeOpacity: 0.06, strokeWidth: 0.32, strokeLinecap: 'round' },
  { d: 'M87 91C80 72 69 58 54 51', stroke: '#1d6274', strokeOpacity: 0.022, strokeWidth: 0.28, strokeLinecap: 'round' },
  { d: 'M22 95C27 76 35 61 45 52', stroke: '#69c5d7', strokeOpacity: 0.04, strokeWidth: 0.3, strokeLinecap: 'round' },
  { d: 'M74 95C69 76 61 61 51 52', stroke: '#1a5768', strokeOpacity: 0.02, strokeWidth: 0.26, strokeLinecap: 'round' },
  { d: 'M38 95C40.5 77 44.2 62 47.4 54.8', stroke: '#4d98aa', strokeOpacity: 0.08, strokeWidth: 0.28, strokeLinecap: 'round' },
  { d: 'M58 95C55.5 77 51.8 62 48.6 54.8', stroke: '#1e6071', strokeOpacity: 0.03, strokeWidth: 0.25, strokeLinecap: 'round' },
];

export default function BrandMark({ size = 'sm', className }: BrandMarkProps) {
  const reducedMotion = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const compact = size === 'sm';
  const ids = {
    title: `${id}-brand-title`,
    description: `${id}-brand-description`,
    mantle: `${id}-mantle`,
    hood: `${id}-hood`,
    hoodLeft: `${id}-hood-left`,
    mist: `${id}-mist`,
    glow: `${id}-glow`,
  };

  const renderPath = (path: VectorPath, index: number, compactStroke = false) => (
    <path
      key={`${index}-${path.d}`}
      d={path.d}
      fill={path.fill ?? 'none'}
      fillOpacity={path.fillOpacity}
      stroke={path.stroke}
      strokeOpacity={path.strokeOpacity}
      strokeWidth={path.strokeWidth === undefined ? undefined : compactStroke && compact ? path.strokeWidth * 0.84 : path.strokeWidth}
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
              ? 'drop-shadow(0 3px 5px rgba(0,4,13,.78)) drop-shadow(0 0 5px rgba(46,216,255,.14))'
              : 'drop-shadow(0 5px 11px rgba(0,4,13,.8)) drop-shadow(0 0 8px rgba(46,216,255,.15))',
          },
          hover: {
            y: compact ? -0.5 : -0.8,
            scale: compact ? 1.018 : 1.025,
            filter: compact
              ? 'drop-shadow(0 5px 9px rgba(0,7,18,.84)) drop-shadow(0 0 8px rgba(65,220,255,.25))'
              : 'drop-shadow(0 8px 17px rgba(0,7,18,.86)) drop-shadow(0 0 14px rgba(65,220,255,.26))',
            transition: { duration: 0.78, ease: premiumEase },
          },
        }}
      >
        <title id={ids.title}>THE LEGENDARY POET</title>
        <desc id={ids.description}>Безликая фигура в округлом асимметричном тканевом капюшоне и тяжёлой почти чёрной мантии, окружённая разорванной холодной энергией</desc>
        <defs>
          <linearGradient id={ids.mantle} x1="2" y1="42" x2="92" y2="96" gradientUnits="userSpaceOnUse"><stop stopColor="#12364b"/><stop offset=".18" stopColor="#081f2e"/><stop offset=".48" stopColor="#031019"/><stop offset=".78" stopColor="#01060b"/><stop offset="1" stopColor="#000102"/></linearGradient>
          <linearGradient id={ids.hood} x1="28" y1="9" x2="69" y2="54" gradientUnits="userSpaceOnUse"><stop stopColor="#1b455a"/><stop offset=".28" stopColor="#0d2c3d"/><stop offset=".62" stopColor="#04131e"/><stop offset="1" stopColor="#010307"/></linearGradient>
          <linearGradient id={ids.hoodLeft} x1="28" y1="11" x2="49" y2="53" gradientUnits="userSpaceOnUse"><stop stopColor="#173f55"/><stop offset=".52" stopColor="#082737"/><stop offset="1" stopColor="#021018"/></linearGradient>
          <filter id={ids.mist} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation={compact ? 3.4 : 4.1}/></filter>
          <filter id={ids.glow} x="-140%" y="-140%" width="380%" height="380%"><feGaussianBlur stdDeviation={compact ? 0.52 : 0.62} result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>

        <motion.g data-brand-atmosphere aria-hidden="true" filter={`url(#${ids.mist})`} variants={{ idle: { opacity: compact ? 0.64 : 0.78, scale: 0.985 }, hover: { opacity: compact ? 0.88 : 1, scale: 1.035, transition: { duration: 0.9, ease: premiumEase } } }} style={{ transformOrigin: '48px 48px' }}>
          {atmospherePaths.map((path, index) => renderPath(path, index, true))}
        </motion.g>

        <motion.g data-brand-energy aria-hidden="true" variants={{ idle: { opacity: compact ? 0.42 : 0.66 }, hover: { opacity: 1, transition: { duration: 0.78, ease: premiumEase } } }}>
          {energyPaths.map((path, index) => renderPath(path, index, true))}
        </motion.g>

        <motion.g data-brand-figure variants={{ idle: { y: 0 }, hover: { y: compact ? -0.08 : -0.22, transition: { duration: 0.74, ease: premiumEase } } }}>
          <path data-brand-cloak d={cloakPath} fill={`url(#${ids.mantle})`} stroke="#17394c" strokeOpacity=".54" strokeWidth={compact ? 0.56 : 0.62}/>

          <motion.g data-brand-folds variants={{ idle: { opacity: compact ? 0.96 : 1 }, hover: { opacity: 1, transition: { duration: 0.76, ease: premiumEase } } }}>
            {foldPaths.map((path, index) => renderPath(path, index))}
          </motion.g>

          <motion.g data-brand-collar variants={{ idle: { opacity: compact ? 0.54 : 0.82 }, hover: { opacity: compact ? 0.72 : 0.96, transition: { duration: 0.7, ease: premiumEase } } }}>
            {collarPaths.map((path, index) => renderPath(path, index))}
          </motion.g>

          <motion.path data-brand-hood d={hoodPath} fill={`url(#${ids.hood})`} stroke="#28546a" strokeOpacity=".72" strokeWidth={compact ? 0.66 : 0.74} variants={{ idle: { y: 0 }, hover: { y: compact ? -0.04 : -0.12 } }}/>
          <path d={hoodLeftPath} fill={`url(#${ids.hoodLeft})`} fillOpacity=".86"/>
          <path d={hoodRightPath} fill="#020a10"/>

          <g data-brand-hood-layers>
            {hoodLayerPaths.map((path, index) => renderPath(path, index, true))}
          </g>

          <path data-brand-face-void d={facePath} fill="#000"/>

          <g data-brand-texture aria-hidden="true">
            {texturePaths.slice(0, compact ? 6 : texturePaths.length).map((path, index) => renderPath(path, index, true))}
          </g>

          <motion.g data-brand-rim-light aria-hidden="true" filter={`url(#${ids.glow})`} variants={{ idle: { opacity: compact ? 0.8 : 0.88 }, hover: { opacity: 1, transition: { duration: 0.74, ease: premiumEase } } }}>
            {rimPaths.map((path, index) => (
              <motion.path key={`${index}-${path.d}`} d={path.d} fill="none" stroke={path.stroke} strokeOpacity={path.strokeOpacity} strokeWidth={path.strokeWidth === undefined ? undefined : compact ? path.strokeWidth * 0.84 : path.strokeWidth} strokeLinecap={path.strokeLinecap} variants={index < 4 ? { idle: { pathLength: index === 2 ? 0.82 : 0.68 }, hover: { pathLength: 1 } } : undefined}/>
            ))}
          </motion.g>

          <motion.g data-brand-seams aria-hidden="true" variants={{ idle: { opacity: compact ? 0.5 : 0.72 }, hover: { opacity: compact ? 0.7 : 0.94, transition: { duration: 0.78, ease: premiumEase } } }}>
            {seamPaths.slice(0, compact ? 7 : seamPaths.length).map((path, index) => (
              <motion.path key={`${index}-${path.d}`} d={path.d} fill="none" stroke={path.stroke} strokeOpacity={path.strokeOpacity} strokeWidth={path.strokeWidth === undefined ? undefined : compact ? path.strokeWidth * 0.82 : path.strokeWidth} strokeLinecap={path.strokeLinecap} variants={index >= 2 ? { idle: { pathLength: 0.62 }, hover: { pathLength: 1 } } : undefined}/>
            ))}
          </motion.g>
        </motion.g>
      </motion.svg>
    </motion.span>
  );
}
