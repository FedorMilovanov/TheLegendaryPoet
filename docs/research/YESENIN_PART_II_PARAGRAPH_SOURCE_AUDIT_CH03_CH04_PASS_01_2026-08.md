# Сергей Есенин. Часть II — paragraph/source audit, главы 3–4, pass 01

**Дата:** 3 августа 2026 года  
**Статус:** `PARAGRAPH CLAIM MAP / PRESS AND EVENT GAPS VISIBLE / НЕ ПУБЛИКОВАТЬ`  
**Черновики:**

- `YESENIN_PART_II_DRAFT_CH03_MARRIAGE_PASSPORT_PUBLIC_COUPLE_V01_2026-08.md`;
- `YESENIN_PART_II_DRAFT_CH04_BERLIN_V01_2026-08.md`.

## 1. Метод

Для каждого абзаца определены:

- claim IDs;
- source IDs;
- evidence class;
- current status;
- действие перед V02.

Рабочий ID, который описывает событие, не становится reader source object без bibliographic identity, exact page/item и representation type.

---

# Глава 3 — `Брак, паспорт и публичная пара`

## CH03-P01 — последовательность 2 / 8 / 10 мая

```yaml
claim_ids: [YES2-CH03-C01, YES2-CH03-C02, YES2-CH03-C03]
claims:
  - marriage date 2 May 1922
  - passport no. 5072 received 8 May
  - departure by air on morning 10 May
current_sources:
  - yes2-1922-marriage-registration
  - yes2-1922-passport-5072
  - yes2-1922-may10-departure
status: PROVISIONAL-IDS / CANONICAL-ROWS-NOW-AVAILABLE
```

### Required migration

Use:

- `yes2-marriage-date-1922-05-02`;
- `yes2-foreign-passport-5072-1922-05-08`;
- `yes2-departure-moscow-germany-1922-05-10`.

Text correction before registry binary:

- prefer `2 мая состоялся брак` over `был зарегистрирован брак` unless the legal registry source is separately cited;
- keep registration object as open acquisition gate.

## CH03-P02 — practical function and multiple motives

```yaml
claim_ids: [YES2-CH03-I01]
class: qualified historical inference
status: EDITORIAL-INFERENCE / MULTIPLE-EVIDENCE-REQUIRED
```

Supported components:

- legal marriage and shared travel;
- passport/mandate sequence;
- joint public presentation.

Forbidden conclusion:

- marriage only for passport;
- one proven motive for both people.

## CH03-P03 — prior divorce and children

```yaml
claim_ids: [YES2-CH03-C04]
source: yes2-1921-divorce-copy
evidence: legal text surviving as copy of copy
status: PAGE-PENDING
```

Before V02:

- exact page and wording about children;
- archive/transmission row;
- avoid attributing all prior family rupture to Duncan.

## CH03-P04 — travel as public infrastructure

```yaml
claim_ids: [YES2-CH03-C05, YES2-CH03-C06]
claims:
  - Duncan had school/international touring network
  - Yesenin carried independent literary reputation and publishing plans
current_sources: none in paragraph
status: SOURCE-GAP
```

Required source split:

- Duncan school/touring institutional source;
- Yesenin Berlin publishing/foreign-work sources.

This paragraph is synthesis, but both factual premises need citations.

## CH03-P05 — press construction of the pair

```yaml
claim_ids: [YES2-CH03-C07]
claim: press framed Duncan/Yesenin through fame, age, nationality and political stereotype
current_sources: none in paragraph
status: SYNCHRONOUS-PRESS-CORPUS-PENDING
```

Before V02:

- at least two exact press objects from different contexts/languages;
- quote only after issue/page pinning;
- press label supports reception history, not legal fact.

## CH03-P06 — false divorce rumour

```yaml
claim_ids: [YES2-CH03-C08, YES2-CH03-C09]
claims:
  - summer 1922 press reported breakup/divorce
  - later joint route disproves actual legal dissolution
current_sources:
  - yes2-1922-false-divorce-rumour
  - yes2-1922-public-couple-press
status: BIBLIOGRAPHIC-TARGET-PENDING
```

Current text correctly omits headline/quotation.

Before V02:

- exact newspaper title/date/page;
- scan or institutional facsimile;
- later joint-route source set;
- distinguish rumour, separation report and legal divorce.

## CH03-P07 — publicity as double mechanism

```yaml
claim_ids: [YES2-CH03-S01]
class: editorial synthesis from press/route evidence
status: EDITORIAL-SYNTHESIS
```

No new factual detail should enter without exact press source.

## CH03-P08 — transition to Berlin

```yaml
claim_ids: [YES2-CH03-C10]
claims:
  - Berlin offers autobiography, agreement, readings and conflict
sources: chapter 4 source bundle
status: CROSS-CHAPTER-SYNTHESIS
```

Before V02:

- no need to duplicate all citations if transition remains non-specific;
- link source packet/chapter internally in future data.

---

# Глава 4 — `Берлин: книги, деньги, чтения и публичный конфликт`

## CH04-P01 — arrival and `Накануне`

```yaml
claim_ids: [YES2-CH04-C01, YES2-CH04-C02]
claims:
  - arrival Berlin 11 May
  - visit to editorial office of Накануне on first day
source: yes2-1922-berlin-arrival
status: EXACT-CHRONICLE/PRESS-PAGE-PENDING
```

Before V02:

- exact Chronicle page;
- contemporary editorial/press witness;
- separate arrival from later memoir detail.

## CH04-P02 — House of Arts, night 12–13 May

```yaml
claim_ids: [YES2-CH04-C03, YES2-CH04-C04]
claims:
  - public episode involved Internationale and political reaction
  - press reports were politically divergent
source: yes2-1922-house-of-arts
status: PRIMARY-PRESS-MATRIX-PENDING
```

Before V02:

- exact issue/date/page for each report;
- comparison table;
- no composite transcript;
- no quotation until scans are acquired.

## CH04-P03 — Berlin autobiography, 14 May

```yaml
claim_ids: [YES2-CH04-C05, YES2-CH04-C06]
claims:
  - autobiography dated 14 May Berlin
  - Страна Негодяев already named as current work
source: yes2-work-berlin-autobiography
evidence: exact academic child page e77-008
status: TEXT-PINNED
```

Before V02:

- quotation-length review;
- distinguish authored self-presentation from route register.

## CH04-P04 — limits of autobiography

```yaml
claim_ids: [YES2-CH04-M01]
class: source-method synthesis
status: SUPPORTED-METHOD
```

No additional citation required if paragraph remains methodological and follows P03.

## CH04-P05 — Grzhebin agreement, 18 May

```yaml
claim_ids: [YES2-CH04-C07]
source: yes2-work-grzhebin-contract
evidence: primary agreement/receipt in academic corpus
status: TEXT-PINNED / PHYSICAL-OBJECT-PENDING
```

Before V02:

- exact child page and document representation;
- legal terms summarised without overclaiming unfulfilled volumes.

## CH04-P06 — realised first volume

```yaml
claim_ids: [YES2-CH04-C08, YES2-CH04-C09, YES2-CH04-C10]
claims:
  - first volume physically appeared in Berlin in autumn 1922
  - contents largely written earlier
  - final proof likely not seen by Yesenin
source: yes2-work-grzhebin-volume
status: ACADEMICALLY-PINNED / PHYSICAL-BINARY-PENDING
```

Before V02:

- physical title page and bibliographic record;
- exact wording/strength of proof-reading inference.

## CH04-P07 — Blüthner Hall, 1 June

```yaml
claim_ids: [YES2-CH04-C11]
claim: major public reading held 1 June in Blüthner Hall
source: yes2-1922-bluthner-june1
status: EVENT-PROGRAMME/REPORT-PENDING
```

Before V02:

- programme or advertisement;
- completion report;
- exact works read only from source;
- venue spelling normalised.

## CH04-P08 — translation plans

```yaml
claim_ids: [YES2-CH04-C12]
source: yes2-work-translation-ledger
class: mixed letters/contracts/publication matrix
status: SOURCE-BUNDLE-NEEDS-SPLIT
```

Before V02:

Separate:

- announced translation;
- translator work;
- publisher negotiation;
- physical French edition;
- unrealised English project.

## CH04-P09 — Berlin synthesis

```yaml
claim_ids: [YES2-CH04-S01]
class: editorial synthesis
status: SUPPORTED BY P01–P08
```

Avoid new unsourced restaurant anecdotes or psychological motives.

## CH04-P10 — departure before 21 June / no return in 1922

```yaml
claim_ids: [YES2-CH04-C13, YES2-CH04-C14]
claims:
  - by 21 June Yesenin was in Wiesbaden
  - academic comments say he did not return to Berlin in 1922
source: yes2-1922-leave-berlin
status: FIRST CLAIM PINNABLE BY LETTER / SECOND EXACT COMMENT PAGE PENDING
```

Before V02:

- use the exact 21 June letter child page;
- isolate the no-return comment;
- do not overrule a future transport witness.

## CH04-P11 — transition to Europe

```yaml
claim_ids: [YES2-CH04-C15]
claims:
  - letters pin Wiesbaden, Düsseldorf, Ostend, Brussels, Paris and Venice/Lido at different levels
  - Hague/Rome/London remain plans where completion evidence is absent
source: YESENIN_EUROPE_ROUTE_SOURCE_PASS_02_2026-08.md as planning authority; reader sources must be individual letters
status: SOURCE-MAPPED / READER-OBJECTS-AVAILABLE
```

Before V02:

- replace old broad phrasing that omitted confirmed Brussels;
- use exact individual source IDs, not internal pass as reader citation.

---

## 2. Findings

```yaml
paragraphs_audited:
  chapter_3: 8
  chapter_4: 11
canonical_id_migrations_needed: 3
source_gaps:
  - chapter 3 Duncan/Yesenin public infrastructure premises
  - chapter 3 exact press construction objects
  - chapter 3 false-divorce newspaper page
  - chapter 4 arrival/Nakanune exact page
  - chapter 4 House of Arts press matrix
  - chapter 4 Bluthner programme/report
  - chapter 4 translation bundle split
  - chapter 4 no-return exact comment
ready_for_v02: false
```

## 3. Immediate safe corrections

1. Chapter 3: migrate 2/8/10 May IDs and soften `registered marriage` until registry source is attached.
2. Chapter 4: update transition to include confirmed Brussels and keep Hague/Rome/London as plans.
3. Do not insert false-divorce or House of Arts quotations before exact issue/page scans.
4. Create focused Berlin/press source pass before V02.
