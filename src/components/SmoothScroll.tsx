import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router';
import { focusProgrammaticTarget } from '../utils/focusRuntime';

const HASH_OBSERVER_TIMEOUT_MS = 15_000;
const FIXED_HEADER_OFFSET = 96;

function decodeHash(hash: string) {
  const raw = hash.replace(/^#/, '');
  if (!raw) return '';
  try { return decodeURIComponent(raw); } catch { return raw; }
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * Owns route restoration and anchor geometry while leaving ordinary wheel,
 * trackpad and touch scrolling entirely to the browser. Native scrolling keeps
 * moving even when React or image decoding briefly occupies the main thread;
 * a global JavaScript interpolation loop cannot provide that guarantee.
 */
const SmoothScroll = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positionsRef = useRef(new Map<string, number>());
  const previousRouteRef = useRef(`${location.pathname}${location.hash}`);
  const firstRouteRef = useRef(true);

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    const scrollTop = () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
    };

    window.addEventListener('tlp-scroll-top', scrollTop);
    return () => {
      window.removeEventListener('tlp-scroll-top', scrollTop);
      window.history.scrollRestoration = previousRestoration;
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
    let observer: MutationObserver | null = null;
    let timeoutId = 0;

    const scrollToNumber = (top: number) => {
      const safeTop = Math.max(0, Number.isFinite(top) ? top : 0);
      window.scrollTo({ top: safeTop, behavior: 'auto' });
    };

    const scrollToHashTarget = (target: HTMLElement) => {
      const top = target.getBoundingClientRect().top + window.scrollY - FIXED_HEADER_OFFSET;
      window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
      focusProgrammaticTarget(target, { preventScroll: true });
    };

    const findAndScrollToHash = () => {
      if (!location.hash) return false;
      const id = decodeHash(location.hash);
      const target = id ? document.getElementById(id) : null;
      if (!target) return false;
      scrollToHashTarget(target);
      return true;
    };

    const stopHashObserver = () => {
      observer?.disconnect();
      observer = null;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutId = 0;
      }
    };

    const restore = () => {
      if (cancelled) return;
      if (location.hash) {
        if (findAndScrollToHash()) return;

        observer = new MutationObserver(() => {
          if (cancelled) return;
          if (findAndScrollToHash()) stopHashObserver();
        });
        observer.observe(document.body ?? document.documentElement, { childList: true, subtree: true });
        // Close the race between the first lookup and observer registration: a
        // target inserted in that narrow window must still be resolved without
        // polling or waiting for an unrelated later mutation.
        if (findAndScrollToHash()) {
          stopHashObserver();
          return;
        }
        timeoutId = window.setTimeout(stopHashObserver, HASH_OBSERVER_TIMEOUT_MS);
        return;
      }

      if (navigationType === 'POP') scrollToNumber(positionsRef.current.get(location.key) ?? 0);
      else if (!firstRoute) scrollToNumber(0);
    };

    const frame = requestAnimationFrame(restore);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stopHashObserver();
    };
  }, [location.hash, location.key, location.pathname, navigationType]);

  return <>{children}</>;
};

export default SmoothScroll;