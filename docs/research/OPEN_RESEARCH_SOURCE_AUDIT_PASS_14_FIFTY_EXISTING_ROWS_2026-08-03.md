# Open Research Source Audit — Pass 14: fifty existing rows

**Date:** 3 August 2026  
**Mode:** verification-only; no new-source discovery  
**Canonical branch:** `editorial/longform-marathon-2026-08`  
**Canonical PR:** `#271`  
**Audit ID:** `AUDIT-2026-08-03-P14`

## 1. Scope

This pass directly audited fifty existing registry rows. It did not add an author, edition, replacement URL or registry row.

Audited IDs:

```text
OSR-0109..OSR-0113
OSR-0118
OSR-0120..OSR-0122
OSR-0125..OSR-0165
```

Rows already audited in earlier passes inside that numeric interval were not counted again.

The source clusters covered Derzhavin, Bryusov, Balmont, Voloshin, Klyuev, Gippius, Andrei Bely, Sologub, Vyacheslav Ivanov, Merezhkovsky, Maikov, Polonsky, Apukhtin, Nadson and two historical English translation objects.

## 2. Result

```yaml
rows_directly_audited_in_pass: 50
KEEP-LINK: 12
KEEP-DOWNLOAD-CANDIDATE: 2
HOLD-RIGHTS: 17
HOLD-RETRY: 19
new_sources_added: 0
binary_uploads: 0
```

Registry-wide state after this pass:

```yaml
registered_discovery_rows: 287
direct_audited_rows: 173
audit_pending_rows: 114
verified_keep_link: 72
verified_download_candidates: 10
drive_verified_binaries: 3
hold_retry: 58
hold_rights_or_identity: 25
drops_total: 5
```

## 3. Two newly verified download candidates

### OSR-0111 — *Specimens of the Russian Poets*, volume 1

Project Gutenberg directly exposes the exact work, downloadable representations and its United States public-domain statement.

```yaml
verification: VERIFIED-RIGHTS
rights: PUBLIC-DOMAIN-US
verdict: KEEP-DOWNLOAD-CANDIDATE
```

The candidate is not yet a Drive master. Exact format, bytes, completeness, title page, jurisdiction warning, dedupe and SHA-256 remain mandatory.

### OSR-0112 — *The Bakchesarian Fountain and Other Poems*

The exact Project Gutenberg record and downloadable representations were directly checked. The English translation is retained as a historical translation witness, not as a substitute for the Russian primary text.

```yaml
verification: VERIFIED-RIGHTS
rights: PUBLIC-DOMAIN-US
verdict: KEEP-DOWNLOAD-CANDIDATE
```

## 4. NEL and RSL objects placed on rights hold

Seventeen exact objects opened and exposed item metadata and, in many cases, a PDF route. None displayed an item-level licence authorising the project to mirror the digital representation into Drive.

They therefore remain:

```yaml
rights: OPEN-ACCESS-NO-LICENSE
verdict: HOLD-RIGHTS
```

The group includes:

- Derzhavin, Grot edition, volume 1;
- Voloshin, *Poems 1900–1910*, *Anno mundi ardentis*, *Usobitsa* and *Faces of Creativity*;
- Klyuev, *Pesnoslov*, *Song of the Sun-Bearer* and *Pine Chime*;
- Gippius, *Last Poems* and *88 Contemporary Poems*;
- Andrei Bely, *Gold in Azure* and *Cup of Blizzards*;
- Sologub, *Fiery Circle*;
- Merezhkovsky, *Collected Poems 1883–1910*;
- Maikov, complete works, volume 1;
- Polonsky, complete poems, volume 1;
- Pertsov, *Philosophical Currents of Russian Poetry*.

The repeated rule is unchanged:

```text
viewer access != file identity
PDF route != open licence
public-domain author text != unrestricted database scan, apparatus or image reuse
```

No binary from this group was uploaded.

## 5. Material identity corrections

The audit corrected discovery metadata in place rather than silently preserving attractive but inaccurate descriptions.

### OSR-0110 — Derzhavin

The exact item is volume 1 of a seven-volume representation, published in 1868, with XXXVIII + 2 + 542 + 1 pages and a portrait. It must not be conflated with the separate nine-volume parent catalogue.

### OSR-0121 — Balmont

The stored title was too broad. The exact object is:

```text
Полное собрание стихов, том 5:
«Литургия красоты», второе издание, 1911
```

### OSR-0126 — Voloshin

The record distinguishes the title year 1915 from publication in 1916. Both values are now retained instead of collapsing them into one date.

### OSR-0129 — Voloshin archive

The RGALI page is fund **102**, covering 1896–1933, with three inventories and 56 storage units. The URL path number `7943` is not the archival fund number.

### OSR-0131 and OSR-0133 — Klyuev

- `OSR-0131` is *Pesnoslov, book one*, 1919;
- `OSR-0133` is *Pine Chime*, second edition, 1913.

### OSR-0135 — Gippius

The exact book was published in 1910 and contains poems from 1903–1909. Publication date and content coverage are now separate fields.

### OSR-0142 — Andrei Bely

The exact title is *Cup of Blizzards: Fourth Symphony*.

### OSR-0145 — Sologub

The exact title is *Fiery Circle: Poems. Book Eight*.

### OSR-0153 and OSR-0157 — Maikov and Polonsky

- Maikov volume 1: `[1913]`, XVI + 600 pages plus portrait;
- Polonsky volume 1: 1896, 480 pages plus portrait.

### OSR-0164 — Pertsov

The vague chronological description was replaced with the exact publication year 1896.

## 6. Links retained for direct research use

Twelve rows were retained as useful links rather than download candidates:

- Derzhavin nine-volume parent catalogue;
- Balmont volume 5 and the German Wikisource author navigation page;
- the exact RGALI Voloshin fund catalogue;
- Gippius collected poems, book 2;
- the RVB Andrei Bely portal and exact full text of *Why I Became a Symbolist*;
- Andrei Bely memorial-apartment exhibition;
- Sologub twelve-volume parent catalogue;
- named 1956 FEB chapters on Maikov and Polonsky;
- the Svet/NEL Nadson selection as navigation only.

Named scholarly or autobiographical interpretation is not promoted into neutral factual proof. Archive, museum and author landing pages do not prove that an individual object was read.

## 7. Retry holds

Nineteen exact stored URLs returned an internal error, timeout or Unicode decoding failure. They remain `HOLD-RETRY`, not `DROP-BROKEN`.

The retry group includes the Bryusov parent corpus, Balmont collection and *Burning Buildings*, the Voloshin Culture.ru museum page, Gippius book 1, Bely's *Northern Symphony*, Sologub's *Serpent Eyes* and Aikhenvald item, Vyacheslav Ivanov's RVB corpus and *Cor Ardens*, Merezhkovsky's *Symbols*, the Maikov and Polonsky parent catalogues and KLE pages, and the Apukhtin/Svet objects.

No conclusion about title, completeness, rights or file availability was inferred from a failed fetch.

## 8. Spreadsheet and project state

The canonical Google Sheet was updated in place:

- all fifty rows now have audit evidence in columns `R:Y`;
- corrected title, year, extent and fund fields were written into discovery metadata;
- Dashboard counters now report 173 directly audited rows and 114 pending;
- Pass Log contains `OSR-2026-08-03-P14`.

No source discovery was resumed and no unverified binary was claimed.

## 9. Next audit order

Continue with the remaining 114 discovery rows, beginning with existing `OSR-0166` and later RSL/NEL, university, historical-edition and auxiliary-text entries. Retry holds remain a separate queue and must not be counted as completed content verification.

The 75 legacy testimony quotations remain `HOLD-DIRECT-READ` until each named book, letter, memoir, article or archival item is directly read.