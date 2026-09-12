import { useEffect } from 'react';
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
  useEffect(() => {
    const root = document.documentElement;
    let lastY = window.scrollY;
    let hidden = false;
    let ticking = false;
    const a11ySnapshots = new Map<HTMLElement, { inert: boolean; ariaHidden: string | null }>();

    const chromeElements = () => [
      ...document.querySelectorAll<HTMLElement>('.site-header, .mobile-dock, .palette-fab, .section-chip'),
    ];

    const syncChromeAccessibility = (nextHidden: boolean) => {
      const elements = chromeElements();
      if (nextHidden) {
        const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        if (active && elements.some((element) => element.contains(active))) {
          focusProgrammatically(document.getElementById('main-content'));
        }
        for (const element of elements) {
          if (!a11ySnapshots.has(element)) {
            a11ySnapshots.set(element, {
              inert: element.inert,
              ariaHidden: element.getAttribute('aria-hidden'),
            });
          }
          element.inert = true;
          element.setAttribute('aria-hidden', 'true');
        }
        return;
      }

      for (const [element, snapshot] of a11ySnapshots) {
        if (!element.isConnected) continue;
        element.inert = snapshot.inert;
        if (snapshot.ariaHidden === null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', snapshot.ariaHidden);
      }
      a11ySnapshots.clear();
    };

    const apply = (next: boolean) => {
      if (next !== hidden) {
        hidden = next;
        syncChromeAccessibility(hidden);
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
      syncChromeAccessibility(false);
    };
  }, []);
}
