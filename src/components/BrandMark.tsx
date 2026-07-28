import { useId, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../utils/cn';

interface BrandMarkProps { size?: 'sm' | 'md' | 'lg'; className?: string; }
const sizes = { sm: 'h-12 w-12', md: 'h-16 w-16', lg: 'h-24 w-24' };
const premiumEase = [0.16, 1, 0.3, 1] as const;
const BRAND_VERSION = 'cloak-20260728-11';
const VECTOR_SOURCE = 'canonical-reference-v2-reset-v11-2';

const VECTOR_BODY = `<defs>
  <linearGradient id="__CLOAK__" x1="18" y1="41" x2="71" y2="96" gradientUnits="userSpaceOnUse"><stop stop-color="#0c2531"/><stop offset=".22" stop-color="#071923"/><stop offset=".5" stop-color="#020a10"/><stop offset=".78" stop-color="#010407"/><stop offset="1" stop-color="#000103"/></linearGradient>
  <linearGradient id="__HOOD__" x1="37" y1="10" x2="59" y2="43" gradientUnits="userSpaceOnUse"><stop stop-color="#1d4659"/><stop offset=".25" stop-color="#0d2e3f"/><stop offset=".57" stop-color="#051923"/><stop offset=".82" stop-color="#01090e"/><stop offset="1" stop-color="#000204"/></linearGradient>
  <linearGradient id="__LEFTFOLD__" x1="15" y1="52" x2="44" y2="96" gradientUnits="userSpaceOnUse"><stop stop-color="#0f3040"/><stop offset=".48" stop-color="#061722"/><stop offset="1" stop-color="#010408"/></linearGradient>
  <linearGradient id="__RIGHTFOLD__" x1="78" y1="52" x2="52" y2="96" gradientUnits="userSpaceOnUse"><stop stop-color="#09222f"/><stop offset=".48" stop-color="#030d14"/><stop offset="1" stop-color="#000205"/></linearGradient>
  <filter id="__BLUR5__" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4.8"/></filter>
  <filter id="__BLUR2__" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.1"/></filter>
  <filter id="__BLUR1__" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation=".72"/></filter>
  <filter id="__GLOW__" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="1.0" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<g data-brand-atmosphere="" aria-hidden="true" fill="none" stroke-linecap="round">
  <path d="M18 70C11 60 14 49 23 41M23 35C19 29 22 23 29 18M31 14C34 10 34 6 32 3" stroke="#74e4ff" stroke-opacity=".13" stroke-width="1.35" filter="url(#__BLUR2__)"/>
  <path d="M78 70C85 60 82 49 73 41M73 35C77 29 74 23 67 18M65 14C62 10 62 6 64 3" stroke="#5bdcff" stroke-opacity=".11" stroke-width="1.25" filter="url(#__BLUR2__)"/>
  <path d="M26 57C19 48 22 39 30 33M31 27C28 22 32 17 37 14" stroke="#c7f9ff" stroke-opacity=".10" stroke-width=".46" filter="url(#__BLUR1__)"/>
  <path d="M70 57C77 48 74 39 66 33M65 27C68 22 64 17 59 14" stroke="#a1f1ff" stroke-opacity=".085" stroke-width=".42" filter="url(#__BLUR1__)"/>
</g>
<g data-brand-energy="" aria-hidden="true" fill="none" stroke-linecap="round">
  <path d="M20 48L17 44L20 40" stroke="#e8ffff" stroke-opacity=".08" stroke-width=".2"/>
  <path d="M76 48L79 44L76 40" stroke="#b8f5ff" stroke-opacity=".07" stroke-width=".18"/>
  <path d="M36 11L33 8L36 5" stroke="#f4ffff" stroke-opacity=".10" stroke-width=".18"/>
  <path d="M60 11L63 8L60 5" stroke="#d0faff" stroke-opacity=".085" stroke-width=".17"/>
</g>
<g data-brand-figure="">
  <path data-brand-cloak="" d="M48 37C40.6 37 34.2 38.8 28.8 42.2L18.6 52.5L7.1 82.4C5.2 87.4 5.3 91.6 7.6 94.7C18.8 95.6 30.4 95.9 40.7 95.6C44.1 95.5 46.7 94.6 48 93C49.5 94.5 52 95.4 55.5 95.6C66 96 77.4 95.6 88.4 94.6C90.5 91.4 90.4 87.2 88.5 82.1L77.4 52.4L67.2 42C61.8 38.7 55.4 37 48 37Z" fill="url(#__CLOAK__)" stroke="#214c5e" stroke-opacity=".36" stroke-width=".48"/>
  <g data-brand-folds="">
    <path d="M8.2 95.5C12.2 78.7 19.6 60.5 30.2 46.4C34.1 41.2 38.5 42 44.4 47.3C35.4 57.6 27.7 72.8 21.2 95.8Z" fill="#020d14"/>
    <path d="M15.1 95.8C20.5 77.1 29.3 60.4 42.2 48.4C34.8 62.8 30.6 78.1 30.2 95.9Z" fill="url(#__LEFTFOLD__)" opacity=".30"/>
    <path d="M25 95.9C28.9 77.7 35.1 62.4 44.7 51.1C39 67.2 36.8 82 37.2 96Z" fill="#061720" fill-opacity=".58"/>
    <path d="M36.8 96C38.2 79.9 42 64.8 47 53.4C44.6 69 43.9 83.3 44.4 96Z" fill="#02090f"/>
    <path d="M87.8 95.5C83.8 78.7 76.4 60.5 65.8 46.4C61.9 41.2 57.5 42 51.6 47.3C60.6 57.6 68.3 72.8 74.8 95.8Z" fill="#000408"/>
    <path d="M80.9 95.8C75.5 77.1 66.7 60.4 53.8 48.4C61.2 62.8 65.4 78.1 65.8 95.9Z" fill="url(#__RIGHTFOLD__)" opacity=".24"/>
    <path d="M71 95.9C67.1 77.7 60.9 62.4 51.3 51.1C57 67.2 59.2 82 58.8 96Z" fill="#00060a"/>
    <path d="M59.2 96C57.8 79.9 54 64.8 49 53.4C51.4 69 52.1 83.3 51.6 96Z" fill="#000205"/>
    <path d="M10.5 86.8C18.7 69.5 29.5 56.2 43.5 49.8C33.9 61.3 25.7 76.1 18.7 94.8Z" fill="#174252" fill-opacity=".07"/>
    <path d="M85.5 86.8C77.3 69.5 66.5 56.2 52.5 49.8C62.1 61.3 70.3 76.1 77.3 94.8Z" fill="#0b2b38" fill-opacity=".04"/>
    <path d="M29.6 57.1C35.2 53.2 40.4 51.9 45.2 52.7C40.7 57.2 36.7 62.8 33.2 69.6C33 64.2 31.8 60 29.6 57.1Z" fill="#0b2632" fill-opacity=".2"/>
    <path d="M66.4 57.1C60.8 53.2 55.6 51.9 50.8 52.7C55.3 57.2 59.3 62.8 62.8 69.6C63 64.2 64.2 60 66.4 57.1Z" fill="#02090e" fill-opacity=".42"/>
  </g>
  <path data-brand-hood="" d="M48 10.2C42.7 11.9 39.6 17.7 38.1 24.1C36.9 29.1 35.1 33.7 32.8 38C37.2 38 41.1 39.3 44.7 41.7C46.3 42.8 47.4 43.9 48 44.6C48.6 43.9 49.7 42.8 51.3 41.7C54.9 39.3 58.8 38 63.2 38C60.9 33.7 59.1 29.1 57.9 24.1C56.4 17.7 53.3 11.9 48 10.2Z" fill="url(#__HOOD__)" stroke="#397d91" stroke-opacity=".48" stroke-width=".52"/>
  <g data-brand-hood-layers="">
    <path d="M48 9.8C44 12.1 41.2 16.9 39.5 22.6C38.2 27.1 36.4 31.2 34.2 35C38.6 35.2 42.5 38.1 47.7 44.8C46 34.9 45.7 27 46.5 19.6C46.9 15.4 47.6 11.8 48 9.8Z" fill="#163c50"/>
    <path d="M48 9.8C52 12.1 54.8 16.9 56.5 22.6C57.8 27.1 59.6 31.2 61.8 35C57.4 35.2 53.5 38.1 48.3 44.8C50 34.9 50.3 27 49.5 19.6C49.1 15.4 48.4 11.8 48 9.8Z" fill="#01070c"/>
    <path d="M48 11.1C44.8 13.3 42.3 16.8 40.5 21.2C42.6 19.4 45.1 18 48 17.2C50.9 18 53.4 19.4 55.5 21.2C53.7 16.8 51.2 13.3 48 11.1Z" fill="#0a2735"/>
    <path d="M48 12.8C45.8 14 44 15.8 42.6 18.2C44.3 17.3 46.1 16.8 48 16.5C49.9 16.8 51.7 17.3 53.4 18.2C52 15.8 50.2 14 48 12.8Z" fill="#05141d"/>
    <path d="M40.2 23.2C42.2 18.4 44.8 14.8 48 12.5C51.2 14.8 53.8 18.4 55.8 23.2" fill="none" stroke="#a6e9f3" stroke-opacity=".2" stroke-width=".42"/>
  </g>
  <path data-brand-face-void="" d="M48 18C44.5 18.5 41.8 21.1 40.2 24.8L38.8 29.2C40.3 32.8 43.5 35.3 48 35.9C52.3 35.2 55.5 32.7 57.2 29.1L55.8 24.8C54.2 21.1 51.5 18.5 48 18Z" fill="#000"/>
  <g data-brand-face-depth="">
    <path d="M48 17.5C44.2 18.1 41.1 20.4 39.4 23.8L36.9 31.2C39.6 35.1 42.4 37.4 45.7 38.4C43.1 34.9 42 31.8 42.5 28.5C43 24.5 44.9 20.9 48 17.5Z" fill="#010408"/>
    <path d="M48 17.5C51.8 18.1 54.9 20.4 56.6 23.8L59.1 31.2C56.4 35.1 53.6 37.4 50.3 38.4C52.9 34.9 54 31.8 53.5 28.5C53 24.5 51.1 20.9 48 17.5Z" fill="#000102"/>
  </g>
  <path data-brand-neck-shadow="" d="M38.9 36.6C44.2 38.4 51.8 38.4 57.1 36.6C62.1 37.8 66.6 39.8 70.4 42.7C64.1 48 56.6 50.4 48 50.2C39.4 50.4 31.9 48 25.6 42.7C29.4 39.8 33.9 37.8 38.9 36.6Z" fill="#01060b"/>
  <g data-brand-collar="">
    <path d="M25.7 41.2C32.6 37.9 39.4 38.3 47.8 42.6C56.2 38.3 63 37.9 70.3 41.2C64.8 46 57.7 48.2 48 48C38.3 48.2 31.2 46 25.7 41.2Z" fill="#061923"/>
    <path d="M27.2 43.8C34 41 40.1 42 47.8 46.1C55.5 42 61.8 41 68.8 43.8C63.3 48.5 56.4 50.5 48 50.3C39.6 50.5 32.7 48.5 27.2 43.8Z" fill="#04131b"/>
    <path d="M30.8 46.6C36.2 44.8 41.1 45.8 47.7 49.1C54.3 45.8 59.4 44.8 65.2 46.6C60.5 50.6 54.8 52.2 48 52.1C41.2 52.2 35.5 50.6 30.8 46.6Z" fill="#020b11"/>
    <path d="M27.6 41.1C33.6 39.2 39.1 40.2 45.2 43.6C40 43.8 35.1 43 30.4 41.5Z" fill="#0b2a36" fill-opacity=".75"/>
    <path d="M68.4 41.1C62.4 39.2 56.9 40.2 50.8 43.6C56 43.8 60.9 43 65.6 41.5Z" fill="#01070d"/>
    <path d="M31 44.2C36.2 42.8 40.8 43.9 46 46.8C41.5 47 37.2 46.3 33.3 44.8Z" fill="#0a2631" fill-opacity=".6"/>
    <path d="M65 44.2C59.8 42.8 55.2 43.9 50 46.8C54.5 47 58.8 46.3 62.7 44.8Z" fill="#00050a"/>
  </g>
  <g data-brand-texture="" fill="none" stroke-linecap="round">
    <path d="M8.7 88C17.1 68.9 28.2 55.8 43.4 49.1" stroke="#88d4df" stroke-opacity=".105" stroke-width=".42"/>
    <path d="M15.7 95C21.7 76.6 31 61 44.8 51.2" stroke="#5cb2c1" stroke-opacity=".08" stroke-width=".35"/>
    <path d="M26.8 95.8C31.2 78 37.4 63 46 53.2" stroke="#448f9f" stroke-opacity=".06" stroke-width=".3"/>
    <path d="M87.3 88C78.9 68.9 67.8 55.8 52.6 49.1" stroke="#316d7d" stroke-opacity=".05" stroke-width=".36"/>
    <path d="M80.3 95C74.3 76.6 65 61 51.2 51.2" stroke="#1d5060" stroke-opacity=".035" stroke-width=".3"/>
    <path d="M69.2 95.8C64.8 78 58.6 63 50 53.2" stroke="#103744" stroke-opacity=".028" stroke-width=".27"/>
  </g>
  <g data-brand-rim-light="" fill="none" stroke-linejoin="round" stroke-linecap="round" filter="url(#__GLOW__)">
    <path d="M31.7 37.7C34.6 32.4 36.4 27.4 37.7 22.3C39.1 16.8 42.1 11.7 46.6 9.6" stroke="#d9fdff" stroke-opacity=".74" stroke-width=".52"/>
    <path d="M47.1 9.2C47.4 9.1 47.7 9.1 48 9.1" stroke="#f4ffff" stroke-opacity=".82" stroke-width=".56"/>
    <path d="M48 9.1C53.2 10.8 56.7 16.1 58.3 22.3C59.6 27.4 61.4 32.4 64.3 37.7" stroke="#9aedff" stroke-opacity=".64" stroke-width=".48"/>
    <path d="M31.7 37.7C29 39.8 27.2 41.3 25.9 43.1L20 48.4L16.7 55.5" stroke="#dcfdff" stroke-opacity=".56" stroke-width=".44"/>
    <path d="M15.8 57.7L12.7 65.4" stroke="#a8efff" stroke-opacity=".31" stroke-width=".34"/>
    <path d="M64.3 37.7C67 39.8 68.8 41.3 70.1 43.1L76 48.4L79.3 55.5" stroke="#8ee9ff" stroke-opacity=".47" stroke-width=".41"/>
    <path d="M80.2 57.7L83.3 65.4" stroke="#60dcff" stroke-opacity=".26" stroke-width=".32"/>
  </g>
  <g data-brand-seams="" fill="none" stroke-linecap="round">
    <path d="M17 60.5C25.2 54 34.4 50.4 43.9 51.3" stroke="#9adce5" stroke-opacity=".06" stroke-width=".29"/>
    <path d="M79 60.5C70.8 54 61.6 50.4 52.1 51.3" stroke="#2c6271" stroke-opacity=".032" stroke-width=".26"/>
    <path d="M10.8 77.3C21 65.2 32.2 57 44.6 53.4" stroke="#67b3c0" stroke-opacity=".04" stroke-width=".27"/>
    <path d="M85.2 77.3C75 65.2 63.8 57 51.4 53.4" stroke="#1e4b59" stroke-opacity=".023" stroke-width=".24"/>

    <path d="M14 84C21 70 30 59 42 53" stroke="#84cbd6" stroke-opacity=".035" stroke-width=".25"/>
    <path d="M20 91C26 74 34 61 44 54" stroke="#5ba8b7" stroke-opacity=".03" stroke-width=".23"/>
    <path d="M28 94C32 78 38 64 45 55" stroke="#3b7f8f" stroke-opacity=".025" stroke-width=".21"/>
    <path d="M82 84C75 70 66 59 54 53" stroke="#28606f" stroke-opacity=".022" stroke-width=".23"/>
    <path d="M76 91C70 74 62 61 52 54" stroke="#1a4856" stroke-opacity=".019" stroke-width=".21"/>
    <path d="M68 94C64 78 58 64 51 55" stroke="#10343f" stroke-opacity=".016" stroke-width=".19"/>
    <path d="M33 59C37 56 41 54 45 54" stroke="#9bdce4" stroke-opacity=".028" stroke-width=".22"/>
    <path d="M63 59C59 56 55 54 51 54" stroke="#315f6b" stroke-opacity=".018" stroke-width=".2"/>
    <path d="M40 74C42 67 44 61 46 57" stroke="#6fb8c4" stroke-opacity=".018" stroke-width=".2"/>
    <path d="M56 74C54 67 52 61 50 57" stroke="#214a56" stroke-opacity=".014" stroke-width=".18"/>
  </g>
</g>
`;

export default function BrandMark({ size = 'sm', className }: BrandMarkProps) {
  const reducedMotion = useReducedMotion();
  const compact = size === 'sm';
  const id = useId().replace(/:/g, '');
  const markup = useMemo(() => VECTOR_BODY
    .split('__CLOAK__').join(`${id}-cloak`)
    .split('__HOOD__').join(`${id}-hood`)
    .split('__LEFTFOLD__').join(`${id}-left-fold`)
    .split('__RIGHTFOLD__').join(`${id}-right-fold`)
    .split('__BLUR5__').join(`${id}-blur5`)
    .split('__BLUR2__').join(`${id}-blur2`)
    .split('__BLUR1__').join(`${id}-blur1`)
    .split('__GLOW__').join(`${id}-glow`), [id]);

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
        aria-labelledby={`${id}-brand-title ${id}-brand-description`}
        focusable="false"
        style={{ pointerEvents: 'none' }}
        variants={{
          idle: { y: 0, scale: 1, filter: compact ? 'drop-shadow(0 3px 6px rgba(0,4,13,.82)) drop-shadow(0 0 6px rgba(46,216,255,.16))' : 'drop-shadow(0 5px 12px rgba(0,4,13,.84)) drop-shadow(0 0 10px rgba(46,216,255,.17))' },
          hover: { y: compact ? -0.5 : -0.8, scale: compact ? 1.018 : 1.025, filter: compact ? 'drop-shadow(0 5px 10px rgba(0,7,18,.86)) drop-shadow(0 0 10px rgba(65,220,255,.25))' : 'drop-shadow(0 8px 18px rgba(0,7,18,.88)) drop-shadow(0 0 16px rgba(65,220,255,.26))', transition: { duration: 0.78, ease: premiumEase } },
        }}
      >
        <title id={`${id}-brand-title`}>THE LEGENDARY POET</title>
        <desc id={`${id}-brand-description`}>
          Безликая фигура в тканевом капюшоне, с глубокой пустотой, более тяжёлым собранным клобуком, менее радиальными складками и верхне-боковой аурой без нижнего дыма
        </desc>
        <g dangerouslySetInnerHTML={{ __html: markup }} />
      </motion.svg>
    </motion.span>
  );
}
