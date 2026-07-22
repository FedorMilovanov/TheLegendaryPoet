import React, { useEffect, useRef } from 'react';

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
  const pointerRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => () => {
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
  }, []);

  const canAnimate = () =>
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    !window.matchMedia('(pointer: coarse)').matches;

  const paint = () => {
    frameRef.current = null;
    const node = ref.current;
    if (!node) return;

    const { x, y } = pointerRef.current;
    const rotateY = (x - 0.5) * intensity;
    const rotateX = (0.5 - y) * intensity;

    node.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
    node.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
    node.style.setProperty('--tilt-sheen-x', `${(x * 100).toFixed(1)}%`);
    node.style.setProperty('--tilt-sheen-y', `${(y * 100).toFixed(1)}%`);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!ref.current || !canAnimate()) return;
    const rect = ref.current.getBoundingClientRect();
    pointerRef.current = {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
    if (frameRef.current == null) frameRef.current = requestAnimationFrame(paint);
  };

  const reset = () => {
    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    const node = ref.current;
    if (!node) return;
    node.style.setProperty('--tilt-x', '0deg');
    node.style.setProperty('--tilt-y', '0deg');
    node.style.setProperty('--tilt-sheen-x', '50%');
    node.style.setProperty('--tilt-sheen-y', '50%');
  };

  return (
    <div className="tilt-card-wrapper relative h-full w-full">
      <div
        ref={ref}
        onPointerMove={handlePointerMove}
        onPointerLeave={reset}
        onPointerCancel={reset}
        className={`tilt-card-inner relative isolate h-full w-full will-change-transform ${className}`}
      >
        {children}
        {sheen && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-500 [border-radius:inherit] [background:radial-gradient(circle_at_var(--tilt-sheen-x,50%)_var(--tilt-sheen-y,50%),rgba(255,255,255,0.12),transparent_38%)] group-hover:opacity-100"
          />
        )}
      </div>
    </div>
  );
}
