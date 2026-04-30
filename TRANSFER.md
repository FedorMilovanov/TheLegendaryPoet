# TRANSFER.md

## Project

THE LEGENDARY POET — React/Vite/Tailwind v4 single-page site for a dark luxury poetry project.

## Current Build Status

- Last verified build: successful via `build_project`.
- Output size at last verification: about 609 KB, gzip about 175 KB.
- Vite uses `vite-plugin-singlefile`, so build output is inlined into `dist/index.html`.

## Current Product Direction

- Main brand style: dark luxury, cyan-blue neon, editorial serif typography.
- Main hero: row of poet portraits, large glowing `THE LEGENDARY POET`, no Christian label on cover.
- Christian evaluation must be separate, careful, and factual. See `src/docs/THEOLOGICAL_GUIDELINES.md`.
- The experimental 3D poets department was removed. Do not reintroduce it unless high-quality full-body models and a clear spatial UX plan are ready.

## Important Routes

- `/` — home page.
- `/poets` — catalog of poets.
- `/poets/:id` — poet detail page.
- `/articles` — article listing.
- `/articles/:id` — article detail page.
- `/music` — music section.
- `/about` — project information.

## Critical Files

- `src/components/home/HeroSection.tsx` — primary cover/hero; YouTube is the primary media channel, Rutube secondary.
- `src/components/command/CommandPalette.tsx` — global quick search and navigation via `Ctrl/Cmd + K`.
- `src/components/articles/ReadingProgress.tsx` and `ArticleMetaRail.tsx` — article reading UX enhancements.
- `src/components/BrandMark.tsx` — LP SVG emblem, no frame, must read as `LP` (never visually as `PL`).
- `src/data/poets.ts` — thin re-export aggregator for library data.
- `src/data/library/*.ts` — modular poet, article, and music data.
- `src/pages/ArticleDetailPage.tsx` — real article detail route for `/articles/:id`.
- `src/components/community/*` — localStorage-based rating, review, and comment system.
- `src/docs/THEOLOGICAL_GUIDELINES.md` — mandatory editorial/theological rules.
- `src/index.css` — neon/glow/luxury design tokens and effects.

## Dependencies Note

The package currently contains previously installed experimental 3D dependencies (`three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`). They are no longer imported in `src`. Do not edit `package.json` manually in Arena; remove them only with a proper package command outside this tool environment if desired.

## Known Arena Constraints

- The 150-line / 12 KB guidance is not a strict architecture rule. It is a transfer-safety guideline for LM Arena.
- Write clean modules first; split only when responsibility, readability, or transfer safety requires it.
- Poet data is now split into `src/data/library/*.ts`; keep adding new poets as separate modules.
- Avoid heavy 3D/WebGL in this project until performance and design quality can be guaranteed.
- If exact restoration is needed, create a TEXT_MIRROR or chunk large files instead of forcing source files into unnatural tiny fragments.

## File Size Audit

- Most UI components are already small enough for Arena transfer.
- `src/pages/PoetsPage.tsx` is around 144 lines and acceptable.
- `src/pages/AboutPage.tsx` is around 140 lines and acceptable.
- `src/data/poets.ts` is now a small aggregator.
- Large content risk is now inside individual poet modules; if one poet file grows too much, split poems/articles for that poet.
- `src/index.css` is large but acceptable as a centralized style/token file; split only if it becomes hard to maintain.

## Community Features

- Ratings and comments are localStorage prototypes, not backend-synced yet.
- Ratings support multiple dimensions, distributions, trust labels, positive/critical comment highlights, cooldowns, and one local browser vote per target.
- Future backend work should preserve the same shapes from `src/types/community.ts` where possible.