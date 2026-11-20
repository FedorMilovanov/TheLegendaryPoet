import { scheduleProgrammaticFocus } from './focusRuntime';
import { hasOpenOverlay, OVERLAY_SCROLL_RESTORED } from './overlayRuntime';

const modifierKeys = /^(Shift|Control|Alt|Meta|AltGraph|CapsLock|NumLock|ScrollLock)$/;

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
  const deadline = Date.now() + 15_000;
  let ownedFocus: HTMLElement | null = null;
  let cancelFocus: (() => void) | undefined;
  // The placed line is defended once: an engine can finish a scroll it already
  // started after the app arrived. This is not a second scroll loop.
  let placedY = 0, replay: (() => void) | undefined, guarding = false, released = false;

  const stopWaiting = () => {
    document.fonts?.removeEventListener('loadingdone', retryLayout);
    observer?.disconnect();
    observer = undefined;
    window.clearTimeout(timer);
  };
  const stop = () => {
    guarding = false;
    released = true;
    controller.abort();
    stopWaiting();
    cancelAnimationFrame(frame);
    cancelFocus?.();
  };
  // Was the control the reader owns where the app left it? A control below the
  // placed line means a browser already scrolled to it: not the app's to undo.
  const readableAt = (y: number) => {
    const el = document.activeElement;
    if (!(el instanceof HTMLElement)) return true;
    const rect = el.getBoundingClientRect(), top = rect.top + window.scrollY - y;
    return top >= 0 && top + rect.height <= window.innerHeight / 2;
  };
  const settle = () => {
    if (!guarding) return;
    // A guard armed by the arrival corrects any drift; a guard armed by the
    // reader accepts only a jump that would discard the position they chose.
    const keep = Math.abs(window.scrollY - placedY) >= (replay ? 2 : window.innerHeight / 2) &&
      readableAt(placedY) && current() && !hasOpenOverlay();
    const again = replay;
    stop();
    if (!keep) return;
    if (again) again();
    else window.scrollTo({ top: placedY, behavior: 'instant' });
  };
  const arm = (y: number, again?: () => void) => {
    placedY = y; replay = again;
    if (!readableAt(y)) return;
    if (!guarding) {
      guarding = true;
      document.addEventListener('scrollend', settle, { signal });
    }
    timer = window.setTimeout(stop, deadline - Date.now());
  };
  const takeOver = (event: Event) => {
    if (released || !event.isTrusted || !current() || hasOpenOverlay()) return;
    // A second input from the reader owns the position outright.
    if (guarding && !replay) { stop(); return; }
    if (!nativeQuote) { yieldToReader(); stop(); return; }
    // A browser can still be animating or retrying its own text match. End
    // that motion here without consuming the reader's key, click or wheel.
    window.scrollTo({ top: window.scrollY, behavior: 'instant' });
    yieldToReader();
    stopWaiting();
    cancelAnimationFrame(frame);
    cancelFocus?.();
    cancelFocus = undefined;
    ownedFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    arm(window.scrollY);
  };
  // Observe intent, never cancel input or infer intent from scrollY: image
  // layout, viewport changes and native fragment placement can all move it.
  const options = { signal, capture: true, passive: true };
  window.addEventListener('pointerdown', takeOver, options);
  window.addEventListener('wheel', event => {
    if (!event.ctrlKey && (event.deltaX || event.deltaY)) takeOver(event);
  }, options);
  window.addEventListener('keydown', event => {
    if (!modifierKeys.test(event.key)) takeOver(event);
  }, options);
  window.addEventListener('focusin', event => {
    const el = event.target;
    // Main is the route's normal focus handoff; the browser may also focus
    // the native fragment. Neither means the reader chose a different control.
    if (el instanceof HTMLElement && el !== ownedFocus && el !== document.body && el.id !== 'main-content' &&
        !(fragmentId && el.id === fragmentId)) takeOver(event);
  }, options);

  const place = (allowPartial = false) => {
    if (released || !current()) { stop(); return true; }
    if (hasOpenOverlay()) {
      window.addEventListener(OVERLAY_SCROLL_RESTORED, schedule, { once: true, signal });
      return true;
    }
    const target = apply(allowPartial);
    if (target === false) return false;
    if (!target) { stop(); return true; }
    cancelFocus = scheduleProgrammaticFocus(() => {
      const next = !released && current() && !hasOpenOverlay() && target.isConnected ? target : null;
      ownedFocus = next;
      // Some engines retry a native text match after the app paints and centre
      // the range; others scroll a block they just focused.
      if (nativeQuote && next) arm(window.scrollY, () => { if (current() && next.isConnected) apply(true); });
      else stop();
      return next;
    });
    return true;
  };
  function retryLayout() { if (place()) stopWaiting(); }
  function schedule() {
    frame = requestAnimationFrame(() => {
      if (place()) return;
      observer = new MutationObserver(retryLayout);
      document.fonts?.addEventListener('loadingdone', retryLayout);
      observer.observe(document.body ?? document.documentElement, { childList: true, subtree: true });
      // Close the lookup/observe race without polling or waiting for an
      // unrelated mutation. On timeout, use the available layout once.
      if (place()) stopWaiting();
      else timer = window.setTimeout(() => { stopWaiting(); place(true); }, 15_000);
    });
  }
  schedule();
  return stop;
}
