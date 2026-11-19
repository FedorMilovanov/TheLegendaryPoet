import { scheduleProgrammaticFocus } from './focusRuntime';
import { hasOpenOverlay, OVERLAY_SCROLL_RESTORED } from './overlayRuntime';

const HASH_OBSERVER_TIMEOUT_MS = 15_000;
const modifierKeys = new Set(['Shift', 'Control', 'Alt', 'Meta', 'AltGraph', 'CapsLock', 'NumLock', 'ScrollLock']);

interface ScrollRequest {
  current: () => boolean;
  fragmentId: string;
  nativeQuote?: boolean;
  // false: not measurable yet. null: scrolled, no focus transfer needed.
  // A node: scrolled, transfer focus after the target has painted.
  apply: (allowPartial: boolean) => false | HTMLElement | null;
  yieldToReader: () => void;
}

/** One arrival, explicit repeat or interrupted traversal. Nothing here runs
 * during ordinary reading. Stop on a newer intent, including in the two
 * frames between placing a fragment and giving it keyboard focus. */
export function requestRouteScroll({ current, fragmentId, nativeQuote, apply, yieldToReader }: ScrollRequest) {
  const controller = new AbortController();
  const { signal } = controller;
  let observer: MutationObserver | undefined;
  let timer = 0, frame = 0;
  const deadline = Date.now() + HASH_OBSERVER_TIMEOUT_MS;
  let ownedFocus: HTMLElement | null = null;
  let cancelFocus: (() => void) | undefined;

  const stopWaiting = () => {
    document.fonts?.removeEventListener('loadingdone', retryLayout);
    observer?.disconnect();
    observer = undefined;
    window.clearTimeout(timer);
  };
  const stop = () => {
    controller.abort();
    stopWaiting();
    cancelAnimationFrame(frame);
    cancelFocus?.();
  };
  const takeOver = (event: Event) => {
    if (!event.isTrusted || !current() || hasOpenOverlay()) return;
    // A browser can still be animating/maintaining its *own* text match.
    // End that motion here, without consuming the reader's key, click or wheel.
    if (nativeQuote && document.querySelector(':target')) window.scrollTo({ top: window.scrollY, behavior: 'instant' });
    yieldToReader();
    stop();
  };
  // Observe intent, never cancel input or infer intent from scrollY: image
  // layout, viewport changes and native fragment placement can all move it.
  const options = { signal, capture: true, passive: true };
  window.addEventListener('pointerdown', takeOver, options);
  window.addEventListener('wheel', event => {
    if (!event.ctrlKey && (event.deltaX || event.deltaY)) takeOver(event);
  }, options);
  window.addEventListener('keydown', event => {
    if (!modifierKeys.has(event.key)) takeOver(event);
  }, options);
  window.addEventListener('focusin', event => {
    const el = event.target;
    // Main is the route's normal focus handoff; the browser may also focus
    // the native fragment. Neither means the reader chose a different control.
    if (el instanceof HTMLElement && el !== ownedFocus && el !== document.body && el.id !== 'main-content' &&
        !(fragmentId && el.id === fragmentId)) takeOver(event);
  }, options);

  function attempt(allowPartial: boolean) {
    if (signal.aborted || !current()) { stop(); return true; }
    if (hasOpenOverlay()) {
      window.addEventListener(OVERLAY_SCROLL_RESTORED, schedule, { once: true, signal });
      return true;
    }
    const target = apply(allowPartial);
    if (target === false) return false;
    if (target) {
      cancelFocus = scheduleProgrammaticFocus(() => {
        const next = !signal.aborted && current() && !hasOpenOverlay() && target.isConnected ? target : null;
        if (nativeQuote && next) {
          ownedFocus = next;
          // Some engines retry native text matching after the app paints,
          // centre the range, and expose its ancestor as :target. Reconcile
          // that one placement, not every scroll and never after reader input.
          const finish = () => {
            if (!current() || hasOpenOverlay() || !next.isConnected) { stop(); return; }
            if (!document.querySelector(':target')) return;
            stop(); apply(true);
          };
          document.addEventListener('scrollend', finish, { signal });
          timer = window.setTimeout(stop, Math.max(0, deadline - Date.now()));
          finish();
        } else stop();
        return next;
      });
    } else stop();
    return true;
  }
  function retryLayout() { if (attempt(false)) stopWaiting(); }
  function schedule() {
    frame = requestAnimationFrame(() => {
      if (attempt(false)) return;
      observer = new MutationObserver(retryLayout);
      document.fonts?.addEventListener('loadingdone', retryLayout);
      observer.observe(document.body ?? document.documentElement, { childList: true, subtree: true });
      // Close the lookup/observe race without polling or waiting for an
      // unrelated mutation. On timeout, use the available layout once.
      if (attempt(false)) stopWaiting();
      else timer = window.setTimeout(() => { stopWaiting(); attempt(true); }, HASH_OBSERVER_TIMEOUT_MS);
    });
  }
  schedule();
  return stop;
}
