# Approved transparent brand family

The only approved source family for the current THE LEGENDARY POET website implementation is stored in `qa/reference/approved-brand/` as exact base64-encoded transparent PNG bytes:

- `header-rgba.part00–02.b64` — one wide transparent PNG for the website header;
- `primary-rgba.part00–02.b64` — one transparent PNG for large emblem, hero and footer placements;
- `simplified-rgba.png.b64` — transparent PNG for medium navigation and card placements;
- `micro-rgba.png.b64` — transparent PNG for compact UI and favicon source.

Source id: `generated-transparent-rgba-family`.

The numbered text parts are transport fragments only. The materializer concatenates them in order and verifies the final PNG SHA-256 before writing any runtime asset. They are not separate visual variants.

These are the four transparent PNG variants generated and selected in the conversation for their specific site roles. They must be materialized byte-for-byte and must not be recreated by cropping, padding, recolouring or substituting another reference.

The former square `brand-emblem-canonical-reference.webp` source was the wrong implementation source and has been removed. It must not return as a runtime source, fallback or comparison authority. The rejected SVG and raster-atlas families must also remain absent.

Every exact-head visual review must show the built website itself: desktop header idle and hover, large/footer placement, mobile first viewport, and compact usage. Isolated optical matrices are supplemental only and never replace live-page evidence.

Technical green status does not grant visual approval. Keep the pull request draft until the user accepts the exact live-site screenshots.
