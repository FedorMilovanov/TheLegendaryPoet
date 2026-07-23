# Stable citation block IDs

Inline source markers for the three legacy Mayakovsky/Brik longreads must never depend on the literal beginning of a paragraph.

## Contract

- Every migrated citation rule owns a lowercase-kebab `blockId`.
- The final `EssayBlock` receives that `id` before bibliography IDs are attached.
- Citation attachment reads only `block.id -> sourceIds`; `startsWith` matching is forbidden.
- A rule identifies its block through a semantic section boundary and prose position. Only `lead`, `paragraph`, and `note` blocks count as prose; images, poems, voices, pullquotes, headings, and dividers do not.
- Each rule also declares the expected final prose count for its section and the expected block type. A prose insertion/deletion or type change therefore raises `topology drift` instead of silently moving a citation to a neighbouring claim.

## Validation

`npm run validate:citations` verifies:

1. block ID format and uniqueness;
2. source ID/alias format and uniqueness;
3. absence of orphan citation rules;
4. exact `blockId -> sourceIds` equality in the final assembled essay;
5. minimum migrated coverage: 10 early Mayakovsky blocks, 10 late Mayakovsky blocks, and 9 Brik blocks.

The late Mayakovsky essay is assembled from a bridge, documentary insertions, and the original movement. Its `1930: несколько кризисов сразу` section currently contains nine prose blocks; the original crisis and death claims occupy final positions 5 and 8. These positions are intentionally validated against the final assembled essay, not against an intermediate source array.

## Editing rule

Wording inside an identified block may change without changing its ID. Structural edits inside a guarded section require an intentional update of the topology declaration and a full citation/Playwright/build run. Never restore a text-prefix fallback to make CI pass.
