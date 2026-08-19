# «Красная звезда», 7 декабря 1941 — ГПИБ / SHPL institutional cross-check gate

Дата прохода: 2026-08-19  
Статус: **complete 1941 SHPL corpus verified / global p.3 content direct-verified via exact №288 PDF / exact SHPL child node and institutional comparison pending**

Связанные файлы:
- `SIMONOV_SON_ARTILLERISTA_NEWSPAPER_OBJECT_GATE_2026-08.md`
- `SIMONOV_RED_STAR_PAGE_3_SCHOLARLY_GATE_2026-08.md`
- `SIMONOV_RED_STAR_DIRECT_MIRRORS_GATE_2026-08.md`
- `SIMONOV_SON_ARTILLERISTA_SOURCE_ADDENDUM_2026-08.md`

## Зачем этот gate теперь нужен

Изначально ГПИБ / SHPL был главным direct-scan target: корпус 1941 года был подтверждён, scholarly bibliography уже указывала **с. 3**, но сама полоса №288 редакцией ещё не была просмотрена.

Этот глобальный page-content gap **закрыт 19 августа 2026 года другим direct object**: exact standalone PDF выпуска `Красной звезды` №288 от 07.12.1941 был получен из Internet Archive item `no2661212191941`, захеширован и визуально проверен на printed p.3 и p.4.

Поэтому SHPL gate больше нельзя формулировать как `p.3 uninspected`. Его правильная роль теперь — **independent institutional provenance/page-identity cross-check**.

---

## 1. Root authority — газета «Красная звезда»

**ГПИБ, родительский объект:**  
https://elib.shpl.ru/ru/nodes/25135-krasnaya-zvezda-tsentralnyy-organ-ministerstva-oborony-rossiyskoy-federatsii-m-1924-ezhedn

Object id: **25135**.

---

## 2. 1941 год — полный комплект

**ГПИБ year node:**  
https://elib.shpl.ru/ru/nodes/36558-1941

Object id: **36558**.

Metadata фиксирует:

- год: **1941**;
- **№ 1 (1 января) — № 309 (31 декабря)**;
- декабрь: **№ 283–309**;
- №288 не отмечен в опубликованном списке повреждённых выпусков/страниц;
- большинство номеров отреставрировано.

### Что закрыто

ГПИБ институционально подтверждает цифровой корпус и диапазон, содержащий нужный №288.

### Что остаётся SHPL-specific

- exact SHPL child-node URL №288;
- просмотр **именно SHPL-копии** p.3;
- comparison её page identity/geometry с уже inspected direct PDF;
- provenance цифровой копии, если SHPL UI её сообщает.

Это **не** означает, что p.3 в целом остаётся непросмотренной.

---

## 3. Уже закрытый global page-content result

Direct-object gate фиксирует exact PDF:

`Газета «Красная Звезда» №288 от 07 декабря 1941 года.pdf`

Internet Archive item: **`no2661212191941`**  
SHA-256: **`9e644dd79fd9d22199ec9cef158d2f1a9cf5ce5efbdc60f2eb3e578c8999e229`**.

На pixels printed p.3 установлено:

- `7 декабря 1941 г., воскресенье, № 288 (5043)`;
- printed page **3**;
- `Сын артиллериста`;
- `(Фронтовая поэма)`;
- **шесть газетных колонок**;
- конец с `К. СИМОНОВ.` / `СЕВЕРНЫЙ ФРОНТ.`;
- following printed p.4 просмотрена и продолжения поэмы не содержит.

Следовательно, **global Red Star page-content gate is closed**. SHPL нужен как второй, institutional holder-level контроль.

---

## 4. Independent scholarly control

**Военно-исторический журнал** (`Издание Министерства обороны России`) в статье Е. Ю. Колобова, примечание 39, даёт:

`Симонов К. Сын артиллериста (фронтовая поэма) // Красная звезда. 1941. 7 декабря. С. 3.`

Scholarly locator теперь не заменяет scan и не ждёт scan для своего подтверждения: он **независимо совпал с direct visual result**.

---

## 5. Почему exact SHPL child-node ID всё ещё нельзя угадывать

Exact child node остаётся:

**unknown / discover, do not infer**.

Внутренний node ID платформы не равен номеру газеты и не вычисляется по соседним узлам. Даже если guessed URL случайно открывается, comparison gate требует подтвердить breadcrumb/title/date самого объекта.

---

## 6. SHPL comparison checklist

После обнаружения exact child node №288:

- [ ] подтвердить breadcrumb `Красная звезда > 1941 > декабрь`;
- [ ] подтвердить issue **№288 (5043), 07.12.1941**;
- [ ] открыть **SHPL p.3**;
- [ ] сопоставить title/subtitle с direct PDF;
- [ ] сопоставить **six-column** geometry;
- [ ] сопоставить конец `К. СИМОНОВ. / СЕВЕРНЫЙ ФРОНТ.`;
- [ ] проверить following page на отсутствие continuation;
- [ ] записать stable SHPL object/viewer URL;
- [ ] сохранить provenance metadata, если она дана holder’ом;
- [ ] reuse/licence facsimile решать отдельно.

OCR SHPL может использоваться только для навигации к page image.

---

## 7. Редакционная формулировка сейчас

Безопасно:

> ГПИБ хранит полный цифровой комплект `Красной звезды` за 1941 год, включая декабрь №283–309. Сам выпуск №288 уже независимо получен и визуально проверен по direct PDF: `Сын артиллериста` находится на p.3, занимает шесть колонок и заканчивается на этой полосе; p.4 продолжения не содержит. Exact SHPL child object остаётся нужен для institutional provenance/page-identity cross-check.

Нельзя:

> `SHPL p.3 уже просмотрена редакцией`.

пока exact SHPL child/page действительно не открыт.

И нельзя из наличия direct PDF выводить, что facsimile автоматически свободно для перепубликации.

---

## 8. Приоритет после page closure

1. **ГПИБ / SHPL exact №288** — institutional page/provenance comparison;
2. Ministry of Defence individual PDF route — второй institutional comparison;
3. scholarly citation — independent bibliographic corroboration;
4. Internet Archive exact PDF — уже inspected direct page-content object;
5. другие mirrors — только дополнительное сравнение.

Для `Патриота Родины` 03.12.1941 этот closure ничего автоматически не решает.

## Итог

SHPL gate не удалён и не «засчитан по чужой ссылке»: он **правильно понижен из global page blocker в holder-specific institutional cross-check**. Центральная p.3 уже direct-verified по exact №288 PDF; exact SHPL child node и сравнение его копии остаются открытыми без выдуманных ID.