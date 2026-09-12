import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

async function pageViews(page) {
  return page.evaluate(() => (window.dataLayer || [])
    .filter((entry) => Array.isArray(entry) && entry[0] === 'event' && entry[1] === 'page_view')
    .map((entry) => entry[2]));
}

async function flushRouteEffects(page) {
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
}

test.describe('semantic analytics route authority', () => {
  test('query-only state does not emit page_view and pathname navigation emits settled metadata once', async ({ page }) => {
    await page.route('https://www.googletagmanager.com/**', (route) => route.abort());
    await page.addInitScript(() => {
      window.localStorage.setItem('tlp:analytics-consent:v1', 'granted');
    });

    await page.goto(`${BASE_URL}/ratings`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('searchbox', { name: 'Найти поэта в рейтинге' })).toBeVisible();
    await expect.poll(async () => (await pageViews(page)).length).toBe(1);

    const initial = await pageViews(page);
    expect(initial[0].page_path).toBe('/ratings');
    expect(new URL(initial[0].page_location).pathname).toBe('/ratings');
    expect(new URL(initial[0].page_location).search).toBe('');
    expect(initial[0].page_title).toBe(await page.title());

    const search = page.getByRole('searchbox', { name: 'Найти поэта в рейтинге' });
    await search.fill('Есенин');
    await expect(page).toHaveURL(/\/ratings\?q=/);
    await flushRouteEffects(page);
    expect(await pageViews(page)).toHaveLength(1);

    await page.getByRole('button', { name: 'Оценка редакции' }).click();
    await expect(page).toHaveURL(/sort=editorial/);
    await flushRouteEffects(page);
    expect(await pageViews(page)).toHaveLength(1);

    await page.evaluate(() => {
      window.history.pushState({}, '', '/about?from=analytics-qa');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page).toHaveURL(`${BASE_URL}/about?from=analytics-qa`);
    await expect.poll(async () => (await pageViews(page)).length).toBe(2);

    const views = await pageViews(page);
    const about = views[1];
    expect(about.page_path).toBe('/about');
    expect(new URL(about.page_location).pathname).toBe('/about');
    expect(new URL(about.page_location).search).toBe('');
    expect(about.page_title).toBe(await page.title());
  });
});


async function providerState(page) {
  return page.evaluate(() => {
    const dataLayer = Array.isArray(window.dataLayer) ? window.dataLayer : [];
    const ymQueue = Array.isArray(window.ym?.a) ? window.ym.a : [];
    return {
      consent: localStorage.getItem('tlp:analytics-consent:v1'),
      googleDisabled: window['ga-disable-G-TLPQA00001'],
      yandexDisabled: window.disableYaCounter98765432,
      googleScripts: document.querySelectorAll('script[data-tlp-analytics-provider="google"]').length,
      yandexScripts: document.querySelectorAll('script[data-tlp-analytics-provider="yandex"]').length,
      googleConfigCount: dataLayer.filter((entry) => Array.isArray(entry) && entry[0] === 'config' && entry[1] === 'G-TLPQA00001').length,
      googleConsentUpdates: dataLayer
        .filter((entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'update')
        .map((entry) => entry[2]?.analytics_storage),
      yandexInitCount: ymQueue.filter((entry) => entry?.[0] === 98765432 && entry?.[1] === 'init').length,
      yandexDestructCount: ymQueue.filter((entry) => entry?.[0] === 98765432 && entry?.[1] === 'destruct').length,
    };
  });
}

async function consentStatus(page, expected) {
  await expect(page.locator('[data-analytics-consent-status]')).toContainText(expected);
}

test.describe('analytics consent lifecycle authority', () => {
  test('grant, cross-tab deny and re-grant converge without duplicate provider boot or page views', async ({ page, context }) => {
    await context.route('https://www.googletagmanager.com/**', (route) => route.abort());
    await context.route('https://mc.yandex.ru/**', (route) => route.abort());

    const peer = await context.newPage();
    await page.goto(`${BASE_URL}/privacy`, { waitUntil: 'domcontentloaded' });
    await peer.goto(`${BASE_URL}/privacy`, { waitUntil: 'domcontentloaded' });

    await consentStatus(page, 'Не выбрано');
    await consentStatus(peer, 'Не выбрано');
    expect((await providerState(page)).googleScripts).toBe(0);
    expect((await providerState(page)).yandexScripts).toBe(0);

    await page.locator('[data-analytics-consent-action="granted"]').click();
    await consentStatus(page, 'Разрешена');
    await consentStatus(peer, 'Разрешена');
    await expect.poll(async () => (await pageViews(page)).length).toBe(1);
    await expect.poll(async () => (await pageViews(peer)).length).toBe(1);

    const grantedPage = await providerState(page);
    const grantedPeer = await providerState(peer);
    for (const state of [grantedPage, grantedPeer]) {
      expect(state.consent).toBe('granted');
      expect(state.googleDisabled).toBe(false);
      expect(state.yandexDisabled).toBe(false);
      expect(state.googleScripts).toBe(1);
      expect(state.yandexScripts).toBe(1);
      expect(state.googleConfigCount).toBe(1);
      expect(state.googleConsentUpdates.at(-1)).toBe('granted');
      expect(state.yandexInitCount).toBe(1);
      expect(state.yandexDestructCount).toBe(0);
    }

    const pageViewsBeforeDeny = (await pageViews(page)).length;
    const peerViewsBeforeDeny = (await pageViews(peer)).length;

    await peer.locator('[data-analytics-consent-action="denied"]').click();
    await consentStatus(peer, 'Отключена');
    await consentStatus(page, 'Отключена');

    const deniedPage = await providerState(page);
    const deniedPeer = await providerState(peer);
    for (const state of [deniedPage, deniedPeer]) {
      expect(state.consent).toBe('denied');
      expect(state.googleDisabled).toBe(true);
      expect(state.yandexDisabled).toBe(true);
      expect(state.googleScripts).toBe(1);
      expect(state.yandexScripts).toBe(1);
      expect(state.googleConfigCount).toBe(1);
      expect(state.googleConsentUpdates.at(-1)).toBe('denied');
      expect(state.yandexDestructCount).toBe(1);
    }

    await page.evaluate(() => {
      window.history.pushState({}, '', '/about?consent=denied');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page).toHaveURL(`${BASE_URL}/about?consent=denied`);
    await flushRouteEffects(page);
    expect(await pageViews(page)).toHaveLength(pageViewsBeforeDeny);
    expect(await pageViews(peer)).toHaveLength(peerViewsBeforeDeny);

    await page.evaluate(() => {
      window.history.pushState({}, '', '/privacy');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page).toHaveURL(`${BASE_URL}/privacy`);
    await consentStatus(page, 'Отключена');
    const pageBeforeRegrant = (await pageViews(page)).length;
    const peerBeforeRegrant = (await pageViews(peer)).length;

    await page.locator('[data-analytics-consent-action="granted"]').click();
    await consentStatus(page, 'Разрешена');
    await consentStatus(peer, 'Разрешена');
    await expect.poll(async () => (await pageViews(page)).length).toBe(pageBeforeRegrant + 1);
    await expect.poll(async () => (await pageViews(peer)).length).toBe(peerBeforeRegrant + 1);

    const regrantedPage = await providerState(page);
    const regrantedPeer = await providerState(peer);
    for (const state of [regrantedPage, regrantedPeer]) {
      expect(state.googleDisabled).toBe(false);
      expect(state.yandexDisabled).toBe(false);
      expect(state.googleScripts).toBe(1);
      expect(state.yandexScripts).toBe(1);
      expect(state.googleConfigCount).toBe(1);
      expect(state.googleConsentUpdates).toEqual(['denied', 'granted', 'denied', 'granted']);
      expect(state.yandexInitCount).toBe(2);
      expect(state.yandexDestructCount).toBe(1);
    }

    await peer.close();
  });
});
