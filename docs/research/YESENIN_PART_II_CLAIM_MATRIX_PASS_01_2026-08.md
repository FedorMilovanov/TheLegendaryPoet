# Сергей Есенин. Часть II — claim matrix, pass 01

**Date:** 2 August 2026  
**Status:** `CLAIM ARCHITECTURE READY / PAGE-LEVEL PINNING INCOMPLETE`  
**Related:** issue #269, yearly chronology ledgers, detailed outline  
**Public route:** do not create

## 1. Status vocabulary

- `VERIFIED-FOR-DRAFT` — strong source architecture exists; exact page/source ID still must be pinned in the article data.
- `VERIFIED-FOR-PUBLICATION` — exact primary/academic pages, source IDs and wording gate are closed.
- `QUALIFIED` — safe only with an explicit boundary or interval.
- `MEMOIR-ONLY` — usable as attributed recollection, not fact without corroboration.
- `HOLD` — evidence gap blocks reader assertion.
- `FALSE-MYTH` — repeated formula contradicted by stronger evidence.
- `PARTLY-TRUE` — contains a factual core but overstates cause, scale or certainty.

No claim in this first pass is automatically `VERIFIED-FOR-PUBLICATION`; article-level page IDs, quotations, rights and final prose still need review.

## 2. High-load biographical claims

| ID | Claim | Status | Safe reader formula | Controlling ledger / gate |
|---|---|---|---|---|
| `YES2-C001` | Duncan caused the whole late crisis | `FALSE-MYTH` | Duncan entered a life already shaped by fame, group performance, alcohol-related disorder, legal conflict and unstable relationships | 1921 chronology; Part I bridge |
| `YES2-C002` | Yesenin and Duncan met exactly on 3 October 1921 | `QUALIFIED` | Academic chronology places the meeting probably on 3 October; the full witness corpus does not make the day entirely uncontested | first-meeting article; 1921 ledger |
| `YES2-C003` | The marriage was fictitious and only for a passport | `HOLD / REDUCTIVE` | The legal marriage and travel benefit are documented; the sole hidden motive of both participants is not | 1922 ledger; route source map |
| `YES2-C004` | They left immediately after the wedding | `FALSE-MYTH` | Marriage was registered 2 May, passport issued 8 May, departure occurred 10 May | 1922 ledger |
| `YES2-C005` | Every city named in letters was visited | `FALSE-MYTH` | Hague, Brussels and Rome remain plans until a following presence document is identified | route map; 1922 ledger |
| `YES2-C006` | Yesenin toured almost all US states | `HOLD / AUTHORIAL-HYPERBOLE` | A substantial multi-city tour is documented; “almost all states” is not a verified route register | US route pass |
| `YES2-C007` | Yesenin and Duncan were deported from the US | `HOLD / UNPROVEN` | Immigration scrutiny, political suspicion and cancellations are documented; a legal deportation order is not | US day-level pass; transport/immigration gate |
| `YES2-C008` | The US stage ended exactly 4 February 1923 | `QUALIFIED` | Academic references differ between leaving New York on 3 February and a US-period endpoint on 4 February; use 3–4 February | US day-level pass |
| `YES2-C009` | Return to Moscow instantly ended the Duncan relationship | `FALSE-MYTH / REDUCTIVE` | Physical separation developed after 3 August while correspondence continued | 1923 ledger |
| `YES2-C010` | Yesenin immediately returned to the old Imagist order | `FALSE-MYTH` | Old contacts resumed unevenly; literary, commercial and personal networks had changed | 1923–1924 ledgers |

## 3. Work and publication claims

| ID | Claim | Status | Safe reader formula | Controlling ledger / gate |
|---|---|---|---|---|
| `YES2-W001` | `Страна Негодяев` was created from zero in America | `FALSE-MYTH` | The project and work predate the US trip; Berlin and New York are later development stages | foreign work matrix; US pass |
| `YES2-W002` | Berlin books contain works written in Berlin | `FALSE AS GENERAL RULE` | Berlin was a publication centre; most included poems predated travel | 1922 ledger; author-book register |
| `YES2-W003` | Every announced translation appeared | `FALSE / UNPROVEN` | Translation and publication must be verified item by item; several projects remained plans | foreign work matrix |
| `YES2-W004` | Yarmolinsky published the planned English book | `HOLD / UNPROVEN` | A New York mock-up/project was handed over; completion and publication are not established | US pass |
| `YES2-W005` | `Железный Миргород` was written as an American travel diary | `FALSE-MYTH` | It processes American experience but the known autograph is dated Moscow, 14 August 1923 | 1923 ledger |
| `YES2-W006` | `Пугачев` belongs only to the foreign-period story | `FALSE-MYTH` | Work, readings, completion and first physical edition form the creative spine of 1921 | 1921 ledger |
| `YES2-W007` | `Москва кабацкая` was a 1923 physical book | `FALSE-MYTH` | Several projects failed; the physical Leningrad book appeared by July 1924 | 1924 ledger |
| `YES2-W008` | The July 1924 contents page proves all listed poems were printed in the body | `FALSE-MYTH` | The contents preserve names of texts removed by censorship; body and contents require comparison | 1924 ledger; physical-book gate |
| `YES2-W009` | `Анна Снегина` appeared as a separate author book in 1925 | `FALSE-MYTH` | The poem was completed in Batum and published, but the planned standalone book was unrealised | Jan–Nov 1925 ledger |
| `YES2-W010` | The late-May `Персидские мотивы` book is the final complete cycle | `FALSE-MYTH` | The book preceded the final four poems completed in Baku/Mardakan in August | Jan–Nov 1925 ledger |
| `YES2-W011` | Yesenin wrote the Persian cycle in Persia | `FALSE-MYTH` | The cycle was written in the Caucasus and through literary/imaginative Persia; the planned Persian journey was not completed | 1924/1925 ledgers |
| `YES2-W012` | The three-volume collected works was published in 1925 | `FALSE-MYTH` | Contract and manuscript preparation belong to 1925; proofs and publication were posthumous in 1926 | Jan–Nov 1925 ledger; contract |
| `YES2-W013` | `Черный человек` was written in the clinic | `FALSE-MYTH` | Work extended over roughly two years; the surviving final version was completed 14 November before clinic admission | Jan–Nov 1925 ledger |

## 4. Imagism and public-role claims

| ID | Claim | Status | Safe reader formula | Controlling ledger / gate |
|---|---|---|---|---|
| `YES2-I001` | The Imagists invented Yesenin's poetics | `FALSE / REDUCTIVE` | The movement supplied infrastructure and collective polemic; Yesenin's poetics had independent roots and later divergences | Imagism gate; Part I |
| `YES2-I002` | The first Declaration was released in `Сирена` on 30 January 1919 | `FALSE AS WORDED` | The issue bears 30 January but appeared in April; `Советская страна` no. 3 on 10 February was first released | Imagism gate |
| `YES2-I003` | The two Declaration texts are identical | `FALSE` | The newspaper and journal witnesses contain variants; both physical issues are required | Imagism gate |
| `YES2-I004` | Imagism ended everywhere on 31 August 1924 | `FALSE / REDUCTIVE` | Yesenin and Gruzinov declared dissolution; other Imagists disputed their authority and networks dissolved unevenly | 1924 ledger |
| `YES2-I005` | The hooligan persona was only marketing | `PARTLY-TRUE` | The role had publicity and market value, but real dependence, incidents and harm are documented | `Москва кабацкая` article; 1923 ledger |
| `YES2-I006` | Cafe accounts prove that Yesenin personally consumed every item | `FALSE-METHOD` | Accounts prove financial/cafe relations; individual consumption requires separate evidence | 1923 ledger |

## 5. Relationship and editorial-labour claims

| ID | Claim | Status | Safe reader formula | Controlling ledger / gate |
|---|---|---|---|---|
| `YES2-R001` | Benislavskaya was merely a muse or rejected lover | `FALSE / REDUCTIVE` | Letters and documents show manuscript, contract, money, correction, family and publisher work alongside emotional asymmetry | Benislavskaya pass 26 |
| `YES2-R002` | Exactly 35 letters from Yesenin survive | `FALSE AS WORDED` | The academic inventory counts 35 letters, notes and telegrams, one separate inscription and 14 known reverse letters | Benislavskaya pass 26 |
| `YES2-R003` | The project has fully acquired all 14 reverse letters | `FALSE` | The required pages remain source-gated and unacquired | issue #200; Benislavskaya pass |
| `YES2-R004` | Benislavskaya's published diary is the original autograph | `FALSE` | The published tradition is copy-based; the autograph's location is not established | Benislavskaya pass |
| `YES2-R005` | Miklashevskaya can be reconstructed directly from the printed order of `Любовь хулигана` | `FALSE-METHOD` | The relationship and cycle belong to the post-return period, but printed order is not a composition calendar | 1923 ledger |
| `YES2-R006` | Sofia Tolstaya's marriage saved Yesenin | `UNPROVEN / REDUCTIVE` | Marriage, secretarial work and preservation are documented; stability or recovery cannot be inferred from the legal act | Jan–Nov 1925 ledger |
| `YES2-R007` | Sofia independently created the collected-works chronology | `FALSE / REDUCTIVE` | She copied and dated important texts; Yesenin selected, corrected and retained organising principles | Jan–Nov 1925 ledger |

## 6. Legal and medical claims

| ID | Claim | Status | Safe reader formula | Controlling ledger / gate |
|---|---|---|---|---|
| `YES2-L001` | All late legal incidents form one “hooligan case” | `FALSE` | September 1923 cafe case, November 1923 four-poets case, 1924 cases and September 1925 train case are distinct files | yearly ledgers |
| `YES2-L002` | A police act proves conviction | `FALSE-METHOD` | It proves an accusation/documented procedure; conviction requires the court outcome | 1923/1925 ledgers |
| `YES2-L003` | Clinic certificate no. 1037 proves a complete psychiatric diagnosis | `FALSE` | It states treatment since 26 November and incapacity for questioning; it is not a case history | Jan–Nov 1925 ledger |
| `YES2-L004` | Yesenin was treated from 26 November to 21 December | `VERIFIED-FOR-DRAFT / MECHANISM HOLD` | Academic comments establish the stay; formal discharge/self-discharge mechanism remains unacquired | December matrix |
| `YES2-L005` | Leaving the clinic proves a predetermined death plan | `UNPROVEN` | The final move requires medical, family, transport and witness evidence; no single motive is established | December matrix |

## 7. Final-days and death claims

| ID | Claim | Status | Safe reader formula | Controlling ledger / gate |
|---|---|---|---|---|
| `YES2-D001` | Yesenin arrived in Leningrad on 24 December and stayed at `Англетер` | `VERIFIED-FOR-DRAFT` | Academic comments and early witnesses place arrival/stay on 24 December | December matrix; hotel records still needed |
| `YES2-D002` | He was completely alone for four days | `FALSE-MYTH` | Multiple named visitors and contacts are recorded, though their exact times require a witness matrix | December matrix |
| `YES2-D003` | The 27 December power of attorney proves he could not have intended death | `FALSE-METHOD` | It proves a practical future-oriented act, not a complete psychological state | December matrix |
| `YES2-D004` | `До свиданья...` was written in blood | `VERIFIED-FOR-DRAFT` | Early witnesses and a 1992 microspectral conclusion support blood as the writing medium | final-poem source card; lab report still to acquire in full |
| `YES2-D005` | The poem is an unquestioned legal suicide note addressed to Ehrlich | `UNPROVEN / REDUCTIVE` | It was handed to Ehrlich on 27 December and read on 28 December; the manuscript does not define its legal/psychological function | December matrix |
| `YES2-D006` | The official suicide version has no documents | `FALSE` | Initial inspection, forensic act and official conclusion form a real documentary corpus | December matrix |
| `YES2-D007` | Procedural gaps prove murder | `FALSE-LOGIC / HOLD ON INDIVIDUAL QUESTIONS` | Gaps may justify investigation but are not positive homicide evidence | December matrix |
| `YES2-D008` | Every alternative question is dishonest because an official act exists | `FALSE / REDUCTIVE` | Individual claims must be tested against original records, photographs and expert work | December matrix |
| `YES2-D009` | Retouched published photographs are adequate for forensic inference | `FALSE-METHOD` | Original negatives/photographs and expert provenance outrank copies of copies | December matrix |
| `YES2-D010` | The final manner of death explains the whole 1921–1925 biography | `FALSE / REDUCTIVE` | The conclusion must arise from the four-year documentary arc, not one night | detailed outline |

## 8. Moral and theological claims

| ID | Claim | Status | Safe reader formula | Gate |
|---|---|---|---|---|
| `YES2-M001` | Artistic confession equals repentance | `FALSE-THEOLOGICAL INFERENCE` | Poetry can reveal shame, fear or self-knowledge without documenting repentance and durable change | theological guidelines; text-by-text analysis |
| `YES2-M002` | Religious language proves conversion | `FALSE-THEOLOGICAL INFERENCE` | Biblical and church language requires contextual literary analysis and cannot substitute for confession/fruit evidence | theological guidelines |
| `YES2-M003` | Talent or sensitivity reconciles a person to God | `FALSE` | Gift and moral/spiritual state must remain distinct | project charter |
| `YES2-M004` | The article can declare the unknowable final instant | `FALSE` | It may assess documented words, life pattern and known evidence while refusing invented final conversion or omniscience | project charter |
| `YES2-M005` | Addiction removes all responsibility | `FALSE / REDUCTIVE` | Illness/dependence matter causally and compassionately; they do not erase choices, harm and repeated refusal of limits | theological/editorial guidelines |

## 9. Authoring gate

Before a claim enters reader prose:

```text
□ exact source ID exists
□ exact page/item/URL is pinned
□ source class is visible in drafting notes
□ quotation is checked against the page
□ independent corroboration is identified when required
□ safe formula does not exceed the evidence
□ myth verdict matches the rubric
□ visual does not imply stronger proof than the text
□ moral/theological conclusion follows the documented event
```

## 10. Priority page-pinning queue

1. 1921 Chronicle volume 3 pages for Turkestan/`Пугачев`/Duncan transition.
2. Berlin programmes and European route items.
3. US transport/immigration and city-by-city tour records.
4. 1923 Duncan/Miklashevskaya/Benislavskaya letter pages.
5. Physical `Москва кабацкая` and censorship witnesses.
6. 31 August/9 September Imagist documents.
7. Caucasus letters and first editions, including final Persian-cycle matrix.
8. Benislavskaya reverse-letter pages 236–280.
9. 1925 contracts, marriage registry, train-case pages and medical file.
10. December clinic, transport, hotel, power of attorney, poem, inquiry and forensic files.

## 11. Gate status

- [x] high-load claims separated from narrative prose;
- [x] safe formulas and prohibited shortcuts recorded;
- [x] myths, legal cases, medical evidence and theology integrated;
- [x] December claims given their own evidence hierarchy;
- [ ] exact article source IDs/page ranges assigned;
- [ ] all `HOLD` rows either resolved or omitted;
- [ ] reader prose not opened until chapter-level source coverage is sufficient.
