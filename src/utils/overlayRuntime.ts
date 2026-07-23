import { pauseSmoothScroll, restoreSmoothScrollPosition } from './smoothScroll';

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
};

export interface OverlayReleaseOptions {
  restoreScroll?: boolean;
}

export interface OverlayLockHandle {
  release: (options?: OverlayReleaseOptions) => void;
  isTopmost: () => boolean;
  setRoot: (root: HTMLElement | null) => void;
}

const overlayStack: OverlayEntry[] = [];
let styleSnapshot: StyleSnapshot | null = null;
let releaseSmoothScroll: (() => void) | null = null;
let restoreScrollOnUnlock = true;

function setLegacyModalFlag(open: boolean) {
  if (typeof window === 'undefined') return;
  try {
    (window as Window & { __TLP_MODAL_OPEN?: boolean }).__TLP_MODAL_OPEN = open;
  } catch {
    // Restricted embedded browsers may expose a non-extensible Window object.
  }
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

  restoreScrollOnUnlock = true;
  releaseSmoothScroll = pauseSmoothScroll('modal-surface');
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
  setLegacyModalFlag(true);
}

function unlockDocument() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const snapshot = styleSnapshot;
  const shouldRestoreScroll = restoreScrollOnUnlock;
  const body = document.body;
  const html = document.documentElement;

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
    if (shouldRestoreScroll) window.scrollTo(snapshot.scrollX, snapshot.scrollY);
  }

  html.classList.remove('overlay-open');
  body.classList.remove('overlay-open');
  styleSnapshot = null;
  const release = releaseSmoothScroll;
  releaseSmoothScroll = null;
  release?.();
  setLegacyModalFlag(false);

  // Browser layout and Lenis limits settle after fixed-body styles are removed.
  // Re-apply only in a real animation-frame environment; the synchronous write
  // above remains deterministic for the Node interaction validator.
  if (snapshot && shouldRestoreScroll && typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => restoreSmoothScrollPosition(snapshot.scrollX, snapshot.scrollY));
  }
  restoreScrollOnUnlock = true;
}

/**
 * Lock the page behind a modal surface. Handles are idempotent and stack-aware,
 * so command search may open above immersive playback without unlocking the
 * document or resuming Lenis too early.
 */
export function acquireOverlayLock(label = 'overlay', root: HTMLElement | null = null): OverlayLockHandle {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { release: () => undefined, isTopmost: () => true, setRoot: () => undefined };
  }

  const entry: OverlayEntry = { token: Symbol(label), root };
  overlayStack.push(entry);
  if (overlayStack.length === 1) lockDocument();
  let released = false;

  return {
    isTopmost: () => overlayStack[overlayStack.length - 1]?.token === entry.token,
    setRoot: (nextRoot) => {
      if (!released) entry.root = nextRoot;
    },
    release: (options) => {
      if (released) return;
      released = true;
      if (options?.restoreScroll === false) restoreScrollOnUnlock = false;
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
  const top = overlayStack[overlayStack.length - 1];
  if (!top) return true;
  return Boolean(top.root?.contains(element));
}

export function hasOpenOverlay() {
  return overlayStack.length > 0;
}
