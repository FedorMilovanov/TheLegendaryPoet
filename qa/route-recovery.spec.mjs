import { expect, test } from '@playwright/test';
import { registerMediaContract } from './media-contract.mjs';
import { base, choose, expectFragment, music, open, paints, search, withoutNavigationApi, withoutViewTransitions } from './reader-navigation.mjs';
import { expectReadingAt, readAt } from './reading-position.mjs';
import { chapter, failOnce, payload, simonov, unavailable, withHeldRequest, yesenin } from './route-recovery.mjs';

registerMediaContract(test);
const errors = new WeakMap();
test.beforeEach(async ({ page }) => {
  errors.set(page, []); page.on('pageerror', e => errors.get(page).push(e.message));
  await page.addInitScript(() => localStorage.setItem('tlp:analytics-consent:v1', 'denied'));
});
test.afterEach(({ page }) => expect(errors.get(page)).toEqual([]));
test.use({ contextOptions: { reducedMotion: 'reduce' } });

const clock = page => page.evaluate(() => performance.timeOrigin);
const length = page => page.evaluate(() => history.length);
const retry = page => page.getByRole('button', { name: 'Повторить попытку' });
const refresh = page => page.getByRole('button', { name: 'Обновить страницу' });
const errorTitle = /Ошибка загрузки страницы/i, pendingTitle = /Загрузка страницы/i;
const chunk = '**/assets/MusicPage-*.js';
const marker = 'tlp-route-chunk-recovery:music';
const paragraph = page => page.locator('.essay-body > :has(h2[id^="sec-америка-"]) + *');
const head = page => page.evaluate(() => ({
  title: document.title,
  canonical: document.querySelector('link[rel="canonical"]')?.href,
  og: document.querySelector('meta[property="og:url"]')?.content,
  robots: document.querySelector('meta[name="robots"]')?.content,
  googlebot: document.querySelector('meta[name="googlebot"]')?.content,
  schema: document.getElementById('route-jsonld')?.textContent,
  published: document.querySelector('meta[property="article:published_time"]')?.content,
}));
async function expectNeutral(page, title) {
  await expect(page).toHaveTitle(title);
  const h = await head(page);
  expect(h.robots).toBe('noindex,follow'); expect(h.googlebot).toBe(h.robots);
  for (const field of ['canonical', 'og', 'schema', 'published']) expect(h[field], field).toBeUndefined();
}
async function expectReady(page, path) {
  const canonical = `https://thelegendarypoet.ru${path}/`;
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
  const h = await head(page);
  expect(h.robots).toMatch(/^index,follow/); expect(h.og).toBe(canonical); expect(h.schema).toBeTruthy();
  return h;
}
async function startReading(page, width) {
  await open(page, yesenin, width); await readAt(paragraph(page), 0.46);
  return expectReady(page, yesenin);
}
async function backToParagraph(page, original) {
  await page.goBack(); await expect(page).toHaveURL(base + yesenin);
  await expectReadingAt(paragraph(page), 0.46); expect(await expectReady(page, yesenin)).toEqual(original);
}
async function pendingChapter(page, attempts) {
  await choose(page, chapter); await expect(page).toHaveURL(base + simonov + '#fire');
  await expect.poll(attempts).toBe(1); await expectNeutral(page, pendingTitle);
}
async function recoveryVisible(page, button) {
  const h1 = page.locator('main [role="alert"] h1');
  await expect(h1).toBeFocused(); await expect(h1).toBeInViewport({ ratio: 0.99 });
  await expect(button).toBeInViewport({ ratio: 0.99 }); await expectNeutral(page, errorTitle);
}
function documents(page) {
  const paths = [];
  page.on('request', r => { if (r.resourceType() === 'document') paths.push(new URL(r.url()).pathname); });
  return paths;
}

for (const same of [true, false]) {
  test(`a failed chapter can be reselected ${same ? 'at the same URL (replace)' : 'via another chapter (push)'} without losing the original passage`, async ({ page, context, hasTouch }) => {
    if (same) await withoutViewTransitions(page); else await withoutNavigationApi(page);
    const docs = documents(page);
    await withHeldRequest(context, payload, failOnce(unavailable), async ({ release, attempts }) => {
      const original = await startReading(page, hasTouch ? 390 : 1200), doc = await clock(page);
      await pendingChapter(page, attempts); const entries = await length(page); release();
      await recoveryVisible(page, retry(page));
      // Forward to the same failed visit must not issue an automatic retry.
      await backToParagraph(page, original); await page.goForward(); await recoveryVisible(page, retry(page));
      expect(attempts()).toBe(1);
      await choose(page, same ? chapter : 'Около Трёх Километров');
      await expectFragment(page, same ? 'fire' : 'route'); await expectReady(page, simonov);
      expect(await length(page)).toBe(entries + (same ? 0 : 1)); expect(attempts()).toBe(2);
      if (!same) {
        // This entry used to show a short error. Its Y is not a bookmark in the recovered article.
        await page.goBack(); await expectFragment(page, 'fire');
      }
      await backToParagraph(page, original); expect(await clock(page)).toBe(doc); expect(docs).toEqual([yesenin]);
    });
  });
}

test('a late primary failure cannot take the newer dialog; Escape exposes a keyboard retry and keeps playback', async ({ page, context, hasTouch }) => {
  const docs = documents(page);
  await withHeldRequest(context, payload, failOnce({ status: 200, contentType: 'application/json', body: '{' }), async ({ release, attempts }) => {
    await open(page, '/music', hasTouch ? 390 : 1200);
    await page.getByRole('button', { name: /Воспроизвести трек/i }).first().click();
    const audio = page.locator('audio');
    await expect.poll(() => audio.evaluate(a => !a.paused && a.currentTime > 0)).toBe(true);
    const [src, time] = await audio.evaluate(a => [a.currentSrc, a.currentTime]);
    await pendingChapter(page, attempts); const entries = await length(page);
    await page.keyboard.press('Control+k'); const input = search(page); await input.fill('Блок');
    release(); await expectNeutral(page, errorTitle); await paints(page, 3);
    await expect(input).toBeFocused(); await expect(input).toHaveValue('Блок');
    await expect(page.locator('main')).toHaveJSProperty('inert', true);
    await input.press('Escape'); await recoveryVisible(page, retry(page));
    await page.keyboard.press('Tab'); await expect(retry(page)).toBeFocused(); await page.keyboard.press('Enter');
    await expectFragment(page, 'fire'); expect(await length(page)).toBe(entries); expect(attempts()).toBe(2);
    expect(await audio.evaluate(a => a.currentSrc)).toBe(src); await expect(audio).toHaveJSProperty('paused', false);
    expect(await audio.evaluate(a => a.currentTime)).toBeGreaterThan(time); expect(docs).toEqual(['/music']);
  });
});

for (const html of [false, true]) {
  test(`${html ? 'HTML host fallback' : 'payload 404'} with an absent fragment exposes a real, noncanonical missing essay`, async ({ page, context, hasTouch }) => {
    const response = html ? { status: 200, contentType: 'text/html', body: '<!doctype html>' } : { ...unavailable, status: 404 };
    await withHeldRequest(context, payload, failOnce(response), async ({ release, attempts }) => {
      const original = await startReading(page, hasTouch ? 390 : 1200);
      await pendingChapter(page, attempts); release();
      const h1 = page.getByRole('heading', { level: 1, name: /Статья не найдена/i });
      const link = page.getByRole('link', { name: 'Вернуться к статьям' });
      await expect(h1).toBeFocused(); await expect(h1).toBeInViewport(); await expect(link).toBeInViewport({ ratio: 0.99 });
      await expectNeutral(page, /Статья не найдена/i); await expect(page.locator('main [role="alert"]')).toHaveCount(0);
      await page.keyboard.press('Tab'); await expect(link).toBeFocused();
      await backToParagraph(page, original); expect(attempts()).toBe(1);
    });
  });
}

for (const [path, title] of [['/poets/%75nknown-poet', /Поэт не найден/i], ['/music/unknown-release', /Трек не найден/i]]) {
  test(`missing dynamic detail ${path} cannot inherit ready canonical or schema`, async ({ page }) => {
    await open(page, path + '#absent', 390); await expectNeutral(page, title);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeFocused();
    await expect(page.getByRole('link', { name: /Вернуться/ })).toBeInViewport({ ratio: 0.99 });
  });
}

test('an encoded address retains its ready public canonical, not a permanent loading title', async ({ page }) => {
  await open(page, '/priv%61cy/'); await expect(page).toHaveTitle(/Политика конфиденциальности/i);
  await expectReady(page, '/privacy'); await expect(page).toHaveURL(base + '/priv%61cy/');
});

// Observe the main document and route module across the actual navigations,
// including a server fallback with the wrong MIME type. A Performance entry
// in the final document alone cannot describe the abandoned request.
function recoveryNetwork(page) {
  const events = [];
  const changed = (request, outcome) => {
    const path = new URL(request.url()).pathname;
    if (request.resourceType() === 'document' || /\/MusicPage-[^/]+\.js$/.test(path)) events.push([path, outcome]);
  };
  page.on('response', r => changed(r.request(), [r.status(), r.headers()['content-type']]));
  page.on('requestfailed', r => changed(r, r.failure()?.errorText));
  return events;
}
async function expectRecoveredMusic(page, docs, attempts, network) {
  try { await expect(music(page)).toBeVisible(); }
  catch (error) {
    // Read diagnostics *after* the native locator wait. A reload can destroy
    // an execution context; observing it must not become the failure itself.
    const surface = await page.evaluate(() => ({ path: location.pathname, title: document.title,
      alert: document.querySelector('main [role="alert"]')?.textContent?.slice(0, 320),
      heading: document.querySelector('h1')?.textContent, state: document.readyState, online: navigator.onLine,
    })).catch(() => ({ path: page.url() }));
    throw new Error(`${error.message}\n${JSON.stringify({ ...surface, docs, moduleRequests: attempts(), network })}`, { cause: error });
  }
  await expectReady(page, '/music');
}

for (const mode of ['failure', 'http-503', 'blocked', 'success']) {
  test(`Back before the music import completes: late ${mode} cannot replace the article head or reload its document`, async ({ page, context, hasTouch }) => {
    if (mode === 'blocked') await withoutNavigationApi(page);
    const docs = documents(page), network = recoveryNetwork(page);
    let online = mode === 'success';
    const outage = r => mode === 'http-503' ? r.fulfill({ status: 503, contentType: 'text/javascript', headers: { 'Cache-Control': 'no-store' }, body: '' }) : r.abort('failed');
    await withHeldRequest(context, chunk, r => online ? r.continue() : outage(r), async ({ release, attempts }) => {
      const original = await startReading(page, hasTouch ? 390 : 1200), doc = await clock(page);
      if (mode === 'blocked') await page.evaluate(key => sessionStorage.setItem(key, String(Date.now())), marker);
      await choose(page, 'Музыка'); await expect.poll(attempts).toBe(1); await expectNeutral(page, pendingTitle);
      await backToParagraph(page, original); await expect(paragraph(page)).toBeFocused();
      release();
      // ESM may cache a rejection: there need not be a second network event.
      // Outwait the actual 240ms module retry, then positively exercise Forward.
      await page.waitForTimeout(650);
      expect(await head(page)).toEqual(original); expect(await clock(page)).toBe(doc); expect(docs).toEqual([yesenin]);
      await expectReadingAt(paragraph(page), 0.46); await expect(paragraph(page)).toBeFocused();
      if (mode !== 'blocked') expect(await page.evaluate(key => sessionStorage.getItem(key), marker)).toBeNull();
      // Restore the service explicitly. The document count is an independent
      // assertion: a Playwright request notification cannot enable the origin.
      online = true;
      await page.goForward();
      if (mode === 'blocked') {
        await recoveryVisible(page, refresh(page)); expect(docs).toEqual([yesenin]);
        await refresh(page).click();
      }
      await expectRecoveredMusic(page, docs, attempts, network);
      expect(docs).toEqual(mode === 'success' ? [yesenin] : [yesenin, '/music']);
    });
  });
}

test('an active stale chunk gets one automatic reload, then a working manual recovery, not a reload loop', async ({ page, context }) => {
  const docs = documents(page), network = recoveryNetwork(page);
  let online = false;
  await withHeldRequest(context, chunk, r => online ? r.continue() : r.abort('failed'), async ({ release, attempts }) => {
    await open(page, yesenin); await choose(page, 'Музыка'); await expect.poll(attempts).toBe(1); release();
    // This is now a new document's initial load. It need not autofocus.
    await expect(refresh(page)).toBeVisible(); await expectNeutral(page, errorTitle);
    await page.waitForTimeout(650); expect(docs).toEqual([yesenin, '/music']);
    online = true;
    await refresh(page).click(); await expectRecoveredMusic(page, docs, attempts, network);
    expect(docs).toEqual([yesenin, '/music', '/music']);
    expect(await page.evaluate(key => sessionStorage.getItem(key), marker)).toBeNull();
  });
});
