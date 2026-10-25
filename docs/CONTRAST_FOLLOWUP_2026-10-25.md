# Reader metadata / catalog contrast follow-up

Baseline: `main@6ac19073749252c4460d2b35cdeae8b2f7bdef1f`.
Scope: the residual contrast observations in `MEDIA_RECOVERY_2026-10-24.md`,
not whole-site accessibility closure, editorial revision or image replacement.

## Reproduced baseline

Local production build, Chromium 149, axe-core color-contrast rule. Two routes,
two themes, explicit 1440×1000 desktop and 390×844 mobile/isMobile contexts,
reduced motion. Fonts awaited, page traversed to reveal lazy content.

| Route | Dark desktop/mobile failing nodes | Light desktop/mobile failing nodes |
| --- | --- | --- |
| `/essays/brik-case` | 11 / 11 | 17 / 17 |
| `/articles` | 6 / 6 | 0 / 1 |

Examples: gray metadata 2.82:1 in dark; voice source links 3.94:1; gold poem
heading 1.20:1 in light; note label 4.43:1. These are normal-size text and
require 4.5:1, including the 10px bold labels.

## Root cause and single owning layer

Shared essay blocks and catalog controls used translucent raw gold/gray/cyan
utilities instead of existing semantic theme tokens. Light utility adapters did
not reliably preserve contrast, and low-alpha dark labels also failed.

Reuse `theme-functional-muted`, `theme-functional-subtle`, `theme-poet-accent`:
shared epigraph/citation, voice label/role/source, pullquote citation, default
poem heading/note, poem year, editorial-note label, catalog inactive filters,
empty-state copy and publication label. No route-specific CSS, new palette,
article text, dependency, workflow, rights or media changes.
Stable `data-essay-block` markers support block-level browser assertions.
The blood poem palette is otherwise unchanged. Shared-block changes intentionally
apply to other essays using those block kinds, not just the witness article.

## Verification

- Baseline clean-HEAD install/check/build, 92 Node tests and 4 TS tests passed
  in the preceding same-session repository audit; npm reported 0 vulnerabilities.
- After repair: axe finds **0 automatic contrast violations in all 8 contexts**,
  versus 69 failing-node occurrences before. This does not mean every node was
  automatically measurable: incomplete results remain (77–101 nodes per baseline
  context, including transparent/complex/offscreen surfaces). No incomplete result
  was relabeled PASS or used as evidence of full accessibility.
- Permanent `qa/theme-contrast.spec.mjs`: **8/8 new regression cases PASS**,
  no retries, Chromium 149. Each requires actual nonempty witness selectors,
  scrolls targets into view, measures rendered colors against ancestor surfaces,
  asserts >=4.5:1, checks viewport overflow and zero pageerrors.
- Screenshots saved; Brik voice detail visually inspected in dark and light.
  External archive-image delivery is outside this contrast fix; a black remote
  media region in the local capture is not treated as successful image rendering.
- Final repository check, build-output budgets, contracts and 92 Node tests PASS.
  Discovery manifest regenerated using sitemap/feed after renderer fingerprint
  changed. No manual manifest fingerprint edit.
- No new LCP/CLS measurement, native Safari run or production verification in
  this local follow-up. Remote exact-head CI is reported separately in the PR.

## Environment and evidence limits

Browser/axe tooling installed outside project dependencies. Chromium unpacked
with its own AL2023 libraries; no NSS shim. Initial single-process browser
closed when its first context closed: isolated browser launches fixed the probe.
Temporary harness configuration/import errors were corrected, not source defects.
Preview host allowance supplied through the Vite environment, not committed.
Raw evidence/screenshots are ignored under `qa-artifacts/contrast-followup/`;
local logs under `/home/user/contrast-*.log`. They are not committed binaries.
No thresholds, gates or tests were weakened. Existing incomplete axe results
and sandbox delivery limitations remain explicit.

## Migration / rollback / remaining work

No data migration. Revert this bounded commit and regenerate discovery artifacts
to roll back. #497 still requires human-backed live adversarial evidence; #519
and branch deletions remain untouched. No merge, deployment or AuditRepo closure
is authorized by this local report alone.
