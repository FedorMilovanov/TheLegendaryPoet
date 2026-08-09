# Current project state

This file is the source-repository entry point for the **current architecture**. Technical route, branch, brand and deployment statements in `PROJECT_CHARTER.md` are historical where they conflict with this file; its editorial mission remains authoritative. Exact verified production SHAs, closure evidence and historical retirement maps are owned by `FedorMilovanov/AuditRepo/projects/the-legendary-poet/`; they are intentionally not duplicated here.

## Production contract

- Canonical site: `https://thelegendarypoet.ru`.
- Deployment base: `/` on the custom domain.
- Runtime: React 19, direct `react-router`, Vite 7. Node 24 is the CI and `.nvmrc` baseline; the supported package engine range is Node `>=22.22.0 <25`.
- Private package identity: `the-legendary-poet@0.0.0-private`, `private: true`, `UNLICENSED`.
- Release and licensing authority: `docs/RELEASE_POLICY.md`. Production identity is the exact verified source `main` SHA, not the private package version.
- Machine route authority: `src/routes/route-contract.json`; lazy import and chunk-recovery runtime: `src/routes/routeModules.ts`.
- Public longform model: `Essay`, catalogued by `src/data/essays/index.ts` and rendered at `/essays/:slug`.
- Poet catalog: `src/data/library/index.ts`.
- Brand runtime: `src/components/SpectralBrandMark.tsx`; approved source parts live in `qa/reference/approved-brand/` and are materialized by `scripts/materialize-brand-art.mjs`.
- Fonts are self-hosted WOFF2 assets under `src/assets/fonts/`.
- Community reads are target-scoped and aggregate-backed; generic application startup does not hydrate a public ratings/comments corpus globally.
- Steady-state remote source refs are intentionally limited to `main` plus `archive/deep-research-local-images-20260724`, the exact preserved head of the retired deep research branch. Temporary bounded owner branches are not durable source authority.

The machine-readable counterpart is `docs/project-contract.json`; `node scripts/validate-project-contracts.mjs` blocks drift between documentation, package/lock identity, workflows, live paths and registered open architecture lanes.

## Verified architecture now in production

The exact evidence remains in AuditRepo, but the current source tree enforces these boundaries:

1. **One public longform model.** The live runtime publishes `Essay` objects only. Retired article/runtime drafts are not a second live model.
2. **Immutable essay publication.** Canonical essays are cloned, enriched, validated and deep-frozen at one publication boundary; unresolved media remain blocked rather than silently repaired.
3. **Target-scoped community data.** Detail surfaces use aggregate summaries and bounded comment pages; local persistence is bounded to device-owned state/outbox work.
4. **Workflow and performance contracts.** Shared repository actions own dependency, browser and preview setup. Production route/entry/JS/CSS budgets remain explicit.
5. **Reader-facing integrity.** Source links, citations, route recovery, blocked-storage handling and compositor-safe behavior are permanent validated contours.
6. **Premium reader certification.** Desktop Chromium, Android Chrome, desktop WebKit and fresh-process iPhone Safari certify longform and shell behavior.
7. **Explicit private governance.** Package/lock identity, supported Node range, `UNLICENSED` disposition and SHA-based release promotion are machine-checked.
8. **Forensic branch retirement.** Historical refs remain evidence only; they do not restore obsolete runtime/workflows.
9. **Single route/runtime truth.** Router elements, redirects, sitemap membership, route QA and route budgets derive from one machine contract.
10. **Canonical poet source authority.** All ten published poet records own their portrait/conclusion prose directly in canonical source modules.
11. **Hall v3 staged boundary.** Production `/hall` remains a lightweight DOM placeholder and Hall v2 remains forensic/non-authoritative. Foundation, Reference Bible, metric greybox, Camera Approval and the material/light/export gate are completed. H3 is frozen topology authority and R1 is the approved guided camera. The selected Pushkin baseline is L0 minimal runtime lighting with metre-scaled UV0 surface mapping; UV1 remains optional reserve, the current L1 lightmap bake is rejected, and final production texture encoding is still deferred. `pushkinVerticalSlice` is the only active Hall gate. Its rights/source authority separates documentary object provenance, digital-reproduction rights and actual byte acquisition. Original source routes are now identified for the Kiprensky portrait and 1833 `Eugene Onegin`, while the stronger Pushkin House manuscript object is source-verified but requires an institutional copy request. No documentary source bytes or SHA-256 identities are claimed by this transaction, approved documentary assets remain zero, and offline visual approval, production WebGL runtime, web approval and scale-out remain blocked.

## Current quality gates

`Project contracts` runs project/workflow contracts, permanent Hall boundaries, reader certification and UTC-day validation on every PR and `main` push. `npm run check` keeps Hall foundation and Reference Bible guards, frozen topology provenance, persistent post-material H3/R1/L0 authority, the Pushkin rights/source-slice semantic validator, the canonical `RIGHTS_REGISTER` schema validator, the acquisition-route/human-blocker validator and the phase-independent material transport guard. The path-scoped Hall Blender workflow triggers on rights/slice/acquisition authority changes, validates all three Pushkin source layers before Blender download, then still regenerates frozen H1/H2/H3 and R0/R1/R2/R3 evidence, rebuilds the representative material bay, validates raw/optimized GLB transport and re-runs the selected/rejected browser witnesses under the active Pushkin gate. Earlier camera/material authoring and decision validators remain available for forensic reproduction but are no longer the current-phase authority.

## Open architecture lanes

One owner-selected architecture lane is open. It must not absorb unrelated runtime/content work. AuditRepo remains the authority for exact status transitions and production evidence.

<!-- project-contract:open-lanes:start -->
- `TLP-HALL-001` — Product #369 owns the staged Hall v3 rebuild. The current machine phase is **pushkinVerticalSlice**. H3 topology, R1 camera and the selected L0/UV0 material-delivery contract are frozen; UV1 remains optional reserve, the current L1 bake remains rejected and production texture encoding remains deferred until measured inside the slice. `pushkin-rights.json`, `pushkin-slice.json` and `pushkin-acquisition.json` now distinguish object identity, reproduction/intended-use disposition and actual-byte acquisition. The Kiprensky 1827 portrait and 1833 `Eugene Onegin` publication remain `rights-pending`; their exact Wikimedia original routes are recorded but bytes were not materialized, so `sourceFileHash` stays null. The official Pushkin House record `Ф. 244, оп. 12, ед. хр. 6` replaces the weak mirror as the preferred manuscript object-provenance candidate, but its digital copy requires a human/institutional request that remains `not-submitted`. The old weak mirror remains `blocked` as a negative control. Approved documentary assets = 0, exact source byte hashes = 0, runtime documentary paths = 0, and the production Hall manifest remains blocked. The next bounded work is actual byte materialization/hash where a legitimate byte channel exists plus independent credit/intended-use disposition; an institutional request may be recorded but not fabricated by an agent. This phase may later author one offline Blender exhibit only after documentary media are actually authorized, but it may not replace `/hall`, activate production Three/R3F/WebGL, redesign H3/R1, start full-Hall lookdev or advance `offlineVisualApproval`, `webVerticalSlice` or `fullMuseumScaleOut`.
<!-- project-contract:open-lanes:end -->

## Retained historical material

`audit/index.html`, `COMPONENT_BLUEPRINTS.md`, `TRANSFER.md`, `docs/INTEGRATION_STATUS.md` and `docs/HALL_RESEARCH.md` remain historical snapshots only. They are not current implementation instructions and must not override Hall-v3 authority.

The branch `archive/deep-research-local-images-20260724` is deliberate forensic/research retention. Its presence does not make its old runtime, workflows, media or claims current, publication-safe or mergeable.

## Change discipline

- Prefer root-cause repair lanes over page-specific patches.
- Never restore old Arena, trigger or deeply diverged runtime wholesale; extract only current-head-verified unique value.
- Do not add an open architecture item without a canonical ID registered in `docs/project-contract.json`.
- Update `docs/project-contract.json` whenever an authoritative runtime path, governance contract or open-lane set changes.
- Update AuditRepo only after a repair wave is merged and verified on the resulting production head.
- A licence, public package release or redistribution grant requires explicit owner approval and a dedicated governance change.
- Unresolved research, attribution and media-rights work remains editorial backlog; architecture closure must never invent evidence or publication permission.
