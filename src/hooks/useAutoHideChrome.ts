import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { createIsolationScope } from '../utils/accessibilityIsolation';
import { OVERLAY_SCROLL_RESTORED } from '../utils/overlayRuntime';
import { focusProgrammatically } from '../utils/focusRuntime';

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
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    let lastY = window.scrollY;
    let hidden = false;
    let ticking = false;
    let pendingFrame: number | null = null;
    const hiddenChrome = createIsolationScope();

    const chromeElements = () => [
      ...document.querySelectorAll<HTMLElement>('.site-header, .mobile-dock, .palette-fab'),
    ];

    const syncChromeAccessibility = (nextHidden: boolean) => {
      const elements = chromeElements();
      if (nextHidden) {
        const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        if (active && elements.some((element) => element.contains(active))) {
          focusProgrammatically(document.getElementById('main-content'));
        }
        elements.forEach(hiddenChrome.hide);
      } else hiddenChrome.clear();
    };

    const apply = (next: boolean) => {
      if (next !== hidden) {
        hidden = next;
        syncChromeAccessibility(hidden);
      }
      root.classList.toggle('chrome-hidden', hidden);
    };

    const revealOnNavigation = () => apply(false);
    const resumeAtRestoredPosition = () => { lastY = window.scrollY; };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      pendingFrame = requestAnimationFrame(() => {
        pendingFrame = null;
        ticking = false;
        // Fixing the body for a dialog temporarily reports scrollY=0. It is
        // not a reader scroll and must not hide the opener or reveal chrome.
        if (root.classList.contains('overlay-open')) return;
        const y = window.scrollY;
        const diff = y - lastY;
        // Returning to the top is an invariant, not a thresholded scroll gesture:
        // WebKit may coalesce small final scroll events below DELTA.
        if (y <= SHOW_AT_TOP) {
          apply(false);
          lastY = y;
        } else if (Math.abs(diff) >= DELTA) {
          if (diff > 0 && y > HIDE_AFTER) apply(true);
          else if (diff < 0) apply(false);
          lastY = y;
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('tlp-reveal-chrome', revealOnNavigation);
    window.addEventListener(OVERLAY_SCROLL_RESTORED, resumeAtRestoredPosition);
    return () => {
      // A frame queued before route unmount must not restore stale chrome state.
      if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
      pendingFrame = null;
      ticking = false;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('tlp-reveal-chrome', revealOnNavigation);
      window.removeEventListener(OVERLAY_SCROLL_RESTORED, resumeAtRestoredPosition);
      root.classList.remove('chrome-hidden');
      syncChromeAccessibility(false);
    };
  }, [pathname]);
}
