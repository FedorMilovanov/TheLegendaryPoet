# PR #77: accepted active production media

Date: 2026-07-24

Status: `2-ACCEPTED / 28-UNRESOLVED`

This ledger supplements `pr77-commons-original-provenance-ledger-2026-07-24.md`. The original ledger proved 30/30 file acquisition and hashes; this file records only independent historical caption decisions that are safe to apply to production.

## Decision policy

An asset moves from `unresolved` to `accepted` only when:

1. its exact Commons original and hashes are known;
2. an independent institution, object card, photo chronicle or primary publication supports the caption;
3. the independent witness and acquired original are visually the same image;
4. unknown creator/date/location fields remain unknown;
5. public-domain rationale and historical caption evidence remain separate;
6. the decision is applied by stable `mediaKey`, not by matching caption text.

Machine-readable decisions:

- `research/mayakovsky/media/pr77-editorial-decisions-2026-07-24.json`.

## Accepted C03 — Mayakovsky, Kazan, 1914

- candidate: `C03`;
- Commons title: `Vladimir Mayakovsky 1914.jpg`;
- production media key: `mayakovsky-1914`;
- original bytes: `28,750`;
- original dimensions: `400 × 564`;
- original SHA-256: `b6250970d408b602b96b0cf35fc1ee8b50eff88d64caebd6e53a6018dd7a974d`;
- creator: `Unknown author`;
- date: `1914`;
- location: `Казань`;
- accepted caption: `Футурист Владимир Маяковский. Казань, 1914.`;
- independent source: `История России в фотографиях`;
- source institution: `ГБУК г. Москвы «Государственный музей В. В. Маяковского»`;
- evidence URL: `https://russiainphoto.ru/photos/248776/`;
- Commons page: `https://commons.wikimedia.org/wiki/File:Vladimir_Mayakovsky_1914.jpg`;
- PD rationale: `Template:PD-RusEmpire`.

Visual match:

- same studio negative;
- identical pose, top hat, cigarette/holder, cane, glove, clothing, background and handwritten inscription;
- C03 is a reduced high-contrast reproduction of the museum/photo-chronicle witness.

Runtime changes:

- Part I image caption and credit now use the museum-backed record;
- Part I cover metadata now uses the museum-backed record;
- local image bytes/mediaKey were not changed.

## Accepted C08 — photograph by Osip Brik, 1928

- candidate: `C08`;
- Commons title: `Mayakovsky 1928 by Osip Brik.jpg`;
- production media key: `mayakovsky-1928-osip`;
- original bytes: `100,934`;
- original dimensions: `514 × 724`;
- original SHA-256: `0e004e5ae2ce5d2c152e4dd603dff619ae35b219de431e84df065b7d12f18f0f`;
- creator: `Осип Максимович Брик`;
- date: `1928`;
- location: unresolved;
- accepted caption: `Владимир Маяковский. Фотография Осипа Брика, 1928.`;
- source institution: `Российская государственная библиотека`;
- Commons page: `https://commons.wikimedia.org/wiki/File:Mayakovsky_1928_by_Osip_Brik.jpg`;
- PD rationale: `Template:PD-Russia`.

Primary RSL witnesses:

1. official ten-volume index:
   - viewer: `https://dlib.rsl.ru/viewer/01005408088#?page=377`;
   - exact page API: `https://viewer.rsl.ru/api/v1/document/rsl01005408088/page/377`;
   - printed page visible in the scan: `376`;
   - statement under `ПОРТРЕТЫ`: portrait 2 is a 1928 photograph by O. M. Brik in volume seven;
2. official volume-seven reproduction:
   - viewer: `https://dlib.rsl.ru/viewer/01005408111#?page=5`;
   - exact page API: `https://viewer.rsl.ru/api/v1/document/rsl01005408111/page/5`;
   - contains the exact portrait reproduced by C08.

Verification evidence:

- workflow run: `30097285671`;
- artifact digest: `sha256:c1397cfa078f80319515cab9aeba8674c459c1ca037f30c271dab69eb56f9067`;
- document-info API confirmed free view access and complete page ranges for both RSL volumes;
- visual match confirmed by identical face, raised hand, shirt, tie, jacket pattern, lighting and framing.

Runtime changes:

- Part II image caption and credit now point to the RSL witness;
- Part II cover metadata now points to the RSL witness;
- no location was added;
- local image bytes/mediaKey were not changed.

## Still unresolved

Candidates `C01`, `C02`, `C04–C07`, and `C09–C30` remain unresolved. In particular:

- C01 (`Mayakovsky 1910.jpg`) lacks an independently matched object/photo record;
- C27 (`1928 LYuB editing film.jpg`) has no verified depicted/created date; its MediaWiki upload timestamp is not a photo date;
- unknown authors remain unknown;
- no other production caption is upgraded by analogy with C03 or C08.

## Current publication status

- original acquisition: `30/30 complete`;
- independent historical acceptance: `2/30`;
- production metadata repaired: `2 active media keys`;
- unverified candidates allowed into new production use: `0`;
- PR #78 merge status: blocked until exact-head CI/66-browser QA and a deliberate decision on whether the remaining unresolved media are already used by current essays.
