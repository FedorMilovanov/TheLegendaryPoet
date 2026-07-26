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

const cloakPath = 'M22 42C14.2 44.8 8.5 51.8 4.8 63.4C1.3 74.4 0.8 87 3.4 94.5C15.9 95.1 29.5 95.4 48 95.7C66.4 95.4 80 95.1 92.6 94.5C95.2 86.9 94.7 74.4 91.2 63.4C87.5 51.8 81.8 44.8 74 42C65.6 39 57.4 38.6 48 40.4C38.6 38.6 30.4 39 22 42Z';
const hoodPath = 'M48 3.2C40.4 6.2 35.2 14.6 31.5 25.1C28.7 33.1 28.5 38.3 23.1 44.7C30.4 42.7 37.4 43.4 42.9 46.5C45.5 48 47.2 50 48.2 52.2C49.6 49.8 51.6 47.8 54.5 46.2C60.1 43.1 66.8 42.4 73.6 44.1C68.7 38.3 68 32.9 65.2 24.9C61.6 14.5 55.8 6.3 48 3.2Z';
const voidPath = 'M48.2 17.2C40.7 17.2 35.6 22.2 33.7 30C31.9 37.5 33.5 43.7 38.3 47.8C41 50.1 44.4 51.4 48 51.5C52.3 51.4 56.4 49.8 59.2 46.9C63.2 42.8 64.2 36.5 62.1 29.6C59.8 22.1 55 17.2 48.2 17.2Z';

const atmosphereFills = [
  ['M12 91C9 67 17 47 30 34C37 27 39 14 48 5C57 14 60 27 67 34C80 47 87 67 84 91C72 70 59 57 48 54C37 57 24 70 12 91Z', '#55ddfb', 0.16],
  ['M2 94C7 70 16 52 31 40C20 60 16 77 15 96Z', '#3dd7f3', 0.14],
  ['M94 94C89 70 80 52 65 40C76 60 80 77 81 96Z', '#218aa5', 0.08],
] as const;

const atmosphereStrokes = [
  ['M18 42C12 49 9 58 8 68', '#7fe8fb', 0.22, 2.2],
  ['M78 42C84 49 87 58 88 69', '#2b9db9', 0.11, 1.7],
] as const;

const foldFills = [
  ['M3.8 93.8C8 72.9 17.4 54.9 31.2 44.3C24.7 61.9 21.8 79.1 22.3 95.1Z', '#153b56'],
  ['M92.2 93.8C88 72.9 78.6 54.9 64.8 44.3C71.3 61.9 74.2 79.1 73.7 95.1Z', '#04131f'],
  ['M19.1 95.2C24.2 70.9 33.1 53.5 42.6 45.6C37.8 62.9 35.3 79.3 35.3 95.5Z', '#0b2639'],
  ['M76.9 95.2C71.8 70.9 62.9 53.5 53.4 45.6C58.2 62.9 60.7 79.3 60.7 95.5Z', '#010810'],
  ['M34.6 95.5C38.3 72.6 43 56.5 47.5 47.3C45.4 65.5 44.4 81.1 44.2 95.6Z', '#04111c'],
  ['M61.4 95.5C57.7 72.6 53 56.5 48.5 47.3C50.6 65.5 51.6 81.1 51.8 95.6Z', '#000205'],
] as const;

const foldStrokes = [
  ['M7 88C15.2 67.5 27.4 52.7 42.1 45.6C30.2 60.7 23 77.4 20.8 94', '#62cadf', 0.1, 0.52],
  ['M89 88C80.8 67.5 68.6 52.7 53.9 45.6C65.8 60.7 73 77.4 75.2 94', '#1e6577', 0.04, 0.42],
] as const;

const cowlPaths = [
  ['M20 44.7C29.7 41.9 39.6 43.7 48.3 48.6C57.9 42.8 67 42 76 45.3C71.5 51.2 64.4 55 55.9 57.6C52.7 58.6 50.1 59.8 48 61.1C45.5 59.6 42.7 58.3 39.3 57.2C31 54.4 24.5 50.6 20 44.7Z', 'cowlA'],
  ['M25.6 49.8C34.8 48.5 41.8 50.5 48.2 54.4C55 50.1 62.6 48.6 70.8 50.4C65.3 55.3 57.7 59.3 48 63.5C38.7 59.6 31.2 55.5 25.6 49.8Z', 'cowlB'],
  ['M34 55.5C39.6 54.1 44.3 54.6 48.1 56.5C52 54.6 56.5 54.3 61.8 55.9C56.4 58.1 51.8 60.7 48 63.9C44 60.8 39.3 58 34 55.5Z', '#000307'],
] as const;

const texturePaths = [
  ['M31.7 36.8C33.8 24.3 39.1 11.8 47.7 4', '#d6faff', 0.15, 0.5],
  ['M64.2 36.4C62.1 24.2 56.8 11.8 48.3 4', '#3ba8bf', 0.06, 0.45],
] as const;

const rimPaths = [
  ['M23.5 44.4C27.7 40.2 29.2 35.7 31 28.6C33.7 17.7 39 7.2 47.8 3.5', 'rim', 1, 1.18],
  ['M48.2 3.6C55.1 6.6 60.6 15.7 64.1 27.4', '#83e8fa', 0.48, 0.7],
  ['M65.5 32.3C66.4 37.3 68.3 40.4 72.3 43.5', '#44b8d2', 0.23, 0.56],
  ['M18.9 45.6C11.9 51.8 7.3 63.6 4.2 82.9', '#9decfb', 0.38, 0.78],
  ['M3.9 87C3.5 89.4 3.4 91.4 3.5 93.3', '#52c8e1', 0.2, 0.62],
  ['M77.1 45.4C84.1 51.7 88.7 63.6 91.8 82.7', '#2c95ae', 0.12, 0.55],
] as const;

const energyPaths = [
  ['M13.6 73C11.5 59.2 14.7 46.5 21.5 37.1', '#55d6ef', 0.2, 0.48],
  ['M82.4 73C84.5 59.2 81.3 46.5 74.5 37.1', '#288ba5', 0.09, 0.4],
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
      data-brand-vector-source="reference-derived-contours-v8-3"
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
          <linearGradient id={ids.cloak} x1="5" y1="43" x2="89" y2="95" gradientUnits="userSpaceOnUse"><stop stopColor="#173c57"/><stop offset=".18" stopColor="#0b2639"/><stop offset=".54" stopColor="#04121e"/><stop offset=".86" stopColor="#010408"/><stop offset="1" stopColor="#000103" stopOpacity=".38"/></linearGradient>
          <linearGradient id={ids.hood} x1="28" y1="3" x2="68" y2="53" gradientUnits="userSpaceOnUse"><stop stopColor="#28546c"/><stop offset=".22" stopColor="#15374e"/><stop offset=".58" stopColor="#081c2a"/><stop offset="1" stopColor="#010308"/></linearGradient>
          <linearGradient id={ids.hoodLeft} x1="28" y1="3" x2="49" y2="53" gradientUnits="userSpaceOnUse"><stop stopColor="#214b63"/><stop offset=".55" stopColor="#123246"/><stop offset="1" stopColor="#040b12"/></linearGradient>
          <linearGradient id={ids.cowlA} x1="19" y1="44" x2="76" y2="61" gradientUnits="userSpaceOnUse"><stop stopColor="#1d465d"/><stop offset=".42" stopColor="#0f3044"/><stop offset=".76" stopColor="#061a27"/><stop offset="1" stopColor="#010307"/></linearGradient>
          <linearGradient id={ids.cowlB} x1="71" y1="49" x2="25" y2="64" gradientUnits="userSpaceOnUse"><stop stopColor="#102e42"/><stop offset=".44" stopColor="#071d2b"/><stop offset=".8" stopColor="#020a11"/><stop offset="1" stopColor="#000104"/></linearGradient>
          <linearGradient id={ids.rim} x1="24" y1="4" x2="13" y2="88" gradientUnits="userSpaceOnUse"><stop stopColor="#f6ffff"/><stop offset=".13" stopColor="#c8f9ff"/><stop offset=".37" stopColor="#6fe4ff"/><stop offset=".68" stopColor="#2fc0e3" stopOpacity=".58"/><stop offset="1" stopColor="#11627b" stopOpacity="0"/></linearGradient>
          <filter id={ids.aura} x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation={compact ? 3.0 : 3.6}/></filter>
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
          <path d="M48 3.6C41.8 9.3 37.5 17.7 34.7 27.8C32.9 34.4 31.8 39.3 27.8 43.7C33 42.9 38.8 44.4 43.4 47.3C45.7 48.8 47.2 50.4 48.2 52.1C45.5 41.4 42.9 31.3 43.1 22.3C43.2 14.7 44.8 8.5 48 3.6Z" fill={`url(#${ids.hoodLeft})`} fillOpacity=".72"/>
          <path d="M48.1 3.7C54.2 9.2 58.6 17.5 61.2 27.4C63 34 64 39.2 68.1 43.3C62.9 42.8 57.7 44.3 53.4 47.4C51.2 49 49.5 50.6 48.2 52.2C51 41.5 53.1 31.1 52.9 22.2C52.8 14.8 51.2 8.6 48.1 3.7Z" fill="#061622" fillOpacity=".82"/>
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
