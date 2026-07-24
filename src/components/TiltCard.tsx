import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent, ReactNode } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  /** Subtle moving highlight; disabled automatically for reduced motion and touch pointers. */
  sheen?: boolean;
}

/**
 * Pointer-driven tilt with a stable, non-transforming hit surface. Geometry is
 * cached per hover, writes are RAF-batched and lerped, offscreen cards stop
 * painting, and the visual plane is flattened before navigation snapshots.
 */
export default function TiltCard({
  children,
  className = '',
  intensity = 6,
  sheen = true,
}: TiltCardProps) {
  const hitRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const settleFrameRef = useRef<number | null>(null);
  const willChangeTimerRef = useRef<number | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const targetRef = useRef({ x: 0.5, y: 0.5 });
  const currentRef = useRef({ x: 0.5, y: 0.5 });
  const enabledRef = useRef(true);
  const visibleRef = useRef(true);

  const cancelFrame = useCallback(() => {
    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const cancelSettleFrame = useCallback(() => {
    if (settleFrameRef.current != null) {
      cancelAnimationFrame(settleFrameRef.current);
      settleFrameRef.current = null;
    }
  }, []);

  const cancelWillChangeTimer = useCallback(() => {
    if (willChangeTimerRef.current != null) {
      window.clearTimeout(willChangeTimerRef.current);
      willChangeTimerRef.current = null;
    }
  }, []);

  const scheduleWillChangeReset = useCallback(() => {
    cancelWillChangeTimer();
    willChangeTimerRef.current = window.setTimeout(() => {
      if (visualRef.current) visualRef.current.style.willChange = 'auto';
      willChangeTimerRef.current = null;
    }, 420);
  }, [cancelWillChangeTimer]);

  const clearPointerState = useCallback(() => {
    cancelFrame();
    rectRef.current = null;
    targetRef.current = { x: 0.5, y: 0.5 };
    currentRef.current = { x: 0.5, y: 0.5 };

    const node = visualRef.current;
    if (!node) return null;
    node.removeAttribute('data-tilting');
    node.style.setProperty('--tilt-sheen-x', '50%');
    node.style.setProperty('--tilt-sheen-y', '50%');
    return node;
  }, [cancelFrame]);

  const reset = useCallback(() => {
    const node = clearPointerState();
    node?.style.removeProperty('transform');
    scheduleWillChangeReset();
  }, [clearPointerState, scheduleWillChangeReset]);

  /** Flatten before a click starts a View Transition or opens a portal. */
  const flattenForActivation = useCallback(() => {
    const node = clearPointerState();
    if (!node) return;

    cancelSettleFrame();
    node.style.setProperty('transition', 'none');
    node.style.removeProperty('transform');
    scheduleWillChangeReset();
    settleFrameRef.current = requestAnimationFrame(() => {
      node.style.removeProperty('transition');
      settleFrameRef.current = null;
    });
  }, [cancelSettleFrame, clearPointerState, scheduleWillChangeReset]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const forcedColors = window.matchMedia('(forced-colors: active)');

    const updateCapability = () => {
      enabledRef.current = !reducedMotion.matches && !forcedColors.matches;
      if (!enabledRef.current) reset();
    };

    updateCapability();
    reducedMotion.addEventListener?.('change', updateCapability);
    forcedColors.addEventListener?.('change', updateCapability);

    const observer = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(([entry]) => {
          visibleRef.current = Boolean(entry?.isIntersecting);
          if (!visibleRef.current) reset();
        }, { rootMargin: '120px' });
    if (hitRef.current) observer?.observe(hitRef.current);

    return () => {
      reducedMotion.removeEventListener?.('change', updateCapability);
      forcedColors.removeEventListener?.('change', updateCapability);
      observer?.disconnect();
      cancelFrame();
      cancelSettleFrame();
      cancelWillChangeTimer();
    };
  }, [cancelFrame, cancelSettleFrame, cancelWillChangeTimer, reset]);

  const paint = () => {
    frameRef.current = null;
    const node = visualRef.current;
    if (!node || !enabledRef.current || !visibleRef.current || !node.hasAttribute('data-tilting')) return;

    const target = targetRef.current;
    const current = currentRef.current;
    const smoothing = 0.3;
    current.x += (target.x - current.x) * smoothing;
    current.y += (target.y - current.y) * smoothing;

    const rotateY = (current.x - 0.5) * intensity;
    const rotateX = (0.5 - current.y) * intensity;
    node.style.transform = `rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg)`;
    node.style.setProperty('--tilt-sheen-x', `${(current.x * 100).toFixed(1)}%`);
    node.style.setProperty('--tilt-sheen-y', `${(current.y * 100).toFixed(1)}%`);

    const unsettled = Math.abs(target.x - current.x) > 0.001 || Math.abs(target.y - current.y) > 0.001;
    if (unsettled) frameRef.current = requestAnimationFrame(paint);
  };

  const activate = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return false;
    const node = visualRef.current;
    const hit = hitRef.current;
    if (!enabledRef.current || !visibleRef.current || !node || !hit) return false;

    if (!rectRef.current) rectRef.current = hit.getBoundingClientRect();
    node.setAttribute('data-tilting', 'true');
    node.style.willChange = 'transform';
    cancelWillChangeTimer();
    return true;
  };

  const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    activate(event);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!activate(event)) return;
    const hit = hitRef.current;
    const rect = rectRef.current ?? hit?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    rectRef.current = rect;

    targetRef.current = {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
    if (frameRef.current == null) frameRef.current = requestAnimationFrame(paint);
  };

  return (
    <div
      ref={hitRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      onPointerDown={flattenForActivation}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) reset();
      }}
      className="tilt-card-wrapper relative h-full w-full"
    >
      <div
        ref={visualRef}
        className={`group tilt-card-inner relative isolate h-full w-full ${className}`}
      >
        {children}
        {sheen && (
          <span
            aria-hidden="true"
            className="tilt-card-sheen pointer-events-none absolute inset-0 z-20 opacity-0 [border-radius:inherit] [background:radial-gradient(circle_at_var(--tilt-sheen-x,50%)_var(--tilt-sheen-y,50%),rgba(255,255,255,0.09),transparent_36%)] group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:hidden"
          />
        )}
      </div>
    </div>
  );
}
