# Сергей Есенин — декабрь 1925 года: discovery pass 40+

**Дата:** 3 августа 2026 года  
**Статус:** `40 SEARCHES COMPLETE / DISCOVERY ONLY / NO BINARIES CLAIMED`  
**Контролирующий acquisition registry:** `YESENIN_DECEMBER_1925_ACQUISITION_REGISTRY_2026-08.md`  
**Контролирующая хронология:** `YESENIN_DECEMBER_1925_DAY_LEVEL_SOURCE_MATRIX_PASS_01_2026-08.md`  
**Публичный route:** запрещён

## 1. Purpose

The owner requested a broad 40+ search pass across open Russian, English and institutional sources. This document records the search coverage and acquisition decisions.

A search result is not an acquired source. No object below is reported as present in Google Drive unless its actual bytes, first page/image, page or image count, provenance, rights and SHA-256 have been verified.

Decision vocabulary:

- `SHORTLIST` — strong institutional/bibliographic target worth acquisition.
- `HOLD` — potentially useful, but authority, completeness, rights or original-object chain is insufficient.
- `REJECT-AS-MASTER` — derivative, pirate, sensational, unsourced or structurally unsuitable as the canonical archive object.
- `NAVIGATION-ONLY` — useful for locating the original, never the final source card.

## 2. Search inventory — 40 distinct queries

### Medical file and clinic

1. `"удостоверение № 1037" Есенин`
2. `Есенин удостоверение 1037 клиника 28 ноября 1925 ФЭБ РВБ`
3. `Есенин ИМЛИ ф. 32 оп. 2 ед. хр. 37 история болезни`
4. `Есенин удостоверение 1037 факсимиле`
5. `Есенин 21 декабря 1925 выписка из клиники документ`
6. `Есенин клиника 1 МГУ медицинская карта архив`
7. `Есенин 21 декабря 1925 выписка клиника ФЭБ РВБ`
8. `Есенин медицинское заключение 1017 ЗАГС 29 декабря 1925`

### Transport and hotel

9. `Есенин поезд Москва Ленинград 23 декабря 1925 билет`
10. `Есенин расписание поездов Москва Ленинград декабрь 1925`
11. `Есенин Англетер список жильцов декабрь 1925 архив`
12. `Есенин гостиница Интернационал номер 5 регистрационная карточка`
13. `Есенин Англетер гостиничный журнал регистрация 1925`
14. `Есенин доверенность Эрлиху 27 декабря 1925 оригинал`

### Inquiry and forensic acts

15. `Есенин акт Горбова 28 декабря 1925 ФЭБ РВБ`
16. `Есенин акт Горбова 28 декабря 1925 архив`
17. `Есенин материалы дознания 28 декабря 1925 11 листов`
18. `Есенин акт Гиляревского 29 декабря 1925 ФЭБ РВБ`
19. `Есенин акт вскрытия Гиляревского архив 2 листа`
20. `Гиляровский Есенин 29 декабря 1925 судебно медицинский акт`

### Final poem and laboratory work

21. `Есенин До свиданья автограф ИРЛИ`
22. `Красная нива 24 января 1926 Есенин факсимиле`
23. `Красная нива 1926 № 4 Есенин факсимиле`
24. `"заключение № 2028" Есенин 15 июня 1992`
25. `Есенин заключение 2028 микроспектральный кровь PDF`

### Photographs and later expert commission

26. `Есенин оригинальные негативы Англетер комиссия`
27. `Есенин комиссия 1991 1993 полный отчет`
28. `Литературная Россия комиссия Есенин смерть 1992`
29. `Московский литератор комиссия Есенин смерть`
30. `Правда комиссия смерть Есенина 1992`

### Synchronous press and early witnesses

31. `Красная газета 29 декабря 1925 Сергей Есенин смерть PDF`
32. `Вечерняя Москва 30 декабря 1925 Есенин PDF`
33. `Елизавета Устинова воспоминания Есенин 27 декабря первая публикация`
34. `Вольф Эрлих Право на песнь воспоминания Есенин 1926`
35. `Георгий Устинов Сергей Есенин и его смерть Красная газета 29 декабря 1925`
36. `Есенин свидетель Измайлов Англетер 1925`

### Books and collected documentary corpora

37. `"Сергей Есенин. Материалы к биографии" 1992 PDF`
38. `"Гибель С. А. Есенина" исследование версии самоубийства PDF`
39. `"Памяти Есенина" 1926 PDF`
40. `"Сергей Александрович Есенин. Воспоминания" 1926 PDF`

Additional Drive exact-title searches were run separately for certificate no. 1037, Gilyarevsky, conclusion no. 2028, the final poem and general death-document wording. They returned no exact matching Drive objects.

---

## 3. Strong institutional shortlist

### DISC-DEC-01 — last clinic history, exact archive unit

```yaml
decision: SHORTLIST / ARCHIVE-REQUEST
identity: last medical history of S. A. Yesenin
archive_reference: IMLI, fund 32, inventory 2, storage unit 37
supporting_authority: FEB/RVB academic comments
additional_facsimile_reference: Русская литература, 1974, no. 8
value: upgrades a vague medical-file request into an exact archive target
binary_status: not acquired
rights_status: pending
```

This target outranks later diagnostic retellings. Until the complete unit or official item list is obtained, certificate no. 1037 and memoirs must not be expanded into a full diagnosis.

### DISC-DEC-02 — certificate no. 1037

```yaml
decision: SHORTLIST / VERIFIED-FACSIMILE-NEEDED
identity: clinic certificate, 28 November 1925
known_text: treatment since 26 November and inability to be questioned for health reasons
required: original or institutionally verified full-page facsimile, archive identity, signature, letterhead and rights
binary_status: not acquired
```

### DISC-DEC-03 — `Вечерняя Москва`, 29 December 1925, no. 296

```yaml
decision: SHORTLIST
repository: National Electronic Library
item_url: https://rusneb.ru/catalog/000199_000009_011625583/
identity: Вечерняя Москва : ежедневный деловой выпуск, 1925, no. 296, 29 December
value: synchronous press and early public narrative; possible first publication/reprinting context
binary_status: not acquired
```

A NЭБ item record is a strong acquisition route, but the exact pages and PDF bytes still require verification.

### DISC-DEC-04 — `Красная газета`, evening edition, 29 December 1925, no. 314

```yaml
decision: SHORTLIST / ISSUE-PAGE-NEEDED
known_article: Georgy Ustinov, Сергей Есенин и его смерть
academic_support: RVB/FEB comments identify issue/date/title
value: early witness/publication history of the final poem and immediate narrative
binary_status: not acquired
```

### DISC-DEC-05 — `Красная нива`, 24 January 1926, no. 4, p. 8

```yaml
decision: SHORTLIST
identity: early facsimile publication of the final-poem autograph
academic_support: RVB/FEB comments
required: complete issue/page from an institutional repository; compare with current IRLI representation
binary_status: not acquired
rights_status: pending
```

### DISC-DEC-06 — final poem autograph, IRLI

```yaml
decision: SHORTLIST / INSTITUTIONAL-IMAGE-REQUEST
identity: undated autograph used by the academic edition
repository: IRLI / Pushkin House
value: controlling manuscript witness
required: current institutionally verified image, archive cipher, dimensions and rights
binary_status: not acquired
```

### DISC-DEC-07 — laboratory conclusion no. 2028, 15 June 1992

```yaml
decision: SHORTLIST / FULL-REPORT-REQUIRED
identity: microspectral examination of the final-poem writing medium
known_result: academic comments report that the writing medium was blood
required: complete conclusion with institution, experts, methods, pages, signatures and attachments
binary_status: not acquired
```

The academic summary supports a qualified fact; it does not substitute for acquisition of the full report.

### DISC-DEC-08 — Gorбov initial act, 28 December 1925

```yaml
decision: SHORTLIST / ORIGINAL-CHAIN-REQUIRED
known_text_routes:
  - academic/documentary collections
  - Wikisource transcription based on a 1996 documentary collection
required: archive unit or verified facsimile of the complete act and signatures
binary_status: not acquired
```

Wikisource and quotations are navigation/transcription layers, not the archival master.

### DISC-DEC-09 — Gilyarevsky forensic/autopsy act, 29 December 1925

```yaml
decision: SHORTLIST / ORIGINAL-OR-VERIFIED-FACSIMILE
known_text_routes:
  - Wikisource transcription
  - academic and documentary references
required: complete act, all pages, measurements, signatures, archive history and representation chain
binary_status: not acquired
```

The search exposed mutually hostile interpretations of this act. None may replace the document itself.

### DISC-DEC-10 — 1991–1993 commission materials

```yaml
decision: SHORTLIST / FULL-CORPUS-REQUIRED
known_context:
  - commission under the Yesenin committee/IMLI context
  - expert correspondence and conclusions discussed in later publications
required: complete report, participant list, exact materials examined, methods, appendices and final wording
binary_status: not acquired
```

A later article supporting or attacking the commission is not the commission report.

### DISC-DEC-11 — `Памяти Есенина`, 1926

```yaml
decision: SHORTLIST / ALREADY-IN-PDF-ACQUISITION-QUEUE
repository: National Electronic Library / RSL
item_url: https://rusneb.ru/catalog/000199_000009_007513586/
pages: 269
value: early multi-witness corpus; contains named memoir texts and documentary illustrations
binary_status: not acquired
Drive_exact_title_match: none found in prior pass
```

This is not a forensic act. It is an early witness collection whose individual contributions must be separated by author, writing/publication date and dependence.

### DISC-DEC-12 — `Сергей Александрович Есенин. Воспоминания`, 1926

```yaml
decision: SHORTLIST / ALREADY-IN-PDF-ACQUISITION-QUEUE
editor: I. V. Evdokimov
repository: RSL / National Electronic Library route
record_url: https://search.rsl.ru/ru/record/01008951684
pages: 241 + 2; 6 illustrations
value: independent early memoir collection for witness comparison
binary_status: not acquired
Drive_exact_title_match: none found in prior pass
```

### DISC-DEC-13 — `С. А. Есенин: Материалы к биографии`, 1992

```yaml
decision: SHORTLIST / BIBLIOGRAPHY-PINNED
known_routes:
  - bibliography records
  - citations in academic and commission discussions
value: documentary/commission context
required: lawful institutional or publisher copy; contents and page map
binary_status: not acquired
```

### DISC-DEC-14 — `Гибель С. А. Есенина: исследование версии самоубийства`

```yaml
decision: HOLD-FOR-LEGAL-COPY / USE-AS-LATER-ARGUMENT-CORPUS
value: maps a modern alternative argument and references documentary objects
risk: copyrighted modern monograph; online copies found through derivative/pirate reading sites
required: lawful publisher/library copy and claim-by-claim verification against originals
binary_status: not acquired
```

This book may be studied as a later thesis. It may not become the source of truth for medical or forensic facts that should be taken from original acts.

---

## 4. Navigation-only and HOLD sources

### Wikisource transcriptions

- `Акт о самоубийстве Есенина`;
- `Акт патологоанатомического вскрытия тела Есенина`;
- final poem page.

Decision: `NAVIGATION-ONLY / TEXT-CROSSCHECK`. Useful for discovering wording and bibliography, but not a substitute for the original or verified facsimile.

### Literary Russia archive articles

Articles record disputes about the commission and expert work.

Decision: `HOLD / RECEPTION-AND-CONTROVERSY`. They may map positions, dates and bibliographic clues. They do not independently establish forensic facts.

### Yesenin museum overview

Museum material is useful for the history of later theories and commission context.

Decision: `HOLD / INSTITUTIONAL-INTERPRETIVE`. Follow its references to documents; do not treat a popular overview as the complete report.

### `Право на песнь` and early witness publications

Ehrlich’s later book and earlier letter/publication layers must be separated.

Decision: `SHORTLIST-FOR-WITNESS-MATRIX`, not one timeless testimony. Record when each version was written/published and what changed.

### Newspaper archive aggregators

`Газетные старости` can locate quotations and dates.

Decision: `NAVIGATION-ONLY`; acquire the complete issue from NЭБ or another institutional repository before page-level use.

---

## 5. Reject as canonical archive masters

Reject or retain only as evidence of later reception:

- pirate ebook/read-online sites;
- scraped book mirrors;
- DOKUMEN/Flibusta-style derivatives without publisher/library provenance;
- screenshots and images from conspiracy videos;
- retouched crime-scene photographs without source chain;
- modern hotel tourist photographs;
- forum/reddit claims;
- general popular articles that omit document pages;
- polemical essays that quote only fragments while asserting a final verdict;
- OCR detached from the scanned page;
- a modern diagram of the room/body position without original measurements.

`REJECT-AS-MASTER` does not mean the text never existed or every claim is false. It means the object is unsuitable as the project’s canonical evidence file.

## 6. Findings and corrections

### Medical target became exact

The broad request `find the medical file` is now an archive target:

```text
IMLI, fund 32, inventory 2, storage unit 37
```

This is discovery progress, not acquisition.

### Synchronous press has an institutional route

NЭБ exposes an exact item for `Вечерняя Москва`, 29 December 1925, no. 296. The issue should enter the next lawful binary pass after Drive deduplication.

### Early poem publication chain is stable

Academic comments consistently identify:

- `Красная газета`, 29 December 1925, no. 314;
- `Вечерняя Москва`, 29 December 1925;
- `Красная нива`, 24 January 1926, no. 4, p. 8 facsimile.

Exact issue binaries/pages remain pending.

### Disputed forensic materials require originals

Search results sharply disagree about the acts and commission. This strengthens, rather than weakens, the rule that the article must cite the acts, full reports and original representation chain rather than choose the most confident polemicist.

## 7. Acquisition priority after this pass

1. NЭБ `Вечерняя Москва`, 29 December 1925, no. 296.
2. NЭБ `Памяти Есенина`, 1926.
3. lawful complete `Сергей Александрович Есенин. Воспоминания`, 1926.
4. `Красная нива`, 1926, no. 4, p. 8.
5. archive request: IMLI f. 32, op. 2, storage unit 37.
6. certificate no. 1037 verified facsimile.
7. original/verified Gorбov and Gilyarevsky acts.
8. full 1992 conclusion no. 2028.
9. complete 1991–1993 commission corpus.
10. hotel/transport records and 27 December power of attorney.

Priority does not override legal access, rights or dignity review.

## 8. Gate result

```yaml
web_search_queries_completed: 40
Drive_exact_searches_completed: 5
institutional_or_academic_shortlist_objects: 14
new_exact_archive_target_found: IMLI f.32 op.2 storage unit 37
Drive_forensic_exact_matches: 0
binaries_downloaded_in_this_pass: 0
binaries_uploaded_to_Drive: 0
item_verified_objects: 0
pirate_or_derivative_objects_accepted_as_master: 0
chapter_15_prose_created: false
public_route_created: false
```

The next legitimate step is lawful binary acquisition and verification, not a smoother death narrative.
