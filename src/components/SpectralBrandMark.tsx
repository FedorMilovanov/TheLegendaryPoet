import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '../utils/cn';
import { asset } from '../utils/asset';
import {
  BRAND_MOTION_CSS,
  createBrandMotionController,
  type BrandMotionController,
} from './brandMotionFrameInvariant';

type SpectralBrandSize = 'sm' | 'md' | 'lg' | 'xl';
type SpectralBrandVariant = 'auto' | 'primary' | 'simplified' | 'micro' | 'header';

interface SpectralBrandMarkProps {
  size?: SpectralBrandSize;
  variant?: SpectralBrandVariant;
  className?: string;
  interactive?: boolean;
  priority?: boolean;
}

const squareSizes: Record<SpectralBrandSize, string> = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-28 w-28',
  xl: 'h-44 w-44',
};

const headerSizes: Record<SpectralBrandSize, string> = {
  sm: 'h-10 w-16',
  md: 'h-14 w-24',
  lg: 'h-24 w-36',
  xl: 'h-36 w-56',
};

const sources: Record<Exclude<SpectralBrandVariant, 'auto'>, string> = {
  primary: '/brand-emblem-primary.png',
  simplified: '/brand-emblem-simplified.png',
  micro: '/brand-emblem-micro.png',
  header: '/brand-emblem-header.png',
};

const resolveVariant = (size: SpectralBrandSize, variant: SpectralBrandVariant) => {
  if (variant !== 'auto') return variant;
  if (size === 'sm') return 'micro';
  if (size === 'md') return 'simplified';
  return 'primary';
};

const SPECTRAL_RASTER_CSS = `
[data-spectral-brand]{isolation:isolate;perspective:680px;contain:layout style;touch-action:manipulation}
[data-spectral-brand] [data-brand-raster-stage]{position:relative;display:block;width:100%;height:100%;transform-style:preserve-3d;backface-visibility:hidden}
[data-spectral-brand] [data-brand-raster-layer]{position:absolute;inset:-8%;display:block;pointer-events:none;transform-style:preserve-3d;backface-visibility:hidden}
[data-spectral-brand] [data-brand-raster-layer] img{display:block;width:100%;height:100%;object-fit:contain;user-select:none;-webkit-user-drag:none;backface-visibility:hidden;transform:translateZ(0)}
[data-spectral-brand] [data-brand-raster-shadow] img{opacity:.48;filter:brightness(0) blur(1.15px);transform:translate3d(0,3.4%,0) scale(.985)}
[data-spectral-brand] [data-brand-raster-base] img{filter:brightness(.96) saturate(1.04) contrast(1.055)}
[data-spectral-brand] [data-brand-raster-cloth]{clip-path:polygon(2% 38%,98% 38%,100% 100%,0 100%);opacity:.15;mix-blend-mode:screen}
[data-spectral-brand] [data-brand-raster-cloth] img{filter:brightness(.78) saturate(1.16) contrast(1.22)}
[data-spectral-brand] [data-brand-raster-energy]{opacity:.19;mix-blend-mode:screen}
[data-spectral-brand] [data-brand-raster-energy] img{filter:brightness(1.34) saturate(1.38) contrast(1.16) drop-shadow(0 0 4px rgba(71,213,255,.3))}
[data-spectral-brand] [data-brand-raster-rim]{clip-path:polygon(10% 0,90% 0,98% 78%,2% 78%);opacity:.08;mix-blend-mode:screen}
[data-spectral-brand] [data-brand-raster-rim] img{filter:brightness(1.7) saturate(1.22) contrast(1.18) blur(.12px)}
[data-spectral-brand][data-brand-compact="true"] [data-brand-raster-layer]{inset:-5%}
[data-spectral-brand][data-brand-compact="true"] [data-brand-raster-shadow]{opacity:.34}
[data-spectral-brand][data-brand-compact="true"] [data-brand-raster-cloth]{opacity:.08}
[data-spectral-brand][data-brand-compact="true"] [data-brand-raster-energy]{opacity:.12}
[data-spectral-brand][data-brand-compact="true"] [data-brand-raster-rim]{opacity:.05}
@media (hover:hover) and (pointer:fine){
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-shadow]{opacity:.62}
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-base] img{filter:brightness(1.025) saturate(1.09) contrast(1.07)}
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-cloth]{opacity:.27}
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-energy]{opacity:.38}
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-energy] img{filter:brightness(1.58) saturate(1.5) contrast(1.2) drop-shadow(0 0 7px rgba(80,222,255,.46))}
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-rim]{opacity:.18}
[data-spectral-brand][data-brand-interaction="settling"] [data-brand-raster-shadow]{opacity:.54}
[data-spectral-brand][data-brand-interaction="settling"] [data-brand-raster-cloth]{opacity:.2}
[data-spectral-brand][data-brand-interaction="settling"] [data-brand-raster-energy]{opacity:.27}
[data-spectral-brand][data-brand-interaction="settling"] [data-brand-raster-rim]{opacity:.12}
}
a:focus-visible [data-spectral-brand] [data-brand-raster-energy],button:focus-visible [data-spectral-brand] [data-brand-raster-energy]{opacity:.34}
a:focus-visible [data-spectral-brand] [data-brand-raster-rim],button:focus-visible [data-spectral-brand] [data-brand-raster-rim]{opacity:.16}
@media (prefers-reduced-motion:reduce){
[data-spectral-brand] [data-brand-raster-stage],[data-spectral-brand] [data-brand-raster-layer]{transform:none!important;transition:none!important;will-change:auto!important}
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-energy]{opacity:.29}
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-rim]{opacity:.13}
}
`;

export function SpectralBrandMark({
  size = 'md',
  variant = 'auto',
  className,
  interactive = true,
  priority = false,
}: SpectralBrandMarkProps) {
  const reducedMotion = useReducedMotion();
  const markRef = useRef<HTMLSpanElement>(null);
  const controllerRef = useRef<BrandMotionController | null>(null);
  const resolvedVariant = resolveVariant(size, variant);
  const src = asset(sources[resolvedVariant]);
  const compact = size === 'sm' || resolvedVariant === 'micro';

  useEffect(() => {
    const node = markRef.current;
    controllerRef.current?.destroy();
    controllerRef.current = null;
    if (!node || reducedMotion || !interactive) return;

    const controller = createBrandMotionController(node);
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
  }, [interactive, reducedMotion, resolvedVariant]);

  const setReducedState = (state: 'active' | 'idle') => {
    if (markRef.current) markRef.current.dataset.brandInteraction = state;
  };

  const handleEnter = (clientX: number, clientY: number) => {
    if (!interactive) return;
    if (reducedMotion) {
      setReducedState('active');
      return;
    }
    controllerRef.current?.enter(clientX, clientY);
  };

  const handleLeave = () => {
    if (!interactive) return;
    if (reducedMotion) {
      setReducedState('idle');
      return;
    }
    controllerRef.current?.leave();
  };

  const layerImage = (layer: string) => (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
      loading={priority ? 'eager' : 'lazy'}
      data-brand-raster-image={layer}
    />
  );

  return (
    <span
      ref={markRef}
      data-brand-mark
      data-spectral-brand
      data-brand-version="cloak-20260801-22"
      data-brand-raster-version="spectral-raster-20260803-1"
      data-brand-renderer="transparent-raster-layers"
      data-brand-vector-source="canonical-reference-v2-black-monolith-v17-0"
      data-brand-interaction="idle"
      data-brand-parallax="spring-awakening-v5"
      data-brand-motion-normalization="rendered-box-v1"
      data-brand-motion-timestep="bounded-substeps-v1"
      data-brand-awakening="aura-depth-cloth-v2"
      data-brand-compact={compact ? 'true' : 'false'}
      data-brand-raster-variant={resolvedVariant}
      role="img"
      aria-label="THE LEGENDARY POET"
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-visible',
        resolvedVariant === 'header' ? headerSizes[size] : squareSizes[size],
        className,
      )}
      onPointerEnter={(event) => {
        if (event.pointerType === 'touch') return;
        handleEnter(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (!interactive || reducedMotion || event.pointerType === 'touch') return;
        controllerRef.current?.move(event.clientX, event.clientY);
      }}
      onPointerLeave={handleLeave}
      onPointerCancel={() => {
        if (!interactive) return;
        if (reducedMotion) {
          setReducedState('idle');
          return;
        }
        controllerRef.current?.cancel();
      }}
    >
      <style>{BRAND_MOTION_CSS}{SPECTRAL_RASTER_CSS}</style>
      <span data-brand-vector data-brand-raster-stage aria-hidden="true">
        <span data-brand-raster-layer data-brand-raster-shadow data-brand-atmosphere data-brand-depth="far">
          {layerImage('shadow')}
        </span>
        <span data-brand-raster-layer data-brand-raster-base data-brand-figure data-brand-depth="base">
          {layerImage('base')}
        </span>
        <span data-brand-raster-layer data-brand-raster-cloth data-brand-folds data-brand-depth="mid">
          {layerImage('cloth')}
        </span>
        <span data-brand-raster-layer data-brand-raster-energy data-brand-energy data-brand-depth="near-light">
          {layerImage('energy')}
        </span>
        <span data-brand-raster-layer data-brand-raster-rim data-brand-rim-light data-brand-depth="front">
          {layerImage('rim')}
        </span>
      </span>
    </span>
  );
}

export default SpectralBrandMark;
