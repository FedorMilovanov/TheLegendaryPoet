# Current project state

This file is the source-repository entry point for the **current architecture**. Technical route, branch, brand and deployment statements in `PROJECT_CHARTER.md` are historical where they conflict with this file; its editorial mission remains authoritative. Exact verified production SHAs, closure evidence and working statuses are owned by `FedorMilovanov/AuditRepo/projects/the-legendary-poet/`; they are intentionally not duplicated here.

## Production contract

- Canonical site: `https://thelegendarypoet.ru`.
- Deployment base: `/` on the custom domain.
- Runtime: React 19, direct `react-router`, Vite 7. Node 24 is the CI and `.nvmrc` baseline; React Router 8 requires Node 22.22.0 or newer.
- Live lazy route registry: `src/routes/routeModules.ts`.
- Public longform model: `Essay`, catalogued by `src/data/essays/index.ts` and rendered at `/essays/:slug`.
- Poet catalog: `src/data/library/index.ts`.
- Brand runtime: `src/components/SpectralBrandMark.tsx`; approved source parts live in `qa/reference/approved-brand/` and are materialized by `scripts/materialize-brand-art.mjs`.
- Fonts are self-hosted WOFF2 assets under `src/assets/fonts/`.
- Community reads are target-scoped and aggregate-backed; generic application startup does not hydrate a public ratings/comments corpus.

The machine-readable counterpart is `docs/project-contract.json`; `node scripts/validate-project-contracts.mjs` blocks drift between documentation, workflows, live paths and the registered open architecture lanes.

## Verified architecture now in production

The exact evidence remains in AuditRepo, but the current source tree already enforces these architecture boundaries:

1. **One public longform model.** The live runtime publishes `Essay` objects only. The retired `Article` model and unpublished drafts were removed from the runtime with bounded archival preservation and compatibility redirects.
2. **Immutable essay publication.** Canonical essays are cloned, enriched, validated and deep-frozen at one publication boundary; authoring imports are not mutated in place.
3. **Target-scoped community data.** Detail surfaces use aggregate summaries and bounded comment pages. Leaderboards use aggregate rows, local persistence is bounded to device-owned state/outbox work, and poisoned persisted operations cannot block valid delivery.
4. **Workflow and performance contracts.** Shared repository actions own dependency, build-tool, browser and preview setup. The production build must retain one entry, fourteen distinct lazy route chunks and explicit entry, route, JavaScript and CSS budgets.
5. **Reader-facing integrity.** Source links, citation identifiers, literary-language checks, route recovery, blocked-storage handling and compositor-safe tilt behavior are permanent validated contours rather than page-specific patches.

## Current quality gates

The dependency-free `Project contracts` workflow runs project-contract, workflow/performance and UTC-day validators on every PR and `main` push. `npm run check` continues to validate content, brand, app shell, interaction runtime, routes and TypeScript; production build, prerender and browser workflows remain separate final gates.

## Open architecture lanes

Every current open lane must have a canonical `TLP-*` ID in this section and in `docs/project-contract.json`. Prose-only or anonymous debt entries are forbidden. AuditRepo remains the authority for exact status transitions and production evidence.

<!-- project-contract:open-lanes:start -->
1. `TLP-QA-001` — **Premium reader certification (W5).** Certify representative reader journeys across desktop/mobile Chromium and WebKit, keyboard-only operation, reduced motion, forced colors, blocked storage/network and honest failed-write behavior without weakening existing gates.
2. `TLP-CLEAN-001` — **Branch and artifact retirement (W6).** Classify every remaining remote branch and unique path as extracted, archived with a durable pointer, or rejected as stale before deletion; never merge old Arena, trigger or deeply diverged work branches wholesale.
3. `TLP-GOV-001` — **Owner governance decision.** Resolve package identity, engine/release policy and public-source licensing explicitly. Agents must not invent a license or semantic release version inside an unrelated repair lane.
<!-- project-contract:open-lanes:end -->

## Retained historical material

`audit/index.html`, `COMPONENT_BLUEPRINTS.md`, `TRANSFER.md` and `docs/INTEGRATION_STATUS.md` remain historical snapshots only. They are not current implementation instructions and must not be used to reopen already closed architecture work.

## Change discipline

- Prefer root-cause repair lanes over page-specific patches.
- Do not merge old Arena/trigger branches wholesale; extract only current-head-verified unique value.
- Do not add an open architecture item without a canonical ID registered in `docs/project-contract.json`.
- Update `docs/project-contract.json` whenever an authoritative runtime path or open-lane set changes.
- Update AuditRepo only after a repair wave is merged and verified on the resulting production head.
