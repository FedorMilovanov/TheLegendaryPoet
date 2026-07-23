import { expect, test } from '@playwright/test';

const slug = 'mayakovsky-pro-eto-separation';

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

async function expectAnchorSettled(page: import('@playwright/test').Page, id: string) {
  // Chromium serializes non-ASCII URL fragments with percent escapes. Compare
  // the decoded fragment to the DOM id instead of mistaking standards-compliant
  // URL serialization for a broken Cyrillic anchor.
  await expect.poll(() => page.evaluate(() => decodeURIComponent(window.location.hash))).toBe(`#${id}`);
  await expect.poll(
    () => page.locator(`#${id}`).evaluate((node) => Math.round(node.getBoundingClientRect().top)),
    { timeout: 4_000 },
  ).toBeGreaterThanOrEqual(76);
  await expect.poll(
    () => page.locator(`#${id}`).evaluate((node) => Math.round(node.getBoundingClientRect().top)),
    { timeout: 4_000 },
  ).toBeLessThanOrEqual(118);
}

test.describe('Mayakovsky SEO topic cluster', () => {
  test('Pro Eto article exposes SEO metadata, sources and internal cluster links', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'desktop cluster QA');
    await page.goto(`/essays/${slug}`);

    await expect(page.locator('h1')).toContainText('«Про это»');
    await expect(page.locator('h1')).not.toContainText('«Про Это»');
    await expect(page).toHaveTitle(/история создания/i);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /два месяца разлуки/i);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/essays/${slug}$`));

    const cover = page.getByTestId('essay-cover-image').first();
    await expect(cover).toBeVisible();
    await expect.poll(async () => cover.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
    await expect.poll(async () => cover.evaluate((node: HTMLImageElement) => node.currentSrc)).toMatch(/\.avif$/i);

    const articleImage = page.getByTestId('essay-image-trigger').first();
    await articleImage.scrollIntoViewIfNeeded();
    await expect(articleImage).toBeVisible();

    const cluster = page.getByRole('heading', { name: /Маяковский: жизнь, тексты, архив/i });
    await cluster.scrollIntoViewIfNeeded();
    await expect(cluster).toBeVisible();

    const clusterLinks = page.locator('section[aria-labelledby="related-cluster-title"] a[href^="/essays/"]');
    expect(await clusterLinks.count()).toBeGreaterThanOrEqual(3);

    const sourceLibrary = page.getByTestId('source-library');
    await sourceLibrary.scrollIntoViewIfNeeded();
    await expect(sourceLibrary).toBeVisible();
    expect(await page.getByTestId('inline-citation').count()).toBeGreaterThan(8);

    await assertNoHorizontalOverflow(page);
  });

  test('desktop TOC and source jump stay Lenis-aware and width-stable', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'desktop anchor QA');
    await page.goto(`/essays/${slug}`);
    await expect(page.locator('h1')).toBeVisible();

    const originalWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const tocLinks = page.getByTestId('desktop-toc-link');
    expect(await tocLinks.count()).toBeGreaterThanOrEqual(8);

    const lastHref = await tocLinks.last().getAttribute('href');
    expect(lastHref).toMatch(/^#.+/);
    const lastId = lastHref!.slice(1);
    await tocLinks.last().click();
    await expectAnchorSettled(page, lastId);

    await page.getByTestId('desktop-sources-link').click();
    await expectAnchorSettled(page, 'sources');
    await expect(page.getByTestId('source-library')).toBeVisible();

    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    expect(await page.evaluate(() => document.documentElement.clientWidth)).toBe(originalWidth);
    await assertNoHorizontalOverflow(page);
  });

  test('Pro Eto article keeps cluster and TOC usable on mobile', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'mobile cluster QA');
    await page.goto(`/essays/${slug}`);
    await expect(page.locator('h1')).toBeVisible();

    const beforeOpen = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollY: window.scrollY,
    }));
    const trigger = page.getByTestId('mobile-toc-trigger');
    await expect(trigger).toBeVisible();
    await trigger.click();
    const dialog = page.getByTestId('mobile-toc-dialog');
    await expect(dialog).toBeVisible();
    expect(await page.getByTestId('mobile-toc-row').count()).toBeGreaterThanOrEqual(8);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
    await expect.poll(() => page.evaluate(() => document.documentElement.clientWidth)).toBe(beforeOpen.width);
    await expect.poll(
      () => page.evaluate((expected) => Math.abs(window.scrollY - expected), beforeOpen.scrollY),
    ).toBeLessThanOrEqual(2);

    const cluster = page.getByRole('heading', { name: /Маяковский: жизнь, тексты, архив/i });
    await cluster.scrollIntoViewIfNeeded();
    await expect(cluster).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });
});
