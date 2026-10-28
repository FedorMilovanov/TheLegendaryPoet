import { test, expect } from '@playwright/test';
import { paintedSweep, describeOffenders } from './painted-contrast.mjs';

// The ratings table was the one page whose ink survived the light-theme remap
// while its hard-coded `bg-[#071018]` panels did not: measured contrast fell to
// 1.28 in light theme and 2.44 in dark theme, and the computed-style model in
// `qa/contrast-helpers.mjs` could not see it. This sweep certifies every text
// and icon node on /ratings against the pixels actually painted behind it.

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const STORAGE_KEY = 'tlp-theme-mode';

function useChromiumCore(testInfo) {
  test.skip(testInfo.project.name !== 'chromium-core', 'the painted sweep runs once, in the Chromium core project');
}

test.describe('ratings painted contrast', () => {

  for (const theme of ['dark', 'light']) {
    for (const viewport of [
      { label: 'desktop', width: 1440, height: 1000 },
      { label: 'mobile', width: 390, height: 844 },
    ]) {
      test(`every ratings node clears its painted background in ${theme} ${viewport.label}`, async ({ page }, testInfo) => {
        useChromiumCore(testInfo);
        await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [STORAGE_KEY, theme]);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`${BASE_URL}/ratings`, { waitUntil: 'networkidle' });
        await expect(page.locator('h1')).toContainText('читателей');
        await page.waitForTimeout(600);

        const { measured, offenders, gradientInk } = await paintedSweep(page);

        // Guard against certifying a page that never rendered its rows.
        expect(measured.length, 'ratings must render enough nodes to be worth sweeping').toBeGreaterThan(60);
        expect(
          offenders.map((row) => row.ratio),
          `${theme}/${viewport.label}: ${offenders.length} of ${measured.length} nodes below their painted minimum\n${describeOffenders(offenders)}`,
        ).toEqual([]);
        // Gradient-clipped ink (the brand wordmark) has no colour to composite;
        // keep it visible in the log instead of silently dropping it.
        if (gradientInk.length) {
          console.log(`gradient ink (not scored): ${gradientInk.map((row) => `"${row.text}" on [${row.background.join(', ')}]`).join(' | ')}`);
        }
      });
    }
  }
});
