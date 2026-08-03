# Open Research Source Registry — canonical index

**Project:** THE LEGENDARY POET  
**Canonical branch:** `editorial/longform-marathon-2026-08`  
**Canonical PR:** `#271`  
**Current discovery pass:** `OSR-2026-08-03-P07`  
**Current acquisition pass:** `OSR-2026-08-03-P08`  
**Current verification pass:** `AUDIT-2026-08-03-P10`  
**Registered discovery rows:** `287`

## 1. Canonical registry

The operational registry is the native Google Sheet:

- **Title:** `THE LEGENDARY POET — OPEN RESEARCH SOURCE REGISTRY`
- **Drive file ID:** `1QEmUdSWEFZLjtUenU8B0zzirRiiZ1XP6QKxhqsAfnMM`
- **URL:** https://docs.google.com/spreadsheets/d/1QEmUdSWEFZLjtUenU8B0zzirRiiZ1XP6QKxhqsAfnMM
- **Registry folder ID:** `1LAF8M6BD3zjbFe4A2O3x4nrBtFQZjlI9`

GitHub stores the controlling policy, dated audit reports, source identities, duplicate decisions and acquisition evidence. Drive stores verified research binaries and portable registry snapshots.

## 2. Discovery columns versus audit columns

Columns `A:Q` retain discovery history:

```text
Source ID
Poet / scope
Language
Source type
Title
Institution / repository
Year / coverage
Legacy access status
Legacy acquisition action
Priority
Drive comparison
Article / research use
Item URL
Direct file URL
Rights / handling note
Last checked
Discovery / acquisition pass
```

Columns `R:Y` are the authoritative direct-audit layer:

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

Legacy values such as `READ-OK`, `DOWNLOAD-OK`, `LINK-REGISTERED`, `NEW` and priority `A` are not verification. They remain useful historical discovery metadata only.

## 3. Current honest counters

```yaml
registered_discovery_rows: 287
direct_audited_rows: 75
audit_pending_rows: 212
verified_keep_link: 38
verified_download_candidates: 7
drive_verified_binaries: 3
hold_retry: 20
hold_rights_or_identity: 2
drops_total: 5
tracked_dashboard_scopes: 66
latest_source_id: OSR-0287
```

The first number must never be reported as the number of verified sources.

The 75 directly audited rows currently comprise:

- all 45 world-literature rows `OSR-0242..OSR-0286`;
- 24 Pushkin, Blok and Yesenin academic-corpus rows audited in pass 10;
- 3 previously manifested Yesenin binaries;
- 3 verified duplicate controls.

Every other row defaults to `UNVERIFIED-DISCOVERY / HOLD / AUDIT-PENDING` until its own dated audit is completed.

## 4. Pass 09 world-literature verdicts

```yaml
rows_audited: 45
KEEP-LINK: 26
KEEP-DOWNLOAD-CANDIDATE: 7
HOLD-RETRY: 8
HOLD-RIGHTS: 1
HOLD-IDENTITY: 1
DROP-BROKEN: 2
```

### Verified download candidates

- `OSR-0243` — Folger downloadable Shakespeare texts; explicit noncommercial condition.
- `OSR-0262` — Goethe, *Faust I*; Project Gutenberg, public-domain notice limited to the United States basis.
- `OSR-0263` — Goethe, *Faust II*; same jurisdiction boundary.
- `OSR-0269` — Cervantes, Spanish *Don Quijote*; same jurisdiction boundary.
- `OSR-0272` — Milton, *Paradise Lost*, twelve-book representation.
- `OSR-0273` — Milton, *Paradise Lost*, ten-book representation.
- `OSR-0274` — Milton, *Paradise Regained*.

These are candidates, not uploaded masters. They still require exact file/version selection, binary identity, encoding or structure checks, dedupe and SHA-256.

### Rights and identity holds

- `OSR-0251` — Homer Multitext digital releases: resources are visible, but a concrete release licence was not confirmed; `HOLD-RIGHTS`.
- `OSR-0285` — BnF Baudelaire media page: linked Gallica object resolved to printing proofs, not an unambiguous first-edition book; `HOLD-IDENTITY`.

### Retry holds and drops

Retry:

- `OSR-0252`, `OSR-0253` — Scaife routes exposed only application shells;
- `OSR-0259` — Dante Lab timeout;
- `OSR-0267` — BNE interactive Quijote returned 502;
- `OSR-0268` — stored Cervantes Virtual route did not expose the object;
- `OSR-0280`, `OSR-0281` — Gallica Molière selections did not load;
- `OSR-0284` — Victor Hugo poetry selection returned 403.

Dropped from active maps:

- `OSR-0282` — stored Gallica *Dom Juan* selection returned 404;
- `OSR-0286` — stored Gallica Symbolism selection returned 404.

Corrected URL:

- `OSR-0271` — Dartmouth Milton rare-book page now uses the working institutional host `mail.milton.host.dartmouth.edu` rather than creating a duplicate row.

## 5. Pass 10 ФЭБ/РВБ verdicts

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

The Blok academic volumes expose modern institutional copyright notices and are classified `BLOCKED-REPRODUCTION / KEEP-LINK`, not as downloadable public-domain files.

Twelve exact stored URLs remained `HOLD-RETRY` because the audit environment returned cache misses, Unicode decoding errors or fetch failures. These failures are not reported as permanent dead links. Row-level verdicts are required even when neighbouring pages on the same trusted domain work correctly.

## 6. Verified binaries and duplicate controls

Directly manifested as `DRIVE-VERIFIED`:

- `OSR-0031` — Yesenin chronicle, volume 3, book 1; Drive ID `13q21pg9dd4EyAIhBVxZXJrxwjYGD0qK-`; SHA-256 `eaccd7e92a90087112a4425d6a211257ad3e80e9e47c05ce9943b7f4b1669014`.
- `OSR-0032` — Yesenin chronicle, volume 3, book 2; Drive ID `1d_3-aNk4eY5LqLWzU9XUt8J_g6-IynxN`; SHA-256 `89b33c7a472eab0c234877cd8737a1f2e12eebd142d0552a625eeb28d6ce4187`.
- `OSR-0287` — Yesenin chronicle, volume 5, book 1; Drive ID `1d7UCOxmX7SUPJkjclZKvNhJAAGhu1gHs`; SHA-256 `1c4a37276fc9e2e8da2a9b19c7b0c8941b6e43a0ec9aec5d42a55589e0145496`.

All three are verified OCR research representations of IMLI academic editions. They are not original archive masters, and production reuse remains `PRIVATE-RESEARCH-HOLD`.

Verified duplicate controls:

- `OSR-0106` — bibliographic Severyanin duplicate;
- `OSR-0114` — exact Drive duplicate of Bryusov's *Urbi et Orbi*, Drive ID `1Kj9hZa0kHlgp_wF_lZeiB1556H1WBiqP`;
- `OSR-0124` — exact Drive duplicate of the 1915 Severyanin source in `BATCH-0001`.

They remain in history under `DROP-DUPLICATE` and are not acquisition targets.

## 7. Controlling policy and reports

- `docs/SOURCE_ACQUISITION_AND_DRIVE_POLICY.md` — verification, openness, acquisition, dedupe, rights and SHA contract;
- `docs/RESEARCH_SOURCES.md` — legacy editorial source list; any quotation not directly read remains HOLD;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_AND_CLEANUP_PASS_09_2026-08-03.md` — world-literature audit and registry reset;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_PASS_10_FEB_RVB_2026-08-03.md` — Pushkin, Blok and Yesenin academic-corpus audit;
- `docs/research/OPEN_SOURCE_DISCOVERY_PASS_02_40_PLUS_2026-08-03.md` through `OPEN_SOURCE_DISCOVERY_PASS_07_40_PLUS_2026-08-03.md` — discovery history only;
- `docs/research/OPEN_SOURCE_ACQUISITION_PASS_08_2026-08-03.md` — verified Yesenin binary acquisition;
- `docs/research/MULTILINGUAL_OPEN_SOURCE_DISCOVERY_PASS_74_2026-08-03.md` — historical multilingual discovery evidence.

## 8. Next direct-audit order

No new-source discovery is authorised while the existing registry remains mostly unaudited.

Audit the 212 pending rows by existing source cluster:

1. ФЭБ Mayakovsky and Lermontov;
2. РВБ Lermontov, Mandelstam, Khlebnikov and Nekrasov;
3. Ruthenia/Tyutcheviana;
4. later ФЭБ/RВБ eighteenth- and nineteenth-century author portals;
5. НЭБ, РГБ, dlib and book-monument records;
6. museums, РГАЛИ and archive finding aids;
7. university repositories and theses;
8. Wikisource, Culture.ru and commercial/popular navigation;
9. legacy quotations and low-authority links in `docs/RESEARCH_SOURCES.md`.

Each retained row requires its own URL, identity, rights and final-verdict evidence. A trusted institution does not automatically verify every stored URL or every item inside it.
