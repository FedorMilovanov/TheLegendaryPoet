import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';

async function assertDecoded(image: Locator) {
  await expect(image).toBeVisible();
  await expect.poll(
    () => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0 && node.naturalHeight > 0),
    { timeout: 15_000 },
  ).toBe(true);
}

async function assertStableCard(page: Page, card: Locator, image: Locator, desktop: boolean) {
  await card.scrollIntoViewIfNeeded();
  await assertDecoded(image);
  await expect(image).toHaveAttribute('data-loaded', 'true');
  await expect.poll(() => image.evaluate((node) => Number.parseFloat(getComputedStyle(node).opacity))).toBeGreaterThan(0.9);

  const tilt = card.locator(
    'xpath=ancestor-or-self::div[contains(concat(" ", normalize-space(@class), " "), " tilt-card-inner ")][1]',
  );
  await expect(tilt).toHaveCount(1);

  if (!desktop) {
    expect(await tilt.evaluate((node) => getComputedStyle(node).transform)).toBe('none');
    expect(await tilt.evaluate((node) => getComputedStyle(node).willChange)).not.toContain('transform');
    return;
  }

  const box = await card.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  const original = await image.boundingBox();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.25, { steps: 4 });
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.75, { steps: 6 });
  await expect(tilt).toHaveAttribute('data-tilting', 'true');

  const transform = await tilt.evaluate((node) => getComputedStyle(node).transform);
  expect(transform).not.toBe('none');
  expect(transform).not.toContain('NaN');
  await expect.poll(() => image.evaluate((node) => Number.parseFloat(getComputedStyle(node).opacity))).toBeGreaterThan(0.9);

  const active = await image.boundingBox();
  expect(active).not.toBeNull();
  if (original && active) {
    expect(active.width).toBeGreaterThan(original.width * 0.98);
    expect(active.height).toBeGreaterThan(original.height * 0.98);
  }

  // Pointer-down precedes both Router View Transitions and lightbox opening.
  // The card must flatten in that same event, not drift home during the snapshot.
  await card.dispatchEvent('pointerdown', { pointerType: 'mouse', button: 0, isPrimary: true });
  await expect(tilt).not.toHaveAttribute('data-tilting', 'true');
  await expect.poll(() => tilt.evaluate((node) => getComputedStyle(node).transform)).toBe('none');

  await page.mouse.move(2, 2);
  await expect(tilt).not.toHaveAttribute('data-tilting', 'true');
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test('all essay cards keep decoded covers stable under hover and touch', async ({ page }, testInfo: TestInfo) => {
  test.setTimeout(180_000);
  const desktop = testInfo.project.name === 'desktop-chromium';
  await page.goto('/articles');
  await expect(page.locator('h1')).toBeVisible();

  const cards = page.getByTestId('essay-card');
  const count = await cards.count();
  expect(count).toBe(5);

  for (let index = 0; index < count; index += 1) {
    const card = cards.nth(index);
    const image = card.getByTestId('essay-cover-image');
    await assertStableCard(page, card, image, desktop);
  }

  await page.screenshot({
    path: testInfo.outputPath(`essay-cards-${desktop ? 'desktop' : 'mobile'}.png`),
    fullPage: false,
    animations: 'disabled',
  });
  await assertNoHorizontalOverflow(page);
});

test('all poet cards decode portraits without layered 3D flicker', async ({ page }, testInfo: TestInfo) => {
  test.setTimeout(180_000);
  const desktop = testInfo.project.name === 'desktop-chromium';
  await page.goto('/poets');
  await expect(page.locator('h1')).toBeVisible();

  const cards = page.getByTestId('poet-card');
  const count = await cards.count();
  expect(count).toBeGreaterThan(5);

  for (let index = 0; index < count; index += 1) {
    const card = cards.nth(index);
    const image = card.getByTestId('poet-card-image');
    await assertStableCard(page, card, image, desktop);
  }

  await page.screenshot({
    path: testInfo.outputPath(`poet-cards-${desktop ? 'desktop' : 'mobile'}.png`),
    fullPage: false,
    animations: 'disabled',
  });
  await assertNoHorizontalOverflow(page);
});
