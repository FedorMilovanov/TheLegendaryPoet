import { test, expect } from '@playwright/test';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';

async function openEssay(page, slug, hash = '') {
  const response = await page.goto(BASE_URL + '/essays/' + slug + hash, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  if (response) expect(response.status()).toBeLessThan(400);
  await expect(page.locator('.essay-body > div').first()).toBeAttached();
}

async function expectVisibleFragment(page, hash) {
  const top = await page.evaluate((id) => document.getElementById(id)?.getBoundingClientRect().top ?? -9999, decodeURIComponent(hash.slice(1)));
  expect(decodeURIComponent(new URL(page.url()).hash)).toBe(hash);
  expect(top).toBeGreaterThan(80);
  expect(top).toBeLessThan(170);
}

test.describe('native fragment navigation and stable geometry', () => {
  test('section anchors settle after real image layout and keep native history', async ({ page }) => {
    await openEssay(page, 'sergei-yesenin-1921-1925');
    const target = page.locator('aside nav a[href^="#sec-"]').nth(2);
    const hash = await target.getAttribute('href');
    expect(hash).toMatch(/^#sec-/);
    if ((page.viewportSize()?.width ?? 1280) < 768) {
      await page.evaluate(() => window.scrollTo(0, 2400));
      await expect(page.locator('html')).toHaveClass(/chrome-hidden/);
      await page.locator('.section-chip button[popovertarget]').click();
      await expect(page.locator('#essay-toc-popover')).toBeVisible();
      await page.locator('#essay-toc-popover button').nth(2).click();
    } else {
      await target.focus();
      await page.keyboard.press('Enter');
    }
    // Assert settled painted geometry after the normal 780 ms reveal, not a transient jump.
    await page.waitForTimeout(1050);
    await expectVisibleFragment(page, hash);
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/#sec-/);
    await page.goForward({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/#sec-/);
  });

  test('same citation reopens its filtered source without a synthetic hash change', async ({ page }) => {
    await openEssay(page, 'brik-case');
    const citation = page.locator('.essay-body a[href^="#source-"]').first();
    await expect(citation).toBeVisible();
    const hash = await citation.getAttribute('href');
    const source = page.locator('[id="' + hash.slice(1) + '"]');
    await citation.click();
    await expect(source).toBeVisible();
    const historyBefore = await page.evaluate(() => history.length);
    await page.locator('#sources button').filter({ hasText: 'Архивы' }).first().click();
    await expect(source).toBeHidden();
    await citation.focus();
    await page.keyboard.press('Enter');
    await expect(source).toBeVisible();
    expect(decodeURIComponent(new URL(page.url()).hash)).toBe(hash);
    expect(await page.evaluate(() => history.length)).toBe(historyBefore);
  });

  test('fresh source and section deep links expose their published targets', async ({ page }) => {
    await openEssay(page, 'brik-case');
    const section = await page.locator('aside nav a[href^="#sec-"]').first().getAttribute('href');
    const citation = await page.locator('.essay-body a[href^="#source-"]').first().getAttribute('href');
    await openEssay(page, 'brik-case', section);
    await page.waitForTimeout(1000);
    await expectVisibleFragment(page, section);
    await openEssay(page, 'brik-case', citation);
    await expect(page.locator('[id="' + citation.slice(1) + '"]')).toBeVisible();
    expect(decodeURIComponent(new URL(page.url()).hash)).toBe(citation);
  });
});
