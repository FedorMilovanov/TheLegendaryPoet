import { useEffect } from 'react';
import Lenis from 'lenis';
import { useLocation } from 'react-router-dom';
import { setActiveLenis } from '../utils/smoothScroll';

const SmoothScroll = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: !prefersReduced,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });
    setActiveLenis(lenis);

    let animationFrameId: number;

    function raf(time: number) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }

    animationFrameId = requestAnimationFrame(raf);

    // Reset scroll on route change
    lenis.scrollTo(0, { immediate: true });

    return () => {
      setActiveLenis(null);
      lenis.destroy();
      cancelAnimationFrame(animationFrameId);
    };
  }, [pathname]);

  return <>{children}</>;
};

export default SmoothScroll;
