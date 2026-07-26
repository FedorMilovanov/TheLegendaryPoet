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

const cloakPath = 'M18 43C10 46 4 54 1.5 67C-0.2 77 0.4 89 2.5 95.5C16 96 32 95.6 48 95.8C65 95.7 80 96.1 93.5 95C96 86 95 74 92 64C88.5 52 81.5 45.5 74 42.5C66 39.5 58 38 48.4 40.2C39.1 38.2 27.8 39.6 18 43Z';
const hoodPath = 'M48 2.5C40 5.4 34.5 13.5 30.3 24.5C27.5 32 26.6 37.3 20.5 44.6C27.5 41.5 36 41.4 42.5 45C45.3 46.7 47.2 49.4 48.3 52.8C50 49.2 52.5 46.7 55.5 45C62.5 41.2 69 41.4 76 44.6C70.5 38 69.4 32 66.3 23.6C62.4 13 56.2 5.2 48 2.5Z';
const voidPath = 'M48.1 15.3C39.8 15.3 34 20.5 31.7 29C29.8 36.2 31.2 43.4 36.8 48.1C39.8 50.7 43.7 52.3 48 52.5C52.7 52.3 57.2 50.4 60.2 47.1C64.2 42.6 65.3 35.6 62.8 28.7C60.1 20.6 55 15.3 48.1 15.3Z';

const atmosphereFills = [
  ['M8 94C5 69 14 48 29 34C36 27 39 13 48 4C58 13 61 27 68 34C83 49 91 69 88 94C75 71 61 58 48 54C35 58 21 72 8 94Z', '#58def9', 0.18],
  ['M0 94C4 69 14 50 29 39C17 59 13 78 13 96Z', '#43d6ef', 0.16],
  ['M96 94C92 69 82 50 67 39C79 59 83 78 83 96Z', '#208ba5', 0.09],
] as const;

const atmosphereStrokes = [
  ['M17 42C10 50 7 60 6 71', '#7fe8fb', 0.25, 2.3],
  ['M79 42C86 50 89 60 90 72', '#2b9db9', 0.11, 1.7],
] as const;

const foldFills = [
  ['M2.5 95C6.2 73 15.9 54.8 31.2 43.5C23.9 62.1 20.5 79.8 20.8 95.7Z', '#173d57'],
  ['M93.5 95C89.8 73 80.1 54.8 64.8 43.5C72.1 62.1 75.5 79.8 75.2 95.7Z', '#03121e'],
  ['M16.6 95.7C22.2 70.9 32.5 52.8 42.7 44.8C37.7 62.8 34.6 79.8 34.8 95.8Z', '#0b273a'],
  ['M79.4 95.7C73.8 70.9 63.5 52.8 53.3 44.8C58.3 62.8 61.4 79.8 61.2 95.8Z', '#01070d'],
  ['M33.7 95.8C38 72.3 43.1 55.8 47.4 46.4C45 65.1 43.7 81.1 43.9 95.9Z', '#03101a'],
  ['M62.3 95.8C58 72.3 52.9 55.8 48.6 46.4C51 65.1 52.3 81.1 52.1 95.9Z', '#000204'],
] as const;

const foldStrokes = [
  ['M9.6 88C15.6 66.5 27.2 51.5 42.5 44.7', '#74d8ea', 0.08, 0.45],
  ['M86.4 88C80.4 66.5 68.8 51.5 53.5 44.7', '#1f6576', 0.03, 0.4],
] as const;

const cowlPaths = [
  ['M18.5 44.4C28 41.7 38.5 43.2 48.6 48.4C58 52.9 66.5 54.4 75.8 51.4C71.2 57.1 63.5 59.6 55.2 58.9C44 58 36.3 52.4 26.4 50.8C22.6 50.2 19.9 47.7 18.5 44.4Z', 'cowlA'],
  ['M74.8 45.1C66.5 42.5 57.7 43.7 49 48.7C42.5 52.4 36.3 55.6 29 56.7C34.4 60.2 41.4 60.5 49.6 56.5C58.8 51.9 66.2 49.7 74.2 50.9C75.1 48.9 75.3 46.8 74.8 45.1Z', 'cowlB'],
] as const;

const texturePaths = [
  ['M30.8 36.9C33.1 23.8 38.8 10.9 47.7 3.2', '#dcfbff', 0.17, 0.52],
  ['M65 36.3C62.6 23.7 56.9 10.8 48.3 3.2', '#3a9fb6', 0.06, 0.44],
] as const;

const rimPaths = [
  ['M20.8 44.4C25.7 39.2 27.2 34.3 29.6 26.5C33 15.3 38.9 5.7 47.8 2.8', 'rim', 1, 1.15],
  ['M48.2 2.9C55.5 5.7 61.4 14.4 65.1 25.6', '#8ceafa', 0.5, 0.68],
  ['M66.1 30.9C67.2 36.5 69.5 40.2 73.7 43.6', '#43b7d0', 0.24, 0.55],
  ['M16.4 46.2C9.2 53.3 4.8 66.1 2.1 86.1', '#a6f0ff', 0.42, 0.78],
  ['M1.8 89.2C1.6 91.3 1.7 93.2 2.1 94.5', '#55c9df', 0.22, 0.58],
  ['M79.6 46C86.8 53.2 91.2 66 93.9 85.8', '#2a91a9', 0.11, 0.5],
] as const;

const energyPaths = [
  ['M11.8 73C9.9 58.7 13.7 45.6 21.4 36.3', '#58d9f1', 0.22, 0.5],
  ['M84.2 73C86.1 58.7 82.3 45.6 74.6 36.3', '#288ca6', 0.09, 0.4],
] as const;

export default function BrandMark({ size = 'sm', className }: BrandMarkProps) {
  const reducedMotion = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const compact = size === 'sm';
  const ids = {
    title: `${id}-brand-title`, description: `${id}-brand-description`, cloak: `${id}-cloak`, hood: `${id}-hood`, hoodLeft: `${id}-hood-left`,
    cowlA: `${id}-cowl-a`, cowlB: `${id}-cowl-b`, rim: `${id}-rim`, aura: `${id}-aura`, glow: `${id}-glow`,
  };

  return (
    <motion.span
      data-brand-mark
      data-brand-version={BRAND_VERSION}
      data-brand-renderer="inline-vector"
      data-brand-vector-source="reference-derived-contours-v8-4"
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
          idle: { y: 0, scale: 1, filter: compact ? 'drop-shadow(0 3px 5px rgba(0,4,13,.74)) drop-shadow(0 0 4px rgba(46,216,255,.12))' : 'drop-shadow(0 5px 11px rgba(0,4,13,.76)) drop-shadow(0 0 8px rgba(46,216,255,.14))' },
          hover: { y: compact ? -0.5 : -0.8, scale: compact ? 1.018 : 1.025, filter: compact ? 'drop-shadow(0 5px 9px rgba(0,7,18,.82)) drop-shadow(0 0 8px rgba(65,220,255,.25))' : 'drop-shadow(0 8px 17px rgba(0,7,18,.84)) drop-shadow(0 0 14px rgba(65,220,255,.28))', transition: { duration: 0.78, ease: premiumEase } },
        }}
      >
        <title id={ids.title}>THE LEGENDARY POET</title>
        <desc id={ids.description}>Безликая мистическая фигура в глубоком капюшоне и тяжёлом плаще, окружённая холодной разорванной энергией</desc>
        <defs>
          <linearGradient id={ids.cloak} x1="2" y1="42" x2="94" y2="96" gradientUnits="userSpaceOnUse"><stop stopColor="#1a405b"/><stop offset=".18" stopColor="#0b293d"/><stop offset=".54" stopColor="#04131f"/><stop offset=".86" stopColor="#010408"/><stop offset="1" stopColor="#000103" stopOpacity=".38"/></linearGradient>
          <linearGradient id={ids.hood} x1="25" y1="2" x2="71" y2="54" gradientUnits="userSpaceOnUse"><stop stopColor="#2b5871"/><stop offset=".22" stopColor="#15394f"/><stop offset=".58" stopColor="#071d2b"/><stop offset="1" stopColor="#010308"/></linearGradient>
          <linearGradient id={ids.hoodLeft} x1="25" y1="2" x2="49" y2="53" gradientUnits="userSpaceOnUse"><stop stopColor="#2d6078"/><stop offset=".55" stopColor="#153a4f"/><stop offset="1" stopColor="#050d15"/></linearGradient>
          <linearGradient id={ids.cowlA} x1="18" y1="44" x2="76" y2="59" gradientUnits="userSpaceOnUse"><stop stopColor="#20495f"/><stop offset=".42" stopColor="#103147"/><stop offset=".76" stopColor="#061925"/><stop offset="1" stopColor="#010307"/></linearGradient>
          <linearGradient id={ids.cowlB} x1="75" y1="44" x2="28" y2="61" gradientUnits="userSpaceOnUse"><stop stopColor="#123348"/><stop offset=".44" stopColor="#082030"/><stop offset=".8" stopColor="#020a11"/><stop offset="1" stopColor="#000104"/></linearGradient>
          <linearGradient id={ids.rim} x1="21" y1="3" x2="5" y2="92" gradientUnits="userSpaceOnUse"><stop stopColor="#f6ffff"/><stop offset=".13" stopColor="#c8f9ff"/><stop offset=".37" stopColor="#6fe4ff"/><stop offset=".68" stopColor="#2fc0e3" stopOpacity=".58"/><stop offset="1" stopColor="#11627b" stopOpacity="0"/></linearGradient>
          <filter id={ids.aura} x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation={compact ? 2.9 : 3.2}/></filter>
          <filter id={ids.glow} x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation={compact ? 0.58 : 0.72} result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>

        <motion.g data-brand-atmosphere aria-hidden="true" filter={`url(#${ids.aura})`} variants={{ idle: { opacity: compact ? 0.5 : 0.72, scale: 0.985 }, hover: { opacity: compact ? 0.76 : 0.96, scale: compact ? 1.025 : 1.045, transition: { duration: 0.92, ease: premiumEase } } }} style={{ transformOrigin: '48px 50px' }}>
          {atmosphereFills.map(([d, fill, opacity]) => <path key={d} d={d} fill={fill} fillOpacity={opacity}/>) }
          <g fill="none" strokeLinecap="round">{atmosphereStrokes.map(([d, stroke, opacity, width]) => <path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={compact ? width * 0.82 : width}/>)}</g>
        </motion.g>

        <motion.g data-brand-energy aria-hidden="true" fill="none" strokeLinecap="round" variants={{ idle: { opacity: compact ? 0.42 : 0.62 }, hover: { opacity: 1, transition: { duration: 0.82, ease: premiumEase } } }}>
          {energyPaths.map(([d, stroke, opacity, width]) => <path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={compact ? width * 0.88 : width}/>) }
        </motion.g>

        <motion.g data-brand-figure variants={{ idle: { y: 0 }, hover: { y: compact ? -0.08 : -0.22, transition: { duration: 0.74, ease: premiumEase } } }}>
          <path data-brand-cloak d={cloakPath} fill={`url(#${ids.cloak})`} stroke="#21475d" strokeOpacity=".5" strokeWidth={compact ? 0.68 : 0.75}/>
          <motion.g data-brand-folds variants={{ idle: { opacity: compact ? 0.96 : 1, scale: 1 }, hover: { opacity: 1, scale: compact ? 1.002 : 1.005, transition: { duration: 0.8, ease: premiumEase } } }} style={{ transformOrigin: '48px 72px' }}>
            {foldFills.map(([d, fill], index) => <motion.path key={d} d={d} fill={fill} variants={index < 2 ? { idle: { x: 0 }, hover: { x: compact ? 0 : index === 0 ? -0.14 : 0.12 } } : undefined}/>) }
            <g fill="none" strokeLinecap="round">{foldStrokes.map(([d, stroke, opacity, width]) => <path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={width}/>)}</g>
          </motion.g>

          <motion.path data-brand-hood d={hoodPath} fill={`url(#${ids.hood})`} stroke="#2e5f75" strokeOpacity=".8" strokeWidth={compact ? 0.82 : 0.9} variants={{ idle: { y: 0 }, hover: { y: compact ? -0.04 : -0.12 } }}/>
          <path d="M48 2.9C41.3 8.4 36.6 17 33.3 27.6C31.2 34.5 30.1 39.4 25.5 43.8C31.2 42.5 37.9 43.7 43 46.8C45.7 48.5 47.3 50.6 48.3 52.7C45.3 41.1 42.8 30.4 43 21C43.1 13.6 44.7 7.5 48 2.9Z" fill={`url(#${ids.hoodLeft})`} fillOpacity=".72"/>
          <path d="M48.2 2.9C54.7 8.1 59.6 16.6 62.7 27.1C64.8 34.1 65.8 39.3 70.4 43.7C64.8 42.8 58.9 43.8 53.8 46.9C51.3 48.5 49.6 50.6 48.3 52.8C51.2 41.2 53.2 30.1 53 21C52.9 13.7 51.4 7.6 48.2 2.9Z" fill="#061620" fillOpacity=".84"/>
          <path data-brand-face-void d={voidPath} fill="#000"/>

          <motion.g data-brand-collar variants={{ idle: { opacity: compact ? 0.96 : 1 }, hover: { opacity: 1, transition: { duration: 0.72, ease: premiumEase } } }}>
            {cowlPaths.map(([d, fill], index) => <motion.path key={d} d={d} fill={fill === 'cowlA' ? `url(#${ids.cowlA})` : fill === 'cowlB' ? `url(#${ids.cowlB})` : fill} variants={index < 2 ? { idle: { x: 0 }, hover: { x: compact ? 0 : index === 0 ? -0.08 : 0.07 } } : undefined}/>) }
          </motion.g>

          <g data-brand-texture aria-hidden="true" fill="none" strokeLinecap="round">
            {texturePaths.slice(0, compact ? 2 : texturePaths.length).map(([d, stroke, opacity, width]) => <path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={compact ? width * 0.9 : width}/>) }
          </g>

          <motion.g data-brand-rim-light aria-hidden="true" fill="none" strokeLinecap="round" filter={`url(#${ids.glow})`} variants={{ idle: { opacity: compact ? 0.82 : 0.9 }, hover: { opacity: 1, transition: { duration: 0.75, ease: premiumEase } } }}>
            {rimPaths.map(([d, stroke, opacity, width], index) => <motion.path key={d} d={d} stroke={stroke === 'rim' ? `url(#${ids.rim})` : stroke} strokeOpacity={opacity} strokeWidth={compact ? width * 0.88 : width} strokeLinecap={index === 0 ? 'butt' : 'round'} variants={index === 0 || index === 1 || index === 3 ? { idle: { pathLength: index === 0 ? 0.86 : 0.72 }, hover: { pathLength: 1 } } : undefined}/>) }
          </motion.g>
        </motion.g>
      </motion.svg>
    </motion.span>
  );
}
