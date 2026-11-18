import { test, expect } from '@playwright/test';

const origin = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const routes = [
  ['home', '/'],
  ['articles', '/articles'],
  ['poets', '/poets/alexander-pushkin'],
  ['music', '/music'],
  ['about', '/about'],
];

for (const [name, route] of routes) {
  test(name + ' card corner and hover geometry stay consistent', async ({ page }) => {
    await page.goto(origin + route, { waitUntil: 'domcontentloaded' });
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const theme of ['dark', 'light']) {
        await page.evaluate((value) => {
          document.documentElement.classList.toggle('theme-light', value === 'light');
          document.documentElement.classList.toggle('theme-dark', value === 'dark');
        }, theme);
        const cards = page.locator('.luxury-card');
        await expect.poll(() => cards.count()).toBeGreaterThan(0);
        for (const index of [0, 1]) {
          if (index >= await cards.count()) break;
          const card = cards.nth(index);
          await page.mouse.move(1, 1);
          await card.evaluate((node) => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
          // Let the intentional scroll-triggered reveal settle before comparing
          // actual hover geometry. Do not confuse enter animation with hover drift.
          await page.waitForTimeout(780);
          const before = await card.evaluate((node) => {
            const s = getComputedStyle(node);
            const p = getComputedStyle(node, '::before');
            return { radius: s.borderTopLeftRadius, radiusBR: s.borderBottomRightRadius,
              pseudoRadius: p.borderTopLeftRadius, pseudoBR: p.borderBottomRightRadius,
              transform: s.transform, overflow: s.overflow, pseudoContent: p.content };
          });
          const rect = await card.boundingBox();
          expect(rect).not.toBeNull();
          const x = Math.max(8, Math.min(width - 8, rect.x + 30));
          const y = Math.max(8, Math.min(870, rect.y + 30));
          await page.mouse.move(x, y);
          await page.waitForTimeout(330);
          const after = await card.evaluate((node) => {
            const s = getComputedStyle(node);
            const p = getComputedStyle(node, '::before');
            return { radius: s.borderTopLeftRadius, radiusBR: s.borderBottomRightRadius,
              pseudoRadius: p.borderTopLeftRadius, pseudoBR: p.borderBottomRightRadius,
              transform: s.transform, overflow: s.overflow, pseudoContent: p.content };
          });
          expect(after.radius, name + ' ' + width + ' ' + theme).toBe(before.radius);
          expect(after.radiusBR).toBe(before.radiusBR);
          expect(after.pseudoRadius).toBe(after.radius);
          expect(after.pseudoBR).toBe(after.radiusBR);
          expect(after.overflow).toBe('hidden');
          expect(after.transform).toBe(before.transform);
          await page.mouse.move(1, 1);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      }
    }
  });
}

test('keyboard focus respects the genuine rounded archival button', async ({ page }) => {
  await page.goto(origin + '/poets/alexander-pushkin', { waitUntil: 'domcontentloaded' });
  const button = page.locator('#poem-pushkin-4 [data-poem-facsimile] button').first();
  await button.waitFor({ state: 'visible' });
  await button.scrollIntoViewIfNeeded();
  await page.keyboard.press('Tab');
  await button.focus();
  const focus = await button.evaluate((node) => {
    const s = getComputedStyle(node);
    return { visible: node.matches(':focus-visible'), radius: parseFloat(s.borderTopLeftRadius),
      ring: s.outlineStyle, width: s.outlineWidth };
  });
  expect(focus.visible, 'Keyboard focus must be visibly indicated').toBe(true);
  expect(focus.radius, 'Focus ring should follow the actual rounded button, not a hard-coded 4px corner').toBeGreaterThanOrEqual(10);
  expect(focus.ring).toBe('solid');
  expect(focus.width).not.toBe('0px');
});
