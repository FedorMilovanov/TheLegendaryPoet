# COMPONENT_BLUEPRINTS.md

Living map of the real component tree. Update this file when you add, move, or delete a module — stale blueprints are a regression vector for agents.

## Core App

- `src/App.tsx` — router, layout route (`SiteLayout` + `<Outlet />`), intro wipe, analytics/community hydrate.
- `src/components/SmoothScroll.tsx` — Lenis engine (created once; route changes only reset scroll).
- `src/components/CustomCursor.tsx` — desktop-only custom cursor.
- `src/components/ErrorBoundary.tsx` — recoverable full-page error with home link.
- `src/components/ScrollToTop.tsx` — floating button; drives Lenis via `tlp-scroll-top`.
- `src/components/MobileDock.tsx` — mobile bottom nav + command-palette jewel.
- `src/components/PoetryBackdrop.tsx` — ambient poetic atmosphere layer.
- `src/components/command/CommandPalette.tsx` — global search (`Ctrl/Cmd + K`).
- `src/components/command/CommandResult.tsx` — individual palette result.
- `src/components/command/commandItems.ts` — sections, poets, articles, essays, tracks.

## Brand

- `src/components/BrandMark.tsx`
  - Props: `size?: 'sm' | 'md' | 'lg'`.
  - Hooded cloaked figure (anonymous legendary poet). Pure SVG, frameless.
  - **Not** the old LP monogram. Do not restore LP.
  - Gradient ids are instance-unique via `useId`.
- `src/components/ChannelIcons.tsx`
  - `YouTubeIcon`, `RutubeIcon`, `VKIcon`, `BookMonogramIcon`.
  - Prefer these over generic icons in hero, header, footer, about.
- `src/components/PremiumIcons.tsx` — house icon set (stroke weight + hover motion).
- `src/config/site.ts` — **single source** for channel URLs, contact email, site URL.

## Navigation / chrome

- `src/components/Header.tsx` — fixed top nav, theme toggle, command trigger, socials.
- `src/components/Footer.tsx` — brand, word-of-day, sections, socials + mail.
- `src/components/ThemeToggle.tsx` — `html.theme-light` toggle, persisted.
- `src/components/ui/Link.tsx` — site-standard `Link` / `NavLink` / `useAppNavigate` (View Transitions).
- `src/hooks/useAutoHideChrome.ts` — reading-mode chrome hide (one class on `<html>`).
- `src/lib/viewTransition.ts` — `supportsViewTransitions`, `vtShared()`.

## Home (`src/pages/HomePage.tsx`)

Hero, stats, poem-of-day, featured poets, quote, faith/culture CTA are **local sections inside the page** (not a `components/home/` folder). Keep it that way unless a section grows a second consumer.

Related:

- `src/components/PoetCard.tsx` — catalog card (uses `PoetImage` + `TiltCard`).
- `src/components/PoetImage.tsx` — base-aware image with branded monogram fallback.
- `src/components/PoemOfDay.tsx`, `KineticText.tsx`, `Reveal.tsx`, `MagneticButton.tsx`, `TiltCard.tsx`.

## Poets catalog (`src/pages/PoetsPage.tsx`)

Filters/grid/empty-state are local to the page. Card is shared: `PoetCard`.

## Poet detail

- `src/pages/PoetDetailPage.tsx` — orchestrator.
- `src/components/poet-detail/HeroSection.tsx` — full-screen portrait hero.
- `src/components/poet-detail/InfoCard.tsx` — dates, nationality, media.
- `src/components/poet-detail/FamousWorks.tsx`
- `src/components/poet-detail/PoemCard.tsx` + `InteractivePoemText.tsx`
- `src/components/poet-detail/SpiritualPath.tsx`, `AuthorCommentary.tsx`, `Testimonies.tsx`
- `src/components/poet-detail/KindredSpirits.tsx` — connections from `poetConnections.ts`
- `src/components/poet-detail/PoetCommunitySummary.tsx`, `PoemQuickNav.tsx`

## Articles

- `src/pages/ArticlesPage.tsx`, `src/pages/ArticleDetailPage.tsx`
- `src/components/articles/ArticleCard.tsx`, `ArticleMetaRail.tsx`, `ReadingProgress.tsx`
- `src/components/articles/article-detail/{ArticleHeader,ArticleBody,RelatedArticles}.tsx`
- `src/utils/articleLibrary.ts` — global + poet-attached articles.

## Essays (long-form engine)

- `src/pages/EssayPage.tsx`
- `src/components/essay/*` — pure engine: `theme.ts`, `richText.tsx`, `anchor.ts`, `blocks.tsx`, `ArticleRenderer.tsx`, `EssayCover.tsx`, `EssayHero.tsx`, `EssayCard.tsx`, `SectionChip.tsx`
- Data: `src/data/essays/*`, types: `src/types/essay.ts`
- Guide: `docs/ESSAY_ENGINE.md`

## Music (`src/pages/MusicPage.tsx`)

Hero / intro / track row / feedback / future note are local sections on the page (hybrid of zip visuals + real audio / external links). Track data: `src/data/library/musicTracks.ts`.

## About

- `src/pages/AboutPage.tsx`
- `src/components/about/{AboutHero,MissionSection,OfferGrid,YouTubeFeature,SocialLinks,ContactBlock,HallFeature}.tsx`

## Community ratings

- `src/components/community/CommunityPanel.tsx` — orchestrator (ratings + comments + analytics).
- Forms/controls: `RatingForm`, `RatingStars` (hover + keyboard), `CommentComposer` (limits, Ctrl/⌘+Enter), `CommentList` (sort + paginate), `CommentCard` (relative time, helpful state).
- Analytics: `CommunityInsights`, `RatingBars`, `RatingDistribution`, `FeedbackPair`, `FeedbackMiniSummary`.
- `src/hooks/useCommunityFeedback.ts` — reactive API over the store.
- `src/utils/communityStore.ts` — single in-memory snapshot + localStorage + cross-tab sync.
- `src/utils/feedbackValidation.ts` — shared sanitize/validate/plural/relative-time.
- `src/utils/communityRemote.ts` — optional Supabase REST (env-gated, row-validated).
- `src/utils/commentHighlights.ts`, `src/utils/ratingInsights.ts`
- Target types: `poet | poem | track | article | essay`.

## Hall (deferred 3D)

- Live route: `src/pages/HallPage.tsx` — placeholder only (no three.js).
- Scaffolding (not routed): `src/components/hall/*` (`HallOfPoets`, `HallEnvironment`, `PoetNiche`, controls, materials…).
- Do not import the scaffolding into the live route until quality-ready.

## Data library

- `src/data/poets.ts` — thin re-export aggregator.
- `src/data/library/index.ts` — hub.
- `src/data/library/*.ts` — one module per poet + `articles.ts` + `musicTracks.ts`.
- `src/data/essays/*` — long-form essays.
- Supporting: `epochColors.ts`, `poetConnections.ts`, `poetMuseumMeta.ts`, `commentKinds.ts`, `ratingDimensions.ts`.

## Archive / daily

- `src/pages/MyArchivePage.tsx` + `src/utils/myArchiveStore.ts`
- `src/utils/dailyContent.ts` — poem/word of the day.

## Scripts / guards

- `scripts/gen-sitemap.mjs` — rebuild `public/sitemap.xml` from data (`npm run sitemap`).
- `scripts/check-integrity.ts` — data/brand/nav regression guard (`npm run check:integrity`).
- `scripts/prerender-og.mjs` — OG pages at deploy time.
- Full gate: `npm run check` = typecheck + integrity + build.

## Modularity policy

- Component size follows responsibility, not a rigid line count.
- 120–180 lines is fine when cohesive; split on separate concerns (layout / data / interaction / animation).
- For Arena handoff, mirror/chunk large files rather than distorting source architecture.
- See `docs/AGENT_RULES.md` for the full agent contract.
