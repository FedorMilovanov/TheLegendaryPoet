# Сергей Есенин, часть I — effective state физических и архивных свидетелей

Дата: 2026-07-25

Статус: `12 HISTORICAL-QUEUE-RECORDS / 2 PHYSICAL-EDITION-OVERLAYS / 7 SERIAL-EVIDENCE-RECORDS / 3 ACCESS-INVESTIGATION-RECORDS / 10 ACTIVE-HOLDS / 9 TARGET-UNFULFILLED-HOLDS / 3 ACCESS-INVESTIGATED-HOLDS / 1 PARTIALLY-SATISFIED-HOLD / 2 SUPERSEDED-HOLDS / 1 STANDALONE-ACQUISITION / HISTORY-PRESERVED / EFFECTIVE-STATE-RESOLVED / UNPUBLISHED / MEDIA-HOLD`

## Принцип слоя

Pass 6 остаётся неизменяемой исторической очередью. Позднейшие приобретения и исследования доступа не переписывают старые строки, а образуют typed overlays:

- полное приобретение может supersede только прямо названный historical HOLD;
- частичное serial evidence оставляет широкий HOLD активным;
- access investigation объясняет metadata/route block, но не заменяет требуемые страницы;
- открытый библиотечный PDF не является архивным оригиналом и не решает reproduction rights;
- ни acquisition, ни access record не дают publication или production authorization.

## Точная арифметика

| Слой | Количество |
|---|---:|
| Historical pass-6 records | 12 |
| Physical-edition acquisition overlays | 2 |
| `Театральная Москва` issue records | 4 |
| `Известия` issue records | 3 |
| Всего serial issue evidence records | 7 |
| Mariengof access records | 2 |
| `Правда` access records | 1 |
| Эффективно активные historical HOLD | 10 |
| Active HOLD без удовлетворяющего evidence | 9 |
| Access-investigated active HOLD | 3 |
| Частично удовлетворённый active HOLD | 1 |
| Superseded historical HOLD | 2 |
| Standalone acquisition | 1 |
| Просмотренные physical-edition facsimiles | 2 |
| Просмотренные `Театральная Москва` facsimiles | 4 |
| Просмотренные `Известия` facsimiles | 3 |
| Всего acquired facsimile objects | 9 |
| Просмотренные archive originals | 0 |
| Объекты с решёнными reproduction rights | 0 |
| Production-authorized objects | 0 |

Три access-investigated HOLD входят в девять target-unfulfilled HOLD: исследование доступа не удовлетворяет page-level target.

## Supersession 1 — `Исповедь хулигана`, 1921

Historical row `PW6-YE1-ISPOVED-1921` сохраняет исходные `facsimileBytesAcquired=false` и `facsimileVisuallyInspected=false`.

Текущий статус задаётся только overlay:

- acquisition ID `PWA8-YE1-ISPOVED-1921`;
- object ID `NEB-YE1-ISPOVED-1921`;
- 3 309 388 bytes;
- 16 PDF frames;
- verified order: `Хулиган` → `Сорокоуст` → `Исповедь хулигана`.

## Supersession 2 — три точных выпуска `Известий`, 1921

Historical row `PW6-YE1-IZVESTIA-1921-SERIAL` не изменён. Его исходный target требовал ровно три issue-level объекта и визуальную проверку целевых материалов.

### `NEWS14-YE1-IZVESTIA-NO186`

- дата: 24 августа 1921;
- issue: №186;
- NEB code: `000199_000009_013351165`;
- 52 016 796 bytes;
- 4 PDF frames;
- SHA-256 `c8f83373f17c4c34bb059c624f81b917a2e5d4f4ed636d7735d398fb0789dd79`;
- PDF 01: masthead/date;
- PDF 03: `Наша гостья.`;
- визуально подтверждённая подпись: `А. ЛУНАЧАРСКИЙ`.

Принятая граница: статья современно представляет приезд Дункан, её педагогические идеи и предполагаемую работу/школу в Москве. Она не является административным актом открытия школы и не устанавливает встречу с Есениным.

### `NEWS14-YE1-IZVESTIA-NO251`

- дата: 9 ноября 1921;
- issue: №251;
- NEB code: `000199_000009_013351339`;
- 23 798 944 bytes;
- 2 PDF frames;
- SHA-256 `0e35e292398e6b281c43bd016fd94d62df3981476aa0ed79d4130d987c98ef99`;
- PDF 01: masthead/date;
- PDF 02: `Айседора Дункан. (Первое выступление 7 ноября).`.

Принятая граница: same-week review прямо связывает первое выступление 7 ноября с Академическим Большим театром и даёт художественную оценку. Это не official program, не attendance list и не свидетельство присутствия Есенина.

### `NEWS14-YE1-IZVESTIA-NO263`

- дата: 23 ноября 1921;
- issue: №263;
- NEB code: `000199_000009_013351387`;
- 49 148 667 bytes;
- 4 PDF frames;
- SHA-256 `b3e007bf66bf9efafd103481f2108ba315770627b4df35fa503ad31c241fcdec`;
- PDF 01: masthead/date;
- PDF 04: `Искусство для масс.`;
- визуально подтверждённая подпись: `А. АЙСЕДОРА ДУНКАН`.

Принятая граница: текст формулирует программу искусства для рабочих и детей, московской школы и массового театра. Программное намерение не доказывает формальное открытие, staffing или фактическую работу школы к 23 ноября.

### Acquisition summary

- 3 real official NEB PDFs;
- 124 964 407 bytes;
- 10 PDF frames;
- acquisition artifact SHA-256 `66520651ad99e962e2fd160d2fe606d517f8a9e410dd16c504f50dbe6e7ff206`;
- no catalogue-ID arithmetic;
- no constructed PDF route;
- `ocrUsedForEvidence=false`;
- `productionAuthorized=false`;
- reproduction rights unresolved.

Все три исходных target даты и материалы визуально проверены. Поэтому `PW6-YE1-IZVESTIA-1921-SERIAL` получает `effectiveStatus=superseded-by-acquisition` через три `NEWS14-*` records, а не через изменение historical row.

## Standalone acquisition

`PWA8-YE1-RADUNITSA-1916` / `NEB-YE1-RADUNITSA-1916` остаётся единственным standalone acquisition:

- 49 288 163 bytes;
- 35 PDF frames;
- title/verso/composition/contents/selected poem pages inspected;
- `productionAuthorized=false`;
- reproduction rights unresolved.

## Единственный partially satisfied HOLD

`PW6-YE1-TEATRALNAYA-MOSKVA-1921` остаётся `active-hold-partially-satisfied`.

Issue records:

- `TM11-YE1-NO2`;
- `TM11-YE1-NO7`;
- `TM11-YE1-NO8`;
- `TM11-YE1-NO11-12`.

Получено 4 PDF / 43 100 448 bytes / 94 frames. Подтверждены contemporaneous материалы о Дункан и упоминание Есенина/Клюева, но не изолированы:

- точная официальная программа или объявление вечера 7 ноября;
- item-level record официального открытия школы;
- дипломатические транскрипции для прямого цитирования.

## Access-investigated active HOLD

### Mariengof 1927 — `MA13-YE1-MARIENGOF-1927`

- exact RSL card `01009215492` verified;
- 154 pages/holdings confirmed;
- literal working viewer/PDF route не опубликован;
- route из record ID не реконструирован;
- no facsimile bytes;
- status остаётся `active-hold`.

### Mariengof 1928 — `MA13-YE1-MARIENGOF-1928`

- historical stale locator сохранён;
- operational card corrected to `01009215494`;
- official card → dlib → viewer → API chain verified;
- `accessLevel=restricted`;
- `isAvailable=false`;
- `isDownloadable=false`;
- no facsimile bytes;
- status остаётся `active-hold`.

### `Правда`, 9 ноября 1921 — `PR15-YE1-PRAVDA-1921-11-09`

- historical HOLD: `PW6-YE1-PRAVDA-1921-11-09`;
- official RSL serial parent: `01004548325`;
- 4 official NEB searches without open-access filter;
- 0 literal Moscow central-party issue candidates;
- `Деревенская правда`, `Правда Севера`, `Правда Востока` explicitly rejected;
- no catalogue ID constructed;
- no PDF route constructed;
- artifact SHA-256 `d02149ce5d760cc07014d283faceff3f5e6c051c0d79125f709447b52246dc1c`;
- resolution `no-literal-official-central-moscow-match`;
- status остаётся `active-hold`.

Нужен exact Moscow issue card, reading-room object или authorised copy для 9 ноября 1921 и визуальная проверка релевантной полосы.

## Активный набор после newspaper pass

### Academic basis

1. `PW6-YE1-MATERIALY-110`;
2. `PW6-YE1-BENISLAVSKAYA-DIARY-BASIS`.

### Exact editions / access bounded

3. `PW6-YE1-MARIENGOF-1927`;
4. `PW6-YE1-MARIENGOF-1928`.

### Serial work

5. `PW6-YE1-TEATRALNAYA-MOSKVA-1921` — partial;
6. `PW6-YE1-PRAVDA-1921-11-09` — access investigated, unresolved.

### Archive collections

7. `PW6-YE1-NYPL-DUNCAN-PROGRAM`;
8. `PW6-YE1-NYPL-IRMA-DUNCAN`.

### Civil records

9. `PW6-YE1-REICH-DIVORCE`;
10. `PW6-YE1-DUNCAN-MARRIAGE`.

## Постоянные границы

- historical queue immutable;
- `12 HISTORICAL-QUEUE-RECORDS / 2 PHYSICAL-EDITION-OVERLAYS / 7 SERIAL-EVIDENCE-RECORDS / 3 ACCESS-INVESTIGATION-RECORDS / 10 ACTIVE-HOLDS`;
- `2 SUPERSEDED-HOLDS`;
- access investigation is not page evidence;
- partial evidence does not become false completion;
- search result, catalogue HTML and OCR are not controlling facsimiles;
- library PDF is not an archive original;
- `ocrUsedForEvidence=false`;
- `syntheticContentUsed=false`;
- `productionAuthorized=false`;
- reproduction rights remain unresolved;
- completion of the `Известия` target is not a publication decision;
- public routes, sitemap, navigation and media registry remain unchanged.
