# Open Research Source Registry — canonical index

**Project:** THE LEGENDARY POET  
**Canonical branch:** `editorial/longform-marathon-2026-08`  
**Canonical PR:** `#271`  
**Current discovery pass:** `OSR-2026-08-03-P07`  
**Current acquisition pass:** `OSR-2026-08-03-P08`  
**Current verification pass:** `AUDIT-2026-08-03-P15`  
**Registered discovery rows:** `287`

## 1. Canonical registry

The operational registry is the native Google Sheet:

- **Title:** `THE LEGENDARY POET — OPEN RESEARCH SOURCE REGISTRY`
- **Drive file ID:** `1QEmUdSWEFZLjtUenU8B0zzirRiiZ1XP6QKxhqsAfnMM`
- **Registry folder ID:** `1LAF8M6BD3zjbFe4A2O3x4nrBtFQZjlI9`

GitHub stores controlling policy, dated audit reports, exact source identities, corrections, duplicate decisions and acquisition evidence. Drive stores verified research binaries and portable registry snapshots.

## 2. Discovery history versus direct audit

Columns `A:Q` preserve discovery history. Columns `R:Y` are the authoritative direct-audit layer:

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

Legacy values such as `READ-OK`, `DOWNLOAD-OK`, `LINK-REGISTERED`, `NEW` and priority `A` are not verification.

## 3. Current honest counters

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
tracked_dashboard_scopes: 66
latest_source_id: OSR-0287
```

The discovery total must never be reported as the verified total.

The 223 directly audited rows comprise:

- 45 world-literature rows `OSR-0242..OSR-0286` from pass 09;
- 24 Pushkin, Blok and Yesenin academic-corpus rows from pass 10;
- 22 Mayakovsky, Lermontov, Mandelstam, Khlebnikov, Nekrasov and Tyutchev rows from pass 11;
- 12 museum, archive, RSL, Presidential Library and thesis rows from pass 12;
- 14 RSL/NEL and early-edition rows from pass 13;
- 50 RSL/NEL/RVB/FEB/archive/museum rows from pass 14;
- 50 rows `OSR-0166..OSR-0215` from pass 15;
- 3 previously manifested Yesenin binaries;
- 3 verified duplicate controls.

Every other row remains `UNVERIFIED-DISCOVERY / HOLD / AUDIT-PENDING` until its own dated audit is completed.

## 4. Pass 09 — world literature

```yaml
rows_audited: 45
KEEP-LINK: 26
KEEP-DOWNLOAD-CANDIDATE: 7
HOLD-RETRY: 8
HOLD-RIGHTS: 1
HOLD-IDENTITY: 1
DROP-BROKEN: 2
```

Verified candidates: Folger downloadable Shakespeare texts under the recorded noncommercial condition; Goethe's *Faust I* and *Faust II*; Spanish *Don Quijote*; the ten- and twelve-book representations of *Paradise Lost*; and *Paradise Regained*.

`OSR-0251` remains on rights hold. `OSR-0285` remains on identity hold. Exact Gallica URLs `OSR-0282` and `OSR-0286` were dropped after direct 404 results.

## 5. Pass 10 — Pushkin, Blok and Yesenin

```yaml
rows_audited: 24
KEEP-LINK: 12
HOLD-RETRY: 12
```

Retained material includes Pushkin Digital, exact FEB/RVB academic-corpus pages, the RVB Blok portal and volumes 1–3, the FEB description of Yesenin's seven-volume edition and RVB Yesenin volumes 1–2.

Modern electronic-publication or edition rights remain `BLOCKED-REPRODUCTION`. Cache, decoding and fetch failures were not called permanent dead links.

## 6. Pass 11 — Mayakovsky through Tyutchev

```yaml
rows_audited: 22
KEEP-LINK: 6
HOLD-RETRY: 16
```

Retained rows include the RVB Mayakovsky anthology, RVB Lermontov portal, exact Lermontov volume 1, RVB Mandelstam portal and volume 4, and the RVB Nekrasov portal.

The Lermontov PDF was directly identified, but modern rights on commentary, foreword, layout and cover block mirroring. FEB/Ruthenia/RVB technical failures remain retry holds.

## 7. Pass 12 — museums, archives, RSL and theses

```yaml
rows_audited: 12
KEEP-LINK: 8
KEEP-DOWNLOAD-CANDIDATE: 1
HOLD-RETRY: 2
HOLD-RIGHTS: 1
```

Material corrections and gates:

- Mayakovsky notebook no. 71: Moscow 1930, 38 leaves, museum identifier `РД-222`;
- `OSR-0047`: corrected to the Mayakovsky section of S. A. Tregub fund 2872, inventory 1;
- Khlebnikov issue 12: PDF route confirmed but no reusable-file licence;
- Harvard Weinstein dissertation: verified `CC BY 4.0` download candidate;
- all 75 legacy testimony quotations remain `HOLD-DIRECT-READ`.

## 8. Pass 13 — RSL/NEL and early editions

```yaml
rows_audited: 14
KEEP-LINK: 8
HOLD-RIGHTS: 5
HOLD-RETRY: 1
```

Directly retained RSL links cover Tsvetaeva, Gumilev, Fet and Zabolotsky. Rights holds cover exact Derzhavin, Bryusov, Balmont and Severyanin PDF routes.

Corrections include Bryusov volume 7 dating, the `[19??]` imprint of *Mea*, and the sixth-edition identity of Severyanin's *Громокипящий кубок*.

## 9. Pass 14 — first fifty-row marathon

```yaml
rows_audited: 50
KEEP-LINK: 12
KEEP-DOWNLOAD-CANDIDATE: 2
HOLD-RIGHTS: 17
HOLD-RETRY: 19
new_sources: 0
binary_uploads: 0
```

New verified candidates:

- `OSR-0111` — *Specimens of the Russian Poets*, volume 1;
- `OSR-0112` — *The Bakchesarian Fountain and Other Poems*.

Both are Project Gutenberg United States public-domain representations and still require exact format selection, jurisdiction note, bytes, completeness, dedupe and SHA-256.

Major corrections covered Derzhavin's seven-volume representation, Balmont volume 5, Voloshin fund 102 and title/publication dating, Klyuev edition identities, Gippius publication coverage, Bely and Sologub exact titles, and Maikov/Polonsky extents.

## 10. Pass 15 — second fifty-row marathon

```yaml
rows_audited: 50
KEEP-LINK: 19
HOLD-RIGHTS: 3
HOLD-IDENTITY: 1
HOLD-RETRY: 27
new_sources: 0
binary_uploads: 0
```

The pass directly audited `OSR-0166..OSR-0215` covering Nadson, Khodasevich, Parnok, Lokhvitskaya, Cherubina de Gabriak, Brodsky, Tvardovsky, Okudzhava, Lomonosov, Sumarokov, Trediakovsky and Karamzin.

Material findings and corrections:

- Parnok's 1979 Ardis collected poems: 388 pages plus four illustration leaves, modern apparatus, `KEEP-LINK`;
- Lokhvitskaya Wikisource corpus: mixed witnesses, not one edition;
- Lokhvitskaya `Version 3`: page labels 1899, but source basis is a 1979 anthology with a 1989 supplement; `HOLD-IDENTITY`;
- Cherubina de Gabriak Wikisource corpus: mainly a 1989 anthology plus supplements, auxiliary only;
- three Culture.ru poem pages: exact pages confirmed, no print-edition basis, active-link attribution required;
- Brodsky URL: museum-foundation navigation, not a direct collection catalogue; site materials are protected;
- Tvardovsky archive: fund 1816, 1935–1976, two inventories, 702 units; URL path `7615` is not the fund number;
- exact *Vasilii Terkin* object: chapter XVI `Бой в болоте`, unpublished variant, fund 618, inventory 2, unit 984, 1942–1944;
- Tvardovsky estate museum: no authentic exhibits; objects are typological and furniture reconstructed;
- Okudzhava museum: institutional navigation with active-link requirement and item-level media rights;
- Lomonosov part 2: 1840, `[6] + 356` pages, online reading, no redistribution licence;
- Sumarokov parent corpus: ten parts, 1781–1782; parts 1 and 3 confirmed complete but remain `HOLD-RIGHTS`;
- Trediakovsky RVB basis: second edition of *Избранные произведения*, 1963;
- exact FEB chapter by G. N. Moiseeva and Yu. V. Stennik: 1980, pages 491–522;
- Karamzin RVB portal: navigation to modern edited electronic publications, not an unrestricted corpus.

Twenty-seven exact URLs returned HTTP 403, cache misses, decoding failures or internal errors. They remain `HOLD-RETRY`, not direct-read sources and not permanent-death findings.

## 11. Controlling verification and rights rules

```text
page title != edition identity
search snippet != direct reading
archive URL number != archival fund number
museum reconstruction != authentic-object provenance
free viewer access != downloadable file identity
PDF or digital-copy endpoint != open licence
public-domain author text != unrestricted scan, apparatus, database or image reuse
HTTP 403, timeout, cache miss or decoding failure != verified content
```

Every acquisition candidate still requires:

- real bytes and expected MIME;
- title-page and completeness inspection;
- page count and file size;
- text-layer classification;
- exact provenance and rights note;
- bounded Drive dedupe;
- SHA-256;
- a real Drive file ID after upload.

## 12. Verified binaries and duplicate controls

Directly manifested as `DRIVE-VERIFIED`:

- `OSR-0031` — Yesenin chronicle, volume 3, book 1; Drive ID `13q21pg9dd4EyAIhBVxZXJrxwjYGD0qK-`; SHA-256 `eaccd7e92a90087112a4425d6a211257ad3e80e9e47c05ce9943b7f4b1669014`;
- `OSR-0032` — Yesenin chronicle, volume 3, book 2; Drive ID `1d_3-aNk4eY5LqLWzU9XUt8J_g6-IynxN`; SHA-256 `89b33c7a472eab0c234877cd8737a1f2e12eebd142d0552a625eeb28d6ce4187`;
- `OSR-0287` — Yesenin chronicle, volume 5, book 1; Drive ID `1d7UCOxmX7SUPJkjclZKvNhJAAGhu1gHs`; SHA-256 `1c4a37276fc9e2e8da2a9b19c7b0c8941b6e43a0ec9aec5d42a55589e0145496`.

These are OCR research representations of IMLI academic editions, not original archive masters. Production reuse remains `PRIVATE-RESEARCH-HOLD`.

Verified duplicate controls:

- `OSR-0106` — bibliographic Severyanin duplicate;
- `OSR-0114` — exact Drive duplicate of Bryusov's *Urbi et Orbi*;
- `OSR-0124` — exact Drive duplicate of the 1915 Severyanin source in `BATCH-0001`.

## 13. Controlling policy and reports

- `docs/SOURCE_ACQUISITION_AND_DRIVE_POLICY.md`;
- `docs/RESEARCH_SOURCES.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_AND_CLEANUP_PASS_09_2026-08-03.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_PASS_10_FEB_RVB_2026-08-03.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_PASS_11_MAYAKOVSKY_LERMONTOV_MANDELSTAM_KHLEBNIKOV_NEKRASOV_TYUTCHEV_2026-08-03.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_PASS_12_MUSEUM_ARCHIVE_RSL_THESES_LEGACY_WEAK_SOURCES_2026-08-03.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_PASS_13_RSL_NEL_FIRST_EDITIONS_2026-08-03.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_PASS_14_FIFTY_EXISTING_ROWS_2026-08-03.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_PASS_15_FIFTY_EXISTING_ROWS_2026-08-03.md`.

Discovery passes 02–07 remain historical discovery evidence. Acquisition pass 08 records verified Yesenin binary acquisition.

## 14. Next direct-audit order

No new-source discovery is authorised while 64 existing rows remain unaudited.

Continue from existing `OSR-0216` through the remaining registered rows, then process retry holds as a separate queue. Exact Culture.ru, Wikisource, weak-mirror and legacy-testimony claims require source-specific authority and identity decisions.

All 75 legacy testimony quotations remain `HOLD-DIRECT-READ` until each named book, letter, memoir, article or archival item is directly read.