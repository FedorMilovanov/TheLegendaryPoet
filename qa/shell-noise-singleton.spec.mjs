import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

test.describe('persistent shell noise ownership', () => {
  test('one preboot noise layer survives hydration and SPA navigation', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-core', 'one desktop browser witness is sufficient for the shell singleton invariant');

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });

    const allNoiseLayers = page.locator('.noise-bg');
    const persistentNoise = page.locator('[data-shell-noise="persistent"]');

    await expect(allNoiseLayers, 'hydrated document must contain exactly one noise layer').toHaveCount(1);
    await expect(persistentNoise, 'the static preboot layer must own runtime noise').toHaveCount(1);
    await expect(persistentNoise).toHaveAttribute('aria-hidden', 'true');

    const computed = await persistentNoise.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        position: style.position,
        pointerEvents: style.pointerEvents,
        inset: [style.top, style.right, style.bottom, style.left],
      };
    });
    expect(computed.position).toBe('fixed');
    expect(computed.pointerEvents).toBe('none');
    expect(computed.inset).toEqual(['0px', '0px', '0px', '0px']);

    // Mark the physical DOM node so the post-navigation assertion proves that
    // the same preboot owner survives the SPA transition instead of being
    // replaced by a second React-owned full-screen turbulence layer.
    await persistentNoise.evaluate((element) => element.setAttribute('data-qa-shell-node', 'retained'));

    const poetsLink = page.locator('a[href="/poets"]').first();
    await expect(poetsLink).toBeVisible();
    await poetsLink.click();
    await expect(page).toHaveURL(/\/poets$/);
    await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });

    await expect(page.locator('.noise-bg'), 'SPA navigation must not duplicate shell noise').toHaveCount(1);
    await expect(page.locator('[data-shell-noise="persistent"]')).toHaveAttribute('data-qa-shell-node', 'retained');
  });
});
