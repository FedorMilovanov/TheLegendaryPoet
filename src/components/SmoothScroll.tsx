import { useEffect, useRef } from 'react';
import type Lenis from 'lenis';
import { useLocation, useNavigationType } from 'react-router-dom';
import { setActiveLenis } from '../utils/smoothScroll';

const HASH_RETRY_LIMIT = 20;

const SmoothScroll = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const lenisRef = useRef<Lenis | null>(null);
  const positionsRef = useRef(new Map<string, number>());
  const previousRouteRef = useRef(`${location.pathname}${location.hash}`);
  const firstRouteRef = useRef(true);

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    let cancelled = false;
    let animationFrameId = 0;
    let instance: Lenis | null = null;

    const scrollTop = () => {
      if (lenisRef.current) lenisRef.current.scrollTo(0, { duration: prefersReduced ? 0 : 0.85 });
      else window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    };

    window.addEventListener('tlp-scroll-top', scrollTop);

    // Native touch scrolling is more reliable and less power-hungry on phones.
    // Lenis is loaded only for fine-pointer devices that allow motion.
    if (!prefersReduced && !coarsePointer) {
      void import('lenis').then(({ default: LenisConstructor }) => {
        if (cancelled) return;
        instance = new LenisConstructor({
          duration: 1.08,
          easing: (time) => Math.min(1, 1.001 - Math.pow(2, -10 * time)),
          orientation: 'vertical',
          gestureOrientation: 'vertical',
          smoothWheel: true,
          wheelMultiplier: 1,
          touchMultiplier: 1,
        });
        lenisRef.current = instance;
        setActiveLenis(instance);

        const raf = (time: number) => {
          instance?.raf(time);
          animationFrameId = requestAnimationFrame(raf);
        };
        animationFrameId = requestAnimationFrame(raf);
      }).catch(() => {
        // Native scrolling remains fully functional when the enhancement chunk fails.
      });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('tlp-scroll-top', scrollTop);
      window.history.scrollRestoration = previousRestoration;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (instance) instance.destroy();
      lenisRef.current = null;
      setActiveLenis(null);
    };
  }, []);

  useEffect(() => {
    return () => {
      positionsRef.current.set(location.key, window.scrollY);
      if (positionsRef.current.size > 80) {
        const oldest = positionsRef.current.keys().next().value as string | undefined;
        if (oldest) positionsRef.current.delete(oldest);
      }
    };
  }, [location.key]);

  useEffect(() => {
    const routeIdentity = `${location.pathname}${location.hash}`;
    const firstRoute = firstRouteRef.current;
    firstRouteRef.current = false;
    if (!firstRoute && previousRouteRef.current === routeIdentity) return;
    previousRouteRef.current = routeIdentity;
    document.documentElement.classList.remove('chrome-hidden');

    let cancelled = false;
    let timeoutId = 0;
    let attempts = 0;

    const scrollToNumber = (top: number) => {
      if (lenisRef.current) lenisRef.current.scrollTo(top, { immediate: true });
      else window.scrollTo(0, top);
    };

    const restore = () => {
      if (cancelled) return;
      if (location.hash) {
        const id = decodeURIComponent(location.hash.slice(1));
        const target = document.getElementById(id);
        if (target) {
          if (lenisRef.current) lenisRef.current.scrollTo(target, { offset: -96, duration: 0.8 });
          else target.scrollIntoView({ behavior: 'auto', block: 'start' });
          return;
        }
        attempts += 1;
        if (attempts < HASH_RETRY_LIMIT) timeoutId = window.setTimeout(restore, 60);
        return;
      }

      if (navigationType === 'POP') scrollToNumber(positionsRef.current.get(location.key) ?? 0);
      else if (!firstRoute) scrollToNumber(0);
    };

    const frame = requestAnimationFrame(restore);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [location.hash, location.key, location.pathname, navigationType]);

  return <>{children}</>;
};

export default SmoothScroll;
