import { test, expect } from '@playwright/test';

const origin = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

test('poet cards retain rounded edges on hover; facsimiles dissolve without a bottom seam', async ({ page }, testInfo) => {
  await page.goto(origin + '/poets/alexander-pushkin', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#poem-pushkin-4')).toBeVisible();

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['dark', 'light']) {
      await page.evaluate((value) => {
        document.documentElement.classList.toggle('theme-light', value === 'light');
        document.documentElement.classList.toggle('theme-dark', value === 'dark');
      }, theme);
      const card = page.locator('#poem-pushkin-4');
      await card.evaluate((node) => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
      await page.mouse.move(1, 1);
      await page.waitForTimeout(360);
      const before = await card.evaluate((node) => {
        const c = getComputedStyle(node);
        return {
          transform: c.transform,
          borderRadius: c.borderRadius,
          pseudoRadius: getComputedStyle(node, '::before').borderRadius,
        };
      });

      await card.hover({ position: { x: 18, y: 18 } });
      await page.waitForTimeout(360);
      const after = await card.evaluate((node) => {
        const c = getComputedStyle(node);
        return {
          transform: c.transform,
          borderRadius: c.borderRadius,
          pseudoRadius: getComputedStyle(node, '::before').borderRadius,
        };
      });

      expect(after.transform).toBe(before.transform);
      expect(after.pseudoRadius).toBe(after.borderRadius);
      expect(after.borderRadius).toBe(before.borderRadius);

      const facsimile = card.locator('[data-poem-facsimile]');
      if (await facsimile.count()) {
        await facsimile.scrollIntoViewIfNeeded();
        const visual = await facsimile.evaluate((node) => {
          const base = node.firstElementChild;
          const img = base?.querySelector('img');
          return {
            surface: getComputedStyle(base).backgroundColor,
            clip: getComputedStyle(base).overflow,
            mask: img ? getComputedStyle(img).maskImage : '',
            wrapperMask: img ? getComputedStyle(img.parentElement).maskImage : '',
            wash: getComputedStyle(base).getPropertyValue('--tlp-facsimile-wash').trim(),
            bottomOverlayCount: base?.querySelectorAll('[class*="bg-gradient-to-t"]').length ?? -1,
            scrollWidth: node.scrollWidth,
            clientWidth: node.clientWidth,
            imageWidth: img?.naturalWidth,
          };
        });
        const ctaBottomBorder = await facsimile
          .getByRole('button', { name: 'Рассмотреть полный оригинальный лист' })
          .evaluate((node) => getComputedStyle(node).borderBottomWidth);
        expect(ctaBottomBorder, 'Archival CTA must not draw a long bottom stripe').toBe('0px');
        expect(visual.surface).toBe('rgba(0, 0, 0, 0)');
        expect(visual.clip).toBe('hidden');
        expect(visual.mask).toContain('linear-gradient(to right');
        expect(visual.wrapperMask).toContain('linear-gradient(');
        expect(visual.wash).toContain(theme === 'light' ? '248, 242, 232' : '5, 10, 16');
        expect(visual.bottomOverlayCount).toBe(0);
        expect(visual.scrollWidth - visual.clientWidth).toBeLessThanOrEqual(1);
        expect(visual.imageWidth).toBe(575);
        await facsimile.screenshot({ path: testInfo.outputPath('facsimile-' + theme + '-' + width + '.png') });
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  }
});
