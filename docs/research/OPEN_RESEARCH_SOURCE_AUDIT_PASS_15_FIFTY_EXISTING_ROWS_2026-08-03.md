# Open Research Source Audit — Pass 15: second fifty-row marathon

**Date:** 3 August 2026  
**Mode:** verification-only; no new-source discovery  
**Canonical branch:** `editorial/longform-marathon-2026-08`  
**Canonical PR:** `#271`  
**Audit ID:** `AUDIT-2026-08-03-P15`

## 1. Scope

This pass directly audited exactly fifty existing registry rows:

```text
OSR-0166..OSR-0215
```

The pass covered Nadson, Khodasevich, Parnok, Lokhvitskaya, Cherubina de Gabriak, Brodsky, Tvardovsky, Okudzhava, Lomonosov, Sumarokov, Trediakovsky and Karamzin.

No author, edition, replacement URL or registry row was added. No unverified binary was uploaded.

## 2. Result

```yaml
rows_directly_audited_in_pass: 50
KEEP-LINK: 19
HOLD-RIGHTS: 3
HOLD-IDENTITY: 1
HOLD-RETRY: 27
new_sources_added: 0
binary_uploads: 0
```

Registry-wide state after this pass:

```yaml
registered_discovery_rows: 287
direct_audited_rows: 223
audit_pending_rows: 64
verified_keep_link: 91
verified_download_candidates: 10
drive_verified_binaries: 3
hold_retry: 85
hold_rights_or_identity: 29
drops_total: 5
```

## 3. RSL records

### OSR-0174 — Parnok collected poems

The exact RSL record confirms:

```yaml
title: Собрание стихотворений
publication: Ann Arbor, Ardis
publication_year: 1979
extent: 388 pages plus 4 illustration leaves
prepared_and_annotated_by: S. V. Polyakova
access: full viewer
```

The modern edition and scholarly apparatus remain protected. Viewer access does not authorize a reusable binary.

```yaml
verification: VERIFIED-CONTENT
rights: BLOCKED-REPRODUCTION
verdict: KEEP-LINK
```

The other Nadson, Khodasevich, Parnok and Tsvetaeva/Parnok RSL records in this pass returned cache misses. They remain `HOLD-RETRY`; the stored discovery descriptions were not promoted into verified facts.

## 4. Wikisource identity corrections

### OSR-0179 — Lokhvitskaya mixed corpus

The Wikisource page is not a transcription of one complete print edition. It combines material attributed to an early publication with texts copied from `az.lib.ru` and later anthologies.

The authoritative description was corrected to:

```text
Стихотворения (Викитека; смешанный корпус)
```

```yaml
verification: VERIFIED-AUXILIARY
identity: CONFIRMED-WITH-CORRECTION
rights: PUBLIC-DOMAIN-MIXED
verdict: KEEP-LINK
```

Every poem must be verified against a named print source before canonical quotation.

### OSR-0180 — false 1899 edition identity

The page labels the selection as an 1899 version, but its own source statement identifies a 1979 anthology with a 1989 supplement and no page scans. It is therefore not a verified transcription of one 1899 edition.

The row was corrected to:

```text
Стихотворения (Викитека), версия 3 — компиляция 1979/1989
```

```yaml
verification: VERIFIED-CONTENT
identity: MISMATCH
verdict: HOLD-IDENTITY
```

This row cannot be used as a canonical edition witness until its source identity is resolved.

### OSR-0182 — Cherubina de Gabriak mixed corpus

The page carries a public-domain notice for the author texts, but the visible corpus is based mainly on the 1989 anthology *Царицы муз* with later supplements and no scans.

It remains auxiliary navigation, not a single-edition authority.

## 5. Culture.ru poem pages

The exact pages for:

- `Распятье`;
- `Цветы`;
- `В глубоких бороздах ладони`

were directly opened. The pages expose the poems but do not state a print source or edition basis. The portal requires an active hyperlink when its materials are quoted or copied.

All three rows are:

```yaml
verification: VERIFIED-AUXILIARY
rights: ATTRIBUTION-REQUIRED
verdict: KEEP-LINK
```

They are supporting text witnesses only. Exact quotations still require a named edition.

## 6. Brodsky corrections

### OSR-0186 — museum identity

The stored URL leads to the Joseph Brodsky Museum Foundation site. It is not a direct collection catalogue for the `Полторы комнаты` museum.

The row was corrected to:

```text
Фонд музея Иосифа Бродского; навигация к «Полутора комнатам»
```

The site states all rights reserved and is retained as institutional navigation only.

### OSR-0187 — lectures

The lecture page directly lists the `Часть речи` cycle and named events. Recordings, lecture texts and quoted Brodsky material remain separately copyrighted.

The three exact Nobel pages returned HTTP 403, and the Library of Congress finding-aid URL returned a cache miss. These are `HOLD-RETRY`, not direct-read sources.

## 7. Tvardovsky archival corrections

### OSR-0192 — RGALI fund number

The exact RGALI page confirms:

```yaml
fund_number: 1816
coverage: 1935–1976
inventories: 2
storage_units: 702
```

The number `7615` in the URL path is not the archival fund number.

### OSR-0193 — archive overview

The institutional overview dated 21 June 2025 directly describes the acquisition history and composition of fund 1816. It is retained as named institutional scholarship, while individual documents and images remain item-level.

### OSR-0194 — exact *Vasilii Terkin* object

The former generic description was narrowed to the exact archival object:

```yaml
work: Василий Теркин
chapter: XVI — Бой в болоте
representation: previously unpublished variant
coverage: 1942–1944
fund: 618
inventory: 2
storage_unit: 984
```

### OSR-0195 — museum provenance warning

The Culture.ru museum page explicitly states that the estate museum has no authentic exhibits: displayed objects are typological and furniture was recreated. The page cannot be used as provenance for original personal belongings.

## 8. Okudzhava museum

The official museum site opened and provides institutional navigation across exhibitions, events, objects and media. Its footer requires a link to the museum when materials are reused.

Modern texts, audio, video and object images still require item-level clearance.

```yaml
verification: VERIFIED-NAVIGATION
rights: ATTRIBUTION-REQUIRED-ITEM-LEVEL
verdict: KEEP-LINK
```

## 9. Lomonosov

Five exact FEB URLs returned cache or Unicode-decoding failures and remain `HOLD-RETRY`.

### OSR-0202 — historical volume

NEL confirms:

```yaml
title: Собрание сочинений, часть 2
publication_year: 1840
extent: 6 preliminary pages plus 356 pages
access: online reading
```

No item-level redistribution licence was identified.

```yaml
rights: OPEN-ACCESS-NO-LICENSE
verdict: HOLD-RIGHTS
```

## 10. Sumarokov

### OSR-0203 — RVB portal

The portal publishes selected works based on the 1957 second edition of the Poet's Library. It is not an unrestricted complete author corpus.

### OSR-0205 — ten-part parent catalogue

NEL confirms the ten-part complete works of 1781–1782 and access to individual parts. The parent page is navigation; each exact part needs separate file and rights verification.

### OSR-0206 and OSR-0207 — Book Monuments

Confirmed exact objects:

```yaml
OSR-0206:
  part: 1
  year: 1781
  extent: 364 pages plus one frontispiece leaf
  completeness: complete
OSR-0207:
  part: 3
  year: 1781
  extent: 396 pages
  completeness: complete
```

Both expose digital-copy routes but no item-level redistribution licence. They remain `HOLD-RIGHTS`, not Drive candidates.

## 11. Trediakovsky

The RVB portal identifies its text basis as the 1963 second edition of *Избранные произведения* in the Poet's Library. The exact table of contents opened and includes poetry, prose, notes, indexes and *Новый и краткий способ к сложению российских стихов*.

Both rows remain link-only because the modern edition and editorial apparatus are protected.

The exact Book Monuments page for the 1735 treatise failed to expose readable content and remains `HOLD-RETRY`.

### OSR-0211 — exact scholarly chapter

FEB directly exposes the chapter by G. N. Moiseeva and Yu. V. Stennik:

```yaml
title: Литературно-общественное движение 1730-х — начала 1760-х годов. Становление классицизма
publication: История русской литературы, volume 1
publication_year: 1980
pages: 491–522
```

It is named scholarship, not primary evidence.

## 12. Karamzin

The RVB author portal opened and identifies modern electronic versions of the 1966 complete poems, the 1964 selected works and other edited publications.

```yaml
verification: VERIFIED-NAVIGATION
rights: BLOCKED-REPRODUCTION
verdict: KEEP-LINK
```

The exact complete-poetry table of contents, verse-form index and NEL 1814 poetry-volume URL did not expose readable content. They remain `HOLD-RETRY`.

## 13. Rule enforced

This pass reinforces:

```text
page title != edition identity
public-domain author != reliable edition transcription
archive URL number != archival fund number
museum reconstruction != authentic-object provenance
viewer or digital-copy route != redistribution licence
HTTP 403, cache miss or decoding failure != direct reading
```

## 14. Spreadsheet and project state

The canonical Google Sheet was updated in place:

- all fifty rows have dated audit evidence in `R:Y`;
- incorrect title, coverage, edition and fund fields were corrected in `A:Q`;
- Dashboard now reports 223 directly audited rows and 64 pending;
- Pass Log contains `OSR-2026-08-03-P15`.

No discovery was resumed and no binary upload was claimed.

## 15. Next audit order

Continue through the remaining 64 discovery rows beginning at `OSR-0216`, then process retry holds separately. The 75 legacy testimony quotations remain `HOLD-DIRECT-READ` until each named book, letter, memoir, article or archive item is directly read.