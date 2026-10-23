# Exact-source media recovery — 2026-10-24

## Authority, baseline and owner

Owner requested recovery of damaged images, not a silent artwork substitution.
Clean baseline: `26deca76d656025c04ae46d01c793971bd659103`.
Baseline project contracts, `npm ci`, `npm run check` and build passed; nevertheless
full ImageMagick decoding failed for four local WebPs (issue #519).
Root cause at the byte boundary: RIFF/VP8 lengths exceed stored data. The author
or tool responsible for truncation is not established. Hash identity is not a
decode certificate. The public media files remain the single delivery owner;
no runtime renderer, data model, captions or rights disposition changes here.

## Recovered exact photographic identities

The preserved forensic branch contains complete derivatives at commit
`909df9f73b8d9be6faa58cbee767603954e3fb17`:

| Current path under `public/images/essays/briks` | Archive path under `public/images/essays/archive` | Git blob | Bytes / dimensions | New SHA-256 |
| --- | --- | --- | --- | --- |
| `lilya-brik-1914.webp` | `lilya-brik-1914.webp` | `9f283bdc589f85662ae4b54a5e9a66bd052d5093` | 12758 / 300x423 | `520bc42aa0e8b5a0b02320fca4e80b3fceaaf33d630fa3ebababf4385d819a19` |
| `osip-brik-1928.webp` | `osip-brik-1928.webp` | `406a045facca8f224cf17fb0806f1a88800ae3ac` | 6848 / 300x436 | `5f802b2831ec99f01c036d662c8dee148b9f4a3b20e312187c9325db1dae4469` |

The archive's `src/data/essays/brikCaseVisual.ts` binds these exact files to the
same Commons source identities, captions and object positions as current Product:
- https://commons.wikimedia.org/wiki/File:Lilya_Brik_in_1914.jpg
- https://commons.wikimedia.org/wiki/File:Osip_Brik.jpg

Only these two binary objects were extracted through the GitHub blob API. No
archive branch was merged, no old runtime restored, and no search-result image
was substituted. The decoded source portraits were visually inspected. Existing
source attribution/public-domain disposition is preserved, not newly granted.
Resolution is the source's 300px width; no invented upscale/detail was added.

## Evidence for this bounded step

- Both recovered files: exact RIFF length and full ImageMagick decode PASS.
- Existing broken baseline: full ImageMagick decode FAIL for both portraits.
- New permanent cases in the existing CI-selected lightbox spec: desktop/mobile
  (1440x1000 / 390x844, explicit isMobile/hasTouch), dark/light, reduced motion.
  Inline dimensions, decode, lightbox, painted opacity, Escape/focus return,
  portrait request failures and pageerrors: 4/4 PASS, retries zero.
- Same test on broken baseline: FAIL on expected source dimensions (1135x1600
  versus 300x423). Chromium can accept partial WebP data, so native decode and
  naturalWidth alone MUST NOT replace structural/full-decoder checks.
- Browser: local Chromium 149.0.7827.0, locked Playwright 1.61.1; npm-delivered
  browser plus its bundled AL2023 NSS libraries. This is not exact CI build,
  native Safari evidence, production proof, or a whole-site image certificate.
- Local `npm run check` passes after restoration. Screenshots are ignored
  QA artifacts; a desktop dark lightbox screenshot was actually inspected.

## Remaining boundary and rollback

The approved Yesenin II desk-portrait original is still missing. The archive
predates that artwork and cannot recover it. Do not alter its pinned hash or
replace its art without an explicit owner decision. Unreferenced damaged
`brik-archive-hero.webp` also needs separate disposition. #519 is NOT closed.
The global image-integrity gate and full release/browser acceptance remain pending.
Rollback this step by reverting only the two binaries and added QA cases; current
article data, attribution and existing tests are unchanged. No production deploy
or AuditRepo closure has been performed.
