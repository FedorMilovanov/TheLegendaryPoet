import { expect, test } from '@playwright/test';

const slug = 'mayakovsky-pro-eto-separation';

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

test.describe('Mayakovsky SEO topic cluster', () => {
  test('Pro Eto article exposes SEO metadata, sources and internal cluster links', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'desktop cluster QA');
    await page.goto(`/essays/${slug}`);

    await expect(page.locator('h1')).toContainText('Про это');
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

  test('Pro Eto article keeps cluster and TOC usable on mobile', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'mobile cluster QA');
    await page.goto(`/essays/${slug}`);
    await expect(page.locator('h1')).toBeVisible();

    const trigger = page.getByTestId('mobile-toc-trigger');
    await expect(trigger).toBeVisible();
    await trigger.click();
    const dialog = page.getByTestId('mobile-toc-dialog');
    await expect(dialog).toBeVisible();
    expect(await page.getByTestId('mobile-toc-row').count()).toBeGreaterThan(8);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    const cluster = page.getByRole('heading', { name: /Маяковский: жизнь, тексты, архив/i });
    await cluster.scrollIntoViewIfNeeded();
    await expect(cluster).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });
});
