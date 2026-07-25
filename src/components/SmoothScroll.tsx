import { useEffect, useRef } from 'react';
import type Lenis from 'lenis';
import { useLocation, useNavigationType } from 'react-router-dom';
import { setActiveLenis } from '../utils/smoothScroll';

const HASH_RETRY_LIMIT = 20;
const FIXED_HEADER_OFFSET = 96;

type IdleCapableWindow = Window & typeof globalThis & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  cancelIdleCallback?: (handle: number) => void;
};

function decodeHash(hash: string) {
  const raw = hash.replace(/^#/, '');
  if (!raw) return '';
  try { return decodeURIComponent(raw); } catch { return raw; }
}

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
    const idleWindow = window as IdleCapableWindow;
    let cancelled = false;
    let animationFrameId = 0;
    let idleCallbackId = 0;
    let fallbackTimeoutId = 0;
    let instance: Lenis | null = null;

    const scrollTop = () => {
      if (lenisRef.current) lenisRef.current.scrollTo(0, { duration: prefersReduced ? 0 : 0.72 });
      else window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    };

    window.addEventListener('tlp-scroll-top', scrollTop);

    const startLenis = () => {
      if (cancelled) return;
      void import('lenis').then(({ default: LenisConstructor }) => {
        if (cancelled) return;
        instance = new LenisConstructor({
          // Responsive rather than syrupy: the old 1.08s interpolation made the
          // entire interface feel delayed even when rendering was healthy.
          duration: 0.82,
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
          if (document.visibilityState === 'visible') instance?.raf(time);
          animationFrameId = requestAnimationFrame(raf);
        };
        animationFrameId = requestAnimationFrame(raf);
      }).catch(() => {
        // Native scrolling remains fully functional when the enhancement chunk fails.
      });
    };

    // Native touch scrolling is more reliable and less power-hungry on phones.
    // On desktop, defer Lenis until the first viewport has painted and decoded;
    // it no longer competes with the intro, hero title and six eager portraits.
    if (!prefersReduced && !coarsePointer) {
      if (idleWindow.requestIdleCallback) {
        idleCallbackId = idleWindow.requestIdleCallback(startLenis, { timeout: 1_400 });
      } else {
        fallbackTimeoutId = window.setTimeout(startLenis, 650);
      }
    }

    return () => {
      cancelled = true;
      window.removeEventListener('tlp-scroll-top', scrollTop);
      window.history.scrollRestoration = previousRestoration;
      if (idleCallbackId) idleWindow.cancelIdleCallback?.(idleCallbackId);
      if (fallbackTimeoutId) window.clearTimeout(fallbackTimeoutId);
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
      const safeTop = Math.max(0, Number.isFinite(top) ? top : 0);
      if (lenisRef.current) lenisRef.current.scrollTo(safeTop, { immediate: true });
      else window.scrollTo(0, safeTop);
    };

    const scrollToHashTarget = (target: HTMLElement) => {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(target, { offset: -FIXED_HEADER_OFFSET, duration: 0.72 });
        return;
      }
      const top = target.getBoundingClientRect().top + window.scrollY - FIXED_HEADER_OFFSET;
      window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
    };

    const restore = () => {
      if (cancelled) return;
      if (location.hash) {
        const id = decodeHash(location.hash);
        const target = id ? document.getElementById(id) : null;
        if (target) {
          scrollToHashTarget(target);
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
