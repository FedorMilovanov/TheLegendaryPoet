# Brand v20 reference-led geometry pass

## Current QA-only pair

- `v20.9-reference-canonical-crop` — full-size 96-grid master;
- `v20.6-reference-micro-shoulder-anchors` — independent 32-grid master.

Both remain `not-reference-approved`. Production SVGs, `BrandMark.tsx`, release manifests and the validated motion controller are unchanged.

## Honest iteration history

- **v20.3 / v20.1:** rejected for dome aura, horizontal cowl and panel-like folds.
- **v20.4 / v20.2:** rejected for oversized smooth cavity, dominant continuous rim, tidy cowl and an `A`-like micro sign.
- **v20.5 / v20.3:** rejected for an oval cavern, ribbon cowl, regular panel fan and mirrored field.
- **v20.6 / v20.4:** exact evidence still showed a stacked-chevron cowl, regular long panels and overly sparse field; dark 16–20px micro was nearly invisible.
- **v20.7 / v20.5:** exact overlay confirmed a broader cavern and improved field, but rejected a broad clean shawl, oversized cowl zone and residual symmetric panel structure.
- **v20.8 / v20.6:** cowl and micro improved, but the overlay exposed a missing composition contract: the cloak occupied 98.3% of the canvas instead of the canonical 76.9%, the apex sat too high and the bust was oversized in the square.
- **v20.9 / v20.6:** current QA-only iteration. Internal v20.8 geometry is retained while an explicit static crop transform aligns occupied width, height, apex, shoulder line and centre with the canonical square.

## Two independent geometry contracts

Internal path ratios and square composition are now measured separately. Passing one cannot hide failure of the other.

### Internal structure

| Ratio | Canonical | Allowed | v20.9 full | v20.6 micro |
|---|---:|---:|---:|---:|
| hood height / visible figure | 0.357 | 0.27–0.36 | 0.358 | 0.358 |
| hood width / cloak width | 0.386 | 0.32–0.43 | 0.383 | 0.392 |
| face cavern / hood width | 0.789 | 0.68–0.86 | 0.757 | 0.742 |
| cloak / hood width | 2.592 | ≥2.30 | 2.608 | 2.548 |

### Full-size square composition

| Ratio | Canonical | Allowed | v20.9 |
|---|---:|---:|---:|
| cloak width / canvas | 0.770 | 0.72–0.82 | 0.777 |
| occupied figure height / canvas | 0.875 | 0.84–0.91 | 0.879 |
| hood apex Y / canvas | 0.121 | 0.10–0.145 | 0.121 |
| cloak shoulder Y / canvas | 0.406 | 0.37–0.43 | 0.393 |
| figure centre X / canvas | 0.498 | 0.47–0.53 | 0.502 |

Browser `getBBox()` verifies local path geometry. Browser `getBoundingClientRect()` verifies rendered crop and placement after the committed static transform.

## v20.9 composition correction

The full figure and front field use one explicit static transform:

`translate(10.29 4.76) scale(.79 .95)`

This does not deform hood/face/cloak ratios or introduce runtime behaviour. It narrows and lowers the dark figure while preserving the broad electrical field behind it, matching the canonical square occupancy much more closely.

The crop is now part of the canonical reference contract. A future candidate fails before visual review if it becomes a huge bust, sits too high, shifts off-centre or occupies the wrong fraction of the canvas.

## Independent micro correction

The micro master intentionally does not inherit the full-size crop. Its optical task is different: at 16–20px it needs a larger occupied mass and six separated hood/shoulder anchors. The highlights remain discontinuous and cannot form a cyan `A`.

## Anti-hack gates

The validators reject raster content, runtime animation, aura ellipses, SVG filters, Gaussian blur, missing semantic layers, production imports, path-count inflation and removal of the canonical composition targets. Full complexity remains 36–48 paths; micro remains 18–24.

## Browser acceptance architecture

Manual Browser QA uses two independent exact-head hosted jobs:

1. core Chromium/Android plus 23 fresh-process Safari contours;
2. six premium homepage/pointer contours on a separate runner with its own checkout, build and preview.

Both jobs remain mandatory. Retries, `failOnFlakyTests` and visual thresholds are unchanged.

## Promotion blockers

Production replacement is prohibited until one exact head provides internal geometry evidence, rendered composition evidence, canonical overlay, full optical matrix, micro dark/light matrix, an explicit human `reference-approved` verdict, post-approval motion integration and every required workflow green without flaky acceptance.
