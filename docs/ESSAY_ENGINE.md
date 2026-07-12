# Essay engine — how to add a premium long-form article

The point of this engine: **write data, never re-style.** All the premium look
(3D-tilt cover, drop-cap lead, gold section headers, styled poem blocks, sourced
quote cards, editorial notes, dividers, sources list, reading progress, sticky
TOC, community rating) is defined once and reused for every essay.

## To add a new essay

1. Create `src/data/essays/<name>.ts` exporting an `Essay` (see `src/types/essay.ts`).
   Compose the body as an array of typed `blocks`. Available block types:
   - `epigraph` — opening line/quote (right-aligned)
   - `lead` — big opening paragraph (gets the gold drop-cap)
   - `section` — a heading (auto-creates a TOC anchor)
   - `paragraph` — prose (supports `\n\n` → multiple paragraphs)
   - `pullquote` — a big highlighted quote
   - `poem` — an embedded stanza (`title`, `lines`, `year`, `note`)
   - `voice` — a sourced quote card (`kind`: `self` | `friend` | `poet` | `historian`)
   - `note` — the project's own editorial remark (cyan callout)
   - `divider` — an ornamental separator
2. Register it in `src/data/essays/index.ts` (`export const essays = [...]`).
3. That's it — it automatically:
   - appears as a featured card on `/articles` (the "Большой материал" block),
   - gets its own page at `/essays/<slug>`,
   - gets a community rating panel keyed on its `id`.

## Covers

Each essay references two images with graceful fallback (a themed gradient +
«» ornament shows until the real art is added):
- `cover` — the hero banner (16:9), used on the essay page.
- `cardCover` — the listing link-card image (falls back to `cover`).

Drop the files in `public/images/essays/`. Paths in data are absolute
(`/images/essays/…`) and are resolved against the GitHub Pages base
automatically.

## Editorial rule

Same as the rest of the site: every quote needs a real, citable source; mark
paraphrases as «(пересказ)»; never invent. See `docs/RESEARCH_SOURCES.md`.
