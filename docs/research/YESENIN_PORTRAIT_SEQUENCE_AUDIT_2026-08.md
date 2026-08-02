# Сергей Есенин — portrait sequence audit

**Дата:** 2 августа 2026 года  
**Источник файлов:** Google Drive, `APPROVED CORE POET PORTRAITS 45`  
**Rights manifest:** `PORTRAITS 45 — MANIFEST RIGHTS SHA256.zip`  
**Scope:** выбрать не «пять лучших фотографий вообще», а возрастную и сюжетную последовательность для двухчастной биографии

## Общий вывод

Пять Drive-файлов дают полезный каркас:

- один ранний портрет 1914 года;
- две групповые фотографии 1916 года;
- один бакинский кадр 1924 года;
- один поздний портрет 1925 года.

Они не закрывают весь визуальный ряд. Для Part I всё ещё нужны семья, Константиново, Спас-Клепики, Москва/Сытин, Блок, война, первые издания и имажинистская документация. Для Part II нужны Дункан, европейский/американский маршрут, Бениславская, Кавказ, первые издания 1922–1925 годов, Софья Толстая и точные документы последних месяцев.

---

## YES-P01 — Сергей Есенин, 1914

```yaml
file: "01__Esenin1914.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:Esenin1914.jpg"
identity: "Сергей Есенин"
visible_date: "1914"
dimensions: "570×606"
bytes: 67529
sha256: "1f4f3d25719582dedd54c7804c4b438136e943730526b75ec1437f8fcf73dfe6"
license: "Public domain / PD-RusEmpire"
photographer: "not identified in machine-readable metadata"
source_status: "Commons page lacks machine-readable original source"
article_assignment: "YESENIN PART I"
placement: "right / portrait"
```

### Визуальная функция

Ранний взрослый Есенин до петербургской славы. Поза не официально-парадная: поэт сидит, опираясь на спинку стула. Хорошо работает после московского раздела или перед первым приездом к Блоку.

### Граница подписи

Безопасно:

> Сергей Есенин. 1914.

Не добавлять имя фотографа или место съёмки без отдельного источника. Поле `date` в локальном manifest ошибочно содержит время загрузки файла в Commons (2021), поэтому production должна брать 1914 из описания/карточки, а не из технического manifest date.

**Статус:** `SHORTLIST-A / SOURCE-DETAIL-PENDING`.

---

## YES-P02 — Сергей Есенин, 1925

```yaml
file: "02__Esenin1925.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:Esenin1925.jpg"
identity: "Сергей Есенин"
visible_date: "1925"
dimensions: "1469×2000"
bytes: 205362
sha256: "304ad74866a4883d789f6fef602e810d82d122ef482515bb0a901cf24ab27170"
license: "Public domain"
photographer: "not identified in machine-readable metadata"
article_assignment: "YESENIN PART II"
placement: "right / portrait; possible late-period full visual if not overused"
```

### Визуальная функция

Сильный ясный поздний портрет. Подходит для перехода к 1925 году или к последнему крупному творческому периоду, но не должен автоматически становиться иллюстрацией смерти.

### Metadata warning

Commons caption добавляет, что портрет сделан «незадолго до самоубийства», но карточка не даёт точной даты съёмки, подтверждающей это уточнение. Безопасная production-подпись:

> Сергей Есенин. 1925.

Не писать «последний портрет» и «незадолго до смерти» без более сильного датирующего источника.

Поле manifest `date` снова содержит дату загрузки в Commons, а не дату снимка.

**Статус:** `SHORTLIST-A / PHOTOGRAPHER-SOURCE-PENDING`.

---

## YES-P03 — Сергей Есенин и Сергей Городецкий, 1916

```yaml
file: "03__1916. Сергей Есенин и Сергей Городецкий.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:1916._Сергей_Есенин_и_Сергей_Городецкий.jpg"
identity: "Сергей Есенин и Сергей Городецкий"
date: "1916"
dimensions: "1280×1854"
bytes: 620262
sha256: "1001adea97744c876d8dd599d918e55eba0befd0dc8f0006ad0b9bbc4f065c3b"
license: "Public domain"
photographer: "unknown"
source_in_commons: "picturehistory.livejournal.com"
article_assignment: "YESENIN PART I"
placement: "right / portrait or full if contextual room details are discussed"
```

### Визуальная функция

Это не просто «портрет рядом со знаменитостью»: интерьер, книги и гармонь показывают литературно-бытовую среду. В Part I кадр может сопровождать раздел о петербургском круге и формировании публичного образа.

### Граница

Текущая Commons-карточка опирается на вторичную публикацию и не называет фотографа. Перед production желательно найти музейную/академическую карточку или раннее печатное воспроизведение. Идентификация лиц и 1916 год сохранены в Commons metadata, но provenance остаётся слабее желательного уровня.

**Статус:** `SHORTLIST-B / STRONGER-PROVENANCE-SEARCH`.

---

## YES-P04 — Сергей Есенин и Пётр Чагин, Баку, сентябрь 1924

```yaml
file: "04__Chagin and Esenin 1924.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:Chagin_and_Esenin_1924.jpg"
identity: "С. А. Есенин и П. И. Чагин"
date: "сентябрь 1924"
place: "Баку"
photographer: "Лаврентий Георгиевич Брегадзе (1876–1967) — current Commons structured metadata"
dimensions: "345×496"
bytes: 22281
sha256: "3aa3b12c2352207738f1ac2fec348688d94bffd759884f7ed2eed0559859886c"
license: "Public domain"
article_assignment: "YESENIN PART II"
placement: "right / portrait"
```

### Визуальная функция

Документирует бакинский круг и связь с Чагиным, важную для Кавказа, публикаций и поздней поэзии.

### Quality/provenance warning

- текущий файл очень мал: 345×496, 22 KB;
- source field Commons ведёт на LiveJournal;
- история файла показывает, что более крупная версия была ранее загружена и затем откатана из-за требования отдельного источника/автора;
- имя фотографа в нынешней карточке добавлено как structured metadata, но исходная запись ранее указывала автора неизвестным.

Нужен более качественный физический источник с уверенной атрибуцией Брегадзе. До этого не растягивать во всю ширину.

**Статус:** `HOLD-HIGHER-QUALITY-AND-PROVENANCE`.

---

## YES-P05 — Сергей Есенин и Николай Клюев, 1 февраля 1916

```yaml
file: "05__Eseninnikolaiklyeuv.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:Eseninnikolaiklyeuv.jpg"
identity: "Сергей Есенин и Николай Клюев"
date: "1 февраля 1916"
source: "Президентская библиотека имени Б. Н. Ельцина"
photographer: "unknown"
dimensions: "792×620"
bytes: 228836
sha256: "5ca96a2d2f48eb320ad119dff7275149d8a27935a373359524152444814391bc"
license: "Public domain"
article_assignment: "YESENIN PART I"
placement: "full / wide"
```

### Визуальная функция

Один из наиболее сильных кандидатов Part I: показывает не абстрактный «новокрестьянский образ», а Есенина и Клюева в сознательно выбранной сценической/костюмной подаче. Подходит к разделу о союзе, литературной стратегии и различиях между ними.

### Material warning

Commons file history сообщает о rotation/crop/levels, поэтому текущий файл является цифрово обработанной репродукцией. Это не запрещает использование, но credit должен отличать историческую фотографию от последующей цифровой обработки. При возможности получить предметную карточку Президентской библиотеки и original scan.

**Статус:** `SHORTLIST-A / ITEM-CARD-PENDING`.

---

# Предварительная возрастная последовательность

## Part I

1. `YES-P01` — 1914, ранний одиночный портрет, `right`;
2. `YES-P05` — Клюев и Есенин, 1 февраля 1916, `full`;
3. `YES-P03` — Городецкий и Есенин, 1916, `right` или `full` по ритму;
4. другие документы/первые издания/военный период;
5. портрет/группа 1920–1921 годов, которых в текущем пакете нет.

Нельзя ставить P05 и P03 подряд: обе фотографии относятся к одному году и литературному кругу. Между ними должны быть текстовая глава и документы/издание, либо одна фотография исключается.

## Part II

1. портрет 1921–1922 годов — ещё не найден в current core package;
2. Дункан/маршрут — отдельный документальный ряд;
3. `YES-P04` — Баку, 1924, только после более качественного источника;
4. `YES-P02` — 1925, поздний одиночный портрет;
5. рукописи/первые издания/письма;
6. финал не должен строиться только из портрета 1925 года и последнего автографа.

# Решения

- Core portraits package полезен как shortlist, но не является готовым visual layer.
- В Part I предварительно сильнее всего `YES-P01` и `YES-P05`.
- `YES-P03` остаётся дополнительным кандидатом, если найден лучший provenance и он не дублирует функцию Клюева.
- В Part II `YES-P02` годится как поздний портрет с нейтральной датировкой.
- `YES-P04` требует более качественного файла и атрибуционного контроля.
- Ни один файл не добавляется в public Yesenin Part I до атомарного открытия strict zero-image validator gate.
