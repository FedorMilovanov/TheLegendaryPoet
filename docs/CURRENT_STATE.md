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
- Community reads are target-scoped and aggregate-backed; generic application startup does not hydrate a public ratings/comments corpus.
- Remote source branches are intentionally limited to `main` plus `archive/deep-research-local-images-20260724`, the exact preserved head of the retired deep research branch. The archive ref is evidence-only and is never a production merge candidate.

The machine-readable counterpart is `docs/project-contract.json`; `node scripts/validate-project-contracts.mjs` blocks drift between documentation, package/lock identity, workflows, live paths and registered open architecture lanes.

## Verified architecture now in production

The exact evidence remains in AuditRepo, but the current source tree enforces these boundaries:

1. **One public longform model.** The live runtime publishes `Essay` objects only. The retired `Article` model and unpublished drafts were removed from the runtime with bounded archival preservation and compatibility redirects.
2. **Immutable essay publication.** Canonical essays are cloned, enriched, validated and deep-frozen at one publication boundary; authoring imports are not mutated in place. Accepted verified-media decisions are applied by a central registry, while unresolved media remain blocked.
3. **Target-scoped community data.** Detail surfaces use aggregate summaries and bounded comment pages. Leaderboards use aggregate rows, local persistence is bounded to device-owned state/outbox work, and poisoned persisted operations cannot block valid delivery.
4. **Workflow and performance contracts.** Shared repository actions own dependency, build-tool, browser and preview setup. The production build must retain one entry, fourteen distinct lazy route chunks and explicit entry, route, JavaScript and CSS budgets.
5. **Reader-facing integrity.** Source links, citation identifiers, literary-language checks, route recovery, blocked-storage handling and compositor-safe tilt behavior are permanent validated contours rather than page-specific patches.
6. **Premium reader certification.** Desktop Chromium, Android Chrome, desktop WebKit and fresh-process iPhone Safari certify longform navigation, archive round-trips, honest blocked-storage behavior, route focus ownership, reduced motion, forced colors and queued failed community writes without adding a duplicate workflow.
7. **Explicit private governance.** Package and lockfile identity, supported Node range, private/non-publishable status, `UNLICENSED` disposition and SHA-based release promotion are machine-checked. No public-source licence is inferred from repository visibility or third-party asset metadata.
8. **Forensic branch retirement.** Temporary transport refs, superseded implementation refs, old Arena refs and the deeply diverged work ref were retired only after exact successor mapping, byte-identical evidence archival, selective current-head extraction, rights-safe path classification and direct post-deletion branch inventory. The intentional archive ref preserves the old research history without restoring obsolete runtime or executable workflows.
9. **Single route/runtime truth.** Router elements, lazy page ownership, explicit redirects, sitemap membership, route QA inventory and per-route budgets derive from one machine contract. Unknown article ids reach NotFound, every SPA pathname transition owns focus after settlement, invalid essay structure fails validation instead of being repaired by the renderer, and archive removals expose honest mutation outcomes.
10. **Canonical poet source authority.** All ten published poet records own their portrait and conclusion prose directly in their canonical source modules. The catalog preserves direct object identity, and permanent validation rejects hidden publication-time editorial rewriting or duplicate ownership of those fields.

## Current quality gates

The dependency-free `Project contracts` workflow runs project-contract, reader-certification and UTC-day validators on every PR and `main` push. `npm run check` continues to validate content, brand, app shell, interaction runtime, routes, archive behavior and TypeScript; production build, prerender and browser workflows remain separate final gates.

## Open architecture lanes

There are currently no registered open architecture lanes. Any future lane must receive a canonical `TLP-*` ID in this section and in `docs/project-contract.json`; prose-only or anonymous debt entries are forbidden. AuditRepo remains the authority for exact status transitions and production evidence.

<!-- project-contract:open-lanes:start -->
<!-- project-contract:open-lanes:end -->

## Retained historical material

`audit/index.html`, `COMPONENT_BLUEPRINTS.md`, `TRANSFER.md` and `docs/INTEGRATION_STATUS.md` remain historical snapshots only. They are not current implementation instructions and must not be used to reopen already closed architecture work.

The branch `archive/deep-research-local-images-20260724` is a deliberate forensic/research retention ref. Its presence does not make its old runtime, workflows, media or claims current, publication-safe or mergeable.

## Change discipline

- Prefer root-cause repair lanes over page-specific patches.
- Never restore old Arena, trigger or deeply diverged runtime wholesale; extract only current-head-verified unique value.
- Do not add an open architecture item without a canonical ID registered in `docs/project-contract.json`.
- Update `docs/project-contract.json` whenever an authoritative runtime path, governance contract or open-lane set changes.
- Update AuditRepo only after a repair wave is merged and verified on the resulting production head.
- A licence, public package release or redistribution grant requires explicit owner approval and a dedicated governance change.
- Unresolved research, attribution and media-rights work remains editorial backlog; architecture closure must never be used to invent evidence or publication permission.
