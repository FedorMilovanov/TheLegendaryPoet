# Repository agent rules

These rules apply to every human, coding agent and autonomous marathon working in this repository.

## Read current truth first

Before changing code, read:

1. `docs/CURRENT_STATE.md`;
2. `docs/project-contract.json`;
3. `PROJECT_CHARTER.md`;
4. the current The Legendary Poet project entry in AuditRepo.

Run `node scripts/validate-project-contracts.mjs` before and after architectural changes. A path, branch or document from an old audit is not current truth merely because it still exists.

## Branch and concurrency discipline

- Do not work directly in another agent's branch.
- Start from current `main` and use one clearly named repair lane per root cause.
- Never merge Arena, trigger or deeply diverged work branches wholesale. Extract only unique value that is independently reverified on current HEAD.
- Before opening or merging a PR, re-check open PRs and the source `main` SHA.
- Temporary workflows, markers, QA output and transport code must not survive in production.
- Exact SHA evidence and closure belong in AuditRepo after the source repair is merged.

## Systemic repair rule

Prefer one shared contract, renderer, registry, store or validator over repeated page-specific patches. A repair proposal must state:

- root cause;
- all affected routes/data surfaces;
- the single owning layer;
- migration and rollback boundaries;
- source/build/browser evidence required for closure.

## Brand authority

The production brand is the owner-approved single transparent reference reconstructed from:

`qa/reference/approved-brand/final-reference.part*.b64`

Its integrity is pinned in `scripts/materialize-brand-art.mjs`. Production outputs are generated, not hand-edited:

- runtime component: `src/components/SpectralBrandMark.tsx`;
- motion controller: `src/components/brandMotionFrameInvariant.ts`;
- materializer: `scripts/materialize-brand-art.mjs`;
- generated main asset: `public/brand-emblem.png`;
- release marker: `public/brand-release.txt`.

Retired SVG-era files such as `BrandMark.tsx`, `brand-emblem.svg`, micro/mask SVGs and v17/v18 artistic candidates are not production authority. Never recreate them to satisfy stale documentation.

Brand changes require source-integrity validation, materialization, static brand gates and exact-head Browser QA. Green CI proves technical integrity, not visual approval.

## Editorial and source discipline

Never strengthen a historical, moral or theological claim beyond its evidence. Preserve source hierarchy, uncertainty and conflicts of interest. Follow the charter and editorial standards referenced by `README.md`.

## Hard stops

Stop and re-scope instead of pushing when:

- the source branch advanced and the patch was not rebased/reverified;
- a change duplicates an existing live engine or registry;
- an old document contradicts `docs/project-contract.json`;
- a test is weakened merely to make CI green;
- a page-specific patch leaves the same root cause active elsewhere;
- a proposed license, rights claim or production credential lacks explicit owner authority.
