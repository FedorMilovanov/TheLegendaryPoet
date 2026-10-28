import { test, expect } from '@playwright/test';
import { paintedSweep, describeOffenders, describeGradientOffenders } from './painted-contrast.mjs';

// Painted-background contrast certification for the two routes where the audit
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

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const STORAGE_KEY = 'tlp-theme-mode';

const ROUTES = [
  { path: '/ratings', heading: 'читателей', minimumNodes: 60 },
  { path: '/poets/alexander-pushkin', heading: 'Пушкин', minimumNodes: 200 },
];

function useChromiumCore(testInfo) {
  test.skip(testInfo.project.name !== 'chromium-core', 'the painted sweep runs once, in the Chromium core project');
}

test.describe('painted contrast', () => {
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

          const { measured, offenders, gradientOffenders } = await paintedSweep(page);

          // Guard against certifying a page that never rendered its content.
          expect(measured.length, `${route.path} must render enough nodes to be worth sweeping`).toBeGreaterThan(route.minimumNodes);
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
