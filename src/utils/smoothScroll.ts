import type Lenis from 'lenis';

/**
 * Bridges the Lenis instance (owned by SmoothScroll) to anchor navigation and
 * body-level overlays. A modal must pause Lenis as well as locking body overflow;
 * otherwise the RAF loop can finish a pending interpolation underneath the
 * dialog and return the reader to a slightly different paragraph on close.
 */
let activeLenis: Lenis | null = null;
let pauseDepth = 0;

export function setActiveLenis(lenis: Lenis | null) {
  activeLenis = lenis;
  if (activeLenis && pauseDepth > 0) activeLenis.stop();
}

/** Ref-counted so one overlay cannot resume scrolling while another is open. */
export function pauseSmoothScroll() {
  pauseDepth += 1;
  if (pauseDepth === 1) activeLenis?.stop();
}

export function resumeSmoothScroll(scrollY?: number) {
  pauseDepth = Math.max(0, pauseDepth - 1);
  if (pauseDepth > 0) return;

  if (!activeLenis) {
    if (scrollY != null) window.scrollTo({ top: scrollY, left: 0, behavior: 'auto' });
    return;
  }

  activeLenis.start();
  if (scrollY != null) activeLenis.scrollTo(scrollY, { immediate: true });
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (activeLenis) {
    activeLenis.scrollTo(el, { offset: -96, duration: prefersReduced ? 0 : 1.1 });
  } else {
    el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
  }
}
