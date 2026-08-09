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
11. **Hall v3 staged boundary.** Production `/hall` remains a lightweight DOM placeholder and Hall v2 remains forensic/non-authoritative. Foundation, Reference Bible, metric greybox and Camera Approval are completed. H3 is the frozen topology authority; H1 remains topology reserve and H2 is rejected. R1 is the approved guided camera, R3 remains camera reserve and R0/R2 are rejected. Gate 4 remains machine-active until a separate promotion transaction, but the measured material delivery contract is now selected: L0 minimal runtime lighting is the Pushkin-slice baseline, UV0 owns surface mapping, UV1 remains optional reserve, the current L1 lightmap bake is rejected, and final production texture encoding remains deferred. Pushkin slice, offline visual approval, production WebGL runtime and scale-out remain blocked until their own gate transactions.

## Current quality gates

`Project contracts` runs project/workflow contracts, permanent Hall boundaries, reader certification and UTC-day validation on every PR and `main` push. `npm run check` keeps Hall foundation and Reference Bible guards, frozen topology provenance, persistent post-camera H3/R1 authority, material spike/transport/visual evidence and the separate material-decision authority. The path-scoped Hall Blender workflow still regenerates frozen H1/H2/H3 and R0/R1/R2/R3 evidence from exact source, rebuilds the representative material bay and browser witness, and checks that the selected Gate-4 decision continues to point at immutable accepted evidence. Earlier phase-specific Hall validators remain available for forensic reproduction but do not replace the current persistent authority chain.

## Open architecture lanes

One owner-selected architecture lane is open. It must not absorb unrelated runtime/content work. AuditRepo remains the authority for exact status transitions and production evidence.

<!-- project-contract:open-lanes:start -->
- `TLP-HALL-001` — Product #369 owns the staged Hall v3 rebuild. The current machine phase remains **materialLightingExportSpike** until a separate gate-promotion transaction. H3 topology and R1 camera are frozen. The material delivery decision selects L0 minimal runtime lighting, metre-scaled UV0 surface mapping, optional/reserved UV1, preservation-safe glTF optimization and the existing color/data semantic contract; the current L1 bake is rejected and final production texture encoding remains deferred. The active bounded task is now only the `materialLightingExportSpike → pushkinVerticalSlice` gate promotion. That promotion may not add Pushkin assets, activate production Three/R3F/WebGL, redesign H3/R1, start full-Hall lookdev or silently approve the rejected L1 bake. `pushkinVerticalSlice`, `offlineVisualApproval`, `webVerticalSlice` and `fullMuseumScaleOut` remain blocked until the machine contract is separately promoted.
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
