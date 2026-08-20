# Benislavskaya longform — publication gate ledger

Date: 2026-08-20  
Owner issue: `#200 — Отдельная статья: Галина Бениславская — рукописи, издательские дела и архив Есенина`  
Current lane: `editorial/benislavskaya-publication-20260820`

## Disposition

**STAGED-DRAFT / SOURCE-GATED / HERO-CLOSED**

The article is written and remains intentionally outside the canonical public essay catalog until the inbound-correspondence matrix is reconciled from a lawful complete witness.

Until that source gate is closed, do not register the essay in:

- `src/data/essays/index.ts`;
- generated browser/search/catalog data;
- sitemap/feed discovery;
- public route or announcement surfaces.

## Owner-approved hero — CLOSED

The owner supplied the approved source PNG through a normal binary-safe Git push. The clean current-main lane contains the deterministic production WebP:

`public/images/essays/benislavskaya/benislavskaya-editorial-hero.webp`

Production contract:

- source-frame dimensions: `1672 × 941`;
- deterministic WebP profile: Pillow WebP `quality=88`, `method=6`;
- production bytes: `132172`;
- SHA-256: `0b1f1146f77ce154479042fc9a1afbe00133528eee14f220b4fa74990bd57e48`;
- classification: `reconstruction`;
- credit: `THE LEGENDARY POET · редакционная кинематографическая реконструкция по историческому портретному референсу`;
- external `sourceUrl`: intentionally none.

The exact approved WebP is now a required staged asset. Missing bytes or any SHA drift are CI failures.

The image is an editorial reconstruction. It must never be described as an archival photograph, facsimile, restoration or documentary witness.

The 1.9 MB source PNG is not required in the clean publication lane.

## Reader visual scope for v1

The v1 article may publish with **0 documentary body images** plus the approved reconstruction hero.

This is a deliberate rights-safe scope, not an unfinished visual state. Future archival/facsimile visuals are separate enrichment and require item-level identity, reuse permission/status, credit, production SHA and truthful captioning. Their absence does not block v1 publication.

## Documentary baseline

The safe corpus formula remains:

- **35 letters, notes and telegrams** from Sergey Yesenin to Galina Benislavskaya;
- **1 gift inscription**;
- **14 known letters** from Benislavskaya to Yesenin.

Do not rewrite this as `35 писем / 14 ответов`: that changes document classes and falsely implies one-to-one correspondence.

The article describes documented actions — manuscript handling, publishing errands, contracts, negotiations, money, correspondence and archive/paper handling — rather than assigning an unsupported modern occupational title. Current evidence does not establish autonomous editorial authority over Yesenin's authorial composition.

## 16 July 1925 — CLOSED page witness

The connected academic `Летопись жизни и творчества С. А. Есенина`, vol. 5, book 1 (IMLI RAN, 2013), reproduces the 16 July 1925 letter continuously on printed pp. **339–340**, from its opening `Сергей...` through `Галя. 16. VII. 25`.

Immediately after the text the IMLI editors state that the archive location cited by L. V. Zankovskaya is erroneous because the letter is absent from the former ЦГАЛИ / current РГАЛИ. They state that the document **remained with G. A. Benislavskaya** and point upstream to later publication/provenance literature.

Project disposition:

- **16 July text/page witness: VERIFIED via IMLI 2013, pp. 339–340**;
- old RGALI storage attribution: rejected;
- sending, delivery, receipt and reading by Yesenin: **not established and must not be asserted**;
- Zankovskaya 1997 and Shubnikova-Guseva 2008 are not an outstanding acquisition prerequisite merely to obtain this letter text.

## Direct holder inspection — 2026-08-20

Perm M. Gorky Regional Library physically inspected the requested 1995 volume:

`Сергей Есенин в стихах и жизни. Письма. Документы` (Moscow: Respublika, 1995), ISBN `5-250-02529-3`.

The holder reported:

- letters under the old dates **18 January 1924** and **8 February 1924** are apparently not present in this volume under those dates;
- **4 March 1924** appears on printed p. **234**;
- **6 April 1924** appears on p. **236**;
- **26 April 1924** appears on p. **238**;
- later correspondence continues from there.

This is direct holder evidence about the **1995 publication**, not proof that the 18-Jan or 8-Feb texts never existed. Those older bibliography positions may involve redating, identity/duplication, editorial inclusion criteria or another document-boundary problem.

The finding proves that the old acquisition range `236–281` is too narrow at the front edge.

### Current acquisition transaction

The controlling request is now:

**the complete continuous published sequence from the 4 March 1924 item through the 4 May 1925 item ending on p. 281.**

Working range: **234–281 provisional**.

The exact first page is still holder-confirmation pending: if the 4 March item begins before printed p. 234, the preceding page must be included.

A follow-up was sent in the same Perm EDD thread requesting:

1. exact first page / complete continuous range;
2. final price including any fees;
3. format/quality;
4. turnaround;
5. if readily visible without paid research, the sequence of letter dates in the relevant run.

**NO PAYMENT AUTHORIZED.** Chargeable copying must not begin until the owner separately approves the exact quoted price.

No newer holder reply had arrived at the latest 2026-08-20 recheck.

## Connected research fallback

A fresh connected-Drive search still does not expose the target 1995 page run as a lawful complete scan. The available academic IMLI chronology is valuable for page anchors and for the independently closed 16-July witness, but it does not yet replace the missing complete 1995 correspondence run.

Therefore the project does not promote OCR snippets, catalog metadata, page arithmetic or disconnected academic quotations into a fake complete witness.

## The unresolved 13 ↔ 16 ↔ 14 problem

Three source layers disagree in composition:

1. the open `Есенин.ру` page exposes **13 numbered units**;
2. P. F. Yushin's 1969 bibliography exposes **16 positions**;
3. the later academic PSS name index records **14 known letters** from Benislavskaya to Yesenin.

The open publication itself proves that `numbered unit ≠ letter`: unit #4 explicitly says `Эта открытка вместо сдачи.`

Additional high-value boundary nodes:

- open #3 is headed 26 April but signs `25.IV.24`;
- open #6 is headed `19 или 20 октября 1924 г.` but signs `10.X.24`;
- academic commentary independently identifies a **1 December 1924** Benislavskaya→Yesenin letter outside the open 13-unit page;
- the text beginning `Бросьте эту пьяную канитель` is academically attested as a Benislavskaya→Yesenin 1924 letter, while the older 8-Feb dating now conflicts with the direct holder observation for the 1995 volume;
- open #7 distinguishes a written but unsent business letter, so writing ≠ sending ≠ delivery ≠ reading;
- 16 July has a complete page witness but no proved transmission to Yesenin.

No arithmetic shortcut such as `13 ± selected items = 14` is accepted as proof.

The working crosswalk lives in:

`docs/research/BENISLAVSKAYA_INBOUND_RECONCILIATION_MATRIX_2026-08.md`

## Final controlling-witness transaction

When the lawful continuous page run arrives, verify in this order:

1. bibliographic identity: title, publisher, year, ISBN/edition;
2. printed-page sequence with no omissions or duplicates;
3. file SHA-256 and visual readability;
4. heading/date/signature for every correspondence item;
5. document class: letter / postcard / note / telegram / draft / copy / excerpt;
6. beginning and ending printed page of every item;
7. editorial cuts, supplied dates, brackets and restorations;
8. source/provenance statement for every item;
9. whether the publication distinguishes written / sent / delivered / read;
10. map each 1995 item against Yushin positions and later PSS/IMLI evidence;
11. explicitly record merged, redated, rejected or reclassified older positions;
12. derive the canonical **14-letter** matrix only after physical/document identity is closed.

## Diary / copy boundary

The diary corpus is tracked as:

`РГАЛИ, ф. 1604, оп. 1, ед. хр. 1123`, 35 leaves, **typewritten copy**.

Do not call this a viewed autograph diary. The current publication tradition combines diary entries, copies of letters and memoir-like material; the autograph location is not established by current project evidence.

## Publication unlock conditions

A public Product transaction may start only after all of the following are true:

1. obtain and inspect the complete continuous 1995 correspondence run from the complete 4-March item through p. **281**, currently **234–281 provisional**, **or another lawful complete page-level witness of equivalent controlling value**;
2. reconcile the canonical 14-item inbound-letter matrix against the open 13-unit publication, Yushin's 16-position bibliography, the complete controlling witness and the independently verified IMLI 16-July witness;
3. record completeness, page order, SHA and item-level identity/provenance;
4. re-read the staged article against the closed matrix and remove or qualify every claim that exceeds it;
5. keep the exact approved hero and its `reconstruction` classification;
6. retain **0 documentary body images** for v1 unless a separate rights-approved package is explicitly added;
7. remove staged metadata and register the essay in the canonical catalog only after source closure;
8. regenerate browser/search/sitemap/feed/discovery;
9. run content, citation, literary-style, TypeScript, production-build, SEO/route and full required browser QA on the exact publication head.

## Explicit non-claims

This staged lane does **not** mean:

- all 14 inbound letters have already been reconciled;
- 18 January or 8 February 1924 are proven fictional/nonexistent texts;
- the target 1995 pages have been paid for or delivered;
- the 16 July letter was sent, delivered, received or read by Yesenin;
- the diary autograph was inspected;
- Benislavskaya was an autonomous editor or literary agent in the modern professional sense;
- a holder-supplied research scan grants reuse rights;
- the reconstruction hero is documentary evidence.

## Current status

**HERO CLOSED / ARTICLE STAGED / CONTROLLING CORRESPONDENCE WITNESS + ITEM-BY-ITEM RECONCILIATION OPEN.**
