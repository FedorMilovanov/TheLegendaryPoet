import { useRef, type MouseEvent, type ReactNode } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
}

/**
 * Lightweight CSS 3D tilt. Writes --tilt-x/y directly to the element so
 * mousemove never re-renders React. Honour prefers-reduced-motion by
 * disabling the effect entirely.
 */
export default function TiltCard({ children, className = '', intensity = 12 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateY = (x / rect.width - 0.5) * intensity;
    const rotateX = (0.5 - y / rect.height) * intensity;
    ref.current.style.setProperty('--tilt-x', `${rotateX}deg`);
    ref.current.style.setProperty('--tilt-y', `${rotateY}deg`);
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.setProperty('--tilt-x', '0deg');
    ref.current.style.setProperty('--tilt-y', '0deg');
  };

  return (
    <div className="tilt-card-wrapper h-full w-full">
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`tilt-card-inner h-full w-full ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
