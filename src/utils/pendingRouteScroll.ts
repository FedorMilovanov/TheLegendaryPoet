import { scheduleProgrammaticFocus } from './focusRuntime';
import { hasOpenOverlay, OVERLAY_SCROLL_RESTORED } from './overlayRuntime';

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
  const w = window, d = document;
  const controller = new AbortController();
  const { signal } = controller;
  let observer: MutationObserver | undefined;
  let timer = 0, frame = 0;
  const deadline = Date.now() + 15_000;
  let ownedFocus: Element | null = null;
  let cancelFocus: (() => void) | undefined;
  // The placed line is defended once: an engine can finish a scroll it already
  // started after the app arrived. This is not a second scroll loop.
  let placedY = 0, replay: (() => void) | undefined, guarding = false, released = false;

  const stopWaiting = () => {
    d.fonts?.removeEventListener('loadingdone', retryLayout);
    observer?.disconnect();
    w.clearTimeout(timer);
  };
  const stop = () => {
    guarding = false;
    released = true;
    controller.abort();
    stopWaiting();
    cancelAnimationFrame(frame);
    cancelFocus?.();
  };
  // A reader-owned control must stay readable at their chosen position. The
  // app-owned passage can be taller than the viewport: its quoted line, not
  // the whole paragraph, is the arrival target. Never recover an offscreen control.
  const readableAt = (y: number) => {
    const el = d.activeElement;
    if (!(el instanceof HTMLElement)) return true;
    if (el.matches('a[href="#main-content"]')) return true;
    const { scrollY, innerHeight: height } = w, rect = el.getBoundingClientRect();
    const top = rect.top + scrollY - y, bottom = top + rect.height;
    return el === ownedFocus && replay
      ? top < height && bottom > 0
      : top >= 0 && bottom <= height / 2;
  };
  const settle = () => {
    if (!guarding) return;
    // A guard armed by the arrival corrects any drift; a guard armed by the
    // reader accepts only a jump that would discard the position they chose.
    const keep = Math.abs(w.scrollY - placedY) >= (replay ? 2 : w.innerHeight / 2) &&
      readableAt(placedY) && current() && !hasOpenOverlay();
    const again = replay;
    const finish = () => {
      if (!guarding) return;
      stop();
      if (keep) again ? again() : w.scrollTo(w.scrollX, placedY);
    };
    // Wait one paint for a nested native text scroll; never repeat after input.
    if (keep && again && ownedFocus?.closest?.('aside')?.scrollTop) requestAnimationFrame(finish);
    else finish();
  };
  const arm = (y: number, again?: () => void) => {
    placedY = y; replay = again;
    // Before the app's focus handoff, activeElement may still be the entire
    // document body. The target is checked at settlement, after focus occurs.
    if (again || readableAt(y)) {
      if (!guarding) guarding = true, d.addEventListener('scrollend', settle, { signal });
      timer = w.setTimeout(stop, deadline - Date.now());
    } else stop();
  };
  const takeOver = (event: Event) => {
    if (released || !event.isTrusted || !current() || hasOpenOverlay()) return;
    // A second input from the reader owns the position outright.
    if (guarding && !replay) { stop(); return; }
    if (!nativeQuote) { yieldToReader(); stop(); return; }
    if ((event as KeyboardEvent).key === 'Tab' && event.target === d.body) return;
    // A browser can still be animating or retrying its own text match. End
    // that motion here without consuming the reader's key, click or wheel.
    w.scrollTo(w.scrollX, w.scrollY);
    yieldToReader();
    stopWaiting();
    cancelAnimationFrame(frame);
    cancelFocus?.();
    ownedFocus = d.activeElement;
    arm(w.scrollY);
  };
  // Observe intent, never cancel input or infer intent from scrollY: image
  // layout, viewport changes and native fragment placement can all move it.
  const options = { signal, capture: true, passive: true };
  w.addEventListener('pointerdown', takeOver, options);
  w.addEventListener('wheel', event => !event.ctrlKey && (event.deltaX || event.deltaY) && takeOver(event), options);
  w.addEventListener('keydown', event => !/^(Shift|Control|Alt(Graph)?|Meta|(Caps|Num|Scroll)Lock)$/.test(event.key) && takeOver(event), options);
  w.addEventListener('focusin', event => {
    const el = event.target;
    // Main is the route's normal focus handoff; the browser may also focus
    // the native fragment. Neither means the reader chose a different control.
    if (el instanceof HTMLElement && el !== ownedFocus && el !== d.body && el.id !== 'main-content' &&
        !(fragmentId && el.id === fragmentId)) takeOver(event);
  }, options);

  const place = (allowPartial = false) => {
    if (released || !current()) { stop(); return true; }
    if (hasOpenOverlay()) {
      w.addEventListener(OVERLAY_SCROLL_RESTORED, schedule, { once: true, signal });
      return true;
    }
    const target = apply(allowPartial);
    if (target === false) return false;
    if (!target) { stop(); return true; }
    placedY = w.scrollY;
    cancelFocus = scheduleProgrammaticFocus(() => {
      const next = !released && current() && !hasOpenOverlay() && target.isConnected ? target : null;
      ownedFocus = next;
      // A native text directive can recenter the glyph before the two-frame
      // focus handoff. Correct that same arrival before arming its last guard.
      if (nativeQuote && next) {
        if (w.scrollY !== placedY) apply(true);
        arm(w.scrollY, () => current() && next.isConnected && apply(true));
      } else stop();
      return next;
    });
    return true;
  };
  function retryLayout() { if (place()) stopWaiting(); }
  function schedule() {
    frame = requestAnimationFrame(() => {
      if (place()) return;
      observer = new MutationObserver(retryLayout);
      d.fonts?.addEventListener('loadingdone', retryLayout);
      observer.observe(d.body, { childList: true, subtree: true });
      // Close the lookup/observe race without polling or waiting for an
      // unrelated mutation. On timeout, use the available layout once.
      if (place()) stopWaiting();
      else timer = window.setTimeout(() => { stopWaiting(); place(true); }, 15_000);
    });
  }
  schedule();
  return stop;
}
