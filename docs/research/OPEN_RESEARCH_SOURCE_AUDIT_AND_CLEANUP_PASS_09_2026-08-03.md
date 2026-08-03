# Open Research Source Audit and Cleanup — Pass 09

**Date:** 3 August 2026  
**Mode:** verification-only; no new-source discovery  
**Canonical branch:** `editorial/longform-marathon-2026-08`  
**Canonical PR:** `#271`  
**Audit ID:** `AUDIT-2026-08-03-P09`

## 1. Why this audit was required

The registry had grown to 287 discovery rows. Its legacy labels — `READ-OK`, `DOWNLOAD-OK`, `LINK-REGISTERED`, `DOWNLOAD-QUEUE`, `NEW` and priority `A` — were useful during discovery, but they were too easily read as proof that a URL, object, licence or file had been directly checked.

That interpretation is now prohibited. Discovery and verification are separate layers.

The audit also responds to a documented weakness in `docs/RESEARCH_SOURCES.md`: part of the older testimony corpus was assembled when direct fetch was unavailable, so exact quotations were compared through search results rather than read in the named primary source. Those entries remain research leads, not verified quotations, until direct source reading is completed.

## 2. Registry architecture changed

Eight authoritative audit columns were added to `SOURCE REGISTRY`:

```text
R  Verification state
S  URL live check
T  Content identity check
U  Rights/open status
V  Final audit verdict
W  Audit note
X  Verified at
Y  Audit pass
```

Every legacy row was first reset to:

```yaml
verification_state: UNVERIFIED-DISCOVERY
url_live_check: NOT-CHECKED
content_identity_check: NOT-CHECKED
rights_open_status: NOT-CHECKED
final_audit_verdict: HOLD
audit_pass: AUDIT-PENDING
```

This reset does not delete earlier discovery evidence. It prevents discovery labels from masquerading as completed verification.

The `STATUS GUIDE`, `DASHBOARD` and `PASS LOG` were rewritten around the audit layer. Dashboard metrics now count direct audit verdicts rather than legacy `READ-OK` labels.

## 3. Registry-wide state after the reset

```yaml
registered_discovery_rows: 287
direct_audited_rows: 51
audit_pending_rows: 236
verified_keep_link: 26
verified_download_candidates: 7
drive_verified_binaries: 3
hold_retry: 8
hold_rights_or_identity: 2
drops_total: 5
```

The 51 directly audited rows consist of:

- 45 world-literature rows from `OSR-0242` through `OSR-0286`;
- 3 previously manifested Yesenin binaries;
- 3 existing duplicate controls.

The remaining 236 rows are not declared bad. They are declared **not yet directly audited**.

## 4. World-literature audit result

No new authors or sources were searched. The audit opened the already stored URLs, followed only exact institutional redirects or rights pages needed to verify those existing records, and assigned one final verdict to each row.

```yaml
world_rows_audited: 45
KEEP-LINK: 26
KEEP-DOWNLOAD-CANDIDATE: 7
HOLD-RETRY: 8
HOLD-RIGHTS: 1
HOLD-IDENTITY: 1
DROP-BROKEN: 2
```

### 4.1 Shakespeare

Retained:

- Folger complete works;
- Folger downloadable research formats;
- Shakespeare Documented;
- Internet Shakespeare Editions;
- Folger manuscript and early-print guides.

Correction:

- Folger downloads are not labelled unrestricted public domain. The directly checked terms permit free noncommercial use in several formats. Any stored copy must retain those conditions.
- Folger collection guides remain navigation. A specific document, quarto, folio or image needs an item-level record and rights check.

### 4.2 Homer

Retained:

- Homer Multitext project and methodology;
- Scaife/Perseus routes as provisional navigation.

Holds:

- `OSR-0251` moved to `HOLD-RIGHTS`: datasets and image resources are visible, but this audit did not confirm a concrete licence on the release page.
- `OSR-0252` and `OSR-0253` moved to `HOLD-RETRY`: the stored Scaife routes resolved only as application shells, so edition identity, export method and rights were not directly inspected.

### 4.3 Dante

Retained link-only:

- Princeton Dante Project;
- Princeton works interface and project information;
- Dartmouth Dante Project and commentary list.

Rights correction:

- Princeton's project information limits the material to individual scholarly use and prohibits reproduction for distribution. The project is therefore a strong research link, not a Drive-mirroring source.

Hold:

- `OSR-0259` Dante Lab timed out and remains `HOLD-RETRY`. A timeout is not treated as proof that the project is permanently dead.

### 4.4 Goethe, Cervantes and Milton

Verified download candidates:

- `OSR-0262` — *Faust I*;
- `OSR-0263` — *Faust II*;
- `OSR-0269` — Spanish *Don Quijote*;
- `OSR-0272` — *Paradise Lost*, twelve-book representation;
- `OSR-0273` — *Paradise Lost*, ten-book representation;
- `OSR-0274` — *Paradise Regained*.

All six are Project Gutenberg candidates with a directly observed United States public-domain notice. This is recorded as `PUBLIC-DOMAIN-USA`, not as a worldwide rights statement. They still require version, encoding, dedupe and checksum verification before Drive upload.

Cervantes holds:

- `OSR-0267` BNE interactive project returned `502` and remains `HOLD-RETRY`;
- `OSR-0268` stored Cervantes Virtual route did not expose the object and remains `HOLD-RETRY`.

Milton correction:

- `OSR-0271` had a failed original host. The same Dartmouth institutional page opened on `mail.milton.host.dartmouth.edu`; the canonical stored URL was corrected rather than adding a new row.

### 4.5 Chaucer

The Harvard Chaucer portal, texts/translations, documentary biography and language guide opened and remain useful links. The Canterbury Tales Project also remains link-first. Portal-level pages cannot substitute for manuscript- or line-level evidence.

### 4.6 Molière, Victor Hugo and Baudelaire

Cleaned or held:

- `OSR-0280` and `OSR-0281` Gallica Molière selection pages failed to load and moved to `HOLD-RETRY`;
- `OSR-0282` stored *Dom Juan* selection returned `404` and moved to `DROP-BROKEN`;
- `OSR-0284` Victor Hugo poetry selection returned `403` and moved to `HOLD-RETRY`;
- `OSR-0286` stored Symbolism selection returned `404` and moved to `DROP-BROKEN`.

Important identity correction:

- `OSR-0285` was described as the 1857 first-edition digital object for *Les Fleurs du mal*.
- the BnF media page itself opened;
- its followed Gallica object resolved to printing proofs, not an unambiguous first-edition book record;
- the row was retitled and moved to `HOLD-IDENTITY`;
- no Baudelaire binary may be acquired from this row until the exact edition/object is resolved.

## 5. Previously verified binaries and duplicate controls

Promoted into the authoritative audit layer as `DRIVE-VERIFIED`:

- `OSR-0031` — Yesenin chronicle, volume 3, book 1;
- `OSR-0032` — Yesenin chronicle, volume 3, book 2;
- `OSR-0287` — Yesenin chronicle, volume 5, book 1.

Their production reuse remains `PRIVATE-RESEARCH-HOLD`.

Promoted as `DROP-DUPLICATE`:

- `OSR-0106` — bibliographic duplicate of Severyanin already represented by the canonical 1915 source;
- `OSR-0114` — exact Drive duplicate of Bryusov's *Urbi et Orbi*;
- `OSR-0124` — exact Drive duplicate of Severyanin's 1915 *Ананасы в шампанском*.

These rows remain in audit history but no longer count as active acquisition targets.

## 6. Stronger governing rules

`docs/SOURCE_ACQUISITION_AND_DRIVE_POLICY.md` was strengthened in place rather than duplicated. It now requires:

- separation of discovery, reachability, identity, rights and binary integrity;
- authoritative audit fields and dated evidence;
- direct reading for quotation verification;
- precise openness vocabulary;
- environment-aware handling of timeout/403/502 failures;
- explicit `KEEP`, `HOLD` and `DROP` verdicts;
- separate reporting of registered, directly audited and pending rows;
- a verification-first freeze before further discovery.

## 7. What remains unverified

The audit is not complete. Applying the default HOLD state is an integrity correction, not proof that all 287 records were individually tested.

Remaining direct-audit backlog:

```yaml
rows_pending_direct_audit: 236
```

The next waves must work by existing host/source cluster rather than by discovering more material:

1. ФЭБ and РВБ academic corpora;
2. НЭБ, РГБ and dlib direct-file claims;
3. museums, РГАЛИ and archive finding aids;
4. university theses and repositories;
5. Wikisource, Culture.ru, commercial or popular-navigation sources;
6. `docs/RESEARCH_SOURCES.md` quotations and low-authority references.

For every cluster, the required output is a dated row-level verdict, not a general statement that the institution is trustworthy.

## 8. Hard stops

Until a row passes its direct audit:

- do not call it verified;
- do not call it open without naming the exact openness class;
- do not call it downloadable based on a search result or viewer;
- do not use a portal homepage as claim-level evidence;
- do not use search-snippet quotation matching as direct verification;
- do not mirror a dataset or file without a concrete licence or lawful research-storage basis;
- do not count discovery priority `A` as source authority or legal clearance.

## 9. Next executable audit wave

Continue with existing Russian academic sources only. Start with the high-value ФЭБ/РВБ cluster, directly open each stored URL, confirm the exact page identity, distinguish corpus/navigation/item evidence and assign R:Y verdicts. Do not add replacement sources unless an existing record exposes its own canonical redirect or exact item link.
