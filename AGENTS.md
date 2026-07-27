# Repository agent rules

These rules apply to every human, coding agent and autonomous marathon working in this repository.

## Canonical emblem reference: absolute authority

The only visual authority for the THE LEGENDARY POET emblem is:

`qa/reference/brand-emblem-canonical-reference.webp`

Reference id: `canonical-hooded-figure-v2-clean-base`.

The approved reference has a high layered hood, a broad black face cavern, heavy gathered cloth, a wide cloak, cold upper/side electrical energy and a clean lower edge with no required smoke beneath the cloak. Older SVGs are implementation history only, never artistic references.

## Direct-main workflow

All emblem marathon work is committed directly to `main`. Do not create temporary brand branches or draft PRs that can be abandoned.

Every emblem pass must be one atomic Git tree based on the latest `main` and must update together:

- `src/components/BrandMark.tsx`;
- `public/brand-emblem.svg`;
- `public/brand-mark-micro.svg`;
- `public/brand-emblem-mask.svg`;
- `qa/brand-reference-evaluation.json` with exact Git blob locks;
- affected validators, Browser QA and cache/version markers.

Before moving `main`, confirm that its head has not advanced. Never force-push and never overwrite unrelated work. If `main` advances, rebuild the atomic tree on the new head.

## Mandatory visual loop

1. Open the canonical reference before editing.
2. Keep it visible beside the candidate throughout the pass.
3. Judge macro geometry before detail: hood/body ratio, face width, shoulder spread, cowl construction, three large fold families and the smoke-free lower edge.
4. Never iterate from the preceding SVG alone.
5. Run strict static validation and exact-main Browser QA.
6. Inspect `REFERENCE / CURRENT CANDIDATE` at 192, 96, 56, 32 and 16 px.
7. Inspect `REFERENCE / CURRENT SVG / EXACT-MAIN LIVE SITE` and the actual homepage header/footer.
8. Record all remaining deviations honestly and keep `not-reference-approved` until the user accepts the exact-main visuals.

## Hard stops

Reset the base geometry instead of micro-polishing when:

- the face becomes a narrow oval, droplet or tidy mask;
- the hood/body ratio drifts from the reference;
- the cloak becomes a compact bust, dome or poncho;
- the cowl becomes a clean X, bow, moustache or necktie;
- folds become identical radial wedges;
- glow hides weak cloth construction;
- smoke, mist or a bright pool appears under the cloak;
- tests freeze old coordinates that conflict with the reference;
- green CI is presented as proof of visual fidelity.

## Evidence required after every main commit

- `qa-artifacts/brand-reference-comparison-matrix.png`;
- `qa-artifacts/brand-reference-live-site-comparison.png`;
- `qa-artifacts/brand-live-site-home-first-viewport.png`;
- the exact `main` SHA and workflow artifact digest;
- an explicit visual decision and remaining deviations.

Green CI proves technical integrity only. Change the candidate, never weaken the reference, evidence or score.