import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const COMMUNITY_ORIGIN = 'https://community.test.invalid';
const ARTICLE_ID = 'essay-yesenin-biography-part-two';
const ARTIFACT_DIR = path.resolve('qa-artifacts', 'premium-reader-certification');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

function attachDiagnostics(page) {
  const result = { pageErrors: [], consoleErrors: [], localFailures: [] };
  page.on('pageerror', (error) => result.pageErrors.push(String(error?.stack || error)));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/Failed to load resource/i.test(text)) return;
    result.consoleErrors.push(text);
  });
  page.on('requestfailed', (request) => {
    if (!request.url().startsWith(BASE_URL)) return;
    const failure = request.failure()?.errorText || 'unknown';
    if (!/ERR_ABORTED/i.test(failure)) result.localFailures.push(`${request.method()} ${request.url()}: ${failure}`);
  });
  return result;
}

async function waitForMain(page) {
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 20_000 });
}

function assertDiagnostics(result) {
  expect(result.pageErrors, 'uncaught page errors').toEqual([]);
  expect(result.consoleErrors, 'console errors').toEqual([]);
  expect(result.localFailures, 'failed same-origin requests').toEqual([]);
}

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'apikey, authorization, content-type, prefer, range',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'content-type': 'application/json',
  };
}

async function installFailingCommunityBackend(page) {
  await page.addInitScript(() => {
    globalThis.__TLP_COMMUNITY_TEST_CONFIG__ = {
      url: 'https://community.test.invalid',
      key: 'test-anon-key',
    };
  });

  const writes = [];
  await page.route(`${COMMUNITY_ORIGIN}/**`, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders() });
      return;
    }

    const url = new URL(request.url());
    if (request.method() !== 'GET') writes.push({ method: request.method(), pathname: url.pathname });

    if (url.pathname.endsWith('/tlp_feedback_summary_public')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders(),
        body: JSON.stringify([{
          target_type: 'article',
          target_id: ARTICLE_ID,
          rating_count: 7,
          comment_count: 0,
          overall: 4.6,
          dimensions: { clarity: 4.7, evidence: 4.5, depth: 4.6, ethics: 4.6 },
          distribution: { 4: 3, 5: 4 },
          deviation: 0.24,
        }]),
      });
      return;
    }

    if (url.pathname.endsWith('/tlp_comments_public')) {
      await route.fulfill({ status: 200, headers: corsHeaders(), body: '[]' });
      return;
    }

    if (url.pathname.includes('/rpc/')) {
      await route.fulfill({
        status: 503,
        headers: corsHeaders(),
        body: JSON.stringify({ message: 'reader certification offline write' }),
      });
      return;
    }

    await route.fulfill({ status: 404, headers: corsHeaders(), body: '[]' });
  });

  return writes;
}

test.describe('W5 premium reader certification', () => {
  test('longform reader journey remains readable and returns through real navigation', async ({ page }, testInfo) => {
    const diagnostics = attachDiagnostics(page);
    const response = await page.goto(`${BASE_URL}/essays/yesenin-duncan-first-meeting-documents`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    expect(response?.status()).toBeLessThan(400);
    await waitForMain(page);

    const article = page.locator('#main-content article').first();
    await expect(article).toBeVisible();
    const metrics = await article.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const paragraph = element.querySelector('p');
      const style = paragraph ? getComputedStyle(paragraph) : null;
      return {
        textLength: element.innerText.trim().length,
        paragraphCount: element.querySelectorAll('p').length,
        width: rect.width,
        viewportWidth: window.innerWidth,
        fontSize: style ? Number.parseFloat(style.fontSize) : 0,
        lineHeight: style ? Number.parseFloat(style.lineHeight) : 0,
        horizontalOverflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - document.documentElement.clientWidth,
      };
    });
    expect(metrics.textLength).toBeGreaterThan(2_500);
    expect(metrics.paragraphCount).toBeGreaterThan(6);
    expect(metrics.width).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    expect(metrics.fontSize).toBeGreaterThanOrEqual(14);
    expect(metrics.lineHeight).toBeGreaterThan(metrics.fontSize * 1.25);
    expect(metrics.horizontalOverflow).toBeLessThanOrEqual(2);

    const back = page.getByRole('link', { name: /Все статьи/i }).first();
    await back.focus();
    await expect(back).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/articles$/);
    await waitForMain(page);

    const nextEssay = page.locator('a[href^="/essays/"]').filter({ visible: true }).first();
    await expect(nextEssay).toBeVisible();
    await nextEssay.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/essays\//);
    await waitForMain(page);
    await expect(page.locator('#main-content article').first()).toBeVisible();

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, `${testInfo.project.name}-longform.json`),
      JSON.stringify(metrics, null, 2),
    );
    assertDiagnostics(diagnostics);
  });

  test('reduced-motion keyboard search keeps focus ownership and navigation continuity', async ({ page }) => {
    const diagnostics = attachDiagnostics(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await waitForMain(page);
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);

    const opener = page.getByRole('button', { name: /открыть поиск|поиск/i }).first();
    await opener.focus();
    await page.keyboard.press('Control+K');
    const dialog = page.getByRole('dialog', { name: 'Поиск по сайту' });
    const query = page.getByRole('combobox', { name: 'Поисковый запрос' });
    await expect(dialog).toBeVisible();
    await expect(query).toBeFocused();
    await query.fill('музыка');
    await expect(page.getByRole('listbox', { name: 'Результаты поиска' })).toContainText(/музык/i);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();

    await page.keyboard.press('Control+K');
    await query.fill('музыка');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/music$/);
    await expect(page.locator('#main-content')).toBeFocused();
    assertDiagnostics(diagnostics);
  });

  test('blocked browser storage leaves the shell honest and usable', async ({ page }) => {
    const diagnostics = attachDiagnostics(page);
    await page.addInitScript(() => {
      const blocked = () => { throw new DOMException('Storage blocked by reader policy', 'SecurityError'); };
      for (const key of ['localStorage', 'sessionStorage']) {
        try {
          Object.defineProperty(window, key, { configurable: true, get: blocked });
        } catch {
          // The browser may expose a non-configurable accessor; method-level blocking
          // still exercises the same application contract.
        }
      }
      for (const method of ['getItem', 'setItem', 'removeItem', 'clear']) {
        try { Object.defineProperty(Storage.prototype, method, { configurable: true, value: blocked }); } catch {}
      }
    });

    await page.goto(`${BASE_URL}/archive`, { waitUntil: 'domcontentloaded' });
    await waitForMain(page);
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByText(/что-то пошло не так|не удалось загрузить страницу|application error/i)).toHaveCount(0);

    await page.goto(`${BASE_URL}/essays/yesenin-duncan-first-meeting-documents`, { waitUntil: 'domcontentloaded' });
    await waitForMain(page);
    await expect(page.locator('#main-content article').first()).toBeVisible();
    const overflow = await page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    assertDiagnostics(diagnostics);
  });

  test('failed community write reports a durable queue instead of false success', async ({ page }) => {
    const diagnostics = attachDiagnostics(page);
    const writes = await installFailingCommunityBackend(page);
    await page.goto(`${BASE_URL}/essays/sergei-yesenin-1921-1925`, { waitUntil: 'domcontentloaded' });
    await waitForMain(page);
    await expect(page.getByText('7 оценок', { exact: false }).filter({ visible: true }).first()).toBeVisible({ timeout: 15_000 });

    const panel = page
      .getByText('Комментарии', { exact: true })
      .filter({ visible: true })
      .first()
      .locator('xpath=ancestor::section[1]');
    const commentText = `W5 отказ сети ${Date.now()}`;
    await panel.getByPlaceholder('Ваше имя или псевдоним — необязательно').fill('Reader QA');
    await panel.getByPlaceholder('Что особенно точно, спорно, сильно или слабо?').fill(commentText);
    await panel.getByRole('button', { name: 'Добавить комментарий' }).click();
    await expect(panel.getByText(commentText)).toBeVisible();
    await expect.poll(() => writes.filter((entry) => entry.pathname.includes('/rpc/')).length).toBeGreaterThan(0);
    await expect(panel.locator('p[aria-live="polite"]')).toContainText(/Сервер недоступен|В очереди|ничего не потеряно/i, { timeout: 15_000 });

    const persisted = await page.evaluate(() => {
      const raw = localStorage.getItem('tlp-community-feedback:v3');
      return raw ? JSON.parse(raw) : null;
    });
    expect(persisted?.outbox?.some((operation) => operation.kind === 'comment' && operation.entry?.text === commentText)).toBe(true);
    assertDiagnostics(diagnostics);
  });

  test('forced-colors keeps critical navigation and dialog controls available', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-core', 'forced-colors certification is Chromium-only');
    const diagnostics = attachDiagnostics(page);
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await waitForMain(page);
    expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);

    const opener = page.getByRole('button', { name: /открыть поиск/i }).first();
    await expect(opener).toBeVisible();
    await opener.focus();
    const computed = await opener.evaluate((element) => {
      const style = getComputedStyle(element);
      return { color: style.color, display: style.display, visibility: style.visibility };
    });
    expect(computed.display).not.toBe('none');
    expect(computed.visibility).not.toBe('hidden');
    expect(computed.color).not.toBe('rgba(0, 0, 0, 0)');

    await page.keyboard.press('Control+K');
    const dialog = page.getByRole('dialog', { name: 'Поиск по сайту' });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Поисковый запрос' })).toBeFocused();
    await expect(page.getByRole('button', { name: 'Закрыть поиск' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(opener).toBeFocused();
    assertDiagnostics(diagnostics);
  });
});
