# «Красная звезда» №288, 07.12.1941, с. 3 — SHPL holder-JPG closeout

Дата проверки: **2026-08-20**  
Статус: **exact SHPL p.3 JPG supplied by holder / pixels directly inspected / institutional p.3 cross-check CLOSED / facsimile reuse rights remain OPEN / binary not vendored**

## Что изменилось

Документы от 19 августа фиксировали правильный, но уже устаревший промежуточный статус: ГПИБ подтвердила exact issue node `37037` и штатный route к странице 3, однако pixels именно SHPL-дериватива ещё не были доступны исследовательскому toolchain.

20 августа администрация Открытой электронной библиотеки ГПИБ ответила на follow-up и **сама прислала JPG страницы 3**. Это закрывает holder-specific pixel comparison без угадывания внутренних download URL и без подмены институционального объекта сторонним mirror.

Этот closeout supersedes **только** прежнюю формулу `SHPL derivative pixels pending` в датированных research snapshots от 19 августа. Он не меняет отдельно открытый вопрос о праве на публичную републикацию газетного facsimile.

## Holder provenance

Holder: **Государственная публичная историческая библиотека России (ГПИБ / SHPL), Открытая электронная библиотека**.

Исходная институциональная цепочка уже была подтверждена самим holder:

`Красная звезда → 1941 → Декабрь (№№ 283–309) → №288, 7 дек. → page 3`

Exact issue node: **`37037`**.  
Exact inspect state: **`#mode/inspect/page/3/zoom/4`**.

Follow-up reply 20.08.2026 содержит краткую формулу: библиотеке проще прислать саму страницу, после чего к письму приложен exact page JPG.

Attachment identity:

- filename: **`Krasnaya_zvezda_1941_288-3.jpg`**;
- MIME: **`image/jpeg`**;
- byte length: **543 907 bytes**;
- pixel dimensions: **1146 × 1611**;
- decoded image mode: **grayscale (`L`)**;
- SHA-256: **`9438e95c530f04a2eeffd60771a9425c7997889ea4b9ff977aa83c3a499d2824`**.

Исследовательская копия получена непосредственно от администрации holder, а не извлечена из предполагаемого внутреннего URL.

## Direct visual inspection результата ГПИБ

На присланном JPG непосредственно видны:

- верхняя строка **`7 декабря 1941 г., воскресенье, № 288 (5043).`**;
- printed page number **3**;
- заголовок **`Сын артиллериста`**;
- подзаголовок **`(Фронтовая поэма)`**;
- начало текста в нижней части полосы после горизонтальной отбивки;
- публикация занимает **шесть газетных колонок**;
- в крайней правой колонке — подпись **`К. СИМОНОВ.`**;
- под подписью — **`СЕВЕРНЫЙ ФРОНТ.`**.

Эти наблюдения совпадают с уже зафиксированным direct inspection independent PDF из Internet Archive. Тем самым второй institutional-holder object подтверждает identity страницы, layout и границы публикации на p.3.

Важно: это **cross-copy content/geometry identity**, а не утверждение о byte-identical деривативах. IA PDF и SHPL JPG — разные цифровые производные и не обязаны иметь одинаковый hash или размер.

## Что остаётся за пределами этого closeout

### Printed p.4

ГПИБ прислала target page 3. Проверка отсутствия продолжения на printed p.4 остаётся закрыта прежним direct inspection exact IA issue PDF; этот closeout не приписывает ГПИБ отдельную поставку p.4.

### Reuse / publication rights

В запросе к ГПИБ прямо было указано, что JPG нужен **только для исследовательской сверки**, а разрешение на публикацию изображения не запрашивается. Ответ holder прислал страницу, но **не содержит отдельной лицензии или разрешения на публичную републикацию facsimile**.

Поэтому:

- research access: **CLOSED / received**;
- exact institutional p.3 pixels: **CLOSED / inspected**;
- institutional p.3 provenance cross-check: **CLOSED**;
- facsimile reuse/publication permission: **OPEN / separate**.

Нельзя превращать факт получения исследовательского JPG в разрешение разместить полосу на сайте.

## Repository hygiene

Исследовательский JPG **не вендорится в repository**. Для воспроизводимости сохраняются только:

- holder identity;
- exact issue/page route;
- filename;
- byte length;
- dimensions;
- SHA-256;
- direct visual findings.

Это закрывает evidence gap без добавления в git ещё одного полумегабайтного архивного binary, который не используется reader-facing publication.

## Evidence stack после closeout

1. **Internet Archive exact №288 PDF** — 6 506 121 bytes, SHA-256 `9e644dd79fd9d22199ec9cef158d2f1a9cf5ce5efbdc60f2eb3e578c8999e229`; p.3 и p.4 direct-inspected.
2. **SHPL/GPIB holder-supplied p.3 JPG** — 543 907 bytes, 1146×1611, SHA-256 `9438e95c530f04a2eeffd60771a9425c7997889ea4b9ff977aa83c3a499d2824`; p.3 direct-inspected.
3. **Военно-исторический журнал / Ministry of Defence bibliography** — independent scholarly locator `7 декабря. С. 3`.
4. **SHPL node 37037 / exact inspect route** — institutionally supplied navigation provenance.

## Итог

Holder-specific technical gap закрыт: **THE LEGENDARY POET фактически получил и визуально сверил exact SHPL/GPIB p.3 derivative**. Центральная публикация теперь имеет не только independent direct facsimile, но и второй direct institutional-holder pixel witness.

Открытым остаётся только отдельный rights question, если когда-либо появится желание публично показывать газетную полосу. Текущая статья этого facsimile не публикует, поэтому новый rights request для существующего reader не требуется.
