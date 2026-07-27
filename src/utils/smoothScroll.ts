import type Lenis from 'lenis';

const FIXED_HEADER_OFFSET = 96;

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
 *
 * A modal body lock temporarily replaces the browser's scroll position with a
 * fixed-body offset. When the final lock closes, pass the restored Y position
 * so Lenis synchronises its internal target before its animation loop resumes;
 * otherwise a stale target can pull the page several pixels after focus has
 * already returned to the opener.
 */
export function pauseSmoothScroll(reason = 'overlay') {
  const token = Symbol(reason);
  pauseTokens.add(token);
  activeLenis?.stop();
  let released = false;

  return (restoredScrollY?: number) => {
    if (released) return;
    released = true;
    pauseTokens.delete(token);
    if (pauseTokens.size !== 0) return;

    if (activeLenis && Number.isFinite(restoredScrollY)) {
      activeLenis.scrollTo(restoredScrollY as number, {
        immediate: true,
        force: true,
      });
    }
    activeLenis?.start();
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
    activeLenis.scrollTo(el, { offset: -FIXED_HEADER_OFFSET, duration: prefersReduced ? 0 : 1.1 });
    return;
  }

  const top = el.getBoundingClientRect().top + window.scrollY - FIXED_HEADER_OFFSET;
  window.scrollTo({
    top: Math.max(0, top),
    behavior: prefersReduced ? 'auto' : 'smooth',
  });
}
