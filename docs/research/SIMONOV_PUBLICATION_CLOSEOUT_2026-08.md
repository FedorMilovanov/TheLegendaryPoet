# «Сын артиллериста»: publication closeout

Статус: **PUBLICATION CANDIDATE REGISTERED / APPROVED HERO PRESENT / CLAIM-AWARE READER SAFETY PRESERVED / EXACT-HEAD CI + BROWSER QA PENDING**

Дата состояния: **2026-08-19**.

## Что закрыто

- Публичный объект статьи сформирован через `src/data/essays/simonovSonArtilleristaPublished.ts` и зарегистрирован в каноническом каталоге `src/data/essays/index.ts`.
- Exact production hero присутствует только как оптимизированный WebP: `public/images/essays/simonov/simonov-son-artillerista-hero.webp`, 1600×900, 130 386 bytes, SHA-256 `5aa9024cab522b4a6b4686231ba09b91dcc66969b85ba8f5f6dcecce67e16dd5`.
- Owner approval exact hero объекта отдельно зафиксирован в `SIMONOV_SON_ARTILLERISTA_HERO_APPROVAL_2026-08.md`.
- Обложка публично классифицируется только как редакционная реконструкция; она не выдаётся за документальную фотографию Ивана Лоскутова, конкретной высоты или боя 1941 года.
- В публичном теле нет документальных image-блоков и нет полного текста поэмы.
- Внутренняя staging-формулировка `Hero-кандидат` / `До production merge` не попадает в reader-facing объект; вместо неё опубликована короткая прозрачная оговорка о реконструкции.
- Публичный excerpt уточнён: группа потребовала открыть огонь прямо по занимаемой высоте, без усиления формулой, которой нет необходимости приписывать документу.
- Search index, sitemap и Atom feed синхронизированы с новым зарегистрированным материалом.

## Claim-aware границы, которые остаются обязательными

Предыдущий `SIMONOV_PUBLICATION_READINESS_GATE_2026-08.md` остаётся authoritative для границ утверждений, но его transaction-state `hero pending / catalog not registered` superseded этим closeout.

Публичный reader продолжает соблюдать следующие ограничения:

1. Бой датируется июлем 1941 года; exact day не объявляется установленным. Locator наградного объекта `10800112` упоминается только с явной оговоркой, что scan не просмотрен и связанная с ним дата 31 июля не повышается до безусловного факта.
2. Числа из непроверенного award scan — `6 суток`, `500–600 метров`, `~2 км` — не используются как установленные reader facts.
3. Разночтение `командир / комиссар` в спорном print witness не превращается в уверенное описание момента подтверждения команды: reader говорит нейтрально — `На командном пункте решили, что произошла ошибка, и запросили подтверждение.`
4. Конфликт имени отца Лоскутова не решается догадкой; reader не называет его спорное имя.
5. Дата 3 декабря для `Патриота Родины` атрибутируется институциональным источникам, но статья прямо говорит, что полоса не просмотрена и не объявляет эту публикацию безоговорочно `самой первой`.
6. `Красная звезда` №288 от 7 декабря 1941 года, printed p.3, может описываться как direct-inspected; p.4 также просмотрена и продолжения не содержит.
7. Hero всегда reconstruction; archival `coverSourceUrl` для него запрещён.
8. Full poem reproduction и неподтверждённые documentary body images остаются запрещены.

## Что ещё не считается закрытым

Этот файл не заменяет execution evidence. PR остаётся draft до проверки exact current head. Перед переводом в merge-ready должны быть зелёными или содержательно разобраны:

- обычный CI / typecheck / content-model checks;
- Simonov publication source gate;
- generated discovery-artifact validation;
- Articles catalog acceptance на опубликованном slug;
- browser QA минимум Chromium + Android + iPhone/WebKit, с инфраструктурными download/apt flakes отделёнными от product failures.

Merge в `main` этим документом не разрешается автоматически.
