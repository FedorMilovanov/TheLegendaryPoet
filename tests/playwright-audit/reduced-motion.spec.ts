import { expect, test } from '@playwright/test';

async function articleRoutes(page: import('@playwright/test').Page) {
  await page.goto('/articles', { waitUntil: 'domcontentloaded' });
  return page.locator('a[href]').evaluateAll((anchors) => {
    const routes = new Set<string>();
    for (const anchor of anchors) {
      const pathname = new URL((anchor as HTMLAnchorElement).href).pathname.replace(/\/$/, '');
      if (pathname.startsWith('/essays/') || (pathname.startsWith('/articles/') && pathname !== '/articles')) {
        routes.add(pathname);
      }
    }
    return [...routes].sort();
  });
}

test('reduced motion never leaves article blocks transparent or blurred', async ({ page }) => {
  const routes = await articleRoutes(page);

  for (const route of routes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.essay-body')).toBeVisible();

    await expect
      .poll(
        () =>
          page.locator('.essay-body > *').evaluateAll((blocks) =>
            blocks.filter((block) => {
              const style = getComputedStyle(block);
              const opacity = Number(style.opacity || 1);
              const filter = style.filter || 'none';
              return opacity < 0.99 || (/blur\(/.test(filter) && !/blur\(0(?:px)?\)/.test(filter));
            }).length,
          ),
        { message: `${route}: all reduced-motion blocks must be immediately readable` },
      )
      .toBe(0);
  }
});
