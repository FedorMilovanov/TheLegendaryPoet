import { test, expect } from '@playwright/test';

const origin = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const isReview = process.env.POET_FACSIMILE_PREVIEW === '1';

test('approved historical page is public; restricted scans remain hidden; original viewer is accessible', async ({ page }) => {
  await page.goto(origin + '/poets/alexander-pushkin', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#poem-pushkin-2')).toBeVisible();
  await expect(page.locator('#poem-pushkin-2 [data-poem-facsimile]')).toHaveAttribute('data-rights-status', 'approved');
  await expect(page.locator('#poem-pushkin-2 [data-poem-facsimile]'))
    .toContainText('Подлинная печать');

  if (!isReview) {
    await expect(page.locator('#poem-pushkin-4 [data-poem-facsimile]')).toHaveCount(0);
    await expect(page.locator('#poem-pushkin-9 [data-poem-facsimile]')).toHaveCount(0);
    await expect(page.locator('[data-poem-facsimile]')).toHaveCount(1);
  }
  const cases = isReview
    ? [['pushkin-2', 1, 'approved'], ['pushkin-4', 2, 'review'], ['pushkin-9', 1, 'review']]
    : [['pushkin-2', 1, 'approved']];

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [id, expectedCount, rights] of cases) {
      const band = page.locator('#poem-' + id + ' [data-poem-facsimile]');
      await band.scrollIntoViewIfNeeded();
      await expect(band).toHaveAttribute('data-rights-status', rights);
      const preview = band.locator('img').first();
      await expect(preview).toHaveJSProperty('complete', true);
      const dimensions = await band.evaluate((node) => ({
        scroll: node.scrollWidth, client: node.clientWidth,
        imageWidth: node.querySelector('img')?.naturalWidth,
      }));
      expect(dimensions.imageWidth).toBe(575);
      expect(dimensions.scroll - dimensions.client).toBeLessThanOrEqual(1);

      const open = band.getByRole('button', { name: 'Рассмотреть полный оригинальный лист' });
      await open.click();
      const viewer = band.locator('dialog');
      await expect(viewer).toBeVisible();
      if (id === 'pushkin-2') {
        await expect(viewer).toContainText('Альманах на 1830 год · издан в 1829');
        await expect(band.locator('p').filter({ hasText: 'Подлинная печать' }))
          .toContainText('1829');
      }
      const viewerRadius = await viewer.evaluate((node) => parseFloat(getComputedStyle(node).borderTopLeftRadius));
      expect(viewerRadius).toBeGreaterThanOrEqual(20);
      await expect(viewer.locator('img')).toHaveAttribute('alt', /Первопечатная|Страница 37/);
      // Every unzoomed original must fit horizontally inside the viewer.
      // Natural resolution does not imply a printable page is actually visible.
      const fit = await viewer.locator('[data-facsimile-stage]').evaluate((stage) => {
        const image = stage.querySelector('img');
        const viewport = stage.getBoundingClientRect();
        const pageBounds = image?.getBoundingClientRect();
        return { scroll: stage.scrollWidth, client: stage.clientWidth,
          left: pageBounds?.left, right: pageBounds?.right,
          viewLeft: viewport.left, viewRight: viewport.right };
      });
      expect(fit.scroll - fit.client, 'Default full-sheet view cannot overflow sideways').toBeLessThanOrEqual(1);
      expect(fit.left).toBeGreaterThanOrEqual(fit.viewLeft - 1);
      expect(fit.right).toBeLessThanOrEqual(fit.viewRight + 1);
      await expect(viewer.getByText('1 / ' + expectedCount)).toBeVisible();
      await expect(viewer.getByRole('link', { name: /Источник/ })).toHaveAttribute('target', '_blank');
      if (id === 'pushkin-2') {
        await expect(viewer.getByRole('link', { name: /Источник/ })).toHaveAttribute('href', /commons\.wikimedia\.org/);
      }
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
