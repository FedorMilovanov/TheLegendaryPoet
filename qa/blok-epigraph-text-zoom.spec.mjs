import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

// This suite runs only in the Chromium core project. Other browser projects
// already exercise the 390px/default-font lazy-load gate in poets-status.spec.
test('Blok V epigraph preserves reading position at normal and enlarged text sizes', async ({ browser }) => {
  for (const scale of [1, 1.5, 2]) {
    for (const width of [320, 390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: 'dark' });
      let release = () => {};
      let intercepted = 0;
      const gate = new Promise((resolve) => { release = resolve; });
      await page.route('**/assets/PoemEpigraph-*.js', async (route) => {
        intercepted += 1;
        await gate;
        await route.continue();
      });
      try {
        await page.goto(`${BASE_URL}/poets/alexander-blok#poem-blok-11`, { waitUntil: 'domcontentloaded' });
        const card = page.locator('#poem-blok-11');
        const poemText = card.locator('[data-poem-text]');
        await expect(poemText).toBeVisible();
        await page.addStyleTag({ content: `html { font-size: ${scale * 100}% !important }` });
        await page.evaluate(() => document.fonts.ready);
        await expect.poll(() => intercepted, { timeout: 10_000 }).toBe(1);
        const relativeTop = () => poemText.evaluate((node) =>
          node.getBoundingClientRect().top - node.closest('#poem-blok-11').getBoundingClientRect().top
        );
        const before = await relativeTop();
        await expect(card.locator('[data-poem-epigraph]')).toHaveCount(0);
        release();
        const epigraph = card.locator('[data-poem-epigraph]');
        await expect(epigraph).toBeVisible();
        const after = await relativeTop();
        expect(Math.abs(after - before), `epigraph shift at ${width}px / ${scale * 100}% font size`).toBeLessThanOrEqual(4);
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
        await expect(epigraph.locator('figcaption')).toContainText('Вл. Соловьев');
        if (scale === 2 && width === 320) {
          mkdirSync('qa-artifacts', { recursive: true });
          await epigraph.screenshot({ path: 'qa-artifacts/blok-epigraph-320-200pct-dark.png' });
        }
      } finally {
        release();
        await page.close();
      }
    }
  }
});
