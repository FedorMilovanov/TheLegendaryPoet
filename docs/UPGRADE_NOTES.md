# Upgrade Notes — merge of the "cooler build" into this repo (12.07.2026)

The user supplied a separate, never-pushed build of the same project
(`rebuildinglegendarypoetreactproject_1.zip`) that looked visually cooler in
places. This repo turned out to be **more complete in other places**. So this
was a *curated merge*, not a wholesale replacement. This file is the record so
future agents don't re-litigate it.

## Guiding rule

- **Take the zip's visual/UX layer** (styles, page layouts, animated components).
- **Keep the repo's substance** (content, backend, images, SEO, the 10th poet).
- Where they conflict, keep whichever is objectively better and note it here.

## Taken FROM the zip ("cooler build")

- **Stylesheet**: `src/index.css` adopted wholesale (731→ merged 758 lines). The
  `@theme` tokens were identical, so no repo component regressed. A handful of
  repo-only rules (`.has-custom-cursor`, `reveal-clip`/`holo-shine`/`shimmer`
  keyframes) were appended at the bottom.
- **Pages**: `HomePage`, `PoetsPage`, `NotFoundPage`, `Footer` adopted as-is;
  `MusicPage` is a **hybrid** (zip visuals + repo's real `<audio>` playback,
  `externalUrl` links, and `useSeo`); `AboutPage` kept from repo + one new
  `HallFeature` promo section.
- **Components (new)**: `PremiumIcons`, `Reveal`, `ScrollToTop`, `ErrorBoundary`,
  `PoetImage`, `KineticText`, `PoemOfDay`, `ThemeToggle`, `MobileDock`,
  `PoetryBackdrop`, `MyArchivePage` + `myArchiveStore`, `dailyContent`.
- **Components (replaced)**: `Header` (ThemeToggle + animated nav + works with the
  bottom `MobileDock`), `ChannelIcons` (superset — adds `VKIcon`), `ArticleCard`
  (TiltCard + richer, same props).
- **Shell**: `App.tsx` layout (SiteLayout, skip-link, WipeOverlay page transition,
  PoetryBackdrop, MobileDock, ScrollToTop, ErrorBoundary).
- **Data**: `epochColors.ts`, `poetConnections.ts`, `poetMuseumMeta.ts`,
  `utils/poetMeta.ts`. Now surfaced live via `poet-detail/KindredSpirits.tsx`.
- **Types**: `Poet`/`Poem`/`MusicTrack` widened to the superset (coverImage,
  initials, epoch, epochLabel, music, poem.mood, track.videoUrl).
- **Feature restored earlier**: `InteractivePoemText` (gold word-by-word reader),
  wired into `poet-detail/PoemCard.tsx`.

## Kept FROM the repo (do NOT overwrite with the zip's version)

- **Content**: all 10 poets in `src/data/library/*`, incl. `alexanderBlok.ts`
  (**the zip only had 9 — no Blok**). Bios/poems here are ~2× longer and
  fact-checked against `docs/RESEARCH_SOURCES.md`.
- **Community/ratings**: the entire `src/components/community/*` suite +
  `useCommunityFeedback` + `communityStore` + `communityRemote` (Supabase). The
  zip's `CommunityPanel` was an empty stub — adopting it would have deleted the
  backend.
- **SEO / config / assets**: `hooks/useSeo`, `config/site`, `utils/asset`, all
  real portrait images + icons + `sitemap`/`robots`/manifest.
- **Routing**: `BrowserRouter` + `basename` (GitHub Pages `/TheLegendaryPoet/`),
  not the zip's `HashRouter`. Every public asset path goes through `asset()` —
  `PoetImage` was patched to do this so bare `/images/...` don't 404 on Pages.
- **Comment logic**: `utils/commentHighlights.ts` (whole-word negation analysis).

## Removed (junk / superseded, to avoid confusion)

- `concept_hall.jpg` (root) and `reference/hall_target_v2.jpg` — old hall
  reference (byte-identical dup). Only `reference/hall_target_v3_temple.webp`
  remains as the single approximate target.
- Superseded components after the page swaps: `home/HeroSection`,
  `home/StatsSection`, `poets/Poets{Hero,Filters,Grid,EmptyState}`,
  `music/*` (6 files), `AudioWave` (inlined into MusicPage).

## Deferred (kept but intentionally not shipped)

- **Hall v3 (`/hall`)**: museum vestibule (Pass 1) — see `docs/HALL_V3_PASSES.md`.
  DOM pantheon with four era wings; R3F scaffolding under `src/components/hall/*`
  root remains unrouted so three.js does not ship.
