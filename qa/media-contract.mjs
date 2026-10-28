import { expect } from '@playwright/test';

// Media modes are BrowserContext options, not standalone Playwright fixtures.
// Check on the blank page before interpreting any requested-media scenario.
export async function assertRequestedMedia(page, contextOptions) {
  if (contextOptions.reducedMotion === undefined && contextOptions.forcedColors === undefined) return;
  const media = await page.evaluate(() => ({
    reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
    forced: matchMedia('(forced-colors: active)').matches,
  }));
  if (contextOptions.reducedMotion !== undefined) {
    expect(media.reduce, 'requested reduced-motion mode must reach the browser').toBe(contextOptions.reducedMotion === 'reduce');
  }
  if (contextOptions.forcedColors !== undefined) {
    expect(media.forced, 'requested forced-colors mode must reach the browser').toBe(contextOptions.forcedColors === 'active');
  }
}

export function registerMediaContract(test) {
  test.beforeEach(async ({ page, contextOptions }) => {
    await assertRequestedMedia(page, contextOptions);
  });
}
