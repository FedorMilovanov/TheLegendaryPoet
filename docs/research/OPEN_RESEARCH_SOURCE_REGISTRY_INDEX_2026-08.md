# Open Research Source Registry — canonical index

**Project:** THE LEGENDARY POET  
**Canonical branch:** `editorial/longform-marathon-2026-08`  
**Canonical PR:** `#271`  
**Current discovery pass:** `OSR-2026-08-03-P07`  
**Current acquisition pass:** `OSR-2026-08-03-P08`  
**Current verification pass:** `AUDIT-2026-08-03-P11`  
**Registered discovery rows:** `287`

## 1. Canonical registry

The operational registry is the native Google Sheet:

- **Title:** `THE LEGENDARY POET — OPEN RESEARCH SOURCE REGISTRY`
- **Drive file ID:** `1QEmUdSWEFZLjtUenU8B0zzirRiiZ1XP6QKxhqsAfnMM`
- **URL:** https://docs.google.com/spreadsheets/d/1QEmUdSWEFZLjtUenU8B0zzirRiiZ1XP6QKxhqsAfnMM
- **Registry folder ID:** `1LAF8M6BD3zjbFe4A2O3x4nrBtFQZjlI9`

GitHub stores the controlling policy, dated audit reports, source identities, duplicate decisions and acquisition evidence. Drive stores verified research binaries and portable registry snapshots.

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
direct_audited_rows: 97
audit_pending_rows: 190
verified_keep_link: 44
verified_download_candidates: 7
drive_verified_binaries: 3
hold_retry: 36
hold_rights_or_identity: 2
drops_total: 5
tracked_dashboard_scopes: 66
latest_source_id: OSR-0287
```

The first number must never be reported as the number of verified sources.

The 97 directly audited rows currently comprise:

- all 45 world-literature rows `OSR-0242..OSR-0286`;
- 24 Pushkin, Blok and Yesenin academic-corpus rows from pass 10;
- 22 Mayakovsky, Lermontov, Mandelstam, Khlebnikov, Nekrasov and Tyutchev rows from pass 11;
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

Verified download candidates remain:

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

### Retained

- `OSR-0048` — РВБ Mayakovsky anthology page. Selected texts and overview only; `© РВБ 2017–2026`.
- `OSR-0052` — РВБ Lermontov author portal. Navigation only; `© РВБ 2020–2026`.
- `OSR-0054` — direct Lermontov volume-1 PDF. Real `application/pdf`, 778 digital pages, 776 printed pages, 2014 title/copyright identity confirmed. Explicit modern rights for commentary, foreword, layout and cover make the effective verdict `BLOCKED-REPRODUCTION / KEEP-LINK`, not Drive acquisition.
- `OSR-0071` — РВБ Mandelstam portal. Four editions and indices identified; `© РВБ 2010–2026`.
- `OSR-0073` — Mandelstam volume 4, letters. Bibliographic identity and explicit 1999/RVB copyrights confirmed.
- `OSR-0099` — РВБ Nekrasov portal. Navigation to the fifteen-volume collection; visible author essay derives from the 1968 encyclopedia article; `© РВБ 2018–2026`.

### Retry holds

- all eight stored ФЭБ Mayakovsky rows `OSR-0037..OSR-0044`;
- ФЭБ Tyutchev `OSR-0050`;
- Ruthenia/Tiutcheviana `OSR-0051`;
- overall РВБ Lermontov TOC `OSR-0053`;
- ФЭБ Lermontov portal and encyclopedia `OSR-0055..OSR-0056`;
- overall РВБ Mandelstam TOC `OSR-0072`;
- РВБ Khlebnikov portal `OSR-0094`;
- overall РВБ Nekrasov TOC `OSR-0100`.

Cache misses, Unicode decoding errors, fetch failures and DNS failures remain `HOLD-RETRY`. A parent portal confirming that a link exists does not make the unreadable exact row `VERIFIED-CONTENT`.

## 7. Verified binaries and duplicate controls

Directly manifested as `DRIVE-VERIFIED`:

- `OSR-0031` — Yesenin chronicle, volume 3, book 1; Drive ID `13q21pg9dd4EyAIhBVxZXJrxwjYGD0qK-`; SHA-256 `eaccd7e92a90087112a4425d6a211257ad3e80e9e47c05ce9943b7f4b1669014`.
- `OSR-0032` — Yesenin chronicle, volume 3, book 2; Drive ID `1d_3-aNk4eY5LqLWzU9XUt8J_g6-IynxN`; SHA-256 `89b33c7a472eab0c234877cd8737a1f2e12eebd142d0552a625eeb28d6ce4187`.
- `OSR-0287` — Yesenin chronicle, volume 5, book 1; Drive ID `1d7UCOxmX7SUPJkjclZKvNhJAAGhu1gHs`; SHA-256 `1c4a37276fc9e2e8da2a9b19c7b0c8941b6e43a0ec9aec5d42a55589e0145496`.

All three are verified OCR research representations of IMLI academic editions, not original archive masters. Production reuse remains `PRIVATE-RESEARCH-HOLD`.

Verified duplicate controls:

- `OSR-0106` — bibliographic Severyanin duplicate;
- `OSR-0114` — exact Drive duplicate of Bryusov's *Urbi et Orbi*;
- `OSR-0124` — exact Drive duplicate of the 1915 Severyanin source in `BATCH-0001`.

## 8. Controlling policy and reports

- `docs/SOURCE_ACQUISITION_AND_DRIVE_POLICY.md` — verification, openness, acquisition, dedupe, rights and SHA contract;
- `docs/RESEARCH_SOURCES.md` — legacy source list; any quotation not directly read remains HOLD;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_AND_CLEANUP_PASS_09_2026-08-03.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_PASS_10_FEB_RVB_2026-08-03.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_PASS_11_MAYAKOVSKY_LERMONTOV_MANDELSTAM_KHLEBNIKOV_NEKRASOV_TYUTCHEV_2026-08-03.md`;
- discovery passes 02–07 — historical discovery evidence only;
- acquisition pass 08 — verified Yesenin binary acquisition.

## 9. Next direct-audit order

No new-source discovery is authorised while 190 existing rows remain unaudited.

Continue by existing source cluster:

1. Mayakovsky museum and archive rows: GMM and RGALI;
2. RSL, RusNEB/NEL and dlib records for Khlebnikov and Russian first editions;
3. President's Library and archive collection rows for Nekrasov and nineteenth-century authors;
4. university repositories and theses already present in the registry;
5. Wikisource, Culture.ru and commercial/popular navigation;
6. legacy quotations and low-authority links in `docs/RESEARCH_SOURCES.md`.

Each retained row requires its own URL, identity, rights and final-verdict evidence. A trusted institution does not automatically verify every stored URL or every item inside it.