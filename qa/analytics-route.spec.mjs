import { test, expect } from '@playwright/test';
import { choose, expectFragment } from './reader-navigation.mjs';
import { chapter, failOnce, payload, simonov, unavailable, withHeldRequest, yesenin } from './route-recovery.mjs';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

async function pageViews(page) {
  return page.evaluate(() => (window.dataLayer || [])
    .map((entry) => {
      try {
        return Array.from(entry);
      } catch {
        return [];
      }
    })
    .filter((entry) => entry[0] === 'event' && entry[1] === 'page_view')
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
    const commands = dataLayer.map((entry) => {
      let values = [];
      try {
        values = Array.from(entry);
      } catch {
        values = [];
      }
      return {
        values,
        isArguments: Object.prototype.toString.call(entry) === '[object Arguments]',
      };
    });
    const ymQueue = Array.isArray(window.ym?.a) ? window.ym.a : [];
    return {
      consent: localStorage.getItem('tlp:analytics-consent:v1'),
      googleDisabled: window['ga-disable-G-TLPQA00001'],
      yandexDisabled: window.disableYaCounter98765432,
      googleScripts: document.querySelectorAll('script[data-tlp-analytics-provider="google"]').length,
      yandexScripts: document.querySelectorAll('script[data-tlp-analytics-provider="yandex"]').length,
      googleConfigCount: commands.filter((entry) => entry.values[0] === 'config' && entry.values[1] === 'G-TLPQA00001').length,
      googleConfigUsesArguments: commands
        .filter((entry) => entry.values[0] === 'config' && entry.values[1] === 'G-TLPQA00001')
        .every((entry) => entry.isArguments),
      googlePageViewsUseArguments: commands
        .filter((entry) => entry.values[0] === 'event' && entry.values[1] === 'page_view')
        .every((entry) => entry.isArguments),
      googleConsentUpdates: commands
        .filter((entry) => entry.values[0] === 'consent' && entry.values[1] === 'update')
        .map((entry) => entry.values[2]?.analytics_storage),
      // The two named classes catch a regression with a readable name; this one
      // covers every command the app queues (js, consent, config, event) so an
      // inert array cannot slip in through a class nobody named.
      googleCommandCount: commands.filter((entry) => entry.values.length > 0).length,
      googleAllCommandsUseArguments: commands
        .filter((entry) => entry.values.length > 0)
        .every((entry) => entry.isArguments),
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
      expect(state.googleConfigUsesArguments).toBe(true);
      expect(state.googlePageViewsUseArguments).toBe(true);
      expect(state.googleCommandCount).toBeGreaterThan(0);
      expect(state.googleAllCommandsUseArguments).toBe(true);
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
      expect(state.googleConfigUsesArguments).toBe(true);
      expect(state.googlePageViewsUseArguments).toBe(true);
      expect(state.googleCommandCount).toBeGreaterThan(0);
      expect(state.googleAllCommandsUseArguments).toBe(true);
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
      expect(state.googleConfigUsesArguments).toBe(true);
      expect(state.googlePageViewsUseArguments).toBe(true);
      expect(state.googleCommandCount).toBeGreaterThan(0);
      expect(state.googleAllCommandsUseArguments).toBe(true);
      expect(state.googleConsentUpdates).toEqual(['denied', 'granted', 'denied', 'granted']);
      expect(state.yandexInitCount).toBe(2);
      expect(state.yandexDestructCount).toBe(1);
    }

    await peer.close();
  });
});

test.describe('analytics consent fixed-chrome geometry', () => {
  test('unset consent clears persistent audio controls and yields to immersive playback', async ({ page }) => {
    await page.route('https://www.googletagmanager.com/**', (route) => route.abort());
    await page.route('https://mc.yandex.ru/**', (route) => route.abort());

    await page.goto(`${BASE_URL}/music`, { waitUntil: 'domcontentloaded' });

    const banner = page.getByRole('complementary', { name: 'Настройки аналитики' });
    await expect(banner).toBeVisible();
    await expect(banner).toHaveClass(/analytics-consent-banner/);
    await expect(banner).toHaveClass(/theme-dark-island/);

    const play = page.getByRole('button', { name: /воспроизвести трек|поставить на паузу|повторить загрузку аудио/i }).first();
    await expect(play).toBeVisible();
    await play.click();

    const mini = page.locator('.global-audio-mini');
    await expect(mini).toBeVisible();

    await expect.poll(async () => page.evaluate(() => {
      const readRect = (selector) => {
        const element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) return null;
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
      };
      const overlaps = (a, b) => Boolean(
        a && b
        && a.left < b.right
        && a.right > b.left
        && a.top < b.bottom
        && a.bottom > b.top
      );
      const consent = readRect('.analytics-consent-banner');
      const player = readRect('.global-audio-mini');
      return {
        consent,
        player,
        overlap: overlaps(consent, player),
        consentInsideViewport: Boolean(
          consent
          && consent.left >= -1
          && consent.right <= window.innerWidth + 1
          && consent.top >= -1
          && consent.bottom <= window.innerHeight + 1
        ),
      };
    }), { timeout: 8_000 }).toMatchObject({
      overlap: false,
      consentInsideViewport: true,
    });

    const openImmersive = mini.getByRole('button', { name: 'Открыть режим погружения' });
    await expect(openImmersive).toBeVisible();
    await openImmersive.click();

    const immersive = page.locator('[role="dialog"][aria-labelledby="immersive-track-title"]');
    await expect(immersive).toBeVisible();
    await expect.poll(() => page.evaluate(() => {
      const consent = document.querySelector('.analytics-consent-banner');
      const dialog = document.querySelector('[role="dialog"][aria-labelledby="immersive-track-title"]');
      if (!(consent instanceof HTMLElement) || !(dialog instanceof HTMLElement)) return false;
      return Number.parseInt(getComputedStyle(dialog).zIndex || '0', 10)
        > Number.parseInt(getComputedStyle(consent).zIndex || '0', 10);
    })).toBe(true);

    await immersive.getByRole('button', { name: 'Выйти' }).click();
    await expect(immersive).toBeHidden({ timeout: 8_000 });
    await expect(banner).toBeVisible();
  });
});

for (const back of [false, true]) {
  test(`grant during a pending chapter waits for ${back ? 'the restored article' : 'a successful explicit retry'}`, async ({ page, context }) => {
    await context.route('https://www.googletagmanager.com/**', r => r.abort());
    await context.route('https://mc.yandex.ru/**', r => r.abort());
    await withHeldRequest(context, payload, failOnce(unavailable), async ({ release, attempts }) => {
      await page.goto(BASE_URL + yesenin, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main > [aria-live="polite"][aria-atomic="true"]')).toContainText('Сергей Есенин');
      await choose(page, chapter); await expect.poll(attempts).toBe(1);
      await expect(page).toHaveTitle(/Загрузка страницы/i);
      await page.getByRole('button', { name: 'Разрешить', exact: true }).click();
      await flushRouteEffects(page); expect(await pageViews(page)).toEqual([]);
      expect(await page.locator('script[data-tlp-analytics-provider]').count()).toBe(0);
      if (back) {
        await page.goBack(); await expect(page).toHaveTitle(/Сергей Есенин/i); release();
      } else {
        release(); await expect(page).toHaveTitle(/Ошибка загрузки страницы/i);
        expect(await pageViews(page)).toEqual([]);
        await page.getByRole('button', { name: 'Повторить попытку' }).click(); await expectFragment(page, 'fire');
      }
      const path = back ? yesenin : simonov;
      await expect.poll(async () => (await pageViews(page)).map(v => v.page_path)).toEqual([path]);
      expect((await pageViews(page))[0].page_title).toBe(await page.title());
      const hits = await page.evaluate(() => (window.ym?.a || []).filter(args => args[1] === 'hit').map(args => new URL(args[2]).pathname));
      expect(hits).toEqual([path]);
    });
  });
}

test('consenting on a shared source reports the page, never the quote or its address', async ({ page, context }) => {
  await context.route('https://www.googletagmanager.com/**', r => r.abort());
  await context.route('https://mc.yandex.ru/**', r => r.abort());
  const path = yesenin + '/', url = BASE_URL + path;
  const source = 'source-yes2-pss-declarations-vol7k1';
  await page.goto(url + '#' + source + ':~:text=' + encodeURIComponent('литературные декларации'), { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#' + source)).toBeFocused();
  expect(await pageViews(page)).toEqual([]); await expect(page.locator('script[data-tlp-analytics-provider]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Разрешить', exact: true }).click();
  await expect.poll(async () => (await pageViews(page)).length).toBe(1);
  const [view] = await pageViews(page);
  expect(view).toMatchObject({ page_path: path, page_location: url, page_title: await page.title() });
  expect(await page.evaluate(() => window.ym.a.filter(args => args[1] === 'hit').map(args => args[2]))).toEqual([url]);
});
