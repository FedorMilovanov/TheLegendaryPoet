# Brand loading-shell evidence readiness — PR #525

Baseline: clean `f2a5dd74d0fdb9eedb91a99727ad285fa0a23b58` on the session
branch. Restored workspace files were byte-compared against that remote tree;
the local branch was then fast-forwarded without discarding files. No foreign
working edits were overwritten. PR remains draft/unmerged.

## Investigation versus an unproven CDP root cause

Previous remote brand job40247812809/job121333010485 remains **13 PASS /
1 flaky**, failed by the existing fail-on-flaky policy. Its screenshot failed
with `Page.captureScreenshot: Unable to capture screenshot`; built-in retry
passed. No manual rerun of that failed job was used to clear it.

On the unchanged clean baseline, ten serial loading-case executions with
**zero retries** produced **10 PASS, 1.7m**. The original CDP failure was not
reproduced, and this step does not establish its sole cause or claim it fixed.

A controlled network probe did prove a different evidence defect: while the
real `/brand-emblem.png` response was held, all old source-attribute assertions
still passed and the screenshot succeeded with `complete=false,naturalWidth=0`.
The same probe without delay reported naturalWidth320. In both, navigation had
already reached DOMContentLoaded, document.readyState was complete and fonts
were loaded. Thus an unawaited navigation was not demonstrated as the failure
cause in these witnesses; URL equality alone did not certify rendered pixels.

## Bounded QA-only correction

The existing shared `expectSingle` helper in
`qa/brand-reference-comparison.spec.mjs` now decodes the real base image,
requires positive natural dimensions and visible layout before returning.
Existing release/source/renderer/variant/path assertions stay intact.

The loading-case navigation explicitly reaches DOMContentLoaded before evidence.
A `finally` releases the held About chunk even if an assertion/capture fails.
Screenshot inspection also found the real animated page wipe covering much of
the loading shell: the case now waits for that overlay's actual transformed
height to be <=1px, without hiding it or adding a sleep. Before/after captures
were opened; final evidence shows the decoded shell emblem without the wipe.
The existing full-page screenshot and post-release route/shell assertions remain.

A permanent negative case serves an invalid PNG at the real image URL and
requires the same shared helper to reject it with a decoding error. The injection
is confined to that test's page; production assets are untouched.

- Negative control before helper repair: **1 expected FAIL** — old helper
  resolved successfully for the corrupt image.
- Image-readiness focused run: **10 PASS, 1.1m** (five positive/negative pairs,
  no retries). Final readiness including wipe geometry: **6 PASS, 56.3s**
  (three pairs, no retries).
- An intermediate complete two-file brand run was **14 PASS / 1 FAIL, 2.2m**:
  existing desktop/footer/mobile control-sheet test timed out at its final
  composite screenshot, after image decode. This is preserved, not reported
  as green or claimed repaired by the loading-case changes.

## Gates, boundaries and remaining work

Fresh clean-baseline and final contracts/check/build/output-budget checks and
**99 Node / 4 TypeScript tests PASS**. No runtime, brand source/materializer,
approved bytes/hash, dependency, workflow, timeout, retry or flaky policy changes.
No migration; rollback is limited to the QA helper/cases and this report.
Production source remains byte-identical to f2a5dd7. Its 123 local passes remain
baseline evidence, not a rerun of all tests after this QA change.

Fresh exact-head remote results belong on PR #525 after pushing; a new green
run would not establish causation for the earlier CDP error. No exhaustive
browser-rendering, accessibility, performance or native-Safari inspection is
claimed from these desktop evidence tests. Existing live Turnstile #497,
excluded old journey, external-artwork delivery and incomplete axe remain open.

Ignored local artifacts: `qa-artifacts/loading-{probe,before-*,red,green,focused,settled}*`,
`qa-artifacts/brand-route-loading-shell.png`, `/home/user/loading-*.log`.
Browser: Chromium149/own AL2023 libraries; preview4173 with explicit sandbox
host permitted through an environment variable, not a committed Vite change.
No merge, deploy, branch deletion, issue closure or visual-brand approval.
