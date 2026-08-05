import React, { useCallback, useEffect, useRef } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  /** Subtle moving highlight; disabled automatically for reduced motion and touch pointers. */
  sheen?: boolean;
}

/**
 * Pointer-driven tilt with a non-transforming hit surface. The outer wrapper
 * owns pointer geometry while only the inner visual plane is transformed, so
 * the card cannot move out from under the cursor and emit a false pointerleave.
 */
export default function TiltCard({
  children,
  className = '',
  intensity = 12,
  sheen = true,
}: TiltCardProps) {
  const hitRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const flattenFrameRef = useRef<number | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const pointerRef = useRef({ x: 0.5, y: 0.5 });
  const enabledRef = useRef(false);
  const visibleRef = useRef(true);

  const cancelPaint = useCallback(() => {
    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const cancelSettle = useCallback(() => {
    if (settleTimerRef.current != null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  const prepareLayer = useCallback(() => {
    const node = visualRef.current;
    const hit = hitRef.current;
    if (!node || !hit || !enabledRef.current || !visibleRef.current) return;
    cancelSettle();
    rectRef.current ??= hit.getBoundingClientRect();
    node.style.willChange = 'transform';
    // Live tracking must not be eased, or every pointermove restarts the
    // transition and the card visibly trails the cursor.
    node.dataset.tiltTracking = 'true';
  }, [cancelSettle]);

  const reset = useCallback(() => {
    cancelPaint();
    cancelSettle();
    rectRef.current = null;
    pointerRef.current = { x: 0.5, y: 0.5 };

    const node = visualRef.current;
    if (!node) return;
    // Re-enable easing so the card glides back to rest instead of snapping.
    delete node.dataset.tiltTracking;
    node.style.setProperty('--tilt-x', '0deg');
    node.style.setProperty('--tilt-y', '0deg');
    node.style.setProperty('--tilt-sheen-x', '50%');
    node.style.setProperty('--tilt-sheen-y', '50%');
    settleTimerRef.current = window.setTimeout(() => {
      if (visualRef.current) visualRef.current.style.willChange = 'auto';
      settleTimerRef.current = null;
    }, 360);
  }, [cancelPaint, cancelSettle]);

  /** Flatten before navigation or a lightbox snapshot begins. */
  const flattenForActivation = useCallback(() => {
    cancelPaint();
    cancelSettle();
    rectRef.current = null;
    const node = visualRef.current;
    if (!node) return;
    delete node.dataset.tiltTracking;
    node.style.transition = 'none';
    node.style.setProperty('--tilt-x', '0deg');
    node.style.setProperty('--tilt-y', '0deg');
    if (flattenFrameRef.current != null) cancelAnimationFrame(flattenFrameRef.current);
    flattenFrameRef.current = requestAnimationFrame(() => {
      node.style.removeProperty('transition');
      flattenFrameRef.current = null;
    });
  }, [cancelPaint, cancelSettle]);

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const forcedColors = window.matchMedia('(forced-colors: active)');

    const updateCapability = () => {
      enabledRef.current = finePointer.matches && !reducedMotion.matches && !forcedColors.matches;
      if (!enabledRef.current) reset();
    };

    updateCapability();
    finePointer.addEventListener?.('change', updateCapability);
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
      finePointer.removeEventListener?.('change', updateCapability);
      reducedMotion.removeEventListener?.('change', updateCapability);
      forcedColors.removeEventListener?.('change', updateCapability);
      observer?.disconnect();
      cancelPaint();
      cancelSettle();
      if (flattenFrameRef.current != null) cancelAnimationFrame(flattenFrameRef.current);
    };
  }, [cancelPaint, cancelSettle, reset]);

  const paint = () => {
    frameRef.current = null;
    const node = visualRef.current;
    if (!node || !enabledRef.current || !visibleRef.current || !node.dataset.tiltTracking) return;

    const { x, y } = pointerRef.current;
    const rotateY = (x - 0.5) * intensity;
    const rotateX = (0.5 - y) * intensity;

    node.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
    node.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
    node.style.setProperty('--tilt-sheen-x', `${(x * 100).toFixed(1)}%`);
    node.style.setProperty('--tilt-sheen-y', `${(y * 100).toFixed(1)}%`);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!enabledRef.current || !visibleRef.current) return;
    if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    prepareLayer();
    const hit = hitRef.current;
    const rect = rectRef.current ?? hit?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    rectRef.current = rect;
    pointerRef.current = {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
    if (frameRef.current == null) frameRef.current = requestAnimationFrame(paint);
  };

  return (
    <div
      ref={hitRef}
      onPointerEnter={prepareLayer}
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
        <div className="tilt-card-content relative h-full w-full">
          {children}
          {sheen && (
            <span
              aria-hidden="true"
              className="tilt-card-sheen pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300 [border-radius:inherit] [background:radial-gradient(circle_at_var(--tilt-sheen-x,50%)_var(--tilt-sheen-y,50%),rgba(255,255,255,0.09),transparent_40%)] group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:hidden"
            />
          )}
        </div>
      </div>
    </div>
  );
}