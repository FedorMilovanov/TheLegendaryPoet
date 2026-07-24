# Сергей Есенин, часть I: McVay / Duncan verification pass 5

Дата: 2026-07-24

Issue: #76

Статус: `USER-SUPPLIED-BOOK-COLLATED / 44-NEW-WEB-CHECKS / FIRST-MEETING-DATE-RECLASSIFIED / COPYRIGHTED-PDF-NOT-COMMITTED / PUBLICATION-NOT-AUTHORIZED`

## Назначение

Пользователь предоставил собственный исследовательский экземпляр:

- Gordon McVay;
- `Isadora and Esenin: The Story of Isadora Duncan and Sergei Esenin`;
- Ardis / Macmillan Press, 1980;
- user-supplied PDF: 424 physical PDF pages;
- file size: `265262787` bytes;
- SHA-256: `1a3167db1cb9cc2aa1ad64ac59b07bad4d97ebc51c5a142c334f2a74a0dc3238`;
- internal research id: `USR-YE1-MCVAY-ISADORA-ESENIN-1980`.

PDF не коммитится и не перераспространяется. В репозитории сохраняются только библиографические сведения, хеш, page-level выводы и проверяемая claim matrix.

## Почему книга ценна

Это не популярный пересказ без аппарата. McVay:

- перечисляет интервью с Александрой Есениной, Рюриком Ивневым, Сергеем Коненковым, Ильёй Шнейдером, Анной Никритиной, Александром Кусиковым и другими свидетелями;
- указывает работу в ЦГАЛИ, ИМЛИ, Пушкинском Доме, ГЛМ, рукописном отделе Ленинской библиотеки и Dance Collection NYPL;
- даёт подробные notes, bibliography и archival shelfmarks;
- различает первичную печать, поздние воспоминания, собственные интервью и hearsay;
- неоднократно прямо предупреждает о ненадёжности Mary Desti, Georgy Ivanov, Sabaneev и отдельных поздних реконструкций.

Книга является сильным secondary control source, но не заменяет синхронный документ и не получает автоматического приоритета над академическим ПСС/Летописью.

## Главный результат pass 5

Формула `Есенин и Дункан познакомились 3 октября 1921 года` должна быть переклассифицирована.

Новый evidence status:

`ACADEMIC-RECONSTRUCTION / NO-CONTEMPORANEOUS-MEETING-RECORD / COMPETING-MEMOIR-CHRONOLOGIES`

Разрешённая формула:

> Академическое ПСС датирует знакомство Есенина и Айседоры Дункан предположительно 3 октября 1921 года и помещает его в мастерскую Георгия Якулова. Сама дата является реконструкцией: синхронного протокола встречи не найдено, а поздние свидетели расходятся между началом октября, периодом до 7 ноября и началом ноября.

Нельзя писать:

- `они точно встретились 3 октября`;
- `первая встреча подробно известна`;
- реплики `золотая голова / ангел / чёрт` как синхронную стенограмму;
- версию Mary Desti, Sabaneev или Georgy Ivanov как установленный факт;
- что встреча мгновенно и однозначно определила дальнейшую жизнь обоих.

## 44 новые интернет-сверки

| № | Проверяемый узел | Точный источник / объект | Итог | Evidence boundary |
|---:|---|---|---|---|
| 1 | Автор, название, год и объём книги McVay | Open Library / Google Books bibliographic records; user copy title and copyright pages | `BIBLIOGRAPHY-VERIFIED` | Каталог не подтверждает отдельные исторические claims |
| 2 | Идентичность пользовательского файла | Local `pdfinfo`, byte count and SHA-256 | `FILE-IDENTITY-FROZEN` | Хеш подтверждает только конкретный файл, не права на распространение |
| 3 | Интервью McVay с современниками | Acknowledgements, user copy p. 11 PDF | `AUTHOR-METHOD-VERIFIED` | Позднее интервью остаётся поздним свидетельством |
| 4 | Использованные архивы | Acknowledgements and bibliography, user copy | `ARCHIVE-ROSTER-VERIFIED` | Упоминание архива не означает, что каждый cited original был опубликован facsimile |
| 5 | Подробный аппарат notes/bibliography/index | Contents and back matter, user copy | `SCHOLARLY-APPARATUS-VERIFIED` | Наличие аппарата не отменяет source criticism |
| 6 | Место встречи — мастерская Якулова | McVay; Mariengof; PSS comments; Konenkov | `MULTI-MEMOIR-AND-ACADEMIC-CONVERGENCE` | Нет синхронной записи самой вечеринки |
| 7 | Точная дата неизвестна McVay | McVay printed p. 40 / PDF p. 56: `The exact date of their first meeting is unknown` | `DIRECT-BOOK-STATEMENT` | Не превращать вторичное признание пробела в доказательство иной даты |
| 8 | Академическая дата `видимо, 3 октября` | FEB PSS vol. 7 comments | `ACADEMIC-RECONSTRUCTION` | Сохранять `видимо / вероятно` |
| 9 | Указатель ПСС даёт 3 октября без qualifier | FEB PSS vol. 6 name index | `INDEX-DATE-CONFIRMED` | Индекс короче реального комментария и не должен стирать qualifier |
| 10 | Сцена Mariengof | FEB edition of `Воспоминания о Есенине`; McVay notes to chapter 1 | `MEMOIR-TEXT-COLLATED` | Написано после событий; художественная композиция |
| 11 | Анти-Duncan causal bias Mariengof | Формула о `губительной роли` в мемуаре | `AUTHOR-BIAS-DECLARED` | Не принимать нравственную оценку свидетеля за причинное доказательство |
| 12 | Mary Desti version | McVay explicitly calls Desti seldom reliable / suspect | `HEARSAY-AND-SENSATIONALISM-HOLD` | Не использовать для точных действий и реплик |
| 13 | Sabaneev version | McVay chapter 1 notes; 1953 newspaper memoir | `LATE-MEMOIR-CONFLICT` | Не разрешает датировать событие |
| 14 | Georgy Ivanov version | McVay notes; FEB bibliographic record of memoir | `FANCIFUL-MEMOIR-HOLD` | Версия с пощёчиной не вводится как факт |
| 15 | Ivan Startsev mirror/lipstick variant | McVay chapter 1 note; FEB Startsev memoir | `RELATED-SCENE-NOT-FIRST-MEETING` | Сам Startsev не объявляет сцену первой встречей |
| 16 | Shneider: autumn and before 7 November | McVay note to printed p. 41; Shneider memoir tradition | `TERMINUS-ANTE-QUEM-SUPPORT` | Шнейдер не присутствовал при первой встрече |
| 17 | Shneider personally met Esenin 8 November | FEB PSS vol. 6 index | `EXACT-DATE-VERIFIED` | Это дата знакомства Шнейдера с Есениным, не пары |
| 18 | Konenkov confirms Yakulov party | FEB `Мой век` | `LOCATION-CORROBORATION` | Не даёт числа и точной сцены |
| 19 | Gorodetsky observes relationship as established fact | FEB memoir: visit to Duncan around 5 a.m.; later domestic scene | `EARLY-RELATIONSHIP-WITNESS` | Не свидетель первой встречи; оценка любви субъективна |
| 20 | Duncan arrival: 23 July 1921 | FEB PSS academic comments | `ACADEMIC-DATE` | Academic date preferred in prose |
| 21 | McVay gives early 24 July arrival | User copy printed p. 35 | `SECONDARY-DATE-CONFLICT` | Preserve discrepancy in research notes; do not silently harmonize |
| 22 | Departure from Reval on 20 July | Published NKID service note dated 21 July 1921 with archival reference | `PRIMARY-ADMINISTRATIVE-ANCHOR` | Proves departure notification, not exact Moscow arrival minute |
| 23 | Lunacharsky article `Наша гостья`, 24 August | Izvestia citation; McVay notes; later collected edition | `CONTEMPORARY-PRESS-VERIFIED` | Programmatic advocacy, not neutral biography |
| 24 | Duncan letter dated 6 September | `Театральная Москва` no. 2 bibliographic record / McVay notes | `CONTEMPORARY-PUBLISHED-LETTER` | Exact facsimile/page still desirable |
| 25 | House at Prechistenka 20 | Konenkov; Ivnev; Babenchikov; McVay | `MULTI-WITNESS-ADDRESS-CONVERGENCE` | Interiors and emotional descriptions remain memoir-dependent |
| 26 | First Moscow recital on 7 November | Russian program, Pravda/Izvestia reports, McVay notes | `CONTEMPORARY-EVENT-VERIFIED` | Program/reviews do not prove first-meeting date |
| 27 | Pravda/Izvestia response on 9 November | McVay exact newspaper citations; NEB newspaper holdings | `PERIODICAL-WITNESS-LOCATED` | Page images should be captured before quoting verbatim |
| 28 | Debate `Нужен ли Большой театр?`, 10 November | `Театральная Москва` no. 7 and Meyerhold commentary tradition | `CONTEMPORARY-DEBATE-VERIFIED` | Stanislavsky/Meyerhold positions belong to art controversy, not private relationship |
| 29 | Duncan `Искусство для масс`, 23 November | Izvestia citation and McVay notes | `CONTEMPORARY-AUTHORIAL-POSITION` | Political-artistic rhetoric must remain Duncan's stated position |
| 30 | Official school opening 3 December | Irma Duncan memoir and McVay reconstruction | `MEMOIR-CHRONOLOGY-COLLATED` | Exact administrative opening document not yet acquired |
| 31 | Number of pupils: 25 / 40 / 50 | Irma Duncan, Shneider, Duncan/Macdougall, photograph count | `SOURCE-CONFLICT-EXPLICIT` | Never state `one thousand pupils`; promises and actual enrollment differ |
| 32 | Divorce from Zinaida Reich: 5 October 1921 | FEB PSS collective-document comments | `ACADEMIC-DOCUMENT-DATE` | Exact civil document facsimile remains pending |
| 33 | Registered marriage with Duncan: 2 May 1922 | FEB PSS comments citing contemporary record | `FORMAL-MARRIAGE-DATE` | Esenin's 1924 phrase `1921 married` is retrospective shorthand |
| 34 | Second registration abroad | Esenin to Shneider, 21 June 1922 | `PRIMARY-LETTER-VERIFIED` | Letter reflects Esenin's formulation, not a complete foreign civil file |
| 35 | Departure to Germany: 10 May 1922 | FEB PSS collective documents and newspaper chronology | `EXACT-TRAVEL-DATE` | Belongs to Part II, only used as series-boundary preview |
| 36 | Esenin's state in December 1921 | Letter to Klyuev: soul tired/confused | `PRIMARY-LETTER-VERIFIED` | Does not prove Duncan caused the crisis |
| 37 | Esenin on Duncan and Europe, 21 June 1922 | Letter to Shneider | `PRIMARY-LETTER-VERIFIED` | Later foreign-period evidence cannot be projected backward into first night |
| 38 | Known correspondence count | PSS vol. 6 index: 5 Esenin items plus inscription; 5 Duncan notes/telegrams | `ACADEMIC-CORPUS-COUNT` | Count follows edition scope and may change with discoveries |
| 39 | Break telegram, 13 October 1923 | PSS academic comments | `PRIMARY-CORRESPONDENCE-REPORTED` | Not relevant evidence for feelings in October 1921 |
| 40 | Retrospective autobiography says `1921 married` | Esenin autobiography, 1924 | `PRIMARY-AUTHORIAL-RETROSPECTION` | Not a civil-date witness and compresses chronology |
| 41 | NYPL Isadora programs and announcements | NYPL Digital Collections / Jerome Robbins Dance Division | `INSTITUTIONAL-COLLECTION-LOCATED` | Individual Russian program object still requires item-level capture |
| 42 | Mariengof editions in RSL | RSL records for 1927 and 1928 `Роман без вранья`, full digital access declared | `FIRST-EDITION-PURSUIT-ENABLED` | Later FEB edition should be collated against exact early pages before quotation topology freezes |
| 43 | External bibliography for McVay book | Open Library: LCCN, OCLC, ISBN, bibliography and index; Google Books edition records | `EXTERNAL-BIBLIOGRAPHY-COLLATED` | Catalog metadata does not supersede title/copyright pages in user copy |
| 44 | Does this replace `Esenin: A Life`? | McVay book scope, contents and bibliography compared with 1976 biography records | `PARTIAL-REQUEST-FULFILLED` | Relationship monograph acquired; full early-life biography remains separately useful |

## Source hierarchy after pass 5

### Tier 1 — public prose controlling sources

1. Academic PSS comments and indices;
2. academic Chronicle entries;
3. exact letters and collective documents in PSS;
4. contemporaneous newspapers/programs when page image or exact academic transcription is available.

### Tier 2 — reconstruction and contextual control

1. McVay 1980 with exact printed pages and notes;
2. McVay 1976 when supplied/acquired;
3. later academic source criticism;
4. institutional catalog/finding-aid metadata.

### Tier 3 — memoir testimony with named authorship

- Mariengof;
- Shneider;
- Konenkov;
- Gorodetsky;
- Ivnev;
- Startsev;
- Babenchikov;
- Duncan/Macdougall.

Every such statement must be written as testimony, not omniscient narration.

### Tier 4 — excluded from exact scene reconstruction

- Mary Desti hearsay;
- Sabaneev's late anecdote;
- Georgy Ivanov's fanciful variant;
- unsupported modern retellings;
- causal statements blaming Duncan for all prior drinking, family or literary crises.

## Exact changes required in section 12

1. Replace the compact `вероятно, 3 октября` sentence with the full reconstruction hierarchy.
2. Add the conflict between McVay's `exact date unknown`, academic `видимо, 3 октября`, Shneider's pre-November-7 implication, and Duncan/Macdougall's early-November version.
3. State that the Yakulov studio is much better supported than the precise calendar date.
4. Keep the `golden head / angel / devil` episode attributed to Mariengof and explicitly non-stenographic.
5. Add a chronology bridge: Duncan arrives 23 July; first recital 7 November; Shneider meets Esenin 8 November; formal marriage occurs only 2 May 1922.
6. Preserve the causal boundary: Esenin's December 1921 letter records an existing crisis but does not name Duncan as its cause.

## New physical/document targets

- exact PSS/Chronicle printed pages supporting 3 October reconstruction;
- exact pages from `Материалы к биографии`, p. 110, cited by PSS;
- first-edition pages of Mariengof's `Роман без вранья` for the Yakulov scene;
- `Театральная Москва` 1921 no. 2, 7, 8 and 11–12 page images;
- Izvestia 24 August, 9 November and 23 November 1921 page images;
- Pravda 9 November 1921 page image;
- Russian program for Duncan's 7 November recital in the NYPL Dance Collection;
- civil facsimile for the 5 October 1921 divorce;
- civil facsimile for the 2 May 1922 marriage.

## Publication boundary

Pass 5 does not:

- authorize the user-supplied PDF for redistribution;
- promote a secondary quotation to primary evidence;
- authorize any documentary image for production;
- register or publish the article route;
- close the exact first-meeting-date question;
- remove existing archive and page-witness holds.
