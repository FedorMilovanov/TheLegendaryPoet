import type Lenis from 'lenis';

/**
 * Bridges the Lenis instance (owned by SmoothScroll) to anchor navigation and
 * to modal surfaces that must temporarily freeze the page behind them.
 */
let activeLenis: Lenis | null = null;
const pauseTokens = new Set<symbol>();

export function setActiveLenis(lenis: Lenis | null) {
  activeLenis = lenis;
  if (activeLenis && pauseTokens.size > 0) activeLenis.stop();
}

/**
 * Pause the current smooth-scroll enhancement until the returned release
 * function is called. Tokens make nested overlays safe: closing one dialog
 * cannot restart Lenis while another dialog is still open.
 */
export function pauseSmoothScroll(reason = 'overlay') {
  const token = Symbol(reason);
  pauseTokens.add(token);
  activeLenis?.stop();
  let released = false;

  return () => {
    if (released) return;
    released = true;
    pauseTokens.delete(token);
    if (pauseTokens.size === 0) activeLenis?.start();
  };
}

export function isSmoothScrollPaused() {
  return pauseTokens.size > 0;
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
