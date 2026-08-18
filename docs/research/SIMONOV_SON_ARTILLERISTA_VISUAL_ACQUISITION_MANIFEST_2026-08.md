# «Сын артиллериста» — visual acquisition manifest

Дата прохода: 2026-08-18  
Статус: **three contextual assets object-verified / documentary Loskutov-Ryklis-Simonov 1941 assets still rights-pending / no bytes vendored yet**

## Зачем отдельный manifest

Статья должна визуально различать четыре класса изображений:

1. **documentary** — реальная фотография человека/события с установленным provenance;
2. **facsimile** — полоса газеты, документ, наградной лист, титульный лист;
3. **context** — фотография места/войны/автора, которая помогает понять эпоху, но не изображает конкретный эпизод;
4. **reconstruction** — редакционная визуальная реконструкция, которая никогда не выдаётся за архивный снимок.

Главное правило: свободная лицензия не даёт права менять исторический контекст в подписи. Даже свободно используемая фотография 1944 года **не может** быть подписана как бой Ивана Лоскутова 1941 года.

---

## V1 — Муста-Тунтури / Рыбачий и Средний, современная география

**Class:** context  
**File:** `На хребте муста-тунтури 3.jpg`  
**Commons:** https://commons.wikimedia.org/wiki/File:На_хребте_муста-тунтури_3.jpg  
**Original:** 960 × 640 px; 333 KB; JPEG  
**Author:** Meellaira Ahr  
**Source:** own work  
**Taken:** 27 August 2013  
**Description on Commons:** `Полуострова Рыбачий и Средний, Печенгский район`  
**License:** **CC BY-SA 4.0**  
**Rights confidence:** HIGH — item-level Commons file page inspected.

### What it can illustrate

- современный вид северной географии;
- каменистый, открытый характер района Рыбачьего/Среднего;
- географический переход к разделу о Муста-Тунтури.

### What it cannot claim

- что это фотография 1941 года;
- что именно эта точка была наблюдательным пунктом Лоскутова;
- что видимые детали существовали в том же виде летом 1941 года;
- точные координаты боя.

### Production caption

> **Муста-Тунтури, район полуостровов Рыбачий и Средний. Современная фотография, 27 августа 2013 года.** Фото: Meellaira Ahr / Wikimedia Commons, CC BY-SA 4.0. Снимок показывает географический контекст и не является фотографией боя 1941 года.

### Attribution / transformation rule

Если технически уменьшаем, кадрируем или переводим в WebP:

- credit `Meellaira Ahr` обязателен;
- ссылка на CC BY-SA 4.0 обязательна в source metadata/credit;
- указывать, что файл был технически адаптирован;
- derivative должен сохранять совместимый ShareAlike режим там, где лицензия этого требует.

### Proposed production target

`public/images/essays/simonov/context/mustatunturi-2013-meellaira-ahr.webp`

**Ingestion status:** WAIT — source metadata verified; exact original bytes/SHA still need deterministic download+conversion before repository ingestion.

---

## V2 — 12-я бригада морской пехоты на Муста-Тунтури, октябрь 1944

**Class:** context / historical geography, NOT the 1941 Loskutov action  
**File:** `Petsamo 02.jpg`  
**Commons:** https://commons.wikimedia.org/wiki/File:Petsamo_02.jpg  
**Original:** 550 × 390 px; 145 KB; JPEG  
**Description:** бойцы 12-й бригады морской пехоты Северного флота на марше через хребет Муста-Тунтури  
**Date:** October 1944  
**Author:** unknown  
**Source:** Russian Ministry of Defence / Mil.ru  
**License:** **CC BY 4.0**  
**Required attribution on Commons:** `Mil.ru`  
**Rights confidence:** HIGH — item-level Commons file page inspected.

### Why useful

Это один из редких свободно лицензированных исторических кадров, непосредственно связанных с хребтом Муста-Тунтури. Он визуально показывает военную географию каменистого северного хребта.

### Critical chronology guardrail

Снимок относится к **октябрю 1944 года**, то есть к значительно более позднему этапу войны, а не к июльской операции Лоскутова 1941 года.

Нельзя подписывать:

- `разведчики Лоскутова`;
- `бой на высоте, ставший основой поэмы`;
- `Муста-Тунтури, 1941`;
- `Лёнька на задании`.

### Production caption

> **Бойцы 12-й бригады морской пехоты Северного флота на марше через хребет Муста-Тунтури, октябрь 1944 года.** Исторический контекст района; снимок не относится к операции Ивана Лоскутова 1941 года. Источник: Mil.ru / Wikimedia Commons, CC BY 4.0.

### Proposed production target

`public/images/essays/simonov/context/mustatunturi-marines-1944-milru.webp`

**Ingestion status:** WAIT — rights/object metadata verified; exact original bytes/SHA and deterministic WebP conversion still pending.

---

## V3 — Константин Симонов на фронте, Поныри, 1943

**Class:** context / author at war  
**File:** `Ilya Vlasenko Konstantin Simonov near Ponyri. Battle of Kursk. 1943.jpg`  
**Commons:** https://commons.wikimedia.org/wiki/File:Ilya_Vlasenko_Konstantin_Simonov_near_Ponyri._Battle_of_Kursk._1943.jpg  
**Original:** 3378 × 2245 px; 5.19 MB; JPEG  
**Scene:** Константин Симонов (в центре) и Илья Власенко (справа) на командном пункте 75-й гвардейской стрелковой дивизии в районе Поныри, Курская битва, 1943  
**Source:** семейный архив Власенко  
**Author:** unknown  
**Commons rights label:** **Public Domain** under the PD-Russia-1996 rationale shown on the item page  
**Rights confidence:** MEDIUM-HIGH — Commons item page is explicit, but because the photographer is unknown and the project is globally accessible, final production should preserve the Commons provenance/rationale instead of silently reducing the record to the words `public domain`.

### Why useful

Этот кадр подтверждает визуально не северный эпизод, а **Симонова как фронтового корреспондента** и может работать рядом с краткой биографической частью статьи.

### Critical caption guardrail

Никогда не подписывать этот снимок как:

- Север / Рыбачий / Муста-Тунтури;
- 1941 год;
- момент, когда Симонов услышал историю Лоскутова;
- офицеры 104-го артполка.

### Production caption

> **Военный корреспондент Константин Симонов на командном пункте 75-й гвардейской стрелковой дивизии в районе Поныри, Курская битва, 1943 год.** Снимок иллюстрирует фронтовую работу автора и не относится к его северной поездке 1941 года. Источник: семейный архив Власенко / Wikimedia Commons; Commons маркирует файл как public domain по указанному на странице основанию.

### Proposed production target

`public/images/essays/simonov/context/simonov-ponyri-1943.webp`

**Ingestion status:** WAIT — exact original bytes/SHA and final cross-jurisdiction rights note still pending.

---

# Documentary priority list — НЕ заменять контекстными картинками

## D1 — Иван Алексеевич Лоскутов, 1941

**Best provenance leads:**

- Государственный архив Мурманской области — 1941 portrait on archival publication;
- семейный архив Светланы Филипповой — media delivery explicitly captions a 1941 portrait;
- Музей истории Дальнего Востока имени В. К. Арсеньева — personal Loskutov complex / museum-photo leads.

**Status:** RIGHTS / ITEM ID PENDING.

Это приоритетный documentary visual №1. Нельзя скачивать картинку из СМИ и считать media page разрешением на reuse.

---

## D2 — Ефим Самсонович Рыклис, 1941

**Best lead:** Государственный архив Мурманской области, published 1941 portrait.

**Status:** RIGHTS / ITEM ID PENDING.

Рыклис особенно важен для раздела `Кто стал Деевым`, но архивная страница без item-level reuse licence не превращается в свободный фотобанк.

---

## D3 — Симонов на Севере, 1941

**Best lead:** Государственный архив Мурманской области: Симонов, Д. И. Еремин, Георгий Зельма; Симонов с офицерами 104-го артполка; Рока-Пахта / Озерко.

**Status:** RIGHTS / ITEM ID PENDING.

Эти кадры значительно сильнее Понырей-1943 для конкретной статьи, но до разрешения их нельзя автоматически вендорить.

---

# Facsimile acquisition targets

## F1 — `Красная звезда`, №288 (5043), 07.12.1941

**Class:** facsimile  
**Status:** exact issue identity strongly corroborated; page/columns pending direct SHPL/GPIB inspection.

При нахождении полосы будущий визуал должен быть не декоративным скриншотом, а точным факсимиле с подписью номера, даты, страницы/колонки и источника цифровой копии.

## F2 — `Патриот Родины`, 03.12.1941

**Class:** facsimile  
**Status:** institutional date support; exact issue/page pending.

Не вычислять номер выпуска по соседним holdings.

## F3 — наградной документ Лоскутова `10800112`

**Class:** facsimile / military document  
**Archive locator:** ЦАМО, ф. 33, оп. 682524, д. 34, л. 246–247  
**Status:** exact locator recovered; scan still not visually inspected.

Если scan подтвердит формулы `31.7.41`, `около двух километров`, `6 суток`, `500–600 метров`, этот документ станет одним из центральных evidence visuals статьи.

---

# Reconstruction hero

## R1 — editorial hero

**Class:** reconstruction  
**Target:** `public/images/essays/simonov/simonov-son-artillerista-hero.webp`  
**Expected:** 1672 × 941  
**Pinned candidate SHA-256:** `13ba95ba05eaa87eb8a7f6eac7fe888e0f5710bd9dc91a50c5b83dd2b6e7a087`  
**Status:** owner visual approval pending; bytes are intentionally not in production yet.

Required permanent disclosure:

> `THE LEGENDARY POET · редакционная реконструкция; не документальная фотография Ивана Лоскутова`

Никакая последующая стилизация не должна менять provenance class с `reconstruction` на `documentary`.

---

# Recommended visual sequence for the longform

Если documentary rights удастся закрыть, оптимальная последовательность статьи:

1. **R1 hero reconstruction** — эмоциональный вход;
2. **D1 Иван Лоскутов, 1941** — немедленно показать реального человека;
3. **V1 Муста-Тунтури, 2013** — географический контекст;
4. **F3 award document 10800112** — near-contemporary military evidence;
5. **D2 Ефим Рыклис, 1941** — реальный рассказчик истории;
6. **D3 Симонов на Севере, 1941** — происхождение литературного сюжета;
7. **F1 / F2** — ранняя публикация и газетная жизнь текста;
8. **V3 Поныри, 1943** — использовать только если нужен дополнительный авторский фронтовой контекст;
9. **V2 морпехи на Муста-Тунтури, 1944** — optional, если нужен отдельный блок о военной истории хребта; не ставить рядом с описанием боя Лоскутова без явной даты 1944.

Если архивные права не будут закрыты, не заменять D1/D2/D3 молча похожими людьми: лучше оставить меньше изображений и честно использовать `context + reconstruction + facsimile`.

---

# Ingestion checklist для каждого свободного Commons asset

Перед добавлением bytes в repo:

- [ ] скачать **original file**, не preview;
- [ ] записать original filename, pixel dimensions, bytes;
- [ ] вычислить SHA-256 source bytes;
- [ ] сохранить permanent Commons file-page URL;
- [ ] сохранить author/source/date/license;
- [ ] записать exact credit line;
- [ ] при преобразовании — deterministic WebP settings, output bytes + SHA-256;
- [ ] не удалять исторически значимые части кадра при crop;
- [ ] проверить mobile/desktop crop отдельно;
- [ ] добавить source metadata рядом с Essay/image manifest;
- [ ] только затем добавить `type: 'image'` block в статью.

## Техническое ограничение текущего прохода

Item-level Commons pages и лицензии проверены, но текущий container environment не смог напрямую получить `upload.wikimedia.org` bytes из-за сетевого/DNS ограничения. Поэтому manifest **намеренно не выдумывает SHA-256 исходных файлов** и не считает файлы ingested. Следующий ingestion pass должен получить оригиналы через доступный connector/browser route или отдельный deterministic acquisition environment.

## Итог

У нас теперь есть **три предметно проверенных contextual visual candidates** с точными историческими ограничениями и правовым статусом, плюс понятная очередь на три намного более ценных documentary visuals и три facsimile. Это позволяет собирать статью по профессиональной схеме: `эмоциональная реконструкция → реальное лицо → место → документ → автор → ранняя печать`, не выдавая поздние или контекстные изображения за конкретное событие 1941 года.