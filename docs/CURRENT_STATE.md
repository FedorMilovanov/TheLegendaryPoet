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
11. **Hall v3 staged boundary, architecture root completed.** `TLP-HALL-001` / Product #369 completed the autonomous architecture-staging program and is no longer an open architecture lane. Production `/hall` remains a lightweight DOM placeholder and Hall v2 remains forensic/non-authoritative. Foundation, Reference Bible, metric greybox, Camera Approval and the material/light/export gate are completed. H3 is frozen topology authority and R1 is the approved guided camera. L0 minimal runtime lighting and metre-scaled UV0 remain selected; UV1 is only an optional reserve and the current L1 bake remains rejected. Product #403 completed the source-based Pushkin offline exhibit, exact-source evidence, raw/optimized GLB validation, authored walkthrough and measured offline first-slice budget proof. The machine contract intentionally remains frozen at `pushkinVerticalSlice` as a fail-closed owner-gated staging state: documentary production rights, human `offlineVisualApproval`, production WebGL, `webVerticalSlice` and `fullMuseumScaleOut` remain blocked. No autonomous Product transaction is selected. Future Hall work starts only from a new material owner/legal/institutional/evidence input and a new bounded transaction under `docs/hall-v3/OWNER_GATED_ROADMAP.md`.

## Current quality gates

`Project contracts` runs project/workflow contracts, permanent Hall boundaries, reader certification and UTC-day validation on every PR and `main` push. `npm run check` keeps Hall foundation and Reference Bible guards, frozen topology provenance, persistent post-material H3/R1/L0 authority, the Pushkin rights/source-slice semantic validator, the canonical `RIGHTS_REGISTER` schema validator, the acquisition/byte-identity validator, the offline exhibit/budget guards and the phase-independent material transport guard. The Hall validators continue to protect the frozen `pushkinVerticalSlice` staging state after #369 closure; closing the issue does not relax the lightweight `/hall`, legacy isolation, documentary-rights or production-WebGL barriers. Earlier camera/material authoring and decision validators remain available for forensic reproduction but are no longer the current-phase authority.

## Open architecture lanes

No owner-selected architecture lane is currently open. Future work preserved in an owner-gated roadmap does not become an open architecture lane until a concrete, currently selectable transaction is created with fresh authority and evidence.

<!-- project-contract:open-lanes:start -->
<!-- project-contract:open-lanes:end -->

## Owner-gated Hall roadmap

The completed Hall root remains traceable as historical/current safety authority, not active work:

- historical architecture root: `TLP-HALL-001` / Product #369;
- current frozen machine stage: `pushkinVerticalSlice`;
- autonomous Product transaction selected: **no**;
- roadmap authority: `docs/hall-v3/OWNER_GATED_ROADMAP.md`;
- production `/hall`: placeholder;
- production Three/R3F/WebGL: blocked;
- rights-pending documentary media in production: blocked;
- owner `offlineVisualApproval`: still required;
- future `webVerticalSlice` and `fullMuseumScaleOut`: blocked until their own evidence and authority exist.

A future Hall implementation must open a new bounded owner for the selected transition. It must not reopen #369 merely because the long-term museum remains unfinished.

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
- Unresolved research, attribution and media-rights work remains editorial/owner-gated backlog; architecture closure must never invent evidence or publication permission.
