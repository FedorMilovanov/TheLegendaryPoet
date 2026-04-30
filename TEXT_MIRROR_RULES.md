# TEXT_MIRROR_RULES.md

This project does not currently include a `TEXT_MIRROR/` folder or export script.

## Purpose

TEXT_MIRROR is only for exact restoration across Arena sessions when normal file transfer or web-fetch parsing becomes unreliable.

## Important Distinction

- Source architecture should stay clean and maintainable.
- TEXT_MIRROR packaging may split files into smaller chunks for transport.
- Do not force production source files to obey artificial transport limits.

## Suggested Packaging Limits

If a future script is added, use these as transport settings, not architecture rules:

- Prefer chunks under 150-220 lines for `.tsx` / `.ts` display in chat.
- Prefer chunks under 12-18 KB when files contain Cyrillic prose.
- Include a manifest with file path, chunk order, line ranges, and checksum if possible.

## Current Exact-Restore Risk

- `src/data/poets.ts` is now a thin aggregator.
- Poet data lives in `src/data/library/*.ts`.
- If exact restore is required, mirror the library folder with per-file chunks rather than merging data back into one file.
- Also mirror `src/components/community/` as separate files because the review system is now intentionally modular.