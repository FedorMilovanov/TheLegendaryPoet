import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

async function expectContained(page, tooltip) {
  await expect.poll(() => tooltip.evaluate((node) => Number(getComputedStyle(node).opacity))).toBe(1);
  // Resize/visualViewport events are asynchronous; wait for the real layout to settle.
  await expect.poll(async () => {
    const rect = await tooltip.boundingBox();
    return rect && rect.x >= 7 && rect.x + rect.width <= page.viewportSize().width - 7;
  }).toBe(true);
  const bounds = await tooltip.boundingBox();
  expect(bounds).not.toBeNull();
  const viewport = page.viewportSize();
  expect(bounds.x).toBeGreaterThanOrEqual(7);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width - 7);
  expect(await tooltip.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
}

for (const theme of ['dark', 'light']) {
  for (const width of [320, 390, 1440]) {
    test.describe(`citation tooltip ${theme} ${width}px`, () => {
      test.use({ colorScheme: theme, reducedMotion: 'reduce', viewport: { width, height: 844 }, isMobile: width < 600, hasTouch: width < 600 });
      test('source labels fit the viewport during focus, hover and resize', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium-core', 'bounded Chromium positioning regression');
        await page.addInitScript((mode) => localStorage.setItem('tlp-theme-mode', mode), theme);
        await page.goto(`${BASE_URL}/essays/sergei-yesenin-1921-1925`, { waitUntil: 'networkidle' });
        const citations = page.locator('.essay-body sup > a[href^="#source-"]');
        await expect(citations.first()).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        for (let i = 0; i < 12; i++) {
          const link = citations.nth(i);
          await link.evaluate((node) => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
          await link.focus();
          await expectContained(page, link.getByRole('tooltip'));
        }
        const first = citations.first();
        await first.evaluate((node) => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await first.focus();
        await expectContained(page, first.getByRole('tooltip'));
        if (width >= 600) {
          await first.evaluate((node) => node.blur());
          await first.hover();
          await expectContained(page, first.getByRole('tooltip'));
          await page.mouse.move(0, 0);
          await first.focus();
        }
        await page.setViewportSize({ width: width < 600 ? 844 : 320, height: 600 });
        await first.evaluate((node) => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await expectContained(page, first.getByRole('tooltip'));
        const href = await first.getAttribute('href');
        await first.press('Enter');
        await expect.poll(() => new URL(page.url()).hash).toBe(href);
        await expect(page.locator(href)).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
      });
    });
  }
}
