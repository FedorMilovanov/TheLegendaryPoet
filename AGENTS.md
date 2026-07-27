# Repository agent rules

These rules apply to every human, coding agent and autonomous marathon working in this repository.

## Canonical emblem reference: absolute authority

The only visual authority for the THE LEGENDARY POET emblem is:

`qa/reference/brand-emblem-canonical-reference.webp`

Reference id: `canonical-hooded-figure-v2-clean-base`.

This is the user-approved clean-base image: the electrical aura is concentrated around the hood, shoulders and side edges, while the bottom remains dark and free of a required smoke pool. The superseded v1 reference and every v8/v9 SVG candidate are historical implementations only. They are not artistic references.

## Mandatory workflow for every emblem change

1. Open the canonical reference before editing any brand file.
2. Keep the reference visible beside the candidate throughout the entire pass.
3. Open the latest `brand-reference-comparison-matrix.png` and `brand-reference-live-site-comparison.png`.
4. Judge macro geometry first: hood/body ratio, face-cavern width, shoulder position, cloak spread, collar construction and the clean lower edge.
5. Work from the canonical reference. **Do not iterate from the previous SVG alone.**
6. Update `qa/brand-reference-evaluation.json` in the same final tree as every change to:
   - `src/components/BrandMark.tsx`;
   - `public/brand-emblem.svg`;
   - `public/brand-mark-micro.svg`;
   - `public/brand-emblem-mask.svg`.
7. Run static brand validation and exact-head browser QA.
8. Inspect reference/candidate at 192, 96, 56, 32 and 16 px.
9. Inspect the actual built homepage header and footer, not only an isolated SVG render.
10. Keep the PR draft and `not-reference-approved` while any blocking deviation remains.

## Hard stop conditions

Stop micro-polishing and redesign the base geometry when any of these appears:

- the face becomes a narrow oval or droplet;
- the hood/body ratio moves away from the v2 reference;
- the shoulders become a rounded poncho or compact bust;
- the cowl becomes a clean X, bow, moustache or thin necktie;
- folds become identical radial wedges;
- glow is used to hide weak cloth geometry;
- a smoke pool, mist ring or bright aura is added below the cloak hem;
- old v1 smoke is restored merely because it existed in the superseded reference;
- validators freeze old coordinates that conflict with v2;
- a green CI result is described as evidence of visual fidelity.

## Required visual invariants

- High layered pointed hood.
- Broad empty black face cavern with no eyes or features.
- Heavy gathered cowl beneath the face.
- Wide triangular cloak with three readable major fold families.
- Near-symmetric architectural core.
- Bright icy rim around the hood and upper side edges.
- Electrical aura around the head, shoulders and sides.
- Dark calm lower edge without required smoke.
- No text, book, wings, halo, crystal, cross or religious symbol inside the emblem.

## Required evidence in every brand PR

- exact-head `qa-artifacts/brand-reference-comparison-matrix.png`;
- exact-head `qa-artifacts/brand-reference-live-site-comparison.png`;
- current candidate revision and Git blob locks;
- explicit remaining deviations;
- explicit `reference-accepted` or `not-reference-approved` decision.

Never weaken these rules to make a candidate pass. Change the candidate.
