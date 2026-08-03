# August 2026 editorial marathon

This directory contains the active research, authoring, source-acquisition and production ledgers for the current long-form marathon.

## Operating boundary

- Canonical branch: `editorial/longform-marathon-2026-08`.
- Canonical PR: `#271`.
- One marathon = one branch and one PR. Do not create `final`, `latest`, `successor` or diagnostic branches.
- `BRANCH_SCOPE.md` defines allowed and forbidden surfaces.
- All Yesenin Part II drafts remain research files. No public route or `src/data/essays` module exists.
- Chapters 15 and 16 have no prose. Chapter 15 is acquisition-only; chapter 16 is last.

## Current authoring state

The working biography has fourteen non-public draft chapters:

1. 1921: books, Imagist machinery, Turkestan, `Пугачёв` and the Duncan boundary;
2. first meeting with Duncan as a compact bridge to the independent investigation;
3. marriage, passport and construction of the public pair;
4. Berlin publishing, readings and politically split press reception;
5. the European route as documented points versus plans;
6. US arrival, immigration inquiry, tour evidence and 3 February departure;
7. written, reworked, published, translated, planned and post-return works;
8. Moscow return in 1923 and distinct literary/relational/legal lines;
9. `Москва кабацкая`: physical book history, account corpus, dependence and separate cases;
10. Imagism: first witnesses, infrastructure and the disputed 1924 dissolution;
11. Galina Benislavskaya as an editorial/financial working centre;
12. Caucasus 1924–1925, books, correspondence and imagined Persia;
13. late poetry without turning the lyric subject into diagnosis or legal autobiography;
14. Sofia Tolstaya, collected works, clinic documents, finances and the Leningrad plan.

All fourteen drafts have completed paragraph/claim-source audit. The controlling index is:

- `YESENIN_PART_II_PARAGRAPH_SOURCE_AUDIT_INDEX_PASS_01_2026-08.md`.

The executable contract is:

- `scripts/validate-yesenin-part-two-research.ts`;
- package script `validate:yesenin-part-two-research` inside `check:content`.

Audit completion does not make the chapters publication-ready. Exact quotations, physical objects, rights, documentary visuals, literary compression and final theological/editorial review remain open.

## Core architecture

- `YESENIN_PART_II_DETAILED_OUTLINE_PASS_01_2026-08.md` — 16-chapter contract, word budgets, myth checks, visual slots and anti-duplication.
- `YESENIN_PART_II_CLAIM_MATRIX_PASS_01_2026-08.md` — 55 high-load claims with safe formulas and statuses.
- `YESENIN_PART_II_CHAPTER_SOURCE_COVERAGE_PASS_01_2026-08.md` — chapter readiness map.
- `YESENIN_PART_II_SOURCE_ID_REGISTRY_PASS_01_2026-08.md` and later focused passes — stable source identity and representation classes.
- `YESENIN_PART_II_SOURCE_ID_MIGRATION_AUDIT_PASS_01_2026-08.md` — only exact proven aliases may be migrated; no global prefix replacement.
- `YESENIN_PART_II_AUTHORING_INDEX_PASS_01_2026-08.md` — focused authoring navigation.

## Chronology and route

- `YESENIN_DAY_LEVEL_CHRONOLOGY_1921_PASS_01_2026-08.md`.
- `YESENIN_DAY_LEVEL_CHRONOLOGY_1922_PASS_01_2026-08.md`.
- `YESENIN_DAY_LEVEL_CHRONOLOGY_1923_PASS_01_2026-08.md`.
- `YESENIN_DAY_LEVEL_CHRONOLOGY_1924_PASS_01_2026-08.md`.
- `YESENIN_DAY_LEVEL_CHRONOLOGY_1925_JAN_NOV_PASS_01_2026-08.md`.
- `YESENIN_EUROPE_AMERICA_ROUTE_SOURCE_MAP_1922_1923_2026-08.md`.
- `YESENIN_US_TOUR_DAY_LEVEL_PASS_01_2026-08.md`.
- `YESENIN_US_ARRIVAL_IMMIGRATION_SOURCE_PASS_02_2026-08.md`.
- `YESENIN_US_CITY_ROUTE_MATRIX_PASS_02_2026-08.md`.
- `YESENIN_US_DEPARTURE_TRANSPORT_PASS_02_2026-08.md`.

### US departure correction

The supported departure statement is now:

- Yesenin and Duncan left New York on **3 February 1923** aboard `George Washington`, heading toward Cherbourg;
- a separate academic annotation gives **4 February** as the endpoint of the American period;
- 4 February is not used as the New York departure date;
- the one-day difference still requires a passenger/port/timetable object for exact explanation;
- no deportation order or removal record has been acquired.

## Independent source gates

### Galina Benislavskaya

- `BENISLAVSKAYA_SOURCE_GATE_PASS_26_2026-08.md`;
- `BENISLAVSKAYA_BIOGRAPHICAL_SOURCE_PASS_27_2026-08.md`;
- `YESENIN_PART_II_SOURCE_PASS_CH11_CH12_2026-08.md`.

Academic inventory: 35 letters, notes and telegrams from Yesenin, one separate dedicatory inscription and 14 known letters from Benislavskaya. The full reverse correspondence and copy-based `Diary` remain acquisition gates.

### Yesenin and Imagism

- `YESENIN_IMAGISM_SOURCE_GATE_PASS_01_2026-08.md`;
- `YESENIN_IMAGISM_BIOGRAPHICAL_SOURCE_PASS_02_2026-08.md`;
- `YESENIN_PART_II_SOURCE_PASS_CH09_CH10_2026-08.md`.

`Сирена` no. 4–5 bears 30 January 1919 but actually appeared 17–18 April. `Советская страна` no. 3 appeared 10 February and reached readers first. The two texts differ; both physical issues remain required for independent variant analysis.

### Debut in `Мирок`

- `YESENIN_MIROK_SOURCE_GATE_PASS_01_2026-08.md`.

Six required witnesses: books 1, 2, 3, 4, 7 and 12, with exact poem pages. Catalogue arithmetic and guessed neighbouring IDs are forbidden.

These remain independent articles. Part II uses compact biographical context and links only after those articles exist.

## December 1925 — acquisition only

The final month has a separate control layer:

- `YESENIN_DECEMBER_1925_DAY_LEVEL_SOURCE_MATRIX_PASS_01_2026-08.md` — controlled chronology and anti-regression rules;
- `YESENIN_DECEMBER_1925_ACQUISITION_REGISTRY_2026-08.md` — twelve required documentary objects;
- `YESENIN_DECEMBER_1925_DISCOVERY_PASS_40_PLUS_2026-08.md` — forty web searches, Drive/Library checks and `SHORTLIST/HOLD/REJECT` decisions;
- `YESENIN_DECEMBER_1925_WITNESS_MATRIX_PASS_01_2026-08.md` — ten partial/pending witness rows, no composite `everyone remembered` narrative;
- `YESENIN_LAST_POEM_MYTH_SOURCE_MAP_2026-08.md` — manuscript, transfer, publication and addressee boundaries.

The executable acquisition gate is:

- `scripts/validate-yesenin-december-acquisition.ts`;
- package script `validate:yesenin-december-acquisition` inside `check:content`.

Current forensic status:

```yaml
web_search_queries_completed: 40
Drive_exact_searches_completed: 5
acquisition_objects: 12
witness_rows_created: 10
complete_witness_rows: 0
item_verified_objects: 0
binaries_downloaded_in_pass: 0
binaries_uploaded_to_Drive: 0
chapter_15_prose_created: false
ready_for_chapter_15_draft: false
```

The exact medical archive target is now known as IMLI, fund 32, inventory 2, storage unit 37. This is bibliographic discovery, not evidence that the file has been inspected.

### December hard stops

- clinic end date is not a documented discharge mechanism;
- future plans do not disprove crisis; crisis does not erase future plans;
- memoir is not a hotel register;
- written in blood does not automatically mean a legally defined suicide note;
- an evidentiary gap is not positive homicide evidence;
- the official version has real documents, but criticism must address the exact acts and representation chain;
- original negatives outrank retouched reproductions;
- no body photograph, rope, blood, cut hand or staged room is used as a hero/promotional visual;
- no final spiritual verdict is inferred from manner of death or farewell language.

## PDF and Drive acquisition

- `docs/SOURCE_ACQUISITION_AND_DRIVE_POLICY.md` is controlling.
- `PDF_ACQUISITION_PASS_03_YESENIN_1921_1925_2026-08.md` records the general Yesenin shortlist.
- `YESENIN_DECEMBER_1925_DISCOVERY_PASS_40_PLUS_2026-08.md` records the forensic shortlist.

A broad search is not an upload quota. No PDF is acquired until actual bytes, title/first page, page count, file size, text-layer status, provenance, rights and SHA-256 are verified. Do not create an empty batch folder.

Drive and Library searches found no exact forensic files for certificate no. 1037, Gilyarevsky’s act, conclusion no. 2028, the final-poem issue chain or the named December documentary books. Low-scoring unrelated search results are not duplicates or matches.

Current lawful priority includes the NЭБ item for `Вечерняя Москва`, 29 December 1925, no. 296, the 1926 memoir collections, `Красная нива` no. 4, the exact IMLI medical unit, verified inquiry/forensic acts and the full later commission/laboratory reports. None is reported uploaded yet.

## Visual and publication work

- `ESSAY_VISUAL_MARATHON_2026-08.md` — visual dramaturgy for five published essays.
- `DRIVE_VISUAL_INVENTORY_PASS_01_2026-08.md` — Drive visual audit.
- `COVER_REPLACEMENT_LEDGER_2026-08.md` — approved cover candidates and atomic binary/metadata/SHA requirements.
- `ARTICLE_RELEASE_QUEUE_2026-08.md` — release spacing.
- `VK_ANNOUNCEMENT_DRAFTS_2026-08.md` — gated announcement drafts; proposed dates are not scheduling permission.

## Publication boundary

A route opens only after source, rights, exact quotation, visual, moral/theological, literary, type, build and browser gates close on the same final head. A merge is not deployment evidence, and a green earlier SHA does not prove the current head.
