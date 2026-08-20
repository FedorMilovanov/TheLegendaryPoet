# «Сын артиллериста» — publication readiness gate

Дата актуализации: 2026-08-20  
Статус: **claim-aware publication gate / artifact blockers closed / research closure separated from reader safety / exact-head execution gate remains**

## Зачем нужен отдельный gate

Claim matrix отвечает на вопрос: **что окончательно закроет каждый исследовательский claim?**

Publication readiness отвечает на другой вопрос: **какие незакрытые claims реально мешают опубликовать текущий reader?**

Это не одно и то же. Прямой скан нужен, если статья хочет безусловно утверждать спорную деталь. Но если reader сознательно:

- не называет точный день боя;
- не выбирает `командир / комиссар`;
- не публикует имя отца Лоскутова;
- не объявляет 3 декабря безусловно `первой публикацией`;
- не использует поздние газетные/мемуарные детали, которые ещё не просмотрены;

то ожидание этих scans не повышает достоверность уже сформулированного текста, а лишь закрывает будущие исследовательские возможности.

Этот файл остаётся authoritative для **claim-aware границ production reader**. Транзакционное состояние публикационного артефакта фиксируется также в `SIMONOV_PUBLICATION_CLOSEOUT_2026-08.md`. Ни один из двух документов не объявляет открытые research objects закрытыми.

---

## 1. Publication-critical evidence уже закрыто

### Центральная публикация 7 декабря 1941

`Красная звезда` №288 (5043), печатная страница 3 закрыта прямой визуальной проверкой:

- полный PDF получен;
- SHA-256 `9e644dd79fd9d22199ec9cef158d2f1a9cf5ce5efbdc60f2eb3e578c8999e229`;
- p.3 и следующая p.4 визуально просмотрены;
- заголовок + `(Фронтовая поэма)`;
- шесть колонок;
- конец `К. СИМОНОВ. / СЕВЕРНЫЙ ФРОНТ.`;
- p.4 продолжения не содержит.

Reader может утверждать эти детали без дополнительной оговорки о непроверенном объекте.

### Исторический эпизод

Reader опирается на опубликованную Симоновым передачу письма И. А. Лоскутова и явно атрибутирует участнику детали, которые не являются административным документом 1941 года.

Для production используются только значения, которые controlling witness поддерживает без спорного award extrapolation:

- июль 1941, без точного дня;
- два разведчика/радиста + проводник;
- около трёх километров по воспоминанию Лоскутова;
- наблюдение и корректировка;
- требование открыть огонь непосредственно по занимаемой высоте;
- разбитая радиостанция;
- выход при тумане.

### Text rights

Полный текст поэмы не публикуется. Reader использует только короткие фразы, необходимые для критики и анализа. Full-text gate остаётся fail-closed.

---

## 2. Research objects, которые НЕ блокируют текущий reader

### `Патриот Родины`, 03.12.1941

Direct issue/page всё ещё нужен для окончательного closure `first publication`.

Но reader не пишет, что 3 декабря безусловно была первая публикация. Он сообщает, что архангельские институциональные источники относят публикацию к 3 декабря, и отдельно говорит, что сама полоса редакцией не просмотрена.

Следовательно:

**03.12 issue/page = P1 research closure, не P0 publication blocker, пока qualification сохраняется.**

Если в reader появляется `впервые`, `первая публикация — 3 декабря`, exact issue number или page без direct object — gate снова становится P0 для этого claim.

### Award record `10800112`

Direct scan нужен для `31 июля`, `6 суток`, `500–600 м`, `~2 км`, exact award linkage.

Reader эти значения не утверждает как установленные. Напротив, он прямо говорит, что письмо даёт только `июль 1941`, а связанная с award locator дата не повышается до безусловного факта.

Следовательно:

**award scan = P1 research closure, не P0 publication blocker, пока blocked numbers не входят в reader.**

### Simonov 1982 pp.393 / 430–433 + RSL 1973 pp.54–62

Direct print collation нужна для окончательного выбора textual variants, прежде всего:

- `командир / комиссар`;
- printed father name;
- edition-level page readings.

Reader не выбирает спорный чин/должность: использует нейтральное `На командном пункте решили, что произошла ошибка, и запросили подтверждение.`

Reader не публикует имя отца.

Следовательно:

**T8 1982 + RSL 1973 target pages = P1 research closure, не P0 publication blocker, пока neutral wording и father-name omission сохраняются.**

### Ortenberg 1984, Sanjara 1984, `Правда` 1966, `Учительская газета` 1966

Эти объекты остаются ценными P1/P2 research witnesses, но **не являются cited evidence production reader** для спорных claims:

- сцена передачи в номер в reader атрибутирована собственному воспоминанию Симонова, не прямому Ортенбергу;
- имя отца из Sanjara не публикуется;
- `Правда` 1966 и `Учительская газета` 1966 не используются для фактов reader.

Их page inspection не блокирует текущую публикацию.

---

## 3. Artifact blockers закрыты; execution gate остаётся

### P0-A — approved production hero: CLOSED

Production cover:

`/images/essays/simonov/simonov-son-artillerista-hero.webp`

Exact production properties:

- 1600×900;
- 130 548 bytes;
- SHA-256 `1fd150a4b1e6ff493d7103e5037d306a302471fb8c520524fbd1ae4d45e4bd1a`;
- owner approval: `SIMONOV_SON_ARTILLERISTA_HERO_APPROVAL_2026-08.md`;
- root provenance: `public/images/PROVENANCE.yml`;
- generic cover pin: `scripts/validate-essay-covers.ts`.

Hero class остаётся **reconstruction**.

Обязательная публичная подпись:

`редакционная реконструкция; не документальная фотография Ивана Лоскутова`.

Архивный `coverSourceUrl` для этой реконструкции запрещён.

### P0-B — visual rights для реально включаемых documentary assets: CLOSED BY ABSENCE

Публичный Essay не содержит body `image` blocks. Поэтому исследовательские кандидаты Musta-Tunturi / Petsamo / Simonov 1943 / archive portraits не блокируют publication, пока не вставлены в reader.

Если body image добавляется в будущем, exact bytes, item-level attribution/licence и truthful caption/provenance снова становятся P0 для этого файла.

### P0-C — registration/discovery artifact transaction: CLOSED

Публичный wrapper зарегистрирован в каноническом Essay catalog. Search index, sitemap и Atom feed синхронизированы. Отдельный browser acceptance покрывает опубликованный slug.

Остаётся **execution gate**, а не новый контентный blocker: на одном и том же exact head должны пройти CI, Simonov publication source gate, catalog/browser acceptance и остальные применимые contracts. Успешную матрицу нельзя фиксировать новым «финальным» коммитом, потому что такой коммит сам создаст другой head и обнулит exact-head доказательство.

---

## 4. Machine-enforced reader invariants

Publication readiness действует только пока reader сохраняет эти границы:

1. есть `июль 1941 года` и `Точного дня в письме нет`;
2. нет безусловного `31 июля 1941 года` как факта боя;
3. нет `6 суток`, `500–600 м`, `2 км` как установленных reader facts;
4. спор `командир / комиссар` нейтрализован формулой `На командном пункте решили, что произошла ошибка, и запросили подтверждение.`;
5. имя отца Лоскутова отсутствует в narrative;
6. `3 декабря` подано как institutional attribution, а `впервые` остаётся blocked;
7. `Красная звезда` p.3 может быть прямо описана как проверенная, потому что pixels уже inspected;
8. reconstruction hero никогда не называется документальной фотографией;
9. полный текст поэмы не встроен;
10. body documentary images не появляются до item-level rights/bytes.

Если любой из этих invariants меняется, соответствующий research object автоматически возвращается в P0.

---

## 5. Research follow-up после publication readiness

Остаются открытыми и продолжают отслеживаться:

- `Патриот Родины` 03.12.1941 exact issue/page;
- TsAMO `10800112` direct scan;
- Simonov T8 1982 p.393 / pp.430–433;
- RSL 1973 pp.54–62;
- Ortenberg 1984 pp.95–96;
- Sanjara 1984 pp.3–13;
- `Правда` 22.03.1966 p.4;
- `Учительская газета` 15.02.1966;
- RGALI autograph / exact storage unit;
- theatre/programme witness 04.12.1941;
- museum/family/service identity objects;
- SHPL p.3 derivative pixel comparison;
- provenance/reuse decisions для facsimiles, если они будут публиковаться.

Ни один из них не объявлен закрытым этим gate.

## Итог

Текущий documentary reader построен так, чтобы не зависеть от незакрытых спорных readings. Artifact-specific blockers уже закрыты: approved hero присутствует, documentary body images отсутствуют, full poem не публикуется, registration/discovery transaction выполнена.

Оставшийся hard gate перед merge — **зелёная exact-head execution matrix без подмены queue-state результатом и без нового self-invalidating closeout commit после проверки**. Остальные direct-object targets продолжают исследование и могут усилить будущую редакцию, но не должны бесконечно удерживать безопасно квалифицированный текст в draft.
