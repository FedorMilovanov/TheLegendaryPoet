const FIXED_HEADER_OFFSET = 96;
const pauseTokens = new Set<symbol>();

/**
 * Records nested overlay ownership. The overlay itself remains responsible for
 * its body lock; native document scrolling has no animation target that needs
 * to be paused or synchronised when the lock is released.
 */
export function pauseSmoothScroll(reason = 'overlay') {
  const token = Symbol(reason);
  pauseTokens.add(token);
  let released = false;

  return (_restoredScrollY?: number) => {
    if (released) return;
    released = true;
    pauseTokens.delete(token);
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
  const top = el.getBoundingClientRect().top + window.scrollY - FIXED_HEADER_OFFSET;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: prefersReduced ? 'auto' : 'smooth',
  });
}
