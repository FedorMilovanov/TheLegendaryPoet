# COMPONENT_BLUEPRINTS.md

## Core App

- `src/App.tsx` — router, page transitions, global layout.
- `src/components/command/CommandPalette.tsx` — global quick navigation/search palette, opens via `Ctrl/Cmd + K`.
- `src/components/Header.tsx` also exposes a visible desktop command trigger button.
- `src/components/command/CommandResult.tsx` — individual palette result.
- `src/components/command/commandItems.ts` — command/search item generation from sections, poets, articles, and tracks.
- `src/components/SmoothScroll.tsx` — Lenis smooth scrolling wrapper.
- `src/components/CustomCursor.tsx` — desktop-only custom cursor.

## Brand

- `src/components/BrandMark.tsx`
  - Props: `size?: 'sm' | 'md' | 'lg'`.
  - Pure SVG LP monogram.
  - Must clearly read as `LP`, not `PL`.
  - No frame, no emoji, no bitmap dependency.
- `src/components/ChannelIcons.tsx`
  - Custom SVG icons for YouTube, Rutube, and book/catalog mark.
  - Prefer these over generic icons in hero, header, and footer.

## Home

- `src/components/home/HeroSection.tsx`
  - Main cover section.
  - Uses portrait row, cyan-blue title, YouTube/Rutube CTA area.
- `src/components/home/StatsSection.tsx`
  - Counts poets, poems, tracks, articles.
- `src/pages/HomePage.tsx`
  - Composes hero, stats, featured poets, quote, and careful faith/culture CTA.

## Articles

- `src/pages/ArticlesPage.tsx`
  - Article listing, category filter, uses `ArticleCard`.
- `src/pages/ArticleDetailPage.tsx`
  - Article detail route for `/articles/:id`.
- `src/components/articles/ArticleCard.tsx`
  - Reusable article preview card.
- `src/components/articles/ArticleMetaRail.tsx`
  - Sticky reading metadata rail for article detail pages.
- `src/components/articles/ReadingProgress.tsx`
  - Top reading progress indicator for long-form articles.
- `src/components/articles/article-detail/ArticleHeader.tsx`
  - Article title, meta and excerpt block.
- `src/components/articles/article-detail/ArticleBody.tsx`
  - Long-form article body renderer.
- `src/components/articles/article-detail/RelatedArticles.tsx`
  - Related article grid.
- `src/utils/articleLibrary.ts`
  - Collects global articles and poet-attached articles.

## About

- `src/pages/AboutPage.tsx`
  - Composes the About page from small section components.
- `src/components/about/AboutHero.tsx`
  - About page heading.
- `src/components/about/MissionSection.tsx`
  - Mission and careful theological framing.
- `src/components/about/OfferGrid.tsx`
  - Three core project offerings.
- `src/components/about/YouTubeFeature.tsx`
  - Primary YouTube channel CTA.
- `src/components/about/SocialLinks.tsx`
  - YouTube, Rutube, VK links.
- `src/components/about/ContactBlock.tsx`
  - Contact CTA.

## Music

- `src/pages/MusicPage.tsx`
  - Composes music page sections.
- `src/components/music/MusicHero.tsx`
  - Music page heading and introduction.
- `src/components/music/MusicIntro.tsx`
  - Editorial intro card for the music section.
- `src/components/music/TrackList.tsx`
  - Track list wrapper.
- `src/components/music/TrackRow.tsx`
  - Individual track row with playback/download/external actions.
- `src/components/music/TrackFeedbackSection.tsx`
  - Rating panels for music tracks.
- `src/components/music/MusicFutureNote.tsx`
  - Future growth note.

## Data Library

- `src/data/poets.ts`
  - Thin re-export aggregator.
- `src/data/library/index.ts`
  - Main data export hub.
- `src/data/library/*.ts`
  - Per-poet data modules plus articles and music tracks.

## Community Ratings

- `src/components/community/CommunityPanel.tsx`
  - Main orchestrator for ratings, comments, distribution, insights, and toasts.
- `src/hooks/useCommunityFeedback.ts`
  - LocalStorage-backed feedback hook.
- `src/utils/communityStore.ts`
  - Persistence, cooldown, one-vote guard, distribution helpers.
- `src/components/community/RatingForm.tsx`
  - Multi-dimensional rating form.
- `src/components/community/CommentComposer.tsx`
  - Comment form with category/kind selector.
- `src/components/community/CommentList.tsx`
  - Sortable comments list.
- `src/components/community/FeedbackPair.tsx`
  - Positive and critical highlighted comments.
- `src/components/community/FeedbackMiniSummary.tsx`
  - Small social-proof summary for cards.

## Poets Catalog

- `src/pages/PoetsPage.tsx`
  - Small orchestrator for poet catalog.
- `src/components/poets/PoetsHero.tsx`
  - Catalog heading block.
- `src/components/poets/PoetsFilters.tsx`
  - Search, tag filter, sort controls.
- `src/components/poets/PoetsGrid.tsx`
  - Grid wrapper for poet cards.
- `src/components/poets/PoetsEmptyState.tsx`
  - Empty-state for zero matches.
- `src/components/PoetCard.tsx`
  - Poet preview card with image, tags, rating, CTA.

## Poet Detail

- `src/pages/PoetDetailPage.tsx`
  - Small orchestrator page.
- `src/components/poet-detail/HeroSection.tsx`
  - Full-screen poet portrait hero.
- `src/components/poet-detail/InfoCard.tsx`
  - Dates, nationality, media buttons.
- `src/components/poet-detail/FamousWorks.tsx`
  - Known works list.
- `src/components/poet-detail/PoemCard.tsx`
  - Poem, literary analysis, optional explicit spiritual note.
- `src/components/poet-detail/SpiritualPath.tsx`
  - Separate spiritual/worldview commentary when evidence exists.
- `src/components/poet-detail/AuthorCommentary.tsx`
  - Project commentary for clear moral/theological cases.

## Removed Components

The former experimental 3D/map components were deleted. If a future session introduces a serious 3D department, it must be built as a separate documented feature branch and kept performance-safe.

## Modularity Policy

- Component size should follow responsibility, not a rigid line count.
- A component around 120-180 lines can be acceptable if it is cohesive and readable.
- Split components when there are separate concerns: layout, data display, interaction, animation, or repeated UI.
- For Arena handoff, large files should be mirrored/chunked rather than distorted.