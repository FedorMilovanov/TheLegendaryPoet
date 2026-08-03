# Сергей Есенин. Часть II — единый индекс paragraph/source‑аудита

**Дата:** 3 августа 2026 года  
**Статус:** `ALL 14 WORKING CHAPTERS AUDITED / CHAPTER 15 ACQUISITION ONLY / НЕ ПУБЛИКОВАТЬ`  
**Каноническая ветка:** `editorial/longform-marathon-2026-08`  
**Канонический PR:** `#271`  
**Принцип:** этот файл обновляется на месте; не создавать параллельные `FINAL/LATEST/PASS-02` индексы без отдельной необходимости.

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

Открыто: физические документы, rights/SHA, exact Chronicle pages и reused source IDs самостоятельной статьи о встрече.

### Главы 3–4

Файлы:

- `YESENIN_PART_II_PARAGRAPH_SOURCE_AUDIT_CH03_CH04_PASS_01_2026-08.md`;
- `YESENIN_PART_II_SOURCE_PASS_CH03_CH04_GAPS_2026-08.md`;
- `YESENIN_PART_II_PARAGRAPH_SOURCE_AUDIT_CH03_CH04_CLOSURE_PASS_02_2026-08.md`.

Закрыто:

- provisional 2/8/10 May IDs retired;
- public-pair photograph separated from later false-divorce caption;
- known rumour carrier pinned: `Всемирная иллюстрация`, 1923, № 11, p. 26;
- Berlin arrival, House of Arts, Blüthner Hall, Grzhebin and departure source classes split;
- Brussels and two Paris periods inserted; Hague/Rome/London remain plans.

Открыто: upstream German rumour source, primary Berlin scans/programmes, translation objects, physical Berlin volume and rights.

### Главы 5–6

Файл: `YESENIN_PART_II_PARAGRAPH_SOURCE_AUDIT_CH05_CH06_PASS_01_2026-08.md`.

Результат:

- immediate factual regressions: `0`;
- plan/completion, event/programme, press/legal and departure/period distinctions remain intact.

Открыто: manifests, immigration file, press scans, programmes, city-level tour records and visual rights.

### Главы 7–8

Файл: `YESENIN_PART_II_CLAIM_SOURCE_AUDIT_CH07_CH08_PASS_01_2026-08.md`.

Результат:

- work categories remain distinct;
- canonical source reuse mapped;
- return-year literary, relational, economic and legal lines remain separate.

Открыто: translation ledger, physical editions, manuscript/newspaper binaries, arrival/event objects, accounts and two separate legal files.

### Главы 9–10

Файл: `YESENIN_PART_II_SOURCE_PASS_CH09_CH10_2026-08.md`.

Закрыто в самих черновиках:

- project/book/textological history of `Москва кабацкая` split;
- account corpus no longer collapsed to an uncontested `52` total;
- more than 100 preserved accounts, signature classes and third-person charges identified;
- 15 September account note and legal chain separated;
- September cafe case not fused with the November four-poets case;
- censorship correcture described only at academic-comment level;
- `Сирена` actual release fixed to 17–18 April;
- physical 1919 witnesses remain required for variant analysis;
- `Правда`, `Новый зритель` and 4 October leaflet source/binary classes separated.

Открыто: physical July 1924 book/correcture/legal pages, selected quotations, full 1919 issues, newspaper/leaflet scans and rights.

### Главы 11–12

Файл: `YESENIN_PART_II_SOURCE_PASS_CH11_CH12_2026-08.md`.

Закрыто в самих черновиках:

- five exact Benislavskaya aliases migrated to canonical `yes2-benislavskaya-*` IDs;
- October autographs and December photostats distinguished;
- content/postmark/Tiflis-postmark dating bases retained;
- reverse correspondence and copy-based diary remain visibly incomplete;
- Tiflis, Baku and Batum remain separate route bins;
- failed Tabriz attempt, Tehran plan and poetic Persia remain separate from physical Iran travel;
- late-May Persian author book separated from the August/final cycle;
- spring medical narrative remains qualified;
- Sofia trip is not called a proven honeymoon or proof of stability.

Открыто: pages 236–280, all 14 reverse letters, diary archive matrix, daily Caucasus route, medical file, first-edition binaries, transport/address evidence and rights.

### Главы 13–14

Файл: `YESENIN_PART_II_SOURCE_PASS_CH13_CH14_2026-08.md`.

Закрыто в самих черновиках:

- `Письмо к женщине` addressee remains attributed to later testimony;
- academic `Незрело...` reading preserved and mixed-script typo removed;
- Persian cycle and selected poem-level sources separated;
- physical May book and final cycle remain different objects;
- `Чёрный человек` completed before clinic and not used as diagnosis or direct suicide note;
- `Клён...` draft autograph, Sofia authorised copy and posthumous publication separated;
- artistic confession not equated with repentance;
- calendar transcription separated from missing marriage registry image;
- Sofia document/handwriting types separated;
- contract and authorial preparation separated from posthumous volumes;
- Evdokimov memoir-published telegram separated from missing original;
- certificate no. 1037 separated from complete medical file;
- bank and Leningrad plans separated from psychological inference.

Открыто: exact quotations, physical editions/manuscripts, registry/certificate/bankbook/telegram binaries, complete medical file, treatment-end mechanism, rights and final literary/theological review.

---

## 2. Executable protections active

`scripts/validate-yesenin-part-two-research.ts` is included in `check:content` and protects:

- explicit non-public status of all 14 drafts;
- no chapter 15/16 prose;
- no Part II public module/registration;
- qualified Duncan meeting date;
- source splits and retired aliases in chapters 1–4;
- Europe/US route, immigration and departure boundaries;
- chapter 9 account/legal/censorship distinctions;
- chapter 10 physical-witness and missing-scan distinctions;
- chapter 11 canonical letter IDs and autograph/photostat distinction;
- chapter 12 Iran-route, book/cycle and medical boundaries;
- chapter 13 textological, authorised-copy, pre-clinic and repentance boundaries;
- chapter 14 registry, contract, telegram, certificate, bank and psychological-inference boundaries.

Green evidence from an earlier SHA does not apply to a moved head.

---

## 3. Next stage

### Chapter 15 — acquisition/forensic audit only

No narrative prose. Work only in `YESENIN_DECEMBER_1925_DAY_LEVEL_SOURCE_MATRIX_PASS_01_2026-08.md` and related source/rights ledgers:

- full medical file and treatment-end mechanism;
- Moscow–Leningrad transport;
- hotel registration and room records;
- witness matrix with first statement/date/interest;
- initial inspection and inquiry documents;
- forensic act and laboratory reports;
- original versus retouched photographs;
- final-poem manuscript/provenance;
- item-level rights.

### Chapter 16 — last

No final synthesis until:

- chapter 15 source hierarchy closes sufficiently;
- all 14 drafted chapters pass literary compression;
- exact quotations are verified;
- moral/theological review is complete;
- documentary visuals are rights-cleared;
- final-head content/type/build/browser checks pass.

---

## 4. Definition of paragraph/source closure

A chapter does not become V02 merely because an audit file exists. Required:

- every high-load factual sentence has claim ID;
- every claim has canonical source ID;
- exact text/comment/physical representation classes are separated;
- source gaps are either closed or visible in prose/gates;
- aliases do not enter future reader data;
- no internal research ledger is exposed as historical proof;
- documentary visual slot has item/provenance/rights status;
- literary compression and theological review complete;
- final-head validators pass.

## 5. Current verdict

```yaml
current_working_chapters: 14
chapters_paragraph_or_claim_audited: 14
chapters_remaining_for_audit: 0
immediate_regressions_found_so_far: 2
immediate_regressions_fixed: 2
confirmed_alias_migrations_applied: 8
source_gap_closures_applied_to_prose: true
chapter_15_mode: acquisition_only
public_route_created: false
part_ii_data_module_created: false
chapter_15_prose_created: false
chapter_16_prose_created: false
ready_for_publication: false
```
