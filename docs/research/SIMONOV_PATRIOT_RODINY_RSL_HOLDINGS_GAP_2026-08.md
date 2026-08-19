# «Патриот Родины», 03.12.1941 — RSL holdings-gap / second-record gate

Дата прохода: 2026-08-19  
Статус: **3 Dec institutionally corroborated / RSL holdings record 01006521228 has gap №286–289 / second full-viewer serial record 01004527271 recovered / exact 03.12 child issue and page remain direct-object pending**

## Почему этот gate нужен

Ранний newspaper gate правильно не вычислял номер выпуска `Патриота Родины` от 3 декабря 1941 года из воздуха. Официальный каталог РГБ дал два разных полезных слоя:

1. record **`01006521228`** — подробный holdings/microfilm object с перечислением сохранившихся номеров 1941 года и явной late-1941 лакуной;
2. record **`01004527271`** — второй официальный serial record, который РГБ помечает `Документ находится в открытом доступе в полном объёме` и снабжает действием `Читать онлайн`.

Эти записи нельзя смешивать. Вторая не стирает holdings gap первой, но **меняет acquisition strategy**: после её обнаружения нельзя утверждать, что RSL viewer route заведомо бесполезен. Нужно получить exact child/viewer mapping от РГБ и уже по нему проверить, доступен ли 03.12.1941.

Главный принцип остаётся прежним:

> candidate issue number, восстановленный по последовательности, не равен direct issue identity до просмотра masthead.

---

## 1. RSL holdings/microfilm object `01006521228`

**РГБ record:** `01006521228`  
**URL:** https://search.rsl.ru/ru/record/01006521228

Карточка фиксирует:

- `Патриот Родины: Ежедневная красноармейская газета`;
- учредитель: Северный Военный Округ;
- формат 42 см;
- редакторский переход: `1941, №155 (2 июля) — 1944, №227 (29 окт.)` — В. Холош;
- микрофильм/holdings: `MFK 813-13/1` и последующие части.

### Состав 1941 года по этой карточке

РГБ перечисляет:

`№ 1-24, 26-68, 70-76, 102-126, 150-176, 178-179, 181-212, 214-221, 223-232, 236-240, 260, 262-270, 272-279, 281-282, 284-285, 290-291, 298-299, 302-309, 311-312`.

Ключевой late-1941 gap:

**после №284–285 отсутствуют №286–289; затем есть №290–291.**

Следовательно, конкретно этот holdings list не показывает №286–289. Но отсутствие номера в одном listed holding **не доказывает отсутствие исторического выпуска и не доказывает отсутствие другого digital/microfilm representation в РГБ**.

---

## 2. Second RSL serial record `01004527271`

19 августа восстановлена отдельная официальная карточка:

**RSL record:** `01004527271`  
**Шифр:** `OVL ВО 200/21`.

Она прямо маркирована:

- **`Документ находится в открытом доступе в полном объёме`**;
- действие **`Читать онлайн`**.

Карточка также сохраняет полезную catalog-history связку:

- исторический imprint `Петрозаводск, 1940-`;
- газетное заглавие/подзаголовок связано с Архангельским военным округом.

### Что второй record меняет

Он **не подтверждает**, что 03.12.1941 присутствует в viewer. Underlying child/viewer URL текущему toolchain не surfaced, и его нельзя конструировать по шаблону.

Но он делает устаревшей прежнюю жёсткую стратегию `RSL viewer больше не искать`. Теперь правильная граница:

**old holdings gap verified / second RSL full-viewer serial object verified / exact relationship between second record and 03.12.1941 issue unknown until RSL child route or pixels are obtained.**

Существующий запрос в РГБ обновлён именно этим locator’ом; запрошен stable child/viewer route для 03.12.1941 без подсказанного candidate issue number.

---

## 3. Контрольные date↔issue anchors внутри `01006521228`

Карточка даёт anchors:

- **№154 = 1 июля 1941**;
- **№155 = 2 июля 1941**;
- **№195 = 17 августа 1941**.

От №155 2 июля до №195 17 августа проходит 46 календарных дней, но номер увеличивается на 40. В этом интервале ровно шесть понедельников. На этом проверяемом отрезке нумерация согласуется с ритмом **шесть выпусков в неделю без понедельника**.

Это navigation evidence, не direct identity.

---

## 4. Candidate №287 — только навигационная гипотеза

Если установленный для июля–августа ритм без понедельников сохранялся без исключений до 3 декабря, последовательность даёт **candidate №287**.

Но редакция **не повышает №287 до установленного номера**, потому что между августом и декабрём могли быть:

- внеочередные выпуски;
- изменения ритма;
- объединённые/пропущенные номера;
- иные редакционные исключения военного времени.

Candidate попадает внутрь gap №286–289 старого holdings record, что объясняет прежнюю проблему доступа, но **не позволяет заранее утверждать**, что second record `01004527271` не имеет иного representation нужной даты.

---

## 5. Независимая поддержка даты 3 декабря

Дата 3 декабря не выводится из нумерации. Она приходит из отдельных institutional witnesses:

- Архангельская областная научная библиотека им. Н. А. Добролюбова;
- `Правда Севера`;
- региональные библиотечные/музейные материалы.

Отдельная муниципальная публикация с датой `3 ноября` сохраняется как конфликтный derivative и не используется как chronology fact.

---

## 6. Acquisition strategy теперь

Приоритет:

1. **РГБ record `01004527271`** — получить официальный stable child/viewer route для 03.12.1941 и проверить, какой digital object реально стоит за `Читать онлайн`;
2. **АОНБ / Русский Север** — item-level наличие exact date;
3. **Государственный архив Архангельской области** — через разрешённый ESIA/post route;
4. другой библиотечный микрофильм/комплект, где есть missing interval №286–289;
5. `Правда Севера` / family/editorial provenance;
6. РКП `Газетная летопись` — exact bibliographic entry.

Нельзя:

- заказывать `№287` как доказанный номер без item confirmation;
- писать, что record `01004527271` уже показал выпуск 03.12.1941;
- писать, что gap `01006521228` доказывает отсутствие номера во всей РГБ;
- превращать full-viewer label второго record в direct issue/page evidence;
- снимать publication superlative `впервые` до direct issue/page witness.

---

## 7. Closure checklist

- [x] holdings newspaper object RSL `01006521228` verified;
- [x] late-1941 holdings sequence recorded;
- [x] gap `№286–289` isolated;
- [x] date↔number anchors recorded;
- [x] candidate-number inference explicitly quarantined;
- [x] second RSL serial record `01004527271` + `OVL ВО 200/21` + full-viewer label recovered;
- [x] RSL clarification sent requesting exact child route for 03.12.1941;
- [ ] obtain exact RSL child/viewer object for 03.12.1941 or an official negative answer for that date;
- [ ] obtain independent item-level date↔issue number;
- [ ] visually inspect masthead/date/issue number;
- [ ] locate `Сын артиллериста` and record printed page/geometry;
- [ ] only then decide whether `первая публикация` is direct-object closed.

## Итог

Старый holdings gap **остаётся реальным**, но больше не используется как доказательство, что весь RSL viewer route исчерпан. Второй официальный record `01004527271` с full-viewer declaration открыл новый законный путь к object-level проверке. До child route/pixels всё равно остаются неизвестны exact issue number и page 03.12.1941; candidate №287 остаётся только навигационной гипотезой.