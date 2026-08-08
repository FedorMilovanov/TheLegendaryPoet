# Upgrade Notes — historical merge record (12.07.2026)

> **HISTORICAL SNAPSHOT.** This file records the curated merge of the July 2026
> "cooler build" into the repository. It is useful for provenance, but it is not
> current architecture authority. Current technical state lives in
> `docs/CURRENT_STATE.md` / `docs/project-contract.json`. Hall-specific planning
> below is explicitly superseded by `docs/hall-v3/README.md` and
> `docs/hall-v3/hall-v3-contract.json` (`TLP-HALL-001`).

The user supplied a separate, never-pushed build of the same project
(`rebuildinglegendarypoetreactproject_1.zip`) that looked visually cooler in
places. This repo turned out to be **more complete in other places**. So this
was a *curated merge*, not a wholesale replacement. This file preserves that
historical decision record so future agents do not re-litigate it as though it
were a current implementation specification.

## Guiding rule used in that merge

- **Take the zip's visual/UX layer** where it was demonstrably stronger.
- **Keep the repo's substance** (content, backend, images, SEO, the 10th poet).
- Where they conflicted, keep whichever was judged better at the time and note it here.

This was the July merge rule, not permission to bypass later current-state or
Hall-v3 gates.

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
  `utils/poetMeta.ts` were imported from the alternate build. Their presence is
  historical provenance, **not automatic Hall-v3 art/schema authority**; Hall
  reuse must be revalidated against the current contract. Some semantic data
  may still be used by non-Hall surfaces such as `KindredSpirits`.
- **Types**: `Poet`/`Poem`/`MusicTrack` widened to the superset (coverImage,
  initials, epoch, epochLabel, music, poem.mood, track.videoUrl).
- **Feature restored earlier**: `InteractivePoemText` (gold word-by-word reader),
  wired into `poet-detail/PoemCard.tsx`.

## Kept FROM the repo (do NOT overwrite wholesale with the zip's version)

- **Content**: all 10 poets in `src/data/library/*`, incl. `alexanderBlok.ts`
  (**the zip only had 9 — no Blok**). Bios/poems here were more complete and
  subsequently continued through the repository's current editorial/source
  validation process.
- **Community/ratings**: the then-current `src/components/community/*` suite and
  associated stores/remote ownership were kept instead of the zip's empty stub.
  Current community architecture is governed by present source/contracts, not
  this historical description.
- **SEO / config / assets**: canonical site hooks/config and real portrait/icon
  assets were retained rather than being replaced wholesale by the zip.
- **Routing**: the repository's real router/asset-path ownership was retained.
  Exact hosting/basename statements from July are superseded by current
  `docs/CURRENT_STATE.md` and the route contract.
- **Comment logic**: the repository's stronger negation-aware comment handling
  was retained.

## Removed at the time (junk / superseded)

- `concept_hall.jpg` (root) and `reference/hall_target_v2.jpg` were removed as
  duplicate/old Hall references. `reference/hall_target_v3_temple.webp` remained
  after that merge as the then-preferred concept.

  **Current correction:** `reference/hall_target_v3_temple.webp` is now only a
  historical concept reference, not the single/approved Hall target. Its former
  public duplicate `public/images/hall-preview.webp` has been removed from
  production delivery under `TLP-HALL-001`.
- Superseded components after the page swaps: `home/HeroSection`,
  `home/StatsSection`, `poets/Poets{Hero,Filters,Grid,EmptyState}`,
  `music/*` (6 files), `AudioWave` (inlined into the then-current MusicPage).

## Hall status — historical note corrected by TLP-HALL-001

The July 2026 state was a lightweight `/hall` placeholder with a blurred concept
image, while the R3F implementation in `src/components/hall/*` was retained as
"scaffolding" for a future rebuild.

That description is **superseded**.

Current Hall foundation rules:

- production `/hall` is a lightweight DOM-only neutral placeholder;
- the stale public concept image is not shipped;
- `src/components/hall/*` is forensic Hall-v2 evidence, **not** the Hall-v3
  scaffold/runtime authority;
- the legacy directory is excluded from the current TypeScript contract and
  cannot be imported by current production source;
- no fixed temple/four-wing/dome programme is approved;
- Hall v3 proceeds only through reference bible → metric greybox → camera →
  material/lighting/export → Pushkin vertical slice → offline visual approval →
  web vertical slice gates.

See `docs/hall-v3/README.md` for the current plan. `docs/HALL_RESEARCH.md` is now
also explicitly marked as a superseded historical snapshot.
