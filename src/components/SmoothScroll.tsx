import { createContext, useContext, useLayoutEffect, useState } from 'react';
import { useHref, useLocation, useNavigationType } from 'react-router';
import { requestRouteScroll } from '../utils/pendingRouteScroll';
import { captureUnlockedPosition, hasOpenOverlay, registerOverlayArrival } from '../utils/overlayRuntime';
import { resolveSharedPassage } from '../utils/sharedPassage';
import { resolvePagePosition } from '../utils/readingBookmark';
import { activeEntryId, currentEntryId, observeDepartures, ScrollHistory, type ScrollVisit } from '../utils/scrollHistory';
import { decodeHash, FIXED_HEADER_OFFSET } from '../utils/smoothScroll';

const HistoryContext = createContext<ScrollHistory | null>(null);

/** Persistent owner. A passive React cleanup sees the *new* page's height;
 * it cannot capture the outgoing position of a long article. */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [history] = useState(() => new ScrollHistory());
  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    const stop = observeDepartures(history, captureUnlockedPosition);
    const stopClaim = registerOverlayArrival(() => history.claimForOverlay());
    const scrollTop = () => window.scrollTo({
      top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
    window.addEventListener('tlp-scroll-top', scrollTop);
    return () => {
      stop();
      stopClaim();
      window.removeEventListener('tlp-scroll-top', scrollTop);
      window.history.scrollRestoration = previousRestoration;
    };
  }, [history]);
  return <HistoryContext.Provider value={history}>{children}</HistoryContext.Provider>;
}

function pendingAbove(target?: HTMLElement | null) {
  // Later optional sections don't affect the top of an earlier destination.
  return Array.from(document.querySelectorAll('[data-reader-layout-pending]')).some(marker =>
    !target || Boolean(marker.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING));
}

/** Only a committed page or its recovery surface may restore a visit. Neither
 * an outgoing animated page nor a short loading shell has the right layout. */
export function useRestoreRouteScroll(paintedPath: string) {
  const history = useContext(HistoryContext);
  const { key, pathname, search, hash } = useLocation();
  const href = useHref({ pathname, search, hash }); // includes the router basename
  const navigationType = useNavigationType();

  // Arm before the first painted control can receive focus or pointer input.
  useLayoutEffect(() => {
    if (!history || paintedPath !== pathname) return;
    const live = new URL(window.location.href);
    const requested = new URL(href, live);
    if (requested.pathname !== live.pathname || requested.search !== live.search || requested.hash !== live.hash) return;
    const previous = history.current;
    const url = live.href;
    const id = currentEntryId(key);
    const samePage = previous?.pathname === pathname;
    const sameEntry = previous?.id === id && previous.url === url;
    // A committed recovery/404 has no chapter to wait for. Expose its own
    // heading and next control, after (never through) a reader-owned dialog.
    const unavailable = document.querySelector<HTMLElement>('#main-content [data-route-unavailable]');
    // Base the landmark on the *painted* pathname. A render can suspend and
    // never commit: Back resumes the old request; Forward still needs its own
    // handoff when that destination really appears. Preserve it on effect replay.
    const visit: ScrollVisit = { id, url, pathname, hash, search, applied: false, unavailable: !!unavailable,
      mainFocusPending: sameEntry ? previous.mainFocusPending : previous ? !samePage : navigationType !== 'POP',
    };
    history.current = visit;
    const queryOnly = samePage && previous.hash === hash && previous.search !== search;
    let saved = navigationType === 'POP' ? history.position(visit) : undefined;
    const initial = navigationType === 'POP' && !saved && (!previous || (sameEntry && !visit.mainFocusPending));
    if (!queryOnly) window.dispatchEvent(new Event('tlp-reveal-chrome'));
    // Never erase a native first scroll or take focus from a filter control.
    const fragmentId = decodeHash(hash);
    const claimed = history.readerOwnsArrival(visit);
    const passive = (!unavailable && (claimed || queryOnly)) || (initial && !fragmentId);
    const leaveWithReader = () => {
      visit.applied = true;
      visit.mainFocusPending = false;
    };
    if (passive) {
      // The dialog may have been dismissed before the old page unmounted.
      // Keep a surviving control; hand off only if its removal stranded focus.
      if (claimed && visit.mainFocusPending && !hasOpenOverlay() && document.activeElement === document.body) {
        document.getElementById('main-content')?.focus({ preventScroll: true });
      }
      leaveWithReader();
    }

    const current = () => history.current === visit && window.location.href === live.href;
    let cancelRequest: (() => void) | undefined;
    let resuming = false;
    const apply = (allowPartial: boolean) => {
      // The path-change landmark and the eventual fragment share one request.
      // A later title/analytics callback must never take focus from a reader.
      if (unavailable) {
        const top = unavailable.getBoundingClientRect().top;
        window.scrollTo({ top: Math.max(0, top + window.scrollY - FIXED_HEADER_OFFSET), behavior: 'auto' });
        leaveWithReader();
        const focused = document.activeElement;
        return !claimed || focused === document.body || focused?.id === 'main-content' ? unavailable : null;
      }
      if (visit.mainFocusPending) {
        visit.mainFocusPending = false;
        document.getElementById('main-content')?.focus({ preventScroll: true });
      }
      const quoted = !saved && fragmentId.startsWith('read.');
      const shared = quoted ? resolveSharedPassage(fragmentId) : undefined;
      const target = shared?.target ?? (fragmentId ? document.getElementById(fragmentId) : null);
      let focus: HTMLElement | null = null;
      if (saved) {
        const { y, passage } = resolvePagePosition(saved);
        if (!allowPartial && y > 0 && pendingAbove(passage)) return false;
        window.scrollTo({ left: saved.x, top: y, behavior: 'auto' });
        // POP restores the reader's departure, not necessarily the heading in
        // the URL. Don't leave keyboard focus several chapters away either.
        // If Back dismissed a dialog during a canceled PUSH, its input was
        // still focused at popstate. Inspect focus *after* the final unlock.
        if (samePage || hash || (resuming && document.activeElement === document.body)) {
          const rect = target?.getBoundingClientRect();
          const visible = rect && rect.height && rect.top >= 0 && rect.top < window.innerHeight;
          focus = visible ? target : passage ?? document.getElementById('main-content');
        }
      } else if (fragmentId) {
        // A stale quote with no pending reader data must not keep scanning
        // the page or pick some other paragraph. Ordinary IDs may appear late.
        if (!allowPartial && ((!target && !quoted) || pendingAbove(target))) return false;
        if (target) {
          const y = shared ? shared.y() : target.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: Math.max(0, y - FIXED_HEADER_OFFSET), behavior: 'auto' });
          focus = target;
        }
      } else if (!hash) {
        window.scrollTo({ top: 0, behavior: 'auto' });
        if (samePage) focus = document.getElementById('main-content');
      }
      visit.applied = true;
      return focus;
    };
    function schedule() {
      cancelRequest?.();
      cancelRequest = requestRouteScroll({
        current, fragmentId, apply,
        // The visible page is now the reader's departure, even if its delayed
        // jump never ran. A later Back/Forward must not replay the old intent.
        yieldToReader: leaveWithReader,
      });
    }
    const repeatFragment = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element && event.target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (link && link.hash === hash && (!link.target || link.target === '_self') && !link.hasAttribute('download')) {
        saved = undefined;
        schedule();
      }
    };
    // A quick Back can cancel a suspended PUSH. Router then keeps this exact
    // location and component; no React effect will rerun for the traversal.
    const resumeIfStillPainted = () => {
      if (!visit.departing || !current() || activeEntryId() !== visit.id) return;
      visit.departing = false;
      const departure = history.position(visit);
      if (!departure) return;
      saved = departure;
      resuming = true;
      schedule();
    };
    visit.yieldPlacement = () => { cancelRequest?.(); leaveWithReader(); };
    window.addEventListener('popstate', resumeIfStillPainted);
    if (!passive) schedule();
    if (hash) document.addEventListener('click', repeatFragment);
    return () => {
      visit.yieldPlacement = undefined;
      cancelRequest?.();
      window.removeEventListener('popstate', resumeIfStillPainted);
      document.removeEventListener('click', repeatFragment);
    };
  }, [hash, history, href, key, navigationType, paintedPath, pathname, search]);
}
