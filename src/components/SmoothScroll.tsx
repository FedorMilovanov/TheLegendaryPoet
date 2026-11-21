import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router';
import { scheduleProgrammaticFocus } from '../utils/focusRuntime';

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
    // The chrome hook owns visible and inert/aria-hidden state together.
    // Directly removing this class left an inaccessible dock after hash jumps.
    window.dispatchEvent(new Event('tlp-reveal-chrome'));

    let cancelled = false;
    let observer: MutationObserver | null = null;
    let timeoutId = 0;
    let cancelHashFocus: (() => void) | null = null;
    let layoutFrame = 0;
    let layoutTimeoutId = 0;
    let layoutObserver: ResizeObserver | null = null;
    let lastAnchorScrollY: number | null = null;
    let readerInteractedWithHash = false;

    // Native scroll anchoring and layout shifts may change scrollY without
    // any reader action. Only genuine input may claim ownership of a hash jump.
    const onReaderGesture = () => {
      readerInteractedWithHash = true;
      layoutObserver?.disconnect();
    };
    const onReaderKey = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
        onReaderGesture();
      }
    };
    if (location.hash) {
      window.addEventListener('wheel', onReaderGesture, { passive: true });
      window.addEventListener('touchstart', onReaderGesture, { passive: true });
      window.addEventListener('pointerdown', onReaderGesture, { passive: true });
      window.addEventListener('keydown', onReaderKey);
    }

    const scrollToNumber = (top: number) => {
      const safeTop = Math.max(0, Number.isFinite(top) ? top : 0);
      window.scrollTo({ top: safeTop, behavior: 'auto' });
    };

    const scrollToHashTarget = (target: HTMLElement) => {
      const top = target.getBoundingClientRect().top + window.scrollY - FIXED_HEADER_OFFSET;
      window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
      lastAnchorScrollY = window.scrollY;
      cancelHashFocus?.();
      cancelHashFocus = scheduleProgrammaticFocus(() => target.isConnected ? target : null);
    };

    const findAndScrollToHash = () => {
      if (!location.hash) return false;
      const id = decodeHash(location.hash);
      const target = id ? document.getElementById(id) : null;
      if (!target) return false;
      scrollToHashTarget(target);
      return true;
    };

    // Reflow after async author hydration, lazy poem chunks and decoded media can
    // move an already-correct hash target. Keep one passive, event-driven owner
    // until layout settles, without an interpolation loop or reader-scroll theft.
    const alignHashAfterLayout = () => {
      if (cancelled || readerInteractedWithHash || lastAnchorScrollY === null || !location.hash) return;
      const target = document.getElementById(decodeHash(location.hash));
      if (!target) return;
      const delta = target.getBoundingClientRect().top - FIXED_HEADER_OFFSET;
      if (Math.abs(delta) < 1) return;
      window.scrollTo({ top: Math.max(0, window.scrollY + delta), behavior: 'auto' });
      lastAnchorScrollY = window.scrollY;
    };
    const scheduleHashLayoutAlignment = () => {
      if (layoutFrame || cancelled || readerInteractedWithHash) return;
      layoutFrame = requestAnimationFrame(() => {
        layoutFrame = 0;
        alignHashAfterLayout();
      });
    };

    // First correction follows the full JSON commit. A bounded ResizeObserver
    // also corrects later lazy geometry changes that happen after that event.
    const onPoetCorpusHydrated = (event: Event) => {
      const poetId = (event as CustomEvent<{ poetId?: string }>).detail?.poetId;
      if (!location.hash || !poetId || location.pathname !== `/poets/${poetId}`) return;
      scheduleHashLayoutAlignment();
    };
    window.addEventListener('tlp-poet-corpus-hydrated', onPoetCorpusHydrated);

    if (location.hash && typeof ResizeObserver !== 'undefined') {
      layoutObserver = new ResizeObserver(scheduleHashLayoutAlignment);
      layoutObserver.observe(document.body);
      layoutTimeoutId = window.setTimeout(() => layoutObserver?.disconnect(), HASH_OBSERVER_TIMEOUT_MS);
    }

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

      // Initial POP has no saved in-memory position. A delayed fallback to zero
      // must not erase native reader movement made before this frame executes.
      if (firstRoute) return;
      if (navigationType === 'POP') scrollToNumber(positionsRef.current.get(location.key) ?? 0);
      else scrollToNumber(0);
    };

    const frame = requestAnimationFrame(restore);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stopHashObserver();
      cancelHashFocus?.();
      window.removeEventListener('tlp-poet-corpus-hydrated', onPoetCorpusHydrated);
      layoutObserver?.disconnect();
      if (layoutTimeoutId) window.clearTimeout(layoutTimeoutId);
      if (layoutFrame) cancelAnimationFrame(layoutFrame);
      if (location.hash) {
        window.removeEventListener('wheel', onReaderGesture);
        window.removeEventListener('touchstart', onReaderGesture);
        window.removeEventListener('pointerdown', onReaderGesture);
        window.removeEventListener('keydown', onReaderKey);
      }
    };
  }, [location.hash, location.key, location.pathname, navigationType]);

  return <>{children}</>;
};

export default SmoothScroll;