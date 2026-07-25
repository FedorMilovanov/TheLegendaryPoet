# Сергей Есенин, часть I — effective state физических и архивных свидетелей

Дата: 2026-07-25

Статус: `12 HISTORICAL-QUEUE-RECORDS / 2 PHYSICAL-EDITION-OVERLAYS / 4 SERIAL-EVIDENCE-RECORDS / 11 ACTIVE-HOLDS / 10 UNTOUCHED-HOLDS / 1 PARTIALLY-SATISFIED-HOLD / 1 SUPERSEDED-HOLD / 1 STANDALONE-ACQUISITION / HISTORY-PRESERVED / EFFECTIVE-STATE-RESOLVED / UNPUBLISHED / MEDIA-HOLD`

## Зачем нужен отдельный effective-state слой

Pass 6 зафиксировал историческую очередь физических и архивных целей. Позднейшие acquisition-проходы не должны переписывать эту очередь так, будто PDF были доступны с самого начала. Одновременно operational-отчёт не должен продолжать считать уже полученный объект полностью нетронутым.

Current state вычисляется наложением:

- исторические записи остаются неизменными;
- physical-edition records могут полностью supersede только прямо названный HOLD;
- serial evidence может частично закрывать широкий target, сохраняя HOLD активным;
- acquisition без исторического `PW6-*` target остаётся самостоятельным объектом;
- права на републикацию, archive-original status и production authorization не выводятся из факта открытого PDF.

## Точная арифметика

| Слой | Количество |
|---|---:|
| Исторические pass-6 records | 12 |
| Physical-edition acquisition overlays | 2 |
| Typed serial issue evidence records | 4 |
| Эффективно активные исторические HOLD | 11 |
| Полностью нетронутые active HOLD | 10 |
| Частично удовлетворённые active HOLD | 1 |
| Superseded historical HOLD | 1 |
| Standalone acquisition | 1 |
| Просмотренные physical-edition facsimiles | 2 |
| Просмотренные serial issue facsimiles | 4 |
| Всего acquired facsimile objects | 6 |
| Просмотренные archive originals | 0 |
| Объекты с решёнными reproduction rights | 0 |
| Production-authorized objects | 0 |

## Единственный supersession-edge

`PW6-YE1-ISPOVED-1921` сохраняется в исторической очереди со своими исходными `facsimileBytesAcquired=false` и `facsimileVisuallyInspected=false`. Его current status становится `superseded-by-acquisition` только через:

- acquisition ID: `PWA8-YE1-ISPOVED-1921`;
- object ID: `NEB-YE1-ISPOVED-1921`;
- exact PDF bytes: 3 309 388;
- PDF frames: 16;
- verified physical order: `Хулиган` → `Сорокоуст` → `Исповедь хулигана`.

Историческая запись не переписывается: она документирует реальное состояние исследования до acquisition pass.

## Standalone acquisition

`PWA8-YE1-RADUNITSA-1916` / `NEB-YE1-RADUNITSA-1916` не подменяет запись pass 6: отдельного historical HOLD для объекта в typed queue не существовало.

- exact PDF bytes: 49 288 163;
- PDF frames: 35;
- visually inspected: title, verso, composition, contents and selected poem pages;
- `productionAuthorized=false`;
- reproduction rights unresolved.

## Частично удовлетворённый active HOLD

`PW6-YE1-TEATRALNAYA-MOSKVA-1921` остаётся активным, но больше не является untouched target.

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

Effective status: `active-hold-partially-satisfied`.

## 10 полностью нетронутых active HOLD

### Academic basis identified

1. `PW6-YE1-MATERIALY-110`;
2. `PW6-YE1-BENISLAVSKAYA-DIARY-BASIS`.

### Exact objects located, pages not yet collated

3. `PW6-YE1-MARIENGOF-1927`;
4. `PW6-YE1-MARIENGOF-1928`.

### Serial work

5. `PW6-YE1-IZVESTIA-1921-SERIAL`;
6. `PW6-YE1-PRAVDA-1921-11-09`.

### Archive collections located, item-level request required

7. `PW6-YE1-NYPL-DUNCAN-PROGRAM`;
8. `PW6-YE1-NYPL-IRMA-DUNCAN`.

### Civil records requiring request

9. `PW6-YE1-REICH-DIVORCE`;
10. `PW6-YE1-DUNCAN-MARRIAGE`.

## Постоянные границы

- historical queue immutable;
- partial evidence не превращается в false completion;
- acquisition overlay не превращает library scan в archive original;
- `ocrUsedForEvidence=false`;
- `syntheticContentUsed=false`;
- `productionAuthorized=false`;
- reproduction rights unresolved для всех шести acquired facsimile objects;
- effective completion одного target не является publication decision всей статьи;
- public route, sitemap, navigation и media registry этим проходом не меняются.
