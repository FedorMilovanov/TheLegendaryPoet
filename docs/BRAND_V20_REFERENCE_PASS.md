# Brand v20 reference-led geometry pass

## Current QA-only pair

- `v20.15-reference-emissive-current` — full-size 96-grid master;
- `v20.9-reference-micro-emissive-current` — independent 32-grid master.

Both remain `not-reference-approved`. Production SVGs, `BrandMark.tsx`, release manifests and the validated motion controller are unchanged.

## Latest human correction

The exact v20.14 result was rejected because the light still read as a separate aura behind the figure and its teal-cyan colour did not match the colder saturated electric-blue reference.

v20.15 changes the construction rather than merely recolouring the same field:

- the broad rear aura and the field-envelope acceptance gate are removed;
- every full-size rear emission path shares the exact figure transform `translate(10.29 4.76) scale(.79 .95)`;
- broad low-opacity blue strokes lie directly underneath the hood and cloak edges, so the opaque figure masks their inner halves and only edge-origin light remains visible;
- no rear emission path uses a fill, closed aura mass or detached branch;
- each rear path carries a named hood or cloak anchor;
- the active palette moves from teal values to saturated electric blue: `#006eff`, `#0078ff`, `#007dff`, `#0081ff`, `#008cff`, `#009dff`, `#00a8ff` and brighter blue-white cores;
- diagonal blue currents follow cloth folds inside the figure, reinforcing that the energy originates in the figure rather than surrounding it;
- the figure remains almost black/deep navy, with the broad black face cavern and soft asymmetric drapery preserved.

## Honest iteration history

- **v20.3 / v20.1:** rejected for dome aura, horizontal cowl and panel-like folds.
- **v20.4 / v20.2:** rejected for oversized smooth cavity, dominant continuous rim, tidy cowl and an `A`-like micro sign.
- **v20.5 / v20.3:** rejected for an oval cavern, ribbon cowl, regular panel fan and mirrored field.
- **v20.6 / v20.4:** rejected for a stacked-chevron cowl, regular long panels, sparse field and nearly invisible dark 16–20px micro.
- **v20.7 / v20.5:** rejected for a broad clean shawl, oversized cowl zone and residual symmetric panel structure.
- **v20.8 / v20.6:** exposed the missing square-composition contract: the cloak occupied 98.3% of the canvas instead of the canonical 76.9%.
- **v20.9 / v20.6:** corrected the crop; rejected for an upper-only field, clean cloth planes and weak shoulder volume.
- **v20.10 / v20.6:** rejected for wire-like field topology, clean V-shaped cowl and weak small-size shoulder volume.
- **v20.11 / v20.7:** human review rejected detached root-like lines, a Shredder-like figure, light-gray values and incorrect clothing folds.
- **v20.12 / v20.8:** rejected for a broad smooth contour sheath and residual panel-like cloak construction.
- **v20.13 / v20.8:** rejected because the attached field still read as a broad teal hood outline and stopped too high.
- **v20.14 / v20.8:** rejected because the result still read as a separate aura and the glow colour was not the reference electric blue.
- **v20.15 / v20.9:** current QA-only correction; rear light is authored on the exact silhouette transform and internal currents follow the cloth.

## Reference contracts

### Internal structure

| Ratio | Canonical | Allowed | v20.15 full | v20.9 micro |
|---|---:|---:|---:|---:|
| hood height / visible figure | 0.357 | 0.27–0.36 | 0.358 | 0.358 |
| hood width / cloak width | 0.386 | 0.32–0.43 | 0.383 | 0.392 |
| face cavern / hood width | 0.789 | 0.68–0.86 | 0.757 | 0.742 |
| cloak / hood width | 2.592 | ≥2.30 | 2.608 | 2.548 |

### Full-size square composition

| Ratio | Canonical | Allowed | v20.15 |
|---|---:|---:|---:|
| cloak width / canvas | 0.770 | 0.72–0.82 | 0.777 |
| occupied figure height / canvas | 0.875 | 0.84–0.91 | 0.879 |
| hood apex Y / canvas | 0.121 | 0.10–0.145 | 0.121 |
| cloak shoulder Y / canvas | 0.406 | 0.37–0.43 | 0.393 |
| figure centre X / canvas | 0.498 | 0.47–0.53 | 0.502 |

The canonical outer cyan envelope is retained as descriptive reference evidence only. It no longer forces the candidate to populate a detached rear field.

### Attached-emission gate

The browser audit now verifies:

- at least eight named full-size rear edge paths and two named micro edge paths;
- no filled rear aura masses;
- every rear path intersects the rendered hood/cloak bounds;
- full-size rear paths use the exact same transform as the figure;
- maximum full-size stroke overshoot stays within 3% of the canvas;
- minimum rear opacity is `0.12` and minimum width is `0.2`;
- saturated electric-blue palette coverage is present and rejected teal aura colours do not return.

## Independent micro master

The v20.9 micro master removes the two filled rear aura shapes. Two broad edge strokes now sit underneath the hood and cloak silhouette, while the visible rim and diagonal cloth currents use the same electric-blue family as the full master.

## Anti-hack gates

The validators reject raster content, runtime animation, aura ellipses, SVG filters, Gaussian blur, filled rear aura masses, unnamed emission paths, detached emission bounds, mismatched full-size transforms, rejected teal colours, production imports and path-count inflation. Numeric, composition, attached-emission and CI success remain necessary but never sufficient for artistic approval.

## Promotion blockers

Production replacement is prohibited until one exact v20.15/v20.9 head provides geometry evidence, rendered figure-composition evidence, attached-emission evidence, canonical overlay, full optical matrix, micro dark/light matrix, an explicit human `reference-approved` verdict, post-approval motion integration and every required workflow green without flaky acceptance.
