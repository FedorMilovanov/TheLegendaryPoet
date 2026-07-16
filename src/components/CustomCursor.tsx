import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Desktop-only custom cursor.
 *
 * Position is written straight to DOM via rAF — never through React state —
 * so mousemove does not thrash the React tree at 60–120 Hz. Visibility and
 * hover-scale still use state (rare transitions). Touch devices and /hall
 * keep the native pointer.
 */
const CustomCursor = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { pathname } = useLocation();
  const onHall = pathname === '/hall';

  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const pos = useRef({ x: -100, y: -100 });
  const raf = useRef(0);

  useEffect(() => {
    if (onHall || window.matchMedia('(pointer: coarse)').matches) {
      setIsVisible(false);
      document.body.classList.remove('has-custom-cursor');
      return;
    }
    setIsVisible(true);
    document.body.classList.add('has-custom-cursor');

    const paint = () => {
      const { x, y } = pos.current;
      const dot = dotRef.current;
      const ring = ringRef.current;
      if (dot) {
        dot.style.transform = `translate3d(${x - 8}px, ${y - 8}px, 0)`;
      }
      if (ring) {
        ring.style.transform = `translate3d(${x - 24}px, ${y - 24}px, 0)`;
      }
      raf.current = 0;
    };

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (!raf.current) raf.current = requestAnimationFrame(paint);
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactive = Boolean(
        target.closest('a, button, [role="button"], input, textarea, select, label, summary'),
      );
      setIsHovering(interactive);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      if (raf.current) cancelAnimationFrame(raf.current);
      document.body.classList.remove('has-custom-cursor');
    };
  }, [onHall]);

  if (!isVisible) return null;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-4 w-4 rounded-full bg-luxury-gold mix-blend-difference will-change-transform"
        style={{
          transform: 'translate3d(-100px, -100px, 0)',
          transition: 'width 0.2s ease, height 0.2s ease, margin 0.2s ease',
          width: isHovering ? 20 : 16,
          height: isHovering ? 20 : 16,
          marginLeft: isHovering ? -2 : 0,
          marginTop: isHovering ? -2 : 0,
        }}
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9998] h-12 w-12 rounded-full border border-luxury-gold/30 will-change-transform"
        style={{
          transform: 'translate3d(-100px, -100px, 0) scale(1)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
          // scale applied via separate property on the element using CSS variable
          // would fight translate3d; use box-shadow pulse instead for hover.
          boxShadow: isHovering ? '0 0 0 6px rgba(212,175,55,0.08)' : 'none',
          opacity: isHovering ? 0.85 : 0.55,
        }}
      />
    </>
  );
};

export default CustomCursor;
