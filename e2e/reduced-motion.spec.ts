import { expect, test } from '@playwright/test';

interface HiddenBlock {
  index: number;
  opacity: number;
  blurPixels: number;
  width: number;
  height: number;
  visibility: string;
  display: string;
  filter: string;
}

async function publicLongreadRoutes(page: import('@playwright/test').Page): Promise<string[]> {
  await page.goto('/articles', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toBeVisible();

  return page.locator('a[href]').evaluateAll((anchors) => {
    const routes = new Set<string>();
    for (const anchor of anchors) {
      const url = new URL((anchor as HTMLAnchorElement).href);
      const pathname = url.pathname.replace(/\/$/, '');
      if (
        pathname.startsWith('/essays/') ||
        (pathname.startsWith('/articles/') && pathname !== '/articles')
      ) {
        routes.add(pathname);
      }
    }
    return [...routes].sort();
  });
}

test.describe('reduced-motion article readability', () => {
  test.use({ reducedMotion: 'reduce' });

  test('every public longread exposes readable blocks without residual animation state', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop-chromium',
      'one reduced-motion Chromium viewport is sufficient; responsive layout is covered separately',
    );

    // Some Playwright/project combinations have preserved the context option for
    // JavaScript while failing to apply the CSS media feature before the first
    // navigation. Set it explicitly on the page and prove that the browser sees
    // the same environment the readability assertion is intended to cover.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(
      () => page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    ).toBe(true);

    const routes = await publicLongreadRoutes(page);
    expect(routes.length).toBeGreaterThan(0);

    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect.poll(
        () => page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches),
        { message: `${route}: reduced-motion media emulation must remain active` },
      ).toBe(true);

      const body = page.locator('.essay-body');
      await expect(body, `${route}: shared article body`).toBeVisible();

      await expect
        .poll(
          () =>
            body.locator(':scope > *').evaluateAll((blocks): HiddenBlock[] =>
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
                  ? [
                      {
                        index,
                        opacity,
                        blurPixels,
                        width: rect.width,
                        height: rect.height,
                        visibility: style.visibility,
                        display: style.display,
                        filter,
                      },
                    ]
                  : [];
              }),
            ),
          {
            timeout: 12_000,
            message: `${route}: reduced-motion blocks must not remain transparent, blurred or collapsed`,
          },
        )
        .toEqual([]);

      await expect(page.locator('main')).not.toHaveCSS('visibility', 'hidden');
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
        `${route}: reduced motion must not introduce horizontal overflow`,
      ).toBeLessThanOrEqual(1);
    }
  });
});
