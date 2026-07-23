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

type ReadingPosition = { clientWidth: number; scrollY: number };

type LightboxGeometry = {
  viewport: { left: number; top: number; right: number; bottom: number; width: number; height: number };
  image: { left: number; top: number; right: number; bottom: number; width: number; height: number };
  naturalWidth: number;
  naturalHeight: number;
  bodyOverflow: string;
  viewportWidth: number;
  viewportHeight: number;
};

async function readPosition(page: Page): Promise<ReadingPosition> {
  return page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollY: window.scrollY,
  }));
}

async function clickFocusedTrigger(trigger: Locator) {
  // Playwright's normal click may perform an extra actionability scroll after the
  // coordinate snapshot. A real user taps the already visible, focused surface;
  // dispatching that click in-page keeps the test tied to the position the app
  // actually locks and later restores.
  await trigger.evaluate((node: HTMLButtonElement) => node.click());
}

async function assertPositionRestored(page: Page, expected: ReadingPosition) {
  await expect.poll(
    () => page.evaluate(() => document.documentElement.clientWidth),
    { timeout: 3_000 },
  ).toBe(expected.clientWidth);
  await expect.poll(
    () => page.evaluate((expectedY) => Math.abs(window.scrollY - expectedY), expected.scrollY),
    { timeout: 3_000 },
  ).toBeLessThanOrEqual(2);
}

async function readLightboxGeometry(page: Page): Promise<LightboxGeometry> {
  return page.evaluate(() => {
    const viewportNode = document.querySelector<HTMLElement>('[data-testid="essay-image-viewport"]')!;
    const imageNode = document.querySelector<HTMLImageElement>('[data-testid="essay-image-dialog-image"]')!;
    const viewportRect = viewportNode.getBoundingClientRect();
    const imageRect = imageNode.getBoundingClientRect();

    return {
      viewport: { left: viewportRect.left, top: viewportRect.top, right: viewportRect.right, bottom: viewportRect.bottom, width: viewportRect.width, height: viewportRect.height },
      image: { left: imageRect.left, top: imageRect.top, right: imageRect.right, bottom: imageRect.bottom, width: imageRect.width, height: imageRect.height },
      naturalWidth: imageNode.naturalWidth,
      naturalHeight: imageNode.naturalHeight,
      bodyOverflow: document.body.style.overflow,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  });
}

async function assertFittedLightbox(page: Page) {
  const dialog = page.getByTestId('essay-image-dialog');
  const image = page.getByTestId('essay-image-dialog-image');

  await expect(dialog).toBeVisible();
  await assertDecoded(image);

  await expect.poll(async () => {
    const geometry = await readLightboxGeometry(page);
    return Math.max(
      Math.abs(geometry.viewport.width - geometry.image.width),
      Math.abs(geometry.viewport.height - geometry.image.height),
      Math.max(0, -geometry.image.left),
      Math.max(0, -geometry.image.top),
      Math.max(0, geometry.image.right - geometry.viewportWidth),
      Math.max(0, geometry.image.bottom - geometry.viewportHeight),
    );
  }, { timeout: 4_000, intervals: [60, 90, 140, 220] }).toBeLessThanOrEqual(4);

  // The fitted frame and image can settle on adjacent spring frames. Poll the
  // intrinsic aspect ratio itself instead of taking one transient sample after
  // the bounding-box poll has completed.
  await expect.poll(async () => {
    const geometry = await readLightboxGeometry(page);
    const intrinsicRatio = geometry.naturalWidth / geometry.naturalHeight;
    const renderedRatio = geometry.image.width / geometry.image.height;
    return Math.abs(renderedRatio - intrinsicRatio) / intrinsicRatio;
  }, { timeout: 4_000, intervals: [60, 90, 140, 220] }).toBeLessThan(0.025);

  const geometry = await readLightboxGeometry(page);
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
  expect(Math.abs(geometry.viewport.width - geometry.image.width)).toBeLessThanOrEqual(4);
  expect(Math.abs(geometry.viewport.height - geometry.image.height)).toBeLessThanOrEqual(4);
}

async function exerciseTilt(page: Page, trigger: Locator) {
  const tilt = trigger.locator(
    'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " tilt-card-inner ")][1]',
  );
  if (!(await tilt.count())) return;

  await trigger.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await trigger.hover();

  const box = await trigger.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  if (!viewport) return;

  const left = Math.max(3, box.x + 3);
  const right = Math.min(viewport.width - 3, box.x + box.width - 3);
  const top = Math.max(3, box.y + 3);
  const bottom = Math.min(viewport.height - 3, box.y + box.height - 3);
  expect(right - left).toBeGreaterThan(8);
  expect(bottom - top).toBeGreaterThan(8);

  const initialCenter = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const points = [
    { x: left + (right - left) * 0.2, y: top + (bottom - top) * 0.22 },
    { x: left + (right - left) * 0.8, y: top + (bottom - top) * 0.28 },
    { x: left + (right - left) * 0.76, y: top + (bottom - top) * 0.78 },
    { x: left + (right - left) * 0.24, y: top + (bottom - top) * 0.72 },
    { x: left + (right - left) / 2, y: top + (bottom - top) / 2 },
  ];

  for (const point of points) {
    await page.mouse.move(point.x, point.y, { steps: 3 });
    await page.waitForTimeout(34);
  }

  await expect(tilt).toHaveAttribute('data-tilting', 'true');
  await expect.poll(() => tilt.evaluate((node) => getComputedStyle(node).transform)).not.toBe('none');
  const activeTransform = await tilt.evaluate((node) => getComputedStyle(node).transform);
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

      await trigger.focus();
      await expect(trigger).toBeFocused();
      let expectedAfterClose = await readPosition(page);

      await clickFocusedTrigger(trigger);
      await assertFittedLightbox(page);

      const zoom = page.getByTestId('essay-image-zoom');
      await zoom.click();
      await expect(zoom).toHaveAttribute('aria-pressed', 'true');
      await page.waitForTimeout(180);
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
        await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
        await assertPositionRestored(page, expectedAfterClose);

        // A second open is a new modal session. Focusing/clicking after the first
        // close may legitimately update the actionable mobile viewport position;
        // the final assertion must therefore compare with this session's own
        // captured coordinate, not with the previous modal's snapshot.
        await trigger.focus();
        expectedAfterClose = await readPosition(page);
        await clickFocusedTrigger(trigger);
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
      await assertPositionRestored(page, expectedAfterClose);
    }

    await assertNoHorizontalOverflow(page);
    assertCleanRuntime();
  });
}
