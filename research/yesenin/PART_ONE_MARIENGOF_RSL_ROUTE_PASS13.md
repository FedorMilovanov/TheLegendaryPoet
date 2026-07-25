# Сергей Есенин, часть I — Мариенгоф 1928: RSL route discovery pass 13

Дата: 2026-07-25

Diagnostic revision: `r1`.

Статус: `DIAGNOSTIC-ONLY / OFFICIAL-RSL-RECORD / PUBLISHED-LINKS-ONLY / NO-CONSTRUCTED-PDF-URL / NO-OCR / NO-SYNTHETIC-DOCUMENT / NOT-PUBLIC`

## Цель

Проверить официальный record Российской государственной библиотеки:

- `https://search.rsl.ru/ru/record/01009198586`;
- А. Б. Мариенгоф, «Роман без вранья», второе издание;
- Ленинград: Прибой, 1928;
- исторический target: `PW6-YE1-MARIENGOF-1928`.

Карточка указывает открытый цифровой доступ, но current typed queue ещё не содержит exact PDF bytes, SHA-256, frame count или постраничную колляцию Yakulov-сцены.

## Метод

Diagnostic script:

1. скачивает реальный HTML record;
2. сохраняет исходные bytes и SHA-256;
3. извлекает только опубликованные `href`, `src`, `action`, meta/data URL и абсолютные URL из HTML/inline JSON;
4. нормализует их относительно самой record page;
5. оставляет только official `*.rsl.ru` candidates с viewer/PDF/download/digital markers;
6. пробует ровно найденные routes с byte-range запросом;
7. сохраняет final URL, status, content type/disposition и sample SHA-256.

Запрещено:

- строить route по record ID;
- подставлять предполагаемый `.pdf` endpoint;
- считать snippet или OCR доказательством текста книги;
- генерировать реконструированные страницы;
- повышать viewer route до acquired facsimile до скачивания и проверки полного объекта.

## Границы

- `routeConstructed=false`;
- `ocrUsed=false`;
- `syntheticContentUsed=false`;
- `documentGenerated=false`;
- `archiveOriginalInspected=false`;
- `productionAuthorized=false`;
- `rightsResolved=false`.

Результат pass 13 — только route/provenance diagnostics. Acquisition, hashing полного PDF, frame map и collation сцены выполняются отдельным exact-object pass после проверки артефакта.
