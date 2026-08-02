# Сергей Есенин. Часть II — аудит миграции source IDs, pass 01

**Дата:** 3 августа 2026 года  
**Статус:** `CONTROLLED MIGRATION / NO GLOBAL REPLACE / NO PUBLIC DATA YET`  
**Каноническая ветка:** `editorial/longform-marathon-2026-08`  
**Канонический PR:** `#271`

## 1. Проблема

Source architecture создавалась в несколько проходов:

- ранний stable registry резервировал IDs вида `yes2-*`;
- focused route, immigration, Imagism, Benislavskaya and clinic passes вводили IDs вида `ye2-*`;
- отдельные рабочие главы использовали временные IDs вида `yes-us-*`.

Префикс сам по себе не определяет качество или каноничность source object. Опасны две противоположные ошибки:

1. сохранить два reader-facing source objects для одного физического/академического свидетельства;
2. слить разные evidence classes только потому, что они относятся к одному событию.

Поэтому запрещено:

```text
replace all yes2- with ye2-
replace all yes-us- with ye2-
```

Миграция выполняется по bibliographic identity, exact URL/item, representation type and claim use.

---

## 2. Каноническое правило

### Один source object

Один stable ID используется, если совпадают:

- bibliographic item / archive object;
- exact child URL or item ID;
- representation type;
- edition/page;
- evidence class.

### Разные source objects

Отдельные IDs обязательны, если различаются:

- текст и академический комментарий;
- автограф и фотокопия автографа;
- physical newspaper page и academic transcription;
- event programme и поздняя institutional chronology;
- passenger manifest и institutional narrative;
- письмо и мемуар о письме;
- юридический документ и legal-history context.

### Alias only

Временное имя может быть записано как alias в research ledger, но не создаёт вторую reader source card.

---

## 3. Подтверждённые duplicate/alias candidates

### A. Записка Бениславской, 8 сентября 1923 года

```yaml
canonical_id: yes2-return-benislavskaya-sep8
alias_found: ye2-benislavskaya-note-1923-09-08
identity:
  exact_url: https://feb-web.ru/feb/esenin/texts/es6/es6-1594.htm
  printed_page: PSS volume 6, page 159
  text_basis: autograph
  archive: IMLI
migration: KEEP_CANONICAL / REMOVE_ALIAS_FROM_FUTURE_READER_DATA
```

Причина: pass 02 уже закрепил ранний ID, exact child page и provenance. Новый biographical pass описывает тот же документ, а не новый источник.

### B. Нью-йоркский макет Ярмолинскому

```yaml
canonical_id: yes2-work-yarmolinsky-project
alias_found: ye2-feb-yarmolinsky-book-project-1922
identity:
  exact_url: https://feb-web.ru/feb/esenin/texts/es7/es7-0724.htm?cmd=2
  object: Стихи и поэмы. Нью-Йорк, 1922 mock-up/project
migration: KEEP_CANONICAL / ALIAS_ONLY
```

Причина: оба ID обозначают один документированный книжный проект. Его незавершённость не создаёт второй object.

### C. Чтение `Страны Негодяев`, ночь 27–28 января 1923 года

```yaml
canonical_id: yes2-work-strana-new-york-reading
working_alias_found: yes-us-mani-leib-reading-1923-01-27-28
identity:
  academic_comment: https://rvb.ru/20vek/esenin/pss7/vol3/notes/205.html
  event: reading in Mani-Leib apartment
  evidence_class: multiple memoir accounts mapped by academic comments
migration: KEEP_CANONICAL / REPLACE_WORKING_ALIAS_IN_V02
```

Причина: временный US ID не должен создавать отдельную event card.

---

## 4. Не дубли: сохранять раздельно

### Arrival photograph vs passenger manifest

```yaml
photo_id: ye2-feb-ny-arrival-photo-1922-10-01
manifest_id: reserve_separately_after_acquisition
```

Фотография подтверждает прибытие и публичную среду. Manifest должен подтверждать passenger rows, port, class/cabin and immigration fields. Это разные evidence objects.

### Detention catalogue vs wire admission report

```yaml
catalog_id: ye2-nypl-ellis-detention-catalog
press_id: ye2-oregon-wire-admission-1922-10-02
```

NYPL catalogue title подтверждает существование архивного объекта о detention. Wire report сообщает admission after inquiry и предполагаемую длительность. Не сливать.

### Cable Act context vs Duncan case file

```yaml
context_id: ye2-nara-cable-act-context
case_file_id: reserve_after_acquisition
```

История закона не является индивидуальным решением по Дункан.

### `Правда` letter vs responses

```yaml
break_id: ye2-imagism-pravda-letter-1924-08-31
response_id: ye2-imagism-response-new-spectator-1924-09-09
continuation_id: ye2-imagism-continues-leaflet-1924-10-04
```

Три документа образуют спор, но не являются вариантами одного текста.

### Clinic certificate vs complete medical file

```yaml
certificate_id: ye2-clinic-certificate-1037-1925-11-28
medical_file_id: reserve_after_acquisition
```

Справка фиксирует лечение и невозможность допроса. Полная карта должна иметь отдельный archive/item object.

### Sofia manuscript representations

Не сливать:

- autograph Yesenin;
- list in Sofia Tolstaya’s hand;
- authorised list with Yesenin corrections;
- later copy;
- academic transcription.

### Benislavskaya October/December representations

Не сливать:

- October autograph rows;
- December photostat-of-autograph rows;
- published transcription;
- future visual binary.

---

## 5. IDs, которые остаются каноническими несмотря на ранний префикс

Следующие `yes2-*` были зарезервированы stable registry и не требуют переименования только ради единообразия:

- `yes2-1921-rozanov-autobiography`;
- `yes2-1921-pugachev-comments`;
- `yes2-1921-pugachev-book`;
- `yes2-work-berlin-autobiography`;
- `yes2-work-strana-prehistory`;
- `yes2-work-grzhebin-contract`;
- `yes2-work-grzhebin-volume`;
- `yes2-work-zhelezny-autograph`;
- `yes2-work-zhelezny-comments`;
- `yes2-return-duncan-aug29-letter`;
- `yes2-return-benislavskaya-sep8`;
- `yes2-return-miklashevskaya-oct27`;
- `yes2-poetry-letter-to-woman`;
- `yes2-work-yarmolinsky-project`;
- `yes2-work-strana-new-york-reading`.

Условие сохранения: future article data must contain one exact object, current URL/provenance from later registry passes, and no alias duplicate.

---

## 6. IDs, которые пока являются planning authorities, а не reader sources

Не переносить напрямую в будущий Essay source array:

- internal route maps;
- claim matrices;
- authoring packets;
- working-draft indexes;
- corpus audit files;
- Drive inventory summaries;
- source acquisition queues.

Они управляют исследованием, но не доказывают исторический claim читателю.

Допустимая роль:

```yaml
research_authority: true
reader_source: false
```

---

## 7. Migration classes

Каждый ID в paragraph/source audit получает один статус:

- `KEEP_CANONICAL` — stable bibliographic identity already reserved;
- `ALIAS_ONLY` — temporary/focused name for an existing canonical object;
- `SPLIT_REQUIRED` — current row improperly combines distinct evidence classes;
- `NEW_OBJECT` — unique source with no existing stable ID;
- `ROOT_ONLY` — navigation/root page, forbidden as final claim citation;
- `PLANNING_ONLY` — internal research authority;
- `HOLD` — missing pages/binary/provenance;
- `RETIRE` — erroneous or misleading ID that must not enter V02/data.

---

## 8. Required chapter migration order

Do not edit all 14 drafts in one mass transaction.

### Wave 1 — highest reuse

1. chapter 6 — replace `yes-us-mani-leib-reading-1923-01-27-28` with canonical `yes2-work-strana-new-york-reading`;
2. chapter 11 — replace duplicate 8 September alias with `yes2-return-benislavskaya-sep8`;
3. chapter 7 — confirm Yarmolinsky canonical object;
4. chapter 8 — confirm Duncan/Benislavskaya/Miklashevskaya exact pass-02 rows.

### Wave 2 — early chronology

- chapter 1 exact Chronicle child pages;
- chapter 3 legal-document rows;
- chapter 4 Berlin programme and contract rows.

### Wave 3 — works and late poetry

- chapters 9, 12 and 13;
- separate text/comment/physical-object rows;
- no source object created from an internal ledger.

### Wave 4 — specialised chapters

- chapter 10 physical press/leaflet objects;
- chapter 14 registry/clinic/financial binaries;
- chapter 15 only after forensic acquisition.

---

## 9. Immediate corrections permitted

Only exact aliases with confirmed bibliographic identity may be corrected before full paragraph/source audit:

- `yes-us-mani-leib-reading-1923-01-27-28` → `yes2-work-strana-new-york-reading`;
- `ye2-benislavskaya-note-1923-09-08` → `yes2-return-benislavskaya-sep8` where the paragraph cites the 8 September note;
- `ye2-feb-yarmolinsky-book-project-1922` → `yes2-work-yarmolinsky-project`.

Do not rename unrelated focused IDs merely for visual consistency.

---

## 10. Gate before public article data

- [ ] every paragraph claim has stable claim ID;
- [ ] every reader citation uses canonical source ID;
- [ ] aliases do not appear in source array;
- [ ] root/sitemap URLs are not final claim citations;
- [ ] text and comments are separate where needed;
- [ ] representations are typed correctly;
- [ ] binary/rights statuses are carried into visual objects;
- [ ] no planning-only file is exposed as historical source;
- [ ] duplicate source-card validator exists before Part II route;
- [ ] typecheck/build/browser run on final data head.

## 11. Verdict

```yaml
global_prefix_replace_allowed: false
confirmed_alias_groups: 3
confirmed_distinct_evidence_groups: 6+
canonical_early_ids_retained: true
reader_source_array_created: false
migration_ready_for_wave_1: true
ready_for_publication: false
```
