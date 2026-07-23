import { expect, test } from '@playwright/test';

test.describe('runtime discovery and indexing state', () => {
  test('the WebSite SearchAction target opens a filtered poet catalogue', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'one browser is enough for URL state');

    await page.goto('/poets?q=Маяковский');
    await expect(page.getByRole('searchbox', { name: 'Поиск поэтов' })).toHaveValue('Маяковский');
    await expect(page.getByTestId('poet-card')).toHaveCount(1);
    await expect(page.getByTestId('poet-card')).toContainText('Маяковский');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://thelegendarypoet.ru/poets',
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'index, follow, max-image-preview:large',
    );
  });

  test('invalid routes are noindex and a later longread clears that state', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'one browser is enough for head-state QA');

    await page.goto('/essays/not-a-real-essay');
    await expect(page.locator('h1')).toContainText('Статья не найдена');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');

    await page.goto('/essays/mayakovsky-pro-eto-separation');
    await expect(page.locator('h1')).toContainText('Про это');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'index, follow, max-image-preview:large',
    );
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
    await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute(
      'content',
      '2026-07-23',
    );
    await expect(page.locator('script#route-jsonld')).toContainText('BreadcrumbList');
  });
});
