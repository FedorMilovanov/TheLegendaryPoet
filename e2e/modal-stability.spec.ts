import { expect, test, type TestInfo } from '@playwright/test';

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test('command palette locks and restores the reading surface on desktop and mobile', async ({ page }, testInfo: TestInfo) => {
  await page.goto('/articles');
  await expect(page.locator('h1')).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 420, behavior: 'auto' }));

  const before = await page.evaluate(() => ({
    scrollY: window.scrollY,
    clientWidth: document.documentElement.clientWidth,
  }));

  if (testInfo.project.name === 'desktop-chromium') {
    const trigger = page.getByTestId('command-palette-trigger');
    await expect(trigger).toBeVisible();
    await trigger.click();
  } else {
    await page.evaluate(() => window.dispatchEvent(new Event('tlp-open-command-palette')));
  }

  const dialog = page.getByTestId('command-palette-dialog');
  const input = page.getByTestId('command-palette-input');
  await expect(dialog).toBeVisible();
  await expect(input).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  expect(await page.evaluate(() => document.documentElement.clientWidth)).toBe(before.clientWidth);

  await input.fill('Маяковский');
  await expect(page.getByRole('option').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
  await expect.poll(() => page.evaluate(() => document.documentElement.clientWidth)).toBe(before.clientWidth);
  await expect.poll(
    () => page.evaluate((expectedY) => Math.abs(window.scrollY - expectedY), before.scrollY),
    { timeout: 3_000 },
  ).toBeLessThanOrEqual(2);

  if (testInfo.project.name === 'desktop-chromium') {
    await expect(page.getByTestId('command-palette-trigger')).toBeFocused();
  }
  await assertNoHorizontalOverflow(page);
});
