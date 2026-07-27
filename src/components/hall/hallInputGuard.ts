export function isHallOverlayOpen() {
  if (typeof window === 'undefined') return false
  return Boolean((window as Window & { __TLP_MODAL_OPEN?: boolean }).__TLP_MODAL_OPEN)
}

export function isEditableHallTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('input, textarea, select, button, [contenteditable="true"]'))
}

export function shouldIgnoreHallShortcut(event: KeyboardEvent) {
  return isHallOverlayOpen() || event.repeat || isEditableHallTarget(event.target)
}
