import type { FocusEvent, MouseEvent } from 'react';

export const supportsPopover = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

const invokers = new WeakMap<Element, HTMLElement>();

/** Native return focus follows the active element before opening, not
 * necessarily the button that was tapped. Establish the actual invoker. */
export function focusPopoverInvoker(event: MouseEvent<HTMLButtonElement>) {
  const button = event.currentTarget;
  const panel = button.popoverTargetElement;
  if (panel) invokers.set(panel, button);
  button.focus({ preventScroll: true });
}

/** Tab is allowed to leave a non-modal group. Its floating panel must not
 * continue to cover the newly focused control. Keep native Escape/light dismiss. */
export function dismissPopoverOnFocusExit(event: FocusEvent<HTMLElement>) {
  if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) {
    event.currentTarget.querySelector<HTMLElement>('[popover]')?.hidePopover();
  }
}

/** A native top layer outranks even the highest application z-index. Retire
 * it before a modal acquires the page, without saving focus on a hidden row. */
export function dismissPopoversForDialog(focused: HTMLElement | null) {
  if (!supportsPopover) return focused;
  for (const panel of document.querySelectorAll<HTMLElement>('[popover]:popover-open')) {
    const heldFocus = panel.contains(focused);
    panel.hidePopover();
    if (!heldFocus) continue;
    const invoker = invokers.get(panel);
    const restored = document.activeElement;
    focused = invoker?.isConnected ? invoker :
      restored instanceof HTMLElement && restored !== document.body && !panel.contains(restored) ? restored : null;
  }
  return focused;
}
