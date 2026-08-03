# Open Research Source Registry — canonical index

**Project:** THE LEGENDARY POET  
**Mode:** continuous link-first research acquisition  
**Canonical branch:** `editorial/longform-marathon-2026-08`  
**Canonical PR:** `#271`  
**Current pass:** `OSR-2026-08-03-P07`  
**Current registered rows:** `286`  
**Completed discovery:** six controlled 40+ expansion passes; pass 07 added 45 rows

## 1. Canonical searchable registry

The operational registry is maintained as a native Google Sheet:

- **Title:** `THE LEGENDARY POET — OPEN RESEARCH SOURCE REGISTRY`
- **Drive file ID:** `1QEmUdSWEFZLjtUenU8B0zzirRiiZ1XP6QKxhqsAfnMM`
- **URL:** https://docs.google.com/spreadsheets/d/1QEmUdSWEFZLjtUenU8B0zzirRiiZ1XP6QKxhqsAfnMM
- **Drive folder:** `00 — PROJECT INDEX — GITHUB, BRAND, STATUS / 03 — OPEN RESEARCH SOURCE REGISTRY`
- **Folder ID:** `1LAF8M6BD3zjbFe4A2O3x4nrBtFQZjlI9`

The Google Sheet is the working searchable/filterable authority. The Drive folder contains portable snapshots and workflow documentation. GitHub stores durable policy, pass reports, source identities, duplicate decisions and acquisition status.

## 2. Current counters

```yaml
registered_sources: 286
priority_A: 230
link_registered_or_download_selective: 236
download_queue_or_binary_pending: 45
tracked_dashboard_scopes: 66
latest_source_id: OSR-0286
latest_pass: OSR-2026-08-03-P07
binary_uploads_in_pass_07: 0
```

The dashboard, article map and pass log were extended together with the source rows. Source IDs remain monotonic and no previous row was renumbered.

## 3. Registry schema

Every source row records:

```text
Source ID
Poet / scope
Language
Source type
Title
Institution / repository
Year / coverage
Access status
Acquisition action
Priority
Drive comparison
Article / research use
Item URL
Direct file URL
Rights / handling note
Last checked
Discovery pass
```

A later pass updates or appends a row; it never silently replaces, renumbers or deletes earlier evidence.

## 4. Action classes

- `LINK-REGISTERED` — stable public scholarly source; keep the link and map it to article work.
- `DOWNLOAD-SELECTIVE` — large corpus exists; acquire only the exact volume, release or edition closing a named gap.
- `DOWNLOAD-QUEUE` — useful downloadable object awaits MIME, identity, completeness, rights and SHA verification.
- `BINARY-PENDING` — exact direct file is known, but bytes were not received or verified.
- `UPLOADED-TO-DRIVE` — only after Drive returns a real file ID for verified bytes.
- `LINK-ONLY` / `CATALOG-ONLY` — reading, bibliography and linking are allowed; redistribution is not established.
- `DUPLICATE-SKIP` — an existing Drive master or bibliographic equivalent blocks a second binary.
- `HOLD` / `REJECT` — provenance, rights, identity or academic integrity is insufficient.

## 5. Link-first versus Drive-first

Keep a source as a link when:

- it is a reliable searchable academic corpus such as ФЭБ, РВБ, Pushkin Digital, НЭБ, Folger, Homer Multitext, Princeton/Dartmouth Dante, Gallica/BnF, an official museum, a university repository or an archive finding aid;
- the public interface is more useful than one huge local file;
- exact works, letters, commentaries and objects can be cited directly;
- redistribution rights for the binary are not established.

Mirror a file to private Google Drive when:

- the exact edition or dataset is repeatedly needed for active article work;
- offline full-text/page work is materially useful;
- the host is unstable, slow or difficult to search;
- the object closes a documented research gap;
- actual bytes pass identity, integrity, rights, dedupe and SHA gates.

Large size is not a rejection reason when the exact object matters. It is a reason to avoid indiscriminate bulk acquisition.

## 6. Current source coverage

### Russian-language corpus

The registry contains controlled research entry points for the principal Russian poetic tradition from Trediakovsky, Lomonosov, Sumarokov and Derzhavin through Pushkin, Lermontov, Tyutchev, Nekrasov, the Silver Age, the avant-garde, émigré poetry and major twentieth-century authors.

### World-literature corpus

Pass 07 begins the systematic foreign canon with:

- Shakespeare: Folger texts, downloadable research formats, documentary biography, manuscripts, quartos and folios, and Internet Shakespeare Editions;
- Homer: Homer Multitext, manuscript datasets, the *Iliad* and *Odyssey* in Greek/English parallel environments;
- Dante: Princeton texts and minor works, Dartmouth commentary history and Dante Lab;
- Goethe: the Goethe- und Schiller-Archiv, correspondence/manuscript databases and both parts of *Faust*;
- Cervantes: the Instituto Cervantes edition, BNE facsimiles, historical editions and Spanish/English public-domain texts;
- Milton: seventeenth-century print history, the ten-book and twelve-book *Paradise Lost*, and *Paradise Regained*;
- Chaucer: Harvard texts, Middle English tools, documentary chronology and manuscript transmission;
- Molière, Victor Hugo and Baudelaire through Gallica/BnF institutional collections, early editions and manuscript dossiers.

The `ARTICLE MAP` sheet maps priority sources to concrete article families. Portal home pages are starting points only; final claims must point to exact works, editions, letters, documents, lines, pages, manuscript witnesses or archive objects.

## 7. Current high-priority binary queue

Earlier priorities remain active, including the Yesenin chronicle volumes, Lermontov volume 1, selected Russian first editions, open dissertations, *Neizdannyi Khlebnikov*, Gippius and Sologub objects, and the controlled classicist/Pushkin-circle queue recorded in passes 02–06.

Pass 07 adds seven core candidates:

1. `OSR-0262` — Goethe, *Faust I*, German text.
2. `OSR-0263` — Goethe, *Faust II*, German text.
3. `OSR-0269` — Cervantes, *Don Quijote*, Spanish text.
4. `OSR-0272` — Milton, *Paradise Lost*, twelve-book form.
5. `OSR-0273` — Milton, *Paradise Lost*, ten-book form.
6. `OSR-0274` — Milton, *Paradise Regained*.
7. `OSR-0285` — Baudelaire, first edition of *Les Fleurs du mal*, 1857.

Folger downloads, Homer Multitext datasets, Molière collected editions and Victor Hugo poetry/manuscript collections remain selective rather than bulk acquisitions.

No timed-out endpoint, viewer page or catalogue card is reported as an uploaded PDF.

## 8. Rights, duplicate and bounded-comparison control

Known duplicate controls remain:

- `OSR-0106` / `OSR-0124` — Severyanin, *Ананасы в шампанском*: the 1915 book is already represented in `BATCH-0001`.
- `OSR-0114` — Bryusov, *Urbi et Orbi*, 1903: exact Drive master already exists as file ID `1Kj9hZa0kHlgp_wF_lZeiB1556H1WBiqP`.

Pass 07 ran bounded exact-title/name Drive searches for Shakespeare, Homer, Dante, Goethe, Cervantes, Milton, Chaucer, Molière, Victor Hugo and Baudelaire. No project-relevant exact binary match was returned. Unrelated Isadora Duncan, Baptist-history, Russian-anthology and *Apollon* files were rejected as false positives. Opaque archives and unindexed binaries were not silently treated as searched.

World-literature handling rules:

- Folger downloadable texts retain their stated noncommercial conditions.
- Princeton and Dartmouth Dante modern texts, translations and commentaries remain link-first unless item-level permission establishes more.
- Project Gutenberg files are public-domain candidates under its United States basis; jurisdiction and exact edition identity still require verification.
- Gallica/BnF acquisition requires the exact object record and rights metadata.
- Manuscript/open-data releases retain version IDs and license files.
- Distinct textual forms, such as *Paradise Lost* 1667 and 1674, are not treated as accidental duplicates.

## 9. Article-building workflow

For every new article or major revision:

1. choose the article/topic in `ARTICLE MAP`;
2. start from the mapped priority-A source IDs;
3. open the exact work, edition, letter, document, commentary or manuscript witness;
4. record claim-level page, line, canto, chapter, CTS URN or object references;
5. add missing sources through this registry, not an isolated chat list;
6. download only exact files needed for sustained work;
7. after verified Drive upload, record Drive ID, path and SHA in the rights/manifest area;
8. keep visual rights separate from textual research access.

## 10. Controlling and historical documents

- `docs/RESEARCH_SOURCES.md` — established editorial links and poem-text verification sources;
- `docs/SOURCE_ACQUISITION_AND_DRIVE_POLICY.md` — binary acquisition, rights, dedupe and SHA contract;
- `docs/research/OPEN_SOURCE_DISCOVERY_PASS_02_40_PLUS_2026-08-03.md`;
- `docs/research/OPEN_SOURCE_DISCOVERY_PASS_03_40_PLUS_2026-08-03.md`;
- `docs/research/OPEN_SOURCE_DISCOVERY_PASS_04_40_PLUS_2026-08-03.md`;
- `docs/research/OPEN_SOURCE_DISCOVERY_PASS_05_40_PLUS_2026-08-03.md`;
- `docs/research/OPEN_SOURCE_DISCOVERY_PASS_06_40_PLUS_2026-08-03.md`;
- `docs/research/OPEN_SOURCE_DISCOVERY_PASS_07_40_PLUS_2026-08-03.md`;
- `docs/research/MULTILINGUAL_OPEN_SOURCE_DISCOVERY_PASS_74_2026-08-03.md`;
- `FedorMilovanov/Research/SOURCE_LIBRARY/MASTER_OPEN_ACCESS_SOURCE_INDEX_2026-07-30.md`.

Every future 40+ pass must append to the same Sheet, record duplicates and failed downloads, and leave a dated repository report with actual Drive IDs for verified uploads.