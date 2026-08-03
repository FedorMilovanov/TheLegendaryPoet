# Сергей Есенин. Часть II — индекс рабочих черновиков, pass 06

**Updated:** 3 August 2026  
**Status:** `CHAPTERS 1–12 V02 / CHAPTERS 13–14 V03 EXACT QUOTATIONS / CH15 FORENSIC HOLD / CH16 LAST / НЕ ПУБЛИКОВАТЬ`  
**Supersedes for current status:** pass 01–05 working-drafts indexes  
**Canonical branch:** `editorial/longform-marathon-2026-08`  
**Canonical PR:** `#271`  
**Index rule:** update this file in place; do not create `PASS-07`, `FINAL`, `LATEST` or duplicate status indexes without a genuinely new control purpose.

## 1. Current chapter corpus

| Chapter | Current draft | Current state |
|---:|---|---|
| 1 | `YESENIN_PART_II_DRAFT_CH01_1921_V01_2026-08.md` | V02 literary-compression complete; exact quotation, chronology pages, programmes and visual rights pending |
| 2 | `YESENIN_PART_II_DRAFT_CH02_DUNCAN_MEETING_V01_2026-08.md` | compact V02; exact quotation/reused citation IDs, legal binaries and visual pending |
| 3 | `YESENIN_PART_II_DRAFT_CH03_MARRIAGE_PASSPORT_PUBLIC_COUPLE_V01_2026-08.md` | partial V02; exact quotation, registry/passport/transport binaries and upstream German press page pending |
| 4 | `YESENIN_PART_II_DRAFT_CH04_BERLIN_V01_2026-08.md` | partial V02; exact quotation, programmes, press pages, translation objects and physical Berlin volume pending |
| 5 | `YESENIN_PART_II_DRAFT_CH05_EUROPE_ROUTE_V01_2026-08.md` | V02; exact quotation, passenger manifest and visual/edition rights pending |
| 6 | `YESENIN_PART_II_DRAFT_CH06_US_PARTIAL_V02_2026-08.md` | partial V02; exact quotation, immigration file, programmes, city gaps and manifests pending |
| 7 | `YESENIN_PART_II_DRAFT_CH07_FOREIGN_WORK_V01_2026-08.md` | V02; exact quotation, translation ledger and physical objects pending |
| 8 | `YESENIN_PART_II_DRAFT_CH08_RETURN_1923_V01_2026-08.md` | V02; exact quotation, arrival, legal and account pages pending |
| 9 | `YESENIN_PART_II_DRAFT_CH09_MOSKVA_KABATSKAYA_V01_2026-08.md` | V02; exact quotation, physical book, censorship proof and account matrix pending |
| 10 | `YESENIN_PART_II_DRAFT_CH10_IMAGISM_V01_2026-08.md` | compact V02; exact quotation and complete first witnesses remain open |
| 11 | `YESENIN_PART_II_DRAFT_CH11_BENISLAVSKAYA_V01_2026-08.md` | compact V02; exact quotation, reverse letters, diary representation and visual gates pending |
| 12 | `YESENIN_PART_II_DRAFT_CH12_CAUCASUS_V01_2026-08.md` | partial V02; exact quotation, city-day route, editions and medical evidence pending |
| 13 | `YESENIN_PART_II_DRAFT_CH13_LATE_POETRY_V01_2026-08.md` | V03; five exact short fragments and two deliberate no-extra-quote decisions complete; physical witnesses, visual rights and integrated final style pending |
| 14 | `YESENIN_PART_II_DRAFT_CH14_SOFIA_CLINIC_PARTIAL_V01_2026-08.md` | partial V03; two exact documentary quotations plus certificate no-quote decision complete; full clinic file, registry image and rights pending |
| 15 | none | `FORENSIC HOLD`; source/acquisition/witness matrices only |
| 16 | none | write last after chapter 15, final myth synthesis and moral/theological review |

File names retain original `V01` suffixes as immutable path identifiers; version metadata inside each document is authoritative. Renaming fourteen paths only to match metadata would create unnecessary link churn.

## 2. Completed corpus-level work

- all 14 written chapters contain explicit `НЕ ПУБЛИКОВАТЬ` status;
- all 14 have paragraph/claim-source audit;
- all 14 have first literary-compression pass;
- chapters 13 and 14 have exact quotation/punctuation passes and dedicated executable validators;
- source classes remain visible: original, copy, photostat, authorised list, academic comment, press, memoir and reconstruction are not merged;
- plans/advertisements are not converted into completed routes/events;
- medical certificate № 1037 is not called a complete history or diagnosis;
- poetic speech is not converted into diagnosis, legal confession or proven repentance;
- Part II data module and route remain absent;
- chapters 15–16 remain absent by design.

Executable controls:

- `scripts/validate-yesenin-part-two-research.ts`;
- `scripts/validate-yesenin-chapter-13-quotations.ts`;
- `scripts/validate-yesenin-chapter-14-quotations.ts`;
- `scripts/validate-yesenin-source-acquisitions.ts`.

## 3. Verified source layers

### Institutional research master — Tufts

```yaml
source_id: yes2-duncan-russian-days-1929-tu
title: Isadora Duncan's Russian Days and Her Last Years in France
Drive_file_id: 1xs0SizFhEb0zDqN4MRWbBP0FsLpRfJH0
pdf_pages: 406
sha256: f8ebbc91166916ff1a6e228e4b127a850b360eb64959d8441b7aa22bd2a0af17
status: DRIVE-VERIFIED / PAGE-MAPPED / PRODUCTION RIGHTS HOLD
```

Its connected-memoir dates remain conflicts and do not override stronger academic controls.

Controlling files:

- `YESENIN_DUNCAN_RUSSIAN_DAYS_SOURCE_PASS_01_2026-08.md`;
- `YESENIN_DUNCAN_RUSSIAN_DAYS_PAGE_MAP_PASS_01_2026-08.md`;
- `YESENIN_PART_II_SOURCE_ID_REGISTRY_PASS_06_DUNCAN_RUSSIAN_DAYS_2026-08.md`.

### Derived text D01 — Gruzinov

```yaml
source_id: yes2-gruzinov-conversations-wikisource-derived
Drive_file_id: 1SNcIOGipekg8t19CL9V-pkqcRN9YkpmW
pdf_pages: 41
sha256: 9a9de51a32d73175392aed9bb35ad4e0f6e76aa867a0a2a0728005e1ad4a4cae
status: DRIVE-VERIFIED DERIVED TEXT / NOT A 1927 FACSIMILE
original_1927_facsimile_status: BINARY-PENDING
```

Controlling file: `YESENIN_GRUZINOV_WIKISOURCE_DERIVED_SOURCE_PASS_01_2026-08.md`.

### Derived text D02 — Evdokimov

```yaml
source_id: yes2-evdokimov-sergey-aleksandrovich-esenin-wikisource-derived
Drive_file_id: 1OWLeog5J38-xQIgXMJQS8xr1XbXeQQNw
pdf_pages: 45
sha256: 278873e845d0505a12f50d629d7ec5715bfed5b20dcef9ebc847d670b021e669
status: DRIVE-VERIFIED DERIVED TEXT / ONE MEMOIR ONLY / NOT COMPLETE 1926 COLLECTION
complete_1926_collection_status: BINARY-PENDING
```

Controlling file: `YESENIN_EVDOKIMOV_WIKISOURCE_DERIVED_SOURCE_PASS_01_2026-08.md`.

Both derivative objects are stored under `DERIVED TEXT — SEARCH & COMPARISON`; generated pagination/covers are not cited as physical early editions.

## 4. Exact quotation passes completed

### Chapter 13

- five exact short fragments checked against academic FEB texts;
- `Незрело`, not the damaged `Но зрело`, retained;
- two deliberate no-extra-quote decisions (`Анна Снегина`, `Клён...`);
- poetry not upgraded into diagnosis, legal intent, political conversion or proven repentance.

Control: `YESENIN_PART_II_QUOTATION_PASS_CH13_2026-08.md`.

### Chapter 14

- exact short line from the 6 December Evdokimov letter;
- exact compressed wording of the 7 December Ehrlich telegram;
- certificate № 1037 deliberately paraphrased rather than quoted as diagnosis;
- intimate notes, bank figures and memoir explanations deliberately left outside the quotation layer.

Control: `YESENIN_PART_II_QUOTATION_PASS_CH14_2026-08.md`.

## 5. Chapter 15 — December 1925

Source of truth:

- `YESENIN_DECEMBER_1925_DAY_LEVEL_SOURCE_MATRIX_PASS_01_2026-08.md`;
- `YESENIN_DECEMBER_1925_ACQUISITION_REGISTRY_2026-08.md`;
- `YESENIN_DECEMBER_1925_WITNESS_MATRIX_PASS_01_2026-08.md`.

Do not write narrative prose until there is sufficient closure for:

- clinic-end mechanism and complete medical unit;
- Moscow–Leningrad transport evidence;
- hotel register/room assignment;
- witness-by-witness first texts;
- original inquiry documents and forensic act;
- original versus retouched photograph provenance;
- quotation and reproduction rights.

A published facsimile package advances evidence but does not equal verified archive originals.

## 6. Chapter 16 — final synthesis

Write only after:

- chapter 15 is source-ready;
- exact quotation pass covers chapters 1–15;
- all myths have stable statuses;
- moral/theological review separates documented conduct, historical inference and final divine judgment;
- the conclusion does not reduce four years to the death scene or excuse destructive decisions.

## 7. Remaining independent source gates

- first Imagist Declaration and variant comparison;
- complete Benislavskaya correspondence and diary representation;
- full US city route and immigration case;
- December death/inquiry originals;
- physical first-edition and visual-rights dossiers;
- marriage registry, passport and transport objects;
- five exact production cover binaries.

Part II uses compact biographical bridges and future links; it does not absorb complete independent investigations.

## 8. Current PDF/acquisition state

```yaml
Drive_batch: BATCH-0002 — YESENIN 1921–1925
Drive_batch_id: 1guVgPmnwnTR5wWaInK41Lp2HhMJ4ve6b
institutional_Drive_masters: 1
separate_Drive_derived_texts: 2
total_new_Drive_PDF_objects: 3
remaining_original_or_facsimile_binary_targets: 6
gmail_request_drafts_created: 3
requests_sent: 0
responses_received: 0
empty_batch_folders_created: 0
HTML_as_PDF_files_created: 0
```

NЭБ/RSL automated endpoints are blocked by HTML/403 for server IPs; two Murmansk catalogue cards point to deleted `cld.bz` viewers. Official request drafts exist for Murmansk Library, RNB EDD and RSL. They are not marked sent.

## 9. Next safe work units

1. exact quotation/punctuation passes for chapters 1–12;
2. integrated Russian literary-style review after quotation insertion;
3. moral/theological audit of chapters 9, 13, 14 and future 15–16;
4. process archive/library responses and accept only verified lawful files;
5. continue 40+ multilingual acquisition passes without repeating blocked endpoints;
6. close visual and cover binaries atomically;
7. write chapter 15 only after forensic gates;
8. write chapter 16 last;
9. create public Essay module/route only after final-head source, rights, content, type, build and browser gates.

## 10. Exact-head boundary

A green workflow result from a previous SHA is not evidence for the current head. After every content/source mutation:

1. fetch exact PR head;
2. inspect current required checks;
3. fix demonstrated failures without weakening validators;
4. record unavailable or pending checks honestly;
5. do not claim production or deployment from a merge/build alone.
