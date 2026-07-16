import { useEffect, useRef, type ReactNode } from 'react';
import Lenis from 'lenis';
import { useLocation } from 'react-router-dom';
import { scrollToHash, setActiveLenis } from '../utils/smoothScroll';

/**
 * Site-wide Lenis smooth scrolling.
 *
 * Lenis is created once for the lifetime of the shell (SiteLayout). Route
 * changes only reset the scroll position — they must not tear down the RAF
 * loop, or every navigation feels like a hitch. Deep links with `#hash` are
 * honoured after the new page commits (including lazy routes).
 */
const SmoothScroll = ({ children }: { children: ReactNode }) => {
  const { pathname, hash } = useLocation();
  const lenisRef = useRef<Lenis | null>(null);

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

    let animationFrameId: number;

    function raf(time: number) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }

    animationFrameId = requestAnimationFrame(raf);

    // Let the ScrollToTop button drive Lenis (it dispatches this event).
    const onScrollTop = () => lenis.scrollTo(0, { duration: 1 });
    window.addEventListener('tlp-scroll-top', onScrollTop);

    return () => {
      window.removeEventListener('tlp-scroll-top', onScrollTop);
      setActiveLenis(null);
      lenisRef.current = null;
      lenis.destroy();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // On route change: jump to top, then to hash if present (lazy pages retry).
  useEffect(() => {
    const lenis = lenisRef.current;
    if (hash) {
      // Don't force top first — go straight to the target once it's mounted.
      scrollToHash(hash);
    } else if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return <>{children}</>;
};

export default SmoothScroll;
