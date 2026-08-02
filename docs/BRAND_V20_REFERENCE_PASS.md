# Brand v20 reference-led geometry pass

## Current QA-only pair

- `v20.8-reference-compressed-cowl` — full-size 96-grid master;
- `v20.6-reference-micro-shoulder-anchors` — independent 32-grid master.

Both remain `not-reference-approved`. Production SVGs, `BrandMark.tsx`, release manifests and the validated motion controller are unchanged.

## Honest iteration history

- **v20.3 / v20.1:** rejected for dome aura, horizontal cowl and panel-like folds.
- **v20.4 / v20.2:** rejected for oversized smooth cavity, dominant continuous rim, tidy cowl and an `A`-like micro sign.
- **v20.5 / v20.3:** rejected for an oval cavern, ribbon cowl, regular panel fan and mirrored field.
- **v20.6 / v20.4:** meaningful monolithic improvement, but exact evidence still showed a stacked-chevron cowl, regular long panels and overly sparse field; dark 16–20px micro was nearly invisible.
- **v20.7 / v20.5:** exact overlay confirmed the broader cavern and improved field, but rejected a broad clean shawl, an oversized cowl zone and residual symmetric panel structure; micro readability improved but stayed weak at 16–20px.
- **v20.8 / v20.6:** current QA-only iteration. Cowl height is reduced, the clean X and ribbon ends are removed, long fold planes are darkened into one cloak mass, the field is widened without blur, and micro uses six separated optical anchors.

## Exact geometry submitted for browser verification

| Ratio | Canonical | Allowed | v20.8 full | v20.6 micro |
|---|---:|---:|---:|---:|
| hood height / visible figure | 0.357 | 0.27–0.36 | 0.358 | 0.358 |
| hood width / cloak width | 0.386 | 0.32–0.43 | 0.383 | 0.392 |
| face cavern / hood width | 0.789 | 0.68–0.86 | 0.757 | 0.742 |
| cloak / hood width | 2.592 | ≥2.30 | 2.608 | 2.548 |

Browser `getBBox()` remains the acceptance source. Stable ratios do not imply that the internal cloth topology is approved.

## Structural corrections in v20.8

- compressed the cowl into the narrow zone immediately below the hood;
- removed clean crossed-X and pointed ribbon-end readings;
- retained unequal overlap with a small off-centre dark knot;
- reduced long fold brightness so the cloak reads as one black triangular body;
- added two wide low-opacity electrical branches without ellipse, blur or filters;
- added one interrupted cowl-light compound path instead of outlining the collar;
- held full authored complexity at the validator ceiling of 48 semantic paths.

## Independent micro correction

The v20.6 micro master keeps the v20.5 geometry but strengthens only optical delivery: a slightly higher top-cloak value, two stronger hood segments, two shoulder segments and two short lower shoulder anchors. All six highlights remain separated, so they cannot form a continuous cyan `A`.

## Anti-hack gates

The validator rejects raster content, runtime animation, aura ellipses, SVG filters, Gaussian blur, missing semantic layers, production imports and path-count inflation. Full complexity must remain between 36 and 48 paths; micro between 18 and 24.

## Browser acceptance architecture

Manual Browser QA uses two independent exact-head hosted jobs:

1. core Chromium/Android plus 23 fresh-process Safari contours;
2. six premium homepage/pointer contours on a separate runner with its own checkout, build and preview.

Both jobs remain mandatory. Retries, `failOnFlakyTests` and visual thresholds are unchanged.

## Promotion blockers

Production replacement is prohibited until one exact head provides matching browser geometry, canonical overlay, full optical matrix, micro dark/light matrix, an explicit human `reference-approved` verdict, post-approval motion integration and every required workflow green without flaky acceptance.
