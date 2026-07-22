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
 * Pointer-driven tilt without React renders on every move.
 *
 * The former implementation queried two media features and measured the card on
 * every pointer event, kept every card permanently promoted with will-change and
 * pushed all children 28px towards the camera. On image-heavy pages that created
 * many 3D compositor layers and could make AVIF/WebP surfaces shimmer while the
 * pointer crossed the card. This version caches geometry for the duration of the
 * hover, writes at most once per animation frame and only promotes the active
 * card. Children remain in one raster plane.
 */
export default function TiltCard({
  children,
  className = '',
  intensity = 6,
  sheen = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const pointerRef = useRef({ x: 0.5, y: 0.5 });
  const canAnimateRef = useRef(false);

  const cancelFrame = () => {
    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  };

  const reset = () => {
    cancelFrame();
    rectRef.current = null;
    pointerRef.current = { x: 0.5, y: 0.5 };

    const node = ref.current;
    if (!node) return;
    node.removeAttribute('data-tilting');
    node.style.removeProperty('transform');
    node.style.setProperty('--tilt-sheen-x', '50%');
    node.style.setProperty('--tilt-sheen-y', '50%');
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
      reducedMotion.removeEventListener?.('change', updateCapability);
      coarsePointer.removeEventListener?.('change', updateCapability);
    };
  }, []);

  const paint = () => {
    frameRef.current = null;
    const node = ref.current;
    if (!node || !canAnimateRef.current) return;

    const { x, y } = pointerRef.current;
    const rotateY = (x - 0.5) * intensity;
    const rotateX = (0.5 - y) * intensity;

    node.style.transform = `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    node.style.setProperty('--tilt-sheen-x', `${(x * 100).toFixed(1)}%`);
    node.style.setProperty('--tilt-sheen-y', `${(y * 100).toFixed(1)}%`);
  };

  const handlePointerEnter = () => {
    if (!canAnimateRef.current || !ref.current) return;
    rectRef.current = ref.current.getBoundingClientRect();
    ref.current.setAttribute('data-tilting', 'true');
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!canAnimateRef.current || !ref.current) return;
    const rect = rectRef.current ?? ref.current.getBoundingClientRect();
    rectRef.current = rect;
    if (rect.width <= 0 || rect.height <= 0) return;

    pointerRef.current = {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };

    if (frameRef.current == null) frameRef.current = requestAnimationFrame(paint);
  };

  return (
    <div className="tilt-card-wrapper relative h-full w-full">
      <div
        ref={ref}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={reset}
        onPointerCancel={reset}
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
