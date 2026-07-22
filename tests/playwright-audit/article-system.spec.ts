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

async function hydrateLazyMedia(page: Page) {
  const viewportHeight = page.viewportSize()?.height ?? 800;
  let height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += Math.max(480, Math.floor(viewportHeight * 0.72))) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(90);
    height = Math.max(height, await page.evaluate(() => document.documentElement.scrollHeight));
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(800);
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

async function verifyEssayInteractions(page: Page) {
  await expect(page.locator('.essay-body')).toBeVisible();
  await expect(page.locator('#sources')).toBeVisible();

  const imageTriggers = page.locator('button[aria-label^="Увеличить изображение"]');
  if ((await imageTriggers.count()) > 0) {
    const trigger = imageTriggers.first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    const close = page.getByRole('button', { name: 'Закрыть изображение' });
    await expect(close).toBeFocused();

    // A real modal focus trap must allow reaching its source and zoom controls,
    // rather than pinning every Tab press to the close button.
    await page.keyboard.press('Tab');
    await expect(close, 'Tab must move through controls inside the lightbox').not.toBeFocused();

    const zoom = page.getByRole('button', { name: /Увеличить изображение|Уменьшить изображение/ }).last();
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

  const primaryFilter = page.getByRole('button', { name: /Первичные/ });
  if ((await primaryFilter.count()) > 0) {
    await primaryFilter.click();
    await expect(primaryFilter).toHaveAttribute('aria-pressed', 'true');
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
  await hydrateLazyMedia(page);

  const engine: RouteAudit['engine'] = (await page.locator('.essay-body').count()) > 0 ? 'essay' : 'legacy';
  if (engine === 'essay') await verifyEssayInteractions(page);

  await hydrateLazyMedia(page);
  const images = await auditImages(page);
  const brokenImages = images
    .filter((image) => image.visible && image.complete && (image.naturalWidth === 0 || image.naturalHeight === 0))
    .map((image) => image.src);

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  const horizontalOverflow = Math.max(0, overflow.scrollWidth - overflow.clientWidth);

  const safeName = route.replace(/^\//, '').replace(/[^a-zA-Z0-9_-]+/g, '-');
  await page.screenshot({
    path: testInfo.outputPath(`${safeName || 'home'}-full.png`),
    fullPage: true,
    animations: 'disabled',
  });

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

test('all article routes render, media opens, sources work, and layouts stay stable', async ({ page }, testInfo) => {
  const routes = await collectArticleRoutes(page);
  const audits: RouteAudit[] = [];

  for (const route of routes) {
    const audit = await auditRoute(page, route, testInfo);
    audits.push(audit);

    expect(audit.brokenImages, `${route}: visible broken images`).toEqual([]);
    expect(audit.pageErrors, `${route}: uncaught page errors`).toEqual([]);
    expect(audit.consoleErrors, `${route}: console errors`).toEqual([]);
    expect(audit.horizontalOverflow, `${route}: horizontal overflow in pixels`).toBeLessThanOrEqual(1);
  }

  fs.writeFileSync(
    testInfo.outputPath('article-audit.json'),
    JSON.stringify({ project: testInfo.project.name, routes: audits }, null, 2),
  );

  const premium = audits.filter((audit) => audit.engine === 'essay');
  const legacy = audits.filter((audit) => audit.engine === 'legacy');
  expect(premium.length, 'Premium essay engine must be exercised').toBeGreaterThan(0);
  expect(legacy.length, 'Legacy article engine is intentionally detected for architecture review').toBeGreaterThan(0);
});
