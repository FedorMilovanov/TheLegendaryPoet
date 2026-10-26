# Shared comment-card header layout — PR #525

Baseline: clean `4e7df7422419376ba70a184eed97d7db4a971234` on
`arena/f3e23b45-thelegendarypoet`. PR stays draft/unmerged.

## Root cause and owning layer

The shared `CommentCard` header gave its author/date a zero-basis flexible
column next to wider category/helpful controls. At narrow card widths the
name became `Авт…` and the date broke into several tiny lines. The full author
was only available through a title tooltip, not readable in the card.

An explicit intrinsic 16rem preferred basis now lets controls wrap below the
identity when space is insufficient. Author text wraps, including long tokens,
instead of being ellipsized. Helpful controls are capped at available width
and can wrap rather than forcing their parent wider. No font is shrunk.

Enlarged-root-font screenshots exposed a second part of the same containment
problem: CommunityPanel's implicit single grid column used intrinsic minimum
content width. The actual card was **482px wide, left97/right579 in a 390px
viewport**, despite document overflow reporting zero because an ancestor clips
horizontal overflow. Both shared single-column grids now explicitly use
`grid-cols-1` (minmax(0,1fr)); desktop fractional columns are preserved.
The non-compact shell uses p-4 on mobile, retaining p-8/p-10 at wider breakpoints,
so shell padding does not consume most of the enlarged narrow viewport.

Owners: `CommentCard.tsx` and `CommunityPanel.tsx`, reused by poet/track panels.
No page-specific patch, new CSS/color/token, store/API/data migration, label or
accessible-name change. Existing contrast roles, keyboard selection, pressed /
disabled semantics and saved helpful count are retained. Compact shell spacing
is unchanged. Rollback is bounded to these layout class changes and QA additions.

## Regression and screenshot evidence

The existing four metadata cases gain real author clipping/ellipsis and date
line checks, plus card left/right bounds. Two additional mobile cases set root
font size to 32px, rather than pretending the locked runner applied font zoom.
Normal dates fit one line at the tested card widths; enlarged narrow cards may
naturally use up to two. This is an enlarged-root-font test, not a claim to have
certified real browser zoom or every panel element at WCAG text resize.

- Before product change: **6 FAIL** on clipped author names in dark/light ×
  desktop/mobile/mobile-enlarged contexts.
- First narrow-header fix: 6 PASS, but screenshot inspection exposed the
  offscreen enlarged card. This was not accepted as completed visual proof.
- Independent ancestor probe measured the 482px/offscreen card above. The
  tests now check actual card bounds, not merely document scrollWidth.
- After shared containment/spacing repair, serial combined focused run:
  **16 PASS, 2.6m**: six metadata/layout cases, six existing composer label
  layout cases (including 1024px/enlarged font), four local-durability cases.
- All six final card screenshots opened and inspected. Normal mobile shows
  the full author/date, with controls below; enlarged text wraps vertically
  inside the visible card. Very long words may break across lines, not vanish.
- The same tests retain >=4.5 contrast, actual reduced-motion preference,
  keyboard Space helpful selection, real CSS transition completion, JS-error
  and document overflow checks. No prior assertion/threshold/budget is removed.

Full exact-head local and remote results are recorded on PR #525 after pushing;
this document records focused evidence, not future green CI. Previous combined
120 PASS / 1 archive screenshot timeout and historical 198 PASS / 4 FAIL remain
preserved; later successful runs do not erase them.

## Other checks and limits

Clean baseline and final contracts/static checks/build/output budgets pass;
**99 Node + 4 TypeScript PASS**. No dependency or workflow change.
Independent ordinary-font four-context Chromium probe: fonts loaded 4/4,
zero page errors/document overflow/completed broken images; synthetic local
LCP572–992ms / CLS0–.001405, not field metrics. Selected helpful contrast remains
8.872 dark / 5.527 light. Axe: 0 automatic contrast violations, **5 incomplete
nodes per context**, not exhaustive accessibility or gradient pixel proof.

Fixture witnesses are populated Pushkin poet cards, not every poet/track route.
New enlarged cases are Chromium emulation, not native browser zoom. Native
Safari/Android evidence belongs to fresh exact-head CI. No whole-panel enlarged
layout certificate, production deployment or visual owner approval is inferred.

Ignored artifacts: `qa-artifacts/comment-metadata-*.png`,
`qa-artifacts/comment-diagnostics/layout-{probe,after}.json` and logs
`/home/user/comment-layout-*.log`. Chromium149/AL2023, preview4173; binaries and
screenshots are not committed. Live Turnstile #497, old excluded long journey,
23 external artwork URLs and incomplete accessibility remain unclosed.
No merge, deployment, issue closure or branch deletion is performed.
