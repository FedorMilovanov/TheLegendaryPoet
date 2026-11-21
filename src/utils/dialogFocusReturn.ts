import { liveReaderPage } from './scrollHistory';
import { canRestoreOverlayFocus } from './overlayRuntime';
import { focusProgrammatically, isAvailableFocusTarget } from './focusRuntime';
import { dismissPopoversForDialog } from './popover';

type RestoreFocus = () => boolean;
type CaptureReturn = (origin: HTMLElement) => RestoreFocus | null;

// Most controls need no registration. Composite controls can remember the
// logical item before their popover closes, and resolve its *current* UI later.
const owners = new WeakMap<HTMLElement, CaptureReturn>();
export function registerDialogFocusReturn(scope: HTMLElement, capture: CaptureReturn) {
  owners.set(scope, capture);
  return () => { owners.delete(scope); };
}

export function focusReturnTarget(target: HTMLElement | null) {
  if (!target?.isConnected || target === document.body || !canRestoreOverlayFocus(target) || !isAvailableFocusTarget(target)) return false;
  // Hash navigation may have made a heading temporarily focusable. Its
  // tabindex was removed on blur; give the same heading back to the reader.
  return focusProgrammatically(target);
}

function captureOwner(origin: HTMLElement | null) {
  if (!origin) return null;
  for (let scope: HTMLElement | null = origin; scope; scope = scope.parentElement) {
    const restore = owners.get(scope)?.(origin);
    if (restore) return restore;
  }
  return null;
}

export function captureDialogFocusReturn() {
  const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const restoreOwner = captureOwner(origin);
  const invoker = dismissPopoversForDialog(origin);
  const peerKey = invoker?.dataset.focusPeer;
  const page = liveReaderPage();
  return () => {
    if (liveReaderPage() !== page || restoreOwner?.() || focusReturnTarget(invoker)) return;
    // E.g. the header button and the dock jewel perform the same action but
    // only one exists in layout. Never identify a peer by translated text.
    if (peerKey) {
      for (const peer of document.querySelectorAll<HTMLElement>(`[data-focus-peer="${CSS.escape(peerKey)}"]`)) {
        if (peer !== invoker && focusReturnTarget(peer)) return;
      }
    }
    // A shortcut can start at BODY or on an outgoing control that disappears
    // during loading. Don't strand Tab at the document or displace newer focus.
    if (document.activeElement === document.body) focusReturnTarget(document.getElementById('main-content'));
  };
}
