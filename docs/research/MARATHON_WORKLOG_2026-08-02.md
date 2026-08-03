# Editorial marathon worklog — 2–3 August 2026

## Completed in the opening pass

### Repository governance

- created dedicated branch `editorial/longform-marathon-2026-08` from exact main SHA `f068596e6096b3bf7f07ad3c2f9b4b998d517f5a`;
- left unrelated emblem branch/PR untouched;
- kept new research articles unpublished.

### Editorial standards

- added `docs/LONGFORM_EDITORIAL_MARATHON_STANDARD_2026-08.md`;
- defined source hierarchy and claim statuses;
- defined myth ledger and page-level source matrix;
- defined visual dramaturgy and rights gates;
- defined restrained biblical assessment rules;
- defined publication and Browser QA gates.

### Public policy

- expanded `/editorial-policy` with explicit boundaries for:
  - moral clarity without flattening a person;
  - naming documented sin without euphemism;
  - separating action from inferred motive/diagnosis;
  - using biblical reflection only when the material warrants it;
  - refusing both invented hidden repentance and confident human claims about the final divine judgment;
  - distinguishing memoir, myth and document.

### Yesenin Part II

- created source-map seed for 16 chapters;
- recorded known strong academic corpora;
- mapped source questions and HOLD boundaries;
- created starter myth ledger;
- recorded overlap boundaries with Duncan, tavern-mask, Benislavskaya and Imagism essays;
- recorded clinic/medical-document limit;
- recorded death-document methodology.

### Visual system

- confirmed the existing universal engine already supports:
  - full/left/right placement;
  - wide/portrait/cinematic layout;
  - archive/document/restoration/reconstruction kind;
  - source, credit and caption;
  - lightbox, zoom, focus management and mobile flow.
- added five-essay visual marathon plan;
- added Drive visual inventory pass 01;
- extracted and reviewed the first approved ephemera ZIP;
- rejected irrelevant manuscript substitution for the Lermontov poem article;
- classified first Yesenin and Mayakovsky manuscript candidates;
- recorded production gates for each article.

### Covers

- recorded all five user-approved generated covers;
- prepared 1280×720 WebP candidates;
- calculated exact bytes and SHA-256;
- wrote atomic metadata/provenance/validator replacement plan;
- did not mislabel generated covers as archive.

### Release planning

- separated already scheduled long VK posts from future site-article announcements;
- spaced proposed previews every two days rather than daily duplication;
- blocked dates for research articles until all gates pass.

## Closure pass — 3 August 2026

### One-lane governance and documentation

- continued only in `editorial/longform-marathon-2026-08` and PR `#271`;
- created no successor, `FINAL`, `LATEST` or acquisition branch;
- confirmed that PR `#271` had no unresolved inline review threads at the time of the closure pass;
- kept the existing chapter/source maps, December acquisition registry, validators and this worklog as the canonical architecture instead of creating duplicate `MASTER`, `FORENSIC` or `POSTFLIGHT` files;
- consolidated all newly accepted chronicle volumes into one canonical file: `YESENIN_LETOPIS_1921_1925_SOURCE_PASS_01_2026-08.md`;
- deleted the superseded single-volume Letopis source pass.

### Yesenin Part II research integrity

- preserved 14 non-public working chapters and the prohibition on chapters 15–16 prose;
- restored the exact chapter 13 boundary that a literary image is neither a medical diagnosis nor a suicide note;
- restored the exact chapter 14 boundaries that certificate no. 1037 does not contain a complete diagnosis and the Evdokimov letter provenance/delivery state must remain explicit;
- retained the distinction between artistic confession and repentance, poetic image and diagnosis, authorised copy and autograph, planned route and completed route;
- kept the Part II data module and public route absent.

### Product and browser regression

- changed the opening `page-wipe` from an indefinitely mounted decorative layer to a lifecycle-controlled overlay that unmounts on animation completion;
- added a bounded 1.2-second fallback because cold WebKit runs can omit the motion completion callback;
- did not weaken the browser assertion or solve the failure by inflating the test timeout.

### Drive PDF acquisition — existing BATCH-0002

The following three non-duplicated OCR research copies of IMLI RAN academic editions were accepted into the existing folder `1guVgPmnwnTR5wWaInK41Lp2HhMJ4ve6b`:

```yaml
- source_id: yes2-letopis-t3-k1-imwerden-ocr
  coverage: 1921 — 10 May 1922
  pdf_pages: 481
  file_size_bytes: 45017280
  sha256: eaccd7e92a90087112a4425d6a211257ad3e80e9e47c05ce9943b7f4b1669014
  Drive_file_id: 13q21pg9dd4EyAIhBVxZXJrxwjYGD0qK-
- source_id: yes2-letopis-t3-k2-imwerden-ocr
  coverage: 10 May 1922 — 2 August 1923
  pdf_pages: 580
  file_size_bytes: 53450829
  sha256: 89b33c7a472eab0c234877cd8737a1f2e12eebd142d0552a625eeb28d6ce4187
  Drive_file_id: 1d_3-aNk4eY5LqLWzU9XUt8J_g6-IynxN
- source_id: yes2-letopis-t5-k1-imwerden-ocr
  coverage: January — 23 December 1925
  pdf_pages: 836
  file_size_bytes: 47981380
  sha256: 1c4a37276fc9e2e8da2a9b19c7b0c8941b6e43a0ec9aec5d42a55589e0145496
  Drive_file_id: 1d7UCOxmX7SUPJkjclZKvNhJAAGhu1gHs
```

For all three objects:

- MIME, page count, byte size, SHA-256, cover and title page were checked;
- Drive exact-title dedupe was rerun before upload;
- the existing `ACQUISITION_MANIFEST.md` and `SHA256SUMS.txt` were updated in place;
- the Open Research Source Registry was updated in place through passes `P07` and `P08`;
- no new batch, empty folder, placeholder PDF or duplicate index was created;
- the stored binaries are marked as ImWerden OCR reproductions of IMLI academic editions, not original archive masters;
- OCR exact quotations require inspection of the page image;
- embedded photographs, manuscripts and facsimiles remain on item-level rights HOLD.

Together with the Duncan research master, the batch now has four verified root research files. The Gruzinov and Evdokimov searchable PDFs remain separately classified as derived texts, not original facsimiles or complete source collections.

### Source-acquisition validator

- extended `validate-yesenin-source-acquisitions.ts` to require all three Letopis source IDs, Drive IDs, page counts, byte sizes and SHA-256 values;
- protected the single-batch, no-duplicate-index and no-empty-folder decisions;
- protected the representation boundary `OCR reproduction ≠ archival master`;
- protected the production-rights HOLD and the rule that volume 5 book 1 ends on 23 December 1925 and cannot close the later forensic interval.

### Gmail acquisition requests

Three institution-addressed Gmail drafts were verified as present and unsent:

1. RSL — four Yesenin editions;
2. RNL electronic delivery — `Плавильня слов`;
3. Murmansk regional library — `Русь советская` and `Плавильня слов`.

They remain `OWNER-SEND HOLD`. Draft preparation is not recorded as a sent request, and no response or file acquisition is claimed.

## Current external and owner-controlled HOLDs

1. Lawful original/full binaries remain pending for `Памяти Есенина`, the complete 1926 Evdokimov collection, the original Gruzinov facsimile, `Плавильня слов`, `Русь советская` and `От символизма до «Октября»`.
2. Chapter 15 remains blocked by the complete medical file, treatment-end mechanism, hotel/transport/inquiry records, original witness texts and the full forensic object chain.
3. Chapter 16 remains last and cannot be written before chapter 15 and the project-wide moral/theological review.
4. Exact production binaries and item-level rights for the five approved replacement covers remain unresolved.
5. The three institution requests require explicit owner authorization before Gmail send.
6. No merge, public Part II route or scheduled public announcement is permitted while these gates remain open.

## Honesty boundary

This worklog distinguishes executable repository/Drive closure from unavailable evidence, external responses, production rights and owner-authorised actions. `BINARY-PENDING`, an OCR research copy, a Gmail draft, a green historical SHA or a catalog record is never promoted to a stronger state than the evidence supports.
