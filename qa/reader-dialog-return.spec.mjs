import { expect, test } from '@playwright/test';
import { expectReadingAt, portion, readAt } from './reading-position.mjs';
import { registerMediaContract } from './media-contract.mjs';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const essay = '/essays/sergei-yesenin-1921-1925';
test.use({ contextOptions: { reducedMotion: 'reduce' } });
registerMediaContract(test);
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tlp:analytics-consent:v1', 'denied'));
});

async function openPage(page, path, width) {
  await page.setViewportSize({ width, height: 650 });
  await page.goto(base + path, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main h1').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

const search = page => page.getByRole('combobox', { name: 'Поисковый запрос' });
const america = page => page.locator('.essay-body > :has(h2[id]) + *').nth(5);
const shellButton = (page, width) => page.getByRole('button', {
  name: width < 1024 ? 'Открыть поиск и все разделы' : 'Открыть поиск — Ctrl K', exact: true,
});

for (const [from, to] of [[390, 390], [1200, 1200], [390, 1200], [1200, 390]]) {
  test(`dismissed search returns to the explored TOC entry without selecting it (${from} → ${to})`, async ({ page }) => {
    await openPage(page, essay, from);
    const passage = america(page), readId = await page.locator('.essay-body h2[id]').nth(5).getAttribute('id');
    const trigger = page.getByRole('button', { name: 'Оглавление статьи' });
    const menu = page.locator('#essay-toc-popover');
    const explored = page.locator('aside nav a').nth(11);
    const exploredId = (await explored.getAttribute('href')).slice(1);
    expect(exploredId).not.toBe(readId);
    await readAt(passage);
    const row = menu.locator(`[data-toc-anchor="${exploredId}"]`);
    if (from < 1024) {
      await expect(trigger).toHaveAttribute('data-toc-anchor', readId);
      await trigger.press('Enter');
      await row.focus();
    } else {
      await explored.focus();
    }
    const y = await page.evaluate(() => scrollY), part = await portion(passage);
    expect(part).toBeGreaterThan(0);
    expect(part).toBeLessThan(1);
    await page.keyboard.press('Control+k');
    await expect(search(page)).toBeFocused();
    await expect(menu).toBeHidden();
    if (to !== from) await page.setViewportSize({ width: to, height: 560 });
    await expect(search(page)).toBeFocused();
    await page.keyboard.press('Escape');
    const target = to < 1024 ? trigger : explored;
    await expect(target).toBeFocused();
    await expect(target).toBeInViewport({ ratio: 0.98 });
    await expect(menu).toBeHidden();
    await expectReadingAt(passage, part);
    if (from === to) expect(await page.evaluate(() => scrollY)).toBe(y);
    if (to < 1024) {
      await expect(trigger).toHaveAttribute('data-toc-anchor', readId);
      await trigger.press('Enter');
      await expect(row).toBeFocused();
      await expect(row).toBeInViewport({ ratio: 0.98 });
      await expect(menu.locator('[aria-current="location"]')).toHaveAttribute('data-toc-anchor', readId);
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
    }
    expect(new URL(page.url()).hash).toBe('');
  });
}

test('deep reading: search returns between header and dock without hiding either as a scroll gesture', async ({ page }) => {
  await openPage(page, essay, 1200);
  const passage = america(page), input = search(page);
  await readAt(passage, 0.7);
  await expect(page.locator('html')).toHaveClass(/chrome-hidden/);
  await page.evaluate(() => scrollBy({ top: -32, behavior: 'instant' }));
  const part = await portion(passage);
  for (const [from, to] of [[1200, 390], [390, 1200]]) {
    const opener = shellButton(page, from);
    await expect(opener).toBeInViewport({ ratio: 0.98 });
    await opener.press('Enter');
    await expect(input).toBeFocused();
    await input.fill('Есенин');
    await input.press('ArrowDown');
    await page.setViewportSize({ width: to, height: 560 });
    if (to === 390) await input.press('Control+k');
    else await page.getByRole('button', { name: 'Закрыть поиск' }).click();
    await expect(shellButton(page, to)).toBeFocused();
    await expect(shellButton(page, to)).toBeInViewport({ ratio: 0.98 });
    await expect(page.locator('html')).not.toHaveClass(/chrome-hidden/);
    await expectReadingAt(passage, part);
  }
  await page.keyboard.press('Control+k');
  await expect(input).toHaveValue('');
  await expect(input).toHaveAttribute('aria-activedescendant', await page.getByRole('option').first().getAttribute('id'));
  await input.fill('Музыка');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/music\/?$/);
  await expect(page.locator('#main-content')).toBeFocused(); // navigation vetoes old trigger return
});

test('a fragment heading regains temporary programmatic focus after a search detour', async ({ page }) => {
  await openPage(page, essay, 1200);
  const link = page.locator('aside nav a').nth(5), href = await link.getAttribute('href');
  const heading = page.locator(href);
  await link.click();
  await expect(heading).toBeFocused();
  const url = page.url(), y = await page.evaluate(() => scrollY);
  await page.keyboard.press('Control+k');
  await expect(search(page)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(heading).toBeFocused();
  expect(page.url()).toBe(url);
  expect(await page.evaluate(() => scrollY)).toBe(y);
});

test('enlarging text in an open short search keeps the input, close and active option usable', async ({ page }) => {
  await openPage(page, '/articles', 1200);
  const opener = shellButton(page, 1200), input = search(page);
  await opener.press('Enter');
  await expect(input).toBeFocused();
  const first = await input.getAttribute('aria-activedescendant');
  await input.fill('Есенин');
  for (let i = 0; i < 6; i++) await input.press('ArrowDown');
  const activeId = await input.getAttribute('aria-activedescendant');
  const selected = page.getByRole('option', { selected: true });
  await page.setViewportSize({ width: 320, height: 256 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await expect(selected).toHaveAttribute('id', activeId);
  const close = page.getByRole('button', { name: 'Закрыть поиск' });
  for (const control of [input, close, selected]) await expect(control).toBeInViewport({ ratio: 0.99 });
  await input.press('ArrowUp');
  await expect(selected).not.toHaveAttribute('id', activeId);
  await expect(selected).toBeInViewport({ ratio: 0.99 });
  await expect(input).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Control+k');
  const dock = shellButton(page, 320);
  await expect(dock).toBeFocused();
  await dock.press('Enter');
  await expect(input).toHaveValue('');
  await expect(input).toHaveAttribute('aria-activedescendant', first);
  await expect(selected).toBeInViewport({ ratio: 0.99 });
});

test('the same canonical verse line stays at the reading line after reflow under search', async ({ page }) => {
  await openPage(page, '/poets/alexander-blok', 390);
  const line = page.locator('[data-poem-canonical]').first().locator(':scope > span').nth(5);
  await readAt(line, 0.5);
  const part = await portion(line);
  await page.keyboard.press('Control+k');
  await expect(search(page)).toBeFocused();
  await page.setViewportSize({ width: 1200, height: 560 });
  await page.keyboard.press('Escape');
  await expect(search(page)).toBeHidden();
  await expectReadingAt(line, part);
  expect(new URL(page.url()).hash).toBe('');
});

test('nested search gives the image viewer back its control before unlocking the reading flow', async ({ page }) => {
  await openPage(page, '/essays/brik-case', 390);
  const opener = page.locator('button:has(img[src$="osip-brik-1928.webp"])');
  const block = page.locator('.essay-body > :has(img[src$="osip-brik-1928.webp"])');
  await readAt(block, 0.45);
  await opener.evaluate(n => n.focus({ preventScroll: true }));
  const part = await portion(block);
  await page.keyboard.press('Enter');
  const viewer = page.getByRole('dialog'), zoom = viewer.getByRole('button', { name: 'Увеличить изображение', exact: true });
  await expect(zoom).toBeEnabled();
  await zoom.focus();
  await page.keyboard.press('Control+k');
  await expect(search(page)).toBeFocused();
  await page.setViewportSize({ width: 1200, height: 560 });
  await page.keyboard.press('Escape');
  await expect(zoom).toBeFocused();
  await expect(page.locator('body')).toHaveCSS('position', 'fixed');
  await expect.poll(() => page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.depth)).toBe(1);
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.__TLP_OVERLAY_DEBUG?.depth)).toBe(0);
  await expectReadingAt(block, part);
});

test('near the cover, return stays visible even when the desktop rail is below the viewport', async ({ page }) => {
  await openPage(page, essay, 390);
  await page.evaluate(() => scrollTo({ top: 330, behavior: 'instant' }));
  const trigger = page.getByRole('button', { name: 'Оглавление статьи' });
  await trigger.press('Enter');
  const row = page.locator('#essay-toc-popover button').nth(7);
  await row.focus();
  await page.keyboard.press('Control+k');
  await expect(search(page)).toBeFocused();
  await page.setViewportSize({ width: 1200, height: 560 });
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(trigger).toBeInViewport({ ratio: 0.98 });
  await expect(page.locator('aside nav')).not.toBeInViewport();
  expect(await page.evaluate(() => scrollY)).toBe(330);
  await trigger.press('Enter');
  await expect(row).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(trigger).toBeHidden(); // not a second permanent desktop menu
  expect(new URL(page.url()).hash).toBe('');
});

test('reflow preserves the paragraph being read beside a floated photo, not the earlier photo', async ({ page }) => {
  await openPage(page, '/essays/brik-case', 1200);
  const paragraphs = page.locator('.essay-body > :has(figure) + :has(p)');
  const index = await paragraphs.evaluateAll(nodes => nodes.findIndex(n => {
    const prev = n.previousElementSibling;
    return getComputedStyle(prev).float !== 'none' && prev.getBoundingClientRect().bottom > n.getBoundingClientRect().top + 55;
  }));
  expect(index).toBeGreaterThanOrEqual(0);
  const text = paragraphs.nth(index);
  await text.evaluate(n => scrollBy({ top: n.getBoundingClientRect().top + 44 - innerHeight * 0.34, behavior: 'instant' }));
  const part = await portion(text);
  expect(part).toBeGreaterThan(0);
  expect(part).toBeLessThan(1);
  await page.keyboard.press('Control+k');
  await expect(search(page)).toBeFocused();
  await page.setViewportSize({ width: 390, height: 650 });
  await page.keyboard.press('Escape');
  await expect(search(page)).toBeHidden();
  await expectReadingAt(text, part);
});

test('a tapped or clicked search button owns return even without default pointer focus', async ({ page, hasTouch }) => {
  await openPage(page, '/articles', 390);
  const dock = shellButton(page, 390);
  await page.locator('header a[href="/"]').first().focus();
  // Model platforms that activate buttons without focusing them. Still send
  // real pointer input, including to the backdrop, rather than calling .click() in the DOM.
  await dock.evaluate(n => n.addEventListener('mousedown', e => e.preventDefault(), { once: true }));
  if (hasTouch) await dock.tap();
  else await dock.click();
  await expect(search(page)).toBeFocused();
  await page.setViewportSize({ width: 1200, height: 560 });
  const backdrop = page.getByRole('dialog', { name: 'Поиск по сайту' }).locator('..');
  const corner = { position: { x: 2, y: 2 } };
  if (hasTouch) await backdrop.tap(corner);
  else await backdrop.click(corner);
  await expect(shellButton(page, 1200)).toBeFocused();
  await expect(shellButton(page, 1200)).toBeInViewport({ ratio: 0.98 });
  await expect(page).toHaveURL(/\/articles\/?$/);
});

test('a reader can enlarge text during search and return to the same biography paragraph', async ({ page }) => {
  await openPage(page, '/poets/alexander-blok', 820);
  const paragraph = page.locator('.poetry-text > p').first();
  await readAt(paragraph);
  const part = await portion(paragraph);
  await page.keyboard.press('Control+k');
  await expect(search(page)).toBeFocused();
  await page.evaluate(() => { document.documentElement.style.fontSize = '24px'; });
  await page.keyboard.press('Escape');
  await expect(search(page)).toBeHidden();
  await expectReadingAt(paragraph, part);
});
