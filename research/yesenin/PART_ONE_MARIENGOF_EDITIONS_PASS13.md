# Сергей Есенин, часть I — Мариенгоф 1927/1928: exact RSL acquisition pass 13

Дата: 2026-07-25

Статус: `DIAGNOSTIC-ACQUISITION / TWO-OFFICIAL-RSL-CARDS / PUBLISHED-PDF-LINKS-ONLY / EXACT-VALUES-PENDING-ARTIFACT / NO-OCR-EVIDENCE / RESEARCH-ONLY`

## Исправление locator

Historical pass-six record `PW6-YE1-MARIENGOF-1928` содержит устаревший/ошибочный catalogue URL `01009198586`.

Официально проверенный объект:

- карточка: `https://search.rsl.ru/ru/record/01009215494`;
- MARC identity: `001 009215494`;
- А. Б. Мариенгоф, «Роман без вранья»;
- 2-е издание;
- Ленинград: Прибой, 1928;
- 157 с., [3] с. объявлений;
- опубликованный в карточке MARC 856 PDF route на `dlib.rsl.ru`.

Pass 13 не переписывает историческую очередь до получения exact-object artifact. Исправление будет оформлено отдельным typed metadata overlay, чтобы сохранить историю ошибки и текущий корректный locator одновременно.

## Два сравниваемых объекта

### Первое издание, 1927

- historical target: `PW6-YE1-MARIENGOF-1927`;
- карточка: `https://search.rsl.ru/ru/record/01009215492`;
- Ленинград: Прибой, 1927;
- 154 с.;
- задача: найти точные страницы Yakulov-сцены и зафиксировать первое печатное оформление.

### Второе издание, 1928

- historical target: `PW6-YE1-MARIENGOF-1928`;
- корректная карточка: `https://search.rsl.ru/ru/record/01009215494`;
- Ленинград: Прибой, 1928;
- 157 с., [3] с. объявлений;
- задача: найти ту же сцену и проверить редакционные изменения между изданиями.

## Acquisition method

Для каждой карточки workflow:

1. скачивает реальный HTML Search RSL;
2. проверяет год и физический объём;
3. извлекает опубликованные URL из HTML;
4. принимает ровно один официальный `dlib.rsl.ru` PDF route, содержащий record ID;
5. не конструирует URL из номера карточки;
6. скачивает полный PDF;
7. фиксирует final URL, content type, bytes, SHA-256 и PDF frame count;
8. рендерит контактные листы всех кадров;
9. сохраняет карточки, originals, manifest и summary только в краткоживущем Actions artifact.

## Границы первого этапа

- текстовый/OCR-слой PDF не используется как evidence;
- contact sheet служит навигацией, но не заменяет крупный постраничный просмотр;
- точные страницы сцены ещё не объявлены найденными;
- сравнение формулировок ещё не выполнено;
- library scan не повышается до archive original;
- открытый просмотр не решает reproduction rights;
- `routeConstructed=false`;
- `ocrUsedForEvidence=false`;
- `syntheticContentUsed=false`;
- `archiveOriginalInspected=false`;
- `productionAuthorized=false`.

После проверки artifact ветка будет очищена до одного exact-object commit с typed records, frozen hashes/frame counts, manual page map и effective-state решением для обоих historical HOLD.
