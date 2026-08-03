# Сергей Есенин — institutional archive request pack

**Подготовлено:** 3 августа 2026 года  
**Статус:** `READY-TO-SEND TEMPLATES / NOT SENT / RESPONSES NOT RECEIVED`  
**Scope:** lawful acquisition for Yesenin Part II and December 1925 forensic source gates  
**Public route:** prohibited

## 1. Purpose

This pack standardises archive/library requests so that the project asks for complete, citable and rights-labelled objects rather than isolated screenshots or quotations.

A sent message, invoice or catalogue reply is not an acquired document. After receipt, every object still requires:

```text
identity and archive unit
complete bytes / all pages
first-page or full-image inspection
page/image count and dimensions
file size and MIME
representation type
rights and publication conditions
SHA-256
Drive deduplication and manifest row
```

Do not create `BATCH-0003` until the first received object passes those checks.

---

## 2. Verified institutional routes

### IMLI RAS — Manuscript Department

```yaml
institution: A. M. Gorky Institute of World Literature, Russian Academy of Sciences
unit: Manuscript Department
address: 25A Povarskaya Street, building 1, Moscow
reading_room_days: Monday, Tuesday, Thursday
reading_room_hours: 12:00–17:00
manuscript_department_phone: +7 (495) 691-03-05
general_email: info@imli.ru
official_department_page: https://imli.ru/arkhivnye-i-muzejnye-podrazdeleniya/otdel-rukopisej
official_contacts_page: https://imli.ru/kontakty
archive_portal: https://or.imli.ru/
```

The public site does not expose a clearly readable dedicated copying email in the current text layer. First contact should therefore be an inquiry to `info@imli.ru` and/or the Manuscript Department phone, asking for the current formal procedure, price list, permission form and destination address for a copying request.

### IRLI RAS / Pushkin House — Manuscript Department

```yaml
institution: Institute of Russian Literature (Pushkin House), Russian Academy of Sciences
unit: Manuscript Department
address: 4 Makarov Embankment, Saint Petersburg, 199034
head: Tatyana Sergeevna Tsarkova
copy_request_email: roirli.copy@yandex.ru
general_department_email: roirli@yandex.ru
reading_room_order_email: ro-zakaz@yandex.ru
general_phone: +7 (812) 328-08-02
official_copy_instructions: https://ro.pushkinskijdom.ru/contacts
official_department_page: https://pushkinskijdom.ru/rukopisnyj-otdel/
```

Official instructions say that a copy request is written in free form to the head of the Manuscript Department and includes:

- researcher details;
- research topic;
- intended use: research, publication, illustration, exhibition, etc.;
- archive cipher and storage-unit title;
- signature; a scanned signed application is preferred.

Current official notice: the reading room is closed from **1 July through 1 September 2026**, and new applications have not been accepted since 22 June. Before sending, reconfirm whether copying requests are also paused and the first date on which processing resumes.

### National Electronic Library / Russian State Library

```yaml
institution: National Electronic Library / Russian State Library
purpose: open institutional PDFs and complete issue/book objects
catalogue_item_evening_moscow_1925_296: https://rusneb.ru/catalog/000199_000009_011625583/
direct_pdf_evening_moscow_1925_296: http://dlib.rsl.ru/rsl01011000000/rsl01011625000/rsl01011625583/rsl01011625583.pdf
catalogue_item_memory_of_yesenin_1926: https://rusneb.ru/catalog/000199_000009_007513586/
direct_pdf_memory_of_yesenin_1926: http://dlib.rsl.ru/rsl01007000000/rsl01007513000/rsl01007513586/rsl01007513586.pdf
catalogue_item_red_field_1926_no4: https://rusneb.ru/catalog/000199_000009_012474152/
red_field_1926_collection: https://rusneb.ru/collections/3372_krasnaya_niva_za_1926_god/
rsl_record_evdokimov_memories_1926: https://search.rsl.ru/ru/record/01008951684
```

The current execution environment cannot resolve `dlib.rsl.ru`; direct PDF bytes were not downloaded. These URLs are acquisition targets, not evidence that the files are present locally or in Drive.

---

## 3. Request IMLI-DEC-01 — complete last medical archive unit

### Target

```yaml
archive: IMLI RAS Manuscript Department
fund: 32
inventory: 2
storage_unit: 37
working_identity: last medical history / clinic archive unit of S. A. Yesenin
requested_range: complete unit, including cover, inventory/certification sheets and all surviving pages
```

### Subject

```text
Запрос о порядке получения копий: ИМЛИ, ф. 32, оп. 2, ед. хр. 37 — материалы С. А. Есенина
```

### Request text

```text
В Отдел рукописей ИМЛИ РАН

Уважаемые коллеги!

Я готовлю документально-источниковое исследование жизни и творчества Сергея Александровича Есенина в 1921–1925 годах. Прошу сообщить актуальный порядок ознакомления и получения исследовательских цифровых копий архивной единицы:

ИМЛИ, ф. 32, оп. 2, ед. хр. 37.

По академическим комментариям эта единица связана с последней историей болезни С. А. Есенина. Для корректной источниковедческой работы требуется не отдельный фрагмент, а полный сохранившийся состав единицы: обложка, листы учёта/описания, все медицинские записи, документы поступления и окончания лечения, приложения и обороты листов, если они содержат записи.

Прошу уточнить:

1. точное название и объём единицы хранения;
2. имеются ли ограничения доступа или копирования;
3. возможно ли заказать полный цветной скан без обрезки полей;
4. стоимость, сроки и порядок оплаты;
5. в каком формате предоставляются копии и разрешается ли сохранить архивные имена файлов;
6. условия научного цитирования;
7. требуется ли отдельное разрешение для публикации небольших фрагментов или иллюстраций на некоммерческом культурно-просветительском сайте;
8. существует ли опубликованная или архивная опись, которую следует заказать вместе с материалом;
9. кому и в какой форме направить официальное подписанное заявление.

Цель запроса — научно-редакционная проверка хронологии и границ доступных медицинских документов. До получения полного материала отдельная справка или мемуарный пересказ не будут использоваться как замена истории болезни.

Сведения об исследователе:
ФИО: [ЗАПОЛНИТЬ]
Организация / независимый исследователь: [ЗАПОЛНИТЬ]
Тема: Сергей Есенин. Документальная биография 1921–1925 годов
Контакты: [ЗАПОЛНИТЬ]

С уважением,
[ФИО]
[дата]
```

### Hard stops

- do not say the file has been inspected;
- do not request only the diagnosis page;
- do not use a partial reply as the complete medical file;
- do not publish medical images before rights and dignity review.

---

## 4. Request IMLI-DEC-02 — certificate no. 1037 and treatment-end mechanism

This may be combined with IMLI-DEC-01 only if the archive confirms that both objects are in the same unit. Otherwise request separate identities.

### Subject

```text
Уточнение архивного шифра и запрос копии: удостоверение № 1037 от 28 ноября 1925 года и окончание лечения С. А. Есенина
```

### Required questions

```text
1. Входит ли удостоверение № 1037 от 28 ноября 1925 года в ф. 32, оп. 2, ед. хр. 37?
2. Сохранился ли оригинал удостоверения либо только копия/публикация?
3. Существует ли отдельная запись о прекращении лечения 21 декабря 1925 года: выписка, отпуск, самовольный уход, запись регистра или иная формула?
4. Можно ли получить полный лист с подписями, печатями, оборотом и сопроводительными пометами?
5. Каков точный архивный шифр каждого объекта?
```

Do not insert a proposed discharge theory into the request.

---

## 5. Request IRLI-DEC-01 — final poem autograph

### Pre-inquiry subject

```text
Предварительный запрос архивного шифра и условий копирования автографа «До свиданья, друг мой, до свиданья…» С. А. Есенина
```

### Text

```text
Заведующей Рукописным отделом ИРЛИ РАН
Т. С. Царьковой

Уважаемая Татьяна Сергеевна!

Я готовлю документально-источниковое исследование позднего творчества Сергея Александровича Есенина. Прошу сообщить точный архивный шифр и актуальные условия заказа исследовательской цифровой копии недатированного автографа стихотворения «До свиданья, друг мой, до свиданья…», по которому текст печатается в академическом Полном собрании сочинений.

Прошу уточнить:

1. фонд, опись, единицу хранения и лист;
2. физические размеры, материал и количество сторон/листов;
3. существует ли современная цветная съёмка без ретуши и обрезки;
4. возможно ли заказать полный файл с цветовой шкалой/линейкой, если такая съёмка предусмотрена правилами отдела;
5. стоимость и сроки изготовления;
6. условия научного цитирования;
7. требуется ли отдельное разрешение и оплата для публикации фрагмента или полного изображения на некоммерческом культурно-просветительском сайте;
8. можно ли одновременно получить сведения о provenance документа и ранних поступлениях/публикациях;
9. имеется ли в отделе связанный документ или копия лабораторного заключения № 2028 от 15 июня 1992 года.

Цель использования: научная проверка текста, материального носителя, истории передачи и публикации. Изображение не предназначено для сенсационного или рекламного использования.

Сведения об исследователе:
ФИО: [ЗАПОЛНИТЬ]
Организация / независимый исследователь: [ЗАПОЛНИТЬ]
Тема: Сергей Есенин. Документальная биография 1921–1925 годов
Контакты: [ЗАПОЛНИТЬ]

С уважением,
[ФИО]
[дата]
```

Send only after confirming that copy requests have resumed following the July–August 2026 closure.

---

## 6. Request IRLI-DEC-02 — Ehrlich documents and witness basis

Do not assume the objects are held in IRLI until the department confirms the archive cipher.

### Targets

- original 7 December 1925 telegram/request to V. I. Ehrlich, if held;
- original 27 December power of attorney, including certification;
- original or earliest manuscript/publication basis of Ehrlich's `Четыре дня`;
- archive information for the final-poem transfer account;
- related correspondence or accession notes.

### Pre-inquiry text

```text
Прошу сообщить, хранятся ли в Рукописном отделе ИРЛИ РАН и под какими шифрами следующие материалы, связанные с В. И. Эрлихом и последними ленинградскими днями С. А. Есенина:

— телеграмма/автограф обращения от 7 декабря 1925 года о поиске комнат;
— доверенность от 27 декабря 1925 года, написанная В. И. Эрлихом, подписанная С. А. Есениным и заверенная Ленинградским отделением Союза поэтов;
— рукопись или самый ранний авторский текст воспоминания В. И. Эрлиха «Четыре дня»;
— документы поступления и описания автографа последнего стихотворения.

Для каждого объекта прошу указать фонд, опись, единицу хранения, листы, representation type и порядок заказа полных цифровых копий.
```

---

## 7. NЭБ/RSL manual binary acquisition cards

These cards are for a browser environment that can resolve `dlib.rsl.ru`.

### NЕВ-DEC-01 — `Вечерняя Москва`, 29 December 1925, no. 296

```yaml
catalogue_code: 000199_000009_011625583
catalogue_url: https://rusneb.ru/catalog/000199_000009_011625583/
direct_pdf_url: http://dlib.rsl.ru/rsl01011000000/rsl01011625000/rsl01011625583/rsl01011625583.pdf
provider: RSL through NЭБ
expected_mime: application/pdf
current_project_status: BINARY-PENDING
```

After download:

```text
□ verify `%PDF-` signature and MIME
□ record file size and page count
□ render first page and pages containing Yesenin material
□ preserve original bytes
□ compute SHA-256
□ compare Drive title/URL/SHA
□ add manifest row before upload
```

### NЕВ-DEC-02 — `Памяти Есенина`, 1926

```yaml
catalogue_code: 000199_000009_007513586
catalogue_url: https://rusneb.ru/catalog/000199_000009_007513586/
direct_pdf_url: http://dlib.rsl.ru/rsl01007000000/rsl01007513000/rsl01007513586/rsl01007513586.pdf
pages_expected: 269
current_project_status: BINARY-PENDING
```

Acquire the complete volume once. Do not separately upload chapter-extract PDFs from the same NЭБ object unless an extract has an independently published historical identity.

### NЕВ-DEC-03 — `Красная нива`, 1926, no. 4

```yaml
catalogue_code: 000199_000009_012474152
catalogue_url: https://rusneb.ru/catalog/000199_000009_012474152/
collection_url: https://rusneb.ru/collections/3372_krasnaya_niva_za_1926_god/
needed_page: page 8, early final-poem facsimile
current_project_status: BINARY-PENDING
```

Acquire the complete issue, not only a screenshot of page 8.

### RSL-DEC-04 — Evdokimov memoir collection, 1926

```yaml
record_code: 01008951684
record_url: https://search.rsl.ru/ru/record/01008951684
shelfmark: FB W 119/320
pages_expected: 241 + 2; 6 illustrations
access: full document available in the RSL viewer according to the catalogue
current_project_status: BINARY-PENDING
```

If only fragment ordering is available, request the complete volume or all required named witness chapters with title/copyright/content pages and page-continuity evidence.

---

## 8. Response ledger

For every sent request:

```yaml
request_id:
institution:
recipient:
sent_at:
message_id_or_ticket:
objects_requested:
archive_ciphers:
response_due_or_estimated:
response_received_at:
price:
rights_terms:
copy_scope_confirmed:
payment_status:
files_received:
verification_status:
Drive_manifest_id:
follow_up:
```

Unknown delivery results are checked before retrying. Do not send duplicate requests to several employees of one department on the same day.

## 9. Received-file verification

```text
□ preserve original email/cover letter and invoice
□ preserve original filenames and bytes
□ confirm institution and archive cipher inside metadata/cover letter
□ inspect every page/image and sequence
□ record missing/blank/duplicate pages
□ record colour/grayscale, resolution and dimensions
□ classify ORIGINAL SCAN / VERIFIED FACSIMILE / TRANSCRIPTION / DERIVATIVE
□ compute SHA-256 before optimisation or OCR
□ record publication/illustration permission separately from research access
□ dedupe against both 40-item libraries and every batch
□ upload only after manifest row is complete
```

## 10. Current execution status

```yaml
request_templates_ready: 4
manual_NEB_RSL_cards_ready: 4
requests_sent: 0
responses_received: 0
files_received: 0
item_verified_objects: 0
Drive_batch_created: false
chapter_15_prose_allowed: false
```
