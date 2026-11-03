# Case study: an evidence-aware literary platform with a verified publishing boundary

## Problem

A literary reference site needs more than attractive pages. Canonical poetry, poet biographies, large historical essays, documented interpretations, original artwork, streaming music and reader/community features must remain consistent across source data, routes, generated HTML, SEO, browser behavior and actual deployment.

A model-generated quotation, archived photo, historical reconstruction or community comment must not automatically become documentary evidence. The editorial mission also includes an explicit biblical perspective, which must be clear to readers without rewriting historical facts as unsupported theological conclusions.

## Implementation and controls

- **One route/runtime authority.** [src/routes/route-contract.json](src/routes/route-contract.json) owns the machine-readable route/redirect/sitemap/QA contract. [src/routes/routeModules.ts](src/routes/routeModules.ts) provides lazy runtime loading; duplicate hard-coded route registries are forbidden.
- **One public longform model.** [src/data/essays/index.ts](src/data/essays/index.ts) owns large published essays, while [src/data/library/index.ts](src/data/library/index.ts) owns poet records. The [current state](docs/CURRENT_STATE.md) records immutable essay publication and ten canonical poet records; this is a source snapshot, not evidence of current traffic or indexing.
- **Source-based editorial QA.** [PROJECT_CHARTER.md](PROJECT_CHARTER.md) and [docs/EDITORIAL_JUDGMENT_AND_SOURCE_POLICY.md](docs/EDITORIAL_JUDGMENT_AND_SOURCE_POLICY.md) distinguish attested text, historical source, interpretation and scriptural evaluation. Claims without witnesses or unresolved rights must not be silently promoted into documentary authority.
- **Trust-boundary separation.** [workers/community-api/README.md](workers/community-api/README.md) documents the Cloudflare Worker/D1/Turnstile server boundary for ratings and comments; the static client receives no private HMAC or Turnstile secret.
- **Generated identity and brand assets.** [scripts/materialize-brand-art.mjs](scripts/materialize-brand-art.mjs) materializes approved brand source bytes, with [src/components/SpectralBrandMark.tsx](src/components/SpectralBrandMark.tsx) as the current runtime. Historical brand drafts do not own production.
- **Exact release and licensing gates.** [docs/project-contract.json](docs/project-contract.json), [docs/RELEASE_POLICY.md](docs/RELEASE_POLICY.md) and the CI workflows enforce private package identity, `UNLICENSED` disposition, Node 24 baseline, release SHA, browser and publication checks. They do not certify rights to all underlying historical assets.

## Reproducible engineering check

In a development checkout with Node 24 (see [.nvmrc](.nvmrc)):

```sh
npm ci
node scripts/validate-project-contracts.mjs
npm run check
npm run build
```

For the relevant change, separately inspect the workflow-provided prerender, image, media, reader certification and deployment controls. A green source build **does not prove** the current public release SHA or that all literary/source/editorial claims are correct.

## Outcome and limits

**Verifiable from this repository:** structured canonical essay/poet sources, unified route authority, immutable publication checks, source and editorial contracts, a separate protected community API, reproducible brand source and exact-release verification machinery.

**Not proven by the repository alone:** complete independent validation of every archival statement, worldwide public-domain status of every work, live availability of every external audio source, all music/media rights, audience size, commercial income, search rankings or a current production deployment.

The project is edited and maintained by Fedor Milovanov with AI-assisted tooling under human oversight. See [OWNER.md](OWNER.md) for provenance and rights and [SECURITY.md](SECURITY.md) for private vulnerability reporting.
