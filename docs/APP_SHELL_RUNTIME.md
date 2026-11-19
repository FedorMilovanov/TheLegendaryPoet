# Application shell, route delivery, and scroll runtime

This document defines the integration boundary for navigation, lazy pages, persistent site chrome, scroll restoration, and deployment-chunk recovery.

## Persistent shell

`SiteLayout` is a pathless parent route. It owns long-lived interface systems:

- Header and navigation;
- Command Palette;
- Mobile Dock;
- Footer;
- visual backdrop and custom cursor;
- native route/hash scroll restoration;
- scroll-to-top control.

Page modules render through the nested route outlet. Adding a page must not duplicate `SiteLayout` around the new route. Recreating the shell on every pathname resets listeners, animation state, command UI, and scroll infrastructure and makes future integrations increasingly fragile.

The audio provider remains above the router and the audio chrome remains outside page-level error boundaries. A broken article or route chunk must not stop an active MP3 or remove its controls.

## Route contract and lazy runtime

`src/routes/route-contract.json` is the single machine-readable owner of route ids, paths, page modules, explicit legacy redirects, sitemap participation, route-audit role, prefetch eligibility, and per-route build budgets. `src/routes/routeModules.ts` binds that contract to cached dynamic importers and `React.lazy`. `App.tsx`, sitemap generation, route QA, and build-budget validation consume the same contract instead of maintaining parallel path lists.

Each page has:

- one cached dynamic importer;
- one `React.lazy` component;
- one route pattern used for intent prefetch;
- one stable recovery ID.

Do not add eager page imports or manual route paths to `App.tsx`. New pages and redirects must be registered in `route-contract.json`; the runtime and validators must fail when its importer, module, sitemap, QA, or budget ownership drifts. Unknown `/articles/:id` URLs reach the normal NotFound boundary; only named historical URLs may redirect.

## Intent prefetch

Internal `Link` and `NavLink` warm a destination only after deliberate intent:

- keyboard focus;
- pointer hover;
- touch start.

Prefetch is disabled when the browser is offline, Data Saver is enabled, or the effective connection is 2G/slow-2G. Background prefetch failures are silent and never reload the page.

The route importer caches its current promise. Repeated hover or focus cannot create duplicate requests for the same chunk.

## Deployment recovery

A visitor can keep an older HTML document open while a new deployment replaces hashed JavaScript assets. Navigation can then fail with a stale chunk URL.

The render loader retries a recognized dynamic-import or CSS-preload failure once after 240 ms. If it still fails, the rejection carries the route ID. An importer (including a cached late rejection) cannot change the document head, navigate, or spend the reload allowance. Only a recovery boundary **mounted at that address and Router visit** may reload automatically, once per route within the 45-second session-storage window, and only while online. A successful module load clears its marker. A blocked marker, inaccessible storage or an offline browser leaves manual recovery available.

If Back cancels the request, its late success or failure must leave the restored article, audio session, and metadata alone. Forward to the genuinely failing destination can still use its own recovery.

## Loading and page failure states

`SiteLayout`'s persistent `main` reserves at least one full viewport (`min-h-screen`, 100vh) in loading, ready and page-error states. The header is fixed, so its height is not subtracted from this in-flow reservation. Footer stays in normal flow below that first viewport and remains accessible by scrolling; it is never conditionally hidden to suppress layout shifts. This also covers short pages without per-route spacer rules.

`RouteLoadingShell` controls only its skeleton's internal layout and reduced-motion-safe animation, not the page's viewport reservation. Cold, delayed SPA and warm routes, short content and page errors are guarded in `qa/shell-noise-singleton.spec.mjs`. Reservation prevents the observed loading-to-content footer shift; it is not a guarantee against unrelated font, media or page-level CLS.

The page-scoped `ErrorBoundary` distinguishes:

- offline loading failure;
- stale or unavailable route chunk;
- a general page render error.

A primary data/render failure offers **Повторить попытку**: replace the failed visit (same path, query and fragment), without reloading the document, resetting the audio session or adding a Back step. Explicit search re-selection also starts a fresh visit. Do not key healthy pages by visit or automatically retry a rejected body on re-render. A broken module retains the real **Обновить страницу** action. Both surfaces link home and expose no stack traces.

`discoveryHead.ts` reconciles the live browser pathname with the mounted outlet, rather than letting whichever promise settles last publish metadata. Keep a matching direct prerender indexable. A different pending SPA address gets neutral loading metadata even if only its primary JSON is delayed. A committed error or missing item has no canonical, `og:url` or route schema. Missing essays, poets and tracks use the actual `not-found` policy, not just a robots override. An existing nonpublished track can still have a `noindex` self canonical. On canceled navigation restore the mounted page's own head, including article fields.

## Focus and announcements

The main content element is programmatically focusable. After a pathname change:

- the page title is announced in a polite live region;
- the settled scroll request focuses the main landmark without scrolling, unless the reader has already taken focus or started navigating the page;
- the first document load is not interrupted.

The title/analytics notification does not move focus. Query-only filter changes do not steal focus or mint a new semantic view. Consent granted during a pending navigation cannot replay the previous page: wait for a committed page at the live address, including Back to a still-mounted article. Never report a loading or recovery title as a successful page view.

## Scroll behavior

Ordinary wheel, trackpad and touch movement belongs to the browser on every pointer class.
The component name `SmoothScroll` is retained for route restoration, not a global interpolation engine.
The checked ownership projection below comes from `docs/project-contract.json`;
its validator enforces the actual native-scroll behavior and rejects wheel interception.

<!-- runtime-facts:scroll:start -->
| Contract field | Value |
| --- | --- |
| `runtime.scrollMode` | `native` |
| `runtime.scrollCoordinator` | `src/components/SmoothScroll.tsx` |
| `runtime.scrollUtilities` | `src/utils/smoothScroll.ts` |
| `runtime.scrollValidator` | `scripts/validate-scroll-runtime.ts` |
<!-- runtime-facts:scroll:end -->

`SmoothScroll` captures the leaving entry **before** a shorter destination can clamp the document. If search has fixed the body, use the outer lock’s unlocked position. `scrollHistory.ts` retains at most 80 entries in memory (not DOM nodes, local storage or a log of scroll events). A native history entry key, or a Router key / opaque `history.state` stamp on older engines, distinguishes even two visits to the same chapter URL. Never add entries just to store a bookmark. On a new native hash entry, the pre-activation bookmark wins over a later `popstate` that may already see the destination scroll.

`RouteSettled` applies the arriving entry inside the route’s Suspense boundary, not against the outgoing article or the loading shell:

- A new path without a fragment starts at the top. First load without a fragment and query-only filter updates leave the reader alone.
- A new or explicitly reselected fragment scrolls to the target with 96px clearance and focuses it without a second scroll. Selecting the current chapter in search does not add a duplicate Back step. Malformed percent escapes cannot throw.
- A newly shared passage may carry a browser text directive after the ordinary fragment. Decode only the address before the literal `:~:`. If it is a reading address, measure the selected glyph after the owning content is ready, excluding an essay reveal’s temporary translation. Native highlighting is optional. Keep the native `:target` margin at the same 96px as programmatic placement: a browser can finish its element fallback after focus has settled. Reuse the same deadline, focus handoff, overlay/reader arbitration and POP bookmarks; do not start a second scroll loop.
- A committed error or 404 marks its real heading with `data-route-unavailable`. On arrival expose that heading and its recovery controls instead of observing for an absent fragment. Wait for a covering dialog to unlock; do not take its input focus. An error card's saved coordinates are not a bookmark in a subsequently readable article.
- On Back **and** Forward, the saved departure wins over an old fragment in the address bar. Unchanged layout restores exact coordinates; after reflow, a named reading flow plus child index and fraction restore the paragraph or verse line. An offscreen hash target does not take focus away from that passage.
- A Back that cancels a still-loading destination can leave the original React page mounted. Resume that entry even without a new route commit, once both the live address and current entry identify it. Its focus handoff belongs to the painted visit, not to a render attempt: Forward must still focus the newly painted destination. An explicit click on the current fragment is a jump, not such a traversal.
- Optional content remains non-blocking. If a fragment is missing, or a `ReaderLayoutPending` marker precedes the passage (e.g. the full biography above a poem), a child-list observer waits for actual layout. It rechecks on registration, has a 15-second deadline and is cleaned up on exit. Later sections do not block earlier targets. A font swap can rewrap a long article without a DOM insertion: wait on `document.fonts` within the same request, deadline and input-cancellation boundary, never on a permanent scroll listener.
- Until the jump **and its focus transfer** finish, `pendingRouteScroll.ts` yields to a reader’s scroll gesture, pointer press, non-modifier keystroke, or focus on another control. The listener is passive and scoped to that one request. Hover, viewport/layout changes, a modifier alone, and the normal focus on `main` or the fragment do not cancel a jump. Input within a covering overlay belongs to the overlay.
- Yielding cancels the pending observer, deadline, unlock callback and focus frames. Keep the URL. Capture the reader’s actual position on departure, even when the original jump never ran. Explicitly selecting the same fragment is a new request, not a permanently disabled target.
- If a reader opens a dialog **after the address changes but before its route paints**, the dialog claims that arrival, even when joining a lock held by an exiting viewer. Save X/Y, not a paragraph from the outgoing document. Closing the dialog must not replay the earlier jump. A subsequent navigation, including explicit re-selection, supersedes this claim. A dialog already open *before* navigation still releases the body before normal restoration. Ordinary scroll, explicit scroll-to-top and reduced-motion behavior remain native.

`qa/reader-history.spec.mjs` measures a point inside the **same passage** through ordinary links, search, native fragments, interrupted navigation and viewport changes. The delayed-poem cases hold the supplementary response while the reader types, follows focus, scrolls or chooses the target again. A separate set holds the poet route module itself while a second search opens, dismisses or navigates. Both check the viewport and focus **after** the destination paints. URL equality or finding an `h1` alone is not evidence that the destination is painted correctly.

`qa/route-recovery.spec.mjs` intercepts the actual primary payload and lazy module separately. It checks the next usable control, request and document counts, audio continuity, metadata and the original paragraph; compensating with a full document reload is not an in-place recovery. Direct prerender and HTTP status assertions belong to the Pages-like route audit, not ordinary SPA preview. Consent tests use the separate build with QA provider IDs.

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
- a raw entry budget of 665,000 bytes;
- route-specific raw budgets declared in `route-contract.json`;
- a raw per-JavaScript-file budget of 665,000 bytes;
- total raw JavaScript below 1,800,000 bytes;
- total raw CSS below 300,000 bytes.

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

## Fixed chrome geometry

`index.css` owns `--tlp-header-row-height` and border-inclusive
`--tlp-header-height`; Header and reading progress consume these tokens.
The Hall viewport reserves that header height and consumes the existing dock/audio
clearance from `audio-player.css` (dock measurement still belongs to MobileDock).
Its scene uses minimum rather than fixed height: short screens retain normal
scroll access to readable content and controls instead of clipping them.
