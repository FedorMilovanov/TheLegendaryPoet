# W88 — асинхронная геометрия якорей поэтического Reader

**Дата:** 2026-11-21. **Base:** W87 PR #610, `b69aa3f2b5493cac27bca0d45819a5c88e514fca`.
**Status:** isolated root repair; technical review pending, upstream scientific/rights/Hall HOLD unchanged.

## Reproduction evidence

A 568-case independent Chromium/Android suite on the unmodified W87 production preview reproduced `qa/deep-routes.spec.mjs` Pixel 7 command-search navigation to `/poets/sergei-yesenin#poem-yesenin-3`: after waiting 15 s the target stayed at **160.1875 px**, outside the acceptance interval **80–112 px**.

In a separate instrumented Pixel 7 run, before the repair:

| Elapsed | Target top | ScrollY | Body height | Corpus |
| ---: | ---: | ---: | ---: | ---: |
| 200 ms | 96.234 px | 17,201 px | 21,248 px | 3 poems |
| 300 ms | 1,840.969 px | 27,562 px | 64,259 px | 10 poems |
| 500 ms | 95.969 px | 29,307 px | 64,259 px | 10 poems |
| 750 ms | 1,383.781 px | 29,307 px | 65,547 px | 10 poems |
| 8,000 ms | 1,383.781 px | 29,307 px | 65,547 px | 10 poems |

Actual programmatic corrections happened once before full JSON and once during `tlp-poet-corpus-hydrated`. Further lazy content increased body height by **1,287.8125 px** after the last correction, without reader interaction. The old code listened to the one-time hydration event but not later flow changes. Root was not the text of Yesenin or Bryusov, and no error in the native browser anchor itself.

## One owning layer

`src/components/SmoothScroll.tsx` remains the sole route/hash restoration authority. A passive `ResizeObserver(document.body)` in hash mode schedules at most one RAF per observed frame, checking the target's actual offset; `Math.abs(delta) < 1` avoids unnecessary writes. The observer is bounded by the existing 15-second hash-observer budget and disconnected on cleanup or genuine reader wheel/touch/pointer/navigation-key input. No global interpolation loop, no per-poet timer, no scroll blocking, no bypass of accessiblity focus management.

The existing `tlp-poet-corpus-hydrated` event now uses the same correction function; duplicate scroll logic was eliminated. Ordinary wheel/touch scrolling remains native. When the user starts scrolling, automatic correction stops rather than stealing scroll ownership.

Affected surfaces: all author cards linked by `#poem-*` and other route hash targets with delayed layout (poetry, essays); both desktop and mobile browser engines. Public route, canonical text/JSON, Hall, owner rights, and shared build budgets remain unchanged.

## Regression and boundaries

- New Playwright `qa/poet-hash-layout-w88.spec.mjs` simulates a second **480px** layout insertion after full JSON hydration and subsequent removal; requires target to return to **80–112px** each time, checks URL hash and horizontal overflow. Registered for Chromium, Android Pixel 7 and iPhone Safari, including the isolated WebKit runner.
- Existing `qa/deep-routes.spec.mjs` command search/poem anchor test must remain unweakened.
- Mandatory static gates: `validate:app-shell`, `validate:interaction-runtime` (including scroll-runtime), `validate:discovery-artifacts`, `typecheck`, `build`, `validate:build-output`.
- Production W88 budget measured locally: **1692.1 KiB JS / 1757.8 KiB**, CSS **273.2 KiB / 293.0 KiB**. No budget increase.
- Browser targeted check: **5/5 PASS** across the three engines on production preview `127.0.0.1:4189`. Broader W83–W88 regression is tracked separately.

**Rollback:** revert this isolated `SmoothScroll.tsx` observer change and W88 test wiring; leave preceding W82–W87 corpus and editorial evidence untouched. Never merge/release based solely on these scroll checks: all upstream scientific, rights, approved Hall GLB, and full CI owner gates remain in force.
