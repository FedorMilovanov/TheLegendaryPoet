# Open Research Source Registry — canonical index

**Project:** THE LEGENDARY POET  
**Mode:** continuous link-first research acquisition  
**Canonical branch:** `editorial/longform-marathon-2026-08`  
**Canonical PR:** `#271`  
**Current pass:** `OSR-2026-08-03-P02`  
**Current registered rows:** `61`  
**Discovery coverage:** `40+ distinct searches` across Russian, English and German sources

## 1. Canonical searchable registry

The operational registry is maintained as a native Google Sheet:

- **Title:** `THE LEGENDARY POET — OPEN RESEARCH SOURCE REGISTRY`
- **Drive file ID:** `1QEmUdSWEFZLjtUenU8B0zzirRiiZ1XP6QKxhqsAfnMM`
- **URL:** https://docs.google.com/spreadsheets/d/1QEmUdSWEFZLjtUenU8B0zzirRiiZ1XP6QKxhqsAfnMM
- **Drive folder:** `00 — PROJECT INDEX — GITHUB, BRAND, STATUS / 03 — OPEN RESEARCH SOURCE REGISTRY`
- **Folder ID:** `1LAF8M6BD3zjbFe4A2O3x4nrBtFQZjlI9`

The Drive folder also contains:

- `OPEN RESEARCH SOURCE REGISTRY — README.md`;
- `OPEN RESEARCH SOURCE REGISTRY — EXPORT.csv`.

This file is the stable repository pointer and workflow contract. The Google Sheet is the working searchable/filterable interface. The CSV is the portable backup.

## 2. Registry schema

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

Source IDs are monotonic (`OSR-0001`, `OSR-0002`, ...). A later pass updates a row or appends a new row; it does not silently replace, renumber or delete earlier evidence.

## 3. Action classes

- `LINK-REGISTERED` — public scholarly source is readable online; keep the stable link and map it to article work.
- `DOWNLOAD-SELECTIVE` — a large institutional corpus exists; download only the exact volume that closes a named gap.
- `DOWNLOAD-QUEUE` — useful downloadable file awaits MIME, title-page, page-count, text-layer, rights and SHA verification.
- `BINARY-PENDING` — exact direct file is known, but the bytes were not yet received or verified.
- `UPLOADED-TO-DRIVE` — only after Google Drive returns a real file ID for the verified bytes.
- `LINK-ONLY` / `CATALOG-ONLY` — reading, bibliographic use and linking are allowed, but redistribution is not established.
- `HOLD` / `REJECT` — provenance, rights, identity or academic integrity is insufficient.

## 4. Link-first versus Drive-first

Keep a source as a link when:

- it is a reliable searchable academic corpus such as ФЭБ, РВБ, Pushkin Digital or an institutional collection;
- the public interface is more useful than one huge local file;
- exact pages and works can be cited directly;
- redistribution rights for the binary are not established.

Mirror a file to private Google Drive when:

- the exact volume is repeatedly needed for active article work;
- offline full-text/page work is materially useful;
- the host is unstable, slow or difficult to search;
- the file is a primary/academic object that closes a documented research gap;
- actual bytes pass identity, integrity, rights, dedupe and SHA gates.

Large size is not a rejection reason when the exact volume is important. Large size is a reason to avoid indiscriminate bulk acquisition.

## 5. Current high-priority binary queue

1. `OSR-0031` — Есенин, *Летопись жизни и творчества*, том 3, книга 1 — `BINARY-PENDING`; exact institutional PDF identified, but the current download attempt timed out.
2. `OSR-0032` — Есенин, *Летопись*, том 3, книга 2 — Europe / US / return route.
3. `OSR-0033` — Есенин, *Летопись*, том 4 — 1923–1925, Moscow tavern cycle, Caucasus and late work.
4. `OSR-0054` — Лермонтов, new scholarly collected works, volume 1 PDF.
5. `OSR-0059` — Брюсов, *Далёкие и близкие* (1912), OCR PDF, 223 pages.
6. `OSR-0060` — Harvard open-access dissertation on objects in Russian and American avant-garde poetry, CC BY.
7. Public-domain English Pushkin editions — acquire only exact translations needed for reception studies.

No empty source batch was created and no timed-out or viewer page was reported as a PDF upload.

## 6. Current source coverage

The current registry includes controlled research entry points for:

- Pushkin: Pushkin Digital, ФЭБ, РВБ, letters, academic collected works, serial Pushkin scholarship and English/German reception;
- Blok: the 20-volume academic collected works, IMLI, *The Twelve* scholarship and institutional biography;
- Yesenin: ФЭБ/RВБ PSS, indexes, the 1926–1927 collected edition, IMLI chronicle and Presidential Library collections;
- Mayakovsky: ФЭБ PSS, Katanyan chronology, *Literary Heritage* volume 65, museum documents/notebooks and RGALI catalogue records;
- Tyutchev, Lermontov and Baratynsky academic corpora;
- Silver Age comparative research, Bryusov criticism, Russian avant-garde studies and computational poetics.

## 7. Article-building workflow

For every new article or major revision:

1. choose the article/topic in the registry's `ARTICLE MAP` sheet;
2. start from the mapped priority-A source IDs;
3. open exact work, letter, document or page rather than citing a portal home page;
4. record claim-level page or object references in the article source map;
5. add missing sources through the same registry instead of an isolated chat list;
6. download only the exact files needed for sustained work;
7. after a verified Drive upload, record Drive ID, path and SHA in the rights/manifest area;
8. keep visual rights separate from textual research access.

## 8. Relationship to existing documentation

This registry complements rather than deletes:

- `docs/RESEARCH_SOURCES.md` — established editorial links and poem-text verification sources;
- `docs/SOURCE_ACQUISITION_AND_DRIVE_POLICY.md` — binary acquisition, rights, dedupe and SHA contract;
- `docs/research/MULTILINGUAL_OPEN_SOURCE_DISCOVERY_PASS_74_2026-08-03.md` — earlier multilingual discovery inventory;
- `FedorMilovanov/Research/SOURCE_LIBRARY/MASTER_OPEN_ACCESS_SOURCE_INDEX_2026-07-30.md` — cross-project open-access authority.

Future 40+ passes must append to the Google Sheet and leave a dated repository pass note with counts, new/high-priority rows, duplicate decisions, failed downloads and actual Drive IDs returned.
