# PROJECT_RESTORE_MASTER.md

## Restore Goal

Restore THE LEGENDARY POET as a premium dark luxury editorial site, not as a generic dashboard or gimmick-heavy landing page.

## Visual System

- Primary brand color: cyan-blue neon.
- Support color: restrained luxury gold only where hierarchy needs warmth.
- Background: near-black `#050505` with subtle ambient glow and noise.
- Typography: serif hero/editorial headings, clean sans for navigation and UI.
- Motion: Framer Motion, restrained. Use motion for hierarchy and presence, not noise.

## Hero Rules

- No Christian label on the cover.
- Hero should show poets/atmosphere/brand clearly.
- Main title must read: `THE LEGENDARY POET` in cyan-blue glowing style.
- Current hero component: `src/components/home/HeroSection.tsx`.

## LP Emblem

- Current component: `src/components/BrandMark.tsx`.
- The emblem must be SVG, frameless, clean, and readable as `LP`.
- Letter order matters: left `L`, right `P`. Never allow a monogram that reads visually as `PL`.
- Do not replace with emoji or bitmap-only logo.

## Channel Priority

- On key screens, YouTube should appear before Rutube.
- Use custom SVG icons for YouTube and Rutube where possible, not generic substitutes.

## Global Navigation Feature

- `src/components/command/CommandPalette.tsx` provides premium quick navigation.
- Shortcut: `Ctrl/Cmd + K`.
- It searches sections, poets, articles, and tracks.

## Removed 3D Section

The previous experimental 3D poets section was removed because it did not match the requested quality. Do not add it back as cards, tables, or weak pseudo-models.

If restored later, it must be a true spatial poet department:

- full-body poet figures;
- historically guided clothing and posture;
- map-like spatial relationships;
- no table/card feel;
- optimized GLB or very high-quality vector prototype;
- clear performance budget.

## Arena Restoration Notes

- Do not enforce arbitrary file-size limits during normal development.
- Use small components where it improves clarity.
- Use transfer mirrors/chunks for large files when moving between Arena sessions.
- Poet data has been split into `src/data/library/*.ts`; preserve this module structure.
- Future cleanup should split any individual poet module only if it becomes too large or mixes too many concerns.

## Current Data Structure

- `src/data/poets.ts` is a thin aggregator.
- `src/data/library/index.ts` exports poets, articles, and music tracks.
- Each major poet has a separate module in `src/data/library/`.
- Article content is in `src/data/library/articles.ts`.
- Music content is in `src/data/library/musicTracks.ts`.

## Community Review System

- Local prototype lives in `src/components/community/`, `src/hooks/useCommunityFeedback.ts`, and `src/utils/communityStore.ts`.
- It supports multi-dimensional ratings, local cooldowns, one local rating per target, helpful votes, positive/critical highlights, and compact mode.
- It is not a real authenticated backend yet.

## Data Integrity

- Use verified poetry texts.
- Current verified fixes include Pushkin `Пророк`, Yesenin `Не жалею...`, Yesenin `Письмо матери`, Akhmatova `Реквием / Распятие`.
- Do not invent poems.
- Do not paraphrase canonical poems as if original.

## Theological Editorial Rules

Read `src/docs/THEOLOGICAL_GUIDELINES.md` before editing spiritual commentary.

Key rule: do not make poets Christians unless history/text supports it. Comment only where evidence is clear.