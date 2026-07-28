import { useId, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../utils/cn';

interface BrandMarkProps { size?: 'sm' | 'md' | 'lg'; className?: string; }
const sizes = { sm: 'h-12 w-12', md: 'h-16 w-16', lg: 'h-24 w-24' };
const premiumEase = [0.16, 1, 0.3, 1] as const;
const BRAND_VERSION = 'cloak-20260728-11';
const VECTOR_SOURCE = 'canonical-reference-v2-reset-v11-2';

const VECTOR_BODY = `<defs>
  <linearGradient id="__CLOAK__" x1="17" y1="42" x2="74" y2="95" gradientUnits="userSpaceOnUse">
    <stop stop-color="#0a1d28"/><stop offset=".24" stop-color="#05121b"/><stop offset=".52" stop-color="#02080e"/><stop offset=".78" stop-color="#000409"/><stop offset="1" stop-color="#000103"/>
  </linearGradient>
  <linearGradient id="__HOOD__" x1="35" y1="10" x2="61" y2="44" gradientUnits="userSpaceOnUse">
    <stop stop-color="#173b4f"/><stop offset=".28" stop-color="#0b2839"/><stop offset=".58" stop-color="#041621"/><stop offset=".82" stop-color="#01080e"/><stop offset="1" stop-color="#000205"/>
  </linearGradient>
  <linearGradient id="__LEFT__" x1="14" y1="50" x2="44" y2="95" gradientUnits="userSpaceOnUse">
    <stop stop-color="#0b2836"/><stop offset=".42" stop-color="#051722"/><stop offset="1" stop-color="#010409"/>
  </linearGradient>
  <linearGradient id="__RIGHT__" x1="80" y1="50" x2="51" y2="95" gradientUnits="userSpaceOnUse">
    <stop stop-color="#061923"/><stop offset=".44" stop-color="#020b12"/><stop offset="1" stop-color="#000205"/>
  </linearGradient>
  <filter id="__BLUR5__" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4.2"/></filter>
  <filter id="__BLUR2__" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.6"/></filter>
  <filter id="__BLUR1__" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation=".65"/></filter>
  <filter id="__GLOW__" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation=".8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>

<g data-brand-atmosphere="" aria-hidden="true" fill="none" stroke-linecap="round">
  <path d="M22 60C17 51 20 43 27 37M28 31C24 27 26 21 31 17M32 12C35 9 35 6 33 3" stroke="#a9f2ff" stroke-opacity=".18" stroke-width=".24"/>
  <path d="M74 60C79 51 76 43 69 37M68 31C72 27 70 21 65 17M64 12C61 9 61 6 63 3" stroke="#7fe6ff" stroke-opacity=".15" stroke-width=".22"/>
  <path d="M29 50C24 44 27 38 32 34M32 28C29 24 32 19 37 16" stroke="#d2fbff" stroke-opacity=".17" stroke-width=".21"/>
  <path d="M67 50C72 44 69 38 64 34M64 28C67 24 64 19 59 16" stroke="#a4f2ff" stroke-opacity=".14" stroke-width=".19"/>
  <path d="M16 55C12 49 15 44 21 40M22 34C24 31 23 28 21 25" stroke="#72e1ff" stroke-opacity=".12" stroke-width=".18"/>
  <path d="M80 55C84 49 81 44 75 40M74 34C72 31 73 28 75 25" stroke="#55d6ff" stroke-opacity=".1" stroke-width=".17"/>
  <path d="M25 45L22 42L25 39L23 36" stroke="#d7fdff" stroke-opacity=".15" stroke-width=".17"/>
  <path d="M71 45L74 42L71 39L73 36" stroke="#a7f2ff" stroke-opacity=".12" stroke-width=".16"/>
  <path d="M34 15L31 12L34 9L32 6" stroke="#f1ffff" stroke-opacity=".19" stroke-width=".16"/>
  <path d="M62 15L65 12L62 9L64 6" stroke="#c4f9ff" stroke-opacity=".15" stroke-width=".15"/>
  <path d="M19 48L16 45L19 42" stroke="#9cecff" stroke-opacity=".1" stroke-width=".15"/>
  <path d="M77 48L80 45L77 42" stroke="#72e1ff" stroke-opacity=".085" stroke-width=".14"/>
  <path d="M31 22L28 20L30 17" stroke="#d9fdff" stroke-opacity=".13" stroke-width=".15"/>
  <path d="M65 22L68 20L66 17" stroke="#acf4ff" stroke-opacity=".11" stroke-width=".14"/>
</g>
<g data-brand-energy="" aria-hidden="true" fill="none" stroke-linecap="round">
  <path d="M18 52L15 49L18 45L16 42" stroke="#c8faff" stroke-opacity=".16" stroke-width=".18"/>
  <path d="M78 52L81 49L78 45L80 42" stroke="#98efff" stroke-opacity=".13" stroke-width=".17"/>
  <path d="M37 12L34 9L37 6L35 3" stroke="#f4ffff" stroke-opacity=".2" stroke-width=".17"/>
  <path d="M59 12L62 9L59 6L61 3" stroke="#c3f8ff" stroke-opacity=".16" stroke-width=".16"/>
</g>

<g data-brand-figure="">
  <path data-brand-cloak="" d="M48 37C40.6 37 34.2 38.8 28.8 42.2L18.6 52.5L7.1 82.4C5.2 87.4 5.3 91.6 7.6 94.7C18.8 95.6 30.4 95.9 40.7 95.6C44.1 95.5 46.7 94.6 48 93C49.5 94.5 52 95.4 55.5 95.6C66 96 77.4 95.6 88.4 94.6C90.5 91.4 90.4 87.2 88.5 82.1L77.4 52.4L67.2 42C61.8 38.7 55.4 37 48 37Z" fill="url(#__CLOAK__)" stroke="#214c5e" stroke-opacity=".36" stroke-width=".48"/>

  <g data-brand-folds="">
    <path d="M7.6 95C10.7 78.2 18 61.3 30.2 46.7C34.1 42.1 39 43 45.2 48.2C34.3 58.2 27.2 72.4 21 95.5Z" fill="#030e15"/>
    <path d="M13.2 95.4C18.9 76.7 27.1 61.7 41.8 49.2C33.9 62.4 29.7 78.6 29.1 95.7Z" fill="url(#__LEFT__)" opacity=".82"/>
    <path d="M24 95.7C27.6 79.4 34.1 64.1 45.5 51.5C39.7 67 37.3 82 37.3 95.8Z" fill="#020c13"/>
    <path d="M35 96C37.1 78.8 41.2 64.2 47 53.5C44.2 69.2 43.4 83.9 44.3 96Z" fill="#04131c" fill-opacity=".62"/>
    <path d="M42.7 96C43.2 80.2 45.2 66 47.8 54.5C47.4 70.8 47.3 84.7 47.5 96Z" fill="#01070c"/>
    <path d="M88.4 95C85.2 78.1 78 61.1 65.9 46.5C61.9 42.1 57.1 43 50.9 48.2C61.7 58.3 69 72.6 75.5 95.5Z" fill="#000409"/>
    <path d="M82.6 95.4C76.9 76.8 68.7 61.8 54.1 49.3C62 62.5 66.2 78.6 66.8 95.7Z" fill="url(#__RIGHT__)" opacity=".82"/>
    <path d="M72 95.7C68.4 79.4 61.9 64.1 50.6 51.5C56.3 67 58.7 82 58.7 95.8Z" fill="#00060b"/>
    <path d="M61 96C58.9 78.8 54.8 64.2 49 53.5C51.8 69.2 52.6 83.9 51.7 96Z" fill="#000205"/>
    <path d="M53.3 96C52.8 80.2 50.8 66 48.2 54.5C48.6 70.8 48.7 84.7 48.5 96Z" fill="#000103"/>
    <path d="M9.4 89.4C17.7 70.8 28.3 56.9 42.5 49.9C32.7 61.1 24.5 76.7 17.5 94.8Z" fill="#10303e" fill-opacity=".09"/>
    <path d="M86.4 89.4C78.2 70.8 67.8 56.9 53.6 49.9C63.4 61.2 71.6 76.7 78.5 94.8Z" fill="#08202c" fill-opacity=".055"/>
  </g>

  <path data-brand-hood="" d="M48 10.2C42.7 11.9 39.6 17.7 38.1 24.1C36.9 29.1 35.1 33.7 32.8 38C37.2 38 41.1 39.3 44.7 41.7C46.3 42.8 47.4 43.9 48 44.6C48.6 43.9 49.7 42.8 51.3 41.7C54.9 39.3 58.8 38 63.2 38C60.9 33.7 59.1 29.1 57.9 24.1C56.4 17.7 53.3 11.9 48 10.2Z" fill="url(#__HOOD__)" stroke="#397d91" stroke-opacity=".48" stroke-width=".52"/>
  <g data-brand-hood-layers="">
    <path d="M48 10.8C44.5 13.2 42.2 18 40.7 23.5C39.6 27.9 38 31.9 36.3 35C40.2 35.5 43.8 38.2 47.8 44.2C46.2 34.7 45.7 27 46.4 19.7C46.8 15.7 47.5 12.3 48 10.8Z" fill="#123347"/>
    <path d="M48 10.8C51.5 13.2 53.8 18 55.3 23.5C56.4 27.9 58 31.9 59.7 35C55.8 35.5 52.2 38.2 48.2 44.2C49.8 34.7 50.3 27 49.6 19.7C49.2 15.7 48.5 12.3 48 10.8Z" fill="#01070d"/>
    <path d="M48 12.2C45.1 14.3 42.9 17.9 41.3 22.4C43.4 20.5 45.6 19.1 48 18.2C50.4 19.1 52.6 20.5 54.7 22.4C53.1 17.9 50.9 14.3 48 12.2Z" fill="#092534"/>
    <path d="M48 13.9C45.8 15.3 44.2 17.4 43 20C44.6 19 46.3 18.4 48 18.1C49.7 18.4 51.4 19 53 20C51.8 17.4 50.2 15.3 48 13.9Z" fill="#05131c"/>
    <path d="M40.8 23.8C42.9 18.9 45.3 15.5 48 13.5C50.7 15.5 53.1 18.9 55.2 23.8" fill="none" stroke="#91dbe7" stroke-opacity=".16" stroke-width=".38" stroke-linecap="round"/>
  </g>

  <path data-brand-face-void="" d="M48 18C44.5 18.5 41.8 21.1 40.2 24.8L38.8 29.2C40.3 32.8 43.5 35.3 48 35.9C52.3 35.2 55.5 32.7 57.2 29.1L55.8 24.8C54.2 21.1 51.5 18.5 48 18Z" fill="#000"/>
  <g data-brand-face-depth="">
    <path d="M48 18C44.5 18.5 41.8 21.1 40.2 24.8L38.8 29.2C40 32 42.3 34.2 45.4 35.2C43 32.2 42 29.3 42.3 26.6C42.6 23.6 44.5 20.6 48 18Z" fill="#010408"/>
    <path d="M48 18C51.5 18.5 54.2 21.1 55.8 24.8L57.2 29.1C56 32 53.7 34.2 50.7 35.2C53 32.1 54 29.3 53.7 26.5C53.4 23.5 51.5 20.6 48 18Z" fill="#000102"/>
  </g>

  <path data-brand-neck-shadow="" d="M41.8 36C45.6 36.9 49.4 37 52.8 36.2C58 37.1 62.4 38.9 65.8 41.4C61.1 45.9 55.2 48 48 48C41.4 48 35.5 45.8 30.2 41.4C33.6 38.9 37.5 37.1 41.8 36Z" fill="#01060b"/>

  <g data-brand-collar="">
    <path d="M29.4 39.5C35.7 37.5 41.1 38.7 47.7 42.2C51.1 44 54.4 44.3 57.5 43.2C54.5 46.6 50.1 47.8 45.7 47C39.6 45.9 34 43.4 29.4 39.5Z" fill="#061923"/>
    <path d="M66.8 40.4C60.8 38.8 55.5 40 49.5 43.7C46.5 45.6 43.6 46.2 40.7 45.5C43.8 48.7 48.1 49.7 52.4 48.4C57.8 46.9 62.7 44.3 66.8 40.4Z" fill="#020a11"/>
    <path d="M27.2 42.2C33.7 40.1 39.3 41.7 45.6 45.7C48.1 47.3 50.7 47.8 53.3 47.1C50.4 50.1 46.5 51.2 42.5 50.2C36.6 48.8 31.5 46.1 27.2 42.2Z" fill="#071d27"/>
    <path d="M68.7 43C62.7 41.5 57.4 42.9 51.3 46.9C48.7 48.6 46.1 49.2 43.5 48.7C46.6 51.6 50.5 52.4 54.4 51.2C59.9 49.5 64.7 46.8 68.7 43Z" fill="#01070d"/>
    <path d="M33 46C37.8 44.8 41.7 46.1 46.5 49.2C48.3 50.4 50.2 50.8 52.1 50.3C49.7 52.8 46.6 53.7 43.5 52.9C39 51.7 35.5 49.4 33 46Z" fill="#04131b"/>
    <path d="M63.2 46.5C58.8 45.4 55 46.7 50.2 49.9C48.3 51.2 46.4 51.6 44.5 51.2C47 53.6 50.1 54.3 53.1 53.3C57.2 52 60.6 49.7 63.2 46.5Z" fill="#00050a"/>
    <path d="M38 49.6C41.4 48.8 44.1 49.9 47.5 52.1C45.7 54 43.4 54.5 41.3 53.6C39.8 52.9 38.7 51.6 38 49.6Z" fill="#04141d"/>
    <path d="M58.2 49.9C54.9 49.2 52.1 50.2 48.7 52.5C50.5 54.2 52.8 54.7 54.9 53.8C56.4 53.1 57.5 51.8 58.2 49.9Z" fill="#000307"/>
  </g>

  <g data-brand-texture="" fill="none" stroke-linecap="round">
    <path d="M8.8 87.5C16.4 69.8 27.4 56.6 43.6 49.8" stroke="#7fc9d5" stroke-opacity=".09" stroke-width=".36"/>
    <path d="M16.1 94.8C22.2 76.4 31.3 61.4 44.7 51.7" stroke="#5eafbe" stroke-opacity=".065" stroke-width=".32"/>
    <path d="M27.2 95.8C31.6 78.2 37.6 63.5 45.8 53.4" stroke="#438c9d" stroke-opacity=".05" stroke-width=".28"/>
    <path d="M87.2 87.5C79.6 69.8 68.6 56.6 52.4 49.8" stroke="#2b6576" stroke-opacity=".04" stroke-width=".32"/>
    <path d="M79.9 94.8C73.8 76.4 64.7 61.4 51.3 51.7" stroke="#1b4d5d" stroke-opacity=".03" stroke-width=".28"/>
    <path d="M68.8 95.8C64.4 78.2 58.4 63.5 50.2 53.4" stroke="#103744" stroke-opacity=".025" stroke-width=".25"/>
  </g>

  <g data-brand-rim-light="" fill="none" stroke-linejoin="round" stroke-linecap="round" filter="url(#__GLOW__)">
    <path d="M32.8 38C35.1 33.7 36.9 29.1 38.1 24.1C39.5 18.2 42.3 12.9 46.5 10.7" stroke="#d3fbff" stroke-opacity=".68" stroke-width=".45"/>
    <path d="M47.2 10.3C47.5 10.2 47.8 10.2 48 10.2" stroke="#efffff" stroke-opacity=".76" stroke-width=".48"/>
    <path d="M48 10.2C53.3 11.9 56.4 17.7 57.9 24.1C59.1 29.1 60.9 33.7 63.2 38" stroke="#94ebff" stroke-opacity=".57" stroke-width=".43"/>
    <path d="M32.8 38C30.7 40.1 29 41.4 27.8 42.2L18.6 52.5L15.6 60.1" stroke="#d9fdff" stroke-opacity=".49" stroke-width=".4"/>
    <path d="M14.8 62.5L12.1 69.7" stroke="#9deeff" stroke-opacity=".26" stroke-width=".32"/>
    <path d="M63.2 38C65.3 40.1 67 41.4 68.2 42.2L77.4 52.4L80.4 60" stroke="#83e6ff" stroke-opacity=".39" stroke-width=".38"/>
    <path d="M81.2 62.4L83.9 69.6" stroke="#5bd8ff" stroke-opacity=".21" stroke-width=".3"/>
  </g>

  <g data-brand-seams="" fill="none" stroke-linecap="round">
    <path d="M17.5 60.4C26 53.6 34.8 49.9 44.2 51.6" stroke="#91d5df" stroke-opacity=".05" stroke-width=".28"/>
    <path d="M78.5 60.4C70 53.6 61.2 49.9 51.8 51.6" stroke="#285d6c" stroke-opacity=".025" stroke-width=".25"/>
    <path d="M11 77.5C21.4 65.5 32.5 57.2 44.8 53.7" stroke="#65aebb" stroke-opacity=".035" stroke-width=".26"/>
    <path d="M85 77.5C74.6 65.5 63.5 57.2 51.2 53.7" stroke="#1c4856" stroke-opacity=".02" stroke-width=".23"/>
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
    .split('__LEFT__').join(`${id}-left-plane`)
    .split('__RIGHT__').join(`${id}-right-plane`)
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
          idle: {
            y: 0,
            scale: 1,
            filter: compact
              ? 'drop-shadow(0 3px 6px rgba(0,4,13,.82)) drop-shadow(0 0 6px rgba(46,216,255,.16))'
              : 'drop-shadow(0 5px 12px rgba(0,4,13,.84)) drop-shadow(0 0 10px rgba(46,216,255,.17))',
          },
          hover: {
            y: compact ? -0.5 : -0.8,
            scale: compact ? 1.018 : 1.025,
            filter: compact
              ? 'drop-shadow(0 5px 10px rgba(0,7,18,.86)) drop-shadow(0 0 10px rgba(65,220,255,.25))'
              : 'drop-shadow(0 8px 18px rgba(0,7,18,.88)) drop-shadow(0 0 16px rgba(65,220,255,.26))',
            transition: { duration: 0.78, ease: premiumEase },
          },
        }}
      >
        <title id={`${id}-brand-title`}>THE LEGENDARY POET</title>
        <desc id={`${id}-brand-description`}>
          Безликая фигура в тканевом капюшоне, с глубокой узкой пустотой, тяжёлым тёмным клобуком, почти чёрной треугольной мантией и тонкой рваной верхне-боковой аурой без нижнего дыма
        </desc>
        <g dangerouslySetInnerHTML={{ __html: markup }} />
      </motion.svg>
    </motion.span>
  );
}
