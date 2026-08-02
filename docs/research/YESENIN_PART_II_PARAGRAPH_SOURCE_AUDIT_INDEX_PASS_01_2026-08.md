# Сергей Есенин. Часть II — индекс paragraph/source‑аудита, pass 01

**Дата:** 3 августа 2026 года  
**Статус:** `CHAPTERS 1–8 AUDITED / CHAPTERS 9–14 NEXT / НЕ ПУБЛИКОВАТЬ`  
**Каноническая ветка:** `editorial/longform-marathon-2026-08`  
**Канонический PR:** `#271`

## 1. Завершённые audit waves

### Главы 1–2

Файлы:

- `YESENIN_PART_II_PARAGRAPH_SOURCE_AUDIT_CH01_CH02_PASS_01_2026-08.md`;
- `YESENIN_PART_II_SOURCE_PASS_CH01_CH02_GAPS_2026-08.md`;
- `YESENIN_PART_II_PARAGRAPH_SOURCE_AUDIT_CH01_CH02_CLOSURE_PASS_02_2026-08.md`.

Закрыто:

- сентябрьские документы 1921 года названы точными коллективными полемическими письмами;
- афиша 17 октября и дневник Мачтета разделены;
- дата встречи с Дункан сохраняет вероятностную квалификацию;
- 2/8/10 мая 1922 года получили отдельные source rows;
- свадебная фотография не подменяет регистрационный документ.

Открыто:

- физические документы, rights and SHA;
- exact Chronicle pages;
- reused source IDs самостоятельной статьи о встрече.

### Главы 3–4

Файлы:

- `YESENIN_PART_II_PARAGRAPH_SOURCE_AUDIT_CH03_CH04_PASS_01_2026-08.md`;
- `YESENIN_PART_II_SOURCE_PASS_CH03_CH04_GAPS_2026-08.md`;
- `YESENIN_PART_II_PARAGRAPH_SOURCE_AUDIT_CH03_CH04_CLOSURE_PASS_02_2026-08.md`.

Закрыто:

- provisional 2/8/10 May IDs retired;
- public pair photograph separated from later false-divorce caption;
- exact known rumour carrier pinned: `Всемирная иллюстрация`, 1923, № 11, p. 26;
- Berlin arrival/Nakanune chain pinned at academic level;
- House of Arts political press lines split;
- Blüthner Hall event pinned at programme-target level;
- Grzhebin document provenance qualified;
- departure/no-return comment pinned;
- Brussels and two Paris periods inserted; Hague/Rome/London remain plans.

Открыто:

- upstream German rumour source;
- primary Berlin newspaper/programme scans;
- translation bundle split;
- physical Berlin volume and rights.

### Главы 5–6

Файл:

- `YESENIN_PART_II_PARAGRAPH_SOURCE_AUDIT_CH05_CH06_PASS_01_2026-08.md`.

Результат:

- immediate factual regressions: `0`;
- canonical alias regressions: `0`;
- plan/completion, event/programme, press/legal and departure/period distinctions remain intact.

Открыто:

- `Paris` manifest;
- immigration file;
- arrival/departure press scans;
- Carnegie programmes;
- Boston/Cleveland/other-city programmes;
- `George Washington` manifest;
- documentary visual rights.

### Главы 7–8

Файл:

- `YESENIN_PART_II_CLAIM_SOURCE_AUDIT_CH07_CH08_PASS_01_2026-08.md`.

Результат:

- immediate factual regressions: `0`;
- work categories remain distinct;
- canonical source reuse mapped across chapters;
- return‑year literary, relational, economic and legal lines remain separate.

Открыто:

- translation bundle split into five evidence objects;
- physical Grzhebin/French editions;
- `Страна Негодяев` manuscript witness matrix;
- `Железный Миргород` manuscript/newspaper binaries;
- 3 August arrival transport object;
- 21 August event programme/report;
- `Стойло Пегаса` account item matrix;
- September cafe legal file;
- November four‑poets protocol/case matrix.

---

## 2. Executable protections already active

`scripts/validate-yesenin-part-two-research.ts` is included in `check:content` and currently protects:

- explicit non‑public status of all 14 drafts;
- no chapter 15/16 prose;
- no Part II public module/registration;
- qualified Duncan meeting date;
- chapter 1 September and 17 October source splits;
- chapter 2–3 legal sequence and representation boundaries;
- chapter 3 press rumour boundary;
- chapter 4 Berlin event/source splits;
- chapter 5 plan/completion boundaries;
- chapter 6 immigration/departure and canonical IDs;
- chapter 10 two‑witness/contested-break boundary;
- chapter 11 reverse-letter/diary boundary;
- chapter 13 diagnosis/repentance boundary;
- chapter 14 medical boundary.

Green results from an earlier SHA do not apply to a moved head.

---

## 3. Next audit waves

### Wave 5 — главы 9–10

- `Москва кабацкая`: book project versus physical edition; role versus dependence; accounts versus consumption; censorship and legal files.
- Imagism: infrastructure versus poetics; 1919 physical-witness boundary; `Правда` letter versus responses; no duplicate independent article.

### Wave 6 — главы 11–12

- Benislavskaya: one-sided correspondence, work functions, copy-based diary, reverse-letter gap.
- Caucasus: exact city/date route, books versus cycles, Persia plan versus geography, medical claims.

### Wave 7 — главы 13–14

- late poetry: exact witnesses/variants, quotation basis, biography versus lyrical subject, moral/theological claims.
- Sofia/clinic: authorised manuscripts, marriage record, contract, certificate, bankbook, clinic file and discharge mechanism.

### Wave 8 — chapter 15 acquisition audit only

No narrative prose. Audit only:

- medical file;
- Moscow–Leningrad transport;
- hotel records;
- witness matrix;
- inquiry documents;
- forensic reports;
- original/retouched photographs;
- rights.

### Wave 9 — chapter 16 last

Only after all source, moral/theological and literary audits.

---

## 4. Definition of paragraph/source closure

A chapter does not become V02 merely because an audit file exists.

Required:

- every high‑load factual sentence has claim ID;
- every claim has canonical source ID;
- exact text/comment/physical representation classes are separated;
- source gaps are either closed or visible in the prose/gate list;
- aliases do not enter future reader data;
- no internal research ledger is exposed as historical proof;
- documentary visual slot has item/provenance/rights status;
- literary compression and theological review complete;
- final‑head validators pass.

## 5. Current verdict

```yaml
current_working_chapters: 14
chapters_paragraph_or_claim_audited: 8
chapters_remaining_for_audit: 6
immediate_regressions_found_so_far: 1
immediate_regressions_fixed: 1
source_gap_closures_applied_to_prose: true
public_route_created: false
part_ii_data_module_created: false
chapter_15_prose_created: false
ready_for_publication: false
```
