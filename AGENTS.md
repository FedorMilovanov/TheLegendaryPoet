# Repository agent rules

These rules apply to every human, coding agent and autonomous marathon working in this repository.

## Canonical brand reference: absolute authority

The immutable visual authority for the THE LEGENDARY POET emblem is:

`qa/reference/brand-emblem-canonical-reference.webp`

Reference id: `canonical-hooded-figure-v1`.

The current v8.x SVG is a production baseline only. It is **NOT REFERENCE APPROVED** and must never be treated as the visual source of truth.

## Mandatory workflow for every emblem/SVG change

1. Open the canonical reference before editing any brand file.
2. Open the latest `brand-reference-comparison-matrix.png` beside it.
3. Measure macro proportions before touching details: hood/body ratio, face-cavern width, cloak spread, shoulder angle and collar overlap.
4. Work from the canonical reference. **Do not iterate from the previous SVG alone.** The previous SVG is an implementation to replace, not a reference to preserve.
5. Update `qa/brand-reference-evaluation.json` in the same commit as any change to:
   - `src/components/BrandMark.tsx`;
   - `public/brand-emblem.svg`;
   - `public/brand-mark-micro.svg`;
   - `public/brand-emblem-mask.svg`.
6. Run `npm run validate:brand` and the full browser QA.
7. Inspect the exact-head comparison artifact at 192, 96, 56, 32 and 16 px.
8. Merge only after the evaluation honestly records the remaining differences and the candidate moves closer to the reference in macro geometry.

## Hard stop conditions

Stop the marathon and redesign the base geometry when any of these occurs:

- the hood becomes larger relative to the figure than the reference;
- the face opening becomes a narrow vertical droplet instead of a broad dark cavern;
- the cloak becomes a dome, poncho, raincoat or circular bust;
- the broad central collar overlap is split merely to avoid a thin tie;
- the near-symmetric core is replaced by arbitrary left/right imbalance;
- small decorative seams are added while macro proportions remain wrong;
- glow is used to hide an incorrect silhouette;
- a validator protects old coordinates that conflict with the canonical reference;
- a green CI run is used as evidence of visual similarity.

If a hard stop condition is present, do not add another micro-polish version. Start or continue the v9 geometry reset.

## Required visual invariants

- The cloak dominates the composition; the hood is roughly one third of the visible figure height.
- The black face cavern is broad, deep and pentagonal, not a mask or droplet.
- The shoulders spread diagonally and angularly; the body is not a rounded bell.
- The collar has broad overlapping cloth near the centre without becoming a thin necktie.
- Three major fold families must read before micro-texture: left diagonal, right diagonal and central vertical.
- The structural core is close to symmetric; asymmetry belongs mainly to cloth detail, smoke and energy.
- A continuous icy rim and broad spectral aura are part of the reference, not optional decoration.
- The face remains empty: no eyes, facial features, text, book, wings, halo, crystal or religious symbol.

## Acceptance rules

Technical correctness and reference fidelity are separate gates.

A brand PR is not ready merely because TypeScript, XML, browser decoding or performance tests pass. It must also contain:

- an updated reference evaluation;
- an exact-head `brand-reference-comparison-matrix.png`;
- an explicit list of remaining deviations;
- a clear `reference-accepted` or `not-reference-approved` decision;
- no claim that a legacy v8.x contour is canonical.

Never weaken these rules to make a candidate pass. Change the candidate.