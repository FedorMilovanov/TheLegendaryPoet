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

## Follow-up: opaque emphasis on ordinary light reader surfaces

Base for this follow-up: `e75cb0c5a595547791b10575364be8928c1b1ec4`.
The inherited `color` ratio does not describe a gradient-clipped text span with
transparent `-webkit-text-fill-color`. Inspecting the first ordinary poem on
`/essays/yesenin-kutezhi` showed pale gradient text on the light background;
computed fill was transparent and the legacy brightness/contrast filter remained.
Before/after desktop screenshots were inspected. No exact baseline WCAG ratio
for every gradient pixel or animation phase is claimed.

The shared `withGold` renderer now marks semantic reader emphasis with
`theme-essay-emphasis`; the existing theme stylesheet owns its light appearance.
Ordinary light surfaces use opaque `--tlp-poet-accent` ink with no gradient,
filter, text shadow or animation. Dark page surfaces and explicit dark islands
retain the existing gradient. This is deliberately not a global `.gold-gradient`
replacement: decorative site branding and unrelated controls are untouched.
Every paragraph/quote/poem using `withGold` receives the same semantic role.
No article prose, new palette, dependencies or workflow edits.

The four existing palette tests were strengthened before the fix: **4/4 FAIL**
when they reach light mode, including initial dark → light UI transitions.
After repair: **4/4 PASS**. They now check the actual text fill, absence of the
ordinary light gradient, rendered contrast >=4.5:1, and retention of the dark
island gradient after both theme transitions. This closes the inherited-color
false-assurance gap without inventing a general gradient contrast algorithm.

A focused axe probe still reports zero automatic violations but retains its
incomplete results: 5 nodes per dark context, 6 per light context. Those counts
are not relabeled PASS or presented as reduced by this fix. The solid-light ink
is independently checked by rendered-color browser assertions. Computed light
fill is `rgb(122, 77, 0)`, background-image/filter are `none`.
Raw before/after probes remain ignored under `qa-artifacts/emphasis/`.
Local final check/build/budget/contracts and 92 Node + 4 TS tests PASS.
Rollback of this follow-up is a separate bounded revert from the palette repair.
The combined 12-case result and exact remote CI status are reported in the PR.

## Follow-up: editorial gradient surfaces and section-heading paint

Base: `a993aec7121db512e8a54d783e20fda20320f4f4` (previous local
check/build/contracts green). Shared ReflectionBlock and MythNoteBlock had no
explicit surface owner. In light mode the legacy `to-[#050505]` adapter made
the last gradient stop transparent, exposing the light page beneath pale text.
The `/essays/brik-case` reflection screenshot visibly reproduced the defect;
`/essays/sergei-yesenin-1921-1925` supplied the published myth witness. This
is not eight separate reproduced contrast failures: the eight RED cases fail
the shared dark-surface/opaque-backing contract across two themes/viewports.

Both renderers now consume existing `theme-dark-island` and explicit #050505
backing. Myth origin/document labels use existing muted island ink. SectionBlock
headings consume existing `theme-essay-emphasis`, making their light glyph paint
opaque instead of only measuring inherited color. All essays using these shared
renderers receive the fix; no route override, prose/media edit, dependency,
workflow change or new color role. No published reflection/myth text currently
has bold markup; no hypothetical bold failure is claimed as baseline evidence.
Rollback is a bounded revert of this follow-up; no data migration.

Eight permanent editorial tests: **8 FAIL before / 8 PASS after**. They enforce
explicit opaque backing, dark color scheme and solid text's >=4.5 ratio against
the composited base. That helper does not sample gradient pixels or decorative
blur layers; these assertions are not a per-pixel WCAG certificate. Four poem
cases additionally cover actual light section-heading fill and real UI theme
transitions, retaining dark-island gradients.

Desktop light after screenshots of reflection/myth were visually inspected.
The pale page no longer leaks through the reflection; myth claim/origin/body
remain visible on a dark frame. Focused axe remains zero automatic violations,
with **unchanged incomplete nodes**: headings 2 each, reflection 4, myth 9.
No axe closure is claimed. The guessed second-route reflection heading was
absent and is explicitly NOT a checked witness. Raw baseline/after evidence is
ignored under `qa-artifacts/reader-surfaces/`.

First combined run: **19 PASS / 1 timeout** (desktop dark articles metadata,
45s) while a separate browser probe also ran. Cause is not conclusively proven;
isolated desktop+mobile dark articles recheck: **2 PASS** without changed
thresholds/timeouts. A fresh serial combined run is recorded separately in PR.
Local final check/build/build-output budgets/contracts and **92 Node + 4 TS**
tests PASS. Native Safari, exact-head remote checks, production deployment and
whole-page console/media/performance certification are not inferred from these
focused local results. PR #525 remains draft and unmerged.

Fresh serial combined run: **20/20 PASS, no retries (5.6m)**. Explicit 390×844
isMobile light reflection/myth screenshots also inspected: text wraps within
both dark frames. Focused mobile axe returns zero automatic violations; its
incomplete results remain unresolved, not relabeled as accessibility success.
