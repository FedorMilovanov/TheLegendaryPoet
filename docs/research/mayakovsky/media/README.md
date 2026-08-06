# Mayakovsky verified media provenance

This directory contains the durable media evidence and completed editorial decisions for the Mayakovsky image set.

## Authority boundaries

- `pr77-commons-original-provenance-ledger-2026-07-24.md` proves acquisition identity and hashes for 30 Commons originals; it does not authorize publication by itself.
- `pr77-editorial-decisions-2026-07-24.json` is the machine-readable final decision set.
- `pr77-accepted-active-media-2026-07-24.md` explains the accepted active records, verified reserve and explicit exclusions.
- `src/data/essays/verifiedEssayMedia.ts` applies accepted active metadata to exactly one current archive block per record.

## Final state

- exact originals acquired and hash-verified: `30/30`;
- accepted active: `5` — `C03`, `C08`, `C10`, `C11`, `C16`;
- verified reserve: `1` — `C15`;
- explicitly excluded from current publication: `24`;
- unresolved candidates: `0`;
- new image binaries introduced by the final decision batch: `0`.

An exclusion is a completed editorial disposition under the current evidence and product scope. A candidate should be reopened only when materially new primary evidence, permission or a changed editorial need appears.

The publication boundary verifies that every accepted active record resolves exactly one archive image and that weaker pre-verification metadata cannot silently return. Unknown creator, date or location fields remain unknown unless an explicit accepted record states otherwise.
