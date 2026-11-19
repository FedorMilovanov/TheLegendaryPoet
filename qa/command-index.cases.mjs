import { test, expect } from '@playwright/test';
import { base, expectFragment, open, paints, search } from './reader-navigation.mjs';

const index = '**/data/essay-search-index.json*';
const loading = page => page.getByText('Загрузка поиска по статьям…');
const options = page => page.getByRole('listbox').locator('[role="option"][id]');
const ids = page => options(page).evaluateAll(rows => rows.map(row => row.id));

// Hold the actual production payload, not a hand-built list or a timer.
async function holdIndex(page, exercise, prepare, { failFirst = false } = {}) {
  let attempts = 0, held = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  // One interceptor from before navigation through the last retry. Switching
  // from a one-use page handler to a context handler can let the real retry
  // finish without Playwright ever observing it on headless Chromium.
  await page.context().route(index, async route => {
    if (++attempts === 1 && failFirst) return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
    held++; await gate; await route.continue();
  });
  try {
    await prepare?.();
    await page.keyboard.press('Control+k');
    await expect.poll(() => held, { message: 'real essay index request intercepted' }).toBeGreaterThan(0);
    await expect(search(page)).toBeFocused(); await expect(loading(page)).toBeVisible();
    await exercise(async () => {
      release(); await expect(loading(page)).toBeHidden(); await paints(page, 2);
    });
  } finally { release(); }
}

async function arrowTo(page, id) {
  const rows = await ids(page);
  expect(rows).toContain(id);
  for (let i = 0; i < rows.indexOf(id); i++) await search(page).press('ArrowDown');
  await expect(search(page)).toHaveAttribute('aria-activedescendant', id);
  await expect(page.getByRole('option', { selected: true })).toHaveAttribute('id', id);
}

export function registerCommandIndexCases() {
  test.describe('in-flight search index', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });

    test('Enter follows the explored release, not the chapter inserted at its former rank', async ({ page }) => {
      const track = 'yesenin-ya-ustalym-takim-eshche-ne-byl', id = 'command-option-track-' + track;
      await holdIndex(page, async complete => {
        await search(page).fill('ещё'); await arrowTo(page, id);
        const before = await ids(page);
        await complete();
        const after = await ids(page);
        expect(after.slice(0, before.length)).toEqual(before); expect(after.length).toBeGreaterThan(before.length);
        await expect(search(page)).toHaveAttribute('aria-activedescendant', id);
        await expect(page.getByRole('option', { selected: true })).toHaveAccessibleName(/Я усталым таким ещё не был/);
        await search(page).press('Enter');
      }, () => open(page, '/privacy', 390));
      await expect(page).toHaveURL(base + '/music/' + track);
      await expect(page.locator('main h1')).toHaveText(/Я усталым таким ещё не был/i);
      await expect(page.locator('main')).toBeFocused(); await page.goBack(); await expect(page).toHaveURL(base + '/privacy');
    });

    test('the bottom edge of a pressed track still activates it when new matches overflow the limit', async ({ page, browserName, hasTouch }) => {
      const id = 'command-option-track-pushkin-tucha';
      await holdIndex(page, async complete => {
        await search(page).fill('Пушкин'); await arrowTo(page, id);
        const r = await page.locator('#' + id).boundingBox();
        const point = { x: r.x + r.width / 2, y: r.y + r.height - 2 };
        const hit = () => page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('[role="option"]')?.id, point);
        expect(await hit()).toBe(id);
        // Chromium exposes a split touch gesture. On WebKit check the same
        // stationary hit point across the mutation, then tap that coordinate.
        const cdp = hasTouch && browserName === 'chromium' ? await page.context().newCDPSession(page) : null;
        if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
        else if (!hasTouch) { await page.mouse.move(point.x, point.y); await page.mouse.down(); }
        try {
          await complete();
          expect(await hit()).toBe(id);
          await expect(search(page)).toHaveAttribute('aria-activedescendant', id);
          await expect(page.getByRole('option', { selected: true })).toHaveAccessibleName(/Туча/);
        } finally {
          if (cdp) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach(); }
          else if (!hasTouch) await page.mouse.up();
        }
        if (hasTouch && !cdp) await page.touchscreen.tap(point.x, point.y);
      }, async () => {
        await open(page, '/privacy', hasTouch ? 390 : 1200);
        await page.setViewportSize({ width: hasTouch ? 390 : 1200, height: 550 });
      });
      await expect(page).toHaveURL(base + '/music/pushkin-tucha'); await expect(page.locator('main h1')).toHaveText(/Туча/);
      await expect(page.locator('main')).toBeFocused();
    });

    test('late articles are reachable, and an edit starts fresh with the complete ranking', async ({ page }) => {
      const input = search(page);
      await holdIndex(page, async complete => {
        await input.fill('Пушкин'); await input.fill('часть'); // do not retain the first draft's rows
        const early = await ids(page); expect(early[0]).toContain('track-blok-kulikovo');
        await complete(); const all = await ids(page);
        expect(all.slice(0, early.length)).toEqual(early);
        expect(new Set(all).size).toBe(all.length); expect(all.length).toBeLessThanOrEqual(early.length + 10);
        const article = all.find(id => id.startsWith('command-option-essay-'));
        expect(article).toBeTruthy(); await arrowTo(page, article);
        await input.fill('час'); await input.fill('часть');
        const fresh = await ids(page); expect(fresh[0]).toBe(article); expect(fresh).toHaveLength(10);
        await expect(input).toHaveAttribute('aria-activedescendant', article); await input.press('Enter');
      }, () => open(page, '/privacy'));
      await expect(page).toHaveURL(base + '/essays/sergei-yesenin-1895-1921'); await expect(page.locator('main')).toBeFocused();
    });

    test('failed index keeps local matches; reopening retries and exposes a previously missing chapter', async ({ page }) => {
      const input = search(page);
      await holdIndex(page, async complete => {
        await expect(input).toHaveValue(''); await input.fill('Берлин: книги'); await complete();
        await expect(page.getByRole('option', { selected: true })).toHaveAccessibleName(/Берлин: книги/i); await input.press('Enter');
      }, async () => {
        await open(page, '/privacy');
        await page.keyboard.press('Control+k'); await input.fill('Туча');
        await expect(page.getByText(/Поиск по статьям временно недоступен/)).toBeVisible();
        await expect(page.locator('#command-option-track-pushkin-tucha')).toBeAttached();
        await input.fill('Берлин: книги'); await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/);
        await input.press('Enter'); await expect(input).toBeFocused(); await expect(page).toHaveURL(base + '/privacy');
        await input.press('Escape'); await expect(input).toBeHidden();
      }, { failFirst: true });
      await expectFragment(page, 'sec-берлин-книги-деньги-и-литературная-работа');
    });
  });
}
