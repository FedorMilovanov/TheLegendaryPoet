# ARENA_PROJECT_PROTOCOL.md

## Arena Rules For This Project

- **Full agent contract:** `docs/AGENT_RULES.md` — read it before editing. This file is the short Arena-specific layer on top of it.
- Do not treat `150 lines` or `12 KB` as hard architecture laws. They are transfer/readability safeguards for LM Arena, not design rules.
- Write clean, logical modules first. Split files when a file has multiple responsibilities, becomes hard to review, or risks Arena truncation.
- Prefer small UI components, but do not create artificial fragmentation that makes the project harder to maintain.
- For transfer to a new Arena chat, prepare large files through summaries or a text mirror if exact restoration is needed.
- Avoid large JSX files with long Cyrillic prose. Put long texts and poetry data into `src/data/`.
- Poet data must stay modular in `src/data/library/*.ts`; do not rebuild one huge `poets.ts` file.
- New poets must be added as separate files in `src/data/library/` and exported through `src/data/library/index.ts`.
- Do not use emoji in UI. Prefer `PremiumIcons` / `ChannelIcons`; Lucide is acceptable inside dense community panels.
- Do not use weak placeholder 3D sections. `/hall` stays a lightweight placeholder until the R3F rebuild is quality-ready.
- Brand links and contact email live only in `src/config/site.ts`. Never hard-code YouTube/Rutube/VK/email in components.
- Internal navigation: import `Link` from `components/ui/Link`, never from `react-router-dom`.
- SVG `<defs id=…>` must be unique per instance (`useId`) — BrandMark and BookMonogram already do this.
- Before finishing: `npm run check` (typecheck + integrity + build). If routes/content changed, also `npm run sitemap`.

## Design Rules

- Dark luxury first.
- Brand title cyan-blue neon.
- Gold is secondary and restrained.
- Avoid clutter: no unnecessary chips, badges, labels, or weak decorative modules in hero.
- Motion must support hierarchy, not distract.
- If a feature does not meet the requested visual standard, remove it instead of leaving a weak prototype visible.

## Editorial Rules

- Poetry texts must be verified from reliable sources before use.
- Christian analysis must follow `src/docs/THEOLOGICAL_GUIDELINES.md`.
- Never invent poems, biographies, or spiritual claims.

## Package Rules

- Do not manually edit `package.json` in Arena.
- If dependencies must be removed, do it outside Arena or with an approved package command.

## Transfer Packaging Rules

- Original source files may exceed 150 lines when justified.
- If a file exceeds about 150 lines or 12 KB and must be copied into a future chat, export it in chunks or a TEXT_MIRROR format.
- The preferred long-term solution is modular source code plus a transfer mirror, not distorted source code.
- Current known large-ish files are individual poet modules and `src/index.css`; split only when responsibility or transfer safety requires it.
- Community rating/review logic is split into hooks, utils, and small components. Keep it modular.