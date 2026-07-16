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

export function scrollToId(id: string, options?: { immediate?: boolean }) {
  const el = document.getElementById(id);
  if (!el) return false;
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const immediate = options?.immediate || prefersReduced;

  if (activeLenis) {
    activeLenis.scrollTo(el, { offset: -96, duration: immediate ? 0 : 1.1 });
  } else {
    el.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth', block: 'start' });
  }
  return true;
}

/**
 * After a route change, honour `location.hash` once the target is in the DOM.
 * Lazy routes + Lenis need a short retry window — the element may not exist
 * on the first frame after navigation.
 */
export function scrollToHash(hash: string, attempts = 12) {
  const id = hash.replace(/^#/, '');
  if (!id) return;

  let left = attempts;
  const tryScroll = () => {
    if (scrollToId(id, { immediate: true })) return;
    left -= 1;
    if (left > 0) {
      requestAnimationFrame(tryScroll);
    }
  };
  // Defer one frame so the route's Suspense content can commit.
  requestAnimationFrame(tryScroll);
}
