# Brand v20 reference-led geometry pass

## Current QA-only pair

- `v20.11-reference-volumetric-cowl` — full-size 96-grid master;
- `v20.7-reference-micro-volumetric-anchors` — independent 32-grid master.

Both remain `not-reference-approved`. Production SVGs, `BrandMark.tsx`, release manifests and the validated motion controller are unchanged.

## Honest iteration history

- **v20.3 / v20.1:** rejected for dome aura, horizontal cowl and panel-like folds.
- **v20.4 / v20.2:** rejected for oversized smooth cavity, dominant continuous rim, tidy cowl and an `A`-like micro sign.
- **v20.5 / v20.3:** rejected for an oval cavern, ribbon cowl, regular panel fan and mirrored field.
- **v20.6 / v20.4:** exact evidence still showed a stacked-chevron cowl, regular long panels and overly sparse field; dark 16–20px micro was nearly invisible.
- **v20.7 / v20.5:** exact overlay confirmed a broader cavern and improved field, but rejected a broad clean shawl, oversized cowl zone and residual symmetric panel structure.
- **v20.8 / v20.6:** cowl and micro improved, but the overlay exposed a missing composition contract: the cloak occupied 98.3% of the canvas instead of the canonical 76.9%, the apex sat too high and the bust was oversized in the square.
- **v20.9 / v20.6:** internal geometry and canonical crop passed; exact overlay then exposed a field restricted mostly to the hood and upper shoulders, overly clean cloth planes and weak shoulder volume at 64–96px.
- **v20.10 / v20.6:** exact all-green engineering pass; artistic review still rejected a wire-like field topology, clean V-shaped cowl and weak small-size shoulder volume.
- **v20.11 / v20.7:** current QA-only iteration. Canonical crop and field envelope remain locked; the long outer wires are fractured into bounded segments, the cowl is rebuilt as asymmetrically gathered cloth, and full/micro shoulder anchors are strengthened. Exact committed overlay remains the artistic authority.

## Three independent reference contracts

Passing one contract cannot hide failure of another.

### Internal structure

| Ratio | Canonical | Allowed | v20.11 full | v20.7 micro |
|---|---:|---:|---:|---:|
| hood height / visible figure | 0.357 | 0.27–0.36 | 0.358 | 0.358 |
| hood width / cloak width | 0.386 | 0.32–0.43 | 0.383 | 0.392 |
| face cavern / hood width | 0.789 | 0.68–0.86 | 0.757 | 0.742 |
| cloak / hood width | 2.592 | ≥2.30 | 2.608 | 2.548 |

### Full-size square composition

| Ratio | Canonical | Allowed | v20.11 |
|---|---:|---:|---:|
| cloak width / canvas | 0.770 | 0.72–0.82 | 0.777 |
| occupied figure height / canvas | 0.875 | 0.84–0.91 | 0.879 |
| hood apex Y / canvas | 0.121 | 0.10–0.145 | 0.121 |
| cloak shoulder Y / canvas | 0.406 | 0.37–0.43 | 0.393 |
| figure centre X / canvas | 0.498 | 0.47–0.53 | 0.502 |

### Visible electrical-field envelope

| Ratio | Canonical | Allowed | v20.11 authored expectation |
|---|---:|---:|---:|
| field width / canvas | 0.820 | 0.76–0.90 | 0.882 |
| field height / canvas | 0.770 | 0.68–0.82 | 0.733 |
| field top Y / canvas | 0.047 | 0.02–0.09 | 0.073 |
| field centre X / canvas | 0.500 | 0.46–0.54 | 0.511 |

Browser `getBBox()` verifies local path geometry. Browser `getBoundingClientRect()` separately verifies the transformed figure crop and the rendered union of rear, mid and front electrical-field groups.

## v20.11 field, cowl and shoulder correction

The full figure retains the explicit static composition transform:

`translate(10.29 4.76) scale(.79 .95)`

The correction does not alter runtime motion or production assets. Relative to v20.10 it:

- breaks the two long outside field lines into separated energetic segments while preserving the measured envelope;
- keeps at least eight rear branches, each with stroke opacity at or above `0.12` and stroke width at or above `0.2`;
- replaces the clean central V with four unequal gathered cloth masses and two discontinuous seam accents;
- strengthens the shoulder highlight mass and extends the rim anchors without changing cloak, hood or cavern boxes;
- stays inside the bounded 36–48 full-size path range.

## Independent micro master

The v20.7 micro master intentionally does not inherit the full-size crop or field-envelope requirements. It keeps the larger occupied mass and six separated hood/shoulder anchors, replaces the crossed cowl with three gathered layers, and strengthens shoulder highlights for 16–20px recognition. The highlights remain discontinuous and cannot form a cyan `A`.

## Anti-hack gates

The validators reject raster content, runtime animation, aura ellipses, SVG filters, Gaussian blur, missing semantic layers, production imports, path-count inflation, transparent field-bound fillers and removal of canonical composition or field targets. Numeric, composition, visible-field and CI success remain necessary but never sufficient for artistic approval.

## Browser acceptance architecture

Manual Browser QA uses four independent exact-head hosted jobs:

1. core Chromium/Android plus fresh-process base Safari contours;
2. home-reveal, route and search Safari contours;
3. standard premium homepage and pointer-performance contours;
4. critical iPhone first-viewport and reduced-motion contours.

Every job has its own exact checkout, build and preview. No job depends on another. Retries remain diagnostic only because `failOnFlakyTests` is enabled; visual thresholds are unchanged.

## Promotion blockers

Production replacement is prohibited until one exact v20.11/v20.7 head provides internal geometry evidence, rendered composition evidence, visible-field evidence, canonical overlay, full optical matrix, micro dark/light matrix, an explicit human `reference-approved` verdict, post-approval motion integration and every required workflow green without flaky acceptance.
