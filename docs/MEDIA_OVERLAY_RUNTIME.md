# Media and overlay runtime

This document defines the interaction contract for modal surfaces, responsive imagery and pointer decoration. New features must reuse these primitives instead of adding page-specific body locks, focus traps or unguarded image loading.

## Modal surfaces

Every modal surface must use `useDialogSurface`.

The hook provides:

- stack-aware ownership through `acquireOverlayLock`;
- exact body scroll preservation, including horizontal position;
- scrollbar-gap compensation to prevent layout jumps;
- reference-counted Lenis pause and resume;
- the legacy `window.__TLP_MODAL_OPEN` signal used by the 3D hall;
- initial focus placement;
- focus containment with Tab and Shift+Tab;
- Escape handling only for the topmost surface;
- focus restoration with `preventScroll`.

A component must still provide:

- `role="dialog"` and `aria-modal="true"`;
- an accessible label or `aria-labelledby`;
- a visible close control;
- `tabIndex={-1}` on the dialog container as a fallback focus target;
- safe-area padding and an internally scrollable surface where needed.

Do not write directly to `document.body.style.overflow`, `document.documentElement.style.overflow` or `window.__TLP_MODAL_OPEN` inside a feature component. Independent restoration is incorrect when two overlays are stacked.

## Stacked overlays

The lock runtime keeps an ordered token stack. Closing a lower surface cannot unlock the document while a higher surface remains open. Keyboard shortcuts behind a modal must call the `isTopmost()` function returned by `useDialogSurface` before acting.

This matters for combinations such as:

- command search above the immersive music player;
- a future image lightbox above a long article;
- confirmation or source details above another dialog.

## Responsive images

Local and remote imagery should use `ResilientImage`, directly or through a specialized wrapper such as `PoetImage` or `EssayCover`.

The primitive provides:

- base-path resolution for GitHub Pages and custom-domain builds;
- support for data, blob and remote URLs;
- optional fallback source;
- reset when the primary or fallback source changes;
- explicit `loading`, `decoding` and `fetchPriority` behavior;
- terminal failure without a broken-image icon;
- `data-image-state` for visual QA and component fallback styling.

Callers remain responsible for stable geometry. Use an aspect-ratio container or explicit width and height, and provide a realistic `sizes` value. Above-the-fold hero imagery may use `priority`; catalog cards and content images should remain lazy.

## Pointer decoration

`TiltCard` is a progressive enhancement. It must never be required to understand or activate a card.

The effect is disabled when:

- the pointer is not fine and hover-capable;
- reduced motion is requested;
- forced colors are active;
- the card is outside the observed viewport margin;
- the incoming pointer event comes from touch.

Pointer coordinates stay outside React state, painting is limited to one animation frame, and `will-change` is applied only while the effect is active. This prevents large poet and article grids from promoting every card into a permanent compositor layer.

## Adding a new modal

1. Keep the surface mounted only while open.
2. Create refs for the dialog and preferred initial control.
3. Call `useDialogSurface` with a stable close callback.
4. Mark the dialog correctly and make its content independently scrollable.
5. Check `isTopmost()` before running feature-level global keyboard shortcuts.
6. Add a regression assertion to `validate:interaction-runtime` when the surface introduces a new invariant.

## Required checks

```bash
npm run validate:interaction-runtime
npm run validate:app-shell
npm run typecheck
npm run build
```

The interaction validator runs an actual nested-lock simulation and then verifies the source-level contracts for shared dialogs, resilient images, smooth-scroll pausing and bounded tilt effects.
