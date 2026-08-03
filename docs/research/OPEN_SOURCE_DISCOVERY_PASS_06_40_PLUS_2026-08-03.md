# Open-source discovery pass 06 — Russian classicism, Pushkin's circle and nineteenth-century lyric

**Date:** 3 August 2026  
**Lane:** `editorial/longform-marathon-2026-08` / PR #271  
**Registry pass:** `OSR-2026-08-03-P06`  
**Status:** `40+ WEB QUERIES / 45 ROWS APPENDED / 241 TOTAL SOURCES / 0 BINARY UPLOADS`

## 1. Scope

This pass extends the permanent link-first research base across the formation of Russian syllabo-tonic verse, eighteenth-century classicism, the Pushkin-era literary network and nineteenth-century lyric poetry. Controlled source paths were added for:

- Mikhail Lomonosov;
- Alexander Sumarokov;
- Vasily Trediakovsky;
- Nikolay Karamzin;
- Ivan Krylov;
- Pyotr Vyazemsky;
- Denis Davydov;
- Nikolay Yazykov;
- Alexey Koltsov;
- Ivan Nikitin.

The source set combines public scholarly corpora, early author collections, book monuments, historical complete works, criticism, memoir prose and official museum material.

## 2. Registry mutation

The native Google Sheet `THE LEGENDARY POET — OPEN RESEARCH SOURCE REGISTRY` was updated in place.

```yaml
previous_rows: 196
new_rows: 45
current_rows: 241
current_priority_A: 188
current_link_or_download_selective: 198
current_download_queue_or_binary_pending: 40
tracked_dashboard_scopes: 56
new_source_ids: OSR-0197..OSR-0241
```

Updated together:

- `SOURCE REGISTRY`;
- `ARTICLE MAP`;
- `DASHBOARD`;
- `PASS LOG`.

Ten new article maps were added. The dashboard source ranges were extended to row 242 and its workflow note was moved below the expanded 56-scope list.

## 3. Main unique gains

### Lomonosov

The new chain moves from the FEB scholarly portal and works corpus to the academic complete works, the author-shaped 1751 collection and an 1840 historical volume. This supports separate work on poetry, rhetoric, science, philology and textual history rather than treating Lomonosov only as a biographical figure.

### Sumarokov

The registry now includes the RVB corpus, a named scholarly introduction, the ten-part 1781–1782 complete works and exact book-monument records for parts 1 and 3. The latter contain psalm paraphrases, odes, epistles, the programmatic instruction for writers and the principal tragedies.

### Trediakovsky

The public RVB corpus and full selected-works table of contents are connected to the 1735 treatise *A New and Brief Method for Composing Russian Verse* and a FEB history chapter. This forms a controlled source sequence for articles on verse reform, terminology, love lyric, ode and theological-philosophical poetry.

### Karamzin and Krylov

Karamzin gained a complete poetry corpus, verse-form index, the 1814 poetry volume and an early documentary biography by Pogodin. Krylov gained the RVB complete corpus, the 1825 seven-book fable edition, a volume covering drama and *Spirit Mail*, and an academic literary-history layer.

### Vyazemsky and Denis Davydov

Vyazemsky is represented through the RVB portal, twelve-volume historical works, poetry, criticism from 1810–1827 and the *Old Notebook*. Davydov is represented through poetry, the 1832 lifetime collection, historical works and military memoir material connected with 1812 and partisan warfare.

### Yazykov, Koltsov and Nikitin

- Yazykov: 1833 poetry collection, publication of previously unpublished Yazykov/Zhukovsky poems and an institutional lecture for initial biographical navigation.
- Koltsov: the 1846 poetry edition, the 1901 poems-and-letters edition, an 1884 critical-biographical study and the official Voronezh museum exposition.
- Nikitin: complete works edited by Mikhail Gershenzon in 1912, an alternative 1914 edition and a historical reference article whose 1930s ideological frame is explicitly marked.

## 4. Bounded Drive comparison

Exact-title Drive searches were run for the principal candidates, including:

- Lomonosov's 1751 collection;
- Sumarokov's complete works;
- Trediakovsky's verse treatise;
- Karamzin's 1814 poetry volume;
- Krylov's 1825 fables;
- Vyazemsky's complete works;
- Davydov's 1832 poems;
- Yazykov's 1833 poems;
- Koltsov's 1846 poems;
- Nikitin's 1912 complete works.

No project-relevant exact binary match was returned. One Vyazemsky query surfaced an unrelated saved HTML conversation file; it was rejected as noise. The comparison remains bounded to searchable Drive metadata and indexed content. Opaque archives were not silently counted as searched.

## 5. Acquisition decisions

This pass added:

```yaml
link_registered: 27
download_selective: 8
download_queue: 10
binary_pending: 0
binary_uploaded: 0
```

Eighteen primary or historical editions are therefore marked for selective acquisition or technical inspection, but no file was promoted merely because a catalogue exposed a viewer or PDF route.

Highest-value new candidates include:

1. `OSR-0206` — Sumarokov complete works, part 1, 1781.
2. `OSR-0207` — Sumarokov complete works, part 3, tragedies, 1781.
3. `OSR-0215` — Karamzin, works volume 1, poetry, 1814.
4. `OSR-0219` — Krylov, fables in seven books, 1825.
5. `OSR-0229` — Denis Davydov, poems, 1832.
6. `OSR-0232` — Yazykov, poems, 1833.
7. `OSR-0235` — Koltsov, poems, 1846.
8. `OSR-0236` — Koltsov, poems and letters, 1901.
9. `OSR-0239` — Nikitin complete works edited by Gershenzon, 1912.

Nikitin's 1912 and 1914 complete works are not to be mirrored automatically as two equivalent large binaries. They must first be compared for editorial apparatus, contents and unique research value.

## 6. Article maps

New controlled source sequences were created for:

- Lomonosov: poetry, science and classicism;
- Sumarokov: theatre, ode and literary program;
- Trediakovsky: verse reform and poetics;
- Karamzin: poetry, sentimentalism and edition history;
- Krylov: fables, drama and satire;
- Vyazemsky: poetry, criticism and the Pushkin circle;
- Denis Davydov: poetry, 1812 and military memoirs;
- Yazykov: romanticism and the Pushkin constellation;
- Koltsov: poetry, letters and Voronezh context;
- Nikitin: poetry, manuscripts and editorial history.

The research order remains: primary text or archive object first, textual and scholarly apparatus second, institutional overview only for navigation.

## 7. Query coverage

The pass used more than forty distinct searches across FEB, RVB, the National Electronic Library, the RSL and Culture.RF. Query families covered author portals, complete works, individual volumes, early collections, scholarly chapters, verse indexes, letters, memoirs, criticism and official museum records.

Search breadth is discovery evidence, not an upload quota.

## 8. Next executable actions

1. Inspect the nine highest-priority historical editions at title-page and page-count level.
2. Obtain real PDF bytes only through supported institutional routes.
3. Classify text layers and produce SHA-256 values.
4. Compare Nikitin 1912 versus 1914 before choosing a Drive master.
5. Run bibliographic and exact-byte dedupe against visible canonical batches.
6. Upload only accepted binaries and record actual Drive IDs in the registry and rights manifest.
7. Continue the next 40+ discovery pass from `OSR-0242` without renumbering or replacing existing evidence.
