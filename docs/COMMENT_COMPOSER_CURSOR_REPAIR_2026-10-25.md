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
