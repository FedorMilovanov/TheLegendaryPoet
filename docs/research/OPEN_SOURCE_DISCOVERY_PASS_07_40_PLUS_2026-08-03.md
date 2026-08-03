# Open-source discovery pass 07 — Shakespeare and the first world-literature canon

**Date:** 3 August 2026  
**Lane:** `editorial/longform-marathon-2026-08` / PR #271  
**Registry pass:** `OSR-2026-08-03-P07`  
**Status:** `40+ WEB QUERIES / 45 ROWS APPENDED / 286 TOTAL SOURCES / 0 BINARY UPLOADS`

## 1. Scope

This is the first major world-literature expansion of the permanent link-first research base. Controlled source paths were added for:

- William Shakespeare;
- Homer;
- Dante Alighieri;
- Johann Wolfgang von Goethe;
- Miguel de Cervantes;
- John Milton;
- Geoffrey Chaucer;
- Molière;
- Victor Hugo;
- Charles Baudelaire.

The pass prioritizes scholarly full-text corpora, manuscript and early-print projects, documentary biographies, commentary databases, parallel-language editions, institutional archives and selected public-domain primary texts.

## 2. Registry mutation

The native Google Sheet `THE LEGENDARY POET — OPEN RESEARCH SOURCE REGISTRY` was updated in place.

```yaml
previous_rows: 241
new_rows: 45
current_rows: 286
current_priority_A: 230
current_link_or_download_selective: 236
current_download_queue_or_binary_pending: 45
tracked_dashboard_scopes: 66
new_source_ids: OSR-0242..OSR-0286
```

Updated together:

- `SOURCE REGISTRY`;
- `ARTICLE MAP`;
- `DASHBOARD`;
- `PASS LOG`.

Ten new article maps were added. Source IDs remain monotonic and no earlier evidence was replaced or renumbered.

## 3. Main unique gains

### Shakespeare

The registry now connects:

- Folger Shakespeare Library full texts;
- Folger downloadable PDF, DOC, HTML, TXT, XML and TEI materials under stated noncommercial conditions;
- `Shakespeare Documented`, a documentary corpus for biography, signatures, legal records, early references and first editions;
- Internet Shakespeare Editions for peer-reviewed editions, old-spelling texts and facsimiles;
- Folger manuscript and early-print collection guides.

This separates the modern reading text, textual variants, documentary biography and book-history evidence.

### Homer

The new Homer path begins with the Homer Multitext project, its methodology and open datasets, then connects the *Iliad* and *Odyssey* in the Scaife/Perseus environment. The registry records the need to cite the exact manuscript, edition, line and CTS URN rather than treating the epics as a single stable modern text.

### Dante

The Princeton Dante Project provides the *Commedia*, minor works, translations, audio and maps. The Dartmouth Dante Project adds a searchable commentary tradition spanning medieval to modern scholarship, while Dante Lab supports side-by-side comparison. Princeton's reproduction restrictions and Dartmouth's commentary-level copyright notices are stored as handling rules.

### Goethe and Cervantes

For Goethe, the source chain combines the Goethe- und Schiller-Archiv, its research databases and German public-domain texts of both parts of *Faust*.

For Cervantes, the registry combines the Instituto Cervantes scholarly *Don Quijote*, the BNE first-edition facsimile project, a historical Schevill–Bonilla edition and public-domain Spanish and English texts.

### Milton and Chaucer

Milton gained a rare-book history of seventeenth-century printings plus separate ten-book and twelve-book forms of *Paradise Lost* and *Paradise Regained*. These editions must remain textologically distinct.

Chaucer gained the Harvard research portal, glossed Middle English texts, line-by-line translations, documentary biography, a language guide and the Canterbury Tales manuscript project.

### Molière, Victor Hugo and Baudelaire

Gallica/BnF now supplies controlled institutional entry points for Molière's works and *Dom Juan*, Victor Hugo's manuscripts and poetry editions, and Baudelaire's 1857 *Les Fleurs du mal* together with an edition-history map. Exact Gallica object records must be selected before any file acquisition.

## 4. Bounded Drive comparison

Exact-title/name searches were run for Shakespeare/Folger, Homer, Dante, Goethe/*Faust*, Cervantes/*Don Quixote*, Milton/*Paradise Lost*, Chaucer/*Canterbury Tales*, Molière, Victor Hugo and Baudelaire.

No project-relevant exact binary match was returned in searchable Drive metadata or indexed content. Unrelated Isadora Duncan, Baptist-history, Russian-anthology and *Apollon* files surfaced as false positives and were rejected as noise. Opaque archives and unindexed binary contents were not silently counted as searched.

## 5. Rights and acquisition boundary

The pass distinguishes public reading from lawful mirroring:

- Folger downloadable texts carry stated noncommercial conditions and are not treated as unrestricted public-domain files.
- Princeton and Dartmouth Dante resources remain link-first where modern text, translation or commentary rights apply.
- Project Gutenberg items are treated as public-domain candidates under its United States basis; jurisdiction and exact edition metadata still require verification.
- Gallica/BnF files require item-level rights metadata and exact-object selection.
- Digital manuscript datasets require release/version identifiers and retained license documentation.

No binary was promoted in this pass. Every future upload must pass:

```text
stable item URL → lawful access → real file MIME → title/edition identity → page or file completeness →
text-layer classification → rights note → bibliographic and SHA dedupe → SHA-256 → real Drive ID
```

## 6. New acquisition candidates

Seven new core primary texts entered `DOWNLOAD-QUEUE`:

1. `OSR-0262` — Goethe, *Faust I*, German text.
2. `OSR-0263` — Goethe, *Faust II*, German text.
3. `OSR-0269` — Cervantes, *Don Quijote*, Spanish text.
4. `OSR-0272` — Milton, *Paradise Lost*, twelve-book form.
5. `OSR-0273` — Milton, *Paradise Lost*, ten-book form.
6. `OSR-0274` — Milton, *Paradise Regained*.
7. `OSR-0285` — Baudelaire, first edition of *Les Fleurs du mal*, 1857.

Large scholarly corpora and manuscript datasets remain `DOWNLOAD-SELECTIVE`: acquire only the exact release, volume, edition or work required for a named article.

## 7. Article maps

New controlled source sequences were created for:

- Shakespeare: plays, sonnets, documents and the First Folio;
- Homer: the *Iliad*, *Odyssey* and multiform manuscript tradition;
- Dante: the *Commedia*, minor works and seven centuries of commentary;
- Goethe: *Faust*, manuscripts and correspondence;
- Cervantes: *Don Quijote*, first editions and world reception;
- Milton: *Paradise Lost*, revisions and biblical epic;
- Chaucer: the *Canterbury Tales*, Middle English and manuscript transmission;
- Molière: plays, collected works and performance history;
- Victor Hugo: poetry, manuscripts and first editions;
- Baudelaire: *Les Fleurs du mal*, edition history and Symbolism.

The working order remains primary text or document first, textual apparatus second, scholarly interpretation third, general overview only for navigation.

## 8. Next executable actions

1. Acquire and inspect the seven public-domain or early-edition candidates.
2. Preserve separate edition identity for *Paradise Lost* 1667 and 1674.
3. Record Project Gutenberg release metadata and jurisdiction notes.
4. Resolve the exact Gallica object for Baudelaire 1857 before downloading bytes.
5. Run bibliographic and SHA dedupe against visible canonical batches.
6. Upload only accepted files and record actual Drive IDs in the rights/manifest area.
7. Continue world literature from `OSR-0287`, prioritizing Schiller, Byron, Shelley, Keats, Wordsworth, Poe, Whitman, Rilke, Lorca, Neruda, Tagore and major non-European poetic traditions.