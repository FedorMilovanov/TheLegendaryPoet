# Static brand-evidence document lifecycle — PR #525

Clean baseline: `77fe36ac9b74327b5f83680d1d771c0351201666`, session branch
`arena/f3e23b45-thelegendarypoet`. Restored working files matched the remote
tree byte-for-byte before fast-forwarding the local branch. PR stays draft.

**Final implementation correction:** the initial about:blank document below
was superseded by a one-shot **same-origin** HTML fixture after CI exposed
opaque-origin asset blocking. See the correction section; initial green local
results are not certification of that intermediate version.

## Confirmed cause and ownership

The two synthetic evidence sheets in `qa/brand-reference-comparison.spec.mjs`
used `page.setContent()` on the still-running application page. This replaces
HTML but does not destroy its JavaScript execution context. The application
could keep scheduling animation callbacks while a supposedly static comparison
sheet was rasterized. This is a QA document-lifecycle problem, not a new
production-brand renderer or reason to change the approved raster.

A controlled probe wrapped the real requestAnimationFrame before app startup.
After replacing the document body, the original app URL and a window witness
persisted; over three explicitly requested frames the callback counter grew
**77→89** (12 callbacks). After navigating to about:blank, the witness disappeared
and the fresh counter grew **0→3**, only the three probe callbacks. No sleep or
synthetic app animation was needed to demonstrate the retained execution realm.

One shared `prepareEvidenceDocument` now navigates to `about:blank` before
setting the evidence viewport. Both the four-view control sheet and browser/
platform-icon sheet use it. Data-URL screenshots and absolute built-asset URLs
remain unchanged; no panel, source capture, decode check or full-page output
is removed. The same 45s test budget and existing retry/flaky policy remain.
No extra context/test budget is used to split the original capture journey.

## Timing evidence, not a universal timeout claim

An ignored instrumented copy of the unchanged capture journey used the original
45s budget. It passed narrowly (45.1s including runner overhead), after earlier
committed reports recorded repeated 14 PASS / 1 FAIL full-brand runs.

| Phase | Baseline diagnostic | Fresh-document diagnostic |
| --- | ---: | ---: |
| Last mobile source capture finished | 38.338s | 37.734s |
| Final composite capture began | 39.399s | 38.453s |
| Final composite capture finished | 44.311s | 39.118s |
| Composite capture duration | 4.912s | 0.665s |
| Evidence viewport / document | 1500×1500 / 1500×2242 | unchanged |

Source capture preparation still consumes roughly 38s on this sandbox.
The measured overhead reduction restores headroom, but does not prove every
past/future timeout has the same cause or guarantee success on arbitrarily slow
hosts. In particular, the earlier route-loading `Page.captureScreenshot` protocol
error was a different case and is not retrospectively explained by this fix.

## Regression and verification

A permanent case mounts the real application, records a window witness,
prepares a static evidence document, replaces its body and requires the old
witness to be gone and the URL to be about:blank. With the old in-place behavior:
**1 FAIL**, receiving `captured application` instead of undefined. With the shared
fresh-document owner, complete local brand suite: **16 PASS, 2.1m**, no retries.

The original desktop/footer/mobile capture journey additionally passed
**3 independent executions, 2.0m**, repeat-each3/retries0. The fixed timing
probe passed in 39.9s including runner overhead. Final four-view control sheet
was opened and inspected: idle, hover, footer and mobile witnesses remain.
These are viewport/mobile-layout evidence, not physical-device certification.

Fresh clean-baseline and final contracts/check/build/output-budget gates and
**99 Node / 4 TypeScript tests PASS**. Production source, approved reference /
materializer / image hashes, package/lock and workflows are unchanged.
No migration; rollback is limited to this QA helper/regression and its two calls.
Exact-head post-push local/remote results are recorded on PR #525, not predicted
here. Previous 14/1, 120/1 and 198/4 runs remain historical evidence, not erased.

Environment: Chromium149 with its own extracted AL2023 libraries, preview4173;
explicit sandbox host allowed via environment, no Vite source change. Ignored
artifacts: `qa-artifacts/control-sheet/`, `qa-artifacts/brand-live-site-control-sheet.png`,
`/home/user/control-sheet-*.log`. No screenshot/browser binary is committed.

Not certified here: exhaustive accessibility/gradient pixels, physical Safari,
field performance, live human-backed Turnstile #497, the excluded old comment
journey or delivery of all external artwork URLs. No artwork replacement,
production visual approval, deployment, merge, issue closure or branch deletion.


## Same-origin correction after exact-head CI

Intermediate commit `08c47ca` introduced a real regression: Brand raster run
40292377765 had **15 PASS / 1 FAIL, 27.5s**, and Brand deep run40292377585 had
**15 PASS / 1 FAIL, 20.8s**. Both failed the actual icon-sheet image decode,
including the unchanged built-in retry. Relevant raw log chunks13–14 were read,
not every log/artifact. These red runs are preserved, not manually rerun away.

The local launcher inherited Sparticuz's `--disable-web-security`, masking the
new about:blank document's opaque origin. Removing that flag and
`--allow-running-insecure-content` reproduced the icon failure without changing
tracked config: **1 FAIL**. An independent console/network probe reported
origin `null`, naturalWidth0, and Chromium's CORS block for a non-secure client
requesting the loopback address space. The new origin assertion separately
failed **1 case**, expecting the actual preview origin but receiving null.

The shared helper now fulfills one reserved QA-only same-origin navigation with
an empty HTML document, then composes the sheets there. The one-shot route
mocks **only this fixture HTML**, not images, requests to the actual app, source
captures or asset assertions. No production route/file or CORS/security policy
is added/relaxed. The execution-context witness must still disappear, and the
permanent regression additionally requires the preview origin and fixture URL.

With ordinary browser security enabled locally, the complete suite now passes
**16/16, 2.2m**, retries0. Post-push exact-head confirmation belongs in PR #525.
The earlier timing table remains the initial fresh-document diagnostic, not a
new same-origin benchmark or a claim that every timeout/CDP error is solved.
