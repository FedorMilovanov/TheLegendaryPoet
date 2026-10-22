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
in any context before or after. The unloaded external artwork remains visible
as a blank hero in this sandbox; this does not certify image integrity.

After-repair unthrottled local LCP: 816/372/656/268 ms in the table order;
CLS: 0.000968806/0/0.000968806/0. Baseline LCP was 332/272/344/268 ms.
These are noisy individual local samples, not field CWV or causal performance
claims. Wikimedia requests fail in the restricted sandbox; console network
errors are not silently classified as application exceptions or production bugs.

Other contrast nodes, search visible-name mismatch, duplicate unnamed navigation
and conditional image-error-button name mismatch remain unresolved here.
Ordinary prose/citation targeted tests passing does not close these signals.

Environment: Node 22.22.3; Chromium 149 with NSS compatibility shim, not the
exact native CI browser/platform. Native WebKit, assistive technology and field
performance were not re-certified. Ignored raw evidence/harness/logs/screenshots:
`qa-artifacts/revalidation/` (not committed).

## Dependencies and owner decisions

Fresh npm audit: six affected package entries, five high/one moderate; these
are not six independent advisories. Production-only audit: one moderate,
zero high. Open PR #514 covers lockfile-only fflate updates, not every current
dev/build advisory. No dependency changes, forced fixes or merges performed.

Prorok remains unpublished. Passing draft/source checks are not independent
biblical/theological approval. Human Turnstile/community evidence (#497), rights
and editorial publication authority remain owner decisions. No project-completion
percentage or blanket WCAG conclusion is warranted.
