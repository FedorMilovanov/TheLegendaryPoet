# Revalidation — 2026-10-22

## Scope and baseline

Source baseline: `f0467b86370a7abf41b85e9653f981d6de1219ce`, clean session
branch `arena/435210b5-thelegendarypoet`. This is bounded source-branch
verification, not production closure or a whole-project accessibility certificate.
No architecture lane, publication decision, dependency or CI policy changes.

Fresh baseline passed: `npm ci`, project contracts, `npm run check`, build,
prerender, build-output and SEO validators; Prorok draft tests 4/4;
`qa/reader-text.spec.mjs` + `qa/theme-contrast.spec.mjs` 55/55, retries 0.
Historical lazy-route offline failure did not reproduce: 6/6 passes,
reduced-motion/no-preference × three repetitions, retries 0.

## Shared Breadcrumbs repair

Root: fixed translucent cyan utility colors in
`src/components/seo/Breadcrumbs.tsx` bypassed theme-semantic text/control tokens.
Dark article links measured 4.08:1; a new test first failed on the privacy page's
Home link at 4.124:1 (required 4.5:1). The initial test fixture `/about` had no
breadcrumbs; it was corrected to `/privacy` before capturing the contrast failure.

Repair: use existing functional-muted and control-action tokens, including the
existing focus-ring token. No page patches or new token system. Decorative
chevrons stay aria-hidden. All component consumers inherit the repair: essay,
poet, track detail, privacy and editorial-policy pages, including error branches.

Regression: four contexts (dark/light × 1440×1000 desktop/390×844 mobile),
privacy + Yesenin II article. Assert all breadcrumb links/current-page text
≥4.5:1, hover/focus link text ≥4.5:1, focus indication ≥3:1, and Enter navigates
Home. Fresh combined reader/theme suite: **59/59**, retries 0 (2.7 minutes).
Build, check, project contracts, prerender, build-output, SEO and Prorok 4/4
passed after the repair. `git diff --check` passed.
Rollback boundary: shared component styling and its new regression block only;
no content/data migrations. The test must remain strict if styling is revised.

## Browser evidence and remaining signals

Yesenin II, full-body axe, same four contexts, before → after affected-node counts:

| Context | Color contrast | Other violations after |
| --- | ---: | --- |
| Dark desktop | 89 → 87 | label-content-name-mismatch 2; landmark-unique 1 |
| Dark mobile | 71 → 69 | label-content-name-mismatch 1 |
| Light desktop | 110 → 110 | label-content-name-mismatch 2; landmark-unique 1 |
| Light mobile | 67 → 67 | label-content-name-mismatch 1 |

Counts are not independent root causes. Broad axe is **not green**. Before-fix
contrast incomplete-node counts were 126/132/141/144; incomplete is not PASS.
Screenshots of breadcrumb/article top inspected in all four contexts: text
readable, mobile wrapping intact. No horizontal overflow or page exceptions
in any context before or after. The blank hero was initially misattributed to external artwork delivery. The
later byte/decoder audit below confirms a truncated **local** cover; sandbox
egress is not its cause. This supersedes that earlier interpretation.

After-repair unthrottled local LCP: 816/372/656/268 ms in the table order;
CLS: 0.000968806/0/0.000968806/0. Baseline LCP was 332/272/344/268 ms.
These are noisy individual local samples, not field CWV or causal performance
claims. Wikimedia requests fail in the restricted sandbox; console network
errors are not silently classified as application exceptions or production bugs.

At this breadcrumb-only checkpoint, other contrast nodes, search visible-name
mismatch, duplicate unnamed navigation and conditional image-error-button name
mismatch remained unresolved. Header signals are addressed in the next section.
Ordinary prose/citation targeted tests passing does not close these signals.

Environment: Node 22.22.3; Chromium 149 with NSS compatibility shim, not the
exact native CI browser/platform. Native WebKit, assistive technology and field
performance were not re-certified. Ignored raw evidence/harness/logs/screenshots:
`qa-artifacts/revalidation/` (not committed).

## Shared Header follow-up

Root: the desktop navigation had no landmark name, and the visible search label
`Ctrl K` was absent from the button's accessible name. Repaired only in shared
`src/components/Header.tsx`: `Основная навигация` and `Открыть поиск — Ctrl K`.
Desktop instances across all routes inherit this; mobile dock naming is unchanged.

A new regression first failed on the unnamed navigation. Two theme scenarios
now assert navigation/search names, visible shortcut text, opening search,
combobox autofocus, Escape close and focus return. Existing strict search
selectors and the app-shell validator now require the new exact name; no
counts, thresholds, layout checks or shortcut guarantees were removed.

An intermediate parenthesized name passed the DOM-name test but still failed
axe (its label matching excludes parenthetical text); the final dash-separated
name clears the actual full-body rule. This illustrates why name-string tests
alone do not certify label-in-name compliance.

The first check exposed a stale discovery manifest because Header is a hashed
global discovery authority. Regenerated using the existing sitemap/feed scripts;
only `public/discovery-manifest.json` changed. The second check exposed the old
exact search-name contract; updated that exact expectation, not the guard logic.
Final contracts/check/build/prerender/build-output/SEO pass; Prorok 4/4 pass.
Final reader/theme/floating-chrome suite: **62/62, retries 0**, 2.7 minutes
(61 reader/theme + one floating-chrome test). The earlier in-flight run is not
the final evidence; final run used the stable rebuilt source.

Final full-body axe: contrast nodes 87/69/110/67 remain; label mismatch is now
one per context (conditional external-image failure state), landmark-unique is
absent in all four contexts. Page exceptions and overflow remain zero.
Latest local LCP 508/480/644/492 ms, CLS 0/0/0.000968806/0; same caveats above.
Screenshots re-captured; dark desktop/light mobile re-inspected after Header
changes, with no visual search-label/layout changes. Remaining broad contrast,
conditional image-error name and incomplete results are not closed.
Rollback: Header attributes, strengthened exact-name tests/validator, generated
discovery fingerprints; no schema migration, new engine or architecture lane.

## Dependencies and owner decisions

Fresh npm audit: six affected package entries, five high/one moderate; these
are not six independent advisories. Production-only audit: one moderate,
zero high. Open PR #514 covers lockfile-only fflate updates, not every current
dev/build advisory. No dependency changes, forced fixes or merges performed.

Prorok remains unpublished. Passing draft/source checks are not independent
biblical/theological approval. Human Turnstile/community evidence (#497), rights
and editorial publication authority remain owner decisions. No project-completion
percentage or blanket WCAG conclusion is warranted.

## Merge-readiness follow-up

Final CI for `83ab238` is **not green**: `browser-qa` failed in
`Run base iPhone Safari QA in fresh browser processes`; its Chromium/Android
step passed. The other 11 checks succeeded, four were expected skips. This
supersedes the earlier pending status, not the passing local Chromium evidence.

GitHub annotations initially exposed only exit 1. Both job/run log delivery
redirected to an unavailable results-receiver host; artifact delivery redirected
to unavailable Azure blob storage. The public job page requires sign-in for logs.
No failed test identity or root cause can honestly be inferred from that alone.

Add a supplemental Safari failure reporter: final unexpected/flaky outcomes
become escaped, size-bounded GitHub annotations, retaining the existing line
reporter, tests, process isolation, retries, fail-on-flaky policy and exit code.
No workflow file changes. Unit tests 5/5; real Playwright smoke intentionally
failed at 4.08<4.5 and returned exit 1 plus the expected annotation. Full `check`
and project contracts passed. This is diagnostic coverage, **not a Safari fix**;
merge remains blocked until the actual failure is understood and reverified.

## Deterministic image-error repair

Forced image requests to fail on Yesenin II, independent of sandbox Wikimedia
availability. The new regression first failed because the image button's name
omitted the visible `Изображение временно недоступно` label. Shared owner:
`src/components/essay/blocks.tsx`, all essay image blocks. Append that label only
in error state, retaining the enlarge action and alt description. Use existing
dark-island muted tokens on the fixed-dark fallback surface instead of 45% gray.
No image/source/rights replacement, retry policy or dialog ownership changes.

Four regressions (dark/light × desktop/mobile) verify error state, visible-label
name inclusion, text ≥4.5:1, Enter/lightbox focus, Escape/focus return. All four
pass. Final reader/theme/floating-chrome/lightbox suite: **67/67, retries 0**,
3.4 minutes. Check/build/prerender/output/SEO/contracts and Prorok 4/4 pass.
Four forced-error screenshots inspected; page exceptions and overflow zero.
Fallback colors #a9c6d1 on #0d0d0d give 10.81:1. Full-body axe in this forced-error
scenario reports only color-contrast (86/69/83/73 affected nodes), no label-name
mismatch or landmark-unique. These forced-error counts are not comparable to the
previous natural-loading samples; broad contrast/incomplete results remain open.
Rollback boundary: shared image-button name/error text styling and its regression
block only. Successful-load names and enlargement behavior stay unchanged.

## Confirmed initial-scroll race

Supplemental annotations on `cbf27d4` exposed the Safari failure:
`qa/reader-journeys.spec.mjs:166`, article-bounded progress, final **flaky** outcome.
First attempt expected physical scroll 957px but observed 0 after five seconds;
retry passed and strict fail-on-flaky correctly kept the job red. Chromium/Android
passed. This is not a reason to raise timeouts or accept the retry as green.

Shared `SmoothScroll` scheduled initial POP restoration on an animation frame;
its empty position map fell back to zero even if the reader had already moved.
A deterministic harness executes the actual transpiled component with persistent
refs/effect cleanup and a held frame: before repair, scroll 957→0 fails; after
repair, 957 is preserved. Initial non-hash POP now performs no redundant restore.
Later PUSH reset, saved POP restoration and initial hash/header-offset behavior
remain covered and pass (3/3); the existing scroll validator runs this harness
as part of `npm run check`. No changes to progress geometry, native-scroll/event
assertions, timing thresholds, retries or fail-on-flaky policy.

Post-repair local reader/theme/floating-chrome/lightbox/journeys suite: **72/72**,
retries 0, 3.6 minutes. Problematic progress scenario: desktop/mobile Chromium ×
five repeats, **10/10**, retries 0. Node unit regressions 3/3, reporter tests 5/5;
check/build/prerender/output/SEO/contracts and Prorok 4/4 pass. Native WebKit on
the new source SHA still requires CI confirmation; these are not Safari results.
Rollback boundary: the initial-frame guard and coordinator regression harness/
validator integration; no replacement scroller, observer or navigation engine.


## Newly verified baseline image-integrity blocker (#519)

**Full visual readiness is not established**, even if the scoped CI turns green.
A byte audit of 18 local public WebPs found four RIFF length mismatches;
ImageMagick independently fails to decode all four with insufficient image data:

| File under public/images/essays | Actual bytes | Declared RIFF total | Use |
| --- | ---: | ---: | --- |
| yesenin/yesenin-part-2-editorial.webp | 15008 | 46000 | Live hero/card |
| briks/lilya-brik-1914.webp | 15008 | 62320 | Live body portrait |
| briks/osip-brik-1928.webp | 15008 | 39200 | Live body portrait |
| briks/brik-archive-hero.webp | 14627 | 92216 | No current source reference found |

These are existing baseline files, not introduced by this PR. The remaining
14 matching container lengths are not a complete decode certificate. The Yesenin
cover is local, so its blank rendering must not be blamed on Wikimedia egress.
Its current approved SHA-256 matches the truncated file: hash identity alone did
not certify usable image bytes. Existing check/build guards did not detect this.

GitHub blob 3078009a82279de01f1d27d8b031137e71852002 independently yields the same
15008 bytes/hash. All seven #415 commit states and its merge have that blob;
no complete version was recovered there. Targeted Drive image-name searches
found research images but not the approved mature-Yesenin desk-portrait source.
No unrelated private image was downloaded or published.

Durable recovery/closure conditions are in Product #519. Needed: the complete
owner-approved original/backup or its exact file location; then verified encode,
deliberate integrity-pin updates and a shared decode/container guard. The Brik
portraits require recovery from their existing attributed source identities.
No padding, guessed tail bytes, regenerated lookalike or silent hash/approval
replacement was performed. Artwork/provenance authority remains unchanged.
Native CI for the scroll repair must also finish; local passing checks do not
close either the Safari verification boundary or this image-integrity blocker.

## Shared image metadata contrast follow-up

Fresh clean baseline `e487564`: install/contracts/check/build pass. Exact-head
CI now confirms browser-qa (including base Safari), premium iPhone, WebKit home,
analytics and reader checks pass. Brand-raster remains **not certified**: its job
hit the 24-minute timeout during FFmpeg installation, before project dependencies
or image/browser checks ran. It is not a failed brand pixel assertion. A failed-job
rerun request was rejected; no rerun success, workflow change or timeout increase
is claimed.

Root: shared ImageMeta and image-lightbox captions/credits/source controls used
low-alpha fixed gray/gold/white colors. New regression first failed at 3.194:1.
Use existing semantic page tokens inline and existing fixed-dark island tokens
in the lightbox. Source focus rings use the matching existing tokens. No image,
caption, credit, source URL, rights or publication data changed.

Four contexts (dark/light × desktop/mobile) on Yesenin II and Brik essays assert
all image metadata text ≥4.5:1, source hover/focus text ≥4.5:1, focus ring ≥3:1,
external-link attributes, lightbox caption/credit text, Escape and focus return.
The non-text test color parser now converts valid OKLab colors through canvas,
like the existing text parser; unsupported values still fail, ratios are not
skipped. Final reader/theme/overlay/journeys suite: **76/76, retries 0**. Check,
build, prerender, output/SEO, contracts, Node 28/28 and Prorok 4/4 pass.

Same-harness Yesenin II full-body axe contrast nodes before→after:
dark desktop 87→23, dark mobile 69→5, light desktop 110→46, light mobile 67→3.
Lightbox-scoped violation counts 3/2/2/0→0/0/0/0; incomplete checks are not PASS.
Eight inline/lightbox screenshots inspected; page exceptions/overflow zero.
Images remain unavailable in these lightbox samples: text/controls verification
is not image-decoding proof. Screenshots also expose a separate clipped overlay
geometry problem; stack/focus tests alone did not certify full-viewport coverage.
Local unthrottled LCP before 704/276/740/268 ms, after 356/272/760/244 ms;
CLS unchanged 0.000968806/0/0.000968806/0. These are samples, not field CWV claims.
Rollback: shared image metadata classes and their four regressions; no new token
system or architecture lane. Remaining contrast, overlay geometry and #519 stay
explicitly open. Raw ignored evidence: `qa-artifacts/continuation/`.

## Follow-up 2026-10-23 — shared image viewer viewport containment

- **Root / owner:** `ImageBlock` rendered its fixed lightbox inside a transformed
  `Reveal` and the article stacking context. A new real-browser geometry test
  failed before repair: viewport-edge offsets `[324,86,-188,-71]`, not zeros.
  All shared essay image blocks use this owner; no article-specific overrides.
- **Repair:** portal the existing `AnimatePresence` to `document.body`, mark the
  fixed motion root `layoutRoot`, retain the fixed-dark text island, and use
  layer 110 below the existing command palette's 120. `useDialogSurface` remains
  the sole lifecycle/stack/focus owner. No workflow or overlay-runtime changes.
  Rollback is confined to the shared image viewer and its regression coverage.
- **Touch finding:** the first desktop/mobile run passed 5/8; three mobile
  backdrop taps closed the viewer but lost restored opener focus. Preventing
  the backdrop pointer-down default prevents its compatibility mouse event
  from stealing focus; no delayed-focus workaround or weaker assertion added.
  A diagnostic locator was also corrected to read the viewer layer before
  nested search makes that inactive dialog inaccessible, as intended.
- **Final browser verification:** 8/8 explicit desktop/mobile × dark/light ×
  reduced/full-motion cases, retries 0; then 80/80 theme, reader text, floating
  chrome, lightbox stack and reader journeys, retries 0. Tests check decoded
  fixture media, actual viewport bounds, nested search layer and hit testing,
  Escape back to viewer, real corner backdrop click/tap, restored focus/scroll,
  empty overlay stack, and zero page/console errors. The four new test cases
  inherit native CI project device settings rather than forcing desktop.
- **Visual / diagnostics:** inspected four settled modal screenshots (1440×1000
  and 390×844, both themes). Controlled Wikimedia interception uses an existing
  decodable local image solely as a geometry fixture; it is **not** recovered
  production artwork or publication/source evidence. Four-context probe: no
  overflow, page errors or console errors; modal axe violations 0 in each,
  but color-contrast incomplete nodes 3 in each are **not PASS**. Strict caption
  contrast regressions remain passing. Local unthrottled LCP 748/272/448/276 ms
  and CLS 0.000968806/0/0.000968806/0 (dark desktop/mobile, light desktop/mobile)
  are controlled-fixture diagnostics, not field metrics or comparable to the
  earlier network-failing image sample.
- **Source/build:** check, build, prerender, build-output, SEO-output and project
  contracts PASS; Node tests 28/28 and Prorok draft isolation 4/4 PASS.
- **Readiness:** this closes the locally confirmed viewport containment defect,
  not whole-site visual/accessibility completion. Exact pushed-head CI/native
  Safari evidence is still required. Prior `ced39bd` brand-raster now passed;
  the earlier FFmpeg infrastructure timeout does not describe this new HEAD.
  Damaged original media (#519), broader contrast findings and existing external
  dependencies remain open. No merge, artwork substitution or editorial change.

## Follow-up 2026-10-23 — native CI image-load diagnosis (not closure)

At `3c97320`, browser job `120117484363` failed all four new iPhone
viewer cases at the unchanged `naturalWidth > 0` precondition, not at the
viewport assertion. Check annotations repeat the zero-width failure; signed
job logs and the core evidence artifact download both failed with EOF here.
Analytics job `120117484174` hit its 30-minute limit during locked browser
installation; home-reveal `120117484177` hit its 45-minute limit. These are
not equivalent to a proved runtime regression. Other principal gates passed.

Restored snapshot was byte-identical to the pushed source (including four
untracked text files); preserved in a safety stash and fast-forwarded to clean
`3c97320`. Fresh contracts/check/build PASS. Fixture still independently decodes
with ImageMagick at 1280×720, 81494 bytes; that does not prove WebKit decoding.
Added failure-only diagnostics for intercepted/failed requests, actual image
source/state/visibility, and independent data-URL decoding of the same bytes.
The original assertion, timeout, native device profiles and retry policy remain
unchanged. No production change or root-cause/repair claim at this stage.

### Native diagnosis result and bounded scenario correction

Native job `120137365864` on `b028569` reproduced all four failures on both
attempts with identical evidence: **zero intercepted image requests**, no failed
image requests, `complete: false`, lazy/loading state, image rect top
`3167.578125`, and independent data-URL decode width **1280**. This rules out the
controlled fixture decoder and an actual attempted Wikimedia download as the
cause of these failures. The supposedly scrolled-to opener was still offscreen;
Chromium's earlier lazy prefetch had concealed that scenario precondition.

Move opener focus before waiting for its lazy image and assert actual viewport
intersection before decoding. Focus is already the keyboard journey's intended
input, not a source/loading mutation. Keep the decode threshold, full-viewport
bounds, nested hit testing and focus/scroll restoration unchanged. No image
`loading` override, CSS override, synthetic load event, timeout/retry increase or
production scroll/loader change. Retain failure diagnostics with scroll/viewport
coordinates for native revalidation. Local four-case Chromium run: **4/4**,
retries 0. This is a candidate scenario repair pending native proof, not a claim
that the original Safari red was environment noise or that full CI is green.
