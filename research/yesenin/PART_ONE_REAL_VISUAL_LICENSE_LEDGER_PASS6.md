# Сергей Есенин, часть I — real visual license ledger pass 6

Статус: `REAL-OBJECTS-ONLY / 8-STABLE-IDS / RIGHTS-SEPARATED / NO-PRODUCTION-AUTHORIZATION`

Этот ledger не является юридическим заключением. Он фиксирует то, что реально показано на source page, и запрещает подменять три разных утверждения друг другом:

1. объект исторически существует;
2. цифровой файл доступен исследователю;
3. файл разрешено публиковать в production.

| № | Stable ID | Объект | Source / licence evidence | Решение |
|---:|---|---|---|---|
| 01 | `VIS-YE1-P6-001` | Есенин с сёстрами Катей и Шурой, Москва, 1912 | Commons указывает автора С. Чижова, дату 1912 и Public Domain Mark, но одновременно показывает предупреждение об отсутствующем отдельном US public-domain tag; ФЭБ подтверждает объект на печатной с. 555 | `PUBLIC-DOMAIN-CANDIDATE / LEGAL-METADATA-INCOMPLETE`; сохранить source-page snapshot и не публиковать автоматически |
| 02 | `VIS-YE1-P6-002` | Автограф письма Г. А. Панфилову, до 18 августа 1912 | ФЭБ, академическая Летопись, московское приложение, печатная с. 557 | `REAL-FACSIMILE / RESEARCH-ONLY`; права на scan и holding history не установлены |
| 03 | `VIS-YE1-P6-003` | Портрет Есенина 1914 года | Commons маркирует файл как `PD-RusEmpire` и отдельно указывает public domain в США вследствие публикации до 1 января 1931 года | `PUBLIC-DOMAIN-CANDIDATE`; до production сохранить original bytes, file-page snapshot, SHA-256 и точную атрибуцию |
| 04 | `VIS-YE1-P6-004` | Есенин и Николай Клюев, 1 февраля 1916 | Commons называет источником Президентскую библиотеку, автора — неизвестным; указывает public domain в России и США; ФЭБ подтверждает соседний объект на печатной с. 667 | `PUBLIC-DOMAIN-CANDIDATE`; проверить связь Commons derivative с holding object Президентской библиотеки |
| 05 | `VIS-YE1-P6-005` | Есенин и М. П. Мурашёв, 10 апреля 1916 | ФЭБ, список иллюстраций академической Летописи, печатная с. 668 | `REAL-PAGE-TARGET / RESEARCH-ONLY`; exact image bytes ещё не получены |
| 06 | `VIS-YE1-P6-006` | Извещение Петроградского резерва санитаров, с. 673 | Exact FEB acquisition `feb-ye1-train-673`; bytes и SHA-256 уже закреплены в acquisition registry | `ACQUIRED-HASHED / RIGHTS-UNRESOLVED`; production запрещён до отдельного решения |
| 07 | `VIS-YE1-P6-007` | Есенин среди персонала поезда № 143, с. 690 | Exact FEB acquisition `feb-ye1-train-690`; bytes и SHA-256 уже закреплены | `ACQUIRED-HASHED / RIGHTS-UNRESOLVED`; подпись обязана сохранять поезд № 143 и не превращать сцену в лазарет № 17 |
| 08 | `VIS-YE1-P6-008` | Обложка «Сирены» № 4–5, с. 621 | Exact FEB acquisition `feb-ye1-sirena-cover-621`; получена по реальному JavaScript route, хеширована и визуально проверена | `ACQUIRED-HASHED / RIGHTS-UNRESOLVED`; обложка не заменяет внутренние страницы декларации |

## Обязательный metadata bundle перед media PR

Для каждого реально используемого изображения должны быть сохранены:

- stable visual ID;
- source page и direct file URL;
- institution / holding statement;
- название объекта и дата без домысливания;
- автор или буквальное `unknown author`;
- licence template / rights statement snapshot;
- original byte size, dimensions, MIME, SHA-256;
- техническая производная отдельно от оригинала;
- номер миниатюры на contact sheet;
- `productionAuthorized: true` только отдельным осознанным коммитом.

## Запреты

- Не использовать генеративно созданные архивные фотографии, лица, документы, титульные листы или интерьеры.
- Не смешивать реальный объект и сгенерированный фон в одном «историческом» изображении.
- Не печатать на миниатюре выдуманную подпись, архивный шифр или цитату.
- Не считать Commons/ФЭБ/НЭБ licence универсальной: решение принимается по каждому объекту.
- До отдельного media PR все восемь записей сохраняют `productionAuthorized: false`.
