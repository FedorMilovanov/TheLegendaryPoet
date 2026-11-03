import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const poets = ['sergei-yesenin', 'alexander-pushkin', 'vladimir-mayakovsky', 'anna-akhmatova', 'fyodor-tyutchev', 'mikhail-lermontov', 'boris-pasternak', 'afanasy-fet', 'nikolay-gumilev', 'alexander-blok'];
const essays = ['brik-case', 'yesenin-kutezhi', 'sergei-yesenin-1921-1925', 'mayakovsky-before-revolution', 'sergei-yesenin-1895-1921', 'mayakovsky-gromovoy', 'yesenin-duncan-first-meeting-documents', 'vykhozhu-odin-ya-na-dorogu-lermontov', 'galina-benislavskaya-yesenin-manuscripts-publishing-archive', 'simonov-syn-artillerista-realnaya-istoriya'];

async function openPage(page, route) {
  const response = await page.goto(BASE_URL + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
  expect(response?.status()).toBeLessThan(400);
  await page.waitForFunction(() => {
    const h1 = document.querySelector('#main-content h1');
    return !!h1 && !!h1.textContent.trim();
  });
}

async function assertSidebar(page, locator, minLinks) {
  await expect(locator).toBeVisible();
  await locator.scrollIntoViewIfNeeded();
  const setup = await locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return { sticky: style.position, overflow: style.overflowY, maxHeight: parseFloat(style.maxHeight), viewport: window.innerHeight };
  });
  expect(setup.sticky).toBe('sticky');
  expect(setup.overflow).toBe('auto');
  expect(setup.maxHeight).toBeGreaterThan(100);
  expect(setup.maxHeight).toBeLessThanOrEqual(setup.viewport - 110);
  const anchors = locator.locator('a[href]');
  const count = await anchors.count();
  expect(count).toBeGreaterThanOrEqual(minLinks);
  for (let i = 0; i < count; i++) {
    const link = anchors.nth(i);
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeInViewport({ ratio: 0.5 });
    await link.click({ trial: true, timeout: 9000 });
    const hit = await link.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const p = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { hit: p === el || el.contains(p), y: r.y, bottom: r.bottom, winHeight: innerHeight };
    });
    expect(hit.hit, 'pointer target ' + i + ' at ' + hit.y).toBe(true);
    expect(hit.y).toBeGreaterThanOrEqual(0);
    expect(hit.bottom).toBeLessThanOrEqual(hit.winHeight + 1);
  }
}

test.describe('Reader sticky viewport containment', () => {
  test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });

  for (const id of poets) {
    test('poet sidebar links remain reachable: ' + id, async ({ page }) => {
      await openPage(page, '/poets/' + id);
      await assertSidebar(page, page.locator('aside.reader-sticky-panel'), 2);
    });
  }

  for (const slug of essays) {
    test('essay TOC and source links remain reachable: ' + slug, async ({ page }) => {
      await openPage(page, '/essays/' + slug);
      await assertSidebar(page, page.locator('aside > .reader-sticky-panel'), 8);
    });
  }

  test('short desktop viewport still exposes last poet and essay sidebar controls', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 600 });
    await openPage(page, '/poets/sergei-yesenin');
    await assertSidebar(page, page.locator('aside.reader-sticky-panel'), 2);
    await openPage(page, '/essays/sergei-yesenin-1921-1925');
    await assertSidebar(page, page.locator('aside > .reader-sticky-panel'), 8);
  });

  test('ratings header remains in normal table flow with reachable rows', async ({ page }) => {
    await openPage(page, '/ratings');
    const table = page.locator('table');
    await expect(table).toBeVisible();
    expect(await table.locator('thead').evaluate(el => getComputedStyle(el).position)).toBe('static');
    const poetLinks = table.locator('tbody a[href^="/poets/"]');
    expect(await poetLinks.count()).toBeGreaterThanOrEqual(5);
    for (const link of await poetLinks.all()) {
      await link.scrollIntoViewIfNeeded();
      await link.click({ trial: true });
    }
  });

  test('mobile poet layout never introduces a nested scroll trap', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, '/poets/sergei-yesenin');
    const sidebar = page.locator('aside.reader-sticky-panel');
    await expect(sidebar).toBeVisible();
    const state = await sidebar.evaluate(el => ({ position: getComputedStyle(el).position, overflow: getComputedStyle(el).overflowY }));
    expect(state.position).toBe('static');
    expect(state.overflow).not.toBe('auto');
  });

  test('keyboard focus brings last long-form TOC control into the visible pane', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 600 });
    await openPage(page, '/essays/sergei-yesenin-1921-1925');
    const sidebar = page.locator('aside > .reader-sticky-panel');
    const lastLink = sidebar.locator('a[href]').last();
    await lastLink.focus();
    await expect(lastLink).toBeFocused();
    await expect(lastLink).toBeInViewport({ ratio: 0.5 });
    const geometry = await lastLink.evaluate(el => {
      const r = el.getBoundingClientRect();
      const p = el.closest('.reader-sticky-panel').getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, panelTop: p.top, panelBottom: p.bottom };
    });
    expect(geometry.top).toBeGreaterThanOrEqual(geometry.panelTop - 1);
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.panelBottom + 1);
  });

  test('desktop wheel naturally chains back to document at end of sidebar', async ({ page }) => {
    await openPage(page, '/poets/sergei-yesenin');
    const sidebar = page.locator('aside.reader-sticky-panel');
    await sidebar.scrollIntoViewIfNeeded();
    await sidebar.evaluate(el => { el.scrollTop = el.scrollHeight; });
    const before = await page.evaluate(() => window.scrollY);
    await sidebar.hover();
    await page.mouse.wheel(0, 640);
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBeGreaterThan(before + 5);
  });
});
