import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import {
  acquireOverlayLock,
  canRestoreOverlayFocus,
  type OverlayLockHandle,
} from '../utils/overlayRuntime';
import { startNativeDialogEntrance, startNativeDialogExit } from '../utils/nativeDialogExit';
import { scheduleProgrammaticFocus } from '../utils/focusRuntime';

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
  returnFocusRef?: RefObject<HTMLElement | null>;
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
  returnFocusRef,
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

    const previouslyFocused = returnFocusRef?.current ?? (document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null);
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
      const root = dialogRef.current;
      // An interaction may focus a control before this initial-focus frame runs.
      // Never steal focus from an element already inside the active dialog.
      if (root?.contains(document.activeElement)) return;
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
        scheduleProgrammaticFocus(() =>
          previouslyFocused.isConnected && canRestoreOverlayFocus(previouslyFocused)
            ? previouslyFocused
            : null,
        );
      }
    };
  }, [closeOnEscape, deferReleaseUntilUnmount, dialogRef, initialFocusRef, label, onClose, open, restoreFocus, restoreFocusRef, returnFocusRef]);

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

/**
 * Use a compositor-owned Web Animations exit for the immersive player.
 * Framer's presence completion may be starved in WebKit even after Escape was
 * received. The painted dialog and its shared overlay lease remain together:
 * native completion or explicit terminal visual removal ends the exit.
 * The bounded liveness guard never releases the overlay lock independently.
 */
export function useNativeDialogExitLifetime(
  logicalOpen: boolean,
  dialogRef: RefObject<HTMLElement | null>,
) {
  const [retained, setRetained] = useState(logicalOpen);
  const latestOpen = useRef(logicalOpen);
  latestOpen.current = logicalOpen;
  const exitFrom = useRef(1);

  // All layout cleanups precede the next layout setups. Cancel the old
  // entrance before the exit starts, retaining its last painted opacity.
  // The root is stable across track changes, including focused controls.
  useLayoutEffect(() => {
    if (!logicalOpen) return;
    exitFrom.current = 1;
    const surface = dialogRef.current;
    if (!surface?.isConnected || typeof surface.animate !== 'function') return;
    const stopEntrance = startNativeDialogEntrance(surface);
    return () => { exitFrom.current = stopEntrance(); };
  }, [logicalOpen, dialogRef]);

  useLayoutEffect(() => {
    if (logicalOpen) {
      setRetained(true);
      return;
    }
    if (!retained) return;
    const surface = dialogRef.current;
    if (!surface?.isConnected || document.visibilityState === 'hidden' ||
        typeof surface.animate !== 'function') {
      setRetained(false);
      return;
    }
    return startNativeDialogExit(surface, () => !latestOpen.current, () => setRetained(false), exitFrom.current);
  }, [logicalOpen, retained, dialogRef]);

  return { lockOpen: logicalOpen || retained };
}
