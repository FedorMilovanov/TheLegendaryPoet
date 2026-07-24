# Сергей Есенин, часть I: exact page-witness ledger

Дата: 2026-07-24

Issue: #76

Статус: `TARGETS-IDENTIFIED / SOME-FEB-PAGE-WITNESSES-AVAILABLE / ARCHIVE-FACSIMILES-STILL-REQUIRED / PUBLICATION-NOT-AUTHORIZED`

## Назначение

Этот ledger отделяет четыре разных уровня доказательства, которые нельзя смешивать:

1. `ACADEMIC-TRANSCRIPTION` — академическая публикация текста документа или события;
2. `PUBLISHED-PAGE-WITNESS` — конкретная печатная страница приложения/академического тома;
3. `OBJECT-FACSIMILE` — изображение физического документа или музейного/архивного объекта;
4. `ARCHIVE-ORIGINAL` — оригинал с фондом, описью, единицей хранения и листом.

Наличие HTML-транскрипции или библиографического указателя не разрешает называть объект facsimile. Наличие опубликованного изображения не отменяет проверки provenance, прав и связи изображения с конкретным claim.

## Приоритеты

| Priority | Claim | Current strongest layer | Required next layer |
|---|---|---|---|
| P0 | Официальное название и окончание Спас-Клепиковской школы | Academic transcription + exact printed appendix page identified | Downloadable page witness / object facsimile with page identity |
| P0 | Назначение и служба в военно-санитарном поезде № 143 | Academic transcription + published document images + archive shelfmarks | Exact downloadable images and, for strongest wording, RGIA folio witnesses |
| P0 | Первая публикация Декларации имажинистов | Academic chronology identifies conflicting print sequence | Exact newspaper/journal page witnesses for both publications |
| P1 | Семейные документы Изрядновой/Райх | Academic commentary and chronology | Birth, marriage, divorce and related object/page witnesses |
| P1 | Первые издания 1917–1918 religious/revolutionary texts | Academic texts and edition chronology | Title/contents/cited-page witnesses from first publications |

---

## WIT-YE1-001 — Свидетельство Спас-Клепиковской школы

### Claim boundary

Public prose may state that Есенин studied at and completed the **Спас-Клепиковская второклассная учительская школа духовного ведомства**. It must not silently replace the official institution type with the later/autobiographical shorthand «церковно-учительская школа».

### Academic transcription

- source: ФЭБ / ИМЛИ, `1912: Летопись жизни и творчества С. А. Есенина`;
- URL: `https://feb-web.ru/feb/esenin/el-abc/el1/el1-1311.htm?cmd=p&istext=1`;
- printed context: chronicle page 142;
- document number in the transcription: certificate № 85;
- evidence: school name, study period 1909–1912, completion and grades are transcribed;
- classification: `ACADEMIC-TRANSCRIPTION`;
- limitation: this URL is not the physical certificate image.

### Published page witness target

- source: appendix to Chronicle volume 1;
- contents URL: `https://feb-web.ru/feb/esenin/chronics/el1/el1-411-.htm?cmd=p`;
- exact printed page: **545**;
- appendix description: certificate of completion of the Spas-Klepiki second-class teacher school;
- classification: `PUBLISHED-PAGE-WITNESS-IDENTIFIED`;
- next action: capture the exact page image plus preceding/following page context and edition title/copyright pages.

### Object/archive hold

Before publishing the certificate as an archive object, record:

- holding institution or archive;
- collection/object number;
- whether the published page reproduces the entire recto and/or verso;
- creator/issuer and date;
- dimensions if supplied;
- rights/licence or publication basis;
- original-page and local-derivative SHA-256.

### Claim effect

- textual claim about the official school name: `DRAFTABLE-WITH-ACADEMIC-CITATION`;
- reproduction of the certificate: `HOLD-PENDING-PAGE-AND-OBJECT-PROVENANCE`.

---

## WIT-YE1-002 — Военно-санитарный поезд № 143

### Claim boundary

The controlling documented statement is service in the team of the **Полевой Царскосельский военно-санитарный поезд № 143**. A photograph near or in infirmary № 17 does not by itself establish that infirmary № 17 was the poet's formal unit of assignment.

### Academic chronology and shelfmarks

- source: ФЭБ / ИМЛИ, `1916: Летопись жизни и творчества С. А. Есенина`;
- URL: `https://feb-web.ru/feb/esenin/el-abc/el1/el1-3081.htm?cmd=p&istext=1`;
- the chronology transcribes the 16 April 1916 transfer documents and identifies the later personnel-alphabet entry;
- controlling archive targets include:
  - RGIA, fond 1328, inventory 4, file 24, folio 11 — personnel alphabet entry;
  - RGIA, fond 1328, inventory 4, file 6 — trip reports and route evidence;
  - RGIA, fond 1328, inventory 4, file 20 — train orders;
  - RGIA, fond 1328, inventory 4, file 22, folio 63 — later personnel list;
- classification: `ACADEMIC-TRANSCRIPTION-WITH-ARCHIVE-SHELFMARKS`;
- limitation: the HTML chronology is not the RGIA original.

### Published document-image witnesses

- source page group: `Царское Село. 1916`;
- URL: `https://feb-web.ru/feb/esenin/chronics/el1/el1-669-.htm?cmd=p`;
- exact printed pages and objects:
  - page **672** — notice of 11 February 1916 on transfer to sanitary service;
  - page **673** — notice assigning Есенин to military-sanitary train № 143;
  - page **674** — information on train № 143;
  - pages **688–689** — first pages of reports on the 30th–32nd trips;
  - page **690** — personnel photograph, Chernivtsi, 7 June 1916;
  - page **691** — first page of the report on the 33rd trip;
- contents/index URL: `https://feb-web.ru/feb/esenin/chronics/el1/el1-411-.htm?cmd=p`;
- classification: `PUBLISHED-PAGE-WITNESSES-AVAILABLE`;
- next action: acquire exact page images and edition context; verify whether FEB image URLs expose originals or presentation derivatives.

### Required capture package

For each accepted page:

- canonical FEB page URL;
- image request URL and redirect chain;
- HTTP status, MIME, byte size and dimensions;
- printed page number visible in the scan;
- full-page screenshot and exact image bytes where legally/technically available;
- SHA-256 of source bytes;
- local AVIF/WebP derivative hashes;
- a record of whether the image is a document, photograph or editorial reconstruction.

### Archive-original hold

The strongest wording about the exact personnel entry should remain linked to the RGIA folio. The published Chronicle is enough for carefully attributed drafting, but not for claiming direct inspection of the archive original.

### Claim effect

- service in train № 143: `DRAFTABLE-WITH-ACADEMIC-CITATION`;
- exact personnel-record facsimile: `HOLD-PENDING-RGIA-OR-PUBLISHED-PAGE-CAPTURE`;
- claim that formal service was specifically in infirmary № 17: `REJECT-AS-UNPROVEN`.

---

## WIT-YE1-003 — Декларация имажинистов, publication sequence

### Claim boundary

The publication history is not safely reduced to one unqualified sentence. Academic sources preserve a real sequence problem:

- issue № 4–5 of `Сирена` bears the printed date 30 January 1919 but appears to have been released in April;
- `Советская страна`, № 3, is dated 10 February 1919;
- the academic Complete Works prints the declaration from `Советская страна` while also discussing the `Сирена` state and dating problem.

Until both physical witnesses are collated, public prose must distinguish printed date, probable release date, typesetting state and first actual circulation.

### Academic chronology

- source: ФЭБ / ИМЛИ, `1919: Летопись жизни и творчества С. А. Есенина`;
- URL: `https://feb-web.ru/feb/esenin/el-abc/el2/el2-199-.htm?cmd=p&istext=1`;
- printed context: around page 218;
- classification: `ACADEMIC-CHRONOLOGY-WITH-CONFLICT-NOTE`.

### Academic textual commentary

- source: ФЭБ, PSS volume 7 book 1 commentary;
- URL: `https://feb-web.ru/feb/esenin/texts/e77/e77-357-.htm?cmd=p`;
- commentary identifies both `Сирена` № 4–5 and `Советская страна` № 3 and states that the academic text is printed from the newspaper;
- classification: `ACADEMIC-EDITION-COMMENTARY`.

### Published witness already identified

- source: appendix to Chronicle volume 2;
- contents URL: `https://feb-web.ru/feb/esenin/chronics/el2/el2-449-.htm?cmd=p`;
- exact printed page: **621**;
- object: cover of `Сирена` № 4–5, 1919, which published the declaration;
- classification: `COVER-PAGE-WITNESS-IDENTIFIED`;
- limitation: a cover does not prove the internal declaration pages or actual date of public circulation.

### Required physical witnesses

1. `Советская страна`, Moscow, 10 February 1919, № 3:
   - full newspaper issue or exact declaration page;
   - masthead/date/issue number;
   - declaration text and signatures;
   - library catalogue/object provenance.
2. `Сирена`, Voronezh, № 4–5, 1919:
   - cover/title page with printed date;
   - declaration pages;
   - colophon or external evidence of release date;
   - exact issue provenance.

### Claim effect

- existence and signatories of the declaration: `DRAFTABLE-WITH-ACADEMIC-TEXT`;
- unqualified “first publication was in X”: `HOLD-PENDING-TWO-WITNESS-COLLATION`;
- image of the `Сирена` cover: `HOLD-PENDING-EXACT-PAGE-BYTES-AND-RIGHTS`.

---

## WIT-YE1-004 — Семейные документы

### Current textual evidence

The current source registry contains academic chronology, PSS documentary commentary and named family memoir evidence for Anna Izryadnova, Zinaida Reich and the children.

### Mandatory object targets

- Yuri/Georgy Yesenin birth record;
- marriage record for Sergei Yesenin and Zinaida Reich;
- Tatiana and Konstantin birth records where used;
- divorce/court record;
- exact pages of Anna Izryadnova's memoir and their editorial provenance.

### Boundary

No single reconstructed motive may be assigned to the separation from Izryadnova. Family memory, legal records and later biographical interpretation must remain separate evidence classes.

Status: `ARCHIVE/PAGE-WITNESS-ASSEMBLY-REQUIRED`.

---

## WIT-YE1-005 — First-publication objects for 1917–1918 texts

### Textual corpus already available

Academic texts and comments exist for `Отчарь`, `Октоих`, `Преображение`, `Инония`, `Ключи Марии` and related manuscript plans.

### Required object targets

For each work discussed bibliographically rather than only through close reading:

- first publication/edition title page;
- contents page;
- exact opening and cited pages;
- publisher, place and year;
- catalogue/object page;
- source and derivative hashes for any reproduced page.

### Boundary

Theological evaluation is an interpretation of the project's editors. It must not be presented as a documentary statement of settled personal belief.

Status: `TEXT-READY / EDITION-WITNESSES-REQUIRED`.

---

## Acquisition order

1. FEB school page 545 and its edition/title context;
2. FEB military pages 672–674 and 688–691;
3. FEB Chronicle volume 2 page 621;
4. locate exact `Советская страна` № 3 and internal `Сирена` declaration pages;
5. request or acquire controlling RGIA and family-record facsimiles;
6. first-publication witnesses for selected 1917–1918 works;
7. only after capture: media provenance manifest and local derivatives.

## Acceptance schema for each captured witness

```ts
interface YeseninPageWitness {
  id: string;
  claimIds: readonly string[];
  classification:
    | 'academic-transcription'
    | 'published-page'
    | 'object-facsimile'
    | 'archive-original';
  institution: string;
  editionTitle?: string;
  canonicalUrl: string;
  sourceRequestUrl?: string;
  printedPage?: number;
  archiveShelfmark?: string;
  mime?: string;
  byteSize?: number;
  width?: number;
  height?: number;
  sourceSha256?: string;
  derivativeSha256?: string;
  rightsStatus: 'verified' | 'restricted' | 'unresolved';
  limitations: readonly string[];
}
```

## Publication gate

This ledger does not register the article and does not downgrade any existing HOLD. A future validator must reject:

- a `published-page` without printed-page identity;
- an `object-facsimile` without institution/object provenance;
- an `archive-original` without shelfmark;
- a reproduced image without source hash and rights status;
- a claim whose controlling witness is still marked `HOLD`;
- the public Part I route before the prose/citations/media/QA gates are complete.
