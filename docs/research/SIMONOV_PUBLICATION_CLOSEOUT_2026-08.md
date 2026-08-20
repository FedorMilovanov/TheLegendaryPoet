# «Сын артиллериста»: publication closeout

Статус: **PUBLICATION ARTIFACT COMPLETE / APPROVED HERO PRESENT / CLAIM-AWARE READER SAFETY PRESERVED / MERGE REQUIRES GREEN EXACT-HEAD CHECKS**

Дата состояния: **2026-08-20**.

## Что закрыто

- Публичный объект статьи сформирован через `src/data/essays/simonovSonArtilleristaPublished.ts` и зарегистрирован в каноническом каталоге `src/data/essays/index.ts`.
- Exact production hero присутствует только как оптимизированный WebP: `public/images/essays/simonov/simonov-son-artillerista-hero.webp`, 1600×900, 130 386 bytes, SHA-256 `5aa9024cab522b4a6b4686231ba09b91dcc66969b85ba8f5f6dcecce67e16dd5`.
- Owner approval exact hero объекта отдельно зафиксирован в `SIMONOV_SON_ARTILLERISTA_HERO_APPROVAL_2026-08.md`.
- Обложка публично классифицируется только как редакционная реконструкция; она не выдаётся за документальную фотографию Ивана Лоскутова, конкретной высоты или боя 1941 года.
- Exact hero также зарегистрирован в `public/images/PROVENANCE.yml` и независимо закреплён общим валидатором `scripts/validate-essay-covers.ts`: path, byte-size, SHA-256, alt и credit должны совпадать.
- В публичном теле нет документальных image-блоков и нет полного текста поэмы.
- Внутренние staging/research-формулировки не попадают в reader-facing объект; вместо них опубликованы нормальные русские читательские формулировки и короткая прозрачная оговорка о реконструкции.
- Публичный excerpt уточнён: группа потребовала открыть огонь прямо по занимаемой высоте, без усиления формулой, которой нет необходимости приписывать документу.
- Search index, sitemap и Atom feed синхронизированы с новым зарегистрированным материалом.
- Каталожная регистрация не меняет существующие публикационные данные других эссе; отдельный регрессионный просмотр diff обязателен перед merge.

## Claim-aware границы, которые остаются обязательными

Предыдущий `SIMONOV_PUBLICATION_READINESS_GATE_2026-08.md` остаётся authoritative для границ утверждений, но его transaction-state `hero pending / catalog not registered` superseded этим closeout.

Публичный reader продолжает соблюдать следующие ограничения:

1. Бой датируется июлем 1941 года; exact day не объявляется установленным. Архивный указатель наградного объекта `10800112` упоминается только с явной оговоркой, что scan не просмотрен и связанная с ним дата 31 июля не повышается до безусловного факта.
2. Числа из непроверенного award scan — `6 суток`, `500–600 метров`, `~2 км` — не используются как установленные reader facts.
3. Разночтение `командир / комиссар` в спорном print witness не превращается в уверенное описание момента подтверждения команды: reader говорит нейтрально — `На командном пункте решили, что произошла ошибка, и запросили подтверждение.`
4. Конфликт имени отца Лоскутова не решается догадкой; reader не называет его спорное имя.
5. Дата 3 декабря для `Патриота Родины` атрибутируется институциональным источникам, но статья прямо говорит, что полоса не просмотрена и не объявляет эту публикацию безоговорочно `самой первой`.
6. `Красная звезда` №288 от 7 декабря 1941 года, printed p.3, может описываться как direct-inspected; p.4 также просмотрена и продолжения не содержит.
7. Hero всегда reconstruction; archival `coverSourceUrl` для него запрещён.
8. Full poem reproduction и неподтверждённые documentary body images остаются запрещены.

## Execution gate перед merge

Этот closeout фиксирует **состояние артефакта**, а не эфемерный статус конкретного запуска GitHub Actions. Execution evidence живёт в checks самого PR на его exact head; run IDs и слово `green` намеренно не записываются сюда после выполнения, потому что такой коммит сам создавал бы новый head и бесконечно обнулял exact-head доказательство.

Перед merge обязаны быть зелёными либо содержательно разобраны именно на том SHA, который передаётся в merge как `expected_head_sha`:

- обычный CI / typecheck / content-model checks;
- Simonov publication source gate;
- generated discovery-artifact validation;
- Articles catalog acceptance на опубликованном slug;
- browser QA минимум Chromium + Android + iPhone/WebKit, с инфраструктурными download/apt flakes отделёнными от product failures.

После успешной матрицы не требуется технический «closeout commit»: PR metadata может зафиксировать run IDs и итог, а merge обязан использовать тот же exact head. Если head меняется — execution gate начинается заново.

Merge в `main` этим документом не разрешается автоматически.
