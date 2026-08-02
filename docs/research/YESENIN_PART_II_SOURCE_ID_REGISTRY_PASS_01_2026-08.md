# Сергей Есенин. Часть II — stable source ID registry, pass 01

**Date:** 2 August 2026  
**Status:** `STABLE IDS RESERVED / EXACT PAGE PINNING PARTIAL`  
**Scope:** first authoring packets for chapters 1, 7, 8, 9 and 13  
**Public route:** do not create

## 1. Purpose

The article must not invent a new source name every time the same academic page supports another paragraph. This registry reserves stable IDs before reader prose and distinguishes:

- root academic edition;
- exact text/comment page;
- physical book/document object;
- memoir witness;
- research ledger only;
- binary or rights gate still pending.

A URL is not enough. Each article source row eventually needs:

```yaml
id:
title:
author_or_editor:
source_class:
publication_or_archive:
year:
url:
exact_page_or_item:
article_claim_ids:
reader_use:
verification_status:
rights_status_if_visual:
```

## 2. Verification statuses

- `TEXT-PINNED` — exact academic text/comment URL is known and supports the mapped claim.
- `ITEM-PINNED` — exact physical/institutional item is known; page/rights may still need work.
- `PAGE-PENDING` — root item or academic page is known but article page/line extraction is not complete.
- `BINARY-PENDING` — bibliographic item accepted but actual PDF bytes/first page/SHA not verified.
- `RIGHTS-PENDING` — historical use is supported but visual reproduction is not cleared.
- `MEMOIR-ATTRIBUTED` — usable only as a named recollection.
- `HOLD` — do not expose as a reader source until the missing evidence is acquired.

## 3. Shared academic roots

These roots may appear in bibliographic metadata but must not be treated as one undifferentiated source supporting every claim.

| ID | Title / authority | Class | URL | Status | Rule |
|---|---|---|---|---|---|
| `yes2-root-feb` | ФЭБ: Сергей Есенин, electronic academic corpus | academic portal | `https://feb-web.ru/feb/esenin/default.asp` | `ITEM-PINNED` | navigation only; cite exact child text/comment page in claims |
| `yes2-root-rvb` | РВБ: Сергей Есенин, Complete Works | academic corpus | `https://rvb.ru/20vek/esenin/` | `ITEM-PINNED` | navigation only; use exact volume/comment page |
| `yes2-root-chronicle` | Летопись жизни и творчества С. А. Есенина | academic chronology | `https://feb-web.ru/feb/esenin/chronics/` | `PAGE-PENDING` | exact volume/page required for day-level claims |
| `yes2-root-letters-index` | ФЭБ Yesenin sitemap/index | academic index | `https://feb-web.ru/feb/esenin/sitemap.htm` | `ITEM-PINNED` | locating tool, not substitute for individual letter pages |

## 4. Chapter 1 — 1921 source IDs

### `yes2-1921-treryadnitsa`

```yaml
title: Трерядница and the unrealised Ржаные кони project
author_or_editor: Сергей Есенин; academic book comments
source_class: academic author-book register
url: https://feb-web.ru/feb/esenin/texts/es7/es7-0724.htm?cmd=2
exact_page_or_item: author-books section for 1921 editions/projects
article_claim_ids: [YES2-W006]
reader_use: early-1921 publishing programme; plan versus physical book
verification_status: TEXT-PINNED
```

### `yes2-1921-zvezdny-byk`

```yaml
title: Звездный бык / Песнь о хлебе publication chronology
source_class: academic textological comments
url: https://feb-web.ru/feb/esenin/texts/es1/es1-385-.htm?cmd=p
exact_page_or_item: comment locating publication before 26 February 1921
article_claim_ids: [YES2-W006]
reader_use: terminus ante quem; autograph date is not creation date
verification_status: TEXT-PINNED
```

### `yes2-1921-rozanov-autobiography`

```yaml
title: Автобиография, записанная И. Н. Розановым 26 февраля 1921
source_class: primary oral self-description recorded by named contemporary; academic publication
url: https://feb-web.ru/feb/esenin/texts/e77/e77-3432.htm?cmd=p
exact_page_or_item: full academic text and comment
article_claim_ids: [YES2-C001]
reader_use: dated authorial self-presentation with recorder/variant warning
verification_status: TEXT-PINNED
```

### `yes2-1921-foreign-travel-petition`

```yaml
title: Lunacharsky petition concerning foreign travel, 2 April 1921
source_class: primary collective/document corpus
url: https://feb-web.ru/feb/esenin/texts/e72/e72-266-.htm?cmd=p
exact_page_or_item: exact document subsection still to isolate
article_claim_ids: [YES2-C001]
reader_use: documented but unrealised foreign-travel plan
verification_status: PAGE-PENDING
```

### `yes2-1921-turkestan-letters`

```yaml
title: 1921 letters and comments for the Turkestan journey
source_class: primary correspondence with academic dating
url: https://feb-web.ru/feb/esenin/texts/es6/es6-233-.htm?cmd=p
exact_page_or_item: April–May 1921 letter cluster
article_claim_ids: [YES2-W006]
reader_use: route/date/work context; not a complete itinerary
verification_status: PAGE-PENDING
```

### `yes2-1921-pugachev-comments`

```yaml
title: Пугачев — composition, readings and publication comments
source_class: academic textological comments
url: https://feb-web.ru/feb/esenin/texts/es3/es3-435-.htm?cmd=p
exact_page_or_item: 1921 composition/readings/publication subsection
article_claim_ids: [YES2-W006]
reader_use: travel-to-performance-to-book chronology
verification_status: TEXT-PINNED
```

### `yes2-1921-mobilization-leaflet`

```yaml
title: Всеобщая мобилизация, 12 June 1921
source_class: primary leaflet / academic document publication
url: https://feb-web.ru/feb/esenin/texts/e72/e72-566-.htm?cmd=p
exact_page_or_item: leaflet subsection; exact archive item and image rights pending
article_claim_ids: [YES2-I001]
reader_use: 1921 Imagist publicity machinery
verification_status: PAGE-PENDING
rights_status_if_visual: RIGHTS-PENDING
```

### `yes2-1921-blok-memorial`

```yaml
title: Imagist Block memorial evening and Yesenin reaction
source_class: memoir/academic comment
url: https://feb-web.ru/feb/esenin/critics/ev1/ev1-445-.htm?cmd=p
exact_page_or_item: 28 August 1921 evidence subsection
article_claim_ids: [YES2-I001]
reader_use: distinguish group act from Yesenin's reported reaction
verification_status: MEMOIR-ATTRIBUTED
```

### `yes2-1921-duncan-meeting`

```yaml
title: Yesenin–Duncan first meeting: academic date and witness matrix
source_class: project independent source-backed article plus academic comments
url: internal:yesenin-duncan-first-meeting-documents
exact_page_or_item: reuse stable source IDs from the independent article
article_claim_ids: [YES2-C002, YES2-C003]
reader_use: compact Part II bridge; probable 3 October preserved
verification_status: PAGE-PENDING
```

### `yes2-1921-divorce-copy`

```yaml
title: Divorce decision concerning Yesenin and Zinaida Reich, 5 October 1921
source_class: legal document surviving as copy of copy; academic publication
url: https://feb-web.ru/feb/esenin/texts/e72/e72-266-.htm?cmd=p
exact_page_or_item: decision subsection still to isolate
article_claim_ids: [YES2-C001]
reader_use: legal/family boundary with transmission warning
verification_status: PAGE-PENDING
```

### `yes2-1921-oct17-poster-correction`

```yaml
title: 17 October 1921 poster and diary non-attendance correction
source_class: primary poster plus contemporaneous diary evidence
url: https://feb-web.ru/feb/esenin/texts/e72/e72-566-.htm?cmd=p
exact_page_or_item: poster/comment subsection
article_claim_ids: []
reader_use: standing example that advertisement is not attendance
verification_status: PAGE-PENDING
rights_status_if_visual: RIGHTS-PENDING
```

### `yes2-1921-pugachev-book`

```yaml
title: Moscow Пугачов edition, physically released December 1921 with 1922 imprint
source_class: physical author book plus academic register
url: https://feb-web.ru/feb/esenin/texts/e72/e72-1612.htm?cmd=p
exact_page_or_item: bibliographic release note
article_claim_ids: [YES2-W006]
reader_use: imprint-year versus release-date correction
verification_status: TEXT-PINNED
rights_status_if_visual: RIGHTS-PENDING
```

## 5. Chapter 7 — foreign-work source IDs

### `yes2-work-strana-prehistory`

```yaml
title: Страна Негодяев — pre-American work history
source_class: academic textological comments and letters
url: https://feb-web.ru/feb/esenin/texts/es3/es3-435-.htm?cmd=p
exact_page_or_item: March–June 1922 work-history subsection
article_claim_ids: [YES2-W001]
reader_use: refute American-origin myth
verification_status: TEXT-PINNED
```

### `yes2-work-strana-new-york-reading`

```yaml
title: Reading of an early Страна Негодяев version, 27–28 January 1923
source_class: four memoir accounts mapped by academic comments
url: https://rvb.ru/20vek/esenin/pss7/vol3/notes/205.html
exact_page_or_item: comment on Mani-Leib apartment reading
article_claim_ids: [YES2-W001]
reader_use: New York development stage; no stenographic quotation
verification_status: MEMOIR-ATTRIBUTED
```

### `yes2-work-grzhebin-contract`

```yaml
title: Grzhebin publishing transaction, 18 May 1922
source_class: primary receipt/contract in academic document corpus
url: https://feb-web.ru/feb/esenin/texts/e72/e72-266-.htm?cmd=p
exact_page_or_item: 18 May Berlin document subsection
article_claim_ids: [YES2-W002, YES2-W003]
reader_use: real publishing transaction; planned volumes separated from results
verification_status: PAGE-PENDING
```

### `yes2-work-grzhebin-volume`

```yaml
title: Berlin Собрание стихов и поэм, volume 1
source_class: physical author book and academic comments
url: https://feb-web.ru/feb/esenin/texts/es2/es2-255-.htm?cmd=p
exact_page_or_item: publication/contents/proof history subsection
article_claim_ids: [YES2-W002]
reader_use: foreign publication largely of earlier work
verification_status: TEXT-PINNED
rights_status_if_visual: RIGHTS-PENDING
```

### `yes2-work-berlin-autobiography`

```yaml
title: Berlin autobiography, 14 May 1922
source_class: primary authorial prose
url: https://feb-web.ru/feb/esenin/sitemap.htm
exact_page_or_item: exact autobiography child page to reserve in pass 02
article_claim_ids: [YES2-W002]
reader_use: foreign-period self-description; not route register
verification_status: PAGE-PENDING
```

### `yes2-work-translation-ledger`

```yaml
title: Foreign translations and publication projects, item-level ledger
source_class: composite registry, not one source
url: internal:YESENIN_FOREIGN_WORK_MATRIX_1922_1923_2026-08.md
exact_page_or_item: each translation requires its own physical item/academic page
article_claim_ids: [YES2-W003]
reader_use: published versus commissioned versus announced versus unrealised
verification_status: HOLD
```

### `yes2-work-yarmolinsky-project`

```yaml
title: Стихи и поэмы. Нью-Йорк, 1922 mock-up given to Avrahm Yarmolinsky
source_class: author-book register / archival-project record
url: https://feb-web.ru/feb/esenin/texts/es7/es7-0724.htm?cmd=2
exact_page_or_item: New York 1922 mock-up subsection
article_claim_ids: [YES2-W004]
reader_use: serious English-publication attempt; completion unproven
verification_status: TEXT-PINNED
rights_status_if_visual: RIGHTS-PENDING
```

### `yes2-work-zhelezny-autograph`

```yaml
title: Железный Миргород autograph dated Moscow, 14 August 1923
source_class: primary autograph text
url: https://feb-web.ru/feb/esenin/texts/e75/e75-159-.htm
exact_page_or_item: full text/header
article_claim_ids: [YES2-W005]
reader_use: post-return composition date
verification_status: TEXT-PINNED
rights_status_if_visual: RIGHTS-PENDING
```

### `yes2-work-zhelezny-comments`

```yaml
title: Железный Миргород manuscript and publication comments
source_class: academic textual/publication comments
url: https://feb-web.ru/feb/esenin/texts/e75/e75-325-.htm?cmd=p
exact_page_or_item: manuscript/newspaper history subsection
article_claim_ids: [YES2-W005]
reader_use: two-stage submission and text variants
verification_status: TEXT-PINNED
```

## 6. Chapter 8 — return source IDs

### `yes2-return-aug3`

```yaml
title: Return of Yesenin and Duncan to Moscow, 3 August 1923
source_class: academic chronology / route documents
url: internal:YESENIN_EUROPE_AMERICA_ROUTE_SOURCE_MAP_1922_1923_2026-08.md
exact_page_or_item: exact Chronicle volume 3 page still to pin
article_claim_ids: [YES2-C009]
reader_use: return anchor only
verification_status: PAGE-PENDING
```

### `yes2-return-polytechnic-aug21`

```yaml
title: Polytechnic Museum appearance, 21 August 1923
source_class: original poster plus synchronous reports
url: https://feb-web.ru/feb/esenin/texts/e72/e72-566-.htm?cmd=p
exact_page_or_item: 21 August subsection
article_claim_ids: [YES2-W005]
reader_use: public re-entry; conversation/performance, not formal transcript
verification_status: PAGE-PENDING
rights_status_if_visual: RIGHTS-PENDING
```

### `yes2-return-duncan-kislovodsk`

```yaml
title: Duncan departure for Kislovodsk, 14 August 1923
source_class: academic memoir comments
url: https://feb-web.ru/feb/esenin/critics/ev2/ev2-361-.htm?cmd=p
exact_page_or_item: August 1923 route/relationship subsection
article_claim_ids: [YES2-C009]
reader_use: physical separation; not final emotional/legal break
verification_status: PAGE-PENDING
```

### `yes2-return-duncan-aug29-letter`

```yaml
title: Yesenin letter to Isadora Duncan, 29 August 1923
source_class: primary letter
url: https://feb-web.ru/feb/esenin/sitemap.htm
exact_page_or_item: exact child letter URL to pin
article_claim_ids: [YES2-C009]
reader_use: continuing correspondence after return
verification_status: PAGE-PENDING
```

### `yes2-return-miklashevskaya-comments`

```yaml
title: Augusta Miklashevskaya meeting and Любовь хулигана chronology
source_class: academic textological/memoir comments
url: https://feb-web.ru/feb/esenin/texts/es1/es1-385-.htm?cmd=p
exact_page_or_item: August–December 1923 cycle subsection
article_claim_ids: [YES2-R005]
reader_use: relationship/cycle range; printed order not calendar
verification_status: TEXT-PINNED
```

### `yes2-return-miklashevskaya-oct27`

```yaml
title: Letter to Augusta Miklashevskaya, 27 October 1923
source_class: primary letter
url: https://feb-web.ru/feb/esenin/sitemap.htm
exact_page_or_item: exact child letter URL to pin
article_claim_ids: [YES2-R005]
reader_use: direct relationship node
verification_status: PAGE-PENDING
```

### `yes2-return-benislavskaya-sep8`

```yaml
title: Note/letter to Galina Benislavskaya, 8 September 1923
source_class: primary letter/note
url: https://feb-web.ru/feb/esenin/sitemap.htm
exact_page_or_item: exact child page to pin
article_claim_ids: [YES2-R001]
reader_use: early post-return practical-contact node
verification_status: PAGE-PENDING
```

### `yes2-return-stoylo-accounts`

```yaml
title: Стойло Пегаса accounts and authorial notes, 1923
source_class: primary financial/account documents with academic comments
url: https://feb-web.ru/feb/esenin/texts/e72/e72-5092.htm?cmd=p
exact_page_or_item: full account register; item-level rows still needed
article_claim_ids: [YES2-I006]
reader_use: economic/social relation; not individual consumption proof
verification_status: TEXT-PINNED
rights_status_if_visual: RIGHTS-PENDING
```

### `yes2-return-sep-cafe-case`

```yaml
title: September 1923 Стойло Пегаса legal case
source_class: police/court document chain
url: https://feb-web.ru/feb/esenin/texts/e72/e72-266-.htm?cmd=p
exact_page_or_item: 15 September–23 November case pages to isolate
article_claim_ids: [YES2-L001]
reader_use: separate case chronology
verification_status: PAGE-PENDING
```

### `yes2-return-four-poets-case`

```yaml
title: November 1923 four-poets case
source_class: arrest statement, GPU questionnaire and release documents
url: https://feb-web.ru/feb/esenin/texts/e72/e72-266-.htm?cmd=p
exact_page_or_item: 20–22 November case pages to isolate
article_claim_ids: [YES2-L001]
reader_use: distinct political/public case
verification_status: PAGE-PENDING
```

## 7. Chapter 9 — Москва кабацкая source IDs

### `yes2-kabatskaya-project-history`

```yaml
title: Москва кабацкая unrealised projects and final book history
source_class: academic author-book register and text comments
url: https://feb-web.ru/feb/esenin/texts/es7/es7-0724.htm?cmd=2
exact_page_or_item: Paris/GUM/author-edition/Leningrad project subsections
article_claim_ids: [YES2-I005]
reader_use: title/project history before physical book
verification_status: TEXT-PINNED
```

### `yes2-kabatskaya-physical-book`

```yaml
title: Москва кабацкая, Leningrad 1924 physical edition
source_class: physical author book plus academic comments
url: https://feb-web.ru/feb/esenin/texts/es1/es1-385-.htm?cmd=p
exact_page_or_item: release/content/censorship subsection; PDF binary still required
article_claim_ids: [YES2-W007, YES2-W008]
reader_use: July 1924 physical release; body versus contents
verification_status: BINARY-PENDING
rights_status_if_visual: RIGHTS-PENDING
```

### `yes2-kabatskaya-accounts`

```yaml
title: Стойло Пегаса accounts
source_class: primary account corpus
url: https://feb-web.ru/feb/esenin/texts/e72/e72-5092.htm?cmd=p
exact_page_or_item: same root as yes2-return-stoylo-accounts; do not duplicate bibliographic source in article
article_claim_ids: [YES2-I006]
reader_use: chapter 9 account analysis
verification_status: TEXT-PINNED
```

### `yes2-kabatskaya-sep15-case`

```yaml
title: 15 September 1923 cafe incident legal chain
source_class: primary police/court file
url: https://feb-web.ru/feb/esenin/texts/e72/e72-266-.htm?cmd=p
exact_page_or_item: exact pages pending
article_claim_ids: [YES2-L001]
reader_use: one compact document-chain example
verification_status: PAGE-PENDING
```

### `yes2-kabatskaya-existing-essay`

```yaml
title: Есенин: маска «Москвы кабацкой» и цена саморазрушения
source_class: internal independent article
url: internal:yesenin-kutezhi
exact_page_or_item: current public essay route/data object
article_claim_ids: [YES2-I005, YES2-I006, YES2-M005]
reader_use: anti-duplication link and deeper investigation
verification_status: ITEM-PINNED
```

## 8. Chapter 13 — late-poetry source IDs

### `yes2-poetry-rus-sovetskaya`

```yaml
title: Русь советская — text, dating and publication comments
source_class: academic text and textological comments
url: https://feb-web.ru/feb/esenin/texts/es1/es1-385-.htm?cmd=p
exact_page_or_item: 1924 publication/dating subsection
article_claim_ids: [YES2-M001, YES2-M002]
reader_use: historical self-location; not final political creed
verification_status: TEXT-PINNED
rights_status_if_visual: RIGHTS-PENDING
```

### `yes2-poetry-letter-to-woman`

```yaml
title: Письмо к женщине — text and comments
source_class: academic textological source
url: https://feb-web.ru/feb/esenin/sitemap.htm
exact_page_or_item: exact text/comment child pages to pin
article_claim_ids: [YES2-M001]
reader_use: retrospective address; confession versus repair
verification_status: PAGE-PENDING
```

### `yes2-poetry-persian-chronology`

```yaml
title: Персидские мотивы — composition and publication chronology
source_class: academic textological comments
url: https://feb-web.ru/feb/esenin/texts/es1/es1-385-.htm?cmd=p
exact_page_or_item: October 1924–August 1925 cycle subsection
article_claim_ids: [YES2-W010, YES2-W011]
reader_use: early poems, May book and August completion
verification_status: TEXT-PINNED
```

### `yes2-poetry-persian-book`

```yaml
title: Персидские мотивы, late-May 1925 author book
source_class: physical author book
url: internal:PDF_ACQUISITION_QUEUE_OR_ITEM_PENDING
exact_page_or_item: exact institutional item/PDF not yet pinned
article_claim_ids: [YES2-W010]
reader_use: distinguish physical book from final full cycle
verification_status: BINARY-PENDING
rights_status_if_visual: RIGHTS-PENDING
```

### `yes2-poetry-anna-snegina`

```yaml
title: Анна Снегина — text, Batum completion and publication history
source_class: academic text and comments
url: https://feb-web.ru/feb/esenin/texts/es3/es3-158-.htm?cmd=2
exact_page_or_item: text; comments at https://feb-web.ru/feb/esenin/texts/es3/es3-435-.htm?cmd=p
article_claim_ids: [YES2-W009]
reader_use: narrative transformation and unrealised standalone book
verification_status: TEXT-PINNED
rights_status_if_visual: RIGHTS-PENDING
```

### `yes2-poetry-black-man`

```yaml
title: Черный человек — final text and multi-year work history
source_class: academic text and comments
url: https://feb-web.ru/feb/esenin/texts/es3/es3-188-.htm?cmd=p
exact_page_or_item: final text; work-history comments at https://feb-web.ru/feb/esenin/texts/es3/es3-435-.htm?cmd=p
article_claim_ids: [YES2-W013, YES2-M001, YES2-M002]
reader_use: long composition history; final form 14 November before clinic
verification_status: TEXT-PINNED
rights_status_if_visual: RIGHTS-PENDING
```

### `yes2-poetry-maple-clinic`

```yaml
title: Клен ты мой опавший... — clinic-period dating/comments
source_class: academic textological comments and Sofia Tolstaya record
url: https://feb-web.ru/feb/esenin/texts/e74/e74-323-.htm?cmd=p
exact_page_or_item: late-November/December 1925 subsection
article_claim_ids: [YES2-M001]
reader_use: late winter imagery; not prophecy or diagnosis
verification_status: PAGE-PENDING
```

## 9. Duplicate prevention rules

1. `yes2-return-stoylo-accounts` and `yes2-kabatskaya-accounts` point to one bibliographic source; article data should contain one source object reused by multiple blocks.
2. PSS volume comment pages may support several claims; do not create one source card per paragraph.
3. Internal research ledgers are planning authorities, not reader-facing historical sources.
4. The FEB sitemap is navigation only; replace it with child pages before final article data.
5. A physical book and academic comments are separate sources when the article discusses both artefact and textual history.
6. A visual-rights row is metadata, not an independent historical witness unless it contains historical evidence.
7. A memoir collection is not “independent confirmation” of itself when several later retellings derive from one witness.

## 10. Pass 02 priority

1. Pin exact child URLs for the Berlin autobiography, Duncan letters, Miklashevskaya, Benislavskaya and `Письмо к женщине`.
2. Isolate exact subsections/pages inside the large collective-document comments.
3. Acquire/pin the physical `Москва кабацкая` and `Персидские мотивы` books.
4. Pin exact Chronicle volume 3 pages for 1921–1923 events.
5. Add creator/date/provenance/rights fields for the five chapter-opening visuals.
6. Convert the registry into typed `EssaySource[]` only after duplicate and URL checks pass.

## 11. Gate status

- [x] stable source IDs reserved for five authoring packets;
- [x] shared roots separated from exact claim sources;
- [x] source classes and verification statuses recorded;
- [x] duplicate prevention rules recorded;
- [ ] exact child URLs/pages pinned for all `PAGE-PENDING` rows;
- [ ] actual PDF binaries/SHA pinned for all `BINARY-PENDING` rows;
- [ ] visual rights closed;
- [ ] typed article source data not created until pass 02 is sufficiently complete.
