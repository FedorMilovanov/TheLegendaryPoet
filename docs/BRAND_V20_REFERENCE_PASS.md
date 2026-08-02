# Brand v20 reference-led geometry pass

## Status

`v20.3-reference-monolith` and `v20.1-reference-micro` are QA-only candidates.

Both candidates pass the four macro geometry ratios, but both remain
`not-reference-approved`. The production SVG files and `BrandMark.tsx` are not
changed by this pass.

## What changed from v19

The full-size master was redrawn from the canonical 256×256 reference rather
than deformed from a previous candidate:

- the hood has a pointed apex and occupies about one third of visible height;
- the black face cavern is the dominant inner shape instead of a narrow drop;
- shoulder mass expands into a broad triangular cloak rather than a rounded bust;
- the cowl is built from asymmetric overlapping cloth planes instead of one
  crossed collar or a regular armoured band;
- folds are organised as broad left, right and central structural families;
- electrical field branches are confined to the hood and upper shoulders;
- glow is evidence-supporting atmosphere, not a substitute for silhouette.

The micro master is independent. It uses fewer folds, a larger open face void
and four short asymmetric field strokes rather than scaling the full-size SVG.

## Canonical landmark sheet

The review anchors are stored in
`qa/reference/brand-v20-reference-sheet.json`. Aura pixels are excluded from
figure geometry. Browser `getBBox()` remains the exact candidate measurement
source.

| Ratio | Canonical landmark estimate | Allowed | v20 full | v20 micro |
|---|---:|---:|---:|---:|
| hood height / visible figure height | 0.357 | 0.27–0.36 | 0.354 | 0.356 |
| hood width / cloak width | 0.386 | 0.32–0.43 | 0.365 | 0.364 |
| face cavern width / hood width | 0.789 | 0.68–0.86 | 0.818 | 0.804 |
| cloak width / hood width | 2.592 | ≥2.30 | 2.741 | 2.750 |

## Evidence required before any promotion

1. Exact Chromium `getBBox()` results on the committed SVG files.
2. Full-size raster matrix at 64, 96, 128 and 256px.
3. Micro raster matrix at 16, 20, 24, 32 and 48px on dark and light backgrounds.
4. Canonical reference / candidate / overlay comparison.
5. Explicit human silhouette verdict.
6. Existing motion controller attached only after static geometry approval.
7. All required workflows green on one exact head with zero flaky tests.

## Remaining visual questions

The numeric architecture is no longer the blocker. Human overlay review must
still decide whether:

- the cowl compression is sufficiently irregular and fabric-like;
- the upper hood is pointed enough without becoming a geometric chevron;
- the field topology is organic enough and not overly balanced;
- the cloak planes retain enough volume at 64px;
- the micro face cavern remains dominant at 16 and 20px.

Until those questions are resolved, `productionReplacement` stays `false`.
