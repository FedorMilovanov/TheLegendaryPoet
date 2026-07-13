# Essay engine — how to add a premium long-form article

The point of this engine: **write data, never re-style.** All the premium look
(3D-tilt cover, drop-cap lead, numbered gold section headers, styled poem blocks,
sourced quote cards, editorial notes, candle-lit reflections, dividers, sources
list, reading progress, sticky numbered TOC, community rating) is defined once
and reused for every essay.

## To add a new essay

1. Create `src/data/essays/<name>.ts` exporting an `Essay` (see `src/types/essay.ts`).
   Compose the body as an array of typed `blocks`. Available block types:
   - `epigraph` — opening line/quote (right-aligned, with a quote ornament)
   - `lead` — big opening paragraph (gets the gold drop-cap)
   - `section` — a heading (auto-numbered, auto-creates a TOC anchor)
   - `paragraph` — prose (supports `\n\n` → multiple paragraphs; supports `**gold**`)
   - `pullquote` — a big highlighted quote (supports `**gold**`)
   - `poem` — an embedded stanza (`title`, `lines`, `year`, `note`, `variant`)
   - `voice` — a sourced quote card (`kind`: `self` | `friend` | `poet` | `historian`)
   - `note` — the project's own editorial remark (cyan callout)
   - `reflection` — a reverent, candle-lit meditation (warm gold; `heading` + text)
   - `divider` — an ornamental separator
2. Register it in `src/data/essays/index.ts` (`export const essays = [...]`).
3. That's it — it automatically:
   - appears as a featured card on `/articles` (the "Большой материал" block),
   - gets its own page at `/essays/<slug>`,
   - gets a community rating panel keyed on its `id`.

## Inline emphasis & variants

- Wrap words in `**double asterisks**` inside `paragraph`, `poem.lines`,
  `pullquote`, and `reflection` text to render them in **glowing animated gold**.
- `poem.variant: 'blood'` tints a stanza red and adds a "написано кровью" badge.
  Reserve it for a poem literally written in blood — never decorative.

## Engine architecture (`src/components/essay/`)

The engine is factored so the *look* lives in one place and each article is pure
data. When extending it, touch these — not the article files:

| File | Responsibility |
| --- | --- |
| `theme.ts` | **Design tokens** — accent default, cover-gradient builder, voice config (border/label/dot), poem palettes. Change a value here → every essay updates. |
| `richText.tsx` | Inline helpers shared by all blocks: `withGold()` (the `**…**` parser) and `splitParagraphs()`. |
| `anchor.ts` | `sectionAnchor()` — the single source of truth for section ids, so headings and the TOC can never drift. |
| `blocks.tsx` | One component per block type + the type-safe `EssayBlockView` dispatcher. A `never` guard makes a missing case a compile error. |
| `EssayCover.tsx` | Shared cover surface (artwork + graceful «» fallback + kicker badge), used by both the hero and the listing card. |
| `EssayHero.tsx` / `EssayCard.tsx` | Page hero and listing card; both read tokens from `theme.ts`. |
| `ArticleRenderer.tsx` | Maps blocks → views, numbers the sections, and exposes `getEssayToc()`. |

**To add a block type:** extend the `EssayBlock` union in `src/types/essay.ts`,
add a component + `case` in `blocks.tsx` (the compiler forces the case), and reach
for tokens in `theme.ts` rather than hard-coding colours.

## Covers

Each essay references two images with graceful fallback (a themed gradient +
«» ornament shows until the real art is added):
- `cover` — the hero banner (16:9), used on the essay page.
- `cardCover` — the listing link-card image (falls back to `cover`).
- `accent` — optional hex; tints the hero glow, cover wash, and kicker badge.

Drop the files in `public/images/essays/`. Paths in data are absolute
(`/images/essays/…`) and are resolved against the GitHub Pages base
automatically.

## Editorial rule

Same as the rest of the site: every quote needs a real, citable source; mark
paraphrases as «(пересказ)»; never invent. See `docs/RESEARCH_SOURCES.md`.
