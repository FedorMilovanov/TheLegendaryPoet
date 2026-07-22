import { expect, test, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs';

interface RouteAudit {
  route: string;
  engine: 'essay' | 'legacy';
  imageCount: number;
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
    } else {
      await page.evaluate((ratio) => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: max * ratio, behavior: 'instant' });
      }, sampleIndex / Math.max(1, samples.length - 1));
    }
    await page.waitForTimeout(180);
    await page.screenshot({
      path: testInfo.outputPath(`${safeName || 'home'}-slice-${sampleIndex + 1}.png`),
      animations: 'disabled',
    });
  }
}

async function verifyLongformInteractions(page: Page) {
  await expect(page.locator('.essay-body')).toBeVisible();
  await expect(page.locator('.essay-body > *').first()).toBeVisible();

  const imageTriggers = page.locator('button[aria-label^="Увеличить изображение"]');
  if ((await imageTriggers.count()) > 0) {
    const trigger = imageTriggers.first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const viewport = page.viewportSize();
    const dialogBox = await dialog.boundingBox();
    expect(dialogBox?.x ?? -1, 'Lightbox must start at the viewport left edge').toBeLessThanOrEqual(1);
    expect(dialogBox?.y ?? -1, 'Lightbox must start at the viewport top edge').toBeLessThanOrEqual(1);
    expect(dialogBox?.width ?? 0, 'Lightbox must cover the viewport width').toBeGreaterThanOrEqual(
      (viewport?.width ?? 0) - 2,
    );
    expect(dialogBox?.height ?? 0, 'Lightbox must cover the viewport height').toBeGreaterThanOrEqual(
      (viewport?.height ?? 0) - 2,
    );
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    const close = page.getByRole('button', { name: 'Закрыть изображение' });
    await expect(close).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(close, 'Tab must move through controls inside the lightbox').not.toBeFocused();

    const zoom = page
      .getByRole('button', { name: /Увеличить изображение|Уменьшить изображение/ })
      .last();
    await zoom.click();
    await expect(zoom).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  }

  const citation = page.locator('.essay-body sup a[href^="#source-"]').first();
  if ((await citation.count()) > 0) {
    const targetHash = await citation.getAttribute('href');
    expect(targetHash).toBeTruthy();
    await citation.click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe(targetHash);
    await expect(page.locator(targetHash!)).toBeVisible();
  }

  const sourceLibrary = page.locator('#sources');
  if ((await sourceLibrary.count()) > 0) {
    await expect(sourceLibrary).toBeVisible();
    const primaryFilter = page.getByRole('button', { name: /Первичные/ });
    if ((await primaryFilter.count()) > 0) {
      await primaryFilter.click();
      await expect(primaryFilter).toHaveAttribute('aria-pressed', 'true');
    }
  }
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
  if (engine === 'essay') await verifyLongformInteractions(page);

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
    brokenImages,
    consoleErrors,
    pageErrors,
    horizontalOverflow,
    inlineCitations: await page.locator('.essay-body sup a[href^="#source-"]').count(),
  };
}

test('all article routes use one engine and pass media, source, and layout checks', async ({ page }, testInfo) => {
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
