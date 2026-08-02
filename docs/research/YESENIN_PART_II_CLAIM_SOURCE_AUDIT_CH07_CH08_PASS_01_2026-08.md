# Сергей Есенин. Часть II — claim/source audit, главы 7–8, pass 01

**Дата:** 3 августа 2026 года  
**Статус:** `CLAIM-GROUP AUDIT / EXACT PARAGRAPH CITATIONS AND BINARIES OPEN / НЕ ПУБЛИКОВАТЬ`  
**Черновики:**

- `YESENIN_PART_II_DRAFT_CH07_FOREIGN_WORK_V01_2026-08.md`;
- `YESENIN_PART_II_DRAFT_CH08_RETURN_1923_V01_2026-08.md`.

## 1. Почему здесь нужен claim-group audit

Главы 7–8 связывают много документов разных классов. Главная опасность состоит не в одной неверной дате, а в незаметном смешении состояний:

- замысел до отъезда;
- продолжение работы за границей;
- чтение незавершённого текста;
- выпуск за границей ранее написанных произведений;
- работа переводчика;
- объявленный, но не осуществлённый проект;
- текст, написанный уже после возвращения;
- личное письмо;
- счёт или протокол как ограниченный юридический/экономический документ.

До V02 каждый фактический абзац должен использовать source object соответствующего класса. Один общий `foreign work` или `return 1923` bundle не становится reader source.

---

# Глава 7 — зарубежная работа

## CH07-G01 — `Страна Негодяев`: замысел до отъезда

```yaml
claim_ids: [YES2-CH07-C01, YES2-CH07-C02]
claims:
  - замысел и работа существовали до 10 мая 1922 года
  - 14 мая в Берлине Есенин уже называл поэму текущей большой работой
sources:
  - yes2-work-strana-prehistory
  - yes2-work-berlin-autobiography
evidence:
  - primary letter / academic chronology
  - exact authored autobiography child page
status: TEXT-PINNED / EARLY-MANUSCRIPT-BINARY-OPEN
```

Безопасный вывод:

> Америка была одним из этапов работы, а не местом внезапного возникновения поэмы.

Запрещено:

- `поэма написана в Америке`;
- датировать весь текст одним нью-йоркским эпизодом;
- использовать поздний мемуар об утраченном варианте как сохранившийся автограф.

## CH07-G02 — публичные чтения незавершённого текста

```yaml
claim_ids: [YES2-CH07-C03, YES2-CH07-C04]
claims:
  - материал читался 1 июня в Берлине
  - ранняя версия читалась ночью 27–28 января в Нью-Йорке
sources:
  - yes2-berlin-bluthner-1922-06-01
  - yes2-work-strana-new-york-reading
evidence:
  - academically mapped event/programme target
  - multiple memoir accounts mapped by academic comments
status: EVENT-PINNED / PRIMARY-PROGRAMME-AND-MEMOIR-EDITION-GATES-OPEN
```

Ключевая граница:

- факт чтения не равен точному составу поздней редакции;
- свидетельство о несохранившемся варианте не превращается в физический manuscript object.

## CH07-G03 — берлинский том: издание не равно созданию

```yaml
claim_ids: [YES2-CH07-C05, YES2-CH07-C06, YES2-CH07-C07]
claims:
  - договорная/расписочная цепь началась 18 мая
  - первый том физически вышел в Берлине осенью 1922 года
  - основная часть включённых текстов была создана раньше
sources:
  - yes2-work-grzhebin-contract
  - yes2-work-grzhebin-volume
status: ACADEMICALLY-PINNED / PHYSICAL-BOOK-AND-RIGHTS-OPEN
```

Перед V02:

- получить title page/cover/collation;
- закрепить точную формулу о корректуре;
- не создавать source card из внутренней work matrix.

## CH07-G04 — переводы: пять разных состояний

```yaml
claim_ids: [YES2-CH07-C08, YES2-CH07-C09, YES2-CH07-C10]
current_bundle: yes2-work-translation-ledger
status: SPLIT_REQUIRED
```

Нужны отдельные reader objects:

1. `authorial-intention` — письмо о желании издать тексты;
2. `translator-work` — работа Франца Элленса и Марии Милославской;
3. `publisher/bibliographic-record`;
4. `physical-French-edition`;
5. `unrealised-English-project`.

Нельзя писать:

- обещанный перевод = завершённый перевод;
- работа переводчика = текст, созданный Есениным на иностранном языке;
- зарубежный выпуск = зарубежное создание включённых стихов.

## CH07-G05 — проект Ярмолинскому

```yaml
claim_ids: [YES2-CH07-C11]
source: yes2-work-yarmolinsky-project
evidence: documented author book mock-up / project
status: CANONICAL-ID-PINNED / PUBLICATION-NOT-PROVEN
```

Безопасная формула:

> Макет был передан для перевода и возможного издания; завершённая американская книга не установлена.

## CH07-G06 — `Железный Миргород`: американский предмет, московский автограф

```yaml
claim_ids: [YES2-CH07-C12, YES2-CH07-C13, YES2-CH07-C14]
claims:
  - известный автограф датирован 14 августа 1923 года, Москва
  - первая часть вышла 22 августа, вторая 16 сентября
  - manuscript and newspaper text differ
sources:
  - yes2-work-zhelezny-autograph
  - yes2-work-zhelezny-comments
status: TEXT/AUTOGRAPH-CHRONOLOGY-PINNED / MANUSCRIPT-IMAGE-AND-NEWSPAPER-SCANS-OPEN
```

Ключевая граница:

- путешествие является предметом текста;
- известный текст не является синхронным дорожным дневником.

## CH07-G07 — итоговая классификация главы

Перед V02 каждая работа получает одно или несколько явных состояний:

```yaml
states:
  - conceived_before_departure
  - worked_on_abroad
  - read_abroad
  - published_abroad
  - translated_by_others
  - planned_but_unrealised
  - written_after_return_from_foreign_experience
```

Если произведение находится в нескольких состояниях, они не заменяют друг друга.

---

# Глава 8 — возвращение 1923 года

## CH08-G01 — возвращение 3 августа

```yaml
claim_ids: [YES2-CH08-C01]
claim: Есенин и Дункан вернулись в Москву 3 августа 1923 года
source: academic route chronology / exact transport object still open
status: ACADEMICALLY-PINNED / ARRIVAL-BINARY-OPEN
```

Не писать:

- отношения завершились в день возвращения;
- поездка закончилась одним психологическим выводом.

## CH08-G02 — `Железный Миргород` после возвращения

```yaml
claim_ids: [YES2-CH08-C02, YES2-CH08-C03]
sources:
  - yes2-work-zhelezny-autograph
  - yes2-work-zhelezny-comments
status: PINNED / PHYSICAL-WITNESSES-OPEN
```

Глава 8 должна ссылаться на те же canonical objects, что глава 7, а не создавать duplicate return-specific cards.

## CH08-G03 — публичное выступление/разговор 21 августа

```yaml
claim_ids: [YES2-CH08-C04]
claim: 21 August event concerned America and new work
status: EVENT-PROGRAMME/REPORT-PENDING
```

Перед V02:

- exact venue, programme/announcement and report;
- определить жанр события: выступление, беседа, отчёт или смешанная программа;
- не называть его `стенографическим докладом` без transcript.

## CH08-G04 — письмо Дункан 29 августа

```yaml
claim_ids: [YES2-CH08-C05]
source: yes2-return-duncan-aug29-letter
evidence: exact child page / autograph in RGALI
status: CANONICAL-ID-PINNED
```

Что доказывает:

- связь и коммуникация продолжались после московского возвращения.

Чего не доказывает:

- устойчивое примирение;
- один окончательный статус отношений.

## CH08-G05 — Бениславская 8 сентября

```yaml
claim_ids: [YES2-CH08-C06]
source: yes2-return-benislavskaya-sep8
evidence: primary note/autograph in IMLI
status: CANONICAL-ID-PINNED
```

Не дублировать focused alias `ye2-benislavskaya-note-1923-09-08`.

## CH08-G06 — Миклашевская 27 октября

```yaml
claim_ids: [YES2-CH08-C07]
source: yes2-return-miklashevskaya-oct27
evidence: exact child page and academic provenance
status: CANONICAL-ID-PINNED
```

Граница:

- письмо/записка подтверждает контакт;
- печатный порядок `Любви хулигана` не становится дневным календарём создания цикла.

## CH08-G07 — счета `Стойла Пегаса`

```yaml
claim_ids: [YES2-CH08-C08, YES2-CH08-C09]
claims:
  - сохранилась серия подписанных счетов 1 September–23 November
  - документы показывают экономическую/бытовую связь с заведением
status: ARCHIVE-DOCUMENTS / ITEM-LEVEL-MATRIX-AND-RIGHTS-OPEN
```

Нельзя:

- считать каждую позицию лично употреблённой Есениным;
- выводить конкретный эпизод опьянения из суммы счёта;
- смешивать счета и милицейские протоколы.

Нужен stable object set:

- register-level source;
- representative item rows;
- creator/issuer/date/signature fields;
- rights and SHA.

## CH08-G08 — сентябрьский инцидент в кафе

```yaml
claim_ids: [YES2-CH08-C10]
status: LEGAL-FILE-PENDING
```

Перед V02:

- exact complaint/protocol/date;
- parties and procedural status;
- no reconstruction from later anecdote.

## CH08-G09 — ноябрьское `дело четырёх поэтов`

```yaml
claim_ids: [YES2-CH08-C11, YES2-CH08-C12]
claims:
  - separate November legal/police file
  - signature under 21 November interrogation protocol survives
status: DOCUMENTED / EXACT-PROTOCOL-PAGE-AND-CASE-MATRIX-PENDING
```

Обязательная граница:

- сентябрьский кафе-инцидент и ноябрьское дело — разные юридические цепи;
- не объединять их в один `скандал в Стойле`.

## CH08-G10 — отношения, литература и право не одна линия

```yaml
claim_ids: [YES2-CH08-S01]
class: editorial synthesis
status: SUPPORTED BY DISTINCT SOURCE CLASSES
```

Глава должна удерживать параллельно:

- литературную переработку зарубежного опыта;
- продолжающуюся связь с Дункан;
- новые/возобновлённые связи с Миклашевской и Бениславской;
- экономические документы;
- отдельные юридические дела.

---

## 2. Найденные source gaps

```yaml
chapter_7:
  - translation bundle requires five source objects
  - physical Grzhebin/French editions and rights
  - Strana Negodyaev manuscript witness matrix
  - Zhelezny manuscript/newspaper binaries
chapter_8:
  - 3 August arrival transport object
  - 21 August event exact programme/report
  - Stoylo account item-level matrix
  - September cafe legal file
  - November four-poets exact protocol/case matrix
```

## 3. Immediate safe migrations

No blind prose rewrite is authorised by this pass.

Safe ID rules:

- reuse `yes2-work-zhelezny-autograph/comments` across chapters 7 and 8;
- reuse `yes2-return-duncan-aug29-letter`;
- reuse `yes2-return-benislavskaya-sep8`;
- reuse `yes2-return-miklashevskaya-oct27`;
- retain `yes2-work-yarmolinsky-project` and `yes2-work-strana-new-york-reading`;
- do not expose `yes2-work-translation-ledger` as a reader source card.

## 4. Verdict

```yaml
claim_groups_audited:
  chapter_7: 7
  chapter_8: 10
immediate_factual_regressions: 0
canonical_reuse_requirements: 6
split_required_bundles: 1
legal_item_matrices_open: 2
ready_for_v02: false
ready_for_publication: false
```
