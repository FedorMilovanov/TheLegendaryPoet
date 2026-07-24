import { useCallback, useEffect, useRef, type RefObject } from 'react';
import {
  acquireOverlayLock,
  canRestoreOverlayFocus,
  type OverlayLockHandle,
} from '../utils/overlayRuntime';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(dialog: HTMLElement | null) {
  if (!dialog) return [];
  return [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter((element) => {
    if (element.closest('[inert]')) return false;
    if (element.getAttribute('aria-hidden') === 'true') return false;
    return element.getClientRects().length > 0;
  });
}

interface DialogSurfaceOptions {
  open: boolean;
  dialogRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  label?: string;
  closeOnEscape?: boolean;
  restoreFocus?: boolean;
  restoreFocusRef?: RefObject<boolean | null>;
}

/**
 * Shared lifecycle for modal surfaces: stack-safe page locking, focus entry,
 * focus containment, Escape handling and focus restoration. It intentionally
 * owns no visual markup, so every surface keeps its own design.
 */
export function useDialogSurface({
  open,
  dialogRef,
  initialFocusRef,
  onClose,
  label = 'dialog',
  closeOnEscape = true,
  restoreFocus = true,
  restoreFocusRef,
}: DialogSurfaceOptions) {
  const handleRef = useRef<OverlayLockHandle | null>(null);

  // A keyed modal can replace its DOM node while staying logically open (for
  // example when the active track changes). Keep the stack's focus root live.
  useEffect(() => {
    if (open) handleRef.current?.setRoot(dialogRef.current);
  });

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const handle = acquireOverlayLock(label, dialogRef.current);
    handleRef.current = handle;
    handle.setEscapeHandler(closeOnEscape ? () => {
      // Current modal surfaces provide stable callbacks. Calling the concrete
      // callback directly avoids a separate passive-effect ref handoff while
      // audio state is re-rendering rapidly, and finally still guarantees the
      // runtime stack is released synchronously for the next Escape.
      try {
        onClose();
      } finally {
        handle.release();
      }
    } : null);

    const focusFrame = window.requestAnimationFrame(() => {
      const preferred = initialFocusRef?.current;
      const fallback = getFocusableElements(dialogRef.current)[0] ?? dialogRef.current;
      (preferred ?? fallback)?.focus({ preventScroll: true });
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (!handle.isTopmost() || event.key !== 'Tab') return;
      const focusable = getFocusableElements(dialogRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const activeInside = active instanceof Node && Boolean(dialogRef.current?.contains(active));

      if (!activeInside) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus({ preventScroll: true });
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last?.focus({ preventScroll: true });
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first?.focus({ preventScroll: true });
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', onKeyDown, true);
      handle.release();
      if (handleRef.current === handle) handleRef.current = null;

      const shouldRestoreFocus = restoreFocusRef?.current ?? restoreFocus;
      if (shouldRestoreFocus && previouslyFocused) {
        window.requestAnimationFrame(() => {
          if (previouslyFocused.isConnected && canRestoreOverlayFocus(previouslyFocused)) {
            previouslyFocused.focus({ preventScroll: true });
          }
        });
      }
    };
  }, [closeOnEscape, dialogRef, initialFocusRef, label, onClose, open, restoreFocus, restoreFocusRef]);

  return {
    isTopmost: useCallback(() => handleRef.current?.isTopmost() ?? false, []),
  };
}
