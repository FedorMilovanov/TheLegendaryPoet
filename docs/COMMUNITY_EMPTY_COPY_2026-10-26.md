# Community empty-state copy — PR #525

Baseline: clean `b29743a210d0c0e9ad305c07e368b427c9c8cdfb`, session branch
`arena/f3e23b45-thelegendarypoet`. `main` remained
`033299b943484ed2c2f50221a03a1d7d3cdef3c5` at the pre-commit source guard.
This is a bounded reader-facing implementation wave, not merge authorization.

## Root cause, ownership and boundaries

Empty-state informational copy used `text-cyan-100/35` or `/38`, bypassing the
existing community semantic text roles. In dark mode, blending that translucent
foreground against the panel produced contrast below the existing 4.5 minimum.
Reuse `theme-community-prose` for missing reviews, missing insights and the empty
comment list; reuse `theme-community-meta` for the no-rating status. No new CSS,
colors or theme-specific overrides are introduced.

The owning layer is the shared community component family: `FeedbackPair`,
`CommunityInsights`, `CommentList` and `CommunityPanel`. Its consumers include
poet details, expanded poem cards, essays and track feedback/detail surfaces.
The browser matrix exercises the Pushkin poet panel, not every consumer route.
The rating status renderer is also used for loading/error states; its new role
applies there, but those states are not comprehensively certified by this wave.

No wording, ARIA, feedback selection, persistence, API, data or dependencies
change. No migration. Rollback is the four class substitutions plus this wave's
regression/documentation; prior metadata, layout and brand repairs stay intact.

## Red evidence and permanent regression

The initial new matrix on baseline: **6 FAIL dark / 6 PASS light, 1.8m**.
Dark ratios: no ratings **2.872213**; missing positive/critical review
**2.860203**; empty comment list **3.192480**. Screenshot inspection then found
the same bypass in the no-insights message. Extending the regression before
fixing that component produced **1 FAIL**, dark desktop empty scenario, with
**2.860203** for “Когда появятся первые оценки…”. This additional red result is
preserved separately, not represented as part of the original baseline run.

`qa/theme-contrast.spec.mjs` adds 12 cases: dark/light × desktop1440/mobile390 ×
empty/positive-only/critical-only. Each uses actual local-only v3 persistence,
explicit reduced motion, loaded fonts and the existing contrast helper. Checks
include local-only status truth, zero/one comment, presence/absence of the
appropriate missing-review/list placeholders, all selected copy ≥4.5, no page
errors or horizontal overflow, plus screenshot and JSON contrast attachments.
There is no network mock, threshold relaxation, workflow or retry-policy change.

## Final local verification

Final focused suite: **22 PASS, 3.0m, 0 skipped / flaky / unexpected, retries0**:
12 empty-state cases, 6 existing populated-metadata cases and 4 existing local
comment durability/failure cases. Baseline and final contracts, `npm run check`,
build and build-output budget gates PASS; **99 Node / 4 TypeScript tests PASS**.

Computed contrast, identical desktop/mobile and all applicable feedback states:

| Copy | Dark | Light |
| --- | ---: | ---: |
| No-rating status | 9.309925 | 5.627981 |
| Missing review / no-insights prose | 11.408308 | 6.327940 |
| Empty comment list | 11.341094 | 6.757151 |

An independent four-context probe additionally found loaded fonts, **0** console
errors, page errors, horizontal overflow, broken images or pending images in
each context. LCP/CLS single-run observations (not field-performance approval):

| Context | LCP ms | CLS |
| --- | ---: | ---: |
| Dark desktop | 904 | 0.001405 |
| Dark mobile | 700 | 0.004296 |
| Light desktop | 760 | 0.000999 |
| Light mobile | 624 | 0.004296 |

Before panel screenshots and after component captures were opened and inspected,
including examples across all four theme/viewport contexts. Targeted axe on the
five selected labels reports **0 violations but 5 color-contrast incomplete
nodes per context**. The existing helper composites computed colors/ancestor
backgrounds, not exhaustive gradient pixels. Neither result certifies full
WCAG compliance, every community control/label, loading/error/filter/sort copy,
physical devices, Safari or live community delivery.

Environment: local Chromium149 with its own AL2023 libraries, ordinary browser
security (no disable-web-security/insecure-content flags), production preview4173.
Ignored evidence: `qa-artifacts/community-empty/{red,insights-red,final}/`,
`after.json`, component PNGs and `/home/user/community-empty-*.log`; final JSON
report `/home/user/community-empty-v2-focused.json`. No binaries are committed.
Exact post-push SHA/check results belong on PR #525, not a prediction here.
Historical failures and earlier brand results remain historical, not new-head CI.
No merge, deploy, issue closure, artwork change or branch deletion is performed.
