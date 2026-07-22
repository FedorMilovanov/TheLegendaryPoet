import { expect, test, type Page, type TestInfo } from '@playwright/test';

const essays = [
  'yesenin-kutezhi',
  'mayakovsky-before-revolution',
  'mayakovsky-gromovoy',
  'brik-case',
] as const;

async function openEssay(page: Page, slug: string) {
  await page.goto(`/essays/${slug}`);
  await expect(page.locator('h1')).toBeVisible();
  await page.waitForTimeout(900); // opening wipe and first reveal
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

test.describe('essay media engine', () => {
  test.skip(({ project }) => project.name !== 'desktop-chromium', 'desktop interaction sweep');

  for (const slug of essays) {
    test(`${slug}: every image is local, loaded, zoomable and closable`, async ({ page }, testInfo) => {
      const failedImages: string[] = [];
      page.on('requestfailed', (request) => {
        if (request.resourceType() === 'image') failedImages.push(request.url());
      });

      await openEssay(page, slug);
      const cover = page.getByTestId('essay-cover-image').first();
      await expect(cover).toBeVisible();
      await expect.poll(async () => cover.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);

      const triggers = page.getByTestId('essay-image-trigger');
      const count = await triggers.count();
      expect(count).toBeGreaterThan(0);

      await expect.poll(async () => {
        return page.getByTestId('essay-image').evaluateAll((images: HTMLImageElement[]) =>
          images.every((image) => image.complete && image.naturalWidth > 0),
        );
      }).toBe(true);

      const runtimeSources = await page.getByTestId('essay-image').evaluateAll((images: HTMLImageElement[]) =>
        images.map((image) => image.currentSrc || image.src),
      );
      for (const source of runtimeSources) {
        const url = new URL(source);
        expect(url.origin).toBe('http://127.0.0.1:4173');
        expect(url.pathname).toMatch(/\.(?:avif|webp)$/i);
      }

      for (let index = 0; index < count; index += 1) {
        const trigger = triggers.nth(index);
        await trigger.scrollIntoViewIfNeeded();
        await trigger.click();
        const dialog = page.getByTestId('essay-image-dialog');
        await expect(dialog).toBeVisible();

        const zoom = page.getByTestId('essay-image-zoom');
        await zoom.click();
        await expect(zoom).toHaveAttribute('aria-pressed', 'true');
        await zoom.click();
        await expect(zoom).toHaveAttribute('aria-pressed', 'false');

        const sourceLink = page.getByTestId('essay-image-source');
        if (await sourceLink.count()) {
          await expect(sourceLink).toHaveAttribute('href', /^https:\/\//);
        }
        await page.getByTestId('essay-image-close').click();
        await expect(dialog).toBeHidden();
      }

      expect(failedImages).toEqual([]);
      await assertNoHorizontalOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath(`${slug}-desktop-integrated.webp`),
        fullPage: false,
      });
    });
  }
});

test.describe('mobile wTOC', () => {
  test.skip(({ project }) => project.name !== 'mobile-chromium', 'mobile navigation sweep');

  for (const slug of essays) {
    test(`${slug}: all mobile TOC chapters can be opened and selected`, async ({ page }, testInfo) => {
      test.setTimeout(180_000);
      await openEssay(page, slug);
      await page.mouse.wheel(0, 1100);
      await page.waitForTimeout(650);

      const trigger = page.getByTestId('mobile-toc-trigger');
      await expect(trigger).toBeVisible();
      await trigger.click();
      const dialog = page.getByTestId('mobile-toc-dialog');
      await expect(dialog).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`${slug}-mobile-wtoc.webp`) });

      const rowCount = await page.getByTestId('mobile-toc-row').count();
      expect(rowCount).toBeGreaterThan(2);
      await page.getByTestId('mobile-toc-close').click();
      await expect(dialog).toBeHidden();

      for (let index = 0; index < rowCount; index += 1) {
        await expect(trigger).toBeVisible();
        await trigger.click();
        const rows = page.getByTestId('mobile-toc-row');
        const row = rows.nth(index);
        await row.scrollIntoViewIfNeeded();
        await row.click();
        await expect(dialog).toBeHidden();
        await expect.poll(() => page.evaluate(() => window.location.hash)).toMatch(/^#/);
        await page.waitForTimeout(160);
      }

      await assertNoHorizontalOverflow(page);
    });
  }
});

test.describe('source library and semantic controls', () => {
  test.skip(({ project }) => project.name !== 'desktop-chromium', 'desktop source QA');

  test('filters, expansion and inline citations are connected', async ({ page }, testInfo) => {
    await openEssay(page, 'brik-case');
    const library = page.getByTestId('source-library');
    await library.scrollIntoViewIfNeeded();
    await expect(library).toBeVisible();

    for (const filter of ['all', 'primary', 'archive', 'research', 'context']) {
      const button = page.getByTestId(`source-filter-${filter}`);
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('source-item').first()).toBeVisible();
    }

    await page.getByTestId('source-filter-all').click();
    const expand = page.getByTestId('source-expand');
    if (await expand.count()) {
      await expand.click();
      await expect(expand).toHaveAttribute('aria-expanded', 'true');
    }

    const citation = page.getByTestId('inline-citation').first();
    await citation.scrollIntoViewIfNeeded();
    await citation.click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toMatch(/^#source-/);
    const targetId = await page.evaluate(() => window.location.hash.slice(1));
    await expect(page.locator(`[id="${targetId}"]`)).toBeVisible();

    await page.screenshot({ path: testInfo.outputPath('brik-source-library.webp') });
  });
});
