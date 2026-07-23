import type Lenis from 'lenis';

/**
 * Bridges the Lenis instance (owned by SmoothScroll) to anchor navigation and
 * body-level overlays. A modal must pause Lenis as well as locking body overflow;
 * otherwise the RAF loop can finish a pending interpolation underneath the
 * dialog and return the reader to a slightly different paragraph on close.
 */
let activeLenis: Lenis | null = null;
let pauseDepth = 0;
let restorationEpoch = 0;

export function setActiveLenis(lenis: Lenis | null) {
  activeLenis = lenis;
  if (activeLenis && pauseDepth > 0) activeLenis.stop();
}

/** Ref-counted so one overlay cannot resume scrolling while another is open. */
export function pauseSmoothScroll() {
  pauseDepth += 1;
  // Invalidate delayed restoration frames left by an overlay that just closed.
  restorationEpoch += 1;
  if (pauseDepth === 1) activeLenis?.stop();
}

/**
 * Resume scrolling and, when requested, restore one exact document position.
 *
 * Releasing `body { overflow:hidden }` or returning from a temporary landscape
 * viewport changes Lenis' dimensions after the first synchronous write. A single
 * `scrollTo` can therefore be overwritten by scroll anchoring or by the next
 * Lenis RAF. Re-apply over two animation frames, after `resize()`, while an epoch
 * token guarantees that a newly opened modal or route cannot inherit the old
 * restoration.
 */
export function resumeSmoothScroll(scrollY?: number) {
  pauseDepth = Math.max(0, pauseDepth - 1);
  if (pauseDepth > 0) return;

  activeLenis?.start();
  if (scrollY == null) return;

  const target = Math.max(0, scrollY);
  const epoch = ++restorationEpoch;
  const restore = () => {
    if (epoch !== restorationEpoch || pauseDepth > 0) return;
    activeLenis?.resize();
    window.scrollTo({ top: target, left: 0, behavior: 'auto' });
    activeLenis?.scrollTo(target, { immediate: true });
  };

  restore();
  requestAnimationFrame(() => {
    restore();
    requestAnimationFrame(restore);
  });
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const target = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 96);

  if (activeLenis) {
    // The persistent Lenis instance can outlive a much shorter previous route.
    // Refresh its limit before resolving a deep anchor in a newly loaded essay.
    activeLenis.resize();
    const startY = window.scrollY;
    activeLenis.scrollTo(target, { duration: prefersReduced ? 0 : 1.1, immediate: prefersReduced });

    // If a stale route measurement still prevented the first command from
    // starting, fall back after two paints to an exact, resized position. Normal
    // smooth navigation is left untouched once any movement has begun.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (
          Math.abs(window.scrollY - startY) <= 1 &&
          Math.abs(el.getBoundingClientRect().top - 96) > 24
        ) {
          activeLenis?.resize();
          window.scrollTo({ top: target, left: 0, behavior: 'auto' });
          activeLenis?.scrollTo(target, { immediate: true });
        }
      });
    });
  } else {
    window.scrollTo({
      top: target,
      left: 0,
      behavior: prefersReduced ? 'auto' : 'smooth',
    });
  }
}
