# Media and overlay runtime

This document defines the interaction contract for modal surfaces, responsive imagery and pointer decoration. New features must reuse these primitives instead of adding page-specific body locks, focus traps or unguarded image loading.

## Modal surfaces

Every modal surface must use `useDialogSurface`. Animated surfaces must also use `useDialogExitLifetime` and pass its `lockOpen` to the dialog hook, `deferReleaseUntilUnmount: true`, and `onExitComplete` to `AnimatePresence`. Focus isolation, scroll locking and overlay-stack ownership then survive until the painted dialog has exited, rather than disappearing when the logical `open` flag turns false.

The hook provides:

- stack-aware ownership through `acquireOverlayLock`;
- body scroll preservation on both axes; a reading bookmark if the text reflows;
- scrollbar-gap compensation to prevent layout jumps;
- reference-counted pause and release through the native scroll bridge;
- the legacy `window.__TLP_MODAL_OPEN` signal used by the 3D hall;
- initial focus placement;
- focus containment with Tab and Shift+Tab (programmatic focus targets, including combobox options, are not extra Tab stops);
- Escape handling only for the topmost surface;
- focus restoration with `preventScroll` to an available control owned by the newly exposed surface.

A component must still provide:

- `role="dialog"` and `aria-modal="true"`;
- an accessible label or `aria-labelledby`;
- a visible close control;
- `tabIndex={-1}` on the dialog container as a fallback focus target;
- safe-area padding and an internally scrollable surface where needed.

Do not write directly to `document.body.style.overflow`, `document.documentElement.style.overflow` or `window.__TLP_MODAL_OPEN` inside a feature component. Independent restoration is incorrect when two overlays are stacked.

### Returning to reading

The outermost lock captures one transient bookmark when the reading line (34% of the viewport) crosses a `[data-reading-flow]`. Its direct children are passages: essay blocks, biography paragraphs or canonical verse lines, not decorative paint. If the flow moves or rewraps, restore the same point in that passage under the new reading line; otherwise restore exact X/Y. Do not alter a fragment, a text selection or the browsing history. The reading chrome rebases its scroll direction **after** restoration: a different pixel offset is not a gesture to hide the dock. Nested surfaces share the physical lock, not the focus target. A fresh dialog may claim a different visit while an earlier viewer is still exiting. Do not recapture its fixed body's zero or assign the earlier visit’s passage to the new entry.

`captureDialogFocusReturn` captures a control **before** retiring its native popover. On ordinary dismissal, resolve the appropriate control in the current layout, check visibility, inertness and stack ownership, then focus it. The header and dock mark equivalent search buttons with the same `data-focus-peer`. A composite control may register a return resolver: the table of contents remembers the *explored* chapter without selecting it. Programmatically focused fragment headings can regain their temporary tabindex. A search result that navigates must yield to the destination’s focus handling instead. Selecting a result hands the unlocked bookmark to the shell’s [route history](APP_SHELL_RUNTIME.md#scroll-behavior); it must not save the fixed body’s zero. Browser Back to another chapter while search is open dismisses search, releases the lock and resumes that entry, not the search trigger.

An open search belongs to the **live browser address at opening**, not to the last rendered outlet. Completing an earlier route import does not dismiss a newer search or reset its explored result. A real page/chapter departure retires it, even when Back cancels a PUSH that never committed. Query-only filter updates keep the dialog. Compare command destinations against the live address (including basename, query and decoded fragment) before choosing PUSH or REPLACE. On ordinary dismissal use the visible opener/peer; if no opener survives and focus would be stranded on the document body, return to the main landmark without scrolling.

The optional essay index must not change a command already under Enter or a held pointer. For the current draft, keep the exposed rows in place and append missing matches from the complete ranking (at most ten provisional + ten ranked). A new edit starts with the current index. A row moving beneath a stationary cursor is not permission to replace the active keyboard option. Compare viewport coordinates from the open sheet, not just `movementX/Y` on the result button; touch activates by tap. Disable browser scroll anchoring inside the result list: removing its loading message is not a request to shift the hit target.

Search keeps its input and close button outside the result list’s scrollport. Arrow keys and list reflow reveal the active descendant inside that list, not by scrolling the page. The shortcut, Escape, close button and backdrop all dismiss the same search session; a fresh opening starts at the first option with an empty query.

## Stacked overlays

The lock runtime keeps an ordered token stack. Closing a lower surface cannot unlock the document while a higher surface remains open. Keyboard shortcuts behind a modal must call the `isTopmost()` function returned by `useDialogSurface` before acting.

Escape dismisses only the top surface. A search command that **navigates**, including an explicit repeat, requests closure from the search down through the dialogs it covers. Do the same for a real departure that dismisses search. Do not simulate Escape, stop audio, return focus to departing openers, or force-release an animated viewer. The route gets focus after the final painted viewer leaves. If another search opens first, it owns its own arrival.

Reading-mode chrome and modal isolation can hide the same header or dock. Both use `createIsolationScope`; only the final owner restores the previous `inert` and `aria-hidden` attributes. A visible button that can't be activated is not a successful restoration.

This matters for combinations such as:

- command search above the immersive music player;
- command search opened from an essay image lightbox;
- confirmation or source details above another dialog.

## Non-modal panels

Citation labels, the chapter menu and volume controls use native auto popovers, not additional modal locks. Escape and outside dismissal belong to the browser. Opening a modal dismisses any existing popover before the shared stack takes focus; the page lock must not be mistaken for a reader scroll.

`useAnchoredPanel` positions only a visible label, slider or selection action. Place the `.anchored-panel` at its actual measured width beside the trigger (or text range); do not estimate label dimensions, use a transformed card as a fixed containing block, or leave a gap between a hover label and its trigger. Dismiss interactive panels and pointer-only previews when their trigger scrolls out of view or keyboard focus leaves their group. If reflow temporarily moves a *focused* citation off screen, hide its label until it is back in view. A dismissed label stays dismissed; an offscreen one cannot block another hover. Establish the real popover invoker on activation: two volume buttons can target the same slider. Do not infer the invoker from the first matching button.

A passive citation hover may replace another hover preview, not an open control or the visible title of a focused citation. Escape releases the preview without moving focus. Wrap long runs of numbers inside the text column; a document with no horizontal scrollbar is not proof that its last source is reachable.

`SectionChip` measures the reading position after scroll, viewport resize and article reflow. Opening the list brings the current chapter into focus and into the list’s own scrollport. Keep the chapter being *explored* separate from the one being *read*: widen to its desktop link; narrow to the closed compact control and resume at the explored row on the next activation. If the desktop rail is entirely off screen (for instance before the cover ends), retain the compact equivalent for this focus visit only. Resizing is not a request to navigate, change the URL or open a menu.

A copy-link action is not a native popover. It tracks a selection only inside its reading surface. Bind clipboard completion and feedback to the exact range; do not clear the reader’s selection on a timer.

## Essay image viewer

`ImageBlock` owns the body portal and shared modal lease. `LightboxFigure` exists only inside that portal and observes the viewer image’s own native load state. On failure keep the caption, source (if provided) and close action, not a broken image or functioning zoom.

Fit the whole unzoomed scan inside its rounded frame. Pan a magnified scan by moving its scale origin within the image (0–100%), not by translating it beyond the frame. Capture the primary pointer only on the magnified photo. Its origin follows the displacement from press to current point, including the release outside the frame; do not lose the last displacement if rendering was paused between input events. The zoom button also supports arrow keys while pressed. At large text sizes scroll the sheet rather than crushing the photo or moving the close button off screen. As with command results, changing the image or its zoom hint is not permission to re-anchor the sheet beneath the focused control. Keep native scrolling and the document's normal scroll anchoring elsewhere.

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

Mark the rounded, `overflow-hidden` artwork with `.tilt-card-surface`. Its `::after` owns the pointer light; do not put a full-column overlay next to the artwork, especially when a scan is width-capped or has credits. Keep the hit target and its focus ring stationary while the inner visual moves. A translating parent also moves every link inside it: fade the home entrance shells, and keep lifts off reading links and player controls. Test the unhovered bottom edge through the whole transition, not just the final frame.

Use one cursor at a time. Hand off to the OS over native popovers/backdrops, form fields, selectable poem text and zoom/pan imagery. A document-level cursor cannot paint above the browser’s top layer, and a second ring obscures a text or grab cursor.

The effect is disabled when:

- the pointer is not fine and hover-capable;
- reduced motion is requested;
- forced colors are active;
- the card is outside the observed viewport margin;
- the incoming pointer event comes from touch.

Pointer coordinates stay outside React state, painting is limited to one animation frame, and `will-change` is applied only while the effect is active. This prevents large poet and article grids from promoting every card into a permanent compositor layer.

## Adding a new modal

1. For animated surfaces, retain the modal stack lease throughout its exit animation and release only after `AnimatePresence` reports completion; unmount still releases synchronously through effect cleanup.
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
# With the production preview on 4173:
npx playwright test qa/hover-surfaces.spec.mjs qa/reader-dialog-return.spec.mjs qa/command-navigation.spec.mjs --project=chromium-core --project=android-pixel7
# With the locked WebKit engine installed:
npx playwright test qa/hover-surfaces.spec.mjs qa/reader-dialog-return.spec.mjs qa/command-navigation.spec.mjs --project=webkit-reader-desktop --project=iphone-safari
```

The interaction validator runs an actual nested-lock simulation and then verifies the source-level contracts for shared dialogs, resilient images, smooth-scroll pausing and bounded tilt effects.
