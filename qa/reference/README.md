# One approved transparent brand emblem

The only approved visual source for the current THE LEGENDARY POET website is the exact transparent image selected by the user in the conversation.

It is stored byte-for-byte as 25 transport fragments in `qa/reference/approved-brand/final-reference.part00.b64` through `final-reference.part24.b64`. The materializer concatenates them in numeric order and verifies SHA-256 `898cf6bd0321f6f48ed12971f49803f7ed6758961f51e06628f0da2ffd50ff17` before producing runtime assets.

There is one emblem, not a family of redesigned variants:

- header — the same `/brand-emblem.png`;
- footer and large placements — the same `/brand-emblem.png`;
- cards and compact controls — the same `/brand-emblem.png`;
- favicon and platform icons — derived only from that same source.

The image must not be redrawn, widened, cropped into a special header composition, recoloured, substituted, or regenerated. Size changes are performed only by proportional `object-fit: contain` rendering or deterministic icon scaling.

The former wide header, primary, simplified and micro source families are retired. The old square WebP, rejected SVG candidates and raster atlases must not return as sources, fallbacks or comparison authorities.

Every visual review must show the built website itself: desktop header idle and hover, footer, mobile first viewport and compact usage. Technical green status does not replace the user's visual approval; keep the pull request draft until the exact live-site screenshots are accepted.
