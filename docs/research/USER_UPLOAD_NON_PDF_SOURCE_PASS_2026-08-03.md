# User-upload non-PDF source pass — Mayakovsky and Yesenin

**Дата проверки:** 3 августа 2026 года  
**Статус:** `1 EPUB CONTENT-MAPPED / 2 DJVU STRUCTURE-VERIFIED / PRIVATE RESEARCH ONLY`  
**Связанный intake:** `USER_UPLOAD_INTAKE_YESENIN_MAYAKOVSKY_2026-08-03.md`

## 1. UYM-2026-08-03-06 — Bengt Jangfeldt, Mayakovsky and his circle

```yaml
Drive_file_id: 13dACZDCMQQVJ2FoZ-Vs0tTXCqY_G_4jR
filename_claim: Янгфельдт Б. — Ставка — жизнь. Владимир Маяковский и его круг
format: DJVU multi-page
file_size_bytes: 9278231
sha256: 1be866ffee1d66ab8b1a7df8b40e32050a8f3713151472acd377bf59dfc3d0bd
DJVM_containers: 1
DJVU_page_components: 640
INFO_page_chunks: 640
FORM_chunks_total: 667
embedded_TXTz_chunks: 0
text_layer: none detected
title_imprint_visually_verified: false
rights_status: PRIVATE-RESEARCH-ONLY / RIGHTS-UNCLEAR
current_use: secondary scholarly navigation after page rendering becomes available
```

### Correction

The earlier intake value `666 pages` was inferred from container structure. It is not a page count. The file contains 640 `DJVU`/`INFO` page components and 667 total `FORM` chunks. Until a trusted DjVu renderer is available, the title/imprint page and exact pagination remain visually pending.

### Boundary

- filename metadata is not a verified title page;
- no OCR is invented for the image-only file;
- the modern biography cannot replace letters, contemporary documents or the investigation file;
- no derivative PDF is created merely to normalise the format.

## 2. UYM-2026-08-03-07 — Dmitry Bykov, `13-й апостол`

```yaml
Drive_file_id: 1zoOkMxfed76w2FOQNXUM2oz5ymoAehoY
outer_format: ZIP
outer_size_bytes: 849381
outer_sha256: b60d949f8317164f29b41aa3e295efe49fea772bfe078a663c1a9ea3eb2a65cd
inner_format: EPUB
inner_size_bytes: 850073
inner_sha256: a89fa2fd28915c8ab70d397a6b6d96c5fd8be0cc06ee87fe32da37d04a4acd9f
EPUB_title: 13-й апостол. Маяковский: Трагедия-буфф в шести действиях
author: Дмитрий Быков
publisher_metadata: Молодая гвардия
language: ru
EPUB_uuid: 54bbc27d-432d-4eeb-8452-3b0ab486bb08
EPUB_date_metadata: invalid placeholder 0101-01-01; not usable
cover_verified: true
TOC_verified: true
rights_status: PRIVATE-RESEARCH-ONLY / RIGHTS-UNCLEAR
```

### Structural map

The EPUB divides the biography into a prologue and six acts, including:

- `Выстрел`;
- `Голос`;
- `Подросток. 1893-1913`;
- `Футурист. 1913-1923`;
- `Главарь. 1923-1927`;
- `Плохо. 1927-1930`.

The detailed navigation includes sections on the April 1930 events, inheritance, voice/poetics, early years, women, the Briks, Revolution and later public role.

### Boundary

This is a modern authorial interpretation with a deliberately dramatic structure. It is useful for historiography, argument discovery and comparison of modern narratives. It is not:

- a primary source;
- an independent witness to 1930;
- a substitute for the Strizhneva investigation volume;
- a source for exact quotations without edition/location mapping.

No public source entry uses the private Drive URL.

## 3. UYM-2026-08-03-11 — Zakhar Prilepin, `Есенин. Обещая встречу впереди`

```yaml
Drive_file_id: 1nbSM4EF87AU-tEemw6qv9grHZ3b93Mh0
filename_claim: Прилепин З. — Есенин. Обещая встречу впереди
format: DJVU multi-page
file_size_bytes: 16164161
sha256: ec5e78cd1d4d1adee0c7f4f08714c3bed7a37a1907941039681ba57f60ff72a9
DJVM_containers: 1
DJVU_page_components: 1092
INFO_page_chunks: 1092
FORM_chunks_total: 1202
embedded_TXTz_chunks: 1084
text_layer: embedded compressed OCR appears present; not decoded in current environment
title_imprint_visually_verified: false
rights_status: PRIVATE-RESEARCH-ONLY / RIGHTS-UNCLEAR
current_use: secondary biography after trusted rendering/text extraction
```

### Correction

The previous `1201 pages` value reflected total DjVu container chunks, not actual pages. The file contains 1092 page components and 1202 total `FORM` chunks.

### Boundary

- embedded OCR presence is not the same as verified readable text;
- filename title is not a visually checked imprint;
- the modern biography is a secondary interpretive source;
- no death claim, diagnosis or spiritual conclusion is accepted from it without document-level verification;
- no format conversion or canonical promotion occurs until provenance/rights and title pages are checked.

## 4. Current result

```yaml
objects_checked: 3
outer_SHA_verified: 3
inner_EPUB_SHA_verified: 1
EPUB_cover_TOC_verified: 1
DJVU_structure_verified: 2
DJVU_title_imprint_verified: 0
incorrect_container_as_page_counts_corrected: 2
derivative_PDFs_created: 0
canonical_library_promotions: 0
production_rights_closed: 0
```

## 5. Next actions

1. obtain a trusted DjVu decoder/renderer or lawful alternate edition for Jangfeldt and Prilepin;
2. verify title/imprint and exact edition before page-level claims;
3. use Bykov only as a modern interpretation layer;
4. do not spend OCR resources on whole modern biographies while primary-document blockers remain;
5. retain original bytes and current SHA values.