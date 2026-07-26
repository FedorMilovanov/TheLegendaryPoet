# Есенин — «Правда», 9 ноября 1921 года, № 252: East View — pass 27

Дата evidence-pass: 26 июля 2026 года.

## Цель

Разрешить точную идентичность выпуска московской «Правды» от 9 ноября 1921 года, № 252, через официальный Pravda Digital Archive компании East View, не подменяя metadata, viewer-shell и машинно извлечённый текст оригинальным газетным факсимиле.

Pass 27 продолжает RSL access-state pass 26. Он снимает только часть исторического HOLD, связанную с точной идентификацией выпуска и его страницами. Получение и визуальное чтение оригинальных страниц остаются незакрытыми.

## Канонический HOLD

Исторический target:

`PW6-YE1-PRAVDA-1921-11-09`.

После pass 26 было подтверждено:

- официальная RSL parent-card газеты;
- наличие материалов 1921 года в фондах и на микрофильме;
- authentication-gated fragment service;
- отсутствие отдельной публичной RSL issue-card, viewer или PDF.

Pass 27 добавляет независимый точный issue-level East View record.

## Диагностическая цепочка

Все диагностические PR закрыты без слияния.

### PR #211 — featured archive discovery

- exact head `1c92bc8dd614c0f35f89356018bf5d7812c1e4f5`;
- run `30178654274`;
- artifact `8624927195`;
- digest `sha256:db9d6cba74e64af2d546eb89460ff0d6a62da183e630d4d1783b9fa83db2c15e`.

Первоначальный parser считал только URLs вида `/browse/issue/...` и пропустил буквальную ссылку featured issue.

### PR #213 — exact featured target

- exact head `851da0b889c2678ee2f7c723817da877d37fdc12`;
- run `30178998459`;
- artifact `8625011612`;
- digest `sha256:81e4121e16d486557926a4291286165bb546f1a209f6956579cfc7230fff2ffc`.

Runner передал очищенный visible text в anchor extractor, поэтому ложно сообщил об отсутствии ссылок. Ручная проверка сырых HTML восстановила точный issue target и обе страницы.

### PR #214 — literal page documents

- exact head `31738f933f18d54989875e3f11b0970cd06a5aa6`;
- run `30179167690`;
- artifact `8625055399`;
- digest `sha256:ffe60b2ca032ff00bb5090617bdf1e13a32d4808002f909a3642b3de4a905ebe`.

Обе страницы вернули HTTP 200, но статический body был viewer-shell. Один image asset, ошибочно классифицированный как facsimile, оказался логотипом East View.

### PR #215 — runtime network evidence

- exact head `91fafe94a7c013e267ce4c6785c327d4e551a57a`;
- run `30179314185`;
- artifact `8625103308`;
- digest `sha256:3fca692bc8a9654b466f1cf7cc0e154bb8f84ac253462a54d64bfc2bf765d864`.

Chromium записал реальные API-ответы, которые инициировало официальное Vue-приложение. API routes, issue ID и article IDs не конструировались.

## Архив East View

- authority: East View Information Services;
- archive: `Pravda Digital Archive (DA-PRA)`;
- UDB ID `870`;
- title ID `9305`;
- product SKU `2018581D`;
- доступ является подписным продуктом.

## Точный выпуск

Официальный featured-issues HTML содержит буквальный anchor:

`November 09, 1921, No. 252`

на URL:

`https://on-demand.eastview.com/ondemand-featured/featured-articles?issueId=967207`

Exact target response:

- HTTP 200;
- 25 979 байт;
- SHA-256 `9875ff38193afc29ddf8de7b0394f33e6e1c0a402ac777898df9de0a445c9657`;
- visible-text SHA-256 `800a0937ff98afc8c6ca5d76ab04c860d617b1006207c4bc23d19771e1771baf`.

Страница прямо идентифицирует:

- `Pravda`;
- `November 09, 1921, No. 252`;
- featured issue ID `967207`;
- две страницы выпуска.

Issue-level цена в API metadata — `19.00` USD. Никакая покупка не совершалась.

## Точные страницы

### Page 1

- article ID `21670570`;
- literal URL `https://on-demand.eastview.com/browse/doc/21670570`;
- runtime URL `https://on-demand.eastview.com/browse/doc/21670570/page-1`;
- runtime DOM 128 726 байт;
- DOM SHA-256 `19a3896cf71e21b102086f9407c18a61706d757a262073cb5f4a5717c59031df`;
- API payload 3 342 байта;
- API SHA-256 `3233186abaf92ffadbb936c1fb47f6e98102c28a3c91e7a66344c8929e1e91ab`.

### Page 2

- article ID `21670575`;
- literal URL `https://on-demand.eastview.com/browse/doc/21670575`;
- runtime URL `https://on-demand.eastview.com/browse/doc/21670575/page-2`;
- runtime DOM 127 921 байт;
- DOM SHA-256 `e75d3d6456e963615e7cda8e151d203cda1e7f77b13aa0bbe30d5d27d2ab74c0`;
- API payload 3 419 байт;
- API SHA-256 `54f9b1b9b0391198dd80999705414ce8fbb67d2634af85bccaf57a1554fea2b1`.

Обе page-document ссылки буквальны и возвращены официальной issue page. Они не вычислялись из соседних номеров.

## Runtime API state

### Authentication

`/api/auth`:

- HTTP 200;
- 1 084 байта;
- SHA-256 `0ef5dfee20375fda1dd4a0bcd7a87e1cd0df72974fd31d10999e2c653831a7fb`;
- `authenticated=false`;
- user IDs — null;
- cart — пуст;
- free-content counter — 0.

### Issue page map

`/api/article/pages?issueId=967207`:

- HTTP 200;
- 200 байт;
- SHA-256 `9f7be637d07e6df4abaac80bafab632f972408ea01d9f3f3358c7c1b4c009aad`;
- page 1 → article `21670570`;
- page 2 → article `21670575`;
- английского перевода нет.

### Full access

Для обеих страниц `/api/article/full-access` возвращает:

- HTTP 200;
- 20 байт;
- SHA-256 `722c131073d0e93bd7397a5fdc1f63a2a853c877759d0dcf38feeba79d0eb8e9`;
- `fullAccess=false`.

### Article metadata

Обе страницы сообщают:

- UDB `870`;
- edition `9305`;
- issue `967207`;
- issue title `No. 252`;
- output year 1921;
- точный permanent URL;
- `formatType=8`;
- `showPdf=false`;
- `pdfsAreAvailable=true` как metadata;
- `fullImageUrl=null`;
- буквальный `/util/savearticle?id=...` download path;
- `evodDetails.onDemandFullAccess=false`;
- warning enabled;
- sellable unit true.

Download paths не открывались. Наличие пути и metadata `pdfsAreAvailable` не означает, что PDF получен.

Article-level field `0.00` не является доказательством бесплатного доступа: он сосуществует с `fullAccess=false`, предупреждением и sellable-unit state.

## Машинно извлечённый текст

API payload содержит короткий автоматически извлечённый `articleText` для каждой страницы:

- page 1: 2 240 байт, SHA-256 `71685ba6b8c1911f0f7d00e51da626d8de592bb329fa44885d978b5de1f43a51`;
- page 2: 2 315 байт, SHA-256 `38fce0374ec8a0bd85f01d16497f121c749fe6a5638c646db75563e644f4b635`.

Проект не запускал OCR. Это текст, предоставленный East View, но его происхождение машинное и качество шумное. Он не является дипломатической транскрипцией и не заменяет визуальную проверку страницы.

Буквальный marker scan дал:

- Есенин — 0;
- Дункан — 0;
- Айседора — 0;
- танец — 0;
- школа — 0;
- 7 ноября — 0;
- Москва — 2 суммарно.

Этот отрицательный результат не является контролирующим: отсутствие строки в шумном auto-text не доказывает отсутствие материала на оригинальном изображении.

## Исправленные ложные повышения статуса

Навсегда запрещено трактовать как facsimile или полный доступ:

- логотипы и error icons viewer’а;
- текст интерфейса подписки;
- `articleText` как дипломатическую транскрипцию;
- article-level `0.00` как free access при `fullAccess=false`;
- `pdfsAreAvailable=true` как полученный PDF;
- буквальный download path как скачанный документ.

## Действующий статус

Закрыто:

- точная идентичность выпуска;
- точная дата и номер;
- East View issue ID;
- количество страниц;
- два точных page-document ID/URL;
- official runtime page map;
- anonymous subscription/access state.

Остаётся незакрытым:

- получение оригинальных двух page images/PDF;
- визуальное чтение факсимиле;
- проверка содержания по оригинальной полосе;
- права на репродукцию;
- покупка/подписка или авторизованный доступ.

## Что не было сделано

- подписка не покупалась;
- credentials не передавались;
- заказ не оформлялся;
- платёж не разрешался и не производился;
- download paths не открывались;
- оригинальный facsimile не получен;
- оригинальные страницы визуально не осмотрены;
- reader-facing статья не опубликована и не зарегистрирована;
- production authorization отсутствует.

## Следующий контролирующий шаг

Законно получить и визуально проверить оригинальные две страницы выпуска одним из путей:

1. East View через существующий институциональный/подписной доступ;
2. RSL reading-room или authentication-gated fragment service;
3. иной буквальный институциональный page-image route.

До этого точный выпуск считается идентифицированным, но его содержание — не закрытым оригиналом.
