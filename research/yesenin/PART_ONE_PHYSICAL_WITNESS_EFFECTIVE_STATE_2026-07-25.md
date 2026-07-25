# Сергей Есенин, часть I — effective state физических и архивных свидетелей

Дата: 2026-07-25

Статус: `12 HISTORICAL-QUEUE-RECORDS / 2 PHYSICAL-EDITION-OVERLAYS / 4 SERIAL-EVIDENCE-RECORDS / 2 ACCESS-INVESTIGATION-RECORDS / 11 ACTIVE-HOLDS / 10 TARGET-UNFULFILLED-HOLDS / 2 ACCESS-INVESTIGATED-HOLDS / 1 PARTIALLY-SATISFIED-HOLD / 1 SUPERSEDED-HOLD / 1 STANDALONE-ACQUISITION / HISTORY-PRESERVED / EFFECTIVE-STATE-RESOLVED / UNPUBLISHED / MEDIA-HOLD`

## Зачем нужен отдельный effective-state слой

Pass 6 зафиксировал историческую очередь физических и архивных целей. Позднейшие проходы не должны переписывать эту очередь так, будто PDF, правильный locator или viewer state были известны с самого начала. Одновременно operational-отчёт обязан различать:

- полностью приобретённый и визуально проверенный объект;
- частично удовлетворённый широкий target;
- исследованный доступ, который не дал факсимиле;
- полностью нетронутый target.

Current state вычисляется наложением:

- historical records остаются неизменными;
- physical-edition records могут полностью supersede только прямо названный HOLD;
- serial evidence может частично закрывать широкий target, сохраняя HOLD активным;
- access investigation может исправить metadata или зафиксировать серверную блокировку, не удовлетворяя page-level target;
- acquisition без historical `PW6-*` target остаётся самостоятельным объектом;
- права на републикацию, archive-original status и production authorization не выводятся из карточки, viewer metadata или открытого PDF.

## Точная арифметика

| Слой | Количество |
|---|---:|
| Historical pass-6 records | 12 |
| Physical-edition acquisition overlays | 2 |
| Typed serial issue evidence records | 4 |
| Typed Mariengof access records | 2 |
| Эффективно активные historical HOLD | 11 |
| Active HOLD без удовлетворяющего target evidence | 10 |
| Access-investigated active HOLD | 2 |
| Metadata-corrected historical HOLD | 1 |
| Viewer-API download-blocked object | 1 |
| Unresolved published viewer route | 1 |
| Частично удовлетворённый active HOLD | 1 |
| Superseded historical HOLD | 1 |
| Standalone acquisition | 1 |
| Просмотренные physical-edition facsimiles | 2 |
| Просмотренные serial issue facsimiles | 4 |
| Всего acquired facsimile objects | 6 |
| Просмотренные archive originals | 0 |
| Объекты с решёнными reproduction rights | 0 |
| Production-authorized objects | 0 |

Два access-investigated HOLD входят в десять target-unfulfilled HOLD: исследование доступа не заменяет требуемое постраничное чтение.

## Единственный supersession-edge

`PW6-YE1-ISPOVED-1921` сохраняется в historical queue со своими исходными `facsimileBytesAcquired=false` и `facsimileVisuallyInspected=false`. Его current status становится `superseded-by-acquisition` только через:

- acquisition ID: `PWA8-YE1-ISPOVED-1921`;
- object ID: `NEB-YE1-ISPOVED-1921`;
- exact PDF bytes: 3 309 388;
- PDF frames: 16;
- verified physical order: `Хулиган` → `Сорокоуст` → `Исповедь хулигана`.

Historical record не переписывается: он документирует состояние исследования до acquisition pass.

## Standalone acquisition

`PWA8-YE1-RADUNITSA-1916` / `NEB-YE1-RADUNITSA-1916` не подменяет pass-six record: отдельного historical HOLD для этого объекта в typed queue не существовало.

- exact PDF bytes: 49 288 163;
- PDF frames: 35;
- visually inspected: title, verso, composition, contents and selected poem pages;
- `productionAuthorized=false`;
- reproduction rights unresolved.

## Частично удовлетворённый active HOLD

`PW6-YE1-TEATRALNAYA-MOSKVA-1921` остаётся активным с `effectiveStatus=active-hold-partially-satisfied`.

Связанные issue records:

- `TM11-YE1-NO2` — №2, 1–3 ноября 1921;
- `TM11-YE1-NO7` — №7, 15–17 ноября 1921;
- `TM11-YE1-NO8` — №8, 18–20 ноября 1921;
- `TM11-YE1-NO11-12` — №11–12, 29 ноября — 4 декабря 1921.

Получено и визуально проверено:

- 4 real PDFs;
- 43 100 448 bytes;
- 94 PDF frames;
- материал «Айседора Дункан о Москве» в №2;
- contemporaneous reception вечера 7 ноября и «Спор о Дункан» в №7;
- последующая критическая рецепция Дункан после вечера 11 ноября в №8;
- упоминание Есенина и Клюева в «Литературной богеме Москвы!» в №11–12.

Historical target не superseded, потому что ещё не изолированы:

- точная официальная программа или объявление вечера 7 ноября;
- объявление либо item-level record официального открытия школы Дункан;
- дипломатические транскрипции страниц для прямого цитирования.

## Два access-investigated active HOLD

### `PW6-YE1-MARIENGOF-1927`

Overlay: `MA13-YE1-MARIENGOF-1927`.

- exact RSL card `01009215492` verified;
- 154 pages and holdings confirmed;
- card claims full open viewer access;
- literal reader anchor remains `href="#"`;
- published client code only copies a missing `data-read-url`;
- no institution-published working viewer/PDF route was accepted;
- no route was reconstructed from the record ID;
- effective status remains `active-hold`.

### `PW6-YE1-MARIENGOF-1928`

Overlay: `MA13-YE1-MARIENGOF-1928`.

Historical locator `01009198586` remains visible in pass 6, while the overlay corrects the operational object to official RSL card `01009215494`.

Verified literal chain:

- Search RSL card view URL;
- dlib replacement rule;
- viewer `https://viewer.rsl.ru/rsl01009215494`;
- official distributed viewer API contract;
- `/api/v1/document/rsl01009215494/info` HTTP 200;
- viewer page count 172;
- `accessLevel=restricted`;
- `isAvailable=false`;
- `isDownloadable=false`;
- `downloadableFormats=[]`.

No PDF bytes were acquired. The second-edition target remains `active-hold`; direct page-level comparison with 1927 remains unresolved.

## Остальные восемь active HOLD без нового access/evidence overlay

### Academic basis identified

1. `PW6-YE1-MATERIALY-110`;
2. `PW6-YE1-BENISLAVSKAYA-DIARY-BASIS`.

### Serial work

3. `PW6-YE1-IZVESTIA-1921-SERIAL`;
4. `PW6-YE1-PRAVDA-1921-11-09`.

### Archive collections located, item-level request required

5. `PW6-YE1-NYPL-DUNCAN-PROGRAM`;
6. `PW6-YE1-NYPL-IRMA-DUNCAN`.

### Civil records requiring request

7. `PW6-YE1-REICH-DIVORCE`;
8. `PW6-YE1-DUNCAN-MARRIAGE`.

## Постоянные границы

- `12 HISTORICAL-QUEUE-RECORDS / 2 PHYSICAL-EDITION-OVERLAYS / 4 SERIAL-EVIDENCE-RECORDS / 11 ACTIVE-HOLDS`;
- historical queue immutable;
- locator correction is an overlay, not a silent historical rewrite;
- access investigation is not page evidence;
- partial evidence does not become false completion;
- library scan is not an archive original;
- `ocrUsedForEvidence=false`;
- `syntheticContentUsed=false`;
- `productionAuthorized=false`;
- reproduction rights remain unresolved for all acquired facsimiles and access-inspected objects;
- completion of one target is not a publication decision for the article;
- public route, sitemap, navigation and media registry remain unchanged.
