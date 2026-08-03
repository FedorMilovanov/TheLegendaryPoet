# Open Research Source Audit — Pass 12: museums, archives, RSL, theses and legacy weak sources

**Date:** 3 August 2026  
**Mode:** verification-only; no new-source discovery  
**Canonical branch:** `editorial/longform-marathon-2026-08`  
**Canonical PR:** `#271`  
**Audit ID:** `AUDIT-2026-08-03-P12`

## 1. Scope

This pass audited twelve existing registry rows and reviewed the authority rules for weak or popular links already stored in `docs/RESEARCH_SOURCES.md`.

Registry rows:

- Mayakovsky museum and archive: `OSR-0045`, `OSR-0046`, `OSR-0047`, `OSR-0049`;
- Harvard dissertation: `OSR-0060`;
- Mandelstam dissertations: `OSR-0074`, `OSR-0075`;
- Khlebnikov RSL and university records: `OSR-0095..OSR-0098`;
- Nekrasov Presidential Library section: `OSR-0101`.

No author, edition, replacement source or new registry row was added.

## 2. Registry result

```yaml
rows_directly_audited_in_pass: 12
KEEP-LINK: 8
KEEP-DOWNLOAD-CANDIDATE: 1
HOLD-RETRY: 2
HOLD-RIGHTS: 1
new_sources_added: 0
binary_uploads: 0
```

Registry-wide state after this pass:

```yaml
registered_discovery_rows: 287
direct_audited_rows: 109
audit_pending_rows: 178
verified_keep_link: 52
verified_download_candidates: 8
drive_verified_binaries: 3
hold_retry: 38
hold_rights_or_identity: 3
drops_total: 5
```

## 3. Mayakovsky museum and archive corrections

### OSR-0045 — museum manuscript/document collection

The State Mayakovsky Museum collection page opened and exposed categories and individual object cards, including notebooks, documents, notes to Lili Brik and manuscript objects.

The site states that its materials are all-rights-reserved and that use requires a source link. This is not a blanket licence for reproduction of object images.

```yaml
verification: VERIFIED-NAVIGATION
rights: ITEM-LEVEL
verdict: KEEP-LINK
```

### OSR-0046 — notebook no. 71

The exact object page opened and confirmed:

```yaml
title: Записная книжка В. Маяковского № 71
place_year: Москва, 1930
extent: 38 leaves
museum_identifier: РД-222
content: drafts of late poems and fragments of Во весь голос
provenance: received from L. Yu. Brik in 1938
```

The museum describes 73 Mayakovsky notebooks and states that 68 are held in its manuscript/document fund. The exact page is useful item-level evidence, but its image and page reproduction remain protected.

```yaml
verification: VERIFIED-CONTENT
rights: BLOCKED-REPRODUCTION
verdict: KEEP-LINK
```

### OSR-0047 — RGALI identity correction

The stored RGALI URL was materially overdescribed. It is not a general Mayakovsky/Lili Brik archive catalogue.

The exact page is:

```yaml
fund: ф. 2872 — Семен Адольфович Трегуб
inventory: оп. 1
section: Материалы В. В. Маяковского
listed_items: 21
```

The section includes Mayakovsky essays, a poem, the 20 January 1921 letter to Lili Brik, the 12 April 1930 letter «Всем», reception materials and Lili Brik's 24 November 1935 letter to Stalin.

The registry title and description were corrected in place. This is navigation by exact archival cipher, not proof that the leaves were read or cleared for reproduction.

```yaml
verification: VERIFIED-NAVIGATION
rights: ITEM-LEVEL
verdict: KEEP-LINK
```

### OSR-0049 — museum history, 1937–1940

The institutional history page opened and documents the museum-opening order of 23 December 1937 and the campaign around Lili Brik's letter to Stalin. It remains an institutional secondary account. Claims based on quoted correspondence should still be tied to the exact underlying letter or archival object.

```yaml
verification: VERIFIED-CONTENT
rights: BLOCKED-REPRODUCTION
verdict: KEEP-LINK
```

## 4. Khlebnikov RSL records

### OSR-0095 — *Неизданный Хлебников*, issue 12

The exact RSL record confirms:

```yaml
year: 1929
extent: 20 leaves
contents: Бунт жаб; Стихи; Статья; Окончание Дневника Хлебникова
MARC_file_type: application/pdf
access: free full viewer
```

The record exposes a direct PDF route, but no item-level reuse licence was confirmed. Free viewing and a PDF endpoint do not establish permission to mirror the file into Drive.

```yaml
verification: VERIFIED-CONTENT
rights: OPEN-ACCESS-NO-LICENSE
verdict: HOLD-RIGHTS
```

### OSR-0096 — issue 11, *Дневник Хлебникова*

The exact RSL record confirms the 1929 issue and 22 leaves, with free full viewing. No direct file identity or reuse licence was inspected.

```yaml
verification: VERIFIED-CONTENT
rights: ITEM-LEVEL
verdict: KEEP-LINK
```

### OSR-0098 — *Неизданные произведения*, 1940

The RSL record confirms the 1940 Moscow edition, 490 plus 2 pages, edited and commented by N. Khardzhiev and T. Grits, with free full viewing.

The author text may be public-domain in some jurisdictions, but the edition-level apparatus and reproduction terms were not established.

```yaml
verification: VERIFIED-CONTENT
rights: ITEM-LEVEL
verdict: KEEP-LINK
```

### OSR-0097 — Ca' Foscari dissertation

The exact stored repository handle did not expose the claimed dissertation, and no same-record institutional result was obtained in this audit.

```yaml
verification: FAILED-LIVE-CHECK
url: CACHE-MISS
verdict: HOLD-RETRY
```

## 5. University dissertations

### OSR-0060 — Harvard DASH

The Harvard record directly confirms Michael M. Weinstein's 2017 dissertation *Device: The Objects of Russian and American Avant-Garde Poetry, 1905–1945*, a 3.53 MB PDF and a Creative Commons Attribution 4.0 licence.

This is the only newly verified download candidate in the pass.

```yaml
verification: VERIFIED-RIGHTS
rights: CC-BY-4.0
verdict: KEEP-DOWNLOAD-CANDIDATE
```

Technical acquisition still requires actual bytes, MIME, title-page inspection, completeness, dedupe and SHA-256.

### OSR-0074 — Iverson dissertation

The Theses Canada record and linked University of Ottawa repository object identify Anne M. Iverson's 1973 dissertation *Adaptation of the Hellenic legacy in the poetic art of Osip Mandel'shtam* and a 10.56 MB PDF.

No explicit reuse licence was confirmed.

```yaml
verification: VERIFIED-CONTENT
rights: LINK-ONLY
verdict: KEEP-LINK
```

### OSR-0075 — UCM dissertation

The exact UCM URL returned 503. The institution's indexed record confirms Natalia Morozova Morozov's 2023 thesis and indicates an open-access handle, but the actual full-text object and licence were not directly inspected.

```yaml
verification: FAILED-LIVE-CHECK
identity: CONFIRMED-BY-INSTITUTIONAL-INDEX
verdict: HOLD-RETRY
```

## 6. Nekrasov — Presidential Library

`OSR-0101` opened as the Presidential Library's Nekrasov collected-works section. It lists exact objects, including the two-volume 1899 *Полное собрание стихотворений* and archival materials.

The section is useful institutional navigation. Availability and rights vary by object, and the section is not blanket download authority.

```yaml
verification: VERIFIED-NAVIGATION
rights: ITEM-LEVEL
verdict: KEEP-LINK
```

## 7. Legacy weak-source review

The legacy source file mixed primary/academic sources with text mirrors, popular religious media, encyclopaedias and general literary explainers. The following classes are now mandatory:

### Navigation only

- Wikipedia and Ruwiki;
- general portal or collection pages without an exact item;
- museum and archive landing pages.

They may help locate names, dates and bibliographies. They cannot be the final evidence for a disputed or important claim.

### Auxiliary text witnesses

- `ilibrary.ru`;
- `culture.ru/poems`;
- Wikisource pages without clearly recorded edition metadata.

They may be used to compare wording after the exact print/electronic basis is identified. They do not replace an academic edition.

The directly tested `ilibrary.ru` Pushkin page failed Unicode decoding and remains `HOLD-RETRY`. A Culture.ru poem page timed out in this environment and is not called dead.

### Low-authority mirrors

- `slova.org.ru`;
- `rustih.ru` / `rustih.com`;
- similar unattributed poem mirrors.

A tested `slova.org.ru` page displayed the complete poem but exposed no visible source edition or scholarly apparatus. Such pages are removed from canonical citation status. They may be used only as emergency difference detectors and never as one of the two required independent authorities.

### Named popular secondary sources

- `foma.ru`;
- `pravmir.ru`;
- similar editorial or confessional publications.

The tested Foma page is a compilation of witness quotations and M. M. Dunaev's theological-literary interpretation. The tested Pravmir page is an editorial presentation of the Pushkin–Filaret poetic exchange without a critical source apparatus.

These pages may be cited as named interpretations or navigation. Exact historical quotations must be checked in the memoir, letter, academic publication or archival object they claim to reproduce.

### Named literary explainers

- `polka.academy`.

The tested Polka article names its commentator, Lev Oborin, and includes bibliographic notes. It is a useful secondary essay, not a primary text or sole proof of chronology, quotation or archival fact.

### Legacy testimonies

The 75 testimony entries described in `docs/RESEARCH_SOURCES.md` were previously compared through search-result phrase matching because direct fetch was unavailable. None of those quotations becomes verified merely because two or three snippets matched.

Until each quotation is read in the named book, letter, memoir or article, its effective state is:

```yaml
verification: HOLD-DIRECT-READ
publication_use: prohibited as exact quotation
allowed_use: research lead only
```

## 8. Rule additions

The status guide now includes:

- `CC-BY-4.0` — exact item licence verified;
- `OPEN-ACCESS-NO-LICENSE` — readable/downloadable but no reuse licence confirmed;
- `AUDIT-2026-08-03-P12`.

No binary was downloaded or uploaded in this pass.

## 9. Next audit order

Continue without new-source discovery:

1. remaining RSL/RusNEB/dlib and book-monument rows;
2. eighteenth- and nineteenth-century first editions already queued;
3. remaining university repository rows;
4. exact Culture.ru, Wikisource, ilibrary and weak-mirror entries;
5. all 75 testimony quotations, one exact source at a time.

A domain reputation or matching search snippet cannot replace exact row-level reading, identity and rights verification.