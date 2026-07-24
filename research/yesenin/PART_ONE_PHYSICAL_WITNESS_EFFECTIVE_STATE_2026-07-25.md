# Сергей Есенин, часть I — effective state физических и архивных свидетелей

Дата: 2026-07-25

Статус: `12 HISTORICAL-QUEUE-RECORDS / 2 ACQUISITION-OVERLAYS / 11 ACTIVE-HOLDS / 1 SUPERSEDED-HOLD / 1 STANDALONE-ACQUISITION / HISTORY-PRESERVED / EFFECTIVE-STATE-RESOLVED / UNPUBLISHED / MEDIA-HOLD`

## Зачем нужен отдельный effective-state слой

Pass 6 зафиксировал историческую очередь физических и архивных целей. Позднейшие acquisition-проходы не должны переписывать эту очередь так, будто PDF были доступны с самого начала. Одновременно operational-отчёт не должен продолжать считать уже полученный и визуально просмотренный объект активным HOLD.

Поэтому current state вычисляется наложением:

- исторические записи остаются неизменными;
- acquisition records содержат точные байты, SHA-256, число PDF-кадров и inspection state;
- optional `supersedesHoldId` закрывает только указанный прежний HOLD;
- acquisition без `supersedesHoldId` остаётся самостоятельным закрытым физическим объектом;
- права на републикацию, archive-original status и production authorization не выводятся из факта открытого PDF.

## Точная арифметика

| Слой | Количество |
|---|---:|
| Исторические pass-6 records | 12 |
| Acquisition overlays | 2 |
| Эффективно активные исторические HOLD | 11 |
| Superseded historical HOLD | 1 |
| Standalone acquisition | 1 |
| Визуально просмотренные acquired facsimiles | 2 |
| Просмотренные archive originals | 0 |
| Объекты с решёнными reproduction rights | 0 |
| Production-authorized objects | 0 |

## Единственный supersession-edge

`PW6-YE1-ISPOVED-1921` сохраняется в исторической очереди со своими исходными `facsimileBytesAcquired=false` и `facsimileVisuallyInspected=false`. Его текущий operational status становится `superseded-by-acquisition` только через:

- acquisition ID: `PWA8-YE1-ISPOVED-1921`;
- object ID: `NEB-YE1-ISPOVED-1921`;
- exact PDF bytes: 3 309 388;
- PDF frames: 16;
- verified physical order: `Хулиган` → `Сорокоуст` → `Исповедь хулигана`.

Это не означает, что историческая запись была ошибкой. Она документирует реальное состояние исследования до acquisition pass.

## Standalone acquisition

`PWA8-YE1-RADUNITSA-1916` / `NEB-YE1-RADUNITSA-1916` не подменяет запись pass 6: отдельного исторического `PW6-*` HOLD для этого объекта в typed queue не существовало. Поэтому acquisition учитывается отдельно:

- exact PDF bytes: 49 288 163;
- PDF frames: 35;
- visually inspected: title, verso, composition, contents and selected poem pages;
- `productionAuthorized=false`;
- reproduction rights unresolved.

## 11 активных исторических HOLD

### Academic basis identified

1. `PW6-YE1-MATERIALY-110` — физическая страница 110 из «Материалов к биографии»;
2. `PW6-YE1-BENISLAVSKAYA-DIARY-BASIS` — факсимиле дневниковой записи Бениславской.

### Exact objects located, pages not yet collated

3. `PW6-YE1-MARIENGOF-1927` — первое издание «Романа без вранья»;
4. `PW6-YE1-MARIENGOF-1928` — второе издание и контроль вариантов.

### Serial parents located

5. `PW6-YE1-TEATRALNAYA-MOSKVA-1921`;
6. `PW6-YE1-IZVESTIA-1921-SERIAL`.

PR #106 и stacked diagnostic PR #107 уже занимаются issue-level NEB discovery/acquisition. Этот контур не повторяет их работу и не объявляет ещё не принятую page collation завершённой.

### Still unresolved serial

7. `PW6-YE1-PRAVDA-1921-11-09` — точный московский выпуск и страница пока не приняты.

### Archive collections located, item-level request required

8. `PW6-YE1-NYPL-DUNCAN-PROGRAM`;
9. `PW6-YE1-NYPL-IRMA-DUNCAN`.

Finding aid не повышается до прочитанной программы, дневника или отдельного archive item.

### Civil records requiring request

10. `PW6-YE1-REICH-DIVORCE`;
11. `PW6-YE1-DUNCAN-MARRIAGE`.

Академическая публикация поддерживает reader-facing хронологию, но не даёт права показывать подпись, печать или дипломатические особенности невиденного листа.

## Постоянные границы

- historical queue immutable;
- acquisition overlay не превращает library scan в archive original;
- `ocrUsedForEvidence=false`;
- `syntheticContentUsed=false`;
- `productionAuthorized=false`;
- reproduction rights unresolved для обоих acquired PDFs;
- effective completion одного physical target не является publication decision всей статьи;
- public route, sitemap, navigation и media registry этим проходом не меняются.
