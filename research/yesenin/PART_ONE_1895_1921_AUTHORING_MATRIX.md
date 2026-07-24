# Сергей Есенин, часть I: 1895–1921 — canonical authoring matrix

Дата: 2026-07-24

Issue: #76

Статус: `STRUCTURE-LOCKED / SOURCE-ASSEMBLY-REQUIRED / PUBLIC-PROSE-NOT-YET-AUTHORIZED`

## Назначение

Этот документ переводит полезную структуру закрытого PR #34 в текущую архитектуру research. Он не является готовой статьёй и не разрешает перенос старого текста. Его задача — заранее закрепить:

- редакционную границу серии;
- стабильные section/block IDs;
- обязательные primary witnesses;
- допустимые и запрещённые формулировки;
- provenance-требования к изображениям;
- technical/QA contract до написания публичной прозы.

Основание:

- `research/REMOTE_PR34_EXTRACTION_LEDGER_2026-07-23.md`;
- `research/yesenin/part-one-claim-ledger-pass1.md`;
- `research/SOURCE_POLICY.md`;
- `docs/PUBLIC_CLAIM_BOUNDARIES.md`;
- issue #49;
- canonical `Essay` / `EssayBlock` schema;
- текущая часть II `yesenin-kutezhi` и её documentary wrapper.

## Canonical identity and series contract

Предлагаемые значения до регистрации data file:

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

После регистрации части I существующая часть II должна получить:

- ту же `series.id`, `part: 2`, `total: 2`;
- тот же cluster с `order: 20`;
- обратную `relatedEssayIds`-ссылку на `essay-yesenin-1895-1921`.

Граница серии — `1895–1921 / 1921–1925`. Встреча с Айседорой Дункан служит переходным узлом, но не объявляется единственной причиной позднего кризиса.

## Block identity policy

Каждый sourced prose block получает lowercase kebab-case `id` до присоединения citations. ID не выводится из начала текста и не меняется при стилистической правке.

Предлагаемый namespace:

- `yesenin-p1-lead-*`;
- `yesenin-p1-konstantinovo-*`;
- `yesenin-p1-spas-klepiki-*`;
- `yesenin-p1-moscow-*`;
- `yesenin-p1-izryadnova-*`;
- `yesenin-p1-blok-*`;
- `yesenin-p1-klyuev-*`;
- `yesenin-p1-radunitsa-*`;
- `yesenin-p1-train-143-*`;
- `yesenin-p1-reich-revolution-*`;
- `yesenin-p1-religious-poems-*`;
- `yesenin-p1-imaginism-*`;
- `yesenin-p1-transition-1921-*`.

Citation rules должны ссылаться только на эти ID и проходить topology/type/orphan/duplicate validation.

## Section-by-section matrix

### 1. Константиново и семья

Section anchor: `konstantinovo-i-semya`

Minimum prose IDs:

- `yesenin-p1-konstantinovo-birth-family`;
- `yesenin-p1-konstantinovo-grandparents-household`;
- `yesenin-p1-konstantinovo-church-school-memory`.

Документировать:

- дату и место рождения;
- родителей и фактическое воспитание в семье Титовых;
- начальную школу и раннюю среду;
- церковную лексику детства как биографическую среду, а не доказательство поздней личной веры.

Primary/source targets:

- метрическая/семейная документация в академической Летописи;
- ПСС, автобиографии и ранние письма;
- музейные object/collection cards, если они ведут к конкретному документу;
- документы Константиновского земского училища.

Запрещено без источника:

- психологически выводить всю поэтику из одного эпизода детства;
- романтизировать семейные конфликты или приписывать родственникам неподтверждённые мотивы;
- представлять поздние автобиографические формулы как синхронный дневник ребёнка.

Readiness: `SOURCE-ASSEMBLY-REQUIRED`.

### 2. Спас-Клепики

Section anchor: `spas-klepiki`

Minimum prose IDs:

- `yesenin-p1-spas-klepiki-official-school-name`;
- `yesenin-p1-spas-klepiki-study-dates`;
- `yesenin-p1-spas-klepiki-early-writing`.

Обязательная формула:

- **Спас-Клепиковская второклассная учительская школа духовного ведомства**.

Нельзя использовать как точное официальное название:

- «церковно-учительская школа».

Source targets:

- академическая Летопись;
- официальная музейная справка;
- school records / curriculum / pupil documentation;
- ранние произведения и поздние воспоминания с явным разделением жанров.

Readiness: `CORE-CLAIM-VERIFIED / PAGE-CITATIONS-REQUIRED`.

### 3. Москва: типография и университет Шанявского

Section anchor: `moskva-tipografiya-shanyavskiy`

Minimum prose IDs:

- `yesenin-p1-moscow-arrival-work`;
- `yesenin-p1-moscow-sytin-printing-house`;
- `yesenin-p1-moscow-shanyavsky-university`;
- `yesenin-p1-moscow-worker-literary-circles`.

Документировать отдельно:

- переезд и трудовые занятия;
- типографию и конкретную должность;
- посещение/обучение в университете Шанявского;
- литературные и политические связи — только по конкретным документам.

Не смешивать:

- employment record;
- позднюю автобиографическую самоинтерпретацию;
- политическую принадлежность, если документ подтверждает лишь участие/контакт.

Source targets:

- Летопись т. 1;
- документы типографии;
- университетские регистрационные данные;
- ранние письма/автобиографии;
- первые публикации с библиографическими карточками.

Readiness: `SOURCE-ASSEMBLY-REQUIRED`.

### 4. Анна Изряднова и сын

Section anchor: `anna-izryadnova-i-syn`

Minimum prose IDs:

- `yesenin-p1-izryadnova-meeting-household`;
- `yesenin-p1-izryadnova-son-birth`;
- `yesenin-p1-izryadnova-separation-boundary`.

Можно утверждать:

- знакомство в типографии;
- совместную жизнь;
- рождение сына Юрия/Георгия в конце декабря 1914 года;
- последующий отъезд и раздельную жизнь.

Нельзя утверждать одной готовой причиной:

- «оставил семью, потому что его позвала поэзия»;
- любую другую единственную психологическую реконструкцию.

Редакционный принцип:

- нравственная ответственность может быть названа;
- мотив должен оставаться ограниченным документами и свидетельствами, а не авторской догадкой.

Source targets:

- запись о рождении/семейные документы;
- мемуар Изрядновой с genre note;
- письма и академическая хронология;
- документы типографии.

Readiness: `FACT-BOUNDARY-LOCKED / PRIMARY-FACSIMILES-REQUIRED`.

### 5. Петербург и Александр Блок

Section anchor: `peterburg-i-blok`

Minimum prose IDs:

- `yesenin-p1-blok-arrival-9-march-1915`;
- `yesenin-p1-blok-letter-and-diary`;
- `yesenin-p1-blok-recommendation-network`;
- `yesenin-p1-blok-first-publications`.

Exact event:

- встреча 9 марта 1915 года.

Primary pair:

- письмо Есенина;
- дневниковая запись Блока.

Допустимая формула:

- встреча и рекомендации открыли литературные связи и несколько дверей.

Недопустимая формула:

- одна встреча мгновенно «сделала Есенина известным» или «канонизировала» его.

Нужно показать процесс:

- рекомендации;
- знакомства;
- журнальные публикации;
- издательскую сеть;
- постепенное формирование репутации.

Readiness: `PRIMARY-PAIR-IDENTIFIED / PAGE-COLLATION-REQUIRED`.

### 6. Клюев и литературная стратегия

Section anchor: `klyuev-i-literaturnaya-strategiya`

Minimum prose IDs:

- `yesenin-p1-klyuev-meeting-correspondence`;
- `yesenin-p1-klyuev-costume-stage-image`;
- `yesenin-p1-klyuev-publishing-network`;
- `yesenin-p1-klyuev-agency-boundary`.

Разделить четыре слоя:

1. документированные встречи и переписку;
2. совместные выступления и одежду;
3. издательскую/салонную сеть;
4. поздние мемуарные интерпретации.

Запрещено:

- «Клюев придумал Есенина»;
- объяснять все решения Есенина одной чужой манипуляцией;
- превращать сценический костюм в психологический диагноз.

Source targets:

- переписка Есенина и Клюева;
- афиши и фотографии с provenance;
- first-publication records;
- дневники/мемуары с явной genre classification.

Readiness: `STRUCTURE-READY / PRIMARY-CORRESPONDENCE-REQUIRED`.

### 7. «Радуница»

Section anchor: `radunitsa`

Minimum prose IDs:

- `yesenin-p1-radunitsa-edition`;
- `yesenin-p1-radunitsa-textual-world`;
- `yesenin-p1-radunitsa-reception`;
- `yesenin-p1-radunitsa-religious-language-boundary`.

Required witness:

- полный scan первого/раннего издания с титулом, выходными данными, содержанием и целевыми страницами.

Разделить:

- текст стихов;
- библиографическую историю издания;
- современную рецепцию;
- позднейшую канонизацию образа «крестьянского поэта».

Богословская граница:

- библейская/церковная лексика — текстовый факт;
- утверждение о личном спасительном исповедании автора требует отдельного основания;
- духовная интерпретация проекта маркируется как editorial reflection.

Readiness: `SCAN-AND-RECEPTION-SWEEP-REQUIRED`.

### 8. Военная служба: поезд № 143

Section anchor: `voenno-sanitarnyy-poezd-143`

Minimum prose IDs:

- `yesenin-p1-train-143-enlistment-date`;
- `yesenin-p1-train-143-team-record`;
- `yesenin-p1-train-143-lazaret-17-rejection`;
- `yesenin-p1-train-143-literary-activity`.

Обязательная формула:

- с 20 апреля 1916 года Есенин состоял в команде Царскосельского военно-санитарного поезда № 143.

Отклонённая формула:

- «был прикомандирован к лазарету № 17» как установленный факт.

Основание отклонения:

- академическая Летопись отмечает отсутствие Есенина в списках санитаров лазарета № 17.

Source targets:

- military/service records;
- academic chronicle page witnesses;
- train/team documents;
- letters and contemporary publications.

Readiness: `CORE-CLAIM-VERIFIED / ORIGINAL-RECORD-DESIRABLE`.

### 9. Зинаида Райх, дети и революционный период

Section anchor: `raykh-deti-revolyutsiya`

Minimum prose IDs:

- `yesenin-p1-reich-marriage-record`;
- `yesenin-p1-reich-children-records`;
- `yesenin-p1-reich-separation-boundary`;
- `yesenin-p1-revolution-biographical-context`.

Документировать раздельно:

- брак;
- рождение детей;
- совместную/раздельную жизнь;
- поездки и литературную деятельность;
- революционный контекст.

Не делать:

- превращать семейный конфликт в литературный сюжет без источника;
- приписывать Райх или Есенину точные мотивы по позднему пересказу;
- использовать судьбу Райх после Есенина как ретроспективное объяснение раннего брака.

Source targets:

- marriage/birth records;
- correspondence;
- academic chronicle;
- memoirs with provenance/genre notes.

Readiness: `PRIMARY-FAMILY-DOCUMENTS-REQUIRED`.

### 10. Религиозно-революционные поэмы

Section anchor: `religiozno-revolyutsionnye-poemy`

Minimum prose IDs:

- `yesenin-p1-poems-inoniya-publication`;
- `yesenin-p1-poems-preobrazhenie-publication`;
- `yesenin-p1-poems-biblical-lexicon`;
- `yesenin-p1-poems-interpretation-boundary`.

Primary textual corpus:

- «Инония»;
- «Преображение»;
- связанные тексты периода;
- first-publication witnesses and PSS commentary.

Допустимо:

- анализировать конкретную христианскую/библейскую лексику и образные трансформации.

Обязательно маркировать как interpretation:

- «крестьянская эсхатология»;
- богословскую оценку смешения христианских образов с революционной утопией;
- выводы о внутренней вере автора, если они не даны прямым свидетельством.

Нельзя выдавать editorial theology за архивный факт.

Readiness: `TEXTUAL-COLLATION-REQUIRED`.

### 11. Имажинизм

Section anchor: `imazhinizm`

Minimum prose IDs:

- `yesenin-p1-imaginism-declaration`;
- `yesenin-p1-imaginism-signatories-publication`;
- `yesenin-p1-imaginism-public-actions`;
- `yesenin-p1-imaginism-stoylo-pegasa`;
- `yesenin-p1-imaginism-publicity-boundary`.

Документировать:

- декларацию и first-publication record;
- конкретные афиши/акции;
- переименования/росписи только по датированным источникам;
- «Стойло Пегаса» и подтверждённую хозяйственную/публичную связь.

Запрещено:

- объявлять каждый последующий скандал заранее рассчитанной рекламой;
- переносить групповой манифест на все личные убеждения Есенина;
- смешивать позднюю легенду с синхронным документом.

Readiness: `PRIMARY-DECLARATION-AND-ACTION-RECORDS-REQUIRED`.

### 12. Переход к 1921 году и Айседоре Дункан

Section anchor: `perekhod-k-1921`

Minimum prose IDs:

- `yesenin-p1-transition-literary-position-1921`;
- `yesenin-p1-transition-family-and-circle`;
- `yesenin-p1-transition-duncan-meeting`;
- `yesenin-p1-transition-series-boundary`.

Функция раздела:

- завершить первую часть без преждевременного пересказа позднего распада;
- показать состояние литературной карьеры, семьи, окружения и публичного образа к 1921 году;
- ввести встречу с Дункан как один из переходных узлов.

Запрещено:

- объявлять Дункан единственной причиной пьянства, поездок, семейного кризиса или гибели;
- строить причинность из хронологического соседства;
- повторять материал части II вместо двусторонней навигации.

Readiness: `BOUNDARY-READY / PRIMARY-DATING-REQUIRED`.

## Required source registry before public prose

Minimum gate:

- 40+ unique canonical URLs after URL deduplication;
- 12–15 explicitly classified primary documents;
- stable source IDs and aliases;
- no orphan inline citations;
- every strong factual paragraph has block-level source IDs;
- catalogue-only/OCR-only witnesses retain limitation notes.

Required groups:

1. ПСС Есенина, т. 1–7;
2. Летопись, т. 1–3, with page witnesses for all biographical dates;
3. first/early editions: «Радуница», «Исповедь хулигана», «Пугачёв»;
4. письмо Есенина Блоку and Blok diary entry;
5. school records;
6. printing-house/employment records;
7. Shanyavsky University records;
8. Izryadnova family records;
9. Reich marriage/children records;
10. military-sanitary train no. 143 records;
11. Klyuev correspondence;
12. imagist declaration/first publication and dated public-action records.

Source counts do not replace facsimile/page verification.

## Source module plan

Do not append an unclassified bibliography directly to the essay file.

Proposed files:

- `src/data/essays/yeseninPartOne.ts` — authored blocks only;
- `src/data/essays/yeseninPartOneSources.ts` — classified canonical source records;
- `src/data/essays/yeseninPartOneCitations.ts` — stable block-ID citation map and topology guards;
- `src/data/essays/yeseninPartOneVisual.ts` — documentary wrapper with local media placement;
- `src/data/essays/yeseninPartOneMedia.ts` or existing media catalogue integration — provenance-safe media mapping.

`src/data/essays/index.ts` should register the final wrapped essay only after all validators pass.

## Media provenance matrix

No remote image URL may render directly in the article.

For each candidate:

- stable institution/Commons page URL;
- exact original URL;
- object/file identifier;
- creator/photographer raw attribution and normalized value;
- depicted date versus upload/scan date separated;
- location/subjects with evidence;
- licence template and licence URL;
- original MIME, dimensions, byte size and SHA-256;
- derivative AVIF/WebP dimensions and SHA-256;
- mediaKey and manifest record;
- accepted/rejected/unresolved editorial status.

Potential subjects, not yet accepted assets:

- early Yesenin portrait before 1915;
- Konstantinovo family/school witness;
- Spas-Klepiki school/document;
- Yesenin and Klyuev, 1916;
- military-sanitary train/service document;
- first edition/title pages of «Радуница»;
- document/photograph for imagist declaration or a dated action.

A reconstruction may appear only as `kind: 'reconstruction'`, never as the documentary hero while a verified archive portrait is available.

## Editorial and theological boundaries

- public prose distinguishes document, memoir, scholarship and project interpretation;
- spiritual language in poems is quoted and analysed textually;
- editorial biblical reflection uses a `reflection` block and does not masquerade as historical evidence;
- church memory, ritual language and theological imagery do not by themselves prove personal conversion or final spiritual state;
- moral evaluation must not invent motives or suppress documentary uncertainty;
- the article must not romanticize abandonment, scandal, alcohol or self-destruction.

## QA and publication gate

Before registration in `essays`:

1. source registry passes kind/URL/alias validation;
2. every required block ID exists exactly once;
3. citation topology and block types match;
4. media manifest and original provenance are complete;
5. TypeScript passes;
6. article-engine Playwright covers direct route, TOC, deep anchors, images and citations;
7. 66-scenario Chromium/Android/WebKit matrix passes;
8. reduced-motion, focus, overlay and scroll restoration pass;
9. generated sitemap/prerender includes the new route deterministically;
10. route chunks and asset budgets remain green;
11. final editorial review explicitly marks every section `PUBLIC-READY` or leaves the essay unregistered.

## Current readiness summary

| Layer | Status |
|---|---|
| 12-section structure | locked |
| official school name | verified |
| train no. 143 correction | verified in academic ledger; page citation required |
| Izryadnova motive boundary | locked |
| Blok causal boundary | locked; primary pair collation required |
| Klyuev causal boundary | locked |
| revolutionary-poem interpretation boundary | locked |
| imagism publicity boundary | locked |
| series/cluster technical contract | drafted |
| stable block namespace | drafted |
| 40+ source registry | not assembled |
| 12–15 primary witnesses | not assembled |
| media provenance | not assembled |
| public prose | not authorized |
| renderer registration | prohibited until gates pass |

## Next implementation order

1. build classified source registry and exact page ledger;
2. acquire/verify primary scans still missing;
3. freeze section/block topology;
4. write factual prose section by section from the ledger;
5. attach citations by stable ID;
6. acquire and classify media;
7. add series/cluster links to both parts;
8. run validators and browser QA;
9. perform final theological/literary editorial review;
10. only then register the essay and close issue #76.
