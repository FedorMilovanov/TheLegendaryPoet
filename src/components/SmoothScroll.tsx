import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { useLocation } from 'react-router-dom';
import { setActiveLenis } from '../utils/smoothScroll';

const SmoothScroll = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const lenisRef = useRef<Lenis | null>(null);

  // The application shell is persistent, so Lenis and its RAF loop should be as
  // well. Route changes only reset the position; they no longer destroy and
  // recreate global wheel listeners and animation frames.
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
    lenisRef.current = lenis;
    setActiveLenis(lenis);

    let animationFrameId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    };
    animationFrameId = requestAnimationFrame(raf);

    const onScrollTop = () => lenis.scrollTo(0, { duration: prefersReduced ? 0 : 1 });
    window.addEventListener('tlp-scroll-top', onScrollTop);

    return () => {
      window.removeEventListener('tlp-scroll-top', onScrollTop);
      setActiveLenis(null);
      lenisRef.current = null;
      lenis.destroy();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Reset only the reading position when the page changes. If a modal initiated
  // the navigation, Lenis may still be paused; immediate positioning remains
  // deterministic and the overlay cleanup will resume the same instance.
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return <>{children}</>;
};

export default SmoothScroll;
