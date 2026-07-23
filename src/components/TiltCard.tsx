import React, { useCallback, useEffect, useRef } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  /** Subtle moving highlight; disabled automatically for reduced motion and touch pointers. */
  sheen?: boolean;
}

export default function TiltCard({
  children,
  className = '',
  intensity = 12,
  sheen = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0.5, y: 0.5 });
  const enabledRef = useRef(false);
  const visibleRef = useRef(true);

  const reset = useCallback(() => {
    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (settleTimerRef.current != null) window.clearTimeout(settleTimerRef.current);
    const node = ref.current;
    if (!node) return;
    node.style.setProperty('--tilt-x', '0deg');
    node.style.setProperty('--tilt-y', '0deg');
    node.style.setProperty('--tilt-sheen-x', '50%');
    node.style.setProperty('--tilt-sheen-y', '50%');
    settleTimerRef.current = window.setTimeout(() => {
      if (ref.current) ref.current.style.willChange = 'auto';
      settleTimerRef.current = null;
    }, 420);
  }, []);

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
    if (ref.current) observer?.observe(ref.current);

    return () => {
      finePointer.removeEventListener?.('change', updateCapability);
      reducedMotion.removeEventListener?.('change', updateCapability);
      forcedColors.removeEventListener?.('change', updateCapability);
      observer?.disconnect();
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      if (settleTimerRef.current != null) window.clearTimeout(settleTimerRef.current);
    };
  }, [reset]);

  const paint = () => {
    frameRef.current = null;
    const node = ref.current;
    if (!node || !enabledRef.current || !visibleRef.current) return;

    const { x, y } = pointerRef.current;
    const rotateY = (x - 0.5) * intensity;
    const rotateX = (0.5 - y) * intensity;

    node.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
    node.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
    node.style.setProperty('--tilt-sheen-x', `${(x * 100).toFixed(1)}%`);
    node.style.setProperty('--tilt-sheen-y', `${(y * 100).toFixed(1)}%`);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!ref.current || !enabledRef.current || !visibleRef.current) return;
    if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    const rect = ref.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    pointerRef.current = {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
    ref.current.style.willChange = 'transform';
    if (settleTimerRef.current != null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    if (frameRef.current == null) frameRef.current = requestAnimationFrame(paint);
  };

  return (
    <div className="tilt-card-wrapper relative h-full w-full">
      <div
        ref={ref}
        onPointerMove={handlePointerMove}
        onPointerLeave={reset}
        onPointerCancel={reset}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) reset();
        }}
        className={`group tilt-card-inner relative isolate h-full w-full ${className}`}
      >
        {children}
        {sheen && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-500 [border-radius:inherit] [background:radial-gradient(circle_at_var(--tilt-sheen-x,50%)_var(--tilt-sheen-y,50%),rgba(255,255,255,0.12),transparent_38%)] group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:hidden"
          />
        )}
      </div>
    </div>
  );
}
