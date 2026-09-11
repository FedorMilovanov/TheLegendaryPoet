type ProgrammaticFocusOptions = {
  preventScroll?: boolean;
};

function needsTemporaryTabIndex(element: HTMLElement) {
  const naturallyFocusable = element.matches(
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[contenteditable="true"]',
  );
  return !naturallyFocusable && !element.hasAttribute('tabindex');
}

/**
 * Moves focus to a semantic runtime target without permanently changing its
 * tab order. Non-interactive headings/list items receive a temporary
 * tabindex=-1 that is removed after focus leaves.
 */
export function focusProgrammaticTarget(
  element: HTMLElement | null | undefined,
  { preventScroll = true }: ProgrammaticFocusOptions = {},
) {
  if (!element?.isConnected) return false;

  const temporaryTabIndex = needsTemporaryTabIndex(element);
  if (temporaryTabIndex) element.setAttribute('tabindex', '-1');

  element.focus({ preventScroll });
  if (document.activeElement !== element) {
    if (temporaryTabIndex) element.removeAttribute('tabindex');
    return false;
  }

  if (temporaryTabIndex) {
    element.addEventListener('blur', () => {
      if (element.getAttribute('tabindex') === '-1') element.removeAttribute('tabindex');
    }, { once: true });
  }

  return true;
}

export function focusMainContent() {
  return focusProgrammaticTarget(document.getElementById('main-content'));
}
