# Сергей Есенин — декабрь 1925 года: witness matrix, pass 01

**Дата:** 3 августа 2026 года  
**Статус:** `PROTOCOL FACSIMILES + MEMOIR VERSIONS MAPPED / NO COMPOSITE NARRATIVE / NO CHAPTER 15 PROSE`  
**Контролирующие документы:**

- `YESENIN_DECEMBER_1925_DAY_LEVEL_SOURCE_MATRIX_PASS_01_2026-08.md`;
- `YESENIN_DECEMBER_1925_ACQUISITION_REGISTRY_2026-08.md`;
- `YESENIN_DECEMBER_1925_SOURCE_PASS_IMLI_2003_2026-08.md`;
- `YESENIN_MEMOIR_CORPUS_SOURCE_PASS_1986_USER_UPLOAD_2026-08.md`;
- `YESENIN_LAST_POEM_MYTH_SOURCE_MAP_2026-08.md`.

## 1. Purpose and status classes

This matrix prevents the sentence `все вспоминали` from replacing named evidence. Each person has separate rows/layers for:

```text
contemporaneous official protocol
≠ text written soon after the event
≠ first publication
≠ later revised memoir
≠ modern editorial/OCR representation
```

Statuses:

- `PROTOCOL-FACSIMILE-MAPPED` — a complete published facsimile of the contemporaneous protocol was visually checked; original archive bytes/rights remain pending.
- `MEMOIR-VERSIONS-MAPPED` — early and later memoir publication histories are distinguished.
- `PRESENCE-REPORTED` — presence is listed by another identified source; own account is not acquired.
- `OFFICIAL-DOCUMENT-MAPPED` — a published facsimile of the official act is checked; original file/order/rights remain pending.
- `DOCUMENT-WITNESS-PENDING` — a documentary role exists but the needed register/record is absent.

No row in pass 01 is `COMPLETE`. A published facsimile is not called the original.

---

## 2. V. I. Ehrlich

```yaml
witness: Wolf Iosifovich Ehrlich
relationship_to_yesenin: Leningrad poet; literary/publishing intermediary; asked to find rooms in December 1925
claimed_date_time: 24-28 December 1925; especially 27 December and discovery/reading on 28 December
place: Leningrad / Англетер / literary contacts
contemporaneous_protocol:
  date: 28 December 1925
  representation: verified published facsimile
  source: IMLI 2003 volume
  PDF_pages: 383-386
  original_archive_bytes: pending
first_memoir:
  title: Четыре дня
  written: January 1926; another academic note specifies 28 January
  first_publication: Памяти Есенина, Moscow, 1926
later_memoir:
  title: Право на песнь
  composed_or_dated: November 1928-January 1929
  book_publication: late 1929 / cited 1930 edition
  representation_in_1986: abridged text of the later book
independent_matches:
  - E. A. Ustinova separately reports the 27 December manuscript transfer
  - laboratory letter no. 2028 supports blood as writing medium
  - 27 December power of attorney documents a practical relation
important_variant:
  - early account contains a longer transfer phrase
  - later book reduces the reported phrase to Тебе
limits:
  - protocol, 1926 memoir and later literary book are not merged
  - change in wording blocks automatic identification of the poetic addressee
  - no memoir is a hotel register or minute-by-minute log
source_class: CONTEMPORANEOUS-PROTOCOL + EARLY-MEMOIR + LATER-REWORKED-MEMOIR
status: PROTOCOL-FACSIMILE-MAPPED / MEMOIR-VERSIONS-MAPPED / ORIGINAL-PENDING
reader_use: named observations and version comparison; no composite final-night narration
```

**Safe formula:** Ehrlich is a direct witness represented by a contemporaneous protocol, an early 1926 text and a later rewritten book; those layers must be compared, not fused.

## 3. E. A. Ustinova

```yaml
witness: Elizaveta Alekseevna Ustinova
relationship_to_yesenin: wife of G. F. Ustinov; long-standing acquaintance; resident in the hotel environment
claimed_date_time: 24-27 December 1925; manuscript-transfer scene on 27 December
place: Англетер / Интернационал
contemporaneous_protocol:
  date: 28 December 1925
  representation: verified published facsimile
  source: IMLI 2003 volume
  PDF_page: 382
  original_archive_bytes: pending
memoir:
  title: Четыре дня Сергея Александровича Есенина
  first_publication: Воспоминания, 1926
  edition_basis_in_1986: 1926 text
independent_matches:
  - Ehrlich separately reports receiving the folded poem
  - laboratory corpus supports blood as writing medium
limits:
  - protocol must be compared with the memoir rather than treated as one text
  - direct observation does not establish full composition process, exact motive for cuts or legal function of poem
source_class: CONTEMPORANEOUS-PROTOCOL + EARLY-MEMOIR
status: PROTOCOL-FACSIMILE-MAPPED / MEMOIR-VERSION-MAPPED / ORIGINAL-PENDING
reader_use: limited named observations and protocol/memoir comparison
```

**Safe formula:** Ustinova supplies both a contemporaneous official statement and an early memoir; neither identifies the poem’s legal or psychological function.

## 4. G. F. Ustinov

```yaml
witness: Georgy Feofanovich Ustinov
relationship_to_yesenin: writer/journalist; acquaintance and supporter since the late 1910s; hotel resident
claimed_date_time: final Leningrad days and immediate post-death response
place: Англетер / Leningrad press environment
contemporaneous_protocol:
  date: 28 December 1925
  representation: verified published facsimile
  source: IMLI 2003 volume
  PDF_pages: 380-381
  original_archive_bytes: pending
synchronous_press:
  title: Сергей Есенин и его смерть
  publication: Красная газета, evening edition, 29 December 1925, no. 314
  issue_binary: not acquired
other_early_text:
  source: Воспоминания, 1926
  exact_page_and_dependency: mapping pending
limits:
  - protocol, newspaper article and memoir are different objects
  - immediate newspaper rhetoric is not automatically private-event evidence
source_class: CONTEMPORANEOUS-PROTOCOL + SYNCHRONOUS-PRESS-WITNESS + EARLY-MEMOIR-PENDING
status: PROTOCOL-FACSIMILE-MAPPED / PRESS-BINARY-PENDING / ORIGINAL-PENDING
reader_use: protocol-based observations now; newspaper claims only after exact issue acquisition
```

**Safe formula:** G. F. Ustinov was both a participant in the hotel circle and an immediate public narrator; the two roles remain separate.

## 5. V. M. Nazarov — hotel manager

```yaml
witness: Vasily Mikhailovich Nazarov
relationship_to_yesenin: manager/administrator connected with the hotel
claimed_date_time: hotel registration/environment and discovery process
place: Англетер / Интернационал
contemporaneous_protocol:
  date: 28 December 1925
  representation: verified published facsimile
  source: IMLI 2003 volume
  PDF_pages: 378-379
  original_archive_bytes: pending
hotel_register: not acquired
room_card_payment_record: not acquired
limits:
  - protocol is not the missing register
  - administrative recollection does not create exact minute-by-minute movement
source_class: CONTEMPORANEOUS-HOTEL-PROTOCOL
status: PROTOCOL-FACSIMILE-MAPPED / HOTEL-RECORDS-PENDING
reader_use: named administrative testimony, with explicit absence of register/card
```

## 6. D. N. Ushakov

```yaml
witness: Dmitry Nikolaevich Ushakov
relationship_to_yesenin: writer/literary contact in the final Leningrad circle
claimed_date_time: reported among visitors during 24-27 December
place: Англетер / Leningrad
observation_type: presence reported by early memoir/comment cluster
own_first_account: not acquired
independent_document_match: pending
source_class: REPORTED-PRESENCE
status: PRESENCE-REPORTED
reader_use: no quote or exact timing before own/independent source
```

## 7. Ivan Pribludny

```yaml
witness: Ivan Pribludny
relationship_to_yesenin: poet and literary acquaintance
claimed_date_time: reported among visitors during 24-27 December
place: Англетер / Leningrad
own_first_account: not acquired
independent_document_match: pending
source_class: REPORTED-PRESENCE
status: PRESENCE-REPORTED
reader_use: qualified presence only; no reconstructed conversation
```

## 8. Nikolai Klyuev

```yaml
witness: Nikolai Alekseevich Klyuev
relationship_to_yesenin: poet; long and conflict-bearing literary relationship
claimed_date_time: reported among visitors during 24-27 December
place: Англетер / Leningrad
own_first_final_days_account: not acquired
later_memorial_material: separate mapping pending
source_class: REPORTED-PRESENCE / LATER-MEMORIAL-MATERIAL-PENDING
status: PRESENCE-REPORTED
reader_use: no poetic memorial language as hotel chronology
```

## 9. Viktor Izmailov

```yaml
witness: Viktor Izmailov
relationship_to_yesenin: older writer/literary contact named in the visitor cluster
claimed_date_time: reported among visitors during 24-27 December
place: Англетер / Leningrad
own_first_account: not acquired
independent_document_match: pending
source_class: REPORTED-PRESENCE
status: PRESENCE-REPORTED
reader_use: no exact dialogue or timing
```

## 10. Other hotel records and employees

```yaml
witness_group: desk staff, service employees, register/room-assignment personnel beyond Nazarov
relationship_to_yesenin: official/service contact
claimed_date_time: 24-28 December
place: Англетер / Интернационал
hotel_register: not acquired
room_card_payment_record: not acquired
individual_statements: incomplete
source_class: OFFICIAL/HOTEL-DOCUMENT-WITNESS
status: DOCUMENT-WITNESS-PENDING
reader_use: none beyond qualified hotel stay until records are acquired
```

A memoir and Nazarov protocol are not the hotel register.

## 11. N. Gorbow and initial inquiry personnel

```yaml
witness: Nikolai Gorbow and other initial inquiry personnel
relationship_to_yesenin: official investigation
claimed_date_time: morning/day 28 December
place: hotel room and official process
verified_document:
  object: Gorbow act
  representation: verified published facsimile
  source: IMLI 2003 volume
  PDF_page: 377
related_verified_facsimiles:
  - case cover, PDF 372
  - property inventory, PDF 387
  - hospital/forwarding documents, PDF 388-392
complete_original_file_order: pending
source_class: CONTEMPORANEOUS-OFFICIAL-DOCUMENT
status: OFFICIAL-DOCUMENT-MAPPED / COMPLETE-ORIGINAL-FILE-PENDING
reader_use: exact act-based statements; no claim that published selection equals every original leaf
```

## 12. A. G. Gilyarevsky and medical personnel

```yaml
witness: Alexander G. Gilyarevsky and associated medical personnel
relationship_to_yesenin: judicial-medical examination
claimed_date_time: 29 December 1925
place: Leningrad forensic process
verified_document:
  object: forensic act
  representation: complete verified published facsimile
  source: IMLI 2003 volume
  PDF_pages: 393-395
printed_transcription_and_expert_context: available in the same volume
original_archive_bytes: pending
rights: pending
source_class: CONTEMPORANEOUS-FORENSIC-DOCUMENT
status: OFFICIAL-DOCUMENT-MAPPED / ORIGINAL-PENDING / RIGHTS-PENDING
reader_use: exact medical claims from full act/context; no sensational paraphrase
```

## 13. Dependency and contradiction rules

1. Protocol and memoir by the same person are not independent witnesses.
2. Ehrlich’s 1926 text and 1929/1930 book are two versions by one witness.
3. Ustinova’s protocol and 1926 memoir must be compared line by line before quotation.
4. G. F. Ustinov’s protocol, immediate newspaper article and early memoir are three objects.
5. A person listed among visitors is not assigned date, duration or dialogue without own/independent source.
6. Published facsimiles establish document content/appearance for private research but are not original archive bytes or publication rights.
7. No contradiction is resolved by choosing the more dramatic text.
8. No composite `все вспоминали` paragraph is allowed.

## 14. Updated acquisition queue

1. exact issue/page of `Красная газета`, 29 December 1925, no. 314;
2. first 1926 publication of Ehrlich’s `Четыре дня` for direct comparison with `Право на песнь`;
3. first 1926 print of Ustinova and G. F. Ustinov;
4. own first statements of Ushakov, Pribludny, Klyuev and Izmailov, if they exist;
5. hotel register, room card and payment record;
6. original archive bytes/order/rights for inquiry and Gilyarevsky documents;
7. exact paragraph-level comparison of protocols and memoir versions.

## 15. Gate result

```yaml
witness_rows_created: 11
complete_witness_rows: 0
protocol_facsimile_mapped_rows: 4
memoir_version_mapped_rows: 3
presence_reported_rows: 4
official_document_mapped_rows: 2
document_witness_pending_rows: 1
composite_everyone_remembered_paragraph_allowed: false
chapter_15_prose_allowed: false
ready_for_reader_use: false
```

The new sources materially advance the matrix, but final narrative prose remains blocked until the missing first publications, hotel records, original/rights layer and paragraph-level contradiction audit are closed.