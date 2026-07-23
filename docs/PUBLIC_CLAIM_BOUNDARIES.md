# Public historical claim boundaries

The public longreads deliberately distinguish verified facts, attributed conclusions, archive targets and unresolved claims. This contract is enforced by `npm run validate:public-claims` and complements the broader literary-style and citation validators.

## Sergei Yesenin

- Use the documented school name: **Spas-Klepiki second-class teacher-training school**, noting that it belonged to the ecclesiastical department. Do not replace it with the generic phrase “church-teacher school”.
- The First Moscow State University clinic period is documented as 26 November–21 December 1925, and certificate no. 1037 is a separate document. The full medical history is identified as IMLI, fond 32, opis 2, storage unit 37, but its pages have not yet been acquired in the working corpus.
- Until that medical file is page-verified, public prose must not assert whether every exit was authorized or whether 21 December was a formal discharge or an unauthorized departure.
- Published commission materials attribute the handwriting of “До свиданья, друг мой…” to Yesenin and identify the writing material as blood. The accessible review does not establish that the blood belonged specifically to Yesenin. Do not write “his own blood” as a re-verified fact.
- The commission and prosecutorial publications regard suicide as the best-supported conclusion, but the complete expert reports and appendices remain a page-verification target in issue #49.

## Vladimir Mayakovsky

- The “20 years of work” exhibition was not empty: the documented opening audience was substantial, while the lack of expected recognition from parts of the professional literary establishment is a separate fact.
- Currency-transfer and export applications are not a passport or visa-refusal file. Do not state that Mayakovsky was denied a visa or forbidden to travel in 1929 without the missing primary document.
- The seven published letters to Tatyana Yakovleva derive from typescript copies transmitted through Roman Jakobson and contain omissions made by Yakovleva. Do not describe them as seven complete verified autographs.
- The final letter “Всем” is reproduced as two leaves/three written sides in the scholarly publication. The one-leaf RGALI witness in S. A. Tregub's fonds is a separate witness unless its archival card proves otherwise.

## Enforcement

`validate-public-claims.ts` scans rendered essay blocks rather than source-card prose. It currently protects the highest-risk statements while issue #49 remains the canonical page-verification backlog.

A source card, search result, OCR-only text or catalogue entry does not upgrade a claim to page-verified status. Every relaxation of these boundaries must be accompanied by the acquired primary pages and a corresponding update to issue #49.
