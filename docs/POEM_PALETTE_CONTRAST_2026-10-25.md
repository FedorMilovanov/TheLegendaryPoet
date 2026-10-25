# Poem surface ownership / dark-island follow-up

Base: `main@033299b943484ed2c2f50221a03a1d7d3cdef3c5` (merged #524).
Scope: published poem palettes, not new article prose, artwork or museum work.

## Reproduced defect and owner

The `blood` poem variant retains `#0a0505` in both page themes but was not
registered as an explicit dark island. The global light `.poetry-text` adapter
therefore painted dark ink on that background. The #524 generic year metadata
also followed the surrounding light page rather than its own dark surface.

Witness: `/essays/yesenin-kutezhi`, last Yesenin poem, desktop 1440×1000 and
mobile/isMobile 390×844. Initial light-year contrast: **2.881:1** (requires 4.5).
Axe also measured desktop body text at **1.37:1**, below even the large-text 3:1
threshold. These are actual local production-build failures, not a hypothesis.
Four permanent tests were added before repair: **2 PASS / 2 FAIL** (both light
contexts failed on year contrast). No thresholds or gates were relaxed.

## Shared repair, no route patch

- The palette registry `src/components/essay/theme.ts` declares the existing
  `theme-dark-island` on the dark variant and owns its year ink role.
- `PoemBlock` consumes that palette role, rather than assuming all poem years
  belong to the surrounding page theme.
- The legacy light `.poetry-text` adapter respects the existing dark-island/Hall
  isolation boundary, as the neighboring legacy adapters already do.
- No new color values, second renderer, dependency, workflow or special selector
  for Yesenin. Existing red palette and historical text remain unchanged.

All poem blocks consume this registry. The CSS boundary also protects poetry
inside other explicit dark islands; ordinary page-theme poetry still adapts.
No data migration. Roll back the bounded commit to restore previous behavior.

## Evidence

- Clean baseline: npm ci/check/build and project contracts PASS.
- Four new rendered-color tests PASS after repair. Each compares both the dark
  variant and an ordinary poem on the same published page, checks headings,
  year/badge, text and note >=4.5:1, and repeats after a **real UI theme switch**
  without reloading. Desktop and mobile are explicit; reduced-motion is on.
- Separate axe probe on the dark poem: zero automatic color-contrast violations
  in all four theme/viewport contexts after repair. Incomplete counts remain:
  desktop 2 (gradient emphasis), mobile 4 (also body/note). Body/note rendered
  foreground/background ratios are independently covered by permanent tests;
  gradient emphasis is not falsely classified as fully machine-certified.
- Light desktop/mobile poem screenshots visually inspected: title, year, body,
  emphasis and note remain painted and readable without horizontal overflow.
- Local unthrottled samples: LCP 564–592ms; CLS 0.000455–0.001159. These are
  four diagnostic samples, not field statistics or new performance thresholds.
- Fonts loaded in all four cases, zero pageerrors, zero horizontal overflow.
  Browser console retains 1–2 resource ERR_CONNECTION_CLOSED messages per case;
  no whole-page network/media certificate is claimed. No images intersected
  the focused poem viewport, so its image list is not a whole-site decode proof.
- Final check, build, build-output budgets, 92 Node tests, 4 TS tests and project
  contracts PASS. Discovery generators run; no manifest change was needed.
- Full previous 8-context metadata regression plus these four cases are run
  together; final count/status is recorded in the PR, not assumed here.

## Production / limits

GitHub Pages run `40206470982` on base main passed, including custom-domain
release proof. This confirms #524 deployment, not deployment of this new repair.
Native Safari, gradient pixel-level certification and production proof of this
new commit remain for subsequent exact-head review/CI. Browser tools live outside
project dependencies; raw screenshots/results are ignored in
`qa-artifacts/poem-palette/`. Initial missing-test-filter harness error was fixed
by selecting the intended spec; no production code was changed to accommodate it.

Do not merge automatically. #497 human Turnstile proof, #519 issue disposition,
branch deletions and AuditRepo closure remain untouched.
