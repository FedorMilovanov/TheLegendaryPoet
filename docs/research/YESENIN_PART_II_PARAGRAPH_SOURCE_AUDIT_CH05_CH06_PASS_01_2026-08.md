# Сергей Есенин. Часть II — paragraph/source audit, главы 5–6, pass 01

**Дата:** 3 августа 2026 года  
**Статус:** `PARAGRAPH CLAIM MAP / NO IMMEDIATE TEXT REGRESSION / PRIMARY BINARY GATES OPEN / НЕ ПУБЛИКОВАТЬ`  
**Черновики:**

- `YESENIN_PART_II_DRAFT_CH05_EUROPE_ROUTE_V01_2026-08.md`;
- `YESENIN_PART_II_DRAFT_CH06_US_PARTIAL_V02_2026-08.md`.

## 1. Главный результат

В отличие от глав 1–4, текущие главы 5–6 не содержат обнаруженной формулировки, которую необходимо немедленно смягчить или исправить. Они уже последовательно различают:

- письмо из города и план посетить город;
- institutional event date и неполученную programme page;
- detention/inquiry/admission и deportation;
- press report и official immigration record;
- academic route bin и completed city stop;
- departure date 3 February и conflicting period endpoint 4 February.

Pass 01 не повышает главы до V02/production. Он показывает точные remaining source classes.

---

# Глава 5 — `Европа: маршрут, сохранившийся пунктиром`

## CH05-P01 — метод пунктирной карты

```yaml
claim_ids: [YES2-CH05-M01]
class: methodological synthesis
sources:
  - ye2-feb-schneider-1922-06-21
  - ye2-feb-sakharov-1922-07-01
  - ye2-feb-schneider-1922-07-13
  - ye2-feb-esenina-1922-08-10
status: SUPPORTED-METHOD
```

Граница сохранена: письма фиксируют точки, не непрерывную линию.

## CH05-P02 — Висбаден

```yaml
claim_ids: [YES2-CH05-C01, YES2-CH05-C02]
claims:
  - 21 June letter locates Yesenin in Wiesbaden
  - treatment/sobriety/work statements are one-day self-report
source: ye2-feb-schneider-1922-06-21
status: PRIMARY-LETTER-PINNED / QUOTATION-LENGTH-OPEN
```

Не требуется текстовое исправление. Перед V02 нужны exact printed page, archive provenance and quote selection.

## CH05-P03 — Гаага

```yaml
claim_ids: [YES2-CH05-C03]
claim: 29 June appeal documents intention/obstacle, not completed Hague stop
source: ye2-feb-litvinov-1922-06-29
status: PRIMARY-DOCUMENT / EXACT-REPRESENTATION-PENDING
```

Граница plan/completion выражена правильно.

## CH05-P04 — Дюссельдорф / Брюссель

```yaml
claim_ids: [YES2-CH05-C04, YES2-CH05-C05, YES2-CH05-C06]
claims:
  - Düsseldorf letter dated 1 July
  - Brussels planned for 3 July
  - Brussels confirmed by 13 July letter, exact arrival day unknown
sources:
  - ye2-feb-sakharov-1922-07-01
  - ye2-feb-schneider-1922-07-13
status: PRIMARY-LETTERS-PINNED
```

Утраченные/невыявленные письма и телеграмма обозначены как gaps, а не реконструированы.

## CH05-P05 — Остенде и издательские ожидания

```yaml
claim_ids: [YES2-CH05-C07, YES2-CH05-I01]
claims:
  - 9 July letter locates Yesenin in Ostend
  - letter records translation/publishing expectations and emotional judgement
source: ye2-feb-mariengof-1922-07-09
status: PRIMARY-LETTER-PINNED / READER-QUOTE-REVIEW-PENDING
```

Авторская полемическая оценка не превращена в нейтральный портрет Европы.

## CH05-P06 — два парижских этапа

```yaml
claim_ids: [YES2-CH05-C08, YES2-CH05-C09]
claims:
  - first Paris stage supported by letter range
  - second stage academically reconstructed for late August–September
sources:
  - ye2-feb-mariengof-paris-1922-jul-aug
  - ye2-feb-paris-second-period-1922
status: MIXED PRIMARY/ACADEMIC / EXACT-PAGES-PENDING
```

Перед V02:

- exact letter child page;
- exact Ellens-comment page;
- physical French edition as separate object.

## CH05-P07 — Венеция / Лидо / Рим

```yaml
claim_ids: [YES2-CH05-C10, YES2-CH05-C11]
claims:
  - 10 August letter locates Yesenin on Lido and states future plans
  - 14 August photo again locates pair on Lido
sources:
  - ye2-feb-esenina-1922-08-10
  - ye2-feb-lido-photo-1922-08-14
status: LETTER PINNED / PHOTO RIGHTS-PENDING
```

Текст правильно запрещает заполнение промежутка поездкой в Рим.

## CH05-P08 — итог европейских stop statuses

```yaml
claim_ids: [YES2-CH05-S01]
class: editorial synthesis from P02–P07
status: SUPPORTED
```

No new stop appears without source.

## CH05-P09 — `Paris` через Атлантику

```yaml
claim_ids: [YES2-CH05-C12, YES2-CH05-C13, YES2-CH05-C14]
claims:
  - departure Le Havre 24 September
  - Plymouth call 25 September
  - New York arrival 1 October
sources:
  - ye2-imli-ss-paris-route-1922
  - ye2-feb-ny-arrival-photo-1922-10-01
status: INSTITUTIONAL/ACADEMIC FRAME PINNED / MANIFEST OPEN
```

Текст не публикует class/cabin/passenger rows. Gate корректен.

## CH05-P10 — итог опыта

```yaml
claim_ids: [YES2-CH05-S02]
class: editorial synthesis
status: LITERARY/THEOLOGICAL-REVIEW-PENDING
```

---

# Глава 6 — `Америка: прибытие, турне и незакрытый маршрут`

## CH06-P01 — прибытие

```yaml
claim_ids: [YES2-CH06-C01, YES2-CH06-C02]
claims:
  - arrival 1 October on Paris
  - photo published in New York Tribune 2 October
sources:
  - ye2-feb-ny-arrival-photo-1922-10-01
  - ye2-imli-ss-paris-route-1922
status: ACADEMIC PHOTO/ROUTE PINNED / PRESS SCAN AND RIGHTS OPEN
```

Фото не используется как immigration record.

## CH06-P02 — detention / inquiry / admission

```yaml
claim_ids: [YES2-CH06-C03, YES2-CH06-C04]
claims:
  - NYPL catalogue identifies detention object
  - synchronous wire report says admission after two-hour inquiry
sources:
  - ye2-nypl-ellis-detention-catalog
  - ye2-oregon-wire-admission-1922-10-02
status: CATALOG + PRESS REPORT / OFFICIAL CASE FILE OPEN
```

Текст правильно атрибутирует длительность прессе.

## CH06-P03 — Cable Act and legal limit

```yaml
claim_ids: [YES2-CH06-C05, YES2-CH06-M01]
claim: Cable Act is legal-history context, not proven case ground
source: ye2-nara-cable-act-context
status: OFFICIAL CONTEXT / INDIVIDUAL CASE FILE OPEN
```

No correction needed.

## CH06-P04 — October Carnegie dates

```yaml
claim_ids: [YES2-CH06-C06]
sources:
  - ye2-carnegie-1922-10-07
  - ye2-carnegie-1922-10-11
  - ye2-carnegie-1922-10-13
  - ye2-carnegie-1922-10-14
status: INSTITUTIONAL EVENT DATES / DIRECT EVENT CARDS AND PROGRAMMES OPEN
```

Текст не переносит repertoire между датами.

## CH06-P05 — Boston

```yaml
claim_ids: [YES2-CH06-C07]
claim: performance occurred previous Saturday; working date 21 October reconstructed from 24 October review
source: ye2-harvard-crimson-boston-1922-10-24
status: SYNCHRONOUS REVIEW / DATE EXPLICITLY RECONSTRUCTED
```

Programme/local advertisement still required.

## CH06-P06 — Cleveland

```yaml
claim_ids: [YES2-CH06-C08]
claim: institutional history confirms 1922 Public Auditorium performance; exact day open
source: ye2-cwru-cleveland-performance-1922
status: UNIVERSITY INSTITUTIONAL / PRIMARY PROGRAMME OPEN
```

Audience number remains reported and non-final.

## CH06-P07 — lower-confidence cities

```yaml
claim_ids: [YES2-CH06-C09, YES2-CH06-C10]
sources:
  - ye2-feb-us-city-list
  - ye2-chicago-advertisement-discovery-1922-10-22
status: ACADEMIC ROUTE BINS + BIBLIOGRAPHIC DISCOVERY
```

No city is promoted from advertisement/list to completed stop.

## CH06-P08 — cancellations and continued work

```yaml
claim_ids: [YES2-CH06-C11]
sources:
  - ye2-nypl-irma-chronology-1922
  - ye2-carnegie-1922-11-14
  - ye2-carnegie-1922-11-15
  - ye2-carnegie-1923-01-13
  - ye2-carnegie-1923-01-15
status: FINDING AID + INSTITUTIONAL CALENDAR / CONTRACTS AND NOTICES OPEN
```

Text correctly rejects both `tour ended immediately` and `tour proceeded unchanged`.

## CH06-P09 — letter 12 November

```yaml
claim_ids: [YES2-CH06-C12]
source: ye2-feb-mariengof-1922-11-12
status: PRIMARY-LETTER-PINNED
```

Chicago mention is not converted into exact city date.

## CH06-P10 — Yarmolinsky project / Mani-Leib reading

```yaml
claim_ids: [YES2-CH06-C13, YES2-CH06-C14]
sources:
  - yes2-work-yarmolinsky-project
  - yes2-work-strana-new-york-reading
status: DOCUMENTED PROJECT + ACADEMICALLY MAPPED MULTIPLE MEMOIRS
```

Canonical IDs are in place; temporary aliases removed.

## CH06-P11 — departure 3 February / letter 7 February

```yaml
claim_ids: [YES2-CH06-C15, YES2-CH06-C16]
sources:
  - ye2-feb-george-washington-departure-comment
  - ye2-rvb-left-new-york-1923-02-03
  - ye2-feb-kusikov-1923-02-07
status: ACADEMIC COMMENT + PRIMARY AUTOGRAPH LETTER / MANIFEST OPEN
```

Text does not call voyage deportation.

## CH06-P12 — conflicting 4 February endpoint

```yaml
claim_ids: [YES2-CH06-C17]
source: ye2-feb-us-period-end-1923-02-04
status: CONFLICTING ACADEMIC ENDPOINT / TRANSPORT EXPLANATION OPEN
```

No invented territorial-water explanation appears.

## CH06-P13 — synthesis

```yaml
claim_ids: [YES2-CH06-S01]
class: editorial synthesis
status: SUPPORTED / ROUTE STILL PARTIAL
```

---

## 2. Findings

```yaml
paragraphs_audited:
  chapter_5: 10
  chapter_6: 13
immediate_text_regressions: 0
canonical_alias_regressions: 0
primary_binary_gaps:
  - Paris passenger manifest
  - immigration case file
  - primary arrival/departure press
  - Carnegie programmes
  - Boston/Cleveland/other-city programmes
  - Lido/arrival visual rights
  - George Washington manifest
ready_for_v02:
  chapter_5: partially
  chapter_6: no_full_v02_until_city_and_immigration_gates
ready_for_publication: false
```

## 3. Next actions

1. Acquire primary transport and immigration binaries.
2. Resolve direct Carnegie event URIs/programmes.
3. Complete Boston/Cleveland/Chicago and lower-confidence city rows.
4. Split Paris translation/edition evidence into physical object cards.
5. Perform literary compression review after source acquisition; no prose inflation before then.
