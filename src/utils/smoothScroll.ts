import type Lenis from 'lenis';

/**
 * Bridges the persistent Lenis instance to deep anchors and modal surfaces.
 * Overlay pauses are tokenized so stacked dialogs cannot resume Lenis early,
 * while legacy article lightboxes may continue using pause/resume pairs.
 */
let activeLenis: Lenis | null = null;
const pauseTokens = new Set<symbol>();
const legacyPauseTokens: symbol[] = [];
let restorationEpoch = 0;
let anchorEpoch = 0;

export function setActiveLenis(lenis: Lenis | null) {
  activeLenis = lenis;
  if (activeLenis && pauseTokens.size > 0) activeLenis.stop();
}

function removePauseToken(token: symbol) {
  pauseTokens.delete(token);
  const legacyIndex = legacyPauseTokens.lastIndexOf(token);
  if (legacyIndex >= 0) legacyPauseTokens.splice(legacyIndex, 1);
  if (pauseTokens.size === 0) activeLenis?.start();
}

/**
 * Pause smooth scrolling and return an idempotent release handle.
 * Calls without a reason remain compatible with the older pause/resume API.
 */
export function pauseSmoothScroll(reason = 'legacy-scroll-lock') {
  const token = Symbol(reason);
  pauseTokens.add(token);
  if (reason === 'legacy-scroll-lock') legacyPauseTokens.push(token);
  restorationEpoch += 1;
  anchorEpoch += 1;
  if (pauseTokens.size === 1) activeLenis?.stop();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    removePauseToken(token);
  };
}

export function isSmoothScrollPaused() {
  return pauseTokens.size > 0;
}

/**
 * Re-apply an exact document position after fixed-body overlay styles are
 * released. Lenis dimensions and browser scroll anchoring can settle over more
 * than one frame, so the position is written synchronously and twice more.
 */
export function restoreSmoothScrollPosition(scrollX: number, scrollY: number) {
  if (pauseTokens.size > 0) return;

  const x = Math.max(0, Number.isFinite(scrollX) ? scrollX : 0);
  const y = Math.max(0, Number.isFinite(scrollY) ? scrollY : 0);
  const epoch = ++restorationEpoch;
  const restore = () => {
    if (epoch !== restorationEpoch || pauseTokens.size > 0) return;
    activeLenis?.resize();
    window.scrollTo(x, y);
    activeLenis?.scrollTo(y, { immediate: true });
  };

  restore();
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      restore();
      requestAnimationFrame(restore);
    });
  }
}

/** Legacy companion for article/lightbox code that does not retain a handle. */
export function resumeSmoothScroll(scrollY?: number) {
  const token = legacyPauseTokens.pop();
  if (token) pauseTokens.delete(token);
  if (pauseTokens.size > 0) return;

  activeLenis?.start();
  if (scrollY != null) restoreSmoothScrollPosition(0, scrollY);
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
    if (epoch !== anchorEpoch || pauseTokens.size > 0 || !el.isConnected) return;
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

    // Responsive media and content-visibility can keep changing the longread
    // after Lenis accepted the command. Re-measure and guarantee the 96px
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
