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

### Pass 3 — First R3F atrium (this pass)

Delivered:

- `src/components/hall/atrium/*` — warm rotunda: marble floor, coffered dome,
  four arch portals labelled I–IV from `hallWings` (no portraits yet)
- Palette matches vestibule (`atriumTheme.ts` ↔ `hallMuseum.css` gold/stone)
- Lazy load + **user opt-in** button; WebGL / reduced-motion → DOM fallback
- `data-lenis-prevent` on canvas stage; gentle camera drift (off if reduced-motion)
- Old `HallOfPoets` cyan-nave still **not** routed
- Integrity: App shell free of three.js; HallPage free of direct three imports

### Pass 4 — Portraits in portals + camera focus (this pass)

Delivered:

- `PortalPortrait` — gold-framed textures via `asset()`, click → poet dossier
- Up to 2 portraits per open arch from `hallWings` (Pushkin/Lermontov, Blok/Gumilev, …)
- Modern arch remains **sealed** (no fake poets)
- Camera eases toward focused wing; compass / scroll-spy / atrium share `activeWing`
- Click arch void → focus + scroll to DOM wing; click empty space → clear focus
- Central pedestal under oculus; corner pilasters; navigation **outside** Canvas
- Stage copy updated; reset-camera control when a wing is focused

### Pass 5 — Depth & focus controls (this pass)

Delivered:

- Bronze name/years plaque under each 3D portrait
- Emphasized frame glow when wing focused or arch hovered
- DOM chip row (I–IV) under atrium stage to aim camera + scroll to wing
- Merge of parallel content branch (moral portraits, Mayakovsky essay, library validation)

### Pass 6 — (next)

- Optional look-at single poet inside an arch
- Stronger free PBR textures when assets land
- Sound / morph still later

## Hard rules

1. Poet ids always full library ids (`alexander-pushkin`), never short keys.
2. No invented quotes — only `poetMuseumMeta.mainQuote` or verified poem titles.
3. three.js never enters the homepage shell (`index`/`react`/`motion` chunks);
   atrium only via lazy() on `/hall` after opt-in.
4. Every pass ends with `npm run check` + `npm run check:hall` green.
5. Router hooks never run inside `<Canvas>` — pass callbacks from Stage.
