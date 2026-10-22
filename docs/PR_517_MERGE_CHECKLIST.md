# PR #517: merge acceptance boundary

This checklist separates acceptance of this bounded PR from finishing the
entire editorial/product backlog. It does not authorize merging or closing.

## Before merge

- [x] Verify the pushed head and current main directly, not snapshot metadata.
- [x] Review changed-path inventory: existing reader/shell/Hall layout,
  shared theme/contrast, source corrections, unpublished Prorok draft,
  editorial policy, regression tests and session evidence.
- [x] Confirm no workflow/dependency changes in the cumulative PR.
- [x] Confirm Prorok is not imported into the public Essay registry.
- [x] Preserve mandatory biblical evaluation and source/rights uncertainty.
- [x] Resolve the full-PR whitespace warning in prorokDraft.ts (empty EOF line).
- [ ] Final pushed SHA: all applicable remote checks completed successfully;
  inspect skips for scope, do not treat skipped checks as executed tests.
- [ ] Owner review of accumulated visual/editorial/source changes and explicit
  acceptance of the known residual work below. CI is not editorial approval.
- [ ] Owner decision to leave Draft, followed by explicit merge authorization.
  No automatic merge; retain the session PR/branch until that decision.
- [ ] After an authorized merge: verify deployment at the resulting main SHA
  and record exact closure evidence in AuditRepo. Not a pre-merge claim.

Evidence: PR check runs at exact SHA, qa/theme-contrast.spec.mjs,
scripts/tests/prorok-draft.test.ts and SESSION_AUDIT_PLAN_2026-10-13.md.
The green cce4a6e check snapshot does not certify a later cleanup SHA.

## Remaining work, not silently bundled into this merge

- Other shared block contrast (captions, credits, voice/note and related text).
  This PR does not claim a zero-violation fullbody axe audit.
- Unexplained high CLS in the isolated development harness; low production
  samples do not establish its cause or certify performance universally.
- Wider browser/AT/pinch-zoom/vertical tooltip collision/small-target coverage;
  existing browser suites are not certification of every untested interaction.
- Sandbox Wikimedia delivery remains external failed-image evidence, not PASS.
- Prorok final editorial/independent review, edition/printed witnesses where
  needed, cover rights, actual release decision and publication gates.
- Other source/publication research, Silentium, selection/clipboard work and
  owner-gated external activation are separate tasks, not merge prerequisites
  for these bounded repairs unless the owner explicitly changes scope.

Progress percentages are rough effort estimates, not measured completion KPIs.
About 5–10% of this PR's final acceptance remains (review/authorization/exact-head
checks), whereas roughly half of the broader reader/QA tail was still open at
assessment. Neither estimate is a whole-project completion percentage.
