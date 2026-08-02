# Сергей Есенин. Часть II — индекс рабочих черновиков, pass 02

**Updated:** 2 August 2026  
**Status:** `WORKING PROSE / НЕ ПУБЛИКОВАТЬ`  
**Supersedes for current status:** `YESENIN_PART_II_WORKING_DRAFTS_INDEX_2026-08.md`  
**Canonical branch:** `editorial/longform-marathon-2026-08`  
**Canonical PR:** `#271`

## 1. Current V01 corpus

| Chapter | File | Readiness after V01 |
|---:|---|---|
| 1 | `YESENIN_PART_II_DRAFT_CH01_1921_V01_2026-08.md` | exact Chronicle/programme/visual pages still required |
| 2 | `YESENIN_PART_II_DRAFT_CH02_DUNCAN_MEETING_V01_2026-08.md` | reuse exact source IDs and pair-visual provenance required |
| 7 | `YESENIN_PART_II_DRAFT_CH07_FOREIGN_WORK_V01_2026-08.md` | translation ledger and physical foreign objects required |
| 8 | `YESENIN_PART_II_DRAFT_CH08_RETURN_1923_V01_2026-08.md` | arrival/legal/account pages and visual rights required |
| 9 | `YESENIN_PART_II_DRAFT_CH09_MOSKVA_KABATSKAYA_V01_2026-08.md` | physical 1924 book/censorship/account matrix required |
| 13 | `YESENIN_PART_II_DRAFT_CH13_LATE_POETRY_V01_2026-08.md` | exact quotations, manuscripts/editions and theological review required |

Every file contains:

- `WORKING DRAFT / НЕ ПУБЛИКОВАТЬ`;
- explicit route prohibition;
- working stable source IDs;
- a V02 source gate;
- a prohibition on transfer to `src/data/essays`.

## 2. What the V01 corpus already establishes

- The late biography begins in 1921 before Duncan.
- Duncan's first meeting remains probable rather than theatrically exact.
- Work abroad is divided into composition, reworking, publication, translation project and post-return processing.
- The August 1923 return is a phase, not one final quarrel.
- `Москва кабацкая` is analysed through role, market, physical book, accounts and real dependence.
- Late poetry is read as crafted literature, not a clinical chart, diary or automatic repentance.

## 3. Current authoring order

### Next partial-draft chapters

1. Chapter 3 — marriage, passport and public couple.
2. Chapter 4 — Berlin publishing and public conflict.
3. Chapter 12 — Caucasus 1924–1925.

These may be drafted only around already verified modules. Unresolved press, route and visual claims remain omitted or visibly gated.

### Source-gated before prose

- Chapter 5 — complete European route.
- Chapter 6 — city-by-city US tour and immigration file.
- Chapter 10 — physical first Imagist Declaration witnesses.
- Chapter 11 — Benislavskaya reverse-letter and diary source corpus.
- Chapter 14 — full clinic file and discharge mechanism.
- Chapter 15 — original medical/hotel/inquiry/forensic corpus.

### Written last

- Chapter 16 — final synthesis and theological conclusion.

## 4. Local exact-head documentation gate

The updated remote branch was checked locally for:

- `git diff --check` against current `main`;
- presence of all six expected V01 drafts;
- required non-public markers and no-transfer gates;
- absence of a premature Part II slug/import in `src/data/essays/index.ts`;
- focused authoring-index relative-file integrity.

This is a documentation/editorial gate. It does not replace GitHub Actions, TypeScript/build checks for future code changes, browser QA or production evidence.

## 5. V02 rules

- Do not remove qualifications to improve rhythm.
- Do not replace missing documents with plausible prose.
- Do not expose internal source IDs to readers.
- Do not insert a reconstruction where a documentary visual is promised.
- Do not update live editorial dates.
- Do not merge the source-gated chapters into these completed drafts.
- Run literary-style review only after exact quotation and source pages are fixed.
