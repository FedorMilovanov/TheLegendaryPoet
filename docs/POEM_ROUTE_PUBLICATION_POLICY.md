# Poem route identity and publication policy — TLP-SEO-001

This is the standalone-page admission contract, not a second literary corpus. Authored text, author, title, analysis, sources, music links and dates still live in `src/data/library/index.ts` and its author modules. `src/data/poem-route-policy.json` owns only permanent URL slugs and item-specific review decisions; it never copies prose.

- Existing work IDs and `#poem-{id}` anchors remain unchanged. A slug is assigned once, not recomputed from a revised title. Future renames require explicit redirect/alias review.
- Current baseline: 82 assigned slugs, 16 authors. Five existing partial-text records have explicit excerpt HOLD; all other works await individual scope, edition and rights review. The absence of a review never implies permission. A new poem without a slug is explicitly held, without breaking its existing author page.
- A standalone approval must name full/excerpt scope, evidence, rights basis, review date, and SHA-256 of exact text + epigraph. This is a machine gate, not proof that a legal or scholarly review actually occurred. Review evidence must be examined before approval. No approval is granted by this change.
- Candidate paths are internal planning values only; no routing, sitemap, IndexNow, prerender, or user-facing links are activated yet. When route implementation arrives, consume only eligible records and preserve excerpt labels and legacy links. The existing public author cards are unchanged.
- The winter Yesenin poem remains in #628 until independently accepted; do not preallocate a public URL for an unmerged work. Later assign its stable slug in this same lane.

The build-time generator validates the policy against the full canonical catalog. Unit fixtures cover identity, collision, orphan/unsafe slug, explicit excerpt semantics, stale text/epigraph approval and new-work HOLD. Exact-head hosted checks still required.

## Reading body foundation

`src/lib/poemPageModel.ts` projects an eligible catalog row into the same typed model for eventual static and hydrated rendering. `src/components/poet-detail/PoemReadingBody.tsx` renders one semantic H1 and one visible canonical verse block, actual source, editorial analysis, optional edition and Christian perspective, published explicit music links, and adjacent works with legacy-anchor fallback. No duplicate hand-written HTML renderer, global corpus import, synthetic dates, ratings or generic SEO prose. Held rows produce no standalone model. Fixture-only React static-render tests run in the existing discovery gate. This is not an active route or an integrated interactive Reader; do not advertise URLs until source/rights review, route registration, actual static output, hydration parity and visual/browser certification are complete.

## Static document pipeline

The existing `scripts/prerender-og.mjs` now calls the shared React body renderer for approved poem pages. It uses the same canonical head renderer and writes one visible semantic document into the existing application root before JavaScript. It rejects any nonempty or ambiguous root marker. An approval alone cannot emit a URL: the runtime contract and exact ready discovery inventory must also agree with the approved set. Empty approved set emits no new routes. This is static HTML, not yet an implemented React hydration strategy; direct-entry/SPA parity and no flicker require the subsequent runtime slice. Existing global prerender fingerprint authority stays intact; regenerate discovery artifacts against the exact candidate before merge.

## Browser route transport

The lazy `poem-detail` route uses a generated allowlist derived only from individually approved rows and a single per-page JSON projection of the same view model used by the static renderer. Unknown and held paths render the existing NotFound component without fetching payloads. An approved URL with an unavailable or mismatched payload is a deployment error, not a silent 404. The prebuild/predev generator validates exact discovery admission before writing. The sitemap includes only approved pages and fingerprints their model, body, static renderer and payload validator. Zero approved rows currently means zero public poem URLs, zero payloads and an empty allowlist. Runtime route and initial static body are connected to the shared component; preserving the direct-entry body during client startup, interactive controls and real pilot browser/visual acceptance remain separate gates.
