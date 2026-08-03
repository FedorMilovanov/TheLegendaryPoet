# Open-source discovery pass 03 — 40+ multilingual expansion

**Date:** 3 August 2026  
**Lane:** `editorial/longform-marathon-2026-08` / PR #271  
**Registry pass:** `OSR-2026-08-03-P03`  
**Status:** `44+ WEB QUERIES / 45 ROWS APPENDED / 106 TOTAL SOURCES / 0 BINARY UPLOADS`

## 1. Scope

This pass extends the research base beyond Pushkin, Blok, Yesenin and Mayakovsky. It adds controlled entry points for:

- Anna Akhmatova;
- Boris Pasternak and the Pasternak family archive;
- Osip Mandelstam;
- Marina Tsvetaeva;
- Nikolai Gumilev;
- Afanasy Fet;
- Ivan Bunin;
- Velimir Khlebnikov;
- Nikolai Nekrasov;
- Vasily Zhukovsky;
- Konstantin Batyushkov;
- Nikolai Zabolotsky;
- Igor Severyanin as a duplicate-control case.

Languages represented in the accepted rows: Russian, English, Spanish and Italian.

## 2. Registry mutation

The native Google Sheet `THE LEGENDARY POET — OPEN RESEARCH SOURCE REGISTRY` was updated in place.

```yaml
previous_rows: 61
new_rows: 45
current_rows: 106
current_priority_A: 81
current_link_or_selective_sources: 92
current_download_queue_or_binary_pending: 13
new_source_ids: OSR-0062..OSR-0106
```

The `DASHBOARD`, `ARTICLE MAP` and `PASS LOG` sheets were updated together. New article maps were added for Akhmatova, Pasternak, Mandelstam, Tsvetaeva, Gumilev, Fet, Bunin, Khlebnikov, Nekrasov, Zhukovsky/Batyushkov and Zabolotsky.

## 3. Main unique gains

### Akhmatova

- official Fontanny House museum portal;
- manuscript/document collection with about 4,000 units, including more than 100 Akhmatova poem autographs, prose, Pushkin studies, translations and variants of *Poem Without a Hero*;
- rare-book collection;
- UCL open doctoral thesis on feminine images and poetic authority;
- comparative open research on *Requiem* and Pushkin's *Bronze Horseman*.

### Pasternak

- Hoover/OAC finding aid for the Pasternak family papers, 1877–2013;
- Hoover Digital Collections object and collection search;
- RGALI catalogue entry for Pasternak-related archival units.

These are new archival navigation layers rather than another general biography.

### Mandelstam

- RVB author portal;
- four-volume collected works;
- volume 4 with letters, additions, chronology and indexes;
- Canadian thesis on the Hellenic legacy;
- Spanish doctoral research on translating Mandelstam.

### Tsvetaeva

- official museum collections and archive-research sections;
- museum publication catalogue;
- UCL open thesis on Tsvetaeva's Pushkin;
- RSL open-view three-part chronicle;
- Nottingham thesis on Psalms in Tsvetaeva's poetry;
- McGill thesis record.

### Gumilev and Fet

- Gumilev's *Kostyor* (1918) in the full RSL viewer;
- RSL ten-volume Gumilev collected works;
- dissertation on the motif structure of *Kostyor*;
- Fet's debut *Liricheskii panteon* (1840);
- Fet's 1912 complete poetry, volume 2.

### Bunin

- official IMLI scholarly project for a complete works-and-letters edition;
- indexes of literary and non-fiction texts;
- official open textological PDF on Bunin's poetry;
- official Nobel banquet speech.

### Khlebnikov

- RVB author portal;
- RSL early posthumous series *Neizdannyi Khlebnikov*, issues 11 and 12;
- 1940 collection edited by Nikolai Khardzhiev and T. Grits;
- Ca' Foscari open doctoral thesis on Khlebnikov's non-artistic prose.

### Additional nineteenth- and twentieth-century coverage

- Nekrasov RVB portal and fifteen-volume complete works and letters;
- Presidential Library early Nekrasov editions;
- FEB scholarly Zhukovsky portal;
- RVB Batyushkov portal;
- RSL scholarly *Stolbtsy* and the 1937 *Second Book* by Zabolotsky.

## 4. Duplicate and Drive comparison

Bounded exact-title Drive checks were run for:

- `Неизданный Хлебников выпуск 12`;
- `Костер Гумилев 1918`;
- `Лирический пантеон Фет 1840`;
- `Летопись жизни творчества Цветаевой`;
- `Мандельштам Собрание сочинений четырех томах`;
- `Pasternak family papers`.

No exact match was returned for these titles in the searchable Drive index.

One bibliographic duplicate was explicitly rejected:

- `OSR-0106` — Igor Severyanin, *Pineapples in Champagne*, RSL 1991 facsimile of the 1915 edition. The 1915 book is already present in `BATCH-0001`, so no second binary is permitted.

The result remains bounded: opaque ZIP archives were not silently expanded or rewritten.

## 5. Binary acquisition attempt

The highest-value small primary object in this pass was:

```yaml
source_id: OSR-0095
title: Неизданный Хлебников, вып. 12
publication: Moscow, 1929
extent: 20 leaves
repository: Russian State Library
access: full public viewer
catalogue_mime: application/pdf
exact_direct_pdf: identified
Drive_exact_match: none
```

The RSL catalogue exposes the exact PDF endpoint. The working container could not resolve `dlib.rsl.ru`; therefore no bytes were received, no first page was rendered, no page count or SHA-256 was computed and no Drive upload was claimed.

Status remains `BINARY-PENDING`. No HTML viewer page was renamed to PDF and no empty source batch was created.

## 6. New download queue

High-priority additions:

1. `OSR-0065` — UCL Akhmatova dissertation, 4 MB.
2. `OSR-0079` — UCL Tsvetaeva/Pushkin dissertation.
3. `OSR-0092` — official Bunin poetry textology PDF.
4. `OSR-0095` — *Neizdannyi Khlebnikov*, issue 12, exact RSL PDF, currently `BINARY-PENDING`.
5. `OSR-0097` — Ca' Foscari Khlebnikov dissertation.

Existing Yesenin, Lermontov, Bryusov and Harvard priorities remain active; new rows do not displace them automatically.

## 7. Query coverage

The pass used more than forty distinct searches across official museums, national libraries, university repositories, scholarly portals and archive finding aids. The query families were:

1. Akhmatova official museum and archive;
2. Akhmatova manuscript fund;
3. Akhmatova open doctoral research;
4. Akhmatova and *Requiem* research;
5. Pasternak official archive and museum;
6. Pasternak family papers finding aid;
7. Pasternak Hoover digital collection;
8. Pasternak RGALI catalogue;
9. Mandelstam RVB corpus;
10. Mandelstam four-volume works;
11. Mandelstam letters and indexes;
12. Mandelstam Hellenic legacy thesis;
13. Mandelstam translation thesis;
14. Tsvetaeva official museum collection;
15. Tsvetaeva archive publications;
16. Tsvetaeva museum editions;
17. Tsvetaeva and Pushkin thesis;
18. Tsvetaeva chronicle;
19. Tsvetaeva Psalms thesis;
20. Tsvetaeva McGill research;
21. Gumilev official/archive search;
22. Gumilev *Kostyor* first edition;
23. Gumilev complete works;
24. Gumilev *Kostyor* dissertation;
25. Fet FEB/RVB search;
26. Fet debut edition;
27. Fet complete poetry;
28. Bunin RVB/academic corpus;
29. Bunin complete-works project;
30. Bunin textology;
31. Bunin official Nobel sources;
32. Bryusov/Balmont/Severyanin comparative search;
33. Khlebnikov RVB corpus;
34. Khlebnikov open doctoral research;
35. Khlebnikov RSL early issues;
36. Nekrasov FEB/RVB corpus;
37. Nekrasov Presidential Library;
38. Zhukovsky FEB corpus;
39. Batyushkov RVB corpus;
40. Derzhavin/Russian eighteenth-century corpus search;
41. Zabolotsky scholarly editions;
42. Brodsky museum/archive search;
43. German-language reception searches for Akhmatova, Pasternak, Mandelstam and Tsvetaeva;
44. public-domain RSL searches for Gumilev, Fet, Severyanin and Khlebnikov.

Search breadth is discovery evidence, not an upload quota.

## 8. Next executable actions

1. Retry the five new downloadable objects through supported institutional file routes.
2. Verify MIME, title page, page count, text layer, rights and SHA-256.
3. Rerun exact-byte and bibliographic dedupe.
4. Upload only accepted binaries to the canonical source library and capture real Drive IDs.
5. Update the native Sheet row and Drive manifest in the same pass.
6. Continue the next 40+ discovery pass from `OSR-0107`, without renumbering or replacing the present evidence.
