# Brand v20 reference-led geometry pass

## Current status

The current QA-only pair is:

- `v20.5-reference-silhouette` — full-size 96-grid master;
- `v20.3-reference-micro-silhouette` — independent 32-grid optical master.

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
hooded silhouette. That pair was also rejected as a visual replacement.

### v20.5 / v20.3

The current refinement keeps naturally passing geometry while targeting those
specific failures:

- the full hood is broader and closer to the canonical hood/cloak ratio;
- the face cavern is narrower and tapered toward the canonical value;
- the outer hood rim is thinner and split from two inner cloth seams;
- cowl planes overlap less regularly and cloak panel contrast is reduced;
- two diagonal fabric traces cross the formerly isolated central trench;
- the micro face cavity is tapered and its shoulder contour is longer;
- external micro electrical branches are deliberately suppressed.

## Canonical landmark sheet

Review anchors are stored in
`qa/reference/brand-v20-reference-sheet.json`. Aura pixels are excluded from
figure geometry. Exact browser `getBBox()` remains the candidate measurement
source.

| Ratio | Canonical estimate | Allowed | v20.5 full | v20.3 micro |
|---|---:|---:|---:|---:|
| hood height / visible figure height | 0.357 | 0.27–0.36 | 0.354 | 0.356 |
| hood width / cloak width | 0.386 | 0.32–0.43 | 0.380 | 0.364 |
| face cavern width / hood width | 0.789 | 0.68–0.86 | 0.746 | 0.786 |
| cloak width / hood width | 2.592 | ≥2.30 | 2.633 | 2.750 |

## Evidence required before promotion

1. Exact Chromium `getBBox()` results from the committed v20.5 and v20.3 files.
2. Full-size raster matrix at 64, 96, 128 and 256px.
3. Micro raster matrix at 16, 20, 24, 32 and 48px on dark and light backgrounds.
4. Canonical reference / candidate / overlay comparison.
5. Explicit human silhouette verdict.
6. Existing motion controller attached only after static approval.
7. All required workflows green on one exact head with zero flaky tests.

## Remaining visual questions

Exact committed evidence must decide whether:

- the narrower face cavern is now recessed rather than oversized;
- the cowl reads as compressed fabric instead of layered vector ribbons;
- the lower cloak reads as one heavy mass rather than adjacent panels;
- the reduced rim still carries enough canonical energy at 64px;
- the micro shoulder outline survives 16–20px without returning to an `A` sign.

Until those questions are resolved, `productionReplacement` remains `false`.
