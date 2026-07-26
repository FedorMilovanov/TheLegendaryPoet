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

const cloakPath = 'M24 42C17.8 44.3 13.4 49.2 10.3 57.2C7.1 65.7 4.5 76.5 5.1 84.8C5.6 90 9.4 92.6 15.7 93.8C26.1 95.8 37.4 94.3 48.2 95C60.7 94.4 72.1 95.1 81.9 92.9C87.8 91.6 90.5 87.8 89.2 81.5C86.9 70.2 83.3 59.2 78.2 51.5C74.7 46.2 70.6 42.8 64.3 40.6C58.5 38.6 53.7 37.8 48 37.8C39.3 37.7 30.8 39.2 24 42Z';
const hoodPath = 'M48 10.5C42.3 13.4 38 18.8 35.2 25.6C33.2 30.4 33.1 34.8 30.8 38.7C28.7 42.1 25.6 44.1 22.8 45.8C29 44.4 35.9 44.7 42.1 47.4C45.2 48.8 47.2 50.4 48.5 52.3C50.1 50.1 52.3 48.3 55.3 47C61.2 44.4 67.8 43.4 74.8 44.2C70.7 42 67.8 39.3 65.9 35.8C63.7 31.8 63.8 28.3 61.4 22.8C58.6 16.8 53.8 12.4 48 10.5Z';
const voidPath = 'M48.3 21.8C41.9 21.8 37.3 26.1 35.8 33C34.6 38.3 35.6 43.1 39.2 46.7C41.8 49.2 44.8 50.5 48 50.6C51.8 50.5 55.5 49 58.1 46.3C61.4 42.9 62.1 38.2 60.6 32.9C58.7 26.2 54.4 21.8 48.3 21.8Z';

const atmosphereFills = [
  ['M17 86C11 66 18 47 30 34C37 26 39 18 48 12C57 19 60 27 68 35C80 48 85 66 78 87C68 69 58 58 48 54C38 58 28 70 17 86Z', '#55dfff', 0.15],
  ['M4 91C8 69 17 51 31 39C20 58 16 76 15 95Z', '#49d5f2', 0.13],
  ['M92 91C88 70 79 51 65 39C76 59 80 78 81 95Z', '#1d9bb8', 0.075],
] as const;

const atmosphereStrokes = [
  ['M23 28C16 36 13 46 13 56', '#72e6ff', 0.18, 1.8],
  ['M73 27C80 36 83 46 84 58', '#31b1cf', 0.1, 1.5],
] as const;

const foldFills = [
  ['M5.8 88.5C9.5 70 17 54 29.5 44.3C24.2 59.4 21.5 77.5 22.5 95.2L13.4 94.8C8 94 4.9 91.8 5.8 88.5Z', '#123149'],
  ['M90.2 87.8C86.1 68.3 78.6 53.7 65.2 42.8C71.8 58.8 74.6 77.1 72.8 95.3L83.8 94.5C88 93.7 91 91 90.2 87.8Z', '#05131f'],
  ['M16.7 94.9C21.7 70.9 31.1 53.5 41.8 45C35.6 63.1 33.6 80.2 34.4 95.1Z', '#091d2c'],
  ['M79.3 94.8C74.2 70 65.1 53.7 54.5 44.7C60.9 62.9 63.1 80.1 61.9 95.1Z', '#01070c'],
  ['M30.4 95.2C34.1 73.4 40.2 56.7 46.6 47.4C43.7 65.3 43 81.4 43.3 95.4Z', '#040e17'],
  ['M66.3 95.2C62.4 73.1 56.3 56.4 49.8 47.1C53.1 65.4 53.5 81.5 53.2 95.4Z', '#000205'],
  ['M42.8 95.4C44.1 76.2 46.2 61.2 48.3 51.2C50.5 62.1 52.3 77 53.3 95.4Z', '#000102'],
] as const;

const foldStrokes = [
  ['M8.2 87C15.4 67.4 25.8 52.1 40.8 45.2C29.2 60.2 23.5 77.8 21.7 93.8', '#5fc8dc', 0.095, 0.52],
  ['M87.1 86.5C79.8 66.8 69.1 51.7 55.1 44.9C66.3 59.9 72.1 77.4 73.9 93.8', '#1c6678', 0.035, 0.42],
] as const;

const cowlPaths = [
  ['M21.2 45.7C31.5 42.9 40.1 44.5 50.3 49.2C59.8 53.6 67.4 55 74.9 52.1C70.8 57 64.9 59.2 58.2 58.3C47.8 56.9 39.4 51.8 29.4 50.7C25.9 50.3 23.1 48.6 21.2 45.7Z', 'cowlA'],
  ['M74.9 45.8C66.8 43.1 59.1 44.2 49.2 49.3C41.2 53.4 34.8 56.6 28.1 57.4C33.5 61.2 41.2 59.9 49.1 56.2C58.4 51.8 65.4 50.2 74.2 51.2C75 49.4 75.2 47.6 74.9 45.8Z', 'cowlB'],
  ['M31.4 53.4C38.4 51.4 43.7 51.8 48.2 53.7C52.9 52 58.4 52.2 64.9 54.6C59 54.9 53.5 56.8 48.1 59.6C42.6 56.9 37.1 54.9 31.4 53.4Z', '#02070d'],
  ['M38.5 57.2C42.3 55.9 45.6 56 48.2 56.9C50.9 56 54 56.1 57.5 57.4C53.5 58.1 50.4 59.2 48 60.9C45.3 59.1 42.1 57.8 38.5 57.2Z', '#000205'],
] as const;

const texturePaths = [
  ['M31.1 39.7C33.5 29 39.1 18.6 47.7 11.2', '#baf2fb', 0.17, 0.55],
  ['M64.7 39C62.3 28.8 56.7 18.7 48.3 11.1', '#2c8fa8', 0.075, 0.48],
  ['M35.6 30.3C38.1 22.9 42 16.8 47.8 12.2', '#ddfbff', 0.1, 0.43],
  ['M60.4 29.8C57.9 22.7 54 16.6 48.2 12', '#2c8197', 0.045, 0.38],
] as const;

const rimPaths = [
  ['M22.9 45.7C26.5 43.7 29.2 40.5 30.8 36.8', '#baf4ff', 0.72, 0.82],
  ['M32 32.2C34.3 22.7 39 13.9 47.8 10.7', 'rim', 1, 0.92],
  ['M48.1 10.8C53.8 13.5 58 18.2 60.5 24.6', '#70def4', 0.5, 0.66],
  ['M62.1 29.9C63 34.1 64.4 37 66.6 39.5', '#45b7d2', 0.22, 0.54],
  ['M69.8 42C72.2 43.4 74.6 44.1 77 44', '#2a9eba', 0.13, 0.48],
  ['M17.6 48.9C12.7 56.6 8.8 67.8 6 82.5', '#9eeefa', 0.25, 0.62],
  ['M5.6 86.2C5.3 88.1 5.2 89.7 5.2 91', '#46b9d3', 0.15, 0.5],
  ['M83.1 56.9C87 66.5 89.3 76.3 90 86', '#2387a1', 0.08, 0.42],
  ['M29.5 40.7C22.8 43.1 17.7 48.4 14.3 56.7C11.5 63.5 9.2 71.1 7.4 79.9', '#8ee9fb', 0.42, 0.78],
  ['M65.9 39.8C73.1 42.3 78.5 47.5 81.9 55.4C85 62.6 87 70.9 88.5 79.3', '#43bad5', 0.22, 0.64],
] as const;

const energyPaths = [
  ['M12.3 74C10.5 61.1 13.4 48.2 20.5 38.1', '#57d6ef', 0.17, 0.48],
  ['M83.8 72C85.8 60 82.8 48.2 75.8 38.1', '#258ba7', 0.085, 0.4],
  ['M18.4 36C14.7 31.1 15.4 26.5 20.2 22.3', '#6bdff6', 0.13, 0.42],
  ['M76 34C79.9 29.3 80 24.5 76.1 20.5', '#1f7d95', 0.065, 0.35],
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
      data-brand-vector-source="reference-derived-contours-v8-2"
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
          <linearGradient id={ids.cloak} x1="10" y1="40" x2="86" y2="94" gradientUnits="userSpaceOnUse"><stop stopColor="#17364d"/><stop offset=".18" stopColor="#0b2133"/><stop offset=".54" stopColor="#040d16"/><stop offset=".86" stopColor="#010408"/><stop offset="1" stopColor="#000103" stopOpacity=".38"/></linearGradient>
          <linearGradient id={ids.hood} x1="31" y1="12" x2="66" y2="50" gradientUnits="userSpaceOnUse"><stop stopColor="#21475f"/><stop offset=".22" stopColor="#112b40"/><stop offset=".58" stopColor="#061521"/><stop offset="1" stopColor="#010308"/></linearGradient>
          <linearGradient id={ids.hoodLeft} x1="29" y1="15" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#2b5369"/><stop offset=".55" stopColor="#102b3d"/><stop offset="1" stopColor="#040b12"/></linearGradient>
          <linearGradient id={ids.cowlA} x1="20" y1="44" x2="70" y2="59" gradientUnits="userSpaceOnUse"><stop stopColor="#1a394b"/><stop offset=".42" stopColor="#0e2738"/><stop offset=".76" stopColor="#05131e"/><stop offset="1" stopColor="#010307"/></linearGradient>
          <linearGradient id={ids.cowlB} x1="75" y1="44" x2="28" y2="61" gradientUnits="userSpaceOnUse"><stop stopColor="#102b3a"/><stop offset=".44" stopColor="#081d2b"/><stop offset=".8" stopColor="#020a11"/><stop offset="1" stopColor="#000104"/></linearGradient>
          <linearGradient id={ids.rim} x1="29" y1="11" x2="78" y2="72" gradientUnits="userSpaceOnUse"><stop stopColor="#f6ffff"/><stop offset=".13" stopColor="#c8f9ff"/><stop offset=".37" stopColor="#6fe4ff"/><stop offset=".68" stopColor="#2fc0e3" stopOpacity=".58"/><stop offset="1" stopColor="#11627b" stopOpacity="0"/></linearGradient>
          <filter id={ids.aura} x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation={compact ? 2.7 : 3.1}/></filter>
          <filter id={ids.glow} x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation={compact ? 0.5 : 0.58} result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>

        <motion.g data-brand-atmosphere aria-hidden="true" filter={`url(#${ids.aura})`} variants={{ idle: { opacity: compact ? 0.5 : 0.72, scale: 0.985 }, hover: { opacity: compact ? 0.76 : 0.96, scale: compact ? 1.025 : 1.045, transition: { duration: 0.92, ease: premiumEase } } }} style={{ transformOrigin: '48px 50px' }}>
          {atmosphereFills.map(([d, fill, opacity]) => <path key={d} d={d} fill={fill} fillOpacity={opacity}/>) }
          <g fill="none" strokeLinecap="round">{atmosphereStrokes.map(([d, stroke, opacity, width]) => <path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={compact ? width * 0.82 : width}/>)}</g>
        </motion.g>

        <motion.g data-brand-energy aria-hidden="true" fill="none" strokeLinecap="round" variants={{ idle: { opacity: compact ? 0.42 : 0.62 }, hover: { opacity: 1, transition: { duration: 0.82, ease: premiumEase } } }}>
          {energyPaths.map(([d, stroke, opacity, width]) => <path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={compact ? width * 0.88 : width}/>) }
        </motion.g>

        <motion.g data-brand-figure variants={{ idle: { y: 0 }, hover: { y: compact ? -0.08 : -0.22, transition: { duration: 0.74, ease: premiumEase } } }}>
          <path data-brand-cloak d={cloakPath} fill={`url(#${ids.cloak})`} stroke="#17384e" strokeOpacity=".52" strokeWidth={compact ? 0.62 : 0.68}/>
          <motion.g data-brand-folds variants={{ idle: { opacity: compact ? 0.96 : 1, scale: 1 }, hover: { opacity: 1, scale: compact ? 1.002 : 1.005, transition: { duration: 0.8, ease: premiumEase } } }} style={{ transformOrigin: '48px 72px' }}>
            {foldFills.map(([d, fill], index) => <motion.path key={d} d={d} fill={fill} variants={index < 2 ? { idle: { x: 0 }, hover: { x: compact ? 0 : index === 0 ? -0.14 : 0.12 } } : undefined}/>) }
            <g fill="none" strokeLinecap="round">{foldStrokes.map(([d, stroke, opacity, width]) => <path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={width}/>)}</g>
          </motion.g>

          <motion.path data-brand-hood d={hoodPath} fill={`url(#${ids.hood})`} stroke="#285169" strokeOpacity=".76" strokeWidth={compact ? 0.78 : 0.86} variants={{ idle: { y: 0 }, hover: { y: compact ? -0.04 : -0.12 } }}/>
          <path d="M48 10.8C42.8 15.8 38.9 22.5 36.4 30.3C34.9 35.1 33.7 39.6 29.8 43.6C34.3 42.8 39.6 44 44.1 47.2C46 48.6 47.3 50 48.5 52.1C46 42.7 43.2 34.5 43.1 26.9C43 20.9 44.5 15.5 48 10.8Z" fill={`url(#${ids.hoodLeft})`} fillOpacity=".62"/>
          <path d="M48.2 10.8C53.4 15.2 57.2 21.3 59.8 28.6C61.6 33.7 62.2 38 66.8 42.2C62 41.8 57.6 43.6 53.7 47C51.6 48.8 50 50.5 48.5 52.2C51 42.9 53.2 34.5 53.1 27C53 20.8 51.7 15.4 48.2 10.8Z" fill="#06131d" fillOpacity=".74"/>
          <path data-brand-face-void d={voidPath} fill="#000"/>

          <motion.g data-brand-collar variants={{ idle: { opacity: compact ? 0.96 : 1 }, hover: { opacity: 1, transition: { duration: 0.72, ease: premiumEase } } }}>
            {cowlPaths.map(([d, fill], index) => <motion.path key={d} d={d} fill={fill === 'cowlA' ? `url(#${ids.cowlA})` : fill === 'cowlB' ? `url(#${ids.cowlB})` : fill} variants={index < 2 ? { idle: { x: 0 }, hover: { x: compact ? 0 : index === 0 ? -0.08 : 0.07 } } : undefined}/>) }
          </motion.g>

          <g data-brand-texture aria-hidden="true" fill="none" strokeLinecap="round">
            {texturePaths.slice(0, compact ? 2 : texturePaths.length).map(([d, stroke, opacity, width]) => <path key={d} d={d} stroke={stroke} strokeOpacity={opacity} strokeWidth={compact ? width * 0.9 : width}/>) }
          </g>

          <motion.g data-brand-rim-light aria-hidden="true" fill="none" strokeLinecap="round" filter={`url(#${ids.glow})`} variants={{ idle: { opacity: compact ? 0.82 : 0.9 }, hover: { opacity: 1, transition: { duration: 0.75, ease: premiumEase } } }}>
            {rimPaths.map(([d, stroke, opacity, width], index) => <motion.path key={d} d={d} stroke={stroke === 'rim' ? `url(#${ids.rim})` : stroke} strokeOpacity={opacity} strokeWidth={compact ? width * 0.88 : width} strokeLinecap={index === 1 ? 'butt' : 'round'} variants={index === 0 || index === 1 || index === 8 ? { idle: { pathLength: index === 1 ? 0.84 : 0.72 }, hover: { pathLength: 1 } } : undefined}/>) }
          </motion.g>
        </motion.g>
      </motion.svg>
    </motion.span>
  );
}
