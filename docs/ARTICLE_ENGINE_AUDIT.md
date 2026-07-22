# Article engine audit

Every public `/essays/*` and `/articles/*` route is now rendered by the same typed longform stack:

- `LongformPage` owns the page shell, hero, reading progress, table of contents, source rail, series navigation, sharing, and community panel.
- `ArticleRenderer` renders the shared `EssayBlock` model.
- Older compact `Article` records are converted to `Essay` data by `legacyArticleToEssay`; they no longer have a separate DOM or styling engine.
- Obsolete `ArticleBody`, `ArticleHeader`, and `ArticleMetaRail` renderers were removed.

Editorial enrichment is attached to stable block ids. Inline citations, image placement, archive insertion, and movement extraction fail loudly when their target id is missing. They no longer depend on mutable paragraph prefixes, image filename fragments, or visible section titles.

The Playwright audit discovers every article route from the public listing and runs in desktop Chromium and a Pixel 7 profile. It verifies:

- one universal renderer on every route;
- every lazy image loads with real dimensions;
- every article image opens and closes through the lightbox;
- the lightbox covers the true viewport through a `document.body` portal;
- focus trapping, zoom, Escape, focus restoration, and body scroll locking;
- every inline citation reveals its bibliography target;
- source filtering, console errors, page errors, and horizontal overflow;
- visible slices from the beginning, middle, and end of every longread;
- immediate readable content under `prefers-reduced-motion`.

The regular CI separately guards article-engine convergence, stable block-id uniqueness, bibliography references, content requirements, TypeScript, build, sitemap, and prerender output.
