# Сергей Есенин, часть I — полный sentence-level editorial pass

Дата: 2026-07-25

Issue: #76

Статус: `146/146 READER-FACING-BLOCKS-EDITED / WHOLE-ARTICLE-SENTENCE-EDIT-COMPLETE / 75 PASS8-BLOCKS / 71 PASS7-BLOCKS / UNPUBLISHED / UNREGISTERED / MEDIA-HOLD`

## Итог

Полная первая часть биографии 1895–1921 годов теперь имеет reviewed reader-facing text для каждого evidence-bearing узла:

- pass 8 — лид и разделы 1–8: 75/75;
- pass 7 — разделы 9–12: 71/71;
- общий итог: 146/146;
- section blocks: 12;
- total render blocks: 158.

Исследовательский Markdown не удалён и остаётся исходным authoring layer. Reader-facing текст применяется typed override registries по тем же stable block IDs. Claims, source IDs, section ownership и topology order не переставлялись.

## Pass 8 — точное покрытие

| Раздел | Блоков |
|---|---:|
| Лид | 3 |
| 1. Константиново | 7 |
| 2. Спас-Клепики | 9 |
| 3. Москва | 11 |
| 4. Анна Изряднова | 7 |
| 5. Есенин у Блока | 7 |
| 6. Николай Клюев | 6 |
| 7. «Радуница» | 9 |
| 8. Поезд № 143 | 16 |
| **Всего** | **75** |

## Литературная редактура разделов 5–8

### Блок

- встреча 9 марта 1915 года строится вокруг синхронных документов, а не позднего сценического фольклора;
- записка Есенина читается как деловая попытка добиться чтения, не как просьба о чудесном посвящении;
- оценка Блока сохраняет и похвалу, и замечания о многословии и языке;
- рекомендательная сеть отделена от недоказанного точного состава шести стихотворений;
- формула «Блок открыл Есенина» ограничена реальным посредничеством, а не мгновенной славой;
- легендарные детали оставлены истории памяти и не смешаны с дневником 9 марта.

### Клюев

- влияние старшего поэта названо без формулы «создатель и созданный»;
- утраченные письма не заполнены воображаемыми репликами;
- крестьянский костюм описан как сценическое усиление реального происхождения, не как сплошная ложь;
- агентность Есенина сохранена вместе с зависимостью от собственной публичной роли;
- издательская сеть не сведена к одному покровителю;
- эстетическое влияние показано как традиция, из которой собственный голос постепенно выходит.

### «Радуница»

- выходные данные 1916 года разведены с поздней памятью о ноябре 1915-го;
- авторская память и библиотечный каталог не склеены до физической колляции;
- деревенский мир показан как литературно созданный космос, а не фотография;
- религиозная лексика не сведена к фольклорному декору и не повышена до готового катехизиса;
- христианская оценка различает библейско-литургическую ткань и ортодоксальное исповедание;
- дарственные надписи используются для истории обращения книги, не для вымышленной реакции адресата.

### Поезд № 143

- придворная легенда и фронтовая героизация отвергнуты как две недоказанные крайности;
- дата 20 апреля 1916 года, поезд № 143 и вагон № 6 закреплены документально;
- страницы 673, 688–691 и фотография 690 описаны как опубликованный слой ФЭБ, не прямой осмотр полного дела РГИА;
- транспортно-медицинская среда признана без вымышленных процедур и смен;
- лазарет № 17 не называется формальной частью при отрицательной проверке списков;
- выступление перед императорской семьёй не превращается автоматически в монархическое убеждение или чистый расчёт;
- поздняя автобиография отделена от синхронного документа 1916 года;
- стихи военного времени не читаются как репортаж конкретного рейса;
- революционный переход показан как перенаправление уже существующего библейско-эсхатологического языка.

## Typed implementation

- `yeseninPartOneEditorialPassEightEarlyA.ts` — 37 blocks, lead and sections 1–4;
- `yeseninPartOneEditorialPassEightEarlyB.ts` — 38 blocks, sections 5–8;
- `yeseninPartOneEditorialPassSeven.ts` + pass-6 companion — 71 blocks, sections 9–12;
- builder records independent `editorialPassSevenApplied` and `editorialPassEightApplied` flags;
- package now exposes `wholeArticleSentenceEditComplete: true`;
- publication, registration and media authorization remain false.

## Permanent CI contract

`npm run check` now invokes `validate:yesenin-part-one-editorial`.

Validator requires:

- exact 146-node topology;
- 75 unique pass-8 IDs exactly covering lead and sections 1–8;
- 71 unique pass-7 IDs exactly covering sections 9–12;
- union = 146 and intersection = 0;
- render/override equality for all 146 nodes;
- source Markdown remains available as authoring history;
- no internal `[block]`, `[claims]`, `[sources]` metadata in reader prose;
- no service language such as «для статьи», «в окончательной статье» or «следующий раздел должен»;
- required historical, source-critical, moral and theological anchors;
- stable publication and media HOLD.

## Что completion не означает

Sentence-level completion не является publication decision. По-прежнему остаются:

- physical/archive witness gaps;
- не закрытые права и provenance документальных изображений;
- отсутствие публичного маршрута, sitemap и navigation registration;
- необходимость финальной сквозной read-through после получения ключевых книг и физических свидетелей;
- отдельное решение о структуре части II;
- внешний DNS/TLS issue.

Статья остаётся `UNPUBLISHED / UNREGISTERED / MEDIA-HOLD` до отдельного доказательного и редакционного решения.

## Merge gate

Слияние допустимо только в canonical research и только после success на одном exact head для:

1. Editorial Pass 8 focused workflow;
2. Unpublished Article validator;
3. Authoring validator;
4. Citation Topology validator;
5. полного CI, где editorial validator входит в `npm run check`;
6. Manual Browser QA Chromium / Pixel 7 / iPhone Safari;
7. независимой проверки обоих evidence artifacts.

`main` не является целью этого PR.
