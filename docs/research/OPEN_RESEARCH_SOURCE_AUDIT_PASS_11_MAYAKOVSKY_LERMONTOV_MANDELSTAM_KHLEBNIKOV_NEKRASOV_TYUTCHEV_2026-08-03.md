# Open Research Source Audit — Pass 11: Mayakovsky, Lermontov, Mandelstam, Khlebnikov, Nekrasov and Tyutchev

**Date:** 3 August 2026  
**Mode:** verification-only; no new-source discovery  
**Canonical branch:** `editorial/longform-marathon-2026-08`  
**Canonical PR:** `#271`  
**Audit ID:** `AUDIT-2026-08-03-P11`

## 1. Scope

This pass continued the row-level audit of the existing registry. It did not add authors, editions, replacement links or new binary candidates.

Twenty-two stored institutional rows were tested:

- ФЭБ Mayakovsky: `OSR-0037..OSR-0044`;
- РВБ Mayakovsky anthology: `OSR-0048`;
- ФЭБ Tyutchev and Ruthenia/Tiutcheviana: `OSR-0050..OSR-0051`;
- РВБ and ФЭБ Lermontov: `OSR-0052..OSR-0056`;
- РВБ Mandelstam: `OSR-0071..OSR-0073`;
- РВБ Khlebnikov: `OSR-0094`;
- РВБ Nekrasov: `OSR-0099..OSR-0100`.

Only exact stored URLs were tested. Existing portal links were used only to confirm that a failed collection route was still referenced by the same institution; this did not promote the failed exact URL to verified status.

## 2. Result

```yaml
rows_directly_audited_in_pass: 22
KEEP-LINK: 6
HOLD-RETRY: 16
new_sources_added: 0
binary_uploads: 0
```

Registry-wide state after this pass:

```yaml
registered_discovery_rows: 287
direct_audited_rows: 97
audit_pending_rows: 190
verified_keep_link: 44
verified_download_candidates: 7
drive_verified_binaries: 3
hold_retry: 36
hold_rights_or_identity: 2
drops_total: 5
```

## 3. Retained rows

### Mayakovsky

`OSR-0048` opened as the РВБ Mayakovsky section in the 1993 Nauka anthology *Русская поэзия «серебряного века». 1890–1917*.

Verdict:

```yaml
verification: VERIFIED-CONTENT
rights: BLOCKED-REPRODUCTION
verdict: KEEP-LINK
```

The page contains selected texts and a short overview. It is secondary navigation and a convenient text witness, not a substitute for the full academic Mayakovsky corpus. The page records `© Электронная публикация — РВБ, 2017–2026`.

### Lermontov

`OSR-0052` opened as the РВБ author portal with links to the collected works, biography and indices. It remains `VERIFIED-NAVIGATION / KEEP-LINK`; the portal records `© Электронная публикация — РВБ, 2020–2026`.

`OSR-0054` received the most important correction in this pass. The direct file opened as a real PDF:

```yaml
content_type: application/pdf
digital_pages: 778
printed_pages: 776
title: М. Ю. Лермонтов. Собрание сочинений в четырех томах. Том 1. Стихотворения 1828–1841
year: 2014
publisher: Издательство Пушкинского Дома
```

The title and copyright page explicitly state rights for the compilers and commentary authors, V. E. Vatsuro's heirs, the publisher's original layout and the cover design.

Therefore the legacy `DOWNLOAD-QUEUE` label is not an effective acquisition instruction. The authoritative audit verdict is:

```yaml
verification: VERIFIED-RIGHTS
rights: BLOCKED-REPRODUCTION
verdict: KEEP-LINK
Drive_mirroring: not authorised by this audit
```

The PDF is a strong directly readable research source, but public availability and a direct PDF endpoint do not establish permission to mirror it into the project Drive.

### Mandelstam

`OSR-0071` opened as the РВБ Mandelstam portal. The page identifies four editions, describes their print bases and exposes biography and indices. It remains navigation under `© Электронная публикация — РВБ, 2010–2026`.

`OSR-0073` opened as volume 4 of the four-volume collected works: letters, additions, chronology and indices. The page identifies the 1999 publication, named compilers and explicit copyright holders. Verdict: `VERIFIED-RIGHTS / BLOCKED-REPRODUCTION / KEEP-LINK`.

### Nekrasov

`OSR-0099` opened as the РВБ Nekrasov portal and links to the fifteen-volume collected works. The visible author essay reproduces a 1968 *Краткая литературная энциклопедия* article; the electronic page records `© РВБ, 2018–2026`.

Verdict: `VERIFIED-NAVIGATION / KEEP-LINK`. The portal may guide research but does not replace the exact volume or text page.

## 4. Retry holds

### ФЭБ Mayakovsky

All eight exact stored ФЭБ routes remained unverified:

- `OSR-0037` — portal: Unicode decoding failure;
- `OSR-0038` — works corpus: Unicode decoding failure;
- `OSR-0039` — collected-editions guide: cache miss;
- `OSR-0040` — thirteen-volume collection: cache miss;
- `OSR-0041` — twelve-volume collection: cache miss;
- `OSR-0042` — Katanian chronicle: Unicode decoding failure;
- `OSR-0043` — *Литературное наследство*, volume 65: cache miss;
- `OSR-0044` — Mayakovsky letters page: cache miss.

These rows are not declared false, irrelevant or permanently dead. They are `FAILED-LIVE-CHECK / HOLD-RETRY`. Their legacy descriptions may not be used as proof that the exact page was read.

### Tyutchev

- `OSR-0050` — ФЭБ Tyutchev portal returned a cache miss;
- `OSR-0051` — Ruthenia/Tiutcheviana did not expose readable content and also failed DNS resolution in the container environment.

Both remain `HOLD-RETRY`. A connector failure is not proof that Ruthenia or ФЭБ is permanently unavailable.

### Lermontov

- `OSR-0053` — the РВБ author portal still links to the four-volume collection, but the exact overall TOC failed Unicode decoding;
- `OSR-0055` — ФЭБ Lermontov scholarly portal returned a cache miss;
- `OSR-0056` — ФЭБ Lermontov Encyclopedia failed Unicode decoding.

The directly opened volume-1 page and PDF do not automatically verify the overall collection TOC or neighbouring ФЭБ rows.

### Mandelstam

`OSR-0072`, the overall four-volume TOC, failed Unicode decoding. The author portal confirms that the collection exists and describes its editorial basis, but exact row-level access remains `HOLD-RETRY`.

### Khlebnikov

`OSR-0094` appears in РВБ navigation, but the exact author portal failed Unicode decoding. The corpus was not directly inspected, so it remains `HOLD-RETRY`.

### Nekrasov

`OSR-0100`, the exact fifteen-volume collection TOC, failed Unicode decoding. The parent portal confirms the institutional link, but the collection row itself remains unverified.

## 5. Methodological findings

This pass reinforces five controls:

1. An institution-level reputation does not verify every URL on the institution's domain.
2. A parent portal may confirm that a collection link exists, but it does not convert an unreadable exact TOC into `VERIFIED-CONTENT`.
3. A public PDF endpoint does not prove public-domain or mirroring rights.
4. Modern academic apparatus, layout and introductions may remain protected even when the author's original works are public domain.
5. Unicode, cache, fetch and DNS failures belong in `HOLD-RETRY`, not `DROP-BROKEN`, unless a stable 404 or confirmed removal is observed.

## 6. Registry and repository mutations

Updated in the canonical Google Sheet:

- audit columns `R:Y` for all 22 rows;
- `DASHBOARD` counters;
- `PASS LOG`;
- `STATUS GUIDE` with `AUDIT-2026-08-03-P11`.

No legacy source row was deleted and no new row was appended.

## 7. Next direct-audit cluster

Continue without new-source discovery:

1. remaining museum and archive rows for Mayakovsky: GMM and RGALI;
2. RSL, NEL/RusNEB and dlib records for Khlebnikov and Russian first editions;
3. President's Library and archive collection rows for Nekrasov and other nineteenth-century authors;
4. university repository and thesis rows already present in the registry;
5. exact low-authority and legacy quotation rows in `docs/RESEARCH_SOURCES.md`.

Every row must receive a dated URL, identity, rights and final-verdict record. Downloading remains prohibited until the audit verdict explicitly permits technical acquisition.