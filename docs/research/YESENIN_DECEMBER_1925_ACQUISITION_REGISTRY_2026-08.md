# Сергей Есенин — декабрь 1925 года: acquisition registry

**Дата:** 3 августа 2026 года  
**Статус:** `ACQUISITION CONTROL / 1 VERIFIED SOURCE FILE / 1 VERIFIED FACSIMILE PACKAGE / NO CHAPTER 15 PROSE / NO PUBLIC ROUTE`  
**Контролирующая хронология:** `YESENIN_DECEMBER_1925_DAY_LEVEL_SOURCE_MATRIX_PASS_01_2026-08.md`  
**Discovery pass:** `YESENIN_DECEMBER_1925_DISCOVERY_PASS_40_PLUS_2026-08.md`  
**Verified source pass:** `YESENIN_DECEMBER_1925_SOURCE_PASS_IMLI_2003_2026-08.md`  
**Связанные карты:** `YESENIN_LAST_POEM_MYTH_SOURCE_MAP_2026-08.md`, `YESENIN_SOFIA_TOLSTAYA_CLINIC_SOURCE_PASS_01_2026-08.md`  
**Drive policy:** `docs/SOURCE_ACQUISITION_AND_DRIVE_POLICY.md`

## 1. Purpose

This registry converts the December source queue into acquisition objects. It does not write chapter 15 and does not choose a death theory.

Every row distinguishes:

```text
academic knowledge
≠ verified research source file
≠ original document
≠ verified published facsimile
≠ modern transcription
≠ derived photograph
≠ production rights
```

A catalogue record or academic quotation can support a qualified statement. A verified scientific volume can close a private-research source gate and provide institutionally published facsimiles. Neither automatically means that the original archive leaf is present, that every attachment is complete or that the facsimile may be republished.

## 2. Status vocabulary

- `TEXT-PINNED` — exact academic text/comment is known.
- `BIBLIOGRAPHY-PINNED` — item identity/date/author is known, binary absent.
- `SOURCE-FILE-VERIFIED` — source bytes, first/title page, page count, size and SHA-256 checked.
- `VERIFIED-PUBLISHED-FACSIMILE` — a complete visible representation was checked inside an identified institutional/scientific publication.
- `BINARY-PENDING` — original or another required representation must still be acquired.
- `PROVENANCE-PENDING` — representation chain or archive unit is incomplete.
- `RIGHTS-PENDING` — research use may be possible, production reproduction not cleared.
- `ORIGINAL-ITEM-VERIFIED` — original archive bytes/full image, provenance and checksum checked.
- `HOLD` — no reader assertion beyond the safe formula.
- `REJECT` — derivative/sensational/unclear object must not enter the archive.

A published facsimile is not silently promoted to an original. `ORIGINAL-ITEM-VERIFIED` remains zero until original institutional files are received and checked.

## 3. Verified research package

The user-supplied volume `Смерть Сергея Есенина. Документы. Факты. Версии` (ИМЛИ РАН, 2003) passed file-level verification:

```yaml
Drive_intake_id: UYM-2026-08-03-10
Drive_file_id: 1veLlXGVblw_RGV9qH4Dh7FdywQKdsnZy
PDF_pages: 416
file_size_bytes: 29439518
sha256: 182d24a0984b88c6d66aeeb846b7ac3b13a0f2edb39245b8b1e03912ba7d4a7c
text_layer: TEXT
first_page_verified: true
title_imprint_verified: true
rights_status: PRIVATE-RESEARCH-ONLY / RIGHTS-UNCLEAR
canonical_library_promotion: false
```

Exact page/object mapping is controlled by `YESENIN_DECEMBER_1925_SOURCE_PASS_IMLI_2003_2026-08.md`.

---

## 4. Acquisition objects

### DEC-ACQ-01 — clinic medical archive unit

```yaml
research_need: treatment from 26 November through the documented end of stay; diagnosis, observations and treatment-end mechanism
known_basis:
  - certificate no. 1037 confirms treatment since 26 November and inability to be questioned
  - academic comments place the stay through 21 December
  - archive target is IMLI, fund 32, inventory 2, storage unit 37
  - the IMLI 2003 volume reproduces the medical-history leaves on PDF pages 373-375 and prints the archive inventory on PDF pages 369-371
verified_now:
  - archive identity and item description
  - verified published facsimile of the medical-history leaves
still_required:
  - reliable full transcription/medical reading of the handwriting
  - explicit treatment-end/discharge/leave document
  - original institutional bytes and production rights
current_status: SOURCE-FILE-VERIFIED / VERIFIED-PUBLISHED-FACSIMILE / TRANSCRIPTION-REVIEW-PENDING / BINARY-PENDING / RIGHTS-PENDING
safe_formula_now: The project has a verified published facsimile of the identified medical-history item, but it still lacks an explicit document establishing the mechanism by which treatment ended on 21 December.
forbidden_shortcut:
  - archive cipher or facsimile means the original file is held by the project
  - certificate no. 1037 is the full case history
  - exact diagnosis reconstructed from memoirs
  - 21 December automatically means formal discharge or self-discharge
```

### DEC-ACQ-02 — certificate no. 1037, 28 November 1925

```yaml
research_need: exact wording, signature, letterhead, archive provenance and visual rights
known_basis: academic publication gives the document text and date
required_object: original or institutionally verified full-page facsimile of certificate no. 1037 itself
current_status: TEXT-PINNED / BINARY-PENDING / RIGHTS-PENDING
safe_formula_now: The certificate states treatment since 26 November and incapacity for court questioning; it does not publish a full diagnosis.
forbidden_shortcut:
  - cropped screenshot treated as the original
  - medical-history facsimile substituted for certificate no. 1037
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
known_basis:
  - academic chronology and early witnesses place Yesenin at the hotel from 24 December
  - the IMLI volume reproduces the 28 December Nazarov protocol but not the hotel register
required_object:
  - hotel register
  - room assignment/payment/guest card
  - staff records independently linked to the room
current_status: WITNESS-FACSIMILE-AVAILABLE / BINARY-PENDING / PROVENANCE-PENDING
safe_formula_now: The hotel stay is strongly established; the project has Nazarov's published protocol facsimile but not the hotel register and room card.
forbidden_shortcut:
  - memoir or witness protocol treated as hotel register
  - modern tourist photograph treated as room evidence
  - exact minute-by-minute hotel chronology without records
```

### DEC-ACQ-06 — power of attorney to V. I. Ehrlich, 27 December

```yaml
research_need: original wording, handwriting roles, certification and archive provenance
known_basis: written by Ehrlich, signed/dated by Yesenin and certified by the Leningrad Union of Poets
verified_now:
  - full-page verified published facsimile on PDF page 376 of the IMLI 2003 volume
  - signature and certification visible as one document object
still_required:
  - original archive bytes and item-level reuse rights
current_status: SOURCE-FILE-VERIFIED / VERIFIED-PUBLISHED-FACSIMILE / ORIGINAL-BINARY-PENDING / RIGHTS-PENDING
safe_formula_now: A concrete practical power of attorney was executed on 27 December; the project has checked a full published facsimile.
forbidden_shortcut:
  - future-oriented document proves absence of crisis
  - document proves predetermined death
  - signature crop presented without certification page
  - published facsimile called the original
```

### DEC-ACQ-07 — final poem autograph and 1992 laboratory conclusion

```yaml
research_need: manuscript representation, handwriting/material evidence and item-level rights
known_basis:
  - academic edition prints from an undated autograph in IRLI
  - facsimile appeared in Krasnaya Niva on 24 January 1926
  - early witnesses place transfer to Ehrlich on 27 December
verified_now:
  - complete published letter no. 2028 dated 15 June 1992 on PDF page 37 of the IMLI volume
  - the document states that a microspectral method established blood as the writing medium
still_required:
  - current institutionally verified autograph image
  - 1926 facsimile page
  - item-level publication rights
current_status: SOURCE-FILE-VERIFIED / LAB-CONCLUSION-VERIFIED / AUTOGRAPH-BINARY-PENDING / RIGHTS-PENDING
safe_formula_now: The examined autograph was written in blood; exact poetic addressee and legal or psychological function are not established by the manuscript or laboratory conclusion.
forbidden_shortcut:
  - unquestioned legal suicide note to Ehrlich
  - blood as proof of repentance, artistic greatness or exact death motive
  - expanded Vertinsky text attributed wholly to Yesenin
```

### DEC-ACQ-08 — initial inspection/inquiry file, 28 December

```yaml
research_need: complete scene-inspection and inquiry chain, authors, times, signatures and attachments
verified_now_in_IMLI_2003:
  - case cover, PDF page 372
  - Gorbow act, PDF page 377
  - Nazarov protocol, PDF pages 378-379
  - G. F. Ustinov protocol, PDF pages 380-381
  - E. A. Ustinova protocol, PDF page 382
  - V. I. Ehrlich protocol, PDF pages 383-386
  - room-property inventory, PDF page 387
  - hospital certificate/receipt/notes, PDF pages 388-390
  - doctor telephone message and forwarding paper, PDF pages 391-392
still_required:
  - proof that every original leaf and attachment is present in exact archive order
  - original institutional bytes and rights
  - hotel register and independent room record
current_status: SOURCE-FILE-VERIFIED / SUBSTANTIAL-VERIFIED-FACSIMILE-CORPUS / COMPLETE-ORIGINAL-FILE-PENDING / RIGHTS-PENDING
safe_formula_now: The official version has a substantial contemporaneous documentary basis now checked in published facsimile; the project still does not possess the complete original inquiry file.
forbidden_shortcut:
  - official version had no documents
  - published selection equals every original inquiry leaf
  - an imperfect procedure itself proves homicide
  - later retelling substituted for the acts
```

### DEC-ACQ-09 — A. Gilyarevsky forensic act, 29 December

```yaml
research_need: exact medical wording, measurements, signatures, attachments and provenance
verified_now:
  - complete three-page published facsimile on PDF pages 393-395
  - printed transcription and expert discussion elsewhere in the volume
still_required:
  - original archive bytes and item-level reproduction rights
current_status: SOURCE-FILE-VERIFIED / VERIFIED-PUBLISHED-FACSIMILE / ORIGINAL-BINARY-PENDING / RIGHTS-PENDING
safe_formula_now: The contemporaneous forensic conclusion identified death by asphyxia from hanging; criticism must address the full act and its damaged portions, not a later isolated quotation.
forbidden_shortcut:
  - medical details quoted from sensational secondary books
  - later paraphrase treated as original act
  - isolated phrase used without full document context
  - published facsimile called the original
```

### DEC-ACQ-10 — original photographs/negatives and representation chain

```yaml
research_need: distinguish original negative, first print, retouched publication, crop and later reproduction
known_basis:
  - photographs were made during the initial process
  - the commission reports examinations of original materials
  - the IMLI volume contains published photo/expert material
required_object:
  - institutionally identified originals/negatives or verified first-generation prints
  - provenance and retouching history
  - complete expert comparison report with object list
current_status: PUBLISHED-EXPERT-MATERIAL-AVAILABLE / PROVENANCE-PENDING / BINARY-PENDING / RIGHTS-PENDING
safe_formula_now: Photographs form part of the evidence corpus, but published crops or retouched copies are not adequate for independent forensic inference.
forbidden_shortcut:
  - body photograph in reader article
  - unproven internet image used as original
  - mechanical conclusion from a crop without measurements/expert basis
```

### DEC-ACQ-11 — 1991–1993 expert commission corpus

```yaml
research_need: full scope, members, materials examined, methodology and final wording
verified_now:
  - the IMLI 2003 volume contains published letters, specialist opinions, conclusions and meeting records of the commission period
  - the volume identifies contributors and prints a contents map
still_required:
  - proof that every original working paper and appendix is included
  - original institutional files and rights
current_status: SOURCE-FILE-VERIFIED / PUBLISHED-COMMISSION-CORPUS-ACQUIRED / ORIGINAL-WORKING-FILES-PENDING
safe_formula_now: The published commission corpus reports no objective basis in the examined materials for overturning the contemporaneous medical conclusion; it does not prove that every procedural detail was flawless.
forbidden_shortcut:
  - commission proves every procedural detail flawless
  - existence of official conclusion makes all questions dishonest
  - polemical article inside the volume treated as the commission's verdict
```

### DEC-ACQ-12 — synchronous press, 28–31 December

```yaml
research_need: separate event reporting, official information, rumour, obituary rhetoric and immediate myth formation
known_basis:
  - public memorialisation and press reporting began immediately
  - the IMLI volume reprints selected later press discussions but does not close the required 1925 issue/page matrix
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

## 5. Witness acquisition matrix

No composite `everyone remembered` paragraph is allowed. Each witness row must contain:

```yaml
witness:
relationship_to_yesenin:
claimed_date_time:
place:
direct_observation_or_hearsay:
when_account_was_first_written:
first_publication:
original_manuscript_or_publication_basis:
independent_document_match:
contradictions:
source_class:
reader_use:
```

The IMLI volume now supplies published facsimiles of the 28 December protocols of Nazarov, both Ustinovs and Ehrlich. These must be mapped as separate contemporaneous official statements, not merged with their later memoirs.

Priority order:

1. hotel/official employees and contemporaneous records;
2. V. I. Ehrlich — protocol and later memoir separately;
3. E. A. Ustinova — protocol and later memoir separately;
4. G. F. Ustinov — protocol and later text separately;
5. D. Ushakov;
6. I. Pribludny;
7. N. Klyuev;
8. V. Izmailov;
9. police and medical personnel;
10. later memoirists only after dependence on earlier accounts is mapped.

## 6. Google Drive acquisition rules for this registry

The verified IMLI file remains in the private original inbox because lawful provenance and redistribution rights for the supplied digital copy were not provided. It is not copied into a public/canonical distributable batch.

A future canonical source batch may be created only when at least one lawfully sourced object with stable item URL and rights metadata passes:

```text
□ search both existing 40-item libraries and every batch
□ compare normalized title/item, institution, archive unit, date, URL and SHA-256
□ verify actual PDF/image MIME and first/full page
□ record page/image count, dimensions, file size and text-layer status
□ preserve original bytes before any derivative/OCR
□ record rights and dignity restrictions
□ reject derivative screenshots and sensational compilations
```

For image-only archive objects, use a manifest and SHA registry; do not disguise JPEG screenshots as PDF books.

## 7. Production and dignity hard stops

- no body photograph in reader article, OG, VK announcement or promotional cover;
- no rope, blood, cut hand or staged room as a click hook;
- no modern hotel room presented as historical evidence;
- no unverified diagram of mechanics;
- no final-poem manuscript in a sensational teaser;
- no religious claim inferred from blood, farewell language or manner of death;
- no declaration of the unknowable final spiritual instant;
- no murder verdict from gaps alone;
- no prohibition of legitimate document-based questions merely because an official conclusion exists;
- no reproduction of IMLI book facsimiles until item-level rights are cleared.

## 8. Chapter 15 gate

```yaml
narrative_prose_allowed: false
public_route_allowed: false
forensic_registry_created: true
acquisition_objects: 12
verified_research_source_files: 1
verified_published_facsimile_packages: 1
acquisition_objects_advanced: 6
original_archive_objects_verified: 0
complete_witness_rows: 0
medical_facsimile_acquired: true
medical_file_original_acquired: false
treatment_end_mechanism_acquired: false
hotel_register_acquired: false
inquiry_facsimile_corpus_acquired: true
inquiry_file_original_acquired: false
forensic_act_facsimile_acquired: true
forensic_act_original_acquired: false
lab_conclusion_2028_verified: true
photo_provenance_closed: false
production_rights_closed: false
ready_for_chapter_15_draft: false
```

The next legitimate progress is exact witness mapping, medical-facsimile transcription review, acquisition of the missing treatment-end/hotel/transport objects and quotation compression — not a smooth final chapter.