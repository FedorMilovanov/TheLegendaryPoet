# Community status and service copy contrast — PR #525

Baseline for this step: `0a37b7a0ed8ea3766320124c7382d10f6c89b3ac`, session branch
`arena/f3e23b45-thelegendarypoet`. `main` remained
`033299b943484ed2c2f50221a03a1d7d3cdef3c5` at the pre-commit source guard.
PR stays **draft / unmerged**.

## Root cause: an incomplete light-theme remap table

`src/index.css` carries the shared light-theme remap table for utility ink:
`text-cyan-100/200/300/400` and `text-luxury-gray` are remapped to dark ink on
light surfaces, with exclusions for deliberate dark islands. **No amber or
emerald utility was ever remapped.** Every status string that used them stayed
near-white on a light page surface, so the community status line, the failure
banner and the ratings sync badge became effectively invisible in light mode
while looking fine in dark mode.

Measured before, light theme (`html.theme-light`, real production preview):

| Surface | Light before | Dark before |
| --- | ---: | ---: |
| Local-mode sync line (`text-amber-100/52`) | **1.0414** | 5.1862 |
| Comment list failure placeholder (`text-amber-100/58`) | **1.0420** | 6.2801 |
| Retry button (`text-amber-100`) | **1.0390** | 17.3111 |
| Sync error line (`text-amber-100/58`) | **1.0420** | 6.2801 |
| Synced line (`text-emerald-200/58`) | **1.1382** | 5.5618 |
| Ratings page sync badge (amber / emerald) | **1.0252** | 8.4657 |

A second, unrelated dark-mode instance was found in the same wave: four service
strings in `CommentList` / `CommunityPanel` used hand-set translucent cyan
instead of the shared roles — result counter **2.3706**, sort/filter note
**2.5496**, inactive kind filter **3.0505**, rating summary **3.4373** (dark
only; light already passed).

## Repair, at the owning layer

1. **Shared remap table (systemic).** `src/index.css` now remaps
   `text-amber-*` and `text-emerald-*` in light mode using the same exclusion
   pattern as the cyan rules (`:not([class*="theme-"])` plus the dark-island and
   Hall production exclusions). This repairs every current and future status
   string on light surfaces — community panel, ratings page, music alerts, essay
   badges, error boundary — not only the surfaces measured here.
2. **Dark-surface opt-out.** `ActionToast` owns a dark `bg-amber-950/85`
   surface, so a blanket remap would have inverted its ink. It carries the
   `theme-community-toast` marker and is therefore excluded by the existing
   `:not([class*="theme-"])` guard. Verified on a real light page: the computed
   colour of that element stays `oklch(0.962 0.059 95.617)` (amber-100) in both
   themes.
3. **Shared roles for the four service strings.** The dark-mode failures move to
   `theme-community-meta`, the existing theme-aware community role, instead of
   new colour literals.

No wording, ARIA, data, store, API, dependency, workflow, budget or retry change.
No migration. Rollback is one commit reverting the CSS block, four class
substitutions, the toast marker, the new tests and this document; it is
independent of the empty-copy, Hall certification and timeout-floor steps.

## Verification

- **Red controls retained.** New 12-case matrix (dark/light × desktop1440/mobile390 × pagination/loading/failure) failed **2 cases** after the first repair exposed the light-theme status defect, and the extended matrix failed **4 cases** (light desktop/mobile pagination and failure) once the tests were corrected — see the process note below. Final focused suite: **34 PASS, 3.9m, retries 0** (12 service + 12 empty-copy + 6 populated metadata + 4 local durability).
- Regression specs `rating-urlstate`, `poets-status` and `audio-completion` (surfaces that use the same status palette): **5 PASS, 49.1s**.
- Final `npm run check`, contracts, build and build-output budget PASS; **108 Node / 4 TypeScript tests PASS**.
- Independent probes in all four theme/viewport contexts: fonts loaded, **0** page errors, **0** console errors (except the intentional 500s in the failure mode), **0** horizontal overflow, **0** broken images.

Final measured contrast:

| Surface | Dark | Light |
| --- | ---: | ---: |
| Result counter / sort note / inactive filter / rating summary | 9.31 / 9.35 / 9.35 / 9.31 | 5.63 / 5.75 / 5.75 / 5.63 |
| Load-more button (unchanged) | 4.5353 | 6.8150 |
| Loading: sync line, rating summary, list placeholder | 6.26 / 9.31 / 6.26 | 6.82 / 5.63 / 6.82 |
| Failure: list placeholder, rating summary, retry | 6.28 / 9.31 / 17.31 | 6.99 / 5.63 / 6.78 |
| Local-mode sync line | 5.1862 | 6.9865 |
| Synced (emerald) line | 5.5618 | 6.2893 |
| Ratings page sync badge | 8.4657 | 6.7164 |

## Process note, disclosed

The first version of the loading/failure cases set only the OS colour scheme and
not `tlp-theme-mode`, so the "light" runs actually rendered the default dark
theme and silently passed. A separate probe caught the discrepancy. The tests now
assert `html[data-theme]` matches the requested theme and seed
`tlp-theme-mode` explicitly; the light failures above are from the corrected
runs, not from the naive ones.

## Limits

Only the community panel, the ratings badge and the sync line were measured
before/after; the essay badge, music alerts, `RatingForm` emerald note and
`ErrorBoundary` amber icon are covered by the shared rule by construction but
were **not individually measured**. Contrast is computed from composited colours
and ancestor backgrounds, not exhaustive gradient pixels; this is not a full
WCAG audit, not physical-device evidence, and not a claim about every status
state (for example the offline-queue copy). `ActionToast` was verified through
its computed colour on a real page, not through a rendered warning toast.
