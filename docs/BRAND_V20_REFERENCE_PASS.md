# Brand v20 reference-led geometry pass

## Current QA-only pair

- `v20.7-reference-draped-monolith` — full-size 96-grid master;
- `v20.5-reference-micro-optical` — independent 32-grid master.

Both remain `not-reference-approved`. Production SVGs, `BrandMark.tsx`, release manifests and the validated motion controller are unchanged.

## Honest iteration history

- **v20.3 / v20.1:** rejected for dome aura, horizontal cowl and panel-like folds.
- **v20.4 / v20.2:** rejected for oversized smooth cavity, dominant continuous rim, tidy cowl and an `A`-like micro sign.
- **v20.5 / v20.3:** rejected for an oval cavern, ribbon cowl, regular panel fan and mirrored field.
- **v20.6 / v20.4:** meaningful monolithic improvement, but exact evidence still showed a stacked-chevron cowl, regular long panels and overly sparse field; the dark 16–20px micro render was nearly invisible.
- **v20.7 / v20.5:** current QA-only iteration. The face cavern is wider, cowl masses cross and overlap unequally, field branches fork irregularly, and micro uses four separated optical anchors rather than a continuous outline.

## Exact geometry submitted for browser verification

| Ratio | Canonical | Allowed | v20.7 full | v20.5 micro |
|---|---:|---:|---:|---:|
| hood height / visible figure | 0.357 | 0.27–0.36 | 0.358 | 0.358 |
| hood width / cloak width | 0.386 | 0.32–0.43 | 0.383 | 0.392 |
| face cavern / hood width | 0.789 | 0.68–0.86 | 0.757 | 0.742 |
| cloak / hood width | 2.592 | ≥2.30 | 2.608 | 2.548 |

Browser `getBBox()` remains the acceptance source; these authored measurements must be reproduced by the exact-head artifact.

## Structural corrections in v20.7

- broadened the black negative space toward the canonical face/hood ratio;
- replaced stacked horizontal chevrons with crossing drapery masses whose centres and edges are unequal;
- kept the cloak one continuous dark triangle while reducing the visible regular fan;
- added forks and interruptions to the electrical field without filters or blur;
- extended only short shoulder rim segments instead of outlining the whole body;
- retained rear, mid and front semantic field groups for later normalized motion.

## Independent micro correction

The v20.5 micro master does not scale the full SVG. It widens the cavern, uses crossing cowl masses and adds four short high-value edge anchors: two at the hood and two at the shoulders. The segments are intentionally separated so dark-background readability can improve without recreating a cyan `A`.

## Anti-hack gates

The validator rejects raster content, runtime animation, aura ellipses, SVG filters, Gaussian blur, missing semantic layers, production imports and path-count inflation. Full authored complexity must remain between 36 and 48 paths; micro between 18 and 24.

## Browser acceptance architecture

Manual Browser QA uses two independent exact-head hosted jobs:

1. core Chromium/Android plus 23 fresh-process Safari contours;
2. six premium homepage/pointer contours on a separate runner with its own checkout, build and preview.

Both jobs remain mandatory. Retries, `failOnFlakyTests` and visual thresholds are unchanged.

## Promotion blockers

Production replacement is prohibited until one exact head provides:

1. matching browser geometry metrics;
2. canonical / candidate / overlay evidence;
3. 64, 96, 128 and 256px full-size evidence;
4. 16, 20, 24, 32 and 48px micro evidence on dark and light backgrounds;
5. an explicit human `reference-approved` verdict;
6. motion attachment only after static approval;
7. every required workflow green with zero flaky acceptance.
