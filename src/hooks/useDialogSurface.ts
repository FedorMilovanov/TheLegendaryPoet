import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
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
  /** Animated dialogs retain their overlay lease until AnimatePresence exit completion. */
  deferReleaseUntilUnmount?: boolean;
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
  deferReleaseUntilUnmount = false,
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
      // Non-animated surfaces may release on Escape. Animated surfaces must
      // preserve focus, inertness and scroll ownership while their exiting
      // dialog is still mounted and pointer-active.
      try {
        onClose();
      } finally {
        if (!deferReleaseUntilUnmount) handle.release();
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
  }, [closeOnEscape, deferReleaseUntilUnmount, dialogRef, initialFocusRef, label, onClose, open, restoreFocus, restoreFocusRef]);

  return {
    isTopmost: useCallback(() => handleRef.current?.isTopmost() ?? false, []),
  };
}

/**
 * Match overlay ownership to the lifetime of the painted modal, not merely
 * the logical open flag. Framer Motion keeps exiting nodes mounted until its
 * onExitComplete callback, including reduced-motion exits.
 *
 * Reopening during exit is safe: the completion callback checks the latest
 * logical state before relinquishing the shared overlay lock.
 */
export function useDialogExitLifetime(logicalOpen: boolean) {
  const [retained, setRetained] = useState(logicalOpen);
  const latestOpen = useRef(logicalOpen);
  latestOpen.current = logicalOpen;

  useEffect(() => {
    if (logicalOpen) setRetained(true);
  }, [logicalOpen]);

  const onExitComplete = useCallback(() => {
    if (!latestOpen.current) setRetained(false);
  }, []);

  return { lockOpen: logicalOpen || retained, onExitComplete };
}
