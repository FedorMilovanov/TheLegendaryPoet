const NATURAL_FOCUS_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[contenteditable="true"]',
].join(',');

/** Display and accessibility state both matter: the desktop and compact
 * versions of a control can stay mounted at the same time. */
export function isAvailableFocusTarget(target: HTMLElement) {
  return !target.matches(':disabled') && !target.closest('[inert], [aria-hidden="true"]') &&
    target.getClientRects().length > 0 && getComputedStyle(target).visibility === 'visible';
}

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
  let cancelled = false;
  let secondFrame = 0;
  const firstFrame = window.requestAnimationFrame(() => {
    secondFrame = window.requestAnimationFrame(() => {
      if (!cancelled) focusProgrammatically(resolveTarget());
    });
  });

  return () => {
    cancelled = true;
    window.cancelAnimationFrame(firstFrame);
    if (secondFrame) window.cancelAnimationFrame(secondFrame);
  };
}
