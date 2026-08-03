# Source Acquisition and Google Drive Policy

**Project:** THE LEGENDARY POET  
**Effective:** 2 August 2026  
**Verification revision:** 3 August 2026

## 1. Purpose

The project may conduct broad 40+ search passes across Russian, English and other-language public repositories. The goal is not to accumulate links or files. The goal is to close documented research gaps with legally accessible, identifiable, authoritative and non-duplicated sources.

A discovery result is a candidate. It is not evidence that the URL works, the described object is present, a quotation was read, a file may be mirrored or a claim is supported.

## 2. Current Drive and registry authority

The canonical source area is:

```text
01 — SOURCES — PDF LIBRARY
├── 01 — COMMONS STRICT 40
├── 02 — SECOND EDITORIAL 40
└── 01 — BOOKS, EDITIONS & ARTICLES
    ├── BATCH-0001
    └── verified bounded batches
```

The two 40-item collections, every later verified batch and every visible manifest form one deduplication universe. A candidate missing from one old inventory may still exist in another library, batch or opaque archive.

The operational source registry is the native Google Sheet `THE LEGENDARY POET — OPEN RESEARCH SOURCE REGISTRY`. Its discovery columns record how a candidate was found. Its audit columns record what was actually verified. Audit fields outrank legacy discovery labels.

Source files do not move into CONTENT, MEDIA or RELEASES merely because they are useful.

## 3. Discovery workflow

For every research marathon:

1. define active article or research gaps;
2. run at least 40 distinct searches only when the owner requests a 40+ pass;
3. search primary and academic repositories first;
4. record candidate title, author/editor, year, language, repository and stable item URL;
5. classify provisional relevance and source type;
6. reject irrelevant bulk before download;
7. deduplicate all surviving candidates;
8. move only a bounded shortlist into verification;
9. download only candidates that pass the applicable legal and technical gates;
10. upload accepted files with a manifest and checksum record.

Search-count compliance does not justify low-value acquisition. A pass may end with zero accepted files.

## 4. Preferred repositories and source hierarchy

Prefer:

- original manuscripts, letters, official documents and exact first publications;
- national, academy and university libraries;
- scholarly complete works, chronicles, critical editions and document collections;
- author or museum archives when they expose an identifiable object;
- institutional facsimiles and scans with clear provenance;
- academic journal repositories and university presses when lawful full text is available;
- stable public scholarly corpora and finding aids.

A search-engine result, snippet, AI summary, aggregator, social post, commercial re-upload or general-interest article is navigation only until the underlying source is directly inspected.

A portal homepage, collection description or finding aid may prove that a collection exists. It does not prove the contents of an uninspected item.

## 5. Verification is separate from discovery

Legacy labels such as `READ-OK`, `DOWNLOAD-OK`, `LINK-REGISTERED`, `DOWNLOAD-QUEUE`, `NEW` and priority `A` are discovery-era descriptions. They do not mean that the source was directly opened, identified, licensed or downloaded.

Every legacy row defaults to:

```text
UNVERIFIED-DISCOVERY
URL: NOT-CHECKED
IDENTITY: NOT-CHECKED
RIGHTS: NOT-CHECKED
VERDICT: HOLD
```

until a dated direct audit records evidence to the contrary.

No dashboard, report or final answer may count a legacy `READ-OK` or `DOWNLOAD-OK` row as verified. Discovery totals and verification totals must always be reported separately.

## 6. Four independent verification gates

A source is audited across four independent questions:

1. **URL reachability** — did the exact stored URL open during the audit?
2. **Content identity** — does the opened page or file match the registered title, edition, institution and object type?
3. **Rights/open status** — what exact terms permit reading, downloading, storing, quoting or redistributing?
4. **Binary integrity** — were actual bytes inspected and recorded with MIME, completeness, statistics and checksum?

Passing one gate does not imply the others.

Examples:

- a live URL can lead to the wrong object;
- an open viewer can prohibit downloading;
- a public-domain author can be presented through a protected modern edition;
- downloadable data can lack a verified licence;
- a catalogue record can be authoritative navigation without exposing the underlying document.

## 7. Direct-audit evidence requirements

Every direct audit records:

```yaml
verification_state:
url_live_check:
content_identity_check:
rights_open_status:
final_audit_verdict:
audit_note:
verified_at:
audit_pass:
```

The note must state what was actually observed, not what was expected from a search result.

A quotation is not verified by matching search snippets or multiple websites repeating the same wording. Direct quotation verification requires the exact source text, edition or documentary object. If direct reading was not completed, the quotation remains `HOLD-DIRECT-READ-NOT-DONE` even when the attribution appears plausible.

## 8. Audit states and final verdicts

Verification states:

- `UNVERIFIED-DISCOVERY` — candidate only; no direct audit completed.
- `VERIFIED-CONTENT` — exact stored URL opened and the described content identity was confirmed.
- `VERIFIED-NAVIGATION` — a portal, catalogue, collection guide or search interface was confirmed, but not an item-level object.
- `VERIFIED-RIGHTS` — a concrete licence or access statement was directly inspected.
- `VERIFIED-BINARY` — actual bytes, identity, completeness, statistics, SHA-256 and Drive representation were verified.
- `VERIFIED-DUPLICATE` — an existing canonical binary or bibliographic equivalent was confirmed.
- `FAILED-LIVE-CHECK` — the exact source failed, timed out, returned an error or did not expose the object in the audit environment.

Final audit verdicts:

- `KEEP-LINK` — directly audited and useful under its recorded evidence class.
- `KEEP-DOWNLOAD-CANDIDATE` — worth technical acquisition, but not yet a verified binary.
- `DRIVE-VERIFIED` — accepted binary with real Drive ID and checksum evidence.
- `HOLD-RETRY` — failure may be temporary, environment-specific or dependent on a normal browser.
- `HOLD-RIGHTS` — content is useful, but lawful mirroring or reuse is unproved.
- `HOLD-IDENTITY` — the opened object does not match the registered description.
- `HOLD-DIRECT-READ-NOT-DONE` — a quotation or claim has not been checked in the exact source.
- `DROP-BROKEN` — exact stored source is demonstrably dead or returns a stable not-found result with no verified redirect.
- `DROP-DUPLICATE` — a stronger canonical record or binary already represents the same source.
- `DROP-LOW-AUTHORITY` — the item adds no unique evidence beyond stronger primary or academic sources.
- `DROP-UNMAPPED` — no named article, claim or approved research purpose justifies retaining the row.

Audit history is retained even when an active source is dropped.

## 9. Failure interpretation

A timeout, `403`, `502`, JavaScript shell, cache miss or connector failure does not by itself prove that a source is permanently dead. It does prove that the source was not directly verified in that audit environment.

Use `HOLD-RETRY` until a normal browser, canonical redirect or institution-level record resolves the object. Use `DROP-BROKEN` only for an actual stable failure such as a confirmed `404` or removed item without a verified replacement.

During a verification-only phase, do not broaden into new discovery. Following an existing source's canonical redirect, exact item link or rights page is allowed because it verifies the registered object.

## 10. Acquisition gate

A file is uploaded only when all are true:

- it closes a named gap in an active or approved project;
- its bibliographic identity is clear;
- a stable item/source page is known;
- access is lawful and the exact rights or jurisdiction status is recorded;
- it is not already present or equivalent to an existing copy;
- the file opens and is structurally usable;
- title, edition and relevant metadata pages have been inspected;
- completeness, MIME, page/file statistics and text-layer class are recorded;
- SHA-256 is recorded before any optimisation or derivative processing.

`KEEP-DOWNLOAD-CANDIDATE` is not an upload claim. `DRIVE-VERIFIED` requires a real returned Drive file ID.

## 11. Deduplication

Check candidates against every current library and batch using:

1. normalized title;
2. author, editor or compiler;
3. publication year and edition, volume or issue;
4. stable source/item URL;
5. filename after normalization;
6. page count and file size as supporting signals;
7. SHA-256 as exact-byte authority.

Duplicate classes:

- `EXACT_DUPLICATE` — same SHA; never upload again.
- `BIBLIOGRAPHIC_DUPLICATE` — same edition/item, different packaging or compression; keep the better canonical copy unless the second representation has a documented advantage.
- `EDITION_VARIANT` — different edition, translation, volume or issue; retain only when the difference matters.
- `LANGUAGE_VARIANT` — retain only when translation or reception research needs it.
- `EXTRACT_OF_EXISTING` — do not store an extract when the complete verified volume already exists, unless the extract has independent historical publication value.
- `SUPERSEDED_SCAN` — replace only through an explicit manifest decision; do not leave uncontrolled parallel copies.

## 12. Required manifest row

Each accepted file records:

```yaml
id:
canonical_filename:
title:
author_or_editor:
year:
language:
edition_volume_issue:
research_gap:
article_or_project:
source_repository:
item_url:
direct_file_url:
rights_status:
rights_notes:
page_count:
file_size_bytes:
text_layer: TEXT | PARTIAL | SCAN | OCR_TEXT_OVER_PAGE_IMAGES
sha256:
first_page_verified: true | false
title_page_verified: true | false
relevant_pages_or_sections:
duplicate_check:
Drive_file_id:
Drive_path:
representation_class:
production_reuse: ALLOWED | CONDITIONAL | HOLD
acquisition_decision: ACCEPTED | HOLD | REJECTED
rejection_reason:
```

## 13. File quality review

Before upload:

- verify the file MIME and confirm that an error page was not saved as a document;
- render and inspect the cover/first page and title or copyright pages when present;
- record page count or file structure and byte size;
- determine the text-layer class without blindly running mass OCR;
- check for missing pages, wrong object, corruption, misleading filename or partial export;
- prefer the most complete and legible lawful copy;
- preserve original bytes before checksum capture.

OCR, extracted text, screenshots and optimised copies are derivatives. They must not silently replace the original master or be described as original facsimiles.

## 14. Rights and openness vocabulary

`Open` must never be used without specifying what is open:

- open to anonymous reading;
- open to download;
- open to private local research storage;
- open under a stated licence;
- public domain in a specified jurisdiction;
- open for redistribution;
- open for production image reuse.

These are not interchangeable.

Rules:

- `Public domain`, `CC BY`, `CC BY-SA` and similar claims must be tied to the exact item page or institutional record.
- Record jurisdiction and edition uncertainty.
- `Public domain in the United States` is not a worldwide rights statement.
- A public-domain work may be wrapped in a protected modern edition, translation, introduction, annotation, typography, database or restoration.
- An openly accessible PDF is not automatically public domain.
- A book licence does not automatically license embedded photographs or facsimiles.
- Research access does not automatically permit production reproduction.
- Rights-unclear material may remain link-only or private research HOLD, but it does not enter production visuals.

## 15. Drive organisation and naming

Use sequential verified batches:

```text
01 — BOOKS, EDITIONS & ARTICLES/
  BATCH-0001/
  BATCH-0002 — <bounded research purpose>/
```

Inside a batch:

- numbered canonical source names;
- `ACQUISITION_MANIFEST.md` or structured equivalent;
- `SHA256SUMS.txt`;
- optional `REJECTIONS_AND_DUPLICATES.md` without storing rejected binaries.

Do not use uncontrolled labels such as `FINAL`, `LATEST`, `ULTIMATE`, `NEW`, `COPY`, `final-final`, `(1)` or `(2)`.

One canonical master changes only through an explicit replacement decision. Historical states, when needed, use dated immutable snapshots.

## 16. Research priority and anti-dilution

Acquisition priority is set by an approved article or documentary gap, not by fame, file availability or a desire to grow counters.

The current editorial marathon prioritises:

1. Sergey Yesenin Part II, 1921–1925;
2. Yesenin and Duncan route/document gaps;
3. Benislavskaya source gates;
4. Yesenin and Imagism;
5. exact first publications, memoir collections, letters, chronicles, posters and document corpora;
6. item-level visual provenance and rights for approved articles;
7. explicitly approved world-literature article packages after their links and rights pass audit.

Do not dilute active batches with generic anthologies, unrelated theology, commercial ebooks, broad portals without item records or modern studies that have no mapped claim.

## 17. Publication boundary

Drive acquisition is research infrastructure. Uploading a file does not:

- verify every claim inside it;
- grant production image rights;
- make a source A+ automatically;
- open a public article route;
- justify a publication date;
- prove that the article has cited or represented it correctly.

Priority `A` means research importance, not factual infallibility or legal openness.

## 18. Continuous verification and blocker-closure loop

At every continuation:

1. read the active audit layer, unresolved HOLD rows and current Drive manifests;
2. verify existing candidates before searching for more;
3. retry lawful institutional routes when the environment supports them;
4. process accessible candidates through URL, identity, rights, MIME, completeness, text-layer, dedupe and SHA gates;
5. upload only accepted master bytes;
6. capture the returned Drive ID and exact path;
7. update Sheet audit fields, Drive manifest, SHA file and repository ledger in the same pass;
8. map the accepted source to exact claims, pages or a stated retained purpose;
9. mark duplicate, irrelevant, broken and externally blocked rows with exact reasons;
10. continue every independent audit while another host or archive is blocked.

A candidate advances through explicit states:

```text
DISCOVERED
→ SHORTLISTED
→ URL-VERIFIED
→ IDENTITY-VERIFIED
→ RIGHTS-RECORDED
→ BINARY-PENDING or REQUEST-PENDING
→ BYTES-RECEIVED
→ BINARY-VERIFIED
→ DEDUPED
→ ACCEPTED
→ UPLOADED-TO-DRIVE
→ MANIFESTED
→ CLAIM-MAPPED
```

No state may be skipped in reporting. `UPLOADED-TO-DRIVE` requires a real returned Drive file reference. `MANIFESTED` requires the same SHA-256. `CLAIM-MAPPED` requires a concrete article, claim, page range or explicit retained-purpose note.

## 19. Audit completion rule

A registry-wide audit is not complete because a default HOLD status was applied. Completion requires every retained row to have a dated direct verdict and every dropped row to have a specific reason.

Until then, reports must state both:

```yaml
registered_discovery_rows:
direct_audited_rows:
audit_pending_rows:
```

Never report the first number as the number of verified sources.
