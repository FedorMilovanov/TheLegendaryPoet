# «Сын артиллериста» — publication readiness gate

Дата: 2026-08-19  
Статус: **claim-aware publication gate / research closure separated from reader safety / owner-approved hero bytes + final publication transaction remain hard blockers**

## Зачем нужен отдельный gate

Claim matrix отвечает на вопрос: **что окончательно закроет каждый исследовательский claim?**

Publication readiness отвечает на другой вопрос: **какие незакрытые claims реально мешают опубликовать текущий reader?**

Это не одно и то же. Прямой скан нужен, если статья хочет безусловно утверждать спорную деталь. Но если reader сознательно:

- не называет точный день боя;
- не выбирает `командир / комиссар`;
- не публикует имя отца Лоскутова;
- не объявляет 3 декабря безусловно `первой публикацией`;
- не использует поздние газетные/мемуарные детали, которые ещё не просмотрены;

то ожидание этих scans **не повышает достоверность уже сформулированного текста**, а лишь закрывает будущие исследовательские возможности.

Поэтому этот файл является authoritative gate **для production registration текущего reader**. Он не отменяет claim matrix и не объявляет открытые research objects закрытыми.

---

## 1. Publication-critical evidence уже закрыто

### Центральная публикация 7 декабря 1941

`Красная звезда` №288 (5043), p.3 закрыта direct pixels:

- exact PDF получен;
- SHA-256 `9e644dd79fd9d22199ec9cef158d2f1a9cf5ce5efbdc60f2eb3e578c8999e229`;
- p.3 и following p.4 визуально просмотрены;
- title + `(Фронтовая поэма)`;
- шесть колонок;
- конец `К. СИМОНОВ. / СЕВЕРНЫЙ ФРОНТ.`;
- p.4 продолжения не содержит.

Reader может утверждать эти детали без qualification.

### Исторический эпизод

Reader опирается на опубликованную Симоновым передачу письма И. А. Лоскутова и явно атрибутирует участнику детали, которые не являются административным документом 1941 года.

Для production используются только те значения, которые controlling witness поддерживает без спорного award extrapolation:

- июль 1941, без точного дня;
- два разведчика/радиста + проводник;
- около трёх километров по воспоминанию Лоскутова;
- наблюдение и корректировка;
- требование открыть огонь непосредственно по занимаемой высоте;
- разбитая радиостанция;
- выход при тумане.

### Text rights

Полный текст поэмы не публикуется. Reader использует только короткие фразы, необходимые для критики/анализа. Full-text gate остаётся fail-closed.

---

## 2. Research objects, которые НЕ блокируют текущий reader

### `Патриот Родины`, 03.12.1941

Direct issue/page всё ещё нужен для окончательного closure `first publication`.

Но reader **не пишет**, что 3 декабря безусловно была первая публикация. Он пишет:

> архангельские институциональные источники относят публикацию к 3 декабря;

и отдельно сообщает, что сама полоса редакцией не просмотрена.

Следовательно:

**03.12 issue/page = P1 research closure, не P0 publication blocker, пока qualification сохраняется.**

Если в reader появляется `впервые`, `первая публикация — 3 декабря`, exact issue number или page без direct object — gate должен снова стать P0.

### Award record `10800112`

Direct scan нужен для `31 июля`, `6 суток`, `500–600 м`, `~2 км`, exact award linkage.

Reader эти значения **не утверждает**. Напротив, он прямо говорит, что письмо даёт только `июль 1941`, а exact day из locator не повышается до факта.

Следовательно:

**award scan = P1 research closure, не P0 publication blocker, пока blocked numbers не входят в reader.**

### Simonov 1982 pp.393 / 430–433 + RSL 1973 pp.54–62

Direct print collation нужна для окончательного выбора textual variants, прежде всего:

- `командир / комиссар`;
- printed father name;
- edition-level page readings.

Reader не выбирает спорный чин/должность: использует нейтральное `на командном пункте запросили подтверждение`.

Reader не публикует имя отца.

Следовательно:

**T8 1982 + RSL 1973 target pages = P1 research closure, не P0 publication blocker, пока neutral wording и father-name omission сохраняются.**

### Ortenberg 1984, Sanjara 1984, `Правда` 1966, `Учительская газета` 1966

Эти объекты остаются ценными P1/P2 research witnesses, но **не являются cited evidence production reader** для спорных claims:

- сцена передачи в номер в reader атрибутирована собственному воспоминанию Симонова, не прямому Ортенбергу;
- имя отца из Sanjara не публикуется;
- `Правда` 1966 и `Учительская газета` 1966 не используются для фактов reader.

Их page inspection не блокирует регистрацию текущей статьи.

---

## 3. Hard blockers перед production registration

### P0-A — exact hero bytes + owner approval

Текущий cover contract:

`/images/essays/simonov/simonov-son-artillerista-hero.webp`

Expected SHA-256:

`13ba95ba05eaa87eb8a7f6eac7fe888e0f5710bd9dc91a50c5b83dd2b6e7a087`

Hero class: **reconstruction**.

Обязательная подпись:

`редакционная реконструкция; не документальная фотография Ивана Лоскутова`.

До наличия exact bytes и явного owner approval hero gate остаётся hard-blocking. Общее поручение `доделать проект` не подменяет approval конкретного изображения.

### P0-B — visual rights только для реально включаемых documentary assets

Текущий Essay не содержит body `image` blocks. Поэтому исследовательские кандидаты Musta-Tunturi / Petsamo / Simonov 1943 / archive portraits **не блокируют publication, пока не вставлены в reader**.

Если body image добавляется:

- exact bytes;
- item-level attribution/licence;
- truthful caption/provenance

становятся P0 для этого файла.

### P0-C — final reader/registration transaction

Перед снятием draft-status должны пройти на exact head:

- staged editorial contract;
- reader evidence reconciliation;
- claim-aware publication readiness;
- text-rights gate;
- TypeScript/content contracts;
- build;
- SEO/catalog/sitemap/feed generation after registration;
- browser QA на опубликованном route.

Registration должна быть отдельной publication-транзакцией после закрытия P0-A и всех machine checks.

---

## 4. Machine-enforced reader invariants

Production readiness действует **только пока** reader сохраняет эти границы:

1. есть `июль 1941 года` и `Точного дня в письме нет`;
2. нет безусловного `31 июля 1941 года` как факта боя;
3. нет `6 суток`, `500–600 м`, `2 км` как установленных reader facts;
4. спор `командир / комиссар` нейтрализован формулой `на командном пункте ... запросили подтверждение`;
5. имя отца Лоскутова отсутствует в narrative;
6. `3 декабря` подано как institutional attribution, а `впервые` остаётся blocked;
7. `Красная звезда` p.3 может быть direct-asserted, потому что pixels уже inspected;
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

Текущий documentary reader уже построен так, чтобы **не зависеть от незакрытых спорных readings**. Поэтому publication readiness нельзя смешивать с максимальным research closure.

Hard blockers теперь соответствуют реальному артефакту: **exact approved hero bytes, права на реально включённые visuals и полный финальный publication/QA transaction.** Остальные direct-object targets продолжают исследование и могут усилить будущую редакцию, но не должны бесконечно удерживать безопасно квалифицированный текст в draft.