# Сергей Есенин. Часть II — paragraph/source audit, главы 1–2, pass 01

**Дата:** 3 августа 2026 года  
**Статус:** `PARAGRAPH CLAIM MAP / SOURCE GAPS VISIBLE / НЕ ПУБЛИКОВАТЬ`  
**Текущие черновики:**

- `YESENIN_PART_II_DRAFT_CH01_1921_V01_2026-08.md`;
- `YESENIN_PART_II_DRAFT_CH02_DUNCAN_MEETING_V01_2026-08.md`.

## 1. Метод

Каждый абзац получает:

- paragraph ID;
- один или несколько claim IDs;
- текущие source IDs;
- evidence class;
- verdict `SUPPORTED / QUALIFIED / SOURCE-GAP / EDITORIAL-SYNTHESIS`;
- действие перед V02.

Внутренний research file не становится reader source. Если абзац содержит два разных фактических блока, одна общая citation‑метка не считается достаточной.

---

# Глава 1 — `1921: слава, групповая машина и внутренняя трещина`

## CH01-P01 — публичная инфраструктура и `Всеобщая мобилизация`

```yaml
claim_ids: [YES2-CH01-C01, YES2-CH01-C02]
claims:
  - к 1921 году Есенин имел развитую публичную/издательскую среду
  - листовка 12 июня использовала мобилизационную риторику Ордена имажинистов
sources: [yes2-1921-mobilization-leaflet]
evidence: primary printed ephemera + academic publication
status: SUPPORTED / VISUAL-RIGHTS-PENDING
```

Перед V02:

- восстановить exact Drive/artifact ID, SHA and rights row;
- не использовать листовку как изображение декларации 1919 года;
- первая общая фраза об издательствах/кафе требует либо compact synthesis citation set, либо переноса части доказательств в следующий абзац.

## CH01-P02 — книги и нереализованный проект

```yaml
claim_ids: [YES2-CH01-C03, YES2-CH01-C04, YES2-CH01-C05]
claims:
  - Трерядница вышла в начале февраля 1921
  - Ржаные кони рекламировались как будущий двухтомный проект и не вышли
  - Звёздный бык находился в обращении до 26 февраля
sources:
  - yes2-1921-treryadnitsa
  - yes2-1921-zvezdny-byk
evidence: academic author-book register + textological chronology
status: SUPPORTED / PHYSICAL-BOOK-RIGHTS-PENDING
```

Перед V02:

- закрепить физические экземпляры или академические bibliographic rows;
- не объединять advertised project, contract and physical book.

## CH01-P03 — автобиография Розанова

```yaml
claim_ids: [YES2-CH01-C06]
claim: 26 February Rozanov recorded Yesenin's oral autobiography
source: yes2-1921-rozanov-autobiography
evidence: named contemporary record in academic edition
status: SUPPORTED / TRANSMISSION-QUALIFIED
```

Перед V02:

- определить безопасный объём прямой цитаты;
- сохранить формулу, что это self-presentation through recorder, not neutral certificate.

## CH01-P04 — ходатайство о заграничной поездке

```yaml
claim_ids: [YES2-CH01-C07]
claims:
  - Lunacharsky signed a travel petition on 2 April
  - journey did not occur
source: yes2-1921-foreign-travel-petition
evidence: primary document in academic corpus
status: SOURCE-PAGE-PENDING
```

Перед V02:

- изолировать exact document child page / printed page;
- получить representation type and archive provenance;
- не использовать общий `e72-266` comments root как финальный reader citation.

## CH01-P05 — Туркестан и работа над `Пугачёвым`

```yaml
claim_ids: [YES2-CH01-C08, YES2-CH01-C09, YES2-CH01-C10]
claims:
  - route through Samara/Orenburg to Turkestan
  - Tashkent presence on 5 May
  - work/readings of unfinished Pugachev around the journey
sources:
  - yes2-1921-turkestan-letters
  - yes2-1921-pugachev-comments
evidence: dated inscriptions/letters + academic textual comments
status: PARTLY PINNED / ROUTE-PAGES-PENDING
```

Перед V02:

- разделить route evidence, 5 May inscription and Volpin reading into distinct source rows;
- не превращать поездку в complete daily itinerary.

## CH01-P06 — чтения, завершение и физический выход книги

```yaml
claim_ids: [YES2-CH01-C11, YES2-CH01-C12, YES2-CH01-C13]
claims:
  - June reading before Meyerhold theatre troupe
  - major 6 August reading at Literary Mansion
  - Moscow Pugachev physically appeared in December 1921 with 1922 imprint
sources:
  - yes2-1921-pugachev-comments
  - yes2-1921-pugachev-book
evidence: academic comments + physical-book chronology
status: SUPPORTED / 6-AUGUST-PROGRAMME-PENDING
```

Перед V02:

- получить exact 6 August programme/report;
- physical cover/title-page rights remain separate.

## CH01-P07 — Блок и сентябрьская программная активность

```yaml
claim_ids: [YES2-CH01-C14, YES2-CH01-C15]
claims:
  - 28 August Imagist memorial became provocative action; memoir reports Yesenin's hostile reaction to anti-Blok speeches
  - in September Yesenin signed new programmatic texts and participated in polemics
current_sources: [yes2-1921-blok-memorial]
evidence:
  first_claim: memoir attributed through academic comment
  second_claim: NOT COVERED BY CURRENT SOURCE TAG
status: SOURCE-GAP
```

### Required action

Reserve and pin a separate source object:

```yaml
provisional_id: yes2-1921-september-programmatic-documents
class: primary printed/programmatic texts + academic chronology
status: NEW_OBJECT / EXACT-PAGES-PENDING
```

До этого:

- не переносить абзац в public data;
- не делать вид, что memoir source о Блоке подтверждает сентябрьские подписи;
- V02 может разделить абзац на два.

## CH01-P08 — встреча с Дункан

```yaml
claim_ids: [YES2-CH01-C16, YES2-CH01-C17]
claims:
  - meeting occurred in autumn 1921, probably 3 October, at Yakulov studio
  - Duncan met an already famous and institutionally embedded poet
source: yes2-1921-duncan-meeting
evidence: independent article source bundle + academic chronology + named memoirs
status: QUALIFIED / REUSE-IDS-PENDING
```

Перед V02:

- заменить internal article placeholder на exact source IDs самостоятельной статьи;
- не удалять `вероятнее всего`;
- no reconstructed first dialogue.

## CH01-P09 — развод с Райх

```yaml
claim_ids: [YES2-CH01-C18]
claims:
  - divorce decision dated 5 October
  - children remained with mother
  - text survives through copy-of-copy transmission
source: yes2-1921-divorce-copy
evidence: legal document with indirect transmission
status: SOURCE-PAGE-AND-PROVENANCE-PENDING
```

Перед V02:

- exact legal page;
- confirm wording about children against document;
- preserve representation disclosure.

## CH01-P10 — афиша 17 октября и отсутствие

```yaml
claim_ids: [YES2-CH01-C19]
claim: poster advertised Yesenin while diary evidence placed him reading elsewhere
source: yes2-1921-oct17-poster-correction
evidence: primary poster + contemporaneous diary
status: SOURCE-PAIR-PENDING
```

Перед V02:

- two separate source objects;
- poster proves advertisement; diary supports non-attendance;
- do not expose as one blended card.

## CH01-P11 — итог года

```yaml
claim_ids: [YES2-CH01-S01]
class: editorial synthesis based on P01–P10
status: EDITORIAL-SYNTHESIS
```

Перед V02:

- не добавлять новые факты без citations;
- сократить повтор методов, если они уже объяснены в lead всей статьи.

---

# Глава 2 — `Айседора Дункан: встреча после снятия легенды`

## CH02-P01 — две уже сложившиеся публичные фигуры

```yaml
claim_ids: [YES2-CH02-C01, YES2-CH02-C02]
claims:
  - by autumn 1921 Yesenin already had books, audience and public network
  - Duncan arrived as internationally established artist with Moscow project
current_basis: chapter 1 + independent Duncan article
status: SUPPORTED / EXACT-REUSE-IDS-PENDING
```

Перед V02:

- source Duncan’s independent Moscow school/project separately from Yesenin’s publicity infrastructure.

## CH02-P02 — probable meeting date and witness limits

```yaml
claim_ids: [YES2-CH02-C03, YES2-CH02-C04]
claims:
  - meeting probably 3 October at Yakulov studio
  - memoirs disagree and are not stenographic
source: independent Duncan article source bundle
status: QUALIFIED / REQUIRED
```

Regression protection:

- conclusion must say `осенью 1921 года, вероятнее всего в начале октября`;
- exact `3 October` may appear only with qualification/source attribution.

## CH02-P03 — language barrier

```yaml
claim_ids: [YES2-CH02-C05]
claims:
  - neither partner shared fluent command of the other's language
  - communication included interpreters, gestures and isolated words
source: independent Duncan article source bundle
status: SOURCE-REUSE-PENDING
```

Перед V02:

- distinguish direct evidence from later romantic interpretation;
- no `mystical language of souls` as fact.

## CH02-P04 — private relation and public construction

```yaml
claim_ids: [YES2-CH02-C06]
claim: relationship quickly became press/photograph/rumour material
sources: synchronous press and Duncan project sources from independent article
status: SOURCE-REUSE-PENDING
```

Перед V02:

- at least one exact synchronous press object;
- no generic statement supported only by a later biography.

## CH02-P05 — practical benefit and multiple motives

```yaml
claim_ids: [YES2-CH02-I01]
class: qualified historical inference
status: EDITORIAL-INFERENCE / MULTIPLE-EVIDENCE-REQUIRED
```

Допустимо:

- marriage had practical travel consequences;
- publicity mattered;
- attraction and artistic ambition may coexist.

Запрещено:

- one secret motive for both participants;
- fictitious marriage as established fact.

## CH02-P06 — moral agency

```yaml
claim_ids: [YES2-CH02-M01]
class: moral/editorial synthesis
status: THEOLOGICAL-REVIEW-PENDING
```

Требование:

- neither destroyer nor passive victim;
- moral responsibility follows facts and does not invent motives.

## CH02-P07 — bridge to marriage/passport/departure

```yaml
claim_ids: [YES2-CH02-C07, YES2-CH02-C08, YES2-CH02-C09, YES2-CH02-C10]
claims:
  - qualified meeting date
  - marriage registered 2 May 1922
  - passport issued 8 May
  - departure began 10 May
current_sources: independent meeting bundle only
status: SOURCE-GAP FOR 2/8/10 MAY
```

### Required action

Use canonical legal/route objects from chapter 3 source layer; do not cite the meeting investigation for later legal events.

Reserve/confirm:

```yaml
- yes2-marriage-registration-1922-05-02
- yes2-foreign-passport-5072-1922-05-08
- yes2-departure-moscow-konigsberg-1922-05-10
```

Each row needs exact document/Chronicle page and representation class before V02.

---

## 3. Findings

```yaml
paragraphs_audited:
  chapter_1: 11
  chapter_2: 7
fully_supported_or_qualified: 14
source_gaps: 3
source_gaps_detail:
  - chapter 1 September programmatic documents
  - chapter 1 poster/diary pair still blended in one working ID
  - chapter 2 legal bridge 2/8/10 May lacks its own source IDs in paragraph
uncertainty_regression_fixed_before_this_pass: true
ready_for_v02: false
```

## 4. Next actions

1. Pin exact September 1921 programmatic documents.
2. Split 17 October poster and diary into two objects.
3. Pin marriage/passport/departure source rows.
4. Replace independent-article placeholders with exact reused IDs.
5. Apply V02 only after these source gaps close.
