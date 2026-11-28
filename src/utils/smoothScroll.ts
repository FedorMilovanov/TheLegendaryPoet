const FIXED_HEADER_OFFSET = 96;
const pauseTokens = new Set<symbol>();

// A malformed URL fragment is an unresolved target, not a reader crash.
export function decodeHash(hash: string) {
  // Browsers that expose text directives still resolve the ordinary anchor.
  // Strip the literal delimiter before decoding so encoded IDs stay intact.
  const raw = hash.replace(/^#/, '').split(':~:', 1)[0];
  if (!raw) return '';
  try { return decodeURIComponent(raw); } catch { return raw; }
}

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
    // The final overlay has restored its body styles and scroll offset before
    // releasing this token. Resume only after the last nested owner leaves.
    if (pauseTokens.size === 0 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('tlp-scroll-resumed'));
    }
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
