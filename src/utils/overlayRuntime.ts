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

export interface OverlayLockHandle {
  release: () => void;
  isTopmost: () => boolean;
}

const overlayStack: symbol[] = [];
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
  setLegacyModalFlag(true);
}

function unlockDocument() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const snapshot = styleSnapshot;
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
 * restoring body scroll or Lenis too early.
 */
export function acquireOverlayLock(label = 'overlay'): OverlayLockHandle {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { release: () => undefined, isTopmost: () => true };
  }

  const token = Symbol(label);
  overlayStack.push(token);
  if (overlayStack.length === 1) lockDocument();
  let released = false;

  return {
    isTopmost: () => overlayStack[overlayStack.length - 1] === token,
    release: () => {
      if (released) return;
      released = true;
      const index = overlayStack.lastIndexOf(token);
      if (index >= 0) overlayStack.splice(index, 1);
      if (overlayStack.length === 0) unlockDocument();
    },
  };
}

export function hasOpenOverlay() {
  return overlayStack.length > 0;
}
