import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
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
    result.localRequestFailures.push(`${request.method()} ${url}: ${failure}`);
  });

  return result;
}

async function settle(page) {
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForTimeout(700);
}

async function exerciseLazyContent(page) {
  await page.evaluate(async () => {
    const max = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const step = Math.max(420, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(250);
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
      dock: dockRect && dockStyle
        ? {
            left: dockRect.left,
            right: dockRect.right,
            top: dockRect.top,
            bottom: dockRect.bottom,
            width: dockRect.width,
            height: dockRect.height,
            computedBottom: dockStyle.bottom,
            paddingBottom: dockStyle.paddingBottom,
          }
        : null,
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
    const runtime = attachRuntimeDiagnostics(page);
    const response = await page.goto(`${BASE_URL}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    expect(response, 'navigation response exists').not.toBeNull();
    expect(response.status(), `HTTP status for ${route}`).toBeLessThan(400);
    await settle(page);
    await exerciseLazyContent(page);

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
    expect(diagnostics.maxTouchPoints, 'touch capability').toBeGreaterThan(0);
    expect(diagnostics.coarsePointer, 'coarse pointer media query').toBe(true);
    expect(diagnostics.supportsDynamicViewport, 'dynamic viewport units').toBe(true);
    expect(diagnostics.supportsSafeArea, 'safe-area environment variables').toBe(true);
    if (diagnostics.dock) {
      expect(diagnostics.dock.left).toBeGreaterThanOrEqual(-1);
      expect(diagnostics.dock.right).toBeLessThanOrEqual(diagnostics.viewport.width + 1);
      expect(diagnostics.dock.bottom).toBeLessThanOrEqual(diagnostics.viewport.height + 1);
    }
    await expectCleanRuntime(runtime);
  });
}

test('mobile dock, search sheet and tap targets remain usable', async ({ page }, testInfo) => {
  const runtime = attachRuntimeDiagnostics(page);
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await settle(page);

  const dock = page.locator('.mobile-dock');
  await expect(dock).toBeVisible();
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
  const searchButtonCount = await searchButtons.count();
  expect(searchButtonCount).toBeGreaterThan(0);
  await searchButtons.last().click();
  const dialog = page.getByRole('dialog', { name: 'Поиск по сайту' });
  const input = page.getByRole('combobox', { name: 'Поисковый запрос' });
  await expect(dialog).toBeVisible();
  await expect(input).toBeFocused();
  await input.fill('Есенин');
  await expect(page.getByRole('listbox', { name: 'Результаты поиска' })).toBeVisible();

  const focusedState = await page.evaluate(() => ({
    activeTag: document.activeElement?.tagName,
    activeRole: document.activeElement?.getAttribute('role'),
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

  await page.getByRole('button', { name: 'Закрыть поиск' }).click();
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
  const poetLinkCount = await poetLinks.count();
  expect(poetLinkCount).toBeGreaterThan(0);
  const href = await poetLinks.first().getAttribute('href');
  expect(href).toMatch(/^\/poets\//);
  await page.goto(`${BASE_URL}${href}`, { waitUntil: 'domcontentloaded' });
  await settle(page);

  const groups = page.getByRole('radiogroup');
  const groupCount = await groups.count();
  expect(groupCount).toBeGreaterThanOrEqual(4);
  for (let index = 0; index < 4; index += 1) {
    const radios = groups.nth(index).getByRole('radio');
    const radioCount = await radios.count();
    expect(radioCount).toBe(5);
    await radios.nth(4).click();
    await expect(radios.nth(4)).toBeChecked();
  }
  await page.getByRole('button', { name: /зафиксировать оценку|обновить оценку/i }).click();

  const text = `Мобильная проверка ${platformName(testInfo)}: оценка и комментарий сохраняются.`;
  const author = page.getByPlaceholder('Ваше имя или псевдоним — необязательно');
  const composer = page.getByPlaceholder('Что особенно точно, спорно, сильно или слабо?');
  await author.fill('Mobile QA');
  await composer.fill(text);
  await composer.press(testInfo.project.name === 'iphone-safari' ? 'Meta+Enter' : 'Control+Enter');
  await expect(composer).toHaveValue('');
  await expect(page.getByText(text)).toBeVisible();

  await page.reload({ waitUntil: 'domcontentloaded' });
  await settle(page);
  await expect(page.getByText(text)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Обновить оценку' })).toBeVisible();
  await expectCleanRuntime(runtime);
});

test('music shell, immersive dialog and mobile dock do not collide', async ({ page }, testInfo) => {
  const runtime = attachRuntimeDiagnostics(page);
  await page.goto(`${BASE_URL}/music`, { waitUntil: 'domcontentloaded' });
  await settle(page);

  const playButtons = page.getByRole('button', { name: /воспроизвести трек|поставить на паузу|повторить загрузку аудио/i });
  const playCount = await playButtons.count();
  expect(playCount).toBeGreaterThan(0);
  await playButtons.first().click();
  await page.waitForTimeout(1200);
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
  const immersiveCount = await immersiveButtons.count();
  expect(immersiveCount).toBeGreaterThan(0);
  await immersiveButtons.first().click();
  const immersive = page.locator('[role="dialog"][aria-labelledby="immersive-track-title"]');
  await expect(immersive).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(window.__TLP_MODAL_OPEN))).toBe(true);
  await immersive.getByRole('button', { name: 'Выйти' }).click();
  await expect(immersive).toBeHidden({ timeout: 2_000 });
  await expect.poll(() => page.evaluate(() => Boolean(window.__TLP_MODAL_OPEN))).toBe(false);

  await page.getByRole('link', { name: 'Рейтинг' }).click();
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
  const runtime = attachRuntimeDiagnostics(page);
  await page.goto(`${BASE_URL}/articles`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  await page.evaluate(() => window.scrollTo(0, 520));
  const original = page.viewportSize();

  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(450);
  const landscape = await collectDiagnostics(page);
  expect(landscape.horizontalOverflow, 'landscape horizontal overflow').toBeLessThanOrEqual(2);
  expect(landscape.dock?.right).toBeLessThanOrEqual(landscape.viewport.width + 1);

  await page.goto(`${BASE_URL}/ratings`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/articles$/);
  await settle(page);

  if (original) await page.setViewportSize(original);
  await page.waitForTimeout(350);
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
  }
  expect(identity.maxTouchPoints).toBeGreaterThan(0);
});
