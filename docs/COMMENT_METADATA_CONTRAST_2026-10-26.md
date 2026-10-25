# Shared comment metadata contrast — PR #525

Branch: `arena/f3e23b45-thelegendarypoet`; clean baseline
`6144e3dc6e87d32d3b0521301232dbe55097de1e`. PR remains draft/unmerged.

## Cause, owner and boundaries

`CommentCard` and the populated positive/critical items in `FeedbackPair`
used translucent cyan utilities for small dates, categories and review authors.
Dark surfaces made four fields fall below the existing 4.5 contrast contract.
The selected helpful counter separately retained pale emerald ink on light.

One shared `.theme-community-meta` role in `src/theme.css` now owns these
fields, using **existing** `--tlp-island-subtle` / `--tlp-text-subtle` tokens.
No new palette, page-specific color or opacity override is introduced.
The shared components cover poet and track community panels. The focused
paint matrix exercises the Pushkin poet panel; this is not an exhaustive
route/pixel audit. Positive and critical highlighted reviews are both populated.

Unselected helpful ink, card authors, highlighted titles, comment prose,
labels, sizing, wrapping, accessible names, focus behavior, store/API logic
and selected-state emerald border/background are unchanged. No data migration
or secret is needed; rollback is confined to this role and its component uses.
Existing compact header truncation/date wrapping is not a newly repaired layout.

## Measured contrast, before → after

Composited solid-base measurements, desktop 1440×1000 and mobile 390×844;
identical ratios at both widths. These are not gradient/photo pixel guarantees.

| Field | Dark before | Dark after | Light before | Light after |
| --- | ---: | ---: | ---: | ---: |
| Card date | 2.543438 | 9.379271 | 6.967927 | 5.754235 |
| Card category | 4.455008 | 9.379271 | 8.945294 | 5.754235 |
| Highlight category | 2.860203 | 9.365101 | 6.967927 | 5.754235 |
| Highlight author | 2.738850 | 9.365101 | 6.967927 | 5.754235 |
| Selected helpful counter | — | 8.871964 | 1.139633 | 5.527353 |

Unchanged unselected helpful: dark 6.043736 / light 8.945294.
Unchanged highlighted title: dark 14.210242 / light 4.538949.
Selected controls are disabled and exempt from WCAG minimum contrast; the
counter still conveys useful saved state, so our regression requires 4.5 there too.

## RED, visual discovery, corrected GREEN

Four permanent Chromium-core theme cases cover both themes and explicit
mobile/desktop contexts, real reduced-motion preference, populated cards and
both highlighted-review kinds. They check all direct text, keyboard focus,
Space selection, pressed/disabled state, settled contrast, overflow and JS errors,
and save a card screenshot. Existing local-durability tests additionally check
metadata after actual reload, including in native Browser QA projects.

1. Initial test run: 4 FAIL, including two light failures caused by a locator
   retaining the *unselected* accessible name after selection. The locator was
   corrected, without changing product code or weakening state assertions.
2. Before production repair: **2 FAIL / 2 PASS, 39.5s**; both dark cases report
   date contrast **2.543438**, expected >=4.5.
3. First role repair: **8 PASS, 1.4m**, including four local-durability cases.
   Screenshot inspection nevertheless exposed the pale selected light counter.
   Its assertion had sampled the beginning of the CSS color transition.
4. Waiting on real Web Animations `finished` promises, not a sleep or timeout
   increase, reproduced **2 FAIL / 2 PASS, 40.9s**: settled selected light
   counter **1.139633**. No test timing budget/retry/threshold was relaxed.
5. Reusing the same semantic role for the selected counter yields corrected
   focused **8 PASS, 1.4m**, including the settled-state checks. All four final
   cropped screenshots were opened and inspected; the counter is now readable.

Full exact-head local/remote results are recorded on PR #525 after pushing;
this report records the focused implementation evidence, not a future CI claim.
The previous head's full 104 theme / 13 reader passes remain baseline evidence,
not certification of this change. Historical 198 PASS / 4 FAIL is not erased.

## Other verification and limitations

Clean-baseline and repaired-source contracts, static checks, build, build-output
budgets and **99 Node / 4 TypeScript tests** pass. No workflow, exclusion,
45s budget, retry policy, threshold or existing assertion was removed.

Independent final four-context Chromium probe: fonts loaded 4/4; zero page
exceptions, horizontal overflow or completed broken images. Synthetic LCP
612–996ms; CLS 0–0.001405. These are local diagnostics, not field performance.
Axe contrast: 0 automatic violations, **5 incomplete nodes in every context**;
this does not certify whole-card accessibility or every gradient pixel.
The new four-context matrix is Chromium mobile emulation, not native Safari.
Native-engine evidence must come from the exact-head Browser QA run.

Ignored diagnostics: `qa-artifacts/comment-diagnostics/metadata-{before,after}.json`,
RED/GREEN logs in `/home/user/comment-meta-*.log`, and
`qa-artifacts/comment-metadata-{dark,light}-{mobile,desktop}.png`.
Screenshots/browser binaries are not committed. Environment: repository QA
preview on port 4173, Chromium 149 with its extracted AL2023 libraries.

Still **not closed**: human-backed live Turnstile #497, the excluded old long
comment journey, exhaustive delivery of the 23 external artwork URLs and
incomplete accessibility review. No merge, deployment, issue closure or branch
deletion is authorized or performed by this step.
