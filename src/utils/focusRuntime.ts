const NATURAL_FOCUS_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[contenteditable="true"]',
].join(',');

/** Reveal a keyboard target inside its own list, without moving the page or
 * another scrollport. If a row is taller than the list, expose its start. */
export function revealInScrollport(target: HTMLElement, port: HTMLElement) {
  const row = target.getBoundingClientRect();
  const top = port.getBoundingClientRect().top + port.clientTop;
  const margin = 4; // clearance for the focus ring
  if (row.top < top + margin || row.height > port.clientHeight - 2 * margin) {
    port.scrollTop += row.top - top - margin;
  } else if (row.bottom > top + port.clientHeight - margin) {
    port.scrollTop += row.bottom - top - port.clientHeight + margin;
  }
}

function prepareProgrammaticTarget(target: HTMLElement) {
  if (target.matches(NATURAL_FOCUS_SELECTOR) || target.hasAttribute('tabindex')) {
    return () => undefined;
  }

  target.setAttribute('tabindex', '-1');
  const restore = () => {
    target.removeEventListener('blur', restore);
    if (target.isConnected && target.getAttribute('tabindex') === '-1') {
      target.removeAttribute('tabindex');
    }
  };
  target.addEventListener('blur', restore, { once: true });
  return restore;
}

export function focusProgrammatically(target: HTMLElement | null, preventScroll = true) {
  if (!target?.isConnected) return false;
  prepareProgrammaticTarget(target);
  target.focus({ preventScroll });
  return document.activeElement === target;
}

export function scheduleProgrammaticFocus(resolveTarget: () => HTMLElement | null) {
  // A deferred arrival must not reclaim focus after the reader has moved it.
  const previousFocus = document.activeElement;
  let cancelled = false;
  let secondFrame = 0;
  const firstFrame = window.requestAnimationFrame(() => {
    secondFrame = window.requestAnimationFrame(() => {
      if (cancelled) return;
      const target = resolveTarget();
      const active = document.activeElement;
      const ownerRemoved = previousFocus && !previousFocus.isConnected && active === document.body;
      if (!target?.isConnected || target.contains(active) || (active !== previousFocus && !ownerRemoved)) return;
      focusProgrammatically(target);
    });
  });

  return () => {
    cancelled = true;
    window.cancelAnimationFrame(firstFrame);
    if (secondFrame) window.cancelAnimationFrame(secondFrame);
  };
}
