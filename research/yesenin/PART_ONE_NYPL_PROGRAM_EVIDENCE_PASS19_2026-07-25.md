# Сергей Есенин, часть I — NYPL program evidence pass 19

Дата фиксации: 25 июля 2026 года.

## Назначение

Проход закрывает только четыре оцифрованных item из коллекции NYPL `Isadora Duncan programs and announcements`. Он не утверждает, что коллекция исчерпана, и не заменяет поиск московской программы 1921 года.

Diagnostic PR №175 закрыт без merge. В canonical переносится только typed evidence ledger; runner-файлы, HTML и JPEG-бинарники не переносятся.

## Доказательный artifact

- exact diagnostic head: `f5f59eef2476c4cc42dcecfc0399a8e41ac7f65b`;
- workflow run: `30169331186`;
- artifact ID: `8622467372`;
- artifact digest: `sha256:7460c3fe44a419c3b24492f9b8693afc3d1e88935a13dd4f5e87973aea4cea89`;
- official public item HTML: 4 объекта / 2 052 546 байт;
- IIIF v3 `info.json`: 15 объектов / 12 424 байта;
- нативные `full/max` JPEG: 15 объектов / 47 724 726 байт.

Для каждого capture проверены:

- literal capture UUID и image ID внутри официального server HTML;
- HTTP 200 и JPEG magic;
- SHA-256;
- размеры из JPEG SOF-маркера;
- точное совпадение размеров JPEG с `info.json`;
- последовательность страниц внутри root item;
- визуальное соответствие item title/date/place.

OCR и синтетическая реконструкция не использовались.

## Item 1 — Carnegie Hall, 15 февраля 1911

- root item UUID: `360acb20-c605-012f-5a1e-58d385a7bc34`;
- capture UUID: `89b93c5d-a42e-99bb-e040-e00a18066f5f`;
- image ID: `1947210`;
- 1 страница;
- New York;
- rights state NYPL: copyright status undetermined.

Визуально подтверждено:

- Carnegie Hall;
- Wednesday afternoon, February 15;
- `Duncan-Damrosch Tour: Symphonic Music and the Dance`;
- портреты и имена Айседоры Дункан и Уолтера Дамроша;
- New York Symphony Orchestra.

Страница не относится к Москве, 1921 году, Есенину, первой встрече или русской школе Дункан.

## Item 2 — `Idilli alla Danza`, Триест

- root item UUID: `300e71f0-26fa-0137-efbc-2b3acc82e3f4`;
- 4 captures;
- дата карточки: `1903 (inferred)`;
- место: Trieste;
- rights state: public domain по праву США; международный статус NYPL не определён.

Визуально подтверждено:

- страница 1: `Idilli alla Danza eseguiti da Miss Isadora Duncan` и программа;
- страница 2: портрет и итальянский текст;
- страницы 3–4: продолжение текста и типографская строка Триеста.

Дата 1903 остаётся каталогически реконструированной и не представляется как отдельно напечатанная на листе дата.

## Item 3 — Teatro Costanzi, Рим, 22 апреля 1912

- root item UUID: `ee239660-26fa-0137-bad9-0f2615afff59`;
- 6 captures;
- напечатанная дата: 22 апреля 1912;
- rights state: public domain по праву США; международный статус NYPL не определён.

Визуально подтверждено:

- страница 1: Teatro Costanzi, Roma; Monday 22 April 1912, 9 p.m.; Miss Isadora Duncan; танцы и хоры из `L’Iphigénie` Глюка;
- страница 2: программа;
- страницы 3–6: французские тексты о Дункан и искусстве танца;
- последняя страница: имя Isadora Duncan и сведения о билетах.

## Item 4 — Teatro Costanzi, Рим, 25 апреля 1912

- root item UUID: `512a89d0-26fb-0137-a8bb-47c28987601e`;
- 4 captures;
- напечатанная дата: 25 апреля 1912;
- rights state: public domain по праву США; международный статус NYPL не определён.

Визуально подтверждено:

- страница 1: Teatro Costanzi; Thursday 25 April 1912, 9 p.m.; Miss Isadora Duncan; `Orfeo`;
- страницы 2–3: описание последовательных танцев;
- страница 4: завершающий лист с римской типографской строкой.

## Главный отрицательный результат

Ни один из четырёх оцифрованных NYPL item не является:

- московской программой 1921 года;
- документом открытия школы Дункан в Москве;
- списком присутствовавших на спектакле;
- свидетельством первой встречи Дункан и Есенина;
- русской афишей или программой.

Следовательно, pass 19 закрывает ошибочную надежду на эти четыре UUID, но не закрывает широкий коробочный фонд примерно из 110 единиц.

## Rights и production boundary

- один item: NYPL не смогла определить copyright status;
- три item: public domain только по праву США, международный статус не определён;
- оригинальные JPEG сохранены только в временном диагностическом artifact;
- production localization, derivatives и публикационное разрешение отсутствуют;
- `productionAuthorized = false` для 4/4 items и 15/15 captures.

## Следующий A+ target

Найти фактическую московскую/русскую программу 1921 года, школьный административный документ или contemporaneous first-meeting witness. Четыре digitized NYPL item эту задачу не выполняют.

Статья и companion остаются неопубликованными и незарегистрированными.
