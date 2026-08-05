# Release and licensing policy

This document is the source-repository authority for package identity, supported runtime, production promotion and licensing status.

## Package identity

- npm package name: `the-legendary-poet`;
- package version: `0.0.0-private`;
- package is private and must not be published to npm;
- repository: `FedorMilovanov/TheLegendaryPoet`;
- canonical production site: `https://thelegendarypoet.ru`.

The version is intentionally non-release metadata for a private web application. It must not be presented as a public semantic product release.

## Runtime support

- minimum supported Node version: `22.22.0`;
- supported major range: Node 22.22 through Node 24;
- CI and `.nvmrc` use Node 24 as the recommended reproducible baseline;
- `package.json`, `package-lock.json`, `.nvmrc` and `docs/project-contract.json` must remain machine-checked for identity and runtime parity.

## Production authority

A production release is identified by the exact commit SHA on source `main`, not by the private npm version.

Promotion requires:

1. one unchanged exact PR head;
2. all required repository checks successful for that head;
3. no unresolved review threads;
4. current-main comparison with `behind=0` immediately before merge;
5. expected-head-protected squash merge;
6. post-merge verification of the resulting `main` SHA;
7. AuditRepo evidence updated only after source promotion.

GitHub Pages or another deployment may publish only a verified `main` commit. A successful deployment does not retroactively validate an unverified source head.

## Licensing status

The repository and package are `UNLICENSED`.

This means no public-source licence or redistribution grant is provided by the package metadata. It does not override third-party licences attached to individual fonts, images, audio, source documents or other assets; those retain their own provenance and rights requirements.

Changing `UNLICENSED`, publishing the package, creating public release tags or granting redistribution rights requires an explicit owner-approved governance PR. An agent must not infer an MIT, Apache, GPL, Creative Commons or other licence from repository visibility, historical files or third-party asset metadata.

## Change control

The project-contract validator must reject:

- a generic or different package name;
- a public package flag;
- a version other than the registered private version;
- package/lockfile identity drift;
- a missing or different `UNLICENSED` disposition;
- an engine range that conflicts with the runtime contract;
- removal of this document from the authoritative documentation registry.
