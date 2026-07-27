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
const VECTOR_SOURCE = 'canonical-reference-reset-v9-0';

export default function BrandMark({ size = 'sm', className }: BrandMarkProps) {
  const reducedMotion = useReducedMotion();
  const compact = size === 'sm';
  const id = useId().replace(/:/g, '');
  const ids = {
    title: `${id}-brand-title`, description: `${id}-brand-description`, cloak: `${id}-cloak`,
    hood: `${id}-hood`, aura: `${id}-aura`, mist: `${id}-mist`, glow: `${id}-glow`,
  };

  return (
    <motion.span data-brand-mark data-brand-version={BRAND_VERSION} data-brand-renderer="inline-vector"
      data-brand-vector-source={VECTOR_SOURCE}
      className={cn('relative inline-flex shrink-0 items-center justify-center overflow-visible', sizes[size], className)}
      initial={false} animate="idle" whileHover={reducedMotion ? undefined : 'hover'}>
      <motion.svg data-brand-vector className="h-full w-full overflow-visible" viewBox="0 0 96 96" role="img"
        aria-labelledby={`${ids.title} ${ids.description}`} focusable="false" style={{ pointerEvents: 'none' }}
        variants={{
          idle: { y: 0, scale: 1, filter: compact ? 'drop-shadow(0 3px 6px rgba(0,4,13,.82)) drop-shadow(0 0 6px rgba(46,216,255,.18))' : 'drop-shadow(0 5px 12px rgba(0,4,13,.84)) drop-shadow(0 0 10px rgba(46,216,255,.19))' },
          hover: { y: compact ? -0.5 : -0.8, scale: compact ? 1.018 : 1.025, filter: compact ? 'drop-shadow(0 5px 10px rgba(0,7,18,.86)) drop-shadow(0 0 10px rgba(65,220,255,.28))' : 'drop-shadow(0 8px 18px rgba(0,7,18,.88)) drop-shadow(0 0 16px rgba(65,220,255,.29))', transition: { duration: 0.78, ease: premiumEase } },
        }}>
        <title id={ids.title}>THE LEGENDARY POET</title>
        <desc id={ids.description}>Безликая фигура в компактном остром капюшоне, с широкой пустотой лица, тяжёлым перекрёстным воротом и диагональной мантией</desc>
        <defs>
          <linearGradient id={ids.cloak} x1="8" y1="40" x2="88" y2="96" gradientUnits="userSpaceOnUse"><stop stopColor="#123247"/><stop offset=".32" stopColor="#06141f"/><stop offset=".7" stopColor="#01060b"/><stop offset="1" stopColor="#000205"/></linearGradient>
          <linearGradient id={ids.hood} x1="32" y1="9" x2="64" y2="43" gradientUnits="userSpaceOnUse"><stop stopColor="#183d54"/><stop offset=".42" stopColor="#082131"/><stop offset="1" stopColor="#01050a"/></linearGradient>
          <radialGradient id={ids.aura} cx="50%" cy="45%" r="60%"><stop offset=".2" stopColor="#b8faff" stopOpacity=".25"/><stop offset=".48" stopColor="#43dfff" stopOpacity=".22"/><stop offset="1" stopColor="#006eaa" stopOpacity="0"/></radialGradient>
          <filter id={ids.mist} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation={compact ? 3 : 4.6}/></filter>
          <filter id={ids.glow} x="-130%" y="-130%" width="360%" height="360%"><feGaussianBlur stdDeviation={compact ? 0.5 : 0.8} result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <motion.g data-brand-atmosphere aria-hidden="true" filter={`url(#${ids.mist})`}
          variants={{ idle: { opacity: compact ? 0.56 : 0.76, scale: 0.985 }, hover: { opacity: 1, scale: 1.035, transition: { duration: 0.9, ease: premiumEase } } }} style={{ transformOrigin: '48px 48px' }}>
          <path d="M5 94C7 69 18 49 30 38C37 30 40 16 48 6C56 16 59 30 66 38C78 49 89 69 91 94C76 81 64 63 48 54C32 63 20 81 5 94Z" fill={`url(#${ids.aura})`}/>
          <path d="M11 85C7 69 13 55 24 44C29 39 31 31 31 23C22 34 16 48 13 59C9 69 8 78 11 85Z" fill="#2ed8ff" fillOpacity=".12"/>
          <path d="M85 85C89 69 83 55 72 44C67 39 65 31 65 23C74 34 80 48 83 59C87 69 88 78 85 85Z" fill="#24cfff" fillOpacity=".1"/>
          <path d="M13 78C7 67 10 58 17 51C23 45 23 38 20 33C17 28 19 23 24 20" fill="none" stroke="#49dcff" strokeOpacity=".18" strokeWidth=".8" strokeLinecap="round"/>
          <path d="M83 78C89 67 86 58 79 51C73 45 73 38 76 33C79 28 77 23 72 20" fill="none" stroke="#3bd3ff" strokeOpacity=".14" strokeWidth=".72" strokeLinecap="round"/>
        </motion.g>
        <motion.g data-brand-energy aria-hidden="true" fill="none" strokeLinecap="round"
          variants={{ idle: { opacity: compact ? 0.4 : 0.62 }, hover: { opacity: 1, transition: { duration: 0.78, ease: premiumEase } } }}>
          <path d="M20 43L17 39L19 35L16 31" stroke="#b3f8ff" strokeOpacity=".24" strokeWidth=".3"/>
          <path d="M76 43L79 39L77 35L80 31" stroke="#8ef1ff" strokeOpacity=".19" strokeWidth=".28"/>
          <path d="M30 20L28 17L31 13" stroke="#d8fdff" strokeOpacity=".2" strokeWidth=".25"/>
          <path d="M66 20L68 17L65 13" stroke="#9ef4ff" strokeOpacity=".16" strokeWidth=".23"/>
        </motion.g>
        <motion.g data-brand-figure variants={{ idle: { y: 0 }, hover: { y: compact ? -0.08 : -0.2, transition: { duration: 0.74, ease: premiumEase } } }}>
          <path data-brand-cloak d="M48 36.8C40.5 36.8 34.2 38.8 28.3 42C21.6 45.8 17.5 51.7 14 60.4L4.8 80C2.6 84.8 1.4 89 2.6 92.8C12.8 95.2 23.3 94.2 32.2 95.1C39.3 95.8 44.3 94.2 48 91.4C51.7 94.2 56.7 95.8 63.8 95.1C72.7 94.2 83.2 95.2 93.4 92.8C94.6 89 93.4 84.8 91.2 80L82 60.4C78.5 51.7 74.4 45.8 67.7 42C61.8 38.8 55.5 36.8 48 36.8Z" fill={`url(#${ids.cloak})`} stroke="#24576d" strokeOpacity=".52" strokeWidth=".52"/>
          <motion.g data-brand-folds variants={{ idle: { opacity: compact ? 0.9 : 1 }, hover: { opacity: 1 } }}>
            <path d="M3 96C8.5 78.5 17 61.5 31.2 45.8C35.2 42.4 40.2 43.1 46.1 48.4C31 61.6 21.2 77.4 16 96Z" fill="#0d2a3b"/>
            <path d="M12.5 96C19.2 76.2 30.4 58.8 45.8 49.6C35.5 63.8 30.5 79.4 29.2 96Z" fill="#0a2231"/>
            <path d="M26 96C31.2 77.5 38.4 62 46.9 51.7C41.8 68.4 39.2 83.2 39.5 96Z" fill="#06151f"/>
            <path d="M93 96C87.5 78.5 79 61.5 64.8 45.8C60.8 42.4 55.8 43.1 49.9 48.4C65 61.6 74.8 77.4 80 96Z" fill="#01050a"/>
            <path d="M83.5 96C76.8 76.2 65.6 58.8 50.2 49.6C60.5 63.8 65.5 79.4 66.8 96Z" fill="#030b12"/>
            <path d="M70 96C64.8 77.5 57.6 62 49.1 51.7C54.2 68.4 56.8 83.2 56.5 96Z" fill="#01060b"/>
            <path d="M41.5 96C42.6 75.2 44.8 59.3 47 52.5C47.8 67.5 47.1 82.5 46.4 96Z" fill="#081b26" fillOpacity=".56"/>
            <path d="M54.5 96C53.4 75.2 51.2 59.3 49 52.5C48.2 67.5 48.9 82.5 49.6 96Z" fill="#000307"/>
            <path d="M46.4 96C46.7 74.7 47.3 59.5 48 53.4C48.7 59.5 49.3 74.7 49.6 96Z" fill="#000104"/>
          </motion.g>
          <motion.g data-brand-collar variants={{ idle: { opacity: compact ? 0.78 : 0.96 }, hover: { opacity: 1, transition: { duration: 0.72, ease: premiumEase } } }}>
            <path d="M25.6 39.8C33.4 39.8 39.9 42.3 46.7 46.7C50.1 48.9 53.6 49.8 58.4 49C54.9 52.4 50.5 54 45.5 53.2C37.8 51.9 30.7 47.1 25.6 39.8Z" fill="#123044"/>
            <path d="M70.4 39.8C62.6 39.8 56.1 42.3 49.3 46.7C45.9 48.9 42.4 49.8 37.6 49C41.1 52.4 45.5 54 50.5 53.2C58.2 51.9 65.3 47.1 70.4 39.8Z" fill="#06131d"/>
            <path d="M23.8 43C32.5 42.4 39.8 45.3 47 50C48.5 51 50 51.6 52 51.9C46 55.2 39.5 54.9 33.5 51.5C29.4 49.2 26.1 46.4 23.8 43Z" fill="#17384c" fillOpacity=".9"/>
            <path d="M72.2 43C63.5 42.4 56.2 45.3 49 50C47.5 51 46 51.6 44 51.9C50 55.2 56.5 54.9 62.5 51.5C66.6 49.2 69.9 46.4 72.2 43Z" fill="#02080e"/>
            <path d="M31 48.7C37.5 49.1 42.3 50.8 47 54C48.4 55 49.7 55 51 54C55.7 50.8 60.5 49.1 67 48.7C62.6 54.6 56.3 57.5 48 57.9C39.7 57.5 35.4 54.6 31 48.7Z" fill="#030b12"/>
          </motion.g>
          <motion.path data-brand-hood d="M48 9.7C42.3 11.8 39 18.1 37.4 25C36.2 30.2 34.2 34.5 32.2 37.9C36.7 37.8 40.8 39.1 44.5 40.4C46.1 41.1 47.3 41.8 48 42.4C48.8 41.8 50 41.1 51.5 40.4C55.2 39.1 59.3 37.8 63.8 37.9C61.8 34.5 59.8 30.2 58.6 25C57 18.1 53.7 11.8 48 9.7Z" fill={`url(#${ids.hood})`} stroke="#3d859a" strokeOpacity=".58" strokeWidth=".6" variants={{ idle: { y: 0 }, hover: { y: compact ? -0.04 : -0.1 } }}/>
          <g data-brand-hood-layers>
            <path d="M48 10.9C44.1 13.6 41.5 18.9 40.1 24.9C39 29.5 37.2 33.4 35.2 36.2C39.4 36.5 43.4 39 47.8 43.8C46 34.9 45.1 27.1 45.9 19.7C46.3 15.7 47.1 12.3 48 10.9Z" fill="#15364b"/>
            <path d="M48 10.9C51.9 13.6 54.5 18.9 55.9 24.9C57 29.5 58.8 33.4 60.8 36.2C56.6 36.5 52.6 39 48.2 43.8C50 34.9 50.9 27.1 50.1 19.7C49.7 15.7 48.9 12.3 48 10.9Z" fill="#020912"/>
            <path d="M48 12.3C44.9 14.8 42.6 18.9 41.2 24C43.3 21.8 45.6 20.2 48 19.3C50.4 20.2 52.7 21.8 54.8 24C53.4 18.9 51.1 14.8 48 12.3Z" fill="#0c2333"/>
          </g>
          <path data-brand-face-void d="M48 17.7C43.9 18.3 40.7 21.6 38.2 25.8L35.2 32.6C37 35.3 41.5 37.9 48 40.5C54.5 37.9 59 35.3 60.8 32.6L57.8 25.8C55.3 21.6 52.1 18.3 48 17.7Z" fill="#000"/>
          <g data-brand-face-depth><path d="M38.2 25.8C40.4 22.1 43.3 19.2 46.7 18.1C43.9 22 42.2 25.7 42.2 29.3C42.2 33.2 44.4 36.9 47.8 40.4C42 38.1 37.9 35.2 35.2 32.6Z" fill="#01060b"/><path d="M57.8 25.8C55.6 22.1 52.7 19.2 49.3 18.1C52.1 22 53.8 25.7 53.8 29.3C53.8 33.2 51.6 36.9 48.2 40.4C54 38.1 58.1 35.2 60.8 32.6Z" fill="#000204"/></g>
          <g data-brand-texture fill="none" strokeLinecap="round">
            <path d="M5.5 91C12.8 73.5 25.5 57.2 45.3 49.4" stroke="#8ad8e7" strokeOpacity=".17" strokeWidth=".48"/><path d="M13.5 96C20.5 76.5 31.5 60.5 46 50.8" stroke="#72c7d8" strokeOpacity=".14" strokeWidth=".43"/><path d="M25 96C30.8 77.5 38 62 47 52" stroke="#65b3c3" strokeOpacity=".12" strokeWidth=".38"/><path d="M90.5 91C83.2 73.5 70.5 57.2 50.7 49.4" stroke="#347a8d" strokeOpacity=".07" strokeWidth=".42"/><path d="M82.5 96C75.5 76.5 64.5 60.5 50 50.8" stroke="#235d70" strokeOpacity=".055" strokeWidth=".38"/>
          </g>
          <motion.g data-brand-rim-light fill="none" strokeLinejoin="round" strokeLinecap="round" filter={`url(#${ids.glow})`}
            variants={{ idle: { opacity: compact ? 0.78 : 0.9 }, hover: { opacity: 1, transition: { duration: 0.74, ease: premiumEase } } }}>
            <path d="M32.2 37.9C34.2 34.5 36.2 30.2 37.4 25C39 18.1 42.3 11.8 48 9.7" stroke="#f1ffff" strokeOpacity=".9" strokeWidth=".7"/>
            <path d="M48 9.7C53.7 11.8 57 18.1 58.6 25C59.8 30.2 61.8 34.5 63.8 37.9" stroke="#a7f3ff" strokeOpacity=".78" strokeWidth=".64"/>
            <path d="M32.2 37.9C31.1 39.5 29.7 41.2 28.3 42C21.6 45.8 17.8 51.6 14.2 60.2L5 80C2.4 85.7 1 90.9 1.6 96" stroke="#c6faff" strokeOpacity=".66" strokeWidth=".62"/>
            <path d="M63.8 37.9C64.9 39.5 66.3 41.2 67.7 42C74.4 45.8 78.2 51.6 81.8 60.2L91 80C93.6 85.7 95 90.9 94.4 96" stroke="#7ee8ff" strokeOpacity=".52" strokeWidth=".58"/>
          </motion.g>
          <motion.g data-brand-seams fill="none" strokeLinecap="round"
            variants={{ idle: { opacity: compact ? 0.48 : 0.72 }, hover: { opacity: compact ? 0.7 : 0.94, transition: { duration: 0.78, ease: premiumEase } } }}>
            <path d="M18 62C27.3 53.6 36.3 49.2 46.2 51.3" stroke="#b1edf5" strokeOpacity=".11" strokeWidth=".4"/><path d="M78 62C68.7 53.6 59.7 49.2 49.8 51.3" stroke="#36798b" strokeOpacity=".05" strokeWidth=".35"/><path d="M11 78C22.3 64.8 34.1 56.3 46.5 53.1" stroke="#84cfdd" strokeOpacity=".085" strokeWidth=".38"/><path d="M85 78C73.7 64.8 61.9 56.3 49.5 53.1" stroke="#285f71" strokeOpacity=".04" strokeWidth=".33"/>
          </motion.g>
        </motion.g>
      </motion.svg>
    </motion.span>
  );
}
