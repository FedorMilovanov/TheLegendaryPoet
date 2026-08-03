# Open-source discovery pass 04 — Symbolism, early editions and Derzhavin

**Date:** 3 August 2026  
**Lane:** `editorial/longform-marathon-2026-08` / PR #271  
**Registry pass:** `OSR-2026-08-03-P04`  
**Status:** `40+ WEB QUERIES / 45 ROWS APPENDED / 151 TOTAL SOURCES / 0 BINARY UPLOADS`

## 1. Scope

This pass extends the permanent link-first research base with primary editions, academic corpora, archive records and institutional collections for:

- Gavrila Derzhavin;
- Valery Bryusov;
- Konstantin Balmont;
- Igor Severyanin;
- Maximilian Voloshin;
- Nikolai Klyuev;
- Zinaida Gippius;
- Andrei Bely;
- Fyodor Sologub;
- Vyacheslav Ivanov;
- Dmitry Merezhkovsky.

English and German reception objects were added where they provide a distinct historical layer. The pass concentrated on Russian Symbolism, early printed books, author-shaped collected editions, archives and materials useful for future comparisons with Pushkin, Yesenin, Blok and Mayakovsky.

## 2. Registry mutation

The native Google Sheet `THE LEGENDARY POET — OPEN RESEARCH SOURCE REGISTRY` was updated in place.

```yaml
previous_rows: 106
new_rows: 45
current_rows: 151
current_priority_A: 117
current_link_or_selective_sources: 121
current_download_queue_or_binary_pending: 27
tracked_dashboard_scopes: 35
new_source_ids: OSR-0107..OSR-0151
```

The following sheets were updated together:

- `SOURCE REGISTRY`;
- `ARTICLE MAP`;
- `DASHBOARD`;
- `PASS LOG`.

The dashboard was also repaired: two old merged note ranges had swallowed several poet rows during earlier expansions. They were unmerged, all scope counters were restored, and the workflow note was moved below the complete 35-scope list.

## 3. Main unique gains

### Derzhavin

- 1795 authorial manuscript in the National Electronic Library;
- 1808 collected works, part 1;
- Yakov Grot's nine-volume annotated edition;
- volume 1 of the Grot edition, 1868;
- two public-domain English reception objects from Project Gutenberg.

This creates a source path from manuscript to early printing, nineteenth-century academic commentary and foreign reception.

### Bryusov

- seven-volume collected works and translations;
- early collected-works volume 1;
- volume 7 of articles on Pushkin;
- the late collection *Mea*;
- explicit duplicate control for *Urbi et Orbi*.

The exact 1903 *Urbi et Orbi* is already stored in Drive as file ID `1Kj9hZa0kHlgp_wF_lZeiB1556H1WBiqP`. The new NЭБ card is retained as bibliographic control only; a second binary is forbidden.

### Balmont and Severyanin

Balmont now has:

- the NЭБ institutional collection with 24 materials;
- *Будем как солнце*;
- *Горящие здания*;
- *Литургия красоты*;
- a German Wikisource reception layer.

Severyanin now has the 1914 first edition of *Громокипящий кубок* in the download queue. The 1915 *Ананасы в шампанском* is marked `DUPLICATE-SKIP` because the first edition is already represented in `BATCH-0001`.

### Voloshin

- *Стихотворения, 1900–1910*;
- *Anno mundi ardentis*;
- *Усобица*;
- *Лики творчества*;
- the RGALI archival fund;
- the official Voloshin house-museum entry.

Together these sources support separate article lines on Koktebel, World War I, the Revolution and Civil War, criticism, correspondence and visual provenance.

### Klyuev

- *Песнослов*;
- *Песнь солнценосца. Земля и железо*;
- *Сосен перезвон*.

The `ARTICLE MAP` now has a controlled Klyuev–Yesenin research sequence: Klyuev's primary books first, then the academic Yesenin corpus, correspondence and chronology. This prevents replacing textual comparison with general biographical claims.

### Gippius and Merezhkovsky

Gippius:

- collected poems, book 1, 1889–1903;
- collected poems, book 2, 1903–1909;
- *Последние стихи, 1914–1918*;
- *88 современных стихотворений*.

Merezhkovsky:

- collected poems, 1883–1910;
- *Символы: песни и поэмы*.

These form a controlled base for articles on Russian Symbolism, religious vocabulary, war, revolution and the difference between literary self-description and historical evidence.

### Andrei Bely, Sologub and Vyacheslav Ivanov

Andrei Bely:

- RVB scholarly portal;
- *Почему я стал символистом*;
- *Золото в лазури*;
- *Северная симфония*;
- *Кубок метелей*;
- official memorial-apartment entry.

Sologub:

- twelve-volume collected works;
- *Пламенный круг*;
- *Змеиные очи*;
- contemporary criticism by Yuly Aikhenvald.

Vyacheslav Ivanov:

- four-volume scholarly collected works at RVB;
- *Cor Ardens*.

## 4. Drive comparison and duplicate control

Exact-title Drive searches were performed for:

- Gippius, *Последние стихи, 1914–1918*;
- Bryusov, *Urbi et Orbi*, 1903;
- Balmont, *Будем как солнце*, 1903;
- Severyanin, *Громокипящий кубок*, 1914;
- Klyuev, *Песнослов*, 1919;
- Derzhavin/Grot, volume 1, 1868;
- Voloshin, *Стихотворения, 1900–1910*.

Results:

- one exact Drive duplicate: Bryusov, *Urbi et Orbi*;
- one existing batch duplicate: Severyanin, *Ананасы в шампанском*;
- no exact searchable Drive match for the other checked titles.

Search results remain bounded. Unindexed bytes inside opaque archives were not silently declared absent, duplicated or inspected.

## 5. Binary acquisition attempt

The highest-value compact object attempted in this pass was:

```yaml
source_id: OSR-0136
title: Последние стихи, 1914–1918
poet: Zinaida Gippius
publication_year: 1918
repository: National Electronic Library / Russian State Library
exact_catalogue_item: identified
exact_direct_pdf: identified
Drive_exact_match: none
```

The NЭБ item exposes a direct PDF route. The working environment could not resolve/download from the host. Therefore:

- no bytes were received;
- no title page was inspected;
- no page count or text-layer status was established;
- no SHA-256 was computed;
- no Drive upload was claimed.

Status remains `BINARY-PENDING`. No HTML viewer was renamed to PDF and no empty acquisition folder was created.

## 6. New high-priority download queue

Pass 04 adds these particularly useful exact objects:

1. `OSR-0108` — Derzhavin, collected works, part 1, 1808.
2. `OSR-0110` — Derzhavin/Grot, volume 1, 1868.
3. `OSR-0116` — Bryusov, articles on Pushkin, volume 7.
4. `OSR-0123` — Severyanin, *Громокипящий кубок*, 1914.
5. `OSR-0126` — Voloshin, *Anno mundi ardentis*.
6. `OSR-0127` — Voloshin, *Усобица*.
7. `OSR-0132` — Klyuev, *Песнь солнценосца. Земля и железо*.
8. `OSR-0133` — Klyuev, *Сосен перезвон*.
9. `OSR-0136` — Gippius, *Последние стихи*, currently `BINARY-PENDING`.
10. `OSR-0141` — Andrei Bely, *Северная симфония*.
11. `OSR-0145` — Sologub, *Пламенный круг*.
12. `OSR-0150` — Merezhkovsky, collected poems, 1883–1910.

Large objects such as Balmont's *Будем как солнце*, Klyuev's *Песнослов*, Bely's *Золото в лазури* and *Кубок метелей* remain `DOWNLOAD-SELECTIVE`: their size is not a rejection, but they are mirrored only when an active article requires sustained page work.

## 7. Query coverage

More than forty distinct searches were completed across NЭБ/RGB, RVB, FEB, RGALI, official museums, Project Gutenberg, German Wikisource and university repositories. Query families included:

1. Derzhavin manuscripts and early collected works;
2. the Grot academic edition;
3. Derzhavin English reception;
4. Bryusov collected works and Pushkin studies;
5. Bryusov first editions;
6. Balmont institutional collections and first editions;
7. Balmont German reception;
8. Severyanin first editions;
9. Voloshin poetry books;
10. Voloshin RGALI and museum records;
11. Klyuev first editions;
12. Klyuev–Yesenin comparative research;
13. Gippius collected poetry;
14. Gippius war and revolution poetry;
15. Merezhkovsky poetry books;
16. Andrei Bely RVB corpus;
17. Bely's symbolic self-description;
18. Bely's symphonies and first books;
19. Bely museum collections;
20. Sologub collected works and first editions;
21. Sologub contemporary criticism;
22. Vyacheslav Ivanov scholarly corpus;
23. *Cor Ardens*;
24. Symbolist comparative dissertations and foreign reception.

Search breadth is discovery evidence, not an upload quota.

## 8. Next executable actions

1. Retry the exact small and medium PDF objects through supported institutional routes.
2. Verify MIME, title page, page count, text layer, provenance, rights and SHA-256.
3. Run exact-byte and bibliographic dedupe against all Drive masters and manifests.
4. Upload only verified accepted files and record real Drive IDs.
5. Update source rows and manifests atomically.
6. Continue the next 40+ pass from `OSR-0152`, without renumbering or deleting prior evidence.
