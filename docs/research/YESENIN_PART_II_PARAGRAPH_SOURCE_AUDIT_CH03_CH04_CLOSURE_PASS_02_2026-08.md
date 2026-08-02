# Сергей Есенин. Часть II — paragraph/source audit, главы 3–4, closure pass 02

**Дата:** 3 августа 2026 года  
**Статус:** `TEXT/ACADEMIC SOURCE GAPS PARTLY CLOSED / PRIMARY SCANS AND RIGHTS OPEN / НЕ ПУБЛИКОВАТЬ`  
**Исходный аудит:** `YESENIN_PART_II_PARAGRAPH_SOURCE_AUDIT_CH03_CH04_PASS_01_2026-08.md`  
**Focused source pass:** `YESENIN_PART_II_SOURCE_PASS_CH03_CH04_GAPS_2026-08.md`

## 1. Chapter 3 closures

### 2 / 8 / 10 May migration

Retired provisional IDs:

- `yes2-1922-marriage-registration`;
- `yes2-1922-passport-5072`;
- `yes2-1922-may10-departure`.

Current IDs:

- `yes2-marriage-date-1922-05-02`;
- `yes2-foreign-passport-5072-1922-05-08`;
- `yes2-departure-moscow-germany-1922-05-10`.

Text now says `2 мая состоялся брак`, while the registry binary remains an explicit gate.

### Public-couple photograph

Pinned:

- `yes2-public-couple-photo-nyt-1922-08-13`.

Boundary:

- the newspaper photograph proves public representation of the pair;
- it does not inherit a later Russian caption or establish a divorce.

### False-divorce reception object

Pinned:

- `yes2-false-divorce-caption-world-illustration-1923-no11`.

Correction:

- removed vague claim that summer 1922 press already reported an established breakup;
- current prose identifies `Всемирная иллюстрация`, 1923, № 11, p. 26, as the exact known Russian carrier of the rumour;
- it explicitly says the upstream German page remains missing;
- rumour and legal divorce remain separate.

```yaml
chapter_3_legal_sequence: CLOSED_AT_ACADEMIC_EVENT_LEVEL
chapter_3_public_photo_object: PINNED / RIGHTS_OPEN
chapter_3_exact_rumour_object: PINNED / SCAN_OPEN
chapter_3_upstream_german_press: OPEN
chapter_3_public_infrastructure_paragraph: SOURCE_GAP_REMAINS
```

## 2. Chapter 4 closures

### Arrival / `Накануне`

Current ID:

- `yes2-berlin-arrival-nakanune-1922-05-11`.

Prose now distinguishes:

- academic chronology and bibliographic references;
- still-missing primary newspaper pages.

### House of Arts

Retired blended ID:

- `yes2-1922-house-of-arts`.

Current separate rows:

- `yes2-berlin-house-of-arts-nakanune-1922-05-14`;
- `yes2-berlin-house-of-arts-rul-1922`.

The chapter no longer treats the two political receptions as one report or stenogram.

### Blüthner Hall

Retired provisional ID:

- `yes2-1922-bluthner-june1`.

Current ID:

- `yes2-berlin-bluthner-1922-06-01`.

Pinned at academic/bibliographic level:

- event date;
- venue;
- title `Нам хочется Вам нежно сказать`;
- programme target `Накануне`, 25 May 1922, no. 49;
- reading of material from `Страна Негодяев`.

Primary programme/report scans remain open.

### Grzhebin document

Canonical reader object remains:

- `yes2-work-grzhebin-contract`.

Focused research row records:

- copy by E. N. Chebotarevskaya;
- GLM fund/case/leaf;
- original-location uncertainty.

No duplicate reader source card is created.

### Departure / no return

Retired provisional ID:

- `yes2-1922-leave-berlin`.

Current rows:

- `yes2-berlin-departure-before-1922-06-21`;
- `ye2-feb-schneider-1922-06-21`.

Chapter transition now includes confirmed Brussels and two Paris periods, while Hague/Rome/London remain plans.

```yaml
chapter_4_arrival: CLOSED_AT_ACADEMIC_REFERENCE_LEVEL
chapter_4_house_of_arts: SPLIT / PRIMARY_SCANS_OPEN
chapter_4_bluthner: CLOSED_AT_EVENT_LEVEL / PROGRAMME_SCAN_OPEN
chapter_4_grzhebin_provenance: CLOSED
chapter_4_departure_no_return: CLOSED_AT_ACADEMIC_LEVEL
chapter_4_translation_bundle: SPLIT_REQUIRED
```

## 3. Validator protections

`scripts/validate-yesenin-part-two-research.ts` now fails if:

- chapter 3 restores provisional 2/8/10 May IDs;
- chapter 3 restores vague summer-1922 divorce wording;
- exact public photo/rumour IDs disappear;
- chapter 4 restores blended/provisional Berlin IDs;
- chapter 4 loses confirmed Brussels or turns Hague/Rome/London into completed stops;
- House of Arts political sources collapse into one object.

## 4. Remaining V02 gates

### Chapter 3

- Duncan school/touring and Yesenin public-infrastructure sources for paragraph 4;
- wider international press comparison;
- upstream German divorce-rumour source;
- registry/passport/transport binaries;
- photo rights.

### Chapter 4

- primary arrival pages;
- `Накануне` 14 May and `Руль` exact scans;
- `Накануне` no. 49 programme and event report;
- physical Berlin volume;
- translation source-bundle split;
- visual rights.

## 5. Verdict

```yaml
initial_immediate_safe_corrections: 2
completed: 2
retired_provisional_ids: 7
new_distinct_evidence_rows: 8
primary_scans_closed: false
translation_bundle_closed: false
ready_for_v02: partially
ready_for_publication: false
```
