# Open Research Source Audit — Pass 13: RSL, NEL and early editions

**Date:** 3 August 2026  
**Mode:** verification-only; no new-source discovery  
**Canonical branch:** `editorial/longform-marathon-2026-08`  
**Canonical PR:** `#271`  
**Audit ID:** `AUDIT-2026-08-03-P13`

## 1. Scope

This pass directly audited fourteen existing registry rows:

- Tsvetaeva: `OSR-0080`;
- Gumilev: `OSR-0083..OSR-0085`;
- Fet: `OSR-0087..OSR-0088`;
- Zabolotsky: `OSR-0104..OSR-0105`;
- Derzhavin: `OSR-0108`;
- Bryusov: `OSR-0115..OSR-0117`;
- Balmont: `OSR-0119`;
- Severyanin: `OSR-0123`.

No replacement source, author, edition or new registry row was added.

## 2. Result

```yaml
rows_directly_audited_in_pass: 14
KEEP-LINK: 8
HOLD-RIGHTS: 5
HOLD-RETRY: 1
new_sources_added: 0
binary_uploads: 0
```

Registry-wide state after this pass:

```yaml
registered_discovery_rows: 287
direct_audited_rows: 123
audit_pending_rows: 164
verified_keep_link: 60
verified_download_candidates: 8
drive_verified_binaries: 3
hold_retry: 39
hold_rights_or_identity: 8
drops_total: 5
```

## 3. RSL records retained as links

### OSR-0080 — Tsvetaeva chronicle

The exact RSL record confirms E. B. Korkina's three-part *Chronicle of the Life and Work of M. I. Tsvetaeva*, issued by the Marina Tsvetaeva House Museum in 2012–2014. The record exposes free full-volume viewer access.

This is a modern copyrighted reference work. Viewer access does not supply a redistribution licence or a verified downloadable master.

```yaml
verification: VERIFIED-CONTENT
rights: BLOCKED-REPRODUCTION
verdict: KEEP-LINK
```

### OSR-0083 — Gumilev, *Kostyor*

The exact RSL record confirms:

```yaml
publisher: Гиперборей
place: Санкт-Петербург
publication_year: 1918
extent: 43 pages
access: free full viewer
```

No item-level download identity or redistribution licence was confirmed.

```yaml
verification: VERIFIED-CONTENT
rights: OPEN-ACCESS-NO-LICENSE
verdict: KEEP-LINK
```

### OSR-0084 — Gumilev collected works

The parent RSL record confirms the ten-volume scholarly collected works beginning in 1998 and exposes volume-level entries. This is navigation to a modern copyrighted edition, not a freely reusable corpus.

```yaml
verification: VERIFIED-NAVIGATION
rights: BLOCKED-REPRODUCTION
verdict: KEEP-LINK
```

### OSR-0085 — Gumilev dissertation

The RSL record confirms O. V. Shchegolkova's 2003 candidate dissertation *The Structure-Forming Role of Motif in N. S. Gumilev's Kostyor*:

```yaml
extent: 211 pages
bibliography: pages 191–211
file_route: application/pdf viewer
```

No open reuse licence was found. The dissertation remains link-only and must be cited by exact page.

### OSR-0087 — Fet, *Liricheskii panteon*

The exact RSL record confirms the Moscow 1840 edition, 109 plus 3 pages, and free full viewing. No direct-file identity or scan-reuse licence was verified.

### OSR-0088 — Fet, complete poetry, volume 2

The exact RSL record confirms the 1912 volume, 442 pages, its contents and free full viewer access. It remains an item-level reading link.

### OSR-0104 — Zabolotsky, *Stolbtsy*

The exact record confirms the 2016 Nauka edition in the Literary Monuments series:

```yaml
extent: 531 pages plus 17 illustration leaves
prepared_by: N. N. Zabolotsky and I. E. Loshchilov
```

It is a modern scholarly edition and is `BLOCKED-REPRODUCTION / KEEP-LINK`.

### OSR-0105 — Zabolotsky, *Vtoraia kniga*

The exact RSL record confirms the Leningrad 1937 edition, 45 plus 2 pages, with binding and title by S. M. Pozharsky. Copyright and scan-reuse remain restricted despite free viewer access.

## 4. NEL PDF routes placed on rights hold

The following NEL records expose a PDF or application/pdf route but do not state an item-level redistribution licence. Under the controlling policy, PDF availability is not equivalent to permission to mirror the file in Drive.

### OSR-0108 — Derzhavin, works, part 1

```yaml
publication_year: 1808
representation: application/pdf
extent: 355 pages
verdict: HOLD-RIGHTS
```

The historical text is old, but the exact digital object's reuse basis must still be recorded before acquisition.

### OSR-0116 — Bryusov, volume 7, articles on Pushkin

The exact NEL record confirms:

```yaml
volume: 7
part_title: Статьи о Пушкине
extent: 436 plus 1 pages
representation: application/pdf
```

The registry previously asserted `1913–1914`, but the exact item record does not supply that date. The authoritative year field was corrected to `undated in item record; volume 7` pending title-page inspection.

```yaml
verification: CONFIRMED-WITH-CORRECTION
verdict: HOLD-RIGHTS
```

### OSR-0117 — Bryusov, *Mea*

The NEL record confirms 107 pages plus a portrait leaf and identifies the contents as poems of 1922–1924. Its imprint is displayed as `[19??]`, not 1922.

The registry chronology was corrected to:

```yaml
imprint: [19??]
content_coverage: poems 1922–1924
```

The PDF remains `HOLD-RIGHTS` because no reuse licence was stated.

### OSR-0119 — Balmont, *Budem kak solntse*

The exact NEL record confirms:

```yaml
publisher: Скорпион
publication_year: 1903
extent: 2 preliminary pages plus 290 pages
pdf_size: approximately 160 MB
```

The direct PDF route remains blocked for acquisition until an item-level rights basis is documented.

### OSR-0123 — Severyanin, *Gromokipiashchii kubok*

The exact NEL object is not an unspecified or first edition. It is specifically:

```yaml
publication_year: 1914
edition: sixth edition
extent: 126 plus 4 plus III pages
```

The registry title was corrected to include the sixth-edition identity. PDF availability alone does not authorize redistribution.

## 5. Retry hold

### OSR-0115 — Bryusov collected works, volume 1

The exact stored NEL/RSL URL did not expose readable item metadata during this pass. No title-page, extent, file identity or rights conclusion was made.

```yaml
verification: FAILED-LIVE-CHECK
url_state: FETCH-FAILED
verdict: HOLD-RETRY
```

The failure is not reported as a permanent dead link.

## 6. Rule enforced

This pass confirms a recurring distinction:

```text
free viewer access != downloadable file identity
PDF endpoint != open licence
public-domain author text != unrestricted modern scan, apparatus or database reuse
```

No RSL or NEL binary was uploaded in this pass.

## 7. Next audit order

Continue without new-source discovery:

1. remaining Derzhavin and nineteenth-century NEL volumes;
2. Voloshin, Klyuev, Gippius, Bely, Sologub, Ivanov and Merezhkovsky objects already registered;
3. Maykov, Polonsky, Apukhtin and other exact dlib routes;
4. eighteenth-century and Pushkin-era book monuments;
5. remaining university repositories;
6. auxiliary text sites and the 75 legacy testimony quotations.

Every acquisition candidate still requires real bytes, MIME, title-page inspection, completeness, dedupe, SHA-256 and a documented rights basis.