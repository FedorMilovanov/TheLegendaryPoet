# PR #77: final Mayakovsky media decisions

Original acquisition date: 2026-07-24  
Final editorial batch: 2026-08-06

Status: `5 ACCEPTED ACTIVE / 1 VERIFIED RESERVE / 24 EXCLUDED / 0 UNRESOLVED`

This ledger supplements `pr77-commons-original-provenance-ledger-2026-07-24.md`. The original ledger proves file identity, hashes and captured Commons templates for 30 originals. This file records the completed editorial disposition set.

## Decision policy

An asset becomes `accepted-active` only when:

1. its exact Commons original and hashes are known;
2. an independent institution, object card, photo chronicle or primary publication supports the caption;
3. the independent witness and acquired original are the same image;
4. unknown creator/date/location fields remain unknown;
5. the rights rationale is recorded separately from caption verification;
6. the stable media record resolves exactly one current archive block.

`verified-reserve` means the evidence is sufficient for a future bounded use, but no current essay block uses the exact source. `excluded-*` is a final editorial decision, not a request for another automatic research wave.

Machine-readable authority:

- `pr77-editorial-decisions-2026-07-24.json`.

Runtime authority:

- `src/data/essays/verifiedEssayMedia.ts`.

## Accepted active media

### C03 — Mayakovsky, Kazan, 1914

- media key: `mayakovsky-1914`;
- exact SHA-256: `b6250970d408b602b96b0cf35fc1ee8b50eff88d64caebd6e53a6018dd7a974d`;
- accepted caption: `Футурист Владимир Маяковский. Казань, 1914.`;
- creator: unknown;
- witness: State Mayakovsky Museum through `История России в фотографиях`;
- evidence: `https://russiainphoto.ru/photos/248776/`;
- rights record: `PD-RusEmpire`.

### C08 — Mayakovsky by Osip Brik, 1928

- media key: `mayakovsky-1928-osip`;
- exact SHA-256: `0e004e5ae2ce5d2c152e4dd603dff619ae35b219de431e84df065b7d12f18f0f`;
- accepted caption: `Владимир Маяковский. Фотография Осипа Брика, 1928.`;
- witness: official RSL volume-seven reproduction and ten-volume portrait index;
- evidence: `https://dlib.rsl.ru/viewer/01005408111#?page=5`;
- rights record: `PD-Russia`.

### C10 — Mayakovsky and the Futurists, 1912

- media key: `mayakovsky-futurists-1912`;
- exact SHA-256: `3ae1f3638b36ac5acb4e3289bacb119b355c5e3d8a55bc177880bceca8925999`;
- accepted caption: `Маяковский и футуристы. Москва, 1912.`;
- creator: unknown;
- witness: State Mayakovsky Museum virtual exhibition and the exact `Пощечина общественному вкусу` leaflet history;
- evidence: `https://muzeimayakovskogo.ru/exhibitions/virtualnye/mayakovskiy-voskhozhdenie/chetyre-krika-doloy-/listovka-poshchechina-obshchestvennomu-vkusu/`;
- publication predicate: the group photograph was used on the February 1913 leaflet instead of signatures;
- rights record: `PD-RusEmpire`.

### C11 — Mayakovsky and Francisco Moreno by Tina Modotti, 1925

- media key: `mayakovsky-moreno-modotti-1925`;
- exact SHA-256: `b7c4befe6d4043a3e7e3d936731b17a895deba77ec51b26360c4b333abcd47c8`;
- accepted caption: `Владимир Маяковский и Франсиско Морено. Мехико, 1925.`;
- creator: Tina Modotti;
- witness: State Catalogue record from the State Mayakovsky Museum;
- evidence: `https://goskatalog.ru/portal/#/collections?id=11208336`;
- rights record: creator died in 1942; captured Commons term templates are `PD-old-70-expired` and `PD-old-X-expired`.

### C16 — Mayakovsky shaving by Osip Brik, 1927

- media key: `mayakovsky-shaving-osip-1927`;
- exact SHA-256: `7bea5222bbb5621b11efa66e6ac081948a27719c4e0efb14f051d828cde60008`;
- accepted caption: `Владимир Маяковский бреется. Москва, 1927.`;
- creator: Osip Brik;
- witness: Arzamas exact reproduction credited to the State Mayakovsky Museum;
- evidence: `https://arzamas.academy/mag/1168-mayak`;
- rights record: `PD-Russia`, with known creator death in 1945 recorded separately.

## Verified reserve

### C15 — Mayakovsky with Bulka by Osip Brik, 1926

- exact SHA-256: `92cd221171cd249708a74ebaf28340931702a01577da5f2c1166f441553f0c77`;
- verified scope: Vladimir Mayakovsky with Bulka, Moscow, 1926, photographed by Osip Brik;
- witness: Arzamas exact reproduction credited to the State Mayakovsky Museum;
- evidence: `https://arzamas.academy/mag/1168-mayak`;
- disposition: evidence-qualified reserve, but no active media key because no current essay archive block uses this exact source.

## Final exclusions

| Candidates | Final class | Closure reason |
|---|---|---|
| C01, C04, C06, C07 | `excluded-rights` | Caption, object or volume evidence exists, but decisive publication/right predicates remain unavailable. |
| C02, C05, C09, C12, C14, C17–C23, C26, C27, C29 | `excluded-provenance` | Missing primary exact-object record, dead/unspecified source, malformed date, or no inspectable publication lineage. |
| C13 | `excluded-rights` | MFA Houston confirms the exact 1924 object and identifies Anatoly Cemenka, but creator-term/publication authority is not sufficiently resolved. |
| C24 | `excluded-rights` | Osip Brik attribution is secondary; exact day and United States rationale are unsupported. |
| C25 | `excluded-scope` | Secondary attribution and incomplete rights; the nude portrait is not needed by the current editorial scope. |
| C28, C30 | `excluded-rights` | EU-anonymous rationale does not establish the broader publication authority required by the project. |

The exact reason for every candidate is stored in the machine-readable decision file. Exclusion does not assert that an image can never be licensed or researched again; it means the project has made a final no-publication decision under the current evidence and scope.

## Final publication status

- original acquisition: `30/30 complete`;
- independent historical acceptance: `5/30 active`;
- verified reserve: `1/30`;
- explicitly excluded: `24/30`;
- unresolved: `0/30`;
- active records protected by exact-one coverage validation: `5`;
- new image binaries added by this decision batch: `0`.

Issue #77 may close after exact-head source validation and merge because every candidate now has a deliberate editorial disposition.
