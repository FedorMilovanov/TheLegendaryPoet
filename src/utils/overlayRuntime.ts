import { createIsolationScope } from './accessibilityIsolation';
import { activeEntryId, type ScrollVisit } from './scrollHistory';
import { pauseSmoothScroll } from './smoothScroll';
import { capturePagePosition, resolvePagePosition, type PagePosition } from './readingBookmark';

export const OVERLAY_SCROLL_RESTORED = 'tlp-overlay-scroll-restored';

type StyleSnapshot = {
  page: PagePosition;
  href: string;
  entry?: string;
  body: {
    position: string;
    top: string;
    left: string;
    right: string;
    width: string;
    overflow: string;
    paddingRight: string;
    overscrollBehavior: string;
  };
  html: {
    overflow: string;
    overscrollBehavior: string;
  };
};

type OverlayEntry = {
  token: symbol;
  label: string;
  root: HTMLElement | null;
  onEscape: (() => void) | null;
  onNavigate?: () => void;
};

type OverlayDebugState = {
  depth: number;
  labels: string[];
  connected: boolean[];
  topLabel: string | null;
  escapeCount: number;
  lastEscapeLabel: string | null;
};

export interface OverlayLockHandle {
  release: () => void;
  isTopmost: () => boolean;
  dismissForNavigation: () => boolean;
  setRoot: (root: HTMLElement | null) => void;
  setEscapeHandler: (handler: (() => void) | null) => void;
}

const overlayStack: OverlayEntry[] = [];
let styleSnapshot: StyleSnapshot | null = null;
let resumeSmoothScroll: ((restoredScrollY?: number) => void) | null = null;
let escapeCount = 0;
let lastEscapeLabel: string | null = null;
const backgroundIsolation = createIsolationScope();

function syncOverlayAccessibility() {
  backgroundIsolation.clear();
  const top = overlayStack[overlayStack.length - 1];
  const root = top?.root;
  if (!root?.isConnected) return;

  let branch: HTMLElement | null = root;
  while (branch && branch !== document.body) {
    const parent: HTMLElement | null = branch.parentElement;
    if (!parent) break;
    for (const siblingNode of Array.from(parent.children)) {
      if (siblingNode === branch) continue;
      const sibling = siblingNode as HTMLElement;
      if (typeof sibling.setAttribute !== 'function') continue;
      if (sibling.tagName === 'SCRIPT' || sibling.tagName === 'STYLE' || sibling.tagName === 'LINK') continue;
      backgroundIsolation.hide(sibling);
    }
    branch = parent;
  }
}

function setWindowValue(key: '__TLP_MODAL_OPEN' | '__TLP_OVERLAY_DEBUG', value: boolean | OverlayDebugState) {
  if (typeof window === 'undefined') return;
  try {
    (window as Window & {
      __TLP_MODAL_OPEN?: boolean;
      __TLP_OVERLAY_DEBUG?: OverlayDebugState;
    })[key] = value as never;
  } catch {
    // Restricted embedded browsers may expose a non-extensible Window object.
  }
}

function setLegacyModalFlag(open: boolean) {
  setWindowValue('__TLP_MODAL_OPEN', open);
}

function publishOverlayDebug() {
  const top = overlayStack[overlayStack.length - 1];
  setWindowValue('__TLP_OVERLAY_DEBUG', {
    depth: overlayStack.length,
    labels: overlayStack.map((entry) => entry.label),
    connected: overlayStack.map((entry) => Boolean(entry.root?.isConnected)),
    topLabel: top?.label ?? null,
    escapeCount,
    lastEscapeLabel,
  });
}

function rootIsDetached(root: HTMLElement | null) {
  return root === null || ('isConnected' in root && root.isConnected === false);
}

/**
 * React effects normally release every overlay entry during unmount. Browser
 * focus and keyboard events can, however, land in the single frame between a
 * portal being detached and its passive cleanup running. Remove entries whose
 * concrete roots are already gone so a stale upper surface cannot retain
 * keyboard ownership over the visible dialog underneath it.
 */
function pruneDetachedOverlays() {
  let removed = false;
  for (let index = overlayStack.length - 1; index >= 0; index -= 1) {
    if (!rootIsDetached(overlayStack[index].root)) continue;
    overlayStack.splice(index, 1);
    removed = true;
  }
  if (removed) {
    syncOverlayAccessibility();
    publishOverlayDebug();
  }
  if (removed && overlayStack.length === 0 && styleSnapshot) unlockDocument();
}

function getTopOverlay() {
  pruneDetachedOverlays();
  return overlayStack[overlayStack.length - 1];
}

function onOverlayKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return;
  const top = getTopOverlay();
  lastEscapeLabel = top?.label ?? null;
  if (!top?.onEscape) {
    publishOverlayDebug();
    return;
  }
  escapeCount += 1;
  publishOverlayDebug();
  event.preventDefault();
  event.stopPropagation();
  top.onEscape();
}

function belongsTo(snapshot: StyleSnapshot, href: string, entry: string | undefined) {
  return snapshot.href === href && (!snapshot.entry || snapshot.entry === entry);
}

/** Use the painted *departing* visit, not the address bar: fallback popstate
 * already exposes the next URL. A lock spanning entries retains X/Y but an
 * outgoing essay's passage cannot double as a bookmark for another visit. */
export function captureUnlockedPosition(visit: ScrollVisit): PagePosition {
  if (!styleSnapshot) return capturePagePosition();
  const { page } = styleSnapshot;
  return belongsTo(styleSnapshot, visit.url, visit.id) ? page : { x: page.x, y: page.y };
}

let claimArrival: (() => boolean) | undefined;
export function registerOverlayArrival(claim: () => boolean) {
  claimArrival = claim;
  return () => { if (claimArrival === claim) claimArrival = undefined; };
}

function lockDocument(painted: boolean) {
  const body = document.body;
  const html = document.documentElement;
  const page = painted ? capturePagePosition() : { x: window.scrollX, y: window.scrollY };
  const scrollbarGap = Math.max(0, window.innerWidth - html.clientWidth);
  const computedPaddingRight = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;

  styleSnapshot = {
    page, href: window.location.href, entry: activeEntryId(),
    body: {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
      overscrollBehavior: body.style.overscrollBehavior,
    },
    html: {
      overflow: html.style.overflow,
      overscrollBehavior: html.style.overscrollBehavior,
    },
  };

  resumeSmoothScroll = pauseSmoothScroll('modal-surface');
  html.classList.add('overlay-open');
  body.classList.add('overlay-open');
  html.style.overflow = 'hidden';
  html.style.overscrollBehavior = 'none';
  body.style.position = 'fixed';
  body.style.top = `${-page.y}px`;
  body.style.left = `${-page.x}px`;
  body.style.right = '0';
  body.style.width = '100%';
  body.style.overflow = 'hidden';
  body.style.overscrollBehavior = 'none';
  if (scrollbarGap > 0) body.style.paddingRight = `${computedPaddingRight + scrollbarGap}px`;
  document.addEventListener('keydown', onOverlayKeyDown, true);
  setLegacyModalFlag(true);
}

function unlockDocument() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const snapshot = styleSnapshot;
  const body = document.body;
  const html = document.documentElement;

  document.removeEventListener('keydown', onOverlayKeyDown, true);
  let restoredY = snapshot?.page.y;
  if (snapshot) {
    body.style.position = snapshot.body.position;
    body.style.top = snapshot.body.top;
    body.style.left = snapshot.body.left;
    body.style.right = snapshot.body.right;
    body.style.width = snapshot.body.width;
    body.style.overflow = snapshot.body.overflow;
    body.style.paddingRight = snapshot.body.paddingRight;
    body.style.overscrollBehavior = snapshot.body.overscrollBehavior;
    html.style.overflow = snapshot.html.overflow;
    html.style.overscrollBehavior = snapshot.html.overscrollBehavior;
    restoredY = belongsTo(snapshot, window.location.href, activeEntryId()) ? resolvePagePosition(snapshot.page).y : snapshot.page.y;
    window.scrollTo(snapshot.page.x, restoredY);
  }

  backgroundIsolation.clear();
  html.classList.remove('overlay-open');
  body.classList.remove('overlay-open');
  styleSnapshot = null;
  // A reflowed bookmark may have a very different Y. Observers of reader
  // gestures must start from the restored position, not infer a scroll down.
  if (snapshot) window.dispatchEvent(new Event(OVERLAY_SCROLL_RESTORED));
  resumeSmoothScroll?.(restoredY);
  resumeSmoothScroll = null;
  setLegacyModalFlag(false);
  publishOverlayDebug();
}

/**
 * Lock the page behind a modal surface. The returned handle is idempotent and
 * stack-aware, so command search can open above the immersive player without
 * restoring body scroll or Lenis too early. Escape is dispatched once through
 * the same stack instead of being contested by independent document listeners.
 */
export function acquireOverlayLock(label = 'overlay', root: HTMLElement | null = null, onNavigate?: () => void): OverlayLockHandle {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      release: () => undefined,
      isTopmost: () => true,
      dismissForNavigation: () => false,
      setRoot: () => undefined,
      setEscapeHandler: () => undefined,
    };
  }

  const entry: OverlayEntry = { token: Symbol(label), label, root, onEscape: null, onNavigate };
  overlayStack.push(entry);
  const painted = claimArrival?.() ?? true;
  if (overlayStack.length === 1) lockDocument(painted);
  syncOverlayAccessibility();
  publishOverlayDebug();
  let released = false;

  return {
    isTopmost: () => getTopOverlay()?.token === entry.token,
    dismissForNavigation: () => {
      const index = overlayStack.indexOf(entry);
      if (index < 0) return false;
      // Navigation leaves this dialog and its underlying surfaces, not an
      // unrelated, newer one. Request logical closes; exiting portals retain
      // their locks and the outgoing reading bookmark until they unmount.
      for (const surface of overlayStack.slice(0, index + 1).reverse()) surface.onNavigate?.();
      return true;
    },
    setRoot: (nextRoot) => {
      if (!released) {
        entry.root = nextRoot;
        syncOverlayAccessibility();
        publishOverlayDebug();
      }
    },
    setEscapeHandler: (handler) => {
      if (!released) entry.onEscape = handler;
    },
    release: () => {
      if (released) return;
      released = true;
      const index = overlayStack.findIndex((candidate) => candidate.token === entry.token);
      if (index >= 0) overlayStack.splice(index, 1);
      syncOverlayAccessibility();
      publishOverlayDebug();
      if (overlayStack.length === 0) unlockDocument();
      else if (document.activeElement === document.body) {
        // Search can disappear before a lower dialog's last painted frame.
        overlayStack.at(-1)?.root?.focus({ preventScroll: true });
      }
    },
  };
}

/**
 * Focus may return outside the overlay system only after the final surface has
 * closed. With another surface still open, restoration is allowed solely when
 * the previous control belongs to the new topmost dialog.
 */
export function canRestoreOverlayFocus(element: HTMLElement) {
  const top = getTopOverlay();
  if (!top) return true;
  return Boolean(top.root?.contains(element));
}

export function hasOpenOverlay() {
  pruneDetachedOverlays();
  return overlayStack.length > 0;
}
