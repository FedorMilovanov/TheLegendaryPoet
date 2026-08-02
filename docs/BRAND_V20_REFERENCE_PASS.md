# Brand v20 reference-led geometry pass

## Current status

The current QA-only pair is:

- `v20.4-reference-drapery` — full-size 96-grid master;
- `v20.2-reference-micro-rim` — independent 32-grid optical master.

Both candidates pass the four macro geometry ratios, but both remain
`not-reference-approved`. Production SVG files, release manifests,
`BrandMark.tsx` and the validated motion controller are unchanged.

## Iteration record

### v20.3 / v20.1

The first exact Chromium overlay proved that the numeric architecture was valid,
but the full-size image still had a dome-like aura, a horizontal cowl and
panel-like straight folds. The micro master retained its face void but was too
quiet on dark backgrounds at 16–20px. That pair was rejected as a visual
replacement and remains only in Git history and the candidate ledger.

### v20.4 / v20.2

The current refinement keeps the naturally passing geometry while changing the
visual causes of the mismatch:

- the full-size aura is branch-led rather than a bright radial dome;
- the cowl is formed from overlapping crossed cloth planes;
- cloak masses use curved, asymmetric families rather than regular wedges;
- the face cavern begins lower and reads less like one oversized oval;
- the hood rim is split into unequal segments instead of one perfect outline;
- the micro master uses a compact high-contrast rim and independent crossed
  cowl to remain recognisable at 16 and 20px.

## Canonical landmark sheet

Review anchors are stored in
`qa/reference/brand-v20-reference-sheet.json`. Aura pixels are excluded from
figure geometry. Exact browser `getBBox()` remains the candidate measurement
source.

| Ratio | Canonical estimate | Allowed | v20.4 full | v20.2 micro |
|---|---:|---:|---:|---:|
| hood height / visible figure height | 0.357 | 0.27–0.36 | 0.354 | 0.356 |
| hood width / cloak width | 0.386 | 0.32–0.43 | 0.365 | 0.364 |
| face cavern width / hood width | 0.789 | 0.68–0.86 | 0.818 | 0.804 |
| cloak width / hood width | 2.592 | ≥2.30 | 2.741 | 2.750 |

## Evidence required before promotion

1. Exact Chromium `getBBox()` results from the committed v20.4 and v20.2 files.
2. Full-size raster matrix at 64, 96, 128 and 256px.
3. Micro raster matrix at 16, 20, 24, 32 and 48px on dark and light backgrounds.
4. Canonical reference / candidate / overlay comparison.
5. Explicit human silhouette verdict.
6. Existing motion controller attached only after static approval.
7. All required workflows green on one exact head with zero flaky tests.

## Remaining visual questions

Numeric architecture is no longer the blocker. Exact committed evidence must
still decide whether:

- the face cavern is sufficiently tapered and recessed;
- the crossed cowl reads as compressed fabric rather than a graphic chevron;
- upper electrical branches are organic enough without becoming dominant;
- broad diagonal cloak folds retain volume at 64px;
- the micro rim remains legible without turning into a cyan arch at 16px.

Until those questions are resolved, `productionReplacement` remains `false`.
