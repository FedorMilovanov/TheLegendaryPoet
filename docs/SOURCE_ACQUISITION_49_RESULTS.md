# Issue 49 source-acquisition ledger

Last updated: 2026-07-24

This document is the durable repository record for the source-acquisition marathon tracked in issue #49. It records the exact files, hashes, page topology and evidentiary limits that were established before the temporary GitHub Actions acquisition workflows were removed.

The canonical live backlog remains issue #49. This ledger does not turn a published facsimile into an archive object passport, an OCR layer into a scan, or a witness statement into a laboratory finding.

## Verification standard

A source was marked `PAGE-VERIFIED` only after the following were checked where applicable:

1. physical file bytes and SHA-256;
2. PDF/DJVU signature and structural readability;
3. title and verso/title-page publication data;
4. physical and printed pagination;
5. contents, appendix, indexes and colophon;
6. the pages needed for the claims in the essays;
7. visual page witnesses, not OCR alone.

`PUBLISHED-FACSIMILE-PAGE-VERIFIED` means that the facsimile was checked in a scholarly publication. It does not claim possession of the archive's separate accession record, object passport, reverse sides or conservation file.

## Yesenin corpus

### Chronicle, volume 2 — complete

Title: `Летопись жизни и творчества С. А. Есенина. В пяти томах. Том второй. 1917–1920` (IMLI RAN, Moscow, 2005).

- format: DJVU;
- exact bytes: `76,767,715`;
- SHA-256: `8d71e2082e9ce8dcf49a8fde93e4f13170b322a4ccc1943a857dee4f7ea1fc85`;
- physical pages: `765`;
- printed extent: `760` pages;
- extracted text layer: `2,401,563` bytes;
- checked: cover, portraits, series title, volume title, verso, contents, appendix, indexes and colophon.

Contents verified:

- preface — p. 5;
- 1917 — p. 19;
- 1918 — p. 81;
- 1919 — p. 199;
- 1920 — p. 325;
- appendix contents — p. 449;
- Tsarskoye Selo — p. 461;
- Petrograd — p. 479;
- Moscow — p. 541;
- abbreviations — p. 733;
- works index — p. 739;
- names index — p. 742.

Status: `PAGE-VERIFIED / COMPLETE-DJVU`.

### Chronicle, volume 3, book 2 — complete

- source: official IMLI PDF;
- PDF pages: `583`;
- printed extent: `575` pages;
- checked: title, publication data, contents, appendix and final publication leaf.

Status: `PAGE-VERIFIED`.

### Chronicle, volume 4 — complete

- source: official IMLI PDF;
- exact bytes: `93,293,497`;
- PDF pages: `744`;
- printed extent: `736` pages;
- structural note: linearization warnings, with the content and pages readable;
- checked: title, contents, appendix and final publication leaf.

Status: `PAGE-VERIFIED / CONTENT-READABLE`.

### Chronicle, volume 5, book 1 — complete

- exact bytes: `47,981,380`;
- PDF pages: `836`;
- printed extent: `832` pages;
- checked: title, verso, appendix, contents and colophon.

Status: `PAGE-VERIFIED / MIRROR-COPY / TITLE-AND-COLLOPHON-CONFIRMED`.

### Chronicle, volume 5, book 2 — complete

Title: `Том 5. Книга 2. 24 декабря 1925 — середина 1926 г.` (IMLI RAN, Moscow, 2018).

- original bytes: `71,877,026`;
- SHA-256: `6479f16cf502f03d4588f5c7e7f83b5993195799e4548863a604c93e30a839bf`;
- normalized PDF pages: `1,165`;
- checked: title, verso, contents, final publication leaf and the section on the final days, death and funeral.

Target pages checked include printed pp. 32–33, 42–49 and 51–61.

Status: `PAGE-VERIFIED / COMPLETE-PUBLISHED-VOLUME`.

### Complete works, volume 6 — complete

- source: official IMLI PDF;
- exact bytes: `15,509,548`;
- PDF pages: `818`;
- printed extent: `816` pages;
- checked: title, volume structure, late letters and commentary.

The volume does not replace the separate medical history.

Status: `PAGE-VERIFIED`.

### Complete works, volume 7, book 2 — complete

- source: official IMLI PDF;
- exact bytes: `10,734,949`;
- PDF pages: `642`;
- printed extent: `640` pages;
- checked: protocols, Pegasus Stall accounts, marriage record, clinic certificate and posters.

Status: `PAGE-VERIFIED`.

### Death documentary collection, IMLI 2003 — complete

Title: `Смерть Сергея Есенина. Документы. Факты. Версии` (IMLI RAN, Moscow, 2003).

- original bytes: `18,733,577`;
- SHA-256: `43e6456d143acbb9a5804e524c7f80b5031e1bb28499b859c07b6db5c5ab9d2c`;
- PDF pages: `416`;
- ISBN: `5-9208-0176-X`;
- source type: image-only photographic PDF;
- repair note: the final service object was truncated; qpdf rewrote the structure and the normalized file passed `qpdf --check` without syntax or stream-encoding errors.

Checked:

- cover, title, verso, editorial preface and contents on printed pp. 409–414;
- expert materials on printed pp. 53, 68, 79, 83, 88, 92, 96, 102, 134, 155 and 162;
- published facsimiles of the initial inquiry beginning at printed p. 368, including the range around p. 376;
- the three-page autopsy act by A. G. Gilarevsky on printed pp. 392–394.

Workflow evidence:

- workflow: `Source acquisition 49 Yesenin death volume`;
- successful run: `30084164469`;
- verification artifact digest: `sha256:223ef297e5ccb6745248dfcbcf904b1f4f205e2a1021d46172da265380c9fa65`.

Statuses:

- volume: `PAGE-VERIFIED / COMPLETE-PUBLISHED-VOLUME`;
- expert reports: `PAGE-VERIFIED-IN-PUBLISHED-VOLUME`;
- initial inquiry: `PUBLISHED-FACSIMILES-PAGE-VERIFIED`;
- autopsy act: `PUBLISHED-FACSIMILE-PAGE-VERIFIED`.

### Yesenin claim boundary retained

The publications preserve witness reports that the final poem was written in blood. They do not provide a verified laboratory attribution of the blood to Yesenin. Public text must retain that distinction.

### Yesenin archive-only remainder

Still unresolved:

- IMLI, fond 32, opis 2, unit 37: the medical history from the First Moscow State University clinic;
- the certificate no. 1037 dated 28 November 1925 is a separate document and does not replace the medical chart, diagnoses, regime, permissions to leave or discharge/departure papers.

## Mayakovsky corpus

### Investigative documentary volume, 2005 — complete

Title: `В том, что умираю, не вините никого?.. Следственное дело В. В. Маяковского. Документы. Воспоминания современников` (Ellis Lak 2000, Moscow, 2005).

- exact bytes: `49,498,997`;
- SHA-256: `771ff33635afb489383dfc96c02aa3518fad1d694bb8d9780d258e5853eeed02`;
- PDF pages: `676`;
- ISBN: `5-902152-14-3`;
- encrypted: no;
- qpdf: no syntax or stream-encoding errors.

Checked:

- cover, title, verso and opening editorial material;
- the facsimile block for case no. 50;
- the initial case no. 02-29;
- scene-inspection and witness-interview protocols;
- Polonskaya materials as published in this volume;
- the final letter, medical, handwriting and ballistic materials;
- scanned contents on PDF pages 668–671;
- museum object descriptions and the document-number concordance.

The volume records the transfer of case no. 50 from the Archive of the President of the Russian Federation to the State Mayakovsky Museum on 14 April 1995 and museum accessions `КП ГММ № 32589–32619`.

Status: `PAGE-VERIFIED / COMPLETE-PUBLISHED-VOLUME / FACSIMILE-BLOCK-VERIFIED`.

### `Про это`, 1923 — complete official SHPL copy

Official source: State Public Historical Library Docview for the original 1923 edition.

The earlier secondary viewer exposed only 48 scans and six internal photomontages. The official SHPL `initDocview` payload exposed 70 physical page IDs, contiguous from `391489` through `391558`.

The official viewer formula was verified from its own script:

`/pages/{pageId}/zooms/{zoom}`

High-resolution acquisition:

- physical scans: `70 of 70`;
- selected zoom: `8` for every page;
- dimensions: `1966 × 2897` or `1966 × 2900` pixels;
- total bytes: `17,324,472`;
- missing pages: `0`;
- each scan has its own SHA-256 in the preserved manifest.

The printed Rodchenko cover is physical scan 5. The eight internal photomontage leaves are:

1. physical scan 15 — page ID `391503`;
2. physical scan 21 — page ID `391509`;
3. physical scan 27 — page ID `391515`;
4. physical scan 37 — page ID `391525`;
5. physical scan 45 — page ID `391533`;
6. physical scan 53 — page ID `391541`;
7. physical scan 59 — page ID `391547`;
8. physical scan 63 — page ID `391551`.

Checked:

- protective manuscript cover;
- printed Rodchenko cover;
- title and publication data;
- design credit;
- heading and dedication `Ей и мне`;
- complete printed text through page 43;
- all eight internal photomontages;
- final service leaves and back cover.

Workflow evidence:

- static resolver run: `30086394251`;
- high-resolution run: `30086650390`;
- high-resolution page-scan artifact digest: `sha256:5b226be7d87d2086247872d551c6ba0ce8d4645b0a2e7f51ed0725c40673be29`;
- high-resolution verification digest: `sha256:c234282525cdd42e24dc843af136a65b672a442b3e4ec8bf9c75114ccd1e53ae`;
- static topology digest: `sha256:d2058b7f27dc2e56461040d7f851a6815c31ab7089927e7be4c64c1c76ba0128`.

Status: `PAGE-VERIFIED / COMPLETE-OFFICIAL-SHPL-DOCVIEW / 70-OF-70-HIRES-SCANS / 8-OF-8-INTERNAL-PHOTOMONTAGES`.

### Documentary-material description, issue 3 — catalogue boundary established

RSL record: `01006741660`.

The record describes issue 3 rather than an open digital copy of the whole three-issue series:

- year: 2013;
- extent: 286 pages and 12 leaves of colour illustrations, portraits and facsimiles;
- ISBN: `978-5-8243-1838-8`;
- open services exposed by the record: MARC21 download and a paid fragment-copy request;
- no public fulltext/viewer endpoint was exposed by the record page.

Discovery artifact digest: `sha256:92e3a9af3a2ed2123307370216a1e3855e72ed843b9f3676f4ec0959dacbd24e`.

Status: `CATALOGUE-VERIFIED / FULL-SCAN-NOT-ACQUIRED`.

### Mayakovsky archive-only and HOLD remainder

Still unresolved:

- complete physical witnesses of Veronika Polonskaya's two manuscript notebooks, museum typescript and separately annotated 78-leaf typescript;
- the 1929 passport/visa file: remain `HOLD`; currency-transfer paperwork and oral recollection do not prove a written visa refusal;
- Yakovleva autograph letters, excised passages, envelopes and a complete loss ledger;
- complete object passport for Lilya Brik's 24 November 1935 letter to Stalin and the physical resolution sheet;
- original source PDFs for the frozen Yungfeldt / LN-65 / PSS-13 collation;
- complete scans and indexes for the documentary-material descriptions, issues 1–3;
- museum object passport, accession record and dimensions for the final letter `Всем`;
- the full `20 лет работы` catalogue, accounts, photographs and newspaper pages.

## Public-claim boundaries retained

The following remain disallowed as unqualified facts:

- a proven written 1929 visa refusal without the passport/visa document;
- the myth that nobody attended the `20 лет работы` opening;
- conflating Polonskaya's distinct manuscript and typescript witnesses;
- claiming laboratory proof that blood on Yesenin's final poem belonged to him;
- claims about clinic regime, exits or discharge not supported by the medical history.

## Temporary workflow policy

The acquisition workflows were investigation scaffolding, not product runtime. Once their outputs, hashes, page topology and evidentiary limits were transferred into issue #49 and this ledger, completed heavy-download workflows were removed from the branch to prevent repeated 40–200 MB downloads on unrelated research commits.

Future retrieval work should use a narrowly path-filtered workflow, preserve a compact manifest and copy durable results into this ledger before removing the temporary workflow.