# Сергей Есенин, часть I: 1895–1921 — canonical authoring matrix V2

Дата: 2026-07-24

Issue: #76

Статус: `42-SOURCES-VERIFIED / 14-PRIMARY-RECORDS / 7-EXACT-FEB-PAGE-IMAGES / SECTIONS-1-7-DRAFTED / SECTIONS-8-12-IN-AUTHORING / PUBLICATION-NOT-AUTHORIZED`

## Канонический статус

Этот файл заменяет `PART_ONE_1895_1921_AUTHORING_MATRIX.md` как текущая рабочая матрица. Старая версия сохраняется как исторический baseline структуры до полного source sweep. V2 связывает:

- 12 разделов статьи;
- устойчивые block IDs;
- 42 классифицированных source records;
- 14 primary-classified records;
- семь exact FEB published-page images;
- 42-позиционный internet verification pass;
- уже написанную авторскую прозу;
- конкретные недостающие документы и книги;
- редакционные, богословские, provenance- и publication-границы.

Основные рабочие файлы:

- `PART_ONE_SOURCE_VERIFICATION_PASS4_2026-07-24.md`;
- `PART_ONE_DRAFT_1895_1921.md`;
- `PART_ONE_PAGE_WITNESS_LEDGER.md`;
- `PART_ONE_FEB_ACQUISITION_RESULTS_2026-07-24.md`;
- `part-one-claim-ledger-pass1.md`;
- `src/data/essays/yeseninPartOneSources*.ts`.

## Серия и граница материала

```ts
{
  id: 'essay-yesenin-1895-1921',
  slug: 'yesenin-1895-1921',
  poetId: 'sergei-yesenin',
  series: {
    id: 'yesenin-biography-1895-1925',
    label: 'Сергей Есенин: жизнь, поэзия и документы',
    part: 1,
    total: 2,
  },
  cluster: {
    id: 'yesenin-life-texts-archive',
    label: 'Есенин: жизнь, тексты, архив',
    role: 'biography',
    order: 10,
  },
  relatedEssayIds: ['essay-yesenin-kutezhi'],
}
```

Граница серии: `1895–1921 / 1921–1925`.

Встреча с Айседорой Дункан — композиционный переходный узел, но не единственная причина поздних конфликтов, поездок, пьянства, семейного распада или смерти.

## Статусы разделов

| № | Раздел | Текущий статус | Написано | Главный оставшийся пробел |
|---:|---|---|---|---|
| 1 | Константиново и семья | `DRAFT-WRITTEN / CITATION-CONVERSION-REQUIRED` | лид, рождение, семья Титовых, церковный язык, училище | метрическая запись/object-level family provenance |
| 2 | Спас-Клепики | `DRAFT-WRITTEN / EXACT-WITNESS-GUARDED` | официальное название, тип школы, распорядок, ранние стихи, свидетельство № 85 | права и object provenance школьного свидетельства |
| 3 | Москва: Сытин и Шанявский | `DRAFT-WRITTEN / ARCHIVE-DETAILS-PENDING` | переезд, должность подчитчика, рабочая среда, университет, публикации | exact employment/address and university registration witnesses |
| 4 | Анна Изряднова и сын | `DRAFT-WRITTEN / CAUSAL-BOUNDARY-LOCKED` | знакомство, совместная жизнь, рождение сына, отъезд, нравственная оценка | запись о рождении Юрия/Георгия и полный мемуарный контекст |
| 5 | Петербург и Блок | `DRAFT-WRITTEN / PRIMARY-PAIR-COLLATED` | записка, дневник, оценка, рекомендации, не-мгновенное признание | exact image/object provenance записки Блоку |
| 6 | Клюев и стратегия | `DRAFT-WRITTEN / CORRESPONDENCE-GAPS-DECLARED` | переписка, костюм, сеть, agency boundary | полная корреспонденция и provenance афиш/фотографий |
| 7 | `Радуница` | `DRAFT-WRITTEN / PDF-PAGE-COLLATION-PENDING` | библиография, поэтика, религиозный язык, богословская граница | PDF первого издания: титул, содержание, страницы текстов, фактический выход |
| 8 | Поезд № 143 | `SOURCE-PACK-READY / PROSE-NEXT` | source map и exact FEB images готовы | controlling RGIA originals и права на изображения |
| 9 | Райх, дети, революция | `PARTIAL-SOURCE / EXACT-1917-1918-COLLATION-HOLD` | структура и границы готовы | exact 1917–1918 chronology, marriage/birth/divorce records |
| 10 | Религиозно-революционные поэмы | `PRIMARY-TEXTS-COLLATED / PROSE-NEXT` | тексты `Октоиха`, `Отчаря`, `Преображения`, `Инонии`, `Ключей Марии` сверены | secondary scholarship and first-publication witnesses |
| 11 | Имажинизм | `PARTIAL / FIRST-PUBLICATION-HOLD` | академическая хронология и авторская эстетика собраны | internal pages `Сирены`, physical `Советская страна` № 3, actual release dates |
| 12 | Переход к 1921 году | `PARTIAL / CHRONICLE-V3-DATING-REQUIRED` | композиционная функция и causal boundaries готовы | exact chronology 1921, Duncan meeting, first `Исповедь хулигана` book pages |

## Section 1 — Константиново и семья

Anchor: `konstantinovo-i-semya`

Действующие block IDs:

- `yesenin-p1-konstantinovo-birth-date`;
- `yesenin-p1-konstantinovo-family-separation`;
- `yesenin-p1-konstantinovo-grandparents-household`;
- `yesenin-p1-konstantinovo-church-language`;
- `yesenin-p1-konstantinovo-school-completion`;
- `yesenin-p1-konstantinovo-oral-and-book`.

Проверенные тезисы:

- 21 сентября / 3 октября 1895 года;
- Константиново Рязанского уезда;
- поздние автобиографии подтверждают воспитание у Титовых, но остаются ретроспективой;
- церковная и устная среда формировала словарь, но не доказывает зрелое личное исповедание;
- земское училище и школьный переход документированы.

HOLD:

- object-level метрическая запись;
- непрерывная реконструкция семейной опеки;
- психологическое выведение всей поэтики из одного детского эпизода.

## Section 2 — Спас-Клепики

Anchor: `spas-klepiki`

Действующие block IDs:

- `yesenin-p1-spas-klepiki-official-school-name`;
- `yesenin-p1-spas-klepiki-school-type`;
- `yesenin-p1-spas-klepiki-daily-order`;
- `yesenin-p1-spas-klepiki-church-slavonic`;
- `yesenin-p1-spas-klepiki-early-writing`;
- `yesenin-p1-spas-klepiki-early-poetics`;
- `yesenin-p1-spas-klepiki-certificate`;
- `yesenin-p1-spas-klepiki-to-moscow`.

Обязательная формула:

> Спас-Клепиковская второклассная учительская школа духовного ведомства.

Запрещённая как официальное название формула:

> церковно-учительская школа.

Exact witness:

- certificate printed page 545;
- source image SHA-256 `cc608f256a4102c968b6c1401f83a95c475cad738db1c4e6cfa4c5d88674dd10`;
- layer: `published-page`;
- rights/object provenance unresolved;
- production reuse unauthorized.

## Section 3 — Москва: типография и университет Шанявского

Anchor: `moskva-tipografiya-shanyavskiy`

Действующие block IDs:

- `yesenin-p1-moscow-arrival-work`;
- `yesenin-p1-moscow-father-conflict`;
- `yesenin-p1-moscow-sytin-printing-house`;
- `yesenin-p1-moscow-worker-literary-circles`;
- `yesenin-p1-moscow-city-modernity`;
- `yesenin-p1-moscow-shanyavsky-university`;
- `yesenin-p1-moscow-shanyavsky-reading`;
- `yesenin-p1-moscow-first-publications`;
- `yesenin-p1-moscow-before-petrograd`.

Редакционные ограничения:

- писать `подчитчик`, когда речь идёт о первоначальной должности у Сытина;
- политический контакт или полицейское наблюдение не превращать в доказанное партийное членство;
- университет Шанявского описывать как посещение/обучение слушателя, не законченное высшее образование;
- спорные ранние атрибуции не использовать как устойчивый канон.

## Section 4 — Анна Изряднова и сын

Anchor: `anna-izryadnova-i-syn`

Действующие block IDs:

- `yesenin-p1-izryadnova-meeting-household`;
- `yesenin-p1-izryadnova-shared-life`;
- `yesenin-p1-izryadnova-son-birth`;
- `yesenin-p1-izryadnova-fatherhood-memory`;
- `yesenin-p1-izryadnova-separation-boundary`;
- `yesenin-p1-izryadnova-moral-assessment`;
- `yesenin-p1-izryadnova-transition-petrograd`.

Разрешено:

- знакомство в типографии;
- совместная жизнь;
- рождение сына 21 декабря 1914 года;
- двойное имя Юрий/Георгий с пояснением;
- последующий отъезд и раздельная жизнь;
- нравственно назвать тяжесть ответственности.

Запрещено:

- утверждать единственный мотив `оставил ради поэзии`;
- превращать позднюю судьбу сына в ретроспективное доказательство мотивов 1915 года;
- выдавать мемуарную сцену за полный семейный протокол.

## Section 5 — Петербург и Блок

Anchor: `peterburg-i-blok`

Действующие block IDs:

- `yesenin-p1-blok-arrival-9-march-1915`;
- `yesenin-p1-blok-note-tone`;
- `yesenin-p1-blok-letter-and-diary`;
- `yesenin-p1-blok-recommendation-network`;
- `yesenin-p1-blok-not-instant-fame`;
- `yesenin-p1-blok-real-significance`;
- `yesenin-p1-blok-legend-boundary`.

Primary pair:

- записка Есенина 9 марта 1915 года;
- дневниковая/записная запись Блока того же дня.

Редакционная формула:

> Блок не создал голос Есенина и не сделал его знаменитым за один день, но его оценка и рекомендации открыли важную сеть литературных контактов.

## Section 6 — Клюев и литературная стратегия

Anchor: `klyuev-i-literaturnaya-strategiya`

Действующие block IDs:

- `yesenin-p1-klyuev-meeting-correspondence`;
- `yesenin-p1-klyuev-correspondence-gaps`;
- `yesenin-p1-klyuev-costume-stage-image`;
- `yesenin-p1-klyuev-agency-boundary`;
- `yesenin-p1-klyuev-publishing-network`;
- `yesenin-p1-klyuev-aesthetic-boundary`.

Разделять:

1. сохранившуюся переписку;
2. редакционную реконструкцию утраченных писем;
3. совместные выступления и костюм;
4. издательскую сеть;
5. поздние мемуары;
6. самостоятельную agency Есенина.

Запрещено:

- `Клюев придумал Есенина`;
- воспроизводить несохранившееся письмо как прямую речь;
- превращать костюм в доказательство полной неискренности или полной наивности.

## Section 7 — `Радуница`

Anchor: `radunitsa`

Действующие block IDs:

- `yesenin-p1-radunitsa-bibliographic-date`;
- `yesenin-p1-radunitsa-date-method`;
- `yesenin-p1-radunitsa-not-photograph`;
- `yesenin-p1-radunitsa-animated-world`;
- `yesenin-p1-radunitsa-religious-language`;
- `yesenin-p1-radunitsa-theological-boundary`;
- `yesenin-p1-radunitsa-biographical-synthesis`;
- `yesenin-p1-radunitsa-transition-train`.

Проверенная библиография:

- Петроград;
- издатель М. В. Аверьянов;
- 1916;
- 62 страницы;
- 17 см.

Развести четыре временных слоя:

1. создание стихотворений;
2. сборка рукописи;
3. набор/появление экземпляров;
4. официальный год издания.

До page-level PDF collation не превращать позднее упоминание ноября 1915 года в бесспорную дату выхода.

## Section 8 — Военная служба: поезд № 143

Anchor: `voenno-sanitarnyy-poezd-143`

Запланированные block IDs:

- `yesenin-p1-train-143-enlistment-date`;
- `yesenin-p1-train-143-team-record`;
- `yesenin-p1-train-143-wagon-six`;
- `yesenin-p1-train-143-routes-and-wounded`;
- `yesenin-p1-train-143-lazaret-17-rejection`;
- `yesenin-p1-train-143-tsarskoe-selo-context`;
- `yesenin-p1-train-143-literary-activity`;
- `yesenin-p1-train-143-political-boundary`.

Обязательная формула:

> С 20 апреля 1916 года Есенин состоял в команде санитаров Полевого Царскосельского военно-санитарного поезда № 143 и в документах обозначался санитаром вагона № 6.

Exact published-page witnesses:

- assignment page 673, SHA-256 `b9ce49137fa139faa1ee47e8e33d6e4592ac2d4bed1e2b69ac8da88c167c1484`;
- reports pages 688, 689, 691;
- personnel photograph page 690;
- all records remain `published-page`, not archive-original;
- controlling RGIA originals and rights remain HOLD.

Запрещено:

- формальная служба в лазарете № 17 как установленный факт;
- окопная служба;
- чисто канцелярская должность без соприкосновения санитарного поезда с ранеными;
- придворное выступление как автоматическое доказательство монархизма.

## Section 9 — Зинаида Райх, дети и революционный период

Anchor: `raykh-deti-revolyutsiya`

Запланированные block IDs:

- `yesenin-p1-reich-meeting-and-marriage`;
- `yesenin-p1-reich-marriage-record`;
- `yesenin-p1-reich-children-records`;
- `yesenin-p1-reich-family-memory`;
- `yesenin-p1-reich-separation-boundary`;
- `yesenin-p1-revolution-biographical-context`.

Source status:

- volume 2 academic context verified;
- Reich documentary commentary verified;
- Tatiana Yesenina memoir verified as named family testimony;
- exact 1917 and 1918 chronology pages remain legacy-encoding collation HOLD;
- marriage, birth and divorce page witnesses remain required before final prose freezing.

Запрещено:

- достраивать точные мотивы супругов из поздней памяти;
- использовать последующую судьбу Райх как объяснение начала брака;
- смешивать семейный конфликт с революционной поэтикой без отдельного моста источников.

## Section 10 — Религиозно-революционные поэмы

Anchor: `religiozno-revolyutsionnye-poemy`

Запланированные block IDs:

- `yesenin-p1-poems-oktoikh-liturgical-frame`;
- `yesenin-p1-poems-otchar-peasant-renewal`;
- `yesenin-p1-poems-preobrazhenie-new-world`;
- `yesenin-p1-poems-inoniya-cross-conflict`;
- `yesenin-p1-poems-klyuchi-marii-aesthetics`;
- `yesenin-p1-poems-biblical-lexicon`;
- `yesenin-p1-poems-interpretation-boundary`;
- `yesenin-p1-poems-christian-reflection`.

Primary corpus collation complete for:

- `Октоих`;
- `Отчарь`;
- `Преображение`;
- `Инония`;
- `Ключи Марии`;
- manuscript plan for `Преображение`.

Богословский метод:

1. назвать точную библейскую или литургическую лексику;
2. установить функцию образа внутри текста;
3. отделить поэтического субъекта от биографического протокола;
4. обозначить редакционную богословскую оценку как interpretation/reflection;
5. не считать церковные слова автоматическим доказательством ортодоксии;
6. не считать конфликтный образ окончательным исчерпывающим исповеданием автора.

## Section 11 — Имажинизм

Anchor: `imazhinizm`

Запланированные block IDs:

- `yesenin-p1-imaginism-declaration-context`;
- `yesenin-p1-imaginism-signatories`;
- `yesenin-p1-imaginism-sirena-witness`;
- `yesenin-p1-imaginism-sovetskaya-strana-witness`;
- `yesenin-p1-imaginism-public-actions`;
- `yesenin-p1-imaginism-stoylo-pegasa`;
- `yesenin-p1-imaginism-klyuchi-marii-boundary`;
- `yesenin-p1-imaginism-publicity-boundary`.

Acquired:

- exact cover of `Сирена` № 4–5, page 621;
- image URL `https://feb-web.ru/feb/esenin/pictures/El2-6212.jpg`;
- SHA-256 `a316190933bcbdb433c835359d971854176a32d808787bcdc0050aad5b501cb4`.

Still HOLD:

- internal declaration pages;
- physical `Советская страна` № 3, 10 February 1919;
- printed date versus actual release date;
- exact first-publication priority.

Запрещено:

- объявлять каждый скандал рассчитанной рекламой;
- считать коллективный манифест полной системой личных убеждений Есенина;
- смешивать `Ключи Марии` с коллективной декларацией.

## Section 12 — Переход к 1921 году

Anchor: `perekhod-k-1921`

Запланированные block IDs:

- `yesenin-p1-transition-ispoved-text-and-book`;
- `yesenin-p1-transition-hooligan-mask`;
- `yesenin-p1-transition-literary-position-1921`;
- `yesenin-p1-transition-family-and-circle`;
- `yesenin-p1-transition-duncan-meeting`;
- `yesenin-p1-transition-series-boundary`.

Проверено:

- `Исповедь хулигана` как текст относится к 1920 году;
- письмо 4 декабря 1920 года подтверждает существование завершённого сочинения;
- книга вышла между концом декабря 1920 года и не позднее 5 января 1921 года;
- строка о намеренно нечесаном облике принадлежит художественной маске и публичной авторской стратегии.

HOLD:

- exact title/content pages первого издания;
- окончательная дата фактического выхода;
- exact date/place first Duncan meeting;
- попытка объявить к 1921 году революционное разочарование `окончательным`.

## Source and citation gate

Текущий корпус:

- 42 unique canonical HTTPS URLs;
- 14 primary-classified records;
- 39 content/bibliography-collated records;
- 3 exact legacy-encoding URLs requiring local re-extraction;
- 8 page-witness targets;
- 7 exact published-page images acquired and hashed;
- 0 records promoted to archive-original;
- 0 document images authorized for production reuse.

Следующая техническая стадия:

1. перенести authored Markdown blocks в unpublished typed `yeseninPartOne.ts`;
2. создать `yeseninPartOneCitations.ts`;
3. проверить каждый source ID и claim ID;
4. запретить orphan/duplicate/type-mismatch citations;
5. сохранить route unregistered;
6. после полной прозы и media decision запустить publication QA.

## Media and publication boundary

До отдельного решения запрещено:

- рендерить remote image URL;
- публиковать FEB scans как будто права автоматически разрешены;
- называть FEB published-page archive-original;
- использовать фотографию персонала поезда № 143 в production;
- регистрировать public route;
- добавлять статью в sitemap, cluster или related navigation.

## Следующий авторский порядок

1. написать раздел 8 о поезде № 143;
2. написать раздел 10 о религиозно-революционных поэмах;
3. повторно извлечь страницы 1917–1918;
4. написать bounded draft о Райх;
5. получить внутренние страницы декларации;
6. написать имажинистский раздел;
7. закрыть переход к 1921 году;
8. выполнить сквозную литературную редактуру;
9. преобразовать block tags в typed citations;
10. только после provenance/media и exact-head QA принимать publication decision.