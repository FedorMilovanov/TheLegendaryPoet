# Open-source acquisition pass 08 — Yesenin chronicle verification

**Date:** 3 August 2026  
**Lane:** `editorial/longform-marathon-2026-08` / PR #271  
**Registry pass:** `OSR-2026-08-03-P08`  
**Status:** `2 VERIFIED BINARIES / EXISTING BATCH-0002 UPDATED / 1 EXISTING ROW ADVANCED / 1 NEW ROW APPENDED`

## 1. Purpose

This acquisition pass did not replace the world-literature discovery pass 07. It executed a narrow binary-verification task against the existing Yesenin 1921–1925 source queue and completed two chronicle acquisitions needed for the long-form Yesenin Part II project.

## 2. Accepted research copies

### B02-003 / OSR-0031

**Title:** *Летопись жизни и творчества С. А. Есенина. Том 3. Книга 1. 1921 — 10 мая 1922*  
**Edition:** ИМЛИ РАН, 2005; ImWerden OCR reproduction  
**Research use:** day-level chronology for 1921, Imagism, the Duncan meeting, marriage preparations and the pre-Europe interval.

```yaml
pdf_pages: 481
file_size_bytes: 45017280
mime_type: application/pdf
text_layer: OCR_TEXT_OVER_PAGE_IMAGES
sha256: eaccd7e92a90087112a4425d6a211257ad3e80e9e47c05ce9943b7f4b1669014
Drive_file_id: 13q21pg9dd4EyAIhBVxZXJrxwjYGD0qK-
acquisition_decision: ACCEPTED_RESEARCH_COPY
production_reuse: HOLD
```

The existing registry row `OSR-0031` was advanced from pending status to `DRIVE-VERIFIED / ACCEPTED-RESEARCH-COPY`.

### B02-004 / OSR-0287

**Title:** *Летопись жизни и творчества С. А. Есенина. Том 5. Книга 1. Январь — 23 декабря 1925*  
**Edition:** ИМЛИ РАН, 2013; ImWerden OCR reproduction  
**Research use:** the Caucasus, late poetry, Sofia Tolstaya, publishing work, clinic, finances and the documented departure for Leningrad.

```yaml
pdf_pages: 836
file_size_bytes: 47981380
mime_type: application/pdf
text_layer: OCR_TEXT_OVER_PAGE_IMAGES
sha256: 1c4a37276fc9e2e8da2a9b19c7b0c8941b6e43a0ec9aec5d42a55589e0145496
Drive_file_id: 1d7UCOxmX7SUPJkjclZKvNhJAAGhu1gHs
acquisition_decision: ACCEPTED_RESEARCH_COPY
production_reuse: HOLD
```

A new monotonic registry row `OSR-0287` was appended and mapped to the Yesenin Part II and final-year article sequences.

## 3. Verification completed

Both objects passed the project acquisition gate:

```text
bounded Drive title/SHA comparison → real PDF MIME → file size → page count →
cover/title-page rendering → bibliographic identity → text-layer classification →
rights note → SHA-256 → actual Drive upload and file ID
```

The existing `BATCH-0002 — YESENIN 1921–1925` manifest and SHA-256 record were updated in place. The batch now contains four verified research files and no stored rejected binaries.

## 4. Source classification and rights boundary

Both accepted files are stored as **verified OCR reproductions of IMLI academic editions**. They are not described as:

- original archive objects;
- manuscript or original-edition facsimile masters;
- production-cleared image sources;
- complete proof of every biographical claim.

The files are private research copies. Embedded photographs, facsimiles and long quotations remain subject to separate rights and publication review. Production reuse remains `HOLD`.

The 1925 volume ends on 23 December and is explicitly not treated as the complete December 24–death forensic corpus.

## 5. Registry state after the pass

```yaml
registered_sources: 287
priority_A: 231
link_registered_or_download_selective: 236
download_queue_or_binary_pending: 45
tracked_dashboard_scopes: 66
latest_source_id: OSR-0287
```

The foreign/world-literature corpus from pass 07 remains intact. This acquisition pass only closes two high-priority Yesenin binary gaps.
