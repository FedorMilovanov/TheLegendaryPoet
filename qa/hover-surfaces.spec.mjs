import { expect, test } from '@playwright/test';
import { registerMediaContract } from './media-contract.mjs';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const essay = '/essays/sergei-yesenin-1921-1925';
registerMediaContract(test);
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tlp:analytics-consent:v1', 'denied'));
});

async function open(page, path) {
  await page.goto(base + path, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main h1').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

const center = (locator) => locator.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
async function settleReveal(locator) {
  await expect.poll(() => locator.evaluate(node => {
    const reveal = node.closest('[data-reveal-state]');
    return !reveal || (reveal.dataset.revealState === 'visible' && getComputedStyle(reveal).opacity === '1');
  })).toBe(true);
}
const insideViewport = (locator) => locator.evaluate(node => {
  const r = node.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;
});

async function expectStableEdge(page, hit, dwell = 650) {
  await page.mouse.move(0, 0);
  await center(hit);
  await settleReveal(hit);
  // A trial hover can move the pointer. Measure the *unhovered* hit region,
  // then check every frame: a moving edge can flicker and finish back at rest.
  await expect.poll(() => hit.evaluate(n => {
    const r = n.getBoundingClientRect();
    return !n.matches(':hover') && n.contains(document.elementFromPoint(r.x + r.width / 2, r.bottom - 1));
  })).toBe(true);
  const box = await hit.boundingBox();
  const point = { x: Math.floor(box.x + box.width / 2), y: Math.floor(box.y + box.height - 1) };
  await hit.evaluate(n => {
    n.dataset.leaves = '0';
    n.addEventListener('pointerleave', () => { n.dataset.leaves = String(1 + Number(n.dataset.leaves)); });
  });
  await page.mouse.move(point.x, point.y);
  expect(await hit.evaluate(async (n, { x, y, dwell }) => {
    const end = performance.now() + dwell;
    do {
      await new Promise(requestAnimationFrame);
      if (!n.contains(document.elementFromPoint(x, y))) return false;
    } while (performance.now() < end);
    return true;
  }, { ...point, dwell })).toBe(true);
  await expect(hit).toHaveAttribute('data-leaves', '0');
}

test('home motion never drops a stationary pointer at the edge of a link or letter', { tag: '@fine-pointer' }, async ({ page }) => {
  await open(page, '/');
  for (const hit of [page.locator('[data-hero-poet-window]').first(), page.getByRole('link', { name: /Каталог Исследовать поэтов/ }), page.locator('.kinetic-letter').first()]) {
    await expectStableEdge(page, hit, 1050); // include the full letter dwell
  }
});

test('reading links and music controls retain their bottom pixel throughout hover', { tag: '@fine-pointer' }, async ({ page }) => {
  await open(page, '/poets/alexander-blok');
  await expectStableEdge(page, page.locator('.poet-reading-index ol > li > a').first());
  await open(page, '/music');
  await expectStableEdge(page, page.getByRole('button', { name: 'Слушать', exact: true }).first());
  await expectStableEdge(page, page.locator('article a[aria-label^="Открыть публикацию"]').first());
  await open(page, essay);
  await expectStableEdge(page, page.locator('#sources li a').first());
  await expectStableEdge(page, page.getByRole('navigation', { name: 'Навигация по серии' }).getByRole('link').first());
});

test('tilt light is painted and clipped by the rounded artwork, including narrow scans', { tag: '@fine-pointer' }, async ({ page }) => {
  for (const [path, selector] of [
    ['/articles', '.luxury-card.tilt-card-surface'], ['/poets', '.tilt-card-surface'],
    ['/essays/brik-case', 'button:has(img[src$="lilya-brik-1914.webp"])'],
    ['/poets/vladimir-mayakovsky', '[aria-labelledby="poet-longreads-title"] .tilt-card-surface'],
  ]) {
    await open(page, path);
    const surface = page.locator(selector).first();
    await center(surface);
    await surface.hover();
    await expect.poll(() => surface.evaluate(n => getComputedStyle(n, '::after').opacity)).toBe('1');
    const light = await surface.evaluate(n => {
      const css = getComputedStyle(n), paint = getComputedStyle(n, '::after');
      return { clipped: css.overflowX === 'hidden' && css.borderRadius !== '0px' && paint.borderRadius === css.borderRadius,
        width: parseFloat(paint.width), surface: n.clientWidth, pointer: paint.pointerEvents, gradient: paint.backgroundImage };
    });
    expect(light.clipped).toBe(true);
    expect(light.gradient).toContain('radial-gradient');
    expect(light.pointer).toBe('none');
    expect(Math.abs(light.width - light.surface)).toBeLessThan(1);
    if (path === '/essays/brik-case') expect(light.width).toBeLessThanOrEqual(300);
  }
});

test('citation labels flip below a top-edge link, accept the pointer and dismiss with Escape', { tag: '@fine-pointer' }, async ({ page }) => {
  await open(page, essay);
  const link = page.locator('.theme-essay-citation').first();
  const tip = link.locator('..').getByRole('tooltip');
  await center(link);
  await settleReveal(link);
  await link.evaluate(n => window.scrollBy({ top: n.getBoundingClientRect().top - 18, behavior: 'instant' }));
  // locator.hover() may auto-scroll the very edge we need to exercise.
  await expect.poll(() => link.evaluate(n => {
    const r = n.getBoundingClientRect();
    return r.top >= 15 && r.top <= 21 && n === document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  })).toBe(true);
  const anchor = await link.boundingBox();
  await page.mouse.move(anchor.x + anchor.width / 2, anchor.y + anchor.height / 2);
  await expect(tip).toBeVisible();
  expect(await link.getAttribute('title')).toBeNull();
  const r = await tip.boundingBox(), a = await link.boundingBox();
  expect(Math.abs(r.y - (a.y + a.height))).toBeLessThan(1);
  expect(await insideViewport(tip)).toBe(true);
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2, { steps: 10 });
  await expect(tip).toBeVisible();
  expect(await tip.evaluate(n => n.matches(':hover') && getComputedStyle(n).cursor !== 'none')).toBe(true);
  await page.keyboard.press('Escape');
  await expect(tip).toBeHidden();
  await link.focus();
  await expect(tip).toBeVisible();
  const href = await link.getAttribute('href');
  await page.keyboard.press('Enter');
  await expect.poll(() => new URL(page.url()).hash).toBe(href);
});

test('a passing pointer cannot evict a focused citation; Escape releases its preview', { tag: '@fine-pointer' }, async ({ page }) => {
  await open(page, essay);
  const group = page.locator('.essay-body sup:has(> span:nth-child(2))').first();
  await center(group);
  await settleReveal(group);
  const [a, b] = [0, 1].map(i => group.getByRole('link').nth(i));
  const activeTip = page.locator('[role="tooltip"]:popover-open');
  const title = link => link.locator('..').locator('[role="tooltip"]').textContent();
  await b.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(a).toBeFocused();
  const firstTitle = await title(a);
  await expect(activeTip).toHaveText(firstTitle);
  await b.hover();
  await expect(activeTip).toHaveText(firstTitle);
  await page.mouse.move(0, 0);
  await expect(activeTip).toHaveText(firstTitle);
  const away = () => page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await away();
  await expect(a).not.toBeInViewport();
  await expect(activeTip).toBeHidden();
  await center(group);
  await expect(activeTip).toBeVisible();
  await expect(activeTip).toHaveText(firstTitle);
  await page.keyboard.press('Escape');
  await away();
  await center(group);
  await expect(activeTip).toHaveCount(0);
  await expect(a).toBeFocused();
  // Dismissal is not a permanent lock on hover or on native navigation.
  await b.hover();
  await expect(activeTip).toHaveText(await title(b));
  await page.keyboard.press('Tab');
  await expect(b).toBeFocused();
  const distant = page.locator('.theme-essay-citation').nth(32);
  await page.mouse.move(0, 0);
  await center(distant);
  await expect(b).not.toBeInViewport();
  await expect(activeTip).toBeHidden();
  await distant.hover();
  await expect(activeTip).toBeVisible();
  await expect(activeTip).toHaveText(await title(distant));
  await expect(b).toBeFocused();
  await page.keyboard.press('Enter');
  await expect.poll(() => new URL(page.url()).hash).toBe(await b.getAttribute('href'));
});

test('hover outside the chapter list cannot dismiss it or take keyboard focus', { tag: '@fine-pointer' }, async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 620 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, essay);
  const link = page.locator('.theme-essay-citation').first();
  await center(link);
  const trigger = page.getByRole('button', { name: 'Оглавление статьи' });
  await trigger.click();
  const menu = page.locator('#essay-toc-popover'), row = menu.getByRole('button').nth(1);
  await row.focus();
  // Different font metrics can put the first citation beneath the popover.
  // Pick a real citation outside it, rather than mistaking the precondition
  // for a hover failure. The same focus, tooltip and dismissal assertions apply.
  const initialBox = await menu.boundingBox();
  const candidates = page.locator('.theme-essay-citation');
  const index = await candidates.evaluateAll((nodes, box) => nodes.findIndex(node => {
    const r = node.getBoundingClientRect(), x = r.x + r.width / 2;
    return r.width > 0 && r.height > 0 && x > 2 && x < innerWidth - 2 &&
      (x < box.x - 8 || x > box.x + box.width + 8);
  }), initialBox);
  expect(index, `no citation outside chapter-menu geometry ${JSON.stringify(initialBox)}`).toBeGreaterThanOrEqual(0);
  const outside = candidates.nth(index);
  await center(outside); await settleReveal(outside);
  const r = await outside.boundingBox(), box = await menu.boundingBox();
  const x = r.x + r.width / 2, y = r.y + r.height / 2;
  expect(x < box.x || x > box.x + box.width,
    `citation and chapter-menu geometry: ${JSON.stringify({ citation: r, menu: box, x, y })}`).toBe(true);
  expect(y).toBeGreaterThan(0);
  expect(y).toBeLessThan(620);
  await page.mouse.move(x, y); // some engines deliver :hover through ::backdrop
  await expect(menu).toBeVisible();
  await expect(row).toBeFocused();
  await expect(page.locator('[role="tooltip"]:popover-open')).toHaveCount(0);
  await page.mouse.click(2, y); // an intentional outside activation *does* dismiss
  await expect(menu).toBeHidden();
});

test('native text and image gestures never display a second decorative cursor', { tag: '@fine-pointer' }, async ({ page }) => {
  const ring = page.locator('[data-custom-cursor-ring]');
  await open(page, '/poets/alexander-blok');
  const word = page.locator('[data-poem-canonical-word]').first();
  await ring.waitFor({ state: 'attached' });
  await word.hover();
  await expect(page.locator('body')).toHaveClass(/custom-cursor-ready/);
  await expect(word).toHaveCSS('cursor', 'text');
  await expect(ring).toBeHidden();
  await page.keyboard.press('Control+k');
  const input = page.getByRole('combobox');
  await input.hover();
  await expect(input).not.toHaveCSS('cursor', 'none');
  await expect(ring).toBeHidden();
  await page.getByRole('button', { name: 'Закрыть поиск' }).hover();
  await expect(ring).toBeVisible();
  await page.keyboard.press('Escape');
  await open(page, '/essays/brik-case');
  await page.locator('button:has(img[src$="lilya-brik-1914.webp"])').click();
  const dialog = page.getByRole('dialog'), image = dialog.locator('img');
  await ring.waitFor({ state: 'attached' });
  await image.hover();
  await expect(image).toHaveCSS('cursor', 'zoom-in');
  await expect(ring).toBeHidden();
  await dialog.getByRole('button', { name: 'Увеличить изображение', exact: true }).click();
  await image.hover();
  await expect(image).toHaveCSS('cursor', 'grab');
  await expect(ring).toBeHidden();
});

test('pointing and arrow keys share one active, visible search result', { tag: '@fine-pointer' }, async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 500 });
  await open(page, '/');
  await page.keyboard.press('Control+k');
  const input = page.getByRole('combobox'), list = page.getByRole('listbox');
  const active = list.getByRole('option', { selected: true });
  const music = list.locator('#command-option-music');
  // Clicking the scrollable padding can focus a programmatic (non-Tab)
  // target. Tab must stay in the modal on the next physical keypress.
  await list.click({ position: { x: 3, y: 3 } });
  await page.keyboard.press('Tab');
  expect(await input.evaluate(n => n.closest('[role="dialog"]').contains(document.activeElement))).toBe(true);
  await input.focus();
  await music.hover();
  await expect(active).toHaveCount(1);
  await expect(input).toHaveAttribute('aria-activedescendant', 'command-option-music');
  await input.press('ArrowDown');
  await expect(input).not.toHaveAttribute('aria-activedescendant', 'command-option-music');
  await input.press('ArrowUp');
  await expect(active).toHaveAttribute('id', 'command-option-music');
  const option = await active.boundingBox(), box = await list.boundingBox();
  expect(option.y).toBeGreaterThanOrEqual(box.y - 1);
  expect(option.y + option.height).toBeLessThanOrEqual(box.y + box.height + 1);
  await input.press('Enter');
  await expect(page).toHaveURL(/\/music\/?$/);
});

test('wrapped poem ink matches its hit targets and copying the sheet includes the verse only once', { tag: '@fine-pointer' }, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await open(page, '/poets/alexander-blok');
  const poem = page.locator('[data-poem-text]').first();
  await center(poem.locator('[data-poem-canonical-word]').first());
  const inBand = () => poem.evaluate(n => {
    const words = [...n.querySelectorAll('[data-poem-canonical-word]')];
    const ink = [...n.querySelectorAll('[data-poem-visual] > div > span')];
    return ink.flatMap((el, i) => {
      const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      return y > 100 && y < innerHeight - 100 ? [[i, document.elementFromPoint(x, y) === words[i]]] : [];
    });
  });
  // A lazy route can still be mounting its verse: occupy the band first, then
  // compare ink against hit targets.
  await expect.poll(async () => (await inBand()).length, { message: 'wrapped verse ink inside the sampled band' }).toBeGreaterThan(5);
  const sample = await inBand();
  expect(sample.filter(([, match]) => !match)).toEqual([]);
  const i = sample[1][0];
  await poem.locator('[data-poem-canonical-word]').nth(i).hover();
  await expect(poem.locator('[data-poem-visual] > div > span').nth(i)).toHaveCSS('z-index', '20');
  const copied = await poem.evaluate(n => {
    const r = document.createRange(); r.selectNodeContents(n);
    getSelection().removeAllRanges(); getSelection().addRange(r);
    return [getSelection().toString().trim(), n.querySelector('[data-poem-canonical]').textContent.trim()];
  });
  expect(copied[0]).toBe(copied[1]);
  const chip = page.getByRole('button', { name: 'Ссылка на строку' });
  await expect(chip).toBeVisible();
  await page.evaluate(() => window.scrollBy({ top: 440, behavior: 'instant' }));
  await expect.poll(() => insideViewport(chip)).toBe(true);
  await page.evaluate(() => getSelection().removeAllRanges());
  await expect(chip).toBeHidden();
});

test.describe('compact touch, reduced motion', { tag: '@compact-touch' }, () => {
  test.use({ viewport: { width: 390, height: 500 }, isMobile: true, hasTouch: true, contextOptions: { reducedMotion: 'reduce' } });

  test('the last chapter is reachable inside the menu; search never leaves its backdrop above the dialog', async ({ page }) => {
    await open(page, essay);
    await page.evaluate(() => window.scrollTo({ top: 2400, behavior: 'instant' }));
    const trigger = page.getByRole('button', { name: 'Оглавление статьи' });
    const menu = page.locator('#essay-toc-popover'), last = menu.getByRole('button').last();
    await trigger.tap();
    expect(await insideViewport(menu)).toBe(true);
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport({ ratio: 0.99 });
    await last.focus();
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('combobox')).toBeFocused();
    await expect(menu).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await trigger.tap();
    await last.tap();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/#[^#]+$/);
  });

  test('all eight citations stay hittable with enlarged text, including the last native link', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 540 });
    await open(page, essay);
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    const group = page.locator('.essay-body sup:has(> span:nth-child(8))').first();
    await center(group);
    await expect.poll(() => group.getByRole('link').evaluateAll(links => links.length >= 8 && links.every(link => {
      const r = link.getBoundingClientRect(), article = link.closest('article').getBoundingClientRect();
      return r.left >= article.left && r.right <= article.right && link === document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    }))).toBe(true);
    const last = group.getByRole('link').last(), href = await last.getAttribute('href');
    await last.tap();
    await expect.poll(() => new URL(page.url()).hash).toBe(href);
    await expect(page.locator(href)).toBeInViewport();
  });

  test('a deep chapter opens in view and the reading position updates on a height-only resize', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 620 });
    await open(page, essay);
    const headings = page.locator('.essay-body h2[id]'), deep = headings.nth(-2);
    const anchor = await deep.getAttribute('id'), previous = await headings.nth(-3).getAttribute('id');
    await deep.evaluate(n => scrollBy({ top: n.getBoundingClientRect().top - 150, behavior: 'instant' }));
    const trigger = page.getByRole('button', { name: 'Оглавление статьи' });
    await expect(trigger).toHaveAttribute('data-toc-anchor', anchor);
    const y = await page.evaluate(() => scrollY);
    await trigger.tap();
    const row = page.locator('#essay-toc-popover [aria-current="location"]');
    await expect(row).toHaveAttribute('data-toc-anchor', anchor);
    await expect(row).toBeFocused();
    await expect(row).toBeInViewport({ ratio: 0.99 });
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await page.setViewportSize({ width: 390, height: 280 });
    await expect(trigger).toHaveAttribute('data-toc-anchor', previous);
    expect(Math.abs((await page.evaluate(() => scrollY)) - y)).toBeLessThanOrEqual(1);
  });

  test('volume controls fit on both player layouts and Escape returns to the invoker', async ({ page }) => {
    for (const path of ['/music', '/music/pushkin-tucha']) {
      await open(page, path);
      const button = page.getByRole('button', { name: /настроить громкость$/ });
      await center(button);
      await button.tap();
      const slider = page.getByRole('slider', { name: 'Громкость', exact: true });
      await expect(slider).toBeVisible();
      const state = await slider.evaluate(n => {
        const r = n.closest('[popover]').getBoundingClientRect(), card = n.closest('article').getBoundingClientRect();
        const track = n.getBoundingClientRect();
        return r.left >= card.left - 1 && r.right <= card.right + 1 && r.top >= 0 && r.bottom <= innerHeight &&
          document.elementFromPoint(track.right - 2, track.top + track.height / 2) === n;
      });
      expect(state).toBe(true);
      await slider.focus();
      await slider.press('End');
      await expect(button).toHaveText('100%');
      await page.keyboard.press('Escape');
      await expect(slider).toBeHidden();
      await expect(button).toBeFocused();
    }
  });
  test('Tab leaves the chapter menu without a backdrop; resizing preserves the explored chapter in both directions', async ({ page }) => {
    await open(page, essay);
    const trigger = page.getByRole('button', { name: 'Оглавление статьи' });
    const menu = page.locator('#essay-toc-popover');
    const last = menu.getByRole('button').last();
    const enterMenu = async () => {
      await page.evaluate(() => window.scrollTo({ top: 2400, behavior: 'instant' }));
      await trigger.tap();
      await last.focus();
      await expect(last).toBeFocused();
    };
    await enterMenu();
    await page.keyboard.press('Tab');
    await expect(menu).toBeHidden();
    await expect.poll(() => page.evaluate(() => {
      const active = document.activeElement;
      return active !== document.body && !active.closest('.section-chip') && active.matches(':focus-visible');
    })).toBe(true);
    await enterMenu();
    await page.setViewportSize({ width: 1200, height: 600 });
    await expect(menu).toBeHidden();
    await expect(page.locator('aside nav a').last()).toBeFocused();
    await page.setViewportSize({ width: 390, height: 500 });
    await expect(trigger).toBeFocused();
    await expect(menu).toBeHidden(); // resize is not an activation
    await trigger.press('Enter');
    await expect(last).toBeFocused();
    await expect(last).toBeInViewport({ ratio: 0.99 });
    expect(new URL(page.url()).hash).toBe('');
  });

  test('volume follows a visible trigger on resize and closes on Tab or when the trigger scrolls away', async ({ page }) => {
    await open(page, '/music');
    const trigger = page.getByRole('button', { name: /настроить громкость$/ });
    const slider = page.getByRole('slider', { name: 'Громкость', exact: true });
    const panel = page.locator('.anchored-panel[popover]');
    await center(trigger);
    await trigger.tap();
    await page.setViewportSize({ width: 375, height: 500 });
    await expect.poll(() => insideViewport(panel)).toBe(true);
    await slider.focus();
    await page.keyboard.press('Tab');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(slider).toBeHidden();
    await trigger.tap();
    await expect(slider).toBeVisible();
    const y = await page.evaluate(() => scrollY);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect(trigger).not.toBeInViewport();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y);
    await expect(trigger).toBeInViewport();
    await expect(panel).toBeHidden();
  });

  test('volume returns focus to the actual invoker even if a click did not first focus that button', async ({ page }) => {
    await open(page, '/music');
    const trigger = page.getByRole('button', { name: /настроить громкость$/ });
    const slider = page.getByRole('slider', { name: 'Громкость', exact: true });
    await center(trigger);
    for (const nestedSearch of [false, true]) {
      // A DOM activation, like some touch/AT activations, has no focusing
      // mousedown. The adjacent mute button targets the very same popover.
      await trigger.evaluate(button => { document.activeElement?.blur(); button.click(); });
      await slider.focus();
      if (nestedSearch) {
        await page.keyboard.press('Control+k');
        await expect(page.getByRole('combobox')).toBeFocused();
      }
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
      await expect(slider).toBeHidden();
    }
  });

  test('a fast touch pan cannot swallow the next tap on the zoom button', { tag: '@chromium-only' }, async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 660 });
    await open(page, '/essays/brik-case');
    await page.locator('button:has(img[src$="lilya-brik-1914.webp"])').tap();
    const dialog = page.getByRole('dialog'), img = dialog.locator('img');
    const zoom = dialog.getByRole('button', { name: 'Увеличить изображение', exact: true });
    await zoom.tap();
    await expect.poll(() => portraitBox(img)).toMatchObject({ magnified: true, atLeft: false });
    // Playwright's portable touchscreen API supports taps, not swipes. CDP
    // drives Chromium's native gesture recognizer (not DOM-dispatched events).
    const session = await context.newCDPSession(page);
    try {
      const box = await img.locator('..').boundingBox();
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let i = 1; i <= 12; i++) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + (385 - x) * i / 12, y: y + (646 - y) * i / 12 }] });
      }
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await expect.poll(() => portraitBox(img)).toMatchObject({ magnified: true, atLeft: true, covered: true });
      await dialog.getByRole('button', { name: 'Уменьшить изображение' }).tap();
      await expect(zoom).toHaveAttribute('aria-pressed', 'false');
      await expect.poll(() => portraitBox(img)).toMatchObject({ fitted: true });
    } finally {
      await session.detach();
    }
  });

  test('compact lightbox fits the photo and actions; enlarged text can scroll to the controls', async ({ page }) => {
    await open(page, '/essays/brik-case');
    const opener = page.locator('button:has(img[src$="osip-brik-1928.webp"])');
    await opener.tap();
    const dialog = page.getByRole('dialog'), img = dialog.locator('img');
    const zoom = dialog.getByRole('button', { name: 'Увеличить изображение', exact: true });
    await img.evaluate(n => n.decode());
    await expect.poll(() => portraitBox(img)).toMatchObject({ fitted: true, covered: true });
    await expect(zoom).toBeInViewport({ ratio: 0.99 });
    await page.setViewportSize({ width: 320, height: 256 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await expect.poll(() => portraitBox(img)).toMatchObject({ fitted: true });
    const close = dialog.getByRole('button', { name: 'Закрыть изображение' });
    const source = dialog.getByRole('link', { name: 'Источник' });
    await close.focus();
    await page.keyboard.press('Tab');
    await expect(source).toBeFocused();
    await expect(source).toBeInViewport({ ratio: 0.99 });
    await zoom.tap(); // Must scroll within the dialog, not the locked page.
    await expect(dialog.getByRole('button', { name: 'Уменьшить изображение' })).toBeInViewport({ ratio: 0.99 });
    await close.tap();
    await expect(dialog).toBeHidden();
    await expect.poll(() => page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.depth)).toBe(0);
  });

});

test('reduced motion and forced colors keep tilt decoration off without disabling links', { tag: ['@fine-pointer', '@chromium-only'] }, async ({ page }) => {
  await open(page, '/articles');
  const surface = page.locator('.tilt-card-surface').first();
  for (const media of [{ reducedMotion: 'reduce', forcedColors: 'none' }, { reducedMotion: 'no-preference', forcedColors: 'active' }]) {
    await page.emulateMedia(media);
    await surface.hover();
    expect(await surface.evaluate(n => getComputedStyle(n, '::after').content)).toBe('none');
    await expect(page.locator('[data-tilt-tracking]')).toHaveCount(0);
    expect(await surface.evaluate(n => n.closest('a').href)).toContain('/essays/');
  }
  await open(page, '/poets/alexander-blok');
  await expect(page.locator('[data-poem-canonical]').first()).toBeVisible();
  await expect(page.locator('[data-poem-visual]').first()).toBeHidden();
});

// Compare against the inside of the clipped frame; the 1px border isn't a
// missing strip of the photograph. Don't accept a nonmoving zoom imitation.
function portraitBox(locator) {
  return locator.evaluate(n => {
    const frame = n.parentElement, box = frame.getBoundingClientRect(), img = n.getBoundingClientRect();
    const left = box.left + frame.clientLeft, top = box.top + frame.clientTop;
    const gaps = [img.left - left, left + frame.clientWidth - img.right, img.top - top, top + frame.clientHeight - img.bottom];
    return {
      fitted: n.naturalWidth > 0 && img.width > 10 && img.height > 10 && gaps.every(v => Math.abs(v) < 1.5) &&
        Math.abs(img.width / img.height - n.naturalWidth / n.naturalHeight) < 0.01,
      covered: img.width > 0 && gaps.every(v => v < 1.5),
      atLeft: Math.abs(gaps[0]) < 1.5, atRight: Math.abs(gaps[1]) < 1.5,
      magnified: img.width > 1.5 * frame.clientWidth,
    };
  });
}

test('portrait pan reaches both edges without exposing the backdrop and resets on unzoom and reopen', { tag: '@fine-pointer' }, async ({ page }) => {
  await page.clock.install();
  await page.setViewportSize({ width: 1200, height: 650 });
  await open(page, '/essays/brik-case');
  const opener = page.locator('button:has(img[src$="lilya-brik-1914.webp"])');
  await opener.click();
  const dialog = page.getByRole('dialog'), img = dialog.locator('img');
  const zoom = dialog.getByRole('button', { name: 'Увеличить изображение', exact: true });
  await expect.poll(() => portraitBox(img)).toMatchObject({ fitted: true });
  await zoom.click();
  await expect.poll(() => portraitBox(img)).toMatchObject({ magnified: true, covered: true, atLeft: false, atRight: false });
  for (const [x, y, edge] of [[1198, 645, 'atLeft'], [2, 2, 'atRight']]) {
    const frame = await img.locator('..').boundingBox();
    await page.mouse.move(frame.x + frame.width / 2, frame.y + frame.height / 2);
    // The release is authoritative even when there is no JS paint between
    // press and release. Keep real pointer input and the final edge check.
    if (edge === 'atLeft') await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
    try {
      await page.mouse.down();
      await page.mouse.move(x, y, { steps: 16 });
      await page.mouse.up();
    } finally { if (edge === 'atLeft') await page.clock.resume(); }
    await expect.poll(() => portraitBox(img)).toMatchObject({ magnified: true, covered: true, [edge]: true });
  }
  await page.setViewportSize({ width: 510, height: 370 });
  await expect.poll(() => portraitBox(img)).toMatchObject({ magnified: true, covered: true, atRight: true });
  const out = dialog.getByRole('button', { name: 'Уменьшить изображение' });
  await out.press('ArrowLeft');
  await expect.poll(() => portraitBox(img)).toMatchObject({ covered: true, atRight: false });
  await out.click();
  await expect.poll(() => portraitBox(img)).toMatchObject({ fitted: true });
  await zoom.click();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await opener.press('Enter');
  await expect(zoom).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => portraitBox(img)).toMatchObject({ fitted: true });
});

test('a failed documentary image has one readable status, a source and no working zoom', async ({ page }) => {
  // Deliberate failure of this one item. Not a claim about the live archive.
  await page.route('https://tile.loc.gov/storage-services/service/pnp/agc/7a00000/7a00200/7a00247v.jpg', route => route.abort('failed'));
  await open(page, '/essays/yesenin-duncan-first-meeting-documents');
  const opener = page.locator('.essay-body figure button[aria-haspopup="dialog"]').first();
  await opener.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('status')).toHaveText('Изображение временно недоступно');
  await expect(dialog.locator('img')).toBeHidden();
  await expect(dialog.getByRole('button', { name: 'Увеличить изображение', exact: true })).toBeDisabled();
  await expect(dialog.getByRole('link', { name: 'Источник' })).toHaveAttribute('href', /^https:/);
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
});

test('changing a scrolled search query reveals its first result and Tab never lands on a result', async ({ page }) => {
  await page.setViewportSize({ width: 750, height: 500 });
  await open(page, '/');
  await page.keyboard.press('Control+k');
  const input = page.getByRole('combobox'), list = page.getByRole('listbox');
  const close = page.getByRole('button', { name: 'Закрыть поиск' });
  await expect(input).toBeFocused();
  for (const [key, next] of [['Shift+Tab', close], ['Tab', input], ['Tab', close], ['Shift+Tab', input]]) {
    await page.keyboard.press(key);
    await expect(next).toBeFocused();
  }
  for (let i = 0; i < 7; i++) await input.press('ArrowDown');
  await expect.poll(() => list.evaluate(n => n.scrollTop)).toBeGreaterThan(0);
  await input.fill('а');
  const first = list.getByRole('option').first();
  await expect(first).toHaveAttribute('aria-selected', 'true');
  await expect(input).toHaveAttribute('aria-activedescendant', await first.getAttribute('id'));
  await expect.poll(() => first.evaluate(n => {
    const b = n.getBoundingClientRect(), l = n.parentElement.getBoundingClientRect();
    return b.top >= l.top - 1 && b.bottom <= l.bottom + 1;
  })).toBe(true);
});

test('late clipboard completion and feedback expiry cannot change a newer text selection', async ({ page }) => {
  // Control *only* this asynchronous write, so the selection can change
  // mid-promise, independently of the OS clipboard and its permission policy.
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
    writeText: value => new Promise(resolve => { window.pendingCopy = { value, resolve }; }),
  } }));
  await open(page, '/poets/alexander-blok');
  const words = page.locator('[data-poem-canonical]').first().locator('[data-poem-canonical-word]');
  await center(words.first());
  const select = index => words.nth(index).evaluate(n => {
    const range = document.createRange(); range.selectNodeContents(n);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range); return sel.toString();
  });
  const first = await select(0);
  const chip = page.getByRole('button', { name: 'Ссылка на строку' });
  await chip.click();
  const copiedParts = () => page.evaluate(() => window.pendingCopy && new URL(window.pendingCopy.value).hash.split(':~:text='));
  await expect.poll(copiedParts).toEqual([expect.stringMatching(/^#read\.poem-blok-1\./), encodeURIComponent(first)]);
  const second = await select(1);
  await page.evaluate(() => { window.pendingCopy.resolve(); window.pendingCopy = null; });
  await expect(chip).toBeVisible();
  await chip.click();
  await expect.poll(copiedParts).toEqual([expect.stringMatching(/^#read\.poem-blok-1\./), encodeURIComponent(second)]);
  await page.evaluate(() => window.pendingCopy.resolve());
  await expect(page.getByRole('button', { name: 'Скопировано' })).toBeVisible();
  const third = await select(2);
  await expect(chip).toBeVisible();
  await page.waitForTimeout(1500); // span the old 1.4s destructive timer
  expect(await page.evaluate(() => getSelection().toString())).toBe(third);
  await expect(chip).toBeVisible();
});
