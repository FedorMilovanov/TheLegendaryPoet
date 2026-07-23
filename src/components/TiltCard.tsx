import { useEffect, useRef } from 'react';
import type { PointerEvent, ReactNode } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  /** Subtle moving highlight; disabled automatically for reduced motion and touch pointers. */
  sheen?: boolean;
}

/**
 * Pointer-driven tilt with a stable, non-transforming hit surface.
 *
 * Pointer events belong to the outer wrapper while only the inner visual plane
 * rotates. This matters at card edges: when the transformed element itself owns
 * pointerleave, its projected bounds can move out from under the cursor and
 * repeatedly reset/reactivate — the exact stutter that looks like a flickering
 * cover. Geometry is cached per hover, writes are RAF-batched, and a small lerp
 * filters high-frequency mouse noise without adding React renders.
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
  const rectRef = useRef<DOMRect | null>(null);
  const targetRef = useRef({ x: 0.5, y: 0.5 });
  const currentRef = useRef({ x: 0.5, y: 0.5 });
  const canAnimateRef = useRef(false);

  const cancelFrame = () => {
    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  };

  const cancelSettleFrame = () => {
    if (settleFrameRef.current != null) {
      cancelAnimationFrame(settleFrameRef.current);
      settleFrameRef.current = null;
    }
  };

  const clearPointerState = () => {
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
  };

  const reset = () => {
    const node = clearPointerState();
    node?.style.removeProperty('transform');
  };

  /** Flatten synchronously before a click starts a View Transition or opens a
   * portal. Chromium then snapshots a flat decoded cover, never a tilted raster. */
  const flattenForActivation = () => {
    const node = clearPointerState();
    if (!node) return;

    cancelSettleFrame();
    node.style.setProperty('transition', 'none');
    node.style.removeProperty('transform');
    settleFrameRef.current = requestAnimationFrame(() => {
      node.style.removeProperty('transition');
      settleFrameRef.current = null;
    });
  };

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');

    const updateCapability = () => {
      canAnimateRef.current = !reducedMotion.matches && !coarsePointer.matches;
      if (!canAnimateRef.current) reset();
    };

    updateCapability();
    reducedMotion.addEventListener?.('change', updateCapability);
    coarsePointer.addEventListener?.('change', updateCapability);

    return () => {
      cancelFrame();
      cancelSettleFrame();
      reducedMotion.removeEventListener?.('change', updateCapability);
      coarsePointer.removeEventListener?.('change', updateCapability);
    };
  }, []);

  const paint = () => {
    frameRef.current = null;
    const node = visualRef.current;
    if (!node || !canAnimateRef.current || !node.hasAttribute('data-tilting')) return;

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

  const schedulePaint = () => {
    if (frameRef.current == null) frameRef.current = requestAnimationFrame(paint);
  };

  const activate = () => {
    const node = visualRef.current;
    const hit = hitRef.current;
    if (!canAnimateRef.current || !node || !hit) return false;
    if (!rectRef.current) rectRef.current = hit.getBoundingClientRect();
    node.setAttribute('data-tilting', 'true');
    return true;
  };

  const handlePointerEnter = () => {
    activate();
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!activate()) return;
    const hit = hitRef.current;
    const rect = rectRef.current ?? hit?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    rectRef.current = rect;

    targetRef.current = {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
    schedulePaint();
  };

  return (
    <div
      ref={hitRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      onPointerDown={flattenForActivation}
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
            className="tilt-card-sheen pointer-events-none absolute inset-0 z-20 opacity-0 [border-radius:inherit] [background:radial-gradient(circle_at_var(--tilt-sheen-x,50%)_var(--tilt-sheen-y,50%),rgba(255,255,255,0.09),transparent_36%)]"
          />
        )}
      </div>
    </div>
  );
}
