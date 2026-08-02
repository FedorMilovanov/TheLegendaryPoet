# Approved cover replacement ledger — August 2026

## Scope

This ledger records the five images approved in the conversation for the current essay series. It does not itself move production files; image bytes, provenance records, validators and Browser QA must change atomically.

## General production contract

- master input is preserved outside the optimized production path;
- production hero: 1280×720 WebP;
- card uses hero unless a separate crop is demonstrably better;
- `coverKind: reconstruction` for all five generated/editorial scenes;
- `coverCredit: THE LEGENDARY POET · редакционная реконструкция на основе предоставленных портретных референсов`;
- no external `coverSourceUrl` for a project-created reconstruction;
- prompt/reference/approval record is preserved;
- exact SHA-256 is pinned where an article has a strict publication validator;
- old production bytes remain recoverable in Git history;
- no visual is treated as archival evidence.

## 1. Lermontov road essay

**Approved scene:** Lermontov in officer-era clothing on a moonlit stone road under a star field, mountains in the distance.

**Target:**

```text
public/images/essays/lermontov/lermontov-road-hero.webp
```

**Prepared production candidate:**

- dimensions: 1280×720;
- bytes: 62 682;
- SHA-256: `472164d39875a034a93dada4695311f7f6daa0d411cfc1334ad22d0a891e74a0`.

**Metadata:**

```yaml
coverAlt: "Михаил Лермонтов на одинокой ночной дороге — редакционная кинематографическая реконструкция образного мира стихотворения"
coverKind: reconstruction
coverCredit: "THE LEGENDARY POET · редакционная реконструкция на основе портретного референса"
```

**Editorial boundary:** the scene interprets the poem; it is not a photograph of a real route or a reconstruction of a documented episode.

## 2. Yesenin biography Part I

**Approved scene:** young Yesenin by birches and water, with a distant historical city silhouette; youth, rural roots and entry into literary life.

**Target:**

```text
public/images/essays/yesenin/yesenin-part-1-editorial.webp
```

**Prepared production candidate:**

- dimensions: 1280×720;
- bytes: 55 598;
- SHA-256: `6811e9e7dd9673dc8fd4ff484c09f2f9f82303fd002cd7198a1b81f83b8f1a13`.

**Metadata:**

```yaml
coverAlt: "Молодой Сергей Есенин среди берёз у воды, на фоне далёкого города — редакционная реконструкция периода 1895–1921 годов"
coverKind: reconstruction
coverCredit: "THE LEGENDARY POET · редакционная реконструкция на основе предоставленных портретных референсов"
```

**Atomic update required:**

- `yeseninPartOnePublic.ts`;
- `public/images/PROVENANCE.yml`;
- `docs/ESSAY_COVER_AUDIT_2026-07-26.md` or a dated successor;
- `scripts/validate-yesenin-part-one-safe-publication.ts` expected SHA;
- OG/prerender/browser checks.

## 3. Mayakovsky biography Part I

**Approved scene:** young Mayakovsky in the yellow-and-black stage blouse, reading from manuscript pages before an audience.

**Target:**

```text
public/images/essays/mayakovsky/mayakovsky-part-1-hero.webp
```

**Prepared production candidate:**

- dimensions: 1280×720;
- bytes: 48 852;
- SHA-256: `7557a5f566a9e89150668520a0bc6dfeda1b80046e6db65db392c67c9bb0f5b0`.

**Metadata:**

```yaml
coverAlt: "Молодой Владимир Маяковский читает стихи со сцены в жёлто-чёрной футуристической кофте — редакционная реконструкция"
coverKind: reconstruction
coverCredit: "THE LEGENDARY POET · редакционная реконструкция на основе архивных портретных референсов"
```

**Editorial boundary:** the image summarizes the public Futurist persona and is not presented as a reconstruction of one exact documented performance.

## 4. Mayakovsky biography Part II

**Approved scene:** mature Mayakovsky in a dark suit against a layered urban, constructivist and prison-memory environment.

**Target:**

```text
public/images/essays/mayakovsky/mayakovsky-part-2-hero.webp
```

**Prepared production candidate:**

- dimensions: 1280×720;
- bytes: 84 500;
- SHA-256: `02bf5e05aa0bc1bd499c4203f68b925adfea486cf73afafc5eaf3d5b9c8704de`.

**Metadata:**

```yaml
coverAlt: "Зрелый Владимир Маяковский в тёмном костюме на фоне города и конструктивистской графики — редакционная реконструкция позднего периода"
coverKind: reconstruction
coverCredit: "THE LEGENDARY POET · редакционная реконструкция на основе архивных портретных референсов"
```

**Atomic correction:** the current cover is labelled as a restoration of Osip Brik’s 1928 portrait. After replacement, `coverSourceUrl` must be removed and the kind changed to `reconstruction`; the old attribution must not survive.

## 5. Mayakovsky and the Briks

**Approved scene:** Osip Brik in the foreground, Lilya Brik in the centre and Mayakovsky reading a sheet in the background, unified black-and-white interior.

**Target:**

```text
public/images/essays/briks/brik-triangle-hero.webp
```

**Prepared production candidate:**

- dimensions: 1280×720;
- bytes: 74 056;
- SHA-256: `d4f0c014195b97b2d2efad8e54f918430ca2fdf5325ce5009e256059fdb94829`.

**Metadata:**

```yaml
coverAlt: "Осип Брик, Лиля Брик и Владимир Маяковский в напряжённой интерьерной композиции — редакционная реконструкция"
coverKind: reconstruction
coverCredit: "THE LEGENDARY POET · редакционная реконструкция на основе портретных референсов трёх участников"
```

**Atomic correction:** replace the current archival Lilya Brik hero; remove Osip Brik archival credit and Commons source from the cover fields. Archive images remain inside the article with their own item-level metadata.

## Compression review

The five candidates are intentionally compact but require final browser inspection because the generic cover validator currently warns for local images below 80 000 bytes. A small file is not automatically poor, and a large file is not automatically premium. The final decision must compare:

- facial detail at 1× and 2× DPR;
- gradients in dark skies and walls;
- compression around hair, eyes and manuscript edges;
- mobile crop;
- card crop;
- OG rendering;
- LCP impact.

The validator threshold should not be weakened merely to silence warnings. If visible artifacts are absent, the warning can remain documented; if artifacts are present, raise quality or use AVIF/WebP variants through a deliberate engine change.

## Production sequence

1. Verify exact main/branch head.
2. Add all five binary assets in one atomic image commit or a small ordered series with no metadata mismatch.
3. Update essay cover metadata.
4. Update provenance and cover audit.
5. Update pinned SHA validators.
6. Generate sitemap/feed/prerender.
7. Run content/type/build tests.
8. Run article catalog and browser/image QA.
9. Inspect live preview.
10. Merge only after visual approval.
