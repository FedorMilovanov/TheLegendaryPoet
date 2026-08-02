# Yesenin in `Мирок`, 1914 — source gate pass 01

**Date:** 2 August 2026  
**Status:** `6-WITNESS MAP COMPLETE / 2 ACQUIRED BY PRIOR WORK / 4 EXACT ISSUE OBJECTS UNRESOLVED`  
**Related:** issue #191  
**Public route:** do not create

## 1. Scope

The future article must be based on six exact periodical witnesses, not on later poem webpages or general catalogue claims.

| Order | Work | `Мирок` witness | Printed page(s) | Current physical status |
|---:|---|---|---:|---|
| 1 | `Береза` | book 1, January 1914 | 10 | unresolved exact issue bytes |
| 2 | `Пороша` | book 2, February 1914 | 46 | prior project work says acquired and visually inspected |
| 3 | `Село` (free translation from Shevchenko) | book 3, March 1914 | 85 | unresolved exact issue bytes |
| 4 | `Пасхальный благовест` | book 4, April 1914 | 124 | prior project work says acquired and visually inspected |
| 5 | `С добрым утром!` | book 7, July 1914 | 219 | unresolved exact issue bytes |
| 6 | `Сиротка` | book 12, December 1914 | 364–368 | unresolved exact issue bytes |

Existing issue #191 remains authoritative for the two accepted acquisitions. Current Drive title search did not surface them, so their exact Drive/artifact IDs must be recovered before any duplicate upload.

## 2. Academic bibliographic anchors

### `Береза`

Academic comments:

- `Мирок`, Moscow, 1914, book 1, January, page 10;
- signature: `Аристон`;
- printed from an authorised clipping later included in the planned `Зарянка` collection;
- autograph unknown;
- dated to 1913 allowing for editorial preparation and publication time.

Sources:

- `https://rvb.ru/20vek/esenin/pss7/vol4/notes/243.html`;
- `https://feb-web.ru/feb/esenin/texts/e74/e74-323-.htm?cmd=p`.

The academic Chronicle's illustration register also identifies the cover of `Мирок` no. 1 and the page with `Береза` as a documentary object.

- `https://feb-web.ru/feb/esenin/chronics/el1/el1-411-.htm?cmd=2`

### `Пороша`

Academic location:

- `Мирок`, 1914, book 2, February, page 46.

The project already reports this issue as acquired/visually inspected. Before reuse, recover:

- exact item URL/object ID;
- local/Drive path;
- SHA-256;
- actual PDF page corresponding to printed page 46;
- reproduction-rights status.

### `Село`

Academic comments:

- `Мирок`, 1914, book 3, March, page 85;
- first publication is the controlling text;
- autograph unknown;
- free translation of an extract from Taras Shevchenko's `Княжна`.

Source:

- `https://rvb.ru/20vek/esenin/pss7/vol4/notes/254.html`.

The article must not describe this item merely as an original village lyric without explaining the Shevchenko source and translation/adaptation boundary.

### `Пасхальный благовест`

Academic location retained from the accepted project inventory:

- `Мирок`, 1914, book 4, April, printed page 124.

The project already reports this issue as acquired/visually inspected. Exact object/path/SHA and rights must be recovered before article use.

### `С добрым утром!`

Academic location:

- `Мирок`, 1914, book 7, July, page 219;
- printed from an authorised journal clipping in the `Зарянка` materials;
- autograph unknown;
- dated by first publication.

Supporting academic chronology:

- `https://feb-web.ru/feb/esenin/el-abc/el1/el1-1831.htm?cmd=p&istext=1`.

### `Сиротка`

Academic location:

- `Мирок`, 1914, book 12, December, pages 364–368.

A text webpage or later edition is not a facsimile witness for five printed pages. The complete issue or an institutional page set tied to the exact issue is required.

## 3. Critical terminology

### Safe formula

> `Береза`, published under the pseudonym `Аристон` in the January 1914 book of `Мирок`, is the first known publication of Yesenin.

### Avoid overclaiming

> `Береза` was unquestionably the first text ever printed by Yesenin.

The academic and museum chronology supports `first known publication`; the modifier protects against confusing current documentary knowledge with metaphysical certainty about every lost provincial or ephemeral print.

## 4. The pseudonym boundary

The January witness must verify visually:

- exact printed title;
- exact signature `Аристон`;
- page number 10;
- issue title/date/number;
- whether table of contents, running header or editorial page adds attribution.

Do not infer the pseudonym's meaning from late popular anecdote without source mapping. The page proves use of the name; it does not prove every later explanation of why it was chosen.

## 5. Catalogue-search failure mode

Broad NЭБ queries such as `1914, № 7`, `кн. 12` or `Мирок` return many unrelated periodicals and books. A numerically matching issue is not evidence.

An accepted issue object must match all of:

```yaml
periodical_title: Мирок
place: Москва
publication_year: 1914
book_number: exact 1 | 2 | 3 | 4 | 7 | 12
printed_page: contains the named Yesenin work
repository_item: stable institutional record
binary: real PDF or institutional page images
```

No catalogue arithmetic, guessed neighbouring object IDs or filename resemblance is permitted.

## 6. Drive and duplicate boundary

Current Drive keyword searches for `Мирок 1914 Есенин` and exact poem/title combinations returned no results, despite issue #191 recording two accepted files.

Possible explanations:

- files live in an audit artifact rather than the main source library;
- filenames do not contain the periodical title or poem;
- the files are in an inaccessible/unindexed nested package;
- earlier acquisition evidence exists only as workflow artifacts.

Before any new upload:

1. recover prior artifact/run records;
2. compare exact bytes and SHA;
3. materialise accepted files into the canonical source library only if they are not already present;
4. do not create parallel copies to compensate for poor search indexing.

## 7. Six-witness comparison plan

For every issue, record:

```yaml
issue_id:
repository:
item_url:
direct_pdf_url:
sha256:
file_size_bytes:
pdf_page:
printed_page:
work_title:
printed_signature:
text_layer:
first_page_verified:
poem_page_rendered:
rights_status:
caption:
```

Then perform:

- line-level comparison with PSS;
- spelling/punctuation comparison;
- verification of authorisation source used by PSS;
- comparison of `Мирок` typography and child/family-journal context;
- distinction between first publication, authorised clipping, autograph and later canonical text.

## 8. Article architecture

1. Moscow, Sytin's printing environment and the young writer.
2. What `Мирок` was: audience, format and editorial context.
3. January: `Береза`, page 10 and `Аристон`.
4. February–April: `Пороша`, `Село`, `Пасхальный благовест`.
5. July: `С добрым утром!` and the growing publication sequence.
6. December: the longer narrative `Сиротка`.
7. The planned `Зарянка` collection and authorised clippings.
8. Variants, missing autographs and what first publication proves.
9. The later construction of the “village poet” image.

## 9. Myth candidates

### `Береза` was printed with Yesenin's full name

```yaml
verdict: false
answer: the first witness is signed Аристон
```

### Every `Мирок` text survives in autograph

```yaml
verdict: false
answer: academic comments explicitly identify unknown autographs for several works
```

### The six magazine pages alone prove the full story of Yesenin's poetic development

```yaml
verdict: false / reductive
answer: they prove a publication sequence; manuscripts, letters, editorial contacts and the planned collection supply the wider history
```

### A later webpage is equivalent to the first periodical witness

```yaml
verdict: false
answer: a transcription cannot prove typography, signature, page context, issue identity or all variants
```

## 10. Acquisition queue

1. recover exact accepted objects for books 2 and 4;
2. acquire complete book 1 and verify page 10;
3. acquire complete book 3 and verify page 85;
4. acquire complete book 7 and verify page 219;
5. acquire complete book 12 and verify pages 364–368;
6. pin all six SHA-256 values and item URLs;
7. clear item/page reproduction rights;
8. only then create the full line-level collation and article outline.

## 11. Publication gate

- [x] six required works/issues/pages mapped;
- [x] pseudonym and first-known-publication wording fixed;
- [x] catalogue arithmetic forbidden;
- [x] existing 2/6 acquisition claim preserved without pretending Drive search found the files;
- [ ] recover exact storage IDs and SHA for books 2 and 4;
- [ ] acquire books 1, 3, 7 and 12;
- [ ] visually inspect all six poem pages;
- [ ] complete line-level PSS collation;
- [ ] complete rights/visual matrix;
- [ ] do not create a public route until all six witnesses and QA gates close.
