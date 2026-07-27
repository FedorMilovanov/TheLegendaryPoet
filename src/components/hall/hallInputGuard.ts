const EDITABLE_SELECTOR = 'input, textarea, select, button, [contenteditable="true"]'

type ClosestCapableTarget = EventTarget & {
  closest?: (selector: string) => Element | null
}

export function isHallOverlayOpen() {
  if (typeof window === 'undefined') return false
  return Boolean((window as Window & { __TLP_MODAL_OPEN?: boolean }).__TLP_MODAL_OPEN)
}

export function isEditableHallTarget(target: EventTarget | null) {
  if (!target || typeof target !== 'object') return false
  const closest = (target as ClosestCapableTarget).closest
  return typeof closest === 'function' && Boolean(closest.call(target, EDITABLE_SELECTOR))
}

/**
 * Hall shortcuts are global by necessity, but never own keystrokes while a
 * modal, editable control, IME composition or browser/OS modifier chord owns
 * the interaction.
 */
export function shouldIgnoreHallShortcut(event: KeyboardEvent) {
  return (
    isHallOverlayOpen()
    || event.defaultPrevented
    || event.repeat
    || event.isComposing
    || event.ctrlKey
    || event.metaKey
    || event.altKey
    || isEditableHallTarget(event.target)
  )
}
