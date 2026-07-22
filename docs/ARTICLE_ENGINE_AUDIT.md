# Article engine audit

This branch verifies every `/essays/*` and `/articles/*` route in desktop and mobile Chromium.

Current architecture finding: premium longreads use the typed `EssayBlock` renderer, while older `/articles/:id` records still use a separate plain-paragraph renderer. The Playwright audit intentionally detects both paths so the remaining legacy route cannot be mistaken for the universal engine.

The branch also verifies image loading, lightbox keyboard interaction, zoom, source navigation, responsive overflow, console errors, and full-page visual captures.
