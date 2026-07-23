import { expect, test } from '@playwright/test';

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test('command palette locks and restores the reading surface on desktop and mobile', async ({ page }) => {
  await page.goto('/articles');
  await expect(page.locator('h1')).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 420, behavior: 'auto' }));

  const opener = page.getByRole('button', { name: 'Все кластеры' });
  await opener.focus();
  await expect(opener).toBeFocused();
  const before = await page.evaluate(() => ({
    scrollY: window.scrollY,
    clientWidth: document.documentElement.clientWidth,
  }));

  await page.keyboard.press('Control+K');
  const dialog = page.getByTestId('command-palette-dialog');
  const input = page.getByTestId('command-palette-input');
  await expect(dialog).toBeVisible();
  await expect(input).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  expect(await page.evaluate(() => document.documentElement.clientWidth)).toBe(before.clientWidth);

  await input.fill('Маяковский');
  await expect(page.getByRole('option').first()).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', /^command-option-/);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
  await expect.poll(() => page.evaluate(() => document.documentElement.clientWidth)).toBe(before.clientWidth);
  await expect.poll(
    () => page.evaluate((expectedY) => Math.abs(window.scrollY - expectedY), before.scrollY),
    { timeout: 3_000 },
  ).toBeLessThanOrEqual(2);
  await expect(opener).toBeFocused();
  await assertNoHorizontalOverflow(page);
});
