import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
const CHROME_TRANSITION_MS = 700;
const MOBILE_LANDMARK_SELECTOR = [
  '#main-content section',
  '#main-content article',
  '#main-content img[loading="lazy"]',
  '#main-content [data-image-state]',
].join(',');

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const routes = [
  ['home', '/'],
  ['poets', '/poets'],
  ['ratings', '/ratings'],
  ['articles', '/articles'],
  ['music', '/music'],
  ['archive', '/archive'],
  ['about', '/about'],
  ['not-found', '/mobile-platform-route-that-does-not-exist'],
];

function platformName(testInfo) {
  return testInfo.project.name;
}

function isWebKitProject(testInfo) {
  return testInfo.project.name === 'iphone-safari';
}

function attachRuntimeDiagnostics(page) {
  const result = { pageErrors: [], consoleErrors: [], localRequestFailures: [] };

  page.on('pageerror', (error) => result.pageErrors.push(String(error?.stack || error)));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/Failed to load resource/i.test(text)) return;
    result.consoleErrors.push(text);
  });
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (!url.startsWith(BASE_URL)) return;
    const failure = request.failure()?.errorText || 'unknown failure';
    if (/ERR_ABORTED/i.test(failure)) return;
    if ((request.resourceType() === 'media' || /\.mp3(?:$|\?)/i.test(url)) && /cancelled/i.test(failure)) return;
    result.localRequestFailures.push(`${request.method()} ${url}: ${failure}`);
  });

  return result;
}

async function settle(page) {
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForTimeout(700);
}

async function scrollAndYield(page, top, delay = 80) {
  await page.evaluate((scrollTop) => {
    window.scrollTo({ top: scrollTop, left: 0, behavior: 'auto' });
  }, top);
  // Chromium keeps the exhaustive numeric traversal. Linux WebKit uses the
  // bounded locator path below and never enters this evaluated scroll loop.
  await page.waitForTimeout(delay);
}

function selectBoundedIndices(count, limit = 7) {
  if (count <= 0) return [];
  if (count <= limit) return Array.from({ length: count }, (_, index) => index);
  const indices = [0];
  for (let slot = 1; slot < limit - 1; slot += 1) {
    indices.push(Math.round((count - 1) * (slot / (limit - 1))));
  }
  indices.push(count - 1);
  return [...new Set(indices)].sort((left, right) => left - right);
}

async function visitNativeWebKitLandmarks(page) {
  const landmarks = page.locator(MOBILE_LANDMARK_SELECTOR);
  const count = await landmarks.count();
  const indices = selectBoundedIndices(count);
  const visited = [];

  for (const index of indices) {
    const target = landmarks.nth(index);
    if (!(await target.isVisible())) continue;
    await target.scrollIntoViewIfNeeded();
    await expect(target).toBeInViewport({ ratio: 0.01 });
    await page.waitForTimeout(145);
    visited.push(index);
  }

  expect(visited.length, 'bounded native WebKit landmarks visited').toBeGreaterThan(0);
  expect(visited.length, 'bounded native WebKit landmark budget').toBeLessThanOrEqual(7);
  return visited;
}

async function restoreChromeAtTop(page, { nativeWebKit = false } = {}) {
  if (nativeWebKit) {
    const currentY = await page.evaluate(() => window.scrollY);
    if (currentY <= 16) {
      const landmarks = page.locator(MOBILE_LANDMARK_SELECTOR);
      const count = await landmarks.count();
      if (count > 1) {
        const lowerLandmark = landmarks.nth(Math.min(count - 1, 2));
        if (await lowerLandmark.isVisible()) {
          await lowerLandmark.scrollIntoViewIfNeeded();
          await page.waitForTimeout(150);
        }
      } else {
        await page.mouse.wheel(0, 560);
        await page.waitForTimeout(150);
      }
    }

    const topHeading = page.locator('#main-content h1, #main-content h2').first();
    if (await topHeading.count()) await topHeading.scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, -100_000);
    await page.waitForTimeout(180);

    await expect.poll(
      () => page.evaluate(() => window.scrollY),
      { timeout: 8_000, message: 'WebKit should return to the document top' },
    ).toBeLessThanOrEqual(1);
    await expect(page.locator('html')).not.toHaveClass(/chrome-hidden/, { timeout: 8_000 });
    await page.waitForTimeout(CHROME_TRANSITION_MS);
    return;
  }

  const initial = await page.evaluate(() => ({
    scrollY: window.scrollY,
    maxScroll: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
  }));

  if (initial.scrollY <= 16 && initial.maxScroll > 32) {
    await scrollAndYield(page, Math.min(64, initial.maxScroll));
  }

  const currentY = await page.evaluate(() => window.scrollY);
  await scrollAndYield(page, Math.max(0, currentY - 96));
  await scrollAndYield(page, 0);

  await expect.poll(
    () => page.evaluate(() => window.scrollY <= 1 && !document.documentElement.classList.contains('chrome-hidden')),
    { timeout: 5_000, message: 'site chrome should return after an upward mobile scroll' },
  ).toBe(true);

  await page.waitForTimeout(CHROME_TRANSITION_MS);
}

async function expectDockInsideViewport(page) {
  const dock = page.locator('.mobile-dock');
  await expect(dock).toBeVisible();
  await expect.poll(
    () => dock.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left >= -1
        && rect.right <= window.innerWidth + 1
        && rect.top >= -1
        && rect.bottom <= window.innerHeight + 1;
    }),
    { timeout: 5_000, message: 'mobile dock should finish returning inside the visual viewport' },
  ).toBe(true);
}

async function exerciseLazyContent(page, { nativeWebKit = false } = {}) {
  if (nativeWebKit) {
    await visitNativeWebKitLandmarks(page);
    await restoreChromeAtTop(page, { nativeWebKit: true });
    return;
  }

  const { max, step } = await page.evaluate(() => ({
    max: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
    step: Math.max(420, Math.floor(window.innerHeight * 0.8)),
  }));
  for (let y = 0; y < max; y += step) {
    await scrollAndYield(page, y, 35);
  }
  await restoreChromeAtTop(page);
}

async function collectDiagnostics(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const dockElement = document.querySelector('.mobile-dock');
    const dockRect = dockElement?.getBoundingClientRect();
    const dockStyle = dockElement ? getComputedStyle(dockElement) : null;
    const visibleImages = [...document.images].filter((image) => {
      const rect = image.getBoundingClientRect();
      const style = getComputedStyle(image);
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 2 && rect.height > 2;
    });

    return {
      title: document.title,
      pathname: location.pathname,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints,
      coarsePointer: matchMedia('(pointer: coarse)').matches,
      touchEventSurface: 'ontouchstart' in window || typeof TouchEvent === 'function',
      viewport: { width: innerWidth, height: innerHeight },
      screen: { width: screen.width, height: screen.height },
      visualViewport: window.visualViewport
        ? {
            width: window.visualViewport.width,
            height: window.visualViewport.height,
            offsetTop: window.visualViewport.offsetTop,
            offsetLeft: window.visualViewport.offsetLeft,
            scale: window.visualViewport.scale,
          }
        : null,
      supportsDynamicViewport: CSS.supports('height: 100dvh'),
      supportsSafeArea: CSS.supports('padding-bottom: env(safe-area-inset-bottom)'),
      horizontalOverflow: Math.max(document.body.scrollWidth, root.scrollWidth) - root.clientWidth,
      brokenImages: visibleImages
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src || image.alt || '<unknown>'),
      failedResilientImages: [...document.querySelectorAll('[data-image-state="failed"]')].length,
      visibleBusyRegions: [...document.querySelectorAll('[aria-busy="true"]')].filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).length,
      dock: dockRect && dockStyle && dockRect.width > 0
        ? {
            left: dockRect.left,
            right: dockRect.right,
            top: dockRect.top,
            bottom: dockRect.bottom,
            width: dockRect.width,
            height: dockRect.height,
            computedBottom: dockStyle.bottom,
            transform: dockStyle.transform,
          }
        : null,
      chromeHidden: root.classList.contains('chrome-hidden'),
      modalOpen: Boolean(window.__TLP_MODAL_OPEN),
    };
  });
}

async function expectCleanRuntime(runtime) {
  expect(runtime.pageErrors, 'uncaught page errors').toEqual([]);
  expect(runtime.consoleErrors, 'console errors').toEqual([]);
  expect(runtime.localRequestFailures, 'failed same-origin requests').toEqual([]);
}

for (const [name, route] of routes) {
  test(`${name}: mobile engine rendering, safe area, images and runtime`, async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === 'iphone-safari' && name === 'home',
      'dedicated bounded WebKit home audit provides equivalent coverage',
    );
    const nativeWebKit = isWebKitProject(testInfo);
    const runtime = attachRuntimeDiagnostics(page);
    const response = await page.goto(`${BASE_URL}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    expect(response, 'navigation response exists').not.toBeNull();
    expect(response.status(), `HTTP status for ${route}`).toBeLessThan(400);
    await settle(page);
    await exerciseLazyContent(page, { nativeWebKit });
    await expectDockInsideViewport(page);

    const diagnostics = await collectDiagnostics(page);
    const platform = platformName(testInfo);
    fs.writeFileSync(
      path.join(ARTIFACT_DIR, `${platform}-${name}.json`),
      JSON.stringify({ platform, route, runtime, diagnostics }, null, 2),
    );
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `${platform}-${name}.png`),
      fullPage: true,
    });

    expect(diagnostics.horizontalOverflow, `horizontal overflow on ${platform}`).toBeLessThanOrEqual(2);
    expect(diagnostics.brokenImages, 'visible broken images').toEqual([]);
    expect(diagnostics.failedResilientImages, 'failed resilient images').toBe(0);
    expect(diagnostics.visibleBusyRegions, 'stuck loading regions').toBe(0);
    expect(diagnostics.visualViewport, 'visual viewport API').not.toBeNull();
    expect(diagnostics.coarsePointer, 'coarse pointer media query').toBe(true);
    expect(
      diagnostics.maxTouchPoints > 0 || diagnostics.touchEventSurface,
      'touch event surface',
    ).toBe(true);
    expect(diagnostics.supportsDynamicViewport, 'dynamic viewport units').toBe(true);
    expect(diagnostics.supportsSafeArea, 'safe-area environment variables').toBe(true);
    expect(diagnostics.chromeHidden, 'chrome unexpectedly hidden at page top').toBe(false);
    if (diagnostics.dock) {
      expect(diagnostics.dock.left).toBeGreaterThanOrEqual(-1);
      expect(diagnostics.dock.right).toBeLessThanOrEqual(diagnostics.viewport.width + 1);
      expect(diagnostics.dock.top).toBeGreaterThanOrEqual(-1);
      expect(diagnostics.dock.bottom).toBeLessThanOrEqual(diagnostics.viewport.height + 1);
    }
    await expectCleanRuntime(runtime);
  });
}

test('mobile dock, search sheet and tap targets remain usable', async ({ page }, testInfo) => {
  const nativeWebKit = isWebKitProject(testInfo);
  const runtime = attachRuntimeDiagnostics(page);
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await settle(page);
  await restoreChromeAtTop(page, { nativeWebKit });

  const dock = page.locator('.mobile-dock');
  await expectDockInsideViewport(page);
  const tapTargets = await dock.locator('a, button').evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return {
      name: element.getAttribute('aria-label') || element.textContent?.trim() || element.tagName,
      width: rect.width,
      height: rect.height,
    };
  }));
  expect(tapTargets.length).toBeGreaterThanOrEqual(4);
  for (const target of tapTargets) {
    expect(target.width, `${target.name} touch width`).toBeGreaterThanOrEqual(44);
    expect(target.height, `${target.name} touch height`).toBeGreaterThanOrEqual(44);
  }

  const searchButtons = page.getByRole('button', { name: /поиск/i });
  expect(await searchButtons.count()).toBeGreaterThan(0);
  await searchButtons.last().tap();
  const dialog = page.getByRole('dialog', { name: 'Поиск по сайту' });
  const input = page.getByRole('combobox', { name: 'Поисковый запрос' });
  await expect(dialog).toBeVisible();
  await expect(input).toBeFocused();
  await input.fill('Есенин');
  await expect(page.getByRole('listbox', { name: 'Результаты поиска' })).toBeVisible();

  const focusedState = await page.evaluate(() => ({
    activeTag: document.activeElement?.tagName,
    scrollLocked: getComputedStyle(document.body).overflow === 'hidden',
    modalOpen: Boolean(window.__TLP_MODAL_OPEN),
    visualViewportHeight: window.visualViewport?.height ?? null,
  }));
  expect(focusedState.activeTag).toBe('INPUT');
  expect(focusedState.scrollLocked).toBe(true);
  expect(focusedState.modalOpen).toBe(true);
  expect(focusedState.visualViewportHeight).not.toBeNull();

  const platform = platformName(testInfo);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, `${platform}-search-sheet.png`),
    fullPage: false,
  });

  await page.getByRole('button', { name: 'Закрыть поиск' }).tap();
  await expect(dialog).toBeHidden();
  await expect.poll(() => page.evaluate(() => Boolean(window.__TLP_MODAL_OPEN))).toBe(false);
  await expectCleanRuntime(runtime);
});

test('ratings and community input survive touch entry and reload', async ({ page }, testInfo) => {
  const runtime = attachRuntimeDiagnostics(page);
  await page.goto(`${BASE_URL}/ratings`, { waitUntil: 'domcontentloaded' });
  await settle(page);

  const search = page.getByRole('searchbox', { name: 'Найти поэта в рейтинге' });
  await search.fill('Есенин');
  await expect(page).toHaveURL(/q=%D0%95%D1%81%D0%B5%D0%BD%D0%B8%D0%BD/);
  await expect(page.getByText(/Найдено:/)).toContainText('1');
  await page.getByRole('checkbox', { name: 'Только с голосами' }).check();
  await expect(page).toHaveURL(/rated=1/);
  await page.getByRole('button', { name: /сбросить/i }).click();
  await expect(search).toHaveValue('');

  await page.goto(`${BASE_URL}/poets`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  const poetLinks = page.locator('a[href^="/poets/"]');
  expect(await poetLinks.count()).toBeGreaterThan(0);
  const href = await poetLinks.first().getAttribute('href');
  expect(href).toMatch(/^\/poets\//);
  await page.goto(`${BASE_URL}${href}`, { waitUntil: 'domcontentloaded' });
  await settle(page);

  const submit = page.getByRole('button', { name: /зафиксировать оценку|обновить оценку/i }).first();
  const panel = submit.locator('xpath=ancestor::section[1]');
  const groups = panel.getByRole('radiogroup');
  expect(await groups.count()).toBe(4);
  for (let index = 0; index < 4; index += 1) {
    const radios = groups.nth(index).getByRole('radio');
    expect(await radios.count()).toBe(5);
    await radios.nth(4).tap();
    await expect(radios.nth(4)).toBeChecked();
  }
  await expect(submit).toBeEnabled();
  await submit.tap();

  const text = `Мобильная проверка ${platformName(testInfo)}: оценка и комментарий сохраняются.`;
  const author = panel.getByPlaceholder('Ваше имя или псевдоним — необязательно');
  const composer = panel.getByPlaceholder('Что особенно точно, спорно, сильно или слабо?');
  const commentCard = panel.getByRole('article').filter({ hasText: text });
  await author.fill('Mobile QA');
  await composer.fill(text);
  await composer.press(testInfo.project.name === 'iphone-safari' ? 'Meta+Enter' : 'Control+Enter');
  await expect(composer).toHaveValue('');
  await expect(commentCard).toHaveCount(1);
  await expect(commentCard).toBeVisible();

  await page.reload({ waitUntil: 'domcontentloaded' });
  await settle(page);
  await expect(commentCard).toHaveCount(1);
  await expect(commentCard).toBeVisible();
  await expect(page.getByRole('button', { name: 'Обновить оценку' }).first()).toBeVisible();
  await expectCleanRuntime(runtime);
});

test('music shell, immersive dialog and mobile dock do not collide', async ({ page }, testInfo) => {
  const nativeWebKit = isWebKitProject(testInfo);
  const runtime = attachRuntimeDiagnostics(page);
  await page.goto(`${BASE_URL}/music`, { waitUntil: 'domcontentloaded' });
  await settle(page);

  const playButtons = page.getByRole('button', { name: /воспроизвести трек|поставить на паузу|повторить загрузку аудио/i });
  expect(await playButtons.count()).toBeGreaterThan(0);
  await playButtons.first().tap();
  await page.waitForTimeout(1_200);
  const audio = page.locator('audio');
  await expect(audio).toHaveCount(1);
  const audioState = await audio.evaluate((element) => ({
    currentSrc: element.currentSrc,
    networkState: element.networkState,
    readyState: element.readyState,
    error: element.error?.message || null,
  }));
  expect(audioState.currentSrc).toContain('/audio/');

  const immersiveButtons = page.getByRole('button', { name: 'Погружение' });
  expect(await immersiveButtons.count()).toBeGreaterThan(0);
  await immersiveButtons.first().tap();
  const immersive = page.locator('[role="dialog"][aria-labelledby="immersive-track-title"]');
  await expect(immersive).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(window.__TLP_MODAL_OPEN))).toBe(true);
  await immersive.getByRole('button', { name: 'Выйти' }).tap();
  await expect(immersive).toBeHidden({ timeout: 8_000 });
  await expect.poll(() => page.evaluate(() => Boolean(window.__TLP_MODAL_OPEN))).toBe(false);

  await restoreChromeAtTop(page, { nativeWebKit });
  await expectDockInsideViewport(page);
  await page.locator('.mobile-dock').getByRole('link', { name: 'Рейтинг' }).tap();
  await expect(page).toHaveURL(/\/ratings$/);
  await expect(audio).toHaveCount(1);

  const geometry = await page.evaluate(() => {
    const read = (selector) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      return rect ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } : null;
    };
    const overlaps = (left, right) => left && right
      ? left.left < right.right && left.right > right.left && left.top < right.bottom && left.bottom > right.top
      : false;
    const player = read('.global-audio-mini');
    const dock = read('.mobile-dock');
    return { player, dock, overlap: overlaps(player, dock) };
  });
  expect(geometry.player).not.toBeNull();
  expect(geometry.dock).not.toBeNull();
  expect(geometry.overlap, 'mini-player overlaps mobile dock').toBe(false);

  const platform = platformName(testInfo);
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, `${platform}-audio-state.json`),
    JSON.stringify({ audioState, geometry }, null, 2),
  );
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, `${platform}-music-shell.png`),
    fullPage: false,
  });
  await expectCleanRuntime(runtime);
});

test('portrait, landscape and back navigation stay stable', async ({ page }, testInfo) => {
  const nativeWebKit = isWebKitProject(testInfo);
  const runtime = attachRuntimeDiagnostics(page);
  await page.goto(`${BASE_URL}/articles`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  if (nativeWebKit) {
    await page.mouse.wheel(0, 520);
    await page.waitForTimeout(100);
  } else {
    await scrollAndYield(page, 520);
  }
  const original = page.viewportSize();

  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(450);
  const landscape = await collectDiagnostics(page);
  expect(landscape.horizontalOverflow, 'landscape horizontal overflow').toBeLessThanOrEqual(2);
  if (landscape.dock) expect(landscape.dock.right).toBeLessThanOrEqual(landscape.viewport.width + 1);

  await page.goto(`${BASE_URL}/ratings`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/articles$/);
  await settle(page);

  if (original) await page.setViewportSize(original);
  await restoreChromeAtTop(page, { nativeWebKit });
  const portrait = await collectDiagnostics(page);
  expect(portrait.horizontalOverflow, 'restored portrait horizontal overflow').toBeLessThanOrEqual(2);

  const platform = platformName(testInfo);
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, `${platform}-orientation.json`),
    JSON.stringify({ landscape, portrait }, null, 2),
  );
  await expectCleanRuntime(runtime);
});

test('engine identity is honest for Android Chrome and iPhone Safari', async ({ page }, testInfo) => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await settle(page);
  const identity = await page.evaluate(() => ({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    coarsePointer: matchMedia('(pointer: coarse)').matches,
    touchEventSurface: 'ontouchstart' in window || typeof TouchEvent === 'function',
    webkitAppearance: CSS.supports('-webkit-appearance: none'),
  }));

  if (testInfo.project.name === 'iphone-safari') {
    expect(identity.userAgent).toContain('iPhone');
    expect(identity.userAgent).toContain('AppleWebKit');
    expect(identity.userAgent).toContain('Safari');
    expect(identity.webkitAppearance).toBe(true);
  } else {
    expect(identity.userAgent).toContain('Android');
    expect(identity.userAgent).toContain('Chrome');
    expect(identity.maxTouchPoints).toBeGreaterThan(0);
  }
  expect(identity.coarsePointer).toBe(true);
  expect(identity.maxTouchPoints > 0 || identity.touchEventSurface).toBe(true);
});