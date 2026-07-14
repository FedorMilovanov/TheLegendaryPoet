import type { CSSProperties } from 'react';

/**
 * View Transitions engine (site-wide).
 *
 * Navigation cross-fades and shared-element morphs run on the browser's
 * View Transitions API (Chrome 111+/Edge/Safari 18+; Firefox ships it too).
 * Where unsupported, the app silently falls back to the classic framer-motion
 * page transition (see PageWrapper in App.tsx) — no feature is lost.
 *
 * The pieces:
 *  - `Link`/`NavLink` from components/ui/Link opt every internal navigation in.
 *  - `vtShared(name)` marks a DOM element as a shared element: give the SAME
 *    name to the element on both pages (e.g. a poet portrait on the card and
 *    on the poet page) and the browser morphs one into the other.
 *  - The `::view-transition-*` rules in index.css define the house animation
 *    (fast fade-through with a gentle rise; reduced-motion turns it off).
 */
export const supportsViewTransitions =
  typeof document !== 'undefined' && 'startViewTransition' in document;

/**
 * Inline style for a shared element. `name` must be unique per page —
 * derive it from a stable id (`vtShared('poet-portrait-yesenin')`).
 * The `vt-media` class lets CSS crop (not stretch) snapshots of imagery
 * whose aspect ratio changes between pages.
 */
export function vtShared(name: string): CSSProperties {
  const safe = name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  return {
    viewTransitionName: safe,
    viewTransitionClass: 'vt-media',
  } as CSSProperties;
}
