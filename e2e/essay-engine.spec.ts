import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';

const essays = [
  'yesenin-kutezhi',
  'mayakovsky-before-revolution',
  'mayakovsky-gromovoy',
  'brik-case',
] as const;

async function openEssay(page: Page, slug: string) {
  await page.goto(`/essays/${slug}`);
  await expect(page.locator('h1')).toBeVisible();
}

function watchRuntime(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  const failedRequests: string[] = [];

  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    const type = request.resourceType();
    if (['document', 'script', 'stylesheet', 'image'].includes(type)) {
      failedRequests.push(`${type} ${request.url()} — ${request.failure()?.errorText ?? 'failed'}`);
    }
  });
  page.on('response', (response) => {
    const type = response.request().resourceType();
    const url = response.url();
    if (
      response.status() >= 400 &&
      ['document', 'script', 'stylesheet', 'image'].includes(type) &&
      url.startsWith('http://127.0.0.1:4173') &&
      !url.endsWith('/favicon.ico')
    ) {
      failedResponses.push(`${response.status()} ${type} ${url}`);
    }
  });

  return () => {
    expect(pageErrors, 'uncaught page errors').toEqual([]);
    expect(consoleErrors, 'browser console errors').toEqual([]);
    expect(failedRequests, 'failed runtime requests').toEqual([]);
    expect(failedResponses, 'HTTP errors for local runtime assets').toEqual([]);
  };
}

async function assertLoadedLocalImage(image: Locator) {
  await expect(image).toBeVisible();
  await expect.poll(async () => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
  const source = await image.evaluate((node: HTMLImageElement) => node.currentSrc || node.src);
  const url = new URL(source);
  expect(url.origin).toBe('http://127.0.0.1:4173');
  expect(url.pathname).toMatch(/\.(?:avif|webp)$/i);
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
    test(`${slug}: responsive media, lightbox and keyboard controls work`, async ({ page }, testInfo) => {
      const assertCleanRuntime = watchRuntime(page);
      await openEssay(page, slug);
      await assertLoadedLocalImage(page.getByTestId('essay-cover-image').first());

      const triggers = page.getByTestId('essay-image-trigger');
      const count = await triggers.count();
      expect(count).toBeGreaterThan(0);

      for (let index = 0; index < count; index += 1) {
        const trigger = triggers.nth(index);
        await trigger.scrollIntoViewIfNeeded();
        await assertLoadedLocalImage(trigger.getByTestId('essay-image'));
        await trigger.click();

        const dialog = page.getByTestId('essay-image-dialog');
        await expect(dialog).toBeVisible();

        if (index === 0) {
          await page.keyboard.press('Escape');
          await expect(dialog).toBeHidden();
          await expect(trigger).toBeFocused();
          await trigger.click();
          await expect(dialog).toBeVisible();
        }

        const zoom = page.getByTestId('essay-image-zoom');
        await zoom.click();
        await expect(zoom).toHaveAttribute('aria-pressed', 'true');
        await zoom.click();
        await expect(zoom).toHaveAttribute('aria-pressed', 'false');

        const sourceLink = dialog.getByTestId('essay-image-source');
        if (await sourceLink.count()) await expect(sourceLink).toHaveAttribute('href', /^https:\/\//);

        await page.getByTestId('essay-image-close').click();
        await expect(dialog).toBeHidden();
      }

      if (slug !== 'yesenin-kutezhi') {
        expect(
          await page.locator('.essay-block-image[class*="lg:float-"]').count(),
          'configured archival portraits should enter the prose column on desktop',
        ).toBeGreaterThan(0);
      }

      await assertNoHorizontalOverflow(page);
      assertCleanRuntime();
      await page.screenshot({
        path: testInfo.outputPath(`${slug}-desktop-integrated.webp`),
        fullPage: false,
      });
    });
  }
});

test.describe('mobile essay reading', () => {
  test.skip(({ project }) => project.name !== 'mobile-chromium', 'mobile navigation sweep');

  for (const slug of essays) {
    test(`${slug}: cover, inline media and all TOC chapters work`, async ({ page }, testInfo) => {
      test.setTimeout(180_000);
      const assertCleanRuntime = watchRuntime(page);
      await openEssay(page, slug);
      await assertLoadedLocalImage(page.getByTestId('essay-cover-image').first());

      const firstImageTrigger = page.getByTestId('essay-image-trigger').first();
      await firstImageTrigger.scrollIntoViewIfNeeded();
      await assertLoadedLocalImage(firstImageTrigger.getByTestId('essay-image'));

      const trigger = page.getByTestId('mobile-toc-trigger');
      await expect(trigger).toBeVisible();
      await trigger.click();
      const dialog = page.getByTestId('mobile-toc-dialog');
      await expect(dialog).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`${slug}-mobile-wtoc.webp`) });

      const rowCount = await page.getByTestId('mobile-toc-row').count();
      expect(rowCount).toBeGreaterThan(2);
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();

      for (let index = 0; index < rowCount; index += 1) {
        await trigger.click();
        const row = page.getByTestId('mobile-toc-row').nth(index);
        await row.scrollIntoViewIfNeeded();
        await row.click();
        await expect(dialog).toBeHidden();
        await expect.poll(() => page.evaluate(() => window.location.hash)).toMatch(/^#.+/);
      }

      await assertNoHorizontalOverflow(page);
      assertCleanRuntime();
    });
  }
});

test.describe('shared longform architecture', () => {
  test.skip(({ project }) => project.name !== 'desktop-chromium', 'desktop architecture QA');

  test('legacy /articles routes render through the common ArticleRenderer', async ({ page }) => {
    const assertCleanRuntime = watchRuntime(page);
    await page.goto('/articles');
    await expect(page.locator('h1')).toBeVisible();
    const link = page.locator('a[href^="/articles/"]').first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^\/articles\/.+/);

    await page.goto(href!);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.essay-body')).toBeVisible();
    await expect(page.locator('.essay-block-paragraph').first()).toBeVisible();
    await assertNoHorizontalOverflow(page);
    assertCleanRuntime();
  });

  test('source filters, expansion and inline citations are connected', async ({ page }, testInfo) => {
    const assertCleanRuntime = watchRuntime(page);
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

    assertCleanRuntime();
    await page.screenshot({ path: testInfo.outputPath('brik-source-library.webp') });
  });
});
