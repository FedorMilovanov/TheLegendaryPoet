# Hero caption reveal — PR #525

Baseline for this step: `82bb9f4b50f7ed46f6dc16e8006058234a994683` (previous step),
session branch `arena/f3e23b45-thelegendarypoet`. `main` remained
`033299b943484ed2c2f50221a03a1d7d3cdef3c5` at the pre-commit source guard.
PR stays **draft / unmerged**.

## Scope

Two earlier reports left the same two hero-caption failures open and explicitly
did **not** claim them repaired:

- `docs/POEM_PALETTE_CONTRAST_2026-10-25.md` (extended 65-case audit, stopped
  after 28 cases): «two existing hero-caption failures (dark keyboard opacity 0
  vs 1; light keyboard evaluation timeout). Neither is hidden, repaired or
  claimed to match the remote failure. This is NOT a 65-case PASS.»
- `docs/PR525_RECHECK_2026-10-25.md`: four 45-second timeouts, all in the
  **dark/light desktop** hero-caption and image-metadata/lightbox journeys; the
  mobile counterparts never failed and no numeric contrast assertion failed.

This step does not try to reconstruct the code of that time. It measures what
the current head actually does, says what an `opacity: 0` reading means, and
closes the coverage gap that made the old failure possible to miss: the
committed case only ever proved the **reduced-motion** path, where the reveal is
instant.

## What the caption does on the current head

Source, unchanged by this step:

- `src/components/home/HeroPoetWindow.tsx:198` — the label carries Tailwind
  `opacity-0` and `pointer-events-none`.
- `src/components/home/hero-poet-window.css:74` —
  `.hero-poet-window-label { transition: transform 0.46s …, opacity 0.38s ease }`.
- `src/components/home/hero-poet-window.css:142` — inside
  `@media (hover: hover) and (pointer: fine)`:
  `.group:hover .hero-poet-window-label, .group:focus-visible .hero-poet-window-label { opacity: 1 }`.
- `src/components/home/hero-poet-window.css:189` — the touch branch forces
  `opacity: 0.96 !important` (no reveal to wait for).
- `src/components/home/hero-poet-window.css:233` — under
  `prefers-reduced-motion: reduce` the label gets `transition: none !important`,
  so the reveal is instant.

So on a pointer-fine device the caption is **invisible at rest by design** and
fades in over 0.38 s on hover or `:focus-visible`. An `opacity` reading of `0`
therefore has two legitimate causes and one defect cause:

1. the card is not hovered or focused (resting state — by design);
2. the read happened inside the 0.38 s fade (mid-transition, 0 → 1);
3. the reveal never ran (a real defect).

## Measured on 82bb9f4

Probe: `qa-artifacts/hero-motion/hero-motion.json`, `hero-focus.json` (ignored).
Built app served by `vite preview` on `127.0.0.1:4173`; Chromium 149 headless;
2 themes × 2 viewports (1440×1000, 390×844 `isMobile`) × 2 motion settings.

Resting state, nothing hovered or focused:

| context | resting opacity (all 6 shells) | computed transition |
| --- | --- | --- |
| desktop, no-preference | `0, 0, 0, 0, 0, 0` | `0.46s, 0.38s` |
| desktop, reduce | `0, 0, 0, 0, 0, 0` | `0s` |
| mobile, no-preference | `0.96` ×6 | `0.46s, 0.38s` |
| mobile, reduce | `0.96` ×6 | `0s` |

Reveal after focus, real motion (desktop, per-shell samples in ms):

| context | 0 | 50 | 150 | 300 | 600 | 1000 | settled worst contrast |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dark desktop | 0 | 0 | 0.339 | 0.894 | 1 | 1 | **7.5283** |
| light desktop | 0 | 0.240 | 0.527 | 0.941 | 1 | 1 | **7.5283** |
| dark desktop, reduce | 1 | 1 | 1 | 1 | 1 | 1 | 7.5283 |
| light desktop, reduce | 1 | 1 | 1 | 1 | 1 | 1 | 7.5283 |
| mobile (both themes, both motions) | 0.96 | 0.96 | 0.96 | 0.96 | 0.96 | 0.96 | **6.8407** |

Settled contrast is the existing worst-case model from
`qa/theme-contrast.spec.mjs` (`heroCaptionContrasts`): the translucent caption
gradient composited over **pure black and pure white** portrait pixels, gradient
alpha and label opacity included. Minimum for body text is 4.5; the smallest
settled value measured anywhere is 6.8407.

Reveal paths, desktop, both themes and both motion settings:

- keyboard `Tab` (15 presses to reach the first hero link): `:focus-visible`
  matches, caption reaches `1`;
- hover only, pointer resting on the card: `1`;
- programmatic `focus()` on a clean page: `:focus-visible` matches, `1`;
- programmatic `focus()` **after a mouse move**: `:focus-visible` matches, `1`.

Hiding the caption stays cosmetic: the label has no `aria-hidden` wrapper and the
link's accessible name is «Открыть страницу поэта Александр Пушкин», so the
name and dates reach assistive technology at rest.

Page errors in all eight probe contexts: **0**.

## New tests

`qa/theme-contrast.spec.mjs`, block `hero caption reveal ${theme}, ${desktop|touch}`
(4 cases), added next to the existing reduced-motion block:

- `contextOptions: { reducedMotion: 'no-preference' }` — real motion, the default
  for most visitors; the suite asserts `prefers-reduced-motion` is genuinely off;
- at rest every caption is `opacity: 0` on desktop and `0.96` on touch, and the
  link still carries an accessible name;
- each of the six cards is revealed by **hover** and then by **keyboard focus**
  (desktop), and the reveal must settle to `1` inside a 2-second poll — not hang
  half-visible;
- the settled caption is measured with the same worst-case model and must stay
  ≥ 4.5;
- the focused card must match `:focus-visible` (no silent focus).

## Red control

`hero-poet-window.css` reveal fade `0.38s` → `30s`, rebuilt:

- `hero caption reveal dark, desktop` and `… light, desktop` **FAIL**:
  `Expected: 1, Received: 0.0470913` after the 2-second poll;
- the two touch cases PASS (the touch branch forces `0.96`, nothing animates);
- all four existing reduced-motion cases PASS (`transition: none !important`).

That is the gap the new block closes: a reveal that stalls is invisible to the
reduced-motion-only case. CSS restored, rebuilt, 8/8 green again.

## Rendered-state evidence

Probe: `qa-artifacts/hero-caption/` (ignored) — 16 screenshots, 2 themes ×
desktop 1440×1000 / mobile 390×844 `isMobile` × 2 motion settings, plus
`health.json`. Captured with fonts awaited, 2.5 s after `load`, no throttling:

| context | label opacity per card at capture | LCP | CLS |
| --- | --- | --- | --- |
| dark desktop | `0, 1, 0, 1, 0, 0` (card 2 hovered, card 4 focused) | 292–320 ms | 0.001564 |
| light desktop | `0, 1, 0, 1, 0, 0` | 364–1120 ms | 0–0.001066 |
| dark mobile | `0.96` ×6 | 240 ms | 0 |
| light mobile | `0.96` ×6 | 276–324 ms | 0 |

All eight contexts: `document.fonts.status` `loaded`, **0** broken images of 16,
**0** horizontal overflow, **0** console errors, **0** failed requests, and
`html[data-theme]` matching the seeded theme. LCP/CLS are unthrottled local
diagnostics, not field metrics. The screenshots were captured for the record;
they were not read pixel-by-pixel — the contrast numbers above are computed from
the caption's own gradient and colours, not from these files.

## Status of the two historical failures

- **Not reproducible on 82bb9f4.** All four committed hero-caption cases pass,
  and under real motion all six shells settle to `1` within 600 ms in both
  themes, with 0 page errors.
- The `opacity 0 vs 1` reading is explained by the design above: `0` is the
  resting state on pointer-fine devices, so a stale or mid-fade read is expected
  to return `0`/`0.03–0.94`. A single-shot read is only safe under reduced
  motion, which is exactly what the committed case now forces.
- The 45-second timeouts are **not** explained by measurement: their mechanism
  cannot be reconstructed from the current tree, and the CI logs of those runs
  are outside this sandbox's egress. Nothing here claims them repaired; the claim
  is *not reproducible on this head*, plus new coverage that fails loudly if a
  reveal ever stalls again.

## Pre-existing red found in the same family (hero poet labels)

Running the home/hero regression set surfaced two failures that are **not**
caused by this step — both specs are untouched on `main` (`033299b`) — but they
sit inside the audited area, so they are repaired here and reported, not hidden:

| spec | failure |
| --- | --- |
| `qa/home-labels.spec.mjs:33` | poll timeout: «all six touch label panels should finish their entrance state» (4 s) |
| `qa/home-polish.spec.mjs:160` | `expect(received).toBeGreaterThan(expected)` — effective label opacity `0` vs `> 0.85` |
| `qa/home-media-perf.spec.mjs:167` | derived portrait width `320` vs expected `480` |

Root cause: both specs branch on `testInfo.project.name === 'home-desktop'`, and
**no such project exists** in `playwright.config.mjs` (the projects are
`chromium-core`, `android-pixel7`, `iphone-safari`, `webkit-reader-desktop`).
Every run therefore took the *touch* branch and demanded all six hero labels
visible at rest — which the fine-pointer design never promises. The hero label
reveal measured above is exactly the behaviour those branches contradict.

Repair: both gates now ask the device instead of the project name —
`matchMedia('(hover: hover) and (pointer: fine)')` — the same query the hero
stylesheet keys on. Fine-pointer projects exercise the per-card hover reveal;
coarse-pointer projects keep the at-rest expectation.

Consequence worth recording: `qa/home-polish.spec.mjs:232` («desktop pointer
pipeline remains responsive over premium poet depth») and `:406` («desktop
keyboard activation opens the exact poet route») were `test.skip`-ed by the same
dead project name, so **they had not executed in any project for an unknown
number of runs**. With the capability gate they now execute under `chromium-core`
and both pass.

The third spec, `qa/home-media-perf.spec.mjs:166`, had the same dead branch:
`testInfo.project.name === 'home-desktop' ? 320 : 480`. Its expectation is now
derived from what the slots actually need — measured slot width ×
`devicePixelRatio`, picking the smallest `srcset` candidate that covers it:

| context | slot width | DPR | needed | derivative requested |
| --- | --- | --- | --- | --- |
| desktop 1280×720 | 167.8 px | 1 | 167.8 | **320w** |
| desktop 1280×720 | 167.8 px | 2 | 335.6 | **480w** |
| mobile 390×844 | 135.9 px | 3 | 407.6 | **480w** |

So the old unconditional `480` was wrong for the only project that runs this
spec, and the dead `320` branch was the value a DPR-1 desktop actually needs.

None of these three specs appear in the browser-QA spec list
(`.github/workflows/manual-browser-qa.yml`), so they are unrelated to the red
`82bb9f4` CI job.

## Verification

- `hero caption` grep (`--project=chromium-core`, no retries): **8 PASSED**
  (4 committed reduced-motion + 4 new real-motion), 23–24 s.
- Red control as above (2 failed / 6 passed), then restored: 8/8.
- `qa/theme-contrast.spec.mjs` full, chromium-core, no retries: **166 PASSED**
  (5.1 m) with the new block; the essay image-metadata/lightbox journeys — the
  other two historical desktop timeouts — are inside that run and pass.
- Home/hero regression set (`home-labels`, `home-polish`, `home-media-perf`,
  `home-ambient`, `focused-interactions`, `essay-lightbox-overlay`,
  `hover-stability` minus the external-artwork case, plus the full
  `theme-contrast`): **199 PASSED (6.6 m)**, 0 failed.
- Changed specs under `--repeat-each=3`: `home-labels` + `home-polish` +
  `home-media-perf` **48 PASSED (1.7 m)**; new hero-caption block **24 PASSED**
  (1.1 m).
- `npm run check`: PASS. `node --test scripts/tests/*.test.mjs`: **108 PASS**;
  `npx tsx --test scripts/tests/*.test.ts`: **4 PASS**. `npm run build` +
  `validate:build-output`: PASS. `git diff --check`: clean.
- No `src/` change in this step: `git diff --stat` is `qa/*.spec.mjs` + the new
  doc only.

## Limits

- One local browser engine (Chromium 149 headless, `@sparticuz/chromium`
  149.0.0). No WebKit/Safari or Firefox reveal timing, no real touch device.
- Contrast is computed from the caption's own gradient and colours composited
  against synthetic black/white backdrops; it is not a per-pixel screenshot
  measurement over the real portraits.
- No screenshot, LCP/CLS or axe evidence was collected in this step: the change
  under test is reveal timing and the settled colour of an existing, already
  certified surface.
- The historical 45-second timeouts remain unexplained (see above).
- Remote CI for `82bb9f4` is RED and its failing test name is still unknown; this
  step's head carries its own CI run.
