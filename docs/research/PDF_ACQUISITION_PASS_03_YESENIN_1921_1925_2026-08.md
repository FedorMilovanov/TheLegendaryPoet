# PDF acquisition pass 03 — Yesenin 1921–1925

**Date:** 2 August 2026  
**Updated:** 3 August 2026  
**Status:** `40+ DISCOVERY COMPLETE / BATCH-0002 OPEN / 1 DRIVE-VERIFIED MASTER / 6 BINARY-PENDING`  
**Target Drive area:** `01 — SOURCES — PDF LIBRARY / 01 — BOOKS, EDITIONS & ARTICLES`  
**Current batch:** `BATCH-0002 — YESENIN 1921–1925` (`1guVgPmnwnTR5wWaInK41Lp2HhMJ4ve6b`)

## 1. Discovery scope

The 40+ discovery marathon covered Russian and English institutional searches for:

- early Yesenin memoir collections and documentary reception;
- 1921–1925 authorial books and first/early editions;
- Imagism manifestos and group publications;
- Duncan sources covering Russia and the Yesenin years;
- European/American route evidence;
- academic and national-library repositories;
- stable item records rather than commercial or pirate re-uploads.

Search breadth is evidence of discovery coverage, not a quota for archive growth. Only verified, non-duplicated files enter Drive.

## 2. Deduplication universe

Every candidate is checked against:

```text
01 — COMMONS STRICT 40
02 — SECOND EDITORIAL 40
01 — BOOKS, EDITIONS & ARTICLES / every BATCH folder
Drive-wide exact and related-title searches
ChatGPT Library exact and semantic searches
existing manifests and SHA registries
```

The two 40-item collections form one deduplication universe. A candidate missing from one old inventory is not automatically new.

Existing related Duncan files include `My Life` and `The Art of the Dance`; neither is a duplicate of the 1929 Irma Duncan/Macdougall volume.

## 3. Current shortlist

| ID | Item | Current status |
|---|---|---|
| P03-01 | `Памяти Есенина`, 1926 | `ACCEPTED / BINARY-PENDING` |
| P03-02 | `Сергей Александрович Есенин. Воспоминания`, 1926 | `ACCEPTED / BINARY-PENDING` |
| P03-03 | И. Грузинов, `С. Есенин разговаривает о литературе и искусстве`, 1927 | `ACCEPTED / BINARY-PENDING` |
| P03-04 | Duncan/Macdougall, `Isadora Duncan's Russian Days...`, 1929 | `DRIVE-VERIFIED / BATCH ITEM 01` |
| P03-05 | `Плавильня слов`, 1920 | `ACCEPTED / BINARY-PENDING` |
| P03-06 | `От символизма до «Октября»`, 1924 | `ACCEPTED / BINARY-PENDING` |
| P03-07 | Есенин, `Русь советская`, 1925 | `ACCEPTED / BINARY-PENDING` |

`BINARY-PENDING` means the bibliographic item and research need are strong but the exact bytes have not yet passed MIME, pages, render, SHA, dedupe and Drive-ID gates.

## 4. Item records

### P03-01 — `Памяти Есенина`

```yaml
status: ACCEPTED / BINARY-PENDING
research_gap: early multi-witness memoir corpus and origin tracing for late-biography/death narratives
bibliographic_identity: Памяти Есенина : сборник / Всероссийский союз поэтов. Москва, 1926
catalog_pages: 269
language: Russian
repository: National Electronic Library / Russian State Library
item_url: https://rusneb.ru/catalog/000199_000009_007513586/
direct_pdf_url: http://dlib.rsl.ru/rsl01007000000/rsl01007513000/rsl01007513586/rsl01007513586.pdf
rights_access_note: institutional item exposes free PDF download; page/image production rights remain separate
Drive_exact_title_match: none found
```

The complete collection should be acquired once. Individual chapter records are not stored as duplicate extracts after the full volume enters the batch.

### P03-02 — `Сергей Александрович Есенин. Воспоминания`

```yaml
status: ACCEPTED / BINARY-PENDING
research_gap: independent early memoir corpus for witness comparison and myth provenance
editor: I. V. Evdokimov
publication: Moscow–Leningrad, Gosizdat, 1926
catalog_pages: 241 + 2; 6 illustrations/portraits
language: Russian
repository: National Electronic Library / Russian State Library
item_url: https://rusneb.ru/catalog/000199_000009_008951684/
Drive_exact_title_match: none found
```

This is not a duplicate of `Памяти Есенина`; compare contributor and text version item by item.

### P03-03 — Ivan Gruzinov, `С. Есенин разговаривает о литературе и искусстве`

```yaml
status: ACCEPTED / BINARY-PENDING
research_gap: named early memoir source for statements attributed to Yesenin's conversations
publication: Moscow, All-Russian Union of Poets, 1927; cover dated 1926
catalog_pages: 22
language: Russian
repository: National Electronic Library / Russian State Library
item_url: https://rusneb.ru/catalog/000199_000009_004871570/
direct_pdf_url: http://dlib.rsl.ru/rsl01004000000/rsl01004871000/rsl01004871570/rsl01004871570.pdf
Drive_exact_title_match: none found
```

Publication use must name Gruzinov. Memorable phrases do not become unattributed stenography.

### P03-04 — Irma Duncan and Allan Ross Macdougall, `Isadora Duncan's Russian Days and Her Last Years in France`

```yaml
status: DRIVE-VERIFIED / BATCH ITEM 01
source_id: yes2-duncan-russian-days-1929-tu
research_gap: Duncan-side evidence for Russia, the Yesenin relationship and the 1922–1923 route
publication: London, Victor Gollancz Ltd, 1929
language: English
repository: Tufts Digital Library / Tisch Library
item_url: https://dl.tufts.edu/concern/pdfs/h415pp46s
permanent_url: http://hdl.handle.net/10427/009156
direct_download_url: https://dl.tufts.edu/downloads/wh247546j?filename=h415pp46s.pdf
catalog_description_pages: 384
pdf_pages: 406
file_size_bytes: 18881149
mime_type: application/pdf
pdf_version: 1.5
text_layer: TEXT
sha256: f8ebbc91166916ff1a6e228e4b127a850b360eb64959d8441b7aa22bd2a0af17
first_page_rendered: true
title_page_pdf_page: 7
title_page_rendered_and_inspected: true
Drive_file_id: 1xs0SizFhEb0zDqN4MRWbBP0FsLpRfJH0
Drive_parent_folder_id: 1guVgPmnwnTR5wWaInK41Lp2HhMJ4ve6b
manifest_Drive_file_id: 1aEQDZDdDOmv_S77mxOT1n-d-Gz_7LXcV
sha256sums_Drive_file_id: 1n_m2v5pjqvL-w96fjA26YbfasqV9EAnv
rights_status: PUBLIC-DOMAIN-US-2025 / EU-AND-OTHER-JURISDICTIONS-PENDING / PRIVATE-RESEARCH
production_reuse: HOLD
```

The catalogue's 384-page description and the 406-page digital object are not contradictory: the PDF includes covers, library leaves, advertisements and digitisation leaves. The complete verification and rights boundary are in `YESENIN_DUNCAN_RUSSIAN_DAYS_SOURCE_PASS_01_2026-08.md`.

This source closes the binary-acquisition gap but does not close page-level claims, independent corroboration or production-image rights.

### P03-05 — `Плавильня слов`

```yaml
status: ACCEPTED / BINARY-PENDING
research_gap: primary group publication for the independent Imagism article and Part II context
contributors: Sergey Yesenin, Anatoly Mariengof, Vadim Shershenevich
publication: Moscow, Imagists, 1920
catalog_pages: 39
language: Russian
repository: National Electronic Library / Russian National Library
item_url: https://rusneb.ru/catalog/000200_000018_RU_NLR_A1SV_46886/
institutional_viewer: http://vivaldi.nlr.ru/bx000009159/view
Drive_exact_title_match: none found
```

A primary group book does not prove later unity or Yesenin's permanent agreement with every formulation.

### P03-06 — `От символизма до «Октября»`

```yaml
status: ACCEPTED / BINARY-PENDING
research_gap: documentary anthology of literary manifestos and comparative Imagism context
compilers: N. L. Brodsky and N. P. Sidorov
publication: Moscow, Novaya Moskva, 1924
catalog_pages: 303
language: Russian
repository: National Electronic Library / Russian State Library
item_url: https://rusneb.ru/catalog/000199_000009_006734995/
reported_file_size: 78 MB
Drive_exact_title_match: none found
```

Acquire only with exact Imagism page mapping; do not cite the whole anthology decoratively.

### P03-07 — Yesenin, `Русь советская`

```yaml
status: ACCEPTED / BINARY-PENDING
research_gap: 1925 authorial collection for composition and publication history
publication: Baku, Bakinskiy rabochiy, 1925
catalog_pages: 81
reported_download_size: 11 MB
language: Russian
repository: National Electronic Library / Russian State Library
item_url: https://rusneb.ru/catalog/000199_000009_009194017/
download_route: https://rusneb.ru/local/tools/exalead/getFiles.php?book_id=000199_000009_009194017&doc_type=pdf
Drive_exact_title_match: none found
```

Use the edition to verify composition and publication, not to infer every poem's biographical occasion from book order.

## 5. Hold and reject decisions

### `Ключи Марии` — `HOLD / EXTRACT-IN-LARGE-CONTAINER`

The identified NЭБ representation is a short extract inside a 184 MB parent object. Locate a complete standalone early edition or smaller institutional representation before acquisition.

### `Москва кабацкая` — `HOLD / TOO-LARGE-REPRESENTATION`

The known first-edition representation is extremely large and was already marked `SKIPPED_TOO_LARGE`. Seek a smaller complete institutional scan; do not duplicate a 400+ MB object blindly.

### Chapter records from `Памяти Есенина` — `REJECT AS SEPARATE BINARIES`

Once the complete collection is acquired, embedded chapter records are not uploaded again unless an extract has independent historical publication value.

### Later generic collected editions — `LOWER PRIORITY`

They may support text history but do not outrank the present memoir, route, Imagism and 1925 first-edition gaps.

### Unrelated theology and generic periodicals — `REJECT FOR THIS BATCH`

Do not dilute the bounded Yesenin batch with other project areas.

### Gordon McVay, `Isadora and Esenin` — `HOLD / VERIFIED USER-LIBRARY COPY / COPYRIGHTED`

```yaml
title: Isadora and Esenin : the story of Isadora Duncan and Sergei Esenin
author: Gordon McVay
publication: Macmillan Press / Ardis, 1980
pdf_pages: 424
file_size_bytes: 265262787
sha256: 1a3167db1cb9cc2aa1ad64ac59b07bad4d97ebc51c5a142c334f2a74a0dc3238
rights_status: All rights reserved; copyright Ardis 1980
source_provenance: user Library file; original acquisition channel not recorded
Drive_upload_status: false
```

Safe use: private comparison and bibliography navigation. Forbidden: redistribution, public download, or treating illustrations as rights-cleared.

## 6. Binary verification gate

Before any additional candidate enters Drive:

```text
□ bytes came from the recorded institution or documented lawful channel
□ MIME is application/pdf and the file opens
□ title/publication pages inspected
□ first page rendered
□ PDF page count and catalogue extent recorded separately
□ size and text-layer status recorded
□ SHA-256 computed
□ Drive and manifest dedupe rerun
□ rights/provenance recorded
□ canonical filename assigned
□ Drive action returns a real file ID and correct parent
□ ACQUISITION_MANIFEST.md and SHA256SUMS.txt updated with the same bytes
```

`BATCH-0002` now exists because P03-04 passed every binary gate and was uploaded. No other pending item is represented by a placeholder file.

## 7. Next acquisition order

1. `Памяти Есенина` — broad early memoir corpus.
2. Evdokimov's `Сергей Александрович Есенин. Воспоминания` — independent witness comparison.
3. Gruzinov's memoir — named quotation/provenance source.
4. `Плавильня слов` — primary Imagism publication.
5. `Русь советская` — late authorial collection.
6. `От символизма до «Октября»` — after exact page mapping.

The temporary GitHub acquisition workflow is permitted only for verified official downloads and must be removed after the current acquisition wave is transferred to Drive.

## 8. Current counters

```yaml
general_discovery_queries: 40+
shortlisted_items: 7
accepted_binary_pending_items: 6
accepted_Drive_masters: 1
Drive_batch_folders_created_with_verified_content: 1
Drive_PDF_file_ids_returned: 1
Drive_manifest_file_ids_returned: 2
empty_batch_folders_created: 0
fake_or_HTML_as_PDF_files_created: 0
```
