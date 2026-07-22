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

interface HiddenBlock {
  index: number;
  opacity: number;
  blurPixels: number;
  width: number;
  height: number;
  filter: string;
}

test('reduced motion leaves every article block immediately readable', async ({ page }) => {
  const routes = await articleRoutes(page);

  for (const route of routes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.essay-body')).toBeVisible();

    await expect
      .poll(
        () =>
          page.locator('.essay-body > *').evaluateAll((blocks): HiddenBlock[] =>
            blocks.flatMap((block, index) => {
              const style = getComputedStyle(block);
              const rect = block.getBoundingClientRect();
              const opacity = Number(style.opacity || 1);
              const filter = style.filter || 'none';
              const blurMatch = filter.match(/blur\(\s*([0-9.]+)(?:px)?\s*\)/i);
              const blurPixels = blurMatch ? Number(blurMatch[1]) : 0;
              const hidden =
                opacity < 0.99 ||
                blurPixels > 0.01 ||
                rect.width < 1 ||
                rect.height < 1 ||
                style.visibility === 'hidden' ||
                style.display === 'none';

              return hidden
                ? [{
                    index,
                    opacity,
                    blurPixels,
                    width: rect.width,
                    height: rect.height,
                    filter,
                  }]
                : [];
            }),
          ),
        { message: `${route}: reduced-motion blocks must be visible without residual blur` },
      )
      .toEqual([]);
  }
});
