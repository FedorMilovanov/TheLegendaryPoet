import { useEffect, useId, useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../utils/cn';
interface BrandMarkProps { size?: 'sm' | 'md' | 'lg'; className?: string; }
const sizes = { sm: 'h-12 w-12', md: 'h-16 w-16', lg: 'h-24 w-24' };
const premiumEase = [0.16, 1, 0.3, 1] as const;
const BRAND_VERSION = 'cloak-20260729-19';
const VECTOR_SOURCE = 'canonical-reference-v2-tapered-aura-cowl-v16-1';
const LAYER_MOTION_CSS = `[data-brand-mark] [data-brand-depth]{transform-box:fill-box;transform-origin:center;will-change:transform,opacity;transition:transform 760ms cubic-bezier(.16,1,.3,1),opacity 760ms cubic-bezier(.16,1,.3,1)}
@media (hover:hover) and (pointer:fine){
[data-brand-mark][data-brand-interaction="active"] [data-brand-atmosphere]{transform:translate3d(var(--brand-atmosphere-x),var(--brand-atmosphere-y),0) rotate(var(--brand-atmosphere-r)) scale(1.022);transition-duration:150ms}
[data-brand-mark][data-brand-interaction="active"] [data-brand-energy]{transform:translate3d(var(--brand-energy-x),var(--brand-energy-y),0) rotate(var(--brand-energy-r));transition-duration:120ms}
[data-brand-mark][data-brand-interaction="active"] [data-brand-figure]{transform:translate3d(var(--brand-figure-x),var(--brand-figure-y),0);transition-duration:190ms}
[data-brand-mark][data-brand-interaction="active"] [data-brand-folds]{transform:translate3d(var(--brand-folds-x),var(--brand-folds-y),0);transition-duration:165ms}
[data-brand-mark][data-brand-interaction="active"] [data-brand-hood]{transform:translate3d(var(--brand-hood-x),var(--brand-hood-y),0);transition-duration:155ms}
[data-brand-mark][data-brand-interaction="active"] [data-brand-hood-layers]{transform:translate3d(var(--brand-hood-layers-x),var(--brand-hood-layers-y),0);transition-duration:135ms}
[data-brand-mark][data-brand-interaction="active"] [data-brand-face-void],[data-brand-mark][data-brand-interaction="active"] [data-brand-face-depth]{transform:translate3d(var(--brand-face-x),var(--brand-face-y),0);transition-duration:180ms}
[data-brand-mark][data-brand-interaction="active"] [data-brand-collar]{transform:translate3d(var(--brand-collar-x),var(--brand-collar-y),0);transition-duration:145ms}
[data-brand-mark][data-brand-interaction="active"] [data-brand-rim-light]{transform:translate3d(var(--brand-rim-x),var(--brand-rim-y),0);transition-duration:110ms}
[data-brand-mark][data-brand-interaction="active"] [data-brand-texture],[data-brand-mark][data-brand-interaction="active"] [data-brand-seams]{transform:translate3d(var(--brand-texture-x),var(--brand-texture-y),0);transition-duration:175ms}}
@media (prefers-reduced-motion:reduce){[data-brand-mark] [data-brand-depth]{transform:none!important;transition:none!important}}`;
const VECTOR_BODY = `<defs>
<linearGradient id="__CLOAK__" x1="19" y1="37" x2="75" y2="96" gradientUnits="userSpaceOnUse"><stop stop-color="#081b23"/><stop offset=".28" stop-color="#031017"/><stop offset=".58" stop-color="#01070b"/><stop offset="1" stop-color="#000102"/></linearGradient>
<linearGradient id="__HOOD__" x1="39" y1="7" x2="58" y2="38" gradientUnits="userSpaceOnUse"><stop stop-color="#123945"/><stop offset=".26" stop-color="#0a2530"/><stop offset=".6" stop-color="#03131a"/><stop offset="1" stop-color="#000204"/></linearGradient>
<linearGradient id="__LEFT__" x1="17" y1="43" x2="35" y2="96" gradientUnits="userSpaceOnUse"><stop stop-color="#071b22"/><stop offset=".55" stop-color="#020b10"/><stop offset="1" stop-color="#000204"/></linearGradient>
<linearGradient id="__RIGHT__" x1="78" y1="43" x2="61" y2="96" gradientUnits="userSpaceOnUse"><stop stop-color="#05151c"/><stop offset=".55" stop-color="#01080d"/><stop offset="1" stop-color="#000204"/></linearGradient>
<filter id="__MIST__" x="-180%" y="-180%" width="460%" height="460%"><feGaussianBlur stdDeviation="2.8"/></filter>
<filter id="__SOFT__" x="-180%" y="-180%" width="460%" height="460%"><feGaussianBlur stdDeviation="1.15"/></filter>
<filter id="__GLOW__" x="-180%" y="-180%" width="460%" height="460%"><feGaussianBlur stdDeviation=".48" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<g data-brand-atmosphere="" data-brand-depth="far" aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round">
<g filter="url(#__MIST__)" stroke="#20c9f2" stroke-opacity=".2" stroke-width="2.15">
<path d="M45.2 7.6C40.7 4.9 36.2 6.7 33.8 10.6C31.7 14 32.1 17.3 28.7 20.3"/>
<path d="M38.1 15.1C33.7 12.9 29.9 16.3 27.9 20.8C26.2 24.7 23.3 27.3 22.1 32"/>
<path d="M32.5 25.2C28.2 23.8 24.8 27.3 23.2 32.4C21.9 36.5 19.2 39.5 18.1 44.1"/>
<path d="M27.1 36.8C23.1 36.1 20.1 39.7 18.7 44.5C17.7 48.2 15.6 51.4 14.8 55.5"/>
<path d="M50.7 7.5C55 4.8 59.7 6.8 62.1 10.8C64.1 14.2 63.7 17.6 67.2 20.7"/>
<path d="M57.9 15.4C62.3 13.2 66.1 16.6 68.1 21.1C69.8 25 72.7 27.7 73.9 32.4"/>
<path d="M63.4 25.5C67.8 24.1 71.2 27.7 72.8 32.8C74.1 36.9 76.8 39.9 77.9 44.5"/>
<path d="M68.9 37.1C72.9 36.4 75.9 40 77.3 44.8C78.3 48.5 80.4 51.7 81.2 55.8"/>
</g>
<g filter="url(#__SOFT__)" stroke="#77e7ff" stroke-opacity=".28" stroke-width=".72">
<path d="M44.8 8.5C41.3 6.7 38.2 8.3 36.4 11.4C34.9 14 34.8 16.8 32.1 19.1"/>
<path d="M37.1 18.3C33.7 17.1 31 19.8 29.5 23.2C28.1 26.4 25.8 28.7 24.9 32.3"/>
<path d="M30.6 29.7C27.4 29.1 25 31.8 23.8 35.7C22.9 38.9 21 41.5 20.2 45.1"/>
<path d="M51.1 8.4C54.6 6.6 57.8 8.3 59.6 11.5C61.1 14.1 61.2 16.9 63.9 19.3"/>
<path d="M58.8 18.5C62.2 17.3 65 20 66.5 23.4C67.9 26.6 70.2 28.9 71.1 32.5"/>
<path d="M65.3 29.9C68.5 29.3 70.9 32 72.1 35.9C73 39.1 74.9 41.7 75.7 45.3"/>
</g>
<path filter="url(#__GLOW__)" stroke="#efffff" stroke-opacity=".34" stroke-width=".16" d="M44.6 8.1L42.2 5.8L40.2 5.5L38.7 3M39.2 15L36.8 13.2L34.7 14L32.7 11.8M34.1 23.8L31.9 22.7L29.7 24.3L27.3 23.5M29 33.7L26.8 33.1L24.9 35.5L22.4 36M24.3 44.5L22.4 44.3L20.8 47L18.5 48M51.3 8L53.7 5.7L55.7 5.4L57.2 2.9M56.7 14.9L59.1 13.1L61.2 13.9L63.2 11.7M61.8 23.7L64 22.6L66.2 24.2L68.6 23.4M66.9 33.6L69.1 33L71 35.4L73.5 35.9M71.6 44.4L73.5 44.2L75.1 46.9L77.4 47.9"/>
</g>
<g data-brand-energy="" data-brand-depth="near-light" aria-hidden="true" fill="none" stroke="#f5ffff" stroke-opacity=".12" stroke-width=".14" stroke-linecap="round" filter="url(#__GLOW__)">
<path d="M43.8 7.8L41.8 5.4L40.2 5L38.8 2.4M38.8 14.2L36.9 12.7L34.9 13.2L33.2 11M33.9 23.4L31.9 22.2L30 23.7L28 23M29.1 33.6L27.2 32.9L25.5 34.8L23.4 35M52.1 7.7L54.1 5.3L55.7 4.9L57.1 2.3M57.1 14.1L59 12.6L61 13.1L62.7 10.9M62 23.3L64 22.1L65.9 23.6L68 22.9M66.8 33.5L68.7 32.8L70.4 34.7L72.5 34.9"/>
</g>
<g data-brand-figure="" data-brand-depth="base">
<path data-brand-cloak="" d="M48 37.2C40.3 36.6 33.2 38.5 27.3 42.9C21.9 47 18.7 54.1 15.5 62.7L8 92.5C7.4 94.8 9.1 95.8 12.5 95.9C23 96.1 34.4 96 42.9 95.8C45.8 95.7 47.3 95 48 93.8C48.8 95 50.3 95.7 53.3 95.8C62.1 96 73.4 96.1 83.9 95.8C87.2 95.6 88.8 94.6 88.1 92.3L80.2 62.9C77.2 54.4 73.9 47.2 68.5 43C62.8 38.6 55.7 36.7 48 37.2Z" fill="url(#__CLOAK__)"/>
<path d="M8.1 91.6C20.3 93.7 33.6 94.4 48 94.1C62.5 94.4 75.8 93.7 88 91.5L88.4 96H7.7Z" fill="#000204"/>
<g data-brand-folds="" data-brand-depth="mid">
<path d="M8.1 95.9C12.2 81.8 16.5 68.2 22 55.4C25.5 47.4 30 42.4 35.8 39.7C38.9 38.3 41.1 39.2 43 41.8C35.3 51.2 29.5 64 25.3 77.5C23.1 84.5 20.9 90.6 18.8 96Z" fill="#010508"/>
<path d="M13.4 96C18.1 80.2 23.5 64.6 31.9 52.1C35.3 47.1 38.7 43.8 42.5 42.1C37 55.1 33.1 68.9 30.8 82.6C29.8 88.4 29 92.9 28.5 96Z" fill="url(#__LEFT__)" opacity=".42"/>
<path d="M26.5 96C30 82.3 33.7 67.7 40.5 55.5C42.5 51.9 44.3 49.2 46.1 47C43.2 60.2 41.9 73.7 42.2 86.1C42.4 90.4 42.5 93.7 42.4 96Z" fill="#061820" opacity=".24"/>
<path d="M40 96C40.6 83.9 42.4 69 45.2 56.9C46.1 53.1 47 50 48 47.6C47.3 60.7 47.4 75.5 48 88.6V96Z" fill="#000407"/>
<path d="M87.9 95.9C83.9 82 79.6 68.4 74 55.7C70.5 47.7 66 42.7 60.2 39.9C57.1 38.5 54.9 39.4 53 42C60.7 51.4 66.5 64.2 70.7 77.7C72.9 84.7 75.1 90.7 77.2 96Z" fill="#000306"/>
<path d="M82.6 96C77.9 80.5 72.5 64.9 64.1 52.4C60.7 47.4 57.3 44.1 53.5 42.4C59 55.4 62.9 69.2 65.2 82.9C66.2 88.7 67 93 67.5 96Z" fill="url(#__RIGHT__)" opacity=".34"/>
<path d="M69.5 96C66 82.6 62.3 68 55.5 55.8C53.5 52.2 51.7 49.5 49.9 47.3C52.8 60.5 54.1 74 53.8 86.4C53.6 90.7 53.5 93.8 53.6 96Z" fill="#020b10" opacity=".58"/>
<path d="M56 96C55.4 84.2 53.6 69.3 50.8 57.2C49.9 53.4 49 50.3 48 47.9C48.7 61 48.6 75.8 48 88.9V96Z" fill="#000204"/>
<path d="M17.5 82.5C24.3 65 33.5 51.1 44.1 44.1C37.6 56.9 33.5 70.4 31 83.9C30.1 88.5 29.1 92.4 28 95.8Z" fill="#15414c" opacity=".035"/>
<path d="M78.5 82.8C71.7 65.3 62.5 51.4 51.9 44.4C58.4 57.2 62.5 70.7 65 84.2C65.9 88.8 66.9 92.5 68 95.9Z" fill="#092630" opacity=".023"/>
</g>
<path data-brand-hood="" data-brand-depth="mid" d="M47.8 7.8C43.4 8.8 40.3 12.8 38.6 17.6C37.1 21.8 36 26.7 34 31.2C36.8 32.2 39.6 33.7 42.5 35.7C44.5 37.1 46.3 37.9 48 38.3C50 37.8 51.9 36.9 53.8 35.6C56.6 33.7 59.2 32.3 61.7 31.2C60.1 26.6 58.9 22 57.3 17.6C55.5 12.8 52.3 8.7 47.8 7.8Z" fill="url(#__HOOD__)" stroke="#4c98a8" stroke-opacity=".3" stroke-width=".33"/>
<g data-brand-hood-layers="" data-brand-depth="near">
<path d="M47.8 8.2C44.7 9.8 42.3 13.3 41 17.8C39.8 21.8 38.8 26.7 36.7 31C39.2 31.8 41.9 33.6 45.8 36.9C44.8 31.4 45 25.4 45.8 19.8C46.3 15.3 47.2 10.7 47.8 8.2Z" fill="#11343f"/>
<path d="M47.8 8.2C51.1 9.7 53.6 13.3 55 17.9C56.4 22 57.4 26.6 59.1 30.9C56.7 31.8 53.9 33.6 50 37C51.1 31.3 50.9 25.3 50 19.6C49.5 15.1 48.4 10.6 47.8 8.2Z" fill="#01080d"/>
<path d="M47.5 10.5C44.8 11.7 42.8 14.2 41.6 17.5C43.5 16.5 45.4 15.8 47.5 15.5C50 15.8 52.2 16.7 54.1 18.3C52.8 14.7 50.6 11.8 47.5 10.5Z" fill="#092630"/>
<path d="M46.9 12.8C45 13.4 43.5 14.9 42.5 16.8C44.2 16.2 45.9 15.8 47.6 15.7C49.5 15.8 51.2 16.3 52.8 17.2C51.6 15 49.6 13.5 46.9 12.8Z" fill="#041318"/>
</g>
<path data-brand-face-void="" data-brand-depth="deep" d="M47.7 14.5C44.8 15.4 42.3 18.5 41 22.1C39.9 25.2 40.1 28.5 42 31.5L48 36.7L53.8 31C55.4 28.6 55.6 25.6 54.5 22.4C53.3 18.9 50.8 15.4 48 14.5Z" fill="#000"/>
<g data-brand-face-depth="" data-brand-depth="deep">
<path d="M47.7 14.5C44.8 15.4 42.3 18.5 41 22.1C39.9 25.2 40.1 28.5 42 31.5L48 36.7C45.9 33.7 45 30.5 45.2 27C45.4 22.7 46.2 18.6 47.7 14.5Z" fill="#010407"/>
<path d="M47.7 14.5L48 14.5C50.8 15.4 53.3 18.9 54.5 22.4C55.6 25.6 55.4 28.6 53.8 31L48 36.7C50.4 33.5 51.2 30.3 50.8 26.8C50.5 22.6 49.5 18.5 47.7 14.5Z" fill="#000102"/>
</g>
<path data-brand-neck-shadow="" d="M35.3 31.4C39.4 32.1 43.6 33.8 48 36.7C52.3 33.8 56.4 32.1 60.7 31.4C59.2 35.1 56.7 38.2 53.2 40.3C51.2 41.5 49.5 42.8 48 44.5C46.5 42.8 44.8 41.5 42.8 40.3C39.3 38.2 36.8 35.1 35.3 31.4Z" fill="#010609"/>
<g data-brand-collar="" data-brand-depth="near">
<path d="M27.4 34.7C32.7 32.5 37.9 32.7 42.7 34.6C44.8 35.4 46.5 36.4 48 37.6C44.8 38.6 41.8 40.1 39.1 42.3C34.8 41.5 30.9 39 27.4 34.7Z" fill="#061820"/>
<path d="M68.6 34.9C63.3 32.7 58.1 32.9 53.3 34.8C51.2 35.6 49.5 36.6 48 37.7C51.2 38.7 54.2 40.2 56.9 42.4C61.2 41.6 65.1 39.1 68.6 34.9Z" fill="#020b10"/>
<path d="M32.5 38.1C36.7 36.8 40.7 37.4 44.2 39.1C45.8 39.8 47 40.7 48 41.6C45.4 42.2 43 43.3 40.8 44.7C37.6 43.8 34.8 41.6 32.5 38.1Z" fill="#031017"/>
<path d="M63.5 38.3C59.3 37 55.3 37.6 51.8 39.3C50.2 40 49 40.9 48 41.8C50.6 42.4 53 43.5 55.2 44.9C58.4 44 61.2 41.8 63.5 38.3Z" fill="#01070b"/>
<path data-brand-throat="" d="M43.7 36.1C45.5 37 46.9 38.2 48 39.7C49.2 38.1 50.7 36.9 52.4 36.1C51.8 39.7 50.4 42.7 48.1 45.1C45.7 42.7 44.3 39.7 43.7 36.1Z" fill="#01080c"/>
<path d="M28.7 35.9C33.4 34.2 38 34.6 42.6 36.2M33.2 39.4C36.8 38.4 40.3 38.8 43.6 40.2M67.3 36C62.6 34.4 58 34.8 53.4 36.4M62.8 39.6C59.2 38.6 55.7 39 52.4 40.4" fill="none" stroke="#77b3bf" stroke-opacity=".035" stroke-width=".19" stroke-linecap="round"/>
</g>
<g data-brand-texture="" data-brand-depth="mid" fill="none" stroke-linecap="round"><path d="M10.6 91.4C16.7 74.7 24.9 60.2 34.7 50.7C38 47.5 41.1 45.3 44.1 44.2M18.2 95.3C22.8 80.1 29.4 65.8 38.7 54.4C41 51.6 43 49.5 44.9 47.8M85.4 91.5C79.3 74.8 71.1 60.4 61.3 50.9C58 47.7 54.9 45.5 51.9 44.4M77.8 95.4C73.2 80.2 66.6 66 57.3 54.6C55 51.8 53 49.7 51.1 48" stroke="#6aaab5" stroke-opacity=".03" stroke-width=".22"/></g>
<g data-brand-rim-light="" data-brand-depth="near-light" fill="none" stroke-linecap="round" filter="url(#__GLOW__)">
<path d="M34 31.3C36.1 27 37.3 22.4 38.7 17.8" stroke="#e2fdff" stroke-opacity=".63" stroke-width=".35"/>
<path d="M39.8 15.5C41.5 11.7 44.4 8.5 47.4 7.4" stroke="#f4ffff" stroke-opacity=".78" stroke-width=".39"/>
<path d="M48.3 7.5C51.6 8.7 54.4 11.9 56.1 15.9" stroke="#b1f2ff" stroke-opacity=".61" stroke-width=".35"/>
<path d="M57 17.9C58.5 22.3 59.8 26.8 61.8 31.2" stroke="#72dcef" stroke-opacity=".43" stroke-width=".29"/>
<path d="M33.7 31.7C29.8 34.5 26.8 38.2 24.4 42.8M22.5 47.2C20.5 51.6 18.7 56.4 16.8 61.5" stroke="#aeeeff" stroke-opacity=".24" stroke-width=".22"/>
<path d="M62.1 31.7C66 34.5 69.1 38.3 71.6 42.9M73.5 47.3C75.5 51.7 77.3 56.5 79.2 61.7" stroke="#5ccde8" stroke-opacity=".18" stroke-width=".2"/>
</g>
<g data-brand-seams="" data-brand-depth="mid" fill="none" stroke="#5d9ca8" stroke-opacity=".019" stroke-width=".19" stroke-linecap="round"><path d="M16.7 61.5C24.8 54.1 34 49.5 43.8 49.7M79.3 61.7C71.2 54.3 62 49.7 52.2 49.9M12.4 80.2C21.6 67.4 32.2 59.1 44.8 54.7M83.6 80.4C74.4 67.6 63.8 59.3 51.2 54.9"/></g>
</g>`;
const zeroDepth = {
'--brand-atmosphere-x':'0px','--brand-atmosphere-y':'0px','--brand-atmosphere-r':'0deg',
'--brand-energy-x':'0px','--brand-energy-y':'0px','--brand-energy-r':'0deg',
'--brand-figure-x':'0px','--brand-figure-y':'0px',
'--brand-folds-x':'0px','--brand-folds-y':'0px',
'--brand-hood-x':'0px','--brand-hood-y':'0px',
'--brand-hood-layers-x':'0px','--brand-hood-layers-y':'0px',
'--brand-face-x':'0px','--brand-face-y':'0px',
'--brand-collar-x':'0px','--brand-collar-y':'0px',
'--brand-rim-x':'0px','--brand-rim-y':'0px',
'--brand-texture-x':'0px','--brand-texture-y':'0px'
} as const;
type DepthProperty = keyof typeof zeroDepth;
export function BrandMark({ size='md', className }: BrandMarkProps) {
const reducedMotion = useReducedMotion();
const compact = size === 'sm';
const id = useId().replace(/:/g,'');
const markRef = useRef<HTMLSpanElement>(null);
const frameRef = useRef<number | null>(null);
const pointerRef = useRef({ x:0, y:0 });
const markup = useMemo(() => VECTOR_BODY
.split('__CLOAK__').join(`${id}-cloak`)
.split('__HOOD__').join(`${id}-hood`)
.split('__LEFT__').join(`${id}-left`)
.split('__RIGHT__').join(`${id}-right`)
.split('__MIST__').join(`${id}-mist`)
.split('__SOFT__').join(`${id}-soft`)
.split('__GLOW__').join(`${id}-glow`), [id]);
const applyDepth = (x:number, y:number) => {
const node = markRef.current;
if (!node) return;
const set = (property:DepthProperty, value:string) => node.style.setProperty(property,value);
set('--brand-atmosphere-x',`${(-x*1.35).toFixed(3)}px`);
set('--brand-atmosphere-y',`${(-y*.9).toFixed(3)}px`);
set('--brand-atmosphere-r',`${(-x*.28).toFixed(3)}deg`);
set('--brand-energy-x',`${(x*1.75).toFixed(3)}px`);
set('--brand-energy-y',`${(y*1.2).toFixed(3)}px`);
set('--brand-energy-r',`${(x*.36).toFixed(3)}deg`);
set('--brand-figure-x',`${(x*.22).toFixed(3)}px`);
set('--brand-figure-y',`${(y*.16).toFixed(3)}px`);
set('--brand-folds-x',`${(x*.55).toFixed(3)}px`);
set('--brand-folds-y',`${(y*.38).toFixed(3)}px`);
set('--brand-hood-x',`${(x*.68).toFixed(3)}px`);
set('--brand-hood-y',`${(y*.48).toFixed(3)}px`);
set('--brand-hood-layers-x',`${(x*1.02).toFixed(3)}px`);
set('--brand-hood-layers-y',`${(y*.72).toFixed(3)}px`);
set('--brand-face-x',`${(-x*.24).toFixed(3)}px`);
set('--brand-face-y',`${(-y*.16).toFixed(3)}px`);
set('--brand-collar-x',`${(x*.82).toFixed(3)}px`);
set('--brand-collar-y',`${(y*.58).toFixed(3)}px`);
set('--brand-rim-x',`${(x*1.28).toFixed(3)}px`);
set('--brand-rim-y',`${(y*.88).toFixed(3)}px`);
set('--brand-texture-x',`${(x*.38).toFixed(3)}px`);
set('--brand-texture-y',`${(y*.27).toFixed(3)}px`);
};
const resetDepth = () => {
const node = markRef.current;
if (!node) return;
node.dataset.brandInteraction = 'idle';
for (const [property,value] of Object.entries(zeroDepth)) node.style.setProperty(property,value);
};
const scheduleDepth = () => {
if (frameRef.current != null) return;
frameRef.current = requestAnimationFrame(() => {
frameRef.current = null;
applyDepth(pointerRef.current.x,pointerRef.current.y);
});
};
useEffect(() => {
if (reducedMotion) resetDepth();
return () => {
if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
};
}, [reducedMotion]);
return <motion.span
ref={markRef}
data-brand-mark
data-brand-version={BRAND_VERSION}
data-brand-renderer="inline-vector"
data-brand-vector-source={VECTOR_SOURCE}
data-brand-interaction="idle"
data-brand-parallax="layered-v1"
className={cn('relative inline-flex shrink-0 items-center justify-center overflow-visible',sizes[size],className)}
initial={false}
animate="idle"
whileHover={reducedMotion ? undefined : 'hover'}
onPointerEnter={event => {
if (!reducedMotion && event.pointerType !== 'touch') event.currentTarget.dataset.brandInteraction='active';
}}
onPointerMove={event => {
if (reducedMotion || event.pointerType === 'touch') return;
const box = event.currentTarget.getBoundingClientRect();
pointerRef.current = {
x:Math.max(-1,Math.min(1,((event.clientX-box.left)/box.width)*2-1)),
y:Math.max(-1,Math.min(1,((event.clientY-box.top)/box.height)*2-1)),
};
event.currentTarget.dataset.brandInteraction='active';
scheduleDepth();
}}
onPointerLeave={resetDepth}
onPointerCancel={resetDepth}
>
<motion.svg
data-brand-vector
className="h-full w-full overflow-visible"
viewBox="0 0 96 96"
role="img"
aria-labelledby={`${id}-brand-title ${id}-brand-description`}
focusable="false"
style={{pointerEvents:'none'}}
variants={{
idle:{
y:0,
scale:1,
filter:compact
? 'drop-shadow(0 3px 6px rgba(0,4,13,.82)) drop-shadow(0 0 7px rgba(46,216,255,.18))'
: 'drop-shadow(0 5px 12px rgba(0,4,13,.84)) drop-shadow(0 0 11px rgba(46,216,255,.2))',
},
hover:{
y:compact ? -.5 : -.8,
scale:compact ? 1.018 : 1.025,
filter:compact
? 'drop-shadow(0 5px 10px rgba(0,7,18,.86)) drop-shadow(0 0 11px rgba(65,220,255,.27))'
: 'drop-shadow(0 8px 18px rgba(0,7,18,.88)) drop-shadow(0 0 17px rgba(65,220,255,.29))',
transition:{duration:.78,ease:premiumEase},
},
}}
>
<title id={`${id}-brand-title`}>THE LEGENDARY POET</title>
<desc id={`${id}-brand-description`}>Безликая фигура в высоком капюшоне с узкой горловиной, ниспадающим смятым клобуком, тяжёлым почти чёрным плащом и рваной холодной верхне-боковой аурой без нижнего дыма</desc>
<style>{LAYER_MOTION_CSS}</style>
<g dangerouslySetInnerHTML={{__html:markup}} />
</motion.svg>
</motion.span>;
}
export default BrandMark;
