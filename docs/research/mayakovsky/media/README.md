# Mayakovsky verified media provenance

This directory is the canonical extraction of durable media evidence rescued from the deeply diverged `work/local-images-playwright-wtoc` branch.

## Authority boundaries

- `pr77-commons-original-provenance-ledger-2026-07-24.md` proves acquisition identity and hashes for 30 Commons originals. It does **not** authorize all 30 for publication.
- `pr77-editorial-decisions-2026-07-24.json` is the machine-readable editorial decision set.
- `pr77-accepted-active-media-2026-07-24.md` records the two independently verified production captions: `mayakovsky-1914` and `mayakovsky-1928-osip`.
- The remaining 28 candidates stay unresolved and must not be promoted by analogy, filename or Commons caption alone.

Reader-facing application of accepted metadata is centralized in `src/data/essays/verifiedEssayMedia.ts`. The publication boundary verifies that every accepted record resolves exactly one archive image and that weaker pre-verification metadata cannot silently return.

This directory preserves evidence, not image rights advice. Unknown creator, date or location fields remain unknown until an explicit owner-approved decision backed by stronger evidence.
