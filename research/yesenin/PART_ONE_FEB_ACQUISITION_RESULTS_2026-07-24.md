# Сергей Есенин, часть I: результаты получения страниц ФЭБ

Дата: 2026-07-24

Issue: #76

Статус: `FOUR-WITNESS-GROUPS-ACQUIRED / SEVEN-EXACT-PUBLISHED-PAGE-IMAGES / RIGHTS-AND-OBJECT-PROVENANCE-UNRESOLVED / INTERNAL-DECLARATION-WITNESSES-PENDING / PUBLICATION-NOT-AUTHORIZED`

## Доказательные прогоны

### Run № 11 — основной exact-page acquisition

- workflow: `Source acquisition 76 — Yesenin FEB page witnesses`;
- GitHub Actions run: `30104627205`;
- exact head: `5d33eb1adfccc4f43a9eafbf8d72ae3ac8769918`;
- conclusion: `success`;
- artifact: `yesenin-feb-page-witnesses-76`;
- artifact size: `1,524,969` bytes;
- artifact digest: `sha256:b057dcc655b15e6e729216c922d9692059fff91c3c80bbafc74e366edf38aa01`;
- artifact expiry: 2026-08-07;
- summary:
  - targets: 4;
  - exact downloaded images: 6;
  - page-identified targets: 4/4;
  - exact-byte-complete targets at that stage: 3/4;
  - technical errors: 0.

### Run № 21 — exact `Сирена` anchor/click discovery

- GitHub Actions run: `30105655555`;
- exact head: `8847c97b34902f184b626e371219393efa8c6d4e`;
- conclusion: `success`;
- artifact: `yesenin-feb-page-witnesses-76`;
- artifact size: `1,608,116` bytes;
- artifact digest: `sha256:6cbb3392d942e95abb47230208c861c30380a12d65ecc2d239aef4bd8891f1fb`;
- artifact expiry: 2026-08-07;
- exact anchor:
  - visible label: `С. 621`;
  - raw `href`: `#`;
  - `onclick`: `showimg('../../pictures/El2-6212.jpg', ...)`;
- click-time network:
  - request: `https://feb-web.ru/feb/esenin/pictures/El2-6212.jpg`;
  - response: HTTP 200, `image/jpeg`;
- popup title and image alt independently identify the object as the cover of `Сирена`, № 4–5, 1919;
- one non-blocking generic-route timeout occurred on the separate Palace-of-Arts application route `el2-621-.htm#75`; it did not affect the exact anchor click or image acquisition.

Artifact expiry is why this durable ledger and typed registry retain every accepted URL, SHA-256 and evidence boundary. External source-image bytes are not committed by this branch.

## WIT-YE1-001 — school certificate, printed page 545

Classification: `PAGE-IDENTIFIED-EXACT-PUBLISHED-BYTES-ACQUIRED`.

- page/group URL: `https://feb-web.ru/feb/esenin/chronics/el1/el1-485-.htm?cmd=p`;
- exact image URL: `https://feb-web.ru/feb/esenin/pictures/el1-545-.jpg`;
- printed page: 545;
- FEB alt text: `Свидетельство об окончании Есениным Спас-Клепиковской второклассной учительской школы`;
- source SHA-256: `cc608f256a4102c968b6c1401f83a95c475cad738db1c4e6cfa4c5d88674dd10`;
- visual inspection: the acquired image is the full published certificate page, not a thumbnail, logo or unrelated illustration.

Still unresolved:

- object-level holding institution and object number;
- whether FEB reproduces the complete original recto/verso;
- object dimensions and reproduction-rights basis;
- publication authorization for a local derivative.

Claim effect:

- official school type and completion are supported for carefully cited drafting;
- public reproduction remains on HOLD pending rights/object provenance.

## WIT-YE1-002 — assignment to military-sanitary train no. 143, pages 672–674

Classification: `PAGE-IDENTIFIED-EXACT-PUBLISHED-BYTES-ACQUIRED`.

- page/group URL: `https://feb-web.ru/feb/esenin/chronics/el1/el1-669-.htm?cmd=p`;
- exact image URL: `https://feb-web.ru/feb/esenin/pictures/el1-673-.jpg`;
- visible printed pages in the group: 672, 673, 674;
- FEB alt text: `Извещение Петроградского резерва санитаров`;
- source SHA-256: `b9ce49137fa139faa1ee47e8e33d6e4592ac2d4bed1e2b69ac8da88c167c1484`;
- visual inspection: the image is the assignment document, not the nearby portrait or an unrelated page.

Important boundary:

- the published image supports the train no. 143 assignment context;
- it does not prove direct inspection of the controlling RGIA original;
- it does not establish infirmary no. 17 as Есенин's formal unit.

Archive HOLD remains for the controlling RGIA shelfmarks in `PART_ONE_PAGE_WITNESS_LEDGER.md`.

## WIT-YE1-003 — train reports and personnel photograph, pages 688–691

Classification: `PAGE-IDENTIFIED-EXACT-PUBLISHED-BYTES-ACQUIRED`.

| Printed page | Exact FEB image | FEB description | SHA-256 |
|---:|---|---|---|
| 688 | `https://feb-web.ru/feb/esenin/pictures/el1-688-.jpg` | report on the 30th and 31st trips | `1c0a3369871c1bac53e772875e17213dc974700fd22a20ce0a5fee281bbfd1c1` |
| 689 | `https://feb-web.ru/feb/esenin/pictures/el1-689-.jpg` | report on the 32nd trip | `125a35316ae95e591e59b8a9c0292aca7a80791e8045b7bbf1bc111935ce8304` |
| 690 | `https://feb-web.ru/feb/esenin/pictures/el1-690-.jpg` | Есенин among personnel of train no. 143 | `08465a4383e3afa2d9fa087c61a006e750c6fc6c395a343ebf26c0fbfb5ad8ef` |
| 691 | `https://feb-web.ru/feb/esenin/pictures/el1-691-.jpg` | report on the 33rd trip | `f803ce1dd8649de3e7ee496d4596b23635452f768a2aefb51ae33d9d5d388510` |

Visual inspection confirms:

- pages 688, 689 and 691 are report pages;
- page 690 is the personnel photograph beside the train;
- none of the accepted files is a site logo or generic illustration.

Separate media-provenance work remains mandatory for page 690 before production use.

## WIT-YE1-004 — cover of `Сирена`, printed page 621

Classification: `PAGE-IDENTIFIED-EXACT-PUBLISHED-BYTES-ACQUIRED`.

The official FEB list contains two distinct page-621 objects:

1. Есенин's application to the Palace of Arts;
2. the cover of `Сирена`, № 4–5 (1919), associated with publication of the imagist declaration.

The first guessed routes were correctly rejected as HTTP 404 / HTML:

- `el2-621-.jpg`;
- `el2-621-1.jpg`;
- `el2-621-2.jpg`.

Run № 21 then inspected the exact `Сирена` list anchor and found its hidden JavaScript route:

- source/list URL: `https://feb-web.ru/feb/esenin/chronics/el2/el2-spis.htm?cmd=p`;
- raw anchor: `href="#"`;
- exact `onclick`: `showimg('../../pictures/El2-6212.jpg', ...)`;
- exact image URL: `https://feb-web.ru/feb/esenin/pictures/El2-6212.jpg`;
- HTTP/MIME: 200 / `image/jpeg`;
- bytes: `18,693`;
- dimensions: `237 × 309`;
- source SHA-256: `a316190933bcbdb433c835359d971854176a32d808787bcdc0050aad5b501cb4`;
- popup title/image alt: `Обложка журнала «Сирена» (№ 4—5, 1919), опубликовавшего декларацию имажинистов.`;
- visual inspection: the image is the stylized `Сирена` cover, not the Palace-of-Arts application, a site logo or a generic asset.

Still unresolved:

- internal declaration pages, signatures and typesetting state;
- the exact `Советская страна`, № 3, 10 February 1919 newspaper witness;
- printed-date versus probable public-release-date chronology;
- original object provenance and reproduction rights.

Claim effect:

- the identity and appearance of the `Сирена` issue cover are supported at the published-page layer;
- the cover alone does **not** authorize an unqualified claim that `Сирена` was the first actual publication in circulation;
- public reuse of the cover remains unauthorized until rights/provenance review.

## What the combined evidence proves

- all four expected printed-page witness groups are reachable;
- seven exact FEB image responses have stable URLs and SHA-256 hashes;
- school, train-assignment, train-report/personnel and `Сирена`-cover objects were independently visually identified;
- the exact hidden `Сирена` route is reproducible from the official list anchor;
- no logo, HTML error page or unrelated page object is accepted as a facsimile;
- no accepted FEB image is promoted to `archive-original`;
- technical/source incompleteness is separated from production authorization.

## What the evidence does not prove

- direct inspection of any archive original;
- ownership, public-domain status or permission for production reuse;
- full object provenance for the school certificate;
- complete RGIA personnel/service files;
- photographer/provenance rights for the train photograph;
- the internal pages or text setting of `Сирена` № 4–5;
- the exact physical `Советская страна` № 3 witness;
- the first actual circulation date of the imagist declaration;
- a publication-ready Yesenin article.

## Required next actions

1. locate the internal `Сирена` declaration pages;
2. locate `Советская страна`, № 3, 10 February 1919;
3. collate both text/settings and printed versus probable release dates;
4. determine object provenance and rights for any image proposed for production;
5. obtain/request controlling RGIA and family-record facsimiles;
6. build stable block-to-source citation topology;
7. only then begin section drafting and editorial review.
