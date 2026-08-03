# Open Research Source Registry — canonical index

**Project:** THE LEGENDARY POET  
**Mode:** continuous link-first research acquisition  
**Canonical branch:** `editorial/longform-marathon-2026-08`  
**Canonical PR:** `#271`  
**Current pass:** `OSR-2026-08-03-P05`  
**Current registered rows:** `196`  
**Completed discovery:** four controlled 40+ expansion passes; pass 05 added 45 rows

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
registered_sources: 196
priority_A: 150
link_registered_or_download_selective: 163
download_queue_or_binary_pending: 30
tracked_dashboard_scopes: 46
latest_source_id: OSR-0196
latest_pass: OSR-2026-08-03-P05
binary_uploads_in_pass_05: 0
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
- `DOWNLOAD-SELECTIVE` — large corpus exists; acquire only the exact volume closing a named gap.
- `DOWNLOAD-QUEUE` — useful downloadable object awaits MIME, title-page, page-count, text-layer, rights and SHA verification.
- `BINARY-PENDING` — exact direct file is known, but bytes were not received or verified.
- `UPLOADED-TO-DRIVE` — only after Drive returns a real file ID for verified bytes.
- `LINK-ONLY` / `CATALOG-ONLY` — reading, bibliography and linking are allowed; redistribution is not established.
- `DUPLICATE-SKIP` — an existing Drive master or bibliographic equivalent blocks a second binary.
- `HOLD` / `REJECT` — provenance, rights, identity or academic integrity is insufficient.

## 5. Link-first versus Drive-first

Keep a source as a link when:

- it is a reliable searchable academic corpus such as ФЭБ, РВБ, Pushkin Digital, НЭБ, an official museum, a university repository or an archive finding aid;
- the public interface is more useful than one huge local file;
- exact works, letters and objects can be cited directly;
- redistribution rights for the binary are not established.

Mirror a file to private Google Drive when:

- the exact volume is repeatedly needed for active article work;
- offline full-text/page work is materially useful;
- the host is unstable, slow or difficult to search;
- the object closes a documented research gap;
- actual bytes pass identity, integrity, rights, dedupe and SHA gates.

Large size is not a rejection reason when the exact volume matters. It is a reason to avoid indiscriminate bulk acquisition.

## 6. Current source coverage

The registry now contains controlled research entry points for:

- Pushkin, Derzhavin, Zhukovsky, Batyushkov, Baratynsky, Lermontov, Tyutchev, Fet, Maykov, Polonsky, Apukhtin, Nadson and Nekrasov;
- Blok, Bryusov, Balmont, Gippius, Merezhkovsky, Andrei Bely, Sologub, Vyacheslav Ivanov, Voloshin, Lokhvitskaya and Cherubina de Gabriak;
- Yesenin, Klyuev, Mayakovsky, Khlebnikov, Severyanin and the Russian avant-garde;
- Akhmatova, Gumilev, Mandelstam, Tsvetaeva, Parnok, Pasternak, Bunin, Khodasevich and Zabolotsky;
- Brodsky, Tvardovsky and Okudzhava through official museums, archives and authorial public statements;
- translation history, archive navigation, comparative research and computational poetics;
- English, German, Spanish and Italian reception/research layers.

The `ARTICLE MAP` sheet maps priority sources to concrete article families. Portal home pages are starting points only; final claims must point to exact works, letters, documents, pages or archive objects.

## 7. Current high-priority binary queue

Earlier priorities remain active, including:

1. `OSR-0031` — Yesenin, *Chronicle*, volume 3, book 1.
2. `OSR-0032` — Yesenin, *Chronicle*, volume 3, book 2.
3. `OSR-0033` — Yesenin, *Chronicle*, volume 4.
4. `OSR-0054` — Lermontov scholarly collected works, volume 1.
5. `OSR-0059` — Bryusov, *Distant and Near*.
6. `OSR-0060` — Harvard CC BY dissertation on avant-garde objects.
7. `OSR-0095` — *Neizdannyi Khlebnikov*, issue 12, `BINARY-PENDING`.
8. `OSR-0136` — Gippius, *Последние стихи, 1914–1918*, `BINARY-PENDING`.
9. `OSR-0145` — Sologub, *Пламенный круг*.

Pass 05 adds three exact old-edition candidates:

10. `OSR-0153` — Maykov, complete works, volume 1, 1913.
11. `OSR-0157` — Polonsky, complete poems, volume 1, 1896.
12. `OSR-0161` — Apukhtin, works, volume 1; catalogue dating must be resolved from the title page.

No timed-out endpoint, viewer page or catalogue card is reported as an uploaded PDF.

## 8. Duplicate and bounded comparison control

Known duplicate controls remain:

- `OSR-0106` / `OSR-0124` — Severyanin, *Ананасы в шампанском*: the 1915 book is already represented in `BATCH-0001`.
- `OSR-0114` — Bryusov, *Urbi et Orbi*, 1903: exact Drive master already exists as file ID `1Kj9hZa0kHlgp_wF_lZeiB1556H1WBiqP`.

Pass 05 ran bounded exact-title/name Drive searches for Maykov, Polonsky, Apukhtin, Nadson, Parnok, Khodasevich, Brodsky and Tvardovsky. No project-relevant exact match was returned. Opaque archives and unindexed binary contents were not silently treated as searched.

## 9. Article-building workflow

For every new article or major revision:

1. choose the article/topic in `ARTICLE MAP`;
2. start from the mapped priority-A source IDs;
3. open the exact work, letter, document or page;
4. record claim-level page/object references in the article source map;
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
- `docs/research/MULTILINGUAL_OPEN_SOURCE_DISCOVERY_PASS_74_2026-08-03.md`;
- `FedorMilovanov/Research/SOURCE_LIBRARY/MASTER_OPEN_ACCESS_SOURCE_INDEX_2026-07-30.md`.

Every future 40+ pass must append to the same Sheet, record duplicates and failed downloads, and leave a dated repository report with actual Drive IDs for verified uploads.
