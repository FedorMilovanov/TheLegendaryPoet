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
