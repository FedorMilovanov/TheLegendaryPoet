# «Красная звезда» №288, 07.12.1941 — direct-scan mirror map

Дата прохода: 2026-08-18  
Статус: **multiple actual scan/download routes recovered / exact issue bytes still not acquired in current toolchain**

## Цель

После того как scholarly citation локализовал `Сына артиллериста` на **с. 3**, задача изменилась: нам больше не нужен ещё один пересказ даты. Нужен **сам scan выпуска №288**.

Этот файл фиксирует все найденные маршруты, где существуют реальные сканы/файлы, и ранжирует их по надёжности. Ни один route не считается `direct object inspected`, пока bytes или page image не открыты редакцией.

---

## Route A — ГПИБ / SHPL

**Статус:** institutional direct-scan target  
**1941 year node:** https://elib.shpl.ru/ru/nodes/36558-1941

Уже установлено:

- полный комплект 1941: №1–309;
- декабрь: №283–309;
- №288 не фигурирует в published damage notes;
- exact child node всё ещё не surfaced текущему crawler.

**Priority:** A+.

---

## Route B — сайт Министерства обороны России, по путеводителю РНБ

Российская национальная библиотека в официальном путеводителе `Газеты в Сети и вне её` по московской `Красной звезде` прямо сообщает:

- на сайте Министерства обороны России доступна цифровая копия;
- диапазон: **1941, №145 (22 июня) — 1945, №207 (2 сентября)**;
- формат: сканированный микрофильм/цифровой выпуск;
- можно **читать / скачать по номеру (PDF)**;
- есть поиск по тексту внутри номеров.

**RNL guide:**
https://nlr.ru/res/inv/ukazat55/kw_records.php?ids=251968&kw_s=красная+звезда+москва&kw_t=КРАСНАЯ+ЗВЕЗДА+(Москва)

### Значение

№288 от 07.12.1941 входит в указанный официальный диапазон. Это потенциально **лучший direct PDF route**, потому что source authority — сайт Минобороны.

### Ограничение текущего прохода

Exact current mil.ru PDF URL выпуска №288 поисковым индексом не surfaced. Нельзя угадывать file path.

**Priority:** A+ direct official target.

---

## Route C — ВБД `Военкор`

**Year page:**
https://vbd-voenkor.ru/izdaniya/krasnaja-zvezda/1941may

Проект показывает отдельные выпуски `Красной звезды` 1941 года и для каждого предоставляет две действия:

- `Читать онлайн`;
- `Скачать`.

На первой странице списка конца декабря exact issue pages имеют собственные URL. Например, click по 31.12.1941 раскрывает URL pattern с реальным issue ID, а выпуск 24.06.1941 также существует как отдельный issue object.

### Важная граница

Internal issue ID **не равен номеру газеты**. Для 07.12.1941 нельзя вычислять URL из ID соседних выпусков. Нужно получить issue link из каталога/поиска.

Текущий crawler не закэшировал page 2 year-list, где ожидается начало/середина декабря, поэтому exact issue URL №288 пока не recovered.

**Priority:** B+ delivery/direct-scan mirror.

---

## Route D — StudMed: декабрьская PDF-подшивка 1941

**Collection page:**
https://www.studmed.ru/science/istoricheskie-discipliny/istoriya-rossii/nir/sources/periodic/krasnaya-zvezda

StudMed каталогизирует отдельный PDF:

**`Красная звезда 1941 №283-309 декабрь`**

- формат: **PDF**;
- размер: **160,87 МБ**;
- добавлен: 08.11.2012;
- диапазон: 1–31 декабря 1941;
- издательство: Народный комиссариат обороны СССР.

Click из коллекции раскрывает exact item page:

`https://www.studmed.ru/krasnaya-zvezda-1941-283-309-dekabr_320f186f351.html`

### Значение

Это конкретный monthly PDF, внутри которого точно должен находиться №288 по заявленному диапазону. После acquisition можно:

1. открыть оглавление/страницы вокруг 7 декабря;
2. найти №288;
3. перейти к газетной с.3;
4. визуально сверить заголовок, колонки и continuation.

### Ограничение

Текущий web fetch exact item page дал `Cache miss`, а bytes не были получены. StudMed — не institutional archive, поэтому даже после scan inspection provenance страницы желательно cross-check с ГПИБ/Минобороны.

**Priority:** B acquisition mirror, A-level visual corroboration только после comparison с institutional object.

---

## Route E — LibInfo: individual issue file metadata

LibInfo каталогизирует:

**`Газета «Красная звезда» № 288 от 07 декабря 1941 года`**

и даёт exact byte count:

**4 258 147 байт**.

Каталог также последовательно показывает №287 от 06.12.1941 и №289 от 09.12.1941, что дополнительно подтверждает identity нужного object.

### Ограничение

Search index показывает item metadata, но direct file/download URL не surfaced текущему инструменту.

**Priority:** B mirror/byte fingerprint lead.

---

## Route F — не использовать как evidence authority, но полезно для acquisition comparison

RNL guide также отмечает существование широко распространённой полной цветной цифровой копии `Красной звезды` почти за весь период войны, происхождение которой самой РНБ **достоверно не известно**. Такие копии встречаются на специализированных сайтах/трекерах.

Эту линию можно использовать только как резервный способ **найти pixels**, после чего pixels должны быть сверены с institutional scan.

Нельзя ссылаться на такую копию как на authority источника.

---

# Новый acquisition order

1. **Ministry of Defence direct issue PDF** — найти current official URL для №288;
2. **GPIB/SHPL exact child node** — открыть p.3;
3. **VBD Voenkor individual issue** — recovered issue URL → read/download;
4. **StudMed Dec 1941 PDF** — скачать 160.87 MB monthly file;
5. **LibInfo individual bytes** — recovered file link;
6. unknown-provenance mirrors — только для pixel comparison.

---

# Visual verification checklist после получения любого scan

- [ ] issue masthead: `Красная звезда`;
- [ ] date: 07.12.1941;
- [ ] issue: №288 (5043), если printed;
- [ ] printed page **3**;
- [ ] `Сын артиллериста` visually present;
- [ ] author line / byline;
- [ ] exact column range;
- [ ] title/subtitle typography;
- [ ] начало/конец текста;
- [ ] continuation marker, если есть;
- [ ] compare at least one second scan/mirror for page identity;
- [ ] record source URL, source bytes/SHA where lawful/possible;
- [ ] do not republish facsimile until reuse/right status is separately decided.

## Итог

Direct-object hunt теперь имеет **не один, а минимум пять конкретных scan routes**. Самое важное новое обстоятельство: официальный путеводитель РНБ прямо говорит, что сайт Минобороны позволяет скачивать `Красную звезду` **по отдельным номерам PDF** за весь нужный период, а StudMed даёт exact monthly PDF page для декабря 1941 года. Осталось получить bytes конкретного №288 и визуально сверить уже известную target page — **с. 3**.