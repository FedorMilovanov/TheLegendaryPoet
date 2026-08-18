# Benislavskaya longform — publication gate ledger

Date: 2026-08-18  
Product anchor: `FedorMilovanov/TheLegendaryPoet@d59cceccb0c49af59b1be38d4c547a6240b3005a`  
Owner issue: `#200 — Отдельная статья: Галина Бениславская — рукописи, издательские дела и архив Есенина`

## Disposition

**STAGED-DRAFT / PUBLICATION-BLOCKED**

This lane stages a typed longform draft and the owner-approved editorial hero contract. It does **not** register a new public essay and does not claim that the outstanding correspondence acquisition has been completed.

The following production surfaces must remain unchanged until the source gate is closed:

- `src/data/essays/index.ts`;
- generated essay search/catalog metadata;
- sitemap/feed discovery;
- public route registration and announcement surfaces.

## Owner-approved hero reconstruction

Source supplied in the working conversation on 2026-08-18 and explicitly selected for the article.

Approved production target:

- intended path: `public/images/essays/benislavskaya/benislavskaya-editorial-hero.webp`;
- source-frame dimensions: `1672 × 941`;
- source PNG SHA-256: `468a6d2ffc2894e254fe72fc3b0ce7dea75efce13703f89313b475f8d9e0fc56`;
- deterministic WebP profile: Pillow WebP `quality=88`, `method=6`;
- approved WebP bytes: `132172`;
- approved WebP SHA-256: `0b1f1146f77ce154479042fc9a1afbe00133528eee14f220b4fa74990bd57e48`;
- classification: `reconstruction`;
- credit: `THE LEGENDARY POET · редакционная кинематографическая реконструкция по историческому портретному референсу`;
- external `sourceUrl`: intentionally none.

### Binary-ingestion QC

An initially staged repository blob failed the exact-byte validator on 2026-08-18:

- observed repository SHA-256: `b6e9c469edda76dc747888bcdca50a6d953f0beef9fa74b39253050747b60caf`;
- expected approved SHA-256: `0b1f1146f77ce154479042fc9a1afbe00133528eee14f220b4fa74990bd57e48`.

The mismatching blob was removed from the branch rather than accepted by changing the expected hash. The staged validator treats the hero as **pending binary ingestion** while the essay remains unpublished; if a file appears at the intended path, it must match the approved SHA exactly or CI fails.

The image is a reader-facing editorial reconstruction. It must never be described as an archival photograph, facsimile, restoration, or documentary witness.

## Current documentary baseline

The safe corpus formula remains:

- **35 letters, notes and telegrams** from Sergey Yesenin to Galina Benislavskaya;
- **1 gift inscription**;
- **14 known letters** from Benislavskaya to Yesenin.

Do not replace this with `35 писем / 14 ответов`: that formula changes document classes and falsely implies one-to-one correspondence.

The article uses documentary actions rather than inflated occupational labels. Current evidence supports work with manuscripts, publishing errands, contracts, negotiations, money, correspondence and archive/paper handling. It does not establish independent editorial authority over Yesenin's authorial composition.

## Fresh gate recheck — 2026-08-18

### Gmail / EDD preparation

A fresh search after the previous 2026-08-08 rebaseline found no delivered scan, library response or attachment for the target request:

`Сергей Есенин в стихах и жизни. Книга 3: Письма. Документы`, printed pp. **236–280**.

The official Perm M. Gorky Regional Library EDD contact was reverified as `mba@gorkilib.ru`. A Gmail draft request was prepared on 2026-08-18 asking the library to confirm availability, exact copying cost, format and turnaround **before** any paid work begins.

Status: **DRAFT SAVED / NOT SENT / NO PAYMENT AUTHORIZED**.

No email is treated as evidence that the request was submitted or fulfilled.

### Connected Drive

A fresh connected-Drive search found the central research registry and other Yesenin academic volumes, but **not** the target pp. 236–280 scan or an equivalent complete page-level witness.

Drive presence of adjacent research material does not close this gate.

### Open-web / institutional search

A fresh search confirmed bibliographic holdings for the 1995 edition and the 1997 TERRA/Respublika reprint, but did not locate a lawful open complete scan of the required page range. Library catalogue holdings and Google Books metadata are discovery witnesses only; they do not substitute for the page-level controlling witness.

A secondary research lead independently identifies the 16 July 1925 Benislavskaya→Yesenin letter as `ЦГАЛИ/РГАЛИ, ф.190, оп.1, ед. хр.105, л.27–29` and reports publication by L. V. Zankovskaya. This is useful for the reconciliation matrix, but it does not by itself close the full 14-letter gate.

## The unresolved 13 ↔ 16 ↔ 14 problem

Three observable source layers still disagree in composition:

1. the open `Есенин.ру` page exposes **13 numbered units**, with explicit cuts, losses and editorial boundaries;
2. P. F. Yushin's earlier bibliographic list exposes **16 archival/bibliographic positions**;
3. the later academic PSS index records **14 known letters** from Benislavskaya to Yesenin.

The working crosswalk is maintained in:

`docs/research/BENISLAVSKAYA_INBOUND_RECONCILIATION_MATRIX_2026-08.md`

It maps all Yushin positions **121–136** against open units **#1–#13** and records the visible boundary problems instead of silently normalizing them. In particular:

- open #3 is headed 26 April but ends `25.IV.24`;
- open #4 is a separate 26 April postcard while Yushin exposes one 26 April position;
- open #6 is headed `19 или 20 октября 1924 г.` but ends `10.X.24`, matching Yushin #127 dated 10 October;
- open #7 explicitly mentions a business letter that was written but not sent, so writing, sending, delivery and reading must remain separate provenance questions.

This discrepancy must be reconciled item by item. It is not legitimate to choose whichever number is easiest for the narrative.

The final matrix must record for every controlling item:

- date / dating range;
- document class;
- publication/source tradition;
- autograph / copy / prior publication status where known;
- cuts or missing passages;
- page witness;
- provenance and any archive cipher available;
- delivery/recipient status where evidenced;
- what reader claim the item actually supports.

## Diary / copy boundary

The diary corpus is tracked as:

`РГАЛИ, ф. 1604, оп. 1, ед. хр. 1123`, 35 leaves, **typewritten copy**.

Do not call this a viewed autograph diary. The current publication tradition combines diary entries, copies of letters and memoir-like material; the autograph location is not established by the current project evidence.

## Staged validation contract

The branch contains `scripts/validate-benislavskaya-staged.ts`, executed from the common `check:content` gate. It enforces, before publication:

- no accidental catalog/browser-data publication;
- stable staged identity and section order;
- resolved and actually cited source ids;
- exact 13-source staged bibliography;
- explicit 13 ↔ 16 ↔ 14 discrepancy language;
- the open pp. 236–280 acquisition boundary;
- machine-copy diary disclosure;
- no unsupported editor/agent occupational claims;
- zero documentary body images before item-level rights approval;
- publication-derived reading-time parity through the universal `publishEssay()` boundary;
- exact approved hero bytes if/when the binary is ingested.

The raw authoring object currently contains a non-authoritative `readTime` placeholder, while the universal publication boundary recalculates reader time from blocks. The staged DoD validates the **publication-derived** value, not a duplicated manual number.

## Publication unlock conditions

A public Product transaction may start only after all of the following are true:

1. obtain and inspect pp. **236–280** of the 1995 `Письма. Документы` volume **or another lawful complete page-level witness of equivalent controlling value**;
2. reconcile the canonical 14-item inbound-letter matrix against the 13-unit open publication and the 16-position earlier bibliography;
3. record page order, completeness and SHA for the acquired witness;
4. re-read the staged article against the closed matrix and remove/qualify any claim that exceeds it;
5. ingest the approved hero bytes and pass the exact SHA guard;
6. keep the selected hero classified as `reconstruction`;
7. make separate item-level rights decisions for any future archival/facsimile images added inside the article;
8. only then register the essay in the canonical catalog and regenerate discovery;
9. run content/citation/style/TypeScript/build/SEO and the full browser matrix required by the current project contracts.

## Explicit non-claims

This staged lane does **not** mean:

- all 14 inbound letters have been read completely;
- the Perm EDD request was submitted;
- the target pages were paid for or delivered;
- the approved hero binary is currently ingested in the repository;
- the diary autograph was inspected;
- Benislavskaya was an autonomous editor or literary agent in a modern professional sense;
- an archive catalogue card grants reproduction rights to a scan;
- the generated hero is documentary evidence.

## Staged source file

The draft lives in:

`src/data/essays/benislavskayaDraft.ts`

It is intentionally absent from the canonical public essay catalog until this ledger's source gate is closed.
