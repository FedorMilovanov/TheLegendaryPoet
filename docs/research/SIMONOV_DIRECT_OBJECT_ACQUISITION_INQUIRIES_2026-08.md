# Simonov direct-object acquisition inquiries — 47news cross-check + RSL print witnesses

Дата: 2026-08-19  
Статус: **Red Star №288 p.3 direct-inspected independently / 47news fragment bytes still undelivered / RSL 1973+1982 pages still pending / no paid work authorized**

## Цель

Этот gate фиксирует состояние **внешних acquisition routes**, не подменяя ими глобальный evidence state.

19 августа 2026 года были отправлены два запроса:

1. в редакцию **47news** — по сохранённому у них фрагменту 3-й полосы `Красной звезды` №288 от 07.12.1941;
2. в **Российскую государственную библиотеку** — по печатным страницам Симонова 1973 и 1982 годов.

Изначально 47news был одним из маршрутов к первому visual inspection p.3. Позже exact №288 PDF был получен независимо через Internet Archive и p.3/p.4 визуально проверены. Поэтому теперь надо различать:

- **global Red Star page-content state:** direct-inspected independently;
- **47news fragment route:** exact image URL known, bytes unavailable, fragment itself uninspected;
- **RSL print routes:** requested pages still uninspected.

Во всех случаях действует граница:

**inquiry sent ≠ exact delivery URL recovered ≠ reply received ≠ bytes received ≠ a particular source object visually inspected.**

---

## 1. 47news — `Красная звезда` №288, p.3 fragment

### Почему запрос предметный

Материал 47news от 11.12.2021 `Патефон и немцы. Когда винил равен штыку` содержит изображение с подписью:

> `Газета «Красная звезда», №288 от 7 декабря 1941 года. Фрагмент 3-й полосы. Ист. фото – из архива 47news`.

Страница статьи:
https://47news.ru/articles/204402/

Официальный редакционный адрес:

`news@47news.ru`

### Exact image object recovered 19.08.2026

Мобильная HTML-версия статьи раскрывает underlying image-link непосредственно у подписи фрагмента p.3. Exact published image URL:

`https://i.47news.ru/photos/2021/12//1280x1024_20211211_kzm9dp0vn4jze7ap9btg.jpg`

Это **не вычисленный путь**: URL получен из реального image link на странице статьи.

Текущий delivery result **именно для 47news object**:

- web click по image object дошёл до exact URL, но fetch вернул `Cache miss`;
- отдельная прямая попытка скачать тот же exact URL также не получила bytes;
- следовательно, **47news fragment pixels текущим toolchain не просмотрены**;
- нельзя утверждать, что именно показано внутри этого fragment помимо caption 47news;
- нельзя приписывать этому fragment собственные layout findings, пока его bytes не получены.

Статус этой линии:

**exact 47news p.3 fragment image URL recovered / bytes not acquired / fragment visual inspection pending.**

### Отправленный запрос

Дата: **2026-08-19**  
Получатель: **`news@47news.ru`**  
Gmail message ID: **`1a01724745b80300`**  
Thread ID: **`1a01724745b80300`**

Запрошено:

- сохранился ли исходный файл опубликованного фрагмента p.3 в более высоком разрешении;
- есть ли полный scan p.3 или всего №288;
- виден ли на исходнике `Сын артиллериста`;
- provenance их архивной копии;
- исследовательская копия;
- отдельное решение по reuse rights, если изображение понадобится в production.

Исторически в отправленном письме также запрашивалась проверка колонок/границ/continuation. После independent direct-page closure эта часть запроса **больше не является page-content blocker**; ответ 47news теперь нужен главным образом для provenance, сравнения digital derivatives, high-resolution copy и reuse status.

Финансовая граница:

**если предоставление связано с оплатой — сначала exact quote + terms; никакой платной работы без отдельного подтверждения.**

### Текущий статус запроса

**reply pending / exact published 47news image URL known / 47news source pixels not received / fragment inspection pending / global №288 p.3 already direct-verified independently.**

Сам факт существования у 47news фрагмента и recovered exact URL усиливает provenance/acquisition map, но не является источником уже установленной six-column geometry до просмотра именно 47news pixels.

---

## 2. Independent Red Star direct-page closure

Exact standalone PDF:

**`Газета «Красная Звезда» №288 от 07 декабря 1941 года.pdf`**  
Internet Archive item: **`no2661212191941`**  
Размер: **6 506 121 bytes**  
SHA-256: **`9e644dd79fd9d22199ec9cef158d2f1a9cf5ce5efbdc60f2eb3e578c8999e229`**.

Printed p.3 и p.4 визуально inspected. Установлены:

- `7 декабря 1941 г., воскресенье, № 288 (5043)`;
- printed p.3;
- `Сын артиллериста`;
- `(Фронтовая поэма)`;
- **шесть газетных колонок**;
- конец `К. СИМОНОВ.` / `СЕВЕРНЫЙ ФРОНТ.`;
- на p.4 продолжения нет.

Это closure относится к **page content**, но не автоматически к institutional provenance или facsimile reuse rights.

---

## 3. РГБ — Симонов 1973, pp.54–62

**Object:** К. М. Симонов. `От Халхингола до Берлина`. Москва: ДОСААФ, 1973. 335 с.  
**RSL record:** `01007444220`  
**Target:** printed **pp.54–62**.

Официальная карточка РГБ помечает документ как находящийся в открытом доступе в полном объёме в Просмотрщике.

Нужна page-level collation, прежде всего для textual variant:

**командир / комиссар** при переспросе команды огня.

Search-result карточка подтверждает full-viewer access, но underlying exact viewer/document route для этого record текущему toolchain не delivered; inferred dlib path не повышается до факта. Поэтому pp.54–62 остаются visually pending.

---

## 4. РГБ — Симонов, Собрание сочинений, т.8 (1982)

**Object:** К. М. Симонов. `Собрание сочинений в 10 т. Т. 8. Разные дни войны. Дневник писателя. Т. 1. 1941 год`. Москва: Художественная литература, 1982. 479 с.  
**Targets:** printed **p.393 and pp.430–433**.

Публичные exact scan packages этого же издания уже локализованы, а same-edition OCR отдельно collated, но bytes/page images target pages текущим toolchain всё ещё не получены.

Критические readings:

- литературные имена `Лёнька / Деев / Петров`;
- авторская формула о выборе фамилий;
- поздняя встреча с реальным прототипом;
- судьба отца Лоскутова;
- exact printed father name для конфликта `Иван Михайлович / Алексей Михайлович`.

---

## 5. Запрос в РГБ

Официальная справочная служба РГБ принимает вопросы по адресу **`sbo@rsl.ru`**; РГБ также предоставляет онлайн-копирование фрагментов по своей процедуре.

Дата: **2026-08-19**  
Получатель: **`sbo@rsl.ru`**  
Gmail message ID: **`1a017249f09e2e53`**  
Thread ID: **`1a017249f09e2e53`**

Запрошено:

1. stable viewer route или lawful research copy для `01007444220`, printed pp.54–62;
2. точная RSL catalogue card для vol.8 (1982);
3. доступность vol.8 в viewer;
4. stable route/copy для printed p.393, pp.430–433;
5. если копирование платное — **сначала** exact price, allowable scope, format/quality и payment procedure;
6. **не начинать платное копирование без отдельного подтверждения**.

### Текущий статус

**reply pending / no RSL page bytes received / pp.54–62 and pp.393,430–433 remain visually uninspected.**

---

## 6. Что делать после ответов / delivery

### Если 47news присылает файл

- [ ] сохранить original bytes;
- [ ] SHA-256;
- [ ] визуально установить участок p.3;
- [ ] compare title/layout с уже inspected exact №288 PDF;
- [ ] записать сообщённый provenance отдельно от собственных выводов;
- [ ] reuse rights решать отдельно.

### Если РГБ даёт viewer/page route или copy

- [ ] визуально collate 1973 pp.54–62;
- [ ] визуально collate 1982 p.393 and pp.430–433;
- [ ] записать exact print readings без длинного охраняемого воспроизведения;
- [ ] обновить witness reconciliation;
- [ ] обновить father identity gate;
- [ ] обновить author witness collation;
- [ ] повышать evidence level только для действительно просмотренных страниц.

### Если предлагается платное копирование

- [ ] сохранить quote/условия;
- [ ] **не оплачивать и не подтверждать заказ автоматически**;
- [ ] вынести стоимость владельцу проекта для отдельного решения.

## Итог

Global Red Star page-content P0 уже закрыт независимо по exact №288 facsimile. **47news остаётся отдельным uninspected source object** и полезен для provenance/high-resolution comparison/reuse inquiry. РГБ остаётся официальным delivery route для printed pp.54–62 (1973) и p.393/430–433 (1982). Эти RSL page gates остаются открыты.