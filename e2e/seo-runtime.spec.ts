import { expect, test } from '@playwright/test';

async function routeJsonTypes(page: import('@playwright/test').Page): Promise<string[]> {
  return page.locator('script#route-jsonld').evaluate((node) => {
    const found = new Set<string>();
    const walk = (value: unknown) => {
      if (Array.isArray(value)) {
        value.forEach(walk);
        return;
      }
      if (!value || typeof value !== 'object') return;
      const record = value as Record<string, unknown>;
      const type = record['@type'];
      if (typeof type === 'string') found.add(type);
      else if (Array.isArray(type)) type.forEach((item) => typeof item === 'string' && found.add(item));
      Object.values(record).forEach(walk);
    };
    walk(JSON.parse(node.textContent || '{}'));
    return [...found];
  });
}

test.describe('runtime discovery and indexing state', () => {
  test('the WebSite SearchAction target opens a filtered poet catalogue', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'one browser is enough for URL state');

    await page.goto('/poets?q=Маяковский');
    await expect(page.getByRole('searchbox', { name: 'Поиск поэтов' })).toHaveValue('Маяковский');
    await expect(page.getByTestId('poet-card')).toHaveCount(1);
    await expect(page.getByTestId('poet-card')).toContainText('Маяковский');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://thelegendarypoet.ru/poets');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow, max-image-preview:large');
    const types = await routeJsonTypes(page);
    for (const type of ['CollectionPage', 'ItemList', 'BreadcrumbList']) {
      expect(types.includes(type), `/poets should contain ${type}`).toBe(true);
    }
  });

  test('all public catalogues retain specialized JSON-LD after hydration', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'one browser is enough for head-state QA');

    const cases = [
      ['/articles', ['CollectionPage', 'ItemList', 'BreadcrumbList']],
      ['/music', ['CollectionPage', 'ItemList', 'MusicRecording', 'BreadcrumbList']],
      ['/about', ['AboutPage', 'Organization', 'BreadcrumbList']],
      ['/hall', ['WebPage', 'BreadcrumbList']],
    ] as const;

    for (const [path, required] of cases) {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      const types = await routeJsonTypes(page);
      for (const type of required) expect(types.includes(type), `${path} should contain ${type}`).toBe(true);
    }
  });

  test('invalid routes are noindex and a later longread clears every stale head field', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'one browser is enough for head-state QA');

    await page.goto('/essays/not-a-real-essay');
    await expect(page.locator('h1')).toContainText('Статья не найдена');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);

    await page.goto('/essays/mayakovsky-pro-eto-separation');
    await expect(page.locator('h1')).toContainText('Про это');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow, max-image-preview:large');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://thelegendarypoet.ru/essays/mayakovsky-pro-eto-separation');
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
    await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute('content', '2026-07-23');
    await expect(page.locator('meta[property="og:image:width"]')).toHaveCount(0);
    await expect(page.locator('meta[property="og:image:height"]')).toHaveCount(0);
    const longreadTypes = await routeJsonTypes(page);
    expect(longreadTypes.includes('BreadcrumbList'), 'longread JSON-LD should retain BreadcrumbList').toBe(true);

    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
  });
});
