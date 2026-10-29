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

## A wrong call, corrected in the same step

While running the home/hero regression set I reported three failures
(`home-labels.spec.mjs:33`, `home-polish.spec.mjs:160`,
`home-media-perf.spec.mjs:167`) as pre-existing red and "repaired" them by
replacing the `testInfo.project.name === 'home-desktop'` branches with a
`matchMedia('(hover: hover) and (pointer: fine)')` capability check. **That
diagnosis was wrong**, and the edits are reverted in the same step:

- The `home-desktop` project **does** exist — in `playwright.home-polish.config.mjs`,
  the dedicated config that `scripts/run-home-polish-process-isolated.mjs` uses
  for exactly these four specs (`home-desktop` 1440×1000 Chromium,
  `home-pixel7`, `home-iphone-safari`). It is absent only from the default
  `playwright.config.mjs`, which is what I had run them with. Under the default
  config the specs take their touch branch on a fine-pointer project and fail —
  an artefact of using the wrong config, not a defect in the specs.
- The `home-media-perf` edit additionally broke a real gate: `scripts/validate-home-media-perf.mjs`
  forbids `getBoundingClientRect` in that spec («must measure layout boxes, not
  compositor-transformed client rects»). The contract validator runs first in the
  premium-home runner, which is why remote CI for `51f391b` came back with
  **`premium-home-qa` FAILURE** — caused by me, not by the step's real change.

Verified after reverting (unmodified specs, dedicated config, local Chromium 149):

- `--config=playwright.home-polish.config.mjs --project=home-desktop`:
  **17 PASSED (39.4 s)** — the four home specs, including
  `home-polish:229` (desktop pointer pipeline) and `:402` (desktop keyboard
  activation), which do execute there.
- `--project=home-pixel7`: **15 PASSED / 2 deliberate skips (34.1 s)**.
- `node scripts/validate-home-media-perf.mjs`: PASS (`critical320=18987B`,
  `critical480=37962B`).

`home-iphone-safari` (WebKit) was not run locally — no WebKit binary in this
sandbox — so the iPhone lane is left to remote CI.
## Verification

- `hero caption` grep (`--project=chromium-core`, no retries): **8 PASSED**
  (4 committed reduced-motion + 4 new real-motion), 23–24 s.
- Red control as above (2 failed / 6 passed), then restored: 8/8.
- New block under `--repeat-each=3`: **24 PASSED (1.1 m)**.
- `qa/theme-contrast.spec.mjs` full, chromium-core, no retries: **166 PASSED**
  (5.1 m) with the new block; the essay image-metadata/lightbox journeys — the
  other two historical desktop timeouts — are inside that run and pass.
- Neighbouring specs, default config, chromium-core, no retries
  (`home-ambient`, `focused-interactions`, `essay-lightbox-overlay`,
  `hover-stability` minus the external-artwork case): **17 PASSED (49.2 s)**.
- The four home specs belong to `playwright.home-polish.config.mjs`, verified
  there after the revert (see the correction above): **17 PASSED** on
  `home-desktop`, **15 PASSED / 2 deliberate skips** on `home-pixel7`, and
  `node scripts/validate-home-media-perf.mjs` PASS.
- `npm run check`: PASS. `node --test scripts/tests/*.test.mjs`: **108 PASS**;
  `npx tsx --test scripts/tests/*.test.ts`: **4 PASS**. `npm run build` +
  `validate:build-output`: PASS. `git diff --check`: clean.
- **No `src/` change in this step.** After the revert the diff is
  `qa/theme-contrast.spec.mjs` (+59, the new block) and this report only.

## Limits

- One local browser engine (Chromium 149 headless, `@sparticuz/chromium`
  149.0.0). No WebKit/Safari or Firefox reveal timing, no real touch device; the
  `home-iphone-safari` lane was not run at all locally.
- Contrast is computed from the caption's own gradient and colours composited
  against synthetic black/white backdrops; it is not a per-pixel screenshot
  measurement over the real portraits. The 16 screenshots were captured as
  evidence and checked programmatically (fonts, broken images, overflow, console,
  LCP/CLS) — they were not read pixel by pixel.
- No axe run in this step: the surface under test is the reveal timing and the
  settled colour of an already certified caption.
- The historical 45-second timeouts remain unexplained (see above).
- Remote CI for `82bb9f4` is RED with the failing test name still unknown, and
  `51f391b` came back with `premium-home-qa` FAILURE caused by the reverted edit
  above — the head that carries only the step's real change is the one after it.
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
