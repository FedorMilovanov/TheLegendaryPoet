# Source Acquisition and Google Drive Policy

**Project:** THE LEGENDARY POET  
**Effective:** 2 August 2026

## 1. Purpose

The project may conduct broad 40+ search passes across Russian, English and other-language public repositories. The goal is not to accumulate files. The goal is to close documented research gaps with legally accessible, identifiable and non-duplicated sources.

## 2. Current Drive authority

The canonical source area is:

```text
01 — SOURCES — PDF LIBRARY
├── 01 — COMMONS STRICT 40
├── 02 — SECOND EDITORIAL 40
└── 01 — BOOKS, EDITIONS & ARTICLES
    ├── BATCH-0001
    └── future verified batches
```

The two existing 40-item collections form one deduplication universe. A candidate missing from one old inventory may still exist in the second library or another batch.

Source files do not move into CONTENT, MEDIA or RELEASES merely because they are useful.

## 3. Discovery workflow

For every research marathon:

1. define active article/research gaps;
2. run at least 40 distinct searches when the owner requests a 40+ pass;
3. search primary/academic repositories first;
4. record candidate title, author/editor, year, language, repository and stable item URL;
5. classify relevance and source quality;
6. reject irrelevant bulk before download;
7. deduplicate all surviving candidates;
8. download only the accepted shortlist;
9. verify PDF identity and integrity;
10. upload accepted files with a manifest and checksum record.

Search-count compliance does not justify low-value acquisition.

## 4. Preferred repositories

Prefer:

- national and university libraries;
- author/museum archives when they expose the underlying item;
- Wikimedia Commons item pages;
- Internet Archive scans with clear provenance;
- HathiTrust, Gallica, NYPL, Tufts and comparable institutional repositories;
- academic journal repositories and university presses when lawful full text is available;
- official complete works, chronicles, facsimiles, first editions and document collections.

A search-engine result, aggregator, social post or commercial re-upload is navigation only until the original institutional item is found.

## 5. Acquisition gate

A PDF is uploaded only when all are true:

- it closes a named gap in an active or approved project;
- its bibliographic identity is clear;
- a stable item/source page is known;
- access is lawful and rights/public-domain status is recorded;
- it is not already present or equivalent to an existing copy;
- the file opens and is structurally usable;
- at least the title/first pages and relevant metadata have been inspected;
- checksum and file statistics are recorded.

## 6. Deduplication

Check candidates against every current library/batch using:

1. normalized title;
2. author/editor/compiler;
3. publication year and edition/volume/issue;
4. stable source/item URL;
5. filename after normalization;
6. page count and file size as supporting signals;
7. SHA-256 as exact-byte authority.

### Duplicate classes

- `EXACT_DUPLICATE` — same SHA; never upload again.
- `BIBLIOGRAPHIC_DUPLICATE` — same edition/item, different packaging/compression; keep the better canonical copy unless the second representation has a documented advantage.
- `EDITION_VARIANT` — different edition, translation, volume or issue; may be retained when the difference matters.
- `LANGUAGE_VARIANT` — retain only when translation/reception research needs it.
- `EXTRACT_OF_EXISTING` — do not store a chapter/extract when the complete verified volume is already present, unless the extract has independent historical publication value.
- `SUPERSEDED_SCAN` — replace only through an explicit manifest decision; do not leave uncontrolled parallel copies.

## 7. Required manifest row

Each accepted file records:

```yaml
id:
canonical_filename:
title:
author_or_editor:
year:
language:
edition_volume_issue:
research_gap:
article_or_project:
source_repository:
item_url:
direct_file_url:
rights_status:
rights_notes:
page_count:
file_size_bytes:
text_layer: TEXT | PARTIAL | SCAN
sha256:
first_page_verified: true | false
relevant_pages_or_sections:
duplicate_check:
acquisition_decision: ACCEPTED | HOLD | REJECTED
rejection_reason:
```

## 8. PDF quality review

Before upload:

- verify the file is actually PDF and opens;
- render and inspect the first page; inspect title/copyright pages when present;
- record page count and file size;
- determine `TEXT`, `PARTIAL` or `SCAN` without blindly mass-running OCR;
- check for missing pages, wrong item, access-error HTML saved as PDF, corruption or misleading filename;
- prefer the most complete and legible lawful copy;
- do not modify or optimise the original archival bytes before checksum capture.

OCR, derived text and optimised copies are derivatives and must not silently replace the original master.

## 9. Rights and reuse

- `Public domain`, `CC BY`, `CC BY-SA` and similar claims must be tied to the item page or institutional record.
- Record jurisdiction/edition uncertainty when relevant.
- An openly accessible PDF is not automatically public domain.
- A public-domain book may contain later introductions, typography, annotations or photographs with separate rights.
- Research access does not automatically permit production reproduction of every page/image.
- Rights-unclear material may be cited or held for review when lawful, but it does not enter production visuals without item-level clearance.

## 10. Drive organisation and naming

Use sequential verified batches:

```text
01 — BOOKS, EDITIONS & ARTICLES/
  BATCH-0001/
  BATCH-0002 — <bounded research purpose>/
```

Inside a batch:

- numbered canonical PDF names;
- `ACQUISITION_MANIFEST.md` or structured equivalent;
- `SHA256SUMS.txt`;
- optional `REJECTIONS_AND_DUPLICATES.md` without storing rejected binaries.

Do not use uncontrolled labels such as:

```text
FINAL
LATEST
ULTIMATE
NEW
COPY
final-final
(1)
(2)
```

One canonical master is mutable only through an explicit replacement decision. Historical states, when needed, use dated immutable snapshots.

## 11. Research priority for the current marathon

Current acquisition should prioritise gaps that directly support:

1. Sergey Yesenin, Part II: 1921–1925;
2. Yesenin and Duncan, especially the European/American route and post-1921 Duncan sources;
3. Benislavskaya source gates;
4. Yesenin and Imagism;
5. exact first publications, memoir collections, letters, chronicles, posters and document corpora;
6. item-level visual provenance and rights for already approved articles.

Do not dilute this batch with unrelated theology, generic anthologies or periodicals that have no mapped page/item need.

## 12. Publication boundary

Drive acquisition is research infrastructure. Uploading a PDF does not:

- verify every claim inside it;
- grant production image rights;
- make a source A+ automatically;
- open a public article route;
- justify a publication date;
- prove that the article has used or cited it correctly.
