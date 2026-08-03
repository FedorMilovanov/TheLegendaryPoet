# Open Research Source Audit — Pass 10: ФЭБ, РВБ and Pushkin Digital

**Date:** 3 August 2026  
**Mode:** verification-only; no new-source discovery  
**Canonical branch:** `editorial/longform-marathon-2026-08`  
**Canonical PR:** `#271`  
**Audit ID:** `AUDIT-2026-08-03-P10`

## 1. Scope

This pass continued the direct audit of existing registry rows. It did not add authors, editions or replacement sources.

Twenty-four stored URLs were tested across the first Pushkin, Blok and Yesenin academic-corpus groups:

- Pushkin Digital;
- ФЭБ Pushkin pages;
- РВБ Pushkin corpus and indices;
- РВБ Blok portal and volumes 1–3;
- ФЭБ Yesenin pages;
- РВБ Yesenin volumes 1–2.

Only exact stored URLs were tested. A canonical institutional redirect exposed by an existing URL was allowed; broad replacement discovery was not.

## 2. Result

```yaml
rows_directly_audited_in_pass: 24
KEEP-LINK: 12
HOLD-RETRY: 12
new_sources_added: 0
binary_uploads: 0
```

Registry-wide state after this pass:

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
```

## 3. Verified retained rows

### Pushkin

- `OSR-0001` — Pushkin Digital opened and the institutional project identity was confirmed. The audit interface exposed only a project-level page, so it is classified as `VERIFIED-NAVIGATION / ITEM-LEVEL`, not as direct manuscript evidence.
- `OSR-0005` — the ФЭБ page describing the commented editions of Pushkin's letters opened and confirmed the editorial corpus and its limitations.
- `OSR-0007` — the РВБ ten-volume Pushkin corpus opened, exposed the volume structure and identified the 1959–1962 print basis and the РВБ electronic publication.
- `OSR-0008` — the РВБ Pushkin author portal opened and remains navigation.
- `OSR-0009` — the РВБ verse-form index opened and remains a metrical/genre tool, not a biographical source.

### Blok

- `OSR-0012` — the РВБ Blok author portal opened and remains a navigation entry.
- `OSR-0014` — volume 1 of the twenty-volume academic edition opened and exposed edition, ISBN, institutional authorship and explicit modern copyright notices.
- `OSR-0015` — volume 2 opened and was identified as the 1904–1908 poetry volume.
- `OSR-0016` — volume 3 opened and was identified as the 1907–1916 poetry volume.

The three Blok volumes are `KEEP-LINK / BLOCKED-REPRODUCTION`: they are strong academic sources for exact citations, but the modern electronic edition is not treated as a free binary-mirroring source.

### Yesenin

- `OSR-0023` — the ФЭБ description of the seven-volume 1995–2002 academic edition opened and confirmed the edition identity.
- `OSR-0028` — РВБ Yesenin volume 1 opened as the poetry volume.
- `OSR-0029` — РВБ Yesenin volume 2 opened as the small-poems volume.

These remain link-only and must be cited through exact text or commentary pages.

## 4. Retry holds

The following rows did not expose directly readable content in the audit environment and therefore remain `HOLD-RETRY` rather than being called verified or permanently broken:

- `OSR-0002` — ФЭБ Pushkin portal: cache miss;
- `OSR-0003` — ФЭБ Pushkin works: Unicode decoding failure;
- `OSR-0004` — ФЭБ editions guide: cache miss;
- `OSR-0006` — ФЭБ serial scholarship: Unicode decoding failure;
- `OSR-0013` — overall РВБ Blok PSS contents: Unicode decoding failure;
- `OSR-0021` — ФЭБ Yesenin portal: fetch failure;
- `OSR-0022` — ФЭБ Yesenin works: fetch failure;
- `OSR-0024` — ФЭБ Yesenin indices portal: fetch failure;
- `OSR-0025` — ФЭБ title/first-line index: fetch failure;
- `OSR-0026` — ФЭБ 1926–1927 collected works: fetch failure;
- `OSR-0027` — overall РВБ Yesenin PSS contents: fetch failure;
- `OSR-0036` — ФЭБ Yesenin scholarship portal: fetch failure.

A connector cache miss, decoding error or fetch failure does not prove that an institutional source is dead. It does prove that this pass did not directly verify that exact stored URL.

## 5. Methodological correction

This pass confirms why institution-level trust cannot replace row-level verification:

- several exact pages on the same ФЭБ or РВБ host opened normally;
- several neighbouring stored URLs failed through cache, decoding or fetch errors;
- individual Blok and Yesenin volumes were directly inspectable even when their overall contents pages were not.

Therefore the project records a verdict for every row, not one blanket verdict for an entire domain.

## 6. Next audit cluster

Continue without new discovery. The next direct wave should cover:

1. ФЭБ Mayakovsky and Lermontov pages;
2. РВБ Lermontov, Mandelstam, Khlebnikov and Nekrasov corpora;
3. Ruthenia/Tyutcheviana;
4. later ФЭБ/RВБ eighteenth- and nineteenth-century author portals.

Each row must receive a dated R:Y verdict. Failures stay `HOLD-RETRY` unless a stable 404 or confirmed removal justifies `DROP-BROKEN`.
