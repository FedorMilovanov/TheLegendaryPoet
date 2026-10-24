# Exact-source media recovery — 2026-10-24

## Authority, baseline and owner

Owner requested recovery of damaged images, not a silent artwork substitution.
Clean baseline: `26deca76d656025c04ae46d01c793971bd659103`.
Baseline project contracts, `npm ci`, `npm run check` and build passed; nevertheless
full ImageMagick decoding failed for four local WebPs (issue #519).
Root cause at the byte boundary: RIFF/VP8 lengths exceed stored data. The author
or tool responsible for truncation is not established. Hash identity is not a
decode certificate. The public media files remain the single delivery owner;
no article prose or rights disposition is changed. Shared mobile hero credit
layout is repaired below; no page-specific renderer is introduced.

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

## Owner-selected NEW Yesenin artwork (not recovered original)

The owner explicitly authorized reference-based cinematic replacement and chose
candidate **2 of 2** in the image tool on 2026-10-24. No further generation was
used. The lost approved desk-portrait original remains unrecovered; these new
bytes and their intentional hash-pin update must not be described as recovery.

Actual photographic face reference, visually inspected before generation:
https://commons.wikimedia.org/wiki/File:Esenin1925.jpg (public-domain metadata).
The preserved archive's `yeseninVisual.ts` binds that identity to
`public/images/essays/archive/yesenin-1925.webp`, Git blob
`ed93eb747a723f9b3732069bfac6aaf5f1518b2d`, 85402 bytes, 1469x2000,
SHA-256 `04d0288683c4591076c19de10201104eb2247e98800b60ba629a8bcb62b990ae`.
The generated desk setting is imagined, not a photograph or documented event.
Existing reconstruction label and editorial credit remain visible.

- Full-resolution selected source: `qa/reference/approved-essay-art/yesenin-part-two-20261024.webp`,
  lossless WebP, 2048x1152, SHA-256
  `f8b68841e699eff950e9c52cb93728c204d701e01306785ca453457772e87040`.
  Its decoded RGB pixels exactly match the selected tool PNG (RGB SHA-256
  `ab87b7aa85a3508c35d4d9f8629104b0f7410f7fcb1c2e0389de301a45f78a9e`).
- Runtime derivative: `public/images/essays/yesenin/yesenin-part-2-editorial.webp`,
  1920x1080, quality 88, 98830 bytes, SHA-256
  `27b4a98829cd76fa101a68f39b2c836de330940ef795a093ad9d071366e21ddb`.
- Both publication-validator pins intentionally updated. Publication modification
  date is 2026-10-24; sitemap, manifest and Atom regenerated. Atom entry moved
  to the top because it now has the newest modification date (not new prose).

## Shared ownership and unused damaged asset

No source references to `brik-archive-hero.webp` were found. Remove the unused,
truncated file rather than falsely substitute an unapproved historical scene;
old blob `aa2dc424fab5836d79f916a06f6d38988452938b` remains recoverable in Git.
Shared `EssayHero` owns credit placement: below the image under 640px, existing
absolute placement on desktop. Mobile screenshots exposed credit badges masking
most of the face. The fix applies to all essay heroes; QA asserts non-overlap.

`validate:images` is the single repository-wide public raster guard, in both
`check` and `prebuild`: exact WebP RIFF/chunk boundaries AND a full pixel decode.
Prefer FFmpeg, otherwise ImageMagick; missing decoder or empty scan fails closed.
No dependencies, thresholds, existing tests or CI jobs were removed/weakened.
Eight regression cases include consistent-length corrupt pixels and unavailable
decoder. The new structural check rejects all FOUR baseline damaged files.

## Final local production evidence

- 52/52 public raster files and 52/52 built raster files: container + complete
  ImageMagick decode PASS. Independent FFmpeg 7.0.2 pass: 52/52 public files.
  Preserved lossless source also fully decoded. Node tests 50/50 (8 new), TS
  draft tests 4/4; contracts, check, build, budgets and prerender/SEO PASS:
  31 canonical URLs, 5 aliases, 40 HTML. No budget increase.
- Production Chromium suite: 9/9 PASS, zero retries, 59.9s. Four theme/viewport
  cases each for Brik inline/lightbox and Yesenin hero/catalog, plus overlay
  ownership. Actual 1920x1080 decode, painted ancestor opacity >= .99 and mobile
  credit/image non-overlap. Desktop hero, mobile hero/card visually inspected.
- Independent production probe: 12 route/theme/viewport combinations across
  Brik, Yesenin II and articles. No visible broken images, horizontal overflow
  or JS pageerrors; six loaded fonts per case. Local unthrottled samples only:
  LCP 380–892ms, max CLS 0.000969 (not a field-performance certificate).
- Raw browser scan: all 52 public raster URLs returned HTTP 200, exact source
  bytes and successful native decode, one image at a time. Initial simultaneous
  52-image harness rejected 9 decodes; individual byte-identity checks succeeded
  for all 9, then bounded sequential scan passed 52/52. Cause of concurrent
  harness rejects is unproven; its negative report is retained, not hidden.
- axe-core 4.11 WCAG A/AA probe: Yesenin II zero violations in all four cases.
  Brik reports 11 dark / 17 light contrast nodes; articles reports 6 dark, 0
  desktop light / 1 mobile light. Incomplete checks remain (1–2 per page).
  **Whole-site accessibility is NOT closed by this media repair.**
- Three external Commons redirect images failed sandbox delivery; local restored
  portraits passed. External delivery is `skipped: sandbox egress`, not proof
  of broken source bytes. No JS errors; console errors were external requests.
- Evidence in ignored `qa-artifacts/media-recovery/`: results screenshots,
  production-browser.log, probe.json, initial-concurrent-probe.json,
  sequential-raster-probe.json and final check/build/budget/SEO logs.
  An initial parallel check/build raced the shared brand materializer; changed
  modification date also required discovery regeneration. Sequential corrected
  runs passed. Do not run those mutating preparation commands in parallel.

## Remaining boundary and rollback

This is local production-build evidence, NOT native Safari, deployed-site or
exact GitHub CI browser evidence. Remote exact-head CI is reported in PR #521,
not asserted here before execution. #519 stays open; no merge/deploy authorized.
Rollback is a bounded revert of this PR's binaries, pins, date/discovery, guard
and QA/shared credit-layout changes; no article prose or archived runtime was
imported. Recover deleted unused bytes from Git if needed, not from new imagery.
