import type Lenis from 'lenis';

/**
 * Bridges the Lenis instance (owned by SmoothScroll) to anchor navigation.
 * Plain `#hash` clicks don't work under Lenis because it runs its own scroll
 * loop, so in-page jumps must go through `lenis.scrollTo`.
 */
let activeLenis: Lenis | null = null;

export function setActiveLenis(lenis: Lenis | null) {
  activeLenis = lenis;
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
