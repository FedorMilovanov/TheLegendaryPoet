# Comment prose paint and local durability — PR #525

Branch: `arena/f3e23b45-thelegendarypoet`; baseline clean
`ef944328f33d3e4d53c7829d4d520c066f9b8360`. PR stays draft/unmerged.

## Investigation, not a false live-proof closure

The previous broad local run remains **198 PASS / 4 FAIL, 47.0m**. Separate
successful diagnostics do not erase it. Its excluded long comment journey
had timed out waiting for a card after reload. An ignored instrumented copy
with the same body/45s budget now reached the final screenshot before timing
out: persisted v3 state, unchanged Unicode text and the reloaded card were all
present, with empty outbox in local mode. This proves that local persistence
worked in that diagnostic, not the sole cause of every previous timeout.
No Worker/D1 write, human challenge, secret or production bypass was used.

Four short permanent cases now check **local mode** in both themes:

- real UI submission, stable comment ID, canonical Unicode/whitespace/literal
  markup, durable localStorage state and no duplicate after real reload;
- no community mutation HTTP requests/outbox entries for local-only writes;
- exact actual theme-aware foreground/text-fill and composited-base contrast
  **>=4.5**, plus a cropped rendered-card screenshot;
- storage quota failure retains the draft, emits a real role=alert error,
  creates no card/persisted entry and never announces success.

The default QA build must visibly report local mode; the tests do not skip
or silently substitute a mock Worker if it reports shared mode. Quota failure
is injected only into the feedback localStorage key, not authentication or
Turnstile. The 2.6s transient toast is observed in the real accessible DOM
before submission, so a slow round-trip cannot lose an already-removed alert.
No existing test/assertion, CI exclusion, threshold or timeout is removed.

## Actual product defect discovered by screenshots

The initial four DOM-durability cases passed but the light screenshot exposed
nearly white comment text on cream. `ExpandableText` hard-coded
`text-cyan-50/68`, unaffected by the intended light ink ownership. Independent
390px probe: light **1.011135:1**, dark **9.000343:1** (composited-base helper).
Canonical text correctness was not visual readability.

The shared renderer serves both `CommentCard` and `FeedbackPair`. It now uses
one semantic `theme-community-prose` role, sharing the existing island-aware
muted-ink contract with feedback summaries. Existing theme tokens are reused;
no new colors, page-specific selector, broad substring adapter or state/
truncation/expansion behavior change. Dark islands retain their own ink.
The existing QA contrast algorithm was moved unchanged into
`qa/contrast-helpers.mjs` for reuse; byte comparison after removing exports
confirmed the algorithm is identical. No threshold/math weakening.

## Verification before commit

- Clean baseline: npm ci/contracts/check/build/budgets, **99 Node / 4 TS PASS**.
- Initial new durability-only cases: **4 PASS, 36.9s**; full then-current reader
  file **13 PASS, 3.4m**. These did not yet certify the body paint.
- Fault control: deleting the saved entry before reload in an ignored copy
  produces **1 expected FAIL**, missing the reloaded card. Not an app baseline.
- Strengthened paint run: **1 PASS / 3 FAIL**: two wrong-ink assertions plus one
  transient-toast visibility miss. All are retained in the diagnostic log;
  the new toast observer and enabled-submit precondition avoid that race.
- After paint/observer repair, entire reader-journeys file: **13 PASS, 3.4m**,
  no retries, unchanged 45s scenarios and 20s expectations.
- Final check/build/budgets/contracts: PASS; **99 Node / 4 TS PASS**.
- Git diff/whitespace and source scope review: PASS.

Independent final matrix: dark/light × 390px mobile/1440px desktop, explicit
mobile/touch/reduced-motion settings and actual matchMedia confirmed. Both
card and highlighted-review bodies measured **6.908736:1 light** and
**11.408308–11.425569:1 dark**. Fonts loaded 4/4; 0 page exceptions, horizontal
overflow or completed broken images in the sampled page state. Cropped dark/
light screenshots inspected before/after. Sandbox emoji glyph coverage is not
certified by exact canonical text assertions; missing OS emoji fonts remain
an environment limitation, not artwork/font replacement authority.

Focused card axe: **0 automatic violations, 5 incomplete nodes per context**,
not a full card/metadata/accessibility certificate. Ratios use composited
background colors, not every gradient/photo pixel. Local diagnostic LCP
576–932ms / CLS 0–0.001405 are synthetic, not production Core Web Vitals.

Ignored logs/artifacts: `/home/user/comment-*.log`,
`qa-artifacts/comment-diagnostics/`, cropped screenshots under
`qa-artifacts/reader-journeys/`. No binary diagnostic artifacts committed.

## Remaining boundary and rollback

Exact resulting-head remote checks and the full theme regression completion
are recorded separately in the PR after this commit, without another source
commit that would invalidate the tested head. Previous ef94432 green is
historical. Existing native suites include this reader file on Chromium,
Android and the fresh-process base iPhone contour; verify those results rather
than assuming new Safari success from local Chromium.

The long excluded journey and human-backed #497 production live adversarial
proof remain unclosed. No CI exclusion removal, secret/operator action, issue
closure, merge, deployment or branch deletion. The media-coverage source audit
also confirms existing deep routes test only one representative essay, while
reader image-viewer tests mock Wikimedia bytes for geometry: neither certifies
all 23 previously blocked external artwork URLs. Prior axe incomplete evidence
is not erased by this focused new scan.

Rollback: revert the bounded shared prose-role/renderer change and its QA
coverage/helper extraction. No application state or database migration.
