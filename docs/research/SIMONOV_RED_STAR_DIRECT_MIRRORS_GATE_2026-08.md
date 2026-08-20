# «Красная звезда» №288, 07.12.1941 — direct-object / mirror gate

Дата прохода: 2026-08-19  
Статус: **exact №288 PDF bytes acquired / p.3 visually inspected / poem boundaries and no-continuation verified / institutional scan cross-check still desirable**

## Цель

После scholarly citation на **с. 3** задача была object-level: получить сам выпуск №288, открыть полосу и не повышать locator/OCR до scan раньше времени.

Этот gate теперь разделяет два разных вопроса:

1. **page-content closure** — получены ли реальные pixels выпуска и что на них видно;
2. **repository/provenance cross-check** — подтверждена ли та же полоса вторым institutional holder.

Первый вопрос по `Красной звезде` №288 теперь закрыт. Второй остаётся полезным независимым контролем, но больше не является основанием писать, будто p.3 вообще не просмотрена.

---

## Direct object acquired — Internet Archive issue PDF

**Internet Archive item:** `no2661212191941`  
**Item page:** https://archive.org/details/no2661212191941

В файловом manifest item присутствует самостоятельный выпуск:

**`Газета «Красная Звезда» №288 от 07 декабря 1941 года.pdf`**

а также исходный JP2 package этого же выпуска.

### Acquisition record

- exact issue PDF: **acquired**;
- HTTP delivery: **200**;
- local byte length: **6 506 121 bytes**;
- PDF pages: **4**;
- SHA-256: **`9e644dd79fd9d22199ec9cef158d2f1a9cf5ce5efbdc60f2eb3e578c8999e229`**;
- inspected: **printed p.3 and following p.4**;
- method: PDF rendered to page images before visual inspection; no OCR was used as a substitute for the page image.

Internet Archive’s item metadata is sufficient to identify the digital file and its issue identity. It does **not** by itself establish the complete archival/microfilm provenance chain of the scan; therefore GPIB/SHPL or Ministry of Defence remains desirable as an independent institutional comparison.

---

## Direct visual inspection — printed p.3

На самой полосе визуально установлено:

- header: **`7 декабря 1941 г., воскресенье, № 288 (5043).`**;
- printed page number: **3**;
- title: **`Сын артиллериста`**;
- subtitle: **`(Фронтовая поэма)`**;
- публикация начинается в нижней части p.3 после горизонтальной отбивки;
- текст занимает **шесть газетных колонок**;
- в крайней правой колонке текст завершается подписью **`К. СИМОНОВ.`**;
- под подписью напечатано **`СЕВЕРНЫЙ ФРОНТ.`**.

### Continuation check

Следующая printed **p.4** также визуально просмотрена. На ней идут другие материалы; продолжения `Сына артиллериста` и continuation marker для поэмы нет.

Следовательно, для центральной публикации 7 декабря object-level установлены:

- exact issue identity;
- exact page;
- начало публикации;
- конец публикации;
- column span;
- author/front signature;
- отсутствие продолжения на следующей полосе.

Это **direct page inspection**, а не вывод из OCR или библиографии.

---

## Route A — ГПИБ / SHPL

**Статус:** institutional cross-check target  
**1941 year node:** https://elib.shpl.ru/ru/nodes/36558-1941

Уже установлено:

- полный комплект 1941: №1–309;
- декабрь: №283–309;
- №288 не фигурирует в published damage notes;
- exact child node всё ещё не surfaced текущему crawler.

После direct IA inspection этот route нужен прежде всего для **independent institutional page-identity/provenance cross-check**, а не для первичного выяснения содержания p.3.

**Priority:** A+ cross-check.

---

## Route B — сайт Министерства обороны России, по путеводителю РНБ

Российская национальная библиотека в официальном путеводителе `Газеты в Сети и вне её` по московской `Красной звезде` сообщает:

- на сайте Министерства обороны России доступна цифровая копия;
- диапазон: **1941, №145 (22 июня) — 1945, №207 (2 сентября)**;
- можно **читать / скачать по номеру (PDF)**.

**RNL guide:**
https://nlr.ru/res/inv/ukazat55/kw_records.php?ids=251968&kw_s=красная+звезда+москва&kw_t=КРАСНАЯ+ЗВЕЗДА+(Москва)

Exact current mil.ru PDF URL №288 поисковым индексом пока не surfaced; file path не угадывается.

**Priority:** A+ institutional cross-check.

---

## Route C — ВБД `Военкор`

**Year page:**
https://vbd-voenkor.ru/izdaniya/krasnaja-zvezda/1941may

Проект показывает отдельные выпуски 1941 года и действия `Читать онлайн` / `Скачать`.

Internal issue ID **не равен номеру газеты**; URL 07.12.1941 нельзя вычислять из соседних ID. Exact issue URL №288 текущему crawler пока не recovered.

**Priority:** B+ comparison route.

---

## Route D — StudMed: декабрьская PDF-подшивка 1941

StudMed каталогизирует:

**`Красная звезда 1941 №283-309 декабрь`**

- PDF;
- **160,87 МБ**;
- диапазон 1–31 декабря 1941.

Exact item page:
https://www.studmed.ru/krasnaya-zvezda-1941-283-309-dekabr_320f186f351.html

Bytes этого monthly file в текущей среде не получены. Это остаётся дополнительным mirror comparison route.

---

## Route E — LibInfo: individual issue metadata

LibInfo каталогизирует exact issue:

**`Газета «Красная звезда» № 288 от 07 декабря 1941 года`**

и даёт собственный byte count **4 258 147 байт**. Этот размер отличается от полученного IA PDF, что нормально для разных цифровых производных и как раз делает второй scan comparison полезным.

Direct LibInfo file URL текущему инструменту не surfaced.

---

## Provenance boundary

Полученный IA PDF теперь годится как **direct visual evidence текста/макета/границ публикации**, потому что сама полоса просмотрена и issue identity напечатана на ней.

Но нельзя из одного mirror автоматически выводить:

- конкретный holding institution оригинала/микрофильма;
- лицензию на перепубликацию facsimile;
- идентичность всех цифровых производных по байтам.

Поэтому:

- **page-content gate: CLOSED**;
- **institutional provenance cross-check: OPEN / desirable**;
- **facsimile reuse-rights gate: OPEN / separate**.

---

# Visual verification checklist

- [x] issue masthead / newspaper identity;
- [x] date: 07.12.1941;
- [x] issue: №288 (5043);
- [x] printed page **3**;
- [x] `Сын артиллериста` visually present;
- [x] subtitle `(Фронтовая поэма)`;
- [x] author line / front signature;
- [x] exact column range: **six columns**;
- [x] начало/конец текста;
- [x] following page checked: **no continuation on p.4**;
- [x] source bytes and SHA recorded;
- [ ] compare a second institutional scan for provenance/page identity;
- [ ] do not republish facsimile until reuse/right status is separately decided.

## Итог

`Красная звезда` №288 больше не является `scan located / page uninspected`. Exact issue PDF получен, p.3 и p.4 визуально просмотрены, а publication geometry зафиксирована на уровне pixels. Следующий institutional scan нужен как provenance/cross-check, **не как условие для утверждения, что центральная публикация 7 декабря находится на p.3 и целиком завершается там**.