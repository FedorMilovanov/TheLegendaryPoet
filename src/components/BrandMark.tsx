import { useEffect, useId, useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../utils/cn';
import rawVector from './brandEmblemV17.svg?raw';
import { applyBrandDepth, LAYER_MOTION_CSS, resetBrandDepth } from './brandMotionV17';

interface BrandMarkProps { size?: 'sm' | 'md' | 'lg'; className?: string; }
const sizes={sm:'h-12 w-12',md:'h-16 w-16',lg:'h-24 w-24'};
const premiumEase=[.16,1,.3,1] as const;
const BRAND_VERSION='cloak-20260729-20';
const VECTOR_SOURCE='canonical-reference-v2-black-monolith-v17-0';
const RAW_BODY=rawVector.slice(rawVector.indexOf('<defs>'),rawVector.lastIndexOf('</svg>'));
const ids=['cloak','hood','left','right','mist','soft','glow'] as const;

export function BrandMark({size='md',className}:BrandMarkProps){
  const reducedMotion=useReducedMotion(),compact=size==='sm',id=useId().replace(/:/g,'');
  const markRef=useRef<HTMLSpanElement>(null),frameRef=useRef<number|null>(null),pointerRef=useRef({x:0,y:0});
  const markup=useMemo(()=>ids.reduce((body,key)=>body.replaceAll(`id="${key}"`,`id="${id}-${key}"`).replaceAll(`url(#${key})`,`url(#${id}-${key})`),RAW_BODY),[id]);
  const reset=()=>{if(markRef.current)resetBrandDepth(markRef.current)};
  const schedule=()=>{if(frameRef.current!=null)return;frameRef.current=requestAnimationFrame(()=>{frameRef.current=null;if(markRef.current)applyBrandDepth(markRef.current,pointerRef.current.x,pointerRef.current.y)})};
  useEffect(()=>{if(reducedMotion)reset();return()=>{if(frameRef.current!=null)cancelAnimationFrame(frameRef.current)}},[reducedMotion]);
  return <motion.span ref={markRef} data-brand-mark data-brand-version={BRAND_VERSION} data-brand-renderer="inline-vector" data-brand-vector-source={VECTOR_SOURCE} data-brand-interaction="idle" data-brand-parallax="layered-v1" className={cn('relative inline-flex shrink-0 items-center justify-center overflow-visible',sizes[size],className)} initial={false} animate="idle" whileHover={reducedMotion?undefined:'hover'}
    onPointerEnter={e=>{if(!reducedMotion&&e.pointerType!=='touch')e.currentTarget.dataset.brandInteraction='active'}}
    onPointerMove={e=>{if(reducedMotion||e.pointerType==='touch')return;const b=e.currentTarget.getBoundingClientRect();pointerRef.current={x:Math.max(-1,Math.min(1,((e.clientX-b.left)/b.width)*2-1)),y:Math.max(-1,Math.min(1,((e.clientY-b.top)/b.height)*2-1))};e.currentTarget.dataset.brandInteraction='active';schedule()}}
    onPointerLeave={reset} onPointerCancel={reset}>
    <motion.svg data-brand-vector className="h-full w-full overflow-visible" viewBox="0 0 96 96" role="img" aria-labelledby={`${id}-brand-title ${id}-brand-description`} focusable="false" style={{pointerEvents:'none'}} variants={{idle:{y:0,scale:1,filter:compact?'drop-shadow(0 3px 6px rgba(0,4,13,.82)) drop-shadow(0 0 7px rgba(46,216,255,.18))':'drop-shadow(0 5px 12px rgba(0,4,13,.84)) drop-shadow(0 0 11px rgba(46,216,255,.2))'},hover:{y:compact?-.5:-.8,scale:compact?1.018:1.025,filter:compact?'drop-shadow(0 5px 10px rgba(0,7,18,.86)) drop-shadow(0 0 11px rgba(65,220,255,.27))':'drop-shadow(0 8px 18px rgba(0,7,18,.88)) drop-shadow(0 0 17px rgba(65,220,255,.29))',transition:{duration:.78,ease:premiumEase}}}}>
      <title id={`${id}-brand-title`}>THE LEGENDARY POET</title><desc id={`${id}-brand-description`}>Почти чёрная монолитная фигура в высоком тяжёлом капюшоне, с глубокой безликой пустотой, скрытой узкой шеей, смятым клобуком, широким эпическим плащом и рваной холодной верхне-боковой энергией без нижнего дыма</desc><style>{LAYER_MOTION_CSS}</style><g dangerouslySetInnerHTML={{__html:markup}}/>
    </motion.svg>
  </motion.span>;
}
export default BrandMark;
