import { expect, test } from '@playwright/test';
import { registerCommandIndexCases } from './command-index.cases.mjs';
import { registerMediaContract } from './media-contract.mjs';
import { base, biography, blokId, blokTitle, choose, expectFragment, expectMusicAt, open, paints, search, y } from './reader-navigation.mjs';

const errors = new WeakMap();
registerMediaContract(test);
test.beforeEach(async ({ page }) => {
  errors.set(page, []); page.on('pageerror', e => errors.get(page).push(e.message));
  await page.addInitScript(() => localStorage.setItem('tlp:analytics-consent:v1', 'denied'));
});
test.afterEach(({ page }) => expect(errors.get(page)).toEqual([]));
registerCommandIndexCases();

const player = page => page.locator('[role="dialog"][aria-labelledby="immersive-track-title"]');
async function activateFromReading(page, opener, hasTouch) {
  await opener.scrollIntoViewIfNeeded();
  // Mobile can still scroll to make a tap actionable *after* the runner
  // scrolled the button into view. Measure the reader's real departure.
  await opener.evaluate(n => {
    window.__commandOpenerY = null;
    n.addEventListener('pointerdown', () => { window.__commandOpenerY = scrollY; }, { once: true, capture: true });
  });
  if (hasTouch) await opener.tap(); else await opener.click();
  const before = await page.evaluate(() => window.__commandOpenerY);
  expect(typeof before).toBe('number');
  return before;
}
async function enterPlayer(page, hasTouch) {
  const opener = page.getByRole('button', { name: 'Погружение', exact: true }).first();
  const before = await activateFromReading(page, opener, hasTouch);
  await expect(player(page).getByRole('button', { name: 'Выйти' })).toBeFocused();
  return before;
}
async function expectUnlocked(page) {
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');
  expect(await page.locator('main').evaluate(el => !!el.closest('[inert], [aria-hidden="true"]'))).toBe(false);
}

test.describe('navigation through covered dialogs', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });

  test('choosing a poem leaves the player after its painted exit without interrupting the track', async ({ page, hasTouch }) => {
    await open(page, '/music', hasTouch ? 390 : 1200);
    await page.getByRole('button', { name: /Воспроизвести трек/i }).first().click();
    const audio = page.locator('audio');
    await expect.poll(() => audio.evaluate(a => !a.paused && a.currentTime > 0)).toBe(true);
    const before = await enterPlayer(page, hasTouch);
    await expect(player(page)).toHaveCSS('opacity', '1');
    const src = await audio.evaluate(a => a.currentSrc);
    await choose(page, blokTitle, async () => {
      await player(page).evaluate(lower => {
        window.__commandExit = [];
        const record = () => {
          if (!lower.isConnected) return;
          if (!document.querySelector('input[role="combobox"]')) {
            window.__commandExit.push({ locked: document.body.style.position === 'fixed',
              isolated: !!document.querySelector('main').closest('[inert]'), focusInside: lower.contains(document.activeElement) });
          }
          requestAnimationFrame(record);
        };
        record();
      });
      await search(page).press('Enter');
    });
    await expectUnlocked(page); await expectFragment(page, blokId);
    const samples = await page.evaluate(() => window.__commandExit);
    expect(samples.length).toBeGreaterThan(0); expect(samples.filter(s => !s.locked || !s.isolated || !s.focusInside)).toEqual([]);
    expect(await audio.evaluate(a => a.currentSrc)).toBe(src); await expect(audio).toHaveJSProperty('paused', false);
    await expect(page.getByRole('complementary', { name: 'Текущий музыкальный релиз' })).toBeVisible();
    await page.goBack(); await expectMusicAt(page, before);
  });

  test('Escape reveals the photo again; selecting a chapter instead reveals the heading in the same article', async ({ page, hasTouch }) => {
    const essay = '/essays/sergei-yesenin-1921-1925';
    await open(page, essay, hasTouch ? 390 : 1200);
    const opener = page.getByRole('button', { name: /^Увеличить изображение:/ }).first();
    const before = await activateFromReading(page, opener, hasTouch);
    const close = page.getByRole('button', { name: 'Закрыть изображение' });
    await expect(close).toBeFocused(); await page.keyboard.press('Control+k');
    await expect(search(page)).toBeFocused(); await search(page).press('Escape');
    await expect(close).toBeFocused(); await expect(page.locator('body')).toHaveCSS('position', 'fixed');
    await choose(page, 'Кавказ и воображаемая Персия');
    await expectUnlocked(page); await expectFragment(page, 'sec-кавказ-и-воображаемая-персия');
    await page.goBack(); await expect(page).toHaveURL(base + essay); await expect.poll(() => y(page)).toBe(before);
  });

  test('a same-page result replaces without returning focus to the player opener, Back beneath both dialogs still works', async ({ page, hasTouch }) => {
    await open(page, '/privacy'); await choose(page, 'Музыка'); await expectMusicAt(page, 0);
    await enterPlayer(page, hasTouch); const length = await page.evaluate(() => history.length);
    await choose(page, 'Музыка'); await expectUnlocked(page); await expectMusicAt(page, 0);
    expect(await page.evaluate(() => history.length)).toBe(length);
    await enterPlayer(page, hasTouch); await page.keyboard.press('Control+k'); await search(page).fill('Блок');
    await page.goBack(); await expect(page).toHaveURL(base + '/privacy'); await expectUnlocked(page);
    await expect(page.locator('main')).toBeFocused(); await expect.poll(() => y(page)).toBe(0);
  });

  test('a fresh search during player exit owns the cold arrival and the visible shell button works after dismissal', async ({ page, hasTouch }) => {
    await open(page, '/music', hasTouch ? 390 : 1200);
    const before = await enterPlayer(page, hasTouch);
    await expect(player(page)).toHaveCSS('opacity', '1'); await expect(page.locator('html')).toHaveClass(/chrome-hidden/);
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const chunk = '**/assets/PoetDetailPage-*.js';
    await page.route(chunk, async route => { await gate; await route.continue(); }, { times: 1 });
    const input = search(page);
    try {
      await page.keyboard.press('Control+k'); await input.fill(blokTitle);
      await expect(page.getByRole('option', { selected: true })).toContainText(blokTitle);
      // Record overlap in the browser, not from a later protocol sample that
      // may run only after the fading player was already removed.
      await player(page).evaluate(lower => {
        const old = document.querySelector('input[role="combobox"]');
        window.__openedWhileCovered = false;
        const observer = new MutationObserver(() => {
          const next = document.querySelector('input[role="combobox"]');
          if (next && next !== old) { window.__openedWhileCovered = lower.isConnected; observer.disconnect(); }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });
      await input.press('Enter'); await expect(input).toHaveCount(0);
      await page.keyboard.press('Control+k'); await input.fill('ещё');
      expect(await page.evaluate(() => window.__openedWhileCovered)).toBe(true);
      await expect(page.locator('#' + blokId)).toHaveCount(0);
    } finally { release(); }
    await expect(biography(page).nth(1)).toBeAttached(); await expect(player(page)).toHaveCount(0);
    await expect(input).toHaveValue('ещё'); await expect(input).toBeFocused(); await input.press('Escape');
    await expectUnlocked(page); await paints(page, 3); await expect(page.locator('main')).toBeFocused();
    expect(await y(page)).toBe(before); await expect(page.locator('#' + blokId)).not.toBeInViewport();
    const visible = page.getByRole('button', { name: hasTouch ? 'Открыть поиск и все разделы' : 'Открыть поиск — Ctrl K' });
    await expect(visible).toBeInViewport({ ratio: 0.98 });
    if (hasTouch) await visible.tap(); else await visible.click();
    await expect(input).toBeFocused(); await input.press('Escape'); await expect(visible).toBeFocused();
  });
});
