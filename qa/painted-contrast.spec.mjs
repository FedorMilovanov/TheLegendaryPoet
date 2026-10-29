import { test, expect } from '@playwright/test';
import { paintedSweep, describeOffenders, describeGradientOffenders } from './painted-contrast.mjs';

// Painted-background contrast certification for the routes where the audit
// found real defects. `qa/contrast-helpers.mjs` composites the *computed*
// background-color of the ancestor chain and cannot see gradients, images or
// stacked alpha; this sweep scores each node against the pixels actually painted
// behind it, and scores gradient-clipped ink against its own gradient stops.
//
// Found here, all since repaired:
//   /ratings                    light 1.28 (dark ink on an un-remapped bg-[#071018])
//   /ratings                    dark  2.44 (text-cyan-100/30)
//   /ratings                    light 1.52 (brand gold gradient on cream)
//   /poets/alexander-pushkin    light 1.04 (epoch/connection badges, literal hex)
//   /poets/alexander-pushkin    dark  2.79 (community copy at /34)
//   /poets/alexander-pushkin    2.98 both themes (white ink on the cyan CTA fill)
//   /music                      light 1.27 (remapped ink on a hard-coded dark scrim)
//   /music                      both  1.97 (a /22 separator in the player card)
//   /articles                   both  1.80 (the kicker badge washed over cover art)
//   /articles                   light 3.72 (the filter pill: remap outranked the deep ink)
//   /                           light 1.26 (brand-tinted social links on cream)
//   /archive                    dark  4.13 (the saved-poems lead at /45)
//   /poets                      dark  3.22 (the "Найдено гениев" counter at /40)
//
// The remaining eight route families were audited in the next pass, all repaired:
//   /essays/:slug               light 2.89 (figcaption under the media card's
//                               0.45/24px/70px shadow, which paints 185,182,174
//                               over the cream caption strip)
//   /essays/:slug               both  1.67 (`.essay-section-number`, a gold
//                               gradient clipped to 0.75->0.28 alpha)
//   /music/:id                  light 1.06 (the release hero: hard-coded
//                               rgba(5,5,5,…) veil under remapped dark ink)
//   /music/:id                  light 1.22 (the release panels mix the track hue
//                               into rgba(5,5,5,.92-.96) inline)
//   /music/:id                  dark  1.86 (text-white/22 separator, /28 rights,
//                               /40 SHA-256, /42 label, /45 summary)
//   /music/:id                  dark  3.95 (credit numerals in --track-secondary)
//   /poets/:id                  dark  3.36 (--epoch-symbolism #9a13ed pill ink)
//   /poets/:id                  dark  4.33 (--epoch-futurism #ed143b pill ink)
//   /poets/:id                  dark  4.49 (--conn-rivalry #ef4444 pill ink)
//   /poets/:id                  dark  3.38 (the RelatedEssays eyebrow at gold/55)
//   /editorial-policy           dark  2.84 (text-cyan-100/35 publication date)
//   /privacy                    dark  2.84 and 4.18 (text-cyan-100/35 and /45)
//   /essays/vykhozhu…           dark  3.04 (the "✦" ornament at gold/50)
//
// Three buckets are reported instead of failed, because none of them is
// unreadable ink: decorative icons (WCAG 1.4.11), disabled/inactive controls
// (1.4.3) and copy that floating chrome covers at this scroll position.

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const STORAGE_KEY = 'tlp-theme-mode';

// `minimumNodes` is the render guard: a page that never painted its content must
// not be certified as clean. Counts are the smallest the sweep measured on any
// theme/viewport pair, rounded down.
const ROUTES = [
  { path: '/ratings', heading: 'читателей', minimumNodes: 60 },
  { path: '/poets/alexander-pushkin', heading: 'Пушкин', minimumNodes: 200 },
  { path: '/music', heading: 'Музыкой', minimumNodes: 60 },
  { path: '/articles', heading: 'Исследования', minimumNodes: 80 },
  { path: '/', heading: 'LEGENDARY', minimumNodes: 90 },
  { path: '/archive', heading: 'Архив', minimumNodes: 20 },
  { path: '/poets', heading: 'Лица', minimumNodes: 120 },
  { path: '/about', heading: 'О Проекте', minimumNodes: 45 },
  { path: '/editorial-policy', heading: 'Редакционная политика', minimumNodes: 42 },
  { path: '/privacy', heading: 'Политика конфиденциальности', minimumNodes: 44 },
  { path: '/hall', heading: 'Зал Поэтов', minimumNodes: 28 },
  { path: '/music/pushkin-tucha', heading: 'Туча', minimumNodes: 110 },
  { path: '/music/blok-rossiya', heading: 'Россия', minimumNodes: 110 },
  { path: '/poets/sergei-yesenin', heading: 'Сергей Есенин', minimumNodes: 600 },
  { path: '/poets/vladimir-mayakovsky', heading: 'Владимир Маяковский', minimumNodes: 470 },
  { path: '/essays/brik-case', heading: 'Маяковский и Брики', minimumNodes: 240 },
  { path: '/essays/sergei-yesenin-1921-1925', heading: 'Часть II', minimumNodes: 740 },
  { path: '/essays/vykhozhu-odin-ya-na-dorogu-lermontov', heading: 'Выхожу Один Я', minimumNodes: 180 },
  { path: '/route-audit-page-that-must-not-exist', heading: 'Страница Не Найдена', minimumNodes: 25 },
];

function useChromiumCore(testInfo) {
  test.skip(testInfo.project.name !== 'chromium-core', 'the painted sweep runs once, in the Chromium core project');
}

test.describe('painted contrast', () => {
  // The sweep walks the document in viewport-height bands, scrolling to each
  // one and decoding a bitmap per band, three times (plain ink, gradient ink,
  // decorative icons). The shortest route finishes in 4s; the 20 000px essay
  // needs 60s, which is over the shared 45s per-test timeout.
  test.slow();

  for (const route of ROUTES) {
    for (const theme of ['dark', 'light']) {
      for (const viewport of [
        { label: 'desktop', width: 1440, height: 1000 },
        { label: 'mobile', width: 390, height: 844 },
      ]) {
        test(`every node on ${route.path} clears its painted background in ${theme} ${viewport.label}`, async ({ page }, testInfo) => {
          useChromiumCore(testInfo);
          await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [STORAGE_KEY, theme]);
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle' });
          await expect(page.locator('h1').first()).toContainText(route.heading);
          await page.waitForTimeout(600);

          const { measured, offenders, gradientOffenders, occluded } = await paintedSweep(page);

          // Guard against certifying a page that never rendered its content.
          // `occluded` is reported, not failed: those nodes sit under the fixed
          // header or the mobile dock at this scroll position.
          expect(
            measured.length,
            `${route.path} ${theme}/${viewport.label}: ${measured.length} nodes scored, ${occluded.length} behind floating chrome (${[...new Set(occluded.map((row) => row.by))].join(', ')})`,
          ).toBeGreaterThan(route.minimumNodes);
          expect(
            offenders.map((row) => row.ratio),
            `${route.path} ${theme}/${viewport.label}: ${offenders.length} of ${measured.length} nodes below their painted minimum\n${describeOffenders(offenders)}`,
          ).toEqual([]);
          expect(
            gradientOffenders.map((row) => row.ratio),
            `${route.path} ${theme}/${viewport.label}: ${gradientOffenders.length} gradient-clipped nodes below their minimum\n${describeGradientOffenders(gradientOffenders)}`,
          ).toEqual([]);
        });
      }
    }
  }
});
