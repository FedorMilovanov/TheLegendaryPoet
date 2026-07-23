# Application shell, route delivery, and scroll runtime

This document defines the integration boundary for navigation, lazy pages, persistent site chrome, scroll restoration, and deployment-chunk recovery.

## Persistent shell

`SiteLayout` is a pathless parent route. It owns long-lived interface systems:

- Header and navigation;
- Command Palette;
- Mobile Dock;
- Footer;
- visual backdrop and custom cursor;
- smooth-scroll enhancement;
- scroll-to-top control.

Page modules render through the nested route outlet. Adding a page must not duplicate `SiteLayout` around the new route. Recreating the shell on every pathname resets listeners, animation state, command UI, and scroll infrastructure and makes future integrations increasingly fragile.

The audio provider remains above the router and the audio chrome remains outside page-level error boundaries. A broken article or route chunk must not stop an active MP3 or remove its controls.

## Lazy route registry

All page modules are declared in `src/routes/routeModules.tsx`.

Each page has:

- one cached dynamic importer;
- one `React.lazy` component;
- one route pattern used for intent prefetch;
- one stable recovery ID.

Do not add eager page imports to `App.tsx`. New pages must be registered in the route module registry and in `scripts/validate-app-shell.ts`. The production manifest audit will fail when a registered page stops being a dynamic entry.

## Intent prefetch

Internal `Link` and `NavLink` warm a destination only after deliberate intent:

- keyboard focus;
- pointer hover;
- touch start.

Prefetch is disabled when the browser is offline, Data Saver is enabled, or the effective connection is 2G/slow-2G. Background prefetch failures are silent and never reload the page.

The route importer caches its current promise. Repeated hover or focus cannot create duplicate requests for the same chunk.

## Deployment recovery

A visitor can keep an older HTML document open while a new deployment replaces hashed JavaScript assets. Navigation can then fail with a stale chunk URL.

The render loader:

1. classifies only known dynamic-import and CSS-preload failures;
2. retries the same route once after a short delay;
3. when still online and still failing, performs one controlled document reload;
4. records the recovery attempt in session storage for 45 seconds;
5. falls through to the page error boundary instead of entering a reload loop.

A successful page load clears its recovery marker.

## Loading and page failure states

`RouteLoadingShell` is rendered inside the persistent site shell. It reserves a stable content area and uses reduced-motion-safe animation.

The page-scoped `ErrorBoundary` distinguishes:

- offline loading failure;
- stale or unavailable route chunk;
- a general page render error.

Recovery offers a real reload and a route back to the home page. Stack traces and implementation details are not exposed publicly.

## Focus and announcements

The main content element is programmatically focusable. After a pathname change:

- the page title is announced in a polite live region;
- focus moves to the main content without changing scroll position;
- the first document load is not interrupted.

Query-only filter changes do not steal focus.

## Scroll behavior

Touch devices, high-contrast mode users, and visitors who prefer reduced motion retain native scrolling.

Lenis is a lazy enhancement for fine-pointer devices. It has one lifetime for the mounted application shell and is not recreated on every route.

The scroll runtime owns browser history restoration:

- PUSH navigation starts at the top;
- POP navigation restores the saved position for that history entry;
- stored positions are bounded to 80 entries;
- hash targets are retried while lazy page content mounts;
- malformed percent-encoded hashes cannot throw;
- both native and Lenis hash navigation compensate for the fixed header.

## Custom cursor

The custom cursor is enabled only for fine pointers when reduced motion and forced colors are both inactive. The native pointer is hidden only after the custom cursor has received a real position.

Pointer coordinates live in Framer Motion values rather than React state. A 120 Hz mouse must not trigger 120 React renders per second in the persistent shell.

The 3D Hall always keeps the native pointer.

## Build budgets

Vite emits `dist/.vite/manifest.json`. `validate:build-output` requires:

- exactly one HTML production entry;
- all registered pages as dynamic entries;
- at least ten distinct route chunks;
- no route chunk in the eager entry dependency graph;
- a raw entry budget of 700 KB;
- a raw per-route budget of 1.3 MB;
- a raw per-JavaScript-file budget of 1.9 MB;
- total raw JavaScript below 9 MB;
- total raw CSS below 2 MB.

Budgets are intentionally conservative ceilings, not performance targets. When a route approaches a ceiling, split the heavy feature inside that route instead of raising the limit without investigation.

## Required checks

Run after navigation or shell changes:

```bash
npm run validate:app-shell
npm run typecheck
npm run build
npm run validate:build-output
```

The complete CI additionally runs all content, music, audio-session, archive, community, literary-style, sitemap, prerender, and generated-output checks.
