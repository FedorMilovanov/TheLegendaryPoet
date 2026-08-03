# Сергей Есенин — декабрь 1925 года: acquisition registry

**Дата:** 3 августа 2026 года  
**Статус:** `ACQUISITION CONTROL / NO CHAPTER 15 PROSE / NO PUBLIC ROUTE`  
**Контролирующая хронология:** `YESENIN_DECEMBER_1925_DAY_LEVEL_SOURCE_MATRIX_PASS_01_2026-08.md`  
**Связанные карты:** `YESENIN_LAST_POEM_MYTH_SOURCE_MAP_2026-08.md`, `YESENIN_SOFIA_TOLSTAYA_CLINIC_SOURCE_PASS_01_2026-08.md`  
**Drive policy:** `docs/SOURCE_ACQUISITION_AND_DRIVE_POLICY.md`

## 1. Purpose

This registry converts the December source queue into acquisition objects. It does not write chapter 15 and does not choose a death theory.

Every row distinguishes:

```text
academic knowledge
≠ original document
≠ verified facsimile
≠ modern transcription
≠ derived photograph
≠ production rights
```

A catalogue record or academic quotation can support a qualified draft statement. It does not mean that the underlying binary is present in Google Drive or cleared for publication.

## 2. Status vocabulary

- `TEXT-PINNED` — exact academic text/comment is known.
- `BIBLIOGRAPHY-PINNED` — item identity/date/author is known, binary absent.
- `BINARY-PENDING` — original/verified facsimile must be acquired and inspected.
- `PROVENANCE-PENDING` — representation chain or archive unit is incomplete.
- `RIGHTS-PENDING` — research use may be possible, production reproduction not cleared.
- `ITEM-VERIFIED` — bytes, first page/image, dimensions/pages, provenance and SHA-256 checked.
- `HOLD` — no reader assertion beyond the safe formula.
- `REJECT` — derivative/sensational/unclear object must not enter the archive.

No object below is `ITEM-VERIFIED` merely because an academic edition describes it.

---

## 3. Acquisition objects

### DEC-ACQ-01 — complete clinic medical archive unit

```yaml
research_need: treatment from 26 November through the documented end of stay; diagnosis, observations and treatment-end mechanism
known_basis:
  - certificate no. 1037 confirms treatment since 26 November and inability to be questioned
  - academic comments place the stay through 21 December
required_object:
  - complete archive unit or official item list
  - cover/inventory sheets
  - all surviving clinical notes, admission and termination records
current_status: BINARY-PENDING / PROVENANCE-PENDING / RIGHTS-PENDING
safe_formula_now: Yesenin was treated in the clinic from 26 November; the complete medical file and formal treatment-end mechanism have not been acquired.
forbidden_shortcut:
  - certificate no. 1037 is the full case history
  - exact diagnosis reconstructed from memoirs
  - 21 December automatically means formal discharge or self-discharge
```

### DEC-ACQ-02 — certificate no. 1037, 28 November 1925

```yaml
research_need: exact wording, signature, letterhead, archive provenance and visual rights
known_basis: academic publication gives the document text and date
required_object: original or institutionally verified full-page facsimile
current_status: TEXT-PINNED / BINARY-PENDING / RIGHTS-PENDING
safe_formula_now: The certificate states treatment since 26 November and incapacity for court questioning; it does not publish a full diagnosis.
forbidden_shortcut:
  - cropped screenshot treated as the original
  - captioned as a complete medical history
```

### DEC-ACQ-03 — 21 December treatment-end document

```yaml
research_need: formal discharge, leave, self-discharge or other mechanism
known_basis: academic chronology gives the end date
required_object: discharge/leave entry, clinical register or archive explanation of absence
current_status: HOLD / BINARY-PENDING
safe_formula_now: The documented clinic stay ends on 21 December; the mechanism remains unestablished.
forbidden_shortcut:
  - he escaped
  - doctors formally discharged him
  - family removed him
```

### DEC-ACQ-04 — Moscow–Leningrad transport, 23–24 December

```yaml
research_need: exact train, departure/arrival, carriage and passenger evidence
known_basis: academic chronology and witness accounts establish the overnight journey
required_object:
  - ticket, passenger/railway record or synchronous timetable linked to the journey
  - arrival record if surviving
current_status: BIBLIOGRAPHY-PINNED / BINARY-PENDING
safe_formula_now: Yesenin left Moscow on the evening of 23 December and arrived in Leningrad on 24 December.
forbidden_shortcut:
  - exact train/carriage/companions without a transport object
```

### DEC-ACQ-05 — `Англетер` / `Интернационал` registration and room records

```yaml
research_need: registration time, room assignment, payment, staff and visitor evidence
known_basis: academic chronology and early witnesses place Yesenin at the hotel from 24 December
required_object:
  - hotel register
  - room assignment/payment/guest card
  - staff statements or official record linked to the room
current_status: BINARY-PENDING / PROVENANCE-PENDING
safe_formula_now: The hotel stay is strongly established; the project has not acquired the hotel register and room record.
forbidden_shortcut:
  - memoir treated as hotel register
  - modern tourist photograph treated as room evidence
  - exact minute-by-minute hotel chronology without records
```

### DEC-ACQ-06 — power of attorney to V. I. Ehrlich, 27 December

```yaml
research_need: original wording, handwriting roles, certification and archive provenance
known_basis: document is described as written by Ehrlich, signed/dated by Yesenin and certified by the Leningrad Union of Poets
required_object: full original or institutionally verified facsimile including certification
current_status: BIBLIOGRAPHY-PINNED / BINARY-PENDING / RIGHTS-PENDING
safe_formula_now: A concrete practical power of attorney was executed on 27 December.
forbidden_shortcut:
  - future-oriented document proves absence of crisis
  - document proves predetermined death
  - signature crop presented without certification page
```

### DEC-ACQ-07 — final poem autograph and 1992 laboratory conclusion

```yaml
research_need: manuscript representation, handwriting/material evidence and item-level rights
known_basis:
  - academic edition prints from an undated autograph in IRLI
  - facsimile appeared in Krasnaya Niva on 24 January 1926
  - early witnesses place transfer to Ehrlich on 27 December
  - laboratory conclusion no. 2028 dated 15 June 1992 identified blood by microspectral method
required_object:
  - current institutionally verified autograph image
  - 1926 facsimile page
  - complete 1992 conclusion, not a paraphrase
current_status: TEXT-PINNED / BIBLIOGRAPHY-PINNED / BINARY-PENDING / RIGHTS-PENDING
safe_formula_now: The autograph was written in blood; exact poetic addressee and legal/psychological function are not established by the manuscript.
forbidden_shortcut:
  - unquestioned legal suicide note to Ehrlich
  - blood as proof of repentance, artistic greatness or exact death motive
  - expanded Vertinsky text attributed wholly to Yesenin
```

### DEC-ACQ-08 — initial inspection/inquiry file, 28 December

```yaml
research_need: complete scene-inspection and inquiry chain, authors, times, signatures and attachments
known_basis: a contemporaneous official investigation corpus existed and classified the death as suicide
required_object:
  - complete initial inspection act
  - witness/official statements
  - attachment inventory
  - page order and archive unit
current_status: BIBLIOGRAPHY-PINNED / BINARY-PENDING / PROVENANCE-PENDING
safe_formula_now: The official version has a real contemporaneous documentary basis; the project has not acquired the complete file.
forbidden_shortcut:
  - official version had no documents
  - an imperfect procedure itself proves homicide
  - later retelling substituted for the act
```

### DEC-ACQ-09 — A. Gilyarevsky forensic act, 29 December

```yaml
research_need: exact medical wording, measurements, signatures, attachments and provenance
known_basis: identifiable judicial-medical conclusion dated 29 December
required_object: original or verified full facsimile of the complete act
current_status: BIBLIOGRAPHY-PINNED / BINARY-PENDING / RIGHTS-PENDING
safe_formula_now: The contemporaneous forensic conclusion identified suicide by hanging; exact criticism must address the act itself.
forbidden_shortcut:
  - medical details quoted from sensational secondary books
  - later paraphrase treated as original act
  - isolated phrase used without full document context
```

### DEC-ACQ-10 — original photographs/negatives and representation chain

```yaml
research_need: distinguish original negative, first print, retouched publication, crop and later reproduction
known_basis: photographs were made during the initial process; later commissions examined original materials
required_object:
  - institutionally identified originals/negatives or verified first-generation prints
  - provenance and retouching history
  - expert comparison report
current_status: PROVENANCE-PENDING / BINARY-PENDING / RIGHTS-PENDING
safe_formula_now: Photographs form part of the evidence corpus, but retouched/cropped copies are not adequate for independent forensic inference.
forbidden_shortcut:
  - body photograph in reader article
  - unproven internet image used as original
  - mechanical conclusion from a crop without measurements/expert basis
```

### DEC-ACQ-11 — 1991–1993 expert commission report

```yaml
research_need: full scope, members, materials examined, methodology and final wording
known_basis: published conclusion states that available objective material did not document a refutation of the autopsy act and 29 December conclusion
required_object: full commission report with appendices and provenance
current_status: BIBLIOGRAPHY-PINNED / BINARY-PENDING
safe_formula_now: The later commission reported no objective basis in the examined materials for overturning the contemporaneous medical conclusion.
forbidden_shortcut:
  - commission proves every procedural detail flawless
  - existence of official conclusion makes all questions dishonest
```

### DEC-ACQ-12 — synchronous press, 28–31 December

```yaml
research_need: separate event reporting, official information, rumour, obituary rhetoric and immediate myth formation
known_basis: public memorialisation and press reporting began immediately
required_object:
  - issue/page matrix by newspaper and date
  - author/byline where available
  - source dependency and repeated wording map
current_status: BINARY-PENDING / PAGE-MATRIX-PENDING
safe_formula_now: Synchronous press documents reception and the early public narrative; it is not automatically evidence for private events.
forbidden_shortcut:
  - repeated rumour counted as independent corroboration
  - obituary language used as forensic evidence
```

---

## 4. Witness acquisition matrix

No composite `everyone remembered` paragraph is allowed. Each witness row must contain:

```yaml
witness:
relationship_to_yesenin:
claimed_date_time:
place:
direct_observation_or_hearsay:
when_account_was first written:
first_publication:
original manuscript_or_publication basis:
independent document match:
contradictions:
source_class:
reader_use:
```

Priority order:

1. hotel/official employees and contemporaneous records;
2. V. I. Ehrlich;
3. E. A. Ustinova;
4. G. F. Ustinov;
5. D. Ushakov;
6. I. Pribludny;
7. N. Klyuev;
8. V. Izmailov;
9. police and medical personnel;
10. later memoirists only after dependence on earlier accounts is mapped.

## 5. Google Drive acquisition rules for this registry

Target area:

```text
01 — SOURCES — PDF LIBRARY/
  01 — BOOKS, EDITIONS & ARTICLES/
    BATCH-0003 — YESENIN DECEMBER 1925 FORENSIC SOURCES/
```

Do not create the folder until the first object passes verification.

Before upload:

```text
□ search both existing 40-item libraries and every batch
□ compare normalized title/item, institution, archive unit, date, URL and SHA-256
□ verify actual PDF/image MIME and first/full page
□ record page/image count, dimensions, file size and text-layer status
□ preserve original bytes before any derivative/OCR
□ record rights and dignity restrictions
□ reject derivative screenshots and sensational compilations
```

For image-only archive objects, use a manifest and SHA registry in the appropriate source/rights area; do not disguise JPEG screenshots as PDF books.

## 6. Production and dignity hard stops

- no body photograph in reader article, OG, VK announcement or promotional cover;
- no rope, blood, cut hand or staged room as a click hook;
- no modern hotel room presented as historical evidence;
- no unverified diagram of mechanics;
- no final-poem manuscript in a sensational teaser;
- no religious claim inferred from blood, farewell language or manner of death;
- no declaration of the unknowable final spiritual instant;
- no murder verdict from gaps alone;
- no prohibition of legitimate document-based questions merely because an official conclusion exists.

## 7. Chapter 15 gate

```yaml
narrative_prose_allowed: false
public_route_allowed: false
forensic_registry_created: true
acquisition_objects: 12
item_verified_objects: 0
complete_witness_rows: 0
medical_file_acquired: false
hotel_register_acquired: false
inquiry_file_acquired: false
forensic_act_acquired: false
photo_provenance_closed: false
ready_for_chapter_15_draft: false
```

The next legitimate progress is acquisition, exact-page verification and witness mapping — not smoother prose.
