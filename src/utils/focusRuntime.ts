const NATURAL_FOCUS_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[contenteditable="true"]',
].join(',');

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
