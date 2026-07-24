import { expect, test, type TestInfo } from '@playwright/test';

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

test('command index survives closing the palette while its lazy chunk is in flight', async ({ page }, testInfo: TestInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'one delayed chunk test is sufficient');

  let delayedUrl = '';
  // Playwright runs against Vite's dev server, where the request ends in
  // `commandItems.ts`; a production build emits `commandItems-<hash>.js`.
  // Match both forms so this regression test actually delays the dynamic import
  // in CI instead of silently waiting for a filename that only exists in dist/.
  await page.route(/commandItems(?:\.ts|[^/]*\.js)(?:\?.*)?$/, async (route) => {
    delayedUrl = route.request().url();
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.continue();
  });

  await page.goto('/articles');
  await expect(page.locator('h1')).toBeVisible();

  await page.keyboard.press('Control+K');
  await expect(page.getByTestId('command-palette-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('command-palette-dialog')).toBeHidden();

  await page.keyboard.press('Control+K');
  const input = page.getByTestId('command-palette-input');
  await input.fill('Про это');
  await expect(page.getByRole('option', { name: /Про это/ }).first()).toBeVisible({ timeout: 10_000 });
  expect(delayedUrl, 'the commandItems module should have been intercepted').toMatch(/commandItems/);

  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
});

test('command search reaches longreads without restoring the old route position', async ({ page }) => {
  await page.goto('/articles');
  await expect(page.locator('h1')).toBeVisible();
  await page.evaluate(() => {
    (window as Window & { __tlpHeaderNode?: Element | null }).__tlpHeaderNode =
      document.querySelector('header.site-header');
    window.scrollTo({ top: 720, behavior: 'auto' });
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);

  await page.keyboard.press('Control+K');
  const input = page.getByTestId('command-palette-input');
  await expect(input).toBeFocused();
  await input.fill('Про это');
  await expect(page.getByRole('option', { name: /Про это/ }).first()).toBeVisible();
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/\/essays\/mayakovsky-pro-eto-separation$/);
  await expect(page.locator('h1')).toContainText('Про это');
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 3_000 }).toBeLessThanOrEqual(2);
  expect(
    await page.evaluate(() =>
      (window as Window & { __tlpHeaderNode?: Element | null }).__tlpHeaderNode ===
      document.querySelector('header.site-header'),
    ),
  ).toBe(true);
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
  await assertNoHorizontalOverflow(page);
});
