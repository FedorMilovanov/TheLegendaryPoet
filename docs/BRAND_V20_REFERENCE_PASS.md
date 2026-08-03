# Brand v20 reference-led geometry pass

## Current QA-only pair

- `v20.14-reference-electric-rim-volume` — full-size 96-grid master;
- `v20.8-reference-micro-spectral-anchors` — independent 32-grid master.

Both remain `not-reference-approved`. Production SVGs, `BrandMark.tsx`, release manifests and the validated motion controller are unchanged.

## Honest iteration history

- **v20.3 / v20.1:** rejected for dome aura, horizontal cowl and panel-like folds.
- **v20.4 / v20.2:** rejected for oversized smooth cavity, dominant continuous rim, tidy cowl and an `A`-like micro sign.
- **v20.5 / v20.3:** rejected for an oval cavern, ribbon cowl, regular panel fan and mirrored field.
- **v20.6 / v20.4:** rejected for a stacked-chevron cowl, regular long panels, sparse field and nearly invisible dark 16–20px micro.
- **v20.7 / v20.5:** rejected for a broad clean shawl, oversized cowl zone and residual symmetric panel structure.
- **v20.8 / v20.6:** exposed the missing square-composition contract: the cloak occupied 98.3% of the canvas instead of the canonical 76.9%.
- **v20.9 / v20.6:** corrected the crop; rejected for an upper-only field, clean cloth planes and weak shoulder volume.
- **v20.10 / v20.6:** exact all-green engineering pass; rejected for wire-like field topology, clean V-shaped cowl and weak small-size shoulder volume.
- **v20.11 / v20.7:** exact all-green engineering pass; human review rejected detached root-like lines, a Shredder-like figure, light-gray values and incorrect clothing folds.
- **v20.12 / v20.8:** exact all-green engineering pass; artifact inspection rejected the remaining broad smooth contour sheath and residual panel-like cloak construction.
- **v20.13 / v20.8:** exact all-green engineering pass; artifact inspection found that the attached field still read as a broad teal hood outline and that the strongest light stopped too high on the silhouette.
- **v20.14 / v20.8:** current QA-only iteration. Rear aura masses are reduced to faint irregular volume. Segmented electric-rim paths remain attached from the hood through the shoulders and down both cloak edges. The figure remains almost black and uses low-contrast asymmetric drapery.

## Reference contracts

### Internal structure

| Ratio | Canonical | Allowed | v20.14 full | v20.8 micro |
|---|---:|---:|---:|---:|
| hood height / visible figure | 0.357 | 0.27–0.36 | 0.358 | 0.358 |
| hood width / cloak width | 0.386 | 0.32–0.43 | 0.383 | 0.392 |
| face cavern / hood width | 0.789 | 0.68–0.86 | 0.757 | 0.742 |
| cloak / hood width | 2.592 | ≥2.30 | 2.608 | 2.548 |

### Full-size square composition

| Ratio | Canonical | Allowed | v20.14 |
|---|---:|---:|---:|
| cloak width / canvas | 0.770 | 0.72–0.82 | 0.777 |
| occupied figure height / canvas | 0.875 | 0.84–0.91 | 0.879 |
| hood apex Y / canvas | 0.121 | 0.10–0.145 | 0.121 |
| cloak shoulder Y / canvas | 0.406 | 0.37–0.43 | 0.393 |
| figure centre X / canvas | 0.498 | 0.47–0.53 | 0.502 |

### Visible electrical-field envelope

| Ratio | Canonical | Allowed | v20.14 authored expectation |
|---|---:|---:|---:|
| field width / canvas | 0.820 | 0.76–0.90 | 0.858 |
| field height / canvas | 0.770 | 0.68–0.82 | 0.746 |
| field top Y / canvas | 0.047 | 0.02–0.09 | 0.073 |
| field centre X / canvas | 0.500 | 0.46–0.54 | 0.496 |

Browser `getBBox()` verifies local path geometry. Browser `getBoundingClientRect()` separately verifies the transformed figure crop and the rendered union of rear, mid and front field groups.

## v20.14 electric-rim-volume correction

The full figure retains the static composition transform `translate(10.29 4.76) scale(.79 .95)`.

Relative to v20.13 it:

- reduces the broad teal rear volume so it no longer carries the primary light;
- moves the strongest electric light onto segmented paths touching the hood, shoulders and full cloak edge;
- extends the luminous silhouette down both sides instead of stopping around the upper shoulders;
- replaces circuit-like stepped accents with short organic attached branches;
- preserves the almost-black figure, broad face cavern and low-contrast asymmetric drapery;
- retains ten genuine visible rear paths, opacity ≥`0.12`, width ≥`0.2`, and the bounded 36–48 full path count;
- leaves production assets and runtime motion untouched.

## Independent micro master

The v20.8 micro master remains an independent optical crop. It keeps two compact aura masses attached to the silhouette, six cyan hood/shoulder anchors and a near-black monolithic body, while avoiding detached roots, light-gray cloth and a cyan `A` at 16–20px.

## Anti-hack gates

The validators reject raster content, runtime animation, aura ellipses, SVG filters, Gaussian blur, missing semantic layers, production imports, path-count inflation, transparent field-bound fillers and removal of canonical composition or field targets. Numeric, composition, visible-field and CI success remain necessary but never sufficient for artistic approval.

## Browser acceptance architecture

Manual Browser QA uses four independent exact-head hosted jobs: core Chromium/Android plus fresh-process base Safari; home/reveal, route and search Safari; standard premium homepage and pointer performance; and critical iPhone first-viewport/reduced-motion contours. Every job performs its own exact checkout, build and preview. Retries remain diagnostic only because `failOnFlakyTests` is enabled.

## Promotion blockers

Production replacement is prohibited until one exact v20.14/v20.8 head provides internal geometry evidence, rendered composition evidence, visible-field evidence, canonical overlay, full optical matrix, micro dark/light matrix, an explicit human `reference-approved` verdict, post-approval motion integration and every required workflow green without flaky acceptance.
