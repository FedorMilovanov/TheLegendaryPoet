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

const APPROVED_RGBA_CSS = `
[data-spectral-brand]{isolation:isolate;contain:layout style;touch-action:manipulation}
[data-spectral-brand] [data-brand-raster-stage]{position:relative;display:block;width:100%;height:100%;overflow:visible;background:transparent;transform:translate3d(0,var(--brand-root-y,0px),0) scale(var(--brand-root-scale,1));transform-origin:50% 55%;will-change:transform}
[data-spectral-brand] [data-brand-raster-layer]{position:absolute;inset:0;display:block;pointer-events:none;transform-origin:50% 55%;backface-visibility:hidden;will-change:transform,opacity;transition:opacity 320ms cubic-bezier(.16,1,.3,1)}
[data-spectral-brand] [data-brand-raster-layer] img{display:block;width:100%;height:100%;object-fit:contain;user-select:none;-webkit-user-drag:none;backface-visibility:hidden}
[data-spectral-brand] [data-brand-raster-base]{transform:translate3d(var(--brand-figure-x,0px),var(--brand-figure-y,0px),0)}
[data-spectral-brand] [data-brand-raster-aura]{opacity:.008;transform:translate3d(var(--brand-aura-x,0px),var(--brand-aura-y,0px),0) scale(var(--brand-aura-scale,1))}
[data-spectral-brand][data-brand-compact="true"] [data-brand-raster-aura]{opacity:.004}
@media (hover:hover) and (pointer:fine){
[data-spectral-brand][data-brand-interaction="active"] [data-brand-raster-aura]{opacity:.02}
[data-spectral-brand][data-brand-interaction="settling"] [data-brand-raster-aura]{opacity:.012}
[data-spectral-brand][data-brand-compact="true"][data-brand-interaction="active"] [data-brand-raster-aura]{opacity:.01}
[data-spectral-brand][data-brand-compact="true"][data-brand-interaction="settling"] [data-brand-raster-aura]{opacity:.006}
}
a:focus-visible [data-spectral-brand] [data-brand-raster-aura],button:focus-visible [data-spectral-brand] [data-brand-raster-aura]{opacity:.012}
@media (prefers-reduced-motion:reduce){
[data-spectral-brand] [data-brand-raster-stage],[data-spectral-brand] [data-brand-raster-layer]{transform:none!important;transition:none!important;will-change:auto!important}
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
      data-brand-release="approved-rgba-20260803-1"
      data-brand-raster-version="approved-transparent-family-20260803-1"
      data-brand-renderer="approved-rgba-family-subtle-depth"
      data-brand-reference-source="generated-transparent-rgba-family"
      data-brand-interaction="idle"
      data-brand-parallax="subtle-rgba-depth-v1"
      data-brand-motion-normalization="rendered-box-v1"
      data-brand-motion-timestep="bounded-substeps-v1"
      data-brand-awakening="approved-rgba-subtle-depth-v1"
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
      <style>{BRAND_MOTION_CSS}{APPROVED_RGBA_CSS}</style>
      <span data-brand-raster-stage aria-hidden="true">
        <span data-brand-raster-layer data-brand-raster-base data-brand-figure>
          {layerImage('base')}
        </span>
        <span data-brand-raster-layer data-brand-raster-aura data-brand-aura>
          {layerImage('depth')}
        </span>
      </span>
    </span>
  );
}

export default SpectralBrandMark;
