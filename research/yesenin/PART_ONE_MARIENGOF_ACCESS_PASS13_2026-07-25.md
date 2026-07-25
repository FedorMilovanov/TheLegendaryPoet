# Сергей Есенин, часть I — Мариенгоф 1927/1928: access-state pass 13

Дата: 2026-07-25

Статус: `2 EXACT-RSL-CARDS / 1 METADATA-CORRECTION / 1 VIEWER-API-CONTRACT / 0 PDF-OBJECTS-ACQUIRED / 2 ACTIVE-HOLDS-PRESERVED / NO-ROUTE-GUESSING / UNPUBLISHED`

## Цель

Проверить два exact-object target из historical pass-six queue:

- `PW6-YE1-MARIENGOF-1927` — первое издание «Романа без вранья»;
- `PW6-YE1-MARIENGOF-1928` — второе издание и контроль возможных редакционных изменений.

Pass 13 исследует только официальные поверхности РГБ. Карточка, HTML-переход, viewer metadata и API-ответ не приравниваются к полученному и визуально прочитанному факсимиле.

## 1927: точная карточка, маршрут не опубликован

Typed record: `MA13-YE1-MARIENGOF-1927`.

- official card: `https://search.rsl.ru/ru/record/01009215492`;
- extent: 154 pages;
- holdings: `P 106/97`, `P 106/95`;
- fetched card bytes: 63 241;
- card SHA-256: `744eedf8b895f6f916ce444bdcce3b66a940b732170f5fabc99236e0a243d236`;
- card claims full open viewer access;
- `freeAccessAlertReadLink` is literally `href="#"`;
- official client handler only copies a `data-read-url` value from a clicked `.js-free-access-alert` element;
- no such value or working viewer/PDF route was present in the inspected card;
- `routeConstructed=false`;
- `facsimileBytesAcquired=false`.

Operational state: `catalogue-verified-route-unresolved`.

The first-edition HOLD remains active. A route formed only by prefixing the record ID would be an invented locator and is not accepted.

## 1928: locator corrected, viewer download blocked

Typed record: `MA13-YE1-MARIENGOF-1928`.

Historical pass-six locator:

- `https://search.rsl.ru/ru/record/01009198586`.

Correct official object:

- card: `https://search.rsl.ru/ru/record/01009215494`;
- second edition, Leningrad: Priboi, 1928;
- 157 pages plus 3 pages of advertisements;
- fetched card bytes: 66 985;
- card SHA-256: `c07c001f647654ee4d69af8da80d23882c6e68e81e85f58c98012dc32143dee8`.

The literal official chain is preserved exactly:

1. Search RSL `/ru/view/01009215494?redirect=...`;
2. response final URL `https://dlib.rsl.ru/01009215494`;
3. literal dlib replacement rule to `https://viewer.rsl.ru/rsl01009215494`;
4. document ID `rsl01009215494` read from that viewer route;
5. distributed viewer JavaScript contract for `/api/v1/document/{id}/info` and allowed-format download;
6. `GET https://viewer.rsl.ru/api/v1/document/rsl01009215494/info` → HTTP 200.

Frozen viewer metadata:

- response bytes: 2 771;
- response SHA-256: `5d9c30a977aaa75c2446969525bddecf9052b6098d61d56dd23b3cff21348f92`;
- title: «Роман без вранья : [Литературные воспоминания]»;
- page count: 172 digital pages;
- format inventory includes `pdf`;
- `accessLevel=restricted`;
- `isAvailable=false`;
- `downloadAccess.isDownloadable=false`;
- `downloadableFormats=[]`;
- `allowedAccessTokens.pdf=false`;
- `facsimileBytesAcquired=false`.

Operational state: `viewer-api-verified-download-blocked`.

The corrected locator is an overlay. Historical pass-six data remains unchanged so the former error and its correction are both auditable.

## Exact evidence run

- GitHub Actions run: `30138036528`;
- research artifact digest: `sha256:98e0b56ed89b3677cf06462c4e2ace1bc99e124afd622436cf191929353254e2`;
- diagnostic artifact digest: `sha256:ab11eed4b0c8c7e283292ef3c1effac470b3d8b99b4dc76b41d95ffbd4507963`.

## Effective-state decision

Neither historical target is superseded or partially satisfied by page evidence:

- active HOLD count remains 11;
- target-unfulfilled `active-hold` count remains 10;
- access-investigated active HOLD count becomes 2;
- metadata-corrected historical HOLD count becomes 1;
- acquired facsimile object count remains 6;
- archive originals inspected remain 0;
- reproduction-rights decisions remain 0;
- `productionAuthorized=false`.

## Boundaries

- catalogue metadata is not page evidence;
- viewer metadata is not a facsimile;
- format inventory `pdf` is not download authorization;
- restricted viewer access is not open digital reuse;
- OCR and PDF text layers were not used as evidence;
- the Yakulov scene and edition variants remain uncollated;
- no reader-facing claim is strengthened by this pass;
- no public route, sitemap, navigation or media registry changes.
