import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const ARTIFACT_DIR = path.resolve('qa-artifacts');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function waitForRoute(page) {
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForTimeout(850);
}

async function exercisePage(page) {
  await page.evaluate(async () => {
    const max = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const step = Math.max(420, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 55));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
}

async function readOverlayDebug(page) {
  return page.evaluate(() => window.__TLP_OVERLAY_DEBUG ?? null);
}

test.describe('focused community interactions', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, locale: 'ru-RU', timezoneId: 'Europe/Paris', colorScheme: 'dark' });

  test('poet rating, comment and helpful state remain target-scoped and durable', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));

    await page.goto(`${BASE_URL}/poets`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);
    const href = await page.locator('a[href^="/poets/"]').first().getAttribute('href');
    expect(href).toMatch(/^\/poets\//);

    await page.goto(`${BASE_URL}${href}`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);

    const poetPanel = page.locator('section').filter({ has: page.getByRole('heading', { name: /^Оценка:/ }) }).first();
    await expect(poetPanel).toBeVisible();

    const groups = poetPanel.getByRole('radiogroup');
    await expect(groups).toHaveCount(4);
    for (let index = 0; index < 4; index += 1) {
      const group = groups.nth(index);
      await group.getByRole('radio').first().focus();
      await page.keyboard.press('End');
      await expect(group.getByRole('radio').last()).toBeChecked();
    }

    await poetPanel.getByRole('button', { name: 'Зафиксировать оценку' }).click();
    await expect(poetPanel.getByRole('button', { name: 'Обновить оценку' })).toBeVisible();

    const text = 'Проверка сохранения комментария, полезности и клавиатурной отправки.';
    await poetPanel.getByPlaceholder('Ваше имя или псевдоним — необязательно').fill('Ручной QA');
    const composer = poetPanel.getByPlaceholder('Что особенно точно, спорно, сильно или слабо?');
    await composer.fill(text);
    await composer.press('Control+Enter');
    await expect(composer).toHaveValue('');

    let card = poetPanel.locator('article').filter({ hasText: text });
    await expect(card).toBeVisible();
    const helpful = card.getByRole('button', { name: /Отметить комментарий полезным/ });
    await helpful.click();
    await expect(card.getByRole('button', { name: /Вы отметили комментарий полезным/ })).toHaveAttribute('aria-pressed', 'true');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForRoute(page);
    const restoredPanel = page.locator('section').filter({ has: page.getByRole('heading', { name: /^Оценка:/ }) }).first();
    await expect(restoredPanel.getByRole('button', { name: 'Обновить оценку' })).toBeVisible();
    card = restoredPanel.locator('article').filter({ hasText: text });
    await expect(card).toBeVisible();
    await expect(card.getByRole('button', { name: /Вы отметили комментарий полезным/ })).toHaveAttribute('aria-pressed', 'true');

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop-community-persisted.png'), fullPage: true });
    expect(pageErrors).toEqual([]);
  });
});

test.describe('nested overlay ownership', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, locale: 'ru-RU', timezoneId: 'Europe/Paris', colorScheme: 'dark' });

  test('search stays above immersive mode and background media keys remain isolated', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));
    const overlayTimeline = [];

    await page.goto(`${BASE_URL}/music`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);
    await page.evaluate(() => window.scrollTo(0, 420));
    await page.waitForTimeout(250);
    const scrollBefore = await page.evaluate(() => window.scrollY);

    const primaryPlay = page.getByRole('button', { name: /Воспроизвести трек|Поставить на паузу/ }).first();
    await primaryPlay.click();
    await page.waitForTimeout(900);
    await primaryPlay.click();
    const audio = page.locator('audio');
    await expect(audio).toHaveCount(1);
    await expect.poll(() => audio.evaluate((element) => element.paused)).toBe(true);

    const immersiveOpener = page.getByRole('button', { name: 'Погружение' }).first();
    await immersiveOpener.click();
    const immersive = page.locator('[role="dialog"][aria-labelledby="immersive-track-title"]');
    const immersiveClose = immersive.getByRole('button', { name: 'Выйти' });
    await expect(immersive).toBeVisible();
    await expect(immersiveClose).toBeFocused();
    await expect.poll(() => page.evaluate(() => Boolean(window.__TLP_MODAL_OPEN))).toBe(true);
    overlayTimeline.push({ step: 'immersive-open', state: await readOverlayDebug(page) });

    const mediaBefore = await audio.evaluate((element) => ({ paused: element.paused, muted: element.muted, currentTime: element.currentTime }));
    await page.keyboard.press('Control+K');
    const search = page.getByRole('dialog', { name: 'Поиск по сайту' });
    const input = page.getByRole('combobox', { name: 'Поисковый запрос' });
    await expect(search).toBeVisible();
    await expect(input).toBeFocused();
    overlayTimeline.push({ step: 'search-open', state: await readOverlayDebug(page) });
    await input.fill('музыка');
    await page.keyboard.press('Space');
    await page.keyboard.press('KeyM');
    await page.keyboard.press('ArrowRight');
    const mediaDuringSearch = await audio.evaluate((element) => ({ paused: element.paused, muted: element.muted, currentTime: element.currentTime }));
    expect(mediaDuringSearch.paused).toBe(mediaBefore.paused);
    expect(mediaDuringSearch.muted).toBe(mediaBefore.muted);
    expect(Math.abs(mediaDuringSearch.currentTime - mediaBefore.currentTime)).toBeLessThan(1.2);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop-nested-search-over-immersive.png'), fullPage: true });
    await page.keyboard.press('Escape');
    await expect(search).toBeHidden();
    await expect(immersive).toBeVisible();
    await expect.poll(() => page.evaluate(() => Boolean(window.__TLP_MODAL_OPEN))).toBe(true);
    await expect(immersiveClose).toBeFocused();
    const afterSearchClose = await readOverlayDebug(page);
    overlayTimeline.push({ step: 'search-closed', state: afterSearchClose });
    expect(afterSearchClose).toMatchObject({ depth: 1, topLabel: 'immersive-player', lastEscapeLabel: 'command-palette' });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(120);
    const afterImmersiveEscape = await readOverlayDebug(page);
    overlayTimeline.push({ step: 'immersive-escape', state: afterImmersiveEscape });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'desktop-overlay-timeline.json'), JSON.stringify(overlayTimeline, null, 2));
    expect(afterImmersiveEscape?.escapeCount).toBeGreaterThanOrEqual(2);
    expect(afterImmersiveEscape?.lastEscapeLabel).toBe('immersive-player');
    await expect(immersive).toBeHidden();
    await expect.poll(() => page.evaluate(() => Boolean(window.__TLP_MODAL_OPEN))).toBe(false);
    await expect(immersiveOpener).toBeFocused();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(scrollBefore, 0);
    expect(pageErrors).toEqual([]);
  });
});

test.describe('settled slow-network visual', () => {
  test.use({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, locale: 'ru-RU', timezoneId: 'Europe/Paris', colorScheme: 'dark' });

  test('articles settle after delayed chunks and lazy content is paint-ready', async ({ page, context }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));
    await context.route('**/assets/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 180));
      await route.continue();
    });

    await page.goto(`${BASE_URL}/articles`, { waitUntil: 'domcontentloaded' });
    await waitForRoute(page);
    await exercisePage(page);
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const diagnostics = await page.evaluate(() => ({
      overflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - document.documentElement.clientWidth,
      failedImages: [...document.querySelectorAll('[data-image-state="failed"]')].length,
      brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).length,
    }));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'mobile-slow-network-settled.json'), JSON.stringify(diagnostics, null, 2));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile-slow-network-articles-settled.png'), fullPage: true });

    expect(diagnostics.overflow).toBeLessThanOrEqual(2);
    expect(diagnostics.failedImages).toBe(0);
    expect(diagnostics.brokenImages).toBe(0);
    expect(pageErrors).toEqual([]);
  });
});
