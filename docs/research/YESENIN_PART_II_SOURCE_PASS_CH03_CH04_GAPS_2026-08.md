# Сергей Есенин. Часть II — source pass: gaps глав 3–4

**Дата:** 3 августа 2026 года  
**Статус:** `ACADEMIC/BIBLIOGRAPHIC ROWS PINNED / PRIMARY SCANS AND RIGHTS OPEN / NO PUBLIC ROUTE`  
**Исходный аудит:** `YESENIN_PART_II_PARAGRAPH_SOURCE_AUDIT_CH03_CH04_PASS_01_2026-08.md`

## 1. Цель

Этот pass закрывает или сужает следующие source gaps:

- прибытие в Берлин 11 мая и посещение `Накануне`;
- Дом искусств 12 мая / пресса 14 мая;
- вечер 1 июня в Блютнерзале;
- документ Гржебина 18 мая;
- выезд из Берлина до 21 июня и отсутствие возврата в 1922 году;
- точный опубликованный объект слуха о разводе пары.

Primary newspaper scans, programme binaries and visual rights остаются отдельными gates.

---

## 2. Публичная пара и слух о разводе

### `yes2-public-couple-photo-nyt-1922-08-13`

- **Объект:** фотография Сергея Есенина и Айседоры Дункан, опубликованная в `New York Times`, 13 августа 1922 года.
- **ПСС:** том 7, книга 3, фотография 65.
- **Комментарий:** `https://feb-web.ru/feb/esenin/texts/es7/es7-197-.htm?cmd=p`
- **Класс:** `SYNCHRONOUS NEWSPAPER PHOTO / ORIGINAL IN IMLI / RIGHTS PENDING`.
- **Provenance:** академическое издание воспроизводит оригинал из ИМЛИ.
- **Что доказывает:** совместное публичное изображение пары в международной прессе летом 1922 года.
- **Чего не доказывает:** точный текст слуха о разводе; legal status; свободные права.

### `yes2-false-divorce-caption-world-illustration-1923-no11`

- **Объект:** подпись к той же/связанной фотографии во `Всемирной иллюстрации`, Москва, 1923, № 11, страница 26.
- **Академический комментарий:** `https://feb-web.ru/feb/esenin/texts/es7/es7-197-.htm?cmd=p`
- **Класс:** `SYNCHRONOUS-ERA PRINT RECEPTION / EXACT ISSUE-PAGE PINNED / SCAN PENDING`.
- **Содержание:** подпись представляла Есенина и Дункан супругами и одновременно сообщала, что, `по словам немецких газет`, молодой поэт якобы сбежал и уже развёлся.
- **Что доказывает:** к 1923 году российская иллюстрированная печать распространяла конкретный слух о разрыве, ссылаясь на немецкую прессу.
- **Чего не доказывает:** фактический развод; точный исходный немецкий номер; что эта формула принадлежала `New York Times`.
- **Editorial use:** цитата допускается только после acquisition scan; до этого — точный paraphrase с issue/page.

### `yes2-false-divorce-upstream-german-press`

- **Класс:** `BIBLIOGRAPHIC GAP / HOLD`.
- **Задача:** найти исходные немецкие газеты, на которые ссылалась подпись 1923 года.
- **Граница:** не датировать слух летом 1922 года точнее, чем позволяет найденный upstream object.

### Chapter 3 correction

Без исходного немецкого номера безопасная формула:

> В 1923 году `Всемирная иллюстрация` уже повторяла со ссылкой на немецкие газеты слух, будто Есенин сбежал от Дункан и развёлся. Совместный маршрут и документы брака не подтверждают такой юридический финал.

Не писать:

> Уже летом 1922 года газеты сообщили о состоявшемся разводе.

---

## 3. Берлин: прибытие 11 мая

### `yes2-berlin-arrival-nakanune-1922-05-11`

- **Событие:** прибытие Есенина и Дункан в Берлин 11 мая 1922 года; в тот же день Есенин посетил редакцию `Накануне`.
- **Академический комментарий:** `https://feb-web.ru/feb/esenin/texts/e77/e77-357-.htm?cmd=p`
- **Класс:** `ACADEMIC CHRONOLOGY / CONTEMPORARY PERIODICAL REFERENCES`.
- **Первичные references в комментарии:** `Новая русская книга`, 1922, № 4; редакция `Накануне`.
- **Что допустимо:** дата прибытия и посещение редакции.
- **Что требуется:** exact page/scan `Новой русской книги` № 4 и/или `Накануне`.

### Retired provisional ID

```yaml
retire_from_future_reader_data: yes2-1922-berlin-arrival
replacement: yes2-berlin-arrival-nakanune-1922-05-11
```

---

## 4. Дом искусств, 12 мая / пресса 14 мая

### `yes2-berlin-house-of-arts-nakanune-1922-05-14`

- **Событие:** инцидент в берлинском Доме искусств 12 мая 1922 года.
- **Академический комментарий:** `https://feb-web.ru/feb/esenin/critics/ev2/ev2-361-.htm?cmd=p`
- **Первичный reference:** `Накануне`, Берлин, 14 мая 1922 года.
- **Класс:** `ACADEMICALLY QUOTED SYNCHRONOUS PRESS / PRIMARY SCAN PENDING`.
- **Что устанавливает:** часть публики приветствовала появление пары пением `Интернационала`; возник политический конфликт; Есенин поднялся и читал стихи.
- **Граница:** академически приведённый журналистский рассказ остаётся одной прессовой версией, а не стенограммой.

### `yes2-berlin-house-of-arts-rul-1922`

- **Объект:** реакция правой эмигрантской газеты `Руль` / её хроникера на эпизод.
- **Класс:** `SYNCHRONOUS PRESS TARGET / ISSUE-PAGE-SCAN PENDING`.
- **Что известно:** академический комментарий прямо связывает конфликт с реакцией хроникера `Руля` и части публики.
- **Что не найдено:** exact issue/date/page и полный текст.
- **Editorial use:** только как квалифицированная линия политически противоположной рецепции, без цитаты.

### Retired provisional ID

```yaml
retire_from_future_reader_data: yes2-1922-house-of-arts
replacement:
  - yes2-berlin-house-of-arts-nakanune-1922-05-14
  - yes2-berlin-house-of-arts-rul-1922
```

---

## 5. Блютнерзал, 1 июня 1922 года

### `yes2-berlin-bluthner-1922-06-01`

- **Событие:** литературный вечер `Нам хочется Вам нежно сказать`, Блютнерзал, Берлин, 1 июня 1922 года.
- **Академические комментарии:**
  - `https://feb-web.ru/feb/esenin/texts/es3/es3-435-.htm?cmd=p`
  - `https://feb-web.ru/feb/esenin/texts/e72/e72-566-.htm?cmd=p`
- **Класс:** `ACADEMIC EVENT CHRONOLOGY / CONTEMPORARY ANNOUNCEMENTS AND REPORTS`.
- **Programme reference:** `Накануне`, 25 мая 1922 года, № 49; `оригинальная программа` публиковалась также в других номерах.
- **Completion/reception:** академические комментарии фиксируют состоявшийся нашумевший вечер и пересказ корреспондента рижской газеты `Сегодня`.
- **Что допустимо:** дата, место, название, участие Есенина и чтение материала `Страны Негодяев`.
- **Что требует primary acquisition:** scan `Накануне` № 49, последующие объявления, report `Сегодня`, точный programme and pages.

### Retired provisional ID

```yaml
retire_from_future_reader_data: yes2-1922-bluthner-june1
replacement: yes2-berlin-bluthner-1922-06-01
```

---

## 6. Документ Гржебина, 18 мая

### `yes2-grzhebin-receipt-1922-05-18`

- **Документ:** расписка З. И. Гржебину, 18 мая 1922 года.
- **ПСС:** том 7, книга 2, документ 23, страница 209.
- **Комментарий:** `https://feb-web.ru/feb/esenin/texts/e72/e72-266-.htm?cmd=p`
- **Класс:** `PRIMARY AUTHOR DOCUMENT / COPY IN GLM`.
- **Provenance:** печатается по копии рукой Е. Н. Чеботаревской; ГЛМ, ф. 4, оп. 1, ед. хр. 165, л. 8; копия содержит описание оборотной авторской расписки; местонахождение подлинника требует отдельной проверки.
- **Что допустимо:** дата, издатель, общий договорный/расписочный контекст.
- **Чего не доказывает:** исполнение всех планируемых томов и выплат.

### Canonical mapping

```yaml
existing_canonical_id: yes2-work-grzhebin-contract
focused_document_alias: yes2-grzhebin-receipt-1922-05-18
migration: KEEP yes2-work-grzhebin-contract AS READER CANONICAL; record focused alias in research only
```

Причина: stable registry уже зарезервировал bibliographic object; новый ID не должен создавать duplicate source card.

---

## 7. Выезд из Берлина и отсутствие возврата

### `yes2-berlin-departure-before-1922-06-21`

- **Источник:** текстологический комментарий ПСС, том 2.
- **URL:** `https://feb-web.ru/feb/esenin/texts/es2/es2-255-.htm?cmd=p`
- **Класс:** `ACADEMIC TEXTUAL CHRONOLOGY / PINNED`.
- **Что устанавливает:** в июне, до 21 числа, Есенин выехал из Берлина; в 1922 году туда уже не возвращался.
- **Связующий первичный документ:** письмо из Висбадена 21 июня — `ye2-feb-schneider-1922-06-21`.
- **Граница:** будущий транспортный документ может уточнить день, но не отменяется без нового evidence.

### Retired provisional ID

```yaml
retire_from_future_reader_data: yes2-1922-leave-berlin
replacement:
  - yes2-berlin-departure-before-1922-06-21
  - ye2-feb-schneider-1922-06-21
```

---

## 8. Translation bundle remains split-required

`yes2-work-translation-ledger` остаётся planning bundle, не reader source.

Перед V02 нужны separate objects:

- authorial intention/letter;
- named translator work;
- publisher/bibliographic project;
- physical French edition;
- unrealised English project.

Не закрыто этим pass.

---

## 9. Closure matrix

```yaml
chapter_3_false_divorce_exact_reception_object: CLOSED
chapter_3_upstream_german_press: OPEN
chapter_3_public_couple_press_matrix: PARTIAL
chapter_4_arrival_nakanune: CLOSED_AT_ACADEMIC_REFERENCE_LEVEL
chapter_4_house_of_arts_nakanune: CLOSED_AT_ACADEMIC_QUOTATION_LEVEL
chapter_4_house_of_arts_rul: ISSUE_PAGE_PENDING
chapter_4_bluthner_event: CLOSED_AT_ACADEMIC_EVENT_LEVEL
chapter_4_bluthner_primary_scans: OPEN
chapter_4_grzhebin_provenance: CLOSED
chapter_4_no_return_comment: CLOSED
translation_bundle_split: OPEN
ready_for_v02: PARTIALLY
ready_for_publication: false
```
