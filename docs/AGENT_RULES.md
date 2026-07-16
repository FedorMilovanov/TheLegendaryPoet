# Agent Rules — THE LEGENDARY POET

Rules for any AI agent (Arena, Claude, Cursor, Copilot, …) working on this repo.
**Read this before editing.** Violations create the exact regressions this project keeps fighting.

If a rule conflicts with a short-term visual request, **keep the rule** and ask — do not ship a one-off exception.

---

## 1. Identity of the product

- Dark luxury editorial site about great Russian poets.
- Brand title: cyan-blue neon (`neon-blue-gradient` / `neon-glow-text`).
- Gold is secondary and restrained.
- Emblem: **hooded cloaked figure** (`BrandMark`) — never restore the old `LP` monogram.
- No Christian label on the cover / homepage hero.
- No emoji in UI. Icons: `PremiumIcons` or `ChannelIcons` (custom SVG), not emoji, not random bitmaps.
- Prefer `PremiumIcons` over raw `lucide-react` for shell/chrome so motion and stroke weight stay consistent. Lucide is acceptable inside dense community panels until those icons are ported.

## 2. Single sources of truth

| Concern | Source | Do not |
| --- | --- | --- |
| Channel URLs, contact email, site URL | `src/config/site.ts` | Hard-code YouTube/Rutube/VK/email in components |
| Public asset paths under GitHub Pages base | `asset()` from `src/utils/asset.ts` | Use bare `/images/...` in JSX `src=` without `asset()` (or use `PoetImage`) |
| Internal navigation | `Link` / `NavLink` / `useAppNavigate` from `src/components/ui/Link.tsx` | Import `Link` from `react-router-dom` |
| View-transition shared elements | `vtShared()` from `src/lib/viewTransition.ts` | Invent ad-hoc `viewTransitionName` strings |
| Poet data | `src/data/library/<poet>.ts` + `library/index.ts` | Merge poets back into one giant file |
| Articles list | `getAllArticles()` from `src/utils/articleLibrary.ts` | Read only `articles` and forget poet-attached ones |
| Essays | `src/data/essays/*` + `getAllEssays()` / `getEssayBySlug()` | Hand-roll a second essay renderer |
| Heading casing | `titleCase()` from `src/utils/titleCase.ts` | Manually Title-Case Russian headings in JSX |
| Theological commentary | `src/docs/THEOLOGICAL_GUIDELINES.md` | Invent faith claims about poets |
| Poetry text sources | `docs/RESEARCH_SOURCES.md` | Invent or paraphrase poems as if canonical |

`npm run check:integrity` enforces several of these automatically.

## 3. Architecture that must not regress

### Shell is persistent

- `SiteLayout` is a **layout route** (`<Route element={<SiteLayout />}>` + `<Outlet />`).
- Header, Footer, SmoothScroll (Lenis), CommandPalette, CustomCursor, MobileDock mount **once**.
- Do not wrap every page in its own `SiteLayout` again — that remounts Lenis and kills scroll continuity.

### Smooth scroll

- Lenis lives in `SmoothScroll`, created once, destroyed on shell unmount.
- Route changes: top if no hash; `scrollToHash()` if `#…` (retries for lazy routes).
- In-page jumps go through `utils/smoothScroll.ts` (`scrollToId` / `scrollToHash`) — never raw `window.scrollTo` for animated jumps while Lenis is active.

### Icons

- Shell and content UI use `PremiumIcons` / `ChannelIcons` only.
- `lucide-react` is banned in `src/` (enforced by `check:integrity`).
- New icons: add to `PremiumIcons.tsx` with the house stroke weight + hover variants.

### View Transitions

- Every internal navigation must use `components/ui/Link` so `viewTransition` is on.
- Shared elements (poet portrait, essay cover) use the **same** `vtShared('…')` name on both ends.
- Fallback browsers keep the framer wipe via `PageWrapper` — do not delete it.

### Reading chrome

- `useAutoHideChrome()` is mounted once in the shell.
- New fixed UI opts into hide via **one CSS selector** in `index.css` (`.site-header`, `.mobile-dock`, `.reading-progress`, `.scroll-top-btn`, `.palette-fab`, `.section-chip`). Do not add another scroll listener.

### Essay engine

- Author data, never styles. New essay = new file in `src/data/essays/` + register in `index.ts`.
- New block type = extend `EssayBlock` union + add a `case` in `blocks.tsx` (the `never` guard forces it) + tokens in `theme.ts`.
- Full guide: `docs/ESSAY_ENGINE.md`.

### Hall (3D)

- `/hall` is a **placeholder** (`HallPage.tsx`). R3F stack in `src/components/hall/*` is scaffolding and is **not** imported on the live route — keep it that way until the rebuild is quality-ready.
- Do not ship unfinished 3D as a visible feature. Remove rather than show a weak prototype (protocol rule).

### Community feedback

- Modular: `components/community/*`, `hooks/useCommunityFeedback.ts`, `utils/communityStore.ts`, `utils/feedbackValidation.ts`, optional `communityRemote.ts` (Supabase).
- Target types: `poet | poem | track | article | essay` — essays must use `essay`, never `article`.
- Validation limits live in `FEEDBACK_LIMITS` (`types/community.ts`); forms and store share them.
- One local vote per target (`hasRated`); cooldowns; helpful votes are one-shot per comment.
- Honest copy: if remote is off, say "on this device"; if on, say "shared". Never invent social proof (mini-summary returns `null` when empty).
- Do not collapse back into one mega-component. Local store is the default; remote is opt-in via env.

## 4. Visual system (do not invent a second palette)

- Background near-black `#050505` / `#020811`.
- Cyan brand: `#00d4ff` family, neon gradients already in `index.css`.
- Gold: `#d4af37` (`luxury-gold`) — accents, restrained.
- Serif: Cormorant (self-hosted). Sans: Inter (self-hosted). No Google Fonts CDN.
- Motion supports hierarchy; `MotionConfig reducedMotion="user"` is global — honour it.
- Light theme exists via `html.theme-light`. If you add a new hard-coded dark bg class, also cover it in the light-theme overrides in `index.css` **or** prefer theme tokens / `luxury-card` so it inherits.

## 5. Content integrity

1. Never invent poems, biographies, quotes, or spiritual claims.
2. Canonical verse must be verified against sources in `docs/RESEARCH_SOURCES.md` (2+ sources when possible).
3. Christian analysis only where text/biography actually supports it — see `THEOLOGICAL_GUIDELINES.md`.
4. Do not baptise poets. Talent and light-imagery ≠ personal faith.
5. New poet = new file `src/data/library/<camelName>.ts`, export from `library/index.ts`, photo in `public/images/`, entry will appear in sitemap after `npm run sitemap`.

## 6. SVG discipline

- Any SVG that uses `<defs>` with `id=` **must** generate unique ids per instance (`useId()`), because multiple instances (header + footer BrandMark, repeated BookMonogram) share the document paint server.
- Pattern: `const id = useId().replace(/:/g, '');` then `` id={`hoodFill-${id}`} `` / `` fill={`url(#hoodFill-${id})`} ``.

## 7. What agents must run before finishing

```bash
npm run check          # typecheck + integrity + production build
# or at least:
npm run typecheck
npm run check:integrity
npm run build
```

If you added routes, poets, essays, or articles:

```bash
npm run sitemap        # regenerates public/sitemap.xml
```

Do **not** hand-edit `package.json` dependency versions in Arena (protocol). Scripts block is fine.

## 8. Docs that must stay true

When you change architecture, update the relevant doc in the **same** change:

| Doc | Owns |
| --- | --- |
| `docs/AGENT_RULES.md` | This file — agent contract |
| `ARENA_PROJECT_PROTOCOL.md` | Arena transfer / size / package rules |
| `COMPONENT_BLUEPRINTS.md` | Component map (must match real tree) |
| `PROJECT_RESTORE_MASTER.md` | Visual + brand restore brief |
| `docs/ESSAY_ENGINE.md` | Essay block system |
| `docs/UPGRADE_NOTES.md` | Record of curated merges (do not re-litigate) |
| `docs/THEOLOGICAL_GUIDELINES.md` (under `src/docs/`) | Editorial faith rules |

If a doc describes a path that no longer exists (`src/components/home/…`, LP monogram, etc.), **fix the doc** — stale docs are how agents re-introduce deleted code.

## 9. Anti-regression checklist (quick)

Before merging / finishing a session, confirm:

- [ ] No hard-coded channel URLs or `contact@legendarypoet.com`
- [ ] No `Link` import from `react-router-dom` outside `ui/Link.tsx`
- [ ] No emoji in `src/**/*.{ts,tsx}`
- [ ] New public images go through `asset()` or `PoetImage`
- [ ] SVG gradient ids are unique per instance
- [ ] SiteLayout still a layout route (shell not remounting)
- [ ] Lenis not recreated on every pathname change
- [ ] `/hall` still does not import three.js
- [ ] `npm run check` is green
- [ ] Sitemap regenerated if routes/content changed
- [ ] Docs that you made false were updated

## 10. Tone of changes

Prefer:

- small cohesive modules over artificial 150-line fragmentation
- deleting weak prototypes over shipping them “for later”
- fixing the source of truth over patching every call site
- universal engines (essay blocks, community store, view transitions, chrome hide) over one-page snowflakes

Refuse:

- second icon systems, second colour tokens, second router wrappers
- inventing content to fill empty sections
- “temporary” hard-coded links “just for this page”
