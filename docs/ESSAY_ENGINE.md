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
   Section headings run through `titleCase()` automatically — write them in
   normal sentence case in the data file (see "Site heading rule" below).
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
| `SectionChip.tsx` | Mobile long-read companion: current-chapter chip that appears only in reading mode (`html.chrome-hidden`) + a native Popover-API table of contents. Driven by `getEssayToc()`, so every essay gets it for free. |

### Reading mode (site-wide)

`useAutoHideChrome()` (mounted once in `App.tsx`) toggles `chrome-hidden` on
`<html>` while the reader scrolls down; any upward scroll restores the chrome.
Fixed UI opts in via one CSS rule each (`.site-header`, `.mobile-dock`,
`.reading-progress`, `.scroll-top-btn`, `.palette-fab`, `.section-chip`) — to
add future chrome, add one selector in `index.css`, not another scroll listener.

### Navigation (site-wide): View Transitions

Import `Link`/`NavLink` from `components/ui/Link` (never from
react-router-dom directly) and navigate imperatively via its `useAppNavigate`.
Every route change then runs through the browser View Transitions API: a fast
fade-through defined once in `index.css` (`::view-transition-*`), with the
old framer wipe kept as the no-support fallback and as the first-load intro.
Shared elements morph between pages — mark both ends with
`style={vtShared('some-unique-name')}` (see `lib/viewTransition.ts`); poet
portraits (`PoetCard` ↔ poet hero) and essay covers (`EssayCard` ↔
`EssayHero`, via `EssayCover`'s `sharedName` prop) already do.

### «Поделиться строкой» (share a line)

`components/ui/ShareLine.tsx`: mount `<ShareLine scopeRef={ref} />` inside any
long-read container. Selecting text shows a gold chip that copies a
`#:~:text=` deep link; incoming visitors see the passage highlighted gold
(`::target-text` in `index.css`). Already wired on the essay page — new
essays get it for free.

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

## Site heading rule (Title Case)

Structural headings site-wide — page titles, section headings, kickers, nav/
footer labels — go through `titleCase()` (`src/utils/titleCase.ts`), an
English-style Title Case adapted for Russian: every significant word is
capitalized; short prepositions/conjunctions/particles (в, на, с, и, а, но,
для, о, etc.) stay lowercase unless they open the heading or follow a
colon/dash. Apply it at render time — write the underlying string in normal
sentence case in data/JSX and call `titleCase(text)`.

**Do not** apply it to: proper nouns with fixed casing (poet names), quoted
verse/prose (must keep the author's exact capitalization), or any text
already forced to caps via a CSS `uppercase` class (kickers/badges/pills —
the transform is visual there, so title-casing the string underneath is a
no-op and not worth the noise).

If a heading is split across two JSX nodes for styling (e.g. a plain span +
a highlighted span), title-case each fragment separately, but pass
`{ isHeadingStart: false }` to the second fragment if it might start with a
small word — otherwise that word gets force-capitalized as if it opened the
whole heading (e.g. "Статьи и Анализы" split into "Статьи" + "и Анализы"
would wrongly render "Статьи **И** Анализы" without the flag).
