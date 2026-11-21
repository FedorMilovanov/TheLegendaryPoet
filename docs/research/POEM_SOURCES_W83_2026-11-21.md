# W83: источниковая адресация шестнадцати поэтических карточек (2026-11-21)

Основание: W82, PR #605, исходная интеграционная ревизия `cc0c921955bb906f94dbee93f74b6ad989454554`.

**Статус: SOURCE-INDEXED / TEXT-COLLATION HOLD / RIGHTS HOLD.** URL указывает на внешнее издание произведения; сам по себе он НЕ доказывает построчное соответствие, академический статус конкретной версии или право на перепечатку. Ни одна стихотворная строка в W83 не добавлена и не изменена.

| ID | Источник |
| --- | --- |
| mayak-1 | https://ru.wikisource.org/wiki/Облако_в_штанах_(Маяковский) |
| mayak-2 | https://ru.wikisource.org/wiki/Послушайте!_(Маяковский) |
| mayak-3 | https://ru.wikisource.org/wiki/Лиличка!_(Маяковский) |
| fet-1 | https://rvb.ru/19vek/fet/bp/text/221.html |
| fet-2 | https://rvb.ru/19vek/fet/bp/text/285.html |
| fet-3 | https://rvb.ru/19vek/fet/bp/text/174.html |
| gumilev-1 | https://ru.wikisource.org/wiki/Жираф_(Гумилёв) |
| gumilev-2 | https://ru.wikisource.org/wiki/Капитаны_(Гумилёв) |
| gumilev-3 | https://ru.wikisource.org/wiki/Слово_(Гумилёв) |
| gumilev-4 | https://ru.wikisource.org/wiki/Шестое_чувство_(Гумилёв) |
| pasternak-2 | https://rvb.ru/20vek/silver-age/1910-e/09/093-boris-pasternak.html |
| pasternak-3 | https://www.b-pasternak.ru/vse-stixotvoreniya/1-gamlet |
| pasternak-4 | https://www.culture.ru/poems/14024/zimnyaya-noch |
| akhmatova-1 | https://www.culture.ru/poems/10174/rekviem |
| akhmatova-2 | https://ru.wikisource.org/wiki/Сжала_руки_под_темной_вуалью_(Ахматова) |
| akhmatova-3 | https://www.culture.ru/poems/8905/muzhestvo |

## Ограничения по карточкам

- `mayak-1` — отрывок из четвёртой части «Облака в штанах», не вся поэма.
- `mayak-3`, `gumilev-3`, `pasternak-4` — `<...>`: выпущены строфы; нельзя называть полной редакцией.
- `gumilev-2`: URL указывает на цикл «Капитаны», в карточке только часть I.
- `akhmatova-1`: лишь начало «Посвящения» и глава X «Распятие», разделённые самостоятельным `...`; заголовок уточнён.
- Для всех остальных проверяется конкретная версия; две независимые текстовые опоры, одна A+, и ручная построчная сверка ещё обязательны. В РВБ Фет использован по «Библиотеке поэта», 1959; даже здесь встречаются вариантные написания и пунктуация (например, `fet-2`).
- `pasternak-2`: ссылка на антологию РВБ с произведением, а не на конкретную единственную редакцию; это указатель, не завершённая коллация.
- Пастернак, Ахматова: FULLTEXT RIGHTS HOLD. Ссылка на текст не равна лицензии; не добавлять строки.
- Гумилёв: после реабилитации 1991 г. в России срок охраны некоторых произведений, обнародованных после 7 ноября 1917 г., оценивается до 1 января 2062 г.; `gumilev-3`, `gumilev-4` сохраняют RIGHTS HOLD. См. https://ru.wikisource.org/wiki/Автор:Николай_Степанович_Гумилёв и https://www.consultant.ru/document/cons_doc_LAW_64629/675b81f0bc9b8ecd68ea332ecfd9d1562541fb98/ .
- Ахматова, «Мужество»: датировка первой печати — «Правда», 8 марта 1942, не 1943, по библиографической хронологии Национальной библиотеки: https://nrbib.ru/upload/iblock/5ea/q3w2drj0sno4log0r76ngz27eim46okr.pdf .

## UI и контроль

Все прежние ID стихотворений сохранены. Общий `PoemCard` помечает standalone `...`, `<...>` и заголовки с «фрагмент»/«отрывок»/«цитата», а не только старый маркер `<...>`. Ни одна ограниченная карточка не превращается в полный текст.

Приёмка: пересоздать generated runtime + JSON из канонических TS, проверить source URL и excerpt-заметки на 390/1440 и в Safari/Android, пройти TypeScript, валидацию каталога, SEO, budget build. Merge в main разрешён только после exact-head CI, независимой научной сверки и правового решения.
