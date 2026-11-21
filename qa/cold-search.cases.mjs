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
        // Test-only witness for the lock/unlock ordering. Keep the real browser
        // calls and the strict reading assertion; never intercept input.
        await page.addInitScript(() => {
          const trace = window.__qaColdTrace = [];
          // Short, change-only frame witness after a saved-entry restoration.
          // A scrollend alone cannot locate the first movement or show whether
          // layout height, focus or a different scrollport changed with it.
          const frames = window.__qaColdFrames = [];
          let frameWatch = 0;
          const watchRestoration = () => {
            frames.length = 0;
            const watch = ++frameWatch;
            let previous = '', frameCount = 0;
            const sample = () => {
              if (watch !== frameWatch) return;
              const root = document.documentElement, body = document.body;
              const snapshot = { t: Math.round(performance.now()), y: scrollY,
                root: [root.scrollTop, root.scrollHeight, root.clientHeight],
                body: body && [body.scrollTop, body.scrollHeight, body.style.position],
                active: document.activeElement?.id || document.activeElement?.tagName };
              const state = JSON.stringify([snapshot.y, snapshot.root, snapshot.body, snapshot.active]);
              if (state !== previous && frames.length < 80) frames.push(snapshot);
              previous = state;
              if (++frameCount < 120) requestAnimationFrame(sample);
            };
            sample();
          };
          const record = (kind, extra = null) => {
            if (trace.length === 80) trace.shift();
            const body = document.body, active = document.activeElement, state = history.state;
            trace.push({ t: Math.round(performance.now()), kind, url: location.href, y: scrollY,
              body: body && [body.style.position, body.style.top], active: active?.id || active?.tagName,
              entry: state && [state.idx, state.key, state.tlpScrollEntry], extra });
          };
          for (const method of ['scrollTo', 'scrollBy']) {
            const original = window[method];
            window[method] = function (...args) {
              record('before ' + method, { args, stack: new Error().stack?.split('\n').slice(1, 5) });
              const result = original.apply(this, args);
              record('after ' + method);
              // Route history uses the object form with both coordinates;
              // the unlock path uses the separate numeric overload.
              if (method === 'scrollTo' && args[0] && typeof args[0] === 'object' &&
                  'left' in args[0] && 'top' in args[0] && document.body?.style.position !== 'fixed') watchRestoration();
              return result;
            };
          }
          for (const type of ['popstate', 'resize', 'focusin', 'scrollend', 'tlp-before-app-navigation', 'tlp-overlay-scroll-restored']) {
            window.addEventListener(type, event => record(type, event.target?.id || event.target?.nodeName), true);
          }
          for (const type of ['navigate', 'currententrychange']) {
            window.navigation?.addEventListener(type, () => record(type));
          }
          document.addEventListener('DOMContentLoaded', () => {
            new MutationObserver(() => record('body style')).observe(document.body, { attributes: true, attributeFilter: ['style'] });
          }, { once: true });
        });
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
            error.message += `\nCold-search frames: ${JSON.stringify(await page.evaluate(() => window.__qaColdFrames))}`;
            error.message += `\nCold-search events: ${JSON.stringify(await page.evaluate(() => window.__qaColdTrace))}`;
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
