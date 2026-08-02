# Visual rights ledger — pass 01

**Дата проверки manifest:** 2 августа 2026 года  
**Источник:** Google Drive → `03 — RIGHTS, MANIFESTS & SHA256` → `EPHEMERA 63 — MANIFEST RIGHTS SHA256.zip`  
**Manifest checked at source:** 30 июля 2026 года  
**Статус:** item-level metadata extracted; editorial relevance and production placement remain separate gates

## Правило чтения

`Public domain` или Creative Commons статус закрывает правовую основу конкретного файла на момент manifest-check, но не доказывает, что объект уместен в конкретной статье. Для production дополнительно нужны:

- смысловая связь с главой;
- точная подпись;
- отсутствие более сильного/более прямого свидетеля;
- локальная оптимизация без потери документа;
- Browser QA;
- повторная проверка карточки перед merge, если metadata изменилась.

---

## Лермонтов

### LER-E01 — «Смерть поэта», рукопись, лист 1

```yaml
file: "001__manuscript-lermontov__Смерть поэта… — 1.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:Смерть_поэта._Рукопись_непозволительного_стиха,_написанного_Лермонтовым_и_распространенного_Раевским._(1837)_—_1.jpg"
creator: "Михаил Лермонтов"
date: "1837"
dimensions: "386×580"
bytes: 103845
sha256: "08aa261ff23a27be9a9a127e2a09498c7b0868431d9191609e74c1ea84b20e0c"
license: "Public domain"
attribution_required: false
manifest_status: "DOWNLOADED / original verified"
article_status: "OUT-OF-SCOPE-LERMONTOV-ROAD"
```

**Решение:** не вставлять в статью «Выхожу один я на дорогу…». Это подлинный и открытый рукописный материал, но он относится к другому произведению. Использование создало бы ложное ощущение прямой документальной связи.

### LER-E02 — «Смерть поэта», рукопись, лист 2

```yaml
file: "002__manuscript-lermontov__Смерть поэта… — 2.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:Смерть_поэта._Рукопись_непозволительного_стиха,_написанного_Лермонтовым_и_распространенного_Раевским._(1837)_—_2.jpg"
creator: "Михаил Лермонтов"
date: "1837"
dimensions: "550×421"
bytes: 118126
sha256: "11144d1d51b001f8ad6a441c17a29c26e8b08bba633b2762fc5b3d9160645199"
license: "Public domain"
attribution_required: false
manifest_status: "DOWNLOADED / original verified"
article_status: "OUT-OF-SCOPE-LERMONTOV-ROAD"
```

### LER-E03 — «Княгиня Лиговская», автограф

```yaml
file: "003__manuscript-lermontov__Княгиня Лиговская. Автограф Лермонтова.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:Княгиня_Лиговская._Автограф_Лермонтова.jpg"
creator: "М. Ю. Лермонтов"
date: "1837"
dimensions: "647×1000"
bytes: 114982
sha256: "0544e3eb3bafa7adc780a6a38e0929afd2081d66e29043f57ac55c22d6fa631d"
license: "Public domain"
attribution_required: false
credit: "ФЭБ: http://feb-web.ru/feb/lermont/biblio/mrl/mrl-001-.htm"
manifest_status: "DOWNLOADED / original verified"
article_status: "OUT-OF-SCOPE-LERMONTOV-ROAD"
```

**Вывод по Лермонтову:** pass 01 не дал прямого рукописного свидетеля анализируемого стихотворения. Visual gate статьи остаётся открытым: нужен автограф «Выхожу один я на дорогу…», первая публикация и предметный материал о романсе/рецепции.

---

## Есенин

### YES-E04 — Дарственная надпись Августе Миклашевской

```yaml
file: "004__manuscript-yesenin__Дарственная надпись Сергея Есенина Августе Миклашевской.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:Дарственная_надпись_Сергея_Есенина_Августе_Миклашевской.jpg"
creator: "Сергей Есенин"
date: "1923-10-27"
dimensions: "592×434"
bytes: 41364
sha256: "6fb9274064c28d359e2c7acac956a8aee97ddbef3ad7cd149408d11abf66ca6a"
license: "Public domain"
attribution_required: false
manifest_status: "DOWNLOADED / original verified"
article_status: "CANDIDATE-YESENIN-PART-II"
placement_candidate: "left or right / document / tilt false"
```

**Редакционная функция:** может подтверждать конкретную датированную линию отношений и посвящений в Part II. Не использовать как романтическую иллюстрацию без разбора текста надписи, издания и контекста.

### YES-E05 — Автограф последнего стихотворения

```yaml
file: "005__manuscript-yesenin__Автограф последнего стихотворения Есенина.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:Автограф_последнего_стихотворения_Есенина.jpg"
creator: "Сергей Есенин (1895–1925)"
date: "1925"
dimensions: "450×658"
bytes: 33417
sha256: "ba02c205bb616697f356beff7b325d222e7786a72cc31a0e3b9e73c63bc9078c"
license: "Public domain"
attribution_required: false
manifest_status: "DOWNLOADED / original verified"
article_status: "SENSITIVE-CANDIDATE-YESENIN-PART-II"
placement_candidate: "full or right / document / tilt false"
```

**Редакционная граница:** изображение не должно становиться сенсационной кульминацией, «доказательством» одной версии смерти или декоративной заставкой. До production сверить происхождение факсимиле с академическим изданием/архивной карточкой, а не полагаться только на вторичный credit исходной Commons-карточки.

### YES-E06 — Общий автограф Сергея Есенина

```yaml
file: "006__manuscript-yesenin__Автограф Сергея Есенина.png"
description_url: "https://commons.wikimedia.org/wiki/File:Автограф_Сергея_Есенина.png"
creator: "Сергей Есенин (1895–1925)"
date: "до 1925 года (Commons metadata)"
dimensions: "480×660"
bytes: 275003
sha256: "ce42d353f522cc9aeb56b79f950932fb80312576bacd6ecc3759cb8955d8900c"
license: "Public domain"
attribution_required: false
manifest_status: "DOWNLOADED / original verified"
article_status: "IDENTIFICATION-HOLD"
```

**Решение:** не публиковать как безымянный «автограф Есенина». Сначала определить произведение/документ, датировку и физический источник. Открытая лицензия не закрывает смысловую идентификацию.

### YES-E27 — Константиново, современная фотография 06

```yaml
file: "027__place-yesenin__RybnoeDistrict 06-13 Konstantinovo village 06.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:RybnoeDistrict_06-13_Konstantinovo_village_06.jpg"
creator: "A. Savin"
date: "2013-06-20"
dimensions: "4350×3084"
bytes: 5687038
sha256: "431f4dac23716601bb684c841dfc34bfdcd327556242d259b994395097ae3c0d"
license: "CC BY-SA 3.0"
attribution_required: true
credit: "A. Savin, own work"
manifest_status: "DOWNLOADED / original verified"
article_status: "CANDIDATE-YESENIN-PART-I-CONTEXT"
placement_candidate: "full / wide"
```

**Подпись должна говорить:** современный вид Константинова, снятый в 2013 году. Нельзя выдавать за фотографию села детства Есенина начала XX века.

### YES-E28 — Константиново, современная фотография 07

```yaml
file: "028__place-yesenin__RybnoeDistrict 06-13 Konstantinovo village 07.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:RybnoeDistrict_06-13_Konstantinovo_village_07.jpg"
creator: "A. Savin"
date: "2013-06-20"
dimensions: "3651×2946"
bytes: 5831827
sha256: "f06eaa7fe4b3d22a987d030da25378855bdbdfc7daad9fdb1c8a5319ec360b2e"
license: "CC BY-SA 3.0"
attribution_required: true
credit: "A. Savin, own work"
manifest_status: "DOWNLOADED / original verified"
article_status: "ALTERNATE-YESENIN-PART-I-CONTEXT"
```

**Решение:** выбрать один из двух кадров после композиционного просмотра. Не ставить оба подряд: они выполняют одну функцию.

### YES-E26 — Дом-музей Есенина в Ташкенте

```yaml
file: "026__place-yesenin__Sergei Yesenin house museum, Tashkent.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:Sergei_Yesenin_house_museum,_Tashkent.JPG"
creator: "Abdullais4u"
date: "2012-12-09"
dimensions: "2304×1728"
bytes: 1147562
sha256: "db959a1c7ce77d3e61904b31a001517338aff1eb9f37c1de2a189240524fb5fa"
license: "CC BY-SA 3.0"
attribution_required: true
manifest_status: "DOWNLOADED / original verified"
article_status: "OUT-OF-SCOPE-CURRENT-BIOGRAPHY"
```

---

## Маяковский

### MAY-E07 — Автограф в «Чукоккале»

```yaml
file: "007__manuscript-mayakovsky__Маяковский Владимир автограф в Чукоккале 1910е.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:Маяковский_Владимир_автограф_в_Чукоккале_1910е.JPG"
creator: "В. Маяковский"
date: "1915-04-16"
dimensions: "1884×576"
bytes: 713422
sha256: "dcf368bac9f021ea2d9c4165f092622303c89c3b7e62fa2ea73e6c29584572a9"
license: "Public domain"
attribution_required: false
credit: "Own work photo by Vizu (Commons metadata)"
manifest_status: "DOWNLOADED / original verified"
article_status: "CANDIDATE-MAYAKOVSKY-PART-I"
placement_candidate: "full / document / tilt false"
```

**Функция:** прямой ранний авторский след. До подписи проверить, что именно написано и как объект связан с датой 16 апреля 1915 года.

### MAY-E08 — Письмо «Всем» / предсмертная записка

```yaml
file: "008__manuscript-mayakovsky__Предсмертная записка Маяковского.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:Предсмертная_записка_Маяковского.jpg"
creator: "Владимир Маяковский"
date: "1930"
dimensions: "600×373"
bytes: 54406
sha256: "8d6da88f159431a57fb2878177c2dad1ecb30ec61cf8cb5f99316e535e6c97c2"
license: "Public domain"
attribution_required: false
manifest_status: "DOWNLOADED / original verified"
article_status: "SENSITIVE-CANDIDATE-MAYAKOVSKY-PART-II"
placement_candidate: "full / document / tilt false"
```

**Source hierarchy:** для текста и факсимиле опираться прежде всего на проверенное документальное издание 2005 года; Commons-копия может быть production-файлом только после сопоставления с проверенным факсимиле. Не использовать как thumbnail-крючок.

### MAY-E09 — Автограф, 10 августа 1927 года

```yaml
file: "009__manuscript-mayakovsky__AvtografMayakovsky.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:AvtografMayakovsky.jpg"
creator: "В. В. Маяковский"
date: "1927-08-10"
dimensions: "388×161"
bytes: 7714
sha256: "87dfe05c06cb2eb8cfce3415932d11765b3778256a12fb4240ba67cf5ab500e3"
license: "Public domain"
attribution_required: false
credit: "ФЭБ / Литературное наследство 65"
manifest_status: "DOWNLOADED / original verified"
article_status: "LOW-RES-CONTEXT-CANDIDATE"
```

**Решение:** 7.7 KB недостаточно для крупной встройки. Нужен более качественный скан или размещение только как небольшая документальная деталь, если текст идентифицирован и читаем.

### MAY-E10 — Автограф «А вы могли бы?»

```yaml
file: "010__manuscript-mayakovsky__Mayakovsky A vy mogli by Autograph.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:Mayakovsky_A_vy_mogli_by_Autograph.jpg"
creator: "Владимир Маяковский"
date: "1915"
dimensions: "590×382"
bytes: 38022
sha256: "0896209ee15cd979185fae8eb462eefbd35600acbec386768b0310cdb3aa005c"
license: "Public domain"
attribution_required: false
manifest_status: "DOWNLOADED / original verified"
article_status: "CANDIDATE-MAYAKOVSKY-PART-I"
placement_candidate: "left or full / document / tilt false"
```

### MAY-E21 — Книги Маяковского и Кручёных

```yaml
file: "021__cover-mayakovsky__Mayakovsky books kruchyonyx stixi.png"
description_url: "https://commons.wikimedia.org/wiki/File:Mayakovsky_books_kruchyonyx_stixi.png"
dimensions: "509×856"
bytes: 58299
sha256: "3baab729c13d603bedca4ded1aa797d5c474fd418123f88c70273b052e733393"
license: "Public domain"
attribution_required: false
manifest_status: "DOWNLOADED / original verified"
article_status: "IDENTIFICATION-PENDING"
```

**Решение:** пустые/слабые artist-credit поля требуют отдельной идентификации каждого видимого издания. Не подписывать обобщённо как «книги Маяковского» без перечисления.

### MAY-E22 — «Я», 1913, вариант Commons `Majak ja`

```yaml
file: "022__cover-mayakovsky__Majak ja.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:Majak_ja.jpg"
date: "1913"
dimensions: "612×827"
bytes: 198395
sha256: "82f2c274b5aca0ff190e20aa4d559b65d6605dd67e8b59f59e1923358e8387f3"
license: "Public domain"
attribution_required: false
manifest_status: "DOWNLOADED / original verified"
article_status: "CANDIDATE-MAYAKOVSKY-PART-I / CREDIT-REVIEW"
```

**Замечание:** поле artist содержит имя загрузчика/обработчика `Valerikpunk`, а не бесспорно автора исторической обложки. Caption и credit должны быть исправлены по истории издания.

### MAY-E23 — Сборник «Я», семейный скан

```yaml
file: "023__cover-mayakovsky__Сборник стихов Владимира Маяковского Я.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:Сборник_стихов_Владимира_Маяковского_Я.jpg"
date: "1913"
dimensions: "1308×881"
bytes: 407156
sha256: "2e2ef377af6a6f6ba0fe8b2ba92018ccfa3ca34c10ae21ef430dd8229c4d50e1"
license: "Public domain"
attribution_required: false
credit: "Скан из семейного альбома Кузминых; Commons metadata"
manifest_status: "DOWNLOADED / original verified"
article_status: "PREFERRED-CANDIDATE-MAYAKOVSKY-PART-I / PROVENANCE-REVIEW"
```

**Решение:** по разрешению сильнее MAY-E22, но история физического экземпляра и точный объект в кадре должны быть описаны честно.

### MAY-E24 — «Для голоса», 1923

```yaml
file: "024__cover-mayakovsky__Dlja golosa. 1923-100.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:Dlja_golosa._1923-100.jpg"
creator: "Эль Лисицкий"
date: "1923"
dimensions: "570×398"
bytes: 74865
sha256: "631aaf7cf2ad4884238c69912dcb6f13bcd078e71d5624e9e84382135b93b9be"
license: "Public domain"
attribution_required: false
manifest_status: "DOWNLOADED / original verified"
article_status: "CANDIDATE-MAYAKOVSKY-PART-II"
placement_candidate: "left or full / document / tilt false"
```

### MAY-E29 — Переулок Маяковского, современная фотография

```yaml
file: "029__place-mayakovsky__Moscow, Mayakovskogo Lane.jpg"
description_url: "https://commons.wikimedia.org/wiki/File:Moscow,_Mayakovskogo_Lane.jpg"
creator: "NVO"
date: "2007-05-05"
dimensions: "1200×813"
bytes: 384480
sha256: "804c2be9587d0daaa03b5d1a3cd00746eab75ac02517ed596b7e1ee1534bb8c0"
license: "CC BY 2.5"
attribution_required: true
manifest_status: "DOWNLOADED / original verified"
article_status: "CONTEXT-CANDIDATE / MODERN-PHOTO"
```

**Подпись:** современный вид переулка, снятый в 2007 году. Не использовать как фотографию Москвы времени Маяковского.

---

## Итоги pass 01

### Rights metadata закрыт на уровне manifest

- 3 лермонтовских рукописных объекта;
- 3 есенинских рукописных объекта;
- 2 современных есенинских вида Константинова;
- 1 современный ташкентский объект;
- 4 автографа/документа Маяковского;
- 4 книжно-обложечных объекта Маяковского;
- 1 современный московский объект.

### Production-ready без дополнительных смысловых проверок

**Ноль.** Это сознательный результат: license metadata уже есть, но caption/provenance/relevance gate ещё не закрыт полностью ни для одного кандидата.

### Ближайшие сильные кандидаты

1. `MAY-E07` — автограф в «Чукоккале»;
2. `MAY-E10` — «А вы могли бы?»;
3. `MAY-E23` — ранний сборник «Я»;
4. `MAY-E24` — «Для голоса»;
5. `YES-E04` — надпись Миклашевской;
6. один из `YES-E27/28` — современное Константиново с точной маркировкой времени.

### Следующий pass

- проверить физическое содержание и читаемость шести ближайших кандидатов;
- извлечь portraits 45 manifest;
- найти прямой рукописный/публикационный материал для статьи о дороге Лермонтова;
- сверить чувствительные финальные документы с академическими факсимиле;
- подготовить first production shortlist, не добавляя изображения в статьи преждевременно.
