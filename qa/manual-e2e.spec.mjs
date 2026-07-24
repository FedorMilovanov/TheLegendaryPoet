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
  ['not-found', '/qa-route-that-does-not-exist'],
];

const profiles = [
  { name: 'desktop', viewport: { width: 1440, height: 1000 }, isMobile: false, hasTouch: false },
  { name: 'tablet', viewport: { width: 768, height: 1024 }, isMobile: false, hasTouch: true },
  { name: 'pixel7', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true },
];

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

async function waitForRoute(page) {
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForTimeout(850);
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

async function collectLayoutSnapshot(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const visibleImages = [...document.images].filter((image) => {
      const rect = image.getBoundingClientRect();
      const style = getComputedStyle(image);
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 2 && rect.height > 2;
    });
    const brokenImages = visibleImages
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src || image.alt || '<unknown>');
    const failedResilientImages = [...document.querySelectorAll('[data-image-state="failed"]')]
      .map((element) => element.getAttribute('src') || element.getAttribute('aria-label') || element.tagName);
    const main = document.querySelector('#main-content');
    const header = document.querySelector('.site-header');
    const mainRect = main?.getBoundingClientRect();
    const headerRect = header?.getBoundingClientRect();
    const horizontalOverflow = Math.max(document.body.scrollWidth, root.scrollWidth) - root.clientWidth;
    const visibleErrorBoundaries = [...document.querySelectorAll('body *')]
      .filter((element) => {
        const text = element.textContent?.trim() || '';
        if (!/что-то пошло не так|не удалось загрузить страницу|application error/i.test(text)) return false;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      })
      .slice(0, 5)
      .map((element) => element.textContent?.trim().slice(0, 240));

    return {
      title: document.title,
      pathname: location.pathname,
      viewport: { width: innerWidth, height: innerHeight },
      bodySize: { width: document.body.scrollWidth, height: document.body.scrollHeight },
      horizontalOverflow,
      brokenImages,
      failedResilientImages,
      visibleErrorBoundaries,
      main: mainRect ? { top: mainRect.top, width: mainRect.width, height: mainRect.height } : null,
      header: headerRect ? { top: headerRect.top, bottom: headerRect.bottom, height: headerRect.height } : null,
      activeElement: document.activeElement?.tagName || null,
      modalFlag: Boolean(window.__TLP_MODAL_OPEN),
    };
  });
}

for (const profile of profiles) {
  test.describe(`${profile.name} route audit`, () => {
    test.use({
      viewport: profile.viewport,
      isMobile: profile.isMobile,
      hasTouch: profile.hasTouch,
      locale: 'ru-RU',
      timezoneId: 'Europe/Paris',
      reducedMotion: 'no-preference',
      colorScheme: 'dark',
    });

    for (const [name, route] of routes) {
      test(`${name}: rendering, overflow, images and runtime`, async ({ page }) => {
        const runtime = attachRuntimeDiagnostics(page);
        const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        expect(response, 'navigation response exists').not.toBeNull();
        expect(response.status(), `HTTP status for ${route}`).toBeLessThan(400);
        await waitForRoute(page);
        await exerciseLazyContent(page);

        const snapshot = await collectLayoutSnapshot(page);
        const record = { profile: profile.name, route, runtime, snapshot };
        fs.writeFileSync(path.join(ARTIFACT_DIR, `${profile.name}-${name}.json`), JSON.stringify(record, null, 2));
        await page.screenshot({ path: path.join(ARTIFACT_DIR, `${profile.name}-${name}.png`), fullPage: true });

        expect(snapshot.main, 'main content exists').not.toBeNull();
        expect(snapshot.main.height, 'main content has meaningful height').toBeGreaterThan(120);
        expect(snapshot.horizontalOverflow, `page-level horizontal overflow on ${profile.name}`).toBeLessThanOrEqual(2);
        expect(snapshot.brokenImages, 'visible broken images').toEqual([]);
        expect(snapshot.failedResilientImages, 'failed resilient images').toEqual([]);
        expect(snapshot.visibleErrorBoundaries, 'visible error boundary').toEqual([]);
        expect(runtime.pageErrors, 'uncaught page errors').toEqual([]);
        expect(runtime.consoleErrors, 'console errors').toEqual([]);
        expect(runtime.localRequestFailures, 'failed same-origin requests').toEqual([]);
      });
    }
  });
}

test.describe('desktop interaction pass', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, locale: 'ru-RU', timezoneId: 'Europe/Paris', colorScheme: 'dark' });

  test('command palette traps focus, searches, navigates and restores scroll lock', async ({ page }) => {
    const runtime = attachRuntimeDiagnostics(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);
    const opener = page.getByRole('button', { name: /открыть поиск/i }).first();
    await opener.focus();
    await page.keyboard.press('Control+K');

    const dialog = page.getByRole('dialog', { name: 'Поиск по сайту' });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Поисковый запрос' })).toBeFocused();
    await expect.poll(() => page.evaluate(() => Boolean(window.__TLP_MODAL_OPEN))).toBe(true);

    await page.getByRole('combobox', { name: 'Поисковый запрос' }).fill('рейтинг');
    await expect(page.getByRole('listbox', { name: 'Результаты поиска' })).toContainText(/рейтинг/i);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop-command-palette.png'), fullPage: true });

    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect.poll(() => page.evaluate(() => Boolean(window.__TLP_MODAL_OPEN))).toBe(false);
    await expect(opener).toBeFocused();

    await page.keyboard.press('Control+K');
    await page.getByRole('combobox', { name: 'Поисковый запрос' }).fill('музыка');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/music$/);
    await expect(page.locator('#main-content')).toBeFocused();
    expect(runtime.pageErrors).toEqual([]);
  });

  test('ratings filters keep URL state and reset cleanly', async ({ page }) => {
    const runtime = attachRuntimeDiagnostics(page);
    await page.goto(`${BASE_URL}/ratings`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);

    const search = page.getByRole('searchbox', { name: 'Найти поэта в рейтинге' });
    await search.fill('Есенин');
    await expect(page).toHaveURL(/q=%D0%95%D1%81%D0%B5%D0%BD%D0%B8%D0%BD/);
    await expect(page.getByText(/Найдено:/)).toContainText('1');

    await page.getByRole('button', { name: 'Оценка редакции' }).click();
    await expect(page).toHaveURL(/sort=editorial/);
    await page.getByRole('checkbox', { name: 'Только с голосами' }).check();
    await expect(page).toHaveURL(/rated=1/);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop-ratings-filtered.png'), fullPage: true });

    await page.getByRole('button', { name: /сбросить/i }).click();
    await expect(search).toHaveValue('');
    await expect(page).toHaveURL(`${BASE_URL}/ratings`);
    expect(runtime.pageErrors).toEqual([]);
  });

  test('poet rating keyboard flow, durable comment and helpful state', async ({ page }) => {
    const runtime = attachRuntimeDiagnostics(page);
    await page.goto(`${BASE_URL}/poets`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);

    const poetLink = page.locator('a[href^="/poets/"]').filter({ hasNot: page.locator('[href="/poets"]') }).first();
    const href = await poetLink.getAttribute('href');
    expect(href).toMatch(/^\/poets\//);
    await page.goto(`${BASE_URL}${href}`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);

    const groups = page.getByRole('radiogroup');
    const count = await groups.count();
    expect(count).toBeGreaterThanOrEqual(4);
    for (let index = 0; index < 4; index += 1) {
      const group = groups.nth(index);
      await group.getByRole('radio').first().focus();
      await page.keyboard.press('End');
      await expect(group.getByRole('radio').last()).toBeChecked();
    }
    await page.getByRole('button', { name: /зафиксировать оценку|обновить оценку/i }).click();
    await expect(page.getByText(/голос|оценк/i).filter({ visible: true }).first()).toBeVisible();

    const author = page.getByPlaceholder('Ваше имя или псевдоним — необязательно').first();
    const comment = page.getByPlaceholder('Что особенно точно, спорно, сильно или слабо?').first();
    await author.fill('Ручной QA');
    await comment.fill('Проверка сохранения комментария и клавиатурной отправки.');
    await comment.press('Control+Enter');
    await expect(comment).toHaveValue('');
    await expect(page.getByText('Проверка сохранения комментария и клавиатурной отправки.')).toBeVisible();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForRoute(page);
    await expect(page.getByText('Проверка сохранения комментария и клавиатурной отправки.')).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop-community-persisted.png'), fullPage: true });
    expect(runtime.pageErrors).toEqual([]);
  });

  test('music player loads a real master and preserves shell navigation', async ({ page }) => {
    const runtime = attachRuntimeDiagnostics(page);
    await page.goto(`${BASE_URL}/music`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);
    const play = page.getByRole('button', { name: /воспроизвести трек|поставить на паузу|повторить загрузку аудио/i }).first();
    await expect(play).toBeEnabled();
    await play.click();
    await page.waitForTimeout(1800);
    await expect(page.locator('audio')).toHaveCount(1);
    const audioState = await page.locator('audio').evaluate((audio) => ({ readyState: audio.readyState, networkState: audio.networkState, currentSrc: audio.currentSrc, error: audio.error?.message || null }));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'desktop-audio-state.json'), JSON.stringify(audioState, null, 2));
    expect(audioState.currentSrc).toContain('/audio/');
    expect(audioState.error).toBeNull();

    await page.getByRole('link', { name: 'Рейтинг' }).click();
    await expect(page).toHaveURL(/\/ratings$/);
    await expect(page.locator('audio')).toHaveCount(1);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop-mini-player-after-navigation.png'), fullPage: true });
    expect(runtime.pageErrors).toEqual([]);
  });
});

test.describe('mobile touch and keyboard pass', () => {
  test.use({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, locale: 'ru-RU', timezoneId: 'Europe/Paris', colorScheme: 'dark' });

  test('mobile dock navigation, search surface and safe-area layout', async ({ page }) => {
    const runtime = attachRuntimeDiagnostics(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);

    const dock = page.locator('.mobile-dock');
    await expect(dock).toBeVisible();
    await dock.getByRole('link', { name: /рейтинг/i }).click();
    await expect(page).toHaveURL(/\/ratings$/);
    await expect(page.locator('#main-content')).toBeFocused();

    await page.getByRole('button', { name: /поиск/i }).last().click();
    const dialog = page.getByRole('dialog', { name: 'Поиск по сайту' });
    await expect(dialog).toBeVisible();
    await page.getByRole('combobox', { name: 'Поисковый запрос' }).fill('Есенин');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile-search-keyboard.png'), fullPage: true });
    await page.getByRole('button', { name: 'Закрыть поиск' }).click();
    await expect(dialog).toBeHidden();

    const geometry = await page.evaluate(() => {
      const dockElement = document.querySelector('.mobile-dock');
      const rect = dockElement?.getBoundingClientRect();
      return rect ? { left: rect.left, right: rect.right, bottom: innerHeight - rect.bottom, width: rect.width, viewport: innerWidth } : null;
    });
    expect(geometry).not.toBeNull();
    expect(geometry.left).toBeGreaterThanOrEqual(-1);
    expect(geometry.right).toBeLessThanOrEqual(geometry.viewport + 1);
    expect(runtime.pageErrors).toEqual([]);
  });

  test('slow network route transition leaves no permanent skeleton or blocked input', async ({ page, context }) => {
    const runtime = attachRuntimeDiagnostics(page);
    await context.route('**/assets/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 180));
      await route.continue();
    });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);
    await page.goto(`${BASE_URL}/articles`, { waitUntil: 'domcontentloaded' });
    await page.locator('#main-content').waitFor({ state: 'visible' });
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByRole('heading').first()).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile-slow-network-articles.png'), fullPage: true });
    expect(runtime.pageErrors).toEqual([]);
  });
});

test.describe('reduced motion and forced-colors resilience', () => {
  test.use({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', colorScheme: 'dark' });

  test('reduced motion keeps content immediately readable and overlays operable', async ({ page }) => {
    const runtime = attachRuntimeDiagnostics(page);
    await page.goto(`${BASE_URL}/ratings`, { waitUntil: 'domcontentloaded' });
    await page.locator('#main-content').waitFor({ state: 'visible' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.keyboard.press('Control+K');
    await expect(page.getByRole('dialog', { name: 'Поиск по сайту' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Поиск по сайту' })).toBeHidden();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reduced-motion-ratings.png'), fullPage: true });
    expect(runtime.pageErrors).toEqual([]);
  });
});
