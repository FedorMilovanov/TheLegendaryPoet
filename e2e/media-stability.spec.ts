import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';

const essays = [
  'yesenin-kutezhi',
  'mayakovsky-before-revolution',
  'mayakovsky-gromovoy',
  'brik-case',
  'mayakovsky-pro-eto-separation',
] as const;

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
    if (['document', 'script', 'stylesheet', 'image'].includes(request.resourceType())) {
      failedRequests.push(`${request.resourceType()} ${request.url()} — ${request.failure()?.errorText ?? 'failed'}`);
    }
  });
  page.on('response', (response) => {
    const url = response.url();
    if (
      response.status() >= 400 &&
      ['document', 'script', 'stylesheet', 'image'].includes(response.request().resourceType()) &&
      url.startsWith('http://127.0.0.1:4173') &&
      !url.endsWith('/favicon.ico')
    ) {
      failedResponses.push(`${response.status()} ${response.request().resourceType()} ${url}`);
    }
  });

  return () => {
    expect(pageErrors, 'uncaught page errors').toEqual([]);
    expect(consoleErrors, 'browser console errors').toEqual([]);
    expect(failedRequests, 'failed runtime requests').toEqual([]);
    expect(failedResponses, 'HTTP errors for local runtime assets').toEqual([]);
  };
}

async function assertDecoded(image: Locator) {
  await expect(image).toBeVisible();
  await expect.poll(
    () => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0 && node.naturalHeight > 0),
    { timeout: 15_000 },
  ).toBe(true);
}

async function assertNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function assertFittedLightbox(page: Page) {
  const dialog = page.getByTestId('essay-image-dialog');
  const viewport = page.getByTestId('essay-image-viewport');
  const image = page.getByTestId('essay-image-dialog-image');

  await expect(dialog).toBeVisible();
  await assertDecoded(image);
  await page.waitForTimeout(520);

  const geometry = await page.evaluate(() => {
    const dialogNode = document.querySelector<HTMLElement>('[data-testid="essay-image-dialog"]')!;
    const viewportNode = document.querySelector<HTMLElement>('[data-testid="essay-image-viewport"]')!;
    const imageNode = document.querySelector<HTMLImageElement>('[data-testid="essay-image-dialog-image"]')!;
    const dialogRect = dialogNode.getBoundingClientRect();
    const viewportRect = viewportNode.getBoundingClientRect();
    const imageRect = imageNode.getBoundingClientRect();

    return {
      dialog: { left: dialogRect.left, top: dialogRect.top, right: dialogRect.right, bottom: dialogRect.bottom },
      viewport: { left: viewportRect.left, top: viewportRect.top, right: viewportRect.right, bottom: viewportRect.bottom, width: viewportRect.width, height: viewportRect.height },
      image: { left: imageRect.left, top: imageRect.top, right: imageRect.right, bottom: imageRect.bottom, width: imageRect.width, height: imageRect.height },
      naturalWidth: imageNode.naturalWidth,
      naturalHeight: imageNode.naturalHeight,
      bodyOverflow: document.body.style.overflow,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  });

  expect(geometry.bodyOverflow).toBe('hidden');
  expect(geometry.image.width).toBeGreaterThan(24);
  expect(geometry.image.height).toBeGreaterThan(24);
  expect(geometry.image.left).toBeGreaterThanOrEqual(-1);
  expect(geometry.image.top).toBeGreaterThanOrEqual(-1);
  expect(geometry.image.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(geometry.image.bottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);
  expect(geometry.viewport.left).toBeGreaterThanOrEqual(-1);
  expect(geometry.viewport.top).toBeGreaterThanOrEqual(-1);
  expect(geometry.viewport.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(geometry.viewport.bottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);

  const intrinsicRatio = geometry.naturalWidth / geometry.naturalHeight;
  const renderedRatio = geometry.image.width / geometry.image.height;
  expect(Math.abs(renderedRatio - intrinsicRatio) / intrinsicRatio).toBeLessThan(0.025);

  // At fit scale the viewport hugs the photograph. A large difference here is
  // the exact regression users perceived as a differently-sized black frame.
  expect(Math.abs(geometry.viewport.width - geometry.image.width)).toBeLessThanOrEqual(4);
  expect(Math.abs(geometry.viewport.height - geometry.image.height)).toBeLessThanOrEqual(4);
}

async function exerciseTilt(page: Page, trigger: Locator) {
  const tilt = trigger.locator(
    'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " tilt-card-inner ")][1]',
  );
  if (!(await tilt.count())) return;

  const box = await trigger.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  const initialCenter = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const points = [
    { x: box.x + box.width * 0.18, y: box.y + box.height * 0.2 },
    { x: box.x + box.width * 0.82, y: box.y + box.height * 0.24 },
    { x: box.x + box.width * 0.78, y: box.y + box.height * 0.8 },
    { x: box.x + box.width * 0.22, y: box.y + box.height * 0.76 },
    initialCenter,
  ];

  for (const point of points) {
    await page.mouse.move(point.x, point.y, { steps: 3 });
    await page.waitForTimeout(34);
  }

  await expect(tilt).toHaveAttribute('data-tilting', 'true');
  const activeTransform = await tilt.evaluate((node) => getComputedStyle(node).transform);
  expect(activeTransform).not.toBe('none');
  expect(activeTransform).not.toContain('NaN');

  const activeBox = await trigger.boundingBox();
  expect(activeBox).not.toBeNull();
  if (activeBox) {
    const activeCenter = { x: activeBox.x + activeBox.width / 2, y: activeBox.y + activeBox.height / 2 };
    expect(Math.abs(activeCenter.x - initialCenter.x)).toBeLessThan(12);
    expect(Math.abs(activeCenter.y - initialCenter.y)).toBeLessThan(12);
  }

  await page.mouse.move(2, 2);
  await expect(tilt).not.toHaveAttribute('data-tilting', 'true');
  await expect.poll(
    () => tilt.evaluate((node) => getComputedStyle(node).transform),
    { timeout: 1_500 },
  ).toBe('none');
}

async function closeAndAssertRestored(page: Page, trigger: Locator) {
  await page.getByTestId('essay-image-close').click();
  await expect(page.getByTestId('essay-image-dialog')).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
}

for (const slug of essays) {
  test(`${slug}: every image remains smooth and fitted in desktop and mobile orientations`, async ({ page }, testInfo: TestInfo) => {
    test.setTimeout(360_000);
    const assertCleanRuntime = watchRuntime(page);
    await page.goto(`/essays/${slug}`);
    await expect(page.locator('h1')).toBeVisible();

    const cover = page.getByTestId('essay-cover-image').first();
    await assertDecoded(cover);
    await expect(cover).toHaveAttribute('data-loaded', 'true');
    await expect.poll(() => cover.evaluate((node) => getComputedStyle(node).opacity)).toBe('1');

    const triggers = page.getByTestId('essay-image-trigger');
    const count = await triggers.count();
    expect(count).toBeGreaterThan(0);

    const desktop = testInfo.project.name === 'desktop-chromium';

    for (let index = 0; index < count; index += 1) {
      const trigger = triggers.nth(index);
      await trigger.scrollIntoViewIfNeeded();
      await assertDecoded(trigger.getByTestId('essay-image'));
      await expect.poll(() => trigger.getByTestId('essay-image').evaluate((node) => getComputedStyle(node).opacity)).toBe('1');

      if (desktop) await exerciseTilt(page, trigger);

      const beforeOpen = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollY: window.scrollY,
      }));

      await trigger.click();
      await assertFittedLightbox(page);

      const zoom = page.getByTestId('essay-image-zoom');
      await zoom.click();
      await expect(zoom).toHaveAttribute('aria-pressed', 'true');
      await page.waitForTimeout(280);
      await zoom.click();
      await expect(zoom).toHaveAttribute('aria-pressed', 'false');
      await assertFittedLightbox(page);

      if (index === 0 || index === count - 1) {
        await page.screenshot({
          path: testInfo.outputPath(`${slug}-${index === 0 ? 'first' : 'last'}-${desktop ? 'desktop' : 'mobile'}-lightbox.png`),
          animations: 'disabled',
        });
      }

      if (index === 0) {
        await page.keyboard.press('Escape');
        await expect(page.getByTestId('essay-image-dialog')).toBeHidden();
        await expect(trigger).toBeFocused();
        await trigger.click();
        await assertFittedLightbox(page);

        const originalViewport = page.viewportSize();
        if (desktop) {
          await page.setViewportSize({ width: 1024, height: 768 });
        } else {
          await page.setViewportSize({ width: 915, height: 412 });
        }
        await assertFittedLightbox(page);
        if (originalViewport) await page.setViewportSize(originalViewport);
        await assertFittedLightbox(page);
      }

      await closeAndAssertRestored(page, trigger);

      const afterClose = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollY: window.scrollY,
      }));
      expect(afterClose.clientWidth).toBe(beforeOpen.clientWidth);
      expect(Math.abs(afterClose.scrollY - beforeOpen.scrollY)).toBeLessThanOrEqual(2);
    }

    await assertNoHorizontalOverflow(page);
    assertCleanRuntime();
  });
}
