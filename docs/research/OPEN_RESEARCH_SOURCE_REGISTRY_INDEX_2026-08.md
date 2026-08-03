# Open Research Source Registry — canonical index

**Project:** THE LEGENDARY POET  
**Canonical branch:** `editorial/longform-marathon-2026-08`  
**Canonical PR:** `#271`  
**Current discovery pass:** `OSR-2026-08-03-P07`  
**Current acquisition pass:** `OSR-2026-08-03-P08`  
**Current verification pass:** `AUDIT-2026-08-03-P13`  
**Registered discovery rows:** `287`

## 1. Canonical registry

The operational registry is the native Google Sheet:

- **Title:** `THE LEGENDARY POET — OPEN RESEARCH SOURCE REGISTRY`
- **Drive file ID:** `1QEmUdSWEFZLjtUenU8B0zzirRiiZ1XP6QKxhqsAfnMM`
- **URL:** https://docs.google.com/spreadsheets/d/1QEmUdSWEFZLjtUenU8B0zzirRiiZ1XP6QKxhqsAfnMM
- **Registry folder ID:** `1LAF8M6BD3zjbFe4A2O3x4nrBtFQZjlI9`

GitHub stores the controlling policy, dated audit reports, source identities, corrections, duplicate decisions and acquisition evidence. Drive stores verified research binaries and portable registry snapshots.

## 2. Discovery columns versus audit columns

Columns `A:Q` retain discovery history. Columns `R:Y` are the authoritative direct-audit layer:

```text
Verification state
URL live check
Content identity check
Rights/open status
Final audit verdict
Audit note
Verified at
Audit pass
```

Legacy values such as `READ-OK`, `DOWNLOAD-OK`, `LINK-REGISTERED`, `NEW` and priority `A` are not verification. They remain historical discovery metadata only.

## 3. Current honest counters

```yaml
registered_discovery_rows: 287
direct_audited_rows: 123
audit_pending_rows: 164
verified_keep_link: 60
verified_download_candidates: 8
drive_verified_binaries: 3
hold_retry: 39
hold_rights_or_identity: 8
drops_total: 5
tracked_dashboard_scopes: 66
latest_source_id: OSR-0287
```

The first number must never be reported as the number of verified sources.

The 123 directly audited rows currently comprise:

- all 45 world-literature rows `OSR-0242..OSR-0286`;
- 24 Pushkin, Blok and Yesenin academic-corpus rows from pass 10;
- 22 Mayakovsky, Lermontov, Mandelstam, Khlebnikov, Nekrasov and Tyutchev rows from pass 11;
- 12 museum, archive, RSL, Presidential Library and thesis rows from pass 12;
- 14 RSL/NEL and early-edition rows from pass 13;
- 3 previously manifested Yesenin binaries;
- 3 verified duplicate controls.

Every other row defaults to `UNVERIFIED-DISCOVERY / HOLD / AUDIT-PENDING` until its own dated audit is completed.

## 4. World-literature audit — pass 09

```yaml
rows_audited: 45
KEEP-LINK: 26
KEEP-DOWNLOAD-CANDIDATE: 7
HOLD-RETRY: 8
HOLD-RIGHTS: 1
HOLD-IDENTITY: 1
DROP-BROKEN: 2
```

Verified download candidates:

- `OSR-0243` — Folger downloadable Shakespeare texts, noncommercial condition;
- `OSR-0262` — Goethe, *Faust I*;
- `OSR-0263` — Goethe, *Faust II*;
- `OSR-0269` — Cervantes, Spanish *Don Quijote*;
- `OSR-0272` — Milton, *Paradise Lost*, twelve-book representation;
- `OSR-0273` — Milton, *Paradise Lost*, ten-book representation;
- `OSR-0274` — Milton, *Paradise Regained*.

These are candidates, not uploaded masters. Exact file/version selection, binary identity, rights, dedupe and SHA-256 are still required.

Rights and identity holds:

- `OSR-0251` — Homer Multitext release licence not confirmed;
- `OSR-0285` — BnF Baudelaire object identity did not match the registered first-edition description.

Dropped from active maps:

- `OSR-0282` — stored Gallica *Dom Juan* URL returned 404;
- `OSR-0286` — stored Gallica Symbolism URL returned 404.

## 5. ФЭБ/РВБ audit — pass 10

```yaml
rows_audited: 24
KEEP-LINK: 12
HOLD-RETRY: 12
```

Directly retained:

- Pushkin Digital as item-level navigation;
- the ФЭБ page describing Pushkin's letter editions;
- the РВБ ten-volume Pushkin corpus, author portal and verse-form index;
- the РВБ Blok portal and academic volumes 1–3;
- the ФЭБ description of Yesenin's seven-volume academic edition;
- РВБ Yesenin volumes 1–2.

The Blok academic volumes expose modern institutional copyright notices and are `BLOCKED-REPRODUCTION / KEEP-LINK`, not public-domain download sources.

Twelve exact stored URLs remained `HOLD-RETRY` because the audit environment returned cache misses, Unicode decoding errors or fetch failures. These failures are not permanent-death findings.

## 6. ФЭБ/РВБ/Ruthenia audit — pass 11

```yaml
rows_audited: 22
KEEP-LINK: 6
HOLD-RETRY: 16
new_sources: 0
binary_uploads: 0
```

Retained:

- `OSR-0048` — РВБ Mayakovsky anthology page; selected texts and overview only;
- `OSR-0052` — РВБ Lermontov author portal; navigation only;
- `OSR-0054` — direct Lermontov volume-1 PDF, 778 digital pages and 776 printed pages; modern rights on commentary, foreword, layout and cover mean `BLOCKED-REPRODUCTION / KEEP-LINK`, not Drive acquisition;
- `OSR-0071` — РВБ Mandelstam portal;
- `OSR-0073` — Mandelstam volume 4, letters and reference apparatus;
- `OSR-0099` — РВБ Nekrasov portal.

Retry holds include all eight stored ФЭБ Mayakovsky rows, ФЭБ Tyutchev, Ruthenia/Tiutcheviana, the overall Lermontov and Mandelstam TOCs, ФЭБ Lermontov pages, the РВБ Khlebnikov portal and the overall Nekrasov TOC.

Cache misses, Unicode decoding errors, fetch failures and DNS failures remain `HOLD-RETRY`. A parent portal confirming that a link exists does not make the unreadable exact row `VERIFIED-CONTENT`.

## 7. Museum, archive, RSL, thesis and weak-source audit — pass 12

```yaml
rows_audited: 12
KEEP-LINK: 8
KEEP-DOWNLOAD-CANDIDATE: 1
HOLD-RETRY: 2
HOLD-RIGHTS: 1
new_sources: 0
binary_uploads: 0
```

### Mayakovsky museum and RGALI

- `OSR-0045` — the State Mayakovsky Museum document/manuscript collection is valid institutional navigation. The site states all rights reserved; each object and image needs item-level clearance.
- `OSR-0046` — notebook no. 71 was directly identified as Moscow 1930, 38 leaves, museum identifier `РД-222`, with drafts of late poems and *Во весь голос*. It is `BLOCKED-REPRODUCTION / KEEP-LINK`.
- `OSR-0047` — materially corrected. The stored RGALI page is not a general Mayakovsky/Lili Brik archive. It is the Mayakovsky section inside S. A. Tregub fund 2872, inventory 1, containing 21 listed items.
- `OSR-0049` — the museum-history page is a useful institutional secondary account of the 1937–1940 museum formation, not a substitute for the underlying letters and archive objects.

### Khlebnikov and RSL

- `OSR-0095` — RSL confirms *Неизданный Хлебников*, issue 12, 1929, 20 leaves, a PDF route and free full viewing. No concrete reuse licence was confirmed, therefore `OPEN-ACCESS-NO-LICENSE / HOLD-RIGHTS`, not Drive acquisition.
- `OSR-0096` — issue 11, *Дневник Хлебникова*, 1929, 22 leaves; item-level reading link.
- `OSR-0098` — *Неизданные произведения*, 1940, 490 plus 2 pages; edition-level commentary and reuse rights remain item-specific.
- `OSR-0097` — the Ca' Foscari dissertation handle did not expose the object and remains `HOLD-RETRY`.

### University theses

- `OSR-0060` — Harvard DASH directly confirms Michael M. Weinstein's 2017 dissertation, a 3.53 MB PDF and `CC BY 4.0`. It is the eighth verified download candidate, but still requires actual bytes, MIME, title-page, completeness, dedupe and SHA-256.
- `OSR-0074` — Anne M. Iverson's 1973 Mandelstam dissertation was identified through Theses Canada and the University of Ottawa repository. No explicit reuse licence was confirmed; `KEEP-LINK`.
- `OSR-0075` — UCM's indexed record confirms the 2023 thesis, but the exact object returned 503 and its licence was not directly inspected; `HOLD-RETRY`.

### Weak-source control

`docs/RESEARCH_SOURCES.md` classifies source authority explicitly:

- Wikipedia and Ruwiki — navigation only;
- Wikisource, `ilibrary.ru` and Culture.ru poem pages — auxiliary text witnesses after the edition basis is established;
- `slova.org.ru`, `rustih.ru` and similar unattributed mirrors — excluded from the canonical pair of independent authorities;
- Foma, Pravmir and Polka — named secondary interpretations, not primary evidence;
- all 75 legacy testimony quotations — `HOLD-DIRECT-READ` until each is read in the named book, letter, memoir, article or archive object.

Search-snippet phrase matching is never sufficient to publish a quotation as exact.

## 8. RSL/NEL and early-edition audit — pass 13

```yaml
rows_audited: 14
KEEP-LINK: 8
HOLD-RIGHTS: 5
HOLD-RETRY: 1
new_sources: 0
binary_uploads: 0
```

### RSL links retained

- `OSR-0080` — E. B. Korkina's three-part Tsvetaeva chronicle, 2012–2014; modern copyrighted reference work, full viewer, no redistribution licence.
- `OSR-0083` — Gumilev's *Костер*, 1918, 43 pages; exact primary-edition viewer link.
- `OSR-0084` — Gumilev ten-volume collected works beginning in 1998; parent navigation to modern copyrighted volumes.
- `OSR-0085` — O. V. Shchegolkova dissertation, 2003, 211 pages; direct viewer/PDF route but no reuse licence.
- `OSR-0087` — Fet's *Лирический пантеон*, 1840, 109 plus 3 pages; viewer link, no verified scan licence.
- `OSR-0088` — Fet complete poetry volume 2, 1912, 442 pages; viewer link.
- `OSR-0104` — Zabolotsky's *Столбцы*, 2016 Nauka edition; modern scholarly edition, `BLOCKED-REPRODUCTION`.
- `OSR-0105` — Zabolotsky's *Вторая книга*, 1937, 45 plus 2 pages; link-only under copyright and scan restrictions.

### Rights holds

- `OSR-0108` — Derzhavin, works, part 1, 1808; application/pdf and 355 pages confirmed, but no item-level redistribution licence.
- `OSR-0116` — Bryusov volume 7, *Статьи о Пушкине*, 436 plus 1 pages; the stored `1913–1914` date was removed because the exact item record does not state it.
- `OSR-0117` — Bryusov's *Mea*, 107 pages plus portrait leaf; corrected from `1922` to `[19??] imprint; poems 1922–1924`.
- `OSR-0119` — Balmont's *Будем как солнце*, 1903, 290 pages plus preliminaries, approximately 160 MB PDF; no reuse licence.
- `OSR-0123` — Severyanin's *Громокипящий кубок*, 1914, specifically the sixth edition, 126 plus 4 plus III pages; edition identity corrected.

### Retry hold

- `OSR-0115` — Bryusov collected works volume 1 did not expose readable exact-item metadata in the audit environment; no identity or rights conclusion was made.

Pass 13 enforces:

```text
free viewer access != downloadable file identity
PDF endpoint != open licence
public-domain author text != unrestricted modern scan, apparatus or database reuse
```

## 9. Verified binaries and duplicate controls

Directly manifested as `DRIVE-VERIFIED`:

- `OSR-0031` — Yesenin chronicle, volume 3, book 1; Drive ID `13q21pg9dd4EyAIhBVxZXJrxwjYGD0qK-`; SHA-256 `eaccd7e92a90087112a4425d6a211257ad3e80e9e47c05ce9943b7f4b1669014`.
- `OSR-0032` — Yesenin chronicle, volume 3, book 2; Drive ID `1d_3-aNk4eY5LqLWzU9XUt8J_g6-IynxN`; SHA-256 `89b33c7a472eab0c234877cd8737a1f2e12eebd142d0552a625eeb28d6ce4187`.
- `OSR-0287` — Yesenin chronicle, volume 5, book 1; Drive ID `1d7UCOxmX7SUPJkjclZKvNhJAAGhu1gHs`; SHA-256 `1c4a37276fc9e2e8da2a9b19c7b0c8941b6e43a0ec9aec5d42a55589e0145496`.

All three are verified OCR research representations of IMLI academic editions, not original archive masters. Production reuse remains `PRIVATE-RESEARCH-HOLD`.

Verified duplicate controls:

- `OSR-0106` — bibliographic Severyanin duplicate;
- `OSR-0114` — exact Drive duplicate of Bryusov's *Urbi et Orbi*;
- `OSR-0124` — exact Drive duplicate of the 1915 Severyanin source in `BATCH-0001`.

## 10. Controlling policy and reports

- `docs/SOURCE_ACQUISITION_AND_DRIVE_POLICY.md` — verification, openness, acquisition, dedupe, rights and SHA contract;
- `docs/RESEARCH_SOURCES.md` — authority-classified legacy list; all quotations not directly read remain HOLD;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_AND_CLEANUP_PASS_09_2026-08-03.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_PASS_10_FEB_RVB_2026-08-03.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_PASS_11_MAYAKOVSKY_LERMONTOV_MANDELSTAM_KHLEBNIKOV_NEKRASOV_TYUTCHEV_2026-08-03.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_PASS_12_MUSEUM_ARCHIVE_RSL_THESES_LEGACY_WEAK_SOURCES_2026-08-03.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_PASS_13_RSL_NEL_FIRST_EDITIONS_2026-08-03.md`;
- discovery passes 02–07 — historical discovery evidence only;
- acquisition pass 08 — verified Yesenin binary acquisition.

## 11. Next direct-audit order

No new-source discovery is authorised while 164 existing rows remain unaudited.

Continue by existing source cluster:

1. remaining Derzhavin and nineteenth-century NEL volumes;
2. Voloshin, Klyuev, Gippius, Bely, Sologub, Ivanov and Merezhkovsky objects already registered;
3. Maykov, Polonsky, Apukhtin and other exact dlib routes;
4. eighteenth-century and Pushkin-era book monuments;
5. remaining university repositories and thesis rows;
6. exact Culture.ru, Wikisource, `ilibrary.ru` and weak-mirror entries;
7. all 75 testimony quotations, one exact named source at a time.

Each retained row requires its own URL, identity, rights and final-verdict evidence. A trusted institution or matching search snippet does not verify every stored URL, object or quotation.