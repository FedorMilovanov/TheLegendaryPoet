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
let anchorEpoch = 0;

export function setActiveLenis(lenis: Lenis | null) {
  activeLenis = lenis;
  if (activeLenis && pauseDepth > 0) activeLenis.stop();
}

/** Ref-counted so one overlay cannot resume scrolling while another is open. */
export function pauseSmoothScroll() {
  pauseDepth += 1;
  // Invalidate delayed restoration frames left by an overlay that just closed.
  restorationEpoch += 1;
  anchorEpoch += 1;
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

function anchorTarget(el: HTMLElement): number {
  const rawTarget = el.getBoundingClientRect().top + window.scrollY - 96;
  const limit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  return Math.min(limit, Math.max(0, rawTarget));
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const epoch = ++anchorEpoch;

  const forceSettledPosition = () => {
    if (epoch !== anchorEpoch || pauseDepth > 0 || !el.isConnected) return;
    activeLenis?.resize();
    const target = anchorTarget(el);
    window.scrollTo({ top: target, left: 0, behavior: 'auto' });
    activeLenis?.scrollTo(target, { immediate: true });
  };

  if (activeLenis) {
    // The persistent Lenis instance can outlive a much shorter previous route.
    // Refresh its limit before resolving a deep anchor in a newly loaded essay.
    activeLenis.resize();
    const target = anchorTarget(el);
    activeLenis.scrollTo(target, {
      duration: prefersReduced ? 0 : 1.1,
      immediate: prefersReduced,
    });

    if (prefersReduced) {
      forceSettledPosition();
      return;
    }

    // A dynamic longread can continue expanding after Lenis accepted the command
    // (responsive images, content-visibility, font metrics). Movement may begin
    // and still stop hundreds of pixels short, so a “did it move?” check is not
    // sufficient. Re-measure the actual heading and guarantee the final 96px
    // landing only when the smooth command did not settle correctly.
    window.setTimeout(() => {
      if (epoch !== anchorEpoch || !el.isConnected) return;
      if (Math.abs(el.getBoundingClientRect().top - 96) > 48) {
        forceSettledPosition();
        requestAnimationFrame(forceSettledPosition);
      }
    }, 1250);
  } else {
    const target = anchorTarget(el);
    window.scrollTo({
      top: target,
      left: 0,
      behavior: prefersReduced ? 'auto' : 'smooth',
    });

    if (!prefersReduced) {
      window.setTimeout(() => {
        if (epoch !== anchorEpoch || !el.isConnected) return;
        if (Math.abs(el.getBoundingClientRect().top - 96) > 48) forceSettledPosition();
      }, 1250);
    }
  }
}
