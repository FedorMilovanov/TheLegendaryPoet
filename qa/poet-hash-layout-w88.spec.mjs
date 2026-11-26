import { test, expect } from '@playwright/test';

const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const topOf = (page) => page.locator('#poem-yesenin-3')
  .evaluate((node) => node.getBoundingClientRect().top);

test('W88: hash target remains readable after late layout growth and shrinkage', async ({ page }) => {
  await page.goto(BASE + '/poets/sergei-yesenin#poem-yesenin-3', { waitUntil: 'domcontentloaded' });
  const target = page.locator('#poem-yesenin-3');
  await expect(target).toBeVisible();
  await expect(page.locator('div[id^="poem-yesenin-"]')).toHaveCount(11);

  const anchored = async () => {
    await expect.poll(() => topOf(page), { timeout: 15_000 }).toBeGreaterThanOrEqual(80);
    await expect.poll(() => topOf(page), { timeout: 15_000 }).toBeLessThanOrEqual(112);
  };
  await anchored();

  // Reproduce a content-height shift that occurs AFTER the JSON-hydrated event:
  // a late card/chunk above the target adds 480px to document flow.
  await page.evaluate(() => {
    const target = document.getElementById('poem-yesenin-3');
    if (!target) throw new Error('Target not hydrated');
    const spacer = document.createElement('div');
    spacer.dataset.w88LateLayout = 'true';
    spacer.style.height = '480px';
    spacer.style.pointerEvents = 'none';
    target.before(spacer);
  });
  await anchored();

  await page.evaluate(() => document.querySelector('[data-w88-late-layout]')?.remove());
  await anchored();
  expect(await page.evaluate(() => location.hash)).toBe('#poem-yesenin-3');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
