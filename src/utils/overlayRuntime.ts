import { pauseSmoothScroll } from './smoothScroll';

type StyleSnapshot = {
  scrollX: number;
  scrollY: number;
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
  root: HTMLElement | null;
  onEscape: (() => void) | null;
};

export interface OverlayLockHandle {
  release: () => void;
  isTopmost: () => boolean;
  setRoot: (root: HTMLElement | null) => void;
  setEscapeHandler: (handler: (() => void) | null) => void;
}

const overlayStack: OverlayEntry[] = [];
let styleSnapshot: StyleSnapshot | null = null;
let resumeSmoothScroll: (() => void) | null = null;

function setLegacyModalFlag(open: boolean) {
  if (typeof window === 'undefined') return;
  try {
    (window as Window & { __TLP_MODAL_OPEN?: boolean }).__TLP_MODAL_OPEN = open;
  } catch {
    // Restricted embedded browsers may expose a non-extensible Window object.
  }
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
  if (removed && overlayStack.length === 0 && styleSnapshot) unlockDocument();
}

function getTopOverlay() {
  pruneDetachedOverlays();
  return overlayStack[overlayStack.length - 1];
}

function onOverlayKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return;
  const top = getTopOverlay();
  if (!top?.onEscape) return;
  event.preventDefault();
  event.stopPropagation();
  top.onEscape();
}

function lockDocument() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const body = document.body;
  const html = document.documentElement;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const scrollbarGap = Math.max(0, window.innerWidth - html.clientWidth);
  const computedPaddingRight = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;

  styleSnapshot = {
    scrollX,
    scrollY,
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
  body.style.top = `${-scrollY}px`;
  body.style.left = `${-scrollX}px`;
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
    window.scrollTo(snapshot.scrollX, snapshot.scrollY);
  }

  html.classList.remove('overlay-open');
  body.classList.remove('overlay-open');
  styleSnapshot = null;
  resumeSmoothScroll?.();
  resumeSmoothScroll = null;
  setLegacyModalFlag(false);
}

/**
 * Lock the page behind a modal surface. The returned handle is idempotent and
 * stack-aware, so command search can open above the immersive player without
 * restoring body scroll or Lenis too early. Escape is dispatched once through
 * the same stack instead of being contested by independent document listeners.
 */
export function acquireOverlayLock(label = 'overlay', root: HTMLElement | null = null): OverlayLockHandle {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      release: () => undefined,
      isTopmost: () => true,
      setRoot: () => undefined,
      setEscapeHandler: () => undefined,
    };
  }

  const entry: OverlayEntry = { token: Symbol(label), root, onEscape: null };
  overlayStack.push(entry);
  if (overlayStack.length === 1) lockDocument();
  let released = false;

  return {
    isTopmost: () => getTopOverlay()?.token === entry.token,
    setRoot: (nextRoot) => {
      if (!released) entry.root = nextRoot;
    },
    setEscapeHandler: (handler) => {
      if (!released) entry.onEscape = handler;
    },
    release: () => {
      if (released) return;
      released = true;
      const index = overlayStack.findIndex((candidate) => candidate.token === entry.token);
      if (index >= 0) overlayStack.splice(index, 1);
      if (overlayStack.length === 0) unlockDocument();
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
