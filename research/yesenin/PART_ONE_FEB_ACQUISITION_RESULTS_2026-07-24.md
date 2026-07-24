# Сергей Есенин, часть I: результаты получения страниц ФЭБ

Дата: 2026-07-24

Issue: #76

Статус: `THREE-WITNESS-GROUPS-ACQUIRED / SIRENA-COVER-BYTES-PENDING / RIGHTS-AND-OBJECT-PROVENANCE-UNRESOLVED / PUBLICATION-NOT-AUTHORIZED`

## Доказательный прогон

- workflow: `Source acquisition 76 — Yesenin FEB page witnesses`;
- run: № 11, GitHub Actions run `30104627205`;
- exact head: `5d33eb1adfccc4f43a9eafbf8d72ae3ac8769918`;
- conclusion: `success`;
- artifact: `yesenin-feb-page-witnesses-76`;
- artifact size: `1,524,969` bytes;
- artifact digest: `sha256:b057dcc655b15e6e729216c922d9692059fff91c3c80bbafc74e366edf38aa01`;
- artifact expiry: 2026-08-07;
- manifest summary:
  - targets: 4;
  - exact downloaded images: 6;
  - page-identified targets: 4/4;
  - exact-byte-complete targets: 3/4;
  - technical errors: 0.

Artifact expiry is the reason this durable textual ledger records every accepted source URL and SHA-256. The external image bytes are not committed by this branch.

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

- official school type and the fact of completion are supported for carefully cited drafting;
- public reproduction of the certificate remains on HOLD pending rights/object provenance.

## WIT-YE1-002 — assignment to military-sanitary train no. 143, pages 672–674

Classification: `PAGE-IDENTIFIED-EXACT-PUBLISHED-BYTES-ACQUIRED`.

- page/group URL: `https://feb-web.ru/feb/esenin/chronics/el1/el1-669-.htm?cmd=p`;
- exact image URL: `https://feb-web.ru/feb/esenin/pictures/el1-673-.jpg`;
- visible printed pages in the group: 672, 673, 674;
- FEB alt text: `Извещение Петроградского резерва санитаров`;
- source SHA-256: `b9ce49137fa139faa1ee47e8e33d6e4592ac2d4bed1e2b69ac8da88c167c1484`;
- visual inspection: the image is a document assigning Есенин to the train command; it is not the nearby portrait or an unrelated page.

Important boundary:

- the acquired published image supports the train no. 143 assignment context;
- it does not prove direct inspection of the controlling RGIA original;
- it does not establish infirmary no. 17 as Есенин's formal unit.

Archive HOLD remains for the controlling RGIA shelfmarks already fixed in `PART_ONE_PAGE_WITNESS_LEDGER.md`.

## WIT-YE1-003 — train reports and personnel photograph, pages 688–691

Classification: `PAGE-IDENTIFIED-EXACT-PUBLISHED-BYTES-ACQUIRED`.

All four expected exact image routes were acquired and visually inspected:

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

Separate media-provenance work remains mandatory for page 690 before any production use as an image.

## WIT-YE1-004 — `Сирена`, printed page 621

Classification after run № 11: `PAGE-IDENTIFIED-BYTES-NOT-ACQUIRED`.

The official FEB contents/list pages independently identify two different objects on printed page 621:

1. Есенин's application to the Palace of Arts;
2. the cover of `Сирена`, № 4–5 (1919), associated with publication of the imagist declaration.

The acquisition probe confirmed printed-page identity but rejected the guessed routes:

- `el2-621-.jpg` — HTTP 404 / HTML;
- `el2-621-1.jpg` — HTTP 404 / HTML;
- `el2-621-2.jpg` — HTTP 404 / HTML.

No logo, generic page asset or first object on page 621 is accepted as the `Сирена` cover.

A dedicated route/DOM discovery pass is required. Even after the cover is acquired, it will not prove the internal declaration pages or resolve the printed-date versus probable-release-date problem.

## What the run proves

The run proves that:

- the four expected printed-page groups are reachable from GitHub Actions;
- six exact FEB image responses were acquired with stable URLs and hashes;
- three witness groups are byte-complete at the published-page layer;
- the school and train files are visually the claimed published objects;
- technical acquisition errors are currently zero;
- page 621 remains honestly incomplete.

## What the run does not prove

It does not prove:

- direct inspection of any archive original;
- ownership, public-domain status or permission for production reuse;
- full object provenance for the school certificate;
- complete RGIA personnel/service files;
- that the train photograph may be published without a separate media decision;
- the first actual circulation date of the imagist declaration;
- the internal pages or text setting of `Сирена` № 4–5;
- a publication-ready Yesenin article.

## Required next actions

1. finish exact `Сирена` page-621 route discovery;
2. acquire and visually distinguish the cover from the Palace-of-Arts application;
3. locate internal `Сирена` declaration pages and `Советская страна` № 3;
4. preserve all accepted hashes in a typed durable evidence registry;
5. determine object provenance and rights for any image proposed for production;
6. obtain/request controlling RGIA and family-record facsimiles;
7. only then begin citation topology and section drafting.
