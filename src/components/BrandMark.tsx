import { useEffect, useId, useMemo, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '../utils/cn';
import rawVector from './brandEmblemV18.svg?raw';
import {
  BRAND_MOTION_CSS,
  createBrandMotionController,
  type BrandMotionController,
} from './brandMotionV18';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
};

const BRAND_VERSION = 'cloak-20260801-22';
const VECTOR_SOURCE = 'canonical-reference-v2-black-monolith-v17-0';
const RAW_BODY = rawVector.slice(rawVector.indexOf('<defs>'), rawVector.lastIndexOf('</svg>'));
const ids = ['cloak', 'hood', 'left', 'right', 'mist', 'soft', 'glow'] as const;

const replaceEvery = (value: string, search: string, replacement: string) =>
  value.split(search).join(replacement);

export function BrandMark({ size = 'md', className }: BrandMarkProps) {
  const reducedMotion = useReducedMotion();
  const compact = size === 'sm';
  const id = useId().replace(/:/g, '');
  const markRef = useRef<HTMLSpanElement>(null);
  const controllerRef = useRef<BrandMotionController | null>(null);

  const markup = useMemo(
    () =>
      ids.reduce(
        (body, key) =>
          replaceEvery(
            replaceEvery(body, `id="${key}"`, `id="${id}-${key}"`),
            `url(#${key})`,
            `url(#${id}-${key})`,
          ),
        RAW_BODY,
      ),
    [id],
  );

  useEffect(() => {
    const node = markRef.current;
    controllerRef.current?.destroy();
    controllerRef.current = null;
    if (!node || reducedMotion) return;

    const controller = createBrandMotionController(node);
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
  }, [reducedMotion, markup]);

  const setReducedState = (state: 'active' | 'idle') => {
    if (markRef.current) markRef.current.dataset.brandInteraction = state;
  };

  return (
    <span
      ref={markRef}
      data-brand-mark
      data-brand-version={BRAND_VERSION}
      data-brand-renderer="inline-vector"
      data-brand-vector-source={VECTOR_SOURCE}
      data-brand-interaction="idle"
      data-brand-parallax="spring-awakening-v4"
      data-brand-motion-normalization="rendered-box-v1"
      data-brand-awakening="aura-depth-cloth-v2"
      data-brand-compact={compact ? 'true' : 'false'}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-visible',
        sizes[size],
        className,
      )}
      onPointerEnter={(event) => {
        if (event.pointerType === 'touch') return;
        if (reducedMotion) {
          setReducedState('active');
          return;
        }
        controllerRef.current?.enter(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (reducedMotion || event.pointerType === 'touch') return;
        controllerRef.current?.move(event.clientX, event.clientY);
      }}
      onPointerLeave={() => {
        if (reducedMotion) {
          setReducedState('idle');
          return;
        }
        controllerRef.current?.leave();
      }}
      onPointerCancel={() => {
        if (reducedMotion) {
          setReducedState('idle');
          return;
        }
        controllerRef.current?.cancel();
      }}
    >
      <svg
        data-brand-vector
        className="h-full w-full overflow-visible"
        viewBox="0 0 96 96"
        role="img"
        aria-labelledby={`${id}-brand-title ${id}-brand-description`}
        focusable="false"
        style={{ pointerEvents: 'none' }}
      >
        <title id={`${id}-brand-title`}>THE LEGENDARY POET</title>
        <desc id={`${id}-brand-description`}>
          Монументальная почти чёрная фигура в высоком капюшоне с глубокой безликой
          пустотой, тяжёлым плащом и холодной верхне-боковой энергией
        </desc>
        <style>{BRAND_MOTION_CSS}</style>
        <g dangerouslySetInnerHTML={{ __html: markup }} />
      </svg>
    </span>
  );
}

export default BrandMark;
