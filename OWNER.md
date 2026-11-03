# Editorial ownership, source provenance and rights

**Project owner and editor-in-chief:** [Fedor Milovanov](https://github.com/FedorMilovanov), as declared in [PROJECT_CHARTER.md](PROJECT_CHARTER.md). THE LEGENDARY POET is a Russian literary and historical editorial project with an expressly evangelical Christian perspective. Its technical platform is developed with human-directed AI-assisted tools; repository ownership does not mean that every line, archival discovery, image or publication is a wholly manual original work.

## Distinct responsibilities

- **Editorial judgment:** The owner controls article selection, source review, historical interpretation, literary analysis and the project's explicit scriptural evaluation. Faith-based editorial positions remain distinguishable from the historical facts and witnesses they discuss. Their boundaries are in [docs/EDITORIAL_JUDGMENT_AND_SOURCE_POLICY.md](docs/EDITORIAL_JUDGMENT_AND_SOURCE_POLICY.md) and [docs/HISTORICAL_NARRATIVE_STANDARD.md](docs/HISTORICAL_NARRATIVE_STANDARD.md).
- **Engineering:** The maintainer directs the React/Vite frontend, source/route contracts, Cloudflare Worker/D1 community boundary, CI, browser verification and release decisions. AI-assisted engineering remains subject to human editorial and release acceptance.
- **Historical primary works:** Poems, letters, photographs, manuscripts, manuscripts' scans and texts of literary criticism retain their actual authorship, documentary provenance and applicable rights. Copyright or public-domain status is **jurisdiction-, work- and edition-specific**; publication on this site or inclusion in a repository does not itself grant redistribution rights.
- **New images, music, voices and clips:** Original commissioned works, AI-assisted images, generated audio and film sequences are separate from archival records. An AI depiction cannot authenticate what a poet looked like on a particular date. Model/provider rights, licensed music, voice and third-party assets require specific provenance and approval under [docs/RELEASE_POLICY.md](docs/RELEASE_POLICY.md) and the relevant editorial/media contracts.
- **Community input:** Ratings and comments via the Worker are user-generated data, not the editor's scholarly findings. They cannot silently replace source-backed biographies or moral conclusions. The trusted backend boundary is [workers/community-api/README.md](workers/community-api/README.md).

## Authority and licensing

| Concern | Existing source of truth |
|---|---|
| Owner, purpose and editorial position | [PROJECT_CHARTER.md](PROJECT_CHARTER.md) |
| Current technical status | [docs/CURRENT_STATE.md](docs/CURRENT_STATE.md) |
| Machine-checked routes, sources and governance | [docs/project-contract.json](docs/project-contract.json) |
| Repository's private source/release and `UNLICENSED` status | [docs/RELEASE_POLICY.md](docs/RELEASE_POLICY.md) |
| Human/AI editor and archival-source responsibilities | [docs/EDITORIAL_JUDGMENT_AND_SOURCE_POLICY.md](docs/EDITORIAL_JUDGMENT_AND_SOURCE_POLICY.md) |
| Responsible security disclosure | [SECURITY.md](SECURITY.md) |
| Verifiable technical case and limits | [CASE_STUDY.md](CASE_STUDY.md) |

**No new license is granted by this document.** The repository declares a private package and `UNLICENSED` governance. That designation should not be silently substituted with an MIT or blanket all-rights-reserved statement for every underlying third-party asset. No claims about readership, revenue, complete rights clearance or independent authorship are implied.
