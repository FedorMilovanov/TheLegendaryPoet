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

## Browser payload recovery

The essay body, not its optional series catalog, determines whether the article can open. A missing slug (payload 404 or static-host HTML fallback) offers a link back to articles with noncanonical `not-found` metadata. A 503 or malformed JSON is a load error, not a claim that the essay does not exist. Its rejected promise is stable within the visit; the page recovery button or another explicit chapter selection can retry without reloading the document. The shell owns placement, history and focus for both outcomes (see `APP_SHELL_RUNTIME.md`).

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
| `SectionChip.tsx` | Mobile current-chapter chip and native popover TOC (select fallback). Shown in reading mode or while the reader operates it. Shares chapter anchors and breakpoint focus with the desktop TOC; see `MEDIA_OVERLAY_RUNTIME.md`. |

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

`components/ui/ShareLine.tsx` serves both essay articles and poet detail. Mark the
published container `data-share-scope` and mount `<ShareLine scopeRef={ref} path={routePath} />`
inside it. `path` belongs to the **rendered source**; an outgoing essay may still be
readable after the address bar changes. Use the router basename and canonical trailing
slash. Never copy the sender’s query, old fragment, form selection or community draft.

The chip copies `#address:~:text=…`. The text directive is for the browser: native
matching/highlighting (`::target-text`) is **not** guaranteed. Before the directive
is an independent address for the reading position. Preserve a published section
or source ID where one exists. Otherwise `sharedPassage.ts` identifies the first
selected non-space character by reading flow, text-run length/fingerprint,
occurrence and offset. It uses the canonical verse layer, not animated ink. There
is no stored selection, second corpus, or quote in a query parameter. This address
is for the published text, not a promise across arbitrary edits. An unresolved
address after enrichment must not guess at a different passage. Old text-only links
remain browser-owned; no data migration or content rewrite is involved.

The existing route scroll owner places and focuses the arrival (see
`APP_SHELL_RUNTIME.md`); the chip must not scroll the recipient. `qa/shared-passage.spec.mjs`
opens the copied URL from a link in a fresh document and measures the **painted glyph**,
including delayed data, rewrapping, repeated words and tall essay blocks. A successful
clipboard write alone is not a recipient test.

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
