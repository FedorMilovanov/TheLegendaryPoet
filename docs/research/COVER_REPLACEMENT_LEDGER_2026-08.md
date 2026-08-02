# Approved cover replacement ledger — August 2026

## Scope

This ledger records the five images approved by the project owner for the current essay series. It does not itself move production files: image bytes, essay metadata, provenance records, validators, generated SEO output and Browser QA must change atomically.

## General production contract

- master inputs remain preserved outside the optimized production paths;
- production hero: 1280×720 WebP;
- card uses hero unless a separate crop is demonstrably better;
- all five generated/editorial scenes use `coverKind: reconstruction`;
- project-created reconstructions have no external `coverSourceUrl`;
- prompt/reference/approval records are preserved;
- exact SHA-256 is pinned where a strict publication validator exists;
- old production bytes remain recoverable in Git history;
- none of the five covers is historical evidence.

## Final HQ candidate set

The first compact encode pass was superseded by a higher-quality WebP pass after inspecting faces, dark gradients, hair, paper edges and broad tonal fields. The values below are canonical for the branch until a later visual comparison deliberately replaces them.

| Essay | Production target | Dimensions | Bytes | SHA-256 |
|---|---|---:|---:|---|
| Lermontov road | `public/images/essays/lermontov/lermontov-road-hero.webp` | 1280×720 | 98 178 | `3316e08c20179e75899b72da686299e8d5b70ed3b090e295081311c3e338496f` |
| Yesenin Part I | `public/images/essays/yesenin/yesenin-part-1-editorial.webp` | 1280×720 | 81 494 | `d666bbbf7a76200111b7c60fe06c703a518e1e83dfe0d5997feb1bb572f8a146` |
| Mayakovsky Part I | `public/images/essays/mayakovsky/mayakovsky-part-1-hero.webp` | 1280×720 | 89 742 | `aa3f997a812c5130e782830078abbff8cbdd594c1ddcfa29ef0f3dbe36399b61` |
| Mayakovsky Part II | `public/images/essays/mayakovsky/mayakovsky-part-2-hero.webp` | 1280×720 | 130 398 | `de1faac7d747a919c1f8f0b0468f4c8f6333f72b833b42d5ebd2697da0ab0b30` |
| Mayakovsky and the Briks | `public/images/essays/briks/brik-triangle-hero.webp` | 1280×720 | 111 850 | `f68ee5d38e6aedfff939bfb322a0dbe7df8ed65969d782129484177dde656533` |

All five now clear the generic 80 KB editorial-warning threshold without weakening the validator. File size is not treated as proof of quality; visual QA remains mandatory.

## 1. Lermontov road essay

**Approved scene:** Lermontov in officer-era clothing on a moonlit stone road under a star field, mountains in the distance.

```yaml
cover: "/images/essays/lermontov/lermontov-road-hero.webp"
cardCover: "/images/essays/lermontov/lermontov-road-hero.webp"
coverAlt: "Михаил Лермонтов на одинокой ночной дороге — редакционная кинематографическая реконструкция образного мира стихотворения"
coverKind: reconstruction
coverCredit: "THE LEGENDARY POET · редакционная реконструкция на основе портретного референса"
coverSourceUrl: null
```

**Editorial boundary:** the scene interprets the poem; it is not a photograph of a real route or a reconstruction of a documented episode.

## 2. Yesenin biography Part I

**Approved scene:** young Yesenin by birches and water, with a distant historical city silhouette; youth, rural roots and entry into literary life.

```yaml
cover: "/images/essays/yesenin/yesenin-part-1-editorial.webp"
cardCover: "/images/essays/yesenin/yesenin-part-1-editorial.webp"
coverAlt: "Молодой Сергей Есенин среди берёз у воды, на фоне далёкого города — редакционная реконструкция периода 1895–1921 годов"
coverKind: reconstruction
coverCredit: "THE LEGENDARY POET · редакционная реконструкция на основе предоставленных портретных референсов"
coverSourceUrl: null
```

**Atomic update required:**

- `yeseninPartOnePublic.ts`;
- `public/images/PROVENANCE.yml`;
- a dated cover audit;
- `scripts/validate-yesenin-part-one-safe-publication.ts` expected SHA;
- OG/prerender/browser checks.

The strict `0` in-body documentary-image contract remains unchanged until the separate visual-rights gate passes.

## 3. Mayakovsky biography Part I

**Approved scene:** young Mayakovsky in the yellow-and-black stage blouse, reading from manuscript pages before an audience.

```yaml
cover: "/images/essays/mayakovsky/mayakovsky-part-1-hero.webp"
cardCover: "/images/essays/mayakovsky/mayakovsky-part-1-hero.webp"
coverAlt: "Молодой Владимир Маяковский читает стихи со сцены в жёлто-чёрной футуристической кофте — редакционная реконструкция"
coverKind: reconstruction
coverCredit: "THE LEGENDARY POET · редакционная реконструкция на основе архивных портретных референсов"
coverSourceUrl: null
```

**Editorial boundary:** the image summarizes the public Futurist persona and is not presented as one exact documented performance.

## 4. Mayakovsky biography Part II

**Approved scene:** mature Mayakovsky in a dark suit against a layered urban, constructivist and prison-memory environment.

```yaml
cover: "/images/essays/mayakovsky/mayakovsky-part-2-hero.webp"
cardCover: "/images/essays/mayakovsky/mayakovsky-part-2-hero.webp"
coverAlt: "Зрелый Владимир Маяковский в тёмном костюме на фоне города и конструктивистской графики — редакционная реконструкция позднего периода"
coverKind: reconstruction
coverCredit: "THE LEGENDARY POET · редакционная реконструкция на основе архивных портретных референсов"
coverSourceUrl: null
```

**Atomic correction:** the current production cover is labelled as a restoration of Osip Brik’s 1928 portrait. After replacement, the old `restoration` kind, credit and Commons source must not survive.

## 5. Mayakovsky and the Briks

**Approved scene:** Osip Brik in the foreground, Lilya Brik in the centre and Mayakovsky reading a sheet in the background, unified black-and-white interior.

```yaml
cover: "/images/essays/briks/brik-triangle-hero.webp"
cardCover: "/images/essays/briks/brik-triangle-hero.webp"
coverAlt: "Осип Брик, Лиля Брик и Владимир Маяковский в напряжённой интерьерной композиции — редакционная реконструкция"
coverKind: reconstruction
coverCredit: "THE LEGENDARY POET · редакционная реконструкция на основе портретных референсов трёх участников"
coverSourceUrl: null
```

**Atomic correction:** replace the current archival Lilya Brik hero and remove the old Osip Brik archival credit/Commons cover source. Archive images remain inside the article with their own item-level metadata.

## Visual acceptance matrix

Before production replacement, compare every candidate at 1× and 2× DPR for:

- facial likeness and facial detail;
- dark-sky and dark-wall gradients;
- compression around hair, eyes, glasses, manuscript edges and coat contours;
- mobile crop;
- card crop;
- Open Graph rendering;
- LCP impact;
- visual distinction between the two Mayakovsky biography parts;
- no accidental implication that a reconstruction is an archive photograph.

## Production sequence

1. Verify exact branch/main heads.
2. Add all five binary assets without a metadata mismatch window.
3. Update essay cover metadata.
4. Update provenance and the dated cover audit.
5. Update pinned SHA validators.
6. Generate sitemap, feed and prerender output.
7. Run content, type, build and SEO tests.
8. Run article-catalog and image/lightbox Browser QA.
9. Inspect the preview manually on desktop, Android Chrome and iPhone Safari.
10. Merge only after visual approval and green required checks.
