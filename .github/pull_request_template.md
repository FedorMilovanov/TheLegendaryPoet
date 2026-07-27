## Scope

Describe the problem, the changed ownership boundary and anything deliberately left unchanged.

## Verification

- [ ] Exact-head CI passed.
- [ ] Exact-head browser QA passed where applicable.
- [ ] No unrelated rollback is present in the diff.

## Canonical reference comparison

Complete this section whenever any emblem, brand SVG, Safari mask, optical mark or brand-rendering code changes. Delete nothing from this section; mark it not applicable only when the PR has no brand diff.

- [ ] I opened `qa/reference/brand-emblem-canonical-reference.webp` before editing.
- [ ] I did not iterate from the previous SVG alone.
- [ ] `qa/brand-reference-evaluation.json` was updated in the same commit as the brand files.
- [ ] Exact-head browser QA produced `qa-artifacts/brand-reference-comparison-matrix.png`.
- [ ] I inspected reference and candidate together at 192, 96, 56, 32 and 16 px.
- [ ] I checked macro proportions before decorative detail: hood/body ratio, cavern width, cloak spread, shoulder angle and collar overlap.
- [ ] I listed every remaining visual deviation below.
- [ ] Visual decision is explicitly either `reference-accepted` or `not-reference-approved`.
- [ ] A green CI run is not being presented as proof of reference fidelity.

Comparison artifact or workflow evidence:

<!-- Paste the exact-head artifact reference here. -->

Remaining deviations:

<!-- Write `none` only for a genuinely reference-accepted candidate. -->

Visual decision:

<!-- `reference-accepted` or `not-reference-approved` -->

## Merge decision

Explain why this exact head is safe to merge. A brand candidate with blocking reference deviations must remain `not-reference-approved`; do not rename a legacy contour as canonical merely to merge it.
