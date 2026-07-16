# Hall v3 — multi-pass build log

Working method (user mandate): **not a rush prototype**. Each pass deepens
5–10 details, then Playwright-strict check, then fix, then next pass.
Target spirit: ancient museum pantheon (marble, gold, dome light) —
`reference/hall_target_v3_temple.webp`. **Not** cyan-space / starfield.

## North star (from reference)

- Central atrium under a coffered glass dome, warm god-rays
- Four wings by era (I Golden, II Silver, III Soviet, IV Contemporary)
- Gold-framed portraits + bronze plaques with name, years, first line
- Polished dark marble floor, compass plate at entrance
- Benches, sconces, quiet museum hierarchy — no UI chrome noise

## Pass log

### Pass 1 — Foundation + museum vestibule

**Goal:** ship a *real* hall page that already feels like a museum entrance,
without loading three.js. Establish data architecture that future 3D reuses.

Delivered:

- `src/data/hall/wings.ts` — single source of wing layout + poet placement
- `src/components/hall/museum/*` — atrium, compass, wings, niches (DOM)
- `HallPage.tsx` — mounts museum vestibule (no R3F import)
- Playwright suite + `check:hall` smoke
- Old R3F scaffolding stays in `src/components/hall/*` root, **not routed**

### Pass 2 — Material depth on vestibule (this pass)

Delivered:

- Layered stone grain + polished floor wash under atrium
- Double gold frame on niches; bronze plaque with material chip (from museum meta)
- Soft dome-light parallax (pointer, reduced-motion / coarse off)
- Wing IV as **sealed door** (arch + lock + copy), not a blank dashed box
- Compass: arrow-key roving between directions; `aria-controls` → wing
- Scroll-spy sets active wing on the compass while reading
- Focus moves into the wing after compass activation

### Pass 3 — (next) First R3F atrium only

- Dome + floor + four arch portals, no portraits yet
- Warm IBL, no cyan fog, Lenis-prevent, WebGL gate
- Must match vestibule palette tokens

### Pass 4+ — niches, rail camera, sound, morph

See `HALL_ROADMAP_6_MONTHS.md` and `docs/HALL_RESEARCH.md`. Roadmap stays
valid; this file is the **execution journal**.

## Hard rules

1. Poet ids always full library ids (`alexander-pushkin`), never short keys.
2. No invented quotes — only `poetMuseumMeta.mainQuote` or verified poem titles.
3. three.js never enters the homepage bundle; Hall loads it only via lazy route
   when/if R3F ships.
4. Every pass ends with `npm run check` + Playwright hall suite green.
