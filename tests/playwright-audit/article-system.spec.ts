import { expect, test, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs';

interface RouteAudit {
  route: string;
  engine: 'essay' | 'legacy';
  imageCount: number;
  lightboxCount: number;
  brokenImages: string[];
  consoleErrors: string[];
  pageErrors: string[];
  horizontalOverflow: number;
  inlineCitations: number;
}

async function collectArticleRoutes(page: Page): Promise<string[]> {
  await page.goto('/articles', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /статьи/i }).first()).toBeVisible();

  const routes = await page.locator('a[href]').evaluateAll((anchors) => {
    const result = new Set<string>();
    for (const anchor of anchors) {
      const href = (anchor as HTMLAnchorElement).href;
      if (!href) continue;
      const url = new URL(href);
      const path = url.pathname.replace(/\/$/, '');
      if (path.startsWith('/essays/') || (path.startsWith('/articles/') && path !== '/articles')) {
        result.add(path);
      }
    }
    return [...result];
  });

  expect(routes.length, 'The listing must expose at least one article route').toBeGreaterThan(0);
  return routes.sort();
}

async function hydrateArticleMedia(page: Page) {
  const lazyImages = page.locator('img[loading="lazy"]');
  for (let index = 0; index < (await lazyImages.count()); index += 1) {
    const image = lazyImages.nth(index);
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth), {
        timeout: 12_000,
      })
      .toBeGreaterThan(0);
  }

  const blocks = page.locator('.essay-body > *');
  if ((await blocks.count()) > 0) {
    await blocks.last().scrollIntoViewIfNeeded();
    await expect(blocks.last()).toBeVisible();
  }
}

async function auditImages(page: Page) {
  return page.locator('img[src]').evaluateAll((images) =>
    images.map((node) => {
      const image = node as HTMLImageElement;
      const rect = image.getBoundingClientRect();
      const style = getComputedStyle(image);
      return {
        src: image.currentSrc || image.src,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        complete: image.complete,
        visible:
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          Number(style.opacity || 1) > 0 &&
          rect.width > 1 &&
          rect.height > 1,
      };
    }),
  );
}

async function captureVisualSlices(page: Page, route: string, testInfo: TestInfo) {
  const safeName = route.replace(/^\//, '').replace(/[^a-zA-Z0-9_-]+/g, '-');
  const blocks = page.locator('.essay-body > *');
  const count = await blocks.count();
  const samples = [...new Set([0, Math.max(0, Math.floor(count / 2)), Math.max(0, count - 1)])];

  for (const [sampleIndex, blockIndex] of samples.entries()) {
    if (count > 0) {
      await blocks.nth(blockIndex).scrollIntoViewIfNeeded();
      await expect(blocks.nth(blockIndex)).toBeVisible();
    }
    await page.waitForTimeout(120);
    await page.screenshot({
      path: testInfo.outputPath(`${safeName || 'home'}-slice-${sampleIndex + 1}.png`),
      animations: 'disabled',
    });
  }
}

async function verifyEveryLightbox(page: Page): Promise<number> {
  const imageTriggers = page.locator('button[aria-label^="Увеличить изображение"]');
  const count = await imageTriggers.count();

  for (let index = 0; index < count; index += 1) {
    const trigger = imageTriggers.nth(index);
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    const viewport = page.viewportSize();
    const dialogBox = await dialog.boundingBox();
    expect(dialogBox?.x ?? -1, `image ${index + 1}: lightbox must start at viewport left`).toBeLessThanOrEqual(1);
    expect(dialogBox?.y ?? -1, `image ${index + 1}: lightbox must start at viewport top`).toBeLessThanOrEqual(1);
    expect(dialogBox?.width ?? 0, `image ${index + 1}: lightbox must cover viewport width`).toBeGreaterThanOrEqual(
      (viewport?.width ?? 0) - 2,
    );
    expect(dialogBox?.height ?? 0, `image ${index + 1}: lightbox must cover viewport height`).toBeGreaterThanOrEqual(
      (viewport?.height ?? 0) - 2,
    );

    const close = page.getByRole('button', { name: 'Закрыть изображение' });
    await expect(close).toBeFocused();

    if (index === 0) {
      await page.keyboard.press('Tab');
      await expect(close, 'Tab must move through controls inside the lightbox').not.toBeFocused();

      const zoom = page
        .getByRole('button', { name: /Увеличить изображение|Уменьшить изображение/ })
        .last();
      await zoom.click();
      await expect(zoom).toHaveAttribute('aria-pressed', 'true');
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
  }

  return count;
}

async function verifyEveryCitationTarget(page: Page): Promise<number> {
  const citations = page.locator('.essay-body sup a[href^="#source-"]');
  const count = await citations.count();
  const targets = await citations.evaluateAll((links) =>
    [...new Set(links.map((link) => (link as HTMLAnchorElement).getAttribute('href')).filter(Boolean))] as string[],
  );

  for (const targetHash of targets) {
    const citation = citations.filter({ has: page.locator(`[href="${targetHash}"]`) }).first();
    const directCitation = page.locator(`.essay-body sup a[href="${targetHash}"]`).first();
    await directCitation.scrollIntoViewIfNeeded();
    await directCitation.click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe(targetHash);
    await expect(page.locator(targetHash)).toBeVisible();
    expect(await citation.count()).toBeGreaterThanOrEqual(0);
  }

  return count;
}

async function verifyLongformInteractions(page: Page) {
  await expect(page.locator('.essay-body')).toBeVisible();
  await expect(page.locator('.essay-body > *').first()).toBeVisible();

  const lightboxCount = await verifyEveryLightbox(page);
  const citationCount = await verifyEveryCitationTarget(page);

  const sourceLibrary = page.locator('#sources');
  if ((await sourceLibrary.count()) > 0) {
    await expect(sourceLibrary).toBeVisible();
    const primaryFilter = page.getByRole('button', { name: /Первичные/ });
    if ((await primaryFilter.count()) > 0) {
      await primaryFilter.click();
      await expect(primaryFilter).toHaveAttribute('aria-pressed', 'true');
    }
  }

  return { lightboxCount, citationCount };
}

async function auditRoute(page: Page, route: string, testInfo: TestInfo): Promise<RouteAudit> {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const onConsole = (message: { type(): string; text(): string }) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  };
  const onPageError = (error: Error) => pageErrors.push(error.message);
  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page.getByText('Статья не найдена')).toHaveCount(0);

  const engine: RouteAudit['engine'] =
    (await page.locator('.essay-body').count()) > 0 ? 'essay' : 'legacy';
  const interactions =
    engine === 'essay'
      ? await verifyLongformInteractions(page)
      : { lightboxCount: 0, citationCount: 0 };

  await hydrateArticleMedia(page);
  const images = await auditImages(page);
  const brokenImages = images
    .filter(
      (image) =>
        image.visible && image.complete && (image.naturalWidth === 0 || image.naturalHeight === 0),
    )
    .map((image) => image.src);

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  const horizontalOverflow = Math.max(0, overflow.scrollWidth - overflow.clientWidth);

  await captureVisualSlices(page, route, testInfo);

  page.off('console', onConsole);
  page.off('pageerror', onPageError);

  return {
    route,
    engine,
    imageCount: images.length,
    lightboxCount: interactions.lightboxCount,
    brokenImages,
    consoleErrors,
    pageErrors,
    horizontalOverflow,
    inlineCitations: interactions.citationCount,
  };
}

test('all article routes use one engine and every media/source interaction works', async ({ page }, testInfo) => {
  const routes = await collectArticleRoutes(page);
  const audits: RouteAudit[] = [];

  for (const route of routes) {
    const audit = await auditRoute(page, route, testInfo);
    audits.push(audit);

    expect(audit.engine, `${route}: every article route must use the universal longform engine`).toBe(
      'essay',
    );
    expect(audit.brokenImages, `${route}: visible broken images`).toEqual([]);
    expect(audit.pageErrors, `${route}: uncaught page errors`).toEqual([]);
    expect(audit.consoleErrors, `${route}: console errors`).toEqual([]);
    expect(audit.horizontalOverflow, `${route}: horizontal overflow in pixels`).toBeLessThanOrEqual(1);
  }

  fs.writeFileSync(
    testInfo.outputPath('article-audit.json'),
    JSON.stringify({ project: testInfo.project.name, routes: audits }, null, 2),
  );

  expect(audits.some((audit) => audit.engine === 'legacy'), 'No legacy renderer may remain').toBe(false);
});
