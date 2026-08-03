# Open-source discovery pass 05 — nineteenth-century lyric, women poets and modern archives

**Date:** 3 August 2026  
**Lane:** `editorial/longform-marathon-2026-08` / PR #271  
**Registry pass:** `OSR-2026-08-03-P05`  
**Status:** `40+ WEB QUERIES / 45 ROWS APPENDED / 196 TOTAL SOURCES / 0 BINARY UPLOADS`

## 1. Scope

This pass expands the permanent link-first research base with primary editions, academic reference works, public text corpora, archive finding aids, official museums and authorial statements for:

- Apollon Maykov;
- Yakov Polonsky;
- Alexey Apukhtin;
- Semyon Nadson;
- Vladislav Khodasevich;
- Sofia Parnok;
- Mirra Lokhvitskaya;
- Cherubina de Gabriak;
- Joseph Brodsky;
- Alexander Tvardovsky;
- Bulat Okudzhava.

The pass adds a missing bridge between nineteenth-century lyric poetry, women poets of the Silver Age, émigré poetry, Soviet wartime poetry and modern museum/archive research.

## 2. Registry mutation

The native Google Sheet `THE LEGENDARY POET — OPEN RESEARCH SOURCE REGISTRY` was updated in place.

```yaml
previous_rows: 151
new_rows: 45
current_rows: 196
current_priority_A: 150
current_link_or_selective_sources: 163
current_download_queue_or_binary_pending: 30
tracked_dashboard_scopes: 46
new_source_ids: OSR-0152..OSR-0196
```

The following sheets were updated together:

- `SOURCE REGISTRY`;
- `ARTICLE MAP`;
- `DASHBOARD`;
- `PASS LOG`.

Eleven new article maps were added. Every source now has a stated research use rather than being stored as a bare bookmark.

## 3. Main unique gains

### Maykov and Polonsky

- Maykov's four-volume collected works and the 600-page first volume of the 1913 edition;
- Polonsky's five-volume complete poems and volume 1 of the 1896 edition;
- FEB/KLE biographical-reference entries;
- academic chapters from the institutional history of Russian literature.

These source chains combine primary editions with named scholarly interpretation.

### Apukhtin and Nadson

- an institutional NEB corpus for Apukhtin;
- an early collected-works volume with an exact PDF route but inconsistent catalogue dating, therefore requiring title-page verification;
- NEB thematic editions for social and prose contexts;
- Nadson's early and later editions plus a twentieth-century scholarly collected-poems record.

The registry preserves differences between a public digital introduction, an early printing, a mass-reception edition and a modern scholarly edition.

### Khodasevich and Parnok

- Khodasevich's two-volume poems, an émigré edition associated with Nina Berberova, the New Poet's Library edition and memoir prose;
- Parnok's collected poems, the first edition of *Roses of Pieria*, the *Almast* libretto and documentary research on Parnok and Tsvetaeva.

Modern editions remain link-only because reader access does not establish redistribution rights.

### Lokhvitskaya and Cherubina de Gabriak

- public text corpora with explicit source checking requirements;
- an 1899 Lokhvitskaya edition layer;
- exact poem pages for Cherubina de Gabriak suitable for claim-level article links.

This creates a controlled starting set for women poets of the Silver Age without treating user-edited corpora as final textual authorities.

### Brodsky

- the official `Poltory Komnaty` museum;
- the museum lecture archive;
- the official Nobel lecture, biography and banquet speech;
- a Library of Congress correspondence finding aid.

These sources separate authorial self-description, official biography, museum interpretation and archival navigation.

### Tvardovsky and Okudzhava

- Tvardovsky's RGALI fund and archive overview;
- archival materials connected with *Vasily Tyorkin*;
- the Tvardovsky museum-estate;
- the official Bulat Okudzhava memorial museum as the first controlled entry for a future source map.

## 4. Bounded Drive comparison

Exact-title or exact-name Drive searches were run for:

- Maykov complete works;
- Polonsky complete poems;
- Apukhtin works;
- Nadson poems;
- Parnok collected poems;
- Khodasevich collected poems;
- Joseph Brodsky;
- Tvardovsky and *Vasily Tyorkin*.

No project-relevant exact match was returned in the searchable Drive index. The result is explicitly bounded: opaque archives and unindexed binary contents were not silently treated as searched.

## 5. Binary acquisition boundary

Three exact old-edition PDF routes were registered:

1. `OSR-0153` — Maykov, complete works, volume 1, 1913;
2. `OSR-0157` — Polonsky, complete poems, volume 1, 1896;
3. `OSR-0161` — Apukhtin, works, volume 1; catalogue dating must be resolved from the title page.

No binary was promoted in this pass. Before any Drive upload each object must pass:

```text
stable item URL → lawful access → real PDF MIME → title page → page count →
text-layer classification → rights note → bibliographic and SHA dedupe → SHA-256 → real Drive ID
```

Modern Khodasevich, Parnok, Brodsky, Tvardovsky and Okudzhava materials remain link-only unless a separate item-level permission or public-domain basis is established.

## 6. New article maps

The `ARTICLE MAP` sheet now contains controlled source sequences for:

- Maykov;
- Polonsky;
- Apukhtin;
- Nadson;
- Khodasevich;
- Parnok and Tsvetaeva;
- Lokhvitskaya;
- Cherubina de Gabriak;
- Brodsky;
- Tvardovsky;
- Okudzhava.

The workflow remains: primary text or archive object first, scholarly interpretation second, public overview only as navigation.

## 7. Query coverage

More than forty distinct searches covered:

1. Maykov complete works and individual volumes;
2. Maykov FEB/KLE and academic history;
3. Polonsky complete poems and individual volumes;
4. Polonsky FEB/KLE and academic history;
5. Apukhtin NEB corpus and collected works;
6. Apukhtin thematic digital editions and criticism;
7. Nadson early editions, later editions and scholarly corpus;
8. Khodasevich collected poems, émigré editions and memoirs;
9. Parnok collected poems, first editions, libretto and documentary studies;
10. Lokhvitskaya public-domain corpora and historical editions;
11. Cherubina de Gabriak public texts and exact poem pages;
12. Brodsky official museum, lectures, Nobel materials and Library of Congress archive;
13. Tvardovsky RGALI fund, archive materials and official museum;
14. Okudzhava official museum;
15. bounded title/name dedupe searches in project Drive.

Search breadth is discovery evidence, not an upload quota.

## 8. Next executable actions

1. Technically acquire and inspect the three exact old-edition PDF candidates.
2. Resolve the Apukhtin title-page date before any manifest entry.
3. Run SHA and bibliographic dedupe against all visible canonical batches.
4. Upload only accepted objects and record real Drive IDs.
5. Expand Okudzhava with archive, bibliography and music-rights-safe sources.
6. Continue the next 40+ pass from `OSR-0197` without renumbering or replacing existing evidence.
