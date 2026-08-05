# Current project state

This file is the source-repository entry point for the **current architecture**. Technical route, branch, brand and deployment statements in `PROJECT_CHARTER.md` are historical where they conflict with this file; its editorial mission remains authoritative. Exact verified production SHAs and closed repair evidence are owned by `FedorMilovanov/AuditRepo/projects/the-legendary-poet/`; they are intentionally not duplicated here.

## Production contract

- Canonical site: `https://thelegendarypoet.ru`.
- Deployment base: `/` on the custom domain.
- Runtime: React 19, direct `react-router`, Vite 7. Node 24 is the CI and `.nvmrc` baseline; React Router 8 requires Node 22.22.0 or newer.
- Live lazy route registry: `src/routes/routeModules.ts`.
- Public longform model: `Essay`, catalogued by `src/data/essays/index.ts` and rendered at `/essays/:slug`.
- Poet catalog: `src/data/library/index.ts`.
- Brand runtime: `src/components/SpectralBrandMark.tsx`; approved source parts live in `qa/reference/approved-brand/` and are materialized by `scripts/materialize-brand-art.mjs`.
- Fonts are self-hosted WOFF2 assets under `src/assets/fonts/`.

The machine-readable counterpart is `docs/project-contract.json`; `node scripts/validate-project-contracts.mjs` blocks drift between documentation, workflows and live paths.

## Current quality gates

The dependency-free `Project contracts` workflow runs the project-contract and UTC-day validators on every PR and `main` push. `npm run check` continues to validate content, brand, app shell, interaction runtime, routes and TypeScript; production build/prerender/browser workflows remain separate final gates.

## Known systemic debt after the verified marathon repair

These are **open architecture lanes**, not permission for arbitrary local patches:

1. **Legacy article residue.** The old `Article`/`Poet.articles` data model remains beside the live `Essay` model although its pages/components were removed. Migrate any valuable text, then remove the dead schema and exports in one atomic lane.
2. **Mutable essay composition.** `src/data/essays/index.ts` mutates imported essay objects and computes reading time in place. Replace layered post-import mutation with an immutable essay builder.
3. **Community scaling.** The app currently hydrates the complete public ratings/comments corpus globally. Move to target-scoped, on-demand reads plus server-side aggregates and paginated comments.
4. **Workflow consolidation.** Fourteen workflows repeat dependency/browser setup. Introduce reusable workflow primitives only after preserving exact acceptance coverage.
5. **Historical documentation.** `audit/index.html`, `COMPONENT_BLUEPRINTS.md` and `TRANSFER.md` are retained as historical snapshots and must not be treated as current implementation instructions.
6. **Package/repository identity.** The generic package name/version and missing explicit engine/license policy require a dedicated release-governance decision. Do not invent a public license or semantic release version inside an unrelated repair lane.
7. **Repository license.** Public-source licensing remains an explicit owner decision; no agent may invent or apply a license.

## Change discipline

- Prefer root-cause repair lanes over page-specific patches.
- Do not merge old Arena/trigger branches wholesale; extract only current-head-verified unique value.
- Update `docs/project-contract.json` whenever an authoritative runtime path changes.
- Update AuditRepo after a repair wave is merged and verified on the resulting production head.
