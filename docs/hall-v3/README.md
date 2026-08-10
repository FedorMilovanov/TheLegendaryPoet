# Hall v3 — staged production authority

This directory is the permanent technical/art-production authority for Hall v3. The historical architecture root is `TLP-HALL-001` / Product #369.

Product #369 is closed as the completed **architecture root / autonomous staging program** after the source-based Pushkin offline-exhibit milestone. Closing that root does **not** mean that the production museum or WebGL runtime is complete. Future Hall work is preserved in [`OWNER_GATED_ROADMAP.md`](OWNER_GATED_ROADMAP.md) and becomes selectable only when a new material owner/legal/institutional/evidence input exists.

The current machine phase and gate state remain in [`hall-v3-contract.json`](hall-v3-contract.json). Prose, a closed issue, CI success or an agent decision cannot silently advance a Hall gate.

## Current machine stage — Pushkin vertical slice frozen / owner-gated

The machine contract intentionally remains at `phase=pushkinVerticalSlice`:

- `foundation`: completed;
- `referenceBible`: completed;
- `metricGreybox`: completed;
- `cameraApproval`: completed;
- `materialLightingExportSpike`: completed;
- `pushkinVerticalSlice`: active as the frozen staging gate;
- `offlineVisualApproval`: blocked;
- `webVerticalSlice`: blocked;
- `fullMuseumScaleOut`: blocked.

`active` here means the current fail-closed machine gate, **not** an open GitHub architecture lane and not permission for autonomous implementation. `docs/project-contract.json` has zero open architecture lanes after the #369 closure transaction.

## Frozen authority

The staged Hall authority remains:

- **H3** — selected topology; H1 reserve, H2 rejected;
- H3 layout fingerprint `5d5d0ddd8b150aa64afb73a2a3d9e00c6005e99fc935a6d4707a49ecd475fe65`;
- H3 mesh fingerprint `b3de770858a423305db8fcab15b405414e66b3d3de93ab1deaa5b3b35b418777`;
- **R1** — approved guided camera, Pushkin witness position `[8.0, 2.5, 1.60]`, target `[11.15, 5.45, 1.95]`, lens `28 mm`; R3 reserve, R0/R2 rejected;
- **L0 minimal runtime lighting** — selected baseline;
- **UV0** — selected surface mapping at `1.5 m / UV unit`;
- **UV1** — optional static-bake reserve only;
- current L1 external-lightmap bake — rejected;
- production texture encoding — still not a production decision.

Any later change to H3/R1/L0/UV0 must reopen the owning earlier gate with new evidence; closure of #369 does not make those authorities informal.

## Pushkin offline slice — completed autonomous milestone

Merged Product #403 completed the current autonomous source/offline slice transaction.

Exact identities preserved in the machine/audit record:

- exact tested head: `653ed65c102c09c39803193d95addf8aef739a34`;
- merge/current-main at closure review: `256dd19f1e39eef341ca260a4d8c72e1b6f19d73`;
- fixed still-review artifact id: `9057080606`;
- final exhibit artifact id: `9058946051`;
- final authored walkthrough: H.264, 960×540, 24 fps, 577 frames, 24.041667 s;
- raw and optimized GLBs: Khronos `0 errors / 0 warnings`;
- measured offline first-slice budget evidence now exists and is fail-closed validated.

The budget evidence closes the earlier false-green class where `budgetReportRequired: true` existed without a required generated/validated budget report. Offline evidence deliberately does not invent production GPU residency, browser frame time, renderer.info, decode/load time or a production texture-encoding decision.

## Documentary/rights boundary

The Pushkin documentary source model remains fail closed.

- Kiprensky 1827 portrait exact source hash: `sha256:316d5f366a46f23cd0a181e570f2d09a6b0d12bc368dab18fdb394b8b8b8bf4b`;
- 1833 `Eugene Onegin` exact source hash: `sha256:d629c10943cbf6428eabb194ee5c17c1b763c27108a2238eaf72fadb275643e5`;
- both may be used for the already-authorized offline evidence path but remain non-approved for production shipping until the canonical owner/rights/credit disposition is satisfied;
- the Pushkin House manuscript candidate remains optional/deferred and may be used later only from an actually supplied or otherwise reusable source;
- the weak autograph mirror remains blocked as a negative control;
- byte availability is not permission;
- public-domain age or a public catalogue page is not by itself a final production decision;
- AI cannot substitute for missing documentary rights or impersonate a facsimile/autograph/manuscript.

## Permanent production boundary

Until a later bounded transaction independently promotes its own gate:

- `/hall` remains a lightweight DOM placeholder;
- `src/components/hall/*` remains legacy/forensic evidence only;
- Three.js/R3F/WebGL remains outside the dormant `/hall` dependency graph;
- rights-pending documentary media cannot enter the production manifest or receive a runtime path;
- QA `.blend`, PNG/SVG evidence and GLBs do not become production assets merely because an Actions artifact exists;
- the current L1 bake remains rejected;
- no production budget acceptance may be inferred from offline GLB evidence;
- `offlineVisualApproval`, `webVerticalSlice` and `fullMuseumScaleOut` cannot self-promote;
- FPS/free-walk, hover whispers, fake autographs, mirror-floor spectacle and effect-driven rescue remain non-goals.

## Current source authority

Key current authorities include:

- [`hall-v3-contract.json`](hall-v3-contract.json) — machine stage, safety gates and lifecycle tracking;
- [`OWNER_GATED_ROADMAP.md`](OWNER_GATED_ROADMAP.md) — future trigger conditions and bounded sequence after #369;
- [`REFERENCE_BIBLE.md`](REFERENCE_BIBLE.md), [`SPATIAL_BRIEF.md`](SPATIAL_BRIEF.md), [`reference-bible.json`](reference-bible.json) — reference/metric evidence;
- [`greybox-decision.json`](greybox-decision.json), [`greybox-layouts.json`](greybox-layouts.json) — frozen topology authority;
- [`camera-decision.json`](camera-decision.json), [`camera-gate-promotion.json`](camera-gate-promotion.json) — R1 decision/promotion;
- [`material-decision.json`](material-decision.json), [`material-gate-promotion.json`](material-gate-promotion.json), [`material-spike.json`](material-spike.json) — material/light/export authority;
- [`pushkin-rights.json`](pushkin-rights.json), [`pushkin-acquisition.json`](pushkin-acquisition.json), [`pushkin-rights-review.json`](pushkin-rights-review.json), [`pushkin-owner-disposition.json`](pushkin-owner-disposition.json) — object/right/acquisition/owner boundaries;
- [`pushkin-slice.json`](pushkin-slice.json), [`pushkin-offline-exhibit.json`](pushkin-offline-exhibit.json), [`pushkin-offline-budget.json`](pushkin-offline-budget.json) — offline slice, exhibit and budget contracts;
- permanent Hall validators and workflows — source, topology, material transport, rights/acquisition, offline exhibit/budget and dormant-route boundaries.

Earlier camera/material phase-specific generators and validators remain for forensic reproducibility; they are not permission to reopen a completed gate casually.

## Future work

No autonomous Product transaction is selected after #403. A later Hall transaction requires a material new trigger such as owner/legal documentary disposition, institutional evidence, explicit human offline visual approval, a newly reproduced engineering defect, or runtime evidence sufficient to propose the next bounded web slice.

When such a trigger exists, open a **new bounded issue/lane for that transition** and follow [`OWNER_GATED_ROADMAP.md`](OWNER_GATED_ROADMAP.md). Do not reopen #369 as a mega-umbrella merely because the long-term museum is not yet shipped.

## Closure

`TLP-HALL-001` / Product #369 is terminal as the architecture root. The root closed after retiring Hall-v2 authority, establishing permanent Hall-v3 contracts, completing the Reference Bible/greybox/camera/material stages and producing the source-based Pushkin offline exhibit with exact artifacts and measured offline-budget evidence.

The production Hall remains deliberately dormant, placeholder-backed and owner-gated. That is the correct safe terminal state for #369, not an assertion that the future museum has already shipped.
