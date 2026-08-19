# «Красная звезда», 7 декабря 1941 — ГПИБ / SHPL institutional cross-check gate

Дата прохода: 2026-08-19  
Статус: **complete 1941 SHPL corpus verified / exact SHPL №288 node + p.3 inspect route confirmed by holder reply / SHPL pixels not independently rendered in current toolchain / global p.3 content already direct-verified**

Связанные файлы:
- `SIMONOV_SON_ARTILLERISTA_NEWSPAPER_OBJECT_GATE_2026-08.md`
- `SIMONOV_RED_STAR_PAGE_3_SCHOLARLY_GATE_2026-08.md`
- `SIMONOV_RED_STAR_DIRECT_MIRRORS_GATE_2026-08.md`
- `SIMONOV_SON_ARTILLERISTA_SOURCE_ADDENDUM_2026-08.md`

## Зачем этот gate теперь нужен

Глобальный page-content gap уже закрыт independently: exact standalone PDF `Красной звезды` №288 от 07.12.1941 получен через Internet Archive, захеширован, а printed p.3 и p.4 визуально проверены.

Оставалась holder-specific задача: не угадывать внутренний SHPL node ID, а получить от самой ГПИБ точный маршрут к №288 и p.3. **19 августа 2026 года ГПИБ ответила напрямую и этот navigation/provenance route закрыла.**

При этом текущий web/toolchain всё ещё не отрендерил pixels именно SHPL-копии из-за redirect/fetch layer. Поэтому две вещи разделены:

- **exact SHPL object/page route: VERIFIED BY HOLDER REPLY**;
- **SHPL pixels independently rendered by this toolchain: PENDING**.

Это не влияет на уже закрытый global p.3 content result по independent direct facsimile.

---

## 1. Root authority — газета «Красная звезда»

**ГПИБ, родительский объект:**  
https://elib.shpl.ru/ru/nodes/25135-krasnaya-zvezda-tsentralnyy-organ-ministerstva-oborony-rossiyskoy-federatsii-m-1924-ezhedn

Object id: **25135**.

ГПИБ публично каталогизирует полный комплект 1941 года: **№1–309**. Web index отдельно подтверждает root newspaper object и 1941 holdings.

---

## 2. 1941 / декабрь

**Year node:** `36558`  
https://elib.shpl.ru/ru/nodes/36558-1941

Из institutional route, присланного самой ГПИБ:

`Красная звезда → 1941 → Декабрь (№№ 283-309) → № 288, 7 дек.`

**December node:** `37031`  
http://elib.shpl.ru/ru/nodes/37031-dekabr-locale-nil-locale-nil-283-309

---

## 3. Holder reply — exact №288 node recovered

### Inquiry

Дата: **2026-08-19**  
Адрес: **`elib@shpl.ru`**  
Gmail thread ID: **`1a019ce26e1553d8`**.

В запросе просили:

- stable issue node №288 от 07.12.1941;
- direct p.3 viewer/JPG route;
- штатную инструкцию выгрузки страницы;
- без изготовления платной копии без отдельного согласования.

### Reply from SHPL administration

Ответ ГПИБ: Gmail message ID **`1a01a18e755ec4d7`**.

ГПИБ сама указала:

**Exact issue node:**  
`http://elib.shpl.ru/ru/nodes/37037`

**Canonical issue URL:**  
`http://elib.shpl.ru/ru/nodes/37037-locale-nil-288-7-dek`

**Exact p.3 inspect route:**  
`http://elib.shpl.ru/ru/nodes/37037-locale-nil-288-7-dek#mode/inspect/page/3/zoom/4`

Штатная инструкция для page JPG:

> открыть страницу → кнопка `загрузить` → `крупный размер`.

Таким образом, прежняя формула **`exact SHPL child node unknown / discover, do not infer` больше не актуальна**.

Node **37037** получен не из арифметики соседних ID, а от администрации держателя цифрового объекта.

---

## 4. Что именно закрыто holder reply

Теперь institutionally verified:

- holder: **Государственная публичная историческая библиотека России**;
- corpus: `Красная звезда`, 1941;
- month branch: `Декабрь (№№ 283–309)`;
- exact child node: **37037**;
- issue label: **`№ 288, 7 дек.`**;
- exact viewer state for target: **page 3**;
- штатный route выгрузки страницы в JPG.

Это существенно сильнее прежнего inferred/mirror route и достаточно, чтобы считать **SHPL issue/page navigation identity closed**.

---

## 5. Что пока НЕ закрыто именно для SHPL pixels

Попытка открыть exact inspect route через текущий automated web layer упирается в redirect/safe-fetch limitation. Поэтому редакция пока **не заявляет**, что pixels именно SHPL derivative были независимо отрендерены этим toolchain.

Нельзя писать:

> `THE LEGENDARY POET визуально сверил SHPL p.3`.

пока SHPL page image не будет фактически rendered/downloaded здесь либо предоставлен как byte object.

Но также больше нельзя писать:

> `exact SHPL node неизвестен`.

или

> `неясно, как перейти к p.3 в ГПИБ`.

---

## 6. Уже закрытый global page-content result

Independent direct-object gate фиксирует exact PDF:

`Газета «Красная Звезда» №288 от 07 декабря 1941 года.pdf`

Internet Archive item: **`no2661212191941`**  
SHA-256: **`9e644dd79fd9d22199ec9cef158d2f1a9cf5ce5efbdc60f2eb3e578c8999e229`**.

На pixels printed p.3 установлено:

- `7 декабря 1941 г., воскресенье, № 288 (5043)`;
- printed page **3**;
- `Сын артиллериста`;
- `(Фронтовая поэма)`;
- **шесть газетных колонок**;
- конец `К. СИМОНОВ.` / `СЕВЕРНЫЙ ФРОНТ.`;
- following printed p.4 просмотрена и продолжения поэмы не содержит.

Следовательно, **global Red Star page-content gate remains CLOSED**.

---

## 7. Independent scholarly control

`Военно-исторический журнал` (`Издание Министерства обороны России`) в статье Е. Ю. Колобова, примечание 39, даёт:

`Симонов К. Сын артиллериста (фронтовая поэма) // Красная звезда. 1941. 7 декабря. С. 3.`

Теперь evidence stack для центральной публикации выглядит так:

1. **direct IA facsimile p.3/p.4 inspected** — page content/geometry;
2. **SHPL holder reply** — exact institutional issue node + exact p.3 inspect route;
3. **MoD scholarly bibliography** — independent p.3 citation;
4. public SHPL root/year holdings — corpus authority.

---

## 8. Remaining SHPL checklist

- [x] root corpus verified;
- [x] 1941 year node verified;
- [x] December range №283–309 verified;
- [x] exact child node №288 recovered from holder reply: **37037**;
- [x] exact p.3 inspect URL recovered from holder reply;
- [x] official JPG download procedure documented;
- [ ] render/download **SHPL derivative p.3 pixels** in an accessible environment;
- [ ] compare derivative identity/geometry with already inspected IA p.3;
- [ ] record any provenance metadata exposed by SHPL viewer;
- [ ] facsimile reuse/licence remains a separate decision.

## Итог

Главный institutional navigation gap закрыт качественно: **администрация ГПИБ сама подтвердила exact issue node `37037` и exact viewer route к p.3**. SHPL больше не является `child node unknown`. Осталась только узкая техническая задача holder-specific pixel comparison; содержание и geometry центральной публикации уже независимо закрыты direct facsimile.