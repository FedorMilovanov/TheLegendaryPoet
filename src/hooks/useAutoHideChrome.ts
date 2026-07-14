import { useEffect } from 'react';

/**
 * Universal "reading mode" chrome auto-hide (the Medium / iOS-Safari pattern).
 *
 * Mounted ONCE at the app root. Watches scroll direction and toggles a single
 * `chrome-hidden` class on <html>; fixed UI elements (header, mobile dock,
 * reading-progress bar, scroll-top button) each opt in via CSS. Scrolling down
 * past the threshold tucks the chrome away so long reads are immersive;
 * any upward scroll — or nearing the top — brings it back instantly.
 *
 * Deliberately CSS-driven: adding a new fixed element later means one CSS
 * rule, not another scroll listener.
 */
const SHOW_AT_TOP = 96; // always show chrome within this distance from the top
const HIDE_AFTER = 240; // never hide until scrolled at least this far
const DELTA = 8; // ignore sub-pixel/jitter scrolls

export function useAutoHideChrome() {
  useEffect(() => {
    const root = document.documentElement;
    let lastY = window.scrollY;
    let hidden = false;
    let ticking = false;

    const apply = (next: boolean) => {
      if (next !== hidden) {
        hidden = next;
        root.classList.toggle('chrome-hidden', hidden);
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const diff = y - lastY;
        if (Math.abs(diff) >= DELTA) {
          if (y <= SHOW_AT_TOP) apply(false);
          else if (diff > 0 && y > HIDE_AFTER) apply(true);
          else if (diff < 0) apply(false);
          lastY = y;
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      root.classList.remove('chrome-hidden');
    };
  }, []);
}
