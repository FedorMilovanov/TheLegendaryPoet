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
const VECTOR_SOURCE = 'reference-derived-contours-v8-22';

const cloakPath = 'M48 40.8C37 40.5 27 42.3 18.5 47C11.2 51 6 60 3.2 70C1.2 77.8.8 87 1.5 96H94.5C95.2 87 94.8 77.8 92.8 70C90 60 84.8 51 77.5 47C69 42.3 59 40.5 48 40.8Z';
const hoodPath = 'M48 11C42 13.5 38 19.5 35 27.5C32.5 34 31.5 39 28.5 44.5C34.5 42.8 40 44 44.2 47C46 48.3 47.2 49.8 48 51.5C49 49.8 50.5 48.2 52.5 46.8C56.7 43.9 62 42.8 67.5 44.5C64.5 39 63.5 34 61 27.5C58 19.5 54 13.5 48 11Z';
const hoodLeftPath = 'M48 11.5C43.7 16 40.5 21.5 38.2 28.5C36.2 34.7 35 39.2 32.5 43.5C37.2 43.3 41.4 44.8 44.5 47.2C46.2 48.5 47.3 50 48 51.5C45.8 42 44.5 33.7 44.8 26C45 19.5 46.2 14.5 48 11.5Z';
const hoodRightPath = 'M48.2 11.5C52.5 15 55.8 21 58.2 28.5C60 34 61 39 63.5 43.5C59 43.2 55 44.7 52 47.2C50.5 48.5 49.2 50 48 51.5C50 42 51.3 33.7 51 26C50.8 19.5 49.8 14.5 48.2 11.5Z';
const facePath = 'M48 23C43.2 26.1 39 31 35.8 36.7C34.1 40 36 43.8 39.1 47.3C42 50.6 45 53.3 48 55.6C51.2 53 54.2 50 57 46.8C60 43.3 61.7 39.8 60.1 36.4C57.1 30.7 52.8 25.8 48 23Z';

const atmospherePaths: readonly VectorPath[] = [
  { d: 'M11 95C6 73 14 52 30 38C40 29 43 17 48 8C53 17 56 29 66 38C82 52 90 73 83 95C70 69 59 56 48 52C36 56 24 70 11 95Z', fill: '#62e3ff', fillOpacity: 0.34 },
  { d: 'M0 96C4 74 14 56 30 42C18 63 12 81 11 96Z', fill: '#32cde8', fillOpacity: 0.19 },
  { d: 'M96 96C92 74 82 56 66 42C78 63 84 81 85 96Z', fill: '#167b93', fillOpacity: 0.08 },
  { d: 'M28 30C33 19 40 11 47 9', stroke: '#b5f6ff', strokeOpacity: 0.11, strokeWidth: 1.6, strokeLinecap: 'round' },
  { d: 'M69 31C64 20 56 12 49 9', stroke: '#349bb3', strokeOpacity: 0.04, strokeWidth: 1.15, strokeLinecap: 'round' },
];

const energyPaths: readonly VectorPath[] = [
  { d: 'M13 57C10 62 9 68 9 74', stroke: '#63d8ec', strokeOpacity: 0.055, strokeWidth: 0.34, strokeLinecap: 'round' },
  { d: 'M83 57C86 62 87 68 87 74', stroke: '#26778b', strokeOpacity: 0.022, strokeWidth: 0.3, strokeLinecap: 'round' },
];

const foldPaths: readonly VectorPath[] = [
  { d: 'M1.6 96C4.8 77.5 13 58.5 31 47C36 44 41 45 46 50C34 61 24 78 18 96Z', fill: '#081f2e' },
  { d: 'M94.4 96C91.2 77.5 83 58.5 65 47C60 44 55 45 50 50C62 61 72 78 78 96Z', fill: '#020a11' },
  { d: 'M9.5 96C15.5 75 26 58 42 49C35 64 31 80 30 96Z', fill: '#041520' },
  { d: 'M86.5 96C80.5 75 70 58 54 49C61 64 65 80 66 96Z', fill: '#01050a' },
  { d: 'M22.5 96C27.8 77 36 61 46.6 51C42.2 67.5 39.8 82.5 40 96Z', fill: '#03101a' },
  { d: 'M73.5 96C68.2 77 60 61 49.4 51C53.8 67.5 56.2 82.5 56 96Z', fill: '#01050a' },
  { d: 'M40 96C41.8 76.5 45 61 47.6 54.5C49.4 65 50.2 80 49.7 96Z', fill: '#04131d' },
  { d: 'M49.7 96C51.2 78 52 65 48.4 54.6C54 64 58 80 59.2 96Z', fill: '#01070d' },
  { d: 'M7 91C17 73 29 59.5 43.5 52.5C33 65 24 78.5 18 96Z', fill: '#0c3044', fillOpacity: 0.18 },
  { d: 'M89 91C79 73 67 59.5 52.5 52.5C63 65 72 78.5 78 96Z', fill: '#04131d', fillOpacity: 0.12 },
  { d: 'M18 95C26 76 36 61.5 46 53C39 68 34 82 32 96Z', fill: '#082434', fillOpacity: 0.16 },
  { d: 'M78 95C70 76 60 61.5 50 53C57 68 62 82 64 96Z', fill: '#020b12', fillOpacity: 0.12 },
];

const collarPaths: readonly VectorPath[] = [
  { d: 'M15 48C27 43.8 38 45 47 50.7C38 54 29 55 20 52C17.5 51.2 16 49.5 15 48Z', fill: '#123b52' },
  { d: 'M81 48.5C69 44 59 45.2 49 51.3C58 54 67 55 76 52.5C78.5 51.8 80 50 81 48.5Z', fill: '#071d2a' },
  { d: 'M13 51.5C24 47.5 34.8 48.5 44.5 53.5C35 55.3 25.5 55.1 17.5 52.8Z', fill: '#0a2738', fillOpacity: 0.72 },
  { d: 'M83 52C72 47.8 61.5 48.8 51.5 54C61 55.7 70.5 55.5 78.5 53.2Z', fill: '#031019', fillOpacity: 0.75 },
  { d: 'M20 53C29 50.5 38 51.8 47.3 57C39.5 59.2 31 58.7 24 56C22 55.2 21 54 20 53Z', fill: '#0a2c3e' },
  { d: 'M76 53.5C67 50.8 58 52 48.7 57.4C56.5 59.5 65 59 72 56.5C74 55.8 75 54.5 76 53.5Z', fill: '#031019' },
  { d: 'M29 58C36 56 42 57 48 61.5C42 63 36 62.2 32 60.5Z', fill: '#061b27' },
  { d: 'M67 58.5C60 56.2 54 57.2 48 61.7C54 63.2 60 62.7 64 61Z', fill: '#01060b' },
];

const hoodLayerPaths: readonly VectorPath[] = [
  { d: 'M48 12.8C42.5 16.2 38.7 22.1 35.8 29.6C39.7 26.8 43.8 24.6 48 23.2C52.2 24.6 56.3 26.8 60.2 29.6C57.3 22.1 53.5 16.2 48 12.8Z', fill: '#0e3143', fillOpacity: 0.58 },
  { d: 'M48 16C44 18.4 40.8 22.9 38.2 28.6C41.4 26.4 44.7 24.9 48 24C51.3 24.9 54.6 26.4 57.8 28.6C55.2 22.9 52 18.4 48 16Z', fill: '#071f2d', fillOpacity: 0.72 },
  { d: 'M48 19C45 20.8 42.4 23.8 40.3 27.3C42.9 25.8 45.5 24.8 48 24.4C50.5 24.8 53.1 25.8 55.7 27.3C53.6 23.8 51 20.8 48 19Z', fill: '#03131d', fillOpacity: 0.9 },
];

const texturePaths: readonly VectorPath[] = [
  { d: 'M47.8 23.3C43.5 26.4 39.6 31 36.5 36.6C35.5 39.2 36.3 42.1 38.5 45.2', stroke: '#72d7e8', strokeOpacity: 0.16, strokeWidth: 0.34, strokeLinecap: 'round' },
  { d: 'M48.2 23.3C52.5 26.2 56.4 30.8 59.5 36.3', stroke: '#226d80', strokeOpacity: 0.045, strokeWidth: 0.28, strokeLinecap: 'round' },
  { d: 'M31.5 42C34 31 40 18 47.8 12.5', stroke: '#d9fbff', strokeOpacity: 0.45, strokeWidth: 0.65, strokeLinecap: 'round' },
  { d: 'M36 35C38.5 26.5 42 19.5 47.7 15', stroke: '#b8f2fc', strokeOpacity: 0.18, strokeWidth: 0.43, strokeLinecap: 'round' },
  { d: 'M39.5 29C41.5 23 44.3 18.8 47.8 16.8', stroke: '#e9feff', strokeOpacity: 0.09, strokeWidth: 0.34, strokeLinecap: 'round' },
  { d: 'M64 41C61 30 56 18.5 48.2 12.5', stroke: '#42abc1', strokeOpacity: 0.07, strokeWidth: 0.38, strokeLinecap: 'round' },
  { d: 'M60.4 34.5C58.1 26.8 54.4 20.2 48.3 15.2', stroke: '#28778b', strokeOpacity: 0.035, strokeWidth: 0.31, strokeLinecap: 'round' },
  { d: 'M29.8 45C34 42.8 39 43.4 43.4 46.1', stroke: '#71cadc', strokeOpacity: 0.06, strokeWidth: 0.34, strokeLinecap: 'round' },
];

const rimPaths: readonly VectorPath[] = [
  { d: 'M19 48.5C24 45.6 27.6 42 29 38', stroke: '#bff7ff', strokeOpacity: 0.64, strokeWidth: 0.78, strokeLinecap: 'round' },
  { d: 'M30 35C32 28 35 20 39.5 15', stroke: '#d8fbff', strokeOpacity: 0.56, strokeWidth: 0.68, strokeLinecap: 'round' },
  { d: 'M41.5 12.5C43.5 10.8 45.5 10 47.5 9.5', stroke: '#f4ffff', strokeOpacity: 0.7, strokeWidth: 0.62, strokeLinecap: 'round' },
  { d: 'M49.5 10C52 11.4 54 13.5 56 16.2', stroke: '#71dced', strokeOpacity: 0.19, strokeWidth: 0.4, strokeLinecap: 'round' },
  { d: 'M59.8 22C61 24.5 62 27 63 29.8', stroke: '#4bbbd0', strokeOpacity: 0.11, strokeWidth: 0.34, strokeLinecap: 'round' },
  { d: 'M65.3 35C66.5 39 69 42.4 73.5 45.3', stroke: '#36a7bf', strokeOpacity: 0.09, strokeWidth: 0.36, strokeLinecap: 'round' },
];

const seamPaths: readonly VectorPath[] = [
  { d: 'M4 94C11 74 24 59 43 51.7', stroke: '#72cbdc', strokeOpacity: 0.17, strokeWidth: 0.42, strokeLinecap: 'round' },
  { d: 'M16 96C23 76 34 60 46 52', stroke: '#5cb1c3', strokeOpacity: 0.14, strokeWidth: 0.36, strokeLinecap: 'round' },
  { d: 'M29 96C33 77 40 61 47 53', stroke: '#5aa6b6', strokeOpacity: 0.17, strokeWidth: 0.32, strokeLinecap: 'round' },
  { d: 'M91 94C84 73 71 57 53 51', stroke: '#286d7f', strokeOpacity: 0.042, strokeWidth: 0.34, strokeLinecap: 'round' },
  { d: 'M80 96C73 76 62 60 50 52', stroke: '#195669', strokeOpacity: 0.032, strokeWidth: 0.28, strokeLinecap: 'round' },
  { d: 'M9 91C16 72 27 58 42 51', stroke: '#64bfd1', strokeOpacity: 0.07, strokeWidth: 0.32, strokeLinecap: 'round' },
  { d: 'M87 91C80 72 69 58 54 51', stroke: '#1d6274', strokeOpacity: 0.025, strokeWidth: 0.28, strokeLinecap: 'round' },
  { d: 'M22 95C27 76 35 61 45 52', stroke: '#69c5d7', strokeOpacity: 0.045, strokeWidth: 0.3, strokeLinecap: 'round' },
  { d: 'M74 95C69 76 61 61 51 52', stroke: '#1a5768', strokeOpacity: 0.022, strokeWidth: 0.26, strokeLinecap: 'round' },
  { d: 'M38 95C40.5 77 44.2 62 47.4 54.8', stroke: '#4d98aa', strokeOpacity: 0.09, strokeWidth: 0.28, strokeLinecap: 'round' },
  { d: 'M58 95C55.5 77 51.8 62 48.6 54.8', stroke: '#1e6071', strokeOpacity: 0.035, strokeWidth: 0.25, strokeLinecap: 'round' },
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
        <desc id={ids.description}>Безликая фигура в узком слоистом капюшоне и тяжёлой почти чёрной мантии, окружённая разорванной холодной энергией</desc>
        <defs>
          <linearGradient id={ids.mantle} x1="2" y1="42" x2="92" y2="96" gradientUnits="userSpaceOnUse">
            <stop stopColor="#12364b"/><stop offset=".18" stopColor="#081f2e"/><stop offset=".48" stopColor="#031019"/><stop offset=".78" stopColor="#01060b"/><stop offset="1" stopColor="#000102"/>
          </linearGradient>
          <linearGradient id={ids.hood} x1="31" y1="10" x2="66" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1c455b"/><stop offset=".3" stopColor="#0d2e40"/><stop offset=".62" stopColor="#04141f"/><stop offset="1" stopColor="#010307"/>
          </linearGradient>
          <linearGradient id={ids.hoodLeft} x1="31" y1="11" x2="49" y2="51" gradientUnits="userSpaceOnUse">
            <stop stopColor="#174056"/><stop offset=".5" stopColor="#0a293a"/><stop offset="1" stopColor="#031019"/>
          </linearGradient>
          <filter id={ids.mist} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation={compact ? 3.4 : 4.1}/></filter>
          <filter id={ids.glow} x="-140%" y="-140%" width="380%" height="380%"><feGaussianBlur stdDeviation={compact ? 0.52 : 0.62} result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>

        <motion.g
          data-brand-atmosphere
          aria-hidden="true"
          filter={`url(#${ids.mist})`}
          variants={{ idle: { opacity: compact ? 0.68 : 0.82, scale: 0.985 }, hover: { opacity: compact ? 0.9 : 1, scale: 1.035, transition: { duration: 0.9, ease: premiumEase } } }}
          style={{ transformOrigin: '48px 48px' }}
        >
          {atmospherePaths.map((path, index) => renderPath(path, index, true))}
        </motion.g>

        <motion.g
          data-brand-energy
          aria-hidden="true"
          variants={{ idle: { opacity: compact ? 0.45 : 0.7 }, hover: { opacity: 1, transition: { duration: 0.78, ease: premiumEase } } }}
        >
          {energyPaths.map((path, index) => renderPath(path, index, true))}
        </motion.g>

        <motion.g data-brand-figure variants={{ idle: { y: 0 }, hover: { y: compact ? -0.08 : -0.22, transition: { duration: 0.74, ease: premiumEase } } }}>
          <path data-brand-cloak d={cloakPath} fill={`url(#${ids.mantle})`} stroke="#17394c" strokeOpacity=".54" strokeWidth={compact ? 0.56 : 0.62}/>

          <motion.g
            data-brand-folds
            variants={{ idle: { opacity: compact ? 0.96 : 1 }, hover: { opacity: 1, transition: { duration: 0.76, ease: premiumEase } } }}
          >
            {foldPaths.map((path, index) => renderPath(path, index))}
          </motion.g>

          <motion.g
            data-brand-collar
            variants={{ idle: { opacity: compact ? 0.68 : 0.9 }, hover: { opacity: compact ? 0.82 : 1, transition: { duration: 0.7, ease: premiumEase } } }}
          >
            {collarPaths.map((path, index) => renderPath(path, index))}
          </motion.g>

          <motion.path
            data-brand-hood
            d={hoodPath}
            fill={`url(#${ids.hood})`}
            stroke="#28546a"
            strokeOpacity=".78"
            strokeWidth={compact ? 0.66 : 0.75}
            variants={{ idle: { y: 0 }, hover: { y: compact ? -0.04 : -0.12 } }}
          />
          <path d={hoodLeftPath} fill={`url(#${ids.hoodLeft})`} fillOpacity=".82"/>
          <path d={hoodRightPath} fill="#020a10"/>

          <g data-brand-hood-layers>
            {hoodLayerPaths.map((path, index) => renderPath(path, index))}
          </g>

          <path data-brand-face-void d={facePath} fill="#000"/>

          <g data-brand-texture aria-hidden="true">
            {texturePaths.slice(0, compact ? 6 : texturePaths.length).map((path, index) => renderPath(path, index, true))}
          </g>

          <motion.g
            data-brand-rim-light
            aria-hidden="true"
            filter={`url(#${ids.glow})`}
            variants={{ idle: { opacity: compact ? 0.82 : 0.9 }, hover: { opacity: 1, transition: { duration: 0.74, ease: premiumEase } } }}
          >
            {rimPaths.map((path, index) => (
              <motion.path
                key={`${index}-${path.d}`}
                d={path.d}
                fill="none"
                stroke={path.stroke}
                strokeOpacity={path.strokeOpacity}
                strokeWidth={path.strokeWidth === undefined ? undefined : compact ? path.strokeWidth * 0.84 : path.strokeWidth}
                strokeLinecap={path.strokeLinecap}
                variants={index < 4 ? { idle: { pathLength: index === 2 ? 0.82 : 0.68 }, hover: { pathLength: 1 } } : undefined}
              />
            ))}
          </motion.g>

          <motion.g
            data-brand-seams
            aria-hidden="true"
            variants={{ idle: { opacity: compact ? 0.54 : 0.76 }, hover: { opacity: compact ? 0.72 : 0.96, transition: { duration: 0.78, ease: premiumEase } } }}
          >
            {seamPaths.slice(0, compact ? 7 : seamPaths.length).map((path, index) => (
              <motion.path
                key={`${index}-${path.d}`}
                d={path.d}
                fill="none"
                stroke={path.stroke}
                strokeOpacity={path.strokeOpacity}
                strokeWidth={path.strokeWidth === undefined ? undefined : compact ? path.strokeWidth * 0.82 : path.strokeWidth}
                strokeLinecap={path.strokeLinecap}
                variants={index >= 2 ? { idle: { pathLength: 0.62 }, hover: { pathLength: 1 } } : undefined}
              />
            ))}
          </motion.g>
        </motion.g>
      </motion.svg>
    </motion.span>
  );
}
