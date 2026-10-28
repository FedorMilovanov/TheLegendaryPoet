# Status palette on light surfaces and dark islands — PR #525

Baseline for this step: `e331c4bbe9c01d791b88a7870cfde5609a77a151` (previous step),
session branch `arena/f3e23b45-thelegendarypoet`. `main` remained
`033299b943484ed2c2f50221a03a1d7d3cdef3c5` at the pre-commit source guard.
PR stays **draft / unmerged**.

## Scope

The previous step extended the shared light-theme remap table to `text-amber-*`
and `text-emerald-*` and recorded four coverage limits: the essay badge, the
music alerts, the `RatingForm` emerald note and the `ErrorBoundary` amber icon
were covered by the shared rule by construction but never measured. This step
measures all of them, and turns the same question around: the remap is global,
so any element that keeps its own **dark** background in light mode could now be
painted with dark ink on dark. Both directions were checked.

## Method

- **Before/after on one build.** The four new rules are deleted from the CSSOM
  at runtime (`removeStatusRemap`, 4 rules) and the same nodes are measured
  immediately afterwards, so "before" is the real pre-fix cascade on the same
  bundle — not a second checkout.
- **Real error states.** Player failure alerts and the release-card error pill
  were triggered by aborting media requests (`/audio/*.mp3`), which is the real
  network-failure path, not an injected node.
- **Real saved-rating state.** The `RatingForm` "vote counted" note requires an
  existing own rating; it was produced by driving the rating form through the UI
  once, then reusing the persisted store.
- **One component cannot be rendered on demand.** `AudioChromeBoundary` only
  renders after a runtime error inside the player panel, which a production
  build cannot be made to throw. It is reproduced from the class string **read
  out of the component source**, so the measurement follows the source and the
  test fails if the dark-island marker is removed there.
- **Sweep.** 12 routes × desktop1440/mobile390 in light mode, scanning every
  element with `text-amber-*` / `text-emerald-*`: **8 status nodes found, none
  below 3.0, none on a dark background.**

## Measured, before → after

| Surface | Light before | Light after | Dark after |
| --- | ---: | ---: | ---: |
| `RatingForm` "Ваш голос уже учтён" note (`text-emerald-100/60`) | **1.0386** | **6.1207** | 6.5232 |
| Its confirmation icon (`text-emerald-300`) | **1.4235** | **8.1829** | 12.7940 |
| Filled-dimensions counter (`text-emerald-200/70`) | **1.1617** | **6.2893** | 7.8912 |
| Community local-mode line (`text-amber-100/52`) | **1.0414** | 6.9865 | 5.1862 |
| `ErrorBoundary` amber tile glyph (`text-amber-200`) | **1.1769** | 6.8730 | 15.2110 |
| Essay myth badge inside a dark island (`text-amber-100`) | 15.6539 | 15.6539 | 15.6539 |
| Track player failure alert (`text-amber-100/72`) | 8.9692 | 8.9692 | 8.9692 |
| Release-card error pill icon (`text-amber-300`) | 14.5133 | 14.5133 | 14.5133 |

The last three rows are unchanged by design: they already sit inside
`theme-dark-island`, which the remap excludes. The essay badge is currently
unreachable in production data (no published essay uses the `partly-true`
verdict), so it was measured through a dark island built from the real class
strings; it confirms the exclusion rather than a live page.

## Regression found and repaired

`AudioChromeBoundary` paints its own dark panel (`bg-[#11100d]/96`) but sourced
its ink from generic utilities: a white heading and an amber warning glyph. The
blanket remap reached both, because the panel carried no dark-island marker:

| Element | Dark | Light before | Light after |
| --- | ---: | ---: | ---: |
| Panel heading (`text-white`) | 19.0884 | **1.1897** | **17.5131** |
| Warning glyph (`text-amber-300`) | 13.1922 | **1.7964** | **12.1035** |

The heading failure predates this step (it comes from the long-standing
`text-white` remap); the glyph failure was introduced by the amber row added in
the previous step. One change repairs both: the panel is now marked
`theme-dark-island`, the same mechanism the persistent audio mini-player
(`.global-audio-mini`) already uses. The dark theme is untouched — the rules are
scoped to `html.theme-light`, and the measured dark values are identical with and
without the marker.

## Verification

- **Red control retained.** After the new 12-case block was written
  (dark/light × desktop/mobile × rating note / player failure alert / audio
  chrome boundary), the run was **2 failed / 10 passed**: `audio chrome boundary
  keeps its own dark island ink` failed in light desktop (heading 1.1897, glyph
  1.7964) and light mobile, i.e. against 4.5 and 3.0 minima. Nothing was relaxed
  to make it pass.
- After the repair the same block is **12 PASS / 12, 10.7s, retries 0**.
- Focused suite incl. the earlier steps' cases
  (`status palette|community service copy|community empty copy|comment metadata|local community durability`):
  **42 PASS, 48.4s, retries 0**.
- Regression specs `rating-urlstate`, `poets-status`, `audio-completion`,
  `audio-cross-tab`, `floating-chrome` (the surfaces that share the audio chrome
  and the status palette): **11 PASS, 24.6s**.
- Static gates: project contracts OK (11 runtime / 4 editorial / 7 historical /
  0 lanes), `npm run check`, `npm run build`, `npm run validate:build-output`
  (1692.9 KiB JS, 258.6 KiB CSS, within budget), `git diff --check` clean,
  **108 Node / 4 TypeScript tests PASS**.
- Health on the measured pages, both themes: fonts loaded, **0** page errors,
  **0** horizontal overflow, **0** broken images; the only console error is the
  intentional aborted audio request.
- Screenshots (ignored artifacts): `qa-artifacts/status-palette/` —
  `player-error-alert-{dark,light}.png`,
  `audio-chrome-boundary-{dark,light}.png`, `track-page-{dark,light}.png`.

## Limits

- `AudioChromeBoundary` was never rendered as a live component: no production
  path was found to make the player panel throw. It is verified through a node
  built from the component's own class string, in both themes, plus a source
  assertion in the test that the marker is present. That is weaker than a real
  error journey.
- The `TrackReleaseCard` error pill and the player failure alerts were measured
  through aborted media requests; other failure copy (offline queue, cooldown,
  rejected upload) was not measured.
- Ratios are computed from composited colours and ancestor backgrounds, not
  per-pixel gradient sampling. Icons are held to 3.0 (WCAG 1.4.11 non-text),
  text to 4.5. This is not a full WCAG audit and not physical-device evidence.
- The route sweep covers light mode only, because the remap is scoped to
  `html.theme-light`; dark values are unchanged by construction and were
  re-measured on the touched surfaces.
- No wording, ARIA, data, store, API, dependency, workflow, budget or retry
  change. Rollback is one commit reverting the marker class, the new test block
  and this document; it is independent of the empty-copy, Hall certification,
  timeout-floor and community status steps.
