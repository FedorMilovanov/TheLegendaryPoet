# Benislavskaya longform — publication gate ledger

Date: 2026-08-18  
Product anchor: `FedorMilovanov/TheLegendaryPoet@d59cceccb0c49af59b1be38d4c547a6240b3005a`  
Owner issue: `#200 — Отдельная статья: Галина Бениславская — рукописи, издательские дела и архив Есенина`

## Disposition

**STAGED-DRAFT / PUBLICATION-BLOCKED**

This lane stages a typed longform draft and the owner-approved editorial hero. It does **not** register a new public essay and does not claim that the outstanding correspondence acquisition has been completed.

The following production surfaces must remain unchanged until the source gate is closed:

- `src/data/essays/index.ts`;
- generated essay search/catalog metadata;
- sitemap/feed discovery;
- public route registration and announcement surfaces.

## Owner-approved hero reconstruction

Source supplied in the working conversation on 2026-08-18 and explicitly selected for the article.

Production derivative:

- path: `public/images/essays/benislavskaya/benislavskaya-editorial-hero.webp`;
- dimensions: `1672 × 941`;
- production bytes: `132172`;
- SHA-256: `0b1f1146f77ce154479042fc9a1afbe00133528eee14f220b4fa74990bd57e48`;
- classification: `reconstruction`;
- credit: `THE LEGENDARY POET · редакционная кинематографическая реконструкция по историческому портретному референсу`;
- external `sourceUrl`: intentionally none.

The image is a reader-facing editorial reconstruction. It must never be described as an archival photograph, facsimile, restoration, or documentary witness.

## Current documentary baseline

The safe corpus formula remains:

- **35 letters, notes and telegrams** from Sergey Yesenin to Galina Benislavskaya;
- **1 gift inscription**;
- **14 known letters** from Benislavskaya to Yesenin.

Do not replace this with `35 писем / 14 ответов`: that formula changes document classes and falsely implies one-to-one correspondence.

The article uses documentary actions rather than inflated occupational labels. Current evidence supports work with manuscripts, publishing errands, contracts, negotiations, money, correspondence and archive/paper handling. It does not establish independent editorial authority over Yesenin's authorial composition.

## Fresh gate recheck — 2026-08-18

### Gmail

A fresh search after the previous 2026-08-08 rebaseline found no delivered scan, library response or attachment for the target request:

`Сергей Есенин в стихах и жизни. Книга 3: Письма. Документы`, printed pp. **236–280**.

No email is treated as evidence that the request was submitted or fulfilled.

### Connected Drive

A fresh connected-Drive search found the central research registry and other Yesenin academic volumes, but **not** the target pp. 236–280 scan or an equivalent complete page-level witness.

Drive presence of adjacent research material does not close this gate.

## The unresolved 13 ↔ 16 ↔ 14 problem

Three observable source layers still disagree in composition:

1. the open `Есенин.ру` page exposes **13 numbered units**, with explicit cuts, losses and editorial boundaries;
2. P. F. Yushin's earlier bibliographic list exposes **16 archival/bibliographic positions**;
3. the later academic PSS index records **14 known letters** from Benislavskaya to Yesenin.

This discrepancy must be reconciled item by item. It is not legitimate to choose whichever number is easiest for the narrative.

The final matrix must record for every controlling item:

- date / dating range;
- document class;
- publication/source tradition;
- autograph / copy / prior publication status where known;
- cuts or missing passages;
- page witness;
- provenance and any archive cipher available;
- what reader claim the item actually supports.

## Diary / copy boundary

The diary corpus is tracked as:

`РГАЛИ, ф. 1604, оп. 1, ед. хр. 1123`, 35 leaves, **typewritten copy**.

Do not call this a viewed autograph diary. The current publication tradition combines diary entries, copies of letters and memoir-like material; the autograph location is not established by the current project evidence.

## Publication unlock conditions

A public Product transaction may start only after all of the following are true:

1. obtain and inspect pp. **236–280** of the 1995 `Письма. Документы` volume **or another lawful complete page-level witness of equivalent controlling value**;
2. reconcile the canonical 14-item inbound-letter matrix against the 13-unit open publication and the 16-position earlier bibliography;
3. record page order, completeness and SHA for the acquired witness;
4. re-read the staged article against the closed matrix and remove/qualify any claim that exceeds it;
5. keep the selected hero classified as `reconstruction`;
6. make separate item-level rights decisions for any future archival/facsimile images added inside the article;
7. only then register the essay in the canonical catalog and regenerate discovery;
8. run content/citation/style/TypeScript/build/SEO and the full browser matrix required by the current project contracts.

## Explicit non-claims

This staged lane does **not** mean:

- all 14 inbound letters have been read completely;
- the Perm EDD request was submitted;
- the target pages were paid for or delivered;
- the diary autograph was inspected;
- Benislavskaya was an autonomous editor or literary agent in a modern professional sense;
- an archive catalogue card grants reproduction rights to a scan;
- the generated hero is documentary evidence.

## Staged source file

The draft lives in:

`src/data/essays/benislavskayaDraft.ts`

It is intentionally absent from the canonical public essay catalog until this ledger's source gate is closed.
