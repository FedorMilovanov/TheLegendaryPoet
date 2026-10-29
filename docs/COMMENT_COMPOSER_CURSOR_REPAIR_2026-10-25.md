# Shared comment-composer layout and cursor theme repair

## Scope and baseline

Owner supplied a screenshot with category labels escaping their round controls
and requested a visible dark custom cursor in the day theme. Work stays on
PR #525, draft/unmerged. No article/media/workflow/dependency changes.
Clean base `45cef2b1eb01ca081f6ddc0357ad2981263a6421`: fresh check/build and
project contracts PASS before implementation. Raw user image is an input,
not a claim to know its original route, viewport or browser zoom.

## Comment kind layout

Exact shared owner: `CommentComposer.tsx`, consumed by CommunityPanel for
poet, poem, essay and track feedback. The viewport breakpoint `sm:grid-cols-4`
forces four cells even when the composer lives in a narrow column. Grid tracks
use fractional minmax(0,1fr), so they can be narrower than a label's longest
word plus padding. Text then paints outside the button; the circle-like shape
is the rounded-full control compressed to a narrow track, not a separate icon.

Reproduced on published `/essays/brik-case`: at viewport1024 the group is
435.7px wide, each cell102.9px; three labels overflow (up to9px scroll-width
excess, with glyph rectangles up to8.23px past the border). At viewport390,
768 and1440 the same initial route did not overflow. This does not infer the
attached screenshot's exact layout; it independently reproduces the cause.

Repair: intrinsic auto-fit grid with a9rem readable control basis, bounded by
100% of its own container. No viewport-column assumption. Controls may grow
vertically and wrap text; min-width0 and overflow-wrap:anywhere handle
especially narrow containers/enlarged text. Full labels/font sizes preserved;
no hidden overflow, ellipsis, clipping, reduced type or per-route override.

Permanent six-case browser regression (dark/light × mobile390, desktop1024,
desktop1024 with root font200%): baseline **2 PASS / 4 FAIL**; after **6/6 PASS**.
Tests measure actual line rectangles within padded control bounds, no scroll
excess/clipping, >=44px height, and keyboard Space single-selection semantics.
Final rerun uses effective reduced motion through contextOptions (see QA note).
Separate after probe covers390/768/1024/1440; desktop1024 and mobile390
screenshots inspected. No screenshot binaries committed. Rollback is a bounded
revert of this shared layout and regression additions; no migration.
Check/build/budget/contracts and **92 Node + 4 TS PASS** after this repair.

## QA environment note

New cursor fallback diagnostics exposed that this locked Playwright runner does
not project top-level `test.use({ reducedMotion, forcedColors })` into its
combined context options. Standalone browser.newPage options work. New tests
therefore use contextOptions and assert actual matchMedia for fallbacks. Initial
fallback failures with inactive emulation are harness evidence, not a newly
invented product regression. Earlier reports declaring reduced-motion test.use
alone are not independent proof that it was effective; separate explicit-context
probes remain distinct evidence. This transaction does not silently rewrite the
repository's other QA suites or their existing failure history.

## Custom cursor theme paint

Exact owner: CustomCursor supplies pointer motion/capability; shared theme.css
now supplies its paint. Baseline dot was hard-coded bg-cyan-50 with pale glow;
ring was cyan200/35. Neither consumed current theme. Native pointer is hidden
when ready, so the near-white custom dot became the only location feedback
against the day background. Effective-context RED: **2 theme cases FAIL /
3 native-fallback cases PASS**; day dot/base helper ratio **1.00014:1**.

Repair: dot/ring use shared semantic cursor classes and four theme paint
variables. Dark paint keeps the previous Tailwind cyan colors and exact glow
values. Light dot uses existing primary dark ink; ring uses existing muted ink.
A one-pixel cream outline preserves visibility over intentionally dark panels
within light pages (rather than a second route-aware cursor or blend-mode
hack). No JS theme subscription, remount, new event listener, movement/spring
change, idle scheduling change or native-cursor suppression change.

Two permanent theme cases cover initial persisted dark/light and repeated
real UI theme switches without reload. They assert the same DOM node survives,
actual dot/base contrast >=3, dark day-mode fill, ring/base contrast >=3 in day
mode, opposing light outline and pointer-events none. Three fallback cases
verify actual coarse/reduced-motion/forced-color media plus no DOM cursor and
no hidden native pointer. **5/5 PASS** before final combined rerun. Helpers
measure semantic solid base, not every pixel of photographs/gradients or OS
pointer rendering. Light dot is rgb19,32,42; ring rgb70,92,103. No claim that
axe certifies these aria-hidden decorative cursor layers.

Light page and light-page/dark-island screenshots inspected. Separate dark-page
probe preserves prior pale paint. Fonts loaded and zero pageerrors/overflow in
all three probes. /about had zero console errors in both themes; the longform
island probe retained two resource errors under restricted egress. The first
probe command exceeded its wait limit; subsequent log/process/file inspection
confirmed it completed, and it was not rerun blindly. Raw evidence stays
ignored under qa-artifacts/composer-cursor; screenshot binaries not committed.

Final check/build/budget/contracts and **92 Node + 4 TS PASS**. Cursor rollback
is separate from composer: revert its theme paint, two render class changes
and five tests. No data migration. Combined verification is recorded below.
Native Safari/new exact-head remote/production proofs are not inferred from
local Chromium. Prior citation fix 45cef2b has now passed remote Browser QA
run40217684392 (all five jobs); this does NOT certify these new UI changes.

Final combined new-layout/new-cursor + existing theme authority/semantic surface
checks: **18/18 PASS, no retries**, stable production build. Light solid-base
contrast diagnostics: dot **15.922:1**, ring **6.757:1** (>=3 assertions).
The broader reader/citation suite is not relabeled as rerun by these18 cases.
