# PDF acquisition pass 03 — Yesenin 1921–1925

**Date:** 2 August 2026  
**Status:** `40+ DISCOVERY COMPLETE / SHORTLIST DEDUPED / BINARIES PENDING VERIFICATION`  
**Target Drive area:** `01 — SOURCES — PDF LIBRARY / 01 — BOOKS, EDITIONS & ARTICLES`  
**Future batch:** `BATCH-0002 — YESENIN 1921–1925` — create only with the first actually verified and accepted PDF, not as an empty promise folder.

## 1. What this pass did

A 40+ query discovery marathon was run across Russian and English searches focused on:

- Yesenin memoir collections and early documentary reception;
- 1921–1925 books and first/early editions;
- Imagism manifestos and group publications;
- Isadora Duncan sources that actually cover Russia and the Yesenin years;
- European/American route and cultural context;
- academic and institutional PDF repositories;
- direct item records, not aggregator re-uploads.

Repositories reviewed included NЭБ/RGB/RNB records, Tufts Digital Library, Wikimedia/Internet Archive pathways and related institutional catalogues.

The pass did **not** upload forty files. Search breadth is evidence of discovery coverage, not a quota for archive growth.

## 2. Deduplication universe

Candidates were checked against:

```text
01 — COMMONS STRICT 40
02 — SECOND EDITORIAL 40
01 — BOOKS, EDITIONS & ARTICLES / BATCH-0001
Drive-wide title searches
ChatGPT Library exact and semantic title/content searches
known CONTENT_INVENTORY and checksum manifests
```

Important correction: the current source archive contains two separate 40-item collections. A candidate missing from the first inventory is not automatically new.

Drive already contains:

- `My Life — Isadora Duncan`;
- `The Art of the Dance — Isadora Duncan`;
- several general Russian-poetry anthologies;
- many early poet editions and periodicals.

Therefore those items were not reacquired.

## 3. Accepted shortlist — binary pending

`ACCEPTED / BINARY-PENDING` means the bibliographic item and research need are strong and Drive title search found no exact copy, but the PDF bytes have not yet passed local first-page, page-count and SHA-256 verification. Such an item is **not yet present in Drive** and must not be reported as uploaded.

### P03-01 — `Памяти Есенина`

```yaml
status: ACCEPTED / BINARY-PENDING
research_gap: early multi-witness memoir corpus; reception immediately after death; source mapping for late biography and death narratives
bibliographic_identity: Памяти Есенина : сборник / Всероссийский союз поэтов. Москва, 1926
pages: 269
language: Russian
repository: National Electronic Library / Russian State Library
item_url: https://rusneb.ru/catalog/000199_000009_007513586/
rights_access_note: institutional record marks free reading and PDF download; production image reuse still requires item/page-level rights review
Drive_exact_title_match: none found
```

The contents include several named memoir texts. Each witness remains a witness with a date, relationship and possible interest; the collection is not a single fact authority.

### P03-02 — `Сергей Александрович Есенин. Воспоминания`

```yaml
status: ACCEPTED / BINARY-PENDING
research_gap: second independent early memoir collection for witness comparison and myth provenance
editor: I. V. Evdokimov
publication: Moscow–Leningrad, Gosizdat, 1926
pages: 241 + 2; 6 illustrations/portraits
language: Russian
repository: National Electronic Library / Russian State Library
item_url: https://rusneb.ru/catalog/000199_000009_008951684/
Drive_exact_title_match: none found
```

This is not a duplicate of `Памяти Есенина`; the two collections must be compared by contributor and text rather than treated as interchangeable.

### P03-03 — Ivan Gruzinov, `С. Есенин разговаривает о литературе и искусстве`

```yaml
status: ACCEPTED / BINARY-PENDING
research_gap: compact named memoir source on Yesenin's literary statements; origin tracing for quotations attributed to oral conversations
publication: Moscow, All-Russian Union of Poets, 1927; cover dated 1926
pages: 22
language: Russian
repository: National Electronic Library / Russian State Library
item_url: https://rusneb.ru/catalog/000199_000009_004871570/
Drive_exact_title_match: none found
```

Publication use requires explicit attribution to Gruzinov; memorable formulations must not become unattributed stenography.

### P03-04 — Irma Duncan and Allan Ross Macdougall, `Isadora Duncan's Russian Days and Her Last Years in France`

```yaml
status: ACCEPTED / BINARY-PENDING
research_gap: direct correction to the current Duncan gap; unlike My Life, this book covers Russia and later years relevant to Yesenin
publication_year: 1929
pages: 384
language: English
repository: Tufts Digital Library / Tisch Library
item_url: https://dl.tufts.edu/concern/pdfs/h415pp46s
permanent_url: http://hdl.handle.net/10427/009156
direct_download_url_identified: https://dl.tufts.edu/downloads/wh247546j?filename=h415pp46s.pdf
Drive_exact_title_match: none found
```

This is currently the strongest new English acquisition candidate. It does not replace letters, passports, press or official route records, but it addresses a period that the existing `My Life` volume does not cover.

The institutional direct-download URL was identified on 3 August 2026. Web fetch timed out on the 384-page file and the container had no external DNS, so no bytes were received. The item remains `BINARY-PENDING`; the existence of a direct URL is not an upload.

### P03-05 — `Плавильня слов`

```yaml
status: ACCEPTED / BINARY-PENDING
research_gap: primary group publication for the independent Yesenin-and-Imagism article and for separating Part II from the movement study
contributors: Sergey Yesenin, Anatoly Mariengof, Vadim Shershenevich
publication: Moscow, Imagists, 1920
pages: 39
language: Russian
repository: National Electronic Library / Russian National Library
item_url: https://rusneb.ru/catalog/000200_000018_RU_NLR_A1SV_46886/
Drive_exact_title_match: none found
```

This is a primary publication, but its presence does not prove later unity of the movement or Yesenin's unchanged agreement with every formulation.

### P03-06 — `От символизма до «Октября»`

```yaml
status: ACCEPTED / BINARY-PENDING
research_gap: early documentary anthology of literary manifestos, including a usable comparative context for Imagism
compilers: N. L. Brodsky and N. P. Sidorov
publication: Moscow, Novaya Moskva, 1924
pages: 303
language: Russian
repository: National Electronic Library / Russian State Library
item_url: https://rusneb.ru/catalog/000199_000009_006734995/
reported_file_size: 78 MB
Drive_exact_title_match: none found
```

The whole volume is useful only if the exact Imagism pages and edition provenance are mapped. It must not become a decorative general source cited for claims it does not support.

### P03-07 — Yesenin, `Русь советская`

```yaml
status: ACCEPTED / BINARY-PENDING
research_gap: 1925 authorial collection for late-work chronology, composition and publication history
publication: Baku, 1925
pages: 81
language: Russian
repository: National Electronic Library
item_url: https://rusneb.ru/catalog/000199_000009_009194017/
Drive_exact_title_match: none found
```

Use the edition to verify composition and publication, not to infer every poem's biographical occasion from placement alone.

## 4. Hold / reject decisions

### `Ключи Марии` — `HOLD / EXTRACT-IN-LARGE-CONTAINER`

The available NЭБ item is pages 186–213 inside a 184 MB parent package. Do not upload a large container merely for a short extract before locating a complete standalone early edition or a smaller institutional representation.

Item: `https://rusneb.ru/catalog/000199_000009_005434634_1000160169/`

### `Москва кабацкая` — `HOLD / TOO-LARGE-REPRESENTATION`

A first-edition scan is valuable, but the currently identified Commons/NЭБ representation is extremely large and was already marked `SKIPPED_TOO_LARGE` in the existing archive notes. Seek a smaller complete institutional scan or store a source link and exact needed pages; do not duplicate a 400+ MB object blindly.

### chapter/extract records from `Памяти Есенина` — `REJECT AS SEPARATE BINARIES`

NЭБ exposes individual chapter records such as Georgy Ustinov's memoir. Once the complete collection is acquired, do not upload the same embedded chapter as a second PDF unless that chapter has an independently published historical edition.

### later generic collected editions — `LOWER PRIORITY`

Large 1926–1927 collected editions may be useful for text history but do not outrank the current gaps in memoirs, route records, Imagism and 1925 first/early collections. Acquire only after volume/edition needs are mapped.

### unrelated theology and generic periodicals — `REJECT FOR THIS BATCH`

The existing second 40 includes several theology books and broad periodicals. They may belong to other projects or future research, but they must not dilute `BATCH-0002 — YESENIN 1921–1925`.

### Gordon McVay, `Isadora and Esenin` — `HOLD / VERIFIED USER-LIBRARY COPY / COPYRIGHTED`

A copy already existed in the user's ChatGPT Library under the name:

`Isadora_and_Esenin_the_story_of_Isadora_Duncan_and_Sergei_Esenin.pdf`

It was materialized and technically inspected on 3 August 2026:

```yaml
title: Isadora and Esenin : the story of Isadora Duncan and Sergei Esenin
author: Gordon McVay
publication: Macmillan Press / Ardis, 1980
pages: 424
file_size_bytes: 265262787
mime: application/pdf
pdf_version: 1.3
encrypted: false
sha256: 1a3167db1cb9cc2aa1ad64ac59b07bad4d97ebc51c5a142c334f2a74a0dc3238
first_pages_rendered: true
copyright_page_inspected: true
rights_status: All rights reserved; copyright Ardis 1980
source_provenance: user Library file; original acquisition channel not recorded
Drive_exact_title_match: not established as an accepted Drive master
Drive_file_id: null
Drive_upload_status: false
```

This is a useful secondary research book and its bibliography points to primary/early sources, but it is **not** the 1929 Irma Duncan/Macdougall volume and must not replace it.

The file is not accepted into `BATCH-0002` yet because:

- it is copyrighted;
- the original lawful acquisition channel is not recorded in the Library metadata available to this pass;
- it is a large secondary book rather than the highest-priority primary/early item;
- the Google Drive connector could not convert the Library file ID, local path or `sandbox:` URI into the required connector file reference.

Safe use while on HOLD: private source comparison and bibliography navigation inside the current research environment. Forbidden use: production redistribution, public download, extracting illustrations as rights-cleared visuals, or reporting it as uploaded to Drive.

## 5. Binary verification gate

Before any accepted candidate is uploaded:

```text
□ bytes downloaded from the recorded institutional item or received through a documented lawful user/archive channel
□ actual MIME = application/pdf
□ file opens without password/error page
□ title and publication pages inspected
□ first page rendered
□ page count recorded and compared with catalogue
□ file size recorded
□ text layer classified TEXT / PARTIAL / SCAN
□ SHA-256 computed
□ exact-byte and bibliographic duplicate checks rerun
□ rights/provenance recorded
□ canonical filename assigned
□ Drive action returns a real file ID/path
□ manifest row and SHA256SUMS updated with the same bytes
```

No empty `BATCH-0002` folder should be created until at least one PDF passes this gate and is actually uploaded.

## 6. Current environment and connector limitations

The institutional catalogue pages and bibliographic records were accessible, but direct PDF endpoints did not materialize into the working filesystem because the container had no external DNS and large web downloads timed out.

A separate connector limitation was reproduced on 3 August 2026:

```text
Google Drive upload_file rejected:
- raw Library file ID;
- structured Library metadata object;
- local materialized path;
- sandbox:/ URI.

Error class: UNREGISTERED_FILE_REFERENCE / incompatible file_uri schema.
```

Therefore no file is reported as uploaded. The pass does not create fake zero-byte files, HTML pages renamed `.pdf`, unchecked Drive uploads or fictional Drive IDs.

When a supported file bridge or browser download becomes available, resume in this order:

1. institutional Tufts PDF bytes for P03-04;
2. NЭБ public-domain/early-edition files;
3. only then reconsider the McVay user-library copy under private-research rights and documented owner provenance.

## 7. Next acquisition order

1. `Isadora Duncan's Russian Days...` — closes the largest existing Duncan chronological gap.
2. `Памяти Есенина` — broad early memoir corpus.
3. Evdokimov's `Сергей Александрович Есенин. Воспоминания` — independent comparison corpus.
4. Gruzinov's memoir — named quotation/provenance source.
5. `Плавильня слов` — primary Imagism publication.
6. `Русь советская` — late authorial collection.
7. `От символизма до «Октября»` — larger contextual anthology after exact page mapping.

Only verified accepted binaries enter the future batch; rejections and holds remain documentary rows without binary clutter.

## 8. Current counters

```yaml
general_discovery_queries: 40+
accepted_binary_pending_items: 7
verified_local_binary_candidates: 1
accepted_Drive_masters_added_in_this_pass: 0
Drive_file_ids_returned: 0
empty_batch_folders_created: 0
fake_or_HTML_as_PDF_files_created: 0
```
