import { test, expect } from '@playwright/test';

const origin = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const isReview = process.env.POET_FACSIMILE_PREVIEW === '1';

test('archival facsimile: rights gate, borderless preview, accessible complete original', async ({ page }) => {
  await page.goto(origin + '/poets/alexander-pushkin', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#poem-pushkin-4')).toBeVisible();

  // This assertion must pass in every production/CI run. Historical texts
  // are verified; the redistribution rights of the scans are still gated.
  if (!isReview) {
    await expect(page.locator('[data-poem-facsimile]')).toHaveCount(0);
    return;
  }

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [id, expectedCount] of [['pushkin-4', 2], ['pushkin-9', 1]]) {
      const band = page.locator('#poem-' + id + ' [data-poem-facsimile]');
      await band.scrollIntoViewIfNeeded();
      await expect(band).toHaveAttribute('data-rights-status', 'review');
      await expect(band.locator('img').first()).toHaveJSProperty('complete', true);
      const dimensions = await band.evaluate((node) => ({
        scroll: node.scrollWidth,
        client: node.clientWidth,
        imageWidth: node.querySelector('img')?.naturalWidth,
      }));
      expect(dimensions.imageWidth).toBe(575);
      expect(dimensions.scroll - dimensions.client).toBeLessThanOrEqual(1);

      const open = band.getByRole('button', { name: 'Рассмотреть полный оригинальный лист' });
      await open.click();
      const viewer = band.locator('dialog');
      await expect(viewer).toBeVisible();
      await expect(viewer.locator('img')).toHaveAttribute('alt', /Первопечатная|Страница 37/);
      await expect(viewer.getByText('1 / ' + expectedCount)).toBeVisible();
      await expect(viewer.getByRole('link', { name: /Источник/ })).toHaveAttribute('target', '_blank');
      await viewer.getByRole('button', { name: 'Увеличить оригинал' }).click();
      await expect(viewer.getByRole('button', { name: 'Уменьшить оригинал' })).toHaveAttribute('aria-pressed', 'true');
      const stage = viewer.locator('[data-facsimile-stage]');
      const zoomState = await stage.evaluate((node) => ({ scrollWidth: node.scrollWidth, clientWidth: node.clientWidth }));
      if (width === 390) {
        expect(zoomState.scrollWidth).toBeGreaterThan(zoomState.clientWidth);
      } else {
        const zoomedImageWidth = await viewer.locator('img').evaluate((img) => img.getBoundingClientRect().width);
        expect(zoomedImageWidth).toBeGreaterThan(575);
      }
      if (expectedCount === 2) {
        await viewer.getByRole('button', { name: 'Следующая страница' }).click();
        await expect(viewer.getByText('2 / 2')).toBeVisible();
        await page.keyboard.press('ArrowLeft');
        await expect(viewer.getByText('1 / 2')).toBeVisible();
      }
      await page.keyboard.press('Escape');
      await expect(viewer).not.toBeVisible();
      await expect(open).toBeFocused();
    }
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});
