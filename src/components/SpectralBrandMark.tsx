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
[data-spectral-brand]{isolation:isolate;perspective:720px;contain:layout style;touch-action:manipulation}
[data-spectral-brand] [data-brand-raster-stage]{position:relative;display:block;width:100%;height:100%;transform-style:preserve-3d;backface-visibility:hidden}
[data-spectral-brand] [data-brand-raster-layer]{position:absolute;inset:-8%;display:block;pointer-events:none;transform-style:preserve-3d;backface-visibility:hidden;transition:opacity 420ms cubic-bezier(.16,1,.3,1),filter 420ms cubic-bezier(.16,1,.3,1)}
[data-spectral-brand] [data-brand-raster-layer] img{display:block;width:100%;height:100%;object-fit:contain;user-select:none;-webkit-user-drag:none;backface-visibility:hidden;transform:translateZ(0)}
[data-spectral-brand] [data-brand-raster-shadow]{opacity:.46}
[data-spectral-brand] [data-brand-raster-shadow] img{opacity:.92;filter:brightness(0) blur(1.2px);transform:translate3d(0,3.5%,0) scale(.985)}
[data-spectral-brand] [data-brand-raster-base] img{filter:brightness(.945) saturate(1.05) contrast(1.075)}
[data-spectral-brand] [data-brand-raster-hood]{clip-path:polygon(18% 0,82% 0,88% 47%,12% 47%);opacity:.12;mix-blend-mode:screen}
[data-spectral-brand] [data-brand-raster-hood] img{filter:brightness(.76) saturate(1.08) contrast(1.26)}
[data-spectral-brand] [data-brand-raster-hood-depth]{clip-path:polygon(28% 4%,72% 4%,79% 38%,63% 48%,37% 48%,21% 38%);opacity:.105;mix-blend-mode:screen}
[data-spectral-brand] [data-brand-raster-hood-depth] img{filter:brightness(.64) saturate(1.13) contrast(1.42)}
[data-spectral-brand] [data-brand-raster-face]{clip-path:polygon(36% 17%,64% 17%,68% 42%,57% 51%,43% 51%,32% 42%);opacity:.34;mix-blend-mode:multiply}
[data-spectral-brand] [data-brand-raster-face] img{filter:brightness(.22) saturate(.7) contrast(1.7)}
[data-spectral-brand] [data-brand-raster-cloth]{clip-path:polygon(2% 36%,98% 36%,100% 100%,0 100%);opacity:.145;mix-blend-mode:screen}
[data-spectral-brand] [data-brand-raster-cloth] img{filter:brightness(.74) saturate(1.16) contrast(1.24)}
[data-spectral-brand] [data-brand-raster-collar]{clip-path:polygon(25% 34%,75% 34%,84% 65%,16% 65%);opacity:.13;mix-blend-mode:screen}
[data-spectral-brand] [data-brand-raster-collar] img{filter:brightness(.88) saturate(1.12) contrast(1.32)}
[data-spectral-brand] [data-brand-raster-texture]{clip-path:polygon(8% 18%,92% 18%,100% 100%,0 100%);opacity:.065;mix-blend-mode:screen}
[data-spectral-brand] [data-brand-raster-texture] img{filter:brightness(1.04) saturate(1.2) contrast(1.18)}
[data-spectral-brand] [data-brand-raster-energy]{opacity:.185;mix-blend-mode:screen}
[data-spectral-brand] [data-brand-raster-energy] img{filter:brightness(1.32) saturate(1.42) contrast(1.18) drop-shadow(0 0 4px rgba(71,213,255,.3))}
[data-spectral-brand] [data-brand-raster-rim]{clip-path:polygon(9% 0,91% 0,99% 82%,1% 82%);opacity:.075;mix-blend-mode:screen}
[data-spectral-brand] [data-brand-raster-rim] img{filter:brightness(1.72) saturate(1.25) contrast(1.2) blur(.1px)}
[data-spectral-brand][data-brand-compact="true"] [data-brand-raster-layer]{inset:-5%}
[data-spectral-brand][data-brand-compact="true"] [data-brand-raster-shadow]{opacity:.32}
[data-spectral-brand][data-brand-compact="true"] [data-brand-raster-hood],[data-spectral-brand][data-brand-compact="true"] [data-brand-raster-hood-depth],[data-spectral-brand][data-brand-compact="true"] [data-brand-raster-face],[data-spectral-brand][data-brand-compact="true"] [data-brand-raster-collar],[data-spectral-brand][data-brand-compact="true"] [data-brand-raster-texture]{display:none}
[data-spectral-brand][data-brand-compact="true"] [data-brand-raster-cloth]{opacity:.075}
[data-spectral-brand][data-brand-compact="true"] [data-brand-raster-energy]{opacity:.115}
[data-spectral-brand][data-brand-compact="true"] [data-brand-raster-rim]{opacity:.045}
@media (hover:hover) and (pointer:fine){
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-shadow]{opacity:.61}
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-base] img{filter:brightness(1.015) saturate(1.1) contrast(1.09)}
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-hood]{opacity:.205}
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-hood-depth]{opacity:.19}
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-face]{opacity:.48}
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-cloth]{opacity:.265}
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-collar]{opacity:.22}
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-texture]{opacity:.12}
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-energy]{opacity:.37}
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-energy] img{filter:brightness(1.56) saturate(1.52) contrast(1.22) drop-shadow(0 0 7px rgba(80,222,255,.46))}
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-rim]{opacity:.175}
[data-spectral-brand][data-brand-interaction="settling"] [data-brand-raster-shadow]{opacity:.53}
[data-spectral-brand][data-brand-interaction="settling"] [data-brand-raster-hood]{opacity:.16}
[data-spectral-brand][data-brand-interaction="settling"] [data-brand-raster-hood-depth]{opacity:.145}
[data-spectral-brand][data-brand-interaction="settling"] [data-brand-raster-face]{opacity:.41}
[data-spectral-brand][data-brand-interaction="settling"] [data-brand-raster-cloth]{opacity:.2}
[data-spectral-brand][data-brand-interaction="settling"] [data-brand-raster-collar]{opacity:.17}
[data-spectral-brand][data-brand-interaction="settling"] [data-brand-raster-texture]{opacity:.09}
[data-spectral-brand][data-brand-interaction="settling"] [data-brand-raster-energy]{opacity:.265}
[data-spectral-brand][data-brand-interaction="settling"] [data-brand-raster-rim]{opacity:.115}
}
a:focus-visible [data-spectral-brand] [data-brand-raster-energy],button:focus-visible [data-spectral-brand] [data-brand-raster-energy]{opacity:.33}
a:focus-visible [data-spectral-brand] [data-brand-raster-rim],button:focus-visible [data-spectral-brand] [data-brand-raster-rim]{opacity:.155}
@media (prefers-reduced-motion:reduce){
[data-spectral-brand] [data-brand-raster-stage],[data-spectral-brand] [data-brand-raster-layer]{transform:none!important;transition:none!important;will-change:auto!important}
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-energy]{opacity:.285}
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-rim]{opacity:.125}
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
      data-brand-raster-version="spectral-raster-20260803-2"
      data-brand-renderer="transparent-raster-semantic-depth-layers"
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
        <span
          data-brand-raster-layer
          data-brand-raster-shadow
          data-brand-atmosphere
          data-brand-neck-shadow
          data-brand-depth="far"
        >
          {layerImage('shadow')}
        </span>
        <span
          data-brand-raster-layer
          data-brand-raster-base
          data-brand-figure
          data-brand-cloak
          data-brand-depth="base"
        >
          {layerImage('base')}
        </span>
        <span data-brand-raster-layer data-brand-raster-hood data-brand-hood data-brand-depth="mid-hood">
          {layerImage('hood')}
        </span>
        <span
          data-brand-raster-layer
          data-brand-raster-hood-depth
          data-brand-hood-layers
          data-brand-depth="near-hood"
        >
          {layerImage('hood-depth')}
        </span>
        <span
          data-brand-raster-layer
          data-brand-raster-face
          data-brand-face-void
          data-brand-face-depth
          data-brand-depth="recessed-face"
        >
          {layerImage('face-depth')}
        </span>
        <span
          data-brand-raster-layer
          data-brand-raster-cloth
          data-brand-folds
          data-brand-upper-folds
          data-brand-epic-folds
          data-brand-depth="mid-cloth"
        >
          {layerImage('cloth')}
        </span>
        <span
          data-brand-raster-layer
          data-brand-raster-collar
          data-brand-collar
          data-brand-throat
          data-brand-depth="near-collar"
        >
          {layerImage('collar')}
        </span>
        <span
          data-brand-raster-layer
          data-brand-raster-texture
          data-brand-texture
          data-brand-seams
          data-brand-depth="surface-texture"
        >
          {layerImage('texture')}
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
