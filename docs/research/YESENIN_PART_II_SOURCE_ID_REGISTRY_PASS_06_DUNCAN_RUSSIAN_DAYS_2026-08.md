# Сергей Есенин. Часть II — source ID registry pass 06

**Focus:** acquired Irma Duncan / Allan Ross Macdougall memoir, 1929  
**Date:** 3 August 2026  
**Status:** `DRIVE-VERIFIED BINARY / PAGE-MAPPED EARLY CONNECTED MEMOIR / CONFLICTS PRESERVED`  
**Public route:** do not create

## 1. Canonical source object

### Registry ID

`yes2-duncan-russian-days-1929-tu`

```yaml
title: Isadora Duncan's Russian Days and Her Last Years in France
authors: Irma Duncan; Allan Ross Macdougall
publication: London, Victor Gollancz Ltd, 1929
source_kind: early-connected-memoir
language: English
institution: Tufts Digital Library / Tisch Library
item_url: https://dl.tufts.edu/concern/pdfs/h415pp46s
permanent_url: http://hdl.handle.net/10427/009156
direct_file_url: https://dl.tufts.edu/downloads/wh247546j?filename=h415pp46s.pdf
pdf_pages: 406
catalog_extent_pages: 384
file_size_bytes: 18881149
sha256: f8ebbc91166916ff1a6e228e4b127a850b360eb64959d8441b7aa22bd2a0af17
text_layer: TEXT
first_page_rendered: true
title_page_pdf_page: 7
title_page_verified: true
Drive_folder_id: 1guVgPmnwnTR5wWaInK41Lp2HhMJ4ve6b
Drive_file_id: 1xs0SizFhEb0zDqN4MRWbBP0FsLpRfJH0
Drive_manifest_id: 1aEQDZDdDOmv_S77mxOT1n-d-Gz_7LXcV
Drive_sha256sums_id: 1n_m2v5pjqvL-w96fjA26YbfasqV9EAnv
binary_status: DRIVE-VERIFIED
production_rights: HOLD
```

Controlling passes:

- `YESENIN_DUNCAN_RUSSIAN_DAYS_SOURCE_PASS_01_2026-08.md`;
- `YESENIN_DUNCAN_RUSSIAN_DAYS_PAGE_MAP_PASS_01_2026-08.md`;
- `PDF_ACQUISITION_PASS_03_YESENIN_1921_1925_2026-08.md`.

## 2. Evidence class

This source is stronger than a late anonymous retelling because it is an early connected memoir produced within Duncan's circle. It is weaker than:

- a civil-registry act;
- passport or immigration file;
- passenger manifest;
- direct dated letter/autograph;
- contemporary programme or newspaper page;
- academic chronology built from identified originals.

Status in article data must remain `memoir` or `research`, never `official` or `archive-original`.

## 3. Registered claim rows

### `yes2-duncan-russian-days-meeting-date`

```yaml
source_id: yes2-duncan-russian-days-1929-tu
PDF_page: 103
printed_page: 97
memoir_claim: meeting at the beginning of November 1921
status: MEMOIR-CONFLICT
academic_control: autumn 1921; exact date remains disputed and may be earlier
safe_reader_wording: The 1929 Duncan-circle memoir places the meeting at the beginning of November, but the exact date remains disputed.
forbidden: They certainly met in early November 1921.
```

### `yes2-duncan-russian-days-marriage-motive`

```yaml
source_id: yes2-duncan-russian-days-1929-tu
PDF_pages: 141-145
printed_pages: 135-137
memoir_claim: practical travel and anticipated American social constraints were important motives for formal marriage
status: PARTLY-SUPPORTED / SINGLE-MOTIVE-REJECTED
safe_reader_wording: The legal marriage had clear practical value for foreign travel, especially the American stage, but the documents do not reduce the relationship to that motive alone.
```

### `yes2-duncan-russian-days-europe-route`

```yaml
source_id: yes2-duncan-russian-days-1929-tu
PDF_pages: 151-160
printed_pages: 143-152
covered_places: Berlin; Wiesbaden; Ostend; Brussels; Paris; Venice/Lido
status: MEMOIR-CORROBORATION / DIRECT-LETTERS-AND-ROUTE-PASSES-CONTROL
boundary: a future destination, translated letter, or connected narrative does not independently prove every stop/date
```

### `yes2-duncan-russian-days-us-admission`

```yaml
source_id: yes2-duncan-russian-days-1929-tu
PDF_page: 163
printed_page: 155
memoir_claim: arrival on 1 October 1922 aboard Paris and initial refusal of immediate landing followed by review
status: MEMOIR-CORROBORATION / IMMIGRATION-FILE-PENDING
safe_reader_wording: The party underwent immigration inquiry and was admitted; no deportation order has been acquired.
forbidden: The memoir proves legal deportation.
```

### `yes2-duncan-russian-days-departure`

```yaml
source_id: yes2-duncan-russian-days-1929-tu
PDF_page: 185
printed_page: 177
memoir_claim: return aboard George Washington near the end of January
status: MEMOIR-CONFLICT / ACADEMIC-DATE-CONTROLS
academic_control: departure from New York on 3 February 1923
boundary: vessel corroboration does not make the memoir's vague date exact
```

### `yes2-duncan-russian-days-moscow-return`

```yaml
source_id: yes2-duncan-russian-days-1929-tu
PDF_page: 213
printed_page: 203
memoir_claim: return to Moscow on 5 August 1923
status: MEMOIR-CONFLICT
academic_control: 3 August 1923
safe_reader_wording: The memoir circulates a 5 August date; the stronger academic chronology places the return on 3 August.
```

## 4. Quotation and translation gate

- No English direct quotation is copied into Russian reader prose from this registry.
- Exact quotations require a fresh rendered-page check and a Russian translation.
- Letters reproduced in the book cite the academic Russian text/autograph chain where available.
- Memoir translation, punctuation and ellipses are not silently attributed to Yesenin.
- Long quotations and image reproductions remain rights-gated.

## 5. Article/chapter use

Permitted controlled use:

- chapter 2: Duncan-circle version of the meeting and practical marriage context;
- chapter 5: connected European route comparison;
- chapter 6: arrival/inquiry and performance/reception leads;
- chapter 7: translation/publication leads;
- chapter 8: conflicting Moscow-return narrative.

This source does not reopen already resolved route dates and does not replace direct academic child pages.

## 6. Gate status

- [x] lawful institutional bytes acquired;
- [x] Drive master, manifest and checksum IDs recorded;
- [x] first/title pages rendered and inspected;
- [x] page-level Yesenin map created;
- [x] conflict dates preserved rather than silently normalised;
- [x] source class and quotation boundary recorded;
- [ ] complete page-by-page immigration/performance map remains open;
- [ ] independent programmes, manifests and immigration file remain open;
- [ ] production quotation/image rights remain open;
- [ ] no public route or final reader prose created.
