# Integration status

This branch consolidates the unmerged editorial work from PR #29 with the custom-domain work from PR #30.

## Included

- Long-form essays about Vladimir Mayakovsky and the Briks.
- The expanded Yesenin essay and the verified poet-library changes.
- Moral-portrait data and the accompanying reusable component.
- Custom-domain canonical URLs for `https://thelegendarypoet.ru`.
- Generated sitemap coverage for static pages, poets, essays, and legacy articles.
- Pull-request CI, library validation, essay validation, type checking, build, and OG prerendering.
- A defensive engine guard against adjacent duplicate section headings.
- Safe default Open Graph artwork whenever an essay image is intentionally absent.

## Deliberately excluded

The unfinished Mayakovsky and Brik artwork from PR #29 is not present on this branch. The following paths remain reserved for final approved files:

- `public/images/essays/mayakovsky-gromovoy.jpg`
- `public/images/essays/mayakovsky-gromovoy-card.jpg`
- `public/images/essays/brik-case.jpg`
- `public/images/essays/brik-case-card.jpg`

Their absence is reported as a warning, not a build failure. Until final artwork is added, pages and social metadata use the site's existing graceful fallback.
