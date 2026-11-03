import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

async function openSettled(page, route) {
  const response = await page.goto(BASE_URL + route, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  expect(response?.status()).toBeLessThan(400);
  await page.waitForFunction(() => {
    const h1 = document.querySelector('#main-content h1');
    return h1 && h1.textContent.trim().length > 3;
  });
}

test.describe('reader interaction ownership', () => {
  test('static legal pages have one main landmark', async ({ page }) => {
    for (const route of ['/privacy', '/editorial-policy']) {
      await openSettled(page, route);
      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.locator('main#main-content')).toHaveCount(1);
      await expect(page.locator('footer h2')).toHaveCount(2);
      await expect(page.locator('footer h4')).toHaveCount(0);
    }
  });

  test('command combobox exposes real options and active descendant', async ({ page }) => {
    await openSettled(page, '/');
    await page.keyboard.press('Control+k');
    const combobox = page.getByRole('combobox');
    await expect(combobox).toBeFocused();
    const results = page.getByRole('listbox');
    const options = results.getByRole('option');
    expect(await options.count()).toBeGreaterThan(1);
    const first = options.first();
    await expect(first).toHaveAttribute('aria-selected', 'true');
    await expect(combobox).toHaveAttribute('aria-activedescendant', await first.getAttribute('id'));
    await page.keyboard.press('ArrowDown');
    const second = options.nth(1);
    await expect(second).toHaveAttribute('aria-selected', 'true');
    await expect(combobox).toHaveAttribute('aria-activedescendant', await second.getAttribute('id'));
    await expect(combobox).toBeFocused();
  });

  test('poem quick navigation retains fragment and browser history', async ({ page }) => {
    await openSettled(page, '/poets/alexander-pushkin');
    const poem = page.locator('a[href^="#poem-"]').first();
    const href = await poem.getAttribute('href');
    expect(href).toMatch(/^#poem-/);
    await poem.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^$()|[\]{}]/g, '\\$&') + '$'));
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/#poem-/);
    await page.goForward({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/#poem-/);
  });

  test('mobile chapter chip is hidden in chrome and usable during reading', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openSettled(page, '/essays/brik-case');
    const chip = page.locator('.section-chip');
    await expect(chip).toBeHidden();
    await page.evaluate(() => window.scrollTo(0, 2200));
    await expect(page.locator('html')).toHaveClass(/chrome-hidden/);
    await expect(chip).toBeVisible();
    expect(await chip.evaluate((el) => el.inert)).toBe(false);
    expect(await chip.getAttribute('aria-hidden')).not.toBe('true');
    await chip.locator('button[popovertarget]').click();
    await expect(page.locator('#essay-toc-popover')).toBeVisible();
    await page.locator('#essay-toc-popover button').nth(1).click();
    await expect(page).toHaveURL(/#[^#]+$/);
  });

  test('floated documentary image buttons own their pointer hit region', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const slug of ['yesenin-kutezhi', 'mayakovsky-before-revolution', 'mayakovsky-gromovoy', 'brik-case']) {
      await openSettled(page, '/essays/' + slug);
      const decline = page.locator('[data-analytics-consent-action="denied"]');
      if (await decline.count() && await decline.isVisible()) await decline.click();
      const buttons = page.locator('.essay-body button[aria-haspopup="dialog"]');
      const count = await buttons.count();
      expect(count, slug + ': figure count').toBeGreaterThanOrEqual(7);
      const blocked = [];
      for (let index = 0; index < count; index++) {
        const button = buttons.nth(index);
        await button.scrollIntoViewIfNeeded();
        await page.waitForTimeout(80);
        const state = await button.evaluate((element) => {
          const box = element.getBoundingClientRect();
          const painted = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
          return { ok: element === painted || element.contains(painted), obstruction: painted?.tagName ?? 'none' };
        });
        if (!state.ok) blocked.push({ index, ...state });
      }
      expect(blocked, slug + ': ' + JSON.stringify(blocked)).toEqual([]);
    }
  });
  test('empty command results never claim listbox options', async ({ page }) => {
    await openSettled(page, '/');
    await page.keyboard.press('Control+k');
    const dialog = page.locator('[role="dialog"][aria-modal="true"]');
    const input = dialog.getByRole('combobox');
    await input.fill('zzzz-no-results-20261103');
    await expect(dialog.getByRole('listbox')).toHaveCount(0);
    await expect(dialog.getByRole('status')).toBeVisible();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  test('inline documentary citations expose source titles as accessible names', async ({ page }) => {
    await openSettled(page, '/essays/brik-case');
    const citations = page.locator('.essay-body .theme-essay-citation');
    expect(await citations.count()).toBeGreaterThan(10);
    for (let index = 0; index < 8; index++) {
      const citation = citations.nth(index);
      const title = await citation.locator('[role="tooltip"]').innerText();
      expect(await citation.getAttribute('aria-label')).toBeNull();
      expect(title.length).toBeGreaterThan(6);
      await expect(citation).toHaveAccessibleName(new RegExp(title.slice(0, 5)));
    }
  });

});
