# Brand v20 reference-led geometry pass

## Current status

The current QA-only pair is:

- `v20.6-reference-monolith` — full-size 96-grid master;
- `v20.4-reference-micro-monolith` — independent 32-grid optical master.

Both candidates pass the four macro geometry ratios, but both remain
`not-reference-approved`. Production SVG files, release manifests,
`BrandMark.tsx` and the validated motion controller are unchanged.

## Iteration record

### v20.3 / v20.1

The first exact Chromium overlay proved that the numeric architecture was valid,
but the full-size image still had a dome-like aura, a horizontal cowl and
panel-like straight folds. The micro master remained too quiet on dark
backgrounds at 16–20px. That pair was rejected as a visual replacement.

### v20.4 / v20.2

The second exact overlay removed the dome and introduced crossed drapery, but
still showed an oversized smooth black cavity, a dominant continuous hood rim,
a tidy cowl and lower cloth divided into visible vector panels. At the smallest
sizes the micro electrical branches formed an `A`-like cyan sign instead of one
hooded silhouette. That pair was rejected as a visual replacement.

### v20.5 / v20.3

The third pair passed the contract but retained four visual blockers: the face
cavern remained too smooth and oval, the cowl still read as a horizontal ribbon,
the lower folds formed a regular fan and the electrical field remained too
mirrored. It was retained as evidence and rejected as a production replacement.

### v20.6 / v20.4

The current refinement changes the macro construction rather than decorating the
previous paths:

- the full face cavern has an angular pentagonal base and deliberate left/right imbalance;
- the cowl is three sagging overlapping masses rather than one horizontal band;
- the cloak is a continuous triangular monolith with a small hierarchy of broad folds;
- the dome ellipse, Gaussian blur and glow filters are removed completely;
- rear, mid and front field groups use sparse non-mirrored branches;
- the rim is interrupted and no longer substitutes for cloth volume;
- the micro master has an independent triangular cloak and broken hood rim;
- the micro identity is carried by black negative space and shoulder mass rather than a cyan `A` outline.

The authored complexity is deliberately bounded: full-size uses 42 semantic
paths and micro uses 21. The validator enforces ranges instead of rewarding an
ever-growing decorative path count.

## Canonical landmark sheet

Review anchors are stored in
`qa/reference/brand-v20-reference-sheet.json`. Aura pixels are excluded from
figure geometry. Exact browser `getBBox()` remains the candidate measurement
source.

| Ratio | Canonical estimate | Allowed | v20.6 full | v20.4 micro |
|---|---:|---:|---:|---:|
| hood height / visible figure height | 0.357 | 0.27–0.36 | 0.358 | 0.358 |
| hood width / cloak width | 0.386 | 0.32–0.43 | 0.382 | 0.389 |
| face cavern width / hood width | 0.789 | 0.68–0.86 | 0.706 | 0.705 |
| cloak width / hood width | 2.592 | ≥2.30 | 2.617 | 2.574 |

## Structural anti-hack gates

The v20 validator now rejects:

- raster or embedded image content;
- runtime SVG animation;
- aura ellipses used as a visual dome;
- SVG filters and Gaussian blur used to conceal silhouette errors;
- missing semantic front, mid or rear field layers;
- decorative path-count growth outside the bounded full and micro ranges;
- any production import of a v20 candidate;
- any decision other than `not-reference-approved` before explicit review.

## Browser infrastructure

Manual Browser QA now has two independent exact-head hosted jobs:

1. core Chromium/Android and 23 fresh-process Safari contours;
2. six premium homepage/pointer contours on a separate fresh runner.

The split removes accumulated runner state without changing retries, visual
thresholds, production animation or `failOnFlakyTests`. Both jobs must pass.

## Evidence required before promotion

1. Exact Chromium `getBBox()` results from the committed v20.6 and v20.4 files.
2. Full-size raster matrix at 64, 96, 128 and 256px.
3. Micro raster matrix at 16, 20, 24, 32 and 48px on dark and light backgrounds.
4. Canonical reference / candidate / overlay comparison.
5. Explicit human silhouette verdict.
6. Existing motion controller attached only after static approval.
7. All required workflows green on one exact head with zero flaky tests.

## Remaining visual questions

Exact committed evidence must decide whether:

- the angular face cavern is broad enough without becoming an empty oversized oval;
- the three cowl masses read as compressed cloth rather than stacked chevrons;
- the lower cloak reads as one heavy body rather than dark vector panels;
- the sparse field retains enough energy while remaining irregular;
- the broken micro rim preserves the hood at 16–20px without returning to an `A` sign.

Until those questions are resolved, `productionReplacement` remains `false`.
