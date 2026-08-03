# Open Research Source Registry — canonical index

**Project:** THE LEGENDARY POET  
**Canonical branch:** `editorial/longform-marathon-2026-08`  
**Canonical PR:** `#271`  
**Current discovery pass:** `OSR-2026-08-03-P07`  
**Current acquisition pass:** `OSR-2026-08-03-P08`  
**Current verification pass:** `AUDIT-2026-08-03-P16`  
**Primary registry audit:** `COMPLETE`  
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
direct_audited_rows: 287
audit_pending_rows: 0
verified_keep_link: 119
verified_download_candidates: 12
drive_verified_binaries: 3
hold_retry: 102
hold_rights_or_identity: 45
drops_total: 6
tracked_dashboard_scopes: 66
latest_source_id: OSR-0287
```

All 287 rows now have a dated row-level verdict. This completes primary classification; it does not resolve retry, rights, identity, acquisition, quotation or publication gates.

## 4. Audit-pass ledger

| Pass | Directly audited | Main result |
|---|---:|---|
| 09 | 45 | World-literature institutional and open-edition rows |
| 10 | 24 | Pushkin, Blok and Yesenin FEB/RVB corpus rows |
| 11 | 22 | Mayakovsky, Lermontov, Mandelstam, Khlebnikov, Nekrasov and Tyutchev |
| 12 | 12 | Museums, archives, RSL, Presidential Library and theses |
| 13 | 14 | RSL/NEL and early editions |
| 14 | 50 | First fifty-row marathon |
| 15 | 50 | Second fifty-row marathon, `OSR-0166..OSR-0215` |
| 16 | 64 | Every remaining `AUDIT-PENDING` row; primary registry complete |

Three manifested Yesenin binaries and three duplicate controls are also part of the 287 audited rows.

## 5. Pass 16 — primary registry completion

```yaml
rows_audited: 64
KEEP-LINK: 28
KEEP-DOWNLOAD-CANDIDATE: 2
HOLD-RIGHTS: 4
HOLD-IDENTITY: 12
HOLD-RETRY: 17
DROP-IDENTITY: 1
new_sources: 0
binary_uploads: 0
```

### New verified candidates

- `OSR-0061` — PLOS ONE article *Semantics of European Poetry Is Shaped by Conservative Forces*, `CC-BY`;
- `OSR-0066` — Colby honors thesis on Akhmatova and Pushkin, research/scholarship download permitted with commercial reproduction and distribution prohibited.

Both remain candidates until actual bytes, MIME, title page, completeness, embedded-material review, deduplication and SHA-256 pass.

### Exact identity defects

Twelve stored NEL identifiers did not match the registered works and remain `HOLD-IDENTITY`: `OSR-0216`, `OSR-0219`, `OSR-0220`, `OSR-0223`, `OSR-0225`, `OSR-0226`, `OSR-0229..OSR-0233`, and `OSR-0237`.

`OSR-0224` is `DROP-IDENTITY`: its exact URL resolves to Golubinsky's *History of the Russian Church*, not Vyazemsky poetry. The row is removed from active maps; no silent replacement was made during the frozen audit.

### Material corrections

- Yesenin Chronicle volume 4: published 2010, coverage 3 August 1923 through 1924, modern rights-controlled edition;
- Akhmatova museum rare-book fund: approximately 15,000 units;
- Pasternak family papers at Hoover: 1878–2010;
- exact RGALI Pasternak row: manuscripts of E. B. and E. V. Pasternak, fund 379, inventory 5, 35 listed units;
- Bunin twenty-five-volume scholarly edition: plan/prospectus, not a completed available corpus;
- Koltsov 1901 volume: second edition, XX + 328 + 1 pages plus portrait;
- Nikitin/Gershenzon 1912: XXIV + X + 448 pages plus nine illustration leaves;
- Nikitin/Krakov 1914: first edition, XXXVI + 528 + VII pages plus portrait.

## 6. Current retained and blocked queues

```yaml
KEEP-LINK: 119
KEEP-DOWNLOAD-CANDIDATE: 12
DRIVE-VERIFIED: 3
HOLD-RETRY: 102
HOLD-RIGHTS_OR_IDENTITY: 45
DROP: 6
HOLD-DIRECT-READ_TESTIMONIES: 75
```

`HOLD-RETRY` rows are classified failures, not active evidence. `HOLD-RIGHTS` rows may be readable but are not approved for mirroring. `HOLD-IDENTITY` rows may not be cited or acquired until their exact objects are corrected through a governed pass.

The 75 legacy testimony quotations remain unpublished as exact quotations until each named book, letter, memoir, article or archival item is directly read.

## 7. Controlling verification and rights rules

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

Every acquisition candidate requires real bytes, expected MIME, title-page and completeness inspection, page count, size, text-layer classification, exact rights/jurisdiction note, embedded-material review, bounded Drive dedupe, SHA-256 and a real Drive ID.

## 8. Verified binaries and duplicate controls

Directly manifested as `DRIVE-VERIFIED`:

- `OSR-0031` — Yesenin chronicle, volume 3, book 1; Drive ID `13q21pg9dd4EyAIhBVxZXJrxwjYGD0qK-`; SHA-256 `eaccd7e92a90087112a4425d6a211257ad3e80e9e47c05ce9943b7f4b1669014`;
- `OSR-0032` — Yesenin chronicle, volume 3, book 2; Drive ID `1d_3-aNk4eY5LqLWzU9XUt8J_g6-IynxN`; SHA-256 `89b33c7a472eab0c234877cd8737a1f2e12eebd142d0552a625eeb28d6ce4187`;
- `OSR-0287` — Yesenin chronicle, volume 5, book 1; Drive ID `1d7UCOxmX7SUPJkjclZKvNhJAAGhu1gHs`; SHA-256 `1c4a37276fc9e2e8da2a9b19c7b0c8941b6e43a0ec9aec5d42a55589e0145496`.

Production reuse remains `PRIVATE-RESEARCH-HOLD`.

Verified duplicate controls:

- `OSR-0106` — bibliographic Severyanin duplicate;
- `OSR-0114` — exact Drive duplicate of Bryusov's *Urbi et Orbi*;
- `OSR-0124` — exact Drive duplicate of the 1915 Severyanin source in `BATCH-0001`.

## 9. Branch and publication status

The source-registry primary-audit gate is complete. PR `#271` and its branch are not eligible for merge or deletion.

Independent blockers remain:

- 102 retry rows and 45 rights/identity holds;
- 12 unmanifested download candidates;
- 75 testimony direct-read holds;
- incomplete lawful original/full Yesenin binaries and forensic source chains;
- incomplete medical, hotel, transport, inquiry and final-poem evidence gates;
- chapters 15 and 16 and final moral/theological review;
- production visual binaries, provenance, SHA and item-level rights;
- owner-controlled institution-request drafts;
- dependency remediation and final exact-head QA.

The compliant state is `PR DRAFT / MERGE BLOCKED / BRANCH DELETE BLOCKED / PUBLIC PART II BLOCKED`.

## 10. Controlling policy and reports

- `docs/SOURCE_ACQUISITION_AND_DRIVE_POLICY.md`;
- `docs/RESEARCH_SOURCES.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_AND_CLEANUP_PASS_09_2026-08-03.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_PASS_10_FEB_RVB_2026-08-03.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_PASS_11_MAYAKOVSKY_LERMONTOV_MANDELSTAM_KHLEBNIKOV_NEKRASOV_TYUTCHEV_2026-08-03.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_PASS_12_MUSEUM_ARCHIVE_RSL_THESES_LEGACY_WEAK_SOURCES_2026-08-03.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_PASS_13_RSL_NEL_FIRST_EDITIONS_2026-08-03.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_PASS_14_FIFTY_EXISTING_ROWS_2026-08-03.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_PASS_15_FIFTY_EXISTING_ROWS_2026-08-03.md`;
- `docs/research/OPEN_RESEARCH_SOURCE_AUDIT_PASS_16_PRIMARY_REGISTRY_COMPLETION_2026-08-03.md`;
- `docs/EDITORIAL_BRANCH_CLOSURE_GATE_2026-08-03.md`.

Primary registry classification is complete. Further work must use the classified retry, rights, identity, acquisition, testimony and publication queues rather than reopening discovery silently.
