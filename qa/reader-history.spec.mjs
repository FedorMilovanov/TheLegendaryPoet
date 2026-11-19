import { expect, test } from '@playwright/test';
import { registerMediaContract } from './media-contract.mjs';
import { registerColdSearchCases } from './cold-search.cases.mjs';
import {
  base, biography, blokId, blokPath, blokTitle, choose, expectFragment, expectMusicAt, music, open,
  paints, readMusic, search, withoutNavigationApi, withoutViewTransitions, y,
} from './reader-navigation.mjs';
import { expectReadingAt, portion, readAt } from './reading-position.mjs';

const essay = '/essays/sergei-yesenin-1921-1925';
const berlin = 'sec-берлин-книги-деньги-и-литературная-работа';
const caucasus = 'sec-кавказ-и-воображаемая-персия';
const america = page => page.locator('.essay-body > :has(h2[id^="sec-америка-"]) + *');
const afterCaucasus = page => page.locator(`.essay-body > :has(h2[id="${caucasus}"]) + *`);
const pageErrors = new WeakMap();

registerMediaContract(test);
test.beforeEach(async ({ page }) => {
  pageErrors.set(page, []);
  page.on('pageerror', e => pageErrors.get(page).push(e.message));
  await page.addInitScript(() => localStorage.setItem('tlp:analytics-consent:v1', 'denied'));
});
test.afterEach(({ page }) => { expect(pageErrors.get(page)).toEqual([]); });

registerColdSearchCases();

// Delay the actual supplementary layout, not the whole page or a fake target.
// Negative focus checks must outlive the mutation and both focus frames.
async function whileBiographyLoads(page, arrive, interact) {
  const pattern = '**/data/poets/alexander-blok.json*';
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const held = async route => { await gate; await route.continue(); };
  await page.route(pattern, held);
  try {
    await arrive();
    await expect(page).toHaveURL(base + blokPath);
    await expect(page.locator('#' + blokId)).toBeAttached(); await expect(biography(page)).toHaveCount(1);
    await interact();
  } finally { release(); }
  await expect(biography(page).nth(1)).toBeAttached();
  await page.unroute(pattern, held);
  await paints(page, 3);
}

test.describe('entry-specific reader history', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('cold chapter placement survives a real font swap without native scroll anchoring', async ({ page }) => {
    const gate = Promise.withResolvers();
    let held = 0;
    await page.route('**/*.woff2', async route => { held++; await gate.promise; await route.continue(); });
    try {
      // Some engines don't compensate for the paragraph rewrap. Exercise
      // the shared placement owner; don't change the fonts or the document.
      await page.goto(base + essay + '#' + berlin, { waitUntil: 'domcontentloaded' });
      await page.addStyleTag({ content: 'html, body, * { overflow-anchor: none !important; }' });
      await expect(page.locator(`[id="${berlin}"]`)).toBeAttached();
      await expect.poll(() => held).toBeGreaterThan(0);
      await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe('loading');
      await paints(page, 3);
    } finally { gate.resolve(); }
    await page.evaluate(() => document.fonts.ready);
    await expectFragment(page, berlin);
  });

  test('ordinary music link from a later paragraph restores the paragraph, not the old Berlin hash', async ({ page }) => {
    await open(page, essay + '#' + berlin);
    await expectFragment(page, berlin);
    const block = america(page);
    await readAt(block);
    // Reveal the persistent header with a real upward movement before clicking.
    await expect(page.locator('html')).toHaveClass(/chrome-hidden/);
    await page.evaluate(() => scrollBy({ top: -34, behavior: 'instant' }));
    await expect(page.locator('html')).not.toHaveClass(/chrome-hidden/);
    const from = await y(page), part = await portion(block);
    await page.locator('header nav a[href="/music"]').click();
    await expectMusicAt(page, 0); await readMusic(page);
    await page.goBack();
    await expect.poll(() => decodeURIComponent(new URL(page.url()).hash)).toBe('#' + berlin);
    await expectReadingAt(block, part); await expect(block).toBeFocused();
    expect(await y(page)).toBe(from);
    await page.goForward(); await expectMusicAt(page, 610);
  });

  for (const legacy of [false, true]) {
    test(`search → music → Back after reflow under the dialog (${legacy ? 'History API fallback' : 'native browser'})`, async ({ page }) => {
      if (legacy) await withoutNavigationApi(page);
      await open(page, essay, 390);
      const block = america(page);
      await readAt(block, 0.43); const from = await y(page), part = await portion(block);
      await choose(page, 'Музыка', async row => {
        await expect(page.locator('body')).toHaveCSS('position', 'fixed');
        await page.setViewportSize({ width: 1200, height: 600 });
        await row.click();
      });
      await expectMusicAt(page, 0); await readMusic(page);
      await page.goBack(); await expect(page).toHaveURL(base + essay);
      await expectReadingAt(block, part); expect(await y(page)).not.toBe(from);
      await expect(page.locator('main')).toBeFocused();
      await page.goForward(); await expectMusicAt(page, 610);
    });

    test(`native TOC entries keep distinct Back/Forward departures (${legacy ? 'History API fallback' : 'native browser'})`, async ({ page }) => {
      if (legacy) await withoutNavigationApi(page);
      await open(page, essay);
      const from = america(page), to = afterCaucasus(page);
      await readAt(from);
      const first = await y(page);
      await page.locator(`aside nav a[href="#${caucasus}"]`).press('Enter');
      await expectFragment(page, caucasus);
      await readAt(to, 0.70); const last = await y(page);
      await page.goBack(); await expect(page).toHaveURL(base + essay);
      await expect(from).toBeFocused(); expect(await y(page)).toBe(first);
      await page.goForward(); await expectReadingAt(to, 0.70); expect(await y(page)).toBe(last);
      await expect.poll(() => decodeURIComponent(new URL(page.url()).hash)).toBe('#' + caucasus);
    });
  }

  test('Back before the destination chunk commits still resumes the painted article', async ({ page }) => {
    await withoutNavigationApi(page);
    let release;
    const hold = new Promise(resolve => { release = resolve; });
    const chunk = '**/assets/MusicPage-*.js';
    await page.route(chunk, async route => { await hold; await route.continue(); });
    await open(page, essay, 390);
    const block = america(page);
    await readAt(block); const part = await portion(block);
    const requested = page.waitForRequest(chunk);
    try {
      await choose(page, 'Музыка', async row => {
        await page.setViewportSize({ width: 1200, height: 600 }); await row.click();
      });
      await requested; await expect(page).toHaveURL(base + '/music');
      await expect(music(page)).toHaveCount(0);
      await page.goBack();
    } finally { release(); }
    await expect(page).toHaveURL(base + essay);
    await expectReadingAt(block, part); await expect(block).toBeFocused();
    await page.goForward(); await expectMusicAt(page, 0);
  });

  test('two native entries with the identical Berlin URL remember different passages', async ({ page }) => {
    await withoutNavigationApi(page);
    await open(page, essay + '#' + berlin); await expectFragment(page, berlin);
    const first = america(page), second = afterCaucasus(page);
    await readAt(first);
    await page.locator(`aside nav a[href="#${caucasus}"]`).press('Enter'); await expectFragment(page, caucasus);
    await page.locator(`aside nav a[href="#${berlin}"]`).press('Enter'); await expectFragment(page, berlin);
    await readAt(second, 0.68);
    await page.goBack(); await expectFragment(page, caucasus);
    await page.goBack(); await expect(first).toBeFocused(); await expectReadingAt(first, 0.42);
    await page.goForward(); await expectFragment(page, caucasus);
    await page.goForward(); await expect(second).toBeFocused(); await expectReadingAt(second, 0.68);
    expect(decodeURIComponent(new URL(page.url()).hash)).toBe('#' + berlin);
  });

  test('browser Back closes a second search and restores the pre-chapter passage after unlock', async ({ page }) => {
    await open(page, essay + '#' + berlin, 390);
    await expectFragment(page, berlin);
    const from = america(page), to = afterCaucasus(page);
    await readAt(from); const part = await portion(from);
    await choose(page, 'Кавказ и воображаемая Персия'); await expectFragment(page, caucasus);
    await readAt(to, 0.70); const last = await y(page);
    await page.keyboard.press('Control+k'); await expect(search(page)).toBeFocused();
    await page.goBack(); await expect(search(page)).toBeHidden();
    await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');
    await expect.poll(() => decodeURIComponent(new URL(page.url()).hash)).toBe('#' + berlin);
    await expectReadingAt(from, part); await expect(from).toBeFocused();
    await page.goForward(); await expectReadingAt(to, 0.70); expect(await y(page)).toBe(last);
  });

  test('fresh cross-route chapter and repeat selection jump and focus without duplicating history', async ({ page }) => {
    await open(page, '/music'); await expect(music(page)).toBeVisible(); await readMusic(page);
    await choose(page, 'Берлин: книги'); await expectFragment(page, berlin);
    const length = await page.evaluate(() => history.length);
    await readAt(america(page));
    await choose(page, 'Берлин: книги'); await expectFragment(page, berlin);
    expect(await page.evaluate(() => history.length)).toBe(length);
    await page.goBack(); await expectMusicAt(page, 610);
  });
});

test.describe('motion-enabled lazy reader destinations', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });

  test('poem result waits for the actual biography; Forward restores the verse line at the new width', async ({ page }) => {
    await withoutViewTransitions(page);
    await open(page, '/music', 390); await expect(music(page)).toBeVisible(); await readMusic(page);
    await whileBiographyLoads(page, () => choose(page, blokTitle), async () => {
      await expect(page.locator('main')).toBeFocused();
      // Layout changes and mere hover are not a choice to read somewhere else.
      await page.mouse.move(310, 440); await page.setViewportSize({ width: 390, height: 610 });
      await page.keyboard.press('Shift');
    });
    await expectFragment(page, blokId);
    const line = page.locator(`#${blokId} [data-poem-canonical] > span`).nth(5);
    await readAt(line, 0.49); const part = await portion(line);
    await page.goBack(); await expectMusicAt(page, 610);
    await page.setViewportSize({ width: 1200, height: 650 });
    await page.goForward(); await expect(biography(page).nth(1)).toBeAttached();
    await expectReadingAt(line, part); await expect(line).toBeFocused();
  });
});

test.describe('reader takes over a pending destination', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('wheel wins over a delayed command jump; Back retains that departure under the old poem URL', { tag: '@fine-pointer' }, async ({ page }) => {
    await open(page, '/music');
    let from;
    await whileBiographyLoads(page, () => choose(page, blokTitle), async () => {
      await expect(page.locator('main')).toBeFocused();
      const top = await y(page);
      await page.mouse.move(920, 430); await page.mouse.wheel(0, 490);
      // WebKit delivers this native wheel delta in multiple compositor frames.
      // Release the payload at the actual destination, not halfway down.
      await expect.poll(() => y(page)).toBe(top + 490);
      from = await y(page);
    });
    expect(await y(page)).toBe(from); await expect(page.locator('main')).toBeFocused();
    await choose(page, 'Музыка'); await expectMusicAt(page, 0);
    await page.goBack(); await expect(page).toHaveURL(base + blokPath);
    await expect(biography(page).nth(1)).toBeAttached();
    await expect.poll(() => y(page)).toBe(from); await expect(page.locator('#' + blokId)).not.toBeInViewport();
  });

  test('Tab on a direct poem URL keeps the skip link when the full biography arrives', async ({ page }) => {
    const skip = page.getByRole('link', { name: 'Перейти к содержанию', exact: true });
    await whileBiographyLoads(page, () => open(page, blokPath, 390), async () => {
      await page.keyboard.press('Tab'); await expect(skip).toBeFocused();
    });
    await expect(skip).toBeFocused(); expect(await y(page)).toBe(0);
  });

  test('a reader editing a comment keeps the field, draft and selection across the insertion', async ({ page }) => {
    await open(page, '/music', 390);
    const draft = page.locator('[data-community-target="poet:alexander-blok"]').getByRole('textbox', { name: 'Текст комментария' });
    const text = 'При чтении возник вопрос';
    const selection = () => draft.evaluate(t => [t.selectionStart, t.selectionEnd]);
    let chosen;
    await whileBiographyLoads(page, () => choose(page, blokTitle), async () => {
      await draft.click(); await page.keyboard.insertText(text);
      await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Shift+ArrowLeft');
      chosen = await selection(); expect(chosen[1] - chosen[0]).toBe(1);
    });
    await expect(draft).toBeFocused(); await expect(draft).toHaveValue(text); expect(await selection()).toEqual(chosen);
    // Native anchoring may change numeric scrollY as new text appears above
    // the field. The obsolete fragment must not bring the poem into view.
    await expect(page.locator('#' + blokId)).not.toBeInViewport();
  });

  test('a focus-only choice as the page appears wins even before the landmark handoff', async ({ page }) => {
    await open(page, '/music');
    const crumb = page.getByRole('navigation', { name: 'Хлебные крошки' }).getByRole('link', { name: 'Главная' });
    // A focus change need not have a preceding pointerdown or keydown. Put
    // it in the commit/first-paint gap, not after waiting for main to focus.
    await page.evaluate(id => {
      const observer = new MutationObserver(() => {
        const link = document.querySelector('main [aria-label="Хлебные крошки"] a');
        if (document.getElementById(id) && link) { observer.disconnect(); link.focus({ preventScroll: true }); }
      });
      observer.observe(document.body, { subtree: true, childList: true });
    }, blokId);
    await whileBiographyLoads(page, () => choose(page, blokTitle), async () => { await expect(crumb).toBeFocused(); });
    await expect(crumb).toBeFocused(); expect(await y(page)).toBe(0);
  });

  test('opening a new search cancels the old jump after unlock; requesting the same poem still works', async ({ page }) => {
    await open(page, '/music', 390); await readMusic(page);
    let beforeSearch;
    await whileBiographyLoads(page, () => choose(page, blokTitle), async () => {
      await expect(page.locator('main')).toBeFocused();
      beforeSearch = await y(page);
      await page.keyboard.press('Control+k'); await expect(search(page)).toBeFocused();
      await search(page).fill('Блок');
    });
    await expect(search(page)).toBeFocused(); await expect(search(page)).toHaveValue('Блок');
    await page.keyboard.press('Escape'); await expect(search(page)).toBeHidden();
    await expect(page.locator('body')).not.toHaveCSS('position', 'fixed'); await paints(page, 3);
    await expect(page.locator('main')).toBeFocused(); expect(await y(page)).toBe(beforeSearch);
    const length = await page.evaluate(() => history.length);
    await choose(page, blokTitle); await expectFragment(page, blokId);
    expect(await page.evaluate(() => history.length)).toBe(length);
    await page.goBack(); await expectMusicAt(page, 610);
  });
});

test.describe('compact interrupted traversal', { tag: ['@chromium-only', '@compact-touch'] }, () => {
  test.use({ isMobile: true, hasTouch: true, contextOptions: { reducedMotion: 'reduce' } });

  test('a native swipe while Back waits for the biography overrides the saved verse', async ({ page, context }) => {
    await open(page, blokPath, 390); await expectFragment(page, blokId);
    await readAt(page.locator(`#${blokId} [data-poem-canonical] > span`).nth(5));
    const verseY = await y(page);
    await choose(page, 'Музыка'); await expectMusicAt(page, 0);
    await whileBiographyLoads(page, () => page.goBack(), async () => {
      await expect(page.locator('main')).toBeFocused();
      // Playwright's portable touch API only taps. Exercise the browser's
      // scroll recognizer, not a synthetic DOM TouchEvent or scrollTo call.
      const session = await context.newCDPSession(page);
      try {
        const point = y => [{ x: 190, y, id: 1 }];
        await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(520) });
        for (let i = 1; i <= 8; i++) {
          await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(520 - i * 31) });
          await paints(page, 1);
        }
        await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } finally { await session.detach(); }
      await expect.poll(() => y(page)).toBeGreaterThan(100);
    });
    // Allow native momentum; require the reader, not the old verse, to win.
    const top = await y(page); expect(top).toBeGreaterThan(100); expect(top).toBeLessThan(verseY);
    await expect(page.locator('main')).toBeFocused(); await expect(page.locator('#' + blokId)).not.toBeInViewport();
  });
});

test.describe('motion-enabled fallback passage geometry', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });

  test('an old source URL is not a new jump when Back remounts the article at a new width', async ({ page }) => {
    await withoutViewTransitions(page);
    const source = 'source-yes2-duncan-russian-days-1929-tu';
    await open(page, essay + '#' + source, 390);
    await expectFragment(page, source);
    const block = america(page);
    async function afterReveal() {
      await expect(block).toHaveAttribute('data-reveal-state', 'visible');
      await block.evaluate(n => Promise.allSettled(n.getAnimations().map(a => a.finished)));
    }
    // Bring the paragraph into view first: measuring its translated reveal
    // frame would set a moving origin before the test has even left the page.
    await block.evaluate(n => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await afterReveal(); await readAt(block);
    const part = await portion(block);
    await choose(page, 'Музыка', async row => {
      await page.setViewportSize({ width: 1200, height: 600 });
      await row.click();
    });
    await expectMusicAt(page, 0);
    await page.goBack(); await expect(page).toHaveURL(base + essay + '#' + source);
    await expect(block).toBeFocused(); await afterReveal(); await expectReadingAt(block, part);
  });
});
