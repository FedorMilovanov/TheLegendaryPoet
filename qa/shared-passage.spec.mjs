import { expect, test } from '@playwright/test';
import { registerMediaContract } from './media-contract.mjs';
import { base, biography, choose, music, open, paints, y } from './reader-navigation.mjs';
import { expectReadingAt, readAt } from './reading-position.mjs';
import { withHeldRequest, yesenin } from './route-recovery.mjs';

const blok = '/poets/alexander-blok', poetData = '**/data/poets/alexander-blok.json*';
const america = page => page.locator('.essay-body > :has(h2[id^="sec-америка-"]) + * p').first();
const line = p => p.locator('[data-reading-flow="poem-blok-1"] > span').nth(7); // second «Ночь,»
const repeatedWord = p => line(p).locator('[data-poem-canonical-word]').first();
const chip = p => p.getByRole('button', { name: 'Ссылка на строку', exact: true });
const pass = route => route.continue();
const errors = new WeakMap();

registerMediaContract(test);
test.beforeEach(async ({ context, browserName, page }) => {
  const caught = []; errors.set(context, caught);
  const watch = p => p.on('pageerror', e => caught.push(e.message));
  watch(page); context.on('page', watch);
  await context.addInitScript(origin => {
    if (location.origin === origin) localStorage.setItem('tlp:analytics-consent:v1', 'denied');
  }, new URL(base).origin);
  if (browserName === 'chromium') {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(base).origin });
  } else {
    // Test the same copied bytes and recipient in WebKit without assuming
    // Playwright can grant its OS clipboard permissions.
    await context.addInitScript(() => {
      let value = '';
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
        writeText: async text => { value = text; }, readText: async () => value,
      } });
    });
  }
});
test.afterEach(({ context }) => expect(errors.get(context)).toEqual([]));

// Select real, published text. Keep the independent recipient oracle tied to
// the selected glyph, not the URL encoding, the entire block, or scrollY > 0.
async function copy(page, element, path, start = '', backwards = false) {
  const quote = await element.evaluate((el, { start, backwards }) => {
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
    const text = el.firstChild, at = start ? text.data.indexOf(start) : 0;
    if (at < 0) throw new Error('missing published words: ' + start);
    const s = getSelection();
    s.setBaseAndExtent(text, backwards ? text.length : at, text, backwards ? at : text.length);
    return s.toString();
  }, { start, backwards });
  await chip(page).click();
  await expect(page.getByRole('button', { name: 'Скопировано' })).toBeVisible();
  const url = new URL(await page.evaluate(() => navigator.clipboard.readText()));
  expect(url.origin + url.pathname).toBe(base + path + '/');
  expect(url.search).toBe('');
  const clean = quote.trim().replace(/\s+/g, ' '), words = clean.split(' ');
  const parts = clean.length <= 120 || words.length <= 10 ? [clean] : [words.slice(0, 5).join(' '), words.slice(-5).join(' ')];
  const [address, directive] = url.hash.slice(1).split(':~:text=');
  expect(address).toBeTruthy(); expect(directive?.split(',').map(decodeURIComponent)).toEqual(parts);
  return url.href;
}

async function recipient(context, href) {
  const relay = await context.newPage();
  await relay.setContent('<a target="_blank" rel="noopener">Открыть цитату</a>');
  const link = relay.getByText('Открыть цитату');
  await link.evaluate((a, url) => { a.href = url; }, href);
  const next = context.waitForEvent('page');
  await link.click();
  const page = await next;
  await page.waitForLoadState('domcontentloaded');
  expect(await page.evaluate(() => !!window.opener)).toBe(false);
  return page;
}
// A trace for the two order-sensitive arrivals only. Observe unmodified UA
// events in the recipient; do not instrument scrollTo, timers or focus.
async function observeArrival(context) {
  await context.addInitScript(() => {
    const events = window.__qaPassageEvents = [];
    for (const type of ['load', 'scrollend', 'focusin', 'keydown']) {
      window.addEventListener(type, e => {
        if (events.length === 24) events.shift();
        const el = e.target;
        events.push([Math.round(performance.now()), type, el?.id || el?.nodeName, scrollY,
          document.querySelector(':target')?.nodeName]);
      }, { passive: true, capture: true });
    }
  });
}
// Both variants use the *same* copied public address. The plain fragment is
// an independent control for the app's geometry; it must not replace the
// normal incoming link with its browser-owned text directive.
const arrivalHref = (url, native) => native ? url : url.split(':~:')[0];
async function atGlyph(element, start = '') {
  await expect.poll(() => element.evaluate((el, start) => {
    const t = el.firstChild, i = start ? t.data.indexOf(start) : 0;
    const r = document.createRange(); r.setStart(t, i); r.setEnd(t, i + 1);
    const reveal = el.closest('[data-reveal-state]');
    const top = r.getBoundingClientRect().top, opacity = reveal ? getComputedStyle(reveal).opacity : '1';
    return opacity === '1' && Math.abs(top - 96) < 2 ? 'placed' : { top, opacity, y: scrollY, target: document.querySelector(':target')?.tagName, fonts: document.fonts.status, events: window.__qaPassageEvents };
  }, start), { message: 'selected glyph painted at the fixed-header reading edge' }).toBe('placed');
}

for (const kind of ['essay', 'verse', 'biography']) {
  test(`a copied ${kind} arrives at the actual words in a fresh document`, async ({ context, page, hasTouch }) => {
    const isEssay = kind === 'essay', path = isEssay ? yesenin : blok;
    const target = isEssay ? america : kind === 'verse' ? repeatedWord : p => biography(p).nth(3);
    const start = isEssay ? 'Это зависимое положение' : '';
    // Rewrap between sender and recipient. The verse fixture quotes the same
    // word twice on different lines; looking up its first occurrence fails.
    await open(page, path + '?from=private', hasTouch ? 1000 : 390);
    // This sender is reading the full page. The intentionally short sender
    // and the slow recipient have their own, independently held responses.
    if (!isEssay) await expect(biography(page).nth(1)).toBeAttached();
    const url = await copy(page, target(page), path, start, isEssay);
    const arrive = async gate => {
      const dest = await recipient(context, url);
      if (gate) {
        await expect.poll(gate.attempts).toBe(1);
        if (isEssay) await expect(america(dest)).toHaveCount(0);
        else { await expect(biography(dest)).toHaveCount(1); await expect(repeatedWord(dest)).not.toBeFocused(); }
        gate.release();
      }
      const focus = kind === 'verse' ? line(dest) : target(dest);
      await expect(focus).toBeFocused(); await dest.evaluate(() => document.fonts.ready);
      await atGlyph(target(dest), start);
      if (kind === 'verse') {
        await expect(dest.locator('[data-poem-visual] :focus')).toHaveCount(0);
        // Later Back restores a different passage read under this same shared
        // hash, not the copied word. Do not replay the quote on every POP.
        const from = biography(dest).nth(2); await readAt(from, 0.45);
        await choose(dest, 'Музыка'); await expect(music(dest)).toBeVisible();
        await dest.goBack(); await expectReadingAt(from, 0.45); await expect(from).toBeFocused();
      }
    };
    if (hasTouch) await withHeldRequest(context, isEssay ? `**/data${path}.json` : poetData, pass, arrive);
    else await arrive();
  });
}

test.describe('quote in the last visible line of a tall animated block', () => {
  test.use({ viewport: { width: 320, height: 540 }, contextOptions: { reducedMotion: 'no-preference' } });
  for (const native of [true, false]) {
    test(`arrival paints the line even when less than ten percent of the block is on screen (${native ? 'copied link' : 'plain address'})`, async ({ context, page }) => {
      const path = '/essays/yesenin-kutezhi', start = '11:28';
      const tail = p => p.locator('.essay-body aside p').filter({ hasText: 'Апостол Павел различает' });
      await open(page, path, 320); const url = await copy(page, tail(page), path, start);
      await observeArrival(context);
      const dest = await recipient(context, arrivalHref(url, native));
      await expect(tail(dest)).toBeFocused(); await atGlyph(tail(dest), start);
    });
  }
});

test('a stale passage address does not silently jump to a different paragraph', async ({ page, context }) => {
  await open(page, yesenin);
  const url = await copy(page, america(page), yesenin);
  await context.route(`**/data${yesenin}.json`, async route => {
    const response = await route.fetch(), data = await response.json();
    const block = data.blocks.find(b => b.text?.startsWith('К американскому этапу'));
    block.text = 'Изменённый текст для проверки устаревшей ссылки.';
    await route.fulfill({ response, json: data });
  });
  // Test our address alone. A native text-match decision is the UA's, not ours.
  const dest = await recipient(context, url.split(':~:')[0]);
  await expect(america(dest)).toContainText('Изменённый текст'); await paints(dest, 4);
  expect(await y(dest)).toBe(0); await expect(america(dest)).not.toBeFocused();
});

test('outgoing words still share their own page while the music route is suspended', async ({ context, page, hasTouch }) => {
  await open(page, yesenin + '?from=private', hasTouch ? 390 : 1200);
  await withHeldRequest(context, '**/assets/MusicPage-*.js', pass, async gate => {
    await choose(page, 'Музыка'); await expect.poll(gate.attempts).toBe(1);
    await expect(page).toHaveURL(base + '/music'); await expect(page).toHaveTitle(/Загрузка страницы/);
    const start = 'поэт видел много';
    const url = await copy(page, america(page), yesenin, start);
    gate.release(); await expect(music(page)).toBeVisible();
    const dest = await recipient(context, url); await expect(america(dest)).toBeFocused(); await atGlyph(america(dest), start);
  });
});

test('a shared source outside the collapsed list waits for the series nav above it', async ({ context, page }) => {
  await open(page, yesenin);
  await page.locator('#sources').getByRole('button', { name: /Показать ещё/ }).click();
  const id = 'source-yes2-pss-declarations-vol7k1';
  const title = page.locator('#' + id + ' .theme-text');
  const url = await copy(page, title, yesenin);
  await withHeldRequest(context, '**/data/essays/catalog.json', pass, async gate => {
    const dest = await recipient(context, url), row = dest.locator('#' + id);
    await expect.poll(gate.attempts).toBe(1); await expect(row).toBeAttached();
    gate.release(); await expect(dest.getByRole('navigation', { name: 'Навигация по серии' })).toBeAttached();
    await expect(row).toBeFocused();
    // A native mixed-fragment fallback may place the row again after our two focus frames.
    await dest.waitForTimeout(1100);
    await expect.poll(() => row.evaluate(n => Math.abs(n.getBoundingClientRect().top - 96))).toBeLessThan(2);
  });
});

test('a legacy bibliography-only source is shareable even without an editorial citation id', async ({ context, page }) => {
  const path = '/essays/yesenin-kutezhi'; await open(page, path);
  await page.locator('#sources').getByRole('button', { name: /Показать ещё/ }).click();
  const row = p => p.locator('#sources li').filter({ hasText: 'Девять мифов о Есенине' });
  const url = await copy(page, row(page).locator('.theme-text'), path);
  const dest = await recipient(context, url); await expect(row(dest)).toBeFocused(); await expect(row(dest)).toBeInViewport();
});

test('a shared entry from the full poet bibliography opens the disclosure that owns it', async ({ context, page }) => {
  const entry = p => p.locator('[aria-labelledby="poet-sources-heading"] details li a').nth(2);
  await open(page, blok); await page.locator('[aria-labelledby="poet-sources-heading"] summary').click();
  const url = await copy(page, entry(page), blok);
  const dest = await recipient(context, url);
  await expect(entry(dest)).toBeFocused(); await atGlyph(entry(dest));
});

test('a quote from the temporarily shortened biography remains addressable after enrichment', async ({ context, page }) => {
  let url;
  await withHeldRequest(context, poetData, pass, async gate => {
    await open(page, blok); await expect.poll(gate.attempts).toBe(1); await expect(biography(page)).toHaveCount(1);
    url = await copy(page, biography(page).first(), blok); gate.release(); await expect(biography(page).nth(1)).toBeAttached();
  });
  const dest = await recipient(context, url), intro = dest.locator('.poet-bio-intro');
  await expect(intro).toBeFocused(); await dest.waitForTimeout(1100);
  await expect.poll(() => intro.evaluate(n => Math.abs(n.getBoundingClientRect().top - 96))).toBeLessThan(2);
  expect((await intro.textContent()).length).toBeGreaterThan(40);
});

for (const native of [true, false]) {
  test(`a reader choosing the skip link during delayed quote placement keeps focus and position (${native ? 'copied link' : 'plain address'})`, async ({ page, context }) => {
    await open(page, blok); await expect(biography(page).nth(1)).toBeAttached();
    const url = await copy(page, repeatedWord(page), blok); await observeArrival(context);
    await withHeldRequest(context, poetData, pass, async gate => {
      const dest = await recipient(context, arrivalHref(url, native)); await expect.poll(gate.attempts).toBe(1);
      await expect(biography(dest)).toHaveCount(1); await dest.keyboard.press('Tab');
      const skip = dest.getByRole('link', { name: 'Перейти к содержанию', exact: true });
      await expect(skip).toBeFocused(); const from = await y(dest);
      gate.release(); await expect(biography(dest).nth(1)).toBeAttached(); await paints(dest, 4);
      await expect(skip).toBeFocused();
      const after = await dest.evaluate(() => ({ y: scrollY, events: window.__qaPassageEvents }));
      expect(after.y, `reader's position after enrichment; events=${JSON.stringify(after.events)}`).toBe(from);
    });
  });
}

test('editor and cross-community selections are not publishable even with public endpoints', async ({ page }) => {
  await open(page, blok);
  const safe = await copy(page, repeatedWord(page), blok);
  const field = page.locator('[data-community-target] textarea').first();
  const draft = 'Непубличный текст для проверки'; await field.fill(draft); await field.selectText();
  await paints(page, 3); await expect(chip(page)).toHaveCount(0); await expect(field).toHaveValue(draft);
  await page.evaluate(() => {
    document.activeElement.blur();
    const r = document.createRange(); r.setStartBefore(document.querySelector('[data-reading-flow="biography"]'));
    r.setEndAfter(document.querySelector('[data-poem-canonical]'));
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
  });
  await paints(page, 3); await expect(chip(page)).toHaveCount(0);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(safe);
});
