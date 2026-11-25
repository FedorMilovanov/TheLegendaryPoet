# Poem route identity and publication policy — TLP-SEO-001

This is the standalone-page admission contract, not a second literary corpus. Authored text, author, title, analysis, sources, music links and dates still live in `src/data/library/index.ts` and its author modules. `src/data/poem-route-policy.json` owns only permanent URL slugs and item-specific review decisions; it never copies prose.

- Existing work IDs and `#poem-{id}` anchors remain unchanged. A slug is assigned once, not recomputed from a revised title. Future renames require explicit redirect/alias review.
- Current baseline: 82 assigned slugs, 16 authors. Five existing partial-text records have explicit excerpt HOLD; all other works await individual scope, edition and rights review. The absence of a review never implies permission. A new poem without a slug is explicitly held, without breaking its existing author page.
- A standalone approval must name full/excerpt scope, evidence, rights basis, review date, and SHA-256 of exact text + epigraph. This is a machine gate, not proof that a legal or scholarly review actually occurred. Review evidence must be examined before approval. No approval is granted by this change.
- Candidate paths are internal planning values only; no routing, sitemap, IndexNow, prerender, or user-facing links are activated yet. When route implementation arrives, consume only eligible records and preserve excerpt labels and legacy links. The existing public author cards are unchanged.
- The winter Yesenin poem remains in #628 until independently accepted; do not preallocate a public URL for an unmerged work. Later assign its stable slug in this same lane.

The build-time generator validates the policy against the full canonical catalog. Unit fixtures cover identity, collision, orphan/unsafe slug, explicit excerpt semantics, stale text/epigraph approval and new-work HOLD. Exact-head hosted checks still required.
