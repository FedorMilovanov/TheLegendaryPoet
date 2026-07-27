## Scope

Describe the problem, the changed ownership boundary and anything deliberately left unchanged.

## Verification

- [ ] Exact-head CI passed or the only failure is the deliberate reference-acceptance gate.
- [ ] Exact-head browser QA passed.
- [ ] No unrelated rollback is present in the diff.

## Canonical reference comparison

Complete this section whenever any emblem, brand SVG, Safari mask, optical mark or brand-rendering code changes.

- [ ] I opened `qa/reference/brand-emblem-canonical-reference.webp` (`canonical-hooded-figure-v2-clean-base`) before editing.
- [ ] I kept the reference beside the candidate and did not iterate from the previous SVG alone.
- [ ] I verified that the clean lower edge remains free of required smoke/mist.
- [ ] `qa/brand-reference-evaluation.json` was updated with exact Git blob locks.
- [ ] Browser QA produced `qa-artifacts/brand-reference-comparison-matrix.png`.
- [ ] Browser QA produced `qa-artifacts/brand-reference-live-site-comparison.png`.
- [ ] I inspected reference/candidate at 192, 96, 56, 32 and 16 px.
- [ ] I inspected the actual exact-head homepage header and footer.
- [ ] I checked macro proportions before decorative detail.
- [ ] I listed every remaining deviation below.
- [ ] Visual decision is explicitly `reference-accepted` or `not-reference-approved`.
- [ ] A green CI run is not being presented as proof of visual fidelity.

Comparison artifacts or workflow evidence:

<!-- Paste exact-head artifact references here. -->

Remaining deviations:

<!-- Write `none` only for a genuinely accepted candidate. -->

Visual decision:

<!-- `reference-accepted` or `not-reference-approved` -->

## Merge decision

Explain why this exact head is safe to merge. A candidate with blocking deviations must remain draft and `not-reference-approved`.
