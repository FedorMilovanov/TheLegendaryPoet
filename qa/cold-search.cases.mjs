import { expect, test } from '@playwright/test';
import {
  base, biography, blokId, blokPath, blokTitle, choose, expectFragment, expectMusicAt, open,
  paints, readMusic, search, withoutNavigationApi, withoutViewTransitions, y,
} from './reader-navigation.mjs';
import { expectReadingAt, portion, readAt } from './reading-position.mjs';

// Unlike a delayed biography, the URL changes *before there is a poet page*.
// Hold the real route import; do not approximate a cold route with a timeout.
async function beforePoetPaints(page, interact) {
  const chunk = '**/assets/PoetDetailPage-*.js';
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route(chunk, async route => { await gate; await route.continue(); }, { times: 1 });
  const requested = page.waitForRequest(chunk);
  try {
    await choose(page, blokTitle); await requested;
    await expect(page).toHaveURL(base + blokPath);
    await expect(page.locator('#' + blokId)).toHaveCount(0);
    await interact();
  } finally { release(); }
}

async function typeSecondSearch(page) {
  const input = search(page);
  await expect(input).toBeFocused(); await input.fill('Блок');
  const selected = page.getByRole('option', { selected: true });
  await expect(selected).toContainText('Блок');
  const first = await selected.getAttribute('id');
  await input.press('ArrowDown');
  await expect(selected).not.toHaveAttribute('id', first);
  return selected.getAttribute('id');
}

export function registerColdSearchCases() {
  test.describe('search while a route chunk is pending', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });

    for (const compact of [false, true]) {
      test(`a late paint keeps the query and explored result; Escape returns to the visible search button (${compact ? 'dock → header, no view transitions' : 'header'})`, async ({ page, hasTouch }) => {
        if (compact) await withoutViewTransitions(page);
        await open(page, '/music', compact ? 390 : 1200);
        const header = page.getByRole('button', { name: 'Открыть поиск — Ctrl K' });
        const opener = compact ? page.getByRole('button', { name: 'Открыть поиск и все разделы' }) : header;
        let explored, before;
        await beforePoetPaints(page, async () => {
          before = await y(page);
          if (hasTouch) await opener.tap(); else await opener.click();
          explored = await typeSecondSearch(page);
          if (compact) await page.setViewportSize({ width: 1200, height: 600 });
        });
        await expect(biography(page).nth(1)).toBeAttached(); await paints(page, 3);
        const input = search(page);
        await expect(input).toBeFocused(); await expect(input).toHaveValue('Блок');
        await expect(input).toHaveAttribute('aria-activedescendant', explored);
        await expect(page.getByRole('option', { selected: true })).toHaveAttribute('id', explored);
        await expect(page.locator('body')).toHaveCSS('position', 'fixed');
        await expect(page.locator('#main-content')).toHaveJSProperty('inert', true);
        await input.press('Escape'); await expect(input).toBeHidden(); await paints(page, 3);
        await expect(header).toBeFocused(); await expect(header).toBeInViewport({ ratio: 0.98 });
        await expect(page.locator('#main-content')).toHaveJSProperty('inert', false);
        expect(await y(page)).toBe(before); await expect(page.locator('#' + blokId)).not.toBeInViewport();
      });
    }

    test('a shortcut dismissed before arrival leaves a usable landmark and does not resurrect the fragment', async ({ page }) => {
      await open(page, '/music'); await readMusic(page);
      let before;
      await beforePoetPaints(page, async () => {
        before = await y(page);
        await page.keyboard.press('Control+k'); await typeSecondSearch(page);
        await search(page).press('Escape'); await expect(search(page)).toBeHidden();
        await expect(page.locator('#main-content')).toBeFocused();
      });
      await expect(biography(page).nth(1)).toBeAttached(); await paints(page, 3);
      await expect(page.locator('#main-content')).toBeFocused(); expect(await y(page)).toBe(before);
      await expect(page.locator('#' + blokId)).not.toBeInViewport();
    });

    for (const legacy of [false, true]) {
      test(`Back dismisses the newer search before the chunk arrives, Forward still lands at the poem (${legacy ? 'History API fallback' : 'native browser'})`, async ({ page }) => {
        if (legacy) await withoutNavigationApi(page);
        const essay = '/essays/sergei-yesenin-1921-1925';
        await open(page, essay, 390);
        const paragraph = page.locator('.essay-body > :has(h2[id^="sec-америка-"]) + *');
        await readAt(paragraph); const part = await portion(paragraph);
        // Keep the original assertion. If a browser loses the position, record
        // the passage and viewport geometry on both sides of the traversal.
        const measure = () => page.evaluate(fraction => {
          const n = document.querySelector('.essay-body > :has(h2[id^="sec-америка-"]) + *');
          const r = n?.getBoundingClientRect(), active = document.activeElement, state = history.state;
          return { url: location.href, y: scrollY, viewport: [innerWidth, innerHeight],
            rect: r && [r.top, r.bottom, r.height], fraction, bodyPosition: getComputedStyle(document.body).position,
            bodyTop: document.body.style.top, entry: state && { key: state.key, idx: state.idx, stamped: state.tlpScrollEntry },
            active: active?.id || active?.tagName, documentHeight: document.documentElement.scrollHeight };
        }, part);
        const departure = await measure();
        await beforePoetPaints(page, async () => {
          const pending = await measure();
          await page.keyboard.press('Control+k'); await typeSecondSearch(page);
          const searchOpen = await measure();
          await page.setViewportSize({ width: 1200, height: 600 });
          const resized = await measure();
          await page.goBack(); await expect(page).toHaveURL(base + essay);
          await expect(search(page)).toBeHidden(); await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');
          try { await expectReadingAt(paragraph, part); }
          catch (error) {
            error.message += `\nCold-search geometry: ${JSON.stringify({ departure, pending, searchOpen, resized, returned: await measure() })}`;
            throw error;
          }
          await expect(paragraph).toBeFocused();
        });
        await page.goForward(); await expectFragment(page, blokId);
      });
    }

    test('choosing the pending poem again replaces its entry and performs the jump', async ({ page }) => {
      await open(page, '/music'); await readMusic(page);
      await beforePoetPaints(page, async () => {
        const length = await page.evaluate(() => history.length);
        await choose(page, blokTitle);
        expect(await page.evaluate(() => history.length)).toBe(length);
      });
      await expectFragment(page, blokId); await page.goBack(); await expectMusicAt(page, 610);
    });

    test('choosing the old music page is a new visit, not a replacement for the pending poem', async ({ page }) => {
      await open(page, '/music'); await readMusic(page);
      await beforePoetPaints(page, async () => {
        await choose(page, 'Музыка'); await expectMusicAt(page, 0);
      });
      await page.goBack(); await expectFragment(page, blokId);
      await page.goBack(); await expectMusicAt(page, 610);
    });
  });
}
