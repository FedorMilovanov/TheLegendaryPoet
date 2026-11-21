import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import {
  acquireOverlayLock,
  type OverlayLockHandle,
} from '../utils/overlayRuntime';
import { captureDialogFocusReturn } from '../utils/dialogFocusReturn';
import { isAvailableFocusTarget } from '../utils/focusRuntime';

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
    // Programmatic targets (e.g. combobox options) are not Tab stops,
    // even when their underlying element is a native button.
    if (element.hasAttribute('tabindex') && element.tabIndex < 0) return false;
    return isAvailableFocusTarget(element);
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

    const returnFocus = captureDialogFocusReturn();
    let leaving = false;
    const handle = acquireOverlayLock(label, dialogRef.current, () => {
      if (leaving) return;
      leaving = true;
      onClose();
    });
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
      const root = dialogRef.current;
      // An interaction may focus a control before this initial-focus frame runs.
      // Never steal focus from an element already inside the active dialog.
      if (!handle.isTopmost() || root?.contains(document.activeElement)) return;
      const preferred = initialFocusRef?.current;
      const fallback = getFocusableElements(root)[0] ?? root;
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

      // A pointer can focus a tabindex=-1 scroll region (such as listbox
      // padding). Resume the Tab cycle instead of exiting to browser chrome.
      if (!focusable.some(element => element === active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', onKeyDown, true);
      handle.release();
      if (handleRef.current === handle) handleRef.current = null;

      if (!leaving && restoreFocus) window.requestAnimationFrame(returnFocus);
    };
  }, [closeOnEscape, deferReleaseUntilUnmount, dialogRef, initialFocusRef, label, onClose, open, restoreFocus]);

  return {
    isTopmost: useCallback(() => handleRef.current?.isTopmost() ?? false, []),
    dismissForNavigation: useCallback(() => {
      if (!handleRef.current?.dismissForNavigation()) onClose();
    }, [onClose]),
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
