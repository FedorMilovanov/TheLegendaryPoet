# Open Research Source Audit — Pass 16: primary registry completion

**Date:** 3 August 2026  
**Mode:** verification-only; no new-source discovery  
**Canonical branch:** `editorial/longform-marathon-2026-08`  
**Canonical PR:** `#271`  
**Audit ID:** `AUDIT-2026-08-03-P16`

## 1. Scope

Pass 16 audited all sixty-four rows that still had `AUDIT-PENDING` after pass 15. The rows were distributed across the registry rather than forming one continuous block.

The pass covered remaining Pushkin, Blok, Yesenin, Boratynsky, Silver Age, Bryusov, Akhmatova, Pasternak, Tsvetaeva, Gumilev, Bunin, Zhukovsky, Batyushkov, Derzhavin, Karamzin, Krylov, Vyazemsky, Denis Davydov, Yazykov, Koltsov and Nikitin records.

No author, edition, replacement URL or registry row was added. Stored URLs were not silently repaired while discovery remained frozen. No unverified binary was uploaded.

## 2. Pass result

```yaml
rows_directly_audited_in_pass: 64
KEEP-LINK: 28
KEEP-DOWNLOAD-CANDIDATE: 2
HOLD-RIGHTS: 4
HOLD-IDENTITY: 12
HOLD-RETRY: 17
DROP-IDENTITY: 1
new_sources_added: 0
binary_uploads: 0
```

## 3. Primary registry audit is complete

Every registered discovery row now has a dated row-level verdict in columns `R:Y`.

```yaml
registered_discovery_rows: 287
direct_audited_rows: 287
audit_pending_rows: 0
verified_keep_link: 119
verified_download_candidates: 12
drive_verified_binaries: 3
hold_retry: 102
hold_rights_or_identity: 45
drops_total: 6
```

`PRIMARY-REGISTRY-AUDIT-COMPLETE` means that discovery metadata has been classified honestly. It does not mean that retry failures, rights questions, identity defects, binary acquisition, testimony verification or publication gates are resolved.

## 4. New verified download candidates

### OSR-0061 — *Semantics of European Poetry Is Shaped by Conservative Forces*

The exact PLOS ONE article was directly identified with its DOI, publication details and Creative Commons Attribution licence.

```yaml
verification: VERIFIED-RIGHTS
rights: CC-BY
verdict: KEEP-DOWNLOAD-CANDIDATE
```

Before Drive acquisition, the project must still verify actual article or PDF bytes, supplements, title and completeness, embedded-material exceptions, deduplication and SHA-256.

### OSR-0066 — *Grief in Akhmatova’s Requiem and Pushkin’s Bronze Horseman*

The Colby institutional repository directly confirms Hillary R. Smith's 2008 honors thesis. The repository permits viewing or downloading for research and scholarship while prohibiting commercial reproduction or distribution.

```yaml
verification: VERIFIED-RIGHTS
rights: RESEARCH-DOWNLOAD-NONCOMMERCIAL
verdict: KEEP-DOWNLOAD-CANDIDATE
```

The restriction must travel with any private research copy. Embedded quotations and images still require inspection.

## 5. Exact identity failures

Twelve rows were placed on `HOLD-IDENTITY` because their stored NEL identifiers did not match the registered works. Authoritative indexing exposed the intended title under a different identifier, but the frozen audit did not replace the URL silently.

The identity-hold cluster includes:

- `OSR-0216` — Pogodin/Karamzin, part 2;
- `OSR-0219` and `OSR-0220` — Krylov editions;
- `OSR-0223`, `OSR-0225`, `OSR-0226` — Vyazemsky parent, critical articles and *Old Notebook*;
- `OSR-0229..OSR-0231` — Denis Davydov editions;
- `OSR-0232` and `OSR-0233` — Yazykov and Yazykov/Zhukovsky editions;
- `OSR-0237` — Weinberg's Koltsov study.

These records are blocked from citation and acquisition until a governed future discovery/correction pass creates or updates the correct exact URLs.

### OSR-0224 — dropped for exact identity failure

The stored NEL URL resolves to Golubinsky's *History of the Russian Church*, not to Vyazemsky poetry.

```yaml
verification: VERIFIED-CONTENT
identity: MISMATCH
verdict: DROP-IDENTITY
```

It was removed from active source maps while its audit history was retained. A corrected Vyazemsky record must be introduced through a future governed discovery pass, not by silently mutating this result.

## 6. Material corrections

### Yesenin

`OSR-0033` is the 2010 fourth volume of the *Chronicle of the Life and Work of S. A. Yesenin*, covering 3 August 1923 through 1924. The exposed PDF belongs to a modern collective scholarly edition and remains `BLOCKED-REPRODUCTION / KEEP-LINK`.

### Akhmatova museum

The rare-book fund page describes approximately 15,000 units. This remains collection navigation; no blanket rights or authenticity claim applies to every object.

### Pasternak

- Hoover collection dates were corrected from `1877–2013` to `1878–2010`.
- The stored RGALI page is not a generic Pasternak fund landing page. It is the exact section *Manuscripts of E. B. and E. V. Pasternak*, fund 379, inventory 5, with 35 listed units.

### Bunin

The Bunin group page describes the plan and prospectus for a future twenty-five-volume scholarly complete works and letters. It is not a completed available corpus.

### Koltsov and Nikitin

- `OSR-0236` — Koltsov, *Poems and Letters*, second edition, 1901, XX + 328 + 1 pages plus portrait;
- `OSR-0239` — Nikitin complete works edited by M. O. Gershenzon, 1912, XXIV + X + 448 pages plus nine illustration leaves;
- `OSR-0240` — Nikitin complete works edited by A. Ya. Krakov, first edition, 1914, XXXVI + 528 + VII pages plus portrait.

All three exact digital representations remain rights-controlled; PDF availability did not establish redistribution permission.

## 7. Remaining classified queues

Primary classification is complete, but the registry deliberately retains unresolved queues:

```yaml
HOLD-RETRY: 102
rights_or_identity_holds: 45
verified_download_candidates_not_yet_manifested: 12
drive_verified_binaries: 3
legacy_testimony_rows_on_HOLD-DIRECT-READ: 75
```

The retry queue contains cache misses, timeouts, HTTP errors, decoding failures and application-shell failures. These rows are not active evidence.

The rights and identity queue contains usable content without a verified reuse licence, mismatched objects and exact identifiers requiring governed correction.

The twelve download candidates are not accepted Drive masters until the complete acquisition gate passes: real bytes, MIME, title page, completeness, page count, file size, text layer, licence/jurisdiction, embedded-material review, deduplication, SHA-256 and a real Drive ID.

## 8. Branch-closure assessment

The source-registry primary-audit gate is closed. The editorial branch and PR are not ready to merge or delete.

Independent blockers remain in PR `#271`:

- 102 retry rows and 45 rights/identity holds remain classified and unresolved;
- 75 testimony quotations still require direct reading in the named books, letters, memoirs, articles or archive objects;
- lawful original/full Yesenin binaries and forensic source chains remain incomplete;
- medical, hotel, transport, inquiry and final-poem evidence gates remain open;
- chapters 15 and 16 and the final moral/theological review remain incomplete;
- production visual binaries, metadata, provenance and item-level rights remain incomplete;
- institution-request drafts require explicit owner authorization before sending;
- dependency remediation and exact-head reruns remain incomplete;
- exact-head CI, Manual Browser QA, Site route integrity and Brand deep reference/motion workflows were cancelled rather than green.

Therefore the compliant state is:

```yaml
primary_source_registry_audit: COMPLETE
pr_271: KEEP_DRAFT
merge_to_main: BLOCKED
branch_deletion: BLOCKED
public_part_II_release: BLOCKED
```

No merge, branch deletion, Ready-for-review promotion or completion claim is authorised by this report.
